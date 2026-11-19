import { BASE_STEP, MIN_STEP_SECONDS } from './constants';
import type { Mode, ScaledStep, Step } from './types';

/** Gleitkomma-Rauschen (z. B. 89.99999999) vor dem Runden entfernen. */
const EPSILON = 1e-9;

export function ceilTo(value: number, step: number): number {
  return Math.ceil(value / step - EPSILON) * step;
}

export function floorTo(value: number, step: number): number {
  return Math.floor(value / step + EPSILON) * step;
}

export function isScaled(step: Step): step is ScaledStep {
  return step.kind === 'scaled';
}

/** Dauer eines Schritts in ganzen Sekunden; Atemschritte auf volle 10-s-Zyklen abgerundet. */
export function stepSeconds(step: Step, base: number): number {
  if (step.kind === 'fixed') return step.seconds;
  const raw = Math.round(base * step.weight);
  if (step.segments?.kind === 'breath') {
    const cycle = step.segments.inSeconds + step.segments.outSeconds;
    return Math.floor(raw / cycle) * cycle;
  }
  return raw;
}

export interface BaseBounds {
  readonly min: number;
  readonly max: number;
}

/**
 * Reglergrenzen: Untergrenze durch die kürzeste Übung (≥ 30 s),
 * Obergrenze durch die Übung, die zuerst ihre Höchstdauer erreicht.
 * `null` für Modi ohne skalierte Schritte.
 */
export function baseBounds(steps: readonly Step[]): BaseBounds | null {
  const scaled = steps.filter(isScaled);
  if (scaled.length === 0) return null;
  const min = Math.max(...scaled.map((s) => MIN_STEP_SECONDS / s.weight));
  const max = Math.min(...scaled.map((s) => s.maxSeconds / s.weight));
  const bounds = { min: ceilTo(min, BASE_STEP), max: floorTo(max, BASE_STEP) };
  if (bounds.min > bounds.max) {
    throw new Error(`Ungültige Reglergrenzen: ${bounds.min} > ${bounds.max}`);
  }
  return bounds;
}

/** Grunddauer auf Grenzen und 5-s-Raster bringen. */
export function clampBase(mode: Mode, base: number): number | null {
  const bounds = baseBounds(mode.steps);
  if (!bounds) return null;
  const snapped = Math.round(base / BASE_STEP) * BASE_STEP;
  return Math.min(bounds.max, Math.max(bounds.min, snapped));
}

/** Gesamtdauer in Sekunden: alle Schritte plus Wechselpausen dazwischen. */
export function totalSeconds(mode: Mode, base: number | null): number {
  const effectiveBase = base ?? 0;
  const steps = mode.steps.reduce((sum, step) => sum + stepSeconds(step, effectiveBase), 0);
  const transitions = Math.max(0, mode.steps.length - 1) * mode.transitionSeconds;
  return steps + transitions;
}

/** „≈ N min“ – auf volle Minuten gerundet. */
export function approxMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}
