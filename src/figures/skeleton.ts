/**
 * 2D-Strichfigur per Vorwärtskinematik.
 *
 * Winkelkonvention (Grad): 0 = zeigt nach unten, positive Werte drehen gegen den
 * Uhrzeigersinn, also Richtung +x (Bildschirm rechts); 90 = waagerecht nach rechts,
 * 180 = nach oben, −90 = nach links.
 *
 * Gliedmaßen sind relativ zu ihrem Elternteil angegeben:
 * Oberarm/Oberschenkel relativ zur Richtung „Rumpf abwärts“, Unterarm relativ zum
 * Oberarm, Unterschenkel relativ zum Oberschenkel, Fuß relativ zum Unterschenkel.
 *
 * Frontansicht: `L` ist die Seite bei −x, `R` die bei +x.
 * Seitenansicht: Blick nach +x, `R` ist das nahe, `L` das ferne Glied.
 */

export type View = 'front' | 'side';

export interface Pose {
  readonly view: View;
  /** Rumpfneigung aus der Senkrechten; positiv = Oberkörper kippt Richtung +x. */
  readonly lean: number;
  /** Kopf relativ zum Rumpf. */
  readonly neck: number;
  readonly shoulderL: number;
  readonly elbowL: number;
  readonly shoulderR: number;
  readonly elbowR: number;
  readonly hipL: number;
  readonly kneeL: number;
  readonly hipR: number;
  readonly kneeR: number;
  readonly ankleL: number;
  readonly ankleR: number;
  /** Frontansicht: Faktor für die Schulterbreite (Rumpfdrehung), Standard 1. */
  readonly shoulderSpread: number;
  /** Drehung der ganzen Figur um die Hüfte (für liegende Posen). */
  readonly rotation: number;
  /** Abstand der tiefsten Stelle über dem Boden (z. B. Sprungphase). */
  readonly lift: number;
}

export const NUMERIC_POSE_KEYS = [
  'lean',
  'neck',
  'shoulderL',
  'elbowL',
  'shoulderR',
  'elbowR',
  'hipL',
  'kneeL',
  'hipR',
  'kneeR',
  'ankleL',
  'ankleR',
  'shoulderSpread',
  'rotation',
  'lift',
] as const satisfies readonly (keyof Pose)[];

export const NEUTRAL: Omit<Pose, 'view'> = {
  lean: 0,
  neck: 0,
  shoulderL: 0,
  elbowL: 0,
  shoulderR: 0,
  elbowR: 0,
  hipL: 0,
  kneeL: 0,
  hipR: 0,
  kneeR: 0,
  ankleL: 0,
  ankleR: 0,
  shoulderSpread: 1,
  rotation: 0,
  lift: 0,
};

/** Pose aus Teilangaben; fehlende Werte sind neutral. */
export function pose(view: View, partial: Partial<Omit<Pose, 'view'>> = {}): Pose {
  return { ...NEUTRAL, ...partial, view };
}

export const LENGTHS = {
  torso: 52,
  neck: 6,
  headRadius: 10,
  upperArm: 27,
  forearm: 25,
  thigh: 34,
  shin: 32,
  footSide: 11,
  footFront: 7,
  shoulderHalfWidth: 14,
  hipHalfWidth: 8,
} as const;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Skeleton {
  readonly head: Point;
  readonly neck: Point;
  readonly hip: Point;
  readonly shoulderL: Point;
  readonly shoulderR: Point;
  readonly elbowL: Point;
  readonly elbowR: Point;
  readonly handL: Point;
  readonly handR: Point;
  readonly hipL: Point;
  readonly hipR: Point;
  readonly kneeL: Point;
  readonly kneeR: Point;
  readonly ankleL: Point;
  readonly ankleR: Point;
  readonly toeL: Point;
  readonly toeR: Point;
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Einheitsvektor für einen Winkel nach obiger Konvention (y zeigt nach oben). */
export function dir(deg: number): Point {
  return { x: Math.sin(rad(deg)), y: -Math.cos(rad(deg)) };
}

const add = (p: Point, v: Point, len = 1): Point => ({ x: p.x + v.x * len, y: p.y + v.y * len });

function rotateAround(p: Point, c: Point, deg: number): Point {
  const r = rad(deg);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r) };
}

/**
 * Gelenkpositionen in Figur-Einheiten, y nach oben.
 * Die Figur wird so verschoben, dass ihr tiefster Punkt auf `lift` über dem Boden (y = 0) liegt.
 */
export function solve(p: Pose): Skeleton {
  const L = LENGTHS;
  const front = p.view === 'front';
  const hip: Point = { x: 0, y: 0 };

  const torsoDir = dir(180 - p.lean);
  const down = -p.lean; // Richtung „Rumpf abwärts“
  const neck = add(hip, torsoDir, L.torso);
  const perp: Point = { x: torsoDir.y, y: -torsoDir.x }; // Richtung +x bei aufrechtem Rumpf
  const shoulderLine = add(hip, torsoDir, L.torso - 4);
  const sw = front ? L.shoulderHalfWidth * p.shoulderSpread : 0;
  const hw = front ? L.hipHalfWidth : 0;

  const head = add(neck, dir(180 - p.lean + p.neck), L.neck + L.headRadius);

  const shoulderL = add(shoulderLine, perp, -sw);
  const shoulderR = add(shoulderLine, perp, sw);
  const upperL = down + p.shoulderL;
  const upperR = down + p.shoulderR;
  const elbowL = add(shoulderL, dir(upperL), L.upperArm);
  const elbowR = add(shoulderR, dir(upperR), L.upperArm);
  const handL = add(elbowL, dir(upperL + p.elbowL), L.forearm);
  const handR = add(elbowR, dir(upperR + p.elbowR), L.forearm);

  const hipL = add(hip, perp, -hw);
  const hipR = add(hip, perp, hw);
  const thighL = down + p.hipL;
  const thighR = down + p.hipR;
  const kneeL = add(hipL, dir(thighL), L.thigh);
  const kneeR = add(hipR, dir(thighR), L.thigh);
  const shinL = thighL + p.kneeL;
  const shinR = thighR + p.kneeR;
  const ankleL = add(kneeL, dir(shinL), L.shin);
  const ankleR = add(kneeR, dir(shinR), L.shin);
  const footBaseL = front ? -80 : 90;
  const footBaseR = front ? 80 : 90;
  const footLen = front ? L.footFront : L.footSide;
  const toeL = add(ankleL, dir(shinL + footBaseL + p.ankleL), footLen);
  const toeR = add(ankleR, dir(shinR + footBaseR + p.ankleR), footLen);

  const raw: Skeleton = {
    head, neck, hip, shoulderL, shoulderR, elbowL, elbowR, handL, handR,
    hipL, hipR, kneeL, kneeR, ankleL, ankleR, toeL, toeR,
  };

  const rotated = p.rotation === 0 ? raw : mapSkeleton(raw, (pt) => rotateAround(pt, hip, p.rotation));
  const lowest = Math.min(
    ...Object.entries(rotated).map(([k, pt]) => (k === 'head' ? pt.y - L.headRadius : pt.y)),
  );
  const shift = p.lift - lowest;
  return mapSkeleton(rotated, (pt) => ({ x: pt.x, y: pt.y + shift }));
}

export function mapSkeleton(s: Skeleton, fn: (p: Point) => Point): Skeleton {
  return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, fn(v)])) as unknown as Skeleton;
}
