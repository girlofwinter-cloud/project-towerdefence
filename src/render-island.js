// Bauplatz-Inseln der Wiese (B-082): Gras-Plateau mit Kontur und kurzer Wand unter einem Turm.
// Nur Zeichnen, im Frame-Pfad (nicht im Hintergrund-Cache). Wenige Ellipsen, keine Verläufe, kein shadowBlur.
import { ISLAND_STYLE as I } from './config.js';

const TWO_PI = Math.PI * 2;

function blob(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TWO_PI);
  ctx.fill();
}

// Insel unter der Turmmitte (x, y). mode: 'built' (voll), 'ghost' (blasse Vorschau), 'bad' (Vorschau, rötlich).
export function drawIsland(ctx, x, y, mode = 'built') {
  const c = I.colors;
  const a = mode === 'built' ? 1 : I.ghostAlpha;
  const cy = y + I.offsetY;
  const rgba = (rgb, k = 1) => `rgba(${rgb},${+(a * k).toFixed(3)})`;
  blob(ctx, x + 2, cy + I.wall + 2, I.rx + 1, I.ry, rgba(c.shadow, I.shadowAlpha));
  blob(ctx, x, cy + I.wall, I.rx + I.outline, I.ry + I.outline, rgba(c.outline));
  blob(ctx, x, cy + I.wall, I.rx, I.ry, rgba(c.wall));
  blob(ctx, x, cy, I.rx + I.outline, I.ry + I.outline, rgba(c.outline));
  blob(ctx, x, cy, I.rx, I.ry, rgba(c.top));
  blob(ctx, x - 2, cy - 2, I.rx * 0.78, I.ry * 0.72, rgba(c.light, 0.8));
  blob(ctx, x + 1, cy + 1.5, I.rx * 0.6, I.ry * 0.6, rgba(c.top));
  if (mode === 'bad') blob(ctx, x, cy, I.rx, I.ry, `rgba(${I.badTint},${I.badAlpha})`);
}
