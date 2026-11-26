// Fluss, See und Brücke der Wiese (B-104). Nur Zeichnen, nur im Hintergrund-Cache (bgCanvas), nie pro Frame.
// Kacheln kommen aus MAPS.<id> (river, lake, bridges), Farben und Maße aus WATER_STYLE (config.js).
// Deterministisch (tileRand), keine Verläufe, kein shadowBlur.
import { TILE, MAPS, WATER_STYLE as W } from './config.js';
import { tileRand } from './decor.js';
import { shd } from './draw-utils.js';

const center = ([c, r]) => [(c + 0.5) * TILE, (r + 0.5) * TILE];
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

// Geometrie aus den Kacheln einer Karte; null ohne Wasser.
// river: Punkte der Flusslinie (oben beginnend), lake: { cx, cy, discs } (Kreismitten der Seekacheln),
// bridges: [{ x, y, horizontal }] (Laufrichtung aus den Nachbar-Wegkacheln).
export function waterGeometry(mapId, blocked) {
  const m = MAPS[mapId];
  if (!m?.water?.length) return null;
  const bridges = m.bridges || [];
  const river = (m.river || []).map(([c, r], i, list) => {
    const [x, y] = center([c, r]);
    const near = bridges.some((b) => Math.abs(b[0] - c) + Math.abs(b[1] - r) <= 1);
    const onBridge = bridges.some((b) => same(b, [c, r]));
    // Schwung quer zur Laufrichtung; an der Brücke gerade, daneben halb
    const k = onBridge ? 0 : near ? 0.5 : 1;
    const wig = (tileRand(c, r, 120) - 0.5) * 2 * W.riverWiggle * k;
    const vertical = list.length < 2 || list[Math.min(i + 1, list.length - 1)][0] === list[Math.max(i - 1, 0)][0];
    return vertical ? [x + wig, y] : [x, y + wig];
  });
  const lakeTiles = m.lake || [];
  const discs = lakeTiles.map(center);
  const lake = discs.length ? { cx: discs.reduce((s, d) => s + d[0], 0) / discs.length, cy: discs.reduce((s, d) => s + d[1], 0) / discs.length, discs } : null;
  if (river.length) {
    // Oberes Ende unter den Baumkronen; unten mündet der Fluss in die nächste Seekachel
    if (m.river[0][1] === 0) river.unshift([river[0][0], W.riverTop]);
    if (lake) {
      const last = river[river.length - 1];
      let best = null;
      for (const d of discs) if (!best || Math.hypot(d[0] - last[0], d[1] - last[1]) < Math.hypot(best[0] - last[0], best[1] - last[1])) best = d;
      river.push(best);
    }
  }
  const out = bridges.map(([c, r]) => {
    const [x, y] = center([c, r]);
    const horizontal = !blocked || blocked.has(`${c - 1},${r}`) || blocked.has(`${c + 1},${r}`);
    return { x, y, horizontal };
  });
  return { river, lake, bridges: out };
}

// Umriss des Sees: Hülle der Kreise (Radius R) um die Kachelmitten, von der Seemitte aus abgetastet.
export function lakeOutline(lake, R, n = W.lakePoints) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
    let t = R * 0.6;
    for (const [x, y] of lake.discs) {
      const dx = x - lake.cx, dy = y - lake.cy, b = dx * ux + dy * uy, q = R * R - (dx * dx + dy * dy - b * b);
      if (q >= 0) t = Math.max(t, b + Math.sqrt(q));
    }
    pts.push([lake.cx + ux * t, lake.cy + uy * t]);
  }
  return pts;
}

function closedCurve(ctx, pts) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  ctx.closePath();
}

function openCurve(ctx, pts) {
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const l = pts[pts.length - 1];
  ctx.lineTo(l[0], l[1]);
}

// Eine Lage von Fluss und See zugleich (so verschmelzen beide): Fluss als Linie der Breite w, See als Umriss mit Radius R,
// optional zur Seemitte hin um k verkleinert (Rinne).
function layer(ctx, g, color, w, R, k = 1) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (g.river.length > 1) {
    ctx.lineWidth = w;
    ctx.beginPath();
    openCurve(ctx, g.river);
    ctx.stroke();
  }
  if (g.lake) {
    ctx.beginPath();
    const { cx, cy } = g.lake;
    closedCurve(ctx, lakeOutline(g.lake, R).map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]));
    ctx.fill();
  }
}

// Ellipse aus Bezier-Kurven (ohne arc/ellipse, damit sie vom Kachel-Test der Kleindeko getrennt bleibt, wie render-accents.js)
function ellipse(ctx, x, y, rx, ry, color) {
  const k = 0.5523;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + rx, y);
  ctx.bezierCurveTo(x + rx, y + ry * k, x + rx * k, y + ry, x, y + ry);
  ctx.bezierCurveTo(x - rx * k, y + ry, x - rx, y + ry * k, x - rx, y);
  ctx.bezierCurveTo(x - rx, y - ry * k, x - rx * k, y - ry, x, y - ry);
  ctx.bezierCurveTo(x + rx * k, y - ry, x + rx, y - ry * k, x + rx, y);
  ctx.closePath();
  ctx.fill();
}

function stroke(ctx, pts, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}

// Wasserkörper: Ufersaum, Schlamm, Kontur, Fläche, dunklere Rinne zur Mitte.
function drawBody(ctx, g) {
  const w = W.riverWidth, R = W.lakeRadius, o = W.outlineWidth, b = W.bankWidth;
  layer(ctx, g, W.bank, w + 2 * (o + b), R + o + b);
  // Schlamm an den Innenkurven: Einmündung des Flusses in den See und einspringende Ecken des Sees
  for (const [x, y, rx, ry] of mudSpots(g)) ellipse(ctx, x, y, rx, ry, W.mud);
  layer(ctx, g, W.outline, w + 2 * o, R + o);
  layer(ctx, g, W.water, w, R);
  W.channelShade.forEach((t, i) => layer(ctx, g, shd(W.water, t), w * W.channelScale[i], R, W.channelScale[i]));
}

// Schlammflecken (deterministisch aus der Geometrie)
export function mudSpots(g) {
  const out = [];
  const half = W.riverWidth / 2 + W.outlineWidth + W.bankWidth / 2;
  if (g.lake && g.river.length > 2) {
    const [x, y] = g.river[g.river.length - 2]; // letzte Flusskachel vor dem See
    const yj = y + TILE / 2 - 2;
    out.push([x - half - 1, yj, 4.5, 2.6], [x + half + 1, yj, 4, 2.4]);
  }
  if (g.lake) {
    // einspringende Ecken der Hülle (Innenkurven des Ufers)
    const pts = lakeOutline(g.lake, W.lakeRadius + W.outlineWidth + W.bankWidth / 2);
    const n = pts.length;
    pts.forEach((p, i) => {
      const a = pts[(i + n - 1) % n], c = pts[(i + 1) % n];
      const cross = (p[0] - a[0]) * (c[1] - p[1]) - (p[1] - a[1]) * (c[0] - p[0]);
      if (cross < -40 && out.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 18)) out.push([p[0], p[1], 4, 2.4]);
    });
  }
  return out;
}

// Glanzstriche, Seerosen und Schilf (über der Fläche)
function drawDetails(ctx, g) {
  ctx.lineCap = 'round';
  const r = g.river;
  for (const f of [0.45, 0.72]) {
    if (r.length < 3) break;
    const i = Math.min(r.length - 2, Math.max(1, Math.round(f * (r.length - 1))));
    const [x, y] = r[i];
    stroke(ctx, [[x - 5, y - 6], [x - 4, y + 5]], W.glint, W.glintWidth);
  }
  if (!g.lake) return;
  const { cx, cy, discs } = g.lake;
  stroke(ctx, [[cx - 14, cy - 12], [cx - 2, cy - 13]], W.glint, W.glintWidth);
  // Seerose auf der unteren Seekachel, zweites Blatt daneben
  const low = discs.reduce((a, d) => (d[1] > a[1] ? d : a), discs[0]);
  ellipse(ctx, low[0] - 2, low[1] - 4, 6.5, 3.2, W.pad);
  ellipse(ctx, low[0] - 1, low[1] - 5, 2.4, 1.6, W.padFlower);
  ellipse(ctx, low[0] - 1, low[1] - 5, 1, 0.7, W.padCenter);
  ellipse(ctx, cx - 12, cy + 8, 5, 2.5, W.pad);
  // Schilf am rechten Ufer (größtes x des Umrisses)
  const rim = lakeOutline(g.lake, W.lakeRadius);
  const right = rim.reduce((a, p) => (p[0] > a[0] ? p : a), rim[0]);
  ctx.lineCap = 'round';
  for (const [dx, h] of [[-4, 15], [-1, 18], [-6, 12]]) {
    const x = right[0] + dx, y = right[1] + 6;
    stroke(ctx, [[x, y], [x + 1, y - h]], W.reed, 1.4);
    ellipse(ctx, x + 1, y - h + 2, 1.5, 3.5, W.reedHead);
  }
}

// Wasser unter dem Weg (vor drawPath)
export function drawWater(ctx, g) {
  if (!g) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawBody(ctx, g);
  drawDetails(ctx, g);
  ctx.restore();
}

// Brücken (nach drawPath): Wasser im Brückenbereich neu malen (der Weg endet am Ufer), dann Schatten und Holz.
export function drawBridges(ctx, g) {
  if (!g || !g.bridges.length) return;
  const B = W.bridge;
  for (const br of g.bridges) {
    const across = B.waterReach * TILE;
    const [hw, hh] = br.horizontal ? [TILE / 2, across] : [across, TILE / 2];
    ctx.save();
    ctx.beginPath();
    ctx.rect(br.x - hw, br.y - hh, 2 * hw, 2 * hh);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawBody(ctx, g);
    ctx.restore();
    const [L, Wd] = [B.length, B.width];
    const [sw, sh] = br.horizontal ? [L, Wd] : [Wd, L];
    ctx.save();
    ctx.fillStyle = B.shadow;
    ctx.fillRect(br.x - sw / 2 + B.shadowOffset[0], br.y - sh / 2 + B.shadowOffset[1], sw, sh);
    ctx.translate(br.x, br.y);
    if (!br.horizontal) ctx.rotate(Math.PI / 2);
    drawDeck(ctx, B);
    ctx.restore();
  }
}

// Brückendeck in lokalen Koordinaten (+x = Laufrichtung): Bohlen quer, Geländer an beiden Längsseiten.
function drawDeck(ctx, B) {
  const L = B.length, Wd = B.width, x0 = -L / 2, y0 = -Wd / 2;
  ctx.lineWidth = B.outlineWidth;
  ctx.strokeStyle = B.outline;
  ctx.fillStyle = B.wood;
  ctx.fillRect(x0, y0, L, Wd);
  ctx.strokeRect(x0, y0, L, Wd);
  // Fugen zwischen den Bohlen (senkrecht zur Laufrichtung)
  ctx.strokeStyle = B.seam;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = x0 + B.plank; x < x0 + L - 1; x += B.plank) {
    ctx.moveTo(x, y0 + B.rail);
    ctx.lineTo(x, y0 + Wd - B.rail);
  }
  ctx.stroke();
  // Geländerbalken mit Pfosten an den Enden und in der Mitte
  for (const y of [y0, y0 + Wd - B.rail]) {
    ctx.fillStyle = B.seam;
    ctx.fillRect(x0 - 1, y, L + 2, B.rail);
    ctx.strokeStyle = B.outline;
    ctx.lineWidth = B.outlineWidth;
    ctx.strokeRect(x0 - 1, y, L + 2, B.rail);
    for (const px of [x0 - 1, -B.post / 2, x0 + L + 1 - B.post]) {
      const py = y + B.rail / 2 - B.post / 2;
      ctx.fillStyle = B.outline;
      ctx.fillRect(px, py, B.post, B.post);
    }
  }
}
