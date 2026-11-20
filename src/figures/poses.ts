import type { ExerciseId } from '../core/types';
import type { ExerciseAnimation } from './animation';
import { pose } from './skeleton';

/** Neutrale Standfigur mit leichtem „Atmen“ – für Übungen ohne eigene Posen. */
export const PLACEHOLDER: ExerciseAnimation = {
  poses: {
    A: pose('front', { shoulderL: -8, shoulderR: 8, hipL: -4, hipR: 4 }),
    B: pose('front', { shoulderL: -12, shoulderR: 12, hipL: -4, hipR: 4, neck: 0 }),
  },
  sequence: ['A', 'B'],
  loopSeconds: 6,
};

const ANIMATIONS: Readonly<Record<ExerciseId, ExerciseAnimation>> = {
  // Seitenansicht: Arme pendeln gegengleich, Knie federn leicht.
  'arm-swings': {
    poses: {
      A: pose('side', { shoulderR: 75, elbowR: 15, shoulderL: -45, elbowL: 10, hipL: 6, kneeL: -10, hipR: 6, kneeR: -10 }),
      B: pose('side', { shoulderR: -45, elbowR: 10, shoulderL: 75, elbowL: 15, hipL: 10, kneeL: -18, hipR: 10, kneeR: -18 }),
    },
    sequence: ['A', 'B'],
    loopSeconds: 2,
  },
  // Frontansicht: tiefer breiter Stand, Arme „Baum umarmen“, ruhiges Atmen.
  'horse-stance': {
    poses: {
      A: pose('front', {
        hipL: -58, kneeL: 52, hipR: 58, kneeR: -52,
        shoulderL: -62, elbowL: 150, shoulderR: 62, elbowR: -150,
        ankleL: -10, ankleR: 10,
      }),
      B: pose('front', {
        hipL: -58, kneeL: 52, hipR: 58, kneeR: -52,
        shoulderL: -68, elbowL: 150, shoulderR: 68, elbowR: -150,
        ankleL: -10, ankleR: 10, lift: 0.8,
      }),
    },
    sequence: ['A', 'B'],
    loopSeconds: 8,
  },
};

export function getAnimation(id: ExerciseId): ExerciseAnimation {
  return ANIMATIONS[id] ?? PLACEHOLDER;
}

export function hasAnimation(id: ExerciseId): boolean {
  return id in ANIMATIONS;
}

export const ANIMATED_EXERCISES: readonly ExerciseId[] = Object.keys(ANIMATIONS);
