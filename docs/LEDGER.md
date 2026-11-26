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

## 2026-11-20 · B-004 · Zielmodus pro Turm
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/zielmodus
- Runden: 1 von max. 2 (tester und reviewer liefen parallel)
- Ergebnis: fertig
- Tests: 108 bestanden, 0 fehlgeschlagen (Unit); E2E nicht ausgeführt, Bedienung nicht im Browser geprüft
- Review: APPROVE (keine Muss-Punkte; Hinweise: Startwert aus `TARGET_MODES[0]`, kein Integrationstest über `update()`, siehe B-023)
- Entscheidungen: `TARGET_MODES` und deutsche Anzeigenamen `TARGET_MODE_NAMES` in `config.js`. Die Zielauswahl liegt als reine Funktion `pickTarget(enemies, tower, range, mode)` in `game.js`; `findTarget` ruft sie mit `tower.targetMode` auf. `first` = größtes `dist` (wie vorher, auch bei Gleichstand), `last` = kleinstes `dist`, `strong` = höchste aktuelle HP, `close` = geringster Abstand zum Turm; Gleichstand: erster in der Liste. `setTargetMode` lehnt unbekannte Modi und unbekannte Türme mit deutscher Begründung ab. Bedienung per Taste T und Button im Turm-Panel. Der Tester hat 2 Randfall-Tests ergänzt (hp<=0, Gleichstand, Reichweitenrand, Turm ohne Feld, Moduswechsel, Rüstung). Keine bestehenden Tests verändert. Ein Stop-Hook meldete mitten im Lauf einen roten Test, das war der noch unfertige Tester-Test; am Ende grün. Der Backlog-Eintrag stand auf `vorschlag` und wurde auf ausdrücklichen Wunsch des Menschen bearbeitet.
- Offen: Bedienung von Hand im Browser prüfen (T, Button, Wechsel zwischen Türmen). Branch geht von `main` aus; `src/main.js`, `src/game.js`, Tests, Backlog und Ledger werden auch in den Branches zu B-002 und B-003 geändert, beim Zusammenführen sind Konflikte zu erwarten. B-023 ist in diesem Commit.

## 2026-11-20 · Aufräumen · Refactoring ohne neue Features
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/aufraeumen
- Runden: 2 von max. 2 (Runde 2 nur Nachbesserung, vom Orchestrator geprüft)
- Ergebnis: fertig
- Tests: 118 bestanden, 0 fehlgeschlagen (Unit); E2E nicht ausgeführt
- Review: Runde 1 CHANGES_REQUESTED (Muss: der bestehende Tempo-Test dt=1/60 war ersetzt statt ergänzt, Regel 2). Behoben: Originaltest unverändert wiederhergestellt, der neue Test mit identischen Teilschritten bleibt zusätzlich; der Orchestrator hat per `git diff` geprüft, dass in `tests/game.test.js` keine Zeile entfernt wurde. Hinweis: `MAX_SUBSTEP` wird in `frame()` zweckentfremdet, siehe B-024.
- Entscheidungen: Auf Wunsch des Menschen nur Aufräumen aus B-021, B-022, B-023 und B-016 (Punkt 2). (1) `MAX_SUBSTEP` statt Magic Number in `main.js`; (2) Startmodus `TARGET_MODES[0]`; (3) Tasten in `main.js` über `ev.key.toLowerCase()` (einzige Verhaltensänderung: Tasten reagieren jetzt auch bei Caps Lock oder Shift); (4) `disc`, `rect`, `tri` zentral in `src/draw-utils.js`, `disc` hat jetzt die Reihenfolge `(ctx, color, x, y, r)`; (5) `stepGame` bricht bei nicht endlichem `dt*speed` ab, plus Tests. Der Tester hat die Zeichenausgabe über 120 Renderläufe mit Mock-Canvas gegen `main` verglichen: 1.085.247 Protokollzeilen byte-identisch.
- Offen: Nicht erledigt sind der Wellenstart in der Pause (B-021 Punkt 2), der fragile dt=1/60-Test (bleibt nach Regel 2 bestehen) und die direkte Prüfung der Teilschrittlänge. Die Backlog-Einträge B-021 bis B-023 sind nur teilweise erledigt und weiter `vorschlag`; B-024 ist neu. Zeichnung im Browser einmal ansehen.

## 2026-11-20 · HUD · Tasten und Leben sichtbar machen
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/hud-sichtbar
- Runden: 1 von max. 2 (tester und reviewer liefen parallel)
- Ergebnis: fertig
- Tests: 119 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert), Optik nicht im Browser geprüft
- Review: APPROVE (keine Muss-Punkte; Hinweise: leere Herzen schlecht sichtbar, reduzierte Bewegung, Banner bei schmaler Breite, Screenreader, siehe B-025)
- Entscheidungen: Auf Wunsch des Menschen (kein Backlog-Eintrag): Der Spieler wusste nicht, dass `P` pausiert, und die Leben standen nur als kleine Zahl im Header. Neu: Pause-Button (wechselt zwischen "Pause (P)" und "Weiter (P)"), Banner "PAUSE" über dem Spielfeld (Klicks gehen durch, Bauen bleibt möglich), Tastenhinweise in den Buttons (F, P, Leertaste), Steuerungshilfe standardmäßig offen und vollständig, Herzreihe für die Leben (`livesText` in `src/hud.js`, ohne DOM, getestet) mit Zahl daneben und roter, pulsierender Warnung bei `LOW_LIVES` (neue Konstante in `config.js`, Wert 1). Keine Spiel-Logik und kein Balancing geändert, keine bestehenden Tests verändert, ein neuer Test.
- Offen: Optik im Browser ansehen (Herzen, Banner, Lesbarkeit der Hilfe, Layout bei schmaler Breite). B-025 ist in diesem Commit.

## 2026-11-20 · UI-Optik · Cartoon-Holz-Look (Prototyp)
- Rolle(n): orchestrator (direkt, ohne Sub-Agenten)
- Branch: agent/ui-optik
- Runden: 1
- Ergebnis: fertig (Prototyp)
- Tests: 119 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig (Playwright nicht installiert). Optik per Headless-Chrome-Screenshot geprüft.
- Review: nicht durchgeführt (Wunsch: schneller Prototyp)
- Entscheidungen: Auf Wunsch des Menschen, Referenz: klassische Cartoon-Tower-Defence-Spiele. Nur Darstellung: (1) HUD (Gold, Welle, Leben) als Holzleiste oben im Spielfeld statt im Header, (2) Holz-Seitenleiste mit goldenen Akzenten, grüner Start-Button, (3) Turm-Karten mit Mini-Turm (nutzt `drawTower` aus `render.js`, keine neuen Grafiken), (4) wärmere Gelände-Farben (sandiger Weg, sattes Gras), (5) Banner/Overlay/Meldung im selben Stil. Element-IDs unverändert, keine Logik, kein Balancing, keine Tests geändert.
- Offen: Gegner und Projektile sind noch im alten Stil; Ideen für später: Wellenfortschrittsleiste, Münz-/Herz-Icons als Zeichnung statt Emoji, Bauplätze statt freiem Raster.

## 2026-11-20 · Leben · 10 statt 3 Leben
- Rolle(n): orchestrator (direkt, ohne Sub-Agenten)
- Branch: agent/zehn-leben
- Runden: 1
- Ergebnis: fertig
- Tests: 119 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig. HUD per Headless-Screenshot geprüft.
- Review: nicht durchgeführt
- Entscheidungen: Auf Wunsch des Menschen (Balancing-Änderung): `START_LIVES` 3 -> 10, `LOW_LIVES` 1 -> 3 (rote Warnung bei 3 von 10). Der Test aus B-019 fixierte bewusst 3 Leben; er wurde an die neue Vorgabe angepasst, nicht abgeschwächt: Er prüft jetzt START_LIVES = 10, dass ein Boss 6 Leben kostet (Rest 4, Spiel läuft), und weiterhin, dass bei 0 Leben das Spiel verloren ist und die Zahl nicht negativ wird (mit `lives: 2`). Die mobile Verkleinerung der Herzen im HUD gehört zu PR #14 (agent/ui-mobil), nicht zu diesem Branch.
- Offen: Balancing neu beurteilen: 10 Leben machen das Spiel deutlich leichter; die Strategie-Tests (`lives >= 2`) sind damit weniger streng.
## 2026-11-20 · UI-Optik · HUD aus dem Bild, Mobilansicht
- Rolle(n): orchestrator (direkt, ohne Sub-Agenten)
- Branch: agent/ui-mobil
- Runden: 1
- Ergebnis: fertig (Prototyp)
- Tests: 119 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig. Optik per Headless-Chrome-Screenshot (1300 px und 500 px Breite) geprüft.
- Review: nicht durchgeführt (Prototyp)
- Entscheidungen: Auf Wunsch des Menschen. (1) Die HUD-Leiste lag über dem Canvas und verdeckte Bauplätze; sie steht jetzt über dem Spielfeld (`.stage` umschließt Canvas, Overlay, Meldung, Pause-Banner). (2) Mobil (<= 700 px): Header, Footer und Tastenhilfe ausgeblendet, kleinere Ränder, Turmauswahl als 2x2-Raster ohne Beschreibung, Turm-Info vor der Turmauswahl. Herzen im HUD mobil kleiner (Platz für 10 Leben aus PR #15). Keine Logik, keine Tests, keine IDs geändert.
- Offen: Echtes Gerät testen (Touch, Querformat). Auf kleinen Geräten steht noch "(Leertaste)" im Start-Button.


## 2026-11-20 · Balancing · Kanone mit mehr Reichweite
- Rolle(n): orchestrator (direkt, ohne Sub-Agenten; Tester und Reviewer auf Wunsch des Menschen übersprungen)
- Branch: agent/kanone-reichweite
- Runden: 1
- Ergebnis: fertig
- Tests: 119 bestanden, 0 fehlgeschlagen (Unit); E2E nicht lauffähig
- Review: nicht durchgeführt (Wunsch des Menschen)
- Entscheidungen: Kanonen-Reichweite 2,6 -> 3,4 Kacheln (Pfeilturm 3, Scharfschütze 6). Jede Erhöhung ab 2,8 machte die Wellen 14-20 leichter und brach zwei Balancing-Tests. Auf Rückfrage entschied der Mensch: Test-Schwellen bewusst anpassen. Geändert (Messwerte bei 3,4): `LATE_PROGRESS` 0,76 -> 0,5 (gemessen 53-81 % des Wegs, weiterhin mindestens 3 Wellen) und Mindestvorsprung im Schildträger-Test 0,05 -> 0,02 (`SHIELD_MARGIN`, gemessen min. 0,03 in Welle 9). Alle anderen Assertions unverändert, keine Tests gelöscht.
- Offen: Das Spiel ist in der Spätphase insgesamt leichter (zusammen mit 10 Leben, PR #15). Wenn es zu leicht wird, Gegner der Wellen 14-20 stärken (B-013 neu justieren).

## 2026-11-20 · Test · Spätphase-Schwelle 50 -> 55 %
- Rolle(n): orchestrator (direkt); Anlass: Hinweis des Reviewers zu PR #16
- Branch: agent/spaetphase-schwelle
- Runden: 1
- Ergebnis: fertig
- Tests: 119 bestanden, 0 fehlgeschlagen (Unit)
- Review: nicht durchgeführt (Ein-Zeilen-Änderung eines Schwellwerts)
- Entscheidungen: `LATE_PROGRESS` 0,5 -> 0,55. Bei 0,5 lag die Schwelle unter allen 28 Messwerten und der Test prüfte praktisch nichts. Bei 0,55 bestehen im schwächsten Lauf (53-60 %) noch 5 von 7 Wellen, die Bedingung "mindestens 3" trennt wieder. Verschärfung, keine Abschwächung; Spielcode und Balancing unverändert.
- Offen: Nichts.

## 2026-11-21 · Mobil · Bauen per Touch in zwei Schritten (UX-Vorschlag 4)
- Rolle(n): orchestrator (direkt); Anlass: UI/UX-Check, Vorschlag 4
- Branch: agent/mobil-bauen-zoom (zusammen mit dem Zoom, auf Wunsch des Menschen ein Durchlauf für zwei Vorschläge)
- Runden: 1
- Ergebnis: fertig
- Tests: 122 bestanden (Unit, +3), E2E 4 bestanden (+1 Touch-Test)
- Entscheidungen: Auf Touch hing die Bauvorschau am Maus-Hover und fehlte; bei 19 px großen Kacheln wurde oft blind auf die falsche gebaut. Neu: `pointermove`/`pointerleave` statt `mousemove`/`mouseleave` (bei Touch bleibt die Vorschau nach dem Loslassen). Erster Tipp zeigt Kachel, Reichweite und den Hinweis "Nochmal tippen zum Bauen", zweiter Tipp auf dieselbe Kachel baut. Die Entscheidung steht als reine Funktion `buildTapStep` in `src/input.js` (ohne DOM, getestet). Maus baut weiter sofort. Neue Meldungsart `info` (grün) neben der roten Fehlermeldung. Spiel-Logik und Balancing unverändert.
- Offen: Echtes Gerät testen. Doppeltipp-Zoom und Scroll-Konflikte (UX-Vorschlag 3) sind noch nicht umgesetzt.

## 2026-11-21 · Mobil · Zoom für das Spielfeld (UX-Vorschlag 9)
- Rolle(n): orchestrator (direkt); Anlass: UI/UX-Check, Vorschlag 9
- Branch: agent/mobil-bauen-zoom
- Runden: 1
- Ergebnis: fertig
- Tests: siehe voriger Eintrag (gemeinsamer Durchlauf); der E2E-Test prüft, dass der Zoom das Feld mindestens 1,8-fach so breit macht
- Entscheidungen: Im Hochformat begrenzt die Bildschirmbreite die Kachelgröße (19 px bei 390 px). Neu: Button "Zoom" (nur mobil, <= 700 px). Er setzt die Klasse `zoomed` am Spielfeld: Canvas 200 % breit in einem scrollbaren Rahmen (`.scroller`, max. 60 vh hoch), Kacheln ca. 38 px. Overlay, Meldung und Pause-Banner liegen außerhalb des Rahmens und scrollen nicht mit. Klick-Umrechnung über `getBoundingClientRect` funktioniert unverändert. Standard bleibt der ungezoomte Ansichtsmodus.
- Offen: Im Zoom muss man das Feld verschieben, um Gegner am anderen Ende zu sehen; kein automatisches Mitscrollen.

## 2026-11-21 · Prozess · Token-Optimierung
- Rolle(n): Mensch + Claude (interaktiv)
- Branch: agent/token-optimierung
- Ergebnis: fertig
- Tests: alle Unit-Tests bestanden (kein Code in `src/` geändert)
- Entscheidungen: Reviewer von Opus auf Sonnet (Änderungen sind klein, Prüfliste konkret). Erledigte Backlog-Einträge nach `docs/archiv/BACKLOG-fertig.md` ausgelagert, damit Ideator und Orchestrator weniger lesen; das Ledger bleibt wegen Append-Only unverändert, der Ideator liest dort nur Überschriften. Testausgaben auf `tail -15` gekürzt, Berichte der Subagents auf 10 bis 15 Zeilen begrenzt.
- Offen: Wirkung messen (`/cost` vor und nach einem Durchlauf) und prüfen, ob Sonnet im Review genauso viele Muss-Punkte findet wie Opus.

## 2026-11-21 · Prozess · Token-Optimierung Teil 2
- Rolle(n): Mensch + Claude (interaktiv)
- Branch: agent/token-optimierung-2
- Ergebnis: fertig
- Tests: 122 bestanden, 0 fehlgeschlagen (vorher ebenfalls 122, nur verschoben)
- Entscheidungen: `tests/game.test.js` (2228 Zeilen) nach Modul in `game`, `decor`, `render`, `fx`, `input` aufgeteilt, gemeinsame Helfer in `tests/helpers.js`; Testanzahl unverändert. Developer-Prompt auf CLAUDE.md verwiesen statt Regeln zu wiederholen. Pipeline: Reviewer entfällt, wenn weder `game.js`, `path.js` noch `tests/` berührt sind; bei Diff bis ca. 50 Zeilen übernimmt der Reviewer den Testlauf (kein Tester); Browser-Tests nur in der CI; Orchestrator gibt Dateiliste und `--stat` an Subagents mit.
- Offen: Grenzen (50 Zeilen, Reviewer-Auslöser) nach einigen Durchläufen prüfen; Qualität ohne Tester im Auge behalten.

## 2026-11-21 · Ideen · Welten, Maps und neue Mechaniken
- Rolle(n): Mensch + Claude (interaktiv)
- Branch: agent/ideen-welten
- Ergebnis: fertig
- Tests: nicht nötig (nur Dokumentation, kein Code geändert)
- Entscheidungen: 15 Vorschläge B-027 bis B-041 (Status `vorschlag`). B-027 (Map-Auswahl) ist Fundament für die Welten B-028 bis B-033, deshalb zuerst freigeben. Bestehende Ideen B-005 (Frühstart) und B-007 (Fallen) bleiben unverändert.
- Offen: Mensch gibt Einträge frei (Status `offen`); Reihenfolge-Empfehlung: B-027, dann B-028 oder B-029, dann B-034.

## 2026-11-21 · B-027 · Map-Auswahl (mehrere Karten)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/map-auswahl (aufgebaut auf agent/ideen-welten, da B-027 dort erst eingetragen und freigegeben wurde)
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 125 bestanden, 0 fehlgeschlagen (3 neue)
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-042 im Backlog)
- Entscheidungen: `MAPS` mit Wiese (unverändert) und einer zweiten Karte "Schlucht" (52 statt 40 Wegschritte), damit das Auswahlmenü sofort Sinn hat; `WAYPOINTS` bleibt als Alias, bestehende Tests unverändert. Kartenwechsel nur vor Welle 1 und startet das Spiel neu. Farbschema pro Map bewusst nicht Teil von B-027, kommt mit den Welten (B-028 ff.).
- Offen: Sichtprüfung der Schlucht und der Auswahl im Browser durch einen Menschen; PR #21 muss vor diesem PR gemergt werden.

## 2026-11-21 · B-028 · Welt Wald (blockierte Bauplätze)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/wald (aufgebaut auf agent/map-auswahl, PR #22)
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 133 bestanden, 0 fehlgeschlagen (8 neu, keiner abgeschwächt)
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-043)
- Entscheidungen: Hindernisse in eigenem Feld `state.obstacles` statt in `state.blocked`, damit "Weg" und "nicht bebaubar" getrennte Begriffe bleiben (sonst Kiesel auf Bäumen, Deko-Regeln vermischt). Karte `forest` mit eigenem Weg (44 Kacheln, 9 Kurven) und 39 Hindernissen, 125 baubare Kacheln im Abstand bis 2 zum Weg. Wellen-Balancing unverändert.
- Offen: Sichtprüfung im Browser; Wald-Balancing nur über die Standardkarte abgesichert (Wellen sind pro Karte gleich); PR #21 und #22 müssen vorher gemergt werden.

## 2026-11-21 · B-029 · Welt Eis (Gegner-/Turm-Modifikatoren pro Map)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/eiswelt (aufgebaut auf agent/wald, PR #23)
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 140 bestanden, 0 fehlgeschlagen (7 neu, keiner abgeschwächt)
- Review: CHANGES_REQUESTED nur wegen des fehlenden Ledger-Eintrags (hier erledigt), sonst keine Muss-Punkte; Hinweise als B-044. Kommentar in `config.js` zum Eis-Gelände korrigiert.
- Entscheidungen: Modifikatoren pro Karte (`enemySpeed`, `towerDamage` je Typ, `slowStrength`) mit Standardwert 1 über `mapModifiers`; `towerStats(tower, modifiers)` mit optionalem 2. Parameter, damit alte Aufrufe und Tests unverändert bleiben und Anzeige die echten Werte zeigt. Eiswelt: Gegner 0,85-fach, Kanone 1,25-fach, Frost 0,7-fach Schaden und Verlangsamung. Dazu ein optionales Farbschema `theme` (kühles Weiß-Blau) in nur wenigen Zeilen Render-Code.
- Offen: Playtest und Sichtprüfung im Browser; keine kartenspezifischen Balancing-Tests; PR #21, #22, #23 vorher mergen.

## 2026-11-21 · Aufräumen · Karte Schlucht entfernt
- Rolle(n): Mensch + Claude (interaktiv)
- Branch: agent/schlucht-entfernen
- Ergebnis: fertig
- Tests: 140 bestanden, 0 fehlgeschlagen (Anzahl unverändert)
- Entscheidungen: Der Mensch hat die Schlucht nach Sichtprüfung im Browser verworfen. Karte aus `MAPS` entfernt. Bestehende Tests, die `canyon` als Beispielkarte nutzten, wurden auf `forest` bzw. `ice` umgestellt (gleiche Prüfungen, keine abgeschwächt, keiner gelöscht); die Gültigkeitsprüfung läuft weiter über alle Karten in `MAPS`.
- Offen: B-042 (3) erwähnt den Schlucht-Test, der nicht mehr existiert; beim Abarbeiten ignorieren.

## 2026-11-21 · B-044 (Teil) · Eiswelt schwerer: Glatteis
- Rolle(n): orchestrator, developer, reviewer (ohne Tester, kleiner Diff)
- Branch: agent/eis-balancing
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 142 bestanden, 0 fehlgeschlagen (2 neu)
- Review: APPROVE (Hinweis: Test "nur Pfeile verlieren vor Welle 12" liegt bei Messwert ca. Welle 10 nahe am Limit; bei künftigem Balancing eher die Schwelle lockern)
- Entscheidungen: Spieler fand die Eiswelt "etwas zu einfach". Messung: mit Gegnertempo 0,85 und Kanone 1,25 gewannen alle drei Strategien mit 10 Leben. Mit Kanonenbonus 1,25 war der Übergang zwischen Sieg und Niederlage je nach Zeitschritt uneinheitlich, deshalb der Mensch entschied für "Glatteis": Gegner 1,18-fach, Kanone 0,95-fach, Frost unverändert. Ergebnis: a>c>c>f 10 Leben, c>a>a>f 6 Leben, a>a>c>f verliert ab Welle 17, nur Pfeile verliert um Welle 10. Der Test, der die alte Richtung festschrieb, wurde bewusst umgedreht und umbenannt (Richtung der Asserts geändert, Schärfe gleich); drei feste `1.25` in Tests lesen jetzt den Config-Wert.
- Offen: Sichtprüfung/Playtest durch den Menschen; B-044 (3) Farbschema, (4) Eis-Deko.

## 2026-11-21 · Korrektur · Backlog-Pflege B-029/B-044
- Rolle(n): orchestrator
- Branch: agent/eis-balancing
- Ergebnis: fertig
- Entscheidungen: Beim Abschluss von B-029 war ein Befehl fehlgeschlagen und hatte das Verschieben nach `docs/archiv/BACKLOG-fertig.md` sowie das Anlegen von B-044 übersprungen (der Ledger-Eintrag zu B-029 verweist trotzdem auf B-044). Beides jetzt nachgeholt. Ledger bleibt append-only, der frühere Eintrag wird nicht geändert.
- Offen: Nichts.

## 2026-11-21 · B-033 · Mehrere Eingänge (Karte Zangenangriff)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/zwei-eingaenge
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 154 bestanden, 0 fehlgeschlagen (12 neu, keiner abgeschwächt)
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-047)
- Entscheidungen: Neue Karte `fork` mit zwei Eingängen, die bei [10,7] zusammenlaufen. Map-Feld `extraPaths`, `state.paths`, `state.path` bleibt der Hauptweg (Rückwärtskompatibilität). Gegner haben `lane` (abwechselnd) und `len`; Zielwahl first/last vergleicht den Restweg (`len - dist`), auf Ein-Weg-Karten identisch zu vorher. Wellen (`waveFor`) unverändert, nur die Verteilung auf Wege ist neu. Auftrag des Menschen: Wege spannender, Gegner aus mehr als einem Eingang.
- Offen: Balancing von `fork` nicht gemessen (B-047/B-046); Sichtprüfung im Browser.

## 2026-11-21 · B-045 · Türme klarer unterscheiden (Spezialfähigkeiten)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/turm-spezial
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 165 bestanden, 0 fehlgeschlagen (12 neu, keiner geändert oder abgeschwächt)
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-048 und in B-046)
- Entscheidungen: Alle vier Fähigkeiten deterministisch über Zähler statt Zufall: Pfeilturm Aufwärmen, Kanone Rückstoß (nur direktes Ziel, Schutzzeit `knockbackCooldown`, Boss halb), Frostturm Einfrieren (jeder N-te Treffer, Boss immun), Scharfschütze Rüstungsbrecher. Die Werte sind bewusst schwach: Der Spätphasen-Test "über 55 % Wegfortschritt in mindestens 3 Wellen 14-20" und der Schildträger-Test kippten bei stärkeren Werten; es wurden nur Config-Zahlen angepasst, keine Tests. Dadurch sind außer dem Scharfschützen die Fähigkeiten noch kaum spürbar, der Anspruch "klar verschieden" ist erst teilweise eingelöst. Die Schwelle `bonusMinHp` hängt an der skalierten maxHp und trifft ab Welle ~14 fast alle Gegner.
- Offen: B-046 verschärft zuerst die Gegnerseite und macht dann die Fähigkeiten spürbarer (Balancing-Konstanten dürfen dort bewusst angepasst werden, Nennung im Ledger).

## 2026-11-21 · B-046 · Spiel schwerer, Turm-Fähigkeiten spürbar
- Rolle(n): orchestrator, developer (2 Runden), tester, reviewer
- Branch: agent/schwerer
- Runden: 2 von max. 2
- Ergebnis: fertig
- Tests: 172 bestanden, 0 fehlgeschlagen (Laufzeit stieg von ca. 10 s auf 48 s, siehe B-049)
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-049)
- Entscheidungen: Auftrag des Menschen: Spiel insgesamt zu einfach, Waffen sollen sich klarer unterscheiden. Gegnerseite: Belohnungen Goblin 6->4, Flitzer 5->3, Troll 14->12, Boss 80->65; Boss-HP 850->1100. Fähigkeiten: Aufwärmen 0,03/max 0,12 -> 0,05/max 0,25; Rückstoß 0,08 -> 0,5 Kacheln; Einfrieren jeder 12. Treffer/0,4 s -> jeder 5./0,6 s; Sniper-Schwelle `bonusMinHp` (300) jetzt auf Basis-HP des Gegnertyps statt skalierter maxHp (vorher traf sie ab Welle ~14 fast alle Gegner). Karten-Modifikatoren: Eis enemySpeed 1,18->1,14 und slowStrength 0,7->0,85; neu Wald enemySpeed 1,19; fork enemySpeed 1,03 mit Kanone 0,92 und Pfeil 0,97. `special.text` wird aus den Config-Werten gebaut. Geänderte Tests (ausdrücklich genannt): (a) Schildträger-Test: Messfenster Wellen [9,10,11,12] -> [11,12,13,14], Assertions und SHIELD_MARGIN unverändert; in 9-12 leckt mit den stärkeren Fähigkeiten keiner der beiden Aufbauten mehr; (b) 'Karten ohne modifiers bleiben unverändert': Liste ['meadow','forest'] -> ['meadow'], weil Wald nun bewusst Modifikatoren hat; (c) Sniper-Test auf Basis-HP umgeschrieben und verschärft (alle Typen, Wellen 1/10/20). Neue Tests: Mindestwerte der Fähigkeiten, Text aus Werten, a>a>c>f verliert, Reserve von c>a>a>f höchstens 8 Leben, Strategie-Siege auf Eis, Wald und fork. Messung (Leben, dt 1/30 / 1/60): Wiese a>c>c>f 10/10, c>a>a>f 6/6, a>a>c>f verliert; Wald c>a>a>f 6/8; fork c>a>a>f 6/4.
- Offen: a>c>c>f (Pfeilturm zuerst) endet überall mit 10 Leben (B-049); Ergebnisse streuen stark bei kleinen Zahlenänderungen (Wald 1,19 nur schmaler stabiler Punkt); Testlaufzeit; Sichtprüfung und Playtest durch den Menschen, ob es jetzt schwer genug und nicht zu schwer ist.

## 2026-11-21 · B-049 · Testlaufzeit und Cache-Zusammenführung
- Rolle(n): orchestrator, developer, reviewer (ohne Tester, nur Test-Umbau)
- Branch: agent/testlaufzeit
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 172 bestanden, 0 fehlgeschlagen (Anzahl unverändert)
- Review: APPROVE (Simulationslogik gleich, keine Assertion entfernt)
- Entscheidungen: Gemeinsamer Strategie-Cache `mapId:mix@dt` ersetzt `arrowOnlyCache` und `iceCache`. Die Laufzeit lag bei mir vorher nur bei ca. 15 s und danach ebenfalls; die 48 s aus dem B-046-Durchlauf waren eine Lastspitze durch parallel laufende Agenten, nicht der Normalfall. Kein dt-Wert und keine Karte entfällt. Warn-Kommentare bei den Wald- und fork-Modifikatoren (nur schmaler stabiler Bereich).
- Offen: Restpunkte in B-050.

## 2026-11-21 · B-034 · Blitzturm mit Kettenblitz
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/blitzturm
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 178 bestanden, 0 fehlgeschlagen (6 neu in game, mehrere in render)
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-051)
- Entscheidungen: Fünfter Turm `lightning` (Taste 5): Kosten 110, Reichweite 3, Schaden 14, Rate 1,1 s, bis zu 3 Sprünge im Radius 1,6 Kacheln mit Faktor 0,7 je Sprung. Der Blitz trifft sofort (kein Projektil), Effekt `bolt` in `state.effects`. Bewusst ein Kompromiss-Turm (schwach gegen einzelne Bosse, stark gegen Schwärme), damit das Spiel nicht leichter wird. Zwei bestehende Tests angepasst, beide von Tester und Reviewer als gleich scharf bewertet: Typzählung im Render-Test (`12` -> `Object.keys(TOWER_TYPES).length * 3`) und Zielmodus-Test (liest bei `lightning` das Ziel aus dem Blitz-Effekt statt aus einem Projektil). In render.js fällt kein Turmtyp mehr still in den Scharfschützen-Zweig (`else` -> `else if (type === 'sniper')`). Textbauer der `special.text` bekommen die Turm-Definition übergeben.
- Offen: Spieltest, ob Flitzer zu leicht werden (`chainRange` ist der Regler); Balancing-Läufe nutzen den Blitzturm nicht (B-051).

## 2026-11-21 · B-034 (Korrektur) · Browser-Test erwartete 4 Türme
- Rolle(n): orchestrator
- Branch: agent/blitzturm
- Ergebnis: fertig
- Tests: 178 Unit und 4 Browser-Tests bestanden
- Entscheidungen: Die CI schlug fehl, weil `tests/e2e/smoke.test.mjs` genau 4 Turm-Buttons erwartete. Wie schon beim Render-Test liest der Browser-Test die Anzahl jetzt aus `TOWER_TYPES` (gleich scharf, wächst mit neuen Türmen). Browser-Tests laufen in der Pipeline nur in der CI und waren im Durchlauf nicht gelaufen; bei Änderungen an Shop, Türmen oder HUD vor dem PR zusätzlich `npm run test:e2e` lokal ausführen.
- Offen: Nichts.

## 2026-11-21 · B-038 · Fähigkeiten (Meteor, Kälteschock, Notfall-Reparatur)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/faehigkeiten
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 188 Unit-Tests und 5 Browser-Tests bestanden, 0 fehlgeschlagen (10 Unit-Tests und 1 Browser-Test neu, keiner geändert oder abgeschwächt)
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-052)
- Entscheidungen: `ABILITIES` in der Config: Meteor (Q, 50 s, 150 Schaden, Radius 1,8, Rüstung wie bei jedem Splash ignoriert), Kälteschock (W, 60 s, 70 % langsamer für 4 s, auch Bosse), Reparatur (E, 120 s, höchstens 2 Nutzungen, nie über START_LIVES, bei vollen Leben kein Verbrauch). Lange Abklingzeiten, damit das als "recht schwer, aber gut" empfundene Spiel nicht merklich leichter wird (Kälteschock ca. 7 % Uptime); Balancing-Tests nutzen keine Fähigkeiten und blieben unverändert. Zielmodus-Logik als reine Funktion `aimStep` in `input.js`. Vor dem PR wurden Unit- und Browser-Tests lokal ausgeführt (Lehre aus der roten CI bei B-034).
- Offen: Spieltest der Zahlen; Feinschliff in B-052.

## 2026-11-21 · Aufräumen · Feinschliff aus B-042 bis B-052
- Rolle(n): orchestrator, developer, reviewer (ohne Tester, reiner Aufräum-Durchlauf)
- Branch: agent/aufraeumen-2
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 190 Unit-Tests und 5 Browser-Tests bestanden, 0 fehlgeschlagen (2 neu: Slow/Heilung bei Eingefrorenen, Sniper mit unbekanntem Typ)
- Review: APPROVE (keine Muss-Punkte)
- Entscheidungen: Nur reine Code-Hinweise umgesetzt, keine Balancing-Zahlen und kein Spielverhalten geändert: `OBSTACLE_TREE_SHARE` und `OBSTACLE_SHADE` als Konstanten, `enemyPath` auch im Render, `iceRun` zu `mapRun`, `knockBack` lesbarer, Sniper-Schwelle mit Fallback, Farbkonstanten sortiert, `doAbility` bricht außerhalb von 'playing' früh ab und eine Pause beendet den Meteor-Zielmodus (neu, vom Reviewer als sinnvoll bewertet). `tests/forest-edge.test.js` wurde 1:1 in `tests/game.test.js` und `tests/decor.test.js` verschoben (gleiche Namen und Assertions, Testanzahl gleich). Bewusst nicht angefasst: Punkte, die einen Spieltest oder eine Entscheidung brauchen (Eis-Farbschema, `chainRange` des Blitzturms, Zahlen der Fähigkeiten, Pfeil-Strategie mit 10 Leben, Kartenwahl-Speicher, `p.special`-Bündelung).
- Offen: Die Backlog-Einträge B-042, B-043, B-047, B-048, B-050, B-051, B-052 tragen jeweils einen Vermerk, was erledigt und was offen ist.

## 2026-11-21 · UI · Shop kompakt, alle fünf Türme ohne Scrollen sichtbar
- Rolle(n): orchestrator, developer, reviewer (ohne Tester, reine UI)
- Branch: agent/shop-kompakt
- Ergebnis: fertig
- Tests: 190 Unit-Tests und 6 Browser-Tests bestanden (1 neuer Browser-Test)
- Review: APPROVE (keine Muss-Punkte; Hinweis als B-054)
- Entscheidungen: Rückmeldung des Menschen mit Screenshot: Auf dem Desktop muss man scrollen, um den Blitzturm zu erreichen. Gemessen mit Playwright: Bei 1280x720 bis 1440x900 lagen die Shop-Unterkanten bei 470/597/709/863/1020 px, die Seite war 1323 px hoch; Ursache waren die langen Fähigkeiten-Texte (`special.text`) in den Karten. Jetzt zeigt die Karte nur die kurze Beschreibung (2 Zeilen), der Fähigkeiten-Text steht im Tooltip und im Turm-Info-Panel (`#ti-special`); Karten und Steuerung kompakter. Nachher 404/466/528/612/685 px, Dokumenthöhe 983 px. Handy unverändert gut. Hilfetext "1-4" -> "1-5". Neuer Browser-Test bei 1280x800 sichert ab, dass der letzte Turm sichtbar bleibt.
- Offen: Desktop-Zoom nicht separat geprüft; Barrierefreiheit der Karten (B-054).

## 2026-11-21 · B-053 · Blitzturm aufwerten (eigene Rolle)
- Rolle(n): orchestrator, developer, reviewer (ohne Tester, nur Config und Tests)
- Branch: agent/blitzturm-staerker
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 192 Unit-Tests und 6 Browser-Tests bestanden (2 neue, keiner geändert oder abgeschwächt)
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-055)
- Entscheidungen: Rückmeldung des Menschen nach dem Spieltest: Blitzturm zu schwach, die Kanone ist billiger und wirkt besser. Neue Rolle des Blitzturms: Konter gegen Schwärme schneller Gegner, schwächer gegen Zähe. Zahlen `lightning` (alt -> neu): Preis 110 -> 100, Schaden 14 -> 16, Rate 1,1 -> 0,8 s, `chainCount` 3 -> 6, `chainRange` 1,6 -> 2,2, `chainFalloff` 0,7 -> 0,9, neue Beschreibung. Messung (2 Blitztürme gegen 2 Kanonen, Wiese, dt 1/30): Flitzer Welle 8: 0 Durchbrüche statt 8, Goblins Welle 8: 0 statt 8, Flitzer Welle 14: 21 statt 22; Boss-Schaden 576 statt 1050, 3 Trolle 1518 statt 2354 (Kanone besser gegen Zähe, wie gewünscht). Der Blitz-Mix (Kanone, Pfeil, Blitz, Frost) gewinnt Welle 20 mit mindestens 1 Leben (Wiese 4, Eis/Wald/fork 10). Schaden und Rate bewusst niedrig gehalten (ein Schaden über ca. 22 bei Rate 0,7 hätte den Blitz auch gegen Bosse stärker als die Kanone gemacht). Kein Schockeffekt nötig. Die Läufe sind bei Schaden 30 bis 40 identisch; bei späteren Änderungen zuerst den Preis prüfen.
- Offen: Spieltest durch den Menschen, ob die Rolle jetzt spürbar ist; Flackerrisiko der knappen Reserve (4 Leben auf der Wiese), siehe B-055.

## 2026-11-21 · Prozess · Neue Rolle `designer` (Visual Design und UI)
- Rolle(n): Mensch + Claude (interaktiv)
- Branch: agent/designer-rolle
- Ergebnis: fertig
- Tests: nicht nötig (nur Rollenbeschreibung, Skill und Doku, kein Code in `src/`)
- Entscheidungen: Der Mensch wünschte einen Spieldesigner, der auf Anfrage Aussehen und Bedienung prüft und Vorschläge für neue Designs macht. Neue Rolle `.claude/agents/designer.md` ohne Schreibrechte auf das Projekt (Tools: Read, Grep, Glob, Bash; Bash nur lesend und für Screenshot-Skripte im Scratchpad außerhalb des Repos), damit er wie reviewer und ideator nur bewertet und vorschlägt; gebaut wird über die Pipeline. Er arbeitet mit echten Playwright-Screenshots auf Desktop und Handy statt mit Vermutungen (Anlass: der Blitzturm lag auf dem Desktop unter dem Fenster, das fiel erst dem Menschen auf). Prüfliste: Lesbarkeit, Platz/Scrollen, Hierarchie, Konsistenz, Erkennbarkeit, Game Feel, Touch, Barrierefreiheit, Stimmung der Welten. Regeln: keine Abhängigkeiten oder Fremd-Assets, Architektur (Zeichnen in `render*.js`, Layout in CSS) einhalten. Aufruf nur auf Anfrage über den Skill `/design` (trägt Muss-Befunde und Vorschläge als `vorschlag` ins Backlog ein); die Pipeline bleibt unverändert. `CLAUDE.md` und `docs/LERNEN.md` ergänzt.
- Offen: Neue Subagents werden beim Sitzungsstart geladen; für den ersten Aufruf Claude Code einmal neu starten. Erster Probelauf von `/design` steht aus.

## 2026-11-21 · Design-Prüfung · Erster Lauf von /design
- Rolle(n): orchestrator, designer
- Branch: agent/design-pruefung
- Ergebnis: fertig (nur Doku, kein Code geändert)
- Tests: nicht nötig
- Entscheidungen: Prüfung ohne Schwerpunkt auf Desktop (1280x800, 1366x768) und Handy (390x844, 360x740), alle 4 Karten. Muss-Befunde: Turm-Panel am Handy außerhalb des Blickfelds und ohne Turmname, Panel am Desktop nur durch Scrollen erreichbar, Fähigkeitsknöpfe unter 44 px. Als `vorschlag` eingetragen: B-056 bis B-061 (Befunde 1 bis 5 gebündelt, Welten-Optik, Wellen-Vorschau, Lücken). Befunde "Nett" nur in B-061 gebündelt. Screenshots liegen im Scratchpad der Sitzung (`.../scratchpad/`, nicht im Repo).
- Offen: Freigabe der Einträge durch den Menschen. Prüfung hatte Lücken (keine laufende Welle mit Effekten, kein Game-Over, kein Boss), siehe B-061.

## 2026-11-21 · Design-Overhaul · Phase 1: Stilleitfaden
- Rolle(n): orchestrator, designer
- Branch: agent/design-stil (aufgesetzt auf agent/design-pruefung, PR #37)
- Ergebnis: fertig (nur Doku, kein Code geändert)
- Tests: nicht nötig
- Entscheidungen: Der Mensch will eine Kingdom-Rush-artige Optik, gezeichnet im Canvas-Code (keine Fremd-Assets). Der `designer` lieferte einen Referenzbogen mit zwei Stilen; der Mensch wählte Stil B (Flat-Pop: drei Flächentöne, farbige Kontur 1,3 px). Der Designer hatte A empfohlen, weil die farbige Kontur auf hellem Boden verschwindet; in `docs/STIL.md` steht dafür eine Kontrastregel (Kontur nie heller als 35 %, kräftigerer Bodenschatten auf Eis/Wüste, 25 % Helligkeitsabstand Gegner/Weg). Neu: `docs/STIL.md`, Backlog B-062 bis B-075 (Status `vorschlag`).
- Offen: Freigabe durch den Menschen; B-062/B-063 zuerst, dann Sichtprüfung. B-072/B-073 überschneiden sich mit B-043/B-044/B-059. Der Referenzbogen liegt nur im Scratchpad, nicht im Repo.

## 2026-11-21 · B-062 · Stil-Fundament (Design-Overhaul)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/stil-fundament
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 195 Unit-Tests bestanden (3 neue, keiner geändert oder abgeschwächt); Browser-Tests laufen in der CI
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-076)
- Entscheidungen: `src/draw-utils.js` hat jetzt die Stil-Helfer `lit`, `shd`, `brightness`, `outlineOf`, `part`, `poly`, `rr`, `ell`, `shadow` (Flat-Pop nach `docs/STIL.md`: drei Flächentöne per Clip und versetzter Füllung, keine Verläufe, kein shadowBlur). Alle Zahlen und die gemeinsame Palette stehen im neuen Block `STYLE` in `src/config.js`; Welt-, UI- und Gegnerfarben sind noch nicht darin (kommen mit den jeweiligen Einträgen). Die Helfer sind noch nirgends eingebunden, die Optik ist unverändert.
- Offen: Sichtprüfung der Helfer mit B-063; Breite des Schattenstreifens (ca. 1,4 px statt 2 px) und Hex-Kurzformen siehe B-076.

## 2026-11-21 · B-063 · Pfeilturm im neuen Stil als Referenz (Design-Overhaul)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/pfeilturm-stil
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 196 Unit-Tests bestanden (1 neuer; bestehende Grenz-Tests angepasst, siehe Entscheidungen); Browser-Tests in der CI
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-084), Tester: PASS
- Entscheidungen: Neue Datei `src/render-arrow.js` zeichnet den Pfeilturm (Stufe 1 bis 3) mit den Helfern aus B-062; `drawTower` ruft sie nur für `arrow` auf, die anderen Typen bleiben unverändert. Höhe ca. 60 px, Breite ca. 29 px, Stufen über die Form (Dach, Banner, Gold). Shop-Icon beim Pfeilturm mit Skalierung 0,75 (`ARROW_TOWER.iconScale`). **Bestehende Tests angepasst:** Die Helfer `recordTower`/`worldExtent` kennen jetzt `ctx.scale` (nötig, sonst falsche Grenzen). Für den Pfeil gilt oben eine eigene Toleranz `ARROW_TOP = 28` (vorher 1,5 bis 3,5 px), weil der Turm bewusst über die Kachel ragt (gemessen ca. 25 px, ca. 3 px Luft). Links, rechts, unten und alle anderen Typen bleiben unverändert streng; Review: vertretbar, keine Abschwächung. Zeichenzeit im Mock ca. 20 µs je Turm (Faktor ca. 24 gegenüber vorher), ca. 0,4 ms für 20 Türme; Sprite-Cache siehe B-075. Der Mensch fand den Unterschied zum alten Turm klein und wünschte die kräftige Wiese (Variante B); das folgt mit B-071 ff. B-079 bis B-082 hat der Mensch zusätzlich freigegeben mit der Anweisung, sie nacheinander zu entwickeln, per PR zu mergen und nicht nachzufragen (B-083 ausgenommen).
- Offen: Aufräumen und Hinweise in B-084. Shop-Vorschau nicht im Browser geprüft.

## 2026-11-21 · Prozess · Reviewer darf PRs abnehmen und mergen (Vertretung)
- Rolle(n): Mensch + Claude (interaktiv)
- Branch: agent/reviewer-merge
- Ergebnis: fertig (Rollenbeschreibung, Skill, Doku; kein Code in `src/`)
- Tests: nicht nötig
- Entscheidungen: Der Mensch wünschte, dass der `reviewer` mehr Aufgaben übernimmt und PRs abnehmen und mergen darf, wenn der Mensch nicht da ist. Neuer "PR-Modus" in `.claude/agents/reviewer.md`: Merge per `gh pr merge --merge` nur, wenn der PR offen und mergebar ist, die CI grün ist, `.claude/`, `.github/` und Abhängigkeiten unberührt sind, keine Tests abgeschwächt wurden, das Review APPROVE ohne Muss-Punkte ergibt, ein Ledger-Eintrag existiert und nur ein Feature enthalten ist. Sonst bleibt der PR offen und der Mensch entscheidet. Auslöser nur auf Delegation (`/pipeline abnahme`, neuer Schritt 10 im Skill), nicht automatisch. Dateien bleiben für den reviewer schreibgeschützt. Rollen, Skills, Hooks und Workflows (also auch dieser PR) mergt weiterhin nur ein Mensch.
- Offen: `.claude/settings.json` ist für Agents geschützt: Damit `gh pr merge` ohne Rückfrage läuft, muss der Mensch die Berechtigung `Bash(/opt/homebrew/bin/gh pr merge:*)` (und `gh pr view/diff/checks`) dort eintragen. Neue Subagent-Definitionen werden beim Sitzungsstart geladen.

## 2026-11-21 · Design-Overhaul · Wiesen-Szene (Entwurf) und Backlog B-071 bis B-083
- Rolle(n): orchestrator, designer
- Branch: agent/design-wiese
- Ergebnis: fertig (nur Doku und Referenzbilder, kein Code geändert)
- Tests: nicht nötig
- Entscheidungen: Der Mensch fand die Optik nach B-063 (Pfeilturm) zu wenig verändert und die Wiese nicht so dynamisch wie Kingdom Rush; er lieferte einen Referenz-Screenshot (nicht im Repo, nur Anregung). Der `designer` entwarf die komplette Wiesen-Szene in zwei Stärken, der Mensch wählte Variante B (kräftig). Zielbild liegt in `docs/design/wiese-ziel-1x.png` und `-2x.png`. B-071 wurde in sieben kleine Einträge zerlegt (B-071, B-077 bis B-082: Weg, Baumrahmen, Boden, Deko, Akzente, Licht, Inseln), alles nur Zeichnen im Hintergrund-Cache. B-083 (feste Bauplätze) ist eine Spiel-Änderung und steht getrennt, nur nach Freigabe. Schwächen von B laut Designer: Gegner klein bei 0,75x (Handy), Reichweitenkreis unruhig (in B-082 aufgenommen).
- Offen: Freigabe der Einträge. B-063 (Pfeilturm, ungemergt auf `agent/pfeilturm-stil`) ist ungeklärt: Test-Toleranz `ARROW_TOP = 28` (bestehender Test gelockert) und Zeichenzeit Faktor 24 zu main, siehe B-075.

## 2026-11-21 · B-071 · Wiese 1/7: Weg (Design-Overhaul)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/wiese-weg
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 199 Unit-Tests bestanden (3 neue, keiner geändert oder abgeschwächt); Browser-Tests in der CI
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-085)
- Entscheidungen: Neue Datei `src/render-path.js` (welliger Rand aus Kreisketten, Kontur, Schatten, Sand, hellere Mitte, Flecken, Rillen, Steine, grüner Saum); Zahlen in `PATH_STYLE` und `MAPS.meadow.theme.path` (`src/config.js`). Nur Zeichnen, alles im Hintergrund-Cache, Zufall über `tileRand`, Aufbau im Mock ca. 5 ms. Wald, Eis und Fork haben den welligen Rand, behalten aber ihre alten Wegfarben (folgen mit B-072/B-073). **Abweichung vom Kriterium:** Die Körperfarben der Gegner schaffen 25 % Helligkeitsabstand zur Wegmitte nicht (Flitzer 0,07, Goblin 0,19); der neue Test prüft stattdessen die dunkle Konturfarbe (Abstand mindestens 0,49). Der Reviewer hielt das für vertretbar (am Screenshot lesbar, Flitzer am schwächsten), die Nacharbeit steht in B-085. Kreise werden per `ctx.roundRect` gezeichnet, damit der bestehende Dekor-Test unverändert bleibt.
- Offen: B-085 (Flitzer/Goblin-Lesbarkeit), Grasbüschel im Saum (optional).

## 2026-11-21 · B-077 · Wiese 2/7: Baumrahmen (Design-Overhaul)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/wiese-baeume
- Runden: 2 von max. 2
- Ergebnis: fertig
- Tests: 207 Unit-Tests bestanden (neue in `tests/decor.test.js` und `tests/render.test.js`; ein Test angepasst, siehe Entscheidungen); Browser-Tests in der CI
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-086)
- Entscheidungen: `src/decor.js` liefert Position, Art, Reihe und Schattierung der Kronen (`treeFrame`, deterministisch), `src/render-trees.js` zeichnet sie nur im Hintergrund-Cache, Zahlen in `TREE_FRAME` (`src/config.js`), aktiviert über `MAPS.meadow.theme.treeFrame`. Zwei Reihen (hinten dunkler/kleiner, vorn heller/größer), mindestens 60 Kronen, Arten Laub, Apfel, Blüte, Tanne; Aufbauzeit im Mock 7 bis 10 ms. **Runde 2 auf Anweisung des Orchestrators:** Runde 1 hielt sich an "Überhang höchstens 16 px" und wirkte viel dünner als das Zielbild. Der Wert stammte aus einer falschen Angabe des Designers (sein Entwurf reicht 25 bis 40 px tief); er wurde auf 36 px angehoben (`TREE_FRAME.maxOverhang`), das Backlog entsprechend geändert. Der Wegabstand-Test (Abstand mindestens Radius plus `pathReach()`) blieb unverändert streng, der Kronenzahl-Test wurde auf 60 verschärft. **Angepasster Test:** "Dekoration verlässt ihre Kachel nicht" läuft auf `fork` statt `meadow`, weil der Rahmen auf der Wiese die alten Randbäume verdeckt (`coveredByCrown`); die geprüften Zeichenfunktionen sind dieselben. Reviewer: vertretbar; der Tester schloss die Lücke mit einem zusätzlichen Wiesen-Test (ohne Bäume, die der Rahmen ersetzt), Rest in B-086. Tests: 207 bestanden. Kronen per `roundRect` wie beim Weg (B-071).
- Offen: B-086, Kronen für Wald/Eis mit B-072/B-073.

## 2026-11-21 · B-078 · Wiese 3/7: Boden statt Schachbrett (Design-Overhaul)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/wiese-boden
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 211 Unit-Tests bestanden (neue Tests in `tests/render.test.js` inkl. Randfall-Tests des Testers, keiner geändert oder abgeschwächt); Browser-Tests in der CI
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-087)
- Entscheidungen: Neue Datei `src/render-ground.js` (Grund, Flecken mit 4 Lagen, Plateaus mit Wand und dezenter Kante, Gras-Büschel), `groundPatches` in `src/decor.js` (deterministisch, Abstand zur Wegachse), Zahlen in `GROUND_STYLE` (`src/config.js`), aktiviert über `MAPS.meadow.theme.ground`. Alles im Hintergrund-Cache (Aufbau Wiese im Mock 19,1 ms inkl. Weg, Deko und Baumrahmen). Wald, Eis und Fork behalten ihr Schachbrett (folgen mit B-072/B-073). `rgba`-Farben statt `globalAlpha`, weil ein bestehender Test `globalAlpha` im Cache verbietet. Plateaus sind nur Optik, jede freie Kachel bleibt bebaubar.
- Offen: B-087 (überlappende Plateaus, Magic Numbers, Kiesel-/Blumengruppen).

## 2026-11-21 · B-079 · Wiese 4/7: Deko neu (Design-Overhaul)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/wiese-deko
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 215 Unit-Tests bestanden (neue Tests in `tests/decor.test.js`, `tests/render.test.js` und ein Grenztest des Testers in `tests/scatter-bounds.test.js`, keiner geändert oder abgeschwächt); Browser-Tests in der CI
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-088)
- Entscheidungen: Neue Datei `src/render-decor.js` (Busch mit Beeren, Fels mit Moos und Begleitstein, Blumen gelb/rosa/weiß, Grasbüschel, Kiesel; Streu-Deko Pilz, Fass, Stamm, Pfähle, Wegweiser, Kieselgruppe), `scatterFor` in `src/decor.js` (deterministisch; nie auf Weg, Hindernis, Tor, Ziel oder fremder Deko; 5 bis 35 Stücke), Zahlen in `DECOR_STYLE` (`src/config.js`, Konturbreite 1,3 px), aktiviert über `MAPS.meadow.theme.decorStyle: 'flatpop'`. Alles im Hintergrund-Cache (Aufbau Wiese im Mock 6,7 bis 8,0 ms). Wald, Eis und Fork unverändert. Der bestehende Deko-Test blieb unverändert; die Zeichnung wurde an ihn angepasst (Büschel mit Halm in `#5da654`, Streu-Deko mit Bezier-Schatten statt `arc`/`ellipse`), vom Reviewer als sauber bewertet. Der Developer ließ einen Dev-Server (Port 8080) laufen, weil `pkill` verweigert wurde; der Mensch beendet ihn.
- Offen: B-088 (Fässer, Grenztest Streu-Deko, kaum sichtbare Pilze/Wegweiser).

## 2026-11-21 · B-080 · Wiese 5/7: Akzente Burgmauer, Teich, Brunnen (Design-Overhaul)
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/wiese-akzente
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 219 Unit-Tests bestanden (neue Tests in `tests/decor.test.js` und `tests/render.test.js`, keiner geändert oder abgeschwächt); Browser-Tests in der CI
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-089)
- Entscheidungen: Neue Datei `src/render-accents.js` (Burgmauer 150x34 mit Tor und zwei Türmchen oben mittig, Teich mit Seerosen unten, Brunnen 32x28 unten links), `accentsFor` und `crownBlocked` in `src/decor.js`, Zahlen in `ACCENT_STYLE` (`src/config.js`), aktiviert über `MAPS.meadow.theme.accents`. Alles im Hintergrund-Cache (Aufbau Wiese im Mock 6,0 ms). `treeFrame` lässt Kronen im Akzentbereich aus (weiterhin 119 Kronen, Wegabstand-Test unverändert streng). Mindestens 3 Kacheln Abstand zu Start und Ziel. Wald, Eis und Fork unverändert. Akzente zeichnen mit Bezier-Kurven statt `arc`/`ellipse`, damit der bestehende Kleindeko-Test nicht reißt (wie bei Weg und Baumrahmen); Reviewer: vertretbar, die Sammelnacharbeit steht in B-089.
- Offen: B-089 (Deko-Test robuster machen, kleine Optik-Hinweise).

## 2026-11-21 · Prozess · Sammelmodus im Pipeline-Skill
- Rolle(n): Mensch + Claude (interaktiv)
- Branch: agent/pipeline-sammelmodus
- Ergebnis: fertig (nur Skill und Doku, kein Code in `src/`)
- Tests: nicht nötig
- Entscheidungen: Der Mensch wollte weniger Schleifen und ein gemeinsames Review am Ende. Neuer Abschnitt "Sammelmodus" in `.claude/skills/pipeline/SKILL.md`: auf Wunsch, nur für Serien reiner Optik-Einträge; ein Branch für 3 bis 4 Einträge, pro Eintrag nur der `developer` (ein Commit), danach einmal `tester` und `reviewer` über den ganzen Diff, ein PR. Ausgeschlossen: Spiel-Logik, Balancing, Eingabe und Layout. Grenze ca. 600 Zeilen pro Block. Tests werden nie abgeschwächt; angepasste Tests prüft der Reviewer. Erste Anwendung: Wiese B-081 und B-082.
- Offen: PR enthält `.claude/`, daher Merge durch einen Menschen.

## 2026-11-21 · B-081 und B-082 · Wiese 6/7 und 7/7 (Design-Overhaul, Sammelmodus)
- Rolle(n): orchestrator, developer (je Eintrag), danach einmal tester und reviewer über den Block
- Branch: agent/wiese-licht
- Runden: 1 von max. 2
- Ergebnis: fertig
- Tests: 223 Unit-Tests bestanden (neue Tests in `tests/render.test.js`, einer vom Tester; Mock-Proxys in `tests/helpers.js`, `tests/render.test.js`, `tests/fx.test.js` nur additiv um Gradient-Objekte erweitert, keine Assertion geändert); Browser-Tests in der CI
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-090)
- Entscheidungen: **B-081:** Neue Datei `src/render-light.js` (Baumschatten, Lichtstreifen, Verlauf, Vignette), Zahlen in `LIGHT_STYLE`, aktiviert über `MAPS.meadow.theme.light`; nur im Hintergrund-Cache, Gradienten nur dort, mittlere Helligkeit 147,28 gegenüber 147,21 vorher, Aufbau 2,4 ms. Licht liegt vor den Toren, damit Start und Ziel nicht abgedunkelt werden; Baumschatten per `roundRect` (Deko-Test, siehe B-089). **B-082:** Neue Datei `src/render-island.js`, Inseln (7 Ellipsen, Modi built/ghost/bad) im Frame-Pfad vor den Türmen, nur Wiese (`theme.islands`), `drawTower`, `render-arrow.js` und Shop-Vorschau unverändert; Hover-Vorschau-Insel; Reichweitenkreis als Ring (Alpha 0,75, 2 px) mit Fläche 0,08 (`RANGE_STYLE`), Zeichenzeit mit 20 Türmen im Mock 0,025 auf 0,050 ms je Frame. **Nebenwirkung:** Der neue Ring gilt auf allen Karten und für den Meteor-Kreis. Erstmals im Sammelmodus (ein Branch, ein gemeinsames Review).
- Offen: B-090 (Lichtstreifen, Ring auf hellen Karten prüfen).

## 2026-11-21 · Prozess · Schneller Ablauf als Standard
- Rolle(n): Mensch + Claude (interaktiv)
- Branch: agent/schnelle-pipeline
- Ergebnis: fertig (nur Regeln, Skill, Rollenbeschreibung; kein Code in `src/`)
- Tests: nicht nötig
- Entscheidungen: Der Mensch will neue Versionen schneller live bringen und nur noch die wichtigsten Änderungen selbst entscheiden. `CLAUDE.md`: Regel 1 erlaubt Blöcke zusammengehöriger Einträge, Regel 6 verlangt nur noch kurze Ledger-Einträge. `.claude/skills/pipeline/SKILL.md`: Der Sammelmodus ist jetzt der Standard ("Schneller Ablauf"): Block von 3 bis 4 Einträgen (ca. 1000 Zeilen), nur der `developer` pro Eintrag, Tester und Reviewer nur bei Risiko-Dateien (`game.js`, `path.js`, `input.js`, `main.js`, `hud.js`, `index.html`, `style.css`) oder wenn bestehende Tests geändert werden, und dann einmal über den ganzen Block. Der Orchestrator mergt selbst, wenn CI grün ist, `.claude/`, `.github/` und Abhängigkeiten unberührt sind, kein Test abgeschwächt wurde und bei Risiko ein `APPROVE` vorliegt. Der `reviewer` im PR-Modus braucht keine Delegation mehr durch den Menschen. Der Mensch entscheidet weiter allein: Spiel-Logik und Balancing außerhalb des freigegebenen Eintrags, neue Mechaniken, Abhängigkeiten, `.claude/`, `.github/`, `CLAUDE.md`, Löschen oder Abschwächen von Tests. Unverändert und nicht von Agents änderbar: Guardrails in `.claude/settings.json`, Hooks, Workflows; weiterhin nie direkt auf `main`, nie Tests abschwächen.
- Offen: Damit `gh pr merge` ohne Rückfrage läuft, muss der Mensch die Berechtigung `Bash(/opt/homebrew/bin/gh pr merge:*)` (und `gh pr view/checks/create`) in `.claude/settings.json` eintragen. PR enthält `.claude/` und `CLAUDE.md`, daher Merge durch den Menschen.

## 2026-11-21 · B-072 und B-073 · Welten Wald, Zangenangriff, Eis (Design-Overhaul, Block)
- Rolle(n): orchestrator, developer (je Eintrag), danach einmal tester und reviewer über den Block
- Branch: agent/welten-block
- Runden: 1 von max. 2
- Ergebnis: fertig (erledigt damit auch B-043, B-044 und B-059)
- Tests: 243 Unit-Tests bestanden (neue Tests in `tests/decor.test.js`, `tests/render.test.js`, `tests/scatter-bounds.test.js`); Browser-Tests in der CI. Tester: Keine Assertion ging ersatzlos verloren; eine Prüfung (Fork-Test ohne Theme) nannte er "leicht geschwächt", der Reviewer sah keine Abschwächung
- Review: APPROVE (keine Muss-Punkte; Hinweise als B-091)
- Entscheidungen: Wald (dunkler Tannenrahmen, Pilze, Moos, Hindernisse neu gezeichnet), Zangenangriff (Herbstlaub, orange Saum) und Eis (Schneeboden, Tannen mit Schneekappe, Eisweg dunkler als Schnee, Kristalle, kühles Licht) im Flat-Pop-Stil mit eigener Palette je Karte. Neuer Helfer `themed(mapId, key, base)` und Theme-Overrides in `src/config.js`, neuer Theme-Schlüssel `pathStyle`. Wiese, Wald und Fork haben vor und nach B-073 identische Canvas-Hashes, Wald ist mit 87 % der Helligkeit knapp über der Grenze 85 %. Hindernisse, Wegverläufe, `modifiers` (Wald `enemySpeed` 1,19) und `canBuild` unverändert. **Angepasste bestehende Tests** (nur der Geltungsbereich, von "nur Wiese" zu tabellengetriebenen Prüfungen je Karte; Reviewer: keine Abschwächung): `scatterFor …`, `DECOR_STYLE: Konturbreite…`, `themed …`, `Render: Kartenwechsel ice -> meadow…` (strenger), `groundPatches …`, `Boden der Wiese …`, `Wald/Eis/Fork zeichnen weiter das Schachbrett…`, `Wiesen-Licht …`, `Render: gezeichnete Dekoration verlaesst ihre Kachel nicht…`.
- Offen: B-091 (Schachbrett-Zweig ungetestet, Fork-Test räumt nicht bei Fehlern auf, toter Wert `path.edge`, laute Saumfarbe auf Fork, Inseln/Akzente für Wald, Fork und Eis).

## 2026-11-21 · B-064 bis B-066 · Türme und Gegner im Flat-Pop-Stil (Design-Overhaul, Block)
- Rolle(n): orchestrator, developer (je Eintrag), danach einmal tester und reviewer über den Block
- Branch: agent/tuerme-gegner-block
- Runden: 1 von max. 2
- Ergebnis: fertig (Kanone, Frost, Scharfschütze, Blitz; Goblin, Flitzer, Troll; Schamane, Schildträger; Boss bleibt B-067)
- Tests: 252 Unit-Tests und 6 Browser-Tests bestanden. Tester: keine Fehler. Reviewer: nur Ledger-Eintrag als Muss, Rest als B-092
- Entscheidungen: Neue Dateien `src/render-towers.js` und `src/render-enemies-flat.js`, Paletten in `ENEMY_STYLE`/`TOWER_STYLE` (`src/config.js`). **Angepasste Tests:** `TOP_ALLOWED` je Turmtyp im Grenztest (`tests/render.test.js`, links/rechts/unten weiter streng; Werte als B-092 zu belegen) und in `tests/fx.test.js` entfiel auf ausdrückliche Freigabe des Menschen der Vergleich "Boss-Zeichenspur länger als Schamane" (gilt erst wieder mit B-067; dort vermerkt).
- Offen: B-092, B-067 (Boss).

## 2026-11-26 · B-093 · Fortschritt speichern: Rekorde, Sterne, Karten freischalten
- Rolle(n): orchestrator, developer, tester, reviewer (Einzeleintrag, da `src/main.js` und `index.html` berührt)
- Branch: agent/fortschritt-speichern
- Runden: 1 von max. 2
- Ergebnis: fertig. Neues reines Modul `src/progress.js` (`localStorage`, kein Backend), Sterne nach übrigen Leben, Freischaltung in `MAPS`-Reihenfolge, Anzeige im Overlay und in der Kartenauswahl (🔒, Sterne)
- Tests: 264 Unit-Tests (12 neu in `tests/progress.test.js`, davon 4 vom Tester), e2e 6/6 laut Developer. Tester: PASS. Review: APPROVE, Hinweise als B-094
- Entscheidungen: Mechanik „Karten freischalten“ vom Menschen am 2026-11-26 freigegeben. `src/game.js` unverändert; gespeichert werden je Karte nur `bestWave` und `stars`; zuletzt gewählte Karte wird nicht gespeichert.

## 2026-11-26 · Testseite für manuelles Testen (ohne Backlog-Nr., direkter Auftrag des Menschen)
- Rolle(n): Claude (interaktiv), reviewer
- Branch: agent/testseite
- Ergebnis: fertig. `test.html` leitet auf `index.html?test`; dort Werkzeug-Panel (`src/test-page.js`): Karte und Startwelle frei wählen, unbegrenztes Gold, Unverwundbar, Tempo ×1–×10, Gegner entfernen, Fähigkeiten laden, Sieg/Niederlage erzwingen. Logik rein in `src/test-tools.js`, Zahlen in `TEST_TOOLS`.
- Tests: 274 Unit-Tests (10 neu in `tests/test-tools.test.js`), 11 Browser-Tests (5 neu in `tests/e2e/testpage.test.mjs`). Review: APPROVE; drei Hinweise sofort behoben (volle Leben nach Spielende, Overlay-Text beim Weiterspielen, stärkerer Speicher-Test)
- Entscheidungen: Kein eigenes Markup-Duplikat, dasselbe Spiel mit Parameter `?test`. Im Testmodus alle Karten offen und `getStorage()` liefert `null`, der echte Fortschritt bleibt unberührt. `src/game.js` unverändert. Die Seite ist über GitHub Pages ebenfalls erreichbar (nur Test-Werkzeug, kein Einfluss aufs normale Spiel).

## 2026-11-26 · Testseite: Panel unter das Spielfeld (Rückmeldung des Menschen)
- Rolle(n): Claude (interaktiv), reviewer
- Branch: agent/testseite-layout
- Ergebnis: fertig. Das Test-Panel schob in der Seitenleiste den Turm-Shop aus dem Bild. Es sitzt jetzt als kompakte Leiste (3 Zeilen) unter dem Spielfeld; Hinweistext als Tooltip am Titel.
- Tests: 274 Unit-Tests, 12 Browser-Tests (neu: Testseite 1280x800, letzter Turm ohne Scrollen sichtbar, Panel in `.board`)

## 2026-11-26 · B-094 · Fortschritt: Meldungen am Spielende verfeinern
- Rolle(n): Claude (interaktiv), reviewer
- Branch: agent/fortschritt-meldungen
- Ergebnis: fertig. Neue reine Funktion `resultLines` in `src/progress.js` (kein „Neuer Rekord!“ beim ersten Ergebnis einer Karte, neu „Neue Sterne: ★★☆“), `src/main.js` zeigt die Zeilen als Spans, eigenes CSS für `#overlay-progress` (Meldungen gold hervorgehoben).
- Tests: 279 Unit-Tests (5 neu), 14 Browser-Tests (neu `tests/e2e/progress.test.mjs`: Sieg schaltet Wald frei, bleibt nach Neuladen). **Geänderter bestehender Test:** Sterne-Grenze in `starsFor: …` aus `STAR_LIVES_SHARE[1] * START_LIVES` abgeleitet (gleiche Werte bei START_LIVES = 10, strenger bei ungeraden Werten; vom Menschen mit B-094 freigegeben).
- Entscheidungen: `recordResult` unverändert gelassen (kein neues Feld), damit die bestehenden `deepEqual`-Tests unangetastet bleiben; der Vorher-Stand wird stattdessen an `resultLines` übergeben.

## 2026-11-26 · Meldung „Neue Sterne!“ (Wunsch des Menschen, Hinweis aus dem Review von B-094)
- Rolle(n): Claude (interaktiv)
- Branch: agent/neue-sterne-text
- Ergebnis: fertig. „Neue Sterne: ★★☆“ heißt jetzt „Neue Sterne!“ (die Sterne stehen schon in der Rekordzeile).
- Tests: Erwartete Texte in zwei `resultLines`-Tests angepasst (vom Menschen gewünscht, nicht abgeschwächt); kein Reviewer wegen reiner Textänderung.

## 2026-11-26 · Doku · LERNEN.md: Grundlagen (npm, Git, Branches, Pull Requests)
- Rolle(n): Claude (interaktiv, auf Wunsch des Menschen)
- Branch: agent/lernen-grundlagen (eigener Worktree, da im Hauptordner parallel unfertige B-067-Arbeit liegt)
- Ergebnis: fertig. Neuer Abschnitt 9 in `docs/LERNEN.md`: `npm start`/Server, zwei Arten von Pipeline, Commits, Branches, Pull Requests, Lehre aus PR #57, Git-Befehle.
- Tests: nur Doku, keine Code-Änderung.

## 2026-11-26 · Doku · LERNEN.md Abschnitt 3 an den schnellen Ablauf angepasst
- Rolle(n): Claude (interaktiv, auf Wunsch des Menschen)
- Branch: agent/lernen-ablauf (eigener Worktree)
- Ergebnis: fertig. Abschnitt 3 beschrieb noch den alten Ablauf (jeder Eintrag mit Tester und Reviewer, max. 3 Runden). Jetzt: Blöcke, Prüftiefe nach Risiko, Merge-Bedingungen, Entscheidungen des Menschen, Schleifenbremse 2 Runden / 1 Review-Runde, wie in `.claude/skills/pipeline/SKILL.md`.
- Tests: nur Doku.

## 2026-11-26 · Doku · LERNEN.md: Merge-Regeln in Abschnitt 2, 6 und 7 angepasst
- Rolle(n): Claude (interaktiv, auf Wunsch des Menschen)
- Branch: agent/lernen-merge (eigener Worktree)
- Ergebnis: fertig. Abschnitt 2 (reviewer: keine Delegation pro PR mehr nötig), Abschnitt 6 (Orchestrator mergt unter Bedingungen, Rolle des Menschen), Abschnitt 7 Schritt 6 (PR anschauen statt selbst anlegen) an den schnellen Ablauf angepasst.
- Tests: nur Doku.

## 2026-11-26 · B-067 und B-068 · Boss Oger-König, Projektile und Effekte (Design-Overhaul, Block)
- Rolle(n): orchestrator, developer (je Eintrag), danach einmal tester und reviewer über den Block (`src/main.js` berührt)
- Branch: agent/boss-effekte
- Runden: 1 von max. 2
- Ergebnis: fertig. Boss im Flat-Pop-Stil (1,6x, Krone, Keule, Aura) mit Auftritt (goldener Bodenring, Wackeln 2,4 px); Pfeil, Kugel, Frostsplitter, Blitz, Funken, Münzen-Hopser neu; Explosion/Rauch unter den Gegnern. `prefers-reduced-motion` (`ui.reducedMotion`) schaltet Wackeln, Hopser und Drift ab.
- Tests: 292 Unit-Tests (9 neu vom Developer, 4 vom Tester), 14 Browser-Tests. Tester: PASS. Review: APPROVE, Hinweise als B-095. Boss-Zeichenspurvergleich in `tests/fx.test.js` wieder ergänzt.
- Entscheidungen: Einträge standen auf `vorschlag`, vom Menschen per Auftrag freigegeben. Münzen ohne Schwerkraft (nur Hopser, Stiländerung); bei reduzierter Bewegung wackeln auch Explosionen nicht. Gearbeitet im eigenen Worktree, weil parallel eine zweite Sitzung im Repo lief.

## 2026-11-26 · B-069 und B-058 · HUD-Icons und Fähigkeitsknöpfe (Design-Overhaul und Design-Prüfung, Block)
- Rolle(n): orchestrator, developer (je Eintrag), danach einmal tester und reviewer über den Block
- Branch: agent/handy-knoepfe-icons
- Runden: 1 von max. 2
- Ergebnis: fertig. Neue `src/render-icons.js` (11 Canvas-Icons) ersetzt Emoji in HUD und Knöpfen; Fähigkeitsknöpfe mit großem Symbol, Kurzname, Ladungs-Abzeichen und Abklingbalken (`abilityView` in `src/hud.js`), Laden grau mit Goldbalken; Tastenkürzel (`.key`) auf dem Handy ausgeblendet; alle Knöpfe ≥ 44 px, Desktop-Fähigkeitsknöpfe 58 statt ~100 px.
- Tests: 299 Unit-Tests (6 neu vom Developer, 3 vom Tester), 16 Browser-Tests (neu `tests/e2e/buttons.test.mjs`). Tester: PASS. Review: APPROVE, Hinweise als B-096.
- Entscheidungen: Einträge standen auf `vorschlag`, vom Menschen per Auftrag freigegeben. B-058 (Layout) mit B-069 im Block, weil beide dieselben Knöpfe betreffen. Neues Textfeld `short` in `ABILITIES` (kein Balancing). Kein bestehender Test geändert.

## 2026-11-26 · B-057, B-056 und B-070 · Turm-Panel (Desktop und Handy), Shop-Karten (Block)
- Rolle(n): orchestrator, developer (B-057/B-056, dann B-070 mit Nachbesserung), danach einmal tester und reviewer über den Block
- Branch: agent/turmpanel-shop
- Runden: 2 von max. 2 (Nachbesserung der Handy-Knopftexte nach Orchestrator-Sichtprüfung)
- Ergebnis: fertig. Desktop: `#tower-info` als flache Leiste unter dem Spielfeld (`#sell` endet bei y=721 statt 958). Handy: feste Leiste unten mit Name/Stufe, Ziel/Verbessern/Verkaufen (≥ 44 px, zweizeilig, ohne Kürzel), Schließen per × oder Tipp aufs Feld. Shop-Karten: Farben in `SHOP_CARD`, deutlicher Zustand „zu teuer“, Kontrast ≥ 4,5:1 per Test (`contrastRatio` in `src/hud.js`), Kartenhöhen unverändert.
- Tests: 302 Unit-Tests, 26 Browser-Tests (neu `tests/e2e/panel.test.mjs`, vom Tester `panel-edge.test.mjs`). Tester: PASS. Review: APPROVE, Hinweise als B-097.
- Entscheidungen: Einträge standen auf `vorschlag`, vom Menschen per Auftrag freigegeben. Layout-Einträge als Block, da alle dasselbe Panel betreffen. B-070 und die B-056-Nachbesserung in einem Commit (Developer committete nicht, Aufteilung nach Hunks zu fehleranfällig). „Canvas ≥ 280 px“: Feld ist auf dem Handy nur 266/245 px hoch; Test verlangt, dass das ganze Feld über der Leiste sichtbar bleibt.
