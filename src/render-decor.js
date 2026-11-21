// Deko der Wiese im Flat-Pop-Stil (B-079): Büsche, Felsen mit Moos, Blumen, Grasbüschel, Kiesel und flache Streu-Deko.
// Nur Zeichnen (Auswahl und Positionen kommen aus decor.js, Zahlen aus config.js). Wird nur in den
// Hintergrund-Cache gemalt, nie pro Frame. Alles bleibt flach (höchstens ca. eine halbe Kachel hoch).
// Die Streu-Deko nutzt keine arc/ellipse-Aufrufe (Bezier-Schatten), damit sie vom Kachel-Test der Kleindeko getrennt bleibt.
import { DECOR_STYLE as D, STYLE } from './config.js';
import { part, poly, rr, ell, shadow, lit, shd, outlineOf } from './draw-utils.js';

const TWO_PI = Math.PI * 2;

function dot(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();
}

// Weicher Bodenschatten aus Bezier-Kurven (ohne arc/ellipse), leicht nach rechts unten versetzt
function flatShadow(ctx, x, y, rx, ry) {
  const k = 0.5523, cx = x + rx * STYLE.groundShadowOffset, cy = y + ry * 0.5;
  ctx.save();
  ctx.fillStyle = `rgba(43,27,61,${STYLE.groundShadowAlpha})`;
  ctx.beginPath();
  ctx.moveTo(cx + rx, cy);
  ctx.bezierCurveTo(cx + rx, cy + ry * k, cx + rx * k, cy + ry, cx, cy + ry);
  ctx.bezierCurveTo(cx - rx * k, cy + ry, cx - rx, cy + ry * k, cx - rx, cy);
  ctx.bezierCurveTo(cx - rx, cy - ry * k, cx - rx * k, cy - ry, cx, cy - ry);
  ctx.bezierCurveTo(cx + rx * k, cy - ry, cx + rx, cy - ry * k, cx + rx, cy);
  ctx.fill();
  ctx.restore();
}

// Linie mit rundem Ende (Halme, Stiele, Risse)
function stroke(ctx, pts, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

// Busch: drei runde Lappen mit Kontur und Licht; Variante 1 trägt Beeren. Breite <= 10 px, Höhe ca. 8 px.
export function drawBush(ctx, x, y, v) {
  shadow(ctx, x, y + 3, 6.5);
  const c = D.bush;
  ell(ctx, x - 4.2, y, 4.4, 4, c);
  ell(ctx, x + 4.2, y, 4.4, 4, c);
  ell(ctx, x, y - 2.6, 5.2, 4.8, c);
  if (v === 1) for (const [bx, by] of [[-3, -1], [2.5, -4], [4.5, 0.5]]) dot(ctx, x + bx, y + by, 1.3, D.berry);
}

// Fels mit Moos, Variante 2 mit kleinem Begleitstein. Breite 7..9 px.
export function drawRock(ctx, x, y, v) {
  const w = 7 + v, h = 6.5;
  shadow(ctx, x, y + 1, w * 0.75);
  const trace = (c) => {
    c.moveTo(x - w, y); c.lineTo(x - w * 0.95, y - h * 0.5); c.lineTo(x - w * 0.4, y - h);
    c.lineTo(x + w * 0.45, y - h * 0.94); c.lineTo(x + w, y - h * 0.4); c.lineTo(x + w * 0.9, y); c.closePath();
  };
  part(ctx, trace, D.rock);
  ctx.save();
  ctx.beginPath();
  trace(ctx);
  ctx.clip();
  ell(ctx, x - w * 0.15, y - h * 0.95, w * 0.6, h * 0.2, D.moss);
  ctx.restore();
  stroke(ctx, [[x - w * 0.1, y - h * 0.6], [x + w * 0.1, y - h * 0.3]], shd(D.rock, 0.5), D.detailWidth);
  if (v === 2) {
    const s = 3.5;
    poly(ctx, [[x + 5.2 - s, y + 1], [x + 5.2 - s * 0.8, y - s * 0.6], [x + 5.2, y - s], [x + 5.2 + s * 0.7, y - s * 0.4], [x + 5.2 + s * 0.6, y + 1]], lit(D.rock, 0.1));
  }
}

// Blumengruppe (drei Blüten, Farbe je Variante). Breite <= 14 px.
export function drawFlower(ctx, x, y, v) {
  const col = D.flowers[v % D.flowers.length];
  shadow(ctx, x, y + 2, 5);
  for (const [dx, dy] of [[-4, 0.5], [3.5, -1], [0, 2]]) {
    const fx = x + dx, fy = y + dy;
    stroke(ctx, [[fx, fy + 3], [fx, fy]], D.stem, D.detailWidth);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TWO_PI; dot(ctx, fx + Math.cos(a) * 1.7, fy + Math.sin(a) * 1.7, 1.3, col); }
    dot(ctx, fx, fy, 1.1, D.flowerCore);
  }
}

// Grasbüschel: drei Halme mit Kontur und ein heller Halm
export function drawTuft(ctx, x, y) {
  for (const [dx, h] of [[-3, 5], [0, 7], [3, 5.5]]) {
    poly(ctx, [[x + dx - 1.6, y + 3], [x + dx + dx * 0.25, y + 3 - h], [x + dx + 1.6, y + 3]], D.tuft);
  }
  stroke(ctx, [[x, y + 2.5], [x, y - 2.5]], D.tuftLight, D.detailWidth);
  ctx.strokeStyle = outlineOf(D.tuft); // kein Rest des hellen Halms im Kontext
}

// Kiesel: zwei bis drei kleine Steine
export function drawPebble(ctx, x, y) {
  ell(ctx, x - 2.5, y + 0.5, 3, 2.2, D.pebble);
  ell(ctx, x + 3, y - 0.5, 2.2, 1.7, lit(D.pebble, 0.15));
  ell(ctx, x + 0.5, y + 2.5, 1.7, 1.3, shd(D.pebble, 0.15));
}

// ---- Streu-Deko (flach, ohne arc/ellipse) ----
function mushroom(ctx, x, y) {
  flatShadow(ctx, x, y, 6, 2);
  rr(ctx, x - 1.6, y - 5, 3.2, 6, 1, D.mushroomStem);
  part(ctx, (c) => { c.moveTo(x - 6, y - 4); c.quadraticCurveTo(x, y - 14, x + 6, y - 4); c.closePath(); }, D.mushroomCap);
  rr(ctx, x - 2.6, y - 8.2, 1.8, 1.8, 0.8, D.mushroomSpot);
  rr(ctx, x + 1.6, y - 6.4, 1.5, 1.5, 0.7, D.mushroomSpot);
}

function barrel(ctx, x, y) {
  flatShadow(ctx, x, y, 8, 3);
  rr(ctx, x - 6, y - 12, 12, 14, 4, D.wood);
  rr(ctx, x - 6.4, y - 9, 12.8, 2.2, 1, D.hoop);
  rr(ctx, x - 6.4, y - 3, 12.8, 2.2, 1, D.hoop);
}

function log(ctx, x, y, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  flatShadow(ctx, 0, 1, 12, 3);
  rr(ctx, -11, -4, 22, 8, 3, D.wood);
  rr(ctx, 8.6, -3.2, 3.6, 6.4, 1.8, D.logEnd);
  ctx.restore();
}

function stakes(ctx, x, y) {
  flatShadow(ctx, x, y + 2, 11, 3);
  for (const [dx, dy, a] of [[-8, 0, -0.3], [0, 3, 0.2], [8, 0, -0.15]]) {
    ctx.save();
    ctx.translate(x + dx, y + dy);
    ctx.rotate(a);
    poly(ctx, [[-2, 0], [2, 0], [0, -13]], D.wood);
    ctx.restore();
  }
}

function sign(ctx, x, y) {
  flatShadow(ctx, x, y, 7, 2.4);
  rr(ctx, x - 1.3, y - 14, 2.6, 15, 1, D.woodDark);
  poly(ctx, [[x - 10, y - 15], [x + 6, y - 15], [x + 10, y - 11.5], [x + 6, y - 8], [x - 10, y - 8]], D.wood);
}

function pebbles(ctx, x, y) {
  flatShadow(ctx, x, y + 1, 8, 2.4);
  rr(ctx, x - 7, y - 2.5, 6, 4.4, 2, D.pebble);
  rr(ctx, x - 0.5, y - 3.5, 5, 4, 2, lit(D.pebble, 0.15));
  rr(ctx, x + 2.5, y + 0.2, 4.2, 3, 1.5, shd(D.pebble, 0.15));
}

// Zeichnet eine Streu-Deko-Auswahl aus scatterFor (x, y = Position im Feld)
export function drawScatter(ctx, s, x, y) {
  if (s.kind === 'mushroom') mushroom(ctx, x, y);
  else if (s.kind === 'barrel') barrel(ctx, x, y);
  else if (s.kind === 'log') log(ctx, x, y, s.angle);
  else if (s.kind === 'stakes') stakes(ctx, x, y);
  else if (s.kind === 'sign') sign(ctx, x, y);
  else pebbles(ctx, x, y);
}
