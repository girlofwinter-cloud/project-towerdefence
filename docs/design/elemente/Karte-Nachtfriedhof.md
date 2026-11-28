# Karte-Nachtfriedhof (B-212): neue Karte `graveyard`, dunkles Moor bei Nacht mit zwei Friedhöfen, aus denen Skelett-Trupps kommen
Fläche: Skizze VarianteB (https://claude.ai/artifact/5VwK9kA9Eze6fY4KAQmjz9#artboard-VarianteB), keine eigene Bibliotheksfläche. Backlog: B-211 (Wege), B-212 (Optik). Stand: agent/design-friedhof@af89075.

## Maße
- Feld 20x14 Kacheln (TILE 40 Spiel-px, Entwurf 57). Skizze: 48 px je Kachel, Kachel = px/48 - 0,5 (Mitte).
- Hauptweg (`MAPS.graveyard.waypoints`, Kachel-Mitten), Schlange links oben -> rechts unten:
  `[[-1,1],[9,1],[9,4],[3,4],[3,11],[10,11],[10,8],[16,8],[16,12],[20,12]]`
- Friedhöfe (`MAPS.graveyard.graveyards`, Format `[{ tiles, waypoints }]`, Wegpunkte ab Friedhofsrand bis in den Hauptweg):
  - Ost (nah an erster Biegung): `tiles` = x 12..14, y 2..4 (9 Kacheln); `waypoints: [[12,3],[9,3]]` (mündet in Segment x9 y1..4, 3 Kacheln).
  - West (Ecke links unten): `tiles` = x 0..2, y 12..13 (6 Kacheln); `waypoints: [[2,13],[6,13],[6,11]]` (4 Kacheln am unteren Rand, dann hoch, mündet Mitte Segment y11 x3..10).
- Hindernisse (wenige, 3): `obstacles: [[6,7],[13,11],[18,4]]` (Moorpfütze, Fels, kahler Baum). `flagTiles: [[0,0]]` (Wellenfahne über Eingang, wie Vulkan; Lage im Screenshot prüfen).
- Alle übrigen Kacheln bleiben Bauplätze. Friedhofkacheln sind nicht bebaubar (wie Weg).
- Handy 844x390 quer: ganze Karte sichtbar; Friedhof-Rahmen (Strichlinie, s. Formen) mind. 3 px breit, damit bei ca. 19 px/Kachel erkennbar.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Boden 1..3 (`painted.ground`) | neu `map-graveyard-1..3` | #5a6a52 / #3e4c40 / #263028 |
| Weg groove / edge / earth / mid | neu `map-graveyard-path-groove/-edge/-earth/-mid` | #1c2420 / #4a3a28 / #b0a07e / #c8b890 |
| Weg outline | `ink` | #2b1a10 |
| Weg-Tupfen (`pathDots`) | neu `map-graveyard-path-dot` + `map-graveyard-path-edge` | #e8dcb8 / #4a3a28 |
| Boden-Tupfen (`dots`, dotKind Moos/Pilz) | neu `map-graveyard-dot-1..3` | #8aa68a / #c8d4f0 (=`nm-fog`) / #e6d27a |
| Tanne 4 (`pine`) | neu `map-graveyard-pine-1..4` | #1a2a24 / #22362c / #2e4636 / #5a6a52 |
| Laubbaum kahl (`round`) | `nm-bark-grey-b`, `nm-bark-grey-a`, `map-graveyard-1` | #2a2a40 / #5e5e7c / #5a6a52 |
| Fels | `nm-twin-rock` / `nm-ice-rock-light` | #6a7090 / #b8c8e6 |
| Klippe (`cliff`, 5) | `map-graveyard-1`, `map-graveyard-2`, `nm-crypt-b`, `nm-bark-grey-b`, `ink` | |
| Grabstein hell / dunkel | `nm-grave-a` / `nm-grave-b` | #aab0c8 / #5a5f78 |
| Gruft hell / dunkel | `nm-crypt-a` / `nm-crypt-b` | #8a8ea8 / #4a4c66 |
| Zaun | `nm-iron-dark` | #4a4660 |
| Friedhof-Boden (Kacheln) | neu `map-graveyard-yard` | #2c3a30 |
| Friedhof-Rand (Strich, 6/5 gestrichelt) | neu `map-graveyard-yard-edge` | #4a4038 |
| Laterne Licht / Aufleuchten | neu `map-graveyard-lantern` | #ffd27a |
| Moorpfütze Wasser / Rand | `nm-water-b` / `nm-bank` | #183e50 / #7e8478 |
| Nebel | `nm-fog` | #c8d4f0, α 0,10..0,18 |
| Licht (`light.tint`) | neu `map-graveyard-light` | 200,214,255 (kühles Mondlicht), gradientAlpha 0,06, vignetteAlpha 0 |
| Vignette | entfällt (Regel: Rand ohne Abdunkeln, Übergang mit Bäumen) | |
- neu: `map-graveyard-1` = #5a6a52, `-2` = #3e4c40, `-3` = #263028 (Moorboden Nacht)
- neu: `map-graveyard-path-groove` = #1c2420, `-edge` = #4a3a28, `-earth` = #b0a07e, `-mid` = #c8b890, `-dot` = #e8dcb8
- neu: `map-graveyard-dot-1` = #8aa68a, `-dot-3` = #e6d27a; `map-graveyard-pine-1..4` wie Tabelle
- neu: `map-graveyard-yard` = #2c3a30, `map-graveyard-yard-edge` = #4a4038, `map-graveyard-lantern` = #ffd27a, `map-graveyard-light` = #c8d6ff
- Kontrast: Weg-Mitte #c8b890 (L 0,48) zu Boden-2 #3e4c40 (L 0,064): 5,0:1, Luminanzdifferenz 42 % (Ziel ≥ 25 %, ≥ 1,5:1). Weg-Erde #b0a07e zu Boden-1 #5a6a52 (L 0,13): 2,4:1.

## Formen/SVG
Bezugsbox 1 Kachel = 57 Entwurfs-px, Umrechnung mit TILE/57. Kontur `ink` (#2b1a10). Formen-Stil wie `src/nm-maps/twin.js` (GRAVE0/GRAVE1, CRYPT, FENCE, TREE), Farben aber normal (nicht violett, ohne Runen):
```js
// Grabstein rund, Box 20x26, Fuß unten Mitte (10,26)
new Path2D('M0 26 V10 A10 10 0 0 1 20 10 V26 Z'); // fill nm-grave-a, Schatten-Hälfte rechts nm-grave-b, stroke ink 2
// Gruft, Box 40x40, Fuß (20,40), Tür 16x16 ab (12,24)
new Path2D('M0 40 V14 L20 0 L40 14 V40 Z');       // fill nm-crypt-a->nm-crypt-b (Verlauf oben->unten), stroke ink 3
new Path2D('M12 40 V24 H28 V40 Z');               // Tür: normal #1a1412 (ink-dunkel), beim Aufleuchten map-graveyard-lantern
// Laterne, Box 10x22, Fuß (5,22): Pfahl nm-iron-dark, Kopf
new Path2D('M2 10 H8 V4 L5 1 L2 4 Z');            // fill map-graveyard-lantern, Schein: radial r 18, α 0,22
// Moorpfütze, Ellipse rx 0,4 Kachel, ry 0,22 Kachel: fill nm-water-b, Rand nm-bank 2 px, Glanz nm-fog α 0,4
```
- Friedhof (je Fläche): Boden `map-graveyard-yard` (rx 10 Entwurfs-px), Rand `map-graveyard-yard-edge` 4 px, Strich 6/5. Ost: 4 Grabsteine in den Ecken + Gruft in der Mitte (12..14,2..4 -> Gruft auf [13,3]). West: 4 Grabsteine, Gruft auf [1,13], Tür zeigt zum Nebenweg (Osten).
- Nebenwege: wie Hauptweg, aber Breite 0,75 (Skizze 30/40 px) und Mitte gestrichelt 10/4 (`map-graveyard-path-dot`), damit sie als Nebenweg lesbar sind.
- Deko Streu (`scatterKinds`): grave 0,3, lantern 0,1, puddle 0,15, rockgroup 0,15, stump 0,15, mushroom 0,15; `scatterChance` 0,08; nur auf Nicht-Bauplätzen/Rand wie bestehende Karten.
- Rand: `treeFrame` mit Tannen (`kindShare` [0,5 Tanne, 0,3 kahl, 0,2 Busch]) ohne Abdunkeln; Nebelbänke (2-3 Ellipsen `nm-fog` α 0,12, langsam 6 px/s driftend) nur über Randbäumen und Friedhöfen, nie über Bauplätzen dichter als α 0,1.

## Zustände
- normal: Gruft-Tür dunkel, Laternen glimmen (α 0,8).
- Trupp kommt (Ereignis aus B-210, z. B. `graveyardSpawn` mit Friedhof-Index): 0,8 s Aufleuchten des Friedhofs: Tür `map-graveyard-lantern`, Glow radial r 1,5 Kacheln α 0 -> 0,45 -> 0 (ease-out), Rand-Strich kurz `map-graveyard-lantern`. Zusätzlich 3 Erdklumpen-Partikel je Grabstein (nicht nur Farbe).
- reduced motion: kein Nebel-Drift, Aufleuchten ohne Puls (statisch 0,8 s an, dann aus).
- Handy: gleich, Glow-Radius in Kacheln (skaliert mit).
- Barrierefreiheit: Friedhof erkennbar über Form (Grabsteine, Strichrahmen), nicht nur Farbe.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/config.js` | `MAPS.graveyard` (name 'Nachtfriedhof', waypoints, graveyards, obstacles, flagTiles, theme mit painted/path/paint/decor/light wie `MAPS.twin`) |
| `src/render*.js`, `src/decor.js` | Friedhof-Flächen, Gruft, Grabstein, Laterne, Moorpfütze, Nebel, Aufleuchten |
| `src/fx-system.js` | Aufleuchten + Erdklumpen beim Trupp-Ereignis |
| `docs/design/system/TOKENS.md` | neue `map-graveyard-*` Tokens |
| `index.html` | `#map-select` Option nur, falls nicht aus MAPS erzeugt |

## Tests
- `tests/render.test.js`/`tests/decor.test.js`: Karten-Schleifen über alle MAPS müssen auch `graveyard` zeichnen (unverändert grün).
- Neu `tests/decor.test.js`: keine Deko/Hindernis auf Weg-, Nebenweg- oder Friedhofkacheln von `graveyard`.
- Neu `tests/fx.test.js`: Trupp-Ereignis erzeugt Aufleuchten am richtigen Friedhof, endet nach 0,8 s.

## Messbare Abnahme
- Luminanzdifferenz Weg-Mitte zu Boden-2 ≥ 25 % (Pixelprobe Screenshot 1280x800 an [5,11] gegen [6,6]).
- Beide Friedhöfe auf 1280x800 und 844x390 im Startbild sichtbar, Rahmen ≥ 3 px (Screenshot).
- Bauplätze: 280 Kacheln minus Weg, Nebenwege, Friedhöfe, Hindernisse, flagTiles sind bebaubar (Test).
- `npm test`, `npm run test:e2e` grün, Konsole ohne Fehler.
