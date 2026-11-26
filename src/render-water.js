// Fluss, See und Brücke der Wiese (B-104). Nur Zeichnen, nur im Hintergrund-Cache (bgCanvas), nie pro Frame.
// Kacheln kommen aus MAPS.<id> (river, lake, bridges), Farben und Maße aus WATER_STYLE (config.js).
// Deterministisch (tileRand), keine Verläufe, kein shadowBlur.
import { TILE, ROWS, MAPS, STYLE, WATER_STYLE as W, DECOR_STYLE as D, PAINTED_STYLE } from './config.js';
import { tileRand } from './decor.js';
import { shd, outlineOf } from './draw-utils.js';

const center = ([c, r]) => [(c + 0.5) * TILE, (r + 0.5) * TILE];
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

// Geometrie aus den Kacheln einer Karte; null ohne Wasser.
// river: Punkte der Flusslinie (oben beginnend), lake: { cx, cy, discs } (Kreismitten der Seekacheln),
// bridges: [{ x, y, horizontal }] (Laufrichtung aus den Nachbar-Wegkacheln).
export function waterGeometry(mapId, blocked) {
  const m = MAPS[mapId];
  if (!m?.water?.length) return null;
  const bridges = m.bridges || [];
  const river = riverLine(m.river || [], bridges, W.riverWiggle);
  const lakeTiles = m.lake || [];
  const discs = lakeTiles.map(center);
  let lake = discs.length ? { cx: discs.reduce((s, d) => s + d[0], 0) / discs.length, cy: discs.reduce((s, d) => s + d[1], 0) / discs.length, discs } : null;
  // Stil 1: mit gemalter Form (paintedWater, Entwurfs-px) ist der See die Ellipse des Entwurfs (auch im Rückfall-Zeichnen)
  const pe = m.paintedWater?.lake;
  if (lake && pe) {
    const k = TILE / PAINTED_STYLE.unit;
    lake = { ...lake, cx: pe[0] * k, cy: pe[1] * k, ellipse: [pe[2] * k, pe[3] * k] };
  }
  let mouthOn = false; // Fluss mündet in den See
  if (river.length) {
    // Oberes Ende unter den Baumkronen; unten mündet der Fluss in die nächste Seekachel
    if (m.river[0][1] === 0) river.unshift([river[0][0], W.riverTop]);
    if (lake) {
      const last = river[river.length - 1];
      let best = null;
      for (const d of discs) if (!best || Math.hypot(d[0] - last[0], d[1] - last[1]) < Math.hypot(best[0] - last[0], best[1] - last[1])) best = d;
      // Stil 1: nur einmünden, wenn der See direkt anschließt (sonst liefe der Fluss über Bauplätze)
      if (Math.hypot(best[0] - last[0], best[1] - last[1]) <= 1.5 * TILE) { river.push(best); mouthOn = true; }
    }
  }
  return { river, lake, mouth: mouthOn, bridges: bridgeList(bridges, blocked) };
}

// Mittellinie eines Flusses aus einer Kachelkette (auch Lavafluss, B-030): Kachelmitten mit deterministischem Schwung
// quer zur Laufrichtung (höchstens wiggle px); an der Brücke gerade, direkt daneben halb.
export function riverLine(tiles, bridges, wiggle) {
  return tiles.map(([c, r], i, list) => {
    const [x, y] = center([c, r]);
    const near = bridges.some((b) => Math.abs(b[0] - c) + Math.abs(b[1] - r) <= 1);
    const onBridge = bridges.some((b) => same(b, [c, r]));
    const k = onBridge ? 0 : near ? 0.5 : 1;
    const wig = (tileRand(c, r, 120) - 0.5) * 2 * wiggle * k;
    const vertical = list.length < 2 || list[Math.min(i + 1, list.length - 1)][0] === list[Math.max(i - 1, 0)][0];
    return vertical ? [x + wig, y] : [x, y + wig];
  });
}

// Brücken mit Laufrichtung aus den Nachbar-Wegkacheln: [{ x, y, horizontal }]
export function bridgeList(bridges, blocked) {
  return bridges.map(([c, r]) => {
    const [x, y] = center([c, r]);
    const horizontal = !blocked || blocked.has(`${c - 1},${r}`) || blocked.has(`${c + 1},${r}`);
    return { x, y, horizontal };
  });
}

// Abstand der Hülle der Kreise (Radius R) um die Kachelmitten von der Seemitte in Richtung a
function hullRadius(lake, R, a) {
  const ux = Math.cos(a), uy = Math.sin(a);
  let t = R * 0.6;
  for (const [x, y] of lake.discs) {
    const dx = x - lake.cx, dy = y - lake.cy, b = dx * ux + dy * uy, q = R * R - (dx * dx + dy * dy - b * b);
    if (q >= 0) t = Math.max(t, b + Math.sqrt(q));
  }
  return t;
}

const HULL_SAMPLES = 72; // Abtastung der Hülle für die Glättung

// Ufer-Radius als Funktion des Winkels: Hülle geglättet auf die Harmonischen bis W.lakeHarmonics
// (Ordnung 2 ergibt ein schräges Oval ohne Zipfel), mal W.lakeScale.
export function lakeShape(lake, R) {
  if (lake.ellipse) { // Ellipse (gemalte Form), je Lage um R - lakeRadius größer
    const ex = lake.ellipse[0] + R - W.lakeRadius, ey = lake.ellipse[1] + R - W.lakeRadius;
    return (ang) => 1 / Math.hypot(Math.cos(ang) / ex, Math.sin(ang) / ey);
  }
  const H = W.lakeHarmonics, co = [];
  const r = Array.from({ length: HULL_SAMPLES }, (_, i) => hullRadius(lake, R, (i / HULL_SAMPLES) * Math.PI * 2));
  for (let k = 0; k <= H; k++) {
    let a = 0, b = 0;
    r.forEach((v, i) => { const t = (i / HULL_SAMPLES) * Math.PI * 2 * k; a += v * Math.cos(t); b += v * Math.sin(t); });
    co.push([(a / HULL_SAMPLES) * (k ? 2 : 1), (b / HULL_SAMPLES) * 2]);
  }
  return (ang) => co.reduce((s, [a, b], k) => s + a * Math.cos(k * ang) + (k ? b * Math.sin(k * ang) : 0), 0) * W.lakeScale;
}

// Umriss des Sees: geglättete Form (lakeShape), von der Seemitte aus in n Richtungen abgetastet.
export function lakeOutline(lake, R, n = W.lakePoints) {
  const rad = lakeShape(lake, R);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [lake.cx + Math.cos(a) * rad(a), lake.cy + Math.sin(a) * rad(a)];
  });
}

// Oberes Seeufer bei x (Form rad): kleinstes y, das noch im See liegt; ohne Treffer die Seemitte
function lakeTop(lake, rad, x) {
  const inside = (y) => { const dx = x - lake.cx, dy = y - lake.cy; return Math.hypot(dx, dy) <= rad(Math.atan2(dy, dx)); };
  if (!inside(lake.cy)) return lake.cy;
  let lo = lake.cy - 4 * TILE, hi = lake.cy;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (inside(m)) hi = m; else lo = m; }
  return hi;
}

// Einmündung des Flusses: Aufweitung mit runden Flanken vom Fluss (halbe Breite h) in den See (Form der Lage R)
function mouth(ctx, g, h, R) {
  const [x, y] = g.river[g.river.length - 2];
  const rad = lakeShape(g.lake, R), f = W.mouthFlare;
  const top = lakeTop(g.lake, rad, x), yl = lakeTop(g.lake, rad, x - h - f) + f, yr = lakeTop(g.lake, rad, x + h + f) + f;
  const y0 = Math.max(y, top - W.mouthLength);
  ctx.beginPath();
  ctx.moveTo(x - h, y0);
  ctx.quadraticCurveTo(x - h, Math.min(top, yl), x - h - f, yl);
  ctx.lineTo(x + h + f, yr);
  ctx.quadraticCurveTo(x + h, Math.min(top, yr), x + h, y0);
  ctx.closePath();
  ctx.fill();
}

export function closedCurve(ctx, pts) {
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

export function openCurve(ctx, pts) {
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
    if (k === 1 && g.mouth) mouth(ctx, g, w / 2, R);
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
  if (g.lake && g.mouth) {
    const [x, y] = g.river[g.river.length - 2]; // letzte Flusskachel vor dem See
    // links am geraden Ufer, wo der See beginnt; rechts in der Kehle der Aufweitung
    const rad = lakeShape(g.lake, W.lakeRadius + W.outlineWidth + W.bankWidth / 2), f = W.mouthFlare;
    const [[lx, ly], [rx, ry]] = W.mudMouth;
    out.push([x - half, lakeTop(g.lake, rad, x), lx, ly], [x + half + f, lakeTop(g.lake, rad, x + half + f) + f / 2, rx, ry]);
  }
  if (g.lake) {
    // einspringende Ecken der Hülle (Innenkurven des Ufers)
    const pts = lakeOutline(g.lake, W.lakeRadius + W.outlineWidth + W.bankWidth / 2);
    const n = pts.length;
    pts.forEach((p, i) => {
      const a = pts[(i + n - 1) % n], c = pts[(i + 1) % n];
      const cross = (p[0] - a[0]) * (c[1] - p[1]) - (p[1] - a[1]) * (c[0] - p[0]);
      if (cross < W.mudConcave && out.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > W.mudGap)) out.push([p[0], p[1], ...W.mudSpot]);
    });
  }
  return out;
}

// Uferdeko des Sees (deterministisch aus Geometrie und WATER_STYLE.shore): [{ kind, x, y, ... }]
// kind: 'pad' (Seerose im Wasser), 'reed' (Schilfgruppe am Ufer), 'stone', 'flower', 'tuft' (an Land).
export function shoreDecor(g) {
  if (!g?.lake) return [];
  const S = W.shore, { cx, cy } = g.lake;
  const water = lakeShape(g.lake, W.lakeRadius), bank = lakeShape(g.lake, W.lakeRadius + W.outlineWidth + W.bankWidth);
  const at = (deg, d) => { const a = (deg * Math.PI) / 180, r = bank(a) + d; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const out = [];
  for (const [deg, f, size, bloom] of S.pads) {
    const a = (deg * Math.PI) / 180, r = water(a) * (1 + f);
    out.push({ kind: 'pad', x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, size, bloom, rot: a });
  }
  for (const [deg, d, n] of S.reeds) { const [x, y] = at(deg, d); out.push({ kind: 'reed', x, y, n }); }
  for (const [deg, d, size] of S.stones) { const [x, y] = at(deg, d); out.push({ kind: 'stone', x, y, size }); }
  for (const [deg, d, v] of S.flowers) { const [x, y] = at(deg, d); out.push({ kind: 'flower', x, y, v }); }
  for (const [deg, d] of S.tufts) { const [x, y] = at(deg, d); out.push({ kind: 'tuft', x, y }); }
  // Stil 1: See liegt jetzt unten links; nichts links außerhalb des Feldes und nichts in der untersten Zeile (dort liegen Baumrahmen und Brunnen des alten Zeichnens)
  return out.filter((p) => p.x >= 0 && p.y < (ROWS - 1) * TILE);
}

// Fläche mit Flat-Pop-Kontur (abgedunkelte Eigenfarbe). Ohne clip, damit das Wasser bei genau einem clip (Brücke) bleibt.
function outlined(ctx, trace, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = outlineOf(color);
  ctx.lineWidth = STYLE.outlineWidth;
  ctx.beginPath();
  trace(ctx);
  ctx.fill();
  ctx.stroke();
}

function poly(ctx, pts, color) {
  outlined(ctx, (c) => {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  }, color);
}

// Ellipse mit Kontur (Bezier, ohne arc/ellipse)
function ellPart(ctx, x, y, rx, ry, color) {
  const k = 0.5523;
  outlined(ctx, (c) => {
    c.moveTo(x + rx, y);
    c.bezierCurveTo(x + rx, y + ry * k, x + rx * k, y + ry, x, y + ry);
    c.bezierCurveTo(x - rx * k, y + ry, x - rx, y + ry * k, x - rx, y);
    c.bezierCurveTo(x - rx, y - ry * k, x - rx * k, y - ry, x, y - ry);
    c.bezierCurveTo(x + rx * k, y - ry, x + rx, y - ry * k, x + rx, y);
    c.closePath();
  }, color);
}

// Seerosenblatt mit Kerbe (zur Seemitte), optional Blüte
function drawPad(ctx, p) {
  const S = W.shore, [rx, ry] = S.pad.map((v) => v * p.size), n = S.padNotch / 2, pts = [[p.x, p.y]];
  for (let i = 0; i <= 12; i++) {
    const a = p.rot + Math.PI + n + (i / 12) * (Math.PI * 2 - 2 * n);
    pts.push([p.x + Math.cos(a) * rx, p.y + Math.sin(a) * ry]);
  }
  poly(ctx, pts, W.pad);
  if (!p.bloom) return;
  const [bx, by, bc] = S.padBloom;
  for (const dx of [-1, 1]) ellipse(ctx, p.x + dx * bx * 0.6, p.y - 1, bx, by, W.padFlower);
  ellipse(ctx, p.x, p.y - 2, bx * 0.8, by, W.padFlower);
  ellipse(ctx, p.x, p.y - 1.2, bc, bc * 0.7, W.padCenter);
}

// Schilfgruppe: Blätter am Fuß, Halme mit Rohrkolben
function drawReeds(ctx, p) {
  const S = W.shore, x0 = p.x - ((p.n - 1) * S.reedStep) / 2;
  poly(ctx, [[p.x - S.reedLeafLen, p.y + 1], [p.x - 1, p.y - S.reedLeafLen * 0.9], [p.x + 1, p.y + 1]], S.reedLeaf);
  poly(ctx, [[p.x - 1, p.y + 1], [p.x + 2, p.y - S.reedLeafLen], [p.x + S.reedLeafLen * 0.8, p.y + 1]], S.reedLeaf);
  for (let i = 0; i < p.n; i++) {
    const x = x0 + i * S.reedStep, h = S.reedHeights[i % S.reedHeights.length], lean = (i - (p.n - 1) / 2) * 0.8;
    stroke(ctx, [[x, p.y + 1], [x + lean, p.y - h]], W.reed, S.reedWidth);
    ellPart(ctx, x + lean, p.y - h + S.reedHead[1], S.reedHead[0], S.reedHead[1], W.reedHead);
  }
}

function drawStone(ctx, p) {
  const [rx, ry] = W.shore.stoneSize.map((v) => v * p.size);
  ellPart(ctx, p.x, p.y, rx, ry, W.shore.stone);
  ellipse(ctx, p.x - rx * 0.25, p.y - ry * 0.35, rx * 0.5, ry * 0.4, W.shore.stoneTop);
}

// Uferblume: Stiel, fünf Blütenblätter in Wiesenfarbe, gelbe Mitte (wie drawFlower, ohne arc)
function drawShoreFlower(ctx, p) {
  const S = W.shore, col = D.flowers[p.v % D.flowers.length];
  stroke(ctx, [[p.x, p.y + 3], [p.x, p.y]], D.stem, D.detailWidth);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    ellipse(ctx, p.x + Math.cos(a) * S.flowerRing, p.y + Math.sin(a) * S.flowerRing, S.flowerPetal, S.flowerPetal, col);
  }
  ellipse(ctx, p.x, p.y, S.flowerPetal * 0.85, S.flowerPetal * 0.85, D.flowerCore);
}

function drawShoreTuft(ctx, p) {
  W.shore.tuftHeights.forEach((h, i) => {
    const dx = (i - 1) * 3;
    poly(ctx, [[p.x + dx - 1.6, p.y + 3], [p.x + dx * 1.25, p.y + 3 - h], [p.x + dx + 1.6, p.y + 3]], D.tuft);
  });
}

// Glanzstriche und Uferdeko (über der Fläche)
function drawDetails(ctx, g) {
  ctx.lineCap = 'round';
  const r = g.river;
  for (const f of W.riverGlintAt) {
    if (r.length < 3) break;
    const i = Math.min(r.length - 2, Math.max(1, Math.round(f * (r.length - 1))));
    const [x, y] = r[i];
    stroke(ctx, W.riverGlint.map(([dx, dy]) => [x + dx, y + dy]), W.glint, W.glintWidth);
  }
  if (!g.lake) return;
  const { cx, cy } = g.lake;
  stroke(ctx, W.lakeGlint.map(([dx, dy]) => [cx + dx, cy + dy]), W.glint, W.glintWidth);
  const items = shoreDecor(g);
  // Reihenfolge: Wasser, Steine, Gras, Blumen, Schilf (von oben nach unten sortiert, damit Vorderes vorn liegt)
  const order = ['pad', 'stone', 'tuft', 'flower', 'reed'];
  items.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.y - b.y);
  const draw = { pad: drawPad, reed: drawReeds, stone: drawStone, flower: drawShoreFlower, tuft: drawShoreTuft };
  for (const p of items) draw[p.kind](ctx, p);
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
