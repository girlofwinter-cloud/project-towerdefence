// Weg im Flat-Pop-Stil (B-071): welliger Rand aus Kreisen, Kontur, Saum, Rillen, Steine, helle Mitte.
// Nur Zeichnen. Wird ausschließlich in den Hintergrund-Cache (bgCanvas) gemalt, nie pro Frame.
import { PATH_STYLE } from './config.js';
import { tileRand, tileHash } from './decor.js';
import { shd, lit } from './draw-utils.js';

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
  return Math.max(PATH_STYLE.grooveWidth / 2, contourReach());
}

// Äußerster Rand der Kontur (Randkreise oder durchgehende Kontur); B-143: die Grasfuge liegt außerhalb davon.
export function contourReach(P = PATH_STYLE) {
  return Math.max(P.contourWidth / 2, P.edgeOffset + P.waveAmp * (1 + P.waveHarmonic) + P.edgeRadius);
}

// Saum (B-143 Nacharbeit): unterbrochene Büschel über dem äußeren Rand der Fuge, deterministisch (tileRand).
// Je Seite eines Segments wechseln Büschel (P.fringeClump) und Lücken (P.fringeGap). Teile im Inneren eines
// anderen Wegs (Kreuzung, Innenkurve) entfallen. Rückgabe: Teile { x, y, nx, ny, dx, dy, h, k } (Fußpunkt bei
// P.fringeInner, Normale nach außen, Tangente, Länge, Hash) sowie belegte und gesamte Randlänge in px.
export function fringeClumps(lists, P = PATH_STYLE) {
  const items = [];
  let covered = 0, total = 0, seg = 0;
  const lerp = (r, u) => r[0] + u * (r[1] - r[0]);
  for (const pts of lists) {
    for (let i = 0; i < pts.length - 1; i++, seg++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1) continue;
      const dx = (b.x - a.x) / len, dy = (b.y - a.y) / len;
      for (const side of [-1, 1]) {
        total += len;
        const nx = -dy * side, ny = dx * side;
        let s = -tileRand(seg, side + 2, 20) * lerp(P.fringeGap, 0.5), k = 0, clump = true;
        while (s < len) {
          const run = clump ? lerp(P.fringeClump, tileRand(seg, k, 21 + side)) : lerp(P.fringeGap, tileRand(seg, k, 24 + side));
          if (clump) {
            for (let t = Math.max(s, 0) + P.fringeStep / 2; t < Math.min(s + run, len); t += P.fringeStep, k++) {
              const x = a.x + dx * t + nx * P.fringeInner, y = a.y + dy * t + ny * P.fringeInner;
              if (distToPaths(lists, x, y) < P.fringeInner - 1) continue;
              const bulge = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - s) / run))); // Büschel in der Mitte am dicksten
              items.push({ x, y, nx, ny, dx, dy, h: lerp(P.fringeHeight, tileRand(seg, k, 27 + side)) * bulge, k: tileHash(seg, k, 30 + side) });
              covered += P.fringeStep;
            }
          }
          s += run;
          clump = !clump;
          k++;
        }
      }
    }
  }
  return { items, covered, total };
}

// Zeichnet die Saum-Teile je Karte (P.fringeKind) in zwei Farben (col.fringe, col.fringeAccent), je Farbe ein Pfad.
function drawFringe(ctx, items, P, col) {
  const accent = col.fringeAccent || col.fringe;
  const kind = P.fringeKind;
  for (const pass of [0, 1]) {
    ctx.beginPath();
    for (const f of items) {
      const second = f.k % 3 === 0; // jedes dritte Teil in der Zweitfarbe
      const lean = ((f.k >>> 8) % 100) / 100 - 0.5; // Neigung entlang des Wegs
      if (kind === 'snow') {
        // Schatten (Zweitfarbe) unter jedem Klumpen, dann Schnee darüber
        const r = P.fringeRadius * (f.h / P.fringeHeight[1]) * (0.8 + ((f.k >>> 4) % 10) / 20), cx = f.x + f.nx * (r + 1.3), cy = f.y + f.ny * (r + 1.3); // innen nie über fringeInner (auch der Schatten nicht)
        if (pass === 0) circlePath(ctx, cx + 0.6, cy + 1.2, r);
        else circlePath(ctx, cx, cy, r);
      } else if (kind === 'ash') {
        const r = P.fringeRadius * (f.h / P.fringeHeight[1]) * (0.7 + ((f.k >>> 4) % 10) / 20), cx = f.x + f.nx * r + f.dx * lean, cy = f.y + f.ny * r + f.dy * lean; // innen nie über fringeInner
        if (pass === 0) circlePath(ctx, cx, cy, r);
        else if (second) circlePath(ctx, cx + lean * 2, cy, 1.1); // Glutpunkt
      } else if ((pass === 1) === second) {
        const tx = f.x + f.nx * f.h + f.dx * lean * f.h * 0.8, ty = f.y + f.ny * f.h + f.dy * lean * f.h * 0.8;
        if (kind === 'leaves') {
          // Blatt: zwei Bögen vom Fuß zur Spitze
          const w = f.h * 0.45, mx = (f.x + tx) / 2, my = (f.y + ty) / 2;
          ctx.moveTo(f.x, f.y);
          ctx.quadraticCurveTo(mx + f.dx * w, my + f.dy * w, tx, ty);
          ctx.quadraticCurveTo(mx - f.dx * w, my - f.dy * w, f.x, f.y);
        } else {
          // Halm: schmales Dreieck vom Fuß nach außen
          ctx.moveTo(f.x - f.dx * 1.6, f.y - f.dy * 1.6);
          ctx.lineTo(tx, ty);
          ctx.lineTo(f.x + f.dx * 1.6, f.y + f.dy * 1.6);
          ctx.closePath();
        }
      }
    }
    ctx.fillStyle = kind === 'snow' ? (pass === 0 ? accent : col.fringe) : kind === 'ash' ? (pass === 0 ? col.fringe : accent) : (pass === 0 ? col.fringe : accent);
    ctx.fill();
  }
}

export function drawPathStyled(ctx, paths, theme) {
  const P = { ...PATH_STYLE, ...(theme?.pathStyle || {}) }; // B-073: Eis überschreibt Steine, Glanz und Flecken
  const col = { ...P.colors, ...(theme?.path || {}) };
  const band = shd(col.main, P.bandShade);
  const lists = paths.map((p) => p.points);
  const circles = [];
  const stones = [];
  const pebbles = [];
  const patches = [];
  const ruts = [];
  const gravelLight = [];
  const gravelDark = [];
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
      for (const [g, list] of [[P.gravelLight, gravelLight], [P.gravelDark, gravelDark]]) list.push([at(0, g.offset), at(len, g.offset)]);
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
    }
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  strokeAll(ctx, lists, P.shadowWidth, P.shadowColor, P.shadowOffset[0], P.shadowOffset[1]);
  strokeAll(ctx, lists, P.grooveWidth, col.groove); // B-143: dunkle Grasfuge
  strokeAll(ctx, lists, P.contourWidth, col.outline);
  strokeAll(ctx, lists, P.sandWidth, col.main);
  fillCircles(ctx, circles, P.edgeRadius, col.outline);
  fillCircles(ctx, circles, P.edgeInner, band);
  strokeAll(ctx, lists, P.sandWidth, col.main, P.sandShift[0], P.sandShift[1]);
  if (col.mid !== col.main) strokeAll(ctx, lists, P.midWidth, col.mid, P.midShift[0], P.midShift[1]);
  // Flecken
  for (const [x, y, rx, ry, dark] of patches) {
    ctx.fillStyle = dark ? P.patchDark : P.patchLight;
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
  // Kiesel-Strichel (B-143): kurze helle und dunkle Striche entlang des Wegs
  ctx.lineCap = 'round';
  ctx.lineWidth = P.gravelWidth;
  for (const [g, list, color] of [[P.gravelLight, gravelLight, lit(col.mid, P.gravelLight.mix)], [P.gravelDark, gravelDark, col.edge]]) {
    ctx.setLineDash(g.dash);
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (const [s, e] of list) { ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Mittelkiesel und Randsteine
  for (const c of [0, 1]) {
    ctx.fillStyle = P.pebbleColors[c];
    ctx.beginPath();
    for (const [x, y, r, k] of pebbles) if (k === c) { ctx.moveTo(x + r, y); ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); }
    ctx.fill();
  }
  ctx.fillStyle = P.stoneShadow;
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
  if (col.fringe && P.fringeStep > 0) drawFringe(ctx, fringeClumps(lists, P).items, P, col);
  ctx.restore();
}
