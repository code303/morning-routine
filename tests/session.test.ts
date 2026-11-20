import { describe, expect, it } from 'vitest';
import { buildPlan } from '../src/core/plan';
import { createSession, type SessionEvent } from '../src/core/session';
import type { Plan } from '../src/core/types';
import { ORIGINAL } from '../src/data/modes';

function fakeClock(startMs = 1000) {
  let now = startMs;
  return {
    clock: () => now,
    advance: (seconds: number) => {
      now += seconds * 1000;
    },
  };
}

const twoSteps: Plan = {
  modeId: 'original',
  base: 30,
  day: 'A',
  transitionSeconds: 5,
  steps: [
    { exerciseId: 'arm-swings', seconds: 30 },
    { exerciseId: 'horse-stance', seconds: 60 },
  ],
  totalSeconds: 95,
};

function describeEvent(e: SessionEvent): string {
  switch (e.type) {
    case 'stepStart':
      return `${e.at}:start#${e.index}`;
    case 'countdown':
      return `${e.at}:cd${e.remaining}#${e.index}`;
    case 'transitionStart':
      return `${e.at}:transition→${e.nextIndex}`;
    case 'stepEnd':
      return `${e.at}:end#${e.index}`;
    case 'segmentSwitch':
      return `${e.at}:segment${e.segment}#${e.index}`;
    case 'done':
      return `${e.at}:done`;
  }
}

describe('session timeline', () => {
  it('lays out steps and transitions', () => {
    const { clock } = fakeClock();
    const s = createSession(twoSteps, clock);
    expect(s.timeline).toEqual([
      { kind: 'step', index: 0, start: 0, end: 30 },
      { kind: 'transition', index: 1, start: 30, end: 35 },
      { kind: 'step', index: 1, start: 35, end: 95 },
    ]);
    expect(s.total).toBe(twoSteps.totalSeconds);
  });

  it('omits transitions when transitionSeconds is 0', () => {
    const { clock } = fakeClock();
    const s = createSession({ ...twoSteps, transitionSeconds: 0, totalSeconds: 90 }, clock);
    expect(s.timeline.map((p) => p.kind)).toEqual(['step', 'step']);
  });

  it('ends a step before the next one starts, also without a transition', () => {
    const { clock, advance } = fakeClock();
    const s = createSession({ ...twoSteps, transitionSeconds: 0, totalSeconds: 90 }, clock);
    s.start();
    advance(30);
    const types = s.tick().events.map((e) => e.type);
    expect(types).toEqual(['countdown', 'countdown', 'countdown', 'stepEnd', 'stepStart']);
  });
});

describe('session events', () => {
  it('fires every event exactly once at its planned time, regardless of tick irregularity', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    const log: string[] = [];
    const record = (events: readonly SessionEvent[]) => log.push(...events.map(describeEvent));

    record(s.start().events);
    // unregelmäßige Ticks, auch große Sprünge
    for (const dt of [0.016, 0.5, 10, 16.5, 0.3, 0.2, 1, 1, 1, 3, 20, 30, 7, 5]) {
      advance(dt);
      record(s.tick().events);
    }

    expect(log).toEqual([
      '0:start#0',
      '27:cd3#0',
      '28:cd2#0',
      '29:cd1#0',
      '30:end#0',
      '30:transition→1',
      '35:start#1',
      '92:cd3#1',
      '93:cd2#1',
      '94:cd1#1',
      '95:done',
    ]);
  });

  it('emits countdown events no earlier than planned', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.start();
    advance(26.999);
    expect(s.tick().events).toEqual([]);
    advance(0.001);
    expect(s.tick().events.map(describeEvent)).toEqual(['27:cd3#0']);
  });
});

describe('session state', () => {
  it('reports phase and remaining times', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.start();
    advance(31);
    const { state } = s.tick();
    expect(state.phase).toMatchObject({ kind: 'transition', index: 1 });
    expect(state.phaseRemaining).toBeCloseTo(4);
    expect(state.totalRemaining).toBeCloseTo(64);
  });

  it('freezes on pause and continues without a jump on resume', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.start();
    advance(10);
    s.pause();
    advance(600);
    expect(s.tick().state).toMatchObject({ status: 'paused', elapsed: 10 });
    expect(s.tick().events).toEqual([]);
    s.resume();
    advance(5);
    expect(s.tick().state.elapsed).toBeCloseTo(15);
  });

  it('finishes with status done after exactly the planned total', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.start();
    advance(94.9);
    expect(s.tick().state.status).toBe('running');
    advance(0.1);
    const done = s.tick();
    expect(done.state.status).toBe('done');
    expect(done.state.elapsed).toBe(95);
    advance(100);
    expect(s.tick()).toMatchObject({ state: { status: 'done', elapsed: 95 }, events: [] });
  });

  it('jumps forward and backward between steps', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.start();
    advance(10);
    s.next();
    let r = s.tick();
    expect(r.state.phase).toMatchObject({ kind: 'step', index: 1 });
    expect(r.state.elapsed).toBe(35);
    expect(r.events.map(describeEvent)).toEqual(['35:start#1']);

    advance(2); // innerhalb der ersten 3 s → vorherige Übung
    s.previous();
    r = s.tick();
    expect(r.state.phase).toMatchObject({ kind: 'step', index: 0 });
    expect(r.state.elapsed).toBe(0);
    expect(r.events.map(describeEvent)).toEqual(['0:start#0']);

    // Countdown des wiederholten Schritts erklingt erneut
    advance(27);
    expect(s.tick().events.map(describeEvent)).toEqual(['27:cd3#0']);
  });

  it('previous restarts the current step after the first 3 s, otherwise goes back', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.start();
    s.jumpTo(1);
    advance(3.5);
    s.previous();
    expect(s.tick().state).toMatchObject({ phase: { kind: 'step', index: 1 }, elapsed: 35 });
    advance(3);
    s.previous();
    expect(s.tick().state).toMatchObject({ phase: { kind: 'step', index: 0 }, elapsed: 0 });
  });

  it('previous on the first step restarts it; next on the last step does nothing', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.start();
    advance(12);
    s.previous();
    expect(s.tick().state.elapsed).toBe(0);
    s.jumpTo(1);
    advance(20);
    s.next();
    expect(s.tick().state).toMatchObject({ phase: { index: 1 }, elapsed: 55, status: 'running' });
  });

  it('in a transition, next goes to the announced step and previous to the finished one', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.start();
    advance(31);
    s.tick();
    s.next();
    expect(s.tick().state.phase).toMatchObject({ kind: 'step', index: 1, start: 35 });
    const t = createSession(twoSteps, clock);
    t.start();
    advance(31);
    t.tick();
    t.previous();
    expect(t.tick().state.phase).toMatchObject({ kind: 'step', index: 0 });
  });

  it('keeps a paused session paused when jumping', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.start();
    advance(3);
    s.pause();
    s.next();
    advance(100);
    expect(s.tick().state).toMatchObject({ status: 'paused', elapsed: 35 });
    s.resume();
    advance(2);
    expect(s.tick().state.elapsed).toBeCloseTo(37);
  });

  it('does not fire the previous stepEnd when jumping in a mode without transitions', () => {
    const { clock } = fakeClock();
    const s = createSession({ ...twoSteps, transitionSeconds: 0, totalSeconds: 90 }, clock);
    s.start();
    s.tick();
    s.next();
    expect(s.tick().events.map((e) => e.type)).toEqual(['stepStart']);
  });

  it('ignores jumps before start and after stop', () => {
    const { clock } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.next();
    s.start();
    expect(s.tick().state.elapsed).toBe(0);
    s.stop();
    s.jumpTo(1);
    expect(s.tick().state).toMatchObject({ status: 'stopped', elapsed: 0 });
  });

  it('stops on demand', () => {
    const { clock, advance } = fakeClock();
    const s = createSession(twoSteps, clock);
    s.start();
    advance(12);
    s.stop();
    advance(50);
    expect(s.tick().state).toMatchObject({ status: 'stopped', elapsed: 12 });
  });

  it('measures the Original mode total as planned', () => {
    const plan = buildPlan(ORIGINAL, 60, 'A');
    const { clock, advance } = fakeClock();
    const s = createSession(plan, clock);
    s.start();
    let ticks = 0;
    while (s.tick().state.status === 'running') {
      advance(0.25);
      ticks++;
    }
    expect(s.total).toBe(plan.totalSeconds);
    expect(ticks / 4).toBeCloseTo(plan.totalSeconds, 0);
  });
});
