// Deko der Wiese im Flat-Pop-Stil (B-079): Büsche, Felsen mit Moos, Blumen, Grasbüschel, Kiesel und flache Streu-Deko.
// Nur Zeichnen (Auswahl und Positionen kommen aus decor.js, Zahlen aus config.js). Wird nur in den
// Hintergrund-Cache gemalt, nie pro Frame. Alles bleibt flach (höchstens ca. eine halbe Kachel hoch).
// Die Streu-Deko nutzt keine arc/ellipse-Aufrufe (Bezier-Schatten), damit sie vom Kachel-Test der Kleindeko getrennt bleibt.
import { DECOR_STYLE, STYLE, TILE as TILE_PX } from './config.js';
import { part, poly, rr, ell, shadow, lit, shd, outlineOf, snowCap } from './draw-utils.js';

const TWO_PI = Math.PI * 2;

// Aktiver Stilblock (Wiese, Eiswelt, Zangenangriff oder Zwei Fronten). render.js setzt ihn vor dem Zeichnen des Hintergrunds.
let D = DECOR_STYLE;
export function useDecorStyle(style = DECOR_STYLE) { D = style; }

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

// Fels (Felsform aus Polygon) mit Kontur; Moos nur, wenn moss gesetzt ist
function rockShape(ctx, x, y, w, h, color, moss) {
  const trace = (c) => {
    c.moveTo(x - w, y); c.lineTo(x - w * 0.95, y - h * 0.5); c.lineTo(x - w * 0.4, y - h);
    c.lineTo(x + w * 0.45, y - h * 0.94); c.lineTo(x + w, y - h * 0.4); c.lineTo(x + w * 0.9, y); c.closePath();
  };
  part(ctx, trace, color);
  if (moss) {
    ctx.save();
    ctx.beginPath();
    trace(ctx);
    ctx.clip();
    ell(ctx, x - w * 0.15, y - h * 0.95, w * 0.6, h * 0.2, moss);
    ctx.restore();
  }
}

// Fels mit Moos, Variante 2 mit kleinem Begleitstein. Breite 7..9 px (mal scale, Hindernisse sind größer).
export function drawRock(ctx, x, y, v, scale = 1) {
  const w = (7 + v) * scale, h = 6.5 * scale;
  shadow(ctx, x, y + 1, w * 0.75);
  rockShape(ctx, x, y, w, h, D.rock, D.moss);
  stroke(ctx, [[x - w * 0.1, y - h * 0.6], [x + w * 0.1, y - h * 0.3]], shd(D.rock, 0.5), D.detailWidth);
  if (v === 2) {
    const s = 3.5 * scale;
    const cx = x + 5.2 * scale;
    poly(ctx, [[cx - s, y + 1], [cx - s * 0.8, y - s * 0.6], [cx, y - s], [cx + s * 0.7, y - s * 0.4], [cx + s * 0.6, y + 1]], lit(D.rock, 0.1));
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
function mushroom(ctx, x, y, k = 1) {
  flatShadow(ctx, x, y, 6 * k, 2 * k);
  rr(ctx, x - 1.6 * k, y - 5 * k, 3.2 * k, 6 * k, 1, D.mushroomStem);
  part(ctx, (c) => { c.moveTo(x - 6 * k, y - 4 * k); c.quadraticCurveTo(x, y - 14 * k, x + 6 * k, y - 4 * k); c.closePath(); }, D.mushroomCap);
  rr(ctx, x - 2.6 * k, y - 8.2 * k, 1.8 * k, 1.8 * k, 0.8, D.mushroomSpot);
  rr(ctx, x + 1.6 * k, y - 6.4 * k, 1.5 * k, 1.5 * k, 0.7, D.mushroomSpot);
}

// Weiche Fleckenform aus acht Punkten (Polygon mit Kontur, ohne arc/ellipse)
function blob(ctx, x, y, rx, ry, color, phase = 0) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = phase + (i / 8) * TWO_PI, k = i % 2 ? 0.86 : 1;
    pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
  }
  poly(ctx, pts, color);
}

// Moosfleck: flacher Fleck mit hellem Polster
function moss(ctx, x, y) {
  flatShadow(ctx, x, y + 1, 10, 3);
  blob(ctx, x, y, 10, 4.6, D.moss);
  blob(ctx, x - 3, y - 1.2, 4.6, 2.2, lit(D.moss, 0.3), 0.4);
  blob(ctx, x + 5, y + 0.8, 3, 1.6, shd(D.moss, 0.2), 0.2);
}

// Baumstumpf mit Jahresring
function stump(ctx, x, y) {
  flatShadow(ctx, x, y + 1, 8, 2.6);
  rr(ctx, x - 6, y - 6, 12, 8.5, 2.5, D.wood);
  poly(ctx, [[x - 6, y - 6], [x - 3.4, y - 9.2], [x + 3.4, y - 9.2], [x + 6, y - 6], [x + 3.4, y - 3.6], [x - 3.4, y - 3.6]], D.logEnd);
  stroke(ctx, [[x - 2.4, y - 7.4], [x + 2.4, y - 7.4]], shd(D.logEnd, 0.35), D.detailWidth);
}

// Laubhaufen: drei Blätterhügel in Herbstfarben
function leafpile(ctx, x, y) {
  flatShadow(ctx, x, y + 1, 10, 3);
  blob(ctx, x - 4, y, 6.4, 3.6, D.leaves[0]);
  blob(ctx, x + 3.4, y - 0.8, 6, 3.4, D.leaves[1], 0.5);
  blob(ctx, x - 0.4, y - 3, 4.8, 2.8, D.leaves[2], 0.2);
  rr(ctx, x + 6, y + 2, 3, 1.8, 0.8, D.leaves[2]);
}

// Felsgruppe: drei Steine verschiedener Größe
function rockgroup(ctx, x, y) {
  flatShadow(ctx, x, y + 1, 11, 3);
  rockShape(ctx, x - 7, y + 1.5, 3.6, 3.4, shd(D.rock, 0.12), null);
  rockShape(ctx, x + 6, y + 1, 4.6, 4.6, lit(D.rock, 0.1), null);
  rockShape(ctx, x - 1, y, 6, 6.4, D.rock, D.moss);
}

// Eiskristall (B-073): drei spitze Kristalle mit heller Kante und dunklerer Seite
function crystal(ctx, x, y) {
  flatShadow(ctx, x, y + 1, 9, 2.6);
  for (const [dx, w, h, k] of [[-5, 3.2, 9, 0], [5, 2.8, 7, 0.1], [0, 4.2, 14, 0.2]]) {
    const cx = x + dx, base = y + 1;
    poly(ctx, [[cx - w, base], [cx - w * 0.8, base - h * 0.7], [cx, base - h], [cx + w * 0.8, base - h * 0.7], [cx + w, base]], lit(D.crystal, k));
    poly(ctx, [[cx, base], [cx, base - h], [cx + w * 0.8, base - h * 0.7], [cx + w, base]], shd(D.crystal, 0.3));
    stroke(ctx, [[cx - w * 0.45, base - h * 0.2], [cx - w * 0.4, base - h * 0.62]], '#ffffff', D.detailWidth);
  }
}

// Schneehaufen (B-073): flacher Hügel mit Schattenseite
function snowpile(ctx, x, y) {
  flatShadow(ctx, x, y + 1, 11, 3);
  blob(ctx, x, y, 11, 5, D.snowShade);
  blob(ctx, x - 1.4, y - 1.6, 9, 4, D.snow, 0.3);
  blob(ctx, x + 5, y - 2.6, 4.4, 2.4, D.snow, 0.1);
}

// Glutsteine (B-030, Vulkan): dunkle Steine mit glühenden Rissen und Glutkern
function ember(ctx, x, y) {
  flatShadow(ctx, x, y + 1, 9, 2.6);
  rockShape(ctx, x - 4, y + 1.5, 4.4, 4, shd(D.rock, 0.15), null);
  rockShape(ctx, x + 3, y + 1, 5.6, 5.4, D.rock, null);
  stroke(ctx, [[x + 0.5, y - 3.4], [x + 2.6, y - 1.6], [x + 2, y + 0.4]], D.ember, 1.4);
  rr(ctx, x - 5.6, y - 1.2, 3.2, 2.4, 1.2, D.ember);
  rr(ctx, x - 5, y - 0.7, 1.6, 1.2, 0.6, D.emberCore);
}

// Aschehaufen (B-030, Vulkan): flacher grauer Hügel mit hellerer Kuppe
function ash(ctx, x, y) {
  flatShadow(ctx, x, y + 1, 10, 3);
  blob(ctx, x, y, 10, 4.4, shd(D.ash, 0.2));
  blob(ctx, x - 1.2, y - 1.4, 7.6, 3.4, D.ash, 0.3);
  blob(ctx, x + 4, y - 2.2, 3.4, 1.8, lit(D.ash, 0.2), 0.1);
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
  else if (s.kind === 'mushrooms') { mushroom(ctx, x - 5.5, y + 1, 0.75); mushroom(ctx, x + 4, y, 1); }
  else if (s.kind === 'moss') moss(ctx, x, y);
  else if (s.kind === 'stump') stump(ctx, x, y);
  else if (s.kind === 'leafpile') leafpile(ctx, x, y);
  else if (s.kind === 'crystal') crystal(ctx, x, y);
  else if (s.kind === 'snowpile') snowpile(ctx, x, y);
  else if (s.kind === 'rockgroup') rockgroup(ctx, x, y);
  else if (s.kind === 'barrel') barrel(ctx, x, y);
  else if (s.kind === 'ember') ember(ctx, x, y);
  else if (s.kind === 'ash') ash(ctx, x, y);
  else if (s.kind === 'log') log(ctx, x, y, s.angle);
  else if (s.kind === 'stakes') stakes(ctx, x, y);
  else if (s.kind === 'sign') sign(ctx, x, y);
  else pebbles(ctx, x, y);
}

// ---- Bäume im Flat-Pop-Stil (Eiswelt, Zangenangriff, Zwei Fronten): Einzelbäume am Rand und Hindernisse ----
// fir: Tanne (drei Stufen) oder Laubbaum (drei Lappen); scale > 1 für Hindernisse. Mitte (x, y) = Kronenmitte.
export function drawTree(ctx, x, y, v, fir, scale = 1) {
  const s = scale;
  shadow(ctx, x + 1, y + 8 * s, 9 * s);
  if (fir) {
    rr(ctx, x - 1.8 * s, y + 3 * s, 3.6 * s, 6 * s, 1, D.trunk);
    [[4, 8.2, 0], [-1, 6.6, 1], [-6, 4.8, 0]].forEach(([dy, w, i]) => {
      poly(ctx, [[x - w * s, y + (dy + 4) * s], [x + w * s, y + (dy + 4) * s], [x, y + (dy - 5.5) * s]], D.fir[i]);
      if (D.snow) snowCap(ctx, x, y + (dy - 5.5) * s, w * s, 9.5 * s, D.snow, D.snowShade); // Eis: Schneekappe
    });
    return;
  }
  rr(ctx, x - 1.8 * s, y + 1 * s, 3.6 * s, 8 * s, 1, D.trunk);
  const c = D.treeColors[v % D.treeColors.length];
  ell(ctx, x - 4 * s, y - 1 * s, 5 * s, 4.5 * s, c);
  ell(ctx, x + 4 * s, y - 1 * s, 5 * s, 4.5 * s, c);
  ell(ctx, x, y - 5 * s, 6 * s, 5.2 * s, c);
}

// Hindernis-Kachel (c, r): dunkler Fleck als Hinweis "nicht bebaubar", darauf Baum oder Fels (Position und Art unverändert)
export function drawObstacleFlat(ctx, c, r, kind, fir, v) {
  const x0 = c * TILE_PX, y0 = r * TILE_PX, m = 3, w = TILE_PX - 2 * m, k = 11;
  ctx.fillStyle = D.obstacleGround;
  ctx.beginPath();
  ctx.moveTo(x0 + m + k, y0 + m);
  ctx.arcTo(x0 + m + w, y0 + m, x0 + m + w, y0 + m + w, k);
  ctx.arcTo(x0 + m + w, y0 + m + w, x0 + m, y0 + m + w, k);
  ctx.arcTo(x0 + m, y0 + m + w, x0 + m, y0 + m, k);
  ctx.arcTo(x0 + m, y0 + m, x0 + m + w, y0 + m, k);
  ctx.closePath();
  ctx.fill();
  if (kind === 'rock') drawRock(ctx, x0 + TILE_PX / 2 - (v === 2 ? 3 : 0), y0 + TILE_PX * 0.64, v, 1.8);
  else drawTree(ctx, x0 + TILE_PX / 2, y0 + TILE_PX * 0.52, v, fir, 1.35);
}
