# Gegner-Panzerkaefer (G7-Erweiterung): Käfer `beetle`, Radius 12, Schale mit 5 Schichten, die sichtbar zerbricht.
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Gegner-Panzerkaefer. Backlog: B-169 (Logik läuft parallel). Stand: main@3908fdd. Skizze, keine Feinarbeit.

## Maße
- SVG-Box 56 × 48 Entwurfs-px = 0,98 × 0,84 Kachel, TILE/57, kein `big`. Breiter als hoch: flache Kuppel auf sechs Beinen.
- Fußpunkt unten mittig (28, 48). Kopf vorn unten (y 32–44) mit Zangen, Schale y 8–37.
- Ohne Schale (0 Schichten) schrumpft die Kuppel auf y 14–37, Breite 34 → Silhouette wird sichtbar kleiner.
- Handy (Kachel ≈ 28): ≈ 27 × 24 px; Kuppel + Beinchen seitlich = keine andere Figur so breit und flach.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure` / `stroke-figure-line` | #2b1a10, 3 / 2 |
| Augen | `gold-light` | #ffe27a |
| Schatten | `figure-shadow` (neu) | rgba(20,30,40,0.4) |
| Splitter-Blitz | wie `FX_STYLE.hit.flash` | #fff3c9 |
- neu: `enemy-beetle-shell` = #b0703a, Schale (Kupfer)
- neu: `enemy-beetle-ridge` = #7a4a24, Schichtkanten, Loch
- neu: `enemy-beetle-shine` = #e8b27a, Glanzkante
- neu: `enemy-beetle-head` = #3a2a3a, Kopf
- neu: `enemy-beetle-soft` = #e9a98c, ungeschützter Leib (0 Schichten), Rillen `enemy-beetle-soft-line` = #b8705a

## Formen/SVG
`src/figures.js`. Teile als Konstanten, Zustände als eigene Karte `BEETLE_SHELL` (Schlüssel = Anzeige-Stufe), damit `ENEMY_KINDS` nur `beetle` enthält:
```js
const BEETLE_BASE = `<ellipse cx="28" cy="45" rx="22" ry="4" fill="rgba(20,30,40,.4)"/><path d="M14 30 L5 36 L4 42 M16 34 L10 42 M20 36 L17 44 M42 30 L51 36 L52 42 M40 34 L46 42 M36 36 L39 44" fill="none" stroke="#2b1a10" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
const BEETLE_HEAD = `<path d="M20 36 Q28 30 36 36 Q34 44 28 44 Q22 44 20 36 Z" fill="#3a2a3a" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="24.5" cy="38" r="1.6" fill="#ffe27a"/><circle cx="31.5" cy="38" r="1.6" fill="#ffe27a"/><path d="M23 43 L20 47 M33 43 L36 47" stroke="#2b1a10" stroke-width="2.5" stroke-linecap="round"/>`;
const BEETLE_SHELL_SVG = `<path d="M6 34 Q4 10 28 8 Q52 10 50 34 Q28 40 6 34 Z" fill="#b0703a" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M10 28 Q28 20 46 28 M13 21 Q28 13 43 21 M18 15 Q28 9 38 15" fill="none" stroke="#7a4a24" stroke-width="2.5" stroke-linecap="round"/><path d="M28 9 V37" stroke="#2b1a10" stroke-width="2"/><path d="M13 19 Q18 13 24 11" fill="none" stroke="#e8b27a" stroke-width="3" stroke-linecap="round"/>`;
const CRACK_1 = `<path d="M20 14 L23 20 L19 25 M38 20 L35 26 L39 31" fill="none" stroke="#2b1a10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const CRACK_2 = `<path d="M28 9 L25 16 L30 22 L26 30 M10 26 L16 27 L14 32 M44 14 L40 17 L45 22" fill="none" stroke="#2b1a10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 11 Q46 13 48 20 L42 19 L41 14 Z" fill="#7a4a24" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/>`;
const BEETLE_SOFT = `<path d="M11 34 Q10 16 28 14 Q46 16 45 34 Q28 39 11 34 Z" fill="#e9a98c" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 28 Q28 23 42 28 M15 22 Q28 17 41 22" fill="none" stroke="#b8705a" stroke-width="2" stroke-linecap="round"/>`;

// in ENEMY_SVG: Panzerkäfer mit voller Schale
  beetle: { w: 56, h: 48, svg: BEETLE_BASE + BEETLE_SHELL_SVG + BEETLE_HEAD },
// Anzeige nach verbleibenden Schichten (Logik: e.shells 0..5)
const BEETLE_SHELL = {
  5: 'beetle',                                                          // 5 und 4: heil
  3: { w: 56, h: 48, svg: BEETLE_BASE + BEETLE_SHELL_SVG + CRACK_1 + BEETLE_HEAD },          // 3 und 2
  1: { w: 56, h: 48, svg: BEETLE_BASE + BEETLE_SHELL_SVG + CRACK_1 + CRACK_2 + BEETLE_HEAD }, // 1
  0: { w: 56, h: 48, svg: BEETLE_BASE + BEETLE_SOFT + BEETLE_HEAD },                         // 0
};
const shellStage = (n) => (n >= 4 ? 5 : n >= 2 ? 3 : n);
```
Sprite-Schlüssel: `enemy:beetle:<stage>:<frozen>:<dpr>`.

Splitter (Effekt, `src/config.js` → `ENEMY_STYLE.beetle`, gezeichnet in `src/enemy-fx.js` über den FX-Pool):
```js
beetle: {
  shards: 7, shardColors: ['#b0703a', '#7a4a24', '#e8b27a'], shardSize: [4, 7], // Dreiecke, Entwurfs-px
  shardSpeed: [60, 110], shardAngle: [-160, -20], gravity: 260, spin: 8, life: 0.55, fadeFrom: 0.6,
  shardInk: '#2b1a10', shardLine: 1.5, originDy: -22,    // Start in Schalenmitte über dem Fußpunkt
  flash: '#fff3c9', flashR: [10, 26], flashLife: 0.2,   // Ring beim Fall der letzten Schicht
  chip: 2,                                              // bei jeder anderen Schicht nur 2 Splitter, kein Ring
},
```

## Zustände
| Zustand | Auslöser | Sichtbar |
|---|---|---|
| 5 (und 4) | volle Schale | Kupferkuppel, 3 Schichtkanten + Rand, Glanz |
| 3 (und 2) | Schichten verloren | 2 Risse |
| 1 | letzte Schicht | 5 Risse, abgesplittertes Loch rechts oben |
| 0 | Schale weg | kleinere rosa Kuppel mit Rillen, Silhouette 14 px schmaler/6 px flacher |
| Schicht fällt | e.shells sinkt | 2 Splitter (chip); bei 1 → 0: 7 Splitter + Ring |
| beschädigt | hp | Standard-Lebensbalken |
| eingefroren | Frost | Standard-Eisüberzug `withIce` über der jeweiligen Stufe |
| Handy | Kachel 28 | Risse bei 2 px Strich ≈ 1 px; Stufe 0 bleibt über die kleinere Kuppel erkennbar |
| reduced motion | Einstellung | Splitter fliegen nicht, verblassen 0,3 s am Ort; Ring ohne Wachsen |
Stufe nicht nur über Farbe: Risse (Form) und Kuppelgröße.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/figures.js` | Konstanten oben, `ENEMY_SVG.beetle`, `BEETLE_SHELL`, Zugriff `enemyFigure('beetle', frozen, stage)` |
| `src/render-enemies.js` | Stufe aus `e.shells` wählen, Sprite-Schlüssel |
| `src/enemy-fx.js` | Splitter und Ring |
| `src/config.js` | `ENEMY_STYLE.beetle` |

## Tests
- `tests/fx.test.js` „Stil 1 Gegner: Größe …“: grün; `ALL_ENEMIES` um `beetle` ergänzen.
- Neu `tests/fx.test.js`: Stufe 0 ist schmaler als Stufe 5 (Kontur-Box ≥ 10 Entwurfs-px); `shellStage` 5,4→5; 3,2→3; 1→1; 0→0; Splitter 1→0 legt `shards` Partikel an, 3→2 nur `chip`.

## Messbare Abnahme
- Zeichenfläche und Screenshot: Stufen 5/3/1/0 nebeneinander bei Kachel 28 px in Graustufen unterscheidbar.
- Beim Fall der letzten Schicht sind 7 Splitter für ≤ 0,55 s sichtbar (Screenshot-Folge oder Test).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
