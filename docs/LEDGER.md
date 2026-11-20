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
