# Ledger (Entscheidungsbuch)

Das Ledger beantwortet später: **Wer hat was warum entschieden, und mit welchem Ergebnis?**
Neue Einträge unten anhängen, bestehende nie ändern (append-only). Ältere Einträge: `docs/archiv/LEDGER-bis-2026-11-27.md`.
Anhängen ohne die Datei zu lesen: `cat >> docs/LEDGER.md <<'EOF' … EOF`. Überschriften suchen: `grep "^## " docs/LEDGER.md docs/archiv/LEDGER-*.md`.

## Format (drei bis fünf Zeilen)
```
## <JJJJ-MM-TT> · <Backlog-IDs> · <Titel>
- Ergebnis: fertig | blockiert, Branch agent/<name>, PR #<nr>
- Tests: npm test <n> grün (Balancing/E2E falls gelaufen)
- Entscheidungen/Abweichungen: Warum so? Review-Urteil, falls gelaufen
- Offen: Was bleibt für Menschen? (nur wenn etwas offen ist)
```

---

## 2026-11-27 · Ablauf · Schlanker Ablauf (Tokens und Wartezeit sparen)
- Ergebnis: fertig, Branch agent/schlanker-ablauf. Balancing-Simulationen nach `tests/balance/` (4 Dateien + `sim.js`), `npm test` 1,2 s statt 29 s, neu `npm run test:balance` (ca. 9 s). Ledger archiviert, Vorschläge von BACKLOG nach `docs/IDEEN.md`, Pipeline-Skill als ein Ablauf, reviewer ohne PR-Modus, designer standardmäßig 4 bis 6 Screenshots.
- Tests: npm test 520 grün, test:balance 18 grün; Testcode nur verschoben (normalisierter Vergleich identisch).
- Entscheidungen: Freigegeben vom Menschen ("alles in einem Block"). Stop-Hook und CI-Schritt sind geschützt, dafür liegt ein Patch bereit, den der Mensch anwendet. Bis dahin läuft test:balance nicht in der CI, darum erst nach dem Patch mergen.
- Offen: Patch für `.claude/hooks/test-gate.mjs` und `.github/workflows/ci.yml` anwenden, PR mergen (Mensch).
