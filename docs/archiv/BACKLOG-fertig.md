# Backlog-Archiv (erledigt)

Hier liegen alle Einträge mit Status `fertig`, unverändert aus `docs/BACKLOG.md` verschoben.
Agents lesen diese Datei nur bei konkretem Bedarf.

---

### B-001: Wellen-Vorschau
- Status: fertig
- Aufwand: S
- Idee: Vor dem Start einer Welle zeigt das HUD, welche Gegnertypen und wie viele kommen.
- Akzeptanzkriterien:
  - Neue reine Funktion `waveSummary(wave)` in `src/config.js` liefert z. B. `{ grunt: 8, runner: 3 }`.
  - Unit-Test für Welle 1, 5 und 10 (Boss in Welle 5 und 10).
  - HUD zeigt die Vorschau neben dem Start-Button.

### B-002: Pausefunktion
- Status: fertig
- Aufwand: S
- Idee: Taste `P` pausiert das Spiel, Bauen bleibt erlaubt.
- Akzeptanzkriterien:
  - Während der Pause ändert `update` den Zustand nicht.
  - Test: Pause, 10 Sekunden simulieren, Zustand unverändert.

### B-003: Spielgeschwindigkeit x1/x2/x3
- Status: fertig
- Aufwand: S
- Idee: Taste `F` oder ein Button schaltet die Simulationsgeschwindigkeit zwischen x1, x2 und x3 um. Spart Wartezeit bei leichten Wellen.
- Akzeptanzkriterien:
  - `SPEED_STEPS = [1, 2, 3]` steht in `src/config.js`.
  - Neue reine Funktion `stepGame(state, dt, speed)` in `src/game.js` ruft `update` in Teilschritten von höchstens 0,05 s auf (keine großen `dt`-Sprünge).
  - Test: 10 s bei x1 und 5 s bei x2 ergeben den gleichen Zustand (Gold, Kills, Lives).
  - HUD zeigt die aktuelle Geschwindigkeit.

### B-004: Zielmodus pro Turm
- Status: fertig
- Aufwand: S
- Idee: Jeder Turm hat eine Zielregel (Erster, Letzter, Stärkster, Nächster), umschaltbar per Klick oder Taste `T`. So kann der Scharfschütze gezielt Bosse jagen.
- Akzeptanzkriterien:
  - `TARGET_MODES = ['first', 'last', 'strong', 'close']` steht in `src/config.js`.
  - Neue Türme starten mit `targetMode: 'first'`.
  - `setTargetMode(state, id, mode)` lehnt unbekannte Modi ab.
  - Test: Bei 3 Gegnern in Reichweite (verschiedene `dist` und `hp`) wählt jeder Modus den erwarteten Gegner.
  - Verhalten für `first` bleibt unverändert, bestehende Tests laufen weiter.

### B-006: Heiler und Schildträger
- Status: fertig
- Aufwand: M
- Idee: Schamane heilt Gegner in der Nähe periodisch; Schildträger reduziert Pfeil-Schaden stark, wird aber vom Kanonen-Splash normal getroffen. Ab Welle 7 bzw. 9. Risiko: Balancing und O(n²)-Radiusprüfung.
- Akzeptanzkriterien:
  - `ENEMY_TYPES` bekommt `healer` (`healRadius`, `healPerSec`, `healInterval`) und `shielded` (`armor`).
  - Heilung überschreitet nie `maxHp`.
  - Test: Healer heilt verletzten Nachbarn im Radius, keinen außerhalb.
  - Test: Pfeilturm macht gegen `shielded` weniger Schaden, Kanone (Splash) voll.
  - Test: Welle 7 enthält Healer, Welle 9 Schildträger.
  - `render.js` zeigt Heil-Aura und Schild.

### B-008: Schwierigkeit anziehen (Balancing)
- Status: fertig
- Aufwand: S
- Idee: Das Spiel ist zu leicht. Nur Zahlen in `src/config.js` ändern: weniger Startgold, steilere HP-Skalierung, mehr Gegner und härtere Mischung ab der Mitte, Boss-Wellen spürbar gefährlicher. Keine neue Mechanik.
- Akzeptanzkriterien:
  - Alle Änderungen nur in `src/config.js` (`START_GOLD`, `START_LIVES`, `hpScale`, `waveFor`, `waveBonus`, Gegnerwerte).
  - Mit dem Test-Bot bzw. einer Simulation in den Tests: Eine einfache Strategie "nur Pfeiltürme, nie aufrüsten" verliert vor Welle 12.
  - Test: `hpScale` ist streng steigend, `waveFor(w)` enthält mit wachsendem `w` nie weniger Gegner.
  - Bestehende Tests werden nicht abgeschwächt. Hängt ein Test an alten Zahlen, im Bericht begründen und mit dem Menschen klären.
  - Im Ledger die alten und neuen Kernwerte nennen.

### B-009: Grafik: Gelände und Weg
- Status: fertig
- Aufwand: M
- Idee: Das Spielfeld sieht im Stil klassischer Tower-Defense-Spiele aus: Gras mit Variation, ein gepflasterter oder erdiger Weg mit Rand, Dekoration (Bäume, Büsche, Steine) auf nicht bebaubaren Kacheln, sichtbarer Ein- und Ausgang. Alles wird per Canvas-Code selbst gezeichnet, ohne Bilddateien und ohne Vorlagen aus anderen Spielen.
- Akzeptanzkriterien:
  - Nur `src/render.js` (und bei Bedarf `style.css`) ändern, keine Spiel-Logik.
  - Dekoration ist deterministisch (fester Seed oder Kachel-Hash), flackert also nicht und liegt nie auf Weg- oder bebauten Kacheln.
  - Hintergrund wird einmal auf ein Offscreen-Canvas gezeichnet und pro Frame nur kopiert (Performance).
  - Keine neuen Abhängigkeiten, keine externen Assets.
  - `npm test` bleibt grün.

### B-010: Grafik: Türme
- Status: fertig
- Aufwand: M
- Idee: Jeder Turmtyp bekommt eine eigene gezeichnete Silhouette: Pfeilturm aus Holz mit Bogen, Kanone mit Rohr auf Steinsockel, Frostturm mit Kristall, Scharfschütze als hoher Turm. Das Level ist an Aussehen oder Banner erkennbar, es gibt Schuss-Rückstoß und Schatten.
- Akzeptanzkriterien:
  - Nur `src/render.js`; Farben und Maße, die Balancing betreffen, bleiben in `config.js`.
  - Vier erkennbar verschiedene Türme, drei Level-Stufen unterscheidbar.
  - Turm dreht sich weiter zum Ziel.
  - `npm test` bleibt grün.

### B-011: Grafik: Gegner und Animation
- Status: fertig
- Aufwand: M
- Idee: Gegner sind gezeichnete Figuren statt Kreise (Goblin, Flitzer, Panzer-Troll, Oger-König), mit Schatten, Lauf-Animation und Blickrichtung entlang des Wegs. Bosse sind deutlich größer und auffälliger. HP-Balken bleibt.
- Akzeptanzkriterien:
  - Nur `src/render.js`.
  - Figuren schauen in Bewegungsrichtung, Animation läuft über `state.time`, nicht über echte Zeit.
  - Verlangsamte Gegner sind weiter erkennbar (Frost-Effekt).
  - `npm test` bleibt grün.

### B-012: Grafik: Projektile und Effekte
- Status: fertig
- Aufwand: S
- Idee: Pfeile mit Schweif, Kanonenkugeln mit Rauch, Frost-Partikel, Explosionen mit Funken und kurzem Screen-Shake, Treffer-Blitz auf Gegnern, Gold-Münzen beim Kill.
- Akzeptanzkriterien:
  - Rein visuelle Effekte in `src/render.js`. Falls Zustand für Partikel nötig ist, lebt er im Render-Modul und nicht in `game.js`.
  - Keine Auswirkung auf Spiel-Logik und Tests.
  - `npm test` bleibt grün.

### B-013: Spätphase fordernder machen
- Status: fertig
- Aufwand: M
- Idee: Seit B-008 sind die Wellen 14 bis 20 für gute Strategien verlustfrei, die Schwierigkeit konzentriert sich auf Welle 8 bis 10. Mit nur noch 3 Leben (B-019) kann man dort nicht "spürbar Leben verlieren", also soll der Druck messbar werden: Gegner sollen in der Spätphase deutlich weiter am Weg vordringen, bevor sie sterben. Das geschieht über Gegnermix und Spawn-Dichte (mehr Trolle und Flitzer ab Welle 15, Boss-Begleiter, Schildträger und Healer wirklich spürbar) statt über `hpScale`, das nur auf Messers Schneide steht. Aus dem Review von B-006: Der Schildträger (60 Basis-HP, 1 Exemplar pro Welle bis Welle 11) ist fast wirkungslos und der Healer (2 % maxHp pro Sekunde) schwach und läuft den Trollen davon.
- Akzeptanzkriterien:
  - Nur Zahlen in `src/config.js` (`waveFor`, Gegnerwerte der neuen Typen, bei Bedarf Healer-Werte). `hpScale`, `START_LIVES`, `START_GOLD`, Boss-Leak und alle Turmwerte bleiben unverändert. Keine neue Mechanik.
  - Messbarer Druck: Mit den zwei robusten Strategien (arrow,cannon,cannon,frost und cannon,arrow,arrow,frost) erreicht in den Wellen 14 bis 20 in mindestens 3 Wellen ein Gegner mehr als 60 % des Wegs (Wert nach Simulation anpassen, aber deutlich über dem heutigen Stand), per Test belegt (Simulation mit Fortschrittsmessung, `dist` relativ zur Weglänge). Beide Strategien gewinnen Welle 20 weiter bei dt 1/30 und 1/60 mit mindestens 2 Leben.
  - "Nur Pfeiltürme" verliert weiter vor Welle 12; Welle 1 verliert kein Leben; Boss-HP-Test und alle übrigen bestehenden Tests bleiben unverändert grün (Ausnahme: `waveSummary(10)`, falls Welle 10 sich ändert, nur der Erwartungswert und im Ledger genannt).
  - Schildträger zwingt zu gemischten Setups: Eine Strategie mit ausschließlich Pfeil- und Frostürmen (ohne Kanonen) schneidet in den Wellen mit Schildträgern messbar schlechter ab als mit Kanonen (Test mit zwei Läufen).
  - Troll-Belohnung prüfen (450 HP bei 14 Gold) und begründen, ob sie angepasst wird.
  - Doppelte Strategie-Tests in `tests/game.test.js` zu einem gemeinsamen Helfer bündeln, Laufzeit senken, ohne Prüfungen zu verlieren.

### B-019: Nur noch 3 Leben
- Status: fertig
- Aufwand: S
- Idee: Der Mensch will ein deutlich härteres Spiel: `START_LIVES` von 20 auf 3. Damit entscheidet schon ein einziger Durchbruch (Boss: Leak 6) über Sieg oder Niederlage. Das Balancing muss so nachgezogen werden, dass das Spiel hart, aber mit guter Strategie weiter schaffbar bleibt.
- Akzeptanzkriterien:
  - `START_LIVES = 3` in `src/config.js`. Weitere Anpassungen nur an Zahlen in `src/config.js` (Gegnerwerte, Leak, Wellen), keine neue Mechanik.
  - Die HUD-Anzeige zeigt nie weniger als 0 Leben (`game.js` begrenzt bereits auf 0).
  - Gute Strategien (die zwei robusten Reihenfolgen aus den Tests) gewinnen Welle 20 bei dt 1/30 und 1/60 mit mindestens 1 Leben. "Nur Pfeiltürme" verliert weiter vor Welle 12. Welle 1 verliert mit dem Startgold kein Leben.
  - Die drei Tests mit der festen Reserve `lives >= 8` (`tests/game.test.js`) werden durch die neue Reserve ersetzt (mindestens 1 Leben, also gewonnen). Das ist die einzige zulässige Änderung an bestehenden Tests und wird im Ledger ausdrücklich genannt. Alle anderen Tests bleiben unverändert.

### B-027: Map-Auswahl (mehrere Karten)
- Status: fertig
- Aufwand: M
- Idee: Fundament für alle Welten. `WAYPOINTS` wird zu einer Liste von Maps in `src/config.js` (Name, Wegpunkte, Farbschema, gesperrte Kacheln). Auswahlmenü vor dem Spielstart, Spielzustand und Render lesen die gewählte Map. Voraussetzung für B-028 bis B-031.
- Akzeptanzkriterien:
  - `MAPS` in `src/config.js`, bestehende Karte bleibt unverändert als erste Map.
  - `game.js` und `path.js` bekommen die Map als Parameter, kein DOM.
  - Test: Jede Map hat einen gültigen Weg (zusammenhängend, Ein- und Ausgang außerhalb, keine Überschneidung mit gesperrten Kacheln).
  - Bestehende Tests laufen unverändert.

### B-028: Welt Wald (blockierte Bauplätze)
- Status: fertig
- Aufwand: M
- Idee: Zweite Map mit Bäumen und Felsen, die Kacheln blockieren. Wenige, dafür gute Bauplätze zwingen zu Entscheidungen. Hängt von B-027 ab.
- Akzeptanzkriterien:
  - Map `forest` mit `blocked`-Kacheln; `canBuild` lehnt sie ab.
  - Test: Bauen auf blockierter Kachel scheitert, Weg ist trotzdem begehbar.
  - Deko in `src/decor.js` passend zum Thema.

### B-029: Welt Eis (Gegner-/Turm-Modifikatoren pro Map)
- Status: fertig
- Aufwand: M
- Idee: Maps können Modifikatoren tragen: In der Eiswelt sind Gegner von Grund auf etwas langsamer, der Frostturm ist schwächer, Kanone stärker. Hängt von B-027 ab.
- Akzeptanzkriterien:
  - Map-Feld `modifiers` (Gegnertempo, Turmschaden je Typ) in `src/config.js`.
  - Test: Modifikatoren wirken auf Tempo und Schaden, Standard-Map bleibt unverändert.
  - Balancing-Zahlen nur in der Config.
