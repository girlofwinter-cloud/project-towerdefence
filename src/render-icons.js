// HUD- und Knopf-Icons im Flat-Pop-Stil (B-069). Reine Zeichenfunktionen: ctx kommt als Parameter,
// kein DOM. Raster 32x32 (ICON.grid), Motiv innerhalb von ±ICON.half um den Ursprung.
// Namen der Fähigkeiten-Icons = Schlüssel in ABILITIES (meteor, freeze, repair), damit B-058 sie direkt nutzt.
import { ICON, STYLE } from './config.js';
import { part, poly, rr, ell, line, disc, tri, outlineOf } from './draw-utils.js';

const P = STYLE.palette;
const C = ICON.colors;
const W = ICON.outline;

// Herz-Umriss (nur Pfadbefehle)
function heartPath(c) {
  c.moveTo(0, 11);
  c.bezierCurveTo(-8, 5, -13, 0, -13, -5);
  c.bezierCurveTo(-13, -10, -9.5, -12, -6.5, -12);
  c.bezierCurveTo(-3, -12, -1, -10, 0, -7);
  c.bezierCurveTo(1, -10, 3, -12, 6.5, -12);
  c.bezierCurveTo(9.5, -12, 13, -10, 13, -5);
  c.bezierCurveTo(13, 0, 8, 5, 0, 11);
  c.closePath();
}

// Linie mit Kontur: erst breiter in Konturfarbe, dann schmaler in Eigenfarbe
function stroke2(ctx, pts, color, w) {
  line(ctx, pts, outlineOf(color), w + W * 2);
  line(ctx, pts, color, w);
}

const DRAW = {
  gold(ctx) {
    ell(ctx, 0, 0, 12, 12, P.gold, W);
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = P.goldDark;
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    disc(ctx, STYLE.lightTone, -4.5, -4.5, 2.5); // Glanzpunkt
  },
  heart(ctx) {
    part(ctx, heartPath, P.heart, W);
    disc(ctx, STYLE.lightTone, -6.5, -6, 2.5);
  },
  heartEmpty(ctx) {
    part(ctx, heartPath, C.heartEmpty, W);
  },
  wave(ctx) {
    stroke2(ctx, [[-9, 12], [-9, -12]], P.woodDark, 3);
    poly(ctx, [[-7.5, -12], [4, -13], [12, -8], [4, -3.5], [-7.5, -2.5]], C.flag, W);
    ell(ctx, -9, 11, 5, 2, P.stone, W);
  },
  meteor(ctx) {
    poly(ctx, [[13, -13], [5, 4], [-5, -6]], C.flame, W);
    tri(ctx, C.flameCore, 10, -10, 3, 1, -1, -3);
    ell(ctx, -3.5, 4, 8.5, 8.5, C.meteorRock, W);
    disc(ctx, C.meteorCrater, -5, 6.5, 2.2);
    disc(ctx, C.flameCore, 0.5, 1, 1.6); // Glut
  },
  freeze(ctx) {
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      const dx = Math.sin(a) * 12, dy = -Math.cos(a) * 12;
      stroke2(ctx, [[-dx, -dy], [dx, dy]], P.ice, 3);
    }
    // Seitenäste an jedem der sechs Arme
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const s = Math.sin(a), co = -Math.cos(a);
      const bx = s * 7, by = co * 7;
      for (const side of [-1, 1]) {
        const b = a + side * 0.7;
        line(ctx, [[bx, by], [bx + Math.sin(b) * 4.5, by - Math.cos(b) * 4.5]], P.ice, 2.4);
      }
    }
    disc(ctx, P.iceLight, 0, 0, 3);
  },
  repair(ctx) {
    ctx.save();
    ctx.translate(1.5, 0.5);
    ctx.rotate(Math.PI / 4);
    rr(ctx, -2, -4, 4, 16, 2, P.wood, W);      // Stiel
    rr(ctx, -7, -9.5, 14, 6.5, 2, P.stone, W);  // Kopf
    ctx.restore();
    // Akzent: rotes Plus (Leben zurück)
    rr(ctx, -12.5, 6.2, 9, 3.4, 1, P.heart, W);
    rr(ctx, -9.7, 3.4, 3.4, 9, 1, P.heart, W);
  },
  zoom(ctx) {
    stroke2(ctx, [[4, 4], [11, 11]], P.woodDark, 4.5);
    ell(ctx, -3, -3, 9, 9, P.stone, W);
    ell(ctx, -3, -3, 6, 6, C.glass, W);
    disc(ctx, C.glassShine, -5, -5, 1.8);
  },
  pause(ctx) {
    rr(ctx, -8, -10, 6, 20, 1.5, C.pause, W);
    rr(ctx, 2, -10, 6, 20, 1.5, C.pause, W);
  },
  play(ctx) {
    poly(ctx, [[-7, -11], [11, 0], [-7, 11]], C.play, W);
  },
  map(ctx) {
    poly(ctx, [[-12, -9], [-4, -12], [4, -9], [12, -12], [12, 9], [4, 12], [-4, 9], [-12, 12]], C.paper, W);
    line(ctx, [[-4, -12], [-4, 9]], P.woodDark, 1.2);
    line(ctx, [[4, -9], [4, 12]], P.woodDark, 1.2);
    line(ctx, [[5.5, -3], [10, 1.5]], C.mapMark, 2.4); // Ziel-Kreuz
    line(ctx, [[10, -3], [5.5, 1.5]], C.mapMark, 2.4);
  },
};
export const ICON_NAMES = Object.keys(DRAW);

// Zeichnet Icon `name` mit Mittelpunkt (x, y) in Kantenlänge `size` px. Unbekannte Namen zeichnen nichts.
export function drawIcon(ctx, name, x = 0, y = 0, size = ICON.grid) {
  const fn = DRAW[name];
  if (!fn) return false;
  const k = size / ICON.grid;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  fn(ctx);
  ctx.restore();
  return true;
}
