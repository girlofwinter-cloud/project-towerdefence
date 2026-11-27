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

### B-172: Stufe 3 als eigene Gestalt: Skizzen für alle fünf Türme (Design)
- Status: fertig (Skizzen + Bauvorlagen in docs/design/elemente/, 27.11.)
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
- Status: offen
- Aufwand: M
- Idee: Die Bauvorlagen aus B-172 in `render-towers.js`, `tower-fx.js` und `render-fx.js` umsetzen, einschließlich der Optik der Stufe-3-Fähigkeiten aus B-175/B-176 (die Logik dazu kommt von dort).
- Akzeptanzkriterien:
  - Auf einem Screenshot ist die Stufe 3 sofort von der Stufe 2 zu unterscheiden (Silhouette, nicht nur Farbe).
  - Effekte haben eine Obergrenze an Partikeln (Zahl in `config.js`) und sind bei `prefers-reduced-motion` abgeschwächt.
  - Tests in `tests/render.test.js` bzw. `tests/fx.test.js` laufen; `npm test` und `npm run test:e2e` sind grün.

### B-174: Stufe 3: Scharfschütze und Blitz umsetzen, dazu der Aufstiegs-Effekt (nur Optik)
- Status: offen
- Aufwand: M
- Idee: Wie B-173 für die übrigen zwei Türme, dazu die Lichtsäule beim Aufwerten auf Stufe 3 (auch für Pfeil, Kanone, Frost), auf Wunsch mit einem eigenen Klang (Datei wählt der Mensch).
- Akzeptanzkriterien: wie B-173. Mit 20 Türmen der Stufe 3 bleibt die Bildrate auf dem Handy-Testprofil stabil.

### B-175: Stufe 3 kann etwas Neues: Grundgerüst, Pfeil und Blitz (Spiel-Logik)
- Status: offen
- Aufwand: M
- Idee: Jeder Turm bekommt auf Stufe 3 eine feste neue Fähigkeit (`TOWER_TYPES[typ].master` in `config.js`, Text in der Turm-Info wie bei `special`). Einfacher als die Pfadwahl aus B-039; die bleibt als spätere Erweiterung möglich. Die Kosten für Stufe 3 dürfen dafür steigen (Wert über B-171 messen). Zuerst die beiden schwachen Türme:
  - Pfeil "Adlerhorst", **Mehrfachschuss**: schießt gleichzeitig auf bis zu 3 Ziele in Reichweite (Ziel 2 und 3 mit z. B. 60 % Schaden). Das Aufwärmen gilt für das Hauptziel. Stark gegen Fledermaus-Schwärme und Panzerkäfer.
  - Blitz "Sturmspule", **Gewitter** (Wunsch des Menschen statt Überladung): Alle 3 s schlägt zusätzlich ein Blitz in den dichtesten Gegnerpulk in Reichweite ein und macht Flächenschaden (trifft auch Flieger). Werte in `config.js`. Messung 27.11.: im Mix (Kanone, Pfeil, Blitz, Frost) ist der Blitz konkurrenzfähig, als Hauptturm (2× Blitz) fällt die Strategie auf Wiese schon in Welle 5. Falls nötig auch die Grundwerte anheben.
- Akzeptanzkriterien:
  - Tests: Die Fähigkeit wirkt nur auf Stufe 3; Mehrfachschuss trifft verschiedene Ziele und nie dasselbe doppelt; Gewitter hält seinen Takt je Turm ein, trifft das Zentrum des dichtesten Pulks und alle Gegner im Radius, auch Flieger.
  - In der Turm-Info steht schon auf Stufe 2 "Auf Stufe 3: ..." als Vorschau.
  - `npm run test:balance` ist grün; die Wirkung wird in B-171 mitgemessen.

### B-176: Stufe 3 kann etwas Neues: Kanone, Frost, Scharfschütze (Spiel-Logik)
- Status: offen
- Aufwand: M
- Idee: Wie B-175 für die übrigen Türme. Die Kanone bekommt bewusst nur eine kleine Fähigkeit, weil sie heute schon zu stark ist; Frost und Scharfschütze bekommen eine, die das Zusammenspiel mit anderen Türmen belohnt.
  - Kanone "Mörserfestung", **Brandfläche**: Die Explosion hinterlässt 2 s lang brennenden Boden mit geringem Schaden über Zeit (z. B. 15 % des Treffers je Sekunde). Gegen die Panzerkäfer-Schale zählt Brandschaden nicht als Treffer.
  - Frost "Eiszitadelle", **Eisboden** (Wunsch des Menschen statt Spröde): Am Treffpunkt bleibt z. B. 3 s lang eine Eisfläche (Radius in `config.js`), die jeden Gegner darauf verlangsamt, auch Nachzügler. Glutling und Flieger sind nicht betroffen.
  - Scharfschütze "Falkenauge", **Markieren**: Das getroffene Ziel ist 3 s lang markiert und nimmt von allen Türmen z. B. 25 % mehr Schaden. Gut gegen Bosse und Trolle zusammen mit Pfeil und Blitz.
- Akzeptanzkriterien:
  - Tests: Brandfläche (Dauer, Schaden, zählt nicht für die Schale), Eisboden (Dauer, Radius, verlangsamt nur am Boden, nicht Glutling/Flieger, kein Stapeln mit normalem Frost über das Maximum) und Markieren (Aufschlag nur solange das Ziel markiert ist).
  - Die Turm-Info zeigt die Fähigkeit, und der Zustand ist am Gegner sichtbar (Optik aus B-173/B-174).
  - Die Strategie "nur Kanone + Frost" darf durch Stufe 3 nicht wieder zur besten werden (Messung aus B-171).

### B-178: Fehlende Effekte der neuen Gegner (Logik-Ereignisse + Optik)
- Status: entwurf
- Aufwand: S
- Idee: Drei Effekte aus den Bauvorlagen (`docs/design/elemente/Gegner-*.md`) fehlen, weil die Logik kein Ereignis liefert. `game.js` soll dafür nur Effekt-Einträge in `state.effects` schreiben (wie `dodge`/`shellBreak`), das Zeichnen kommt in `render-fx.js`. Spielwerte ändern sich nicht.
  - Glutling: Frostturm-Treffer erzeugt `steam` (Dampfwölkchen, kurzes Aufzischen), nicht nur beim Kälteschock.
  - Panzerkäfer: jede verlorene Schicht erzeugt `shellChip` (2 kleine Splitter); der große Bruch bleibt `shellBreak`.
  - Irrlicht: der `dodge`-Effekt bekommt Gegner-ID und Richtung, damit das seitliche Zucken (ca. 9 px) gezeichnet werden kann und je Irrlicht nur ein "Verfehlt" gleichzeitig erscheint.
- Akzeptanzkriterien:
  - Tests in `tests/game.test.js`: die drei Ereignisse entstehen genau in diesen Fällen (nicht bei Pfeil auf Glutling, nicht bei Lava auf Käfer).
  - Tests in `tests/fx.test.js`: Zeichnen ausgewogen (save/restore), robust bei kaputten Werten, abgeschwächt bei `prefers-reduced-motion`.
  - `npm test` grün, `npm run test:balance` unverändert grün.

### B-179: Gegner fordernder machen, passend zu den Stufe-3-Fähigkeiten (Balancing)
- Status: offen
- Aufwand: M
- Idee: Spieltest 27.11.: Die neuen Gegner machen Spaß, aber für einen guten Spieler ist nur Welle 5 knapp, der Rest ist leicht. Türme dürfen stärker werden (B-175/B-176), die Gegner sollen aber mitwachsen, ohne dass das Spiel zu schwer wird. Lieber mehr Abwechslung als nur mehr HP:
  - **Elite-Gegner** ab etwa Welle 8: einzelne Gegner einer Welle bekommen eine Eigenschaft (z. B. schneller, Schild, Selbstheilung) und tragen ein sichtbares Abzeichen. Werte in `config.js`.
  - **Gemischtere Wellen** in der Mitte (Welle 6 bis 12), damit nicht nur Welle 5 die einzige harte Stelle ist. Die Spitze bei Welle 5 eher glätten als verschärfen.
  - Erst danach, falls nötig: HP-Zuwachs leicht anheben.
- Akzeptanzkriterien:
  - Läuft im selben Block wie B-175/B-176 oder direkt danach und wird gemeinsam gemessen: Stärkste Strategie (Kanonen-Mix mit Fähigkeiten) und perfektes Spiel gewinnen weiter auf jeder Karte; einfache Strategien verlieren spätestens in der Spätphase.
  - Tests für Elite-Eigenschaften in `tests/game`; `npm run test:balance` grün.

### B-180: Nekromantin als echter Endboss (Balancing + Optik)
- Status: offen
- Aufwand: M
- Idee: Spieltest 27.11.: Die Nekromantin wirkt nicht wie ein Endboss (heute 1000 HP, ruft alle 8 s zwei Skelette). Zwei Teile:
  - **Buff:** z. B. unter 50 % HP eine zweite Phase: ruft schneller und mehr Skelette, kurzer Schutzschild beim Phasenwechsel. Zusätzlich HP oder Rüstung anheben, nach Messung. Werte in `config.js`.
  - **Design:** neuer Entwurf durch den `designer` (`/design`): größer als normale Gegner, Umhang, Stab mit Leuchten, Aura am Boden, eigener Effekt beim Phasenwechsel und Lebensbalken als Boss-Leiste. Erst Skizze in Claude Design, dann Bauvorlage.
- Akzeptanzkriterien:
  - Tests: Phasenwechsel genau einmal bei der Schwelle, Beschwörungstakt der zweiten Phase, Schild-Dauer.
  - Gemeinsam mit B-179 messen: perfektes Spiel gewinnt weiter auf jeder Karte.
  - Optik nach Design-System „Gemalt und warm“; Screenshot Desktop und Handy.
- Entscheidungen des Menschen (27.11.): Boss-Leiste gilt für alle Bosse (auch Oger-König); die 14 neuen Tokens des designers (necro-*, boss-bar, boss-shield, bolt, cloud, soot, mark, elite-ring) sind freigegeben. Auf dem Handy quer darf die Boss-Leiste (240 × 32, oben mittig, nicht anklickbar) als Ausnahme über Feldkacheln liegen. Stufe 3 der Türme wird eine komplette Verwandlung (neues Gebäude): Entwürfe Adlerhorst (Marmor/Gold), Mörserfestung (Basalt/Lava), Eiszitadelle (Eispalast), Falkenauge (Ziegel-Leuchtturm), Sturmspule (Eisen-Dreibein mit Gewitterwolke) am 27.11. freigegeben. Weitere 13 Tokens (marble-a/-b/-c, ice-deep, brick-a/-b/-line, darkwood-a/-b, iron-a/-b, copper-a, electric) freigegeben.

### B-181: Stufe 2 sichtbar wachsen lassen (nur Optik)
- Status: entwurf
- Aufwand: M
- Idee: Heute ist Stufe 2 nur Stufe 1 plus Goldband. Stufe 1 → 2 soll sichtbar wachsen (gleicher Grundkörper, etwas höher, mehr Details), damit der Sprung zur komplett neuen Endstufe (B-173/B-174) als Steigerung wirkt. Erst Skizze durch den designer, dann Umsetzung. Nach dem Block Stufe 3/Gegner.
- Akzeptanzkriterien:
  - Je Turm ein eigener `l2`-Eintrag in `src/figures.js`; Stufe 2 auf 1280x800 sichtbar höher als Stufe 1, Fuß bleibt auf der Kachel.
  - Werte aus dem Design-System, Screenshot Desktop und Handy.
