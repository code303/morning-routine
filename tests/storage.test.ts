import { describe, expect, it } from 'vitest';
import { loadSettings, saveSettings, type KeyValueStore } from '../src/platform/storage';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe('settings storage', () => {
  it('round-trips mode and bases', () => {
    const store = memoryStore();
    saveSettings({ modeId: 'short', bases: { short: 40, extended: 50 } }, store);
    expect(loadSettings(store)).toEqual({ modeId: 'short', bases: { short: 40, extended: 50 } });
  });

  it('returns defaults without storage', () => {
    expect(loadSettings(null)).toEqual({ bases: {} });
    expect(() => saveSettings({ bases: {} }, null)).not.toThrow();
  });

  it('ignores corrupt or unexpected data', () => {
    const store = memoryStore();
    store.setItem('morning-routine:settings:v1', '{not json');
    expect(loadSettings(store)).toEqual({ bases: {} });
    store.setItem('morning-routine:settings:v1', JSON.stringify({ modeId: 'yoga', bases: { short: 'x', original: 45 } }));
    expect(loadSettings(store)).toEqual({ bases: { original: 45 } });
  });

  it('survives a throwing store', () => {
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(loadSettings(broken)).toEqual({ bases: {} });
    expect(() => saveSettings({ bases: {} }, broken)).not.toThrow();
  });
});
