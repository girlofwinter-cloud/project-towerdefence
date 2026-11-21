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
- Teilweise erledigt (agent/aufraeumen-2): Punkte (1) und (5) (der Test existiert schon); (3) entfällt (Schlucht entfernt). Offen: (2) Kartenwahl in `localStorage` und (4) Weglängen-Test.
- Aufwand: S
- Idee: Hinweise aus dem Review von B-027. (1) `let mapId = undefined;` in `src/main.js` zu `let mapId;`. (2) Kartenwahl in `localStorage` merken (mit try/catch), damit sie nach dem Neuladen bleibt. (3) Im Schlucht-Test die Magic Number `7` und den Text "mindestens 5 Kurven" angleichen. (4) Test, dass die Weglänge jeder Karte höchstens ±40 % von der Wiese abweicht. (5) Alter Aufruf `createGame` mit `path`/`blocked`-Overrides hat keinen eigenen Test.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt.

### B-043: Welt Wald: Feinschliff
- Status: vorschlag
- Teilweise erledigt (agent/aufraeumen-2): Punkte (1), (2) und (3). Offen: (4) Sichtprüfung der Waldkarte im Browser.
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
- Teilweise erledigt (agent/aufraeumen-2): Punkte (1) und (2); (3) Balancing-Test für `fork` kam mit B-046. Offen: (4) doppelt gezeichneter Ausgang (harmlos).
- Aufwand: S
- Idee: Hinweise aus dem Review von B-033. (1) `render.js` dupliziert die Logik von `enemyPath` (`state.paths[e.lane||0] || state.path`); `drawEnemy` bekommt den Weg schon aufgelöst oder `enemyPath` wird genutzt. (2) Im Test der Karte "Zangenangriff" ist die Schleife zum Kurvenzählen unnötig kompliziert. (3) Balancing der Karte `fork` ist nicht gemessen: Strategie-Test wie bei der Eiswelt (robuste Strategien gewinnen Welle 20, nur Pfeile verlieren früh); beide Ströme treffen gleichzeitig im Zusammenlauf ein. Zusammen mit B-046 angehen. (4) Ausgang wird auf `fork` doppelt an derselben Stelle gezeichnet (harmlos).
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt.

### B-048: Turm-Fähigkeiten: Feinschliff
- Status: vorschlag
- Teilweise erledigt (agent/aufraeumen-2): Punkt (1) mit B-046, (2) `knockBack` lesbarer (nicht: `p.special`-Bündelung, Diff zu groß), (3) Test zu Slow/Heilung bei eingefrorenen Gegnern. Offen: `p.special`-Bündelung am Projektil und (4) bläulicher Effekt für eingefrorene Gegner.
- Aufwand: S
- Idee: Hinweise aus dem Review von B-045. (1) Config-Texte (`special.text`) enthalten feste Zahlen wie "12 %" und "50 %"; aus den Werten bauen oder per Test absichern. (2) `knockBack` wird in der Splash-Schleife mit `e === target` aufgerufen; klarer nach der Schleife. Das Projektil trägt sieben Spezialfelder, ein `p.special`-Verweis wäre kompakter. (3) Kein Test, dass Slow und Heilung bei eingefrorenen Gegnern weiterlaufen. (4) Optional bläulicher Effekt für eingefrorene Gegner im Render.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt.

### B-050: Restpunkte aus B-049
- Status: vorschlag
- Teilweise erledigt (agent/aufraeumen-2): Punkte (2) und (3). Offen: (1) a>c>c>f endet überall mit 10 Leben, Entscheidung nötig (Balancing).
- Aufwand: S
- Idee: (1) Die Strategie a>c>c>f (Pfeilturm zuerst) endet auf allen Karten mit 10 Leben; prüfen, ob das gewollt ist oder ob mehr Gold-Senke nötig ist (Logikänderung in `game.js`). (2) `ENEMY_TYPES[target.type]` in der Sniper-Schwelle crasht bei Hand-Gegnern ohne `type`; Fallback nur, falls ein Test das braucht. (3) Der Test-Helfer `iceRun` in `tests/game.test.js` bedient jetzt alle Karten; umbenennen in `mapRun`.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, kein Test abgeschwächt.

### B-051: Blitzturm: Spieltest und Feinschliff
- Status: vorschlag
- Teilweise erledigt (agent/aufraeumen-2): Punkt (2). Punkt (1) und (4) erledigt mit B-053 (Blitzturm aufgewertet, Blitz-Mix in den Strategie-Läufen). Offen: (3) Boss-Test.
- Aufwand: S
- Idee: Hinweise aus dem Review von B-034. (1) Nach einem Spieltest prüfen, ob die Flitzer jetzt zu leicht werden: `chainRange` 1,6 Kacheln ist eher großzügig und der Hauptregler; grobe Rechnung: Einzelziel ca. 12,7 DPS (Pfeil 20 DPS bei halbem Preis), ein voller Blitz auf 4 Gegner ca. 32 DPS Gesamtschaden. (2) `COIL_BLUE` und `BOLT_GLOW` in `src/render.js` stehen zwischen den Eis-Farben (ICE_LIGHT/ICE_DARK); sortieren. (3) Boss-Test prüft nur `frozenUntil`, nicht ausdrücklich "kein Boss-Rückstoß"; für den Blitzturm irrelevant. (4) Optional eigener Strategie-Test mit Blitzturm, falls er in Balancing-Läufe aufgenommen wird.
- Akzeptanzkriterien:
  - Nur Zahlen in `src/config.js` und Render-Kosmetik; `npm test` bleibt grün, kein Test abgeschwächt.

### B-052: Fähigkeiten: Feinschliff
- Status: vorschlag
- Teilweise erledigt (agent/aufraeumen-2): Punkte (1) und (2). Offen: (3) Touch-Vorschau, (4) Verhalten Kälteschock/Frost per Test festhalten, (5) Spieltest der Zahlen.
- Aufwand: S
- Idee: Hinweise aus Tester und Review von B-038. (1) `doAbility` in `src/main.js`: Q bei Status 'won'/'lost' schaltet `ui.aiming` an, die Fehlermeldung kommt erst beim Klick; früh abbrechen (`if (state.status !== 'playing') return;`). (2) Zielmodus bleibt bei Pause oder Ablauf der Abklingzeit aktiv (unkritisch, Meldung beim Klick); optional beenden. (3) Touch: Tippen löst sofort ohne Vorschau aus, weil `hoverPx` erst durch `pointermove` gesetzt wird; optional zweistufig wie beim Bauen. (4) Kälteschock verlängert das Ende eines stärkeren aktiven Slows auf die Schockdauer; ein späterer Frostturm-Treffer überschreibt den Faktor wie bisher. Beides nicht getestet, Verhalten entscheiden und per Test festhalten. (5) Spieltest: Sind die Zahlen (Meteor 150 Schaden/50 s, Kälteschock 70 %/4 s/60 s, Reparatur 2 Nutzungen/120 s) passend?
- Akzeptanzkriterien:
  - `npm test` und `npm run test:e2e` bleiben grün, kein Test abgeschwächt.

### B-054: Shop-Karten: Barrierefreiheit
- Status: vorschlag
- Aufwand: S
- Idee: Hinweis aus dem Review von agent/shop-kompakt. Der Fähigkeiten-Text steht im `title`-Tooltip der Shop-Karte; für Touch und Screenreader hilft das nur bedingt (das Turm-Info-Panel `#ti-special` deckt es nach der Turmwahl ab). Optional `aria-describedby` oder `aria-label` auf der Karte.
- Akzeptanzkriterien:
  - Nur Markup in `src/main.js`; `npm test` und `npm run test:e2e` bleiben grün.

### B-055: Blitzturm-Tests robuster machen
- Status: vorschlag
- Aufwand: S
- Idee: Hinweise aus dem Review von B-053. (1) Der Vergleich "Blitz-Mix hat nicht mehr Leben als der Kanonen-Mix" (`lives <= MIX_CANNON`, in `tests/game.test.js` bei den Blitz-Strategie-Tests) mit ±1 Leben Toleranz versehen oder nur auf "gewonnen" prüfen; auf der Wiese bleiben nur 4 Leben Reserve, eine Abweichung um ein Leben kippt sonst den Test (Flackerrisiko bei dt-Änderungen). (2) Die `description` des Blitzturms ist statischer Text ohne Zahlen; ein Test, dass sie die Rolle (schnelle Gegner/Schwärme) nennt, ist nicht nötig, aber bei geänderten Werten die Aussage "verfehlt nie, ideal gegen Schwärme" gegen die Messung prüfen. (3) Bei einer späteren Änderung der Zeitschritte zuerst die beiden Blitz-Strategie-Tests ansehen.
- Akzeptanzkriterien:
  - `npm test` bleibt grün, keine Prüfung abgeschwächt (nur Toleranz, wo die Reserve knapp ist).

### B-056: Handy: Turm-Panel als feste Leiste am unteren Rand (Muss, Design-Prüfung)
- Status: vorschlag
- Aufwand: M
- Idee: Auf dem Handy liegt das Turm-Panel (Verbessern, Verkaufen, Zielregel) unter Spielfeld und Bedienleiste; man muss scrollen und sieht das Feld nicht mehr. Der Turmname fehlt, weil `aside h3 { display:none }` (style.css ca. Zeile 217) auch `#ti-name` versteckt. Lösung: Panel als feste Leiste (Schublade) am unteren Bildschirmrand mit Name, Stufe, Verbessern, Verkaufen, Zielregel; Schließen per Tippen aufs Feld. Risiko: Leiste verdeckt unten das Feld. Screenshots: m390-4select.png, m360-4select.png im Scratchpad der Design-Prüfung 2026-11-21.
- Akzeptanzkriterien:
  - Bei 390x844 und 360x740 liegen nach dem Antippen eines Turms Verbessern und Verkaufen komplett im Bild (Unterkante < innerHeight) und sind mindestens 44 px hoch.
  - Turmname und Stufe sind sichtbar.
  - Das Canvas bleibt mit mindestens 280 px Höhe sichtbar.
  - Browser-Test für beide Größen; kein horizontaler Scroll.

### B-057: Desktop: Turm-Panel ohne Scrollen erreichbar (Muss, Design-Prüfung)
- Status: vorschlag
- Aufwand: S
- Idee: Bei 1280x800 und 1366x768 endet Verkaufen bei y=958, die Seite ist 1262 px hoch; das Panel liegt unter Turmliste und Hilfe. Panel oben in der Seitenleiste (vor den Turmkarten) oder neben das Feld, Hilfe einklappen. Risiko: Layout-Sprünge. Screenshot: d1280-4select.png.
- Akzeptanzkriterien:
  - Bei 1280x800 und 1366x768 liegt `#sell` bei gewähltem Turm mit Unterkante < 800 bzw. 768.
  - Alle Turmkarten bleiben ohne Scrollen sichtbar (bestehender Browser-Test aus shop-kompakt bleibt grün).

### B-058: Fähigkeitsknöpfe: Tippgröße, Symbol und Abklingbalken (Muss, Design-Prüfung)
- Status: vorschlag
- Aufwand: S
- Idee: 10 Buttons unter 44 px Höhe auf dem Handy (Meteor, Kälteschock, Notfall-Reparatur, Zoom). Label "Notfall-Reparatur (E) bereit (2x)" ist umständlich, "bereit" und "lädt" sind kaum unterscheidbar. Großes Symbol, Kürzel klein, Abklingzeit als Füllbalken, auf dem Handy keine Tastenkürzel.
- Akzeptanzkriterien:
  - `.abilities button` und Zoom-Knopf sind auf Handy und Desktop mindestens 44 px hoch.
  - Zustand "bereit" und "lädt" ist ohne Text unterscheidbar (Balken oder Helligkeit).
  - Tastenkürzel-Hinweise sind auf dem Handy ausgeblendet (auch bei Pause und Tempo).
  - Unit-/Browser-Test prüft die Mindesthöhe.

### B-059: Welten optisch unterscheidbar: Eis und Wald (Sollte, Design-Prüfung)
- Status: vorschlag
- Aufwand: M
- Idee: Der Weg ist auf Wiese, Wald und Eis fast gleich (braun), Deko auf Eis ist wie auf der Wiese, der Zangenangriff sieht aus wie die Wiese. Eis: bläulicher glatter Weg, Schnee statt Gras, Kristalle, Flocken. Wald: dunkler Moos-Weg. Wegstil über `theme` in `src/config.js`, Deko einmalig in Off-Screen-Canvas. Überschneidet sich mit B-043 und B-044, bei Umsetzung zusammenlegen. Risiko: Gegner auf hellem Grund schlecht lesbar. Screenshots: map-ice.png, map-forest.png, map-fork.png.
- Akzeptanzkriterien:
  - Wegfarbe der Eiskarte ist nicht braun und deutlich verschieden von der Wiese; Deko-Sets unterscheiden sich je Welt.
  - Zahlen nur in `src/config.js`; Frame-Zeit bleibt unter 16 ms.
  - Tests in `tests/decor` und `tests/render` laufen weiter, neue Test für Deko-Set je Welt.

### B-060: Wellen-Vorschau mit Symbolen und Fortschritt am Start-Knopf (Sollte, Design-Prüfung)
- Status: vorschlag
- Aufwand: S
- Idee: Vorschau "Kommt: 12x Goblin" ist klein und versteckt. Gegner-Symbole statt Fließtext, direkt unter dem Start-Knopf; der Knopf zeigt während der Welle einen Fortschrittsbalken statt grauem "Welle läuft...". Shop-Beschreibungen (`.t-desc`, 0,74 rem) sind klein und auf dem Handy ganz ausgeblendet; bei der Umsetzung mitprüfen (siehe B-054).
- Akzeptanzkriterien:
  - Die Vorschau ist bei 360x740 ohne Scrollen sichtbar, Schrift mindestens 0,85 rem.
  - Während einer Welle zeigt der Start-Knopf den Fortschritt (z. B. besiegte/gespawnte Gegner).
  - Fortschrittsberechnung als reine Funktion in `src/game.js` mit Test.

### B-061: Design-Prüfung: Lücken nachholen
- Status: vorschlag
- Aufwand: S
- Idee: Die erste Prüfung zeigte keine laufende Welle mit vielen Gegnern und Effekten (Treffer, Explosion, Blitz, Frost), kein Game-Over-Overlay, keinen Boss und keine Zustände Heilung/Schild/Eingefroren. Von Hand spielen oder ein Skript mit schwächerer Verteidigung (nicht Gold 3000) bauen und diese Zustände prüfen. Kleinigkeiten: Herzen im Leerlauf grau, Kartenauswahl auf dem Handy gleich laut obwohl nur vor Spielbeginn änderbar.
- Akzeptanzkriterien:
  - Screenshots von Welle mit Effekten, Boss, Game Over liegen vor und sind bewertet.
  - Befunde sind als Einträge oder Hinweise im Backlog.

## Design-Overhaul (Flat-Pop nach `docs/STIL.md`, Stil B gewählt)
Reihenfolge ist Abhängigkeit: B-062 und B-063 zuerst, dann gemeinsame Sichtprüfung mit dem Menschen, erst danach B-064 bis B-075. Keine Logik- oder Balancing-Änderungen in dieser Reihe. Jeder Eintrag endet mit Screenshot-Prüfung (Desktop 1280x800, Handy 390x844) und grünem `npm test`.


### B-064: Restliche Türme im neuen Stil (Design-Overhaul)
- Status: vorschlag
- Aufwand: M
- Idee: Kanone, Frost, Scharfschütze, Blitz mit je eigener Silhouette, Stufen sichtbar in der Form.
- Akzeptanzkriterien:
  - Alle 5 Typen auf einem Screenshot an der Silhouette unterscheidbar.
  - Reichweitenkreis und Auswahlrahmen bleiben sichtbar.

### B-065: Gegner Teil 1: Goblin, Flitzer, Troll (Design-Overhaul)
- Status: vorschlag
- Aufwand: M
- Idee: `render-enemies.js`: Lauf-Phasen, Kontur, Bodenschatten.
- Akzeptanzkriterien:
  - Frost-Overlay, Heil-Aura und HP-Balken unverändert.
  - Drei Typen auf Handy-Screenshot unterscheidbar; mindestens 25 % Helligkeitsabstand zum Weg.

### B-066: Gegner Teil 2: Schamane, Schildträger, weitere (Design-Overhaul)
- Status: vorschlag
- Aufwand: M
- Idee: Übrige Gegnertypen (inkl. Fliegende, Splitter/Tarn, sofern vorhanden). Zustände Schild, Heilung, Eingefroren zusätzlich über Form/Symbol.
- Akzeptanzkriterien:
  - Je Typ ein Screenshot-Beleg, keine reine Farbunterscheidung.

### B-067: Boss Oger-König (Design-Overhaul)
- Status: vorschlag
- Aufwand: M
- Idee: 1,6x Größe, Krone, Keule, Aura, Auftritts-Effekt (Bodenschlag, Wackeln unter 3 px).
- Akzeptanzkriterien:
  - Boss auf dem Handy sofort erkennbar.
  - `prefers-reduced-motion` schaltet das Wackeln aus.

### B-068: Projektile und Effekte (Design-Overhaul)
- Status: vorschlag
- Aufwand: M
- Idee: Pfeile, Kanonenkugel, Frostsplitter, Blitz, Explosion, Treffer-Funken, Münzen-Hopser beim Tod.
- Akzeptanzkriterien:
  - Maximale Partikelzahl wie vorher.
  - Effekte verdecken Gegner nicht (Screenshot einer Welle mit vielen Gegnern).
  - Reduzierte Bewegung wird respektiert.

### B-069: HUD-Icons (Design-Overhaul)
- Status: vorschlag
- Aufwand: S
- Idee: Gold, Herz, Welle und Fähigkeiten aus dem Icon-Set per Canvas zeichnen und in HUD/Knöpfen statt Emoji einsetzen. Verknüpft mit B-058.
- Akzeptanzkriterien:
  - Bei 16 und 32 px lesbar, Tippziele mindestens 44 px, keine Emoji-Mischung.

### B-070: Shop-Karten (Design-Overhaul)
- Status: vorschlag
- Aufwand: S
- Idee: Mini-Turm-Vorschau aus den neuen Sprites, Preis mit Münz-Icon. Verknüpft mit B-056/B-057.
- Akzeptanzkriterien:
  - Kartenhöhe nicht größer als jetzt, alle Karten ohne Scrollen erreichbar.
  - Kontrast Text/Hintergrund mindestens 4,5:1.








### B-083: Feste Bauplätze wie im Referenzbild (Spiel-Änderung, nur nach Freigabe)
- Status: vorschlag
- Aufwand: L
- Idee: Im Referenzbild gibt es feste Bauplätze, bei uns ist jede Nicht-Weg-Kachel bebaubar. Feste Plätze brauchen eine Config-Liste `buildSpots` je Karte, Prüfung in `canBuild`, Eingabe/Hover, neue Tests und Balancing (weniger Standorte, andere Strategie, Strategie-Tests neu). Bricht Annahmen der bisherigen Spielmechanik, daher nur nach ausdrücklicher Freigabe durch einen Menschen. Optik der Inseln siehe B-082.
- Akzeptanzkriterien:
  - Pro Karte `buildSpots` in `src/config.js`; `canBuild` erlaubt nur dort.
  - Alle Strategie-Läufe (Welle 20) auf allen Karten weiter gewinnbar; Zahlen im Ledger.
  - Test: Bauen außerhalb der Plätze scheitert; Hover zeigt freie/belegte Plätze.
### B-072: Welten Wald und Zangenangriff (Design-Overhaul)
- Status: vorschlag
- Aufwand: M
- Idee: Wald mit Tannen, Pilzen, Moos; Zangenangriff mit Herbstlaub. Überschneidet sich mit B-043 und B-059, bei Umsetzung zusammenlegen.
- Akzeptanzkriterien:
  - Eigene Palette, auf Screenshot klar von der Wiese unterscheidbar.

### B-073: Welt Eis (Design-Overhaul)
- Status: vorschlag
- Aufwand: M
- Idee: Schnee, Eiskristalle, Tannen mit Schneekappe, dunklerer Weg. Überschneidet sich mit B-044 und B-059.
- Akzeptanzkriterien:
  - Weg vom Boden unterscheidbar, Gegner mit Kontrastregel aus `docs/STIL.md` lesbar.
  - Tests der Hindernisse grün.

### B-074: Vulkan und Wüste (Design-Overhaul)
- Status: vorschlag
- Aufwand: L
- Idee: Erst wenn die Welten existieren (B-030/B-031): Lava-Risse, Dünen, Kakteen.
- Akzeptanzkriterien:
  - Eigene Palette gemäß `docs/STIL.md`, Spielbarkeit unverändert.

### B-075: Politur und Performance (Design-Overhaul)
- Status: vorschlag
- Aufwand: S
- Idee: Sprite-Caches für Türme und Gegner, Weißblitz bei Treffer, Bau-Animation.
- Akzeptanzkriterien:
  - Zeichenzeit pro Frame mit 40 Gegnern und 20 Türmen nicht höher als vor dem Overhaul (Messung per `performance.now`).

### B-076: Stil-Helfer: Feinschliff (Hinweise aus dem Review von B-062)
- Status: vorschlag
- Aufwand: S
- Idee: (1) `parseHex` in `src/draw-utils.js` kennt nur `#rrggbb`; Kurzformen (`#fff`) oder `rgb()` ergeben NaN. Kommentar oder Prüfung ergänzen. (2) In `part()` ist die Basisfläche um 0,3 * `band` gegenüber dem Licht versetzt, der Schattenstreifen ist dadurch nur ca. 1,4 px statt 2 px breit und nicht in `STYLE` einstellbar; `band` skaliert nicht mit der Teilgröße. Bei der Sichtprüfung von B-063 ansehen und ggf. in `STYLE` auslagern.
- Akzeptanzkriterien:
  - Ungültige Hexwerte werden abgefangen oder dokumentiert (Test).
  - Schattenbreite ist in `STYLE` einstellbar, Screenshot-Vergleich bei 1x und 0,75x.

### B-084: Pfeilturm: Aufräumen (Hinweise aus dem Review von B-063)
- Status: vorschlag
- Aufwand: S
- Idee: (1) Tote alte `arrow`-Zweige in `drawTowerBody` und `drawTowerHead` (`src/render.js`) entfernen; der Early-Return in `drawTower` umgeht sie. `RECOIL_PX.arrow` bleibt. (2) Titel des Grenz-Tests in `tests/render.test.js` ("oben max. 3,5 px Ueberstand") nennt für den Pfeil `ARROW_TOP`; `ARROW_TOP = 28` hat nur ca. 2 px Luft. (3) Viele Geometriezahlen (Sockel, Fugen, Banner, Wimpel) stehen direkt in `src/render-arrow.js`, nur Eckwerte in `ARROW_TOWER`; streng gelesen gegen "alle Zahlen in config.js". Bei der Umstellung der anderen Türme (B-064) einheitlich entscheiden. (4) Stufe NaN, undefined oder 1.5 ergibt NaN-Koordinaten ohne Absturz (echte Türme haben Stufe 1 bis 3); mit `Math.round` oder `|| 1` abfangen. (5) Zeichenzeit Faktor ca. 24 (ca. 20 µs je Turm); Sprite-Cache siehe B-075.
- Akzeptanzkriterien:
  - Tote Zweige entfernt, `npm test` grün.
  - Testtitel stimmt mit der Prüfung überein.

### B-085: Gegner-Lesbarkeit auf hellem Weg (Hinweise aus dem Review von B-071)
- Status: vorschlag
- Aufwand: S
- Idee: Gegner-Körperfarben erreichen auf der hellen Wegmitte der Wiese (`#ecd5a0`, Helligkeit 0,84) nicht die geforderten 25 % Abstand: Flitzer 0,07, Goblin 0,19, Schamane 0,21 (Schildträger 0,32, Troll 0,44, Oger 0,57). B-071 prüft stattdessen die dunkle Gegner-Kontur (`outlineOf`, Abstand mindestens 0,49). Am schwächsten ist der gelbe Flitzer. Mit den Gegner-Einträgen (B-065/B-066) dunklerer Körperton oder stärkere Kontur für Flitzer und Goblin. Außerdem: Der Dekor-Test zählt `arc`/`ellipse` als Dekoration, der Weg zeichnet Kreise deshalb mit `ctx.roundRect`; langfristig den Dekor-Test auf den Frame-Pfad eingrenzen. Der Saum ist nur Kreise, die Grasbüschel des Entwurfs fehlen (optional, B-079).
- Akzeptanzkriterien:
  - Flitzer und Goblin sind auf der Wegmitte der Wiese im Screenshot klar lesbar; Körperfarbe oder Kontur so, dass der Abstand mindestens 0,25 (Helligkeit) beträgt, `ENEMY_TYPES`-Farben und HP-Anzeige bleiben konsistent.

### B-086: Baumrahmen: Feinschliff (Hinweise aus dem Review von B-077)
- Status: vorschlag
- Aufwand: S
- Idee: (1) Der Test "Dekoration verlässt ihre Kachel nicht" läuft seit B-077 auf `fork`; der Tester hat einen zusätzlichen Wiesen-Test ergänzt (Busch, Fels, Blume, Tuft, Kiesel). Ungeprüft bleiben nur nicht verdeckte Einzelbäume der Wiese (Eck-Tannen). (2) Die Ecken des Rahmens sind leicht unruhig (links oben abgeschnittene Tannen). (3) Kronen sind etwas kleiner und gleichförmiger als im Zielbild; mehr Größenvarianz und Stämme/Schatten zur Mitte hin sind optional. (4) Rahmen für Wald und Eis über `theme.treeFrame: true` folgt mit B-072/B-073.
- Akzeptanzkriterien:
  - Ecken im Screenshot ohne abgeschnittene Einzelbäume.

### B-087: Wiesen-Boden: Feinschliff (Hinweise aus dem Review von B-078)
- Status: vorschlag
- Aufwand: S
- Idee: (1) Plateaus werden nicht gegeneinander geprüft und überlappen teils (links unten, Mitte unten); Mindestabstand `plateauGap` in `GROUND_STYLE`. (2) Gegenüber dem Zielbild sind die Plateaus flacher und gleichförmiger; es fehlen Kiesel-/Blumengruppen und gelbe Variation (passt zu B-079). (3) Magic Numbers in `src/decor.js` (`groundPatches`/`blobShape`: 0.3, 0.76, 0.42) und `src/render-ground.js` (lineWidth 1.2, Skalen 1.02/0.92) nach `config.js` ziehen.
- Akzeptanzkriterien:
  - Plateaus überlappen höchstens leicht; Test mit Mindestabstand.
  - Keine Magic Numbers mehr in `decor.js` und `render-ground.js` für diese Funktionen.

### B-088: Wiesen-Deko: Feinschliff (Hinweise aus dem Review von B-079)
- Status: vorschlag
- Aufwand: S
- Idee: (1) Fässer (12 px hoch) wirken wie Hindernisse, sind aber bebaubar; niedriger oder seltener machen (`scatterKinds` in `src/config.js`, `barrel` 0,1). (2) Der Tester hat den Grenztest für die Streu-Deko ergänzt, aber als eigene Datei `tests/scatter-bounds.test.js`; laut CLAUDE.md gehört er nach `tests/decor.test.js` bzw. `tests/render.test.js`. Verschieben. Außerdem: `scatterFor` mit undefined/unbekannter `mapId` ist nur im Code gelesen, nicht per Test belegt; in `drawTuft` ist eine überflüssige Zeile `ctx.strokeStyle = outlineOf(...)` mit falschem Kommentar. (3) Pilze und Wegweiser sind im Screenshot kaum sichtbar; Größe oder Häufigkeit prüfen. (4) Der Test "Einzel-Deko verlässt ihre Kachel nicht" erkennt Grasbüschel nur über die Halmfarbe `#5da654`; langfristig robuster machen.
- Akzeptanzkriterien:
  - Fässer verwirren im Screenshot nicht als Hindernis (niedriger/seltener), Grenztest liegt in `tests/decor.test.js` oder `tests/render.test.js`, `npm test` grün.

### B-089: Deko-Test robuster machen (Hinweise aus den Reviews von B-071 bis B-080)
- Status: vorschlag
- Aufwand: S
- Idee: Der Test "Dekoration verlässt ihre Kachel nicht" (`tests/render.test.js`, ca. Zeilen 104 bis 140) zählt jedes `arc`/`ellipse` außerhalb von Wegkacheln als Kleindeko. Deshalb zeichnen Weg (B-071), Baumrahmen (B-077), Deko (B-079) und Akzente (B-080) ihre Kreise mit `roundRect` oder Bezier-Kurven und das Büschel mit einem Halm in `#5da654`. Die Reviews bewerteten das jeweils als vertretbar, aber es ist eine Umgehung mit Folgekosten. Besser: Den Test auf die Deko-Funktionen selbst (`decorFor`-Ergebnisse) beziehen oder die Bereiche der Hintergrund-Elemente (Kronen, Akzente, Plateaus, Weg) ausfiltern. Kleinigkeiten: Der Teich ragt ca. 36 px in die unterste Kachelreihe (nur optisch, Türme zeichnen darüber); Kommentar in `tests/render.test.js:122`; Mauer ist kleiner als im Zielbild (`ACCENT_STYLE.wall`).
- Akzeptanzkriterien:
  - Alle Hintergrund-Elemente dürfen wieder `arc`/`ellipse` nutzen, ohne dass der Test reißt; der Test prüft weiterhin die Kachelgrenzen der Kleindeko.
  - Keine Abschwächung: dieselben Fälle (Kachelgrenzen, nie auf Weg) bleiben abgedeckt.

### B-090: Wiesen-Licht und Inseln: Feinschliff (Hinweise aus dem Block-Review B-081/B-082)
- Status: vorschlag
- Aufwand: S
- Idee: (1) Lichtstreifen sind sehr dezent (`LIGHT_STYLE.beamAlpha` 0,045, im Screenshot kaum sichtbar); auf ca. 0,07 anheben, die Gesamt-Aufhellung ist per Test bei 0,3 gedeckelt. (2) Der kräftigere Reichweiten-Ring (Alpha 0,75, 2 px) und die Fläche 0,08 gelten auf allen Karten und für den Meteor-Kreis; Lesbarkeit auf den hellen Wegen von Wald/Eis/Fork per Screenshot prüfen. (3) Baumschatten per `roundRect` mit `ellipse`-Fallback: nach B-089 zurück auf `ellipse`. (4) Inseln sind 60 px breit (`ISLAND_STYLE`), bei direkt benachbarten Türmen überlappen sie leicht. (5) Tests: Der Wald/Eis/Fork-Insel-Test ist grob (weniger als 20 zusätzliche Ellipsen); Reichweitenkreis mit r=0/NaN, Kartenwechsel mit Inseln und ungültiger `ui.buildType` in `drawHover` (wirft schon vor B-082) sind ungetestet; die frühere Fläche 0,15/0,12 ist in `RANGE_STYLE` zu 0,08 zusammengefallen.
- Akzeptanzkriterien:
  - Lichtstreifen im Screenshot sichtbar, mittlere Helligkeit des Feldes mindestens 85 % von heute.
  - Reichweitenkreis auf Eis, Wald und Fork im Screenshot lesbar.
