import { clampBase, stepSeconds, totalSeconds } from './bounds';
import type { DayVariant, ExerciseId, Mode, Plan, PlannedStep, StepExercise } from './types';

export function resolveExercise(exercise: StepExercise, day: DayVariant): ExerciseId {
  return typeof exercise === 'string' ? exercise : exercise[day];
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
    return step.segments ? { ...planned, segments: step.segments } : planned;
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
