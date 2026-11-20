# Backlog

Status: `vorschlag` (Idee, noch nicht freigegeben) → `offen` (Mensch hat freigegeben) → `fertig` / `blockiert`.
Die Pipeline nimmt nur Einträge mit Status `offen`, von oben nach unten.

## Format
```
### B-<nr>: <Titel>
- Status: offen
- Aufwand: S | M | L
- Idee: ...
- Akzeptanzkriterien:
  - ...
```

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
- Status: vorschlag
- Aufwand: S
- Idee: Taste `P` pausiert das Spiel, Bauen bleibt erlaubt.
- Akzeptanzkriterien:
  - Während der Pause ändert `update` den Zustand nicht.
  - Test: Pause, 10 Sekunden simulieren, Zustand unverändert.

### B-003: Spielgeschwindigkeit x1/x2/x3
- Status: vorschlag
- Aufwand: S
- Idee: Taste `F` oder ein Button schaltet die Simulationsgeschwindigkeit zwischen x1, x2 und x3 um. Spart Wartezeit bei leichten Wellen.
- Akzeptanzkriterien:
  - `SPEED_STEPS = [1, 2, 3]` steht in `src/config.js`.
  - Neue reine Funktion `stepGame(state, dt, speed)` in `src/game.js` ruft `update` in Teilschritten von höchstens 0,05 s auf (keine großen `dt`-Sprünge).
  - Test: 10 s bei x1 und 5 s bei x2 ergeben den gleichen Zustand (Gold, Kills, Lives).
  - HUD zeigt die aktuelle Geschwindigkeit.

### B-004: Zielmodus pro Turm
- Status: vorschlag
- Aufwand: S
- Idee: Jeder Turm hat eine Zielregel (Erster, Letzter, Stärkster, Nächster), umschaltbar per Klick oder Taste `T`. So kann der Scharfschütze gezielt Bosse jagen.
- Akzeptanzkriterien:
  - `TARGET_MODES = ['first', 'last', 'strong', 'close']` steht in `src/config.js`.
  - Neue Türme starten mit `targetMode: 'first'`.
  - `setTargetMode(state, id, mode)` lehnt unbekannte Modi ab.
  - Test: Bei 3 Gegnern in Reichweite (verschiedene `dist` und `hp`) wählt jeder Modus den erwarteten Gegner.
  - Verhalten für `first` bleibt unverändert, bestehende Tests laufen weiter.

### B-005: Vorzeitiger Wellenstart mit Gold-Bonus
- Status: vorschlag
- Aufwand: M
- Idee: Wer die nächste Welle startet, während die aktuelle noch läuft, bekommt einen Bonus (Prozentsatz von `waveBonus`). Erfordert mehrere parallele Spawn-Queues. Risiko: Balancing (Gold-Exploit).
- Akzeptanzkriterien:
  - `EARLY_START_BONUS = 0.5` steht in `src/config.js`.
  - `startWave` ist bei laufender Welle erlaubt, solange `state.wave < MAX_WAVES`.
  - Bonus ist `floor(waveBonus(wave) * EARLY_START_BONUS)`, sofort gutgeschrieben; gilt nicht, wenn keine Welle aktiv ist.
  - Test: Zwei Wellen laufen parallel, alle Gegner spawnen zum korrekten Zeitpunkt.
  - Test: `status` wird erst 'won', wenn alle Wellen gespawnt und alle Gegner tot sind.

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

### B-007: Fallen-Turm auf dem Weg
- Status: vorschlag
- Aufwand: L
- Idee: Neuer Turm "Fallensteller" wird auf dem Weg platziert, legt Minen, die Gegner stoppen und beschädigen. Begrenzte Ladungen, Nachfüllen kostet Gold. Bricht die Annahme "Weg-Kacheln sind nie bebaut" – nur nach Freigabe durch einen Menschen.
- Akzeptanzkriterien:
  - `TOWER_TYPES.trap` hat `buildOnPath: true`, `charges`, `trapDamage`, `stunTime`, `refillCost`.
  - `canBuild` erlaubt `trap` nur auf Weg-Kacheln, alle anderen Türme weiterhin nur daneben.
  - Test: Gegner über Falle mit Ladung bekommt Schaden und ist `stunTime` Sekunden festgesetzt; Ladung sinkt um 1.
  - Test: Falle ohne Ladung löst nicht aus.
  - Test: Nachfüllen kostet `refillCost` und scheitert bei zu wenig Gold.
  - Bestehende `canBuild`-Tests laufen unverändert.
  - Boss-Gegner sind gegen Betäubung immun.

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

### B-014: Grafik-Feinschliff Gelände (nach Sichtprüfung im Browser)
- Status: vorschlag
- Aufwand: S
- Idee: Nach B-009 sollte ein Mensch das Spielfeld im Browser ansehen. Bekannte Kandidaten: Das Schachbrett-Raster geht stellenweise in der Gras-Variation unter (`GRASS_SHIFT` in `src/render.js` von 0,07 auf etwa 0,025 senken oder die Grundtöne weiter spreizen), Tor- und Burg-Pfosten ragen ca. 6 px quer in Nachbarkacheln (Pfosten kürzen oder Nachbarkacheln von Dekoration freihalten), Cache-Schlüssel `path.points` müsste auch `state.blocked` berücksichtigen, falls dort später Türme landen.
- Akzeptanzkriterien:
  - Nur Zahlen und Zeichnung in `src/render.js` und `src/decor.js`.
  - Raster bleibt für alle Nachbarpaare erkennbar (Helligkeit kehrt sich nie um), per Test belegt.
  - `npm test` bleibt grün.

### B-015: Grafik-Feinschliff Türme (nach Sichtprüfung im Browser)
- Status: vorschlag
- Aufwand: S
- Idee: Kleinigkeiten aus dem Review von B-010. Rückstoß-Anteil aus der Level-Rate statt `def.rate` ableiten (kleiner reiner Helfer `levelRate(type, level)` in `game.js`, damit pro Frame kein Objekt entsteht), Fallback für unbekannte Turmtypen (`RECOIL_PX[t.type] ?? 3`, kein stilles Fallen in den Scharfschützen-Zweig), Drehpunkt-Tabelle `HEAD_PIVOT_Y` statt if/else-Kette, größere Stufen-Punkte (Radius 1,8 ist klein), Turm-Zeichnung in eine eigene Datei auslagern (`src/render-towers.js`), falls `render.js` weiter wächst.
- Akzeptanzkriterien:
  - Nur `src/render.js`, `src/tower-fx.js` und ggf. neue Render-Dateien; der Helfer `levelRate` bekommt einen Test.
  - Nach einer Sichtprüfung im Browser entscheiden, ob Stufen, Rückstoß und Auswahlrahmen so lesbar sind.
  - `npm test` bleibt grün.

### B-016: Grafik-Feinschliff Gegner (nach Sichtprüfung im Browser)
- Status: vorschlag
- Aufwand: S
- Idee: Hinweise aus dem Review von B-011. (1) Neigung an den Wegecken glätten: neue reine Funktion `tiltAt(path, dist)` in `src/enemy-fx.js`, die innerhalb von etwa 8 px vor der Ecke per Smoothstep auf die Neigung des nächsten Segments überblendet (heute springt sie um 0,3 rad). (2) Gemeinsame Zeichen-Helfer `rect`/`tri`/`disc` aus `render.js`, `render-enemies.js` (und den Turm-Helfern) in `src/draw-utils.js` zusammenlegen, Argumentreihenfolge vereinheitlichen. (3) Kommentar zur Keule des Oger-Königs korrigieren oder die Keule über die Lauf-Phase schwingen lassen. (4) HP-Anteil mit `Math.min(1, ...)` begrenzen. (5) Phasensprung der Lauf-Animation beim Wechsel in oder aus Slow: bräuchte pro Gegner einen aufsummierten Phasenwert in `game.js`, eigener Eintrag, nur falls es im Browser stört.
- Akzeptanzkriterien:
  - Neigung ist über jede Wegecke stetig (Differenz bei dist ± 0,5 px kleiner als ein kleines Epsilon), per Test belegt.
  - Nach Zusammenlegen der Helfer bleiben alle Render-Tests grün.
  - Erst nach einer Sichtprüfung im Browser angehen, ob (1) und (5) überhaupt stören.

### B-017: Render-Tests reihenfolgeunabhängig machen
- Status: vorschlag
- Aufwand: S
- Idee: Der Test `Render: Tuerme aller Typen zeichnen, Cache ungestoert, Alpha und save/restore unveraendert` (aus B-010) schlägt isoliert und bei umgekehrter Reihenfolge fehl, weil er vom Modulzustand `bgCanvas` in `src/render.js` abhängt, den frühere Tests füllen. Den Test auf ein frisches Modul umstellen (`import('../src/render.js?<eigener-name>')`) und mit Grundlinie statt absoluten Zahlen zählen, wie in B-012 beim Shake-Test.
- Akzeptanzkriterien:
  - Jeder Render-Test ist einzeln (`node --test --test-name-pattern="^<Name>$"`) und bei umgekehrter Reihenfolge grün.
  - Keine Prüfung wird abgeschwächt.

### B-018: Feinschliff Effekte (nach Sichtprüfung im Browser)
- Status: vorschlag
- Aufwand: S
- Idee: Hinweise aus dem Review von B-012. Der Shake friert ein, wenn die Spielzeit steht (Spielende innerhalb von 0,3 s nach einer Explosion lässt das Bild bis 3 px verschoben). Während des Shakes wird der Hintergrund zweimal gezeichnet; die Randstreifen zu füllen reicht. `SHAKE_COOLDOWN` (1,2 s) nach Sichtprüfung mit mehreren Kanonen ggf. anheben. Treffer-Funken an der endgültigen Zielposition statt der aus dem Vorframe. Bei niedriger Bildrate und Tempo ×3 altern Partikel durch `MAX_STEP` langsamer als das Spiel.
- Akzeptanzkriterien:
  - Nur `src/fx-system.js`, `src/render-fx.js`, `src/render.js`.
  - Bei Spielende ist der Shake-Versatz 0, per Test belegt.
  - `npm test` bleibt grün.

### B-019: Nur noch 3 Leben
- Status: fertig
- Aufwand: S
- Idee: Der Mensch will ein deutlich härteres Spiel: `START_LIVES` von 20 auf 3. Damit entscheidet schon ein einziger Durchbruch (Boss: Leak 6) über Sieg oder Niederlage. Das Balancing muss so nachgezogen werden, dass das Spiel hart, aber mit guter Strategie weiter schaffbar bleibt.
- Akzeptanzkriterien:
  - `START_LIVES = 3` in `src/config.js`. Weitere Anpassungen nur an Zahlen in `src/config.js` (Gegnerwerte, Leak, Wellen), keine neue Mechanik.
  - Die HUD-Anzeige zeigt nie weniger als 0 Leben (`game.js` begrenzt bereits auf 0).
  - Gute Strategien (die zwei robusten Reihenfolgen aus den Tests) gewinnen Welle 20 bei dt 1/30 und 1/60 mit mindestens 1 Leben. "Nur Pfeiltürme" verliert weiter vor Welle 12. Welle 1 verliert mit dem Startgold kein Leben.
  - Die drei Tests mit der festen Reserve `lives >= 8` (`tests/game.test.js`) werden durch die neue Reserve ersetzt (mindestens 1 Leben, also gewonnen). Das ist die einzige zulässige Änderung an bestehenden Tests und wird im Ledger ausdrücklich genannt. Alle anderen Tests bleiben unverändert.

### B-020: Spätphase: Gold-Überschuss und Mittelphase (nach Sichtprüfung im Browser)
- Status: vorschlag
- Aufwand: M
- Idee: Hinweise aus dem Review von B-013. (1) In den Wellen 14 bis 20 verlieren gute Strategien weiter keine Leben; am Ende bleiben rund 1300 Gold ungenutzt, weil zusätzliche Gegner mehr Belohnung bringen. Mehr Druck braucht eine Gold-Senke oder gedeckelte Belohnungen in der Spätphase statt nur mehr Gegner. (2) Schildträger-HP 90 und Anzahl `1 + floor((w-9)/2)` wirken schon ab Welle 9: die schwächere Strategie A>A>C>F verliert jetzt bei dt 1/60 in Welle 10 und bei dt 1/30 in Welle 16 (vorher Sieg mit 1 Leben). Die Spitze um Welle 8 bis 10 wird dadurch weiter verstärkt. (3) a>c>c>f erreicht bei dt 1/120 nur 1 Welle über 76 % Wegfortschritt: der Druck-Effekt hängt vom Zeitschritt ab.
- Akzeptanzkriterien:
  - Erst nach einer Sichtprüfung im Browser entscheiden, ob die Punkte stören.
  - Nur Zahlen in `src/config.js`; beide robusten Strategien gewinnen Welle 20 weiter mit mindestens 2 Leben bei dt 1/30 und 1/60.
  - Test-Aufräumen nebenbei: `playTracked` und `playDt` zusammenführen (`playDt = (mix, dt) => playTracked(mix, dt).state`), den Kommentar "höchstens 75 %" korrigieren (richtig: vorher höchstens 1 Welle über 76 %), den Healer-Assert in Welle 13 auf `healer.at > letzter tank.at` umstellen.
