import { createBeeper } from './audio/beeper';
import { dayVariant } from './core/abDay';
import { buildPlan } from './core/plan';
import type { Clock } from './core/session';
import type { Mode } from './core/types';
import { MODES } from './data/modes';
import { createWakeLock } from './platform/wakeLock';
import { renderDone } from './ui/done';
import { renderGallery } from './ui/gallery';
import { runSession } from './ui/session';
import { renderStart } from './ui/start';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('#app fehlt');
const app: HTMLElement = root;

/** Entwicklungshilfe: ?speed=10 lässt die Zeit zehnmal schneller laufen. */
const speed = Math.max(1, Number(new URLSearchParams(location.search).get('speed')) || 1);
const clock: Clock = () => performance.now() * speed;

const beeper = createBeeper();
const wakeLock = createWakeLock();
const modes = [...MODES.values()];

function showStart(): void {
  app.className = '';
  renderStart(app, {
    modes,
    initialMode: 'extended',
    initialBase: (mode: Mode) => mode.defaultBase,
    today: dayVariant(new Date()),
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

const params = new URLSearchParams(location.search);
if (params.has('gallery')) {
  renderGallery(app, params.get('gallery'));
} else {
  showStart();
}
