// Akzente der Wiese (B-080): Burgmauer mit Tor und zwei Türmchen, Teich mit Seerosen und Schilf, kleiner Brunnen.
// Nur Zeichnen (Rechtecke kommen aus decor.js accentsFor, Zahlen aus config.js ACCENT_STYLE). Wird nur in den
// Hintergrund-Cache gemalt, nie pro Frame. Flat-Pop: Kontur über part() aus draw-utils.js.
import { ACCENT_STYLE as A } from './config.js';
import { part, poly, rr, shd } from './draw-utils.js';

// Ellipse aus Bezier-Kurven (ohne arc/ellipse, damit sie vom Kachel-Test der Kleindeko getrennt bleibt), mit Kontur
function ell(ctx, x, y, rx, ry, color) {
  const k = 0.5523;
  part(ctx, (c) => {
    c.moveTo(x + rx, y);
    c.bezierCurveTo(x + rx, y + ry * k, x + rx * k, y + ry, x, y + ry);
    c.bezierCurveTo(x - rx * k, y + ry, x - rx, y + ry * k, x - rx, y);
    c.bezierCurveTo(x - rx, y - ry * k, x - rx * k, y - ry, x, y - ry);
    c.bezierCurveTo(x + rx * k, y - ry, x + rx, y - ry * k, x + rx, y);
    c.closePath();
  }, color);
}

function shadow(ctx, x, y, r) {
  ell(ctx, x + r * 0.2, y + r * 0.2, r, r * 0.4, 'rgba(43,27,61,0.25)');
}

function line(ctx, pts, color, width) {
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

function drawWall(ctx, a) {
  const x0 = a.x, x1 = a.x + a.w, base = a.y + a.h, top = base - A.wallHeight;
  const gx = (x0 + x1) / 2;
  ell(ctx, gx + 3, base + 1, a.w / 2 + 4, 3, 'rgba(43,27,61,0.25)');
  rr(ctx, x0 + 4, top, a.w - 8, A.wallHeight, 2, A.stone);
  const [mw, mh] = A.merlon;
  for (let x = x0 + 18; x < x1 - 18 - mw; x += A.merlonStep) rr(ctx, x, top - mh + 1, mw, mh, 1, A.stoneTop);
  // Fugen der Steine (geklippt auf die Mauer)
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 + 4, top, a.w - 8, A.wallHeight);
  ctx.clip();
  const seam = shd(A.stone, 0.45);
  for (let r = 0; r < 2; r++) {
    const y = top + 5 + r * 5.5;
    line(ctx, [[x0, y], [x1, y]], seam, 0.8);
    for (let x = x0 + (r % 2) * 7; x < x1; x += 14) line(ctx, [[x, y], [x, y + 5.5]], seam, 0.8);
  }
  ctx.restore();
  // Tor (Bogen aus Polygon, ohne arc)
  const gw = A.gateW / 2, gh = A.gateH;
  const arch = [[gx - gw, base], [gx - gw, base - gh + 3], [gx - gw * 0.7, base - gh], [gx, base - gh - 2], [gx + gw * 0.7, base - gh], [gx + gw, base - gh + 3], [gx + gw, base]];
  poly(ctx, arch, A.gate);
  line(ctx, [[gx, base - gh - 1], [gx, base]], shd(A.gate, 0.4), 1);
  // Türmchen links und rechts mit Dach
  for (const tx of [x0, x1 - A.towerW]) {
    rr(ctx, tx, base - A.towerBody, A.towerW, A.towerBody, 2, A.towerStone);
    rr(ctx, tx + A.towerW / 2 - 1.5, base - A.towerBody + 6, 3, 5, 1, shd(A.towerStone, 0.5));
    poly(ctx, [[tx - 2, base - A.towerBody], [tx + A.towerW + 2, base - A.towerBody], [tx + A.towerW / 2, base - A.towerBody - A.towerRoof]], A.roof);
  }
}

function drawPond(ctx, p) {
  const { cx, cy, rx, ry } = p;
  ell(ctx, cx + 3, cy + 4, rx + 4, ry + 3, 'rgba(43,27,61,0.22)');
  ell(ctx, cx, cy, rx, ry, A.bank);
  ell(ctx, cx, cy, rx - 4, ry - 2, A.mud);
  ell(ctx, cx, cy, rx - 7, ry - 4, shd(A.water, 0.2));
  ell(ctx, cx - 2, cy - 1.5, rx - 11, ry - 6.5, A.water);
  ell(ctx, cx - 14, cy - 4, 20, 2.2, 'rgba(255,255,255,0.35)');
  line(ctx, [[cx + 16, cy - 1], [cx + 30, cy - 1]], 'rgba(255,255,255,0.45)', 1.2);
  line(ctx, [[cx - 34, cy + 4], [cx - 24, cy + 4]], 'rgba(255,255,255,0.35)', 1.2);
  for (const [lx, ly, s] of [[cx + 26, cy + 3, 1], [cx - 28, cy - 2, 0.8]]) ell(ctx, lx, ly, 7 * s, 3.4 * s, A.pad);
  ell(ctx, cx + 27, cy + 2, 2.4, 1.6, A.padFlower);
  ell(ctx, cx + 27, cy + 2, 1, 0.7, A.padCenter);
  for (const rxx of [cx - rx + 4, cx - rx + 9, cx + rx - 5]) {
    line(ctx, [[rxx, cy + 6], [rxx + 1, cy - p.reedLift + 5]], A.reed, 1.4);
    rr(ctx, rxx - 1, cy - p.reedLift + 1, 3, 7, 1.2, A.reedHead);
  }
  for (const [sx, sy] of [[cx - rx - 2, cy + 3], [cx + rx + 1, cy + 5], [cx - 40, cy + ry + 1], [cx + 38, cy + ry + 2]]) {
    ell(ctx, sx, sy, 4.5, 2.6, '#a9a8ae');
    ell(ctx, sx - 1, sy - 1, 2.6, 1.2, '#cfcdd0');
  }
}

function drawWell(ctx, a) {
  const x = a.x + a.w / 2, y = a.y + a.h; // y = Standlinie
  shadow(ctx, x, y - 1, 11);
  rr(ctx, x - 10, y - 9, 20, 10, 3, A.stone);
  ell(ctx, x, y - 9, 9, 3, A.water);
  rr(ctx, x - 11, y - 21, 2.6, 13, 1, A.woodDark);
  rr(ctx, x + 8.4, y - 21, 2.6, 13, 1, A.woodDark);
  poly(ctx, [[x - 14, y - 21], [x + 14, y - 21], [x, y - 28 + 2]], A.wellRoof);
}

export function drawAccents(ctx, accents) {
  ctx.save();
  for (const a of accents) {
    if (a.kind === 'wall') drawWall(ctx, a);
    else if (a.kind === 'pond') drawPond(ctx, { cx: a.x + a.w / 2, cy: a.y + A.pond.reedLift, rx: A.pond.rx, ry: A.pond.ry, reedLift: A.pond.reedLift });
    else if (a.kind === 'well') drawWell(ctx, a);
  }
  ctx.restore();
}
