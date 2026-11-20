# Aufgaben: Morgenroutine-PWA V1

Spec: [`SPEC.md`](../SPEC.md) · Plan: [`tasks/plan.md`](plan.md)

Definition of Done für jede Aufgabe: `npm test` und `npm run typecheck` sind grün, `npm run build` läuft durch, die App bleibt lauffähig.

---

## Phase 1: Fundament

### - [x] Task 1: Projekt-Setup

**Beschreibung:** Vite-Projekt mit TypeScript (strict) und Vitest anlegen, die Scripts aus der Spec einrichten, ein leeres `index.html` mit `main.ts` erstellen und die Ordnerstruktur der Spec anlegen.

**Akzeptanzkriterien:**
- [ ] `npm run dev`, `build`, `preview`, `test`, `typecheck` funktionieren.
- [ ] `tsconfig` ist strict, `noUncheckedIndexedAccess` ist aktiv.
- [ ] Ein Beispiel-Test läuft grün.

**Verifikation:** `npm test`, `npm run build`, Seite unter `npm run dev` öffnet.
**Abhängigkeiten:** keine
**Dateien:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`
**Umfang:** S

### - [x] Task 2: Kern-Typen, Reglergrenzen und Plan-Erzeugung

**Beschreibung:** Typen für Übung, Schritt und Modus anlegen. `scaledSeconds`, `baseBounds` und `totalSeconds` sowie `buildPlan(mode, base, date)` umsetzen. Den Original-Modus mit den 9 Übungen als Daten anlegen, zunächst mit Name und Hinweis, noch ohne Posen.

**Akzeptanzkriterien:**
- [ ] Original-Modus: Grenzen 30–90 s, Standard 60 s, Gesamtdauer mit Wechselpausen korrekt.
- [ ] Eigenschaftstest über alle Reglerstellungen: Jeder Schritt dauert ≥ 30 s und ≤ `maxSeconds`.
- [ ] Rundung auf ganze Sekunden; Atmung (wenn vorhanden) auf 10 s abgerundet.

**Verifikation:** `npm test -- core`
**Abhängigkeiten:** 1
**Dateien:** `src/core/types.ts`, `src/core/bounds.ts`, `src/core/plan.ts`, `src/data/exercises.ts`, `src/data/modes.ts`, `tests/bounds.test.ts`
**Umfang:** M

### - [x] Task 3: Ablauf-Zustandsautomat

**Beschreibung:** `createSession(plan, clock)` mit `start`, `pause`, `resume`, `stop` und `tick(now)` umsetzen. Der Automat liefert den aktuellen Schritt, die Restzeit, die Phase (Übung oder 5-s-Wechselpause) und Ereignisse: `stepStart`, `countdown(3|2|1)`, `done`.

**Akzeptanzkriterien:**
- [ ] Mit simulierter Uhr erscheinen alle Ereignisse exakt zu den geplanten Zeitpunkten, auch wenn `tick` unregelmäßig aufgerufen wird.
- [ ] Pause friert die Restzeit ein, Fortsetzen macht ohne Sprung weiter.
- [ ] Die gemessene Gesamtdauer entspricht `totalSeconds`.

**Verifikation:** `npm test -- session`
**Abhängigkeiten:** 2
**Dateien:** `src/core/session.ts`, `tests/session.test.ts`
**Umfang:** M

### Checkpoint A
- [ ] Alle Tests und der Typecheck sind grün.
- [ ] Die Kernlogik für den Original-Modus ist vollständig.

---

## Phase 2: Erste lauffähige Version

### - [x] Task 4: UI-Slice im Original-Modus

**Beschreibung:**
- **Start:** Regler mit Sekundenwert, „≈ N min“, Start-Button.
- **Routine:** Name, Hinweis, großer Countdown, Fortschritt, Pause/Weiter, Beenden, Vorschau in der Wechselpause.
- **Fertig:** Abschlussbildschirm.
- **Antrieb:** `requestAnimationFrame` treibt `session.tick` an.
- **Figur:** vorerst eine Platzhalterfläche.
- **Farben:** `styles.css` enthält die Farbpalette aus dem shadcn-Preset `b5fybI`, hell und dunkel, wie in der Spec im Abschnitt „Farbpalette“ beschrieben. Die Tokens werden nach der Verwendungstabelle eingesetzt.

**Akzeptanzkriterien:**
- [ ] Alle Farben kommen ausschließlich aus den Palette-Tokens, es gibt keine fest codierten Farbwerte.
- [ ] Der Regler ändert die Gesamtdauer live und ist auf `baseBounds` begrenzt.
- [ ] Nach Start läuft die Routine ohne Berührung bis zum Fertig-Bildschirm durch.
- [ ] Beenden führt jederzeit zurück zum Start.

**Verifikation:** Manuell im Desktop-Browser mit einem Dev-Schalter für verkürzte Zeiten, z. B. `?speed=10`.
**Abhängigkeiten:** 3
**Dateien:** `src/ui/start.ts`, `src/ui/session.ts`, `src/ui/done.ts`, `src/main.ts`, `src/styles.css`
**Umfang:** M

### - [x] Task 5: Skelett, Renderer und Interpolation

**Beschreibung:**
- **Datenformat:** Pose (Gelenkwinkel, Wurzelposition/-rotation, Ansicht frontal/seitlich).
- **Berechnung:** Vorwärtskinematik und Interpolation mit Easing.
- **Darstellung:** SVG-Renderer und Schleifen-Abfolge (A→B→A …).
- **Nachweis:** an Arm Swings (frontal) und Horse Stance (statisch mit leichtem „Atmen“).
- **Ersatz:** Die Platzhalter-Standfigur gilt für Übungen ohne Posen.

**Akzeptanzkriterien:**
- [ ] Die Interpolation ergibt bei t = 0 und t = 1 exakt die Schlüsselposen (Unit-Test).
- [ ] Die Figur ist flüssig animiert und skaliert mit dem Container.
- [ ] Die Figur lässt sich spiegeln (für spätere Seitenwechsel).

**Verifikation:** `npm test -- figures`; Sichtprüfung im Browser.
**Abhängigkeiten:** 3 (parallel zu 4 möglich), Einbindung in 4
**Dateien:** `src/figures/skeleton.ts`, `src/figures/render.ts`, `src/figures/poses.ts`, `tests/figures.test.ts`
**Umfang:** M

### - [x] Task 6: Töne, Wake Lock, Hintergrund-Pause (Gerätetest am Checkpoint B offen)

**Beschreibung:**
- **Töne:** `beeper.ts` mit den vier Tönen aus der Spec, angehängt an die Ereignisse des Automaten. `AudioContext` beim Tippen auf Start.
- **Wake Lock:** `wakeLock.ts` mit erneuter Anforderung bei `visibilitychange`.
- **Hintergrund:** automatische Pause, wenn die Seite unsichtbar wird.

**Akzeptanzkriterien:**
- [ ] Die Töne erklingen bei 3/2/1, bei Schrittstart und am Ende.
- [ ] Der Bildschirm bleibt während der Routine an und geht nach Ende oder Beenden wieder normal aus.
- [ ] Ein App-Wechsel pausiert die Routine; nach „Weiter“ geht sie korrekt weiter.

**Verifikation:** Auf dem Android-Handy über `chrome://inspect`-Portweiterleitung auf `localhost:5173`.
**Abhängigkeiten:** 4
**Dateien:** `src/audio/beeper.ts`, `src/platform/wakeLock.ts`, `src/ui/session.ts`
**Umfang:** S

### Checkpoint B
- [ ] Der Original-Modus läuft auf dem Handy ohne Berührung durch, mit Tönen und anbleibendem Bildschirm.
- [ ] Rückmeldung von dir, bevor es mit Phase 3 weitergeht.

---

## Phase 3: Inhalte und Modi

### - [ ] Task 7: Posen der 9 Originalübungen

**Beschreibung:** Schlüsselposen A/B/C, Ansicht, Schleifendauer und Abfolge für alle 9 Übungen gemäß Bericht. Marching Claps zeigen die Hand am Gegenknie.

**Akzeptanzkriterien:**
- [ ] Jede Originalübung hat gültige Posen (Validierungstest: alle Gelenke definiert, Winkel im erlaubten Bereich).
- [ ] Die Schleifendauern sind plausibel (Hops ca. 0,5 s, Body Wave ca. 4 s).

**Verifikation:** `npm test -- figures`; Galerie-Seite `?gallery` zur Sichtprüfung aller Figuren.
**Abhängigkeiten:** 5
**Dateien:** `src/figures/poses.ts`, `src/data/exercises.ts`, `src/ui/gallery.ts`
**Umfang:** M

### - [ ] Task 8: Segmente

**Beschreibung:**
- **Kern:** `sides`, `holdSeconds` und `breath` im Plan und im Automaten, mit dem Ereignis `segmentSwitch`.
- **UI:** Spiegelung der Figur bei Seitenwechsel, Doppelton, an den Timer gekoppelter Atemkreis (4 s ein, 6 s aus).

**Akzeptanzkriterien:**
- [ ] Die Segmentgrenzen liegen exakt (Rest geht ins letzte Segment), Unit-Test.
- [ ] Der Atemkreis ist mit dem Timer synchron, es gibt keine Töne pro Atemzug.

**Verifikation:** `npm test -- session`; Sichtprüfung mit `?speed=10`.
**Abhängigkeiten:** 3, 6
**Dateien:** `src/core/plan.ts`, `src/core/session.ts`, `src/ui/session.ts`, `src/figures/render.ts`, `tests/segments.test.ts`
**Umfang:** M

### - [ ] Task 9: A/B-Tag und Modus Erweitert

**Beschreibung:**
- **A/B-Tag:** `abDay.ts` (Tage seit 2026-01-01, reine Datumsrechnung).
- **Modus Erweitert:** alle 19 Schritte laut Spec als Daten, mit `variant` und dem festen Schritt „Aufstehen“.
- **Startbildschirm:** Modusauswahl (zunächst Erweitert und Original) und „Heute: Tag A/B“.

**Akzeptanzkriterien:**
- [ ] Tests für A/B: 31. → 1., Zeitumstellung März/Oktober, Schaltjahr, gerade = A.
- [ ] Modus Erweitert: Grenzen 30–60 s; bei 45 s ergibt sich ≈ 18 min.
- [ ] Der Tag wird beim Start festgelegt.

**Verifikation:** `npm test -- abDay plan`
**Abhängigkeiten:** 2, 8
**Dateien:** `src/core/abDay.ts`, `src/data/modes.ts`, `src/data/exercises.ts`, `src/ui/start.ts`, `tests/abDay.test.ts`
**Umfang:** M

### - [ ] Task 10: Posen der stehenden Ergänzungen

**Beschreibung:**
- **Posen für:** Hip Hinge, Wadenheben + Wippen, Liegestütz (Wandvariante), Wall Angels, Goldener Hahn, Atmung (Wuji, Öffnen/Schließen), Aufstehen vom Boden.
- **Hilfsobjekte:** Wand, Stuhl.

**Akzeptanzkriterien:**
- [ ] Alle genannten Übungen haben gültige Posen (Validierungstest).
- [ ] Hilfsobjekte werden nur bei den Übungen gezeigt, die sie brauchen.

**Verifikation:** `npm test -- figures`; Galerie-Sichtprüfung.
**Abhängigkeiten:** 5
**Dateien:** `src/figures/poses.ts`, `src/figures/props.ts`, `src/data/exercises.ts`
**Umfang:** M

### - [ ] Task 11: Posen des Bodenblocks

**Beschreibung:** Posen für Bird Dog, Seitstütz, Glute Bridge, Dead Bug und Hüftbeuger-Dehnung. Liegende und kniende Posen nutzen Wurzelrotation und Seitenansicht.

**Akzeptanzkriterien:**
- [ ] Alle Bodenübungen haben gültige Posen.
- [ ] Die Figur liegt sichtbar auf der Bodenlinie und schwebt nicht.

**Verifikation:** `npm test -- figures`; Galerie-Sichtprüfung.
**Abhängigkeiten:** 5
**Dateien:** `src/figures/poses.ts`, `src/data/exercises.ts`
**Umfang:** S

### - [ ] Task 12: Modi Kurz und Blutdruck

**Beschreibung:**
- **Kurz:** Daten laut Spec.
- **Blutdruck:** fester Ablauf ohne Regler. Die 5-s-Vorschau liegt innerhalb der Pause, sodass es exakt 14:00 min sind. Auf dem Startbildschirm steht der Protokoll-Hinweis.
- **Startbildschirm:** zeigt alle vier Modi.

**Akzeptanzkriterien:**
- [ ] Blutdruck: 840 s, genau 4 Halteblöcke à 120 s (Unit-Test), kein Regler.
- [ ] Kurz: Grenzen 30–60 s, kein A/B.
- [ ] Alle vier Modi sind wählbar.

**Verifikation:** `npm test -- plan`; manuell im Browser.
**Abhängigkeiten:** 9
**Dateien:** `src/data/modes.ts`, `src/core/plan.ts`, `src/ui/start.ts`, `tests/plan.test.ts`
**Umfang:** S

### Checkpoint C
- [ ] Alle vier Modi und alle Figuren sind vorhanden.
- [ ] Erfolgskriterien 3–7, 9, 10 und 12 sind erfüllt.
- [ ] Rückmeldung zu den Figuren über die Galerie.

---

## Phase 4: PWA und Abschluss

### - [ ] Task 13: PWA

**Beschreibung:** `vite-plugin-pwa` einbinden, Manifest anlegen (Name, `display: standalone`, Farben), Icons 192/512 und maskable erstellen und alle Dateien vorab cachen.

**Akzeptanzkriterien:**
- [ ] Lighthouse meldet „installierbar“.
- [ ] Nach einmaligem Laden funktioniert `npm run preview` offline (DevTools → Offline) inklusive Neuladen.

**Verifikation:** Lighthouse und Offline-Test in Chrome DevTools.
**Abhängigkeiten:** 12
**Dateien:** `vite.config.ts`, `package.json`, `public/icons/*`, `index.html`
**Umfang:** S

### - [ ] Task 14: Politur und Speicher

**Beschreibung:**
- **Lesbarkeit und Layout:** aus 2 m lesbar (Schriftgrößen, Kontrast), Layout für Hoch- und Querformat, Dunkel- und Hellmodus.
- **Startbildschirm:** einklappbare Übungsliste mit Einzeldauern.
- **Speicher:** `storage.ts` merkt sich den letzten Modus und die Grunddauer pro Modus (mit try/catch).
- **Bewegung:** Bei `prefers-reduced-motion` wird die Animation verlangsamt.

**Akzeptanzkriterien:**
- [ ] Nach Neuladen sind Modus und Grunddauer wiederhergestellt; ohne Speicher gelten die Standardwerte.
- [ ] Bei 360 px Breite und im Querformat gibt es kein horizontales Scrollen.
- [ ] Der Countdown ist aus 2 m lesbar (manuell).

**Verifikation:** Manuell auf dem Handy; `npm test -- storage`.
**Abhängigkeiten:** 12
**Dateien:** `src/styles.css`, `src/ui/start.ts`, `src/platform/storage.ts`, `tests/storage.test.ts`
**Umfang:** M

### - [ ] Task 15: E2E-Rauchtest

**Beschreibung:** Playwright mit Chromium gegen `npm run preview` einrichten. Ablauf: Modus wechseln, Regler bewegen, prüfen, dass sich die Gesamtdauer ändert, Start drücken und mit `?speed` den ersten Schrittwechsel abwarten.

**Akzeptanzkriterien:**
- [ ] `npm run e2e` ist grün.

**Verifikation:** `npm run e2e`
**Abhängigkeiten:** 14
**Dateien:** `playwright.config.ts`, `e2e/smoke.spec.ts`, `package.json`
**Umfang:** S

### - [ ] Task 16: Deployment auf GitHub Pages (erst nach Rückfrage)

**Beschreibung:** Statischer Build auf GitHub Pages mit korrektem `base`-Pfad in Vite, entweder per GitHub Action oder manuell. Danach die App auf dem Android-Handy installieren.

**Akzeptanzkriterien:**
- [ ] Die App ist über HTTPS erreichbar und auf Android installierbar.
- [ ] Sie startet im Flugmodus.

**Verifikation:** Manuell auf dem Handy.
**Abhängigkeiten:** 13, deine Freigabe
**Dateien:** `vite.config.ts`, `.github/workflows/pages.yml`
**Umfang:** S

### Checkpoint D
- [ ] Alle 12 Erfolgskriterien der Spec sind erfüllt.
- [ ] Die manuelle Prüfung auf dem Android-Handy ist bestanden: Installation, offline, 20 min Bildschirm an, Töne, Figuren aus 2 m erkennbar.
