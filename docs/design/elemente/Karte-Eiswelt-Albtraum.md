# Karte-Eiswelt-Albtraum (B-196): Eiswelt im Albtraum: Düstere Magie kalt (Stil C) in Dämmerblau/Violett mit gefrorenem See, offenem Wasser mit Schollen, Frosttannen, eingefrorenen Dingen, Runensteinen und belebtem Schnee
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Karte-Eiswelt. Backlog: B-196, Grundlage B-194 (`Karte-Albtraum-Grundlage.md`). Stand: agent/albtraum-design@b13c4d4.

## Maße
- Umrechnung wie in der Grundlage: Fläche-px → Entwurfs-px `(x − 160) · 1,1875`, `(y − 64) · 1,1875`; Fläche-px → Canvas-Spiel-px `(x − 160) · 0,8333 + 50`. Formen unten in **Fläche-px**, Fußpunkt `foot`; im gemalten SVG mit `scale(1.1875 · s)` setzen (s = Maßstab aus der Tabelle).
- Weg, Wasser/Lava, Hindernisse, Fahnen- und Bauplatz-Kacheln: unverändert aus `MAPS.ice` (Wegpunkte [-1,12] [4,12] [4,7] [9,7] [9,1] [14,1] [14,9] [17,9] [17,4] [20,4]). Keine Deko auf einer Feldkachel; Überhang höchstens `maxOverhang` 0,3 Kacheln.
- Grundton dunkler und kälter als die normale Eiswelt (Dämmerblau/Violett); Weg hell (Eis), dadurch hoher Kontrast.
- **Schneewall am Weg** (weiche Kante, unter dem Weg): Wegpolylinie mit Strich 96 Fläche-px (80 Spiel-px) `nm-snow-ice` α .42, weich σ 4; darunter Schatten 84 px `nm-ice-shadow` α .25, 6 px nach unten versetzt. Ergibt einen hellen Rand von ~10 Spiel-px neben dem Weg, nur Textur.
- **Bodentextur im Feld** (nur freie Kacheln, flach): 26 Schneewehen (Ellipse rx 36–96, ry 9–18 Fläche-px, `nm-snow-ice` α .42 weich, Schatten `nm-ice-shadow` α .32 7 px tiefer); Eisrisse auf 13 % der freien Kacheln (3 Striche ≤ 14 px, Schatten `nm-ice-shadow` 2,6 + Glanz #dff4ff 1,1); Raureif-Blumen, Kristallsplitter (Rauten 5 px #bff0ff α .7 ohne Kontur), Schneebüschel; Dichte 210 Versuche je Karte.
- **Fußspuren** am Wegrand: Wegstrecken d 1,2–9,5, 21,5–27,5, 35,5–41; alle 0,42 Kacheln ein Abdruck (Ellipse 3 × 4,6 Fläche-px, `nm-ice-shadow` α .38), 38 ± 5 px neben der Wegmitte, abwechselnd links/rechts.
- **Gefrorener See** links (Rand, läuft mit einem gefrorenen Bach oben aus dem Bild), Entwurfs-px: See `M-296.9 123.5 C-213.7 97.4 -80.7 109.3 -35.6 154.4 C-9.5 185.3 -21.4 270.8 -68.9 301.6 C-118.7 332.5 -213.7 325.4 -296.9 306.4 Z`, Bach `M-106.9 133 C-90.2 66.5 -135.4 7.1 -114 -123.5` (Breite 32 Fläche-px). Ufer `nm-snow-ice`, Kontur `ink`, Eis `nm-froz-a` → `-b` → `-c`, Risse weiß 2 px, Spiegelglanz 3 Schrägstriche weiß α .55.
- **Offenes Wasser mit Schollen** rechts unten (läuft rechts und unten aus dem Bild): `M1413.1 574.8 C1315.8 596.1 1239.8 641.3 1249.3 733.9 C1258.8 807.5 1213.6 864.5 1201.8 933.4`; Schichten: Schneeufer 70, `ink` 54, Eisrand `nm-froz-b` 48, Wasser `nm-ice-water` 30 (Fläche-px). 4 Schollen (Sechseck ~22 × 13) auf dem Wasser.
- **Eingefrorene Dinge** (Rand, Fläche-px → Spiel-px): Schwert (108,440) s .85 → (−2,363); Helm (1212,484) s .8 → (927,400); Knochen (330,798) s .62 → (192,662); Schwert (930,796) s .6 → (692,660); Knochen (1250,120) s .7 → (958,97). Unterkanten im Rand.
- Eis-Obelisk am Eingang wie bisher: Fuß (44, 630) → Spiel (−51, 522), s 0,8.
- Rand **gemischt und unregelmäßig**: fünf Spalten je Seite (x 0, 32, 72, 108, 140 Fläche-px) mit Versatz ±20 px, Schrittweite ±30 %; oben/unten jeder dritte Platz frei, Größen 0,55–1,15 gemischt. Keine durchgehende Reihe gleicher Formen.
- Turmwahl: keine zusätzliche Reichweitenanzeige auf der Fläche; im Spiel gilt `RANGE_STYLE`.

## Tokens
Vollständiger Palettensatz für `MAPS.ice.nightmare.painted` (gleiche Schlüssel wie `PAINTED_PALETTE`):

| Teil | Token | Wert |
|---|---|---|
| Boden 1 | `nm-ice-1` | #6a74aa |
| Boden 2 | `nm-ice-2` | #454e86 |
| Boden 3 | `nm-ice-3` | #323a6e |
| Flecken dunkel (α .55) | `nm-ice-mottle` | [0.14, 0.14, 0.34] |
| Flecken hell / Schnee (α .3) | `nm-ice-lit` | [0.86, 0.92, 1.00] |
| Licht oben links | `nm-frost-light` | #bff0ff α .22 |
| Gegenlicht unten rechts | `nm-rune-deep` | #8a4aff α .20 |
| Weg groove | `nm-ice-path-groove` | #1c2244 |
| Weg Kontur | `ink` | #2b1a10 |
| Weg edge | `nm-ice-path-edge` | #3a4a7a |
| Weg earth | `nm-ice-path-earth` | #a8c2e2 |
| Weg mid | `nm-ice-path-mid` | #d6e6f6 |
| Wegpunkte | `nm-ice-path-dot` | #ffffff / #3a4a7a |
| Tupfen (dotKind `frost`) | `nm-snow / nm-splinter` | #e6f2ff Raureif, #bff0ff Splitter, #ffffff Glitzern |
| Schatten (Wehen, Spuren) | `nm-ice-shadow` | #1c2050 |
| Tanne (4) | `nm-fir-a/-b, nm-snow, nm-icicle` | #1e2e4a, #3a5a78, #eef4ff, #bfe8ff |
| Laubbaum | `–` | entfällt (nur Tannen) |
| Grab/Obelisk/Runenstein | `nm-grave-ice-a → -b` | #b8c4dc → #6a7494, Schneekappe #f2f8ff |
| Fels | `nm-ice-rock / -light` | #6a7aa0 / #b8c8e6, Kappe #f2f8ff |
| Eisblock (Relikte) | `nm-froz-block` | #cfeaf8, Glanz #e8f8ff α .45 |
| Gefrorenes Wasser | `nm-froz-a/-b/-c` | #d8f0ff / #9cc8ea / #6a98c8 |
| Offenes Wasser | `nm-ice-water` | #1e3a6a, Glanz #9fe8ff |
| Klippe | `–` | entfällt |
| Burg | `unverändert` | #e3d2b0, #b9a283, #8a7560 |
| Runen/Kristall | `nm-frost-rune` | #7fe0ff, Kern #ffffff |
| Augen | `nm-eye-frost` | #9fe8ff |
| Vignette | `–` | entfällt |
| Gegner-Randlicht | `nm-rim-ice` | #e6f6ff |
| HUD-Holz | `nm-wood-ice-a / -b` | #4a5c8a / #1c2648 (Eiszapfen #dff4ff unter der Leiste) |
- neu: `nm-ice-1` = #6a74aa, `nm-ice-2` = #454e86, `nm-ice-3` = #323a6e, Boden Dämmerblau
- neu: `nm-ice-path-groove` = #1c2244, `-edge` = #3a4a7a, `-earth` = #a8c2e2, `-mid` = #d6e6f6, `-dot` = #ffffff, heller Eisweg
- neu: `nm-ice-shadow` = #1c2050, `nm-snow-ice` = #eef4ff, `nm-splinter` = #bff0ff, `nm-frost-light` = #bff0ff
- neu: `nm-fir-a` = #1e2e4a, `nm-fir-b` = #3a5a78, `nm-icicle-map` = #bfe8ff, `nm-grave-ice-a` = #b8c4dc, `nm-grave-ice-b` = #6a7494, `nm-ice-rock` = #6a7aa0, `nm-ice-rock-light` = #b8c8e6
- neu: `nm-froz-a` = #d8f0ff, `nm-froz-b` = #9cc8ea, `nm-froz-c` = #6a98c8, `nm-froz-block` = #cfeaf8, `nm-ice-water` = #1e3a6a
- neu: `nm-frost-rune` = #7fe0ff, `nm-eye-frost` = #9fe8ff, `nm-rim-ice` = #e6f6ff, `nm-rune-deep` = #8a4aff
- neu: `nm-wood-ice-a` = #4a5c8a, `nm-wood-ice-b` = #1c2648
- Kontrast (gemessen, WCAG-Formel): Wegmitte `nm-ice-path-mid` zu `nm-ice-2` = 6,14:1, Wegfläche `-earth` zu `-2` = 4,27:1 (Pflicht ≥ 1,5:1). HUD-Schrift `cream` auf `nm-wood-ice-a` = 5,96:1.
- Kartenkarte im Startbildschirm: Vorschaubild = Albtraum-Raster dieser Karte (Bauvorlage `Albtraum-Kartenauswahl.md`), Name „Eiswelt“. Musik: `MUSIC.nightmare.ice` (vorhanden, unverändert).

## Formen/SVG
Formen für `NM_SHAPES` in `render-painted.js` (Fläche-px, statische Fassung; Animationen laufen in der Bewegungsschicht, nicht im Raster). Verläufe als `<defs>` im SVG mit Präfix `nm-`:
```js
<linearGradient id="nm-fir" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a5a78"/><stop offset="1" stop-color="#1e2e4a"/></linearGradient>
<linearGradient id="nm-grave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8c4dc"/><stop offset="1" stop-color="#6a7494"/></linearGradient>
<linearGradient id="nm-froz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8f0ff"/><stop offset=".5" stop-color="#9cc8ea"/><stop offset="1" stop-color="#6a98c8"/></linearGradient>
<linearGradient id="nm-ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset=".5" stop-color="#8fd8f2"/><stop offset="1" stop-color="#3b8fcb"/></linearGradient>
<filter id="nm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
```
```js
// Frosttanne mit Schneehauben und Eiszapfen; Augen optional (cyan)
iceFir: { w: 70, h: 132, foot: [35, 132], svg: (c) => `<ellipse cx="35" cy="128" rx="32" ry="6" fill="rgba(6,8,24,.35)"/><path d="M28 128 V104 H42 V128 Z" fill="#3a3046" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M2 108 L22 74 H14 L28 44 H20 L35 6 L50 44 H42 L56 74 H48 L68 108 Z" fill="url(#nm-fir)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M35 6 L44 28 Q39 32 35 27 Q31 32 26 28 Z M20 44 Q28 50 35 45 Q42 51 50 44 L45 36 Q40 40 35 36 Q30 40 25 36 Z M14 74 Q24 81 35 75 Q46 81 56 74 L50 64 Q42 69 35 65 Q28 69 20 64 Z M2 108 Q18 116 35 109 Q52 116 68 108 L60 96 Q48 102 35 98 Q22 102 10 96 Z" fill="#eef4ff" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 50 l2 7 l2 -6 M44 49 l2 6 l2 -6 M18 80 l2 7 l2 -7 M48 80 l2 6 l2 -6 M10 113 l2 6 l2 -6 M56 113 l2 7 l2 -7" fill="#bfe8ff" stroke="#2b1a10" stroke-width="1.4" stroke-linejoin="round"/><circle cx="35" cy="88" r="10" fill="#9fe8ff" opacity=".25"/><path d="M28 86 L33 88 L31 91 Z M42 86 L37 88 L39 91 Z" fill="#9fe8ff"/>` },
// Kleine Frosttanne (Unterholz, Rand oben/unten)
iceFirSmall: { w: 40, h: 60, foot: [20, 60], svg: (c) => `<ellipse cx="20" cy="56" rx="18" ry="4" fill="rgba(6,8,24,.3)"/><path d="M17 56 V48 H23 V56 Z" fill="#3a3046" stroke="#2b1a10" stroke-width="2.4"/><path d="M2 50 L13 30 H9 L20 4 L31 30 H27 L38 50 Z" fill="url(#nm-fir)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M20 4 L26 18 Q23 21 20 18 Q17 21 14 18 Z M9 30 Q15 35 20 31 Q25 35 31 30 L28 24 Q24 27 20 24 Q16 27 12 24 Z M2 50 Q11 55 20 51 Q29 55 38 50 L33 43 Q26 47 20 44 Q14 47 7 43 Z" fill="#eef4ff" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/>` },
// Eiskristall-Gruppe mit Rune (Glitzern: Sterne bei (30,6) und (48,34) in der Bewegungsschicht)
iceCrystal: { w: 60, h: 60, foot: [30, 60], svg: (c) => `<ellipse cx="30" cy="56" rx="26" ry="4" fill="rgba(6,8,24,.35)"/><ellipse cx="30" cy="40" rx="26" ry="20" fill="#7fe0ff" opacity=".25" filter="url(#nm-soft)"/><path d="M8 56 L4 34 L14 26 L18 56 Z" fill="url(#nm-ice)" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 56 L46 30 L56 38 L52 56 Z" fill="url(#nm-ice)" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 56 L22 14 L30 2 L38 14 L42 56 Z" fill="url(#nm-ice)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M28 8 L25 50" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/><g transform="translate(32,34) scale(0.9)"><path d="M0 -6 V6 M-5 -2 L0 -6 L5 -2" fill="none" stroke="#7fe0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="M0 -6 V6 M-5 -2 L0 -6 L5 -2" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>` },
// Schneehügel
snowMound: { w: 68, h: 30, foot: [34, 30], svg: (c) => `<ellipse cx="34" cy="26" rx="32" ry="4" fill="rgba(6,8,24,.3)"/><path d="M2 26 Q10 10 24 12 Q34 2 46 10 Q62 10 66 26 Z" fill="#eef4ff" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 20 Q22 14 30 16 M42 12 Q50 12 56 18" stroke="#b8c8e6" stroke-width="2.6" fill="none" stroke-linecap="round"/>` },
// Runenstein mit Schneekappe
runeStone: { w: 52, h: 50, foot: [26, 50], svg: (c) => `<ellipse cx="26" cy="46" rx="24" ry="4.5" fill="rgba(6,8,24,.35)"/><path d="M6 46 L8 20 Q10 8 26 6 Q42 8 44 20 L46 46 Z" fill="url(#nm-grave)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M8 20 Q10 8 26 6 Q42 8 44 20 Q38 15 32 19 Q26 13 19 18 Q13 15 8 20 Z" fill="#f2f8ff" stroke="#2b1a10" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 42 L13 24" stroke="#d8e4f6" stroke-width="2.4" stroke-linecap="round" opacity=".6"/><g transform="translate(26,31) scale(1)"><path d="M-5 6 L-5 -6 L5 0 L-5 6" fill="none" stroke="#7fe0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="M-5 6 L-5 -6 L5 0 L-5 6" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>` },
// Grabstein rund mit Schnee und Frostrune
graveSnow0: { w: 60, h: 80, foot: [30, 80], svg: (c) => `<ellipse cx="30" cy="78" rx="30" ry="5" fill="rgba(4,4,16,.4)"/><path d="M0 78 Q30 64 60 78 Z" fill="#dfe8f8" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 76 V32 Q10 8 30 8 Q50 8 50 32 V76 Z" fill="url(#nm-grave)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M10 32 Q10 8 30 8 Q50 8 50 32 Q44 26 38 30 Q30 24 22 30 Q16 26 10 32 Z" fill="#f2f8ff" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 70 V34 Q16 18 27 14" stroke="#d8dcec" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/><path d="M42 30 L38 38 L42 44" stroke="#2b1a10" stroke-width="2" fill="none" stroke-linecap="round"/><g transform="translate(30,46) scale(1.4)"><path d="M-5 -5 L5 5 M5 -5 L-5 5 M0 -7 V-3" fill="none" stroke="#7fe0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="M-5 -5 L5 5 M5 -5 L-5 5 M0 -7 V-3" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>` },
// Grabstein eckig mit Schnee
graveSnow1: { w: 60, h: 80, foot: [30, 80], svg: (c) => `<ellipse cx="30" cy="78" rx="30" ry="5" fill="rgba(4,4,16,.4)"/><path d="M0 78 Q30 64 60 78 Z" fill="#dfe8f8" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 76 V20 L18 12 H42 L48 20 V76 Z" fill="url(#nm-grave)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M12 20 L18 12 H42 L48 20 Q42 26 34 22 Q26 27 20 22 Q16 25 12 20 Z" fill="#f2f8ff" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 70 V34 Q16 18 27 14" stroke="#d8dcec" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/><path d="M42 30 L38 38 L42 44" stroke="#2b1a10" stroke-width="2" fill="none" stroke-linecap="round"/><g transform="translate(30,46) scale(1.4)"><path d="M-5 6 L-5 -6 L5 0 L-5 6" fill="none" stroke="#7fe0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="M-5 6 L-5 -6 L5 0 L-5 6" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>` },
// Eis-Obelisk mit zwei Runen
obelisk: { w: 48, h: 104, foot: [24, 104], svg: (c) => `<ellipse cx="24" cy="100" rx="24" ry="5" fill="rgba(6,8,24,.4)"/><ellipse cx="24" cy="60" rx="26" ry="44" fill="#7fe0ff" opacity=".2" filter="url(#nm-soft)"/><path d="M8 100 L12 22 L24 4 L36 22 L40 100 Z" fill="url(#nm-grave)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M12 22 L24 4 L36 22 Q30 28 24 24 Q18 28 12 22 Z" fill="#f2f8ff" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M15 94 L17 30" stroke="#d8e4f6" stroke-width="2.6" stroke-linecap="round" opacity=".6"/><g transform="translate(24,44) scale(1.1)"><path d="M-5 -6 L0 6 L5 -6" fill="none" stroke="#7fe0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="M-5 -6 L0 6 L5 -6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(24,68) scale(1.1)"><path d="M-5 6 L-5 -6 L5 0 L-5 6" fill="none" stroke="#7fe0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="M-5 6 L-5 -6 L5 0 L-5 6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></g>` },
// Schwert im Eisblock
relicSword: { w: 60, h: 56, foot: [30, 56], svg: (c) => `<ellipse cx="30" cy="52" rx="30" ry="5" fill="rgba(6,8,24,.3)"/><path d="M4 52 L2 18 Q2 6 14 4 L46 2 Q58 4 58 16 L56 52 Z" fill="#cfeaf8" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><g opacity=".75"><path d="M14 42 L46 14" stroke="#8a96a8" stroke-width="5" stroke-linecap="round"/><path d="M14 42 L46 14" stroke="#c9d2de" stroke-width="2" stroke-linecap="round"/><path d="M16 32 L24 40" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/><circle cx="12" cy="44" r="3" fill="#c9a13f"/></g><path d="M4 52 L2 18 Q2 6 14 4 L46 2 Q58 4 58 16 L56 52 Z" fill="#e8f8ff" opacity=".45"/><path d="M10 12 L22 6 M8 22 L14 18" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><path d="M36 30 L42 40 L38 48 M42 40 L50 42" stroke="#7aa6c8" stroke-width="1.4" fill="none"/><path d="M2 18 Q2 6 14 4 L46 2 Q58 4 58 16 Q48 12 40 16 Q30 10 20 15 Q10 11 2 18 Z" fill="#f6fbff" stroke="#2b1a10" stroke-width="2.4" stroke-linejoin="round"/><g style="transform-origin:48px 10px;transform-box:view-box"><path d="M48 4.6 L49.17 8.83 L53.4 10 L49.17 11.17 L48 15.4 L46.83 11.17 L42.6 10 L46.83 8.83 Z" fill="#ffffff"/></g>` },
// Helm im Eisblock
relicHelm: { w: 60, h: 56, foot: [30, 56], svg: (c) => `<ellipse cx="30" cy="52" rx="30" ry="5" fill="rgba(6,8,24,.3)"/><path d="M4 52 L2 18 Q2 6 14 4 L46 2 Q58 4 58 16 L56 52 Z" fill="#cfeaf8" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><g opacity=".75"><path d="M16 40 Q16 18 30 16 Q44 18 44 40 Z" fill="#8a96a8" stroke="#4a5468" stroke-width="2"/><path d="M28 16 V40 M20 30 H40" stroke="#4a5468" stroke-width="2"/><path d="M30 16 Q34 6 42 8" stroke="#a8463a" stroke-width="3" fill="none" stroke-linecap="round"/></g><path d="M4 52 L2 18 Q2 6 14 4 L46 2 Q58 4 58 16 L56 52 Z" fill="#e8f8ff" opacity=".45"/><path d="M10 12 L22 6 M8 22 L14 18" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><path d="M36 30 L42 40 L38 48 M42 40 L50 42" stroke="#7aa6c8" stroke-width="1.4" fill="none"/><path d="M2 18 Q2 6 14 4 L46 2 Q58 4 58 16 Q48 12 40 16 Q30 10 20 15 Q10 11 2 18 Z" fill="#f6fbff" stroke="#2b1a10" stroke-width="2.4" stroke-linejoin="round"/><g style="transform-origin:48px 10px;transform-box:view-box"><path d="M48 4.6 L49.17 8.83 L53.4 10 L49.17 11.17 L48 15.4 L46.83 11.17 L42.6 10 L46.83 8.83 Z" fill="#ffffff"/></g>` },
// Knochen im Eisblock
relicBones: { w: 60, h: 56, foot: [30, 56], svg: (c) => `<ellipse cx="30" cy="52" rx="30" ry="5" fill="rgba(6,8,24,.3)"/><path d="M4 52 L2 18 Q2 6 14 4 L46 2 Q58 4 58 16 L56 52 Z" fill="#cfeaf8" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><g opacity=".75"><path d="M14 36 L44 24" stroke="#e6dcc6" stroke-width="5" stroke-linecap="round"/><circle cx="13" cy="33" r="3.4" fill="#e6dcc6"/><circle cx="15" cy="39" r="3.4" fill="#e6dcc6"/><circle cx="45" cy="21" r="3.4" fill="#e6dcc6"/><circle cx="47" cy="27" r="3.4" fill="#e6dcc6"/></g><path d="M4 52 L2 18 Q2 6 14 4 L46 2 Q58 4 58 16 L56 52 Z" fill="#e8f8ff" opacity=".45"/><path d="M10 12 L22 6 M8 22 L14 18" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><path d="M36 30 L42 40 L38 48 M42 40 L50 42" stroke="#7aa6c8" stroke-width="1.4" fill="none"/><path d="M2 18 Q2 6 14 4 L46 2 Q58 4 58 16 Q48 12 40 16 Q30 10 20 15 Q10 11 2 18 Z" fill="#f6fbff" stroke="#2b1a10" stroke-width="2.4" stroke-linejoin="round"/><g style="transform-origin:48px 10px;transform-box:view-box"><path d="M48 4.6 L49.17 8.83 L53.4 10 L49.17 11.17 L48 15.4 L46.83 11.17 L42.6 10 L46.83 8.83 Z" fill="#ffffff"/></g>` },
// Fels mit Schneekappe (auch Hindernis 2,2)
rockSnow: { w: 36, h: 26, foot: [18, 26], svg: (c) => `<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(6,4,14,.4)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#6a7aa0" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#b8c8e6"/><path d="M5 12 L16 4 L28 7 L24 11 L16 8 L8 14 Z" fill="#f2f8ff" stroke="#2b1a10" stroke-width="1.6" stroke-linejoin="round"/>` },
```

Glitzerstern (Bewegungsschicht, Canvas): Vierzack mit Radius 6·s und Taille 1,3·s, Füllung #ffffff:
```js
const star = (s) => new Path2D(`M0 ${-6*s} L${1.3*s} ${-1.3*s} L${6*s} 0 L${1.3*s} ${1.3*s} L0 ${6*s} L${-1.3*s} ${1.3*s} L${-6*s} 0 L${-1.3*s} ${-1.3*s} Z`);
```

**Rand-Deko je Reihe** (`MAPS.ice.nightmare.frame`, Auswahl gleich verteilt, deterministisch aus `mapId`):
- big (Spalten x 0 und 32): `iceFir` (s 0,62–1,3; jede vierte mit Augen), `obelisk`.
- mid (x 72 und 108): `iceFir`, `iceFirSmall`, `graveSnow0/1`, `runeStone`, `iceCrystal`.
- small (x 140): `iceCrystal`, `snowMound`, `runeStone`, `iceFirSmall`, `rockSnow`, `graveSnow*`.
- edge (oben/unten, jeder dritte Platz frei, s 0,55–1,15): `snowMound`, `iceFirSmall`, `rockSnow`, `iceCrystal`, `runeStone`.
- Landmarken fest: Relikte, Obelisk, gefrorener See mit Bach, offenes Wasser (siehe Maße).

## Zustände
- Albtraum / Nacht-Look: Palette und Deko wie oben, **keine Vignette, keine Tönung**; Türme in Originalfarben mit Lichtinsel `nm-warm-light`.
- Normal: unverändert.
- **Bewegung** (`MAPS.ice.nightmare.motion`, Lage einmal je Karte, je Frame nur Zeitversatz; Reihenfolge = Wichtigkeit, `compact` schneidet ab):

| Art | Anzahl Desktop / Handy | Farbe | Tempo | Lage |
|---|---|---|---|---|
| Schnee nah (fall) | 10 / 6 | #ffffff α .95, r 2,4–4 | 5 s, 120 px, Drift 30 | gleichmäßig |
| Schnee fern (fall) | 18 / 8 | #ffffff α .55, r 0,9–1,8 | 11 s, 120 px, Drift 30 | gleichmäßig |
| Glitzern (twinkle) | 10 / 4 | #ffffff Vierzack | α .15↔1, Größe .4↔1,15, 2,2 s | Kristalle, Relikte, gefrorener See, Feld |
| Runen am Weg (pulse) | 8 / 4 | `nm-frost-rune` | α .45↔1, 2,6 s | Wegkante, 14 Lagen, jede zweite pulsiert |
| Atemhauch-Nebel (fog) | 5 / 2 | #ffffff α .2, ry 10 | ±50 px, 16 s | bodennah: (300,330) (700,250) (900,520) (470,600) (620,420) Fläche-px |
| Schollen (bob) | 4 / 2 | #f6fbff | ±9 px, 3,2 s | offenes Wasser |
| Wasserglanz (glint) | 1 / 1 | #9fe8ff | Dash [14,34], 6 s | offenes Wasser |
| Runenkreise (dash-Lauf) | 2 / 1 | `nm-frost-rune` | Dash [8,7] 6 s | Rand |
| Augen in Tannen (blink) | 2 / 0 | `nm-eye-frost` | 5,5 s | `scene.eyes` |

  Summe Desktop 60 (≤ 60), Handy 28 (≤ 28).
- **reduced motion** (`prefers-reduced-motion` bzw. `ui.reducedMotion`): alles steht an der Startlage; Augen offen; Glanzlinien ohne Versatz; Nebel ohne Pendel.
- Hindernisse: Fels (2,2) = `rockSnow` s 1,25; Tannen (9,12) und (16,12) = `iceFir` ohne Augen, s 0,52.
- Barrierefreiheit: Gegner und Türme bleiben über Silhouette und Kontur `ink` erkennbar; Leuchtfarben sind Stimmung, keine Information.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/config.js` | `MAPS.ice.nightmare = { painted, frame, obstacle, motion }` mit den Werten oben. |
| `src/render-painted.js` | Formen in `NM_SHAPES`; Wehen, Schneewall, Eisrisse, Fußspuren, gefrorener See, offenes Wasser und Relikte im Raster (`nightmare.extras`); Glitzern, Schnee, Nebel, Schollen in der Bewegungsschicht. |
| `src/render-nightmare.js` | Bewegungsarten dieser Karte (aus der Grundlage). |
| `src/hud.js`/`style.css` | Holzpaar `nm-wood-ice-a/-b` über die Bauvorlage `HUD-Albtraum-Holz.md` (anderer designer). |

## Tests
- Bestehende Tests der Karte (`tests/painted.test.js` „Stil 1 (alle Karten): Burg am Ausgang, Fahne an jedem Eingang …“) bleiben im Normalmodus grün.
- Neu `tests/painted.test.js`: Albtraum-SVG von `ice` enthält `nm-froz`, keine `vignette`-Rects, deterministisch (zwei Aufrufe gleich); keine Deko-Box über bebaubarer Kachel (> 0,3 Kacheln).
- Neu `tests/render.test.js`: Bewegung `ice` hat 60 Teilchen, mit `compact` 28; reduced motion zeichnet zwei Frames gleich.

## Messbare Abnahme
- Screenshot `#game` bei 1280x800 und 844x390 im Albtraum auf `ice`: entspricht der Fläche in Palette, Rand-Deko und hellem Eisweg mit Schneewall auf dämmerblauem Boden, gefrorenem See links und offenem Wasser rechts unten; keine Abdunklung zum Rand (20-px-Randstreifen höchstens 10 % dunkler als Bodenmitte).
- Kontrast Wegmitte zu Boden ≥ 1,5:1 (Werte oben).
- Alle Bauplätze wie im Normalmodus bebaubar (e2e: Turm auf (0,0) bzw. erster freier Kachel baubar wie bisher).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
