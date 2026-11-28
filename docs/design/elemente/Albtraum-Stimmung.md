# Albtraum-Stimmung (B-184, auch Nacht-Look B-185): Nacht-Tönung, rötliches Licht, Vignette und Glut am Weg, nur auf dem Spielfeld
Fläche: [Albtraum-Skizzen #Stimmung](https://claude.ai/artifact/1AQYMEJUnDuR5VUhpkaWbG#artboard-Stimmung) (Regler „nacht“ 0,75). Backlog: B-184; derselbe Look ist die Belohnung „Nacht-Look“ (B-185). Stand: agent/albtraum@f8d5826. Skizze, keine Feinarbeit.

## Maße
- Wirkt nur im Feldrechteck 0..WIDTH × 0..HEIGHT (20 × 14 Kacheln, Kachel 40 Spiel-px). Gemalter Rand, Holzleiste, HUD, Knöpfe, Panels bleiben unverändert hell (Clip auf das Feld).
- Gesamtstärke k = 0,75 (fest in `config.js`, `NIGHT_STYLE.strength`); alle Deckkräfte unten sind schon mit k multipliziert.
- Schichten (Reihenfolge, alle im Hintergrund-Cache nach `drawLight`, also unter Türmen, Gegnern und Effekten):
  1. Tönung: Rechteck über das Feld, `night-tint` mit α 0,47, Mischmodus `multiply`.
  2. Rotes Licht: radial, Mitte (0,7 W, 1,0 H), Radius 0,6 × Felddiagonale, `night-ember` α 0,26 → 0.
  3. Vignette: radial, Mitte Feldmitte, innen 45 % des Radius durchsichtig → außen `night-vignette` α 0,64 (Radius = halbe Diagonale).
- Glut am Weg (pro Frame, außerhalb des Caches): 10 Punkte je Karte, gleichmäßig über die Weglänge verteilt, je 0,6 Kacheln seitlich der Wegmitte (abwechselnd links/rechts); Kern r 3, Hof r 7 Spiel-px; deterministisch aus Karten-Seed.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Tönung | `night-tint` | rgba(20,12,40,0.62) |
| Rotes Licht | `night-ember` | #ff5a2a |
| Vignette | `night-vignette` | rgba(8,4,16,0.85) |
| Glut Kern / Hof | `lava-hot` / `lava` α 0,5 | #ffe58a / #ff7a1f |
| Seitenhintergrund im Albtraum (außerhalb Bühne, optional) | `night-b` | #0e0b1a |

## Formen/SVG
Canvas, Regeln aus `render-light.js` beibehalten (Gradienten nur im Cache, kein `shadowBlur`, Farben als rgba):
~~~js
// Hintergrund-Cache, nach drawLight(); N = NIGHT_STYLE
ctx.save(); ctx.beginPath(); ctx.rect(0, 0, WIDTH, HEIGHT); ctx.clip();
ctx.globalCompositeOperation = 'multiply';
ctx.fillStyle = 'rgba(20,12,40,0.47)'; ctx.fillRect(0, 0, WIDTH, HEIGHT);          // night-tint × k
ctx.globalCompositeOperation = 'source-over';
const d = Math.hypot(WIDTH, HEIGHT);
const red = ctx.createRadialGradient(0.7 * WIDTH, HEIGHT, 0, 0.7 * WIDTH, HEIGHT, 0.6 * d);
red.addColorStop(0, 'rgba(255,90,42,0.26)'); red.addColorStop(1, 'rgba(255,90,42,0)'); // night-ember
ctx.fillStyle = red; ctx.fillRect(0, 0, WIDTH, HEIGHT);
const r = d / 2, vig = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 0.45 * r, WIDTH / 2, HEIGHT / 2, r);
vig.addColorStop(0, 'rgba(8,4,16,0)'); vig.addColorStop(1, 'rgba(8,4,16,0.64)');        // night-vignette × k
ctx.fillStyle = vig; ctx.fillRect(0, 0, WIDTH, HEIGHT);
ctx.restore();
~~~
Glut pro Frame: Phase p = (t / 1,8 s + i × 0,2) mod 1, s = 0,5 − 0,5·cos(2πp); Hof `lava` α 0,2 + 0,3·s, r 7·(0,8 + 0,5·s); Kern `lava-hot` α 0,4 + 0,6·s, r 3.

## Zustände
- Normal: nichts davon.
- Albtraum (`state.mode === 'nightmare'`): alle Schichten + Glut.
- Nacht-Look (Kosmetik B-185, Normalmodus, Schalter an): identisch zum Albtraum, ohne Gold-Anzeige im HUD.
- reduced motion: Glut statisch (s = 0,5), Schichten unverändert.
- Lesbarkeit: Türme, Gegner, Lebensbalken, Reichweitenkreis, Effekte liegen über der Tönung und bleiben ungetönt. Information nicht über Farbe.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/render-light.js` | `drawNight(ctx, N)` (Schichten 1–3), `drawEmbers(ctx, pts, t, N)` |
| `src/render.js` | Aufruf im Hintergrund-Cache nach `drawLight`, wenn Albtraum oder Nacht-Look aktiv; Cache neu bauen bei Moduswechsel |
| `src/config.js` | `NIGHT_STYLE` (strength, Farben, Radien, Takt, Glutzahl) |

## Tests
- Neu `tests/render.test.js`: im Albtraum wird `multiply` mit `rgba(20,12,40,…)` gezeichnet, im Normalmodus ohne Nacht-Look nicht; Clip-Rechteck = 0, 0, WIDTH, HEIGHT; Spielfeld bleibt 20 × 14.
- Bestehende Render-Tests unverändert grün.

## Messbare Abnahme
- 1280x800 Albtraum: mittlere Helligkeit des Felds ≤ 60 % der Normal-Helligkeit; Pixel der Holzleiste/HUD identisch zum Normalmodus (Screenshot-Vergleich, Ausschnitt).
- Handy quer 844x390: Gegner und Türme im Screenshot erkennbar, HUD unverändert.
- Bildrate im Albtraum mit Welle 15 nicht messbar schlechter als normal (Glut ≤ 10 Kreise je Frame).
- `npm test` und `npm run test:e2e` grün.
