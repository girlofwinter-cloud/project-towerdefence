# Agentische Entwicklung mit Claude Code – Lernleitfaden

Dieses Repo ist ein Lernprojekt. Das Spiel ist nur der Übungsplatz.
Hier lernst du, **wie man ein Projekt so aufsetzt, dass mehrere KI-Agents sicher und nachvollziehbar zusammenarbeiten.**

## Das Grundprinzip in einem Satz

> Ein Agent ist ein Sprachmodell mit Werkzeugen in einer Schleife. Zuverlässigkeit entsteht nicht durch einen klügeren Prompt, sondern durch **Struktur drumherum**: klare Rollen, harte Grenzen, Prüfungen und Protokolle.

## Die Bausteine und wo du sie findest

| Baustein | Datei | Frage, die er beantwortet |
|---|---|---|
| **Gedächtnis** | `CLAUDE.md` | Was muss jeder Agent über dieses Projekt wissen? |
| **Rollen (Subagents)** | `.claude/agents/*.md` | Wer macht was, und was darf er? |
| **Ablauf (Skill)** | `.claude/skills/pipeline/SKILL.md` | In welcher Reihenfolge arbeiten die Rollen? |
| **Guardrails (Hooks)** | `.claude/hooks/guard.mjs` | Was ist technisch unmöglich, egal was der Agent will? |
| **Rechte** | `.claude/settings.json` | Was ist erlaubt, was verboten? |
| **Audit-Log** | `.claude/hooks/ledger.mjs` | Was ist wirklich passiert? |
| **Entscheidungsbuch (Ledger)** | `docs/LEDGER.md` | Warum wurde so entschieden? |
| **Backlog** | `docs/BACKLOG.md` | Was soll als Nächstes passieren? |
| **Qualitätstor** | `.claude/hooks/test-gate.mjs`, `.github/workflows/ci.yml` | Wie wird verhindert, dass kaputter Code durchrutscht? |

## 1. Gedächtnis: `CLAUDE.md`

Claude startet jede Sitzung ohne Erinnerung. `CLAUDE.md` wird automatisch geladen und ist deshalb der Ort für Befehle, Architektur und Regeln.
**Faustregel:** Schreib hinein, was du einem neuen Teammitglied am ersten Tag sagen würdest. Kurz halten, sonst wird es ignoriert.

## 2. Rollen: Subagents

Ein Subagent ist ein Spezialist mit **eigenem Kontext** (er sieht dein Gespräch nicht), **eigenem Prompt** und **eigenen Werkzeugen**.

Schau dir die fünf Dateien in `.claude/agents/` an und achte auf die Zeile `tools:`

| Agent | Darf schreiben? | Warum |
|---|---|---|
| `developer` | ja (`src/`, Tests) | Er baut. |
| `tester` | nur `tests/` | Wer prüft, soll den Code nicht „passend machen“. |
| `reviewer` | **nein** (Dateien); im PR-Modus darf er per `gh` abnehmen und mergen | Wer bewertet, darf nicht gleichzeitig reparieren. Das Mergen ist an feste Bedingungen gebunden (CI grün, keine Änderung an `.claude/`, `.github/`, Abhängigkeiten) und nur nach Delegation durch den Menschen. |
| `ideator` | **nein** | Er liefert Vorschläge, ein Mensch entscheidet. |
| `designer` | **nein** (nur Screenshots außerhalb des Repos) | Er prüft Optik und Bedienung mit echten Screenshots und schlägt Designs vor; gebaut wird über die Pipeline. |

**Warum mehrere Agents statt einem?**
1. **Frischer Kontext:** Ein Reviewer, der den Code nicht geschrieben hat, findet mehr Fehler.
2. **Kleinste Rechte:** Jede Rolle bekommt nur, was sie braucht (*Least Privilege*).
3. **Der Hauptkontext bleibt sauber:** Die Details landen im Subagent, du bekommst nur den Bericht.

## 3. Ablauf: der Orchestrator

`/pipeline` lädt den Skill (`.claude/skills/pipeline/SKILL.md`). Das Hauptmodell ist der **Orchestrator**, eine Art Projektleiter: Es schreibt selbst keinen Code, sondern verteilt die Arbeit an die Subagents und hält die Regeln ein.

Standard ist der **schnelle Ablauf**. Ziel: neue Versionen schnell live bringen, der Mensch entscheidet nur Wichtiges.

```
Backlog (Status "offen")
   │
   ▼
Block bilden ─── Optik, Config-Zahlen, Doku: 3–4 Einträge auf einem Branch (max. ca. 1000 Zeilen)
   │        └── Spiel-Logik, Balancing, Eingabe, Layout: einzeln
   ▼
developer ─── pro Eintrag ein Commit (Code + Unit-Tests)
   │
   ▼
Risiko? ── nein ──→ Orchestrator prüft selbst: npm test, Diff, kein Test abgeschwächt
   │ ja (game.js, path.js, input.js, main.js, hud.js, index.html, style.css
   │     oder bestehende Tests geändert)
   ▼
tester + reviewer ─── einmal über den ganzen Block
   │        └── Muss-Punkte → eine Nachbesserung durch den developer
   ▼
Ledger-Eintrag → Pull Request → CI grün → Orchestrator mergt → GitHub Pages
```

**Wann der Orchestrator selbst mergt:** nur wenn **alle** Bedingungen gelten:
- Die CI ist grün.
- Der PR ändert nichts an `.claude/`, `.github/`, `package.json` oder `package-lock.json`.
- Kein Test wurde gelöscht oder abgeschwächt.
- Bei Risiko-Dateien liegt ein `APPROVE` des Reviewers ohne Muss-Punkte vor.
- Es gibt keine Spiel-Logik- oder Balancing-Änderung, die der Mensch nicht freigegeben hat.

Sonst bleibt der PR offen, und der Mensch bekommt den Grund in einer Zeile.

**Was nur der Mensch entscheidet:** neue Mechaniken, Balancing außerhalb des freigegebenen Eintrags, neue Abhängigkeiten, Änderungen an `.claude/`, `.github/` und `CLAUDE.md`, Tests ändern oder löschen, und alles, was `blockiert` ist.

**Schleifenbremse:** höchstens **2 Entwicklungsrunden** und **eine** Review-Runde. Ist danach noch ein Muss-Punkt offen, bekommt der Eintrag den Status `blockiert`, und ein Mensch wird gefragt. Agents, die sich gegenseitig Arbeit zuschieben, könnten sonst endlos Geld und Zeit verbrennen. Hinweise ohne Muss-Charakter gehen als `vorschlag` ins Backlog statt in eine neue Runde.

**Warum so und nicht immer mit allen Prüfungen?** Früher liefen Tester und Reviewer bei jedem Eintrag, auch bei reiner Optik. Das war gründlich, aber langsam und teuer. Heute richtet sich die Prüftiefe nach dem **Risiko**: Eine neue Farbe kann kaum etwas kaputt machen, eine Änderung an der Spiel-Logik schon. Die CI und der Test-Gate-Hook laufen trotzdem immer.

## 4. Guardrails: Bitten vs. Erzwingen

Das ist die wichtigste Lektion:

- Eine Regel in `CLAUDE.md` oder im Prompt ist eine **Bitte**. Das Modell befolgt sie meistens, aber nicht garantiert.
- Ein **Hook** ist **Code**, den die Harness *vor* der Aktion ausführt. Gibt er Exit-Code 2 zurück, passiert die Aktion nicht. Punkt.

Unser `guard.mjs` blockiert zum Beispiel Force-Push, Push auf `main`, `curl | sh`, neue Abhängigkeiten und Änderungen an den Regeldateien selbst.

**Selbst ausprobieren** (aus dem Projektordner):
```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git push --force origin x"}}' | node .claude/hooks/guard.mjs; echo "Exit: $?"
```

**Drei Schichten, die zusammenspielen:**
1. `permissions` in `settings.json`: Whitelist/Blacklist für Befehle (billig, deklarativ).
2. **Hooks:** beliebige Logik, die du programmierst (mächtig, für Sonderfälle).
3. **GitHub-seitig:** Branch Protection auf `main` (siehe unten) – selbst wenn lokal alles versagt, kommt nichts ungeprüft rein.

Das Prinzip heißt *Defense in Depth*: Jede Schicht darf versagen, weil die nächste auffängt.

## 5. Ledger: zwei Arten von Gedächtnis

| | Audit-Log | Entscheidungsbuch |
|---|---|---|
| Datei | `.claude/ledger/audit.jsonl` | `docs/LEDGER.md` |
| Geschrieben von | **Hook** (automatisch) | **Orchestrator** (per Skill-Anweisung) |
| Inhalt | Jede Aktion: Wer, wann, welches Tool | Warum, Ergebnis, offene Fragen |
| Verlässlichkeit | Lückenlos, weil Code | Nur so gut wie der Agent |
| Zweck | Forensik („Was ist passiert?“) | Kontext („Warum so?“) |

Beides ist **append-only**: Es wird nur angehängt, nie überschrieben. So kannst du Fehler zurückverfolgen und Agents können aus früheren Entscheidungen lernen (der `ideator` liest das Ledger, um keine abgelehnten Ideen zu wiederholen).

## 6. Qualitätstore

- **Stop-Hook** (`test-gate.mjs`): Claude kann nicht „fertig“ sagen, solange `npm test` rot ist.
- **CI** (`ci.yml`): GitHub führt bei jedem Pull Request alle Tests aus.
- **Reviewer-Agent:** inhaltliche Prüfung vor dem Commit.
- **Mensch:** die letzte Instanz – du mergst den Pull Request.

> Die Faustregel: **Je weniger du einem Agent vertraust, desto mehr unabhängige Prüfungen brauchst du.** Und: Ein Agent, der seine eigene Arbeit bewertet, ist keine Prüfung.

## 7. Dein erster eigener Durchlauf

1. Starte Claude Code im Projektordner: `claude`
2. Tippe `/ideen` und schau, was der `ideator` vorschlägt und wie das Backlog sich füllt.
3. Setze in `docs/BACKLOG.md` einen Eintrag von `vorschlag` auf `offen`.
4. Tippe `/pipeline` und beobachte, wie die Rollen nacheinander arbeiten.
5. Lies danach `docs/LEDGER.md` und `.claude/ledger/audit.jsonl`.
6. Prüfe den Branch `agent/...` und erstelle selbst den Pull Request.

**Übungen:**
- Ändere den `reviewer` so, dass er strenger ist. Was passiert in der Pipeline?
- Gib dem `reviewer` testweise `Edit` in `tools:`. Warum ist das keine gute Idee?
- Füge in `guard.mjs` ein neues Verbot hinzu und teste es mit `echo '…' | node …`.
- Lass die Pipeline absichtlich an einem unmöglichen Backlog-Eintrag scheitern. Hält die Schleifenbremse?

## 8. Einmalig auf GitHub einrichten (Mensch)

1. **Pages aktivieren:** Repo → Settings → Pages → Source: **GitHub Actions**.
   Danach steht das Spiel auf `https://<dein-name>.github.io/project-towerdefence/`.
2. **Branch Protection** für `main`: Settings → Branches → Add rule → „Require a pull request before merging“ und „Require status checks to pass“ (Check: `test`).
3. Optional, später: Die offizielle Action `anthropics/claude-code-action` lässt Claude direkt in GitHub auf Issues und Pull Requests reagieren. Dafür braucht es einen API-Schlüssel als Repository-Secret.

## 9. Grundlagen: npm, Git, Branches und Pull Requests

Was hinter den Befehlen steckt, die in diesem Leitfaden ständig vorkommen.

### `npm start` und die anderen Befehle

`npm` ist das Werkzeug von Node.js, mit dem man Projekt-Befehle ausführt. Welche es gibt, steht in `package.json` unter `"scripts"`:

| Befehl | Führt aus | Wozu |
|---|---|---|
| `npm start` | `node scripts/serve.mjs` | Startet einen kleinen Webserver auf http://localhost:8080 |
| `npm test` | `node --test tests/*.test.js` | Unit-Tests der Spiel-Logik, ohne Browser |
| `npm run test:e2e` | `node --test tests/e2e/*.test.mjs` | Unsichtbarer Chrome klickt das Spiel durch (Playwright) |

**Warum überhaupt ein Server?** Das Spiel besteht aus JavaScript-Modulen, die sich gegenseitig laden (`import …`). Öffnest du `index.html` per Doppelklick (`file://…`), blockiert der Browser solche Importe aus Sicherheitsgründen. Über `http://localhost:8080` klappt es.

- `localhost` heißt „dieser Computer“, `8080` ist der Port („die Tür“).
- Der Server läuft nur, solange das Terminal offen ist. **Ctrl + C** beendet ihn. Zeigt der Browser „nichts“, läuft meistens kein Server.
- Nach einer Code-Änderung reicht Neuladen im Browser (bei altem Stand: **Cmd + Shift + R**).
- Die Testseite mit Werkzeugen (Karte/Welle wählen, unbegrenztes Gold) liegt unter `http://localhost:8080/?test`, online unter `…/project-towerdefence/?test`.

### Zwei Arten von „Pipeline“

| | Agenten-Pipeline | GitHub-Pipelines |
|---|---|---|
| Wo | Lokal in Claude Code (`/pipeline`) | Auf GitHub-Servern |
| Datei | `.claude/skills/pipeline/SKILL.md` | `.github/workflows/ci.yml`, `pages.yml` |
| Was | Agents bauen und prüfen einen Backlog-Eintrag (Abschnitt 3) | `ci.yml` testet jeden Pull Request, `pages.yml` veröffentlicht `main` |

Zusammen ergibt sich der ganze Weg einer Idee:

```
Backlog "offen" → /pipeline → Agents bauen + prüfen → Pull Request
→ CI testet (grüner Haken) → Merge nach main → GitHub Pages → online spielbar
```

### Git: Commits

Git speichert die Geschichte des Projekts als Kette von Schnappschüssen, den **Commits**. Jeder Commit hält fest, was sich geändert hat, wer es war, wann und warum (Commit-Nachricht).

```
A ── B ── C ── D        ← main
```

### Branches: Parallelwelten

Ein **Branch** ist ein eigener Entwicklungszweig. Technisch ist er nur ein Zeiger auf einen Commit, deshalb kostet er nichts.

```
A ── B ── C ── D                  ← main (das, was online läuft)
                \
                 E ── F           ← agent/fortschritt-speichern
```

**Warum nie direkt auf `main`** (Regel 3 in `CLAUDE.md`)?
- **`main` bleibt spielbar:** GitHub Pages veröffentlicht automatisch, was auf `main` liegt.
- **Mehrere Dinge gleichzeitig:** Jeder Agent arbeitet in seinem eigenen Branch.
- **Leicht wegzuwerfen:** Geht eine Idee schief, löscht man den Branch, `main` hat nie etwas davon gesehen.

### Pull Requests: der Antrag zum Zusammenführen

Ein **Pull Request (PR)** ist der Antrag auf GitHub: „Bitte übernimm die Änderungen aus meinem Branch nach `main`.“ Wird er **gemergt**, entsteht ein Merge-Commit (`M`):

```
A ── B ── C ── D ─────────── M    ← main
                \           /
                 E ── F ───┘      ← Branch, per PR zusammengeführt
```

Ein PR ist die **Station zum Prüfen**, bevor etwas nach `main` kommt:

| Was | Wo auf GitHub |
|---|---|
| Was und warum | Tab „Conversation“ (Beschreibung) |
| Genau welche Zeilen sich ändern | Tab „Files changed“ (der **Diff**) |
| Automatische Tests | grüner Haken ✓ oder rotes ✗ |
| Kommentare, Review | direkt an einzelnen Zeilen |

Ein PR kann auch **geschlossen** werden, ohne Merge. Dann landet nichts in `main`.

**Normalfall (B-093, PR #53):** Branch anlegen → Commits des `developer` → `tester` und `reviewer` → `git push` → PR anlegen → CI grün → Merge → automatisch online.

**Warum PRs schützen (PR #57):** Zwei Claude-Sitzungen arbeiteten im selben Ordner. Ein `git add -A` packte die unfertige Boss-Arbeit der anderen Sitzung mit in einen Commit. Im PR stand „6 Dateien geändert“ statt der erwarteten 3. Das fiel **vor** dem Merge auf; der PR wurde geschlossen und durch einen sauberen ersetzt (#58). Ohne PR wäre unfertiger Code direkt online gelandet.

**Lehren daraus:**
- Dateien einzeln vormerken (`git add <datei>`) statt `git add -A`.
- Vor jedem PR den Diff gegen die Erwartung prüfen (`git diff --stat origin/main...HEAD`).
- Parallele Sitzungen gehören in getrennte Arbeitsordner (**Git-Worktrees**, `git worktree add …`), siehe Stufe 4 unten.

### Die wichtigsten Git-Befehle

| Befehl | Bedeutung |
|---|---|
| `git status` | Was ist geändert und noch nicht committet? Auf welchem Branch bin ich? |
| `git branch --show-current` | Nur den aktuellen Branch anzeigen |
| `git switch -c agent/xyz` | Neuen Branch anlegen und hineinwechseln |
| `git switch main` | Zurück auf `main` |
| `git add <datei>` | Datei für den nächsten Commit vormerken |
| `git commit -m "…"` | Schnappschuss speichern |
| `git push` | Branch zu GitHub hochladen |
| `git pull` | Neuen Stand von GitHub holen, z. B. `main` nach einem Merge |
| `git log --oneline` | Geschichte anzeigen |
| `git diff --stat main` | Welche Dateien unterscheiden sich von `main`, und wie stark? |

## Wie geht es weiter?

Stufen, nach denen du dich steigern kannst:
1. **Interaktiv** (jetzt): Du tippst `/pipeline`, schaust zu.
2. **Headless:** `claude -p "/pipeline"` läuft ohne Chat, z. B. per Skript.
3. **Geplant:** GitHub Action mit Zeitplan, die jede Nacht einen Backlog-Eintrag abarbeitet und einen Pull Request öffnet.
4. **Parallel:** Mehrere Pipelines gleichzeitig in getrennten Git-Worktrees.

Je höher die Stufe, desto wichtiger werden Guardrails, Budgets und das Ledger. Starte klein.
