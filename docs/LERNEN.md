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
| `reviewer` | **nein** | Wer bewertet, darf nicht gleichzeitig reparieren. |
| `ideator` | **nein** | Er liefert Vorschläge, ein Mensch entscheidet. |
| `designer` | **nein** (nur Screenshots außerhalb des Repos) | Er prüft Optik und Bedienung mit echten Screenshots und schlägt Designs vor; gebaut wird über die Pipeline. |

**Warum mehrere Agents statt einem?**
1. **Frischer Kontext:** Ein Reviewer, der den Code nicht geschrieben hat, findet mehr Fehler.
2. **Kleinste Rechte:** Jede Rolle bekommt nur, was sie braucht (*Least Privilege*).
3. **Der Hauptkontext bleibt sauber:** Die Details landen im Subagent, du bekommst nur den Bericht.

## 3. Ablauf: der Orchestrator

`/pipeline` lädt den Skill. Das Hauptmodell ist der **Orchestrator**: Es schreibt selbst keinen Code, sondern ruft die Subagents der Reihe nach auf:

```
Backlog → developer → tester ─FAIL→ zurück zum developer
                        │
                      PASS
                        ↓
                    reviewer ─CHANGES_REQUESTED→ zurück zum developer
                        │
                     APPROVE
                        ↓
              Ledger-Eintrag → Branch pushen → (PR)
```

Wichtig ist die **Schleifenbremse** (max. 3 Runden): Agents, die sich gegenseitig Arbeit zuschieben, können sonst endlos Geld und Zeit verbrennen.

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

## Wie geht es weiter?

Stufen, nach denen du dich steigern kannst:
1. **Interaktiv** (jetzt): Du tippst `/pipeline`, schaust zu.
2. **Headless:** `claude -p "/pipeline"` läuft ohne Chat, z. B. per Skript.
3. **Geplant:** GitHub Action mit Zeitplan, die jede Nacht einen Backlog-Eintrag abarbeitet und einen Pull Request öffnet.
4. **Parallel:** Mehrere Pipelines gleichzeitig in getrennten Git-Worktrees.

Je höher die Stufe, desto wichtiger werden Guardrails, Budgets und das Ledger. Starte klein.
