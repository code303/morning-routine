/** Töne per Web Audio – keine Audiodateien. */
export interface Beeper {
  /** Muss aus einer Nutzergeste (Tippen auf Start) heraus aufgerufen werden. */
  unlock(): void;
  countdown(): void;
  stepStart(): void;
  segmentSwitch(): void;
  done(): void;
}

interface Tone {
  readonly freq: number;
  readonly duration: number;
  readonly delay?: number;
}

const VOLUME = 0.25;

export function createBeeper(): Beeper {
  let ctx: AudioContext | null = null;

  const play = (tones: readonly Tone[]) => {
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const tone of tones) {
      const start = now + (tone.delay ?? 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = tone.freq;
      // kurze Hüllkurve gegen Knacken
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(VOLUME, start + 0.01);
      gain.gain.setValueAtTime(VOLUME, start + tone.duration - 0.03);
      gain.gain.linearRampToValueAtTime(0, start + tone.duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + tone.duration + 0.02);
    }
  };

  return {
    unlock() {
      try {
        ctx ??= new AudioContext();
        void ctx.resume();
      } catch {
        ctx = null; // ohne Audio weiterlaufen
      }
    },
    countdown: () => play([{ freq: 660, duration: 0.12 }]),
    stepStart: () => play([{ freq: 880, duration: 0.4 }]),
    segmentSwitch: () =>
      play([
        { freq: 740, duration: 0.1 },
        { freq: 740, duration: 0.1, delay: 0.16 },
      ]),
    done: () =>
      play([
        { freq: 523, duration: 0.18 },
        { freq: 659, duration: 0.18, delay: 0.2 },
        { freq: 784, duration: 0.4, delay: 0.4 },
      ]),
  };
}
