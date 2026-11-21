// Licht der Wiese (B-081): Baumschatten, Lichtstreifen von oben links, sanfter Verlauf und Vignette.
// Nur Zeichnen, ausschließlich im Hintergrund-Cache (bgCanvas): Gradient-Objekte entstehen nur dort,
// nie pro Frame. Alle Farben als rgba, kein globalAlpha, kein shadowBlur.
import { LIGHT_STYLE, WIDTH, HEIGHT } from './config.js';

// Weiche Baumschatten, nach rechts unten versetzt; VOR den Kronen zeichnen.
export function drawTreeShadows(ctx, crowns, L = LIGHT_STYLE) {
  ctx.fillStyle = `rgba(${L.shadow},${L.treeShadowAlpha})`;
  for (const c of crowns) {
    ctx.beginPath();
    const x = c.x + c.r * L.treeShadowDx, y = c.y + c.r * L.treeShadowDy;
    const rx = c.r * L.treeShadowScale, ry = rx * 0.8;
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x - rx, y - ry, 2 * rx, 2 * ry, ry);
    else ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Lichtstreifen, Helligkeitsverlauf und Vignette als letzte Hintergrund-Schicht.
export function drawLight(ctx, L = LIGHT_STYLE) {
  const diag = Math.hypot(WIDTH, HEIGHT);
  const g = ctx.createLinearGradient(0, 0, diag * L.gradientReach * 0.8, diag * L.gradientReach * 0.6);
  g.addColorStop(0, `rgba(${L.tint},${L.gradientAlpha})`);
  g.addColorStop(1, `rgba(${L.tint},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // Streifen: schräge Bänder von der Oberkante nach rechts unten
  ctx.fillStyle = `rgba(${L.tint},${L.beamAlpha})`;
  const run = Math.tan(L.beamAngle) * HEIGHT;
  for (const [start, width] of L.beams) {
    const x0 = start * WIDTH, w = width * WIDTH;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0 + w, 0);
    ctx.lineTo(x0 + w + run, HEIGHT);
    ctx.lineTo(x0 + run, HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
  // Vignette: Mitte unberührt, Ecken dunkler
  const r = diag / 2;
  const v = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, r * L.vignetteInner, WIDTH / 2, HEIGHT / 2, r);
  v.addColorStop(0, `rgba(${L.shadow},0)`);
  v.addColorStop(1, `rgba(${L.shadow},${L.vignetteAlpha})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}
