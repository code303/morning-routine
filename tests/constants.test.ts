import { describe, expect, it } from 'vitest';
import { BASE_STEP, MIN_STEP_SECONDS, TRANSITION_SECONDS } from '../src/core/constants';

describe('constants', () => {
  it('matches the spec', () => {
    expect(MIN_STEP_SECONDS).toBe(30);
    expect(BASE_STEP).toBe(5);
    expect(TRANSITION_SECONDS).toBe(5);
  });
});
