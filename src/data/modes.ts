import { TRANSITION_SECONDS } from '../core/constants';
import type { FixedStep, Mode, ModeId, ScaledStep, Segments } from '../core/types';
import type { KnownExerciseId } from './exercises';

type Ex = KnownExerciseId;

/** Skalierter Schritt mit den Standardwerten der Spec (Gewicht 1, max 90 s). */
function scaled(exercise: Ex, weight = 1, maxSeconds = 90, segments?: Segments): ScaledStep {
  return segments ? { kind: 'scaled', exercise, weight, maxSeconds, segments } : { kind: 'scaled', exercise, weight, maxSeconds };
}

function fixed(exercise: Ex, seconds: number, segments?: Segments): FixedStep {
  return segments ? { kind: 'fixed', exercise, seconds, segments } : { kind: 'fixed', exercise, seconds };
}

const BREATH: Segments = { kind: 'breath', inSeconds: 4, outSeconds: 6 };

const WARM_UP: readonly ScaledStep[] = [
  scaled('lymphatic-hops'),
  scaled('body-wave'),
  scaled('arm-swings'),
  scaled('dead-arms'),
  scaled('trunk-twist'),
  scaled('marching-claps'),
  scaled('golf-swings'),
];

const STANDING_STRENGTH: readonly ScaledStep[] = [
  scaled('hip-hinge'),
  scaled('ballet-squats'),
  scaled('horse-stance', 2, 120),
  scaled('calf-raises'),
  scaled('push-up-ladder'),
  scaled('wall-angels'),
];

export const EXTENDED: Mode = {
  id: 'extended',
  name: 'Erweitert',
  description: 'Aufwärmen, Kraft, Balance, Bodenblock (Tag A/B) und Atmung.',
  defaultBase: 45,
  transitionSeconds: TRANSITION_SECONDS,
  steps: [
    ...WARM_UP,
    ...STANDING_STRENGTH,
    scaled('golden-rooster', 16 / 9, 120, { kind: 'sides', count: 4 }),
    {
      kind: 'scaled',
      exercise: { A: 'bird-dog', B: 'side-plank' },
      weight: 10 / 9,
      maxSeconds: 100,
      variantSegments: { A: { kind: 'hold', seconds: 10 }, B: { kind: 'sides', count: 2 } },
    },
    { kind: 'scaled', exercise: { A: 'glute-bridge', B: 'dead-bug' }, weight: 10 / 9, maxSeconds: 90 },
    scaled('hip-flexor-stretch', 4 / 3, 90, { kind: 'sides', count: 2 }),
    fixed('floor-rise', 15),
    scaled('slow-breathing', 8 / 3, 300, BREATH),
  ],
};

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

export const SHORT: Mode = {
  id: 'short',
  name: 'Kurz',
  description: 'Aufwärmen, Kraft im Stehen, Balance und Atmung – ohne Bodenblock.',
  defaultBase: 30,
  transitionSeconds: TRANSITION_SECONDS,
  steps: [
    ...WARM_UP,
    ...STANDING_STRENGTH,
    scaled('golden-rooster', 2, 120, { kind: 'sides', count: 4 }),
    scaled('slow-breathing', 2, 300, BREATH),
  ],
};

const HOLD = fixed('horse-stance', 120);
const REST: readonly FixedStep[] = [
  fixed('arm-swings', 30),
  fixed('dead-arms', 30),
  fixed('slow-breathing', 60, BREATH),
];

export const BLOOD_PRESSURE: Mode = {
  id: 'bloodPressure',
  name: 'Blutdruck',
  description: 'Studienprotokoll: 4 × 2 min Horse Stance mit je 2 min aktiver Pause.',
  defaultBase: null,
  // Die Vorschau auf die nächste Halteposition liegt in den letzten Sekunden der Pause.
  transitionSeconds: 0,
  steps: [HOLD, ...REST, HOLD, ...REST, HOLD, ...REST, HOLD],
};

export const BLOOD_PRESSURE_NOTE =
  'Studienprotokoll: 3× pro Woche. Halten soll in der 2. Minute schwer sein. Nicht pressen. ' +
  'Bei unkontrolliertem Bluthochdruck vorher ärztlich abklären.';

export const MODES: ReadonlyMap<ModeId, Mode> = new Map(
  [EXTENDED, ORIGINAL, SHORT, BLOOD_PRESSURE].map((m) => [m.id, m]),
);
