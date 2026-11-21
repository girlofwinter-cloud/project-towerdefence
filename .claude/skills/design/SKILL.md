---
name: design
description: Lässt den designer Aussehen und Bedienung des Spiels auf Desktop und Handy prüfen und Vorschläge für neue Designs machen; trägt Befunde und Vorschläge ins Backlog ein. Nutzen bei "Design prüfen", "sieht das gut aus" oder /design.
---

1. Rufe den Subagent `designer` auf. Gib ihm im Auftrag mit: den Pfad des Repos, den Pfad des Scratchpad-Verzeichnisses für Screenshots und Skripte (außerhalb des Repos) und, falls der Mensch einen Schwerpunkt genannt hat (z. B. "nur Handy", "nur Eiswelt", "Türme"), diesen Schwerpunkt. Ohne Schwerpunkt prüft er alles.
2. Trage die **Muss-Befunde** und alle **Vorschläge** in `docs/BACKLOG.md` ein (Format dort), Status `vorschlag`, Aufwand und Akzeptanzkriterien aus dem Bericht. "Sollte"/"Nett"-Befunde nur, wenn sie sich zu einem sinnvollen Eintrag bündeln lassen. Lies dafür nur die offenen und vorgeschlagenen Einträge, Erledigtes liegt in `docs/archiv/BACKLOG-fertig.md`.
3. Ändere keinen Code. Ein Mensch gibt Einträge frei (`offen`); die Umsetzung läuft danach über die Pipeline (`developer`).
4. Fasse dem Menschen die wichtigsten Befunde und Vorschläge in wenigen Zeilen zusammen und nenne den Pfad der Screenshots.
5. Hänge einen Ledger-Eintrag an `docs/LEDGER.md` an (Rolle `designer`), auf einem Branch `agent/design-<kurzname>` mit Pull Request (nie direkt auf `main`).
