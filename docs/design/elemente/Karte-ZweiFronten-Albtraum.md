# Karte-ZweiFronten-Albtraum (B-198): Zwei Fronten im Albtraum: Düstere Magie auf Friedhofsgras (Stil C) mit zwei Gruften als Gegner-Eingängen
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Karte-ZweiFronten. Backlog: B-198, Grundlage B-194 (`Karte-Albtraum-Grundlage.md`). Stand: agent/albtraum-design@b13c4d4.

## Maße
- Umrechnung wie in der Grundlage: Fläche-px → Entwurfs-px `(x − 160) · 1,1875`, `(y − 64) · 1,1875`; Fläche-px → Canvas-Spiel-px `(x − 160) · 0,8333 + 50`. Formen unten in **Fläche-px**, Fußpunkt `foot`; im gemalten SVG mit `scale(1.1875 · s)` setzen (s = Maßstab aus der Tabelle).
- Weg, Wasser/Lava, Hindernisse, Fahnen- und Bauplatz-Kacheln: unverändert aus `MAPS.twin` (Wegpunkte oben [-1,1] [3,1] [3,5] [7,5] [7,1] [11,1] [11,5] [15,5] [15,1] [18,1] [18,7] [20,7]; unten gespiegelt mit Zeilen 12/8). Keine Deko auf einer Feldkachel; Überhang höchstens `maxOverhang` 0,3 Kacheln.
- **Gruft-Tore** an den Eingängen, Front zum Betrachter, Stufen enden auf der Wegoberkante, Weg läuft darunter weiter aus dem Bild: oben Fuß Fläche (44, 96), s 0,74 → Spiel (−47, 77) s 0,62; unten Fuß (40, 646), s 0,72 → Spiel (−50, 535) s 0,60. Bezugsbox 120 × 152, Fuß (60, 152). Ohne `ext` ragt die rechte Hälfte in den Canvas-Rand (bis x 0…+3 Spiel-px); kein Teil liegt über Feldkacheln.
- Violetter Lichtschein vor jeder Tür auf dem Weg: Ellipse rx 50, ry 10 Fläche-px, #c58aff α .22, weich.
- Runenkreise am Boden im Rand: Fläche (74,400) s 0,9, (1210,220) s 0,75, (1210,640) s 0,75.
- Runen am Weg: oben 10, unten 8 (Wegkante, abwechselnd), `nm-rune-violet`.

## Tokens
Vollständiger Palettensatz für `MAPS.twin.nightmare.painted` (gleiche Schlüssel wie `PAINTED_PALETTE`):

| Teil | Token | Wert |
|---|---|---|
| Boden 1 | `nm-twin-1` | #66807c |
| Boden 2 | `nm-twin-2` | #4a6468 |
| Boden 3 | `nm-twin-3` | #3a4a62 |
| Flecken dunkel (α .65) | `nm-twin-mottle` | [0.10, 0.14, 0.24] |
| Flecken hell (α .24) | `nm-twin-lit` | [0.62, 0.84, 0.86] |
| Licht oben rechts | `nm-soulflame` | #9fe8ff α .26 |
| Gegenlicht links | `nm-rune-deep` | #8a4aff α .22 |
| Weg groove | `nm-twin-path-groove` | #161a32 |
| Weg Kontur | `ink` | #2b1a10 |
| Weg edge | `nm-twin-path-edge` | #3c3a5a |
| Weg earth | `nm-twin-path-earth` | #a6acc6 |
| Weg mid | `nm-twin-path-mid` | #c8cde2 |
| Wegpunkte | `nm-twin-path-dot` | #f0f0ff / #3c3a5a |
| Tupfen (dotKind `tuft`) | `nm-crypt-grass / -light` | #2e4448 / #8aa6a0, Glühpunkt #c58aff |
| Tanne | `–` | entfällt |
| Baum (kahl, verdreht) | `nm-bark-grey-a → -b, -light` | #5e5e7c → #2a2a40, #8a8ab0 |
| Grabstein | `nm-grave-a → -b` | #aab0c8 → #5a5f78 |
| Gruft | `nm-crypt-a → -b, Dach` | #8a8ea8 → #4a4c66, #3e3a58 |
| Eisenzaun | `nm-iron-dark` | #4a4660, Spitzen #5a5672 |
| Fels | `nm-twin-rock / -light` | #6a7090 / #a6acc8 |
| Klippe | `–` | entfällt |
| Burg | `unverändert` | #e3d2b0, #b9a283, #8a7560 |
| Runen | `nm-rune-violet / -core` | #c58aff / #f0dcff |
| Seelenflamme | `nm-soulflame / -core` | #9fe8ff / #e6f6ff |
| Vignette | `–` | entfällt |
| Gegner-Randlicht | `nm-rim-crypt` | #c8d8ff |
| Augen | `nm-eye-rune` | #e6b8ff |
| HUD-Holz | `nm-wood-iron-a / -b` | #4c3e6e / #1e1836 |
- neu: `nm-twin-1` = #66807c, `nm-twin-2` = #4a6468, `nm-twin-3` = #3a4a62, Friedhofsgras
- neu: `nm-twin-path-groove` = #161a32, `-edge` = #3c3a5a, `-earth` = #a6acc6, `-mid` = #c8cde2, `-dot` = #f0f0ff
- neu: `nm-crypt-grass` = #2e4448, `nm-crypt-grass-light` = #8aa6a0
- neu: `nm-bark-grey-a` = #5e5e7c, `nm-bark-grey-b` = #2a2a40, `nm-grave-a` = #aab0c8, `nm-grave-b` = #5a5f78, `nm-crypt-a` = #8a8ea8, `nm-crypt-b` = #4a4c66, `nm-iron-dark` = #4a4660, `nm-twin-rock` = #6a7090
- neu: `nm-rune-violet` = #c58aff, `nm-rune-core` = #f0dcff, `nm-soulflame` = #9fe8ff, `nm-soulflame-core` = #e6f6ff, `nm-eye-rune` = #e6b8ff, `nm-rim-crypt` = #c8d8ff
- neu: `nm-wood-iron-a` = #4c3e6e, `nm-wood-iron-b` = #1e1836
- Kontrast (gemessen, WCAG-Formel): Wegmitte `nm-twin-path-mid` zu `nm-twin-2` = 4,01:1, Wegfläche `-earth` zu `-2` = 2,82:1 (Pflicht ≥ 1,5:1). HUD-Schrift `cream` auf `nm-wood-iron-a` = 8,55:1.
- Kartenkarte im Startbildschirm: Vorschaubild = Albtraum-Raster dieser Karte (Bauvorlage `Albtraum-Kartenauswahl.md`), Name „Zwei Fronten“. Musik: `MUSIC.nightmare.twin` (vorhanden, unverändert).

## Formen/SVG
Formen für `NM_SHAPES` in `render-painted.js` (Fläche-px, statische Fassung; Animationen laufen in der Bewegungsschicht, nicht im Raster). Verläufe als `<defs>` im SVG mit Präfix `nm-`:
```js
<linearGradient id="nm-grave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#aab0c8"/><stop offset="1" stop-color="#5a5f78"/></linearGradient>
<linearGradient id="nm-crypt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a8ea8"/><stop offset="1" stop-color="#4a4c66"/></linearGradient>
<linearGradient id="nm-bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5e5e7c"/><stop offset="1" stop-color="#2a2a40"/></linearGradient>
<filter id="nm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
```
```js
// Gruft-Tor am Eingang (Tür, Stufen, Lichtschein, Augen in der Tür)
cryptGate: { w: 120, h: 152, foot: [60, 152], svg: (c) => `<ellipse cx="60" cy="128" rx="60" ry="7" fill="rgba(4,4,16,.45)"/><path d="M10 128 V54 H110 V128 Z" fill="url(#nm-crypt)" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M10 74 H110 M10 96 H40 M80 96 H110 M10 112 H34 M86 112 H110" stroke="#2e2c44" stroke-width="2"/><path d="M2 58 L60 14 L118 58 Z" fill="#3e3a58" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M14 52 L60 20" stroke="#6a6688" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M42 128 V92 a18 20 0 0 1 36 0 V128 Z" fill="#120c24" stroke="#2b1a10" stroke-width="3"/><path d="M46 128 V94 a14 16 0 0 1 28 0 V128 Z" fill="#8a4aff" opacity=".45"/><g transform="translate(60,38) scale(1.3)"><path d="M-6 0 Q0 -7 6 0 Q0 7 -6 0 Z M0 -1.5 V1.5" fill="none" stroke="#c58aff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="M-6 0 Q0 -7 6 0 Q0 7 -6 0 Z M0 -1.5 V1.5" fill="none" stroke="#f0dcff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g><path d="M18 128 V60 M102 128 V60" stroke="#2b1a10" stroke-width="7"/><path d="M18 128 V60 M102 128 V60" stroke="#7a7898" stroke-width="3"/><path d="M36 128 H84 L90 136 H30 Z" fill="#4a4866" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 136 H90 L96 144 H24 Z" fill="#3a3854" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="60" cy="150" rx="46" ry="9" fill="#c58aff" opacity=".35" filter="url(#nm-soft)"/><path d="M48 118 L52 112 L56 118 M64 120 L68 114 L72 120" stroke="#e6b8ff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
// Gruft im Rand
crypt: { w: 120, h: 136, foot: [60, 136], svg: (c) => `<ellipse cx="60" cy="128" rx="60" ry="7" fill="rgba(4,4,16,.45)"/><path d="M10 128 V54 H110 V128 Z" fill="url(#nm-crypt)" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M10 74 H110 M10 96 H40 M80 96 H110 M10 112 H34 M86 112 H110" stroke="#2e2c44" stroke-width="2"/><path d="M2 58 L60 14 L118 58 Z" fill="#3e3a58" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M14 52 L60 20" stroke="#6a6688" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M42 128 V92 a18 20 0 0 1 36 0 V128 Z" fill="#120c24" stroke="#2b1a10" stroke-width="3"/><path d="M46 128 V94 a14 16 0 0 1 28 0 V128 Z" fill="#8a4aff" opacity=".45"/><g transform="translate(60,38) scale(1.3)"><path d="M-6 0 Q0 -7 6 0 Q0 7 -6 0 Z M0 -1.5 V1.5" fill="none" stroke="#c58aff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="M-6 0 Q0 -7 6 0 Q0 7 -6 0 Z M0 -1.5 V1.5" fill="none" stroke="#f0dcff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g><path d="M18 128 V60 M102 128 V60" stroke="#2b1a10" stroke-width="7"/><path d="M18 128 V60 M102 128 V60" stroke="#7a7898" stroke-width="3"/>` },
// Grabstein rund mit Rune
grave0: { w: 60, h: 80, foot: [30, 80], svg: (c) => `<ellipse cx="30" cy="78" rx="30" ry="5" fill="rgba(4,4,16,.4)"/><path d="M0 78 Q30 64 60 78 Z" fill="#262842" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 76 V32 Q10 8 30 8 Q50 8 50 32 V76 Z" fill="url(#nm-grave)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M16 70 V34 Q16 18 27 14" stroke="#d8dcec" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/><path d="M42 30 L38 38 L42 44" stroke="#2b1a10" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M10 74 Q16 68 22 74 M40 74 Q46 70 50 74" stroke="#5a7a6a" stroke-width="3" fill="none" stroke-linecap="round"/><g transform="translate(30,46) scale(1.4)"><path d="M-5 -5 L5 5 M5 -5 L-5 5 M0 -7 V-3" fill="none" stroke="#c58aff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="M-5 -5 L5 5 M5 -5 L-5 5 M0 -7 V-3" fill="none" stroke="#f0dcff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>` },
// Grabstein eckig mit Rune
grave1: { w: 60, h: 80, foot: [30, 80], svg: (c) => `<ellipse cx="30" cy="78" rx="30" ry="5" fill="rgba(4,4,16,.4)"/><path d="M0 78 Q30 64 60 78 Z" fill="#262842" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 76 V20 L18 12 H42 L48 20 V76 Z" fill="url(#nm-grave)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M16 70 V34 Q16 18 27 14" stroke="#d8dcec" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/><path d="M42 30 L38 38 L42 44" stroke="#2b1a10" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M10 74 Q16 68 22 74 M40 74 Q46 70 50 74" stroke="#5a7a6a" stroke-width="3" fill="none" stroke-linecap="round"/><g transform="translate(30,46) scale(1.4)"><path d="M-5 6 L-5 -6 L5 0 L-5 6" fill="none" stroke="#c58aff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="M-5 6 L-5 -6 L5 0 L-5 6" fill="none" stroke="#f0dcff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>` },
// Eisenzaun, ein Stab verbogen
ironFence: { w: 120, h: 60, foot: [60, 60], svg: (c) => `<ellipse cx="60" cy="58" rx="58" ry="4" fill="rgba(4,4,16,.4)"/><path d="M4 26 H116 M4 48 H116" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 26 H116 M4 48 H116" fill="none" stroke="#4a4660" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 58 V16" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 58 V16" fill="none" stroke="#4a4660" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 18 L10 6 L14 18 Z" fill="#5a5672" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><path d="M30 58 V16" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 58 V16" fill="none" stroke="#4a4660" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 18 L30 6 L34 18 Z" fill="#5a5672" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><path d="M50 58 V16" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 58 V16" fill="none" stroke="#4a4660" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M46 18 L50 6 L54 18 Z" fill="#5a5672" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><path d="M70 58 V30 Q70 20 78 14" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 58 V30 Q70 20 78 14" fill="none" stroke="#4a4660" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M74 16 L82 8 L82 18 Z" fill="#5a5672" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><path d="M90 58 V16" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M90 58 V16" fill="none" stroke="#4a4660" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M86 18 L90 6 L94 18 Z" fill="#5a5672" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><path d="M110 58 V16" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M110 58 V16" fill="none" stroke="#4a4660" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M106 18 L110 6 L114 18 Z" fill="#5a5672" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/>` },
// Verdrehter kahler Baum (auch Hindernisse 1,6 und 12,12 mit s 0,44)
twistedTree: { w: 120, h: 180, foot: [60, 180], svg: (c) => `<ellipse cx="60" cy="176" rx="46" ry="8" fill="rgba(6,4,14,.4)"/><path d="M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50" fill="none" stroke="#46465e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12" fill="none" stroke="#46465e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50" fill="none" stroke="#46465e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 C12 80 6 74 8 68" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 C12 80 6 74 8 68" fill="none" stroke="#46465e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 76 C110 80 116 74 112 68" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 76 C110 80 116 74 112 68" fill="none" stroke="#46465e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 C48 42 44 34 46 28" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 C48 42 44 34 46 28" fill="none" stroke="#46465e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 64 C70 58 74 50 80 48" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 64 C70 58 74 50 80 48" fill="none" stroke="#46465e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176" fill="none" stroke="#46465e" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 176 C50 160 52 140 50 122 C48 108 50 98 58 92 C66 98 70 108 68 122 C66 140 70 160 80 176 Z" fill="url(#nm-bark)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M54 168 C56 150 55 132 56 116 M60 64 C58 56 60 50 58 46" stroke="#8a8ab0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><ellipse cx="59" cy="138" rx="8.5" ry="11.5" fill="#0c0814" stroke="#2b1a10" stroke-width="2.5"/>` },
// Dunkler Busch
bushDark: { w: 80, h: 50, foot: [40, 50], svg: (c) => `<ellipse cx="40" cy="48" rx="38" ry="5" fill="rgba(6,4,14,.4)"/><path d="M2 48 Q0 30 14 26 Q16 10 32 12 Q42 0 56 10 Q72 8 74 26 Q84 32 78 48 Z" fill="#24283e" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 28 Q20 20 28 22 M44 12 Q52 10 56 14 M66 26 Q70 24 72 28" stroke="#3e4462" stroke-width="3" fill="none" stroke-linecap="round"/>` },
// Farn
fern: { w: 52, h: 36, foot: [26, 36], svg: (c) => `<ellipse cx="26" cy="34" rx="22" ry="3.5" fill="rgba(6,4,14,.35)"/><path d="M26 34 C22 24 12 18 2 16 M26 34 C26 22 24 12 26 2 M26 34 C30 24 40 18 50 16 M26 34 C20 28 12 28 6 30 M26 34 C32 28 40 28 46 30" fill="none" stroke="#2b1a10" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 34 C22 24 12 18 2 16 M26 34 C26 22 24 12 26 2 M26 34 C30 24 40 18 50 16 M26 34 C20 28 12 28 6 30 M26 34 C32 28 40 28 46 30" fill="none" stroke="#2e4448" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 17 l3 -4 M16 20 l2 -5 M44 17 l-3 -4 M36 20 l-2 -5 M25 10 l-4 -2 M27 16 l4 -2" stroke="#8aa6a0" stroke-width="2" stroke-linecap="round"/>` },
// Fels (Hindernis 6,1)
rock: { w: 36, h: 26, foot: [18, 26], svg: (c) => `<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(6,4,14,.4)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#6a7090" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#a6acc8"/>` },
```

**Rand-Deko je Reihe** (`MAPS.twin.nightmare.frame`, Auswahl gleich verteilt, deterministisch aus `mapId`):
- big (Reihe 2–4): `twistedTree` (3 von 4), `crypt` (1 von 4), s 0,9–1,25.
- mid: `grave0/1`, `ironFence`, `twistedTree` (s 0,72–0,9).
- small: `grave0/1`, `bushDark`, `rock`, `fern`.
- edge: `fern`, `rock`, `bushDark`.

## Zustände
- Albtraum / Nacht-Look: Palette und Deko wie oben, **keine Vignette, keine Tönung**; Türme in Originalfarben mit Lichtinsel `nm-warm-light`.
- Normal: unverändert.
- **Bewegung** (`MAPS.twin.nightmare.motion`, Lage einmal je Karte, je Frame nur Zeitversatz; Reihenfolge = Wichtigkeit, `compact` schneidet ab):

| Art | Anzahl Desktop / Handy | Farbe | Tempo | Lage |
|---|---|---|---|---|
| Gruft-Tür (pulse) | 2 / 2 | #8a4aff α .45 + Lichtschein `nm-rune-violet` | α .45↔1, 2,6 s | beide Tore |
| Augen in den Türen (blink) | 2 / 2 | `nm-eye-rune` | 5,5 s | Tore |
| Seelenflammen (bob) | 9 / 5 | `nm-soulflame`, Kern `-core` | ±9 px, 3,2 s | Rand: (24,330) (130,560) (1150,330) (1262,480) (1150,720) (400,770) (960,772) (24,760) (1240,120) Fläche-px |
| Runen am Weg (pulse) | 18 / 8 | `nm-rune-violet` | α .45↔1, 2,6 s | siehe Maße |
| Runenkreise (dash-Lauf) | 3 / 1 | `nm-rune-violet` | Dash [8,7] 6 s | Rand |
| Nebel (fog) | 3 / 2 | #a8c0ff α .08–.12 | ±50 px, 16 s | Feld (640,424) rx 440, (520,200) rx 260, (760,640) rx 260 |
| Glitzern (twinkle) | 14 / 6 | #e6f6ff Vierzack | α .45↔1, 2,6 s | gleichmäßig |

  Summe Desktop 51 (≤ 60), Handy 26 (≤ 28).
- **reduced motion** (`prefers-reduced-motion` bzw. `ui.reducedMotion`): alles steht an der Startlage; Augen offen; Glanzlinien ohne Versatz; Nebel ohne Pendel.
- Hindernisse: Bäume (1,6) und (12,12) = `twistedTree` s 0,44; Fels (6,1) = `rock` s 1,25.
- Barrierefreiheit: Gegner und Türme bleiben über Silhouette und Kontur `ink` erkennbar; Leuchtfarben sind Stimmung, keine Information.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/config.js` | `MAPS.twin.nightmare = { painted, frame, obstacle, motion }` mit den Werten oben. |
| `src/render-painted.js` | Formen in `NM_SHAPES`; Gruft-Tore als Landmarke wie Fahne/Burg (`scene.gates`, Lage aus den Eingängen von Weg 0 und Weg 1). |
| `src/render-nightmare.js` | Bewegungsarten dieser Karte (aus der Grundlage). |
| `src/hud.js`/`style.css` | Holzpaar `nm-wood-iron-a/-b` über die Bauvorlage `HUD-Albtraum-Holz.md` (anderer designer). |

## Tests
- Bestehende Tests der Karte (`tests/painted.test.js` „Stil 1 (alle Karten): Burg am Ausgang, Fahne an jedem Eingang …“) bleiben im Normalmodus grün.
- Neu `tests/painted.test.js`: Albtraum-SVG von `twin` enthält `nm-crypt`, keine `vignette`-Rects, deterministisch (zwei Aufrufe gleich); keine Deko-Box über bebaubarer Kachel (> 0,3 Kacheln).
- Neu `tests/render.test.js`: Bewegung `twin` hat 51 Teilchen, mit `compact` 26; reduced motion zeichnet zwei Frames gleich.

## Messbare Abnahme
- Screenshot `#game` bei 1280x800 und 844x390 im Albtraum auf `twin`: entspricht der Fläche in Palette, Rand-Deko und Gruft-Toren an beiden Eingängen; keine Abdunklung zum Rand (20-px-Randstreifen höchstens 10 % dunkler als Bodenmitte).
- Kontrast Wegmitte zu Boden ≥ 1,5:1 (Werte oben).
- Alle Bauplätze wie im Normalmodus bebaubar (e2e: Turm auf (0,0) bzw. erster freier Kachel baubar wie bisher).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
