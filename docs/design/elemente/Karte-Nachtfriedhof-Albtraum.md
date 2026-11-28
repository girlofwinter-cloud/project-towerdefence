# Karte-Nachtfriedhof-Albtraum (B-216): Albtraum-Optik für `graveyard`, glühende Gruft-Tore, rote Augen im Wald, Glutrisse, violetter Nebel
Fläche: Skizze Albtraum (https://claude.ai/artifact/5VwK9kA9Eze6fY4KAQmjz9#artboard-Albtraum). Backlog: B-216 (nach B-212). Stand: agent/design-friedhof@af89075.

## Maße
- Wege, Friedhöfe, Hindernisse, Bauplätze exakt wie `MAPS.graveyard` (Karte-Nachtfriedhof.md). Die Skizze zeigt Friedhof West noch alt (Mitte links); maßgeblich ist Lage aus Variante B.
- Umsetzung wie `src/nm-maps/twin.js`: Datei `src/nm-maps/graveyard.js`, nur Optik.
- Glutrisse: 6-8 Risse, je 0,6-1,2 Kacheln lang, nur auf Nicht-Bauplätzen (Rand, Friedhof, Hindernis-Nähe), Strich 2 px.
- Rote Augen: 5 Augenpaare im Randwald (Abstand Augen 6 Entwurfs-px, r 2), mind. 0,5 Kachel außerhalb des Felds oder auf Randbaum.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Boden 1..3 | neu `nm-graveyard-1..3` | #3e3446 / #2a2232 / #1a1420 |
| Weg groove / edge / earth / mid / dot | neu `nm-graveyard-path-groove/-edge/-earth/-mid/-dot` | #120c16 / #4a3036 / #9a8a9a / #b8a8b6 / #e6d8e6 |
| Weg outline | `ink` | #2b1a10 |
| Grabstein | `nm-grave-a` / `nm-grave-b` | #aab0c8 / #5a5f78 (mit Rune `nm-rune-violet`/`nm-rune-core`) |
| Gruft | `nm-crypt-a` / `nm-crypt-b` | |
| Gruft-Tor glühend | `night-ember` | #ff5a2a |
| Glutrisse | `night-ember`, Kern `nm-rim-ember` | #ff5a2a / #ffd0a0 |
| Rote Augen | neu `nm-eye-red` | #ff3a3a (Kern `nm-rim-ember`) |
| Nebel | `nm-rune-violet` | #c58aff, α 0,10..0,16 |
| Friedhof-Boden / Rand | neu `nm-graveyard-yard` / `nm-graveyard-yard-edge` | #241c2a / #5a2030 |
| Bäume (verdreht) | `nm-bark-grey-a` / `nm-bark-grey-b` | wie twin TREE |
| Blutpfützen statt Moorpfützen | neu `nm-graveyard-pool` | #2a0f14, α 0,8 |
| Fels | `nm-twin-rock` | #6a7090 |
| Licht | `night-ember` (α 0,35 von unten, wie Albtraum-Grundlage), Vignette 0 | |
- neu: `nm-graveyard-1` = #3e3446, `-2` = #2a2232, `-3` = #1a1420
- neu: `nm-graveyard-path-groove` = #120c16, `-edge` = #4a3036, `-earth` = #9a8a9a, `-mid` = #b8a8b6, `-dot` = #e6d8e6
- neu: `nm-eye-red` = #ff3a3a, `nm-graveyard-yard` = #241c2a, `nm-graveyard-yard-edge` = #5a2030, `nm-graveyard-pool` = #2a0f14
- Abweichung von der Skizze: Weg dort #3a2a26 auf #1e1622 (zu wenig Kontrast). Neu: Weg-Mitte #b8a8b6 (L 0,41) zu Boden-2 #2a2232 (L 0,018): 6,5:1, Differenz 39 % (≥ 25 %).

## Formen/SVG
- Grabstein, Gruft, Zaun, Baum, Fels: aus `src/nm-maps/twin.js` übernehmen (GRAVE0, GRAVE1, CRYPT, FENCE, TREE, ROCK), Friedhofs-Gruft = `GATE`, Torfüllung statt #8a4aff → `night-ember` α 0,55.
```js
// Glutriss, Box 40x12 (Entwurfs-px), Strich night-ember 2 px + Kern nm-rim-ember 1 px, Glow α 0,4
new Path2D('M0 6 L8 4 L13 8 L21 3 L28 7 L34 5 L40 8');
// Augenpaar, Mitte (0,0): zwei Kreise r 2 bei (-3,0) und (3,0), fill nm-eye-red, Schein r 6 α 0,3
```
- Blutpfützen (Skizze): Ellipsen an [6,7] (Hindernis), sonst nur Deko auf Rand.

## Zustände
- normal: Tor glimmt (α 0,55), Augen blinzeln alle 3-6 s (0,15 s zu).
- Trupp kommt: Tor 0,8 s auf α 1, Glow `night-ember` r 1,5 Kacheln α 0 -> 0,5 -> 0, Runen der Grabsteine leuchten `nm-rune-core`; Erdklumpen wie normale Karte.
- reduced motion: kein Blinzeln, kein Nebel-Drift, Aufleuchten statisch.
- Barrierefreiheit: Friedhof über Form erkennbar; Glut nie auf Bauplätzen (keine Verwechslung mit Lava-Schaden).

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/nm-maps/graveyard.js` | neu, analog `twin.js` |
| `src/nm-maps/` Register / Albtraum-Theme-Auswahl | `graveyard` eintragen |
| `src/config.js` | Musik `nightmare.byMap.graveyard` (`file: null` bis Titel da) |
| `docs/design/system/TOKENS.md` | neue `nm-graveyard-*`, `nm-eye-red` |

## Tests
- Bestehende Albtraum-Render-Tests über alle Karten bleiben grün, `graveyard` kommt hinzu.
- Neu `tests/render.test.js`: Albtraum-Theme für `graveyard` vorhanden; Glutrisse/Augen nicht auf Bauplätzen.

## Messbare Abnahme
- Luminanzdifferenz Weg-Mitte zu Boden-2 ≥ 25 % (Pixelprobe 1280x800).
- Screenshots Desktop 1280x800 und Handy 844x390: beide Friedhöfe und Tore erkennbar.
- Wege/Bauplätze identisch zur normalen Karte (Test vergleicht `buildable`).
- `npm test`, `npm run test:e2e` grün.
