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
4. **Testen und Reviewen wählen.** Nach dem Developer: `git diff --stat main` und `git diff --name-only main` ausführen.
   - **Kleiner Diff** (höchstens ca. 50 geänderte Zeilen, ohne Neuanlage größerer Dateien): `tester` entfällt. Der `reviewer` bekommt im Auftrag den Zusatz "ohne Tester" (Doppelrolle, siehe Reviewer).
   - **Größerer Diff:** `tester` wie unten, danach `reviewer`.
   - **Reviewer überspringen**, wenn der Diff weder `src/game.js`, `src/path.js` noch `tests/` berührt (z. B. nur Rendering, Config-Zahlen, CSS, Doku). Dann prüft der Orchestrator selbst `npm test` und `git diff`.
   Browser-Tests laufen nur in der CI auf dem Pull Request, nicht im Durchlauf.

   Tester: knapp halten: `npm test`, Diff auf gelöschte oder abgeschwächte Tests, gezielte Randfälle des neuen Codes. Keine Fuzz-, Stress- oder Mehrfachläufe ohne konkreten Verdacht. Antwortet er `FAIL`, zurück zu Schritt 3 mit seinem Bericht.
5. **Reviewen.** Subagent `reviewer` (falls laut Schritt 4 nötig) aufrufen, **eine Runde**. `CHANGES_REQUESTED` nur bei Muss-Punkten: Kriterium verletzt, Regel gebrochen, Spielbarkeit oder Testverlässlichkeit klar beeinträchtigt. Alles andere sind Hinweise und kommen als Backlog-Eintrag mit Status `vorschlag`, ohne neue Runde.
6. **Nachbessern.** Bei Muss-Punkten den `developer` einmal nachbessern lassen. Die Behebung prüft der Orchestrator selbst (`npm test`, `git diff`, gezielter Einzellauf des betroffenen Tests); tester und reviewer laufen dafür nicht erneut.
7. **Schleifenbremse.** Maximal **2** Entwicklungsrunden. Ist danach noch ein Muss-Punkt offen, Status `blockiert` setzen, Ledger-Eintrag schreiben und einen Menschen fragen. Nicht weiter probieren.
8. **Ledger.** Hänge einen Eintrag an `docs/LEDGER.md` an (Format dort) und setze den Backlog-Status auf `fertig` oder `blockiert`. Bei `fertig` verschiebst du den Eintrag aus `docs/BACKLOG.md` nach `docs/archiv/BACKLOG-fertig.md`.
9. **Abschluss.** `npm test` ein letztes Mal selbst ausführen, committen, `git push -u origin agent/<kurzname>`. Pull Request nur auf ausdrücklichen Wunsch.
10. **Abnahme durch den reviewer (nur wenn der Mensch sie delegiert hat, z. B. `/pipeline abnahme` oder "der reviewer soll mergen").** Dann legst du den PR an (Beschreibung wie üblich, mit Hinweis auf Backlog-Eintrag und Ledger) und rufst den `reviewer` im **PR-Modus** mit der PR-Nummer auf. Er mergt nur, wenn alle Bedingungen in seiner Rollenbeschreibung gelten (CI grün, keine Änderungen an `.claude/`, `.github/`, Abhängigkeiten usw.). Sonst bleibt der PR offen, und du meldest dem Menschen den Grund. Ohne diese Delegation mergt immer der Mensch.

## Regeln
- Immer nur ein Feature pro Durchlauf.
- Subagents bekommen den vollständigen Auftrag im Prompt. Sie sehen dieses Gespräch nicht.
- Token sparen: Berichte der Subagents sind begrenzt (Developer 10, Tester 12, Reviewer 15 Zeilen). Gib ihnen im Prompt die Ausgabe von `git diff --name-only main` und `--stat` sowie bei Bedarf Zeilenbereiche mit, damit sie nicht breit suchen oder Dateien doppelt lesen. Testausgaben immer mit `--silent 2>&1 | tail -15` kürzen.
- Vertraue Abschlussberichten nicht blind: Prüfe das Ergebnis mit `git diff --stat` und `npm test`.
- Bei Unklarheit fragen, nicht raten.
