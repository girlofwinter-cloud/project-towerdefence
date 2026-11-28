# Gegner-Totengraeber (G7-Erweiterung): Totengräber `digger`, Radius 13, hält 2 s an einem Grabhügel am Weg und gräbt 3 Skelette aus
Fläche: Skizze https://claude.ai/artifact/5VwK9kA9Eze6fY4KAQmjz9#artboard-Gegner (keine eigene Bibliotheks-Fläche). Backlog: B-213 (Werte und Graben-Logik dort). Stand: main@ec59b0b. Skizze, keine Feinarbeit.

## Maße
- SVG-Box 52 × 58 Entwurfs-px = 0,91 × 1,02 Kachel, TILE/57, kein `big` (Goblin 46 × 50: Totengräber ≈ 1,15 × Goblin, deutlich kleiner als Troll 96 × 104).
- Fußpunkt unten mittig (26, 55), `FIGURE_STYLE.enemyFoot` wie alle. Schatten ellipse (26, 55) rx 16 ry 4.
- Silhouette: breitkrempiger Hut (Krempe x 8–44, breiter als der Kopf), langer Mantel, Schaufel rechts senkrecht mit Blatt unten am Boden (x 38–50, y 41–55). Kein anderer Gegner hat Hutkrempe oder ein Blatt unten.
- Desktop 1280x800 (Kachel 40): ≈ 36 × 41 px. Handy quer 844x390 (Kachel ≈ 19): ≈ 17 × 19 px; Krempe und Schaufelblatt bleiben ≥ 3 px.
- Grabhügel (nur Karte `graveyard`): Box 40 × 22 Entwurfs-px (0,7 × 0,39 Kachel), liegt **auf** einer Wegkachel am Wegrand, Mitte 0,32 Kachel quer zur Laufrichtung nach außen versetzt. Kein Bauplatz geht verloren.
  - Vorschlag `MAPS.graveyard.graveMounds` (Kachel + Seite): `[[6,1,'up'],[3,7,'left'],[13,8,'up']]` (oberes Segment, linke Senkrechte, Segment y8; nicht in den Friedhof-Flächen x12–14 y2–4 und x0–2 y12–13).
  - Haltepunkt des Totengräbers: Wegmitte der Kachel, Blick quer zum Hügel (Figur dreht zur Hügelseite, `facingFlip`).
- Andere Karten: entfällt laut B-215 (Totengräber nur auf `graveyard`). Falls er doch auftaucht: Hügel erscheint beim Graben an seiner Stelle (Rückfall, gleiche Form, Seite `up`).

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure` | #2b1a10, 3 |
| Schatten | `figure-shadow` | rgba(20,30,40,0.4) |
| Mantel | neu `enemy-digger-coat` | #4a3c34 |
| Stiefel, Flicken, Hutband-Grund | neu `enemy-digger-coat-dark` | #2e2420 |
| Hut | neu `enemy-digger-hat` | #2a221e |
| Gesicht, Hand | neu `enemy-digger-skin` | #a3ad8f |
| Augen (glimmen) | `gold-light` | #ffe27a |
| Strick-Gürtel, Hutband | `wood-fig-a` | #c88a4c |
| Schaufelstiel | `wood-fig-b` | #8a5326 |
| Schaufelblatt / Glanz | neu `enemy-digger-blade` / `level-1` | #9a9a90 / #d7dde0 |
| Grabhügel Erde dunkel / hell | neu `grave-soil` / `grave-soil-light` | #5a4630 / #8a7050 |
| Erdklumpen (Partikel) | `grave-soil-light`, `map-graveyard-path-earth` (Karte-Nachtfriedhof) | #8a7050, #b0a07e |
| Holzkreuz am Hügel | `wood-fig-b` | #8a5326 |
| Grab-Uhr (Fortschritt) | `cream` | #fff3d2, α 0,85 |
- neu: `enemy-digger-coat` = #4a3c34, `enemy-digger-coat-dark` = #2e2420, `enemy-digger-hat` = #2a221e, `enemy-digger-skin` = #a3ad8f, `enemy-digger-blade` = #9a9a90 (Figur Totengräber, B-213)
- neu: `grave-soil` = #5a4630, `grave-soil-light` = #8a7050 (Grabhügel und Erdklumpen)

## Formen/SVG
`src/figures.js`, in `ENEMY_SVG` (Schaufel als `<g data-part="shovel">`, dreht live um die Hand (45,5, 30) wie der Umhang der Nekromantin):
~~~js
  // Totengräber (B-213): Hut mit Krempe, langer Mantel, Schaufel; Grabhaltung in render-enemies.js
  digger: {
    w: 52, h: 58,
    svg: `<ellipse cx="26" cy="55" rx="16" ry="4" fill="rgba(20,30,40,.4)"/><path d="M17 46 L15 55 H23 L23 46 M29 46 L29 55 H37 L35 46" fill="#2e2420" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 28 Q11 44 13 50 H39 Q41 44 38 28 Q26 23 14 28 Z" fill="#4a3c34" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M18 32 H24 V38 H18 Z" fill="#2e2420" stroke="#2b1a10" stroke-width="1.5"/><path d="M14 41 Q26 44 38 41" fill="none" stroke="#c88a4c" stroke-width="2.5" stroke-linecap="round"/><circle cx="26" cy="20" r="11" fill="#a3ad8f" stroke="#2b1a10" stroke-width="3"/><circle cx="21.5" cy="18.5" r="2.4" fill="#ffe27a" stroke="#2b1a10" stroke-width="1.5"/><circle cx="30.5" cy="18.5" r="2.4" fill="#ffe27a" stroke="#2b1a10" stroke-width="1.5"/><path d="M26 19 Q31 23 27 25" fill="none" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/><path d="M22 28 Q26 26 30 28" fill="none" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/><path d="M15 12 L17 1 Q26 -1 35 1 L37 12 Z" fill="#2a221e" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M17 9 Q26 7 35 9" fill="none" stroke="#c88a4c" stroke-width="2"/><path d="M7 13 Q26 7 45 13 Q26 17 7 13 Z" fill="#2a221e" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><g data-part="shovel"><path d="M47 10 L44 44" stroke="#2b1a10" stroke-width="6" stroke-linecap="round"/><path d="M47 10 L44 44" stroke="#8a5326" stroke-width="3" stroke-linecap="round"/><path d="M43.5 10 H50.5" stroke="#2b1a10" stroke-width="5" stroke-linecap="round"/><path d="M38 43 Q44 40 50 43 L49 51 Q44 56 39 51 Z" fill="#9a9a90" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M41 45 V50" stroke="#d7dde0" stroke-width="2" stroke-linecap="round"/><circle cx="45.5" cy="30" r="3.5" fill="#a3ad8f" stroke="#2b1a10" stroke-width="2"/></g>`,
  },
~~~
Albtraum: `NM_EYES.digger = [[21.5, 18.5, 0.75, -1], [30.5, 18.5, 0.75, 1]]`; Körper wird wie Goblin über `nmColor` umgefärbt, `#ffe27a` nicht in `NM_KEEP` (Augen übernimmt `nmEye`).

Grabhügel (`src/render-path.js` oder `render-decor.js`, über dem Weg, unter den Gegnern), Box 40 × 22, Fuß (20, 22), Seite `up` = Hügel oberhalb der Wegmitte, sonst um 90° gedreht:
~~~js
const MOUND = new Path2D('M2 20 Q6 6 20 5 Q34 6 38 20 Q20 24 2 20 Z');      // fill grave-soil, stroke ink 2.5
const MOUND_HI = new Path2D('M9 13 Q14 8 21 8');                           // stroke grave-soil-light 2.5, round
const CROSS = new Path2D('M19 6 V-10 M13 -5 H25');                         // stroke ink 5, darüber wood-fig-b 2.5, round
const PIT = new Path2D('M8 17 Q20 11 32 17 Q20 21 8 17 Z');                // offen: fill #1a1412 (wie Gruft-Tür), stroke ink 2
const HEAP = new Path2D('M26 20 Q30 9 38 11 Q42 16 40 21 Z');              // Aushub daneben: fill grave-soil-light, stroke ink 2
~~~

## Zustände
| Zustand | Auslöser | Sichtbar |
|---|---|---|
| Laufen | normal | Geh-Wippen (`sway`/`bob` wie Goblin); Schaufel ±4° im Schritt-Takt um die Hand |
| Graben | erreicht Hügel (Logik B-213, z. B. `e.digT` 0 → 2 s) | steht, Blick zum Hügel; 4 Stiche à 0,5 s: Schaufel dreht 0 → +30° (Blatt in den Hügel), Oberkörper neigt 6°, dann zurück −15° (Wurf über die Schulter) + 1 Erdklumpen fliegt 14 px Bogen nach hinten (r 2–3, `grave-soil-light`); Grab-Uhr: Bogen um den Fußpunkt rx 0,45 / ry 0,15 Kachel, 0 → 360° in 2 s, `cream` α 0,85, Strich 2,5 auf ink 4 |
| Skelette steigen | Graben fertig (Ereignis `digDone`) | Hügel → offen (PIT + HEAP); 3 Skelette steigen nacheinander (Versatz 0,15 s) je 0,5 s aus der Grube (Figur wird von der Hügel-Oberkante abgeschnitten, y +h → 0), 3 Erdklumpen je Skelett; Hügel bleibt offen bis Wellenende |
| Erwischt | stirbt während des Grabens | normaler Tod; Schaufel bleibt schräg (25°) im Hügel stecken bis Wellenende, Hügel bleibt zu (Zeichen „verhindert“, nicht nur Farbe) |
| Treffer | Schaden | Standard-Treffer-Blitz, Lebensbalken über der Hutkrone |
| Tod | hp 0 | Standard-Tod; Hut fällt 0,4 s (dreht 30°, sinkt 6 px, blendet aus) |
| eingefroren | Frost | Standard-Eisfassung (`ICED`), Schaufel unbewegt; Grab-Uhr läuft nicht weiter, solange Logik das Graben anhält |
| Elite | Elite-Welle | Standard-Elite-Abzeichen (`render-elite.js`), nichts Eigenes |
| Albtraum | Albtraum-Modus | `nmSvg`: Umfärbung, Fußaura, Augen aus `NM_EYES.digger`; Hügel-Erde `grave-soil` bleibt, Grube glimmt innen `NM_ENEMY_STYLE[..].eye` α 0,35 |
| Handy | Kachel ≈ 19 | Grab-Uhr Strich min. 2 px, Erdklumpen r min. 2 px; Hügel min. 13 × 7 px |
| reduced motion | Einstellung | kein Schaufelschwung, Schaufel steht in Grabhaltung (+20°); Grab-Uhr bleibt; Skelette erscheinen ohne Steigen |
Barrierefreiheit: Graben erkennbar über Haltung + Grab-Uhr (Form), Ergebnis über offene Grube/steckende Schaufel.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/figures.js` | `ENEMY_SVG.digger`, `NM_EYES.digger` |
| `src/render-enemies.js` | Grabhaltung (Schaufel-Drehung `data-part="shovel"`), Grab-Uhr, Hut beim Tod |
| `src/render-path.js` / `src/render-decor.js` | Grabhügel (zu, offen, mit Schaufel) |
| `src/enemy-fx.js` / `src/fx-system.js` | Erdklumpen, Skelette steigen (Clip) |
| `src/config.js` | `ENEMY_STYLE.digger` (strokes: 4, strokeTime 0.5, shovelDig 30, shovelThrow -15, lean 6, clodArc 14, riseTime 0.5, riseGap 0.15, clockRx 0.45, clockRy 0.15); `MAPS.graveyard.graveMounds`; keine Spielwerte |
| `docs/design/system/TOKENS.md` | neue Tokens oben |

## Tests
- `tests/fx.test.js` „Stil 1 Gegner: Größe …“: `ALL_ENEMIES` um `digger` ergänzen; bleibt grün.
- Neu `tests/fx.test.js`: Totengräber breiter als Goblin und kleiner als Troll; SVG enthält `#4a3c34` und `data-part="shovel"`; Grab-Uhr-Bogen proportional zu `digT` (0, 1, 2 s → 0, 180, 360°); reduced motion: Schaufelwinkel konstant.
- Neu `tests/render.test.js`: `graveMounds` liegen alle auf Wegkacheln und nicht auf Friedhofkacheln; Hügel-Zustand offen nach `digDone`.

## Messbare Abnahme
- Screenshot `graveyard` Welle 7 bei 1280x800 und 844x390: Totengräber steht am Hügel mit sichtbarer Grab-Uhr, danach offene Grube und 3 Skelette.
- Totengräber, Goblin und Schildträger in Graustufen unterscheidbar (Hutkrempe, Schaufelblatt).
- Kein Grabhügel auf einem Bauplatz (Test oben).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
