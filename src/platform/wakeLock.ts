/** Hält den Bildschirm an, solange `acquire` aktiv ist; fordert nach App-Wechsel neu an. */
export interface WakeLock {
  acquire(): Promise<void>;
  release(): Promise<void>;
}

export function createWakeLock(): WakeLock {
  let sentinel: WakeLockSentinel | null = null;
  let wanted = false;

  const request = async () => {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try {
      sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        sentinel = null;
      });
    } catch {
      sentinel = null; // z. B. Energiesparmodus – Routine läuft trotzdem
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (wanted && !sentinel && document.visibilityState === 'visible') void request();
  });

  return {
    async acquire() {
      wanted = true;
      if (!sentinel) await request();
    },
    async release() {
      wanted = false;
      const current = sentinel;
      sentinel = null;
      await current?.release().catch(() => undefined);
    },
  };
}
