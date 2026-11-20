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

/** Statische SVG-Icons (Unicode-Symbole würden auf Android als Emoji erscheinen). */
const ICONS = {
  previous: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2.5v14H6zM19 5v14L9.5 12z"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 5H18v14h-2.5zM5 5v14l9.5-7z"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg>',
} as const;

function iconButton(icon: keyof typeof ICONS, label: string, className: string): HTMLButtonElement {
  const button = el('button', { type: 'button', class: className, 'aria-label': label, title: label });
  button.innerHTML = ICONS[icon];
  return button;
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
  const stopButton = iconButton('close', 'Routine beenden', 'icon-btn');
  const prevButton = iconButton('previous', 'Vorherige Übung', 'btn btn-secondary btn-nav');
  const nextButton = iconButton('next', 'Nächste Übung', 'btn btn-secondary btn-nav');
  const nextLabel = el('p', { class: 'next-label' });

  // Rückfrage vor dem Beenden – In-Page-Dialog statt window.confirm
  const cancelStop = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Weitermachen');
  const confirmStop = el('button', { type: 'button', class: 'btn btn-destructive' }, 'Beenden');
  const confirmDialog = el(
    'div',
    { class: 'confirm-backdrop', hidden: true },
    el(
      'div',
      { class: 'confirm', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'confirm-title' },
      el('h2', { id: 'confirm-title', class: 'confirm-title' }, 'Routine beenden?'),
      el('p', { class: 'confirm-text' }, 'Der Fortschritt dieser Runde geht verloren.'),
      el('div', { class: 'confirm-actions' }, cancelStop, confirmStop),
    ),
  );
  const pausedBanner = el('p', { class: 'paused-banner', hidden: true }, 'Pausiert');

  root.replaceChildren(
    el(
      'section',
      { class: 'screen screen-session' },
      el('header', { class: 'session-top' }, progress, remaining, stopButton),
      el('div', { class: 'progress-track' }, bar),
      stage,
      el('div', { class: 'session-info' }, upcoming, name, hint, countdown, pausedBanner),
      el('footer', { class: 'session-controls' }, el('div', { class: 'session-actions' }, prevButton, pauseButton, nextButton), nextLabel),
    ),
    confirmDialog,
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
      case 'stepEnd':
        beeper.stepEnd();
        break;
      case 'stepStart':
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
    setText(pauseButton, value ? 'Fortsetzen' : 'Pause');
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
      // › führt in einer Wechselpause zur angekündigten, sonst zur folgenden Übung
      const nextTarget = plan.steps[inTransition ? phase.index : phase.index + 1];
      nextButton.disabled = !nextTarget;
      setText(nextLabel, nextTarget ? `Nächste: ${getExercise(nextTarget.exerciseId).name}` : 'Letzte Übung');
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
  prevButton.addEventListener('click', () => session.previous());
  nextButton.addEventListener('click', () => session.next());
  let resumeAfterDialog = false;
  const closeDialog = () => {
    confirmDialog.hidden = true;
    if (resumeAfterDialog) setPaused(false);
  };
  stopButton.addEventListener('click', () => {
    // Während der Rückfrage läuft die Zeit nicht weiter.
    resumeAfterDialog = !paused;
    if (!paused) setPaused(true);
    confirmDialog.hidden = false;
    cancelStop.focus();
  });
  cancelStop.addEventListener('click', closeDialog);
  confirmDialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDialog();
  });
  confirmStop.addEventListener('click', () => {
    session.stop();
    cleanup();
    options.onCancel();
  });
  document.addEventListener('visibilitychange', onVisibility);

  void wakeLock.acquire();
  session.start();
  render();
}
