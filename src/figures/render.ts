import { keyPose, poseAt, type ExerciseAnimation, type KeyName } from './animation';
import { LENGTHS, solve, type Point, type Skeleton } from './skeleton';

const SVG_NS = 'http://www.w3.org/2000/svg';

type Bone = readonly [keyof Skeleton, keyof Skeleton];

/** Ferne Seite (bzw. linke Seite) zuerst, damit die nahe Seite darüber liegt. */
const FAR_BONES: readonly Bone[] = [
  ['shoulderL', 'elbowL'], ['elbowL', 'handL'],
  ['hipL', 'kneeL'], ['kneeL', 'ankleL'], ['ankleL', 'toeL'],
];
const BODY_BONES: readonly Bone[] = [
  ['hip', 'neck'], ['shoulderL', 'shoulderR'], ['hipL', 'hipR'],
];
const NEAR_BONES: readonly Bone[] = [
  ['shoulderR', 'elbowR'], ['elbowR', 'handR'],
  ['hipR', 'kneeR'], ['kneeR', 'ankleR'], ['ankleR', 'toeR'],
];

const PAD = 14;

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/** Bildausschnitt über alle Schlüsselposen, damit die Figur beim Animieren nicht springt. */
export function animationBounds(anim: ExerciseAnimation) {
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = 0;
  for (const key of Object.keys(anim.poses) as KeyName[]) {
    const s = solve(keyPose(anim, key));
    for (const [name, p] of Object.entries(s) as [keyof Skeleton, Point][]) {
      const r = name === 'head' ? LENGTHS.headRadius : 0;
      minX = Math.min(minX, p.x - r);
      maxX = Math.max(maxX, p.x + r);
      maxY = Math.max(maxY, p.y + r);
    }
  }
  // symmetrisch um x = 0, damit Spiegeln den Ausschnitt nicht verschiebt
  const half = Math.max(Math.abs(minX), Math.abs(maxX), 45) + PAD;
  return { minX: -half, width: 2 * half, top: maxY + PAD, height: maxY + 2 * PAD };
}

export interface FigureHandle {
  readonly element: SVGSVGElement;
  /** Zeichnet die Pose zum Zeitpunkt `seconds` (Sekunden seit Übungsbeginn). */
  update(seconds: number): void;
  setMirrored(mirrored: boolean): void;
}

export function createFigure(anim: ExerciseAnimation, options: { label: string }): FigureHandle {
  const b = animationBounds(anim);
  // SVG-y zeigt nach unten: y_svg = top − y
  const svg = svgEl('svg', {
    viewBox: `${b.minX} 0 ${b.width} ${b.height}`,
    class: 'figure',
    role: 'img',
    'aria-label': options.label,
  });
  const root = svgEl('g', {});
  svg.append(root);

  const toSvg = (p: Point) => ({ x: p.x, y: b.top - p.y });

  root.append(svgEl('line', { x1: b.minX, y1: b.top, x2: b.minX + b.width, y2: b.top, class: 'figure-ground' }));

  // Transparenz auf der Gruppe, nicht pro Linie – sonst entstehen dunkle Punkte an den Gelenken.
  // Nur in der Seitenansicht ist die L-Seite die ferne Seite.
  const sideView = keyPose(anim, anim.sequence[0] ?? 'A').view === 'side';
  const farGroup = svgEl('g', { class: sideView ? 'figure-far' : '' });
  root.append(farGroup);

  const makeLines = (bones: readonly Bone[], parent: SVGElement) =>
    bones.map((bone) => {
      const line = svgEl('line', { class: 'figure-limb' });
      parent.append(line);
      return { bone, line };
    });

  const far = makeLines(FAR_BONES, farGroup);
  const body = makeLines(BODY_BONES, root);
  const near = makeLines(NEAR_BONES, root);
  const head = svgEl('circle', { r: LENGTHS.headRadius, class: 'figure-head' });
  root.append(head);
  const lines = [...far, ...body, ...near];

  const update = (seconds: number) => {
    const s = solve(poseAt(anim, seconds));
    for (const { bone, line } of lines) {
      const a = toSvg(s[bone[0]]);
      const c = toSvg(s[bone[1]]);
      line.setAttribute('x1', a.x.toFixed(2));
      line.setAttribute('y1', a.y.toFixed(2));
      line.setAttribute('x2', c.x.toFixed(2));
      line.setAttribute('y2', c.y.toFixed(2));
    }
    const h = toSvg(s.head);
    head.setAttribute('cx', h.x.toFixed(2));
    head.setAttribute('cy', h.y.toFixed(2));
  };

  update(0);

  return {
    element: svg,
    update,
    setMirrored(mirrored) {
      root.setAttribute('transform', mirrored ? 'scale(-1 1)' : '');
    },
  };
}
