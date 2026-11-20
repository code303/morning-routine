import type { ModeId } from '../core/types';

/** Nur Komfort: letzter Modus und Grunddauer pro Modus. Ohne Speicher gelten Standardwerte. */
export interface Settings {
  readonly modeId?: ModeId;
  readonly bases: Partial<Record<ModeId, number>>;
}

const KEY = 'morning-routine:settings:v1';
const MODE_IDS: readonly ModeId[] = ['extended', 'original', 'short', 'bloodPressure'];

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStore(): KeyValueStore | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadSettings(store: KeyValueStore | null = defaultStore()): Settings {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return { bases: {} };
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return { bases: {} };
    const record = data as Record<string, unknown>;
    const bases: Partial<Record<ModeId, number>> = {};
    if (typeof record.bases === 'object' && record.bases !== null) {
      for (const id of MODE_IDS) {
        const value = (record.bases as Record<string, unknown>)[id];
        if (typeof value === 'number' && Number.isFinite(value)) bases[id] = value;
      }
    }
    const modeId = MODE_IDS.find((id) => id === record.modeId);
    return modeId ? { modeId, bases } : { bases };
  } catch {
    return { bases: {} };
  }
}

export function saveSettings(settings: Settings, store: KeyValueStore | null = defaultStore()): void {
  try {
    store?.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Speicher voll oder gesperrt – Einstellungen sind nur Komfort.
  }
}
