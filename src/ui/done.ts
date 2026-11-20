import { el, formatClock } from './dom';

export function renderDone(root: HTMLElement, elapsedSeconds: number, onBack: () => void): void {
  root.replaceChildren(
    el(
      'section',
      { class: 'screen screen-done' },
      el('h1', { class: 'title' }, 'Geschafft'),
      el('p', { class: 'done-duration' }, `${formatClock(elapsedSeconds)} min`),
      el('button', { type: 'button', class: 'btn btn-primary btn-start', onclick: onBack }, 'Zurück zum Start'),
    ),
  );
}
