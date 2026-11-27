---
name: ideen
description: Lässt den ideator neue Feature-Ideen entwickeln und trägt sie in docs/IDEEN.md ein. Nutzen bei "neue Ideen" oder /ideen.
---

1. Rufe den Subagent `ideator` auf.
2. Hänge jede Idee an `docs/IDEEN.md` an (`cat >>`, Format wie in `docs/BACKLOG.md`), Status `vorschlag`.
3. Ändere keinen Code. Ein Mensch verschiebt gute Ideen nach `docs/BACKLOG.md` und setzt sie auf `offen`; erst dann nimmt sie die Pipeline.
4. Hänge einen Ledger-Eintrag an `docs/LEDGER.md` an (Rolle `ideator`, per `cat >>`, ohne die Datei zu lesen).
