# Gegner-Glutling (G7-Erweiterung): Feuergeist `ember`, Radius 10, Frost wirkt nicht (Dampf statt Eis).
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Gegner-Glutling. Backlog: B-170 (Logik läuft parallel). Stand: main@3908fdd. Skizze, keine Feinarbeit.

## Maße
- SVG-Box 42 × 52 Entwurfs-px = 0,74 × 0,91 Kachel, TILE/57, kein `big`.
- Fußpunkt unten mittig (21, 52). Flamme y 2–46 mit Spitze oben und zwei Seitenzungen, zwei Glutbrocken am Fuß; Bodenglühen statt dunklem Schatten.
- Handy (Kachel ≈ 28): ≈ 21 × 26 px. Spitze oben + Zungen (Gegenstück zum Irrlicht: Irrlicht rund oben, Schweif unten).

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure` | #2b1a10, 3 |
| Flamme außen | `lava` | #ff7a1f |
| Flamme innen | `lava-core` | #ffc23a |
| Kern, Funken | `lava-hot` | #ffe58a |
| Augen | `lava-crust` | #2a1a17 |
| Glutbrocken | `lava-plate` | #4a2a22 |
| Schatten | `figure-shadow` (neu) Alpha 0,35 | rgba(20,30,40,0.35) |
- neu: `steam` = #f4f1ea, Dampfwölkchen bei Frost-Treffer (Alpha 0,75)

## Formen/SVG
`src/figures.js`, in `ENEMY_SVG`:
```js
  // Glutling: Flamme mit Gesicht, Bodenglühen; Funken und Dampf in render-enemies.js/enemy-fx.js
  ember: {
    w: 42, h: 52,
    svg: `<ellipse cx="21" cy="49" rx="14" ry="3.6" fill="#ff7a1f" opacity=".35"/><ellipse cx="21" cy="49" rx="8" ry="2" fill="rgba(20,30,40,.35)"/><path d="M21 2 Q25 12 31 14 Q30 8 34 6 Q40 20 37 32 Q34 46 21 46 Q8 46 5 32 Q3 22 10 14 Q12 20 15 20 Q14 10 21 2 Z" fill="#ff7a1f" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M21 16 Q27 24 29 31 Q30 41 21 42 Q12 41 13 31 Q15 24 21 16 Z" fill="#ffc23a"/><ellipse cx="21" cy="37" rx="5" ry="4" fill="#ffe58a"/><ellipse cx="16.5" cy="30" rx="2.4" ry="3" fill="#2a1a17"/><ellipse cx="25.5" cy="30" rx="2.4" ry="3" fill="#2a1a17"/><circle cx="17" cy="29" r="0.9" fill="#ffe58a"/><circle cx="26" cy="29" r="0.9" fill="#ffe58a"/><path d="M13 25 L19 27 M29 25 L23 27" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/><path d="M12 47 L15 42 L18 47 Z M24 47 L27 43 L30 47 Z" fill="#4a2a22" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/>`,
  },
```
Canvas (`src/config.js` → `ENEMY_STYLE.ember`):
```js
ember: {
  flameHz: 6, flameStretch: 0.05,          // scaleY 1 ↔ 1,05 um den Fußpunkt (Lodern), ersetzt sway
  sparkRate: 3, sparkColor: '#ffe58a', sparkSize: [1.5, 2.5], sparkRise: 22, sparkDrift: 6, sparkLife: 0.7, // aus der Spitze, Spiel-px
  // Frost-Treffer: Dampf statt Eis (kein withIce, kein Eis-Partikel aus FX_STYLE.hit)
  steam: '#f4f1ea', steamAlpha: 0.75, steamPuffs: [[-8, -26], [0, -32], [8, -24]], // Versatz zum Fußpunkt, Entwurfs-px
  steamR: [3, 8], steamRise: 16, steamLife: 0.5, steamInk: 'rgba(43,26,16,0.5)', steamLine: 1.5,
  hissDim: 0.7, hissTime: 0.15,            // Figur kurz auf Alpha 0,7 (erlischt fast), dann zurück
},
```
Funken zählen in den FX-Pool (256); bei mehr als 8 Glutlingen gleichzeitig `sparkRate` halbieren (Pool schonen).

## Zustände
| Zustand | Auslöser | Sichtbar |
|---|---|---|
| normal | läuft/schwebt | Lodern (scaleY), 3 Funken/s steigen auf |
| Frost-Treffer | Frostgeschoss/-fähigkeit | 3 Dampfwölkchen steigen 16 px in 0,5 s, Figur 0,15 s auf Alpha 0,7; **kein** Eisüberzug, keine Verlangsamungs-Optik |
| eingefroren | entfällt: Frost wirkt nicht (Logik) |
| beschädigt | hp | Standard-Lebensbalken |
| Handy | Kachel 28 | Funken min. 1,5 px; Dampfwölkchen r ≥ 3 px |
| reduced motion | Einstellung | kein Lodern, keine Funken; Dampf erscheint 0,5 s am Ort ohne Steigen |
„Frost wirkt nicht“ ist über Form (Wölkchen statt Kristall) sichtbar, nicht nur Farbe.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/figures.js` | `ENEMY_SVG.ember` |
| `src/render-enemies.js` | Lodern statt Geh-Wippen; `slowed`-Fassung für `ember` nie wählen |
| `src/enemy-fx.js` / `src/fx-system.js` | Funken, Dampf |
| `src/config.js` | `ENEMY_STYLE.ember` |

## Tests
- `tests/fx.test.js` „Stil 1 Gegner: Größe …“: grün; `ALL_ENEMIES` um `ember` ergänzen.
- Neu `tests/fx.test.js`: Frost-Treffer auf `ember` erzeugt `steamPuffs.length` Dampf-Partikel und 0 Eis-Partikel; `drawEnemy` nutzt für `ember` nie den Sprite-Schlüssel mit `:1` (eingefroren).

## Messbare Abnahme
- Screenshot bei 1280x800: Frostturm trifft Glutling, Dampfwölkchen sichtbar, kein Eiskristall.
- Glutling und Irrlicht bei 844x390 in Graustufen unterscheidbar (Spitze oben vs. rund oben).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
