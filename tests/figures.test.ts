import { describe, expect, it } from 'vitest';
import { keyPose, lerpPose, poseAt, type KeyName } from '../src/figures/animation';
import { ANIMATED_EXERCISES, getAnimation, PLACEHOLDER } from '../src/figures/poses';
import { dir, LENGTHS, NUMERIC_POSE_KEYS, pose, solve } from '../src/figures/skeleton';
import { EXERCISES } from '../src/data/exercises';

describe('dir', () => {
  it('follows the angle convention', () => {
    expect(dir(0).y).toBeCloseTo(-1);
    expect(dir(90).x).toBeCloseTo(1);
    expect(dir(180).y).toBeCloseTo(1);
    expect(dir(-90).x).toBeCloseTo(-1);
  });
});

describe('solve', () => {
  it('stands upright on the ground', () => {
    const s = solve(pose('front'));
    expect(s.head.y).toBeGreaterThan(s.neck.y);
    expect(s.neck.y).toBeGreaterThan(s.hip.y);
    expect(Math.min(s.toeL.y, s.toeR.y, s.ankleL.y, s.ankleR.y)).toBeCloseTo(0);
    expect(s.shoulderL.x).toBeLessThan(s.shoulderR.x);
  });

  it('lifts the figure off the ground', () => {
    const s = solve(pose('front', { lift: 5 }));
    expect(Math.min(s.toeL.y, s.toeR.y)).toBeCloseTo(5);
  });

  it('leans toward +x for positive lean', () => {
    const s = solve(pose('side', { lean: 30 }));
    expect(s.neck.x).toBeGreaterThan(s.hip.x);
  });

  it('places a lying figure (rotation 90°) flat on the ground', () => {
    const s = solve(pose('side', { rotation: -90 }));
    expect(Math.abs(s.head.y - s.hip.y)).toBeLessThan(LENGTHS.headRadius + 1);
  });
});

describe('animation', () => {
  const anim = getAnimation('arm-swings');

  it('hits key poses exactly at t = 0 and t = 1', () => {
    const a = keyPose(anim, 'A');
    const b = keyPose(anim, 'B');
    expect(lerpPose(a, b, 0)).toEqual(a);
    expect(lerpPose(a, b, 1)).toEqual(b);
    expect(poseAt(anim, 0)).toEqual(a);
    expect(poseAt(anim, anim.loopSeconds / 2)).toEqual(b);
  });

  it('loops seamlessly', () => {
    const start = poseAt(anim, 0);
    const end = poseAt(anim, anim.loopSeconds - 1e-9);
    for (const key of NUMERIC_POSE_KEYS) expect(end[key]).toBeCloseTo(start[key], 3);
  });

  it('falls back to the placeholder for unknown exercises', () => {
    expect(getAnimation('does-not-exist')).toBe(PLACEHOLDER);
  });
});

describe.each(['placeholder', ...ANIMATED_EXERCISES])('animation %s', (id) => {
  const anim = id === 'placeholder' ? PLACEHOLDER : getAnimation(id);

  it('belongs to a known exercise', () => {
    if (id !== 'placeholder') expect(EXERCISES.has(id)).toBe(true);
  });

  it('has valid key poses with one view', () => {
    expect(anim.sequence.length).toBeGreaterThan(0);
    expect(anim.loopSeconds).toBeGreaterThan(0);
    const views = new Set<string>();
    for (const key of anim.sequence as KeyName[]) {
      const p = keyPose(anim, key);
      views.add(p.view);
      for (const k of NUMERIC_POSE_KEYS) expect(Number.isFinite(p[k]), `${key}.${k}`).toBe(true);
      const s = solve(p);
      for (const pt of Object.values(s)) {
        expect(Number.isFinite(pt.x) && Number.isFinite(pt.y)).toBe(true);
        expect(pt.y).toBeGreaterThanOrEqual(-1e-6);
      }
    }
    expect(views.size).toBe(1);
  });
});
