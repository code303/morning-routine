import { segmentBoundaries } from './plan';
import type { Plan } from './types';

/** Millisekunden-Zeitquelle, z. B. `() => performance.now()`; in Tests simuliert. */
export type Clock = () => number;

export type SessionEvent =
  | { readonly type: 'stepStart'; readonly index: number; readonly at: number }
  | { readonly type: 'countdown'; readonly index: number; readonly remaining: 1 | 2 | 3; readonly at: number }
  | { readonly type: 'segmentSwitch'; readonly index: number; readonly segment: number; readonly at: number }
  /** Ende einer Übung (nicht der letzten – dort folgt `done`). */
  | { readonly type: 'stepEnd'; readonly index: number; readonly at: number }
  | { readonly type: 'transitionStart'; readonly nextIndex: number; readonly at: number }
  | { readonly type: 'done'; readonly at: number };

export type SessionStatus = 'idle' | 'running' | 'paused' | 'done' | 'stopped';

export interface Phase {
  readonly kind: 'step' | 'transition';
  /** Bei `step` der aktuelle Schritt, bei `transition` der nächste. */
  readonly index: number;
  /** Start und Ende in Sekunden ab Beginn der Routine. */
  readonly start: number;
  readonly end: number;
}

export interface SessionState {
  readonly status: SessionStatus;
  readonly phase: Phase;
  /** Verstrichene Laufzeit in Sekunden (Pausen nicht mitgezählt). */
  readonly elapsed: number;
  readonly phaseRemaining: number;
  readonly totalRemaining: number;
  /** Aktuelles Segment im Schritt (0 = erstes); in Wechselpausen 0. */
  readonly segment: number;
}

export interface TickResult {
  readonly state: SessionState;
  readonly events: readonly SessionEvent[];
}

export interface Session {
  start(): TickResult;
  pause(): void;
  resume(): void;
  stop(): void;
  tick(): TickResult;
  /** Springt an den Anfang eines Schritts; Pausenzustand bleibt erhalten. */
  jumpTo(index: number): void;
  /** Nächster Schritt (in einer Wechselpause: der angekündigte). Kein Sprung hinter den letzten. */
  next(): void;
  /** Vorheriger Schritt (in einer Wechselpause: der gerade beendete); im ersten Schritt: von vorn. */
  previous(): void;
  readonly timeline: readonly Phase[];
  readonly total: number;
}

const COUNTDOWN = [3, 2, 1] as const;

/** Zeitleiste aller Phasen: Schritt, Wechselpause, Schritt, … */
export function buildTimeline(plan: Plan): Phase[] {
  const phases: Phase[] = [];
  let t = 0;
  plan.steps.forEach((step, index) => {
    phases.push({ kind: 'step', index, start: t, end: t + step.seconds });
    t += step.seconds;
    const isLast = index === plan.steps.length - 1;
    if (!isLast && plan.transitionSeconds > 0) {
      phases.push({ kind: 'transition', index: index + 1, start: t, end: t + plan.transitionSeconds });
      t += plan.transitionSeconds;
    }
  });
  return phases;
}

/** Alle Ereignisse, zeitlich sortiert. Gleiche Zeitpunkte behalten die Erzeugungsreihenfolge. */
export function buildEvents(timeline: readonly Phase[], plan?: Plan): SessionEvent[] {
  const events: SessionEvent[] = [];
  for (const phase of timeline) {
    if (phase.kind === 'transition') {
      events.push({ type: 'transitionStart', nextIndex: phase.index, at: phase.start });
      continue;
    }
    events.push({ type: 'stepStart', index: phase.index, at: phase.start });
    const step = plan?.steps[phase.index];
    if (step) {
      segmentBoundaries(step).forEach((offset, i) =>
        events.push({ type: 'segmentSwitch', index: phase.index, segment: i + 1, at: phase.start + offset }),
      );
    }
    for (const remaining of COUNTDOWN) {
      const at = phase.end - remaining;
      if (at > phase.start) events.push({ type: 'countdown', index: phase.index, remaining, at });
    }
    const isLastStep = phase === timeline[timeline.length - 1];
    if (!isLastStep) events.push({ type: 'stepEnd', index: phase.index, at: phase.end });
  }
  const last = timeline[timeline.length - 1];
  events.push({ type: 'done', at: last ? last.end : 0 });
  return events.sort((a, b) => a.at - b.at);
}

export function createSession(plan: Plan, clock: Clock): Session {
  const timeline = buildTimeline(plan);
  const events = buildEvents(timeline, plan);
  const boundaries = plan.steps.map(segmentBoundaries);

  const segmentAt = (phase: Phase, elapsed: number): number => {
    if (phase.kind !== 'step') return 0;
    const offset = elapsed - phase.start;
    return (boundaries[phase.index] ?? []).filter((b) => b <= offset).length;
  };
  const total = timeline[timeline.length - 1]?.end ?? 0;

  let status: SessionStatus = 'idle';
  let accumulatedMs = 0;
  let runningSince = 0;
  let nextEvent = 0;

  const elapsedSeconds = (): number => {
    const ms = status === 'running' ? accumulatedMs + (clock() - runningSince) : accumulatedMs;
    return Math.min(total, ms / 1000);
  };

  const phaseAt = (elapsed: number): Phase => {
    const fallback = timeline[timeline.length - 1] ?? { kind: 'step', index: 0, start: 0, end: 0 };
    return timeline.find((p) => elapsed < p.end) ?? fallback;
  };

  const tick = (): TickResult => {
    const elapsed = elapsedSeconds();
    const due: SessionEvent[] = [];
    while (nextEvent < events.length && (events[nextEvent]?.at ?? Infinity) <= elapsed) {
      const event = events[nextEvent++];
      if (event) due.push(event);
    }
    if (status === 'running' && elapsed >= total) {
      accumulatedMs = total * 1000;
      status = 'done';
    }
    const phase = phaseAt(elapsed);
    return {
      state: {
        status,
        phase,
        elapsed,
        phaseRemaining: Math.max(0, phase.end - elapsed),
        totalRemaining: Math.max(0, total - elapsed),
        segment: segmentAt(phase, elapsed),
      },
      events: due,
    };
  };

  return {
    timeline,
    total,
    start() {
      if (status !== 'idle') return tick();
      status = 'running';
      runningSince = clock();
      return tick();
    },
    pause() {
      if (status !== 'running') return;
      accumulatedMs += clock() - runningSince;
      status = 'paused';
    },
    resume() {
      if (status !== 'paused') return;
      runningSince = clock();
      status = 'running';
    },
    stop() {
      if (status === 'running') accumulatedMs += clock() - runningSince;
      status = 'stopped';
    },
    tick,
    jumpTo,
    next() {
      const phase = phaseAt(elapsedSeconds());
      const target = phase.kind === 'transition' ? phase.index : phase.index + 1;
      if (target < plan.steps.length) jumpTo(target);
    },
    previous() {
      const phase = phaseAt(elapsedSeconds());
      jumpTo(Math.max(0, phase.index - 1));
    },
  };

  function jumpTo(index: number): void {
    if (status !== 'running' && status !== 'paused') return;
    const target = timeline.find((p) => p.kind === 'step' && p.index === index);
    if (!target) return;
    accumulatedMs = target.start * 1000;
    if (status === 'running') runningSince = clock();
    // Ereignisse ab dem Start des Zielschritts neu ausspielen (stepStart, Countdown, …),
    // aber kein stepEnd des vorherigen Schritts, das auf denselben Zeitpunkt fällt.
    const first = events.findIndex((e) => e.type === 'stepStart' && e.index === index);
    nextEvent = first === -1 ? events.length : first;
  }
}
