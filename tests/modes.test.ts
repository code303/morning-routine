import { describe, expect, it } from 'vitest';
import { dayIndex, dayVariant } from '../src/core/abDay';
import { approxMinutes, baseBounds, totalSeconds } from '../src/core/bounds';
import { buildPlan, hasVariants, segmentBoundaries } from '../src/core/plan';
import { createSession } from '../src/core/session';
import type { PlannedStep } from '../src/core/types';
import { BLOOD_PRESSURE, EXTENDED, ORIGINAL, SHORT } from '../src/data/modes';

describe('A/B day', () => {
  const d = (y: number, m: number, day: number, h = 12) => new Date(y, m - 1, day, h);

  it('starts at 2026-01-01 with A', () => {
    expect(dayIndex(d(2026, 1, 1))).toBe(0);
    expect(dayVariant(d(2026, 1, 1))).toBe('A');
    expect(dayVariant(d(2026, 1, 2))).toBe('B');
  });

  it('alternates across month ends (31 → 1)', () => {
    expect(dayVariant(d(2026, 1, 31))).not.toBe(dayVariant(d(2026, 2, 1)));
    expect(dayVariant(d(2026, 3, 31))).not.toBe(dayVariant(d(2026, 4, 1)));
  });

  it('alternates across DST changes and is independent of time of day', () => {
    expect(dayIndex(d(2026, 3, 30, 0)) - dayIndex(d(2026, 3, 28, 23))).toBe(2);
    expect(dayIndex(d(2026, 10, 26, 1)) - dayIndex(d(2026, 10, 24, 22))).toBe(2);
    expect(dayVariant(d(2026, 11, 20, 0))).toBe(dayVariant(d(2026, 11, 20, 23)));
  });

  it('counts leap years correctly', () => {
    expect(dayIndex(d(2028, 3, 1)) - dayIndex(d(2028, 2, 28))).toBe(2);
    expect(dayIndex(d(2027, 1, 1))).toBe(365);
  });

  it('handles dates before the epoch', () => {
    expect(dayVariant(d(2025, 12, 31))).toBe('B');
  });
});

describe('Extended mode', () => {
  it('has slider range 30–60 s and ≈ 18 min at 45 s', () => {
    expect(baseBounds(EXTENDED.steps)).toEqual({ min: 30, max: 60 });
    expect(approxMinutes(totalSeconds(EXTENDED, 45))).toBe(18);
    expect(approxMinutes(totalSeconds(EXTENDED, 30))).toBe(13);
    expect(approxMinutes(totalSeconds(EXTENDED, 60))).toBe(24);
  });

  it('has 19 steps and uses variants', () => {
    expect(EXTENDED.steps).toHaveLength(19);
    expect(hasVariants(EXTENDED)).toBe(true);
    expect(hasVariants(ORIGINAL)).toBe(false);
  });

  it('resolves the floor block per day, including segments', () => {
    const a = buildPlan(EXTENDED, 45, 'A');
    const b = buildPlan(EXTENDED, 45, 'B');
    expect(a.steps[14]).toMatchObject({ exerciseId: 'bird-dog', seconds: 50, segments: { kind: 'hold', seconds: 10 } });
    expect(b.steps[14]).toMatchObject({ exerciseId: 'side-plank', seconds: 50, segments: { kind: 'sides', count: 2 } });
    expect(a.steps[15]?.exerciseId).toBe('glute-bridge');
    expect(b.steps[15]?.exerciseId).toBe('dead-bug');
  });

  it('keeps the floor rise fixed at 15 s', () => {
    expect(buildPlan(EXTENDED, 30, 'A').steps[17]).toMatchObject({ exerciseId: 'floor-rise', seconds: 15 });
    expect(buildPlan(EXTENDED, 60, 'A').steps[17]).toMatchObject({ exerciseId: 'floor-rise', seconds: 15 });
  });

  it('uses 2 min breathing at the default base', () => {
    expect(buildPlan(EXTENDED, 45, 'A').steps[18]).toMatchObject({ exerciseId: 'slow-breathing', seconds: 120 });
  });
});

describe('Short mode', () => {
  it('has slider range 30–60 s, no variants, ≈ 10 min', () => {
    expect(baseBounds(SHORT.steps)).toEqual({ min: 30, max: 60 });
    expect(hasVariants(SHORT)).toBe(false);
    expect(approxMinutes(totalSeconds(SHORT, 30))).toBe(10);
  });
});

describe('Blood pressure mode', () => {
  const plan = buildPlan(BLOOD_PRESSURE, null, 'A');

  it('has no slider and lasts exactly 14:00', () => {
    expect(baseBounds(BLOOD_PRESSURE.steps)).toBeNull();
    expect(plan.base).toBeNull();
    expect(plan.totalSeconds).toBe(840);
  });

  it('has exactly 4 holds of 120 s with 120 s rest in between', () => {
    const session = createSession(plan, () => 0);
    const holds = session.timeline.filter((p) => plan.steps[p.index]?.exerciseId === 'horse-stance');
    expect(holds).toHaveLength(4);
    holds.forEach((h) => expect(h.end - h.start).toBe(120));
    for (let i = 1; i < holds.length; i++) {
      expect((holds[i]?.start ?? 0) - (holds[i - 1]?.end ?? 0)).toBe(120);
    }
  });
});

describe('segments', () => {
  const step = (seconds: number, segments: PlannedStep['segments']): PlannedStep =>
    segments ? { exerciseId: 'x', seconds, segments } : { exerciseId: 'x', seconds };

  it('splits sides evenly and gives the remainder to the last segment', () => {
    expect(segmentBoundaries(step(80, { kind: 'sides', count: 4 }))).toEqual([20, 40, 60]);
    expect(segmentBoundaries(step(53, { kind: 'sides', count: 4 }))).toEqual([13, 26, 39]);
    expect(segmentBoundaries(step(60, { kind: 'sides', count: 2 }))).toEqual([30]);
  });

  it('switches holds every n seconds before the end', () => {
    expect(segmentBoundaries(step(50, { kind: 'hold', seconds: 10 }))).toEqual([10, 20, 30, 40]);
    expect(segmentBoundaries(step(53, { kind: 'hold', seconds: 10 }))).toEqual([10, 20, 30, 40, 50]);
  });

  it('has no boundaries for breathing or plain steps', () => {
    expect(segmentBoundaries(step(120, { kind: 'breath', inSeconds: 4, outSeconds: 6 }))).toEqual([]);
    expect(segmentBoundaries(step(45, undefined))).toEqual([]);
  });

  it('emits segmentSwitch events and tracks the current segment', () => {
    let now = 0;
    const plan = buildPlan(EXTENDED, 45, 'A');
    const session = createSession(plan, () => now);
    session.start();
    const rooster = session.timeline.find((p) => p.kind === 'step' && plan.steps[p.index]?.exerciseId === 'golden-rooster');
    expect(rooster).toBeDefined();
    if (!rooster) return;
    now = (rooster.start + 19.9) * 1000;
    expect(session.tick().state.segment).toBe(0);
    now = (rooster.start + 20) * 1000;
    const { state, events } = session.tick();
    expect(state.segment).toBe(1);
    expect(events.filter((e) => e.type === 'segmentSwitch')).toContainEqual({
      type: 'segmentSwitch',
      index: rooster.index,
      segment: 1,
      at: rooster.start + 20,
    });
  });
});
