import { describe, expect, it } from 'vitest';
import {
  approxMinutes,
  baseBounds,
  ceilTo,
  clampBase,
  floorTo,
  stepSeconds,
  totalSeconds,
} from '../src/core/bounds';
import { MIN_STEP_SECONDS } from '../src/core/constants';
import { buildPlan } from '../src/core/plan';
import type { Mode, Step } from '../src/core/types';
import { EXERCISES } from '../src/data/exercises';
import { MODES, ORIGINAL } from '../src/data/modes';

describe('rounding helpers', () => {
  it('ignores floating point noise', () => {
    expect(floorTo(100 / (10 / 9), 5)).toBe(90);
    expect(ceilTo(30 / (10 / 9), 5)).toBe(30);
    expect(ceilTo(31, 5)).toBe(35);
    expect(floorTo(89, 5)).toBe(85);
  });
});

describe('stepSeconds', () => {
  it('scales by weight and rounds to whole seconds', () => {
    const step: Step = { kind: 'scaled', exercise: 'x', weight: 16 / 9, maxSeconds: 120 };
    expect(stepSeconds(step, 45)).toBe(80);
    expect(stepSeconds(step, 30)).toBe(53);
  });

  it('rounds breathing down to full cycles', () => {
    const step: Step = {
      kind: 'scaled',
      exercise: 'x',
      weight: 8 / 3,
      maxSeconds: 300,
      segments: { kind: 'breath', inSeconds: 4, outSeconds: 6 },
    };
    expect(stepSeconds(step, 45)).toBe(120);
    expect(stepSeconds(step, 35)).toBe(90); // 93,3 → 90
  });

  it('keeps fixed steps unscaled', () => {
    expect(stepSeconds({ kind: 'fixed', exercise: 'x', seconds: 15 }, 60)).toBe(15);
  });
});

describe('baseBounds', () => {
  it('derives the lower bound from the shortest and the upper bound from the tightest step', () => {
    const steps: Step[] = [
      { kind: 'scaled', exercise: 'a', weight: 1, maxSeconds: 90 },
      { kind: 'scaled', exercise: 'b', weight: 2, maxSeconds: 120 },
    ];
    expect(baseBounds(steps)).toEqual({ min: 30, max: 60 });
  });

  it('returns null without scaled steps', () => {
    expect(baseBounds([{ kind: 'fixed', exercise: 'x', seconds: 120 }])).toBeNull();
  });

  it('rejects impossible bounds', () => {
    expect(() => baseBounds([{ kind: 'scaled', exercise: 'x', weight: 1, maxSeconds: 20 }])).toThrow();
  });
});

describe('Original mode', () => {
  it('has slider range 30–90 s with default 60 s', () => {
    expect(baseBounds(ORIGINAL.steps)).toEqual({ min: 30, max: 90 });
    expect(ORIGINAL.defaultBase).toBe(60);
  });

  it('totals 9 × 60 s plus 8 transitions', () => {
    expect(totalSeconds(ORIGINAL, 60)).toBe(9 * 60 + 8 * 5);
    expect(approxMinutes(totalSeconds(ORIGINAL, 60))).toBe(10);
  });

  it('clamps and snaps the base', () => {
    expect(clampBase(ORIGINAL, 10)).toBe(30);
    expect(clampBase(ORIGINAL, 500)).toBe(90);
    expect(clampBase(ORIGINAL, 47)).toBe(45);
  });
});

describe.each([...MODES.values()])('mode $id', (mode: Mode) => {
  const bounds = baseBounds(mode.steps);

  it('references only known exercises', () => {
    for (const day of ['A', 'B'] as const) {
      for (const step of buildPlan(mode, mode.defaultBase, day).steps) {
        expect(EXERCISES.has(step.exerciseId), step.exerciseId).toBe(true);
      }
    }
  });

  it('has its default base within the slider range', () => {
    if (!bounds) return expect(mode.defaultBase).toBeNull();
    expect(mode.defaultBase).not.toBeNull();
    expect(mode.defaultBase).toBeGreaterThanOrEqual(bounds.min);
    expect(mode.defaultBase).toBeLessThanOrEqual(bounds.max);
  });

  it('keeps every scaled step within [30 s, maxSeconds] for every slider position', () => {
    if (!bounds) return;
    for (let base = bounds.min; base <= bounds.max; base += 5) {
      for (const step of mode.steps) {
        if (step.kind !== 'scaled') continue;
        const seconds = stepSeconds(step, base);
        expect(seconds, `base ${base}`).toBeGreaterThanOrEqual(MIN_STEP_SECONDS);
        expect(seconds, `base ${base}`).toBeLessThanOrEqual(step.maxSeconds);
      }
    }
  });

  it('plan total equals step sum plus transitions', () => {
    const plan = buildPlan(mode, mode.defaultBase, 'A');
    const sum = plan.steps.reduce((s, step) => s + step.seconds, 0);
    expect(plan.totalSeconds).toBe(sum + (plan.steps.length - 1) * plan.transitionSeconds);
  });
});

describe('buildPlan', () => {
  it('resolves A/B variants', () => {
    const mode: Mode = {
      id: 'extended',
      name: 't',
      description: '',
      defaultBase: 45,
      transitionSeconds: 5,
      steps: [{ kind: 'scaled', exercise: { A: 'arm-swings', B: 'dead-arms' }, weight: 1, maxSeconds: 90 }],
    };
    expect(buildPlan(mode, 45, 'A').steps[0]?.exerciseId).toBe('arm-swings');
    expect(buildPlan(mode, 45, 'B').steps[0]?.exerciseId).toBe('dead-arms');
  });

  it('clamps an out-of-range base', () => {
    const plan = buildPlan(ORIGINAL, 200, 'A');
    expect(plan.base).toBe(90);
    expect(plan.steps.every((s) => s.seconds <= 120)).toBe(true);
  });

  it('keeps step ratios constant across bases', () => {
    const a = buildPlan(ORIGINAL, 30, 'A').steps.map((s) => s.seconds);
    const b = buildPlan(ORIGINAL, 90, 'A').steps.map((s) => s.seconds);
    a.forEach((seconds, i) => expect((b[i] ?? 0) / seconds).toBeCloseTo(3));
  });
});
