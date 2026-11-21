// Gemeinsame Zeichen-Helfer (nur Darstellung, keine Spiel-Logik).
import { STYLE } from './config.js';
const TWO_PI = Math.PI * 2;

export function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function tri(ctx, color, x1, y1, x2, y2, x3, y3) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

export function disc(ctx, color, x, y, r) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();
}

// ---- Stil Flat-Pop (docs/STIL.md): Farb-Helfer und Teil-Formen, noch nicht von render*.js genutzt ----
const HEX_CACHE = new Map();

function parseHex(hex) {
  let v = HEX_CACHE.get(hex);
  if (!v) {
    const n = parseInt(hex.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    HEX_CACHE.set(hex, v);
  }
  return v;
}

function toHex(rgb) {
  return '#' + rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');
}

const MIX_CACHE = new Map();
function mix(hex, target, t) {
  const key = hex + target + t;
  let out = MIX_CACHE.get(key);
  if (!out) {
    const a = parseHex(hex);
    const b = parseHex(target);
    out = toHex(a.map((c, i) => c + (b[i] - c) * t));
    MIX_CACHE.set(key, out);
  }
  return out;
}

// Mischt die Farbe um t (0..1) zum Lichtton
export function lit(hex, t = STYLE.lightMix) { return mix(hex, STYLE.lightTone, t); }
// Mischt die Farbe um t (0..1) zum Schattenton
export function shd(hex, t = STYLE.shadeMix) { return mix(hex, STYLE.shadowTone, t); }

// Helligkeit 0..1 (Rec. 709)
export function brightness(hex) {
  const [r, g, b] = parseHex(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// Konturfarbe: Eigenfarbe abgedunkelt, nie heller als STYLE.outlineMaxLight
export function outlineOf(hex) {
  const k = 1 - STYLE.outlineDarken;
  let rgb = parseHex(hex).map((c) => c * k);
  const l = brightness(toHex(rgb));
  if (l > STYLE.outlineMaxLight) rgb = rgb.map((c) => c * (STYLE.outlineMaxLight / l));
  return toHex(rgb);
}

// Teil mit drei Flächentönen (Licht oben links, Basis, Schatten rechts unten) und runder Kontur.
// trace(ctx) fügt nur Pfadbefehle hinzu (kein beginPath/fill). Keine Verläufe.
export function part(ctx, trace, color) {
  const band = STYLE.band;
  const fillShifted = (c, dx, dy) => {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.fillStyle = c;
    ctx.beginPath();
    trace(ctx);
    ctx.fill();
    ctx.restore();
  };
  ctx.save();
  ctx.beginPath();
  trace(ctx);
  ctx.clip();
  fillShifted(shd(color), 0, 0);
  fillShifted(lit(color), -band, -band);
  fillShifted(color, -band + band * 0.7, -band + band * 0.7);
  ctx.restore();
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = STYLE.outlineWidth;
  ctx.strokeStyle = outlineOf(color);
  ctx.beginPath();
  trace(ctx);
  ctx.stroke();
  ctx.restore();
}

// Polygon aus Punktliste [[x, y], ...]
export function poly(ctx, pts, color) {
  part(ctx, (c) => {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  }, color);
}

// Abgerundetes Rechteck (x, y = linke obere Ecke, r = Eckenradius)
export function rr(ctx, x, y, w, h, r, color) {
  const rad = Math.min(r, w / 2, h / 2);
  part(ctx, (c) => {
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
  }, color);
}

// Ellipse um den Mittelpunkt (x, y) mit Radien rx, ry
export function ell(ctx, x, y, rx, ry, color) {
  part(ctx, (c) => {
    c.moveTo(x + rx, y);
    c.ellipse(x, y, rx, ry, 0, 0, TWO_PI);
    c.closePath();
  }, color);
}

// Linie durch eine Punktliste [[x, y], ...] mit runden Enden
export function line(ctx, pts, color, w) {
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

// Bodenschatten unter einem Objekt mit Radius r (Mittelpunkt x, y), leicht nach rechts unten versetzt
export function shadow(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = hexToRgba(STYLE.shadowTone, STYLE.groundShadowAlpha);
  ctx.beginPath();
  ctx.ellipse(x + r * STYLE.groundShadowOffset, y + r * STYLE.groundShadowOffset,
    r * STYLE.groundShadowWidth, r * STYLE.groundShadowHeight, 0, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function hexToRgba(hex, a) {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// Schneekappe einer Tannenstufe (B-073): Spitze (x, apexY), Stufenbreite w (halbe Basis), Stufenhöhe H.
// Zackiger Saum bei 58 % der Höhe, rechte Hälfte im Schattenton. Nur Füllung, keine Kontur.
export function snowCap(ctx, x, apexY, w, H, color, shade) {
  const f = 0.58, y1 = apexY + H * f, y2 = apexY + H * (f - 0.1), y3 = apexY + H * (f + 0.06);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, apexY);
  ctx.lineTo(x + w * f, y1);
  ctx.lineTo(x + w * 0.3, y2);
  ctx.lineTo(x, y3);
  ctx.lineTo(x - w * 0.3, y2);
  ctx.lineTo(x - w * f, y1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(x, apexY);
  ctx.lineTo(x + w * f, y1);
  ctx.lineTo(x + w * 0.3, y2);
  ctx.lineTo(x, y3);
  ctx.closePath();
  ctx.fill();
}
