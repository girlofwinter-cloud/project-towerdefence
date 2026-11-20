# Ledger (Entscheidungsbuch)

Das Ledger beantwortet später: **Wer hat was warum entschieden, und mit welchem Ergebnis?**
Neue Einträge werden unten angehängt. Bestehende Einträge werden nie geändert (append-only).

## Format
```
## <JJJJ-MM-TT> · <Backlog-ID> · <Titel>
- Rolle(n): orchestrator, developer, tester, reviewer
- Branch: agent/<name>
- Runden: <n> von max. 3
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
