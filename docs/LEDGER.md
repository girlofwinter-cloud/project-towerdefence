# Ledger (Entscheidungsbuch)

Das Ledger beantwortet später: **Wer hat was warum entschieden, und mit welchem Ergebnis?**
Neue Einträge werden unten angehängt. Bestehende Einträge werden nie geändert (append-only).

## Format
```
## <JJJJ-MM-TT> · <Backlog-ID> · <Titel>
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/<name>
- Runden: <n> von max. 2
- Ergebnis: fertig | blockiert
- Tests: <n> bestanden, <n> fehlgeschlagen
- Review: APPROVE | CHANGES_REQUESTED (Kernpunkte)
- Entscheidungen: Warum so und nicht anders?
- Offen: Was bleibt für Menschen?
```

---

## 2026-11-20 · Setup · Projektstart
- Rolle(n): Mensch + Claude (interaktiv)
- Ergebnis: fertig
- Tests: 18 Unit, 3 Browser bestanden
- Entscheidungen: Spiel in reinem JavaScript ohne Abhängigkeiten, damit es ohne Build-Schritt auf GitHub Pages läuft. Logik strikt von Rendering getrennt, damit Agents sie in Node testen können.
- Offen: Pipeline noch nie durchlaufen (B-001 ist der erste Kandidat).

## 2026-11-20 · Ideen · Neue Feature-Ideen
- Rolle(n): orchestrator, ideator
- Ergebnis: fertig
- Tests: nicht relevant (kein Code geändert)
- Entscheidungen: Fünf Ideen als B-003 bis B-007 mit Status `vorschlag` ins Backlog übernommen. Reihenfolge laut Ideator: B-003 und B-004 als kleine Einstiege, dann B-006, dann B-005. B-007 verändert Architektur-Annahmen (Fallen auf dem Weg) und braucht eine bewusste Freigabe.
- Offen: Ein Mensch prüft die Vorschläge und setzt gute auf `offen`. Erst dann nimmt die Pipeline sie.

## 2026-11-20 · B-001 · Wellen-Vorschau
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/wellen-vorschau
- Runden: 1 von max. 3
- Ergebnis: fertig
- Tests: 21 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert)
- Review: APPROVE (Kleinigkeiten: Summenprüfung in zwei Tests doppelt; feste Erwartungswerte für Welle 5/10 müssen bei Neubalancing angepasst werden)
- Entscheidungen: `waveSummary` zählt aus `waveFor`, damit keine Zahlen dupliziert werden. Vorschau zeigt die nächste Welle und nur, solange keine Welle läuft. Die Ideen-Einträge (B-003 bis B-007) und der Ideen-Ledger-Eintrag lagen uncommittet auf `main` und sind in diesem Commit mit enthalten.
- Offen: HUD-Anzeige einmal von Hand im Browser prüfen und E2E in einer Umgebung mit Playwright laufen lassen. Für `#wave-preview` gibt es noch kein CSS.

## 2026-11-20 · B-008 · Schwierigkeit anziehen
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/schwierigkeit
- Runden: 3 von max. 3
- Ergebnis: fertig
- Tests: 33 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert)
- Review: APPROVE (Runde 1 CHANGES_REQUESTED: Boss-Leak 10 als alleiniger Hebel, Anfang zu hart, Gewinn nur mit einer Reihenfolge. Runde 2 Tester FAIL: "nur Pfeile" bei dt 1/60 erst in Welle 12, Boss in W5/W20 effektiv schwächer als vorher.)
- Entscheidungen: Alte Werte (main) → neue Werte: START_GOLD 150 → 140; waveBonus 20+2w → 10+w; hpScale 1,13^(w-1) → 1,15 (W1-5) / 1,305 (W5-10) / 1,06 (ab W10); Goblins 6+2w → 6+3w, Abstand max(0,35; 0,9-0,03w) → max(0,3; 0,9-0,04w); Flitzer 3+w → 3+2w (Abstand 0,4 → 0,35); Trolle floor(w/2) → floor(w/2)+1, Abstand 1,2 → 1,0; Troll-HP 160 → 450; Boss-HP 900 → 850; Boss-Leak 5 → 6. Der Boss-Leak ist bewusst kein Haupthebel mehr. Drei waveSummary-Erwartungen (Welle 1, 5, 10) wurden an die neuen Zahlen angepasst, sonst wurde kein bestehender Test verändert. Die Tests laufen bei mehreren Zeitschritten (dt 1/20 bis 1/120), weil das echte Spiel mit dt bis 1/60 läuft.
- Offen: Balancing ist an Bot-Strategien getunt, ein Playtest durch einen Menschen fehlt. Wellen 14 bis 20 sind für gute Strategien verlustfrei (siehe B-013). Die Gewinn-Tests sind empfindlich gegen kleine Zahlenänderungen (hpScale-Mittelfaktor nutzbar etwa 1,29 bis 1,31, Spätfaktor kippt ab etwa 1,065). C>A>A>F bei dt 1/20 nur 4 Leben. Anpassungen der drei waveSummary-Erwartungen bitte absegnen. Die Backlog-Einträge B-009 bis B-012 (Grafik) sind in diesem Commit mit enthalten.

## 2026-11-20 · B-009 · Grafik: Gelände und Weg
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/grafik-gelaende
- Runden: 2 von max. 3
- Ergebnis: fertig
- Tests: 46 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert), Optik nicht im Browser geprüft
- Review: APPROVE (Runde 1 CHANGES_REQUESTED: große Dekoration ragte in 24 von 46 Fällen in Nachbarkacheln. Behoben durch Radius pro Art und begrenzten Versatz, Randdichte 0,7 → 0,3, Schachbrett als Grundton, paintBackground in save/restore.)
- Entscheidungen: Neue reine Logik in `src/decor.js` (Kachel-Hash, Platzierungsregel), damit sie ohne Canvas testbar ist (Regel 2). Große Dekoration nur am Feldrand, innen nur kleine flache Dekoration, nie auf dem Weg. Hintergrund wird einmal auf ein Offscreen-Canvas gezeichnet, Cache-Schlüssel ist `state.path.points`. Alles aus einfachen geometrischen Formen, keine Bilddateien und keine Vorlagen aus anderen Spielen. Der Tester hat per Proxy-Mock 335 gezeichnete Formen geprüft: keine verlässt ihre Kachel, keine liegt auf dem Weg.
- Offen: Optik im Browser ansehen (Raster-Lesbarkeit, Tor und Burg, Randdekoration neben bebaubaren Kacheln, Performance). Das Schachbrett geht stellenweise in der Variation unter (siehe B-014). Dieser Branch baut auf `agent/schwierigkeit` (B-008) auf; die Backlog-Einträge B-013 und B-014 sind in diesem Commit.

## 2026-11-20 · B-010 · Grafik: Türme
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/grafik-tuerme
- Runden: 1 von max. 3
- Ergebnis: fertig
- Tests: 55 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert), Optik nicht im Browser geprüft
- Review: APPROVE (keine Muss-Punkte; Hinweise: Rückstoß aus `def.rate` statt Level-Rate, Fallback für unbekannte Turmtypen, größere Stufen-Punkte, Auslagerung der Turm-Zeichnung, siehe B-015)
- Entscheidungen: Vier Turmtypen aus einfachen geometrischen Formen, Level an Sockelbreite, Fahnenmast mit rotem bzw. goldenem Wimpel, Zinnen und Punkten erkennbar. Der Rückstoß wird in `render.js` aus dem vorhandenen `tower.cooldown` abgeleitet, `game.js` blieb unberührt. Die Kurve steckt als reine Funktion `recoilOffset` in `src/tower-fx.js` (Regel 2: Test). `drawTower` wird exportiert, damit die Kachelgrenzen pro Typ, Stufe und Winkel isoliert getestet werden können. Der Tester hat die echte Ausdehnung in Weltkoordinaten nachgemessen: nur Pfeilturm (+1 px) und Scharfschütze (+3 px) ragen beim Zielen nach oben über die Kachel.
- Offen: Optik im Browser ansehen (Unterscheidbarkeit der Typen und Stufen, Rückstoß, Schatten, Auswahlrahmen bei übereinander stehenden Türmen). Der Branch baut auf `agent/grafik-gelaende` auf (B-008, B-009); B-015 ist in diesem Commit.

## 2026-11-20 · B-011 · Grafik: Gegner und Animation
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/grafik-gegner
- Runden: 1 von max. 3
- Ergebnis: fertig
- Tests: 70 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert), Optik nicht im Browser geprüft
- Review: APPROVE (keine Muss-Punkte; Hinweise: Neigungsruck von 0,3 rad an den Wegecken, doppelte Helfer rect/tri/disc, Phasensprung beim Slow-Wechsel, siehe B-016)
- Entscheidungen: Gegner-Zeichencode in eigener Datei `src/render-enemies.js`, damit `render.js` nicht weiter wächst. Reine Logik in `src/enemy-fx.js` (Lauf-Phase, Blickrichtung aus dem Weg), ohne `game.js` zu ändern. Animation läuft nur über `state.time`, nie über echte Zeit. Figuren sind in Einheiten von `e.radius` gezeichnet und bleiben unter 1,4 Radien, sodass das Hitbox-Gefühl stimmt. Slow-Gegner: blauer Tint, Eiskristalle und Ring. Unbekannte Gegnertypen (z. B. ein künftiger Heiler aus B-006) fallen auf eine generische Figur zurück. Der Tester hat die echte Ausdehnung in Weltkoordinaten nachgemessen: Boss bis 1,34 r (6 px über dem Radius).
- Offen: Optik im Browser ansehen (Unterscheidbarkeit der vier Gegner, Lauf-Tempo, Neigungsruck an den Ecken, Frost-Darstellung, Boss-Krone und HP-Balken, Bildrate bei vielen Gegnern). Der Branch baut auf `agent/grafik-tuerme` auf (B-008, B-009, B-010); B-016 ist in diesem Commit.

## 2026-11-20 · B-012 · Grafik: Projektile und Effekte
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/grafik-effekte
- Runden: 2 von max. 3 (die zweite Runde nach dem neuen, schnelleren Verfahren: Nachbesserung, Tester, Prüfung durch den Orchestrator, keine zweite Review-Runde)
- Ergebnis: fertig
- Tests: 91 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert), Optik nicht im Browser geprüft
- Review: CHANGES_REQUESTED in Runde 1 (Muss: ein neuer Shake-Test bestand nur im Gesamtlauf, weil er vom Hintergrund-Cache früherer Tests abhing). Behoben durch frisches Modul und Grundlinie; der Orchestrator hat die Behebung per Einzellauf geprüft, der Tester per Einzel- und Umkehr-Lauf aller neuen Tests.
- Entscheidungen: Reine Partikel-Logik in `src/fx-system.js` (Pool mit 256 Plätzen als Typed Arrays, Ringpuffer, deterministischer Zufall über `tileRand`, Zeit nur über `state.time`, Reset bei neuem Weg oder Zeitsprung rückwärts). Zeichnung in `src/render-fx.js`. Treffer werden daran erkannt, dass ein Projektil aus der Liste verschwindet; `game.js` blieb unberührt. Screen-Shake nur per `ctx.translate` in `render()`, höchstens 3 px, Eingabe unbeeinflusst. Weil jede Kanonenexplosion groß genug ist, gibt es eine Sperrzeit `SHAKE_COOLDOWN` von 1,2 s, damit das Bild bei mehreren Kanonen nicht dauernd wackelt.
- Offen: Ein einzelner Testlauf beim Entwickler meldete 612 s; in insgesamt 33 Läufen (Orchestrator und Tester, teils unter Last) nicht reproduzierbar, keine Ursache im Code gefunden, vermutlich Umgebungseffekt. Falls es wieder passiert: `node --test --test-reporter=spec` zeigt den hängenden Test. Optik im Browser ansehen (Schweife, Rauch, Funken, Münzen, Shake bei mehreren Kanonen, Hover während des Shakes). Der ältere Turm-Render-Test aus B-010 ist reihenfolgeabhängig (siehe B-017). B-017 und B-018 sind in diesem Commit. Der Branch baut auf `agent/grafik-gegner` auf (B-008 bis B-011).

## 2026-11-20 · Prozess · Pipeline schneller
- Rolle(n): Mensch + Claude (interaktiv)
- Branch: agent/pipeline-schneller
- Ergebnis: fertig
- Tests: 91 bestanden, 0 fehlgeschlagen (kein Spielcode geändert)
- Entscheidungen: Auf Wunsch des Menschen läuft die Qualitätssicherung schneller. In `.claude/skills/pipeline/SKILL.md`: Tester knapp (npm test, Diff auf gelöschte oder abgeschwächte Tests, gezielte Randfälle, Fuzz- und Mehrfachläufe nur bei Verdacht); Reviewer eine Runde, `CHANGES_REQUESTED` nur bei Muss-Punkten, Hinweise als `vorschlag` ins Backlog; Nachbesserung prüft der Orchestrator selbst; höchstens 2 Entwicklungsrunden. Format-Block oben angepasst ("max. 2"), alte Einträge bleiben unverändert.
- Offen: Nach einigen Durchläufen prüfen, ob die geringere Prüftiefe Fehler durchlässt. Der Branch baut auf `agent/grafik-effekte` auf, damit Backlog und Ledger konsistent bleiben.

## 2026-11-20 · B-019 · Nur noch 3 Leben
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/drei-leben
- Runden: 1 von max. 2 (neues, schnelleres Verfahren: tester und reviewer liefen parallel)
- Ergebnis: fertig
- Tests: 92 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert)
- Review: APPROVE (keine Muss-Punkte; Hinweis: Spätfaktor 1,07 ist durch den Boss-Test erzwungen, hpScale steht weiter auf Messers Schneide, besserer Hebel wäre Boss-Leak oder Gegnermix)
- Entscheidungen: Auf Wunsch des Menschen `START_LIVES` 20 → 3. Nachgezogen wurde nur `hpScale`: Faktor Welle 5-10 von 1,305 auf 1,26 (Welle 10 war mit 3 Leben nicht mehr schaffbar), ab Welle 11 von 1,06 auf 1,07 (damit der Boss in Welle 20 nicht schwächer als vor B-008 bleibt). Leak-Werte, Startgold und Wellen blieben unverändert. Mit Boss-Leak 6 beendet jeder durchgelassene Boss das Spiel sofort.
- Geänderte bestehende Tests (einzige zulässige Änderung, im Backlog-Eintrag so vorgesehen): vier Prüfungen `assert.ok(s.lives >= 8, ...)` in `tests/game.test.js` (Zeilen 290, 328, 364, 371) wurden zu `>= 2`, weil 8 Leben Reserve bei 3 Leben nicht mehr möglich sind. Das Backlog sprach von "drei Tests" und "mindestens 1 Leben", geändert sind vier Stellen mit der strengeren Schwelle 2. Alle übrigen Tests blieben unverändert. Neuer Test: `START_LIVES` ist 3, ein durchgelassener Boss führt zu Status 'lost' und Leben 0.
- Offen: Ein Mensch sollte ein paar Wellen von Hand spielen, ob 3 Leben fair oder zu hart sind. Die Simulation gewinnt nur mit den zwei robusten Strategien (Kanonen-lastig); bei dt 1/20 liegt A>C>C>F mit genau 2 Leben auf der Testgrenze. Die Backlog-Einträge B-006 und B-013 wurden auf Wunsch des Menschen in diesem Commit von `vorschlag` auf `offen` gesetzt.

## 2026-11-20 · B-006 · Heiler und Schildträger
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/heiler-schild
- Runden: 1 von max. 2 (tester und reviewer liefen parallel)
- Ergebnis: fertig
- Tests: 103 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert), Optik nicht im Browser geprüft
- Review: APPROVE (keine Muss-Punkte; Hinweis: Schildträger ist mit 60 Basis-HP und 1 Exemplar pro Welle bis Welle 11 fast wirkungslos, Healer mit 2 % maxHp pro Sekunde schwach, siehe B-013)
- Entscheidungen: `healer` (Schamane, Radius 1,5 Kacheln, 2 % maxHp pro Sekunde, Impuls alle 1 s Spielzeit, heilt sich nicht selbst, mehrere Healer stapeln nicht) ab Welle 7, `shielded` (Schildträger, `armor` 0,5) ab Welle 9. Heilung ist relativ zur maxHp, weil die Gegner-HP mit der Welle wachsen. Rüstung gilt für Direkttreffer von Türmen ohne Splash (Pfeil, Frost, Scharfschütze), Kanonen-Splash trifft voll, Frost-Slow bleibt unberührt. Die Werte wurden bewusst schwach gewählt, weil stärkere Varianten (3 bis 8 % Heilung, mehr HP) mit nur 3 Leben die zwei robusten Strategien in Welle 8 bis 10 zum Verlieren brachten. Heil-Aura liegt in einer eigenen Funktion `drawHealAura`, damit die bestehenden Radius-Prüfungen der Render-Tests unverändert bleiben.
- Geänderter bestehender Test (einzige zulässige Änderung): `waveSummary(10)` erwartete `{ grunt: 36, runner: 23, tank: 6, boss: 2 }`, jetzt zusätzlich `shielded: 1, healer: 1`, weil Welle 10 die neuen Typen enthält. Welle 1 und 5 unverändert. Zwei Tester-Tests wurden aus einer Zusatzdatei in `tests/game.test.js` verschoben (CLAUDE.md, Regel 2).
- Offen: Ein Mensch sollte Welle 7 bis 12 spielen: Fallen Schamane und Schildträger auf, und ist die Heil-Aura dezent genug neben dem Frost-Ring? Der Schildträger erzwingt noch keine gemischten Setups; das soll B-013 nachziehen. Der Branch baut auf `agent/drei-leben` (B-019) auf.

## 2026-11-20 · B-013 · Spätphase fordernder machen
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/spaetphase
- Runden: 1 von max. 2 (tester und reviewer liefen parallel)
- Ergebnis: fertig
- Tests: 104 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert)
- Review: APPROVE (keine Muss-Punkte; Hinweise: Gold-Überschuss in der Spätphase, Mittelphase durch stärkeren Schildträger unbeabsichtigt härter, 76-%-Schwelle empfindlich, kleine Test-Aufräumarbeiten, siehe B-020)
- Entscheidungen: Nur Zahlen in `src/config.js`. Schildträger `hp` 60 → 90 und `1 + floor((w-9)/3)` → `1 + floor((w-9)/2)` pro Welle, damit er Kanonen nötig macht. Neue Konstante `LATE_WAVE = 14`: ab Welle 15 pro Welle ein Troll und zwei Flitzer mehr; Healer ab Welle 14 `2 + floor((w-14)/3)` Stück, die mitten in der Troll-Gruppe spawnen statt hinterherzulaufen. Healer-Werte blieben unverändert (stärkere Werte ließen Welle 9 bis 10 kippen). Troll-Belohnung bleibt 14 (18 simuliert: Spätphase wird leichter). Das Backlog-Kriterium "mehr als 60 % Wegfortschritt" war im alten Stand schon erfüllt; die Test-Schwelle wurde deshalb auf 76 % in mindestens 3 der Wellen 14 bis 20 angehoben (alt: höchstens 1 Welle, neu: 4 bis 6 Wellen). `waveSummary(10)` blieb unverändert.
- Test-Umbau (auf ausdrücklichen Auftrag zulässig): Sieben Strategie-Tests wurden zu zwei gebündelten zusammengelegt, die Simulationen laufen über einen Cache nur einmal. Zuordnung alt → neu: "nur Pfeiltürme verlieren vor Welle 12" (dt 1/30), "… auch bei dt 1/60" und "Runde 3: … dt 1/20 und 1/120" → "nur Pfeiltürme ohne Aufrüstung verlieren vor Welle 12 (dt 1/20, 1/30, 1/60, 1/120)"; "mehrere gemischte Strategien … Welle 20", "robust: Kanonen-lastige Strategie", "Runde 3: Pfeil>Kanone>Kanone>Frost bei dt 1/20 und 1/120" und "Runde 3: Kanone>Pfeil>Pfeil>Frost bei dt 1/120" → "robuste Strategien gewinnen Welle 20 mit mindestens 2 Leben (dt 1/20, 1/30, 1/60, 1/120)". Tester und Reviewer haben bestätigt, dass jede Kombination (Strategie × dt × `won`/`lives >= 2`/`lost`/`wave < 12`) gleich streng erhalten blieb; die Zahl der `assert`-Zeilen stieg sogar. Neu: Fortschrittsmessung, Druck-Test, Schildträger ohne/mit Kanonen, Healer in der Troll-Gruppe, `waveFor` über Welle 1 bis 20.
- Offen: Der Druck ist moderat (+5 bis +12 Prozentpunkte Wegfortschritt), gute Strategien verlieren in der Spätphase weiter keine Leben, es bleiben etwa 1300 Gold übrig. Mit 3 Leben ist das Gewinnfenster zu eng für mehr Spawn-Dichte (B-020). Ein Mensch sollte Welle 9 bis 20 spielen: Wirkt die Spätphase bedrohlich, ist Welle 9 bis 13 jetzt zu hart, sind die Healer-Auren in der Troll-Gruppe lesbar? Der Branch baut auf `agent/heiler-schild` (B-006, B-019) auf.

## 2026-11-20 · B-002 · Pausefunktion
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/pause
- Runden: 1 von max. 2 (tester und reviewer liefen parallel)
- Ergebnis: fertig
- Tests: 108 bestanden, 0 fehlgeschlagen (Unit); E2E nicht ausgeführt, Optik nicht im Browser geprüft
- Review: APPROVE (keine Muss-Punkte; Hinweise: Tasten reagieren nicht bei Caps Lock, Wellenstart in der Pause möglich, siehe B-021)
- Entscheidungen: Pausenzustand `state.paused` in der reinen Logik, `togglePause(state)` wirkt nur bei Status `playing`, `update` kehrt bei Pause sofort zurück (auch `state.time` steht, damit Render und Effekte einfrieren). Bauen, Verkaufen und Aufrüsten bleiben erlaubt. HUD-Hinweis `#pause-hint`. Keine bestehenden Tests verändert, 4 neue Tests. Der Backlog-Eintrag stand auf `vorschlag` und wurde auf ausdrücklichen Wunsch des Menschen (B-002, B-003, B-004 umsetzen) bearbeitet.
- Offen: Pause von Hand im Browser prüfen. B-021 ist in diesem Commit. Die Branches für B-003 und B-004 gehen jeweils von `main` aus und ändern ebenfalls `src/main.js`, Tests, Backlog und Ledger; beim Zusammenführen sind Konflikte zu erwarten.

## 2026-11-20 · B-003 · Spielgeschwindigkeit x1/x2/x3
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/spielgeschwindigkeit
- Runden: 1 von max. 2 (tester und reviewer liefen parallel)
- Ergebnis: fertig
- Tests: 108 bestanden, 0 fehlgeschlagen (Unit); E2E nicht ausgeführt, HUD nicht im Browser geprüft
- Review: APPROVE (keine Muss-Punkte; Hinweise: dt=1/60-Test hängt vom Szenario ab, Teilschrittlänge nur indirekt geprüft, `stepGame` mit unendlichem dt hängt, Magic Number 0.05 in `main.js`, siehe B-022)
- Entscheidungen: Taste F, Button und Anzeige "Tempo ×N" gab es schon; neu sind `SPEED_STEPS` und `MAX_SUBSTEP` in `config.js` und die reine Funktion `stepGame`, die `dt*speed` in gleich große Teilschritte von höchstens 0,05 s zerlegt. `main.js` nutzt beides statt der Schleife mit mehrfachem `update`. Keine bestehenden Tests verändert, 4 neue. Der Backlog-Eintrag stand auf `vorschlag` und wurde auf ausdrücklichen Wunsch des Menschen bearbeitet. Der Tester hat gezeigt, dass der Test mit dt=1/60 bei anderen Turmmischungen abweicht (Pfeil 6 gegen 5 Kills); er ist deterministisch grün, aber fragil, daher B-022 statt Änderung in dieser Runde.
- Offen: Tempo-Umschaltung von Hand im Browser prüfen. Branch geht von `main` aus (nicht von `agent/pause`); `src/main.js`, Tests, Backlog und Ledger werden auch dort geändert, beim Zusammenführen sind Konflikte zu erwarten. B-022 ist in diesem Commit.
