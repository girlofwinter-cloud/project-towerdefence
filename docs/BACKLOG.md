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

Erledigte Einträge (`fertig`) liegen in `docs/archiv/BACKLOG-fertig.md`. Beim Abschluss eines Durchlaufs wird der Eintrag dorthin verschoben.

---

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

### B-020: Spätphase: Gold-Überschuss und Mittelphase (nach Sichtprüfung im Browser)
- Status: vorschlag
- Aufwand: M
- Idee: Hinweise aus dem Review von B-013. (1) In den Wellen 14 bis 20 verlieren gute Strategien weiter keine Leben; am Ende bleiben rund 1300 Gold ungenutzt, weil zusätzliche Gegner mehr Belohnung bringen. Mehr Druck braucht eine Gold-Senke oder gedeckelte Belohnungen in der Spätphase statt nur mehr Gegner. (2) Schildträger-HP 90 und Anzahl `1 + floor((w-9)/2)` wirken schon ab Welle 9: die schwächere Strategie A>A>C>F verliert jetzt bei dt 1/60 in Welle 10 und bei dt 1/30 in Welle 16 (vorher Sieg mit 1 Leben). Die Spitze um Welle 8 bis 10 wird dadurch weiter verstärkt. (3) a>c>c>f erreicht bei dt 1/120 nur 1 Welle über 76 % Wegfortschritt: der Druck-Effekt hängt vom Zeitschritt ab.
- Akzeptanzkriterien:
  - Erst nach einer Sichtprüfung im Browser entscheiden, ob die Punkte stören.
  - Nur Zahlen in `src/config.js`; beide robusten Strategien gewinnen Welle 20 weiter mit mindestens 2 Leben bei dt 1/30 und 1/60.
  - Test-Aufräumen nebenbei: `playTracked` und `playDt` zusammenführen (`playDt = (mix, dt) => playTracked(mix, dt).state`), den Kommentar "höchstens 75 %" korrigieren (richtig: vorher höchstens 1 Welle über 76 %), den Healer-Assert in Welle 13 auf `healer.at > letzter tank.at` umstellen.

### B-021: Tastatur: Groß-/Kleinschreibung und Wellenstart in der Pause
- Status: vorschlag
- Teilweise erledigt (agent/aufraeumen): Punkt (1) Tasten mit `toLowerCase()`. Offen: Punkt (2) Wellenstart in der Pause.
- Aufwand: S
- Idee: Hinweise aus dem Review von B-002. (1) Tasten `p`, `u`, `s`, `f` reagieren nicht bei Caps Lock oder Shift; in `src/main.js` einheitlich `ev.key.toLowerCase()` verwenden. (2) `doStartWave` funktioniert in der Pause, die Welle beginnt erst nach dem Fortsetzen; Starten in der Pause sperren oder die Pause dabei aufheben.
- Akzeptanzkriterien:
  - Alle Tastenkürzel funktionieren unabhängig von Groß-/Kleinschreibung.
  - Verhalten des Wellenstarts in der Pause ist festgelegt und dokumentiert.
  - `npm test` bleibt grün.

### B-022: stepGame härten und Tests präzisieren
- Status: vorschlag
- Teilweise erledigt (agent/aufraeumen): Punkte (3) Absicherung gegen nicht endliches `dt`, (4) `MAX_SUBSTEP` in `main.js`, und für (1) ein zusätzlicher Test mit identischen Teilschritten. Offen: der fragile dt=1/60-Test bleibt unverändert bestehen (Regel 2), (2) Teilschrittlänge direkt prüfen.
- Aufwand: S
- Idee: Hinweise aus Review und Test von B-003. (1) Der Test "dt=1/60 ergibt bei x1 und x2 gleiche Zeit und Ergebnis" vergleicht 1/60- mit 1/30-Schritten und ist nur beim Pfeilturm zufällig grün (bei Pfeil/Kanone mit je 3 Türmen weichen Kills und Gold ab); auf dt=0,05 umstellen oder nur die Zeit exakt und Kills/Gold mit Toleranz prüfen. (2) Teilschrittlänge direkt prüfen (Anzahl `update`-Aufrufe zählen). (3) `stepGame(state, Infinity, 1)` hängt; Obergrenze für die Schrittzahl. (4) `Math.min(0.05, …)` in `src/main.js` `frame()` durch `MAX_SUBSTEP` ersetzen.
- Akzeptanzkriterien:
  - Kein Test hängt von einer zufällig passenden Schrittfolge ab.
  - `stepGame` terminiert für jedes `dt`.
  - `npm test` bleibt grün.

### B-023: Zielmodus: Feinschliff
- Status: vorschlag
- Teilweise erledigt (agent/aufraeumen): Punkt (1) `TARGET_MODES[0]`. Offen: (2) Integrationstest über `update()`, (3) Render-Symbol.
- Aufwand: S
- Idee: Hinweise aus dem Review von B-004. (1) Startwert in `buildTower` als `TARGET_MODES[0]` statt hart codiertem `'first'`. (2) Test über `update()`, dass ein Turm im laufenden Spiel wirklich nach seinem `targetMode` schießt (heute ist nur `pickTarget` direkt getestet). (3) Zielmodus im Render (kleines Symbol am ausgewählten Turm) erst nach Sichtprüfung im Browser entscheiden.
- Akzeptanzkriterien:
  - Integrationstest: zwei Gegner in Reichweite, Modus `strong` trifft den stärkeren zuerst.
  - `npm test` bleibt grün.

### B-024: Eigene Konstante für die maximale Frame-Dauer
- Status: vorschlag
- Aufwand: S
- Idee: Hinweis aus dem Review von agent/aufraeumen. In `src/main.js` `frame()` begrenzt `MAX_SUBSTEP` die Frame-Dauer. Das ist ein anderes Konzept (Teilschritt der Simulation) als die Obergrenze für ein Frame, nur zufällig derselbe Wert. Eigene Konstante `MAX_FRAME_DT = 0.05` in `src/config.js`.
- Akzeptanzkriterien:
  - Verhalten unverändert, `npm test` bleibt grün.

### B-025: HUD-Feinschliff (nach Sichtprüfung im Browser)
- Status: vorschlag
- Aufwand: S
- Idee: Hinweise aus Review und Test von agent/hud-sichtbar. (1) Leere Herzen 🖤 sind auf dunklem Grund kaum sichtbar; 🤍 oder ein anderes Symbol nehmen. (2) Warn-Pulsieren: `@media (prefers-reduced-motion: reduce)` ohne Animation, Deckkraft nicht unter 0,6. (3) Pause-Banner bei schmalem Spielfeld: `width: max-content; max-width: 90%`. (4) Screenreader: `#hearts` mit `aria-hidden="true"`, Container mit `aria-label`. (5) `livesText` bei nicht endlichem `lives` auf 0 setzen, Tests für NaN und `max = 0`. (6) Pause-Button nach dem Klick den Fokus abgeben, damit die Leertaste nicht doppelt auslöst.
- Akzeptanzkriterien:
  - Alle Punkte erst nach Sichtprüfung im Browser bewerten.
  - `npm test` bleibt grün.

### B-026: Mobil-Feinschliff (Rest aus UI/UX-Check, Review und Test von agent/mobil-bauen-zoom)
- Status: vorschlag
- Aufwand: M (in Teilen S)
- Idee: (1) Querformat-Layout (`@media (max-height: 500px) and (orientation: landscape)`: Feld und Leiste nebeneinander, Canvas höchstens Viewport-Höhe). (2) Tastenkürzel ("(Leertaste)", "(P)", "(F)", "(T)") und "P drücken" im Pause-Banner auf Touch-Geräten ausblenden (`@media (hover: none)` oder `matchMedia`). (3) `canvas#game, button { touch-action: manipulation; }` und `body { overscroll-behavior-y: contain; }` gegen Doppeltipp-Zoom und Pull-to-Refresh. (4) Tippziele mobil mindestens 44 px (`min-height`). (5) Turm-Info mobil kompakter (Verbessern/Verkaufen nebeneinander, Verkaufen rötlich). (6) Zu teure Türme abblenden (`.tower-btn.poor { opacity: .7 }`). (7) Wellenvorschau mobil 15 px. (8) Safe-Area (`viewport-fit=cover`, nur zusammen mit 1). Aus Review/Test: (9) Stift (`pen`) wie Maus behandeln (`touch = lastPointerType === 'touch'`, `pointerleave` nur bei Touch ignorieren). (10) Beim Bauen die grüne Meldung "Nochmal tippen zum Bauen" sofort löschen (bleibt bis zu 2 s stehen). (11) E2E-Touch-Test: Rastergröße aus `config.js` statt fest 800/40. (12) Zoom: Game-Over-Overlay im gezoomten Zustand prüfen.
- Akzeptanzkriterien:
  - Je Punkt einzeln bewertbar, nur CSS/UI, keine Spiel-Logik.
  - `npm test` und `npm run test:e2e` bleiben grün.

### B-030: Welt Vulkan (Lava-Felder)
- Status: vorschlag
- Aufwand: L
- Idee: Lava-Felder neben dem Weg schaden Gegnern in Reichweite; Türme zu nah an Lava überhitzen und schießen langsamer. Hängt von B-027 ab. Risiko: Balancing.
- Akzeptanzkriterien:
  - Map `volcano` mit `hazards` (Lava-Kacheln, Schaden pro Sekunde, Überhitzungsradius).
  - Test: Gegner neben Lava nehmen Schaden; Turm in Lava-Nähe hat längere Schussrate.
  - Beide robusten Strategien aus den Balancing-Tests können Welle 20 noch schaffen.

### B-031: Welt Wüste (Sandsturm)
- Status: vorschlag
- Aufwand: M
- Idee: Zeitweise Sandstürme verkürzen die Reichweite aller Türme (Warnung im HUD vor Beginn). Hängt von B-027 ab.
- Akzeptanzkriterien:
  - `STORM_*`-Werte in `src/config.js` (Dauer, Abstand, Reichweiten-Faktor).
  - Test: Während des Sturms ist die effektive Reichweite reduziert, danach wieder normal.
  - HUD-Hinweis vor und während des Sturms.

### B-032: Weggabelungen und Schleifen
- Status: vorschlag
- Aufwand: L
- Idee: Weg teilt sich oder läuft zweimal an derselben Stelle vorbei. Bricht die Annahme eines einzelnen Wegs in `path.js`; Gegner wählen eine Abzweigung (abwechselnd oder je Gegner fest). Hängt von B-027 ab.
- Akzeptanzkriterien:
  - Map-Format erlaubt mehrere Wegabschnitte mit Verzweigung.
  - Test: Gegner verteilen sich gemäß Regel auf beide Zweige, beide erreichen das Ziel.
  - Zielwahl der Türme (`first`/`last`) bleibt sinnvoll definiert.

### B-035: Unterstützungsturm (Banner)
- Status: vorschlag
- Aufwand: M
- Idee: Turm ohne eigenen Angriff, der Türme im Umkreis schneller schießen lässt. Macht Turmgruppen sinnvoll. Mehrere Banner wirken nicht kumulativ.
- Akzeptanzkriterien:
  - `TOWER_TYPES.banner` mit `auraRange` und `rateBonus`.
  - Test: Turm im Radius schießt schneller, außerhalb unverändert, zwei Banner stapeln nicht.

### B-036: Fliegende Gegner
- Status: vorschlag
- Aufwand: L
- Idee: Flieger ignorieren den Weg und fliegen in gerader Linie zum Ziel. Nur Pfeilturm, Scharfschütze und Blitzturm treffen sie. Bricht die Annahme "alle Gegner folgen dem Weg" in `game.js`.
- Akzeptanzkriterien:
  - `ENEMY_TYPES.flyer` mit `flying: true`; Türme haben `canHitAir`.
  - Test: Kanone und Frostturm ignorieren Flieger, Pfeilturm trifft sie, Flieger verliert Leben am Ziel.
  - Wellen ab etwa Welle 8 enthalten Flieger, Balancing-Tests bleiben grün.

### B-037: Splitter- und Tarn-Gegner
- Status: vorschlag
- Aufwand: M
- Idee: Splitter zerfällt beim Tod in zwei kleine Gegner. Tarn-Gegner sind erst im Nahbereich eines Turms zielbar.
- Akzeptanzkriterien:
  - Neue Typen in `ENEMY_TYPES` mit `splitInto` bzw. `stealth`.
  - Test: Splitter erzeugt Kinder an gleicher Wegposition; Tarn-Gegner ist außerhalb des Radius nicht zielbar.

### B-038: Fähigkeiten (Meteor, Einfrieren, Reparatur)
- Status: vorschlag
- Aufwand: L
- Idee: Aktive Fähigkeiten mit Abklingzeit, per Taste oder Button: Meteor (Flächenschaden), Einfrieren (alle Gegner kurz verlangsamt), Notfall-Reparatur (+1 Leben, selten). Gibt dem Spieler auch mitten in der Welle etwas zu tun.
- Akzeptanzkriterien:
  - `ABILITIES` in `src/config.js` (Abklingzeit, Wirkung).
  - Test: Fähigkeit wirkt, geht in Abklingzeit, ist nach Ablauf wieder nutzbar.
  - Reparatur kann Leben nie über `START_LIVES` heben.

### B-039: Verzweigte Upgrades auf Stufe 3
- Status: vorschlag
- Aufwand: L
- Idee: Bei Stufe 3 wählt der Spieler einen Pfad, z. B. Kanone → Brandbombe (Brennschaden) oder Streubombe (größerer Radius). Verbindet Türme mit echten Entscheidungen.
- Akzeptanzkriterien:
  - `branches` je Turmtyp in `src/config.js`.
  - Test: Pfadwahl ändert Werte, ist endgültig, Verkaufswert berücksichtigt die Kosten.
  - Turm-Info zeigt die Wahl verständlich an.

### B-040: Bonus-Auswahl zwischen den Wellen
- Status: vorschlag
- Aufwand: M
- Idee: Nach jeder zweiten Welle drei zufällige Boni zur Auswahl (+Reichweite, +Gold, +Schaden für einen Turmtyp), wie bei einem Roguelike. Zufall über einen Seed, damit Tests deterministisch bleiben.
- Akzeptanzkriterien:
  - `BONUS_POOL` in `src/config.js`, Auswahl über Seed-Zufall.
  - Test: Gleiche Seeds ergeben gleiche Angebote; gewählter Bonus wirkt genau einmal.

### B-041: Endlos-Modus nach Welle 20
- Status: vorschlag
- Aufwand: M
- Idee: Nach dem Sieg kann man weiterspielen; Wellen skalieren weiter, Rekord ist die erreichte Welle. Löst nebenbei das Gold-Überschuss-Problem aus B-020 (Belohnungen gedeckelt oder sinkend).
- Akzeptanzkriterien:
  - `waveFor` und `hpScale` sind über Welle 20 hinaus definiert, Wellen 1 bis 20 bleiben unverändert.
  - Test: Welle 21+ erzeugt gültige Spawn-Listen; Status 'won' erst im normalen Modus.

### B-042: Map-Auswahl: Feinschliff
- Status: vorschlag
- Aufwand: S
- Idee: Hinweise aus dem Review von B-027. (1) `let mapId = undefined;` in `src/main.js` zu `let mapId;`. (2) Kartenwahl in `localStorage` merken (mit try/catch), damit sie nach dem Neuladen bleibt. (3) Im Schlucht-Test die Magic Number `7` und den Text "mindestens 5 Kurven" angleichen. (4) Test, dass die Weglänge jeder Karte höchstens ±40 % von der Wiese abweicht. (5) Alter Aufruf `createGame` mit `path`/`blocked`-Overrides hat keinen eigenen Test.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt.

### B-043: Welt Wald: Feinschliff
- Status: vorschlag
- Aufwand: S
- Idee: Hinweise aus dem Review von B-028. (1) Baum-Anteil `0.7` aus `obstacleKind` in `src/decor.js` nach `src/config.js` (`OBSTACLE_TREE_SHARE`). (2) Schattenfarbe `rgba(10,40,15,0.35)` in `drawObstacle` (`src/render.js`) als benannte Konstante. (3) `tests/forest-edge.test.js` in `tests/game.test.js` und `tests/decor.test.js` einsortieren (Regel: Tests nach Modul). (4) Sichtprüfung der Waldkarte im Browser: Lesbarkeit der Hindernisse, Gefühl der knappen Bauplätze.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt oder gelöscht.

### B-044: Eiswelt: Feinschliff
- Status: vorschlag
- Teilweise erledigt (agent/eis-balancing): Punkte (1) und (2). Die Eiswelt war dem Spieler zu einfach und wurde auf "Glatteis" umgestellt (Gegner 1,18-fach, Kanone 0,95-fach), mit Balancing-Tests. Offen: (3) und (4).
- Aufwand: S
- Idee: Hinweise aus dem Review von B-029. (1) Playtest der Eiswelt (erledigt). (2) Kartenspezifische Balancing-Tests für die Eiswelt (erledigt). (3) Sichtprüfung des Farbschemas im Browser. (4) Eiswelt hat keine Hindernisse; eigene Eis-Deko (Schneehaufen, Eisfelsen) wäre ein eigener Eintrag.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt.

### B-047: Zwei Eingänge: Feinschliff und Balancing
- Status: vorschlag
- Aufwand: S
- Idee: Hinweise aus dem Review von B-033. (1) `render.js` dupliziert die Logik von `enemyPath` (`state.paths[e.lane||0] || state.path`); `drawEnemy` bekommt den Weg schon aufgelöst oder `enemyPath` wird genutzt. (2) Im Test der Karte "Zangenangriff" ist die Schleife zum Kurvenzählen unnötig kompliziert. (3) Balancing der Karte `fork` ist nicht gemessen: Strategie-Test wie bei der Eiswelt (robuste Strategien gewinnen Welle 20, nur Pfeile verlieren früh); beide Ströme treffen gleichzeitig im Zusammenlauf ein. Zusammen mit B-046 angehen. (4) Ausgang wird auf `fork` doppelt an derselben Stelle gezeichnet (harmlos).
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt.

### B-048: Turm-Fähigkeiten: Feinschliff
- Status: vorschlag
- Aufwand: S
- Idee: Hinweise aus dem Review von B-045. (1) Config-Texte (`special.text`) enthalten feste Zahlen wie "12 %" und "50 %"; aus den Werten bauen oder per Test absichern. (2) `knockBack` wird in der Splash-Schleife mit `e === target` aufgerufen; klarer nach der Schleife. Das Projektil trägt sieben Spezialfelder, ein `p.special`-Verweis wäre kompakter. (3) Kein Test, dass Slow und Heilung bei eingefrorenen Gegnern weiterlaufen. (4) Optional bläulicher Effekt für eingefrorene Gegner im Render.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt.

### B-050: Restpunkte aus B-049
- Status: vorschlag
- Aufwand: S
- Idee: (1) Die Strategie a>c>c>f (Pfeilturm zuerst) endet auf allen Karten mit 10 Leben; prüfen, ob das gewollt ist oder ob mehr Gold-Senke nötig ist (Logikänderung in `game.js`). (2) `ENEMY_TYPES[target.type]` in der Sniper-Schwelle crasht bei Hand-Gegnern ohne `type`; Fallback nur, falls ein Test das braucht. (3) Der Test-Helfer `iceRun` in `tests/game.test.js` bedient jetzt alle Karten; umbenennen in `mapRun`.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt.

### B-051: Blitzturm: Spieltest und Feinschliff
- Status: vorschlag
- Aufwand: S
- Idee: Hinweise aus dem Review von B-034. (1) Nach einem Spieltest prüfen, ob die Flitzer jetzt zu leicht werden: `chainRange` 1,6 Kacheln ist eher großzügig und der Hauptregler; grobe Rechnung: Einzelziel ca. 12,7 DPS (Pfeil 20 DPS bei halbem Preis), ein voller Blitz auf 4 Gegner ca. 32 DPS Gesamtschaden. (2) `COIL_BLUE` und `BOLT_GLOW` in `src/render.js` stehen zwischen den Eis-Farben (ICE_LIGHT/ICE_DARK); sortieren. (3) Boss-Test prüft nur `frozenUntil`, nicht ausdrücklich "kein Boss-Rückstoß"; für den Blitzturm irrelevant. (4) Optional eigener Strategie-Test mit Blitzturm, falls er in Balancing-Läufe aufgenommen wird.
- Akzeptanzkriterien:
  - Nur Zahlen in `src/config.js` und Render-Kosmetik; `npm test` bleibt grün, kein Test abgeschwächt.
