// Weg im Flat-Pop-Stil (B-071): welliger Rand aus Kreisen, Kontur, Saum, Rillen, Steine, helle Mitte.
// Nur Zeichnen. Wird ausschließlich in den Hintergrund-Cache (bgCanvas) gemalt, nie pro Frame.
import { TILE, PATH_STYLE as P } from './config.js';
import { tileRand } from './decor.js';
import { shd } from './draw-utils.js';

// Kreis als Teilpfad. roundRect statt arc: so zählt der Weg nicht als Dekoration (render.test.js).
function circlePath(ctx, x, y, r) {
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x - r, y - r, 2 * r, 2 * r, r);
  else { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
}

function fillCircles(ctx, list, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [x, y] of list) circlePath(ctx, x, y, r);
  ctx.fill();
}

function strokeAll(ctx, paths, width, color, dx = 0, dy = 0) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  for (const pts of paths) {
    ctx.moveTo(pts[0].x + dx, pts[0].y + dy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x + dx, pts[i].y + dy);
  }
  ctx.stroke();
}

// Kleinster Abstand eines Punkts zu allen Wegsegmenten.
function distToPaths(paths, x, y) {
  let m = Infinity;
  for (const pts of paths) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      m = Math.min(m, Math.hypot(x - a.x - t * dx, y - a.y - t * dy));
    }
  }
  return m;
}

// Größte Ausdehnung des Rands von der Achse (für den Test: Weg-Geometrie aus config.js).
export function pathReach() {
  return P.edgeOffset + P.waveAmp * (1 + P.waveHarmonic) + P.edgeRadius;
}

export function drawPathStyled(ctx, paths, theme) {
  const col = { ...P.colors, ...(theme?.path || {}) };
  const band = shd(col.main, P.bandShade);
  const lists = paths.map((p) => p.points);
  const circles = [];
  const fringe = [];
  const stones = [];
  const pebbles = [];
  const patches = [];
  const ruts = [];
  let seg = 0;
  for (const pts of lists) {
    for (let i = 0; i < pts.length - 1; i++, seg++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1) continue;
      const dx = (b.x - a.x) / len, dy = (b.y - a.y) / len, nx = -dy, ny = dx;
      const at = (s, o) => [a.x + dx * s + nx * o, a.y + dy * s + ny * o];
      // Randkreise links/rechts mit Welle; Kreise im Inneren anderer Wege (Kreuzung) entfallen
      for (let k = 0, s = -8; s < len + 8; s += P.circleStep, k++) {
        for (const side of [-1, 1]) {
          const o = P.edgeOffset + Math.sin(s * P.waveLength + seg * 2 + side) * P.waveAmp
            + Math.sin(s * P.waveLength * 2.45 + side * 3) * P.waveAmp * P.waveHarmonic;
          const [x, y] = at(s, o * side);
          if (distToPaths(lists, x, y) < o - 1.6) continue;
          circles.push([x, y]);
        }
      }
      // Bodenflecken, Rillen, Steine und Kiesel (deterministisch über tileRand)
      for (let k = 0, s = 0; s < len; s += P.patchStep, k++) {
        if (tileRand(seg, k, 1) < P.patchChance) {
          const [x, y] = at(s, (tileRand(seg, k, 2) - 0.5) * 30);
          patches.push([x, y, 4 + tileRand(seg, k, 3) * 5, 2 + tileRand(seg, k, 4) * 2, tileRand(seg, k, 5) < 0.5]);
        }
      }
      if (len > 40) for (const o of [-P.rutOffset, P.rutOffset]) ruts.push([at(16, o), at(len - 16, o)]);
      for (let k = 0, s = 0; s < len; s += P.stoneStep, k++) {
        const edge = tileRand(seg, k, 6) < P.stoneChance;
        if (edge) {
          const o = (tileRand(seg, k, 7) < 0.5 ? -1 : 1) * (P.stoneOffset[0] + tileRand(seg, k, 8) * (P.stoneOffset[1] - P.stoneOffset[0]));
          const [x, y] = at(s, o);
          if (distToPaths(lists, x, y) > P.stoneOffset[1] + 1) continue;
          stones.push([x, y, P.stoneSize[0] + tileRand(seg, k, 9) * (P.stoneSize[1] - P.stoneSize[0])]);
        } else {
          const [x, y] = at(s, (tileRand(seg, k, 7) - 0.5) * 16);
          pebbles.push([x, y, P.pebbleSize[0] + tileRand(seg, k, 9) * (P.pebbleSize[1] - P.pebbleSize[0]), tileRand(seg, k, 10) < 0.5 ? 0 : 1]);
        }
      }
      // grüner Saum, nur wenn die Karte eine Farbe dafür hat
      if (col.fringe && P.fringeStep > 0) {
        for (let k = 0, s = 4; s < len - 2; s += P.fringeStep, k++) {
          for (const side of [-1, 1]) {
            const o = P.fringeOffset[0] + tileRand(seg, k, 11 + side) * (P.fringeOffset[1] - P.fringeOffset[0]);
            const [x, y] = at(s, o * side);
            if (distToPaths(lists, x, y) < P.fringeOffset[0] - 1) continue;
            fringe.push([x, y + 1]);
          }
        }
      }
    }
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  strokeAll(ctx, lists, P.shadowWidth, P.shadowColor, P.shadowOffset[0], P.shadowOffset[1]);
  strokeAll(ctx, lists, TILE, col.outline);
  strokeAll(ctx, lists, P.sandWidth, col.main);
  fillCircles(ctx, circles, P.edgeRadius, col.outline);
  fillCircles(ctx, circles, P.edgeInner, band);
  strokeAll(ctx, lists, P.sandWidth, col.main);
  if (col.mid !== col.main) strokeAll(ctx, lists, P.midWidth, col.mid);
  // Flecken
  for (const [x, y, rx, ry, dark] of patches) {
    ctx.fillStyle = dark ? 'rgba(143,106,59,0.14)' : 'rgba(255,248,214,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Spurrillen
  ctx.setLineDash(P.rutDash);
  ctx.lineCap = 'butt';
  ctx.strokeStyle = P.rutColor;
  ctx.lineWidth = P.rutWidth;
  ctx.beginPath();
  for (const [s, e] of ruts) { ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); }
  ctx.stroke();
  ctx.setLineDash([]);
  // Mittelkiesel und Randsteine
  for (const c of [0, 1]) {
    ctx.fillStyle = P.pebbleColors[c];
    ctx.beginPath();
    for (const [x, y, r, k] of pebbles) if (k === c) { ctx.moveTo(x + r, y); ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); }
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(110,76,42,0.45)';
  ctx.beginPath();
  for (const [x, y, r] of stones) { ctx.moveTo(x + 0.8 + r + 0.5, y + 1.5); ctx.ellipse(x + 0.8, y + 1.5, r + 0.5, r * 0.6, 0, 0, Math.PI * 2); }
  ctx.fill();
  ctx.fillStyle = P.stoneColors[0];
  ctx.beginPath();
  for (const [x, y, r] of stones) { ctx.moveTo(x + r, y); ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); }
  ctx.fill();
  ctx.fillStyle = P.stoneColors[1];
  ctx.beginPath();
  for (const [x, y, r] of stones) { ctx.moveTo(x - r * 0.25 + r * 0.55, y - r * 0.2); ctx.ellipse(x - r * 0.25, y - r * 0.2, r * 0.55, r * 0.32, 0, 0, Math.PI * 2); }
  ctx.fill();
  if (fringe.length) fillCircles(ctx, fringe, P.fringeRadius, col.fringe);
  ctx.restore();
}
