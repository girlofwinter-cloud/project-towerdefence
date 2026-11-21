---
name: pipeline
description: Führt einen Entwicklungsdurchlauf aus - Backlog-Einträge wählen (Standard: Block), entwickeln, bei Risiko testen und reviewen, Ledger, PR, Merge bei grüner CI. Nutzen bei "starte die Pipeline" oder /pipeline.
---

# Pipeline: ein Durchlauf = ein Block (oder ein Eintrag bei Logik)

Du bist der **Orchestrator**. Du schreibst selbst keinen Spielcode, du koordinierst Subagents und hältst die Regeln ein.

## Schneller Ablauf (Standard)
Ziel: neue Versionen schnell live bringen. Der Mensch entscheidet nur Wichtiges (siehe "Nur der Mensch" unten); alles andere läuft durch.
1. **Block bilden:** Die obersten 3 bis 4 zusammengehörigen Einträge mit Status `offen` (reine Optik, Config-Zahlen, Doku, kleine Fixes) auf einem Branch `agent/<kurzname>` von `main`. Höchstens ca. 1000 geänderte Zeilen pro Block, sonst teilen. Einträge mit Spiel-Logik, Balancing, Eingabe oder Layout laufen einzeln.
2. **Pro Eintrag der `developer`** (`npm test` und Screenshots bei Optik), ein Commit pro Eintrag auf dem gemeinsamen Branch. BACKLOG und LEDGER fasst er nicht an.
3. **Prüfung am Ende des Blocks:** `git diff --name-only origin/main`.
   - Berührt der Block `src/game.js`, `src/path.js`, `src/input.js`, `src/main.js`, `src/hud.js`, `index.html`, `style.css` oder verändert er bestehende Tests über bloßes Ergänzen hinaus: `tester` und `reviewer` laufen gemeinsam einmal über den ganzen Diff.
   - Sonst (nur Zeichnen, Config-Zahlen, Doku, neue Tests): Kein Tester, kein Reviewer. Der Orchestrator prüft selbst `npm test`, `git diff --stat` und, dass kein Test gelöscht oder abgeschwächt wurde.
   Muss-Punkte: eine Nachbesserungsrunde durch den `developer`, die der Orchestrator selbst prüft; ist danach noch etwas offen, Status `blockiert`, Mensch fragen.
4. **Abschluss:** Pro Eintrag ein kurzer Ledger-Eintrag (drei bis fünf Zeilen), Einträge nach `docs/archiv/BACKLOG-fertig.md` verschieben, Hinweise aus Reviews nur dann als Backlog-Eintrag `vorschlag`, wenn sie wirklich etwas ändern würden. `npm test` selbst, committen, pushen, PR anlegen.
5. **Merge:** Der Orchestrator mergt den PR (`gh pr merge --merge`, nie `--admin`, nie Force), wenn **alle** Bedingungen gelten: CI grün; der PR ändert nicht `.claude/`, `.github/`, `package.json`, `package-lock.json`; kein Test wurde gelöscht oder abgeschwächt; bei Risiko-Dateien (Schritt 3) liegt ein `APPROVE` ohne Muss-Punkte vor; der Block enthält keine Spiel-Logik- oder Balancing-Änderung, die der Mensch nicht freigegeben hat. Sonst bleibt der PR offen, und du meldest dem Menschen den Grund in einer Zeile.
6. **Nach dem Merge:** Lokales `main` aktualisieren, kurz melden (PR-Nummer, was neu ist). Live geht es über die bestehende Pages-Pipeline.

### Nur der Mensch entscheidet
- Änderungen an Spiel-Logik und Balancing (Kosten, Schaden, Wellen), die nicht ausdrücklich im freigegebenen Eintrag stehen, und neue Mechaniken.
- Neue Abhängigkeiten, Änderungen an `.claude/` (Rollen, Skills, Settings, Hooks), `.github/` und `CLAUDE.md`.
- Tests löschen oder abschwächen (nie ohne den Menschen).
- Alles, was "blockiert" ist oder bei dem ein Muss-Punkt bleibt.

## Ablauf für Einzeleinträge (bei Logik, Balancing, Eingabe, Layout)

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
10. **Merge:** wie im schnellen Ablauf (Schritt 5): Der Orchestrator mergt, wenn die Bedingungen erfüllt sind; bei Logik-Einträgen hat der `reviewer` vorher `APPROVE` gegeben. Der `reviewer` kann zusätzlich im PR-Modus (Rollenbeschreibung) abnehmen und mergen, wenn der Orchestrator ihn mit der PR-Nummer aufruft.

## Sammelmodus
Ist jetzt der Standard (siehe "Schneller Ablauf"). Ein eigener Auslöser ist nicht mehr nötig.

## Regeln
- Ein Feature pro Eintrag; mehrere Einträge als Block (siehe oben). Logik-Einträge einzeln.
- Subagents bekommen den vollständigen Auftrag im Prompt. Sie sehen dieses Gespräch nicht.
- Token sparen: Berichte der Subagents sind begrenzt (Developer 10, Tester 12, Reviewer 15 Zeilen). Gib ihnen im Prompt die Ausgabe von `git diff --name-only main` und `--stat` sowie bei Bedarf Zeilenbereiche mit, damit sie nicht breit suchen oder Dateien doppelt lesen. Testausgaben immer mit `--silent 2>&1 | tail -15` kürzen.
- Vertraue Abschlussberichten nicht blind: Prüfe das Ergebnis mit `git diff --stat` und `npm test`.
- Bei Unklarheit fragen, nicht raten.
