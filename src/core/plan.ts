import { clampBase, stepSeconds, totalSeconds } from './bounds';
import type {
  DayVariant,
  ExerciseId,
  Mode,
  Plan,
  PlannedStep,
  Segments,
  Step,
  StepExercise,
} from './types';

export function resolveExercise(exercise: StepExercise, day: DayVariant): ExerciseId {
  return typeof exercise === 'string' ? exercise : exercise[day];
}

export function resolveSegments(step: Step, day: DayVariant): Segments | undefined {
  return step.variantSegments?.[day] ?? step.segments;
}

export function hasVariants(mode: Mode): boolean {
  return mode.steps.some((s) => typeof s.exercise !== 'string');
}

/**
 * Konkreter Ablauf für einen Modus. Die Grunddauer wird auf die Reglergrenzen
 * gebracht; bei festen Modi wird sie ignoriert.
 */
export function buildPlan(mode: Mode, base: number | null, day: DayVariant): Plan {
  const effectiveBase = base === null ? null : clampBase(mode, base);
  const steps: PlannedStep[] = mode.steps.map((step) => {
    const planned: PlannedStep = {
      exerciseId: resolveExercise(step.exercise, day),
      seconds: stepSeconds(step, effectiveBase ?? 0),
    };
    const segments = resolveSegments(step, day);
    return segments ? { ...planned, segments } : planned;
  });
  return {
    modeId: mode.id,
    base: effectiveBase,
    day,
    transitionSeconds: mode.transitionSeconds,
    steps,
    totalSeconds: totalSeconds(mode, effectiveBase),
  };
}

/**
 * Zeitpunkte (Sekunden ab Schrittbeginn), an denen Seite oder Halteposition wechselt.
 * `sides`: gleich lange Teile, Rest geht ans letzte Segment.
 * `hold`: alle n Sekunden, solange vor dem Schrittende.
 * `breath`: keine Wechsel (der Atemkreis läuft kontinuierlich).
 */
export function segmentBoundaries(step: PlannedStep): number[] {
  const seg = step.segments;
  if (!seg) return [];
  switch (seg.kind) {
    case 'sides': {
      const part = Math.floor(step.seconds / seg.count);
      return Array.from({ length: seg.count - 1 }, (_, i) => (i + 1) * part);
    }
    case 'hold': {
      const out: number[] = [];
      for (let t = seg.seconds; t < step.seconds; t += seg.seconds) out.push(t);
      return out;
    }
    case 'breath':
      return [];
  }
}
