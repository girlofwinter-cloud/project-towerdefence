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

### B-188: Lautstärkeregler für Musik und Effekte
- Status: offen
- Aufwand: M
- Idee: Wunsch des Menschen (28.11.2026, ersetzt die frühere Entscheidung „kein Lautstärkeregler“): Tippen auf den Ton-Knopf oben rechts öffnet ein kleines Feld mit zwei Schiebern, „Musik“ und „Effekte“ (je 0–100 %). Der Ton an/aus bleibt erhalten (Taste M schaltet weiter stumm). Werte werden gespeichert und wirken sofort. Eigener PR von main, nicht im Albtraum-Paket.
- Akzeptanzkriterien:
  - Reine Logik (Speichern/Laden, Begrenzung 0..1, Umrechnung auf Gain) in Node getestet; alte Speicherstände ohne Werte laden mit 100 %.
  - Musik-Schieber wirkt auf die Musik-Lautstärke, Effekte-Schieber auf alle Effekte; 0 % ist still, ohne den Ton-Schalter zu ändern.
  - Tastatur und Touch bedienbar, Tippziele ≥ 44 px, Desktop 1280x800 und Handy quer ohne Überlappung (Screenshots); e2e grün.
  - Farben und Maße aus dem Design-System (Bauteile Holzleiste/Plakette, runder Knopf).
