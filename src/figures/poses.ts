import type { ExerciseId } from '../core/types';
import type { ExerciseAnimation } from './animation';
import { pose } from './skeleton';

/*
 * Posen nach der Konvention in skeleton.ts:
 * 0° = nach unten, positiv = Richtung +x; Seitenansicht blickt nach +x,
 * R = nahe Seite (bei Seitenwechseln die arbeitende Seite), L = ferne Seite.
 * Liegende Posen drehen die ganze Figur über `rotation` (+90 = Rückenlage, Kopf links).
 */

/** Neutrale Standfigur mit leichtem „Atmen“ – für Übungen ohne eigene Posen. */
export const PLACEHOLDER: ExerciseAnimation = {
  poses: {
    A: pose('front', { shoulderL: -8, shoulderR: 8, hipL: -4, hipR: 4 }),
    B: pose('front', { shoulderL: -12, shoulderR: 12, hipL: -4, hipR: 4 }),
  },
  sequence: ['A', 'B'],
  loopSeconds: 6,
};

const ANIMATIONS: Readonly<Record<ExerciseId, ExerciseAnimation>> = {
  // ---------- Originalübungen ----------

  // Seitenansicht: in die Knie federn, dann auf die Fußballen hochfedern.
  'lymphatic-hops': {
    poses: {
      A: pose('side', { lean: 4, hipL: 14, kneeL: -26, hipR: 14, kneeR: -26, shoulderL: 4, elbowL: 12, shoulderR: 4, elbowR: 12 }),
      B: pose('side', { lean: 1, hipL: 3, kneeL: -5, hipR: 3, kneeR: -5, ankleL: -40, ankleR: -40, shoulderL: 8, elbowL: 6, shoulderR: 8, elbowR: 6, lift: 4 }),
    },
    sequence: ['A', 'B'],
    loopSeconds: 0.55,
  },

  // Seitenansicht: Arme über Kopf → in die Knie gehen, Oberkörper bleibt aufrecht → tiefe Hocke, Arme hinten.
  'body-wave': {
    poses: {
      A: pose('side', { lean: -4, neck: -4, shoulderL: 170, shoulderR: 170 }),
      B: pose('side', { lean: 4, shoulderL: 70, elbowL: 10, shoulderR: 70, elbowR: 10, hipL: 45, kneeL: -80, hipR: 45, kneeR: -80, ankleL: 10, ankleR: 10 }),
      C: pose('side', { lean: 8, shoulderL: -40, shoulderR: -40, hipL: 75, kneeL: -130, hipR: 75, kneeR: -130, ankleL: 25, ankleR: 25 }),
    },
    sequence: ['A', 'B', 'C', 'B'],
    loopSeconds: 4,
  },

  // Seitenansicht: Arme pendeln gegengleich, Knie federn leicht.
  'arm-swings': {
    poses: {
      A: pose('side', { shoulderR: 75, elbowR: 15, shoulderL: -45, elbowL: 10, hipL: 6, kneeL: -10, hipR: 6, kneeR: -10 }),
      B: pose('side', { shoulderR: -45, elbowR: 10, shoulderL: 75, elbowL: 15, hipL: 10, kneeL: -18, hipR: 10, kneeR: -18 }),
    },
    sequence: ['A', 'B'],
    loopSeconds: 2,
  },

  // Frontansicht: Rumpf dreht (schmale Schultern), schlaffe Arme schlagen um den Körper.
  'dead-arms': {
    poses: {
      A: pose('front', { shoulderSpread: 0.4, shoulderR: -30, elbowR: -45, shoulderL: -50, elbowL: -15, hipL: -6, hipR: 6 }),
      B: pose('front', { shoulderL: -10, shoulderR: 10, hipL: -6, hipR: 6 }),
      C: pose('front', { shoulderSpread: 0.4, shoulderL: 30, elbowL: 45, shoulderR: 50, elbowR: 15, hipL: -6, hipR: 6 }),
    },
    sequence: ['A', 'B', 'C', 'B'],
    loopSeconds: 2,
  },

  // Frontansicht: Hände auf den Schultern, Ellbogen außen; Becken frontal, nur der Oberkörper dreht.
  // Bei der Drehung rückt der vordere Ellbogen zur Mitte, der hintere bleibt außen.
  'trunk-twist': {
    poses: {
      A: pose('front', { shoulderSpread: 0.35, shoulderL: -75, elbowL: -150, shoulderR: -60, elbowR: 120, hipL: -10, kneeL: 8, hipR: 10, kneeR: -8 }),
      B: pose('front', { shoulderL: -72, elbowL: -150, shoulderR: 72, elbowR: 150, hipL: -10, kneeL: 8, hipR: 10, kneeR: -8 }),
      C: pose('front', { shoulderSpread: 0.35, shoulderR: 75, elbowR: 150, shoulderL: 60, elbowL: -120, hipL: -10, kneeL: 8, hipR: 10, kneeR: -8 }),
    },
    sequence: ['A', 'B', 'C', 'B'],
    loopSeconds: 3,
  },

  // Seitenansicht: Knie auf Hüfthöhe, beide Hände klatschen ans Knie,
  // dann beide Arme gestreckt waagerecht nach hinten federn, Beinwechsel.
  'marching-claps': {
    poses: {
      A: pose('side', { hipR: 90, kneeR: -90, shoulderL: 30, elbowL: 30, shoulderR: 30, elbowR: 30 }),
      B: pose('side', { shoulderL: -90, shoulderR: -90 }),
      C: pose('side', { hipL: 90, kneeL: -90, shoulderL: 30, elbowL: 30, shoulderR: 30, elbowR: 30 }),
    },
    sequence: ['A', 'B', 'C', 'B'],
    loopSeconds: 1.6,
  },

  // Frontansicht: Hände zusammen, Schwung von rechts oben über unten nach links oben.
  'golf-swings': {
    poses: {
      A: pose('front', { lean: 8, shoulderSpread: 0.45, shoulderL: 140, shoulderR: 140, hipL: -14, hipR: 6, kneeL: 6, ankleL: 20 }),
      B: pose('front', { shoulderL: 12, shoulderR: -12, hipL: -10, kneeL: 5, hipR: 10, kneeR: -5 }),
      C: pose('front', { lean: -8, shoulderSpread: 0.45, shoulderL: -140, shoulderR: -140, hipL: -6, hipR: 14, kneeR: -6, ankleR: -20 }),
    },
    sequence: ['A', 'B', 'C', 'B'],
    loopSeconds: 3,
  },

  // Frontansicht: breite Hocke mit Armen unten gekreuzt → aufrecht mit Armen im V.
  'ballet-squats': {
    poses: {
      A: pose('front', { hipL: -50, kneeL: 44, hipR: 50, kneeR: -44, shoulderL: 18, elbowL: 12, shoulderR: -18, elbowR: -12 }),
      B: pose('front', { hipL: -24, hipR: 24, shoulderL: -155, shoulderR: 155 }),
    },
    sequence: ['A', 'B'],
    loopSeconds: 4,
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

  // ---------- Ergänzungen im Stehen ----------

  // Seitenansicht: Hände in den Hüftfalten, Hüfte nach hinten, Rücken gerade bis ca. 45°.
  'hip-hinge': {
    poses: {
      A: pose('side', { shoulderL: -15, elbowL: 115, shoulderR: -15, elbowR: 115, hipL: 4, kneeL: -6, hipR: 4, kneeR: -6 }),
      B: pose('side', { lean: 50, shoulderL: -15, elbowL: 115, shoulderR: -15, elbowR: 115, hipL: 62, kneeL: -16, hipR: 62, kneeR: -16 }),
    },
    sequence: ['A', 'B'],
    loopSeconds: 4,
  },

  // Seitenansicht mit Wand: Fingerspitzen an der Wand, langsam auf die Fußballen (1 s hoch, 3 s runter).
  'calf-raises': {
    poses: {
      A: pose('side', { shoulderL: 75, shoulderR: 75 }),
      B: pose('side', { shoulderL: 75, shoulderR: 75, ankleL: -45, ankleR: -45 }),
    },
    sequence: ['A', 'B'],
    weights: [1, 3],
    loopSeconds: 4,
    props: [{ kind: 'wall', x: 52 }],
  },

  // Seitenansicht mit Wand: Wand-Liegestütz, Körper bleibt eine Linie.
  'push-up-ladder': {
    poses: {
      A: pose('side', { rotation: -24, shoulderL: 114, shoulderR: 114, ankleL: -24, ankleR: -24 }),
      B: pose('side', { rotation: -38, shoulderL: 70, elbowL: 95, shoulderR: 70, elbowR: 95, ankleL: -38, ankleR: -38 }),
    },
    sequence: ['A', 'B'],
    loopSeconds: 3,
    props: [{ kind: 'wall', x: 72 }],
  },

  // Frontansicht: Arme als Torpfosten → in ein Y gleiten.
  'wall-angels': {
    poses: {
      A: pose('front', { shoulderL: -90, elbowL: -90, shoulderR: 90, elbowR: 90 }),
      B: pose('front', { shoulderL: -155, shoulderR: 155 }),
    },
    sequence: ['A', 'B'],
    loopSeconds: 5,
  },

  // Seitenansicht: Einbeinstand, nahes Knie auf Hüfthöhe, gleichseitiger Arm gehoben.
  'golden-rooster': {
    poses: {
      A: pose('side', { hipR: 90, kneeR: -90, ankleR: -20, shoulderR: 110, elbowR: 50, shoulderL: -15, elbowL: 110, hipL: 3, kneeL: -5 }),
      B: pose('side', { lean: 2, hipR: 92, kneeR: -92, ankleR: -20, shoulderR: 114, elbowR: 48, shoulderL: -15, elbowL: 110, hipL: 3, kneeL: -5 }),
    },
    sequence: ['A', 'B'],
    loopSeconds: 4,
  },

  // Frontansicht: Hände am Bauch (aus) → Arme seitlich geöffnet (ein), 4 s ein / 6 s aus.
  'slow-breathing': {
    poses: {
      A: pose('front', { shoulderL: -12, elbowL: 100, shoulderR: 12, elbowR: -100, hipL: -4, hipR: 4 }),
      B: pose('front', { shoulderL: -75, elbowL: 25, shoulderR: 75, elbowR: -25, hipL: -4, hipR: 4 }),
    },
    sequence: ['A', 'B'],
    weights: [4, 6],
    loopSeconds: 10,
  },

  // Seitenansicht: Sitz am Boden → tiefe Hocke → Stand (einmal in 15 s).
  'floor-rise': {
    poses: {
      A: pose('side', { lean: -5, hipL: 75, kneeL: -110, hipR: 75, kneeR: -110, shoulderL: 30, shoulderR: 30 }),
      B: pose('side', { lean: 35, hipL: 120, kneeL: -150, hipR: 120, kneeR: -150, shoulderL: 80, shoulderR: 80 }),
      C: pose('side', { shoulderL: 5, shoulderR: 5 }),
    },
    sequence: ['A', 'B', 'C', 'C'],
    weights: [6, 6, 2.5, 0.5],
    loopSeconds: 15,
  },

  // ---------- Bodenblock ----------

  // Vierfüßler (Kopf rechts) → Gegenarm vor, Gegenbein zurück, 10 s halten.
  'bird-dog': {
    poses: {
      A: pose('side', { rotation: -90, shoulderL: 90, shoulderR: 90, hipL: 90, kneeL: -90, hipR: 90, kneeR: -90, ankleL: -90, ankleR: -90, neck: 10 }),
      B: pose('side', { rotation: -90, shoulderL: 90, shoulderR: 178, hipL: 2, kneeL: 0, hipR: 90, kneeR: -90, ankleL: -90, ankleR: -90, neck: 10 }),
    },
    sequence: ['A', 'B', 'B'],
    weights: [1.5, 7, 1.5],
    loopSeconds: 10,
  },

  // Frontansicht: auf dem Unterarm, Hüfte gehoben (gerade Linie) ↔ abgesenkt.
  'side-plank': {
    poses: {
      // Nach Drehung um −72° liegt die R-Seite unten: R-Oberarm senkrecht, Unterarm flach am Boden.
      A: pose('front', { rotation: -72, shoulderR: 72, elbowR: 90, shoulderL: -5, hipL: -2, hipR: 2 }),
      B: pose('front', { rotation: -80, shoulderR: 80, elbowR: 90, shoulderL: -5, hipL: 10, hipR: 14 }),
    },
    sequence: ['A', 'B'],
    weights: [3, 1],
    loopSeconds: 4,
  },

  // Rückenlage, Knie gebeugt → Becken heben bis zur Linie Knie–Schulter.
  'glute-bridge': {
    poses: {
      // A: Rumpf flach (Drehung 90°). B: Drehung 115° hebt das Becken, Kopf und Arme bleiben flach.
      A: pose('side', { rotation: 90, hipL: 45, kneeL: -125, hipR: 45, kneeR: -125, ankleL: -10, ankleR: -10 }),
      B: pose('side', { rotation: 115, neck: -25, shoulderL: -25, shoulderR: -25, kneeL: -125, kneeR: -125, ankleL: 10, ankleR: 10 }),
    },
    sequence: ['A', 'B', 'B'],
    weights: [1.5, 1, 1.5],
    loopSeconds: 4,
  },

  // Rückenlage, Tischplatte → Gegenarm und -bein strecken, abwechselnd.
  'dead-bug': {
    poses: {
      A: pose('side', { rotation: 90, shoulderL: 90, shoulderR: 90, hipL: 90, kneeL: -90, hipR: 90, kneeR: -90 }),
      // Gestreckter Arm/Bein knapp ÜBER dem Boden – zeigten sie darunter, würde die Figur
      // auf Hand/Fuß gestellt und der Rumpf höbe ab. Arm 90 → 170 schwingt über Kopf
      // (nicht −190, das liefe beim Interpolieren durch den Boden).
      B: pose('side', { rotation: 90, shoulderL: 90, shoulderR: 170, hipL: 12, kneeL: 0, hipR: 90, kneeR: -90 }),
      C: pose('side', { rotation: 90, shoulderL: 170, shoulderR: 90, hipL: 90, kneeL: -90, hipR: 12, kneeR: 0 }),
    },
    sequence: ['A', 'B', 'A', 'C'],
    loopSeconds: 8,
  },

  // Halbkniestand: vorderes Bein 90/90, hinteres Knie am Boden, Arm über Kopf; Hüfte schiebt vor.
  'hip-flexor-stretch': {
    poses: {
      A: pose('side', { hipR: 90, kneeR: -90, hipL: -20, kneeL: -70, ankleL: -90, shoulderR: 172, shoulderL: 5 }),
      B: pose('side', { lean: -5, hipR: 100, kneeR: -100, hipL: -35, kneeL: -55, ankleL: -90, shoulderR: 175, shoulderL: 5 }),
    },
    sequence: ['A', 'B'],
    loopSeconds: 5,
  },
};

export function getAnimation(id: ExerciseId): ExerciseAnimation {
  return ANIMATIONS[id] ?? PLACEHOLDER;
}

export function hasAnimation(id: ExerciseId): boolean {
  return id in ANIMATIONS;
}

export const ANIMATED_EXERCISES: readonly ExerciseId[] = Object.keys(ANIMATIONS);
