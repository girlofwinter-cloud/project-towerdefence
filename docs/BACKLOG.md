# Backlog

Status: `offen` (Mensch hat freigegeben) → `fertig` / `blockiert`. Die Pipeline nimmt Einträge von oben nach unten.
Ideen mit Status `vorschlag` stehen in `docs/IDEEN.md`. Zum Freigeben den Eintrag hierher verschieben und `offen` setzen.

## Format
```

### B-<nr>: <Titel>
- Status: offen
- Aufwand: S | M | L
- Idee: ...
- Akzeptanzkriterien:
  - ...
```

Erledigte Einträge (`fertig`) liegen in `docs/archiv/BACKLOG-fertig.md`. Beim Abschluss eines Durchlaufs wird der Eintrag dorthin verschoben.

---

### B-064: Restliche Türme im neuen Stil (Design-Overhaul)
- Status: erledigt
- Aufwand: M
- Idee: Kanone, Frost, Scharfschütze, Blitz mit je eigener Silhouette, Stufen sichtbar in der Form.
- Akzeptanzkriterien:
  - Alle 5 Typen auf einem Screenshot an der Silhouette unterscheidbar.
  - Reichweitenkreis und Auswahlrahmen bleiben sichtbar.

### B-065: Gegner Teil 1: Goblin, Flitzer, Troll (Design-Overhaul)
- Status: erledigt
- Aufwand: M
- Idee: `render-enemies.js`: Lauf-Phasen, Kontur, Bodenschatten.
- Akzeptanzkriterien:
  - Frost-Overlay, Heil-Aura und HP-Balken unverändert.
  - Drei Typen auf Handy-Screenshot unterscheidbar; mindestens 25 % Helligkeitsabstand zum Weg.

### B-066: Gegner Teil 2: Schamane, Schildträger, weitere (Design-Overhaul)
- Status: erledigt
- Aufwand: M
- Idee: Übrige Gegnertypen (inkl. Fliegende, Splitter/Tarn, sofern vorhanden). Zustände Schild, Heilung, Eingefroren zusätzlich über Form/Symbol.
- Akzeptanzkriterien:
  - Je Typ ein Screenshot-Beleg, keine reine Farbunterscheidung.

---

## Entwurf 2026-11-27: Mehr Abwechslung bei den Türmen (wartet auf Freigabe durch den Menschen)
Problem: Kanone (Fläche + Rückstoß) und Frost (Verlangsamung) decken fast alles ab; Pfeil und Blitz haben kaum eine eigene Aufgabe.
Idee: Jeder neue Gegner bremst gezielt Kanone oder Frost aus und belohnt einen anderen Turm. Bis zur Freigabe steht der Status auf `entwurf`, die Pipeline nimmt nur `offen`.
Wer gegen wen: Fledermaus → Pfeil, Blitz, Scharfschütze | Irrlicht → Blitz, Pfeil | Panzerkäfer → Pfeil, Blitz | Glutling → Blitz, Pfeil, Scharfschütze.
Reihenfolge (neu 27.11., freigegeben; je Zeile eine Sitzung mit `/pipeline`, dazwischen `/clear`). **Balancing erst ganz am Ende:** Die Logik-Einträge bauen nur die Mechanik mit vorläufigen Werten in `config.js` und Unit-Tests; `npm run test:balance` darf dort rot werden, wenn es nur um Zahlen geht (im Ledger vermerken, kein Merge auf main bis Schritt 5, alles auf einem Sammel-Branch `agent/stufe3-und-gegner`).
Zwei developer parallel (je eigene Sitzung, eigener Unter-Branch von `agent/stufe3-und-gegner`, in den Sammel-Branch mergen; beide ändern `game.js`/`config.js`, aber an getrennten Stellen: Türme bzw. Gegner/Wellen):
- Spur T, Türme: 1. B-175 → 2. B-176
- Spur G, Gegner: 1. B-179 (Elite-Gegner, Wellen) → 2. B-180 Logik (Phasen der Nekromantin)
- Danach gemeinsam: Balancing-Sitzung, alles zusammen messen und Werte einstellen, dann PR und Merge auf main.
- Spur O, designer (sofort, parallel): Skizzen Stufe 3 (B-172), Entwurf Nekromantin (B-180), dazu Effekt-Skizzen für die Stufe-3-Fähigkeiten (Mehrfachschuss, Gewitter, Brandfläche, Eisboden, Markierung) und das Elite-Abzeichen (B-179). Umsetzung der Optik (B-173, B-174, Optik B-180) nach den Logik-Schritten.

### B-181: Stufe 2 sichtbar wachsen lassen (nur Optik)
- Status: entwurf
- Aufwand: M
- Idee: Heute ist Stufe 2 nur Stufe 1 plus Goldband. Stufe 1 → 2 soll sichtbar wachsen (gleicher Grundkörper, etwas höher, mehr Details), damit der Sprung zur komplett neuen Endstufe (B-173/B-174) als Steigerung wirkt. Erst Skizze durch den designer, dann Umsetzung. Nach dem Block Stufe 3/Gegner.
- Akzeptanzkriterien:
  - Je Turm ein eigener `l2`-Eintrag in `src/figures.js`; Stufe 2 auf 1280x800 sichtbar höher als Stufe 1, Fuß bleibt auf der Kachel.
  - Werte aus dem Design-System, Screenshot Desktop und Handy.

---

## Paket „Albtraum“-Modus (B-182 bis B-186, freigegeben 28.11.)
Der Mensch wünscht sich einen Modus für Spieler, die viel mehr Herausforderung wollen, weil die Karten heute zu leicht sind. Gleiche Karten, **eine feste Albtraum-Stufe**, Abzeichen und Kosmetik als Belohnung. Ersetzt B-109 und B-110 aus `docs/IDEEN.md`.
**Ein großes Paket, Entwicklung zuerst:** alles auf einem Sammel-Branch `agent/albtraum`, Reihenfolge B-182 → B-183 → B-184 → B-185 → B-186, je Eintrag nur der `developer` (eine Sitzung je Eintrag mit `/pipeline`, dazwischen `/clear`). Der developer schreibt weiter Unit-Tests zu neuer Logik (Regel 2) und hält `npm test` grün.
**Prüfen erst am Ende, einmal über das ganze Paket:** tester (inkl. e2e), reviewer, Screenshots Desktop und Handy, danach PR und Merge auf main. Bis dahin kein Merge auf main.
**Balancing zuletzt (B-186) und nur grob:** B-182 bis B-185 nutzen vorläufige Werte in `config.js`. Die Feinabstimmung macht der Mensch beim eigenen Testen. Normalmodus und `npm run test:balance` bleiben unverändert.
B-184: Den designer-Prototyp (`/design`) vor der Umsetzung anfertigen; er kann parallel zu B-182 und B-183 laufen.

### B-182: Albtraum-Modus: Grundlage
- Status: offen
- Aufwand: M
- Idee: Neuer Spielmodus `nightmare`, der je Karte freigeschaltet wird, sobald sie normal mit 3 Sternen geschafft ist. Die Stufe ist fest und liegt als `NIGHTMARE` in `config.js` (vorläufige Werte): Start-Gold −30 %, Kopfgeld −20 %, 5 statt 10 Leben, Reparatur nur einmal, höheres spätes HP-Wachstum, mehr Elite-Gegner. Umsetzung über den vorhandenen `modifiers`-Mechanismus. Wählbar in der Kartenauswahl (Knopf „Albtraum“ auf freigeschalteten Karten).
- Akzeptanzkriterien:
  - Neues Spiel mit `mode: 'nightmare'` übernimmt alle `NIGHTMARE`-Werte (Unit-Test je Wert); der Normalmodus bleibt unverändert (Test).
  - Freischaltung nur bei 3 Sternen normal (Test); alte Spielstände laden weiter (Test).
  - Albtraum-Ergebnisse überschreiben keine Normal-Rekorde oder -Sterne.

### B-183: Albtraum-Abzeichen Bronze/Silber/Gold
- Status: offen
- Aufwand: M
- Idee: Drei Abzeichen je Karte: Bronze = Welle 20 geschafft, Silber = ohne Lebensverlust, Gold = ohne Lebensverlust plus eine Kartenbedingung. Die Bedingungen liegen in `config.js` (Vorschläge: Wiese „ohne Fähigkeiten“, Eis „ohne Frostturm“, Gabelung „höchstens 3 Turmtypen“, Zwillinge „ohne Verkaufen“, Vulkan „höchstens 3 Turmtypen“). Die Prüfung läuft rein in der Logik und zählt während des Spiels mit.
- Akzeptanzkriterien:
  - `checkGoldCondition(state, mapId)` in Node getestet (erfüllt und verletzt, je Bedingungsart).
  - Abzeichen werden im Fortschritt gespeichert, nur verbessert und nie verschlechtert (Test); alte Spielstände laden (Test).
  - Während des Spiels ist sichtbar, ob die Gold-Bedingung noch erfüllt ist (kleine Anzeige im HUD).

### B-184: Albtraum-Optik: Stimmung, Siegbildschirm, Abzeichen-Wand
- Status: offen
- Aufwand: M
- Idee: Der Modus soll sich sofort anders anfühlen: dunklerer Himmel und rötliches Licht über dem vorhandenen Licht-System, eigener Siegbildschirm mit groß einfliegendem Abzeichen (ähnlich wie das Elite-Abzeichen aus B-179) und Sound. In der Kartenauswahl tragen die Karten ihre Abzeichen, dazu ein Zähler „Abzeichen 7 / 15“. Farben und Maße kommen aus dem Design-System. Vorher baut der designer einen Prototyp mit `/design`.
- Akzeptanzkriterien:
  - Render-Test: Nacht-Tönung ist nur im Albtraum aktiv; das Spielfeld bleibt 20x14.
  - Screenshots Desktop 1280x800 und Handy quer ohne Überlappung; e2e grün.
  - Siegbildschirm zeigt das höchste neue Abzeichen; ohne neues Abzeichen gibt es den normalen Albtraum-Siegbildschirm.

### B-185: Kosmetik-Belohnungen
- Status: offen
- Aufwand: M
- Idee: Belohnungen, die nichts leichter machen: Gold-Abzeichen auf einer Karte schaltet für diese Karte einen Nacht-Look auch im Normalmodus frei. Gold auf allen Karten schaltet goldene Turm-Varianten frei. Beides lässt sich in einem kleinen Menü an- und abschalten und wird im Fortschritt gespeichert.
- Akzeptanzkriterien:
  - Freischaltlogik rein und in Node getestet; Spielwerte bleiben unverändert (Test: gleiche Simulation mit und ohne Kosmetik ergibt das gleiche Ergebnis).
  - Auswahl bleibt nach Neuladen erhalten (Test); Render-Test der goldenen Variante.

### B-186: Albtraum-Balancing (grob)
- Status: offen
- Aufwand: M
- Idee: Die `NIGHTMARE`-Werte grob einstellen, nicht perfekt: Der Kanonen-Mix (stärkste Strategie) soll im Albtraum Leben verlieren oder knapp scheitern, und Silber soll mit angepasstem Spiel möglich bleiben. Danach testet der Mensch selbst und gibt Rückmeldung zu den Werten.
- Akzeptanzkriterien:
  - Simulation in `tests/balance/` misst je Karte den Kanonen-Mix im Albtraum und gibt Welle und Leben aus (Messung, keine harte Grenze).
  - `npm run test:balance` für den Normalmodus bleibt grün und unverändert.
