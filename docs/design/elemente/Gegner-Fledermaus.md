# Gegner-Fledermaus (G7-Erweiterung): fliegender Gegner `bat`, Radius 9, von Kanone und Frost nicht getroffen.
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Gegner-Fledermaus. Backlog: B-167 (Logik läuft parallel). Stand: main@3908fdd. Skizze, keine Feinarbeit.

## Maße
- SVG-Box 52 × 50 Entwurfs-px (Kachel 57) = 0,91 × 0,88 Kachel; gezeichnet mit TILE/57 wie alle Gegner, kein `big`.
- Fußpunkt unten mittig (26, 50) = Bodenpunkt (`FIGURE_STYLE.enemyFoot`). Der Körper endet bei y 33: **17 Entwurfs-px Luft** zwischen Krallen und Boden, das zeigt den Flug.
- Bodenschatten NICHT im SVG, sondern per Canvas am Fußpunkt, damit der Körper über einem ruhenden Schatten wippen kann (siehe Formen).
- Handy (Kachel ≈ 28 px): Figur ≈ 26 × 25 px; Flügelspannweite (breiteste Silhouette aller kleinen Gegner) und die Lücke zum Schatten tragen die Erkennung.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink` | #2b1a10 |
| Kontur-Stärke Körper / Flügel / Details | `stroke-figure` / `stroke-figure-fine` / `stroke-figure-line` | 3 / 2,5 / 2 |
| Augen | `gold-light` | #ffe27a |
| Zähne | `cream` | #fff3d2 |
- neu: `enemy-bat-wing` = #4a3560, Flügelhaut (dunkel, hebt sich von allen Böden ab)
- neu: `enemy-bat-body` = #6b4a80, Körper und Ohren
- neu: `enemy-bat-vein` = #8a6aa8, Flügelrippen
- neu: `figure-shadow` = rgba(20,30,40,0.4), Bodenschatten aller Figuren (heute als Literal in figures.js); Fledermaus nutzt Alpha 0,28

## Formen/SVG
`src/figures.js`, in `ENEMY_SVG`:
```js
  // Fledermaus: fliegt (Körper 17 px über dem Boden), Schatten zeichnet render-enemies.js
  bat: {
    w: 52, h: 50,
    svg: `<path d="M22 18 Q12 4 1 9 Q5 14 3 21 Q9 18 12 23 Q15 19 19 25 Z" fill="#4a3560" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 18 Q40 4 51 9 Q47 14 49 21 Q43 18 40 23 Q37 19 33 25 Z" fill="#4a3560" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 13 L6 11 M20 16 L10 19 M32 13 L46 11 M32 16 L42 19" stroke="#8a6aa8" stroke-width="1.5" stroke-linecap="round"/><path d="M19 13 L18 3 L24 10 Z M33 13 L34 3 L28 10 Z" fill="#6b4a80" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="26" cy="20" rx="9" ry="10" fill="#6b4a80" stroke="#2b1a10" stroke-width="3"/><circle cx="22.5" cy="18" r="2.6" fill="#ffe27a" stroke="#2b1a10" stroke-width="1.5"/><circle cx="29.5" cy="18" r="2.6" fill="#ffe27a" stroke="#2b1a10" stroke-width="1.5"/><path d="M23 25 L24.5 28.5 L26 25 L27.5 28.5 L29 25" fill="#fff3d2" stroke="#2b1a10" stroke-width="1.2" stroke-linejoin="round"/><path d="M23 30 L22 33 M29 30 L30 33" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/>`,
  },
```
Zweites Flügelbild (Flügel oben) für den Flügelschlag, als eigene Karte `ENEMY_FRAMES` (nicht in `ENEMY_SVG`, damit `ENEMY_KINDS` unverändert nur echte Typen enthält): gleicher String, die ersten zwei Pfade ersetzt durch
```js
`<path d="M22 18 Q14 0 4 1 Q6 7 3 12 Q10 11 12 16 Q16 14 19 22 Z" fill="#4a3560" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 18 Q38 0 48 1 Q46 7 49 12 Q42 11 40 16 Q36 14 33 22 Z" fill="#4a3560" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/>`
```
und die Rippen ersetzt durch `M20 13 L8 4 M20 16 L8 11 M32 13 L44 4 M32 16 L44 11`.

Canvas in `src/render-enemies.js` (Zahlen in `src/config.js` → `ENEMY_STYLE.bat`):
```js
bat: {
  shadow: 'rgba(20,30,40,0.28)', // figure-shadow, heller: weit weg
  shadowDx: 4, shadowRx: 10, shadowRy: 2.5, // Entwurfs-px, Schatten 4 px nach rechts versetzt
  shadowShrink: 0.15,            // Schatten bis 15 % kleiner, wenn der Körper oben ist
  hover: 2.5, hoverHz: 2.2,      // Körper wippt ±2,5 Entwurfs-px (ersetzt Geh-Wippen/sway)
  flapHz: 8,                     // Wechsel Flügelbild unten/oben 8 x je s
},
```
Ablauf je Bild: 1) Schatten-Ellipse am Fußpunkt (x + shadowDx·k, footY), rx·(1 − shadowShrink·h01), 2) Figur mit dy = −hover·sin(2π·hoverHz·t), Bild = floor(t·flapHz) % 2. Kein `sway`/`bob` aus FIGURE_STYLE für `bat`.

## Zustände
| Zustand | Auslöser | Sichtbar |
|---|---|---|
| normal | fliegt | Flügel wechseln unten/oben, Körper wippt, Schatten ruht versetzt |
| beschädigt | hp < max | Lebensbalken wie alle (`hp-good`/`hp-mid`/`hp-low`) über der Box |
| eingefroren | entfällt bei Frostturm (trifft nicht); falls die Frost-Fähigkeit sie doch erfasst: Standard-Eisüberzug `withIce`, Flügelschlag steht |
| Kanone/Frost-Geschoss | fliegt durch | kein Treffer-Effekt, Geschoss fliegt weiter (Logik); kein eigener Effekt nötig |
| Handy | Kachel 28 px | gleiche Figur; Lücke Körper/Schatten ≈ 8 px |
| reduced motion | `prefers-reduced-motion` | Flügelbild fest (unten), kein Wippen; Schatten-Versatz bleibt (Information) |
Unterscheidbarkeit: einzige Figur ohne Beine am Boden mit Spannweite > Höhe des Körpers; Flug über die Lücke zum Schatten, nicht über Farbe.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/figures.js` | `ENEMY_SVG.bat`, `ENEMY_FRAMES.bat_up` und Zugriff `enemyFigure('bat', frozen, frame)` |
| `src/render-enemies.js` | Flug-Zweig in `drawEnemy`: eigener Schatten, Hover statt Geh-Wippen, Bildwechsel; Sprite-Schlüssel um Bild erweitern |
| `src/config.js` | `ENEMY_STYLE.bat` (oben), Typ in `ENEMY_TYPES` macht die Logik |
Keine IDs/Klassen betroffen.

## Tests
- `tests/fx.test.js` „Stil 1 Gegner: Größe …“: bleibt grün; `ALL_ENEMIES` um `bat` ergänzen (Erweiterung, keine Abschwächung).
- Neu `tests/fx.test.js`: `enemyFigure('bat')` liefert Figur; sichtbare Breite (Kontur-Elemente) 0,8–0,95 Kachel; unterste Kontur ≥ 15 Entwurfs-px über dem Fußpunkt (Flug).
- Neu `tests/render.test.js`: bei `bat` wird vor der Figur eine Ellipse mit `ENEMY_STYLE.bat.shadow` am Fußpunkt gezeichnet (Mock-Kontext).

## Messbare Abnahme
- Screenshot einer Welle mit Fledermäusen bei 1280x800 und 844x390: Schatten liegt sichtbar getrennt unter der Figur (Lücke ≥ 10 px Desktop, ≥ 6 px Handy).
- Fledermaus neben Flitzer (`runner`) bei 844x390 an der Silhouette unterscheidbar (Graustufen-Screenshot im PR).
- Mit reduced motion kein Bildwechsel (zwei Screenshots im Abstand 0,2 s gleich).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
