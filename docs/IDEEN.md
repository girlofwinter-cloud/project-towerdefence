# Ideen (noch nicht freigegeben)

Einträge mit Status `vorschlag` aus Design-Prüfungen, Ideator und Reviews. Format wie in `docs/BACKLOG.md`.
Freigabe durch den Menschen: Eintrag nach `docs/BACKLOG.md` verschieben und Status `offen` setzen.
Neue Vorschläge unten anhängen (`cat >> docs/IDEEN.md`); Überblick: `grep "^### " docs/IDEEN.md`.

---

### B-160: src/theme.js als einzige Quelle der Optik-Werte
- Status: vorschlag
- Aufwand: M
- Idee: Grundlage für alle weiteren Design-Umbauten (neue Karten, Gegner, Bauteile). Neue Datei `src/theme.js` (kein DOM, in Node importierbar) mit allen Tokens aus `docs/design/system/tokens.json`: Farben, Karten-Paletten, Schrift, Konturen, Rundungen, Schatten, Abstände, Größen (camelCase, z. B. `THEME.woodB`, `THEME.maps.ice.ground`). Ab dann ist `theme.js` die Quelle; `scripts/design-tokens.mjs` wird umgedreht und erzeugt aus `theme.js` die Dateien `docs/design/system/tokens.json`, `TOKENS.md`, `tokens.css` und den `:root`-Block in `style.css` (Kommentar "erzeugt, nicht von Hand ändern"). Bestehende CSS-Variablen (`--ink`, `--cream` …) behalten ihre Namen. Noch kein Umbau der Nutzer (das ist B-161). Konzept: `docs/design/token-einfuehrung.md`.
- Akzeptanzkriterien:
  - `node scripts/design-tokens.mjs` erzeugt alle vier Ziele aus `src/theme.js`; ein zweiter Lauf ändert nichts.
  - Neuer Test in `tests/render.test.js`: die erzeugten Dateien und der `:root`-Block entsprechen `theme.js` (schlägt fehl, wenn jemand nur eine Seite ändert).
  - Inhalt von `tokens.json` vorher/nachher gleich (113 Farben, Stand main@0110569); Spiel pixelgleich, `npm test` grün.

### B-164: Styleguide-Seite mit allen Bauteilen
- Status: vorschlag
- Aufwand: M
- Idee: Nach B-160. Testseite `styleguide.html` zeigt alle Türme in allen Stufen, alle Gegner (normal, eingefroren, beschädigt, Sonderzustand), Effekte zu fünf festen Zeitpunkten, alle HTML-Bauteile in allen Zuständen (HUD, Knöpfe, Ringmenü, Kartenkarten, Spielende) und alle Karten, mit dem echten Zeichencode und eingefrorener Zeit. Zellen kommen aus `styleguideCatalog()` (liest `config.js`), neue Karten und Gegner erscheinen von selbst. Werkzeug für alle späteren Design-Umbauten: der designer prüft per Screenshot dieser Seite, jeder Optik-PR hängt Vorher/Nachher an. Bauvorlage: `docs/design/elemente/Seite-Styleguide.md`.
- Akzeptanzkriterien:
  - Alle Punkte unter "Messbare Abnahme" der Bauvorlage (u. a. 15 Turm-Zellen, ≥ 40 Gegner-Zellen, alle Karten, deterministische Screenshots mit `?t=0.5`).
  - Neue Tests: Katalog-Test in `tests/render.test.js`, `tests/e2e/styleguide.test.mjs`.

### B-161: Alle Farbwerte auf Tokens umstellen
- Status: vorschlag
- Aufwand: M
- Idee: Nach B-160 und B-164 (die Styleguide-Seite liefert den Vorher/Nachher-Vergleich). Alle Farbliterale der Stil-1-Optik durch Tokens ersetzen: `style.css` → `var(--…)`, `src/figures.js` (Kontur 84×), `src/svg-figure.js`, `src/render-painted.js`, `src/screens.js`, `src/config.js` Stil-1-Blöcke (`FIGURE_STYLE`, `PAINTED_PALETTE`, `MAPS.*.theme.painted`, `LAVA_STYLE`, `RING_MENU`) über `THEME`, `index.html` und `src/main.js` (Inline-SVG über Klassen bzw. `style="fill:var(--…)"`). Bestand je Datei: `docs/design/token-einfuehrung.md`. Reine Optik, darf in zwei Blöcken laufen (CSS/HTML, dann Canvas/SVG).
- Akzeptanzkriterien:
  - Screenshots der Styleguide-Seite und von `#game` je Karte vorher/nachher pixelgleich.
  - Nach dem Umbau greift der Wächter-Test aus B-165 ohne Ausnahmeliste für die umgestellten Dateien.
  - `npm test` und `npm run test:e2e` grün.

### B-165: Wächter-Tests für das Design-System
- Status: vorschlag
- Aufwand: S
- Idee: Nach B-161. Damit tester und reviewer Optik-Regeln nicht von Hand prüfen müssen: (1) kein Farbliteral (`#rgb`, `#rrggbb`, `rgb(a)(`) in `src/` außer `src/theme.js` und in `style.css` außerhalb des erzeugten Blocks; Ausnahmen nur über eine kurze, kommentierte Liste im Test. (2) Kontrast: für eine Liste von Paaren in `theme.js` (`contrastPairs`, z. B. `cream` auf `woodB`, `goldLight` auf `ink`) mindestens 4,5:1 bzw. 3:1 bei großer Schrift. Danach in `tester.md` und `reviewer.md` den Verweis aufs Design-System durch "Design-Regeln prüfen die Tests in `tests/render.test.js`" ersetzen (Änderung an `.claude/`, Mensch).
- Akzeptanzkriterien:
  - Beide Tests in `tests/render.test.js`, grün auf main; ein absichtlich eingefügtes `#123456` in `src/render.js` lässt den Test fehlschlagen.

### B-166: Claude Design per Skript aus theme.js befüllen
- Status: vorschlag
- Aufwand: S
- Idee: Nach B-160. `scripts/design-artifact.mjs` baut aus `docs/design/system/` den Ordner für das Design-System in Claude Design (`project/tokens.json`, `README.md`, `components/…`) im Scratchpad; der Orchestrator veröffentlicht ihn mit einem Artifact-Aufruf. Im design-Skill wird Schritt 7 (Abgleich) zu: Skript laufen lassen, einmal veröffentlichen. Damit kein Abgleich von Hand mehr nötig ist.
- Akzeptanzkriterien:
  - Ein Lauf erzeugt einen Ordner, dessen `project/tokens.json` mit `docs/design/system/tokens.json` übereinstimmt; Veröffentlichung im selben PR wie die Token-Änderung.

### B-162: Alte Stile vor Stil 1 entfernen und Doppelwerte vereinheitlichen
- Status: vorschlag
- Aufwand: M
- Idee: Nach B-161. Prüfen, welche Blöcke in `src/config.js` nach Stil 1 nicht mehr gelesen werden (`STYLE`, `ICON`, `PATH_STYLE`, `GROUND_STYLE`, `DECOR_STYLE`, `TREE_FRAME`, `ACCENT_STYLE`, `WATER_STYLE`, `SHOP_CARD`, `MAPS.*.theme.decor/path/grass`, Konstanten in `src/render.js` wie `GRASS_COLORS`, `GATE_WOOD`) und mit ihrem Zeichencode entfernen. Doppelte Schreibweisen einer Rolle (Gold `#f2c14e`/`#f4c542`, Holz `#c88a4c`/`#c58f55`/`#b97a3e`) auf einen Token bringen; wo sich dadurch sichtbar etwas ändert, dem Menschen Vorher/Nachher von der Styleguide-Seite vorlegen. Macht jede neue Karte billiger, weil nur noch eine Palette pro Karte gepflegt wird (`theme.painted`).
- Akzeptanzkriterien:
  - Kein entfernter Block wird noch importiert; Tests, die nur alte Stile prüfen, sind mit dem Menschen abgestimmt (Teständerung).
  - Verschiedene Hexwerte in `src/config.js` sinken von 319 auf höchstens 200.
  - `npm test` und `npm run test:e2e` grün.

### B-163: Kontrast der Info-Meldung
- Status: vorschlag
- Aufwand: S
- Idee: Die grüne Meldung (`#message.info`, cream auf `#4f8a34`) erreicht 3,8:1, unter 4,5:1 für Text. Vorschlag: Fläche auf `#3f7a2c` (ca. 5,0:1) abdunkeln oder Schrift mit `text-shadow 0 2px 0 ink` wie im Pause-Banner. Kann jederzeit laufen; nach B-165 als Paar in `contrastPairs` aufnehmen.
- Akzeptanzkriterien:
  - Kontrast cream zu Meldungsfläche ≥ 4,5:1 (gemessen), Token `message-info` im Design-System nachgezogen.

### B-128: Magier stärker machen
- Status: vorschlag
- Aufwand: M
- Idee: Der Magier-Schild aus B-126 steht nur auf `wardShare` 0,05, weil bei 0,25 bestehende Strategie-Tests (Eiswelt, Zwei Fronten, Pfeil-Mix vor Welle 15) kippen. Für spürbare Wirkung den Schild auf etwa 0,15 bis 0,25 anheben und die betroffenen Strategie-Grenzen neu bewerten (Teständerung, nur mit dem Menschen). Nebenbei: Deckkraft der Schild-Blase (`0.35 + 0.65 * frac` in `src/render-enemies.js`) nach `ENEMY_STYLE.mage`.
- Akzeptanzkriterien:
  - Schild im Spiel klar spürbar; perfektes Spiel bleibt auf allen Karten möglich.

### B-105: Statistik je Turm im Panel
- Status: vorschlag
- Aufwand: S
- Idee: Jeder Turm zählt verursachten Schaden und Kills; das Turm-Panel zeigt beides, die Endübersicht nennt den „MVP-Turm“. Kein Balancing-Einfluss, liefert aber Daten, welcher Turm wirklich trägt. (Ideator, Spaß 3/5, Empfehlung zuerst)
- Akzeptanzkriterien:
  - `tower.damageDealt` und `tower.kills` in `game.js`; Splash- und Kettenschaden zählen beim auslösenden Turm; Test: Summe gegen verlorene HP.
  - Werte verschwinden beim Verkauf; Panel auf Desktop und Handy lesbar (Screenshot).

### B-106: Neuer Gegner „Saboteur“
- Status: vorschlag
- Aufwand: M
- Idee: Mittelschneller Gegner, der einen Turm in seiner Nähe für ein paar Sekunden lahmlegt (ein Turm gleichzeitig, mit Abklingzeit). Bestraft Klumpenbau, macht das Spiel schwerer. Kommt erst ab etwa Welle 8. Risiko: Balancing, perfektes Spiel muss auf allen 5 Karten möglich bleiben. (Ideator, Spaß 4/5, Empfehlung zuerst)
- Akzeptanzkriterien:
  - `ENEMY_TYPES.saboteur` mit `jamRadius`, `jamTime`, `jamCooldown` in `config.js`; Test: lahmgelegter Turm schießt in der Zeit nicht; Boss-Türme/Boss unbeeinflusst.
  - Test „perfektes Spiel möglich“ bleibt auf allen Karten grün; Standard-Strategien per Simulation gemessen.

### B-107: Bau rückgängig in der Bauphase
- Status: vorschlag
- Aufwand: S
- Idee: Türme, die seit dem letzten Wellenstart gebaut oder aufgerüstet wurden, lassen sich zu 100 % statt zu `SELL_RATIO` (70 %) zurücknehmen. Gegen Frust bei Fehlklicks; während einer Welle gilt weiter 70 %, also kein Exploit. (Ideator, Spaß 3/5)
- Akzeptanzkriterien:
  - Volle Erstattung nur ohne laufende Welle und für Türme/Upgrades derselben Bauphase (Test).
  - Während einer laufenden Welle nur `SELL_RATIO` (Test).

### B-108: Alle Reichweiten anzeigen (Taste R halten)
- Status: vorschlag
- Aufwand: S
- Idee: Solange R gedrückt ist bzw. ein Handy-Knopf aktiv ist, zeichnet das Spiel die Reichweiten aller Türme halbtransparent. Zeigt Lücken in der Abdeckung; reine Anzeige. (Ideator, Spaß 2/5)
- Akzeptanzkriterien:
  - Zustand in `main.js`, ausgewertet nur in `render.js`; `game.js` unverändert.
  - Render-Test: N Kreise bei N Türmen; auf dem Handy per Knopf erreichbar (Screenshot).

### B-109: Herausforderungen je Karte (Abzeichen)
- Status: ersetzt durch Paket „Albtraum“ (B-182 bis B-186, im Backlog)
- Aufwand: M
- Idee: Je Karte 2 bis 3 optionale Bedingungen mit Abzeichen, z. B. „ohne Fähigkeiten“, „höchstens 2 Turmtypen“, „ohne Verkaufen“; gespeichert im Fortschritt. Wiederspielwert ohne neue Inhalte, macht nichts leichter. Risiko: jede Herausforderung per Simulation als schaffbar belegen. (Ideator, Spaß 4/5)
- Akzeptanzkriterien:
  - `CHALLENGES` in `config.js`; reiner Prüfer `checkChallenge(state, id)` in Node getestet (erfüllt/verletzt).
  - Abzeichen im Fortschritt gespeichert und in der Kartenauswahl sichtbar; alte Speicherstände laden (Test).

### B-110: Tagesherausforderung mit Zufalls-Modifikatoren
- Status: ersetzt durch Paket „Albtraum“ (B-182 bis B-186, im Backlog)
- Aufwand: M
- Idee: Ein Seed aus dem Datum wählt Karte und 1 bis 2 Erschwernisse (z. B. Gegner +10 % Tempo, Kanone −15 %, Start-Gold −20), dazu ein lokaler Tagesrekord. Nur Erschwernisse, also nie leichter. Risiko: unschaffbare Kombinationen, daher feste, per Simulation geprüfte Liste. (Ideator, Spaß 4/5)
- Akzeptanzkriterien:
  - `dailySetup(dateString)` deterministisch (Test: gleiches Datum gleich, anderes Datum anders).
  - Modifikatoren über den vorhandenen `modifiers`-Mechanismus; Rekord je Datum gespeichert.

### B-111: Held-Einheit
- Status: vorschlag
- Aufwand: L
- Idee: Ein steuerbarer Held neben dem Weg, per Klick/Tippen versetzbar (mit Laufzeit), kämpft im Nahkampf, hält Gegner kurz auf und steigt pro Welle auf. Neue Mechanik mit großem Risiko für Balancing (stopft Lücken) und Handy-Bedienung; Ausgleich z. B. über Gold-Abzug pro Welle. (Ideator, Spaß 5/5)
- Akzeptanzkriterien:
  - Reine Logik in `game.js`: Bewegung, Blocken (max. 1 Gegner, Boss nicht blockbar), Tod und Wiederbelebung nach `respawnTime`, getestet.
  - Simulation: Bestrategie mit Held nicht leichter als ohne (Gold- und Lebensbilanz je Karte).

### B-100: Seitenhinweis für feste Gegner-Seiten
- Status: vorschlag
- Aufwand: S
- Idee: Auf Zangenangriff und Zwei Fronten kommen Flitzer immer oben, Troll/Schildträger/Schamane immer unten (B-099). Die Wellenvorschau zeigt das noch nicht. Kleines Symbol je Eingang (z. B. Flitzer-Icon oben, Troll-Icon unten) vor Wellenstart, damit man es ohne Ausprobieren erfährt.
- Akzeptanzkriterien:
  - Vor jeder Welle ist je Eingang sichtbar, welche Gegnertypen dort kommen (aus `MAPS.<id>.lanes` und `waveSummary`).
  - Keine Änderung an der Spiel-Logik; Desktop und Handy lesbar (Screenshot).

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


### B-083: Feste Bauplätze wie im Referenzbild (Spiel-Änderung, nur nach Freigabe)
- Status: vorschlag
- Aufwand: L
- Idee: Im Referenzbild gibt es feste Bauplätze, bei uns ist jede Nicht-Weg-Kachel bebaubar. Feste Plätze brauchen eine Config-Liste `buildSpots` je Karte, Prüfung in `canBuild`, Eingabe/Hover, neue Tests und Balancing (weniger Standorte, andere Strategie, Strategie-Tests neu). Bricht Annahmen der bisherigen Spielmechanik, daher nur nach ausdrücklicher Freigabe durch einen Menschen. Optik der Inseln siehe B-082.
- Akzeptanzkriterien:
  - Pro Karte `buildSpots` in `src/config.js`; `canBuild` erlaubt nur dort.
  - Alle Strategie-Läufe (Welle 20) auf allen Karten weiter gewinnbar; Zahlen im Ledger.
  - Test: Bauen außerhalb der Plätze scheitert; Hover zeigt freie/belegte Plätze.


### B-074: Vulkan und Wüste (Design-Overhaul)
- Status: vorschlag
- Aufwand: L
- Idee: Vulkan hat mit B-030 schon seinen Flat-Pop-Stil. Offen: Wüste (B-031) mit Dünen und Kakteen.
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
- Idee: (1) Der Test "Dekoration verlässt ihre Kachel nicht" läuft seit B-077 auf `fork`; der Tester hat einen zusätzlichen Wiesen-Test ergänzt (Busch, Fels, Blume, Tuft, Kiesel). Ungeprüft bleiben nur nicht verdeckte Einzelbäume der Wiese (Eck-Tannen). (2) Die Ecken des Rahmens sind leicht unruhig (links oben abgeschnittene Tannen). (3) Kronen sind etwas kleiner und gleichförmiger als im Zielbild; mehr Größenvarianz und Stämme/Schatten zur Mitte hin sind optional. (4) Rahmen für Eis über `theme.treeFrame: true` folgt mit B-073.
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
- Idee: (1) Lichtstreifen sind sehr dezent (`LIGHT_STYLE.beamAlpha` 0,045, im Screenshot kaum sichtbar); auf ca. 0,07 anheben, die Gesamt-Aufhellung ist per Test bei 0,3 gedeckelt. (2) Der kräftigere Reichweiten-Ring (Alpha 0,75, 2 px) und die Fläche 0,08 gelten auf allen Karten und für den Meteor-Kreis; Lesbarkeit auf den hellen Wegen von Eis/Fork/Zwei Fronten per Screenshot prüfen. (3) Baumschatten per `roundRect` mit `ellipse`-Fallback: nach B-089 zurück auf `ellipse`. (4) Inseln sind 60 px breit (`ISLAND_STYLE`), bei direkt benachbarten Türmen überlappen sie leicht. (5) Tests: Der Eis/Fork-Insel-Test ist grob (weniger als 20 zusätzliche Ellipsen); Reichweitenkreis mit r=0/NaN, Kartenwechsel mit Inseln und ungültiger `ui.buildType` in `drawHover` (wirft schon vor B-082) sind ungetestet; die frühere Fläche 0,15/0,12 ist in `RANGE_STYLE` zu 0,08 zusammengefallen.
- Akzeptanzkriterien:
  - Lichtstreifen im Screenshot sichtbar, mittlere Helligkeit des Feldes mindestens 85 % von heute.
  - Reichweitenkreis auf Eis, Fork und Zwei Fronten im Screenshot lesbar.

### B-091: Welten: Feinschliff (Hinweise aus dem Block-Review B-072/B-073)
- Status: vorschlag
- Aufwand: S
- Idee: (1) Test mit synthetischer Karte ohne `theme.ground`, damit der Schachbrett-Zweig (alte Zeichnung) nicht ungetestet bleibt: Alle vier Karten haben jetzt `theme.ground`. (2) Der Fork-Test in `tests/render.test.js` ("Dekoration verlässt ihre Kachel nicht") entfernt `MAPS.fork.theme` per `delete` und `createGame` vor dem `try`; beides in den `try`-Block verschieben, damit das Theme bei einem Fehler zurückgesetzt wird. (3) `path.edge` in `config.js` ist ein toter Wert (nur im Test geprüft, nicht gezeichnet); entfernen oder nutzen. (4) Der orange Saum auf Fork (`#e0803a`) ist laut, Deckkraft als Parameter. (5) Das Eis-Theme enthält noch die alten Felder `grass` und `blade`. (6) Der Fork-Test löscht `MAPS.fork.theme` und prüft damit den Pfad ohne Theme, nicht mehr die echte Fork-Deko (Tester: "leichte Schwächung", die echte Deko deckt `tests/scatter-bounds.test.js`); eine Prüfung der echten Fork-Deko gegen die Kachelgrenzen ergänzen. Test-Titel nennen noch "Wiese", obwohl sie alle Karten prüfen. (7) Fork hat noch keine `islands` und `accents` (Mauer, Teich, Brunnen), Eis auch nicht.
- Akzeptanzkriterien:
  - Schachbrett-Zweig getestet, Fork-Test räumt auch bei Fehlern auf, toter Wert entfernt, `npm test` grün.

### B-092: Türme und Gegner: Feinschliff (Hinweise aus dem Block-Review B-064 bis B-066)
- Status: vorschlag
- Aufwand: S
- Idee: (1) `TOP_ALLOWED` in `tests/render.test.js` auf den gemessenen Maximalüberstand plus kleine Reserve setzen und im Kommentar nennen; Scharfschütze (3,5 auf 20 px) ist am großzügigsten, Kanone im Weltkoordinaten-Test (vorher 0, jetzt 4) prüfen. (2) Zeichen-Geometriezahlen in `src/render-towers.js` und `src/render-enemies-flat.js` schrittweise in die Style-Tabellen in `config.js` ziehen. (3) Mit B-067 den Vergleich Boss gegen andere Typen in `tests/fx.test.js` wieder ergänzen.
- Akzeptanzkriterien:
  - Grenzen belegt, Zahlen in `config.js`, `npm test` grün.

### B-102: Feinschliff aus dem Block-Review B-095 bis B-097 und B-101
- Status: vorschlag
- Aufwand: S
- Idee: (1) Gravitation und Dämpfung des Boss-Staubs (`src/fx-system.js`, -10 und 3) als `dustGravity`/`dustDrag` nach `BOSS_ENTRY`. (2) Bei 200 % Schrift läuft auf dem Handy die rechte Spalte des Shop-Rasters aus dem Bild („Scharfschü…“ abgeschnitten; bestand schon vorher).
- Akzeptanzkriterien:
  - (3) `startMap` gegen unsanitisierte Eingabe ohne `maps` härten (wirft heute TypeError; in der Praxis nicht erreichbar).
  - Keine festen Zahlen im Staub-Code; Shop bei 390x844 und 200 % Schrift ohne horizontales Abschneiden; `npm test` grün.

## Vollbild-Layout (Zielbild vom designer, 2026-11-26)
Zielbilder: `docs/design/vollbild-desktop.png`, `vollbild-ring.png`, `vollbild-start.png`, `vollbild-handy-quer.png`, `vollbild-handy-hoch.png`. Empfehlung des designers: Plaketten und Knöpfe wie Variante A (Holz, ruhig), Ringmenü als Donut wie Variante B, Leuchten der Fähigkeitsknöpfe aus B. Freies Bauraster bleibt (feste Bauplätze abgelehnt). B-129 bis B-132 hängen zusammen und laufen als ein Block, sonst ist das Spiel dazwischen unbedienbar. B-133 bis B-137 einzeln. Keine Spiel-Logik außer B-140.

### B-140: Welle früher rufen während der Welle (Spiel-Logik, nur nach Freigabe)
- Status: vorschlag
- Aufwand: S
- Idee: Die Fahne bzw. ein "Früher!"-Knopf ruft die nächste Welle, während die aktuelle noch läuft (in den Handy-Zielbildern zu sehen). Das ist eine Mechanik-Änderung, ein Bonus wäre Balancing. Abgrenzung zum vorhandenen Frühstart-Bonus (B-123) klären.
- Akzeptanzkriterien:
  - Vom Menschen freigegeben, Regel "perfektes Spiel bis Welle 20" auf allen Karten weiter erfüllt.

## Stil-Exploration (designer in Claude Design, 2026-11-26)
Fläche mit vier Stilen für dieselbe Szene (Wiese, Welle 8): https://claude.ai/artifact/DDKsUvgQVD4SJu2VnSqE3W (privat). Kingdom Rush nur als Niveau-Referenz, keine Nachbauten. Empfehlung des designers: Stil 1 "Gemalt und warm" als Hauptrichtung (ca. 70 % des Kingdom-Rush-Niveaus), Stil 2 "Papier-Diorama" als Zweitwahl oder eigene Welt, Stil 4 "Mondnacht" als Nachtkarte, aus Stil 3 "Miniatur-Spielbrett" nur die Team-Sockel. Alle Einträge sind nur Zeichnen, außer wo vermerkt.

### B-146: Nachtkarte "Mondnacht" (neue Welt, Idee)
- Status: vorschlag
- Aufwand: M
- Idee: Eigene Karte oder Nacht-Stimmung nach Stil 4: Blaugrün mit Mondlicht, Laternen am Weg mit warmen Lichtkegeln, erleuchtete Turmfenster, leuchtende Gegneraugen. Lichtkegel per `globalCompositeOperation='lighter'` mit vorgerenderten Sprites. Neue Karte = neue Wege und Balancing (Entscheidung des Menschen).
- Akzeptanzkriterien:
  - Weg-Kontur und Gegner im Screenshot klar lesbar (Helligkeitsabstand Gegner/Weg mindestens 25 %).
  - Frame-Zeit mit 20 Lichtkegeln höchstens +1 ms, "perfektes Spiel bis Welle 20" erfüllt.

## Stil 1 komplett übernehmen (Plan des designers, 2026-11-26)
Der Mensch hat entschieden, das Zielbild `docs/design/stil1-ziel.png` komplett zu übernehmen. Plan mit Zeilenverweisen in den Entwurf: `docs/design/stil1-plan.md`, Entwurfscode `docs/design/stil1-entwurf.dc.html`. B-138, B-144 und B-145 gehen in B-150, B-151 und B-153 auf. Abnahme jeweils per Screenshot neben dem Zielbild. Nur Zeichnen, außer wo vermerkt. Blöcke: A = B-142, B-143, B-148, B-149, B-147; B = B-150, B-151, B-152; C = B-129, B-130, B-133, B-134, B-135, B-139, B-141, B-153; D = B-131, B-132, B-136; E = B-154, B-137.

## Designprüfung Albtraum-Karten (designer, 2026-11-28)

### B-201: Albtraum Zangenangriff: Weg-Kontrast anheben
- Status: freigegeben (BACKLOG)
- Aufwand: S
- Idee: Weg (`path.main #d6ab70`) hebt sich kaum vom hellbraunen Boden ab (Muss-Befund). Weg heller/kühler (Richtung `#ecdcb8`) oder Boden ca. 15 % dunkler, nur Theme-Farben in `src/config.js`.
- Akzeptanzkriterien:
  - Luminanzabstand Weg-Mitte zu Boden mindestens 25 % (Pixelprobe im Screenshot).

### B-202: Albtraum Zwei Fronten: Weg aufhellen
- Status: freigegeben (BACKLOG)
- Aufwand: S
- Idee: Weg und Boden beide lila-grau, nur die Kanten tragen die Lesbarkeit. Weg heller (cremig-lila), Boden etwas dunkler.
- Akzeptanzkriterien:
  - Luminanzabstand Weg-Mitte zu Boden mindestens 25 %.

### B-203: Albtraum Vulkan: Bodenrisse beruhigen, Weg wärmer
- Status: freigegeben (BACKLOG)
- Aufwand: S
- Idee: Leuchtende Bodenrisse sind so laut wie die Lava, Feld wirkt unruhig. Risse ca. 50 % weniger Dichte/Deckkraft, volles Leuchten nur für Lavaflüsse. Weg-Mitte `#8b7468` wärmer setzen.
- Akzeptanzkriterien:
  - Höchstens halb so viele Rissstriche pro Fläche, Lavaflüsse unverändert.

### B-204: Albtraum Zangenangriff: Glut-Deko vom Weg nehmen
- Status: freigegeben (BACKLOG)
- Aufwand: S
- Idee: Orange Glut-Schnörkel und Glimmpunkte liegen auf dem Weg und sind mit Effekten verwechselbar. Nur neben den Weg legen.
- Akzeptanzkriterien:
  - Kein Deko-Element überlappt Wegkacheln, Test in `tests/decor`.

### B-205: Albtraum-Signatur: leises Weg-Glühen in Weltfarbe (mutig)
- Status: vorschlag
- Aufwand: M
- Idee: Einheitlicher, statischer, leiser Glüh-Strich am Wegrand in der Weltfarbe auf allen Albtraum-Karten. Stärkt Einheitlichkeit und Lesbarkeit. Neues Token je Welt im Design-System.
- Akzeptanzkriterien:
  - Wegrand auf allen 5 Karten sichtbar, Frame-Zeit unverändert, Token in `docs/design/system/`.

### B-206: Albtraum-Wiese: mehr Baum- und Buschaugen
- Status: freigegeben (BACKLOG)
- Aufwand: S
- Idee: Jeder 2.-3. Randbaum (oben/rechts) bekommt ein Augenpaar im Astloch (`twistedTreeEyes` öfter), dazu 2-3 Büsche unten mit selten blinzelnden Augen (period ~8 s). Teilchen-Budget: `blink` 10 -> 14, `rise` 24 -> 18. Nur Rand, mind. 1 Kachel Abstand zum Weg, Handy höchstens halb so viele, Augen höchstens 6 px.
- Akzeptanzkriterien:
  - Mindestens 8 sichtbare Augenpaare im Rand (Desktop 1280x800).
  - Test: kein neues Element auf Weg-Kacheln; Teilchensumme unter `maxDesktop`/`maxCompact`.

### B-207: Albtraum-Augen folgen dem Geschehen
- Status: vorschlag
- Aufwand: M
- Idee: Pupillen aller Albtraum-Augen verschieben sich um höchstens 1 px Richtung Mauszeiger oder nächsten Gegner. Gemeinsames Merkmal aller Albtraum-Karten, in `src/render-nightmare.js`.
- Akzeptanzkriterien:
  - Test prüft Pupillenversatz <= 1 px und Richtung; bei `prefers-reduced-motion` statisch.

### B-208: Albtraum-Wiese: Schattenhand und Irrlichter
- Status: vorschlag
- Aufwand: M
- Idee: Alle 20-30 s taucht kurz (1,5 s) eine dunkle Hand am Seeufer auf; statt einzelner `rise`-Funken 2 langsam pendelnde türkise Irrlichter mit Halo.
- Akzeptanzkriterien:
  - Höchstens 1 Hand gleichzeitig, nie auf dem Weg; Teilchenzahl nicht höher als heute.

### B-209: Kleine Gruselelemente auf den übrigen Albtraum-Karten
- Status: freigegeben (BACKLOG)
- Aufwand: M (je Karte S)
- Idee: Je Karte zuerst ein S-Element: Eis – schwache Augen hinter Eisblöcken (alpha 0,5) oder Atemwölkchen aus dem Tannendickicht; Zangenangriff – Glutaugen in verkohlten Baumstümpfen; Zwei Fronten – Augen in den Gruftfenstern blinzeln echt, Geisterschleier zwischen Grabsteinen; Vulkan – Augenpaare mit Lid in Basaltspalten. Später (M): Gesicht unter dem Eis, Krähen, Grabhand, Lava-Schlitzauge.
- Akzeptanzkriterien:
  - Je Karte sichtbar im Screenshot, nicht auf dem Weg (Test), Teilchenbudget eingehalten, Augen nicht mit Glutpunkten/Gegnern verwechselbar.

### B-218: Handy: Gold-Schild verdeckt Eingangsweg (Albtraum Nachtfriedhof)
- Status: vorschlag
- Aufwand: S
- Idee: Bei 844x390 liegt das Schild "Gold: ohne Pfeilturm" über Reihe 1 (Spalten 5-9), genau auf dem Eingangsweg. Schild höher setzen oder nach Wellenstart ausblenden. Nett dazu: Rand-Tannen ragen in Reihe 13 über den unteren Nebenweg.
- Akzeptanzkriterien:
  - Bei 844x390 schneidet das Schild keine Wegkachel oder blendet nach Wellenstart aus (Screenshot).
