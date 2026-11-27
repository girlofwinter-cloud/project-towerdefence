// Lavafluss, Lavatümpel und Steinbrücke des Vulkans (B-030). Nur Zeichnen, im Hintergrund-Cache (bgCanvas), statisch;
// dazu das leichte Glühen über dem gemalten Hintergrund (lavaGlowSpots/drawLavaGlow, je Frame).
// Kacheln kommen aus MAPS.<id> (lavaRiver, lavaPools, bridges), Farben und Maße aus LAVA_STYLE (config.js).
// Geometrie-Helfer (Flusslinie, Kurven, Umriss) teilt sich die Lava mit dem Wasser (render-water.js).
// Deterministisch (tileRand), keine Verläufe, kein shadowBlur, keine arc/ellipse (wie das Wasser).
import { TILE, HEIGHT, MAPS, LAVA_STYLE as L } from './config.js';
import { tileRand } from './decor.js';
import { riverLine, bridgeList, openCurve, closedCurve } from './render-water.js';
import { outlineOf, lit } from './draw-utils.js';

const center = ([c, r]) => [(c + 0.5) * TILE, (r + 0.5) * TILE];

// Tümpel: zusammenhängende Gruppen der Tümpelkacheln (4er-Nachbarschaft) als { cx, cy, discs, k, hx, hy };
// k = Radiusfaktor, hx/hy = halbe Ausdehnung der Kachelmitten (für das Oval), die ganze Gruppe rückt um poolShift
// vom angrenzenden Weg weg.
function poolGroups(tiles, blocked) {
  const groups = [];
  for (const t of tiles) {
    const near = groups.filter((g) => g.some(([c, r]) => Math.abs(c - t[0]) + Math.abs(r - t[1]) === 1));
    const merged = [t, ...near.flat()];
    for (const g of near) groups.splice(groups.indexOf(g), 1);
    groups.push(merged);
  }
  return groups.map((g) => {
    let dx = 0, dy = 0;
    for (const [c, r] of g) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (blocked && blocked.has(`${c + ox},${r + oy}`)) { dx -= ox; dy -= oy; }
    }
    const n = Math.hypot(dx, dy) || 1;
    const discs = g.map(center).map(([x, y]) => [x + (dx / n) * L.poolShift, y + (dy / n) * L.poolShift]);
    const xs = discs.map((d) => d[0]), ys = discs.map((d) => d[1]);
    const hx = (Math.max(...xs) - Math.min(...xs)) / 2, hy = (Math.max(...ys) - Math.min(...ys)) / 2;
    return { cx: Math.min(...xs) + hx, cy: Math.min(...ys) + hy, discs, k: g.length > 1 ? L.poolJoin : 1, hx, hy };
  });
}

// Geometrie aus den Kacheln einer Karte; null ohne Lava.
// river: Punkte der Flusslinie (Enden über den Feldrand hinaus verlängert), pools: Tümpel, bridges: [{ x, y, horizontal }].
export function lavaGeometry(mapId, blocked) {
  const m = MAPS[mapId];
  if (!m?.lava?.length) return null;
  const bridges = m.bridges || [];
  const tiles = m.lavaRiver || [];
  const river = riverLine(tiles, bridges, L.riverWiggle);
  if (river.length) {
    if (tiles[0][1] === 0) river.unshift([river[0][0], -L.edgePad]);
    if (tiles[tiles.length - 1][1] === Math.round(HEIGHT / TILE) - 1) river.push([river[river.length - 1][0], HEIGHT + L.edgePad]);
  }
  return { river, pools: poolGroups(m.lavaPools || [], blocked), bridges: bridgeList(bridges, blocked) };
}

// Umriss eines Tümpels als ruhiges Oval (Lage mit Radius R): Halbachsen = halbe Kachel-Ausdehnung mal poolSpan plus R mal k.
// Ein Tümpel aus einer Kachel ist ein Kreis mit Radius R.
export function poolOutline(p, R) {
  const rx = p.hx * L.poolSpan + R * p.k, ry = p.hy * L.poolSpan + R * p.k;
  return Array.from({ length: L.poolPoints }, (_, i) => {
    const a = (i / L.poolPoints) * Math.PI * 2;
    return [p.cx + Math.cos(a) * rx, p.cy + Math.sin(a) * ry];
  });
}

// Eine Lage von Fluss und Tümpeln: Fluss als Linie der Breite w, Tümpel als Umriss mit Radius R (optional zur Mitte um k verkleinert).
function layer(ctx, g, color, w, R, k = 1) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (g.river.length > 1) {
    ctx.lineWidth = w;
    ctx.beginPath();
    openCurve(ctx, g.river);
    ctx.stroke();
  }
  for (const p of g.pools) {
    ctx.beginPath();
    closedCurve(ctx, poolOutline(p, R).map(([x, y]) => [p.cx + (x - p.cx) * k, p.cy + (y - p.cy) * k]));
    ctx.fill();
  }
}

// Lavakörper: Glühen auf dem Boden, dunkle Kruste, Fläche, heller Kern.
function drawBody(ctx, g, glow = true) {
  const w = L.riverWidth, R = L.poolRadius, o = L.crustWidth;
  if (glow) for (const gw of L.glowWidth) layer(ctx, g, L.glow, w + 2 * (o + gw), R + o + gw);
  layer(ctx, g, L.crust, w + 2 * o, R + o);
  layer(ctx, g, L.lava, w, R);
  layer(ctx, g, L.core, w * L.coreScale[0], R, L.coreScale[0]);
  layer(ctx, g, L.coreHot, w * L.coreScale[1], R, L.coreScale[1]);
}

// Krustenschollen und Glutpunkte (deterministisch aus den Kacheln): [{ kind: 'plate'|'spark', x, y, rot }]
export function lavaDetails(g) {
  if (!g) return [];
  const out = [];
  const inner = g.river.slice(1, -1);
  inner.forEach(([x, y], i) => {
    if (i % L.plateEvery !== 1) return;
    const side = (tileRand(i, 7, 130) - 0.5) * L.riverWidth * L.plateSide;
    out.push({ kind: 'plate', x: x + side, y: y + (tileRand(i, 7, 131) - 0.5) * L.plateJitter, rot: tileRand(i, 7, 132) * Math.PI });
    out.push({ kind: 'spark', x: x - side * L.sparkOffset[0], y: y + L.sparkOffset[1], rot: 0 });
  });
  g.pools.forEach((p, i) => {
    out.push({ kind: 'plate', x: p.cx - 4, y: p.cy + 3, rot: tileRand(i, 9, 133) * Math.PI });
    out.push({ kind: 'spark', x: p.cx + 5, y: p.cy - 4, rot: 0 });
  });
  return out;
}

// Gedrehte Ellipse aus Bezier-Kurven mit Kontur (ohne arc/ellipse)
function blob(ctx, x, y, rx, ry, rot, color, stroke) {
  const k = 0.5523, c = Math.cos(rot), s = Math.sin(rot);
  const P = (dx, dy) => [x + dx * c - dy * s, y + dx * s + dy * c];
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...P(rx, 0));
  ctx.bezierCurveTo(...P(rx, ry * k), ...P(rx * k, ry), ...P(0, ry));
  ctx.bezierCurveTo(...P(-rx * k, ry), ...P(-rx, ry * k), ...P(-rx, 0));
  ctx.bezierCurveTo(...P(-rx, -ry * k), ...P(-rx * k, -ry), ...P(0, -ry));
  ctx.bezierCurveTo(...P(rx * k, -ry), ...P(rx, -ry * k), ...P(rx, 0));
  ctx.closePath();
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawDetails(ctx, g) {
  const [rx, ry] = L.plateSize;
  for (const d of lavaDetails(g)) {
    if (d.kind === 'plate') {
      blob(ctx, d.x, d.y, rx, ry, d.rot, L.plate, outlineOf(L.plate));
      blob(ctx, d.x - 1, d.y - 0.8, rx * 0.5, ry * 0.4, d.rot, lit(L.plate, 0.2));
    } else blob(ctx, d.x, d.y, L.sparkSize, L.sparkSize, 0, L.spark);
  }
}

// Lava unter dem Weg (vor drawPath)
export function drawLava(ctx, g) {
  if (!g) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawBody(ctx, g);
  drawDetails(ctx, g);
  ctx.restore();
}

// Steinbrücken (nach drawPath): Lava im Brückenbereich neu malen (der Weg endet an der Kruste), dann Schatten und Stein.
export function drawLavaBridges(ctx, g) {
  if (!g || !g.bridges.length) return;
  const B = L.bridge;
  for (const br of g.bridges) {
    const across = B.lavaReach * TILE;
    const [hw, hh] = br.horizontal ? [TILE / 2, across] : [across, TILE / 2];
    ctx.save();
    ctx.beginPath();
    ctx.rect(br.x - hw, br.y - hh, 2 * hw, 2 * hh);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawBody(ctx, g, false);
    ctx.restore();
    const [sw, sh] = br.horizontal ? [B.length, B.width] : [B.width, B.length];
    ctx.save();
    ctx.fillStyle = B.shadow;
    ctx.fillRect(br.x - sw / 2 + B.shadowOffset[0], br.y - sh / 2 + B.shadowOffset[1], sw, sh);
    ctx.translate(br.x, br.y);
    if (!br.horizontal) ctx.rotate(Math.PI / 2);
    drawStoneDeck(ctx, B);
    ctx.restore();
  }
}

// Brückendeck in lokalen Koordinaten (+x = Laufrichtung): Steinplatten, Brüstung aus versetzten Blöcken an beiden Seiten.
function drawStoneDeck(ctx, B) {
  const Ln = B.length, Wd = B.width, x0 = -Ln / 2, y0 = -Wd / 2;
  ctx.lineWidth = B.outlineWidth;
  ctx.strokeStyle = B.outline;
  ctx.fillStyle = B.stone;
  ctx.fillRect(x0, y0, Ln, Wd);
  ctx.strokeRect(x0, y0, Ln, Wd);
  ctx.strokeStyle = B.seam;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = x0 + B.slab; x < x0 + Ln - 1; x += B.slab) {
    ctx.moveTo(x, y0 + B.rail);
    ctx.lineTo(x, y0 + Wd - B.rail);
  }
  ctx.stroke();
  for (const [y, shift] of [[y0 - 1, 0], [y0 + Wd - B.rail + 1, B.block / 2]]) {
    for (let x = x0 - 1 - shift; x < x0 + Ln + 1; x += B.block) {
      const a = Math.max(x, x0 - 1), b = Math.min(x + B.block, x0 + Ln + 1);
      if (b - a < 1) continue;
      ctx.fillStyle = B.stoneTop;
      ctx.fillRect(a, y, b - a, B.rail);
      ctx.strokeStyle = B.outline;
      ctx.lineWidth = B.outlineWidth;
      ctx.strokeRect(a, y, b - a, B.rail);
    }
  }
}

// ---------- Glühen über dem gemalten Hintergrund (je Frame) ----------
// Flecken einmal je Karte: Mitten zwischen benachbarten Flusspunkten (liegen auf der geglätteten Linie) im Feld,
// nicht auf der Brücke, dazu die Tümpelkacheln. phase wächst den Fluss hinab (Puls läuft mit der Strömung).
export function lavaGlowSpots(g) {
  if (!g) return [];
  const P = L.pulse;
  const spots = [];
  for (let i = 0; i + 1 < g.river.length; i++) {
    const [a, b] = [g.river[i], g.river[i + 1]];
    const x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2;
    if (y < 0 || y > HEIGHT) continue;
    if (g.bridges.some((br) => Math.hypot(br.x - x, br.y - y) < P.bridgeGap)) continue;
    spots.push({ x, y, r: P.radius, phase: i * P.phaseStep });
  }
  g.pools.forEach((p, j) => p.discs.forEach(([x, y], k) => spots.push({ x, y, r: P.radius * 0.8, phase: (j * 3 + k) * 1.3 })));
  return spots;
}

// Deckkraft je Flecken zur Zeit t (s): pulsiert zwischen alpha[0] und alpha[1]
export function lavaGlowAlpha(spot, t) {
  const [lo, hi] = L.pulse.alpha;
  return lo + (hi - lo) * (0.5 + 0.5 * Math.sin(t * L.pulse.speed - spot.phase));
}

// Weicher Lichtfleck als Bild (einmal), danach je Flecken nur drawImage
let glowSprite = null;
function sprite() {
  if (glowSprite || typeof document === 'undefined') return glowSprite;
  const R = 32;
  const c = document.createElement('canvas');
  c.width = c.height = 2 * R;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(R, R, 0, R, R, R);
  gr.addColorStop(0, `rgba(${L.pulse.color},1)`);
  gr.addColorStop(0.5, `rgba(${L.pulse.color},0.45)`);
  gr.addColorStop(1, `rgba(${L.pulse.color},0)`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 2 * R, 2 * R);
  return (glowSprite = c);
}

// Zeichnet das Glühen (additiv). Ohne DOM (Node) nichts.
export function drawLavaGlow(ctx, spots, t) {
  const img = sprite();
  if (!img || !spots.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const s of spots) {
    ctx.globalAlpha = lavaGlowAlpha(s, t);
    ctx.drawImage(img, s.x - s.r, s.y - s.r, 2 * s.r, 2 * s.r);
  }
  ctx.restore();
}
