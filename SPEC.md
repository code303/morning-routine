# Spec: Morgenroutine-PWA — V1

Status: Entwurf, wartet auf Freigabe
Grundlagen: [`docs/intent/morning-routine-app.md`](docs/intent/morning-routine-app.md) (bestätigte Zielbeschreibung), [`reports/Tai Chi Morgenroutine Analyse.md`](reports/Tai%20Chi%20Morgenroutine%20Analyse.md) (Übungen, Posen, Dosierung)

## Annahmen

1. **Tech-Stack:** Vanilla TypeScript mit Vite, ohne UI-Framework. Die App hat drei Bildschirme, ein Framework wäre zu viel.
2. **PWA:** Manifest und Service Worker kommen über `vite-plugin-pwa` (Workbox). Alle Dateien werden vorab gecacht, die App läuft danach vollständig offline.
3. **Töne:** werden mit der Web Audio API erzeugt (Oszillator). Es gibt keine Audiodateien.
4. **Figuren:** Ein Gelenkskelett (Winkel pro Gelenk) wird nach Pose-Daten als SVG gezeichnet. Die Animation interpoliert zwischen den Schlüsselposen. Es gibt keine Bilddateien pro Übung.
5. **Speicher:** `localStorage`, nur für Komfort (letzter Modus, letzte Grunddauer pro Modus). Ohne Speicher funktioniert die App mit Standardwerten.
6. **Zielplattform:** Chrome auf Android, aktuelle Version. Andere Browser sollen funktionieren, werden aber nicht gezielt getestet.
7. **UI-Sprache:** Deutsch. Die Übungsnamen bleiben im Original (z. B. „Lymphatic Hops“).

## Objective

Eine installierbare Web-App führt den Nutzer jeden Morgen durch eine feste Bewegungsroutine. Jede Übung erscheint als animierte Strichfigur mit großem Countdown. Töne kündigen jeden Wechsel an. Der Ablauf: Modus und Grunddauer wählen, Start drücken, Handy hinlegen und bis zum Ende nichts mehr berühren.

**Nutzer:** zunächst eine Person (der Besitzer) auf einem Android-Handy, später eventuell die Familie. Es gibt keine Konten und keinen Server.

### User Stories

- Als Nutzer wähle ich einen von vier Modi (Erweitert, Original, Kurz, Blutdruck).
- Als Nutzer stelle ich mit einem Regler die Grunddauer ein. Die Übungen behalten ihr Längenverhältnis zueinander, und ich sehe sofort die ungefähre Gesamtdauer.
- Als Nutzer sehe ich auf dem Startbildschirm, ob heute Tag A oder Tag B ist.
- Als Nutzer sehe ich während der Routine die animierte Figur, den Übungsnamen, einen kurzen Ausführungshinweis, den Countdown und den Fortschritt.
- Als Nutzer höre ich Töne kurz vor Ende einer Übung, beim Übungswechsel und beim Wechsel von Seite oder Halteposition.
- Als Nutzer sehe ich in der Pause zwischen zwei Übungen schon die nächste Figur.
- Als Nutzer kann ich die Routine pausieren und beenden.
- Als Nutzer installiere ich die App auf dem Homescreen und nutze sie offline.

## Fachliches Modell

### Schritte, Gewichte, Grunddauer

Jeder Modus ist eine feste Liste von **Schritten**. Ein Schritt hat:

| Feld | Bedeutung |
|---|---|
| `exerciseId` | Verweis auf die Übungsdefinition (Name, Hinweis, Posen) |
| `weight` | relative Länge; Dauer = `round(base × weight)` Sekunden |
| `maxSeconds` | empfohlene Höchstdauer dieses Schritts |
| `segments` | optional: Unterteilung mit Wechselton (siehe unten) |
| `fixedSeconds` | optional: nicht skalierter Schritt (z. B. „Aufstehen“), ausgenommen von der 30-s-Regel |
| `variant` | optional: `{ A: exerciseId, B: exerciseId }` für A/B-Tage |

**Grenzen des Reglers** (pro Modus, nur skalierte Schritte):

- `baseMin = max über alle Schritte von (30 / weight)`, damit kein Schritt unter 30 s fällt
- `baseMax = min über alle Schritte von (maxSeconds / weight)`, damit kein Schritt über seine empfohlene Höchstdauer kommt
- Beide Grenzen werden auf das 5-s-Raster gerundet: `baseMin` aufgerundet, `baseMax` abgerundet. Der Regler hat 5-s-Schritte.

**Gesamtdauer** = Summe aller Schrittdauern + 5 s Wechselpause × (Anzahl Schritte − 1). Angezeigt wird sie auf volle Minuten gerundet als „≈ 18 min“.

**Rundung:** Eine Schrittdauer ist eine ganze Zahl von Sekunden. Der Atemschritt wird auf ein Vielfaches von 10 s abgerundet (ein Atemzyklus dauert 4 s ein und 6 s aus). Segmente teilen die Dauer gleichmäßig auf, ein Rest geht an das letzte Segment.

### Segmente (Wechsel innerhalb eines Schritts)

- `sides: n`: Die Dauer wird in n gleiche Teile geteilt, an jeder Grenze ertönt der Seitenwechselton und die Figur spiegelt sich. Beispiele: Goldener Hahn mit 4 Teilen (links, rechts, links, rechts), Hüftbeuger-Dehnung mit 2.
- `holdSeconds: s`: Alle s Sekunden ertönt ein Wechselton für „absetzen/Seite wechseln“. Beispiel: Bird Dog mit 10 s.
- `breath: {in: 4, out: 6}`: Ein Atemkreis wird zur Atmung animiert und ist an den Timer gekoppelt. Es gibt keine Töne pro Atemzug.

### A/B-Tage

- `dayIndex` = Anzahl Kalendertage zwischen dem festen Startdatum **2026-01-01** und dem heutigen lokalen Datum. Gerechnet wird mit reinen Datumswerten (Jahr, Monat, Tag), damit die Zeitumstellung keinen Einfluss hat.
- Ist `dayIndex` gerade, ist Tag A, sonst Tag B.
- Ein Schritt mit `variant` nimmt die passende Übung. Der Tag wird beim Druck auf Start festgelegt und ändert sich während einer laufenden Routine nicht, auch nicht über Mitternacht.

### Modi

**Erweitert** (Standard-Grunddauer 45 s, Regler 30–60 s)

| # | Übung | Gewicht | bei 45 s | max | Segmente / Hinweis |
|---|---|---|---|---|---|
| 1 | Lymphatic Hops | 1 | 45 s | 90 s | |
| 2 | Body Wave | 1 | 45 s | 90 s | ca. 4 s pro Welle |
| 3 | Arm Swings | 1 | 45 s | 90 s | |
| 4 | Dead Arms | 1 | 45 s | 90 s | siehe offene Frage 1 |
| 5 | Trunk Twist | 1 | 45 s | 90 s | Becken bleibt frontal |
| 6 | Marching Claps | 1 | 45 s | 90 s | Hand an Gegenknie |
| 7 | Golf Swings | 1 | 45 s | 90 s | |
| 8 | Hip Hinge | 1 | 45 s | 90 s | langsam, ca. 4 s pro Wdh. |
| 9 | Ballet Squats | 1 | 45 s | 90 s | |
| 10 | Horse Stance | 2 | 90 s | 120 s | „ruhig atmen, nicht pressen“ |
| 11 | Wadenheben + Wippen | 1 | 45 s | 90 s | 1 s hoch, 3 s runter |
| 12 | Liegestütz-Leiter | 1 | 45 s | 90 s | „Stufe nach Gefühl: Wand, Platte, Knie, Boden“ |
| 13 | Wall Angels | 1 | 45 s | 90 s | |
| 14 | Goldener Hahn | 16/9 | 80 s | 120 s | `sides: 4` |
| 15 | A: Bird Dog / B: Seitstütz | 10/9 | 50 s | 100 s | A: `holdSeconds: 10`, B: `sides: 2` |
| 16 | A: Glute Bridge / B: Dead Bug | 10/9 | 50 s | 90 s | |
| 17 | Hüftbeuger-Dehnung | 4/3 | 60 s | 90 s | `sides: 2` |
| 18 | Aufstehen vom Boden | fest | 15 s | | „möglichst ohne Hände“ |
| 19 | Langsame Bauchatmung | 8/3 | 120 s | 300 s | `breath: 4/6` |

Bei 30 s dauert die Routine ≈ 13 min, bei 45 s ≈ 18 min, bei 60 s ≈ 24 min (jeweils mit Wechselpausen). Die Obergrenze von 60 s ergibt sich aus der Horse Stance (120 / 2).

**Original** (Standard 60 s, Regler 30–90 s): die 9 Originalübungen in der viralen Reihenfolge, alle mit Gewicht 1 und Höchstdauer 90 s (Horse Stance 120 s). Der Regler zeigt hier „Sekunden pro Übung“. Bei 60 s sind es ≈ 10 min.

**Kurz** (Standard 30 s, Regler 30–60 s): Übungen 1–13 aus „Erweitert“, dabei Horse Stance mit Gewicht 2, dann Goldener Hahn (Gewicht 2, `sides: 4`) und Atmung (Gewicht 2). Es gibt keinen Bodenblock und damit kein A/B. Bei 30 s sind es ≈ 10 min, siehe offene Frage 3.

**Blutdruck** (fest, ohne Regler, genau 14:00 min):

```
Horse Stance 120 s → Pause 120 s → Horse Stance 120 s → Pause 120 s →
Horse Stance 120 s → Pause 120 s → Horse Stance 120 s
Pause = Arm Swings 30 s + Dead Arms 30 s + Atmung 60 s
```

- Die 5-s-Vorschau vor jeder Horse Stance liegt innerhalb der Pause (in den letzten 5 s der Atmung). Dadurch bleibt das Studienprotokoll von 4 × 2 min Halten mit 2 min Pause exakt.
- Auf dem Startbildschirm steht der Hinweis: „Studienprotokoll: 3× pro Woche. Halten soll in der 2. Minute schwer sein. Nicht pressen. Bei unkontrolliertem Bluthochdruck vorher ärztlich abklären.“

## Bildschirme

1. **Start:**
   - Modusauswahl mit vier Kacheln
   - Regler für die Grunddauer mit Sekundenwert und „≈ N min gesamt“ (im Blutdruck-Modus stattdessen fest „14 min“)
   - Anzeige „Heute: Tag A/B“ (nur im Modus Erweitert)
   - Liste der Übungen mit Einzeldauer, einklappbar
   - großer Start-Button
2. **Routine:**
   - große animierte Figur
   - Übungsname, ein Satz Ausführungshinweis
   - großer Countdown
   - Kopfzeile: Fortschritt („7 / 19“), Restzeit gesamt und oben rechts ✕ „Routine beenden“, räumlich getrennt von den häufig benutzten Tasten
   - Beenden fragt nach („Routine beenden?“ mit „Weitermachen“ und „Beenden“). Während der Rückfrage pausiert die Routine; „Weitermachen“ stellt den vorherigen Zustand wieder her.
   - Steuerleiste unten wie bei einem Musikplayer: ⏮ | Pause/Fortsetzen | ⏭ im Verhältnis 1 : 1,5 : 1, mindestens 64 px hoch, Icons als SVG
     - ⏭ springt an den Anfang der nächsten Übung, in einer Wechselpause in die angekündigte; in der letzten Übung deaktiviert.
     - ⏮ startet nach mehr als 3 s die aktuelle Übung neu, sonst geht es zur vorherigen (in der ersten: von vorn; in einer Wechselpause: zur gerade beendeten).
     - Ein Sprung behält den Pausenzustand bei.
   - Unter der Steuerleiste: „Nächste: <Name>“ bzw. „Letzte Übung“ – zeigt, wohin ⏭ führt
   - In der 5-s-Wechselpause steht „Gleich: <Name>“ und die nächste Figur wird gezeigt.
3. **Fertig:** „Geschafft“, tatsächliche Dauer, Button zurück zum Start.

Alle Texte und der Countdown sollen aus etwa 2 m Abstand lesbar sein. Die Bildschirme funktionieren im Hoch- und im Querformat. Für Dunkel- und Hellmodus gilt `prefers-color-scheme`.

## Farbpalette

Die Farbwerte stammen aus dem shadcn-Preset `b5fybI` (`npx shadcn@latest init --preset b5fybI`: Style `base-nova`, Basisfarbe `neutral`, Primärfarbe Amber). Übernommen werden **nur die Farbwerte**, als einfache CSS-Custom-Properties in `src/styles.css`. Tailwind, shadcn-Komponenten und Abhängigkeiten werden nicht übernommen. Das helle Theme liegt auf `:root`, das dunkle unter `@media (prefers-color-scheme: dark)` (im Preset heißt die Klasse `.dark`).

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.852 0.199 91.936);
  --primary-foreground: oklch(0.421 0.095 57.708);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --primary-strong: oklch(0.681 0.162 75.834);   /* Preset: --sidebar-primary */
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --primary: oklch(0.795 0.184 86.047);
    --primary-foreground: oklch(0.421 0.095 57.708);
    --secondary: oklch(0.274 0.006 286.033);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);
    --primary-strong: oklch(0.795 0.184 86.047);
  }
}
```

**Verwendung:**

| Element | Token |
|---|---|
| Seitenhintergrund / Text | `--background` / `--foreground` |
| Modus-Kacheln, Übungsliste | `--card`, Rand `--border`; gewählte Kachel mit Rand `--primary-strong` |
| Start-Button, Reglerspur (aktiver Teil), Fortschrittsbalken | `--primary`, Schrift `--primary-foreground` |
| Strichfigur | Linien `--foreground`; Seite, die gerade arbeitet, bei Seitenwechseln `--primary-strong` |
| Hilfsobjekte (Wand, Stuhl, Bodenlinie) | `--muted-foreground` |
| Countdown | `--foreground`; letzte 3 s `--primary-strong` |
| Hinweistexte, Vorschau „Gleich: …“ | `--muted-foreground` |
| Atemkreis | Fläche `--primary` mit Deckkraft, Rand `--primary-strong` |
| Beenden-Button | `--secondary` / `--secondary-foreground` |
| Blutdruck-Warnhinweis | Text `--destructive` |
| Fokus-Ring | `--ring` |

- **Kontrast:** Amber auf Weiß ist als *Textfarbe* zu schwach. Deshalb steht Text auf `--primary` immer in `--primary-foreground`, und `--primary` wird nie als Schriftfarbe auf hellem Hintergrund verwendet.
- **Abrundung:** Der Eckenradius aus dem Preset (`--radius: 0.625rem`) wird ebenfalls übernommen.
- **Schrift:** Die Schrift (Inter Variable) gehört nicht zur Palette und wird nicht übernommen. Es gilt der System-Font-Stack, siehe offene Frage 4.

## Töne

| Ereignis | Ton |
|---|---|
| 3, 2, 1 s vor Schrittende | kurzer Piepton, tief |
| Ende eines Schritts (nicht des letzten) | längerer Ton, hoch |
| Seitenwechsel / Haltewechsel (Segmentgrenze) | Doppelton, mittel |
| Ende der Routine | drei kurze, gleiche Töne (hoch) |

- Der `AudioContext` wird beim Tippen auf Start erzeugt bzw. fortgesetzt. Das ist die einzige Nutzergeste, die nötig ist.
- Lautstärke: fest und angenehm. Eine Lautstärkeeinstellung gibt es in V1 nicht, es gilt die Systemlautstärke.

## Display und Zeitmessung

- Bei Start wird ein Screen-Wake-Lock (`navigator.wakeLock.request('screen')`) angefordert. Nach `visibilitychange` wird er erneut angefordert, bei Pause, Ende oder Beenden freigegeben.
- Der Timer zieht keine Ticks herunter, sondern rechnet aus Zeitstempeln (`performance.now()`). Ein verzögertes Frame verfälscht deshalb keine Dauer.
- Geht die App in den Hintergrund, pausiert die Routine automatisch und setzt nach dem Antippen von „Weiter“ fort. Vorbedingung ist, dass sie nicht unbemerkt weiterläuft.

## Figuren

- Das Skelett hat Kopf, Rumpf, Ober- und Unterarme, Ober- und Unterschenkel und Füße. Eine Pose besteht aus Gelenkwinkeln, Wurzelposition und Wurzelrotation, damit auch liegende und kniende Posen möglich sind (Bodenblock).
- Jede Übung hat 2–3 Schlüsselposen (A/B/C wie im Bericht), eine Schleifendauer (z. B. Hops 0,5 s, Body Wave 4 s) und eine Abfolge (z. B. A→B→A oder A→B→C→B). Die Atmung koppelt ihre Schleife an den 10-s-Atemzyklus.
- Gezeichnet wird mit SVG-Linien und runden Enden plus einem Kreis als Kopf, ohne Gesicht, Kleidung oder Texturen. Zusätzlich gibt es dezente Bodenlinie und Hilfsobjekte wie Wand, Türrahmen oder Stuhl, wo die Übung sie braucht (Wall Angels, Wadenheben, Liegestütz an der Wand).
- Bei Segmentwechseln (`sides`) wird die Figur gespiegelt.
- Gilt `prefers-reduced-motion`, wird die Animation verlangsamt, aber nicht abgeschaltet, denn die Bewegung ist der Inhalt.

## Tech Stack

- TypeScript 5.9 (strict), Vite 8.x, `vite-plugin-pwa` (Workbox)
- Tests: Vitest 5.x; Playwright für einen E2E-Rauchtest
- Keine Laufzeitabhängigkeiten außer dem Service-Worker-Runtime von Workbox
- Bekannt (Stand 2026-11-20): `npm audit` meldet 4 „moderate“ Lücken in `glob`/`minimatch`, die über `workbox-build` nur beim Build genutzt werden. Der vorgeschlagene Fix stuft auf eine inkompatible Version zurück. Die Lücken werden akzeptiert, bis `vite-plugin-pwa` aktualisiert.

## Commands

```
Install:    npm install
Dev:        npm run dev                 # vite, http://localhost:5173
Build:      npm run build               # tsc --noEmit && vite build → dist/
Preview:    npm run preview             # Produktions-Build lokal inkl. Service Worker
Test:       npm test                    # vitest run
Test watch: npm run test:watch
E2E:        npm run e2e                 # playwright test (gegen preview)
Typecheck:  npm run typecheck           # tsc --noEmit
```

## Project Structure

```
src/
  data/exercises.ts    → Übungsdefinitionen: Name, Hinweis, Posen, Schleife
  data/modes.ts        → die vier Modi als Schrittlisten
  core/plan.ts         → buildPlan(mode, base, date) → konkrete Schritte mit Sekunden (rein, testbar)
  core/bounds.ts       → baseMin/baseMax/Gesamtdauer (rein)
  core/abDay.ts        → dayIndex, Tag A/B (rein)
  core/session.ts      → Ablauf-Zustandsautomat; Zeitquelle injiziert (rein, testbar)
  figures/skeleton.ts  → Pose → Gelenkpositionen (Vorwärtskinematik)
  figures/render.ts    → Gelenkpositionen → SVG; Interpolation zwischen Posen
  audio/beeper.ts      → Töne per Web Audio
  platform/wakeLock.ts → Wake-Lock mit Neuanforderung
  platform/storage.ts  → localStorage mit try/catch
  ui/start.ts, ui/session.ts, ui/done.ts
  main.ts
  styles.css
public/icons/          → App-Icons 192/512 + maskable
tests/                 → Vitest-Unit-Tests (*.test.ts)
e2e/                   → Playwright-Rauchtest
docs/intent/           → bestätigte Zielbeschreibung
reports/               → Rechercheberichte
```

## Code Style

```ts
// Reine Funktionen im Kern, keine DOM- oder Zeitabhängigkeit.
export function scaledSeconds(step: ScaledStep, base: number): number {
  const raw = Math.round(base * step.weight);
  return step.breath ? Math.floor(raw / 10) * 10 : raw;
}

export function baseBounds(steps: readonly Step[]): { min: number; max: number } {
  const scaled = steps.filter(isScaled);
  const min = Math.max(...scaled.map((s) => MIN_STEP_SECONDS / s.weight));
  const max = Math.min(...scaled.map((s) => s.maxSeconds / s.weight));
  return { min: ceilTo(min, BASE_STEP), max: floorTo(max, BASE_STEP) };
}
```

- `camelCase` für Funktionen und Variablen, `PascalCase` für Typen, `SCREAMING_SNAKE` für Konstanten
- Übungs-IDs in kebab-case (`horse-stance`, `golden-rooster`)
- Kein `any`, keine Klassen, wo eine Funktion reicht; Daten als `readonly`-Objekte
- Bezeichner im Code englisch, Texte in der UI deutsch

## Testing Strategy

- **Unit (Vitest), Pflicht für `core/`:**
  - Reglergrenzen und Gesamtdauer pro Modus
  - Rundung (Atmung auf 10 s, Segmentreste)
  - A/B-Tag: gerade und ungerade Tage, Monatswechsel 31. → 1., Zeitumstellung, Schaltjahr
  - Plan-Erzeugung mit Variantenauflösung
  - Zustandsautomat mit simulierter Uhr: Schrittwechsel, Segmentgrenzen, Zeitpunkte der Töne, Pause/Fortsetzen
  - Das Blutdruck-Protokoll ergibt genau 840 s und 4 Halteblöcke à 120 s.
- **Unit für `figures/`:** Jede Übung hat gültige Posen (alle Gelenke definiert). Die Interpolation bei t = 0 bzw. t = 1 ergibt exakt die Schlüsselpose.
- **E2E (Playwright, Chromium):** Startbildschirm laden, Modus wechseln, Regler bewegen und prüfen, dass sich die Gesamtdauer ändert, Start drücken, ersten Schrittwechsel mit verkürzter Testuhr abwarten.
- **Manuell auf dem Android-Handy:** Installation, Offline-Start im Flugmodus, Bildschirm bleibt 20 min an, Töne hörbar, Figuren aus 2 m erkennbar.
- **Abdeckung:** `core/` ≥ 90 % Zeilen. UI wird nur über E2E und manuell geprüft.

## Boundaries

- **Always:**
  - Tests und Typecheck vor jedem Commit
  - Kernlogik bleibt rein und ohne DOM
  - Übungsdaten entsprechen dem Bericht, Abweichungen stehen in dieser Spec
  - `localStorage`-Zugriffe in try/catch
- **Ask first:**
  - neue Abhängigkeiten
  - Hosting und Deployment einrichten
  - Übungen, Gewichte oder Höchstdauern gegenüber dieser Spec ändern
  - Wechsel des Tech-Stacks
- **Never:**
  - Tracking, Analytics oder externe Requests zur Laufzeit
  - Konten oder Server
  - Gesundheitsversprechen in der UI, die der Bericht als Mythos einstuft (z. B. „Lymph-Detox“)

## Success Criteria

1. Lighthouse meldet „installierbar“. Auf Android-Chrome lässt sich die App zum Homescreen hinzufügen und startet im Standalone-Modus.
2. Nach einmaligem Laden startet die App im Flugmodus und läuft eine komplette Routine durch.
3. Alle vier Modi sind wählbar. Erweitert, Original und Kurz haben einen Regler mit den Grenzen aus `baseBounds`, der Blutdruck-Modus hat keinen.
4. Bei jeder Reglerstellung ist jeder skalierte Schritt ≥ 30 s und ≤ `maxSeconds` (Unit-Test über alle Modi und Stellungen).
5. Die angezeigte Gesamtdauer weicht höchstens 1 min von der Summe der Schritte plus Wechselpausen ab.
6. Das Verhältnis der Schrittdauern bleibt bei jeder Grunddauer gleich, abgesehen von der Rundung auf ganze Sekunden bzw. bei der Atmung auf 10 s.
7. Der A/B-Tag ergibt sich korrekt aus der Zahl der Tage seit 2026-01-01, auch beim Monatswechsel 31. → 1.
8. Während der Routine bleibt der Bildschirm an (Wake Lock), solange die App im Vordergrund ist.
9. Töne erklingen 3/2/1 s vor Schrittende, am Schrittende, an Segmentgrenzen und am Ende der Routine. Die Abweichung beträgt höchstens 250 ms gegenüber dem Plan, bei simulierter Uhr exakt.
10. Jede Übung zeigt eine animierte Strichfigur mit ihren Schlüsselposen, aus 2 m erkennbar (manuelle Prüfung).
11. Nach Druck auf Start läuft eine komplette Routine ohne weitere Berührung bis zum Fertig-Bildschirm durch.
12. Im Blutdruck-Modus gibt es genau 4 Halteblöcke à 120 s mit je 120 s Pause dazwischen, insgesamt 14:00 min.

## Out of Scope (Deferred)

- Sicherheitsfragebogen und automatische Varianten: bewusst ausgelassen, Kandidat für V2 (z. B. für Familienmitglieder).
- Sprachansagen: Töne reichen.
- Übungen an- und abschalten, umsortieren oder einzeln in der Dauer ändern: die Reihenfolge ist fest gewollt.
- Konten, Synchronisation, Statistik, Streaks, Erinnerungen und Push-Benachrichtigungen: für ein persönliches Werkzeug nicht nötig.
- Mehrere Profile für die Familie: erst sinnvoll, wenn Familienmitglieder die App wirklich nutzen.
- iOS-Optimierung: kein iPhone im Einsatz.
- Progressionsschema (Wochen 1–4) aus dem Bericht: Die Grunddauer übernimmt das manuell.

## Open Questions

1. **Dead Arms 30 s → 45 s?** Laut Bericht dauert Dead Arms 30 s, wenn die anderen Übungen 45 s dauern. Damit wäre 45 s schon die kleinste mögliche Grunddauer, und der Modus Erweitert ließe sich *nicht* kürzen. Vorschlag: Dead Arms bekommt Gewicht 1 (45 s bei Standard), der Regler reicht dann von 30 bis 60 s. So ist es in dieser Spec angenommen.
2. **Hosting:** Damit sich eine PWA auf Android installieren lässt, muss sie über HTTPS ausgeliefert werden. Vorschlag: GitHub Pages (kostenlos, statisch). Alternativen sind Netlify oder Cloudflare Pages. Für die Entwicklung reicht `localhost` (USB-Debugging oder `vite --host` mit Port-Weiterleitung).
3. **Modus Kurz:** Der Bericht nennt ≈ 8 min. Mit den Wechselpausen ergeben sich realistisch ≈ 10 min. Soll Kurz so bleiben, oder sollen Wadenheben und Wall Angels herausfallen? Dann wären es ≈ 9 min.
4. **Schrift:** Soll die Preset-Schrift Inter Variable übernommen werden? Dafür käme `@fontsource-variable/inter` als Abhängigkeit hinzu, rund 300 KB im Offline-Cache. Ohne sie gilt der System-Font-Stack, auf Android also Roboto.

Entschieden am 2026-11-20:
- Fragen 1–3 wie vorgeschlagen: Dead Arms mit Gewicht 1, Hosting auf GitHub Pages nach Rückfrage, Kurz bleibt.
- Frage 4: **ohne Inter**, es gilt der System-Font-Stack.
