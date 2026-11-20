import { createSession, type Clock, type SessionEvent } from '../core/session';
import type { Plan } from '../core/types';
import { getExercise } from '../data/exercises';
import { getAnimation } from '../figures/poses';
import { createFigure, type FigureHandle } from '../figures/render';
import type { Beeper } from '../audio/beeper';
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

export function runSession(root: HTMLElement, options: SessionOptions): void {
  const { plan, clock, beeper, wakeLock } = options;
  const session = createSession(plan, clock);

  const progress = el('span', { class: 'progress-count' });
  const remaining = el('span', { class: 'progress-remaining' });
  const bar = el('div', { class: 'progress-bar' });
  const upcoming = el('p', { class: 'upcoming' });
  const name = el('h2', { class: 'exercise-name' });
  const hint = el('p', { class: 'exercise-hint' });
  const countdown = el('div', { class: 'countdown', 'aria-live': 'off' });
  const figureBox = el('div', { class: 'figure-box' });
  const pauseButton = el('button', { type: 'button', class: 'btn btn-primary' }, 'Pause');
  const stopButton = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Beenden');
  const pausedBanner = el('p', { class: 'paused-banner', hidden: true }, 'Pausiert');

  root.replaceChildren(
    el(
      'section',
      { class: 'screen screen-session' },
      el('header', { class: 'session-top' }, progress, remaining),
      el('div', { class: 'progress-track' }, bar),
      figureBox,
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
    if (step) {
      const exercise = getExercise(step.exerciseId);
      const inTransition = phase.kind === 'transition';
      showFigure(phase.index, phase.kind === 'step' ? phase.start : phase.end);
      setText(upcoming, inTransition ? 'Gleich:' : '');
      setText(name, exercise.name);
      setText(hint, exercise.hint);
      setText(progress, `${phase.index + 1} / ${plan.steps.length}`);
      root.classList.toggle('is-transition', inTransition);
      root.classList.toggle('is-final-seconds', !inTransition && state.phaseRemaining <= 3);
    }
    setText(countdown, String(Math.ceil(state.phaseRemaining)));
    setText(remaining, `noch ${formatClock(state.totalRemaining)}`);
    bar.style.width = `${(state.elapsed / session.total) * 100}%`;
    figure?.update(Math.max(0, state.elapsed - figureStart));

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
