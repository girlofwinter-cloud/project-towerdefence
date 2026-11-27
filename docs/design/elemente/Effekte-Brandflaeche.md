# Effekte-Brandflaeche (B-176): Optik der Brandfläche (Kanone Stufe 3): 2 s brennender Boden
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Effekte-Brandflaeche. Backlog: B-176 (Logik), B-173 (Optik). Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
Spiel-px (Kachel 40), Ablauf siehe Zeichenfläche (Kasten „Ablauf“).
- Explosion wie heute; zusätzlich Ring `lava-core` 5 px, scale 0,3 → 1,3 in 0,4 s.
- Rußfleck Ellipse rx = Brandradius × 0,9, ry = rx × 0,35; Glut rx × 1,1.
- 5 Flämmchen 18 Spiel-px hoch (Tropfen `M0 0 Q-7 -6 0 -18 Q7 -6 0 0 Z`, Kern halb so groß), Plätze zufällig fest je Fläche (Saat = Effekt-ID).
- Funken r 2 steigen 26 px in 1 s, 3 gleichzeitig.
- Gegner in der Fläche: Flämmchen 10 px über dem Lebensbalken.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Ruß | neu: `soot` | rgba(43,26,16,0.45) |
| Glut | lava-core → lava | #ffc23a → #ff7a1f |
| Flamme/Kern | lava / lava-core |  |
| Funken | `lava-hot` | #ffe58a |
| Rand | `ink` | 2 px |
- neu: `soot` = rgba(43,26,16,0.45), Ruß/Brandfleck

## Formen/SVG
Werte in `src/config.js`, neuer Block `MASTER_FX` (nur Optik, keine Spielzahlen):
~~~js
  burn: { soot: 'rgba(43,26,16,0.45)', flames: 5, flameH: 18, flicker: [0.27, 0.35, 0.42], embers: 3, emberRise: 26, fadeIn: 0.1, fadeOut: 0.35, maxPatches: 4 },
  maxParticles: 120, // Obergrenze aller Stufe-3-Effekte zusammen (B-173)
~~~
Formen: Kreise, Ellipsen und Polylinien direkt per Canvas, Stern wie `star(x, y, r)`: Punkte (0,−r) (0,25r,−0,25r) (r,0) (0,25r,0,25r) (0,r) (−0,25r,0,25r) (−r,0) (−0,25r,−0,25r).

## Zustände
- Brennt: Flämmchen flackern (scaleY 1 → 0,7, Perioden 0,27/0,35/0,42 s).
- Läuft aus: letzte 0,35 s Deckkraft → 0.
- Panzerkäfer in der Fläche: Flämmchen über dem Kopf, aber kein Schalen-Splitter (zählt nicht als Treffer).
- reduced motion: Flammen stehen, keine Funken.
- Mehr als 4 Flächen: älteste wird nicht gezeichnet (Logik läuft weiter).

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/render-fx.js` | Effekt-Typ `burn` (Bodenschicht, vor den Gegnern zeichnen) |
| `src/enemy-fx.js` | Flämmchen über brennenden Gegnern (`e.burnUntil` o. Ä. aus B-176) |
| `src/config.js` | `MASTER_FX`-Eintrag oben |
Logik (Ereignisse, Zustände am Gegner) kommt aus der Logik-Spur; hier nur Zeichnen. Keine IDs betroffen.

## Tests
- Bestehend: `tests/fx.test.js` bleibt unverändert grün.
- Neu (`tests/fx.test.js`): Brandfläche zeichnet unter den Gegnern, ausgewogen, Obergrenze 4, reduced motion ohne Funken.

## Messbare Abnahme
- Zeichenfläche und Screenshot `#game` 1280x800 im PR nebeneinander; Effekt auf Wiese, Eiswelt und Vulkan gut sichtbar.
- Mit 20 Türmen Stufe 3 und voller Welle bleibt die Bildrate im Handy-Testprofil stabil; nie mehr als `MASTER_FX.maxParticles` Teilchen.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
