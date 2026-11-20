# Umsetzungsplan: Morgenroutine-PWA V1

Quell-Spec: [`SPEC.md`](../SPEC.md) (freigegeben am 2026-11-20)
Aufgabenliste: [`tasks/todo.md`](todo.md)

## Überblick

Eine installierbare, offline nutzbare PWA mit vier Modi (Erweitert, Original, Kurz, Blutdruck). Die Grunddauer wird global eingestellt, alle Übungen skalieren im gleichen Verhältnis. Jeder Schritt zeigt eine animierte SVG-Strichfigur, Töne kündigen die Wechsel an, und der Bildschirm bleibt an. Die Umsetzung folgt vertikalen Slices. Zuerst entsteht ein durchgehend lauffähiger Original-Modus mit Platzhalter-Figuren, danach kommen nacheinander Segmente, A/B-Tage, die weiteren Modi, alle Posen und die PWA-Schicht.

## Entscheidungen zu den offenen Fragen der Spec

- **Dead Arms:** Gewicht 1 (45 s bei Grunddauer 45 s). Dadurch reicht der Regler im Modus Erweitert von 30 bis 60 s.
- **Hosting:** GitHub Pages ist vorgesehen. Das Deployment (Task 16) läuft erst nach ausdrücklicher Rückfrage.
- **Modus Kurz:** bleibt wie spezifiziert (≈ 10 min).

## Architekturentscheidungen

- **Reiner Kern, dünne UI.**
  - `core/` (Grenzen, Plan, A/B, Ablauf-Zustandsautomat) hat keine DOM- und keine Zeitabhängigkeit.
  - Die Uhr wird injiziert. Dadurch lassen sich alle zeitkritischen Regeln mit einer simulierten Uhr exakt testen.
- **Der Ablauf erzeugt Ereignisse, die UI reagiert darauf.**
  - `session.tick(now)` liefert den Zustand und neue Ereignisse (`stepStart`, `countdown`, `segmentSwitch`, `done`).
  - Töne und Darstellung hängen nur an diesen Ereignissen. Das Timing ist damit ohne Audio testbar.
- **Figuren aus Daten.**
  - Eine Pose besteht aus Gelenkwinkeln plus Wurzelposition und -rotation. Die Vorwärtskinematik berechnet daraus die Punkte, die Interpolation die Zwischenbilder.
  - Neue Übungen brauchen nur Daten, keinen neuen Code.
- **Platzhalter-Figur zuerst.** Fehlen einer Übung noch Posen, zeigt die App eine neutrale Standfigur. So bleibt jeder Zwischenstand lauffähig.
- **Farbpalette aus dem shadcn-Preset `b5fybI`:** neutral plus Amber, nur als CSS-Variablen. Kein Tailwind und keine shadcn-Komponenten, damit es beim Vanilla-Stack ohne Framework bleibt. Details stehen in der Spec im Abschnitt „Farbpalette“.
- **Kein Framework.** Drei Bildschirme, DOM-Updates per kleinem Render-Helfer. Laufzeitabhängigkeit ist nur die Workbox-Runtime über `vite-plugin-pwa`.

## Abhängigkeitsgraph

```
Projekt-Setup (1)
  └── Kern: Typen, Grenzen, Plan (2)
        └── Ablauf-Zustandsautomat (3)
              ├── UI-Slice Original-Modus (4) ──┐
              ├── Skelett + Renderer (5) ───────┤
              └── Töne, Wake Lock, Hintergrund (6)
                                                 │
        Segmente (8) ── A/B + Erweitert (9) ── Kurz + Blutdruck (12)
        Posen Original (7), Posen stehend (10), Posen Boden (11)  ← benötigen (5)
                                                 │
        PWA (13) ── Politur & Speicher (14) ── E2E (15) ── [Rückfrage] Deployment (16)
```

## Task-Liste (Index; Details in `todo.md`)

### Phase 1: Fundament
- [x] Task 1: Projekt-Setup (Vite, TS strict, Vitest, Scripts)
- [x] Task 2: Kern-Typen, Reglergrenzen und Plan-Erzeugung (Original-Modus)
- [x] Task 3: Ablauf-Zustandsautomat mit simulierter Uhr

**Checkpoint A:** Tests und Typecheck grün, Kernlogik für den Original-Modus vollständig.

### Phase 2: Erste lauffähige Version
- [x] Task 4: UI-Slice: Start, Routine, Fertig im Original-Modus (Text-Countdown, Platzhalter-Figur)
- [x] Task 5: Skelett, SVG-Renderer und Interpolation (Nachweis an Arm Swings + Horse Stance)
- [x] Task 6: Töne, Wake Lock, automatische Pause im Hintergrund

**Checkpoint B:** Der Original-Modus läuft im Handy-Browser (Dev-Server) ohne Berührung durch, mit Tönen und anbleibendem Bildschirm. Danach Rückmeldung von dir.

### Phase 3: Inhalte und Modi
- [x] Task 7: Posen der 9 Originalübungen
- [x] Task 8: Segmente (Seiten, Halte-Intervalle, Atemkreis) in Kern und UI
- [x] Task 9: A/B-Tag und Modus Erweitert
- [x] Task 10: Posen der stehenden Ergänzungen inklusive Hilfsobjekte
- [x] Task 11: Posen des Bodenblocks
- [x] Task 12: Modi Kurz und Blutdruck

**Checkpoint C:** Alle vier Modi und alle Figuren sind vorhanden. Erfolgskriterien 3–7, 9, 10 und 12 sind erfüllt. Danach Rückmeldung zu den Figuren.

### Phase 4: PWA und Abschluss
- [x] Task 13: PWA: Manifest, Icons, Service Worker, Offline-Betrieb
- [x] Task 14: Politur: Lesbarkeit aus 2 m, Hoch/Quer, Dunkelmodus, Übungsliste, Speicher
- [x] Task 15: E2E-Rauchtest (Playwright)
- [ ] Task 16: Deployment auf GitHub Pages (**erst nach Rückfrage**)

**Checkpoint D:** Alle 12 Erfolgskriterien der Spec erfüllt, manuelle Prüfung auf dem Android-Handy bestanden.

## Risiken und Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Strichfiguren sind schwer erkennbar oder wirken unnatürlich, vor allem Boden- und Rotationsposen | Hoch | Renderer früh (Task 5) an zwei Übungen beweisen; Checkpoint C mit Sichtprüfung durch dich; Posen sind reine Daten und leicht nachzujustieren |
| Rotationen (Trunk Twist, Golf Swings, Dead Arms) lassen sich in 2D-Seitenansicht kaum darstellen | Mittel | Diese Übungen in Frontalansicht darstellen; Rotation über verkürzte Schulter- und Armlinien andeuten; Ansicht pro Übung in den Daten festlegen |
| Android pausiert Audio oder Timer im Hintergrund oder bei gesperrtem Bildschirm | Mittel | Wake Lock hält den Bildschirm an; Zeit aus Zeitstempeln; im Hintergrund wird automatisch pausiert (Spec) |
| `AudioContext` bleibt stumm (Autoplay-Regeln) | Mittel | Kontext beim Tippen auf Start erzeugen/fortsetzen; in Task 6 auf dem echten Gerät prüfen |
| Wake Lock wird beim App-Wechsel stillschweigend freigegeben | Niedrig | Neu anfordern bei `visibilitychange` (Spec) |
| Für die PWA-Installation auf dem Handy ist HTTPS nötig, bis zum Deployment gibt es keins | Niedrig | Für Entwicklung `chrome://inspect` mit Port-Weiterleitung (localhost gilt als sicher); Deployment in Task 16 |

## Parallelisierung

Nach Task 5 sind die Pose-Tasks 7, 10 und 11 unabhängig voneinander und von den Kern-Tasks 8, 9 und 12. Sie könnten parallel laufen. Für eine Einzelperson ist die lineare Reihenfolge aus `todo.md` am übersichtlichsten.

## Offene Fragen

- ~~Versionskontrolle~~: erledigt, `git init` wurde in Task 1 ausgeführt. Commits mache ich nur auf deinen Wunsch.
