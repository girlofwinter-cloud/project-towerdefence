

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

