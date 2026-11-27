# Layout-Vollbild (C1)
Fläche: `canvas/project/Main.dc.html` (Gesamtbild 1280x800 mit allen C-Elementen). Mockups: `C-start-1280x800.png`, `C-play-1280x800.png`, `C-start-1366x768.png`.
Erprobt in einer Kopie von 3deaaac (Browser, ohne Konsolenfehler). Dateien: `C-index.html` (ersetzt index.html), `C-style.css` (ersetzt style.css), `C-layout.js` (neu `src/layout.js`), `C-js.diff`.

## Regel
Nichts Bedienbares liegt über einer Feldkachel. HUD/Wellenknopf liegen in den Bändern über/unter dem Feld (Canvas-Rand), Fähigkeiten und Turmwahl in den Seitenzonen.

## Skalierung (nur CSS, in `:root` von C-style.css)
```css
--view-w: 900; --view-h: 660; --field-w: 800; --field-h: 560; --frame: 50;   /* main.js setzt sie beim Start aus config.js */
--side-min: 100px; --band-min: 58px;
--u: min(100vw / var(--view-w), 100vh / var(--view-h), (100vw - 2 * var(--side-min)) / var(--field-w), (100vh - 2 * var(--band-min)) / var(--field-h));
--cw: calc(var(--u) * var(--view-w));  --ch: calc(var(--u) * var(--view-h));
--cx: calc((100vw - var(--cw)) / 2);   --cy: calc((100vh - var(--ch)) / 2);
--fw: calc(var(--u) * var(--field-w)); --fh: calc(var(--u) * var(--field-h));
--fx: calc(var(--cx) + var(--u) * var(--frame)); --fy: calc(var(--cy) + var(--u) * var(--frame));
--fr: var(--fx); --fb: var(--fy);
```
`.stage { position:absolute; left:var(--cx); top:var(--cy); width:var(--cw); height:var(--ch) }`, `#app { position:fixed; inset:0; overflow:hidden }`, `html,body { height:100%; overflow:hidden }`.

| Fenster | u | Canvas x,y,b,h | Feld x,y,b,h | Kachel | Band | Seite |
|---|---|---|---|---|---|---|
| 1280x800 | 1,212 | 95,0,1091,800 | 155,61,970,679 | 48,5 | 61 | 155 |
| 1366x768 | 1,164 | 159,0,1047,768 | 218,58,931,652 | 46,5 | 58 | 218 |
| 1440x900 | 1,364 | 106,0,1227,900 | 175,68,1091,764 | 54,5 | 68 | 175 |
| 1920x1080 | 1,636 | 224,0,1473,1080 | 306,82,1309,916 | 65,5 | 82 | 306 |
| 1024x768 | 1,030 | 49,44,927,680 | 100,96,824,577 | 41,2 | 96 | 100 |

## Hintergrund neben dem Canvas
- `<canvas id="backdrop" aria-hidden="true">` als erstes Kind von `#app`; CSS `position:absolute; left:-32px; top:-32px; width:calc(100% + 64px); height:calc(100% + 64px); filter: blur(18px) brightness(.42) saturate(.9)`.
- main.js `drawBackdrop()`: sobald `paintedStatus(mapId)==='ready'`, einmal je Karte und Größe den Spiel-Canvas "cover" auf 320 px Breite kopieren.
- Spiel-Canvas: `mask-image: linear-gradient(90deg, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)` (mit `-webkit-`).

## Schärfe (DPR)
- `src/layout.js`: `canvasScale(cssWidth, dpr) = max(1, round(cssWidth/900 * min(2, max(1,dpr)) * 4) / 4)`; `config.js`: `export const LAYOUT = { dprMax: 2 };`
- main.js `applyLayout()`: Puffer `VIEW_* * k` (nur bei Änderung), `setRenderScale(k)`; bei `resize`, `ResizeObserver(canvas)`, vor dem ersten Bild. Loop: `ctx.setTransform(k,0,0,k,0,0)` mit `k = canvas.width / VIEW_WIDTH`.
- render.js: `setRenderScale`, Cache-Schlüssel `${mapId}@${k}`, `drawImage(painted, -FRAME_MARGIN, -FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT)`. render-painted.js: `rasterizePainted(svg, scale = 1)`.
- Eingabe bleibt: `fieldPoint` rechnet mit `getBoundingClientRect` und `VIEW_*`, unverändert richtig.

## Schrift
`@font-face { font-family:'Lilita One'; src:url('assets/fonts/LilitaOne-Regular.ttf') format('truetype'); font-display:swap }` + `<link rel="preload" href="assets/fonts/LilitaOne-Regular.ttf" as="font" type="font/ttf" crossorigin>`. `scripts/serve.mjs` TYPES: `'.ttf': 'font/ttf'` (Test in testserver.test.js). Variable `--display: 'Lilita One','Trebuchet MS',sans-serif` für Zahlen, Knöpfe, Beschriftungen; Fließtext bleibt Trebuchet MS.

## Entfällt
`<header>`, `<footer>`, `<aside>`, `.help` als Kasten (wird runder Knopf, siehe HUD-Knoepfe), `#hearts`, `#pause-hint`, alle `<img data-icon>` im HUD. Wurzel heißt `<div class="board" id="app">` (Klasse `board` brauchen Zoom und Testseite).

## Kompakt (Handy-Grundlage bis Handy-Quer/Handy-Hoch)
`@media (max-width: 759.98px), (max-height: 519.98px)`: `--u: calc((100vw - 12px)/900)`, alles untereinander, scrollbar; Turm-Panel fest unten wie bisher; `#test-panel { z-index:auto }` (sonst verdeckt es `#ti-close`). Vollständig in C-style.css.

## Tests
- Unit: `canvasScale(1091,1)===1.25`, `(1091,2)===2.5`, `(450,1)===1`, `(NaN,3)===1`, DPR 3 → wie 2.
- e2e smoke "Stil 1 gemalter Hintergrund": statt `[VIEW_WIDTH, VIEW_HEIGHT]` prüfen `width/VIEW_WIDTH === height/VIEW_HEIGHT && width >= VIEW_WIDTH`.
- e2e buttons B-096 Desktop "keine Emoji": `document.querySelector('#app').innerText` statt `header`+`main`.
- e2e panel-polish "ganz unten verdeckt" (2 Tests): `'aside'` durch `'#shop'` ersetzen.
- Neu e2e: bei 1280x800, 1366x768, 1440x900 `scrollHeight <= innerHeight`; `#hud-bar`, `.top-buttons`, `#abilities`, `#start-wave`, `#shop` liegen im Fenster und schneiden das Feldrechteck nicht (Feld = Canvas-Box, je Seite 50/900 der Breite eingerückt).
## Akzeptanz
Kein Scrollen auf Desktop; Konsole leer; `document.fonts.check('28px "Lilita One"')`; bei DPR 2 `canvas.width >= 2*rect.width - 4`.
