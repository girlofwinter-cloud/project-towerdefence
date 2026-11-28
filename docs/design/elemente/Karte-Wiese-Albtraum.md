# Karte-Wiese-Albtraum (B-195): Wiese im Albtraum: Verfluchter Wald (Stil A) mit verdrehten Spukbäumen, Augenbüschen, Leuchtpilzen, Mondlicht und belebtem Wasser
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Karte-Wiese. Backlog: B-195, Grundlage B-194 (`Karte-Albtraum-Grundlage.md`). Stand: agent/albtraum-design@b13c4d4.

## Maße
- Umrechnung wie in der Grundlage: Fläche-px → Entwurfs-px `(x − 160) · 1,1875`, `(y − 64) · 1,1875`; Fläche-px → Canvas-Spiel-px `(x − 160) · 0,8333 + 50`. Formen unten in **Fläche-px**, Fußpunkt `foot`; im gemalten SVG mit `scale(1.1875 · s)` setzen (s = Maßstab aus der Tabelle).
- Weg, Wasser/Lava, Hindernisse, Fahnen- und Bauplatz-Kacheln: unverändert aus `MAPS.meadow` (Wegpunkte [-1,2] [5,2] [5,8] [11,8] [11,3] [16,3] [16,11] [20,11]). Keine Deko auf einer Feldkachel; Überhang höchstens `maxOverhang` 0,3 Kacheln.
- Fluss: Lage und Kacheln wie heute (`MEADOW_RIVER`, `MEADOW_PAINTED_WATER.river`), läuft oben und links aus dem Bild. Kurve der Fläche in Entwurfs-px (Feld ab 0,0): `M79 -220 L79 -10 C89 70 59 150 59 200 S-11 290 -81 300 L-391 306`; mit `ext` über `extendEnds` weiter. Strichbreiten wie `PAINTED_STYLE.river` [92, 76, 66]; Wasser quer verlaufend `nm-water-a` → `nm-water-b`.
- See: wie heute `MEADOW_PAINTED_WATER.lake` [114, 688, 118, 60] mit Ufer `nm-bank`; **kein Abfluss**.
- Brücke (1,2): Form wie heute, Farben `nm-meadow-bridge`; zwei Moosfäden an der Brüstung (`nm-moss-strand`).
- Rand-Deko in vier Reihen (Grundlage) ringsum; Wegbahnen Zeile 2 links und Zeile 11 rechts frei; Fahne (0,3) und Burg wie heute.
- Nebelbänder nur über dem Feld (nie als Rand-Abdunklung): Fläche-px (640,430) rx 440, (470,250) rx 300, (860,640) rx 300, (300,560) rx 220; ry 18–26.

## Tokens
Vollständiger Palettensatz für `MAPS.meadow.nightmare.painted` (gleiche Schlüssel wie `PAINTED_PALETTE`):

| Teil | Token | Wert |
|---|---|---|
| Boden 1 (oben links) | `nm-meadow-1` | #6e927c |
| Boden 2 | `nm-meadow-2` | #476a5e |
| Boden 3 (unten rechts) | `nm-meadow-3` | #34504e |
| Flecken dunkel (mottle, α .7) | `nm-meadow-mottle` | [0.05, 0.10, 0.14] |
| Flecken hell (lit, α .2) | `nm-meadow-lit` | [0.75, 0.90, 1.00] |
| Mondlicht oben rechts | `nm-moon` | #d8f0ff α .30 → #8a7ad0 α .08 |
| Grünschein unten links | `nm-glow-moss` | #7dffb0 α .14 |
| Weg groove | `nm-meadow-path-groove` | #1f302c |
| Weg Kontur | `ink` | #2b1a10 |
| Weg edge | `nm-meadow-path-edge` | #5a4e4a |
| Weg earth | `nm-meadow-path-earth` | #b0a284 |
| Weg mid | `nm-meadow-path-mid` | #d0c39e |
| Wegpunkte | `nm-meadow-path-dot` | #eef6e0 / #5a4e4a |
| Tupfen (dotKind `tuft`) | `nm-moss-dark / nm-moss-light` | #2e4a44 / #7f9e8a; jeder sechste Glühpunkt #9effd9 |
| Tanne | `–` | entfällt (nur Spukbäume) |
| Baum (kahl, verdreht) | `nm-bark-a → -b, nm-bark-light` | #6a5a80 → #2e2538, Rinde #4e4060, Glanz #8a7aa0 |
| Moos an Bäumen | `nm-moss-strand` | #8aa890 |
| Busch | `nm-bush / -light` | #1e1a2c / #3c3254 |
| Pilze | `nm-shroom` | #9effd9 |
| Augen | `nm-eye-moss` | #d8ff5a |
| Fels | `nm-meadow-rock / -light` | #7a7488 / #a8a2b8 |
| Klippe | `–` | entfällt |
| Burg | `unverändert` | #e3d2b0, #b9a283, #8a7560 |
| Brücke | `nm-meadow-bridge` | #7a6a72 → #463a46, Brüstung #342a36 |
| Wasser | `nm-water-a / -b / -river` | #5fd6b8 / #183e50 / quer #3fae9c → #5fd6b8 → #2a6a70 |
| Ufer | `nm-bank` | #7e8478 |
| Glanz | `nm-glint` | #d8fff0 |
| Nebel | `nm-fog` | #c8d4f0 |
| Vignette | `–` | entfällt |
| Gegner-Randlicht | `nm-rim` | #e8f4ff |
| HUD-Holz | `nm-wood-moss-a / -b` | #5e4e66 / #30263a |
- neu: `nm-meadow-1` = #6e927c, `nm-meadow-2` = #476a5e, `nm-meadow-3` = #34504e, Boden
- neu: `nm-meadow-path-groove` = #1f302c, `-edge` = #5a4e4a, `-earth` = #b0a284, `-mid` = #d0c39e, `-dot` = #eef6e0
- neu: `nm-moon` = #d8f0ff, `nm-glow-moss` = #7dffb0, Licht
- neu: `nm-moss-deep` = #2e4a44, `nm-moss-light` = #7f9e8a, `nm-moss-strand` = #8aa890, `nm-bark` = #4e4060, `nm-bark-a` = #6a5a80, `nm-bark-b` = #2e2538, `nm-bark-light` = #8a7aa0
- neu: `nm-bush` = #1e1a2c, `nm-bush-light` = #3c3254, `nm-shroom` = #9effd9, `nm-eye-moss` = #d8ff5a, `nm-meadow-rock` = #7a7488, `nm-meadow-rock-light` = #a8a2b8
- neu: `nm-water-a` = #5fd6b8, `nm-water-b` = #183e50, `nm-bank` = #7e8478, `nm-glint` = #d8fff0, `nm-fog` = #c8d4f0, `nm-meadow-bridge` = #7a6a72
- neu: `nm-rim` = #e8f4ff, `nm-wood-moss-a` = #5e4e66, `nm-wood-moss-b` = #30263a
- Kontrast (gemessen, WCAG-Formel): Wegmitte `nm-meadow-path-mid` zu `nm-meadow-2` = 3,43:1, Wegfläche `-earth` zu `-2` = 2,39:1 (Pflicht ≥ 1,5:1). HUD-Schrift `cream` auf `nm-wood-moss-a` = 6,89:1.
- Kartenkarte im Startbildschirm: Vorschaubild = Albtraum-Raster dieser Karte (Bauvorlage `Albtraum-Kartenauswahl.md`), Name „Wiese“. Musik: `MUSIC.nightmare.<Grundtitel>` (vorhanden, unverändert).

## Formen/SVG
Formen für `NM_SHAPES` in `render-painted.js` (Fläche-px, statische Fassung; Animationen laufen in der Bewegungsschicht, nicht im Raster). Verläufe als `<defs>` im SVG mit Präfix `nm-`:
```js
<linearGradient id="nm-bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a5a80"/><stop offset="1" stop-color="#2e2538"/></linearGradient>
```
```js
// Verdrehter Spukbaum mit Moos
twistedTree: { w: 120, h: 180, foot: [60, 180], svg: (c) => `<ellipse cx="60" cy="176" rx="46" ry="8" fill="rgba(6,4,14,.4)"/><path d="M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 C12 80 6 74 8 68" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 C12 80 6 74 8 68" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 76 C110 80 116 74 112 68" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 76 C110 80 116 74 112 68" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 C48 42 44 34 46 28" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 C48 42 44 34 46 28" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 64 C70 58 74 50 80 48" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 64 C70 58 74 50 80 48" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176" fill="none" stroke="#4e4060" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 176 C50 160 52 140 50 122 C48 108 50 98 58 92 C66 98 70 108 68 122 C66 140 70 160 80 176 Z" fill="url(#nm-bark)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M54 168 C56 150 55 132 56 116 M60 64 C58 56 60 50 58 46" stroke="#8a7aa0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><ellipse cx="59" cy="138" rx="8.5" ry="11.5" fill="#0c0814" stroke="#2b1a10" stroke-width="2.5"/><path d="M24 82 q-3 10 1 18 q2 4 -1 8 M34 94 q-2 8 0 14 M96 80 q3 9 -1 16 M106 70 q1 8 -1 12 M48 44 q-2 8 1 12" stroke="#8aa890" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>` },
// Spukbaum mit Augen in der Baumhöhle (Augen blinzeln in der Bewegungsschicht)
twistedTreeEyes: { w: 120, h: 180, foot: [60, 180], svg: (c) => `<ellipse cx="60" cy="176" rx="46" ry="8" fill="rgba(6,4,14,.4)"/><path d="M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 C12 80 6 74 8 68" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 C12 80 6 74 8 68" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 76 C110 80 116 74 112 68" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 76 C110 80 116 74 112 68" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 C48 42 44 34 46 28" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 C48 42 44 34 46 28" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 64 C70 58 74 50 80 48" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 64 C70 58 74 50 80 48" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176" fill="none" stroke="#4e4060" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 176 C50 160 52 140 50 122 C48 108 50 98 58 92 C66 98 70 108 68 122 C66 140 70 160 80 176 Z" fill="url(#nm-bark)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M54 168 C56 150 55 132 56 116 M60 64 C58 56 60 50 58 46" stroke="#8a7aa0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><ellipse cx="59" cy="138" rx="8.5" ry="11.5" fill="#0c0814" stroke="#2b1a10" stroke-width="2.5"/><circle cx="59" cy="136" r="11" fill="#d8ff5a" opacity=".22"/><ellipse cx="55.5" cy="136" rx="2.6" ry="2" fill="#d8ff5a"/><ellipse cx="62.5" cy="136" rx="2.6" ry="2" fill="#d8ff5a"/><path d="M24 82 q-3 10 1 18 q2 4 -1 8 M34 94 q-2 8 0 14 M96 80 q3 9 -1 16 M106 70 q1 8 -1 12 M48 44 q-2 8 1 12" stroke="#8aa890" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>` },
// Busch mit zwei Augenpaaren
bushEyes: { w: 80, h: 50, foot: [40, 50], svg: (c) => `<ellipse cx="40" cy="48" rx="38" ry="5" fill="rgba(6,4,14,.4)"/><path d="M2 48 Q0 30 14 26 Q16 10 32 12 Q42 0 56 10 Q72 8 74 26 Q84 32 78 48 Z" fill="#1e1a2c" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 28 Q20 20 28 22 M44 12 Q52 10 56 14 M66 26 Q70 24 72 28" stroke="#3c3254" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="35" cy="30" r="10" fill="#d8ff5a" opacity=".2"/><path d="M28 28 L34 30 L32 33 L29 32 Z M42 28 L36 30 L38 33 L41 32 Z" fill="#d8ff5a"/><ellipse cx="58" cy="38" rx="2.4" ry="1.7" fill="#d8ff5a" opacity=".85"/><ellipse cx="65" cy="38" rx="2.4" ry="1.7" fill="#d8ff5a" opacity=".85"/>` },
// Busch ohne Augen
bush: { w: 80, h: 50, foot: [40, 50], svg: (c) => `<ellipse cx="40" cy="48" rx="38" ry="5" fill="rgba(6,4,14,.4)"/><path d="M2 48 Q0 30 14 26 Q16 10 32 12 Q42 0 56 10 Q72 8 74 26 Q84 32 78 48 Z" fill="#1e1a2c" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 28 Q20 20 28 22 M44 12 Q52 10 56 14 M66 26 Q70 24 72 28" stroke="#3c3254" stroke-width="3" fill="none" stroke-linecap="round"/>` },
// Leuchtpilze mit Schein
mushrooms: { w: 44, h: 32, foot: [22, 32], svg: (c) => `<ellipse cx="22" cy="30" rx="22" ry="4" fill="rgba(6,4,14,.35)"/><circle cx="22" cy="18" r="22" fill="#9effd9" opacity=".22"/><g transform="translate(10,30) scale(0.9)"><path d="M-3 0 V-10 H3 V0 Z" fill="#d8d0c0" stroke="#2b1a10" stroke-width="2"/><path d="M-10 -9 Q-10 -20 0 -20 Q10 -20 10 -9 Z" fill="#9effd9" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="-4" cy="-14" r="1.6" fill="#fff"/><circle cx="3" cy="-12" r="1.3" fill="#fff"/></g><g transform="translate(26,30) scale(1.2)"><path d="M-3 0 V-10 H3 V0 Z" fill="#d8d0c0" stroke="#2b1a10" stroke-width="2"/><path d="M-10 -9 Q-10 -20 0 -20 Q10 -20 10 -9 Z" fill="#9effd9" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="-4" cy="-14" r="1.6" fill="#fff"/><circle cx="3" cy="-12" r="1.3" fill="#fff"/></g><g transform="translate(38,31) scale(0.7)"><path d="M-3 0 V-10 H3 V0 Z" fill="#d8d0c0" stroke="#2b1a10" stroke-width="2"/><path d="M-10 -9 Q-10 -20 0 -20 Q10 -20 10 -9 Z" fill="#9effd9" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="-4" cy="-14" r="1.6" fill="#fff"/><circle cx="3" cy="-12" r="1.3" fill="#fff"/></g>` },
// Farn
fern: { w: 52, h: 36, foot: [26, 36], svg: (c) => `<ellipse cx="26" cy="34" rx="22" ry="3.5" fill="rgba(6,4,14,.35)"/><path d="M26 34 C22 24 12 18 2 16 M26 34 C26 22 24 12 26 2 M26 34 C30 24 40 18 50 16 M26 34 C20 28 12 28 6 30 M26 34 C32 28 40 28 46 30" fill="none" stroke="#2b1a10" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 34 C22 24 12 18 2 16 M26 34 C26 22 24 12 26 2 M26 34 C30 24 40 18 50 16 M26 34 C20 28 12 28 6 30 M26 34 C32 28 40 28 46 30" fill="none" stroke="#2e4a44" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 17 l3 -4 M16 20 l2 -5 M44 17 l-3 -4 M36 20 l-2 -5 M25 10 l-4 -2 M27 16 l4 -2" stroke="#7f9e8a" stroke-width="2" stroke-linecap="round"/>` },
// Fels (Hindernis 8,1 mit Moosstrich, s 1,25)
rock: { w: 36, h: 26, foot: [18, 26], svg: (c) => `<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(6,4,14,.4)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#7a7488" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#a8a2b8"/>` },
```

Augenpositionen für `scene.eyes` (relativ zur Bezugsbox): Baum (55,5|136) und (62,5|136); Busch (31,30)+(38,30) und (58,38)+(65,38). Seeaugen: (190,690) Entwurfs-px der Fläche, zwei Mandelformen 12 × 6.

**Rand-Deko je Reihe** (`MAPS.meadow.nightmare.frame`, Auswahl gleich verteilt, deterministisch aus `mapId`):
- big (Reihe 2–4): `twistedTree` (jeder dritte `twistedTreeEyes`), s 0,9–1,25.
- mid: `twistedTree`/`twistedTreeEyes`, `bushEyes` (s 0,72–0,9).
- small (Reihe 1): `bushEyes` (jeder zweite), `bush`, `mushrooms`, `fern`, `rock`.
- edge: `fern`, `mushrooms`, `rock`, `bush` (jeder dritte mit Augen).

## Zustände
- Albtraum / Nacht-Look: Palette und Deko wie oben, **keine Vignette, keine Tönung**; Türme in Originalfarben mit Lichtinsel `nm-warm-light`.
- Normal: unverändert.
- **Bewegung** (`MAPS.meadow.nightmare.motion`, Lage einmal je Karte, je Frame nur Zeitversatz; Reihenfolge = Wichtigkeit, `compact` schneidet ab):

| Art | Anzahl Desktop / Handy | Farbe | Tempo | Lage |
|---|---|---|---|---|
| Flussglanz (glint) | 3 / 2 | `nm-glint` α .6–.7, #fff α .8 | Dash [26,40] und [14,60] 6 s je 120 px; [6,70] 3,5 s | Flusskurve, ±14 px quer |
| See-Wellen (Dash-Lauf) | 2 / 1 | `nm-glint` α .5–.6 | 6 s rund | Ellipsen rx 70/104, ry 30/48 um (190,690) |
| Wellenringe (ripple) | 2 / 1 | `nm-glint` | wachsen 0,4 → 1,6, verblassen, 2,8 s | See (236,672), (140,716) |
| Glitzern (twinkle) | 6 / 3 | #ffffff Vierzack 6–9 px | α .15↔1, Größe .4↔1,15, 2,2 s | Fluss und See |
| Seeaugen (blink) | 1 / 1 | `nm-eye-moss` | 5,5 s | See (190,690) |
| Nebelbänder (fog) | 4 / 2 | `nm-fog` α .13–.16 | ±50 px, 16 s | siehe Maße |
| Augen in Büschen/Bäumen (blink) | 10 / 4 | `nm-eye-moss` | 5,5 s, versetzt | `scene.eyes` |
| Glühwürmchen (rise) | 24 / 10 | Kern #efffc8, Hof #d8ff9a α .25 | 4,5 s | gleichmäßig, y ≥ 120 |
| Pilzschein (pulse) | 4 / 0 | `nm-shroom` α .22 | α .45↔1, 2,6 s | Pilzgruppen |

  Summe Desktop 56 (≤ 60), Handy 24 (≤ 28).
- **reduced motion** (`prefers-reduced-motion` bzw. `ui.reducedMotion`): alles steht an der Startlage; Augen offen; Glanzlinien ohne Versatz; Nebel ohne Pendel.
- Hindernisse: Fels (8,1) = `rock` s 1,25 mit Moosstrich; Baum (12,12) = `twistedTreeEyes` s 0,44.
- Barrierefreiheit: Gegner und Türme bleiben über Silhouette und Kontur `ink` erkennbar; Leuchtfarben sind Stimmung, keine Information.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/config.js` | `MAPS.meadow.nightmare = { painted, frame, obstacle, motion }` mit den Werten oben. |
| `src/render-painted.js` | Formen in `NM_SHAPES`; Fluss wie heute, See ohne Abfluss; Augen in `scene.eyes`. |
| `src/render-nightmare.js` | Bewegungsarten dieser Karte (aus der Grundlage). |
| `src/hud.js`/`style.css` | Holzpaar `nm-wood-moss-a/-b` über die Bauvorlage `HUD-Albtraum-Holz.md` (anderer designer). |

## Tests
- Bestehende Tests der Karte (`tests/painted.test.js` „Stil 1 (alle Karten): Burg am Ausgang, Fahne an jedem Eingang …“) bleiben im Normalmodus grün.
- Neu `tests/painted.test.js`: Albtraum-SVG von `meadow` enthält `nm-bark`, keine `vignette`-Rects, deterministisch (zwei Aufrufe gleich); keine Deko-Box über bebaubarer Kachel (> 0,3 Kacheln).
- Neu `tests/render.test.js`: Bewegung `meadow` hat 56 Teilchen, mit `compact` 24; reduced motion zeichnet zwei Frames gleich.

## Messbare Abnahme
- Screenshot `#game` bei 1280x800 und 844x390 im Albtraum auf `meadow`: entspricht der Fläche in Palette, Rand-Deko und Fluss und See (See ohne Abfluss); keine Abdunklung zum Rand (20-px-Randstreifen höchstens 10 % dunkler als Bodenmitte).
- Kontrast Wegmitte zu Boden ≥ 1,5:1 (Werte oben).
- Alle Bauplätze wie im Normalmodus bebaubar (e2e: Turm auf (0,0) bzw. erster freier Kachel baubar wie bisher).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
