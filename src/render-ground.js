// Boden der Wiese (B-078): weiche Flecken, Plateaus mit dunkler Kante, Grasbüschel.
// Nur Zeichnen (Positionen kommen aus decor.js, Zahlen aus config.js). Wird ausschließlich in den
// Hintergrund-Cache (bgCanvas) gemalt, nie pro Frame; kein shadowBlur, keine Verlaufsobjekte.
import { GROUND_STYLE, WIDTH, HEIGHT } from './config.js';
import { blobPoints, tileRand } from './decor.js';

// Glatte geschlossene Kurve durch Mittelpunkte der Kanten (quadratisch), skaliert um (cx, cy), versetzt um (dx, dy).
function smooth(ctx, pts, cx, cy, sc = 1, dx = 0, dy = 0) {
  const q = pts.map((p) => [cx + (p[0] - cx) * sc + dx, cy + (p[1] - cy) * sc + dy]);
  const n = q.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(q[n - 1], q[0]);
  ctx.beginPath();
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(q[i], q[(i + 1) % n]);
    ctx.quadraticCurveTo(q[i][0], q[i][1], m[0], m[1]);
  }
  ctx.closePath();
}

function drawTuft(ctx, t, G) {
  const cols = t.dark ? [G.blade[0], G.blade[1]] : [G.blade[1], G.blade[2]];
  for (let k = -1; k <= 1; k++) {
    const h = (4 + tileRand(t.seed, k + 2, 90) * 3.2) * t.s;
    const tx = t.x + k * 2.6 * t.s + (tileRand(t.seed, k + 2, 91) - 0.5) * 2;
    ctx.fillStyle = cols[k === 0 ? 1 : 0];
    ctx.beginPath();
    ctx.moveTo(t.x + k * 1.8 * t.s - 1.1 * t.s, t.y);
    ctx.lineTo(tx + k * 0.8, t.y - h);
    ctx.lineTo(t.x + k * 1.8 * t.s + 1.1 * t.s, t.y);
    ctx.closePath();
    ctx.fill();
  }
}

// Reihenfolge: Grundfläche, Flecken, Plateaus. Büschel kommen separat (drawGroundTufts), damit der Weg dazwischen liegt.
// G: Stilblock der Karte (Standard: Wiese)
export function drawGround(ctx, ground, G = GROUND_STYLE) {
  ctx.fillStyle = G.base;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (const p of ground.patches) {
    const pts = blobPoints(p.x, p.y, p.rx, p.ry, p.seed, G.blobPoints);
    ctx.fillStyle = p.tone === 'light' ? G.light : G.dark;
    for (let k = 0; k < G.patchLayers; k++) {
      smooth(ctx, pts, p.x, p.y, 1 - k * G.patchLayerShrink);
      ctx.fill();
    }
  }
  for (const p of ground.plateaus) {
    const pts = blobPoints(p.x, p.y, p.rx, p.ry, p.seed, G.plateauPoints);
    ctx.fillStyle = G.plateauWall;
    smooth(ctx, pts, p.x, p.y, 1.02, 1, G.plateauDrop);
    ctx.fill();
    ctx.fillStyle = G.plateauTop;
    smooth(ctx, pts, p.x, p.y, 1);
    ctx.fill();
    ctx.fillStyle = G.plateauLight;
    for (let k = 0; k < 3; k++) {
      smooth(ctx, pts, p.x, p.y, 0.92 - k * 0.2, -2, -2.5);
      ctx.fill();
    }
    ctx.strokeStyle = G.plateauRim;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    smooth(ctx, pts, p.x, p.y, 1.02, 1, G.plateauDrop);
    ctx.stroke();
  }
}

// Grasbüschel (nach dem Weg, vor der Deko; nie auf Wegkacheln, siehe groundPatches)
export function drawGroundTufts(ctx, ground, G = GROUND_STYLE) {
  for (const t of ground.tufts) drawTuft(ctx, t, G);
}

// Gemalte Flecken (B-142): mischt die Deckkraft-Felder aus mottleField (decor.js) pixelweise in den Cache.
// Liest den bisher gezeichneten Boden (getImageData), interpoliert das grobe Raster bilinear und schreibt zurück.
// Nur beim Bau des Hintergrund-Cache; ohne Pixelzugriff (Mock, alte Browser) bleibt der Boden ungefleckt.
export function drawMottle(ctx, field, P) {
  const img = typeof ctx.getImageData === 'function' ? ctx.getImageData(0, 0, WIDTH, HEIGHT) : null;
  if (!img || !img.data) return false;
  const d = img.data, w = img.width || WIDTH, h = img.height || HEIGHT;
  const { cols, cell, dark, light } = field;
  const [dr, dg, db] = P.dark, [lr, lg, lb] = P.light;
  for (let y = 0; y < h; y++) {
    const gy = y / cell, j = Math.floor(gy), fy = gy - j;
    const r0 = j * cols, r1 = r0 + cols;
    for (let x = 0; x < w; x++) {
      const gx = x / cell, i = Math.floor(gx), fx = gx - i;
      const k00 = r0 + i, k10 = k00 + 1, k01 = r1 + i, k11 = k01 + 1;
      const ad = (dark[k00] * (1 - fx) + dark[k10] * fx) * (1 - fy) + (dark[k01] * (1 - fx) + dark[k11] * fx) * fy;
      const al = (light[k00] * (1 - fx) + light[k10] * fx) * (1 - fy) + (light[k01] * (1 - fx) + light[k11] * fx) * fy;
      if (ad === 0 && al === 0) continue;
      const p = (y * w + x) * 4;
      let r = d[p], g = d[p + 1], b = d[p + 2];
      r += (dr - r) * ad; g += (dg - g) * ad; b += (db - b) * ad;
      d[p] = r + (lr - r) * al; d[p + 1] = g + (lg - g) * al; d[p + 2] = b + (lb - b) * al;
    }
  }
  ctx.putImageData(img, 0, 0);
  return true;
}
