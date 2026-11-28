# Karte-Vulkan-Albtraum (B-199): Vulkan im Albtraum: Verbrannte Erde mit viel Lava (Stil B): schwarzrote Kruste, Lavaseen, Lavafall und Lavaströme im Rand, glühende Bodenrisse
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Karte-Vulkan. Backlog: B-199, Grundlage B-194 (`Karte-Albtraum-Grundlage.md`). Stand: agent/albtraum-design@b13c4d4.

## Maße
- Umrechnung wie in der Grundlage: Fläche-px → Entwurfs-px `(x − 160) · 1,1875`, `(y − 64) · 1,1875`; Fläche-px → Canvas-Spiel-px `(x − 160) · 0,8333 + 50`. Formen unten in **Fläche-px**, Fußpunkt `foot`; im gemalten SVG mit `scale(1.1875 · s)` setzen (s = Maßstab aus der Tabelle).
- Weg, Wasser/Lava, Hindernisse, Fahnen- und Bauplatz-Kacheln: unverändert aus `MAPS.volcano` (Wegpunkte [-1,11] [3,11] [3,2] [10,2] [10,11] [16,11] [16,3] [20,3]; Lava wie `VOLCANO_LAVA_RIVER`/`_POOLS`, Brücke (13,11)). Keine Deko auf einer Feldkachel; Überhang höchstens `maxOverhang` 0,3 Kacheln.
- Lavafluss und Tümpel der Karte: **unverändert** (Kacheln, Brücke, Schaden, Überhitzen); nur Palette.
- **Rand-Lava** (neu, nur Optik, `MAPS.volcano.nightmare.extras`): fünf Ströme und zwei Seen, alle laufen über die Bildkante (mit `ext` weiter verlängern). Pfade unten in Entwurfs-px (Feld ab 0,0, negative Werte = Rand/Seitenzone). Lagen wie `PAINTED_STYLE.lava` (Glühen w·2,4 weich α .38, Kruste ink w+10, Platte `lava-plate` w+5, `lava` w, `lava-core` w·0,5).
- **Lavafall** rechts: Felsstufe mit Lava von Fläche (1228,404) bis (1228,560), Breite 26 → Entwurfs-px x 1268, y 404…589, Breite 31. Fels `nm-char`, Gischt unten (Ellipse `lava-core` α .6, weich).
- **Glühende Bodenrisse** (Bodentextur, im Raster): auf Kachelkanten zwischen zwei freien Bauplätzen (beide Kacheln nicht Weg, Lava, Hindernis, Fahne), Chance je Kante 0,2 (deterministisch, Saat 77 + Karten-Hash). Riss = 5 Punkte von 6 bis 42 Fläche-px der Kante (5…35 Spiel-px), quer ±3,5 px gezackt. Lagen: ink 3,2 α .8 → #ff6a1a 5 weich α .55 → #ffb02a 1,5. Liegt genau auf der Kachelgrenze, also zwischen den Türmen, nie in der Mitte eines Bauplatzes.
- Freie Bereiche für Deko (keine Bäume auf Lava): links oben x 28…124 / y −40…210 Fläche-px, links y 196…576, rechts x 1146…1300 / y 286…840, unten x 250…500 und 1040…1172.

## Tokens
Vollständiger Palettensatz für `MAPS.volcano.nightmare.painted` (gleiche Schlüssel wie `PAINTED_PALETTE`):

| Teil | Token | Wert |
|---|---|---|
| Boden 1 | `nm-volcano-1` | #4a302c |
| Boden 2 | `nm-volcano-2` | #33201e |
| Boden 3 | `nm-volcano-3` | #2a1818 |
| Glutflecken (mottle, α .32) | `nm-volcano-mottle` | [0.62, 0.16, 0.04] |
| Flecken hell (lit, α .16) | `nm-volcano-lit` | [1.00, 0.62, 0.22] |
| Lavalicht Mitte | `lava` | #ff7a1f α .24 (radial 0,62/0,5 r 0,6) |
| Glut links/rechts | `lava` | #ff7a1f α .22 (radial 0,02/0,6 und 0,98/0,55, r 0,45) |
| Weg groove | `nm-volcano-path-groove` | #1c100e |
| Weg Kontur | `ink` | #2b1a10 |
| Weg edge | `nm-volcano-path-edge` | #3a2420 |
| Weg earth | `nm-volcano-path-earth` | #9c8478 |
| Weg mid | `nm-volcano-path-mid` | #b8a090 |
| Wegpunkte | `nm-volcano-path-dot` | #ffd8b0 / #3a2420 |
| Tupfen (dotKind `ember`) | `lava / lava-core / nm-ash` | #ff7a1f / #ffb04a / #8a7c78 (jeder zweite Glut) |
| Tanne | `–` | entfällt |
| Baum (kahl, verkohlt) | `nm-char-a → -b` | #4a3430 → #1a1210 |
| Felsnadel, Schlot | `nm-char-a → -b` | wie oben, Glutader `lava` |
| Fels | `nm-volcano-rock / -light` | #5a4a48 / #8a7a76 |
| Klippe | `–` | entfällt (Lavafall-Stufe statt Klippe) |
| Burg | `unverändert` | #e3d2b0, #b9a283, #8a7560 |
| Brücke (Stein) | `map-volcano-bridge (vorhanden)` | #9a8a80, #6a5a52, #3a2c28, #54463f |
| Lava | `lava / lava-core / lava-hot / lava-crust / lava-plate` | #ff7a1f / #ffc23a / #ffe58a / #2a1a17 / #4a2a22 |
| Lava-Glühen | `nm-lava-glow` | #ff5a1a |
| Vignette | `–` | entfällt |
| Gegner-Randlicht | `nm-rim-ember` | #ffd0a0 |
| Augen | `nm-eye-ember` | #ffb02a |
| HUD-Holz | `nm-wood-ember-a / -b` | #6a3620 / #2a140a |
- neu: `nm-volcano-1` = #4a302c, `nm-volcano-2` = #33201e, `nm-volcano-3` = #2a1818, Kruste (deutlich dunkler als `map-volcano-*`)
- neu: `nm-volcano-path-groove` = #1c100e, `-edge` = #3a2420, `-earth` = #9c8478, `-mid` = #b8a090, `-dot` = #ffd8b0
- neu: `nm-lava-glow` = #ff5a1a, weiches Glühen um Rand-Lava und Risse
- neu: `nm-ash` = #8a7c78, `nm-volcano-rock` = #5a4a48, `nm-volcano-rock-light` = #8a7a76
- neu: `nm-wood-ember-a` = #6a3620, `nm-wood-ember-b` = #2a140a
- Kontrast (gemessen, WCAG-Formel): Wegmitte `nm-volcano-path-mid` zu `nm-volcano-2` = 6,20:1, Wegfläche `-earth` zu `-2` = 4,38:1 (Pflicht ≥ 1,5:1). HUD-Schrift `cream` auf `nm-wood-ember-a` = 8,79:1.
- Kartenkarte im Startbildschirm: Vorschaubild = Albtraum-Raster dieser Karte (Bauvorlage `Albtraum-Kartenauswahl.md`), Name „Vulkan“. Musik: `MUSIC.nightmare.volcano` (vorhanden, unverändert).

## Formen/SVG
Formen für `NM_SHAPES` in `render-painted.js` (Fläche-px, statische Fassung; Animationen laufen in der Bewegungsschicht, nicht im Raster). Verläufe als `<defs>` im SVG mit Präfix `nm-`:
```js
<linearGradient id="nm-char" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a3430"/><stop offset="1" stop-color="#1a1210"/></linearGradient>
<filter id="nm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="nm-blur" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="16"/></filter>
```
```js
// Verkohlter Baum mit Glutadern
charTree: { w: 100, h: 170, foot: [50, 170], svg: (c) => `<ellipse cx="54" cy="166" rx="44" ry="8" fill="rgba(10,4,2,.45)"/><ellipse cx="54" cy="164" rx="40" ry="10" fill="#ff5a2a" opacity=".2"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2b1a10" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2e201c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2e201c" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 168 C40 140 36 110 40 88 L32 72 L44 76 L42 56 L52 68 L56 46 L60 70 L70 60 L66 86 C70 110 66 140 74 168 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M44 160 C46 140 44 118 46 100" stroke="#5a4440" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><path d="M52 162 L56 144 L50 128 L56 112 L52 98 M62 152 L60 136 L65 122" stroke="#ff7a1f" stroke-width="4.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M52 162 L56 144 L50 128 L56 112 L52 98 M62 152 L60 136 L65 122" stroke="#ffe58a" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="44" cy="58" r="2.6" fill="#ff7a1f"/><circle cx="56" cy="48" r="2.6" fill="#ffc23a"/><circle cx="70" cy="62" r="2.4" fill="#ff7a1f"/><circle cx="56" cy="40" r="8" fill="#5a504c" stroke="#2b1a10" stroke-width="2"/><circle cx="52" cy="40" r="6" fill="#6e6460"/>` },
// Verkohlter Baum ohne Glut (Hindernis 1,8, s 0,42)
charTreeCold: { w: 100, h: 170, foot: [50, 170], svg: (c) => `<ellipse cx="54" cy="166" rx="44" ry="8" fill="rgba(10,4,2,.45)"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2b1a10" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2e201c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2e201c" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 168 C40 140 36 110 40 88 L32 72 L44 76 L42 56 L52 68 L56 46 L60 70 L70 60 L66 86 C70 110 66 140 74 168 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M44 160 C46 140 44 118 46 100" stroke="#5a4440" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>` },
// Felsnadel mit Glutriss (Hindernis 18,8, s 0,8)
spire: { w: 44, h: 74, foot: [22, 74], svg: (c) => `<ellipse cx="22" cy="70" rx="20" ry="4" fill="rgba(10,4,2,.45)"/><path d="M4 70 L12 34 L18 30 L22 4 L28 26 L34 30 L40 70 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 64 L18 36 M26 30 L28 50" stroke="#5a4440" stroke-width="2.4" stroke-linecap="round"/><path d="M30 60 L26 48 L30 40" stroke="#ff7a1f" stroke-width="2" fill="none" stroke-linecap="round"/>` },
// Rauchender Schlot (Rauch in der Bewegungsschicht)
vent: { w: 68, h: 56, foot: [34, 56], svg: (c) => `<ellipse cx="34" cy="52" rx="32" ry="5" fill="rgba(10,4,2,.45)"/><circle cx="34" cy="22" r="22" fill="#ff7a1f" opacity=".18" filter="url(#nm-soft)"/><path d="M4 52 L14 30 L22 26 Q34 20 46 26 L54 30 L64 52 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><ellipse cx="34" cy="27" rx="12" ry="4" fill="#2a1a17" stroke="#2b1a10" stroke-width="2.5"/><ellipse cx="34" cy="27" rx="9" ry="2.6" fill="#ff7a1f"/><ellipse cx="34" cy="27" rx="4.5" ry="1.4" fill="#ffe58a"/><path d="M14 46 L20 38 L18 32 M52 44 L48 36" stroke="#ff7a1f" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="34" cy="16" r="9" fill="#6e6460" opacity=".8"/><circle cx="30" cy="16" r="7" fill="#8a7c78" opacity=".7"/><circle cx="38" cy="16" r="8" fill="#5a504c" opacity=".7"/>` },
// Glimmender Stumpf
stump: { w: 60, h: 50, foot: [30, 50], svg: (c) => `<ellipse cx="30" cy="48" rx="24" ry="5" fill="rgba(10,4,2,.45)"/><path d="M8 48 L12 22 L18 26 L22 14 L30 22 L36 12 L42 24 L48 20 L52 48 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M30 46 L28 34 L32 26" stroke="#ff7a1f" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 46 L28 34 L32 26" stroke="#ffe58a" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
// Aschehaufen mit Glut
ashPile: { w: 70, h: 30, foot: [35, 30], svg: (c) => `<ellipse cx="35" cy="28" rx="34" ry="4" fill="rgba(10,4,2,.4)"/><path d="M2 28 Q14 8 34 10 Q56 8 68 28 Z" fill="#5a4a46" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 18 Q24 12 34 14 M44 13 Q52 12 58 18" stroke="#8a7a74" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="24" cy="22" r="2.5" fill="#ff7a1f"/><circle cx="40" cy="20" r="2" fill="#ffc23a"/><circle cx="52" cy="24" r="2.2" fill="#ff7a1f"/>` },
// Fels (Hindernis 7,1, mit Glutriss)
rock: { w: 36, h: 26, foot: [18, 26], svg: (c) => `<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(6,4,14,.4)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#5a4a48" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#8a7a76"/>` },
```

Rand-Lava (Entwurfs-px, für `nightmare.extras.lava`):
```js
// Lavastrom links oben, Breite 26 Fläche-px = 30.9 Entwurfs-px
'M-97.4 -123.5 C-111.6 -16.6 -49.9 54.6 -76 156.8 C-99.7 242.3 -154.4 280.3 -237.5 323',
// Abfluss See links, Breite 22 Fläche-px = 26.1 Entwurfs-px
'M-142.5 536.8 C-154.4 565.3 -201.9 579.5 -237.5 596.1',
// Strom rechts unten (unter dem Lavafall), Breite 24 Fläche-px = 28.5 Entwurfs-px
'M1270.6 589 C1251.6 660.3 1303.9 712.5 1280.1 781.4 C1268.3 826.5 1287.3 864.5 1294.4 921.5',
// Strom unten links, Breite 18 Fläche-px = 21.4 Entwurfs-px
'M121.1 921.5 C137.8 862.1 213.8 874 275.5 843.1 C320.6 821.8 368.1 840.8 387.1 921.5',
// Strom unten rechts, Breite 14 Fläche-px = 16.6 Entwurfs-px
'M1056.9 921.5 C1068.8 869.3 1116.3 862.1 1135.3 838.4 C1149.5 819.4 1175.6 826.5 1189.9 862.1',
// Lavasee links (Fläche)
'M-261.2 422.8 C-201.9 403.8 -106.9 399 -57 427.5 C-11.9 453.6 -26.1 517.8 -71.2 536.8 C-118.7 558.1 -190 551 -261.2 541.5 Z',
// Lavasee rechts (Fläche)
'M1401.3 280.3 C1341.9 270.8 1246.9 268.4 1206.5 301.6 C1175.6 330.1 1197 389.5 1246.9 403.8 C1294.4 415.6 1353.8 410.9 1401.3 403.8 Z',
```
Lavafall (Entwurfs-px, Fuß unten Mitte): Felsstufe als Pfad relativ zu (x, y1, y2) = (1268, 404, 589):
```js
`M${x-55} ${y1+12} Q${x-36} ${y1-14} ${x} ${y1-7} Q${x+40} ${y1-14} ${x+62} ${y1+10} L${x+55} ${(y1+y2)/2} L${x+64} ${y2-10} Q${x+36} ${y2+7} ${x+21} ${y2-2} L${x-21} ${y2-2} Q${x-40} ${y2+7} ${x-59} ${y2-7} L${x-48} ${(y1+y2)/2} Z`
// Lavaband: Breite 31, lava; Kern Breite 15,5, lava-core
```

**Rand-Deko je Reihe** (`MAPS.volcano.nightmare.frame`, Auswahl gleich verteilt, deterministisch aus `mapId`):
- big (Reihe 2–4): `charTree` (mit Glut), `spire` (s 0,9–1,25).
- mid: `vent`, `spire`, `charTree` (s 0,72–0,9).
- small: `stump`, `ashPile`, `rock`.
- edge: `ashPile`, `rock`, `stump`.
- Keine Deko auf Rand-Lava (Rechtecke aus Maße als `reserve`).

## Zustände
- Albtraum / Nacht-Look: Palette und Deko wie oben, **keine Vignette, keine Tönung**; Türme in Originalfarben mit Lichtinsel `nm-warm-light`.
- Normal: unverändert.
- **Bewegung** (`MAPS.volcano.nightmare.motion`, Lage einmal je Karte, je Frame nur Zeitversatz; Reihenfolge = Wichtigkeit, `compact` schneidet ab):

| Art | Anzahl Desktop / Handy | Farbe | Tempo | Lage |
|---|---|---|---|---|
| Lava-Glanz (glint) | 10 / 6 | `lava-hot` w 2,4–5, Kruste `lava-plate` Dash [5,70] | 40 px/s (Fall: 70 px/s) | Fluss der Karte (2), 5 Randströme, Lavafall (2), Tümpel nicht |
| Tümpel und Seen (pulse) | 5 / 3 | `lava-hot` Kern | wie `LAVA_STYLE.pulse` | 3 Tümpel + 2 Seen |
| Funken (rise) | 26 / 10 | Kern `lava-hot`, Hof `lava` α .35 | 4,5 s | gleichmäßig, mehr über Lava |
| Asche (fall) | 12 / 4 | #d8cfc4 α .7, r 1,4–2,8 | 7 s | gleichmäßig |
| Rauch (smoke) | 5 / 3 | #8a7c78 α .55 | 3,6 s, 60 px, 0,6→1,6 | Schlote, Seen, Fluss (790,200) (770,420) |
| Bodenrisse (pulse) | 2 / 2 (Gruppen) | `nm-lava-glow` | α .45↔1, 2,6 s; jeder dritte Riss in Gruppe A, Rest statisch | siehe Maße |

  Summe Desktop 60 (≤ 60), Handy 28 (≤ 28).
- **reduced motion** (`prefers-reduced-motion` bzw. `ui.reducedMotion`): alles steht an der Startlage; Augen offen; Glanzlinien ohne Versatz; Nebel ohne Pendel.
- Hindernisse: Baum (1,8) = `charTreeCold` s 0,42; Fels (7,1) = `rock` s 1,25 mit Glutriss; (18,8) = `spire` s 0,8.
- Barrierefreiheit: Gegner und Türme bleiben über Silhouette und Kontur `ink` erkennbar; Leuchtfarben sind Stimmung, keine Information.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/config.js` | `MAPS.volcano.nightmare = { painted, frame, obstacle, motion }` mit den Werten oben. |
| `src/render-painted.js` | Formen in `NM_SHAPES`; Rand-Lava und Lavafall aus `nightmare.extras` (Lagen wie `PAINTED_STYLE.lava`); Bodenrisse auf Kachelkanten im Raster. |
| `src/render-nightmare.js` | Bewegungsarten dieser Karte (aus der Grundlage). |
| `src/hud.js`/`style.css` | Holzpaar `nm-wood-ember-a/-b` über die Bauvorlage `HUD-Albtraum-Holz.md` (anderer designer). |

## Tests
- Bestehende Tests der Karte (`tests/painted.test.js` „Stil 1 (alle Karten): Burg am Ausgang, Fahne an jedem Eingang …“) bleiben im Normalmodus grün.
- Neu `tests/painted.test.js`: Albtraum-SVG von `volcano` enthält `nm-char`, keine `vignette`-Rects, deterministisch (zwei Aufrufe gleich); keine Deko-Box über bebaubarer Kachel (> 0,3 Kacheln).
- Neu `tests/render.test.js`: Bewegung `volcano` hat 60 Teilchen, mit `compact` 28; reduced motion zeichnet zwei Frames gleich.

## Messbare Abnahme
- Screenshot `#game` bei 1280x800 und 844x390 im Albtraum auf `volcano`: entspricht der Fläche in Palette, Rand-Deko und Lavaseen, Lavafall und Randströmen, die aus dem Bild laufen; glühende Risse nur auf Kachelkanten; keine Abdunklung zum Rand (20-px-Randstreifen höchstens 10 % dunkler als Bodenmitte).
- Kontrast Wegmitte zu Boden ≥ 1,5:1 (Werte oben).
- Alle Bauplätze wie im Normalmodus bebaubar (e2e: Turm auf (0,0) bzw. erster freier Kachel baubar wie bisher).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
