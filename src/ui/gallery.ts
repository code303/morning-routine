import { EXERCISES } from '../data/exercises';
import type { ExerciseAnimation, KeyName } from '../figures/animation';
import { getAnimation, hasAnimation } from '../figures/poses';
import { createFigure, type FigureHandle } from '../figures/render';
import { el } from './dom';

/**
 * Übersicht aller Figuren zur Sichtprüfung der Posen.
 * `?gallery` zeigt die Animationen, `?gallery=keys` jede Schlüsselpose einzeln.
 */
export function renderGallery(root: HTMLElement, mode: string | null): void {
  const figures: FigureHandle[] = [];
  const grid = el('div', { class: 'gallery' });

  const add = (anim: ExerciseAnimation, caption: string) => {
    const figure = createFigure(anim, { label: caption });
    figures.push(figure);
    grid.append(
      el('figure', { class: 'gallery-item' }, el('div', { class: 'gallery-figure' }, figure.element), el('figcaption', {}, caption)),
    );
  };

  for (const exercise of EXERCISES.values()) {
    const anim = getAnimation(exercise.id);
    const suffix = hasAnimation(exercise.id) ? '' : ' (Platzhalter)';
    if (mode === 'keys') {
      for (const key of Object.keys(anim.poses) as KeyName[]) {
        // statisch: nur diese Pose, Ausschnitt wie in der echten Animation
        add({ ...anim, sequence: [key] }, `${exercise.name} ${key}${suffix}`);
      }
    } else {
      add(anim, exercise.name + suffix);
    }
  }
  root.replaceChildren(el('section', { class: 'screen' }, el('h1', { class: 'title' }, 'Figuren'), grid));

  const start = performance.now();
  const loop = () => {
    const t = (performance.now() - start) / 1000;
    figures.forEach((f) => f.update(t));
    requestAnimationFrame(loop);
  };
  loop();
}
