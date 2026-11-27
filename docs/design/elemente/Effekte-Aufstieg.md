# Effekte-Aufstieg (B-174): Lichtsäule beim Aufwerten auf Stufe 3 (alle Türme)
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Effekte-Aufstieg. Backlog: B-174. Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
Spiel-px (Kachel 40), Ablauf siehe Zeichenfläche (Kasten „Ablauf“).
- Säule Breite 1,25 Kacheln, vom Fußpunkt bis zum oberen Feldrand, wächst in 0,36 s von unten (scaleY 0 → 1).
- Kern 0,4 Kacheln breit, weiß α 0,55.
- Bodenring rx 1,25 Kacheln, ry × 0,33, scale 0,4 → 1,4 in 0,7 s.
- 6 Funkensterne r 6 steigen 110 px, versetzt 0–0,7 s.
- Text „Stufe 3!“ 1,2 Kacheln über der Turmspitze, steigt 16 px ein.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Säule | gold-light → cream → durchsichtig | #ffe27a → #fff3d2 |
| Ring, Funken | `gold-light` | #ffe27a, 4 px |
| Text | font-display 30, gold-light, Umriss ink 6 |  |


## Formen/SVG
Werte in `src/config.js`, neuer Block `MASTER_FX` (nur Optik, keine Spielzahlen):
~~~js
  ascend: { width: 1.25, core: 0.4, grow: 0.36, swapAt: 0.42, ring: 0.7, sparks: 6, sparkRise: 110, text: 'Stufe 3!', textLife: 1.2, life: 1.8 },
  maxParticles: 120, // Obergrenze aller Stufe-3-Effekte zusammen (B-173)
~~~
Formen: Kreise, Ellipsen und Polylinien direkt per Canvas, Stern wie `star(x, y, r)`: Punkte (0,−r) (0,25r,−0,25r) (r,0) (0,25r,0,25r) (0,r) (−0,25r,0,25r) (−r,0) (−0,25r,−0,25r).

## Zustände
- Figur Stufe 2 → 3 wechselt bei 0,42 s (hellster Moment).
- Nur beim Aufwerten auf 3, nicht auf 2.
- Klang optional (Datei wählt der Mensch).
- reduced motion: nur Bodenring und Text, keine Säule.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/render-fx.js` | Effekt-Typ `ascend`; Logik schreibt ihn beim Upgrade auf 3 (nur Effekt-Eintrag, kein Spielwert) |
| `src/render-towers.js` | Figurwechsel verzögert bis `swapAt` (Turm zeigt bis dahin Stufe 2) |
| `src/config.js` | `MASTER_FX`-Eintrag oben |
Logik (Ereignisse, Zustände am Gegner) kommt aus der Logik-Spur; hier nur Zeichnen. Keine IDs betroffen.

## Tests
- Bestehend: `tests/fx.test.js` bleibt unverändert grün.
- Neu (`tests/fx.test.js`): Effekt nur bei Upgrade auf 3, ausgewogen, reduced motion ohne Säule.

## Messbare Abnahme
- Zeichenfläche und Screenshot `#game` 1280x800 im PR nebeneinander; Effekt auf Wiese, Eiswelt und Vulkan gut sichtbar.
- Mit 20 Türmen Stufe 3 und voller Welle bleibt die Bildrate im Handy-Testprofil stabil; nie mehr als `MASTER_FX.maxParticles` Teilchen.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
