# 🏰 Project TowerDefence

Ein Tower-Defense-Spiel für den Browser. Gebaut als Lernprojekt für **agentische Entwicklung mit Claude Code**.

## Spielen
```bash
npm start   # → http://localhost:8080
```
Nach dem Aktivieren von GitHub Pages (siehe `docs/LERNEN.md`) auch online.

**Steuerung:** `1`–`4` Turm wählen und aufs Feld klicken · Turm anklicken zum Verbessern/Verkaufen · `Leertaste` nächste Welle · `F` Tempo

## Tests
```bash
npm test            # Unit-Tests der Spiel-Logik
npm run test:e2e    # Browser-Test (braucht Playwright)
```

## Agenten-Pipeline
Start mit **[`docs/LERNEN.md`](docs/LERNEN.md)**. Dort ist erklärt, wie Subagents, Guardrails und Ledger zusammenspielen.

| Befehl in Claude Code | Wirkung |
|---|---|
| `/ideen` | Ideengeber füllt das Backlog |
| `/pipeline` | Entwickeln → Testen → Reviewen → Ledger → Branch |
