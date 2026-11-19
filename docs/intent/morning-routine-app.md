# Statement of Intent: Morgenroutine-Web-App

Bestätigt am 2026-11-20. Grundlage: `reports/Tai Chi Morgenroutine Analyse.md`.

- **Ziel:** Installierbare, offline nutzbare Web-App (PWA) für Android, die durch die Morgenroutine mit fester Reihenfolge führt. Jede Übung wird als SVG-Strichfigur dargestellt, die zwischen den Schlüsselpositionen (A/B/C) animiert wird.
- **Modi:**
  - **Erweitert:** ca. 16 min laut Bericht, mit A/B-Wechsel im Bodenblock.
  - **Original:** 9 Übungen, alle gleich lang, Standard 60 s.
  - **Kurz:** ca. 8 min.
  - **Blutdruck:** fest nach Studienprotokoll, 4 × 2 min halten mit je 2 min Pause, ca. 14 min.
- **Timer:**
  - Zu Beginn wird die Grunddauer eingestellt. Alle Übungen skalieren im gleichen Verhältnis, die ungefähre Gesamtdauer wird live angezeigt.
  - Die Untergrenze des Reglers bestimmt die kürzeste Übung, sodass keine Übung unter 30 s fällt.
  - Die Obergrenze bestimmt die Übung, die zuerst ihre empfohlene Höchstdauer erreicht.
  - Im Blutdruck-Modus gibt es keinen Regler.
- **A/B-Tage:** Gezählt werden die Tage seit einem festen Startdatum. Gerade Zahl = A, ungerade Zahl = B.
- **Ablauf:**
  - 5 s Wechselpause mit Vorschau der nächsten Figur.
  - Töne kurz vor dem Ende und beim Wechsel von Übung, Seite oder Halteposition.
  - Der Bildschirm bleibt während der Routine an.
- **Nutzer:** zunächst nur der Besitzer, später eventuell die Familie. Keine Konten, Einstellungen werden lokal gespeichert.
- **Erfolg:** Modus und Grunddauer einstellen, Start drücken, Handy hinlegen und die ganze Routine ohne erneute Berührung durchlaufen.
- **Nicht im Umfang:**
  - Sicherheitsfragebogen
  - Sprachansagen
  - Übungen an- oder abschalten oder umsortieren
  - Dauer pro einzelner Übung
  - Konten, Synchronisation, Statistiken, Streaks
  - iOS-Optimierung
