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
// P (B-142, gemalter Boden, optional): derselbe Verlauf wird kräftiger und läuft über die ganze Diagonale
// von warmem Licht oben links in Abschattung rechts unten; die Vignette rückt nach rechts unten.
export function drawLight(ctx, L = LIGHT_STYLE, P = null) {
  const diag = Math.hypot(WIDTH, HEIGHT);
  const g = P
    ? ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
    : ctx.createLinearGradient(0, 0, diag * L.gradientReach * 0.8, diag * L.gradientReach * 0.6);
  if (P) {
    g.addColorStop(0, `rgba(${P.tint},${P.sunAlpha})`);
    g.addColorStop(P.sunMid, `rgba(${P.tint},${P.sunMidAlpha})`);
    // zwei durchsichtige Stopps, damit sich Licht- und Schattenton nicht mischen
    g.addColorStop(P.sunEnd, `rgba(${P.tint},0)`);
    g.addColorStop(P.sunEnd, `rgba(${P.shadow},0)`);
    g.addColorStop(1, `rgba(${P.shadow},${P.shadeAlpha})`);
  } else {
    g.addColorStop(0, `rgba(${L.tint},${L.gradientAlpha})`);
    g.addColorStop(1, `rgba(${L.tint},0)`);
  }
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
  const V = P || L;
  const vx = P ? P.vignetteX * WIDTH : WIDTH / 2, vy = P ? P.vignetteY * HEIGHT : HEIGHT / 2;
  const v = ctx.createRadialGradient(vx, vy, r * V.vignetteInner, vx, vy, r);
  v.addColorStop(0, `rgba(${V.shadow},0)`);
  v.addColorStop(1, `rgba(${V.shadow},${V.vignetteAlpha})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

