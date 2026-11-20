import { createBeeper } from './audio/beeper';
import { dayVariant } from './core/abDay';
import { clampBase } from './core/bounds';
import { buildPlan } from './core/plan';
import type { Clock } from './core/session';
import type { Mode } from './core/types';
import { MODES } from './data/modes';
import { loadSettings, saveSettings, type Settings } from './platform/storage';
import { createWakeLock } from './platform/wakeLock';
import { renderDone } from './ui/done';
import { renderGallery } from './ui/gallery';
import { runSession } from './ui/session';
import { renderStart } from './ui/start';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('#app fehlt');
const app: HTMLElement = root;

const params = new URLSearchParams(location.search);

/** Entwicklungshilfe: ?speed=10 lässt die Zeit zehnmal schneller laufen. */
const speed = Math.max(1, Number(params.get('speed')) || 1);
const clock: Clock = () => performance.now() * speed;

const beeper = createBeeper();
const wakeLock = createWakeLock();
const modes = [...MODES.values()];
let settings: Settings = loadSettings();

/** Gespeicherte Grunddauer, auf die aktuellen Grenzen gebracht; sonst der Standard. */
function initialBase(mode: Mode): number | null {
  const saved = settings.bases[mode.id];
  if (mode.defaultBase === null) return null;
  return saved === undefined ? mode.defaultBase : clampBase(mode, saved);
}

function showStart(): void {
  app.className = '';
  renderStart(app, {
    modes,
    initialMode: settings.modeId ?? 'extended',
    initialBase,
    today: dayVariant(new Date()),
    onChange: (mode, base) => {
      settings = {
        modeId: mode.id,
        bases: base === null ? settings.bases : { ...settings.bases, [mode.id]: base },
      };
      saveSettings(settings);
    },
    onStart: (mode, base) => {
      beeper.unlock();
      // Der Tag wird beim Start festgelegt und gilt bis zum Ende der Routine.
      const plan = buildPlan(mode, base, dayVariant(new Date()));
      runSession(app, {
        plan,
        clock,
        beeper,
        wakeLock,
        onFinish: (elapsed) => renderDone(app, elapsed, showStart),
        onCancel: showStart,
      });
    },
  });
}

if (params.has('gallery')) {
  renderGallery(app, params.get('gallery'));
} else {
  showStart();
}
