// Licht der Wiese (B-081): Baumschatten, Lichtstreifen von oben links, sanfter Verlauf und Vignette.
// Nur Zeichnen, ausschließlich im Hintergrund-Cache (bgCanvas): Gradient-Objekte entstehen nur dort,
// nie pro Frame. Alle Farben als rgba, kein globalAlpha, kein shadowBlur.
import { LIGHT_STYLE, NIGHT_STYLE, WIDTH, HEIGHT, TILE } from './config.js';

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

// Abdunklung eines Punkts durch Abschattung und Vignette des gemalten Bodens (B-142 Nacharbeit), Anteil 0..1.
// Rechnet dieselben Verläufe nach, die drawLight mit P zeichnet (für Tests: Weg-Ein-/Ausgang und Burgtor hell genug).
export function paintDarkness(x, y, P) {
  const t = (x * WIDTH + y * HEIGHT) / (WIDTH * WIDTH + HEIGHT * HEIGHT);
  const shade = t <= P.sunEnd ? 0 : P.shadeAlpha * Math.min(1, (t - P.sunEnd) / (1 - P.sunEnd));
  const r = Math.hypot(WIDTH, HEIGHT) / 2, r0 = r * P.vignetteInner;
  const d = Math.hypot(x - P.vignetteX * WIDTH, y - P.vignetteY * HEIGHT);
  const vig = P.vignetteAlpha * Math.max(0, Math.min(1, (d - r0) / (r - r0)));
  return 1 - (1 - shade) * (1 - vig);
}

// ---------- B-184: Albtraum-Stimmung (auch Nacht-Look B-185), nur über dem Feld 0..WIDTH x 0..HEIGHT ----------
// Tönung: Rechteck im Mischmodus multiply (ohne Gradient, darf pro Frame laufen).
export function drawNightTint(ctx, N = NIGHT_STYLE) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WIDTH, HEIGHT);
  ctx.clip();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(${N.tint},${N.tintAlpha})`;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

// Rotes Licht von unten und Vignette (Gradienten: nur im Cache zeichnen, nie pro Frame).
export function drawNightGlow(ctx, N = NIGHT_STYLE) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WIDTH, HEIGHT);
  ctx.clip();
  const d = Math.hypot(WIDTH, HEIGHT);
  const ex = N.emberX * WIDTH, ey = N.emberY * HEIGHT;
  const red = ctx.createRadialGradient(ex, ey, 0, ex, ey, N.emberRadius * d);
  red.addColorStop(0, `rgba(${N.ember},${N.emberAlpha})`);
  red.addColorStop(1, `rgba(${N.ember},0)`);
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const r = d / 2;
  const vig = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, N.vignetteInner * r, WIDTH / 2, HEIGHT / 2, r);
  vig.addColorStop(0, `rgba(${N.vignette},0)`);
  vig.addColorStop(1, `rgba(${N.vignette},${N.vignetteAlpha})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

// Alle drei Schichten in der Reihenfolge der Bauvorlage (Tönung, rotes Licht, Vignette).
export function drawNight(ctx, N = NIGHT_STYLE) {
  drawNightTint(ctx, N);
  drawNightGlow(ctx, N);
}

// Glutpunkte am Weg: N.glowCount Punkte gleichmäßig über die Weglänge, abwechselnd links/rechts der Wegmitte.
// path = { segments, length } aus buildPath; deterministisch (gleicher Weg = gleiche Punkte).
export function emberPoints(path, N = NIGHT_STYLE, tile = TILE) {
  const segs = path?.segments ?? [];
  if (!segs.length || !(path.length > 0)) return [];
  const pts = [];
  for (let i = 0; i < N.glowCount; i++) {
    const d = ((i + 0.5) / N.glowCount) * path.length;
    const s = segs.find((g) => d <= g.start + g.len) ?? segs[segs.length - 1];
    const t = s.len > 0 ? (d - s.start) / s.len : 0;
    const nx = s.len > 0 ? -(s.b.y - s.a.y) / s.len : 0, ny = s.len > 0 ? (s.b.x - s.a.x) / s.len : 0;
    const side = (i % 2 === 0 ? 1 : -1) * N.glowSide * tile;
    pts.push({ x: s.a.x + (s.b.x - s.a.x) * t + nx * side, y: s.a.y + (s.b.y - s.a.y) * t + ny * side });
  }
  return pts;
}

// Glut pro Frame (ohne Gradient): Hof lava, Kern lava-hot, pulsierend; reduced = statisch (s = 0,5).
export function drawEmbers(ctx, pts, t, N = NIGHT_STYLE, reduced = false) {
  pts.forEach((p, i) => {
    const ph = (((t / N.glowPeriod + i * N.glowPhaseStep) % 1) + 1) % 1;
    const s = reduced ? 0.5 : 0.5 - 0.5 * Math.cos(2 * Math.PI * ph);
    ctx.fillStyle = `rgba(${N.glowLava},${(0.2 + 0.3 * s).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, N.glowHalo * (0.8 + 0.5 * s), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${N.glowHot},${(0.4 + 0.6 * s).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, N.glowCore, 0, Math.PI * 2);
    ctx.fill();
  });
}
