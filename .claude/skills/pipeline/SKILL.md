---
name: pipeline
description: Führt einen Entwicklungsdurchlauf aus - Backlog-Einträge wählen (Standard: Block), entwickeln, bei Risiko testen und reviewen, Ledger, PR, Merge bei grüner CI. Nutzen bei "starte die Pipeline" oder /pipeline.
---

# Pipeline: ein Durchlauf = ein Block

Du bist der **Orchestrator**. Du schreibst selbst keinen Spielcode, du koordinierst Subagents und hältst die Regeln ein. Arbeite im eigenen Worktree (der Hauptordner wird von anderen Sitzungen genutzt).

## Ablauf
1. **Auswählen:** `grep -n "^### \|Status" docs/BACKLOG.md`, dann nur die gewählten Einträge lesen. Die Pipeline nimmt nur `offen`, von oben nach unten. Ist nichts offen: `/ideen` vorschlagen und stoppen (Ideen stehen in `docs/IDEEN.md`, freigeben tut der Mensch).
2. **Block bilden:** 3 bis 4 zusammengehörige Einträge (reine UI-, Text- oder Doku-Kleinigkeiten: bis 6) auf einem Branch `agent/<kurzname>` von `origin/main`, höchstens ca. 1000 geänderte Zeilen. **Risiko-Einträge** (Spiel-Logik, Balancing, Eingabe, Layout) laufen einzeln. **Parallele Spuren:** Unabhängige Blöcke (z. B. UI und Logik, keine gemeinsamen Dateien) dürfen gleichzeitig in eigenen Worktrees laufen, je ein Branch und ein PR.
3. **Entwickeln:** pro Eintrag der `developer` mit vollständigem Auftrag (Akzeptanzkriterien, betroffene Dateien, Funktionen und Zeilenbereiche, passende Testdatei). Diese Stellen suchst du vorher selbst per `grep -n`, damit der developer nicht breit sucht. Lokal nur `npm test`; e2e und Balancing nicht pro Eintrag. Ein Commit pro Eintrag. BACKLOG, IDEEN und LEDGER fasst er nicht an.
4. **Prüfen am Ende des Blocks** (langsame Tests nur hier, einmal: e2e bei UI/Eingabe/Layout, Balancing bei Balancing/`game.js`): `git diff --stat origin/main` und `git diff --name-only origin/main`.
   - **Risiko** (Diff berührt `src/game.js`, `src/path.js`, `src/input.js`, `src/main.js`, `src/hud.js`, Balancing-Zahlen in `src/config.js`, `index.html`, `style.css`, oder ändert bestehende Tests über bloßes Ergänzen hinaus): `tester` und `reviewer` **einmal** über den ganzen Diff. Ist der Diff klein (höchstens ca. 50 Zeilen), nur der `reviewer` mit dem Zusatz "ohne Tester". Bei Balancing oder `game.js` zusätzlich `npm run test:balance`.
   - **Sonst** (nur Zeichnen, Doku, neue Tests): kein Tester, kein Reviewer. Du prüfst selbst `npm test`, den Diff und dass kein Test gelöscht oder abgeschwächt wurde.
5. **Muss-Punkte:** nur bei verletztem Kriterium, gebrochener Regel oder klar beeinträchtigter Spielbarkeit oder Testverlässlichkeit. Eine Nachbesserung durch den `developer`, die du selbst prüfst (tester und reviewer laufen nicht erneut). Bleibt danach etwas offen: Status `blockiert`, Ledger-Eintrag, Mensch fragen. Hinweise ohne Muss-Charakter kommen nur dann nach `docs/IDEEN.md`, wenn sie wirklich etwas ändern würden.
6. **Abschluss:** Erledigte Einträge nach `docs/archiv/BACKLOG-fertig.md` verschieben. Ein Ledger-Eintrag für den Block, angehängt ohne die Datei zu lesen (`cat >> docs/LEDGER.md <<'EOF'`, Format im Kopf von `docs/LEDGER.md`). `npm test` selbst, committen (nie `git add -A`, Diff vorher prüfen), pushen, PR anlegen.
7. **Merge:** Du mergst selbst (`gh pr merge --merge`, nie `--admin`, nie Force), wenn **alle** Bedingungen gelten: CI grün; der PR ändert nicht `.claude/`, `.github/`, `package.json`, `package-lock.json`; kein Test gelöscht oder abgeschwächt; bei Risiko liegt ein `APPROVE` ohne Muss-Punkte vor; keine Spiel-Logik- oder Balancing-Änderung, die der Mensch nicht freigegeben hat. Sonst bleibt der PR offen und du nennst dem Menschen den Grund in einer Zeile.
8. **Nach dem Merge:** lokales `main` aktualisieren, kurz melden (PR-Nummer, was neu ist). Live geht es über die Pages-Pipeline.

## Nur der Mensch entscheidet
- Spiel-Logik und Balancing (Kosten, Schaden, Wellen), die nicht ausdrücklich im freigegebenen Eintrag stehen, und neue Mechaniken.
- Neue Abhängigkeiten, Änderungen an `.claude/`, `.github/` und `CLAUDE.md`.
- Tests löschen oder abschwächen.
- Alles, was `blockiert` ist oder bei dem ein Muss-Punkt bleibt.

## Token sparen
- Modelle: Subagents laufen mit Sonnet (Frontmatter). **Nie Opus**, auch nicht per Override.
- Haiku (`model: "haiku"` beim Aufruf) nur für reine Text- oder Doku-Einträge ohne Code. Code, Tests und Reviews bleiben bei Sonnet. Abschlussarbeiten (Archivieren, Ledger) erledigst du selbst knapp per `grep`/`cat >>`, ohne Subagent.
- Subagents sehen dieses Gespräch nicht: vollständiger Auftrag im Prompt, dazu `git diff --name-only` und `--stat`, bei Bedarf Zeilenbereiche, damit sie nicht breit suchen.
- Berichte sind begrenzt (developer 10, tester 12, reviewer 15 Zeilen).
- Große Dateien nie ganz lesen: Backlog, Ideen und Ledger per `grep "^### "` bzw. `grep "^## "`, Tokens per `grep <name> docs/design/system/TOKENS.md`.
- Testausgaben kürzen: `npm test --silent 2>&1 | tail -15`. `npm test` ist der schnelle Teil (ca. 2 s); `npm run test:balance` (Strategie-Simulationen, ca. 10 s) nur bei Balancing oder `game.js`. Die CI läuft immer beides.
- Abschlussberichten nicht blind vertrauen: `git diff --stat` und `npm test` selbst prüfen.
- Bei Unklarheit fragen, nicht raten.
