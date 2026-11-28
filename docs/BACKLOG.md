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

## Albtraum-Feinschliff, nur S (freigegeben 2026-11-28, nur Optik)

### B-201: Albtraum Zangenangriff: Weg-Kontrast anheben
- Status: offen
- Aufwand: S
- Idee: Weg (`path.main #d6ab70`) hebt sich kaum vom hellbraunen Boden ab (Muss-Befund). Weg heller/kühler (Richtung `#ecdcb8`) oder Boden ca. 15 % dunkler, nur Theme-Farben in `src/config.js`.
- Akzeptanzkriterien:
  - Luminanzabstand Weg-Mitte zu Boden mindestens 25 % (Pixelprobe im Screenshot).

### B-202: Albtraum Zwei Fronten: Weg aufhellen
- Status: offen
- Aufwand: S
- Idee: Weg und Boden beide lila-grau, nur die Kanten tragen die Lesbarkeit. Weg heller (cremig-lila), Boden etwas dunkler.
- Akzeptanzkriterien:
  - Luminanzabstand Weg-Mitte zu Boden mindestens 25 %.

### B-203: Albtraum Vulkan: Bodenrisse beruhigen, Weg wärmer
- Status: offen
- Aufwand: S
- Idee: Leuchtende Bodenrisse sind so laut wie die Lava, Feld wirkt unruhig. Risse ca. 50 % weniger Dichte/Deckkraft, volles Leuchten nur für Lavaflüsse. Weg-Mitte `#8b7468` wärmer setzen.
- Akzeptanzkriterien:
  - Höchstens halb so viele Rissstriche pro Fläche, Lavaflüsse unverändert.

### B-204: Albtraum Zangenangriff: Glut-Deko vom Weg nehmen
- Status: offen
- Aufwand: S
- Idee: Orange Glut-Schnörkel und Glimmpunkte liegen auf dem Weg und sind mit Effekten verwechselbar. Nur neben den Weg legen.
- Akzeptanzkriterien:
  - Kein Deko-Element überlappt Wegkacheln, Test in `tests/decor`.

### B-206: Albtraum-Wiese: mehr Baum- und Buschaugen
- Status: offen
- Aufwand: S
- Idee: Jeder 2.-3. Randbaum (oben/rechts) bekommt ein Augenpaar im Astloch (`twistedTreeEyes` öfter), dazu 2-3 Büsche unten mit selten blinzelnden Augen (period ~8 s). Teilchen-Budget: `blink` 10 -> 14, `rise` 24 -> 18. Nur Rand, mind. 1 Kachel Abstand zum Weg, Handy höchstens halb so viele, Augen höchstens 6 px.
- Akzeptanzkriterien:
  - Mindestens 8 sichtbare Augenpaare im Rand (Desktop 1280x800).
  - Test: kein neues Element auf Weg-Kacheln; Teilchensumme unter `maxDesktop`/`maxCompact`.

### B-209: Kleine Gruselelemente auf den übrigen Albtraum-Karten (nur S-Teile)
- Status: offen
- Aufwand: S je Karte
- Idee: Je Karte zuerst ein S-Element: Eis – schwache Augen hinter Eisblöcken (alpha 0,5) oder Atemwölkchen aus dem Tannendickicht; Zangenangriff – Glutaugen in verkohlten Baumstümpfen; Zwei Fronten – Augen in den Gruftfenstern blinzeln echt, Geisterschleier zwischen Grabsteinen; Vulkan – Augenpaare mit Lid in Basaltspalten.
- Akzeptanzkriterien:
  - Je Karte sichtbar im Screenshot, nicht auf dem Weg (Test), Teilchenbudget eingehalten, Augen nicht mit Glutpunkten/Gegnern verwechselbar.

## Neue Karte "Nachtfriedhof" (freigegeben 2026-11-28, neue Mechanik, eine Sitzung je Eintrag, in dieser Reihenfolge)

### B-210: Mechanik: Nebenwege mit Start mitten auf der Karte (Friedhof-Spawns)
- Status: offen
- Aufwand: M
- Idee: `MAPS.<id>.graveyards`: Liste von Nebenwegen (Wegpunkte ab einem Friedhof im Feld bis in den Hauptweg oder zum Ausgang). Unabhängig von der Welle kommt alle `GRAVEYARD.interval` Sekunden je Friedhof ein Trupp von `GRAVEYARD.size` Skeletten (Zahlen in `config.js`, ab Welle `GRAVEYARD.fromWave`). Reine Logik in `game.js`, nutzt bestehende `paths`/`lane`.
- Akzeptanzkriterien:
  - Tests in `tests/game`: Trupps erscheinen am Friedhof-Startpunkt, im Takt, nur während einer laufenden Welle; Karten ohne `graveyards` unverändert.
  - Friedhofkacheln sind nicht bebaubar; Welle gilt erst als beendet, wenn auch Trupps besiegt/durch sind.

### B-211: Karte Nachtfriedhof: Wege und Balancing
- Status: offen
- Aufwand: M
- Idee: Neue Karte `graveyard` (20x14): ein langer Hauptweg vom Rand, Lage nach Skizze Variante B (https://claude.ai/artifact/5VwK9kA9Eze6fY4KAQmjz9#artboard-VarianteB): Hauptweg in Schlangen von links oben nach rechts unten. Friedhof Ost oben Mitte-rechts nah an der ersten Biegung, kurzer Nebenweg mündet früh. Friedhof West abseits in der Ecke links unten (dort baut man sonst nicht), Nebenweg ca. 3-4 Kacheln am unteren Rand, mündet etwa in der Mitte des Hauptwegs; dort braucht man einen eigenen Turm. Wenige Hindernisse.
- Akzeptanzkriterien:
  - Balancing-Sim: Welle 20 ohne Lebensverlust mit optimalem Spiel möglich; ohne Türme an den Nebenwegen gehen Leben verloren. Kanonen-Mix mitmessen.
  - Karte in der Kartenauswahl wählbar.

### B-212: Karte Nachtfriedhof: Optik
- Status: offen
- Aufwand: M
- Idee: Dunkles Moor, Nebel, Grabsteine und Gruft an den Friedhöfen, Farben aus dem Design-System (Tokens). Rand mit Bäumen, keine Vignette. Friedhof leuchtet kurz, wenn ein Trupp kommt.
- Akzeptanzkriterien:
  - Weg-Kontrast zum Boden mindestens 25 % Luminanz; Friedhöfe auf Desktop und Handy klar erkennbar (Screenshots).

## Nachtfriedhof: neue Gegner (freigegeben 2026-11-28, nach B-210 bis B-212; Designer-Skizze Skizze: https://claude.ai/artifact/5VwK9kA9Eze6fY4KAQmjz9)

### B-213: Gegner Totengräber (Nachtfriedhof)
- Status: offen
- Aufwand: M
- Idee: Hält 2 s an einem Grabhügel am Weg und gräbt 3 Skelette aus, dann läuft er weiter. Früh töten verhindert den Trupp. Grob: HP 160, Tempo 0,9, Belohnung 10, Leck 2, ab Welle 7.
- Akzeptanzkriterien:
  - Werte in `ENEMY_TYPES`; Test in `tests/game`: vor dem Graben getötet = 0 Skelette, sonst 3.
  - Grabhaltung sichtbar; perfektes Spiel auf der Karte bleibt möglich.

### B-214: Gegner Klagegeist (Nachtfriedhof)
- Status: offen
- Aufwand: M
- Idee: Lähmt alle 6 s Türme im Radius 1,5 für 1,5 s; belohnt verteiltes Bauen. Grob: HP 70, Tempo 1,3, Belohnung 8, Leck 1, ab Welle 9.
- Akzeptanzkriterien:
  - Test: gelähmter Turm schießt nicht.
  - Sichtbarer Ring und Lähm-Zeichen am Turm, nicht nur über Farbe.

### B-215: Gegner-Rotation Nachtfriedhof
- Status: offen
- Aufwand: S
- Idee: Auf `graveyard` fallen Glutling (`ember`) und Fledermaus (`bat`) weg: Feuer passt nicht ins Moor, Flieger würden die Nebenwege entwerten. Skelett und Nekromantin bleiben.
- Akzeptanzkriterien:
  - `MAPS.graveyard` mit Liste ausgeschlossener Typen; Test: weder `ember` noch `bat` erscheinen.
  - Balancing: Welle 20 ohne Lebensverlust machbar.

### B-216: Nachtfriedhof Albtraum-Variante
- Status: offen
- Aufwand: M
- Idee: Albtraum-Optik laut Skizze (Fläche "Albtraum"): dunkler, glühende Gruft-Tore, rote Augen im Wald, Glutrisse, violetter Nebel; gleiche Wege. Nach B-212.
- Akzeptanzkriterien:
  - Weg-Kontrast zum Boden mindestens 25 % Luminanz; Screenshots Desktop und Handy.
