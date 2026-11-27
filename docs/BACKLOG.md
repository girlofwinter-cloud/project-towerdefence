# Backlog

Status: `offen` (Mensch hat freigegeben) → `fertig` / `blockiert`. Die Pipeline nimmt Einträge von oben nach unten.
Ideen mit Status `vorschlag` stehen in `docs/IDEEN.md`. Zum Freigeben den Eintrag hierher verschieben und `offen` setzen.

## Format
```

### B-<nr>: <Titel>
- Status: offen
- Aufwand: S | M | L
- Idee: ...
- Akzeptanzkriterien:
  - ...
```

Erledigte Einträge (`fertig`) liegen in `docs/archiv/BACKLOG-fertig.md`. Beim Abschluss eines Durchlaufs wird der Eintrag dorthin verschoben.

---

### B-064: Restliche Türme im neuen Stil (Design-Overhaul)
- Status: erledigt
- Aufwand: M
- Idee: Kanone, Frost, Scharfschütze, Blitz mit je eigener Silhouette, Stufen sichtbar in der Form.
- Akzeptanzkriterien:
  - Alle 5 Typen auf einem Screenshot an der Silhouette unterscheidbar.
  - Reichweitenkreis und Auswahlrahmen bleiben sichtbar.

### B-065: Gegner Teil 1: Goblin, Flitzer, Troll (Design-Overhaul)
- Status: erledigt
- Aufwand: M
- Idee: `render-enemies.js`: Lauf-Phasen, Kontur, Bodenschatten.
- Akzeptanzkriterien:
  - Frost-Overlay, Heil-Aura und HP-Balken unverändert.
  - Drei Typen auf Handy-Screenshot unterscheidbar; mindestens 25 % Helligkeitsabstand zum Weg.

### B-066: Gegner Teil 2: Schamane, Schildträger, weitere (Design-Overhaul)
- Status: erledigt
- Aufwand: M
- Idee: Übrige Gegnertypen (inkl. Fliegende, Splitter/Tarn, sofern vorhanden). Zustände Schild, Heilung, Eingefroren zusätzlich über Form/Symbol.
- Akzeptanzkriterien:
  - Je Typ ein Screenshot-Beleg, keine reine Farbunterscheidung.


### B-137: Handy-Layout: Querformat über den ganzen Bildschirm (Sollte)
- Status: offen
- Entscheidung Mensch 2026-11-27: Auf dem Handy ganze Karte sichtbar, kein Scrollen, kein Zoom. Querformat ist das Handy-Layout; Bedienung schwebt in den Ecken (keine Spalten, keine Leisten). Im Hochformat nur der Hinweis "Bitte Handy drehen". Ersetzt die frühere Idee (Hochformat mit Wischen/Zoom/Minikarte, Querformat mit Spalten).
- Skizze (Claude Design): https://claude.ai/artifact/MagK7pf7N7MYZwY8UNWxcj, Fläche "Querformat Vollbild (gewählt)", Tweak `variante` = "Ecken". Die anderen Flächen (Hochformat gedreht/ungedreht, Quer mit Spalten) sind verworfene Vergleiche.
- Aufwand: L
- Idee:
  - Feld in voller Höhe mittig (bei 844x390: 557x390, Kachel ca. 28 px), keine Drehung, Logik bleibt 20x14.
  - Links und rechts läuft die gemalte Landschaft (Gras, Baumrand der Karte) bis an den Bildschirmrand; keine Holzspalten. Umsetzung offen: Hintergrund seitlich breiter zeichnen oder Seiten per CSS füllen (developer entscheidet, nur Optik).
  - Bedienung schwebt über der Landschaft: oben links HUD-Plakette (Gold, Welle, Leben), oben rechts Tempo und Pause (Sound ins Pausemenü), links darunter die drei Fähigkeiten, unten rechts runder Wellenknopf mit Fortschritt. Info-Plakette (Turmwerte, Bauhinweis) nur bei Bedarf rechts.
  - Safe-Area/Notch beachten (`viewport-fit=cover`, `env(safe-area-inset-*)`), dort keine Bedienung.
  - Bauen per Tipp auf Kachel: Auswahlrahmen + Bau-Ring (wie heute), Ring wird am Rand ins Feld geschoben.
  - Hochformat: Vollbild-Hinweis "Bitte Handy drehen" mit Symbol, Spiel pausiert solange.
  - Das heutige Hochformat mit seitlichem Wischen entfällt; die Browser-Tests dazu (`tests/e2e/handy.test.mjs`) müssen angepasst werden (vor der Umsetzung Freigabe des Menschen einholen; nicht abschwächen, sondern auf das neue Verhalten umschreiben).
  - Offen für den developer/designer: HUD-Zahlen kompakter (Token `num-compact`, ca. 22 px statt 28); Fähigkeiten ohne Text nur mit `aria-label`, ggf. kurze Beschriftung bei langem Druck.
- Akzeptanzkriterien:
  - Playwright bei 844x390 und 932x430 (Touch): ganze Karte sichtbar, Seite scrollt nicht, kein Zoom nötig, alle Bedienelemente im Fenster und außerhalb der Safe-Area, kein Tippziel unter 44 px, Bau-Ring an allen 4 Feldecken im Bild, Bauen und Turm antippen klappen.
  - Bei 390x844: Hinweis "Bitte Handy drehen" sichtbar, Spiel pausiert; nach Drehen läuft es weiter.
  - Desktop (1280x800) unverändert (Screenshot-Vergleich), `npm test` und `npm run test:e2e` grün.
