// Baumrahmen der Wiese (B-077): runde Kronen mit dicker dunkler Kontur im Flat-Pop-Stil.
// Nur Zeichnen (Positionen und Arten kommen aus decor.js). Wird ausschließlich in den
// Hintergrund-Cache (bgCanvas) gemalt, nie pro Frame. Kreise per roundRect (wie render-path.js).
import { TREE_FRAME, STYLE } from './config.js';
import { lit, shd, outlineOf } from './draw-utils.js';

function circlePath(ctx, x, y, r) {
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x - r, y - r, 2 * r, 2 * r, r);
  else { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
}

function disc(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  circlePath(ctx, x, y, r);
  ctx.fill();
}

// Lappen der Krone: [dx, dy, Radius] relativ zum Hauptlappen-Radius R
const LOBES = [[0, 0, 1], [-0.62, 0.28, 0.62], [0.62, 0.26, 0.64], [-0.3, -0.55, 0.62], [0.36, -0.5, 0.56], [0, 0.42, 0.6], [-0.88, -0.05, 0.46], [0.9, 0.02, 0.48]];

function baseColor(c, T) {
  const b = c.kind === 'apple' ? T.apple : c.kind === 'blossom' ? T.blossom : T.greens[c.seed % T.greens.length];
  return c.shade ? shd(b, c.shade) : b; // hintere Reihe dunkler
}

function drawShadow(ctx, c) {
  ctx.fillStyle = 'rgba(43,27,61,0.2)';
  ctx.beginPath();
  circlePath(ctx, c.x + c.r * 0.35, c.y + c.r * 0.5, c.r * 0.95);
  ctx.fill();
}

function drawFir(ctx, c, T) {
  const { x, r } = c;
  const y = c.y + r * T.firLift; // Wald: Tannen tiefer, damit die Spitze nicht weit ins Feld ragt
  const firCol = c.shade ? T.fir.map((f) => shd(f, c.shade)) : T.fir;
  const w0 = r * 0.82;
  const tiers = [[y + r * 0.55, w0, r * 0.7], [y + r * 0.05, w0 * 0.8, r * 0.7], [y - r * 0.45, w0 * 0.6, r * 0.7]];
  const out = outlineOf(firCol[0]);
  ctx.lineJoin = 'round';
  ctx.lineWidth = T.outlineWidth * 2;
  ctx.strokeStyle = out;
  const tri = (yb, w, h) => { ctx.beginPath(); ctx.moveTo(x - w, yb); ctx.lineTo(x + w, yb); ctx.lineTo(x, yb - h * 1.5); ctx.closePath(); };
  tiers.forEach(([yb, w, h]) => { tri(yb, w, h); ctx.stroke(); });
  tiers.forEach(([yb, w, h], i) => {
    ctx.fillStyle = shd(firCol[i % 2], 0.3);
    tri(yb, w, h); ctx.fill();
    ctx.fillStyle = firCol[i % 2];
    ctx.beginPath(); ctx.moveTo(x - w, yb); ctx.lineTo(x, yb - h * 1.5); ctx.lineTo(x - w * 0.1, yb); ctx.closePath(); ctx.fill();
  });
}

function drawCrown(ctx, c, T) {
  const col = baseColor(c, T);
  const R = c.r * T.lobeScale;
  const lobes = LOBES.map(([a, b, s]) => [c.x + a * R, c.y + b * R, s * R]);
  const ol = shd(outlineOf(col), 0.3);
  for (const [x, y, r] of lobes) disc(ctx, x, y, r + T.outlineWidth, ol);
  for (const [x, y, r] of lobes) disc(ctx, x, y, r, shd(col, STYLE.shadeMix));
  for (const [x, y, r] of lobes) disc(ctx, x - r * 0.09, y - r * 0.12, r * 0.93, col);
  for (const i of [0, 3, 4, 1]) { const [x, y, r] = lobes[i]; disc(ctx, x - r * 0.26, y - r * 0.3, r * 0.5, lit(col, 0.3)); }
  // Früchte oder Blüten, deterministisch aus dem Seed
  if (c.kind === 'leaf') return;
  const fruit = c.kind === 'apple';
  for (let k = 0; k < (fruit ? 5 : 7); k++) {
    const h = ((c.seed >>> (k * 3)) ^ (k * 2654435761)) >>> 0;
    const a = (h % 628) / 100;
    const d = ((h >>> 10) % 100) / 100 * c.r * 0.55;
    const px = c.x + Math.cos(a) * d, py = c.y + Math.sin(a) * d * 0.85;
    disc(ctx, px, py, fruit ? 2.2 : 1.6, fruit ? T.appleFruit : T.blossomFlower);
    if (fruit) disc(ctx, px - 0.6, py - 0.7, 0.7, T.appleGlint);
  }
}

// crowns: Liste aus treeFrame() (hinten zuerst sortiert); T: Stilblock der Karte (Standard: Wiese)
export function drawTreeFrame(ctx, crowns, T = TREE_FRAME) {
  ctx.save();
  // Reihe fuer Reihe (hinten zuerst), damit die vordere Reihe die hintere ueberdeckt
  const rows = [...new Set(crowns.map((c) => c.row))];
  for (const ri of rows) {
    const list = crowns.filter((c) => c.row === ri);
    for (const c of list) drawShadow(ctx, c);
    for (const c of list) { if (c.kind === 'fir') drawFir(ctx, c, T); else drawCrown(ctx, c, T); }
  }
  ctx.restore();
}
