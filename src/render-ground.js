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
