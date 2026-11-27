# Karte-Wellenfahne (Rest von G5): Wellenzahl auf der Fahne, Fahne klickbar
Fläche: `canvas/project/Karte-Wellenfahne.dc.html`. Entwurf Z.117 (Text x 50, y 45). Dateien: render.js, main.js, style.css.
## render.js
```js
const flagCache = new Map();
export function flagBoxes(state) { // Fahnen der Szene je Karte (Entwurfs-px, Feld ab 0,0)
  if (!flagCache.has(state.mapId)) flagCache.set(state.mapId, buildPaintedScene(state).flags);
  return flagCache.get(state.mapId);
}
function drawFlagNumbers(ctx, state) { // in renderView nach render(), noch im translate(FRAME_MARGIN)
  if (!paintedFor(state)) return;
  const n = String(Math.min(state.waveActive ? state.wave : state.wave + 1, MAX_WAVES));
  const K = TILE / PAINTED_STYLE.unit;
  for (const fl of flagBoxes(state)) {
    ctx.save(); ctx.scale(K, K); ctx.translate(fl.tx, fl.ty); ctx.scale(fl.s, fl.s);
    ctx.font = '30px "Lilita One", sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.lineWidth = 5; ctx.strokeStyle = '#2b1a10'; ctx.fillStyle = '#fff3d2';
    ctx.strokeText(n, 50, 45); ctx.fillText(n, 50, 45); ctx.restore();
  }
}
```
Zweistellig ("12") passt: Fahnenfeld 18–80 breit, Text 30 px ≈ 34 breit.
## main.js
```js
function overFlag(ev) { // Punkt im Rand und in einer Fahnen-Box (±8 Spiel-px)
  const p = pointFromEvent(ev), K = TILE / PAINTED_STYLE.unit;
  return !tileFromEvent(ev).inField && flagBoxes(state).some((f) => p.x >= f.box[0] * K - 8 && p.x <= f.box[2] * K + 8 && p.y >= f.box[1] * K - 8 && p.y <= f.box[3] * K + 8);
}
// erste Zeile im click-Handler:
if (!ui.aiming && !ui.buildType && overFlag(ev)) { doStartWave(); return; }
// im pointermove:
canvas.classList.toggle('over-flag', overFlag(ev));
```
CSS: `canvas#game.over-flag { cursor: pointer; }`
## Zustände
Zahl = nächste Welle zwischen den Wellen, laufende Welle während einer Welle; Maus darüber = Hand-Zeiger; Klick wie Wellenknopf (auch Frühstart mit Bonus); während Spawn wirkungslos (startWave lehnt ab, Meldung wie beim Knopf).
## Tests
Unit: `flagBoxes` für `meadow` eine Box mit x1 < 0, für `fork`/`twin` zwei. e2e: Klick in die Mitte der Fahnen-Box (aus `flagBoxes`, umgerechnet mit `tileCenter`-Logik) startet Welle 1; smoke "Klick in den Rand baut nichts" bleibt grün (Klickpunkte liegen nicht auf der Fahne; vorher prüfen: Kachel (0,5) links, (6,0) oben).
