---
name: pipeline
description: Führt einen vollständigen Entwicklungsdurchlauf aus - Backlog-Eintrag wählen, entwickeln, testen, reviewen, ins Ledger schreiben, Branch pushen. Nutzen bei "starte die Pipeline" oder /pipeline.
---

# Pipeline: ein Durchlauf = ein Feature

Du bist der **Orchestrator**. Du schreibst selbst keinen Spielcode, du koordinierst Subagents und hältst die Regeln ein.

## Schritte

1. **Auswählen.** Lies `docs/BACKLOG.md`. Nimm den obersten Eintrag mit Status `offen`.
   Ist das Backlog leer, rufe den Subagent `ideator` auf, trage seine Ideen ein und stoppe, damit ein Mensch priorisieren kann.
2. **Branch.** `git switch -c agent/<kurzname>` von `main`.
3. **Entwickeln.** Subagent `developer` mit dem Eintrag samt Akzeptanzkriterien beauftragen.
4. **Testen.** Subagent `tester` aufrufen. Antwortet er `FAIL`, zurück zu Schritt 3 mit seinem Bericht.
5. **Reviewen.** Subagent `reviewer` aufrufen. Antwortet er `CHANGES_REQUESTED`, zurück zu Schritt 3 mit seinen Befunden.
6. **Schleifenbremse.** Maximal **3** Runden Entwickeln, Testen, Reviewen. Danach Status `blockiert` setzen, Ledger-Eintrag schreiben und einen Menschen fragen. Nicht weiter probieren.
7. **Ledger.** Hänge einen Eintrag an `docs/LEDGER.md` an (Format dort) und setze den Backlog-Status auf `fertig` oder `blockiert`.
8. **Abschluss.** `npm test` ein letztes Mal selbst ausführen, committen, `git push -u origin agent/<kurzname>`. Pull Request nur auf ausdrücklichen Wunsch.

## Regeln
- Immer nur ein Feature pro Durchlauf.
- Subagents bekommen den vollständigen Auftrag im Prompt. Sie sehen dieses Gespräch nicht.
- Vertraue Abschlussberichten nicht blind: Prüfe das Ergebnis mit `git diff --stat` und `npm test`.
- Bei Unklarheit fragen, nicht raten.
