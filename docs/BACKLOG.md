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

### B-167: Fledermäuse: Flieger, die Kanone und Frost nicht treffen (Spiel-Logik)
- Status: entwurf
- Aufwand: M
- Idee: Einfachere Variante von B-036 (ersetzt sie): Fledermäuse folgen dem normalen Weg (kein eigener Luftweg, `path.js` bleibt), fliegen aber. Türme haben `hitsAir`: Pfeil, Scharfschütze und Blitz ja; Kanone und Frost nein (auch kein Flächenschaden, keine Verlangsamung). Der Kettenblitz kann auf Fledermäuse überspringen. Fähigkeiten (Meteor, Kälteschock) treffen sie.
- Werte als Vorschlag in `ENEMY_TYPES.bat`: hp 30, speed 1.8, reward 3, leak 1. Kommen in Schwärmen von 6 bis 10.
- Akzeptanzkriterien:
  - Tests: Kanone und Frost zielen nicht auf Fledermäuse, und der Flächenschaden der Kanone verletzt sie nicht. Pfeil und Scharfschütze treffen sie, und der Kettenblitz springt auf sie über.
  - Die Turm-Info zeigt "Trifft Flieger" bzw. "Trifft keine Flieger". Die Fledermaus hat eine eigene Figur und einen Bodenschatten, der unter ihr versetzt liegt (damit man sieht, dass sie fliegt).
  - Wann sie in den Wellen vorkommen, regelt B-171.

### B-168: Irrlicht: weicht langsamen Geschossen aus (Spiel-Logik)
- Status: entwurf
- Aufwand: M
- Idee: Ein flackerndes Licht, das in großen Abständen läuft (nie in Klumpen). Geschosse mit `projectileSpeed` unter `dodgeBelow` (z. B. 11, das trifft Kanone 7 und Frost 10) verfehlt es mit `dodgeChance` (z. B. 0,7). Flächenschaden nimmt es nicht, Rückstoß wirkt nicht. Blitz (sofort), Pfeil (12) und Scharfschütze (30) treffen normal.
- Werte als Vorschlag: hp 60, speed 1.5, reward 6, Abstand beim Erscheinen 1,5 s.
- Akzeptanzkriterien:
  - Tests mit festem Zufall (Seed): Ausweichen nur bei langsamen Geschossen, kein Flächenschaden und kein Rückstoß; Blitz und Pfeil treffen immer.
  - Ein ausgewichenes Geschoss zeigt sichtbar "Verfehlt" (kurzes Aufflackern). Alle Zahlen stehen in `config.js`.

### B-169: Panzerkäfer: Schale fängt die ersten Treffer ab (Spiel-Logik)
- Status: entwurf
- Aufwand: M
- Idee: Eine Schale mit `shellHits` Schichten (z. B. 5). Jeder Treffer nimmt eine Schicht ab und macht keinen Schaden, egal wie stark er ist. Viele kleine Treffer (Pfeil mit Aufwärmen, jeder Sprung des Kettenblitzes) knacken die Schale schnell. Große Einzeltreffer (Kanone, Scharfschütze) verpuffen an ihr. Flächenschaden zählt als ein Treffer je Käfer. Verlangsamung wirkt auch auf die Schale.
- Werte als Vorschlag: hp 120, speed 1.0, reward 10, leak 2. Laufen in Gruppen von 3 bis 5 mit den Trollen.
- Akzeptanzkriterien:
  - Tests: Die ersten `shellHits` Treffer machen 0 Schaden und danach normalen Schaden. Jeder Sprung des Kettenblitzes zählt als ein Treffer. Der Scharfschütze ignoriert zwar Rüstung, aber nicht die Schale.
  - Die Schale ist sichtbar (Schichten bzw. Risse); fällt die letzte Schicht, gibt es einen Splitter-Effekt.

### B-170: Glutling: immun gegen Verlangsamung und Einfrieren (Spiel-Logik)
- Status: entwurf
- Aufwand: S
- Idee: Ein schneller Feuergeist (`slowImmune: true`): Frost-Treffer machen nur ihren kleinen Schaden, es gibt kein Verlangsamen und kein Einfrieren. Der Kälteschock wirkt nur halb. Auf der Vulkankarte kommt er öfter vor (`themed`).
- Werte als Vorschlag: hp 70, speed 2.0, reward 6.
- Akzeptanzkriterien:
  - Tests: Frost verlangsamt nicht und friert nicht ein, der Kälteschock wirkt mit halber Stärke.
  - Die Turm-Info des Frostturms nennt die Ausnahme. Der Glutling hat eine eigene Figur mit Glut-Partikeln.

### B-171: Wellen-Mix mit den neuen Gegnern und Messung "jeder Turm wird gebraucht" (Balancing)
- Status: entwurf
- Aufwand: M
- Idee: B-167 bis B-170 in `waveFor` einbauen (Vorschlag: Fledermäuse ab Welle 6, Glutlinge ab 8, Irrlichter ab 10, Panzerkäfer ab 11). Je Karte über `themed` andere Schwerpunkte, damit nicht jede Karte dieselbe Lösung hat.
- Messung in `tests/balance/`:
  - Neue Strategie "nur Kanone + Frost" (z. B. `['cannon','cannon','frost','cannon']`): Sie darf Welle 20 nicht mehr ohne Lebensverlust schaffen (vorher messen und den Wert festhalten).
  - Jede Karte bleibt perfekt spielbar (siehe "Perfektes Spiel möglich"); die perfekte Reihenfolge enthält Pfeil oder Blitz.
  - Ziel "recht schwer, aber gut" bleibt: Die stärkste Mischung wird mitgemessen und darf nicht leichter werden als heute.
- Freiwillig, nur wenn die Messung es zeigt: Die Kanone wird leicht abgeschwächt, z. B. fällt ihr Flächenschaden zum Rand hin auf 50 % ab. Darüber entscheidet der Mensch gesondert.
- Akzeptanzkriterien:
  - `npm run test:balance` ist grün mit den neuen Messungen. Die Wellen-Vorschau zeigt die neuen Gegner mit Symbol.

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
