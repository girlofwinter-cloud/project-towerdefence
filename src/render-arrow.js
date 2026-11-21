// Pfeilturm im Flat-Pop-Stil (docs/STIL.md): nur Darstellung, keine Spiel-Logik.
import { STYLE, ARROW_TOWER as A } from './config.js';
import { part, poly, rr, ell, shadow, shd, outlineOf } from './draw-utils.js';

const P = STYLE.palette;
const FUGE_WIDTH = 0.8;

function line(ctx, pts, color, w) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

// Zeichnet den Turm mit Mittelpunkt (x, y); angle = Zielrichtung, rec = Rückstoß in Pixeln, accent = Bogenfarbe.
export function drawArrowTower(ctx, x, y, level, angle, rec, accent) {
  const li = Math.min(3, Math.max(1, level)) - 1;
  const gy = y + A.groundDy;
  shadow(ctx, x, gy, A.shadowR);
  ctx.save();
  ctx.translate(x, gy);
  ctx.scale(A.scale, A.scale);
  const gold = level >= 3;
  // Sockel und Turmkörper aus Stein, Mauerfugen
  rr(ctx, -15, -7, 30, 8, 2, shd(P.stone, 0.1));
  poly(ctx, [[-12, -7], [12, -7], [10, -27], [-10, -27]], P.stone);
  const joint = shd(P.stone, 0.45);
  for (const [fy, xs] of [[-13, [-4, 5]], [-19, [0]], [-24, [-5, 4]]]) {
    const d = (-fy - 13) * 0.1;
    line(ctx, [[-11 + d, fy], [11 - d, fy]], joint, FUGE_WIDTH);
    for (const fx of xs) line(ctx, [[fx, fy], [fx, fy - 5.5]], joint, FUGE_WIDTH);
  }
  // Tür und Schießscharte
  part(ctx, (c) => { c.moveTo(-4, -7); c.lineTo(-4, -11); c.arc(0, -11, 4, Math.PI, 0); c.lineTo(4, -7); c.closePath(); }, P.dark);
  rr(ctx, -1, -24, 2, 4.5, 0.6, P.dark);
  if (level >= 2) {
    // Banner am Balkon (Stufe 2) bzw. mit Goldrand (Stufe 3)
    poly(ctx, [[-9, -27], [-3, -27], [-3, -17], [-6, -19.5], [-9, -17]], P.blue);
    line(ctx, [[-9, -26], [-3, -26]], gold ? P.gold : P.string, 1);
  }
  if (gold) rr(ctx, -15, -8.5, 30, 2.4, 1, P.gold); // goldener Sockelring
  // Balkon und Pfosten
  poly(ctx, [[-15, -26], [15, -26], [13, -30], [-13, -30]], P.wood);
  rr(ctx, -12, -41, 3, 12, 0.6, P.woodDark);
  rr(ctx, 9, -41, 3, 12, 0.6, P.woodDark);
  if (gold) { ell(ctx, -10.5, -42, 2.2, 2.2, P.gold); ell(ctx, 10.5, -42, 2.2, 2.2, P.gold); }
  // Schütze: Körper, Kopf, Kapuze
  rr(ctx, -4, -36, 8, 7, 2, P.leaf);
  ell(ctx, 0, -38.5, 4.2, 4, P.skin);
  part(ctx, (c) => { c.moveTo(-5, -38); c.quadraticCurveTo(-5, -45, 0, -45); c.quadraticCurveTo(5, -45, 5, -38); c.quadraticCurveTo(0, -41.5, -5, -38); c.closePath(); }, P.leafDark);
  ctx.fillStyle = P.dark;
  ctx.beginPath();
  ctx.arc(2, -38.2, 0.9, 0, Math.PI * 2);
  ctx.fill();
  // drehbarer Teil: Bogen mit Sehne und Pfeil, Rückstoß nach hinten
  ctx.save();
  ctx.translate(0, A.headY);
  ctx.rotate(angle);
  ctx.translate(-rec / A.scale, 0);
  const r = A.bowRadius;
  const bx = r * Math.cos(A.bowSpan) - 3;
  const by = r * Math.sin(A.bowSpan);
  ctx.lineCap = 'round';
  ctx.strokeStyle = outlineOf(accent);
  ctx.lineWidth = A.bowWidth + STYLE.outlineWidth;
  ctx.beginPath();
  ctx.arc(-3, 0, r, -A.bowSpan, A.bowSpan);
  ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = A.bowWidth;
  ctx.stroke();
  line(ctx, [[bx, -by], [bx, by]], P.string, 0.8);
  line(ctx, [[bx, 0], [bx + A.arrowLength, 0]], P.woodDark, 1.1);
  poly(ctx, [[bx + A.arrowLength, -1.8], [bx + A.arrowLength + 3.5, 0], [bx + A.arrowLength, 1.8]], P.dark);
  ctx.restore();
  // Balkonbrüstung vor dem Schützen
  rr(ctx, -14, -33, 28, 3.2, 1, P.wood);
  // Dach
  const top = A.roofBaseY;
  const h = A.roofHeight[li];
  const hw = A.roofHalf[li];
  poly(ctx, [[-hw, top], [hw, top], [0, top - h]], P.red);
  const rib = shd(P.red, 0.5);
  line(ctx, [[-hw * 0.53, top - h * 0.33], [hw * 0.53, top - h * 0.33]], rib, 0.9);
  line(ctx, [[-hw * 0.24, top - h * 0.66], [hw * 0.24, top - h * 0.66]], rib, 0.9);
  if (gold) rr(ctx, -hw, top - 1.5, hw * 2, 3, 1, P.gold); // Goldleiste am Dachrand
  // Wimpel (ab Stufe 2), Stufe 3 golden
  const pole = A.poleHeight[li];
  if (pole > 0) {
    const py = top - h;
    line(ctx, [[0, py], [0, py - pole]], P.pole, 1.1);
    poly(ctx, [[0.5, py - pole], [5, py - pole - 1], [9, py - pole + 1.5], [5, py - pole + 3.5], [0.5, py - pole + 6]], gold ? P.gold : P.heart);
  }
  ctx.restore();
}
