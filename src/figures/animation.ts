import { NUMERIC_POSE_KEYS, type Pose } from './skeleton';

export type KeyName = 'A' | 'B' | 'C' | 'D';

/** Hilfsobjekte, in Figur-Einheiten (x relativ zur Hüfte). */
export type Prop = { readonly kind: 'wall'; readonly x: number };

export interface ExerciseAnimation {
  readonly poses: Readonly<Partial<Record<KeyName, Pose>>>;
  /** Abfolge der Schlüsselposen; die Schleife kehrt vom letzten zum ersten Eintrag zurück. */
  readonly sequence: readonly KeyName[];
  /** Dauer eines vollständigen Durchlaufs in Sekunden. */
  readonly loopSeconds: number;
  /**
   * Relative Dauer der Übergänge (sequence[i] → sequence[i+1], der letzte zurück zum ersten).
   * Standard: alle gleich lang.
   */
  readonly weights?: readonly number[];
  readonly props?: readonly Prop[];
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  if (a.view !== b.view) throw new Error('Posen mit unterschiedlicher Ansicht');
  if (t <= 0) return a;
  if (t >= 1) return b;
  const out: Record<string, number | string> = { view: a.view };
  for (const key of NUMERIC_POSE_KEYS) out[key] = a[key] + (b[key] - a[key]) * t;
  return out as unknown as Pose;
}

export function keyPose(anim: ExerciseAnimation, key: KeyName): Pose {
  const p = anim.poses[key];
  if (!p) throw new Error(`Schlüsselpose ${key} fehlt`);
  return p;
}

/** Pose zum Zeitpunkt `seconds` innerhalb der Schleife (weich interpoliert). */
export function poseAt(anim: ExerciseAnimation, seconds: number): Pose {
  const keys = anim.sequence;
  const first = keys[0];
  if (!first) throw new Error('Leere Abfolge');
  if (keys.length === 1 || anim.loopSeconds <= 0) return keyPose(anim, first);

  const weights = anim.weights ?? keys.map(() => 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const t = ((seconds % anim.loopSeconds) + anim.loopSeconds) % anim.loopSeconds;
  let cursor = 0;
  for (let i = 0; i < keys.length; i++) {
    const span = ((weights[i] ?? 1) / weightSum) * anim.loopSeconds;
    if (t < cursor + span || i === keys.length - 1) {
      const from = keys[i] ?? first;
      const to = keys[(i + 1) % keys.length] ?? first;
      const local = span > 0 ? Math.min(1, (t - cursor) / span) : 1;
      return lerpPose(keyPose(anim, from), keyPose(anim, to), easeInOutSine(local));
    }
    cursor += span;
  }
  return keyPose(anim, first);
}
