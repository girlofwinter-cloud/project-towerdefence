# Effekte-Eisboden (B-176): Optik des Eisbodens (Frost Stufe 3): Eisfläche, die am Boden verlangsamt
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Effekte-Eisboden. Backlog: B-176 (Logik), B-173 (Optik). Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
Spiel-px (Kachel 40), Ablauf siehe Zeichenfläche (Kasten „Ablauf“).
- Ellipse rx = Eisboden-Radius, ry = rx × 0,36, Mitte am Treffpunkt auf dem Weg.
- Innenfleck rx × 0,68, 6 px nach links/oben versetzt.
- 4 Risse je 2–3 Segmente (8–14 px), 3 Glanzsterne r 3,5–5.
- Gegner darauf: Reif-Ellipse an den Füßen (rx 0,6 × Figurbreite, ry 4) + 3 Eisstriche 4 px.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Fläche | ice-a α 0,85 | #e8fbff |
| Rand, Risse | `ice-c` | #3b8fcb, 2,5 / 1,5 |
| Innenfleck | ice-b α 0,45 | #8fd8f2 |
| Glanz | weiß | #ffffff |
| Reif | ice-b α 0,8 / ice-a |  |


## Formen/SVG
Werte in `src/config.js`, neuer Block `MASTER_FX` (nur Optik, keine Spielzahlen):
~~~js
  iceFloor: { fill: 'rgba(232,251,255,0.85)', edge: '#3b8fcb', inner: 'rgba(143,216,242,0.45)', ry: 0.36, grow: 0.35, overshoot: 1.05, shrinkTo: 0.85, fadeOut: 0.7, glints: 3, twinkle: 1.2, maxPerTower: 3 },
  maxParticles: 120, // Obergrenze aller Stufe-3-Effekte zusammen (B-173)
~~~
Formen: Kreise, Ellipsen und Polylinien direkt per Canvas, Stern wie `star(x, y, r)`: Punkte (0,−r) (0,25r,−0,25r) (r,0) (0,25r,0,25r) (0,r) (−0,25r,0,25r) (−r,0) (−0,25r,−0,25r).

## Zustände
- Entsteht: scale 0,2 → 1,05 → 1 in 0,35 s.
- Liegt: Glanz funkelt (1,2 s, versetzt).
- Vergeht: letzte 0,7 s scale → 0,85 und Deckkraft → 0.
- Flieger und Glutling darauf: kein Reif (Logik wirkt nicht, Optik auch nicht).
- Eingefrorene Gegner darauf: Eisblock wie heute, kein Reif zusätzlich.
- reduced motion: kein Funkeln, kein Überschwingen.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/render-fx.js` | Effekt-Typ `iceFloor` (Bodenschicht, vor den Gegnern) |
| `src/enemy-fx.js` | Reif an den Füßen, wenn Gegner auf Eisboden (`e.onIce` o. Ä. aus B-176) |
| `src/config.js` | `MASTER_FX`-Eintrag oben |
Logik (Ereignisse, Zustände am Gegner) kommt aus der Logik-Spur; hier nur Zeichnen. Keine IDs betroffen.

## Tests
- Bestehend: `tests/fx.test.js` bleibt unverändert grün.
- Neu (`tests/fx.test.js`): Eisboden zeichnet ausgewogen unter den Gegnern, Reif nicht bei Flieger/Glutling, reduced motion ohne Funkeln.

## Messbare Abnahme
- Zeichenfläche und Screenshot `#game` 1280x800 im PR nebeneinander; Effekt auf Wiese, Eiswelt und Vulkan gut sichtbar.
- Mit 20 Türmen Stufe 3 und voller Welle bleibt die Bildrate im Handy-Testprofil stabil; nie mehr als `MASTER_FX.maxParticles` Teilchen.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
