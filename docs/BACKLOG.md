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
Reihenfolge (je Zeile eine eigene Sitzung mit `/pipeline`, dazwischen `/clear`). Spur C kann parallel in einer zweiten Sitzung laufen, weil sie nur `render*`/`*-fx.js` berührt. Spur A und B ändern beide `game.js`/`config.js` und laufen deshalb nacheinander:
- Spur A, Gegner: 1. B-170 → 2. B-167 → 3. B-168 → 4. B-169 → 5. B-171 (braucht alle vier)
- Spur B, Stufe-3-Fähigkeiten (nach Spur A, weil sie Schale und Glutling nutzt): 6. B-175 → 7. B-176, danach `npm run test:balance` mit den Messungen aus B-171
- Spur C, Optik: B-172 (designer, sofort möglich) → B-173 und B-174 (nach B-175/B-176 für die Fähigkeits-Optik)

### B-172: Stufe 3 als eigene Gestalt: Skizzen für alle fünf Türme (Design)
- Status: entwurf
- Aufwand: S
- Idee: Der `designer` skizziert für jeden Turm die Stufe 3 als eigene Gestalt (keine Feinarbeit, nur zum Vorstellen) in der Bauteil-Bibliothek in Claude Design und schreibt dazu je eine Bauvorlage für den `developer`. Vorschläge:
  - Pfeil → "Adlerhorst": höher, mit Wimpel und Adlerkopf; die Pfeile ziehen eine helle Spur.
  - Kanone → "Mörserfestung": Doppelrohr auf einem Steinsockel; beim Schuss eine Rauchwolke, die Explosion mit Feuerring und kurzem Rußfleck.
  - Frost → "Eiszitadelle": ein schwebender, sich drehender Kristall, dezenter Frostnebel am Fuß; eingefrorene Gegner stecken im Eisblock.
  - Scharfschütze → "Falkenauge": Fernrohr mit Glanz; kurz vor dem Schuss ein Zielstrahl, dann eine Leuchtspur über die ganze Strecke.
  - Blitz → "Sturmspule": eine Spule mit Kugel und ständigem leisen Knistern; der Kettenblitz ist dicker und verästelt, am Boden blitzt es kurz hell.
  - Für alle gilt: Beim Aufwerten auf Stufe 3 gibt es eine Lichtsäule (Aufstiegs-Effekt). Die Figur bleibt im 20x14-Raster und auch auf dem Handy erkennbar.
  - Auch die neuen Fähigkeiten der Stufe 3 aus B-175/B-176 brauchen eine Optik (Mehrfachschuss, Brandfläche, Frostaura, Markierung, Überladung). Die Skizzen zeigen sie mit.
- Akzeptanzkriterien:
  - Je Turm eine Fläche "Stufe 1/2/3 nebeneinander" in Claude Design. Die Farben kommen aus `docs/design/system/`.

### B-173: Stufe 3: Pfeil, Kanone und Frost umsetzen (nur Optik)
- Status: entwurf
- Aufwand: M
- Idee: Die Bauvorlagen aus B-172 in `render-towers.js`, `tower-fx.js` und `render-fx.js` umsetzen, einschließlich der Optik der Stufe-3-Fähigkeiten aus B-175/B-176 (die Logik dazu kommt von dort).
- Akzeptanzkriterien:
  - Auf einem Screenshot ist die Stufe 3 sofort von der Stufe 2 zu unterscheiden (Silhouette, nicht nur Farbe).
  - Effekte haben eine Obergrenze an Partikeln (Zahl in `config.js`) und sind bei `prefers-reduced-motion` abgeschwächt.
  - Tests in `tests/render.test.js` bzw. `tests/fx.test.js` laufen; `npm test` und `npm run test:e2e` sind grün.

### B-174: Stufe 3: Scharfschütze und Blitz umsetzen, dazu der Aufstiegs-Effekt (nur Optik)
- Status: entwurf
- Aufwand: M
- Idee: Wie B-173 für die übrigen zwei Türme, dazu die Lichtsäule beim Aufwerten auf Stufe 3 (auch für Pfeil, Kanone, Frost), auf Wunsch mit einem eigenen Klang (Datei wählt der Mensch).
- Akzeptanzkriterien: wie B-173. Mit 20 Türmen der Stufe 3 bleibt die Bildrate auf dem Handy-Testprofil stabil.

### B-175: Stufe 3 kann etwas Neues: Grundgerüst, Pfeil und Blitz (Spiel-Logik)
- Status: entwurf
- Aufwand: M
- Idee: Jeder Turm bekommt auf Stufe 3 eine feste neue Fähigkeit (`TOWER_TYPES[typ].master` in `config.js`, Text in der Turm-Info wie bei `special`). Einfacher als die Pfadwahl aus B-039; die bleibt als spätere Erweiterung möglich. Die Kosten für Stufe 3 dürfen dafür steigen (Wert über B-171 messen). Zuerst die beiden schwachen Türme:
  - Pfeil "Adlerhorst", **Mehrfachschuss**: schießt gleichzeitig auf bis zu 3 Ziele in Reichweite (Ziel 2 und 3 mit z. B. 60 % Schaden). Das Aufwärmen gilt für das Hauptziel. Stark gegen Fledermaus-Schwärme und Panzerkäfer.
  - Blitz "Sturmspule", **Überladung**: Jeder 4. Schlag betäubt alle Getroffenen der Kette kurz (z. B. 0,4 s, Bosse 0,1 s). Das wirkt auch auf Glutlinge, ist also der einzige Stopp gegen sie.
- Akzeptanzkriterien:
  - Tests: Die Fähigkeit wirkt nur auf Stufe 3; Mehrfachschuss trifft verschiedene Ziele und nie dasselbe doppelt; Überladung zählt die Schläge je Turm, betäubt die ganze Kette und berücksichtigt den Boss-Faktor.
  - In der Turm-Info steht schon auf Stufe 2 "Auf Stufe 3: ..." als Vorschau.
  - `npm run test:balance` ist grün; die Wirkung wird in B-171 mitgemessen.

### B-176: Stufe 3 kann etwas Neues: Kanone, Frost, Scharfschütze (Spiel-Logik)
- Status: entwurf
- Aufwand: M
- Idee: Wie B-175 für die übrigen Türme. Die Kanone bekommt bewusst nur eine kleine Fähigkeit, weil sie heute schon zu stark ist; Frost und Scharfschütze bekommen eine, die das Zusammenspiel mit anderen Türmen belohnt.
  - Kanone "Mörserfestung", **Brandfläche**: Die Explosion hinterlässt 2 s lang brennenden Boden mit geringem Schaden über Zeit (z. B. 15 % des Treffers je Sekunde). Gegen die Panzerkäfer-Schale zählt Brandschaden nicht als Treffer.
  - Frost "Eiszitadelle", **Spröde**: Eingefrorene und verlangsamte Gegner nehmen von allen Türmen z. B. 20 % mehr Schaden (nicht der Glutling). Frost wird so zum Verstärker statt zum Allheilmittel.
  - Scharfschütze "Falkenauge", **Markieren**: Das getroffene Ziel ist 3 s lang markiert und nimmt von allen Türmen z. B. 25 % mehr Schaden. Gut gegen Bosse und Trolle zusammen mit Pfeil und Blitz.
- Akzeptanzkriterien:
  - Tests: Brandfläche (Dauer, Schaden, zählt nicht für die Schale), Spröde und Markieren (Aufschlag nur solange der Zustand gilt; Spröde und Markieren zusammen multiplizieren sich, Obergrenze in `config.js`).
  - Die Turm-Info zeigt die Fähigkeit, und der Zustand ist am Gegner sichtbar (Optik aus B-173/B-174).
  - Die Strategie "nur Kanone + Frost" darf durch Stufe 3 nicht wieder zur besten werden (Messung aus B-171).
