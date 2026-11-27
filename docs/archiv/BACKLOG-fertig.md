

### B-177: Ungenutzte Wisch-Helfer entfernen (Aufräumen nach B-137)
- Status: fertig
- Aufwand: S
- Idee: Seit B-137 nutzt nur noch die Testdatei `clampScroll`, `scrollEdges`, `gestureKind`, `dragScroll` in `src/viewport.js` und `VIEWPORT.tapSlop` in `src/config.js`. Samt ihrer Unit-Tests entfernen (Testlöschung freigegeben vom Menschen 2026-11-27). Dazu Token für die Handy-Bedienspalte (104 px, `--col` in `style.css`) ins Design-System.
- Akzeptanzkriterien:
  - Keine Wisch-Funktionen mehr im Code, `npm test` und e2e grün, Spalte als Token in `docs/design/system/`.

### B-167: Fledermäuse: Flieger, die Kanone und Frost nicht treffen (Spiel-Logik)
- Status: fertig
- Aufwand: M
- Idee: Einfachere Variante von B-036 (ersetzt sie): Fledermäuse folgen dem normalen Weg (kein eigener Luftweg, `path.js` bleibt), fliegen aber. Türme haben `hitsAir`: Pfeil, Scharfschütze und Blitz ja; Kanone und Frost nein (auch kein Flächenschaden, keine Verlangsamung). Der Kettenblitz kann auf Fledermäuse überspringen. Fähigkeiten (Meteor, Kälteschock) treffen sie.
- Werte als Vorschlag in `ENEMY_TYPES.bat`: hp 30, speed 1.8, reward 3, leak 1. Kommen in Schwärmen von 6 bis 10.
- Akzeptanzkriterien:
  - Tests: Kanone und Frost zielen nicht auf Fledermäuse, und der Flächenschaden der Kanone verletzt sie nicht. Pfeil und Scharfschütze treffen sie, und der Kettenblitz springt auf sie über.
  - Die Turm-Info zeigt "Trifft Flieger" bzw. "Trifft keine Flieger". Die Fledermaus hat eine eigene Figur und einen Bodenschatten, der unter ihr versetzt liegt (damit man sieht, dass sie fliegt).
  - Wann sie in den Wellen vorkommen, regelt B-171.

### B-168: Irrlicht: weicht langsamen Geschossen aus (Spiel-Logik)
- Status: fertig
- Aufwand: M
- Idee: Ein flackerndes Licht, das in großen Abständen läuft (nie in Klumpen). Geschosse mit `projectileSpeed` unter `dodgeBelow` (z. B. 11, das trifft Kanone 7 und Frost 10) verfehlt es mit `dodgeChance` (z. B. 0,7). Flächenschaden nimmt es nicht, Rückstoß wirkt nicht. Blitz (sofort), Pfeil (12) und Scharfschütze (30) treffen normal.
- Werte als Vorschlag: hp 60, speed 1.5, reward 6, Abstand beim Erscheinen 1,5 s.
- Akzeptanzkriterien:
  - Tests mit festem Zufall (Seed): Ausweichen nur bei langsamen Geschossen, kein Flächenschaden und kein Rückstoß; Blitz und Pfeil treffen immer.
  - Ein ausgewichenes Geschoss zeigt sichtbar "Verfehlt" (kurzes Aufflackern). Alle Zahlen stehen in `config.js`.

### B-169: Panzerkäfer: Schale fängt die ersten Treffer ab (Spiel-Logik)
- Status: fertig
- Aufwand: M
- Idee: Eine Schale mit `shellHits` Schichten (z. B. 5). Jeder Treffer nimmt eine Schicht ab und macht keinen Schaden, egal wie stark er ist. Viele kleine Treffer (Pfeil mit Aufwärmen, jeder Sprung des Kettenblitzes) knacken die Schale schnell. Große Einzeltreffer (Kanone, Scharfschütze) verpuffen an ihr. Flächenschaden zählt als ein Treffer je Käfer. Verlangsamung wirkt auch auf die Schale.
- Werte als Vorschlag: hp 120, speed 1.0, reward 10, leak 2. Laufen in Gruppen von 3 bis 5 mit den Trollen.
- Akzeptanzkriterien:
  - Tests: Die ersten `shellHits` Treffer machen 0 Schaden und danach normalen Schaden. Jeder Sprung des Kettenblitzes zählt als ein Treffer. Der Scharfschütze ignoriert zwar Rüstung, aber nicht die Schale.
  - Die Schale ist sichtbar (Schichten bzw. Risse); fällt die letzte Schicht, gibt es einen Splitter-Effekt.

### B-170: Glutling: immun gegen Verlangsamung und Einfrieren (Spiel-Logik)
- Status: fertig
- Aufwand: S
- Idee: Ein schneller Feuergeist (`slowImmune: true`): Frost-Treffer machen nur ihren kleinen Schaden, es gibt kein Verlangsamen und kein Einfrieren. Der Kälteschock wirkt nur halb. Auf der Vulkankarte kommt er öfter vor (`themed`).
- Werte als Vorschlag: hp 70, speed 2.0, reward 6.
- Akzeptanzkriterien:
  - Tests: Frost verlangsamt nicht und friert nicht ein, der Kälteschock wirkt mit halber Stärke.
  - Die Turm-Info des Frostturms nennt die Ausnahme. Der Glutling hat eine eigene Figur mit Glut-Partikeln.

### B-171: Wellen-Mix mit den neuen Gegnern und Messung "jeder Turm wird gebraucht" (Balancing)
- Status: fertig
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
- Status: fertig (PR #115, 27.11.)
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
- Status: fertig (PR #115, 27.11.)
- Aufwand: M
- Idee: Die Bauvorlagen aus B-172 in `render-towers.js`, `tower-fx.js` und `render-fx.js` umsetzen, einschließlich der Optik der Stufe-3-Fähigkeiten aus B-175/B-176 (die Logik dazu kommt von dort).
- Akzeptanzkriterien:
  - Auf einem Screenshot ist die Stufe 3 sofort von der Stufe 2 zu unterscheiden (Silhouette, nicht nur Farbe).
  - Effekte haben eine Obergrenze an Partikeln (Zahl in `config.js`) und sind bei `prefers-reduced-motion` abgeschwächt.
  - Tests in `tests/render.test.js` bzw. `tests/fx.test.js` laufen; `npm test` und `npm run test:e2e` sind grün.

### B-174: Stufe 3: Scharfschütze und Blitz umsetzen, dazu der Aufstiegs-Effekt (nur Optik)
- Status: fertig (PR #115, 27.11.)
- Aufwand: M
- Idee: Wie B-173 für die übrigen zwei Türme, dazu die Lichtsäule beim Aufwerten auf Stufe 3 (auch für Pfeil, Kanone, Frost), auf Wunsch mit einem eigenen Klang (Datei wählt der Mensch).
- Akzeptanzkriterien: wie B-173. Mit 20 Türmen der Stufe 3 bleibt die Bildrate auf dem Handy-Testprofil stabil.

### B-175: Stufe 3 kann etwas Neues: Grundgerüst, Pfeil und Blitz (Spiel-Logik)
- Status: fertig (PR #115, 27.11.)
- Aufwand: M
- Idee: Jeder Turm bekommt auf Stufe 3 eine feste neue Fähigkeit (`TOWER_TYPES[typ].master` in `config.js`, Text in der Turm-Info wie bei `special`). Einfacher als die Pfadwahl aus B-039; die bleibt als spätere Erweiterung möglich. Die Kosten für Stufe 3 dürfen dafür steigen (Wert über B-171 messen). Zuerst die beiden schwachen Türme:
  - Pfeil "Adlerhorst", **Mehrfachschuss**: schießt gleichzeitig auf bis zu 3 Ziele in Reichweite (Ziel 2 und 3 mit z. B. 60 % Schaden). Das Aufwärmen gilt für das Hauptziel. Stark gegen Fledermaus-Schwärme und Panzerkäfer.
  - Blitz "Sturmspule", **Gewitter** (Wunsch des Menschen statt Überladung): Alle 3 s schlägt zusätzlich ein Blitz in den dichtesten Gegnerpulk in Reichweite ein und macht Flächenschaden (trifft auch Flieger). Werte in `config.js`. Messung 27.11.: im Mix (Kanone, Pfeil, Blitz, Frost) ist der Blitz konkurrenzfähig, als Hauptturm (2× Blitz) fällt die Strategie auf Wiese schon in Welle 5. Falls nötig auch die Grundwerte anheben.
- Akzeptanzkriterien:
  - Tests: Die Fähigkeit wirkt nur auf Stufe 3; Mehrfachschuss trifft verschiedene Ziele und nie dasselbe doppelt; Gewitter hält seinen Takt je Turm ein, trifft das Zentrum des dichtesten Pulks und alle Gegner im Radius, auch Flieger.
  - In der Turm-Info steht schon auf Stufe 2 "Auf Stufe 3: ..." als Vorschau.
  - `npm run test:balance` ist grün; die Wirkung wird in B-171 mitgemessen.

### B-176: Stufe 3 kann etwas Neues: Kanone, Frost, Scharfschütze (Spiel-Logik)
- Status: fertig (PR #115, 27.11.)
- Aufwand: M
- Idee: Wie B-175 für die übrigen Türme. Die Kanone bekommt bewusst nur eine kleine Fähigkeit, weil sie heute schon zu stark ist; Frost und Scharfschütze bekommen eine, die das Zusammenspiel mit anderen Türmen belohnt.
  - Kanone "Mörserfestung", **Brandfläche**: Die Explosion hinterlässt 2 s lang brennenden Boden mit geringem Schaden über Zeit (z. B. 15 % des Treffers je Sekunde). Gegen die Panzerkäfer-Schale zählt Brandschaden nicht als Treffer.
  - Frost "Eiszitadelle", **Eisboden** (Wunsch des Menschen statt Spröde): Am Treffpunkt bleibt z. B. 3 s lang eine Eisfläche (Radius in `config.js`), die jeden Gegner darauf verlangsamt, auch Nachzügler. Glutling und Flieger sind nicht betroffen.
  - Scharfschütze "Falkenauge", **Markieren**: Das getroffene Ziel ist 3 s lang markiert und nimmt von allen Türmen z. B. 25 % mehr Schaden. Gut gegen Bosse und Trolle zusammen mit Pfeil und Blitz.
- Akzeptanzkriterien:
  - Tests: Brandfläche (Dauer, Schaden, zählt nicht für die Schale), Eisboden (Dauer, Radius, verlangsamt nur am Boden, nicht Glutling/Flieger, kein Stapeln mit normalem Frost über das Maximum) und Markieren (Aufschlag nur solange das Ziel markiert ist).
  - Die Turm-Info zeigt die Fähigkeit, und der Zustand ist am Gegner sichtbar (Optik aus B-173/B-174).
  - Die Strategie "nur Kanone + Frost" darf durch Stufe 3 nicht wieder zur besten werden (Messung aus B-171).
- Entscheidung des Menschen: Brandfläche wirkt wie Lava durch die intakte Käfer-Schale (gewollt).

### B-179: Gegner fordernder machen, passend zu den Stufe-3-Fähigkeiten (Balancing)
- Status: fertig (PR #115, 27.11.)
- Aufwand: M
- Idee: Spieltest 27.11.: Die neuen Gegner machen Spaß, aber für einen guten Spieler ist nur Welle 5 knapp, der Rest ist leicht. Türme dürfen stärker werden (B-175/B-176), die Gegner sollen aber mitwachsen, ohne dass das Spiel zu schwer wird. Lieber mehr Abwechslung als nur mehr HP:
  - **Elite-Gegner** ab etwa Welle 8: einzelne Gegner einer Welle bekommen eine Eigenschaft (z. B. schneller, Schild, Selbstheilung) und tragen ein sichtbares Abzeichen. Werte in `config.js`.
  - **Gemischtere Wellen** in der Mitte (Welle 6 bis 12), damit nicht nur Welle 5 die einzige harte Stelle ist. Die Spitze bei Welle 5 eher glätten als verschärfen.
  - Erst danach, falls nötig: HP-Zuwachs leicht anheben.
- Akzeptanzkriterien:
  - Läuft im selben Block wie B-175/B-176 oder direkt danach und wird gemeinsam gemessen: Stärkste Strategie (Kanonen-Mix mit Fähigkeiten) und perfektes Spiel gewinnen weiter auf jeder Karte; einfache Strategien verlieren spätestens in der Spätphase.
  - Tests für Elite-Eigenschaften in `tests/game`; `npm run test:balance` grün.

### B-180: Nekromantin als echter Endboss (Balancing + Optik)
- Status: fertig (PR #115, 27.11.)
- Aufwand: M
- Idee: Spieltest 27.11.: Die Nekromantin wirkt nicht wie ein Endboss (heute 1000 HP, ruft alle 8 s zwei Skelette). Zwei Teile:
  - **Buff:** z. B. unter 50 % HP eine zweite Phase: ruft schneller und mehr Skelette, kurzer Schutzschild beim Phasenwechsel. Zusätzlich HP oder Rüstung anheben, nach Messung. Werte in `config.js`.
  - **Design:** neuer Entwurf durch den `designer` (`/design`): größer als normale Gegner, Umhang, Stab mit Leuchten, Aura am Boden, eigener Effekt beim Phasenwechsel und Lebensbalken als Boss-Leiste. Erst Skizze in Claude Design, dann Bauvorlage.
- Akzeptanzkriterien:
  - Tests: Phasenwechsel genau einmal bei der Schwelle, Beschwörungstakt der zweiten Phase, Schild-Dauer.
  - Gemeinsam mit B-179 messen: perfektes Spiel gewinnt weiter auf jeder Karte.
  - Optik nach Design-System „Gemalt und warm“; Screenshot Desktop und Handy.
- Entscheidungen des Menschen (27.11.): Boss-Leiste gilt für alle Bosse (auch Oger-König); die 14 neuen Tokens des designers (necro-*, boss-bar, boss-shield, bolt, cloud, soot, mark, elite-ring) sind freigegeben. Auf dem Handy quer darf die Boss-Leiste (240 × 32, oben mittig, nicht anklickbar) als Ausnahme über Feldkacheln liegen. Stufe 3 der Türme wird eine komplette Verwandlung (neues Gebäude): Entwürfe Adlerhorst (Marmor/Gold), Mörserfestung (Basalt/Lava), Eiszitadelle (Eispalast), Falkenauge (Ziegel-Leuchtturm), Sturmspule (Eisen-Dreibein mit Gewitterwolke) am 27.11. freigegeben. Weitere 13 Tokens (marble-a/-b/-c, ice-deep, brick-a/-b/-line, darkwood-a/-b, iron-a/-b, copper-a, electric) freigegeben.
