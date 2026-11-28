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

---

## Entwurf 2026-11-27: Mehr Abwechslung bei den Türmen (wartet auf Freigabe durch den Menschen)
Problem: Kanone (Fläche + Rückstoß) und Frost (Verlangsamung) decken fast alles ab; Pfeil und Blitz haben kaum eine eigene Aufgabe.
Idee: Jeder neue Gegner bremst gezielt Kanone oder Frost aus und belohnt einen anderen Turm. Bis zur Freigabe steht der Status auf `entwurf`, die Pipeline nimmt nur `offen`.
Wer gegen wen: Fledermaus → Pfeil, Blitz, Scharfschütze | Irrlicht → Blitz, Pfeil | Panzerkäfer → Pfeil, Blitz | Glutling → Blitz, Pfeil, Scharfschütze.
Reihenfolge (neu 27.11., freigegeben; je Zeile eine Sitzung mit `/pipeline`, dazwischen `/clear`). **Balancing erst ganz am Ende:** Die Logik-Einträge bauen nur die Mechanik mit vorläufigen Werten in `config.js` und Unit-Tests; `npm run test:balance` darf dort rot werden, wenn es nur um Zahlen geht (im Ledger vermerken, kein Merge auf main bis Schritt 5, alles auf einem Sammel-Branch `agent/stufe3-und-gegner`).
Zwei developer parallel (je eigene Sitzung, eigener Unter-Branch von `agent/stufe3-und-gegner`, in den Sammel-Branch mergen; beide ändern `game.js`/`config.js`, aber an getrennten Stellen: Türme bzw. Gegner/Wellen):
- Spur T, Türme: 1. B-175 → 2. B-176
- Spur G, Gegner: 1. B-179 (Elite-Gegner, Wellen) → 2. B-180 Logik (Phasen der Nekromantin)
- Danach gemeinsam: Balancing-Sitzung, alles zusammen messen und Werte einstellen, dann PR und Merge auf main.
- Spur O, designer (sofort, parallel): Skizzen Stufe 3 (B-172), Entwurf Nekromantin (B-180), dazu Effekt-Skizzen für die Stufe-3-Fähigkeiten (Mehrfachschuss, Gewitter, Brandfläche, Eisboden, Markierung) und das Elite-Abzeichen (B-179). Umsetzung der Optik (B-173, B-174, Optik B-180) nach den Logik-Schritten.

### B-181: Stufe 2 sichtbar wachsen lassen (nur Optik)
- Status: entwurf
- Aufwand: M
- Idee: Heute ist Stufe 2 nur Stufe 1 plus Goldband. Stufe 1 → 2 soll sichtbar wachsen (gleicher Grundkörper, etwas höher, mehr Details), damit der Sprung zur komplett neuen Endstufe (B-173/B-174) als Steigerung wirkt. Erst Skizze durch den designer, dann Umsetzung. Nach dem Block Stufe 3/Gegner.
- Akzeptanzkriterien:
  - Je Turm ein eigener `l2`-Eintrag in `src/figures.js`; Stufe 2 auf 1280x800 sichtbar höher als Stufe 1, Fuß bleibt auf der Kachel.
  - Werte aus dem Design-System, Screenshot Desktop und Handy.

## Albtraum-Design (freigegeben vom Menschen am 28.11.2026, Entwurf: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4)
Ersetzt die Skizzen-Optik (Filter) durch das ausgearbeitete Design. Nur Optik, Mechanik unverändert. Kein dunkler Rand/Vignette. Ein Branch `agent/albtraum-design`.

### B-190: Gegner im Albtraum-Look
- Status: offen
- Aufwand: M
- Idee: Alle 13 Gegner und Elite im Albtraum nach Bauvorlage `docs/design/elemente/Gegner-Albtraum.md` (dunklerer Körper, glühende Augen, Randlicht, Fußaura je Kartenstil).
- Akzeptanzkriterien:
  - Werte aus der Bauvorlage, Zahlen in config.js, Zeichnen nur in render*.
  - Normalmodus unverändert; reduced motion beachtet; `npm test` und e2e grün.

### B-191: Kartenauswahl und Menü Aussehen im Albtraum
- Status: offen
- Aufwand: M
- Idee: Nach `Albtraum-Kartenauswahl.md` und `Kosmetik-Aussehen.md`. Vorschaubilder im Nacht-Look folgen den Karten (B-194ff).
- Akzeptanzkriterien:
  - Bestehende IDs/Klassen bleiben, e2e `albtraum`/`kosmetik` grün; Tippziele ≥ 44 px, Kontrast ≥ 4,5:1.

### B-192: Sieg- und Niederlage-Bildschirm im Albtraum
- Status: offen
- Aufwand: M
- Idee: Nach `Albtraum-Sieg.md` (einfliegende Medaille, Bedingungen mit Haken/Kreuz, Belohnung, Niederlage mit Tipp).
- Akzeptanzkriterien:
  - `#end-look` öffnet das Menü Aussehen; Desktop und Handy quer; e2e grün.

### B-193: HUD im Albtraum: Holz je Kartenstil, Plakette, Boss-Leiste, Gold-Anzeige, Medaille
- Status: offen
- Aufwand: M
- Idee: Nach `HUD-Albtraum-Holz.md`, `Albtraum-Gold-Anzeige.md`, `Albtraum-Abzeichen.md`. „Gold verpasst · ohne Fähigkeiten“ statt Durchstreichen, auch auf dem Desktop.
- Akzeptanzkriterien:
  - HUD-Holz wechselt je Karte nur im Albtraum/Nacht-Look; Normalmodus unverändert; e2e grün.

### B-194: Albtraum-Karten: Grundlage statt Filter
- Status: offen
- Aufwand: M
- Idee: Nach `Karte-Albtraum-Grundlage.md`: eigener Look je Karte statt Nacht-Filter, Vignette entfernen, Rand-Deko, Flüsse/Wege laufen über den Rand, Animationen mit reduced motion und Partikel-Obergrenze. Nacht-Look-Kosmetik nutzt denselben Look.
- Akzeptanzkriterien:
  - Keine Vignette/Abdunkelung; keine Deko auf Bauplätzen (Test); Normalmodus ohne Nacht-Look unverändert.

### B-195 bis B-199: Albtraum-Karten Wiese, Eiswelt, Zangenangriff, Zwei Fronten, Vulkan
- Status: offen
- Aufwand: je M
- Idee: Je Karte nach `Karte-<Name>-Albtraum.md` (Wiese A, Eiswelt C kalt, Zangenangriff B Steppe, Zwei Fronten C Gruft, Vulkan B Lava). Reichweitenanzeige bleibt wie heute.
- Akzeptanzkriterien:
  - Weg, Wasser/Lava, Hindernisse und Bauplätze exakt wie `MAPS`; Animationen laufen, bei reduced motion aus; Bildrate auf Handy nicht spürbar schlechter.
