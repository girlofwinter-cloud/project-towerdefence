# Karte-Zangenangriff-Albtraum (B-197): Zangenangriff im Albtraum: verbrannte Steppe (Stil B) mit dürrem Gras, verkohlten Bäumen, glimmenden Heuhaufen, ohne Lava
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Karte-Zangenangriff. Backlog: B-197, Grundlage B-194 (`Karte-Albtraum-Grundlage.md`). Stand: agent/albtraum-design@b13c4d4.

## Maße
- Umrechnung wie in der Grundlage: Fläche-px → Entwurfs-px `(x − 160) · 1,1875`, `(y − 64) · 1,1875`; Fläche-px → Canvas-Spiel-px `(x − 160) · 0,8333 + 50`. Formen unten in **Fläche-px**, Fußpunkt `foot`; im gemalten SVG mit `scale(1.1875 · s)` setzen (s = Maßstab aus der Tabelle).
- Weg, Wasser/Lava, Hindernisse, Fahnen- und Bauplatz-Kacheln: unverändert aus `MAPS.fork` (Wegpunkte oben [-1,2] [5,2] [5,5] [10,5] [10,7] [15,7] [15,2] [18,2] [18,12] [20,12]; unten [-1,12] [3,12] [3,9] [10,9] [10,7] …). Keine Deko auf einer Feldkachel; Überhang höchstens `maxOverhang` 0,3 Kacheln.
- Glimmende Bodenrisse **nur im Rand** (4 Stück, Fläche-px → Spiel-px): (14,372)…(54,478) → (−72,307)…(−38,395); (1236,110)…(1240,190) → (947,88)…(950,155); (1150,420)…(1196,490) → (875,347)…(913,405); (30,690)…(70,746) → (−58,572)…(−25,618). Polylinien siehe Formen.
- Risse im Weg: je Weg alle ~3,5 Kacheln ein kurzer Zickzack (Formel wie `pathCracks`: 4 Punkte, ±13 Fläche-px längs, ±4 quer), jeder dritte glüht.
- Rand-Glutflecken: weiche Ellipsen #ff5a2a α .14 bei Fläche (1210,560) und (70,300).
- Feld-Tupfen: verbrannte Halme (3 Striche, 11 px) in #4a2e18 und #d8b070, jeder siebte ein Glutpunkt.

## Tokens
Vollständiger Palettensatz für `MAPS.fork.nightmare.painted` (gleiche Schlüssel wie `PAINTED_PALETTE`):

| Teil | Token | Wert |
|---|---|---|
| Boden 1 | `nm-fork-1` | #b48e56 |
| Boden 2 | `nm-fork-2` | #86603a |
| Boden 3 | `nm-fork-3` | #664630 |
| Flecken dunkel (α .6) | `nm-fork-mottle` | [0.28, 0.16, 0.07] |
| Flecken hell (α .3) | `nm-fork-lit` | [1.00, 0.74, 0.38] |
| Licht oben links | `nm-steppe-sun` | #ffd890 α .32 → #ffb060 α 0 |
| Glut unten rechts | `night-ember` | #ff6a2a α .30 |
| Weg groove | `nm-fork-path-groove` | #3a2414 |
| Weg Kontur | `ink` | #2b1a10 |
| Weg edge | `nm-fork-path-edge` | #5a3a26 |
| Weg earth | `nm-fork-path-earth` | #c9a682 |
| Weg mid | `nm-fork-path-mid` | #e0c49e |
| Wegpunkte | `nm-fork-path-dot` | #fff0d0 / #5a3a26 |
| Tupfen (dotKind `tuft`) | `nm-dry-grass / -light` | #4a2e18 / #d8b070 (+ Glut `lava`) |
| Tanne | `–` | entfällt |
| Baum (kahl, verkohlt) | `nm-char-a → -b` | #4a3430 → #1a1210, Äste #2e201c |
| Glutrisse | `lava / lava-core / lava-hot` | #ff7a1f / #ffc23a / #ffe58a |
| Heu | `nm-hay / -light` | #6a4a26 / #a07a40 |
| Asche | `nm-ash-steppe / -light` | #6a5040 / #a08870 |
| Fels | `nm-fork-rock / -light` | #6a5446 / #9a826e |
| Klippe | `–` | entfällt |
| Burg | `unverändert` | #e3d2b0, #b9a283, #8a7560 |
| Vignette | `–` | entfällt |
| Gegner-Randlicht | `nm-rim-ember` | #ffd0a0 |
| Augen | `nm-eye-ember` | #ffb02a |
| HUD-Holz | `nm-wood-rust-a / -b` | #7a4a22 / #3a1e0c |
- neu: `nm-fork-1` = #b48e56, `nm-fork-2` = #86603a, `nm-fork-3` = #664630, Boden verbrannte Steppe
- neu: `nm-fork-path-groove` = #3a2414, `-edge` = #5a3a26, `-earth` = #c9a682, `-mid` = #e0c49e, `-dot` = #fff0d0
- neu: `nm-steppe-sun` = #ffd890, `nm-dry-grass` = #4a2e18, `nm-dry-grass-light` = #d8b070
- neu: `nm-char-a` = #4a3430, `nm-char-b` = #1a1210, `nm-hay` = #6a4a26, `nm-hay-light` = #a07a40, `nm-ash-steppe` = #6a5040, `nm-ash-steppe-light` = #a08870, `nm-fork-rock` = #6a5446, `nm-fork-rock-light` = #9a826e
- neu: `nm-rim-ember` = #ffd0a0, `nm-eye-ember` = #ffb02a (auch Vulkan)
- neu: `nm-wood-rust-a` = #7a4a22, `nm-wood-rust-b` = #3a1e0c
- Kontrast (gemessen, WCAG-Formel): Wegmitte `nm-fork-path-mid` zu `nm-fork-2` = 3,35:1, Wegfläche `-earth` zu `-2` = 2,47:1 (Pflicht ≥ 1,5:1). HUD-Schrift `cream` auf `nm-wood-rust-a` = 6,71:1.
- Kartenkarte im Startbildschirm: Vorschaubild = Albtraum-Raster dieser Karte (Bauvorlage `Albtraum-Kartenauswahl.md`), Name „Zangenangriff“. Musik: `MUSIC.nightmare.fork` (vorhanden, unverändert).

## Formen/SVG
Formen für `NM_SHAPES` in `render-painted.js` (Fläche-px, statische Fassung; Animationen laufen in der Bewegungsschicht, nicht im Raster). Verläufe als `<defs>` im SVG mit Präfix `nm-`:
```js
<linearGradient id="nm-char" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a3430"/><stop offset="1" stop-color="#1a1210"/></linearGradient>
```
```js
// Verkohlter Baum mit Glutadern (glow) – Rauch nur in der Bewegungsschicht
charTree: { w: 100, h: 170, foot: [50, 170], svg: (c) => `<ellipse cx="54" cy="166" rx="44" ry="8" fill="rgba(10,4,2,.45)"/><ellipse cx="54" cy="164" rx="40" ry="10" fill="#ff5a2a" opacity=".2"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2b1a10" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2e201c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2e201c" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 168 C40 140 36 110 40 88 L32 72 L44 76 L42 56 L52 68 L56 46 L60 70 L70 60 L66 86 C70 110 66 140 74 168 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M44 160 C46 140 44 118 46 100" stroke="#5a4440" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><path d="M52 162 L56 144 L50 128 L56 112 L52 98 M62 152 L60 136 L65 122" stroke="#ff7a1f" stroke-width="4.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M52 162 L56 144 L50 128 L56 112 L52 98 M62 152 L60 136 L65 122" stroke="#ffe58a" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="44" cy="58" r="2.6" fill="#ff7a1f"/><circle cx="56" cy="48" r="2.6" fill="#ffc23a"/><circle cx="70" cy="62" r="2.4" fill="#ff7a1f"/><circle cx="56" cy="40" r="8" fill="#5a504c" stroke="#2b1a10" stroke-width="2"/><circle cx="52" cy="40" r="6" fill="#6e6460"/>` },
// Verkohlter Baum ohne Glut (auch Hindernisse)
charTreeCold: { w: 100, h: 170, foot: [50, 170], svg: (c) => `<ellipse cx="54" cy="166" rx="44" ry="8" fill="rgba(10,4,2,.45)"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2b1a10" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2e201c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2e201c" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 168 C40 140 36 110 40 88 L32 72 L44 76 L42 56 L52 68 L56 46 L60 70 L70 60 L66 86 C70 110 66 140 74 168 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M44 160 C46 140 44 118 46 100" stroke="#5a4440" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>` },
// Verbrannter Heuhaufen mit Glutkamm
hay: { w: 80, h: 60, foot: [40, 60], svg: (c) => `<ellipse cx="40" cy="56" rx="38" ry="5" fill="rgba(10,4,2,.4)"/><path d="M4 56 Q2 30 20 18 Q40 4 60 18 Q78 30 76 56 Z" fill="#6a4a26" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 40 Q24 30 36 34 M44 24 Q56 22 64 30 M20 52 Q30 46 42 50 M50 46 Q60 42 70 48" stroke="#a07a40" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M20 18 Q40 4 60 18 Q50 26 40 22 Q30 26 20 18 Z" fill="#2e201c" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 20 L36 14 L40 20 L46 13 L52 19" stroke="#ff7a1f" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="8" r="7" fill="#6e6460"/>` },
// Verkohlter Zaun
fence: { w: 90, h: 50, foot: [45, 50], svg: (c) => `<ellipse cx="44" cy="48" rx="42" ry="4" fill="rgba(10,4,2,.4)"/><path d="M8 48 V14 L12 10 L16 16 V48 Z M40 48 V20 L44 12 L48 22 V48 Z M72 48 V10 L76 16 L80 12 V48 Z" fill="#3a2a24" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M4 26 H60 L56 32 H4 Z" fill="#2e201c" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M56 32 L52 38" stroke="#ff7a1f" stroke-width="2" stroke-linecap="round"/>` },
// Dürres Grasbüschel mit Glutspitzen
dryGrass: { w: 44, h: 32, foot: [22, 32], svg: (c) => `<ellipse cx="22" cy="30" rx="20" ry="3.5" fill="rgba(10,4,2,.35)"/><path d="M22 30 Q18 18 8 8 M22 30 Q22 16 20 2 M22 30 Q26 18 36 8 M22 30 Q14 24 2 22 M22 30 Q30 24 42 22" fill="none" stroke="#2b1a10" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 30 Q18 18 8 8 M22 30 Q22 16 20 2 M22 30 Q26 18 36 8 M22 30 Q14 24 2 22 M22 30 Q30 24 42 22" fill="none" stroke="#4a2e18" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 30 Q22 16 20 2 M22 30 Q26 18 36 8" stroke="#c08a4a" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="20" cy="3" r="2.2" fill="#ff7a1f"/><circle cx="36" cy="8" r="1.8" fill="#ffc23a"/>` },
// Glimmender Stumpf
stump: { w: 60, h: 50, foot: [30, 50], svg: (c) => `<ellipse cx="30" cy="48" rx="24" ry="5" fill="rgba(10,4,2,.45)"/><path d="M8 48 L12 22 L18 26 L22 14 L30 22 L36 12 L42 24 L48 20 L52 48 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M30 46 L28 34 L32 26" stroke="#ff7a1f" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 46 L28 34 L32 26" stroke="#ffe58a" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
// Aschehaufen
ashPile: { w: 70, h: 30, foot: [35, 30], svg: (c) => `<ellipse cx="35" cy="28" rx="34" ry="4" fill="rgba(10,4,2,.4)"/><path d="M2 28 Q14 8 34 10 Q56 8 68 28 Z" fill="#6a5040" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 18 Q24 12 34 14 M44 13 Q52 12 58 18" stroke="#a08870" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="24" cy="22" r="2.5" fill="#ff7a1f"/><circle cx="40" cy="20" r="2" fill="#ffc23a"/><circle cx="52" cy="24" r="2.2" fill="#ff7a1f"/>` },
// Fels (auch Hindernis 11,2, mit Glutriss)
rock: { w: 36, h: 26, foot: [18, 26], svg: (c) => `<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(6,4,14,.4)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#6a5446" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#9a826e"/>` },
```

Glutriss (Rand und Weg), drei Lagen auf einer Polylinie:
```js
// pts in Spiel-px; Lagen: ink 7 → lava 7 weich (σ 4, α .8) → lava-core 2,6
ctx.lineJoin = 'round'; [['#2b1a10', 7], ['#ff7a1f', 7, 0.8], ['#ffc23a', 2.6]]
```

**Rand-Deko je Reihe** (`MAPS.fork.nightmare.frame`, Auswahl gleich verteilt, deterministisch aus `mapId`):
- big (Reihe 2–4): `charTree` (jeder zweite mit Glut), `charTreeCold` (s 0,9–1,25).
- mid: `hay`, `fence`, `charTreeCold` (s 0,72–0,9).
- small: `dryGrass`, `stump`, `ashPile`, `rock`.
- edge: `dryGrass`, `ashPile`, `rock`.

## Zustände
- Albtraum / Nacht-Look: Palette und Deko wie oben, **keine Vignette, keine Tönung**; Türme in Originalfarben mit Lichtinsel `nm-warm-light`.
- Normal: unverändert.
- **Bewegung** (`MAPS.fork.nightmare.motion`, Lage einmal je Karte, je Frame nur Zeitversatz; Reihenfolge = Wichtigkeit, `compact` schneidet ab):

| Art | Anzahl Desktop / Handy | Farbe | Tempo | Lage |
|---|---|---|---|---|
| Ascheflug (fall) | 28 / 12 | #e8dccc α .75, r 1,4–3 | 7 s, 120 px, Drift 30 | gleichmäßig |
| Funken (rise) | 10 / 5 | Kern #ffe58a, Hof #ff7a1f α .35 | 4,5 s | Rand und Feld |
| Rauchwölkchen (smoke) | 6 / 3 | #6e6460 α .75 | steigt 60 px, wächst 0,6→1,6, 3,6 s | über `charTree` mit Glut und `hay` |
| Glutrisse (pulse) | 9 / 4 | `lava` Hof | α .45↔1, 2,6 s | 4 Randrisse + jeder dritte Wegriss |
| Staubschleier (fog) | 2 / 1 | #d8cfc4 α .10–.12 | ±50 px, 16 s | Feld (640,330) rx 420, (700,560) rx 360 Fläche-px |
| Augen (blink) | 0 / 0 | – | – | keine (Steppe ohne Augen) |

  Summe Desktop 55 (≤ 60), Handy 25 (≤ 28).
- **reduced motion** (`prefers-reduced-motion` bzw. `ui.reducedMotion`): alles steht an der Startlage; Augen offen; Glanzlinien ohne Versatz; Nebel ohne Pendel.
- Hindernisse: Bäume (10,1), (15,11), (1,6) = `charTreeCold` s 0,42; Fels (11,2) = `rock` s 1,25 mit pulsierendem Glutriss.
- Barrierefreiheit: Gegner und Türme bleiben über Silhouette und Kontur `ink` erkennbar; Leuchtfarben sind Stimmung, keine Information.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/config.js` | `MAPS.fork.nightmare = { painted, frame, obstacle, motion }` mit den Werten oben. |
| `src/render-painted.js` | Formen in `NM_SHAPES`; Glutrisse im Rand und im Weg als Raster, Puls in der Bewegungsschicht. |
| `src/render-nightmare.js` | Bewegungsarten dieser Karte (aus der Grundlage). |
| `src/hud.js`/`style.css` | Holzpaar `nm-wood-rust-a/-b` über die Bauvorlage `HUD-Albtraum-Holz.md` (anderer designer). |

## Tests
- Bestehende Tests der Karte (`tests/painted.test.js` „Stil 1 (alle Karten): Burg am Ausgang, Fahne an jedem Eingang …“) bleiben im Normalmodus grün.
- Neu `tests/painted.test.js`: Albtraum-SVG von `fork` enthält `nm-char`, keine `vignette`-Rects, deterministisch (zwei Aufrufe gleich); keine Deko-Box über bebaubarer Kachel (> 0,3 Kacheln).
- Neu `tests/render.test.js`: Bewegung `fork` hat 55 Teilchen, mit `compact` 25; reduced motion zeichnet zwei Frames gleich.

## Messbare Abnahme
- Screenshot `#game` bei 1280x800 und 844x390 im Albtraum auf `fork`: entspricht der Fläche in Palette, Rand-Deko und hellem Weg auf ockerfarbener Steppe, keine Lava; keine Abdunklung zum Rand (20-px-Randstreifen höchstens 10 % dunkler als Bodenmitte).
- Kontrast Wegmitte zu Boden ≥ 1,5:1 (Werte oben).
- Alle Bauplätze wie im Normalmodus bebaubar (e2e: Turm auf (0,0) bzw. erster freier Kachel baubar wie bisher).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
