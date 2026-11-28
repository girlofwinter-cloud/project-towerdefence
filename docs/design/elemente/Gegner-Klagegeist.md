# Gegner-Klagegeist (G7-Erweiterung): schwebender Klagegeist `wail`, Radius 10, lähmt alle 6 s Türme im Radius 1,5 für 1,5 s
Fläche: Skizze https://claude.ai/artifact/5VwK9kA9Eze6fY4KAQmjz9#artboard-Gegner (keine eigene Bibliotheks-Fläche). Backlog: B-214 (Werte und Lähm-Logik dort). Stand: main@ec59b0b. Skizze, keine Feinarbeit.

## Maße
- SVG-Box 44 × 56 Entwurfs-px = 0,77 × 0,98 Kachel, TILE/57, kein `big` (Goblin 46 × 50: gleich breit, etwas höher; schmaler als Totengräber).
- Fußpunkt (22, 54) = Schatten am Boden; Körper schwebt: Saum endet bei y 49, dazu `lift` 3 ± 3 px (Wippen 1,2 Hz) wie Irrlicht/Fledermaus (`floats`).
- Silhouette: Laken mit gezacktem Saum (5 Zacken), **Arme erhoben** neben dem Kopf (W-Form), offener O-Mund. Abgrenzung Irrlicht (runder Tropfen mit Schweif, ohne Arme) und Nekromantin (Kapuze, Stab).
- Desktop (Kachel 40): ≈ 31 × 39 px. Handy quer (Kachel ≈ 19): ≈ 15 × 19 px; Arme und Mund bleiben je ≥ 3 px.
- Lähm-Ring: Kreis um den Fußpunkt, r = Logik-Radius (1,5 Kacheln = 60 Spiel-px Desktop), **nicht** abgeflacht (gleiche Geometrie wie Turm-Reichweite, damit man sieht, welche Türme drin sind).
- Lähm-Zeichen am Turm: Plakette Kreis r 8 Spiel-px (Handy min. 7 px) über der Turmspitze, Mitte 6 px über der Oberkante der Turm-Box, waagerecht mittig; kollidiert nicht mit der Stufenmarke (rechts unten).

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure` | #2b1a10, 2,5 (Geist dünner) |
| Schatten | `figure-shadow` α 0,25 | rgba(20,30,40,0.25) |
| Laken | neu `enemy-wail-body` α 0,9 | #d6def5 |
| Schatten im Laken, Haarsträhnen | neu `enemy-wail-shade` | #8f9cc8 |
| Augen, Mund | neu `enemy-wail-void` | #1c2030 |
| Lichthof, Ring, Plakette-Zeichen | neu `enemy-wail-glow` | #b8c8ff |
| Ring-Unterlage | `ink` α 0,5 | #2b1a10 |
| Plakette Grund / Rand | `ink` / `cream` | #2b1a10 / #fff3d2 |
| Turm gelähmt (Überzug) | `enemy-wail-shade` α 0,35 | #8f9cc8 |
- neu: `enemy-wail-body` = #d6def5, `enemy-wail-shade` = #8f9cc8, `enemy-wail-void` = #1c2030, `enemy-wail-glow` = #b8c8ff (Klagegeist, B-214; kühler Lavendel, bewusst anders als `enemy-wisp-glow` #9effd9 Mint)
- Kontrast: Laken #d6def5 auf `map-graveyard-2` #3e4c40 ≈ 6,8:1 (gut sichtbar auf dem dunklen Moor).

## Formen/SVG
`src/figures.js`, in `ENEMY_SVG`:
~~~js
  // Klagegeist (B-214): schwebendes Laken, Arme erhoben, O-Mund; Wippen und Lähm-Puls in render-enemies.js/enemy-fx.js
  wail: {
    w: 44, h: 56,
    svg: `<ellipse cx="22" cy="54" rx="9" ry="2.4" fill="rgba(20,30,40,.25)"/><circle cx="22" cy="24" r="20" fill="#b8c8ff" opacity=".2"/><path d="M8 22 Q1 18 3 8 Q9 10 12 17 Z M36 22 Q43 18 41 8 Q35 10 32 17 Z" fill="#d6def5" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 4 Q36 4 37 20 Q38 34 40 46 L35 42 L31 49 L26 43 L22 49 L18 43 L13 49 L9 42 L4 46 Q6 34 7 20 Q8 4 22 4 Z" fill="#d6def5" fill-opacity=".9" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M8 32 Q22 38 36 32 L38 42 L35 42 L31 49 L26 43 L22 49 L18 43 L13 49 L9 42 L6 42 Z" fill="#8f9cc8" opacity=".45"/><path d="M10 10 Q6 22 8 32 M34 10 Q38 22 36 32" fill="none" stroke="#8f9cc8" stroke-width="2.5" stroke-linecap="round"/><path d="M14 17 Q17 13 20 17 Q17 20 14 17 Z M24 17 Q27 13 30 17 Q27 20 24 17 Z" fill="#1c2030"/><path d="M13 14 L19 11 M31 14 L25 11" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/><ellipse data-part="mouth" cx="22" cy="28" rx="4" ry="6" fill="#1c2030"/>`,
  },
~~~
Lähm-Zeichen (Plakette, Mitte 0/0, Spiel-px, `src/render-towers.js` nach dem Turm):
~~~js
const STUN_BADGE = new Path2D('M0 0 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0');      // fill ink, stroke cream 1,5
const STUN_SPIRAL = new Path2D('M0 0 Q2 -2 3 0 Q3 4 -1 4 Q-5 3 -5 -1 Q-4 -6 1 -6 Q6 -5 6 0');  // stroke enemy-wail-glow 2, round
// Restzeit: Bogen r 10, Start -90°, Länge 360° * stun/stunMax, stroke enemy-wail-glow 2,5 auf ink 4,5
~~~
Albtraum: kein `NM_EYES` (Augen sind schon leer); in `nmSvg` wie Irrlicht behandeln: `#d6def5` → `nmMix(#d6def5, E, wispMix)`, `#b8c8ff` → `E`.

## Zustände
| Zustand | Auslöser | Sichtbar |
|---|---|---|
| Schweben | normal | `lift` 3 ± 3 px, 1,2 Hz; Saum-Zacken pendeln skewX ±3° (2 s); kein Geh-Wippen |
| Aufladen | letzte 0,8 s vor dem Puls (Logik-Zähler, z. B. `e.wailT`) | gestrichelter Bodenring r 1,5 Kacheln, `enemy-wail-glow` α 0 → 0,45, Strich 2, dash 6/6; Mund ry 6 → 8; Arme 3 px höher (Vorwarnung, damit man den Puls kommen sieht) |
| Lähm-Puls | Ereignis `wailPulse {x, y, r}` | 3 Schallringe r 0,2 → 1,5 Kacheln, Versatz 0,1 s, je 0,45 s, Strich 4 → 1,5, `enemy-wail-glow` auf ink α 0,5 (+2 px); am Mund 3 kurze Bögen „)))“ 0,3 s; Figur hebt sich 4 px |
| Turm gelähmt | `t.stunned > 0` (1,5 s, Logik B-214) | Plakette mit Spirale über dem Turm, Spirale dreht 1 U/s; Restzeit-Bogen läuft ab; Turm-Sprite mit `enemy-wail-shade` α 0,35 überzogen (`source-atop`), dreht nicht, kein Mündungsfeuer. Ende: Plakette ploppt weg (scale 1 → 1,3, α → 0, 0,15 s) |
| Treffer | Schaden | Standard-Treffer-Blitz, Figur 0,1 s α 0,6 (Geist flackert) |
| Tod | hp 0 | Laken sinkt 8 px und zerfasert: 4 Wölkchen `enemy-wail-body` α 0,6 steigen 12 px, 0,5 s; kein Knochen-/Blut-Effekt |
| verlangsamt / eingefroren | Frost | Standard (`slowed`-Fassung/`ICED`); Lähm-Zähler läuft laut Logik weiter |
| Elite | Elite-Welle | Standard-Elite-Abzeichen, nichts Eigenes |
| Albtraum | Albtraum-Modus | Körper zur Augenfarbe gemischt (wie Irrlicht), Ring und Plakette-Zeichen in `NM_ENEMY_STYLE[..].eye` statt `enemy-wail-glow` |
| Handy | Kachel ≈ 19 | Ringe Strich min. 2 px, Plakette r 7 px, Spirale Strich 1,5 |
| reduced motion | Einstellung | kein Wippen, kein Pendeln; Puls als **ein** Ring, der 0,45 s bei r 1,5 steht und ausblendet; Spirale dreht nicht, Restzeit-Bogen bleibt |
Barrierefreiheit: Lähmung über Plakette + Spirale + Restzeit-Bogen (Form), nicht nur über Farbe/Überzug; Vorwarnung über Strichring.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/figures.js` | `ENEMY_SVG.wail`; `nmSvg` Sonderfall wie `wisp` |
| `src/render-enemies.js` | `wail` zu `floats`; Schweben, Saum, Mund (`data-part="mouth"`), Aufladen-Ring |
| `src/render-towers.js` / `src/tower-fx.js` | gelähmter Turm: Überzug, Plakette, Restzeit-Bogen, kein Drehen/Mündungsfeuer |
| `src/enemy-fx.js` / `src/render-fx.js` | Effekt-Typ `wailPulse` (3 Ringe, Mundbögen), Tod-Wölkchen |
| `src/config.js` | `ENEMY_STYLE.wail` (hover 3, hoverHz 1.2, chargeTime 0.8, rings 3, ringGap 0.1, ringLife 0.45, ringWidth [4, 1.5], badgeR 8, badgeLift 6, spinHz 1, tint 0.35, glow '#b8c8ff'); keine Spielwerte |
| `docs/design/system/TOKENS.md` | neue Tokens oben |

## Tests
- `tests/fx.test.js` „Stil 1 Gegner: Größe …“: `ALL_ENEMIES` um `wail` ergänzen; bleibt grün.
- Neu `tests/fx.test.js`: `wail` zählt zu den Schwebern (kein Geh-Wippen); SVG enthält `#d6def5` und nicht `#c9fff0` (anders als Irrlicht); Effekt `wailPulse` erzeugt 3 Ringe; reduced motion: 1 Ring.
- Neu `tests/render.test.js`: Turm mit `stunned > 0` zeichnet die Plakette (Zeichenaufruf mit `STUN_SPIRAL`), mit `stunned = 0` nicht; Restzeit-Bogen proportional.

## Messbare Abnahme
- Screenshot `graveyard` Welle 9 bei 1280x800 und 844x390 im Moment des Pulses: Ring sichtbar, jeder Turm im Radius trägt die Plakette, Türme außerhalb nicht.
- Klagegeist und Irrlicht in Graustufen unterscheidbar (Arme + gezackter Saum vs. Tropfen mit Schweif).
- Plakette bei 390x844 und 844x390 mind. 14 px Durchmesser (`getBoundingClientRect` des Canvas × Skalierung).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
