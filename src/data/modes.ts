import { TRANSITION_SECONDS } from '../core/constants';
import type { Mode, ModeId, ScaledStep } from '../core/types';
import type { KnownExerciseId } from './exercises';

/** Skalierter Schritt mit den Standardwerten der Spec (Gewicht 1, max 90 s). */
function scaled(exercise: KnownExerciseId, weight = 1, maxSeconds = 90): ScaledStep {
  return { kind: 'scaled', exercise, weight, maxSeconds };
}

export const ORIGINAL: Mode = {
  id: 'original',
  name: 'Original',
  description: 'Die 9 Übungen der viralen Routine, alle gleich lang.',
  defaultBase: 60,
  transitionSeconds: TRANSITION_SECONDS,
  steps: [
    scaled('lymphatic-hops'),
    scaled('body-wave'),
    scaled('arm-swings'),
    scaled('dead-arms'),
    scaled('trunk-twist'),
    scaled('marching-claps'),
    scaled('golf-swings'),
    scaled('ballet-squats'),
    scaled('horse-stance', 1, 120),
  ],
};

export const MODES: ReadonlyMap<ModeId, Mode> = new Map([[ORIGINAL.id, ORIGINAL]]);
