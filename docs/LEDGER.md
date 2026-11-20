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
