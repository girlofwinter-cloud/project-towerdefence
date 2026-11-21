// Kanone, Frostturm, Scharfschütze und Blitzturm im Flat-Pop-Stil (docs/STIL.md, B-064).
// Nur Darstellung, keine Spiel-Logik. Maße je Stufe stehen in TOWER_STYLE (config.js).
import { STYLE, TOWER_STYLE } from './config.js';
import { part, poly, rr, ell, line, shadow, shd, lit } from './draw-utils.js';
import { drawArrowTower } from './render-arrow.js';

const P = STYLE.palette;
const JOINT_WIDTH = 0.8;
const GLOW_FROST = 'rgba(127,216,244,0.4)';
const GLOW_BOLT = 'rgba(255,240,120,0.4)';

// Stufe 1 bis 3 als Index 0 bis 2; ungültige Werte (NaN, undefined) zählen als Stufe 1
function levelIndex(level) {
  return Math.min(3, Math.max(1, Math.round(level) || 1)) - 1;
}

// Bodenschatten, dann Koordinatensystem mit Ursprung Bodenmitte und Skalierung des Typs
function begin(ctx, x, y, S) {
  const gy = y + S.groundDy;
  shadow(ctx, x, gy, S.shadowR);
  ctx.save();
  ctx.translate(x, gy);
  ctx.scale(S.scale, S.scale);
}

// Drehbarer Teil: Drehpunkt (0, py), Zielwinkel, Rückstoß nach hinten (rec in Pixeln des Spielfelds)
function beginHead(ctx, py, angle, rec, S) {
  ctx.save();
  ctx.translate(0, py);
  ctx.rotate(angle);
  ctx.translate(-rec / S.scale, 0);
}

// Spiegelt eine Punktliste an der y-Achse
const mirror = (pts) => pts.map(([px, py]) => [-px, py]);

// ---------- Kanone: breiter, niedriger Steinbunker mit schwerem Rohr ----------
export function drawCannonTower(ctx, x, y, level, angle, rec, accent) {
  const S = TOWER_STYLE.cannon;
  const li = levelIndex(level);
  const gold = li === 2;
  const hw = S.halfWidth[li];
  const bh = S.height[li];
  begin(ctx, x, y, S);
  const stone = shd(P.stone, 0.2);
  rr(ctx, -hw - 2, -4, hw * 2 + 4, 5, 2, shd(P.stone, 0.4));
  poly(ctx, [[-hw, -4], [hw, -4], [hw - 1.5, -bh], [-hw + 1.5, -bh]], stone);
  const joint = shd(P.stone, 0.55);
  for (const fy of li > 0 ? [-8, -12] : [-8]) {
    line(ctx, [[-hw + 1, fy], [hw - 1, fy]], joint, JOINT_WIDTH);
  }
  for (const fx of [-hw * 0.5, hw * 0.45]) line(ctx, [[fx, -4], [fx, -8]], joint, JOINT_WIDTH);
  // Zinnen mit Lücke in der Mitte für das Rohr
  const n = S.merlons[li];
  const mw = 5.5;
  const span = hw * 2 - 3 - mw;
  for (let i = 0; i < n; i++) rr(ctx, -hw + 1.5 + (span * i) / (n - 1), -bh - 4, mw, 5.5, 1.2, stone);
  // Tor
  part(ctx, (c) => { c.moveTo(-3.5, -4); c.lineTo(-3.5, -7); c.arc(0, -7, 3.5, Math.PI, 0); c.lineTo(3.5, -4); c.closePath(); }, P.dark);
  if (li > 0) {
    rr(ctx, -hw + 0.5, -bh + 3.5, hw * 2 - 1, 2.4, 0.8, gold ? P.gold : shd(accent, 0.1));
    // Fahne auf der rechten Zinne
    const fx = hw - 3;
    line(ctx, [[fx, -bh - 4], [fx, -bh - 13]], P.pole, 1.1);
    poly(ctx, [[fx + 0.5, -bh - 13], [fx + 7, -bh - 11.5], [fx + 0.5, -bh - 8.5]], gold ? P.gold : P.heart);
  }
  if (gold) {
    rr(ctx, -hw - 2, -5.5, hw * 2 + 4, 2.2, 1, P.gold);
    for (const sx of [-hw + 2, hw - 2]) ell(ctx, sx, -bh + 4.7, 1.3, 1.3, P.goldDark);
  }
  // Rohr (dreht sich zum Ziel)
  const k = S.barrelThick[li];
  const len = S.barrelLength[li];
  beginHead(ctx, -bh - 1, angle, rec, S);
  rr(ctx, -5, -4.5 * k, len + 5, 9 * k, 2.5, accent);
  rr(ctx, len - 5, -5.8 * k, 5.5, 11.6 * k, 1.5, shd(accent, 0.3));
  if (gold) rr(ctx, len - 10.5, -5.2 * k, 2.2, 10.4 * k, 0.8, P.gold);
  ell(ctx, -1, 0, 6.2 * k, 6.2 * k, shd(accent, 0.15));
  ell(ctx, -1, 0, 2.2, 2.2, lit(accent, 0.5));
  ctx.restore();
  ctx.restore();
}

// ---------- Frostturm: schlanker Eisschaft mit Zapfen und drehendem Eissplitter ----------
export function drawFrostTower(ctx, x, y, level, angle, rec, accent) {
  const S = TOWER_STYLE.frost;
  const li = levelIndex(level);
  const gold = li === 2;
  begin(ctx, x, y, S);
  rr(ctx, -10, -5, 20, 6, 2, shd(P.stone, 0.15));
  if (gold) rr(ctx, -10, -6.5, 20, 2.2, 1, P.gold);
  // seitliche Eiskristalle (ab Stufe 2), hinter dem Schaft
  const shards = [
    [[-5, -9], [-13, -22], [-4, -16]],
    [[-5, -5], [-16, -12], [-5, -11]],
  ];
  for (let i = 0; i < S.crystals[li]; i++) {
    const pts = shards[i];
    poly(ctx, pts, accent);
    poly(ctx, mirror(pts), accent);
  }
  poly(ctx, [[-6.5, -5], [6.5, -5], [4.5, -28], [-4.5, -28]], P.ice);
  line(ctx, [[-4.5, -14], [4.5, -14]], P.iceLight, 1);
  line(ctx, [[-4, -21], [4, -21]], P.iceLight, 1);
  // Kragen mit Eiszapfen
  rr(ctx, -7.5, -31, 15, 4, 1.5, P.stone);
  const ic = S.icicleLength[li];
  for (const ix of [-5.5, -2, 2, 5.5]) poly(ctx, [[ix - 1.5, -27], [ix + 1.5, -27], [ix, -27 + ic * (Math.abs(ix) > 3 ? 0.7 : 1)]], P.iceLight);
  poly(ctx, [[-4, -31], [4, -31], [2.2, -35], [-2.2, -35]], P.ice);
  // Eissplitter (dreht sich)
  const len = S.shardLength[li];
  beginHead(ctx, S.pivotY, angle, rec, S);
  ell(ctx, 0, 0, 7.5, 7.5, GLOW_FROST);
  poly(ctx, [[-4, 0], [0, -5.5], [len, 0], [0, 5.5]], accent);
  poly(ctx, [[0, -5.5], [len, 0], [3, 0]], P.iceLight);
  ctx.restore();
  ctx.restore();
}

// ---------- Scharfschütze: hoch und schmal, Plattform mit langem Zielrohr ----------
export function drawSniperTower(ctx, x, y, level, angle, rec, accent) {
  const S = TOWER_STYLE.sniper;
  const li = levelIndex(level);
  const gold = li === 2;
  const sh = S.shaftHeight[li];
  begin(ctx, x, y, S);
  rr(ctx, -9, -4, 18, 5, 2, shd(P.stone, 0.2));
  poly(ctx, [[-5.5, -4], [5.5, -4], [4, -sh], [-4, -sh]], P.wood);
  const joint = P.woodDark;
  line(ctx, [[-5, -4], [4, -sh]], joint, 0.9);
  line(ctx, [[5, -4], [-4, -sh]], joint, 0.9);
  for (const fy of li > 0 ? [-10, -sh * 0.55] : [-10]) rr(ctx, -5.5 + (fy / sh) * 1.5, fy, 11 - (-fy / sh) * 3, 2.2, 0.8, gold ? P.gold : accent);
  // Plattform mit Geländer
  rr(ctx, -9.5, -sh - 1.5, 19, 3.5, 1, P.wood);
  rr(ctx, -8.5, -sh - 6, 2, 5, 0.6, P.woodDark);
  rr(ctx, 6.5, -sh - 6, 2, 5, 0.6, P.woodDark);
  // Schütze mit Kapuze
  const py = -sh - 5.5;
  rr(ctx, -3.2, py, 6.4, 5, 1.8, accent);
  ell(ctx, 0, py - 2.5, 3.2, 3.2, P.skin);
  poly(ctx, [[-4, py - 2], [0, py - 8.5], [4, py - 2], [0, py - 3.8]], shd(accent, 0.25));
  if (li > 0) {
    // Fahne am Geländer
    line(ctx, [[-7.5, -sh - 6], [-7.5, -sh - 15]], P.pole, 1);
    poly(ctx, [[-7, -sh - 15], [-1.5, -sh - 13.5], [-7, -sh - 11]], gold ? P.gold : P.heart);
  }
  // Stufe 3: goldener Kragen am Schaft und Stützen an der Plattform
  if (gold) {
    rr(ctx, -5.5, -sh - 3.5, 11, 2.2, 0.8, P.gold);
    poly(ctx, [[-9.5, -sh + 1.5], [-5, -sh + 1.5], [-5, -sh - 1]], P.woodDark);
    poly(ctx, [[9.5, -sh + 1.5], [5, -sh + 1.5], [5, -sh - 1]], P.woodDark);
  }
  // Zielrohr (dreht sich)
  const len = S.barrelLength[li];
  beginHead(ctx, -sh - 3, angle, rec, S);
  rr(ctx, -5, -1.7, len + 5, 3.4, 1.2, shd(P.stone, 0.55));
  rr(ctx, 2, -5, 8, 2.8, 1.2, accent);
  ell(ctx, 10.2, -3.6, 1.3, 1.5, P.iceLight);
  rr(ctx, len - 3, -2.8, 3.5, 5.6, 1, gold ? P.gold : P.dark);
  if (li > 0) rr(ctx, len * 0.45, -4.6, 5, 2.4, 1, accent);
  ctx.restore();
  ctx.restore();
}

// ---------- Blitzturm: Spule/Pylon mit Fangarmen und leuchtendem Kristall ----------
export function drawLightningTower(ctx, x, y, level, angle, rec, accent) {
  const S = TOWER_STYLE.lightning;
  const li = levelIndex(level);
  const gold = li === 2;
  begin(ctx, x, y, S);
  rr(ctx, -11, -5, 22, 6, 2, shd(P.stone, 0.25));
  if (gold) rr(ctx, -11, -6.5, 22, 2.2, 1, P.gold);
  // Fangarme mit Leuchtkugel (ab Stufe 2), hinter dem Pylon
  const arms = [
    [[5, -12], [13, -15], [13, -26]],
    [[4, -7], [10, -9], [10, -19]],
  ];
  for (let i = 0; i < S.arms[li]; i++) {
    const a = arms[i];
    for (const pts of [a, mirror(a)]) {
      line(ctx, pts, shd(P.blue, 0.55), 3.2);
      line(ctx, pts, P.stone, 1.6);
      ell(ctx, pts[2][0], pts[2][1] - 2.4, 2.6, 2.6, accent);
    }
  }
  poly(ctx, [[-6.5, -5], [6.5, -5], [3.8, -31], [-3.8, -31]], P.blue);
  const rings = S.rings[li];
  for (let i = 0; i < rings; i++) {
    const ry = -9 - i * (20 / rings + 1.5);
    const hw = 7.5 - (-ry / 31) * 3.5;
    rr(ctx, -hw, ry, hw * 2, 2.8, 1.1, gold ? P.gold : P.stone);
  }
  rr(ctx, -5.5, -34, 11, 4, 1.5, P.stone);
  // Kristall (dreht sich): Sechseck mit Glühen
  const k = S.crystalSize[li];
  beginHead(ctx, S.pivotY, angle, rec, S);
  ell(ctx, 0, 0, 8.5 * k, 8.5 * k, GLOW_BOLT);
  poly(ctx, [[-6 * k, 0], [-3 * k, -5.5 * k], [3 * k, -5.5 * k], [8 * k, 0], [3 * k, 5.5 * k], [-3 * k, 5.5 * k]], accent);
  poly(ctx, [[-3 * k, -5.5 * k], [3 * k, -5.5 * k], [8 * k, 0], [0, 0]], lit(accent, 0.55));
  ctx.restore();
  ctx.restore();
}

// Zeichenfunktion je Turmtyp (Signatur: ctx, x, y, level, angle, rec, accent)
export const TOWER_DRAWERS = {
  arrow: drawArrowTower,
  cannon: drawCannonTower,
  frost: drawFrostTower,
  sniper: drawSniperTower,
  lightning: drawLightningTower,
};
