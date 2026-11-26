# 🏰 Project TowerDefence

Ein Tower-Defense-Spiel für den Browser. Gebaut als Lernprojekt für **agentische Entwicklung mit Claude Code**.

## Spielen
```bash
npm start   # → http://localhost:8080
```
Nach dem Aktivieren von GitHub Pages (siehe `docs/LERNEN.md`) auch online.

**Steuerung:** `1`–`5` Turm wählen und aufs Feld klicken · Turm anklicken zum Verbessern/Verkaufen · `Leertaste` nächste Welle · `F` Tempo

## Tests
```bash
npm test            # Unit-Tests der Spiel-Logik
npm run test:e2e    # Browser-Test (braucht Playwright)
```

## Testserver
Liefert Spiel und Testseite immer im neuesten Stand eines Git-Branches aus, ohne Checkout (Port 8091, `PORT` überschreibbar, öffnet auf macOS den Browser):
```bash
npm run testserver                    # origin/main
npm run testserver -- agent/xyz       # origin/agent/xyz, sonst lokaler Branch
npm run testserver -- e34d76b         # beliebiger Commit
npm run testserver -- --dir ../wt     # Arbeitsordner von der Platte (nicht committet)
npm run testserver -- --no-open       # ohne Browser
```
Beim Laden einer HTML-Seite holt er höchstens alle 10 s den neuen Stand (`git fetch`).

## Agenten-Pipeline
Start mit **[`docs/LERNEN.md`](docs/LERNEN.md)**. Dort ist erklärt, wie Subagents, Guardrails und Ledger zusammenspielen.

| Befehl in Claude Code | Wirkung |
|---|---|
| `/ideen` | Ideengeber füllt das Backlog |
| `/pipeline` | Entwickeln → Testen → Reviewen → Ledger → Branch |
