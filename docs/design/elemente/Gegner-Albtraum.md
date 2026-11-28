# Gegner-Albtraum (Runde 2): Albtraum-Look für alle 13 Gegnertypen und Elite, eine Regel, Farben je Kartenstil A/B/C
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Gegner. Backlog: B-190. Stand: agent/albtraum-design@b13c4d4.

Nur Optik: Werte, Hitboxen, Größen, Lebensbalken und Zielwahl bleiben. Kein dunkler Rand, keine Vignette um Gegner.

## Maße
- Figuren, Bezugsboxen (`w × h`), Fußpunkt (unten mittig) und Maßstab (`k = TILE/57`, `bossScale`, `necroScale`) wie heute in `src/figures.js` (`ENEMY_SVG`). Die Silhouette ändert sich nicht.
- Zusätze liegen in derselben Bezugsbox und werden mit in das Sprite gemalt (kein Zeichnen pro Frame):
  - Randlicht: Kreis Mitte (`w/2`, `0,52·h`), r = `0,58·max(w, h)`, radialer Verlauf `nm-rim-<stil>` (siehe Formen).
  - Fußaura: Ellipse Mitte (`w/2`, `h − 3`), rx `0,44·w`, ry `0,12·w`, Augenfarbe α 0,5.
  - Augen: je Auge Schein, Höhle, Schlitz, Glanzpunkt, Braue (Formel unten), Lage aus Tabelle **Augen**.
  - Dornen (nur `tank`, `boss`): Pfad `SPIKES` in der 96 × 104-Box, hinter dem Körper.
- Sprite-Box wächst um das Randlicht: `pad(boxOf(...))` wie bei `withIce`.
- 1366x768, 844x390, 390x844: keine Abweichung, Maßstab über `k` wie heute.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink` | #2b1a10 (bleibt) |
| Körper-Umfärbung Stil A | `nm-shade-a` | #2a3448 |
| Körper-Umfärbung Stil B | `nm-shade-b` | #30201c |
| Körper-Umfärbung Stil C | `nm-shade-c` | #252d4c |
| Augen, Aura Stil A | `nm-eye-moss` | #d8ff5a |
| Augen, Aura Stil B | `nm-eye-ember` | #ffb02a |
| Augen, Aura Stil C | `nm-eye-rune` | #e6b8ff |
| Randlicht A / B / C | `nm-rim-a` / `nm-rim-b` / `nm-rim-c` | #e8f4ff / #ffd0a0 / #c8d8ff |
| Augenhöhle | `ink` | #2b1a10 |
| Glanzpunkt im Auge | weiß α 0,9 | #ffffff |
| Dornen | `bone` | #e8dcc0 |
| Elite-Ring außen | `elite-ring` | rgba(242,193,78,0.9) (bleibt) |
| Elite-Ring innen (neu) | Augenfarbe des Stils | 2 Spiel-px bei k = 1 |
- neu: `nm-shade-a` = #2a3448, Schattenfarbe der Gegner-Umfärbung Stil A (Verfluchter Wald)
- neu: `nm-shade-b` = #30201c, dasselbe für Stil B (Verbrannte Erde)
- neu: `nm-shade-c` = #252d4c, dasselbe für Stil C (Düstere Magie)
- neu: `nm-eye-moss` = #d8ff5a, `nm-eye-ember` = #ffb02a, `nm-eye-rune` = #e6b8ff: Augen und Fußaura der Gegner im Albtraum je Stil
- neu: `nm-rim-a` = #e8f4ff, `nm-rim-b` = #ffd0a0, `nm-rim-c` = #c8d8ff: Randlicht hinter Gegnern je Stil
- neu: `bone` = #e8dcc0, Dornen an Troll und Oger-König im Albtraum

Stil je Karte (Entscheidung des Menschen, steht auch in den Karten-Bauvorlagen): Wiese A, Eiswelt C, Zangenangriff B, Zwei Fronten C, Vulkan B.

## Formen/SVG
**Regel 1, Körperfarbe.** Jede Hex-Farbe im SVG des Typs wird ersetzt durch `mix(desat(c, 0.28), nm-shade, 0.36)`:
~~~js
// figures.js (rein, testbar). desat: Richtung Grauwert L = 0.3 R + 0.59 G + 0.11 B
const nmColor = (hex, shade) => mix(desat(hex, 0.28), shade, 0.36);
// Bleiben unverändert (Eigenlicht, Gold, Knochen, Kontur):
const NM_KEEP = new Set(['#2b1a10', '#ff7a1f', '#ffc23a', '#ffe58a', '#2a1a17', '#7dff9a', '#9fe8ff', '#f2c14e', '#d6483a',
  '#fff3d2', '#ffffff', '#fff', '#f6edd0', '#f2e3b8', '#a8c8a0', '#f2e9d8']);
~~~
Ausnahmen: `wisp` wird nicht umgefärbt, sondern `#c9fff0` → `mix(#c9fff0, Augenfarbe, 0.45)` und `#9effd9` → Augenfarbe; seine Augen bleiben dunkel (kein Augen-Overlay). `necro` färbt nur die Robe um (Regel 1), sein Leuchten `#7dff9a` / Phase 2 `#ff5fd0` bleibt; kein Augen-Overlay. `ember` (Glutling) bleibt wie entworfen: Flamme bleibt (NM_KEEP), nur die Augen bekommen das Overlay.

**Regel 2, Augen.** Tabelle `[x, y, s, d]` (Box-Einheiten, d = −1 links, +1 rechts):
| Typ | Augen |
|---|---|
| grunt, healer, shielded, mage, skeleton | [19, 16.5, 1, −1], [29, 16.5, 1, 1] |
| runner | [41, 13, 0.95, 1] |
| tank, boss | [41, 28.5, 0.9, −1], [55, 28.5, 0.9, 1] |
| bat | [22.5, 18, 0.72, −1], [29.5, 18, 0.72, 1] |
| beetle | [24.5, 38, 0.55, −1], [31.5, 38, 0.55, 1] |
| ember | [16.5, 30, 0.72, −1], [25.5, 30, 0.72, 1] |
| wisp, necro | keine |
Je Auge, in dieser Reihenfolge, über dem Körper:
~~~js
function nmEye(x, y, s, d, E) {
  const ix = x - 3 * s * d, iy = y + 0.8 * s, ox = x + 3.2 * s * d, oy = y - 1.4 * s;
  return `<circle cx="${x}" cy="${y}" r="${6.4 * s}" fill="${E}" opacity=".4"/>`              // Schein
    + `<ellipse cx="${x}" cy="${y + 0.2 * s}" rx="${3.9 * s}" ry="${3.3 * s}" fill="#2b1a10"/>`  // Höhle (deckt alte Augen)
    + `<path d="M${ix} ${iy} L${ox} ${oy} Q${x + 1.2 * s * d} ${y + 3 * s} ${ix} ${iy} Z" fill="${E}"/>` // Schlitz
    + `<circle cx="${x + 0.6 * s * d}" cy="${y + 0.3 * s}" r="${0.8 * s}" fill="#ffffff" opacity=".9"/>`
    + (s >= 0.85 ? `<path d="M${x - 4 * s * d} ${y - 2.6 * s} L${x + 3.8 * s * d} ${y - 5.4 * s}" stroke="#2b1a10" stroke-width="${2.4 * s}" stroke-linecap="round"/>` : ''); // Braue
}
~~~
Oger-König: zusätzlich Kronenstein `<circle cx="48" cy="5" r="3" fill="E" stroke="#2b1a10" stroke-width="1.5"/>`.

**Regel 3, Randlicht und Aura** (vor dem Körper, in dieser Reihenfolge):
~~~js
const nmBehind = (w, h, E, stil) =>
  `<ellipse cx="${w / 2}" cy="${h - 3}" rx="${0.44 * w}" ry="${0.12 * w}" fill="${E}" opacity=".5"/>`
  + `<circle cx="${w / 2}" cy="${0.52 * h}" r="${0.58 * Math.max(w, h)}" fill="url(#nm-rim-${stil})"/>`;
// svg-figure.js GRADIENTS, je Stil (Farbe = nm-rim-<stil>):
'nm-rim-a': { type: 'radial', cx: 0.5, cy: 0.5, r: 0.5, stops: [[0, 'rgba(232,244,255,0.5)'], [0.6, 'rgba(232,244,255,0.16)'], [1, 'rgba(232,244,255,0)']] },
'nm-rim-b': { …gleich mit 255,208,160 },
'nm-rim-c': { …gleich mit 200,216,255 },
~~~
**Regel 4, Dornen** (`tank`, `boss`, Box 96 × 104, hinter dem Körper):
~~~js
const NM_SPIKES = 'M6 54 L-2 44 L10 48 Z M90 54 L98 44 L86 48 Z M10 66 L0 66 L8 58 Z M86 66 L96 66 L88 58 Z'; // fill bone, ink 2.5, round
~~~
SVG-Reihenfolge der Albtraum-Figur: `nmBehind` → Dornen → umgefärbter Körper (Schatten-Ellipse bleibt) → Augen → Kronenstein.

**Elite** (`render-elite.js` `drawEliteRing`): im Albtraum zusätzlich ein durchgezogener Innenring `ctx.ellipse(e.x, footY, figW/2 + E.ringPad − 4, (…) · E.ringFlat)`, Farbe = Augenfarbe des Stils, Breite 2 · k, kein Pulsieren. Außenring (gestrichelt, Gold), Stern und Zeichen bleiben unverändert.

## Zustände
- Normalmodus ohne Nacht-Look: unverändert (heutige Figuren).
- Albtraum oder Nacht-Look an (`nightLook` in `src/render.js` Z. 278): Albtraum-Figur im Stil der Karte.
- Eingefroren: Eis-Überzug wie heute über der Albtraum-Figur (`withIce` auf die umgefärbte Figur); Glutling nie Eis.
- Beschädigt: Lebensbalken unverändert; Panzerkäfer-Schalenstufen (`BEETLE_SHELL`) werden ebenfalls umgefärbt, Augen gleich.
- Fledermaus Flügelbild 1 (`BAT_FRAMES`) und Nekromantin Phase 2 bekommen dieselbe Regel.
- Elite: Stern und Goldring wie heute, dazu Innenring in Augenfarbe.
- Boss: Bodenring (bossRing) bleibt; Krone bleibt Gold.
- reduced motion: keine eigene Bewegung (Augen-Pulsieren der Fläche entfällt im Spiel, Sprite ist statisch).
- Unterscheidbarkeit: Silhouetten unverändert; Information nie nur über Farbe (Elite weiter mit Stern und Zeichen).

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/config.js` | `NM_ENEMY_STYLE = { A: { shade, eye, rim }, B: …, C: … }` mit den Token-Werten; Stil je Karte aus `MAPS[id]` (Feld aus den Karten-Bauvorlagen, sonst `NM_STYLE_OF_MAP = { meadow: 'A', ice: 'C', fork: 'B', twin: 'C', volcano: 'B' }`) |
| `src/figures.js` | `enemyFigure(type, frozen, variant, nm)`: `nm` = `'A' \| 'B' \| 'C' \| null`; Umfärbung, Augen, Dornen, Randlicht als SVG vor `parseFigure`; Cache-Schlüssel um `nm` erweitern; Tabellen `NM_EYES`, `NM_KEEP` |
| `src/svg-figure.js` | `GRADIENTS`: `nm-rim-a/-b/-c` |
| `src/render-enemies.js` | Stil bestimmen (`nightLook ? stilDerKarte : null`), an `enemyFigure` geben; Sprite-Schlüssel `enemy:${type}:${variant}:${slowed}:${nm}:${dpr}` |
| `src/render-elite.js` | `drawEliteRing(ctx, e, footY, figW, time, still, nmEye)`: Innenring, wenn `nmEye` gesetzt |
Keine IDs/Klassen betroffen (nur Canvas).

## Tests
- Bestehend, bleiben grün: `tests/render.test.js` (Figuren, Sprites), `tests/fx.test.js`, alle e2e. `enemyFigure(type, frozen, variant)` ohne 4. Argument liefert dieselbe Figur wie heute.
- Neu in `tests/render.test.js`:
  - für alle 13 Typen und Stile A/B/C: `enemyFigure(t, false, undefined, stil)` liefert eine Figur, `box` umschließt die normale `box`, Cache liefert für gleiche Argumente dasselbe Objekt, für `nm = null` vs. `'A'` verschiedene.
  - Umfärbung: `nmColor('#6cc03a', '#2a3448')` gleich dem erwarteten Wert (aus der Formel); Farben aus `NM_KEEP` bleiben.
  - Augen: jede Albtraum-Figur außer `wisp`/`necro` enthält die Augenfarbe des Stils.
  - `drawEliteRing` mit `nmEye` zeichnet zwei Ellipsen (Mock-Context zählt `ellipse`-Aufrufe), ohne eine.

## Messbare Abnahme
- Testseite, Albtraum auf Wiese, Zangenangriff und Eiswelt, Welle mit allen Typen: Screenshot `#game` 1280x800 zeigt je Typ dieselbe Silhouette wie im Normalmodus, Augen in `nm-eye-*` der Karte, Vergleich mit Fläche „Gegner“ (Zeile A/B/C).
- Pixelprobe: Augenmitte eines Goblins im Albtraum Wiese hat Farbabstand ≤ 30 zu #d8ff5a.
- Bildrate: 60 Gegner im Albtraum, `performance.now()` je Frame im Mittel nicht mehr als 10 % über Normalmodus (Sprites gecacht).
- Normalmodus ohne Nacht-Look: Screenshot pixelgleich zu vorher.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
