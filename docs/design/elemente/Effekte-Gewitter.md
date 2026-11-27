# Effekte-Gewitter (B-175): Optik des Gewitter-Einschlags (Blitz Stufe 3) mit Ankündigung
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Effekte-Gewitter. Backlog: B-175 (Logik), B-174 (Optik). Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
Spiel-px (Kachel 40), Ablauf siehe Zeichenfläche (Kasten „Ablauf“).
- Ankündigung 0,35 s vor dem Einschlag: Ellipse um das Ziel, rx = Flächenradius, ry = rx × 0,36, gestrichelt 7/5.
- Wolke 40 Spiel-px über dem Ziel: 3 Kreise r 14/18/12, Unterkante gerade.
- Blitz: Polylinie von der Wolke zum Ziel, 6 Knicke (±12 px seitlich), 2 Äste je 20–30 px.
- Bodenlicht r = Flächenradius × 1,2, Druckring scale 0,3 → 1,35 in 0,65 s, Rußfleck r = 0,8 × Radius, 1 s.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Ankündigung | `hl` | #ffe266, 2,5 px |
| Wolke | neu: `cloud` | #4a4458, Rand ink 2,5 |
| Blitz außen/Mitte/Kern | ink / neu: bolt / weiß | 8 / 5 / 1,6 px |
| Bodenlicht | bolt → durchsichtig |  |
| Ruß | neu: `soot` | rgba(43,26,16,0.45) (hier α 0,3) |
- neu: `cloud` = #4a4458, Gewitterwolke
- neu: `bolt` = #fff6a8, Blitz (heute Hex in FIGURE_STYLE.shotGlow)
- neu: `soot` = rgba(43,26,16,0.45), Ruß/Brandfleck

## Formen/SVG
Werte in `src/config.js`, neuer Block `MASTER_FX` (nur Optik, keine Spielzahlen):
~~~js
  storm: { tele: 0.35, teleColor: '#ffe266', cloud: '#4a4458', bolt: '#fff6a8', boltW: [8, 5, 1.6], kinks: 6, branches: 2, flicker: [0.1, 0.05, 0.1], ring: 0.65, soot: 0.3, sootLife: 1.0, cloudLife: 1.8 },
  maxParticles: 120, // Obergrenze aller Stufe-3-Effekte zusammen (B-173)
~~~
Formen: Kreise, Ellipsen und Polylinien direkt per Canvas, Stern wie `star(x, y, r)`: Punkte (0,−r) (0,25r,−0,25r) (r,0) (0,25r,0,25r) (0,r) (−0,25r,0,25r) (−r,0) (−0,25r,−0,25r).

## Zustände
- Ankündigung sichtbar, damit der Einschlag lesbar ist (Ort, nicht nur Blitz).
- Doppeltes Aufblitzen 0,1 s / Pause 0,05 s / 0,1 s.
- reduced motion: kein Flackern, Blitz 1 Bild 0,15 s, kein Kamera-Wackeln.
- Mehrere Sturmspulen: Wolken überlagern sich, höchstens 6 Einschläge gleichzeitig.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/render-fx.js` | Effekt-Typen `stormWarn` (Ankündigung) und `storm` (Einschlag), aus `state.effects` (Logik B-175 schreibt sie) |
| `src/tower-fx.js` | Funke Spule → Wolke (gestrichelt, 0,15 s) |
| `src/config.js` | `MASTER_FX`-Eintrag oben |
Logik (Ereignisse, Zustände am Gegner) kommt aus der Logik-Spur; hier nur Zeichnen. Keine IDs betroffen.

## Tests
- Bestehend: `tests/fx.test.js` bleibt unverändert grün.
- Neu (`tests/fx.test.js`): beide Effekt-Typen zeichnen ausgewogen, robust bei kaputten Werten (NaN-Radius), reduced motion ohne Flackern.

## Messbare Abnahme
- Zeichenfläche und Screenshot `#game` 1280x800 im PR nebeneinander; Effekt auf Wiese, Eiswelt und Vulkan gut sichtbar.
- Mit 20 Türmen Stufe 3 und voller Welle bleibt die Bildrate im Handy-Testprofil stabil; nie mehr als `MASTER_FX.maxParticles` Teilchen.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
