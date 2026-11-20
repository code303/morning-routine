import type { Beeper } from '../audio/beeper';
import { createSession, type Clock, type SessionEvent } from '../core/session';
import type { Plan, PlannedStep } from '../core/types';
import { getExercise } from '../data/exercises';
import { getAnimation } from '../figures/poses';
import { createFigure, type FigureHandle } from '../figures/render';
import type { WakeLock } from '../platform/wakeLock';
import { el, formatClock, setText } from './dom';

export interface SessionOptions {
  readonly plan: Plan;
  readonly clock: Clock;
  readonly beeper: Beeper;
  readonly wakeLock: WakeLock;
  readonly onFinish: (elapsedSeconds: number) => void;
  readonly onCancel: () => void;
}

/** Vorschau auf die nächste Übung, wenn ein Modus keine Wechselpause hat (Blutdruck). */
const PREVIEW_SECONDS = 5;

function hasSides(step: PlannedStep | undefined): boolean {
  return step?.segments?.kind === 'sides' || step?.segments?.kind === 'hold';
}

/** Atemkreis: Größe 0..1 und Phase innerhalb eines Zyklus. */
export function breathState(step: PlannedStep, stepElapsed: number): { size: number; inhale: boolean } | null {
  const seg = step.segments;
  if (seg?.kind !== 'breath') return null;
  const cycle = seg.inSeconds + seg.outSeconds;
  const t = ((stepElapsed % cycle) + cycle) % cycle;
  if (t < seg.inSeconds) return { size: t / seg.inSeconds, inhale: true };
  return { size: 1 - (t - seg.inSeconds) / seg.outSeconds, inhale: false };
}

export function runSession(root: HTMLElement, options: SessionOptions): void {
  const { plan, clock, beeper, wakeLock } = options;
  const session = createSession(plan, clock);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progress = el('span', { class: 'progress-count' });
  const remaining = el('span', { class: 'progress-remaining' });
  const bar = el('div', { class: 'progress-bar' });
  const upcoming = el('p', { class: 'upcoming' });
  const name = el('h2', { class: 'exercise-name' });
  const hint = el('p', { class: 'exercise-hint' });
  const countdown = el('div', { class: 'countdown', 'aria-live': 'off' });
  const figureBox = el('div', { class: 'figure-box' });
  const breathCircle = el('div', { class: 'breath-circle' });
  const breathLabel = el('span', { class: 'breath-label' });
  const breath = el('div', { class: 'breath', hidden: true }, breathCircle, breathLabel);
  const stage = el('div', { class: 'stage' }, figureBox, breath);
  const pauseButton = el('button', { type: 'button', class: 'btn btn-primary' }, 'Pause');
  const stopButton = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Beenden');
  const pausedBanner = el('p', { class: 'paused-banner', hidden: true }, 'Pausiert');

  root.replaceChildren(
    el(
      'section',
      { class: 'screen screen-session' },
      el('header', { class: 'session-top' }, progress, remaining),
      el('div', { class: 'progress-track' }, bar),
      stage,
      el('div', { class: 'session-info' }, upcoming, name, hint, countdown, pausedBanner),
      el('footer', { class: 'session-actions' }, pauseButton, stopButton),
    ),
  );

  let figure: FigureHandle | null = null;
  let figureFor = -1;
  let figureStart = 0;
  let frame = 0;
  let paused = false;

  const showFigure = (index: number, startAt: number) => {
    if (figureFor === index) return;
    const step = plan.steps[index];
    if (!step) return;
    figure = createFigure(getAnimation(step.exerciseId), { label: getExercise(step.exerciseId).name });
    figureBox.replaceChildren(figure.element);
    figureBox.classList.toggle('has-sides', hasSides(step));
    figureFor = index;
    figureStart = startAt;
  };

  const handleEvent = (event: SessionEvent) => {
    switch (event.type) {
      case 'stepStart':
        beeper.stepStart();
        break;
      case 'countdown':
        beeper.countdown();
        break;
      case 'segmentSwitch':
        beeper.segmentSwitch();
        break;
      case 'transitionStart':
        break;
      case 'done':
        beeper.done();
        break;
    }
  };

  const cleanup = () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', onVisibility);
    void wakeLock.release();
  };

  const setPaused = (value: boolean) => {
    paused = value;
    if (value) {
      session.pause();
      void wakeLock.release();
    } else {
      session.resume();
      void wakeLock.acquire();
    }
    setText(pauseButton, value ? 'Weiter' : 'Pause');
    pausedBanner.hidden = !value;
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden' && !paused) setPaused(true);
  };

  const render = () => {
    const { state, events } = session.tick();
    events.forEach(handleEvent);

    const { phase } = state;
    const step = plan.steps[phase.index];
    const stepElapsed = Math.max(0, state.elapsed - figureStart);
    if (step) {
      const exercise = getExercise(step.exerciseId);
      const inTransition = phase.kind === 'transition';
      showFigure(phase.index, phase.kind === 'step' ? phase.start : phase.end);

      // Ohne Wechselpause: in den letzten Sekunden die nächste Übung ankündigen.
      const next = plan.steps[phase.index + 1];
      const preview =
        !inTransition && plan.transitionSeconds === 0 && next && state.phaseRemaining <= PREVIEW_SECONDS
          ? `Gleich: ${getExercise(next.exerciseId).name}`
          : '';
      setText(upcoming, inTransition ? 'Gleich:' : preview);
      setText(name, exercise.name);
      setText(hint, exercise.hint);
      setText(progress, `${phase.index + 1} / ${plan.steps.length}`);
      root.classList.toggle('is-transition', inTransition);
      root.classList.toggle('is-final-seconds', !inTransition && state.phaseRemaining <= 3);

      figure?.setMirrored(!inTransition && hasSides(step) && state.segment % 2 === 1);

      const b = inTransition ? null : breathState(step, stepElapsed);
      breath.hidden = b === null;
      if (b) {
        breathCircle.style.transform = `scale(${0.45 + 0.55 * b.size})`;
        setText(breathLabel, b.inhale ? 'Einatmen' : 'Ausatmen');
      }
    }
    setText(countdown, String(Math.ceil(state.phaseRemaining)));
    setText(remaining, `noch ${formatClock(state.totalRemaining)}`);
    bar.style.width = `${(state.elapsed / session.total) * 100}%`;
    // Reduzierte Bewegung: langsamer, aber nicht aus – außer beim Atmen, das im Takt bleiben muss.
    const motion = reducedMotion && step?.segments?.kind !== 'breath' ? 0.5 : 1;
    figure?.update(stepElapsed * motion);

    if (state.status === 'done') {
      cleanup();
      options.onFinish(state.elapsed);
      return;
    }
    frame = requestAnimationFrame(render);
  };

  pauseButton.addEventListener('click', () => setPaused(!paused));
  stopButton.addEventListener('click', () => {
    session.stop();
    cleanup();
    options.onCancel();
  });
  document.addEventListener('visibilitychange', onVisibility);

  void wakeLock.acquire();
  session.start();
  render();
}
