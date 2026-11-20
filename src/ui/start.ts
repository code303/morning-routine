import { approxMinutes, baseBounds, clampBase, totalSeconds } from '../core/bounds';
import { hasVariants } from '../core/plan';
import type { DayVariant, Mode, ModeId } from '../core/types';
import { BLOOD_PRESSURE_NOTE } from '../data/modes';
import { el, setText } from './dom';

export interface StartOptions {
  readonly modes: readonly Mode[];
  readonly initialMode: ModeId;
  readonly initialBase: (mode: Mode) => number | null;
  readonly today: DayVariant;
  readonly onStart: (mode: Mode, base: number | null) => void;
}

export function renderStart(root: HTMLElement, options: StartOptions): void {
  let mode = options.modes.find((m) => m.id === options.initialMode) ?? options.modes[0];
  if (!mode) throw new Error('Keine Modi definiert');
  let base = options.initialBase(mode);

  const tiles = el('div', { class: 'mode-tiles', role: 'radiogroup', 'aria-label': 'Modus' });
  const slider = el('input', { type: 'range', class: 'slider', step: 5, 'aria-label': 'Grunddauer' });
  const sliderValue = el('span', { class: 'slider-value' });
  const sliderLabel = el('span', { class: 'slider-label' });
  const sliderBlock = el(
    'label',
    { class: 'slider-block' },
    el('span', { class: 'slider-head' }, sliderLabel, sliderValue),
    slider,
  );
  const total = el('p', { class: 'total' });
  const description = el('p', { class: 'mode-description' });
  const day = el('p', { class: 'day-badge' });
  const note = el('p', { class: 'mode-note' }, BLOOD_PRESSURE_NOTE);
  const startButton = el('button', { type: 'button', class: 'btn btn-primary btn-start' }, 'Start');

  const refresh = () => {
    if (!mode) return;
    for (const tile of tiles.children) {
      const selected = (tile as HTMLElement).dataset.mode === mode.id;
      tile.setAttribute('aria-checked', String(selected));
    }
    setText(description, mode.description);
    day.hidden = !hasVariants(mode);
    setText(day, `Heute: Tag ${options.today}`);
    note.hidden = mode.id !== 'bloodPressure';

    const bounds = baseBounds(mode.steps);
    sliderBlock.hidden = bounds === null;
    if (bounds && base !== null) {
      slider.min = String(bounds.min);
      slider.max = String(bounds.max);
      slider.value = String(base);
      setText(sliderLabel, mode.id === 'original' ? 'Sekunden pro Übung' : 'Grunddauer');
      setText(sliderValue, `${base} s`);
    }
    const minutes = approxMinutes(totalSeconds(mode, base));
    setText(total, bounds ? `≈ ${minutes} min gesamt` : `${minutes} min, fest nach Studienprotokoll`);
  };

  for (const m of options.modes) {
    tiles.append(
      el(
        'button',
        {
          type: 'button',
          class: 'mode-tile',
          role: 'radio',
          'data-mode': m.id,
          onclick: () => {
            mode = m;
            base = options.initialBase(m);
            refresh();
          },
        },
        m.name,
      ),
    );
  }

  slider.addEventListener('input', () => {
    if (!mode) return;
    base = clampBase(mode, Number(slider.value));
    refresh();
  });

  startButton.addEventListener('click', () => {
    if (mode) options.onStart(mode, base);
  });

  root.replaceChildren(
    el(
      'section',
      { class: 'screen screen-start' },
      el('h1', { class: 'title' }, 'Morgenroutine'),
      tiles,
      description,
      day,
      note,
      sliderBlock,
      total,
      startButton,
    ),
  );
  refresh();
}
