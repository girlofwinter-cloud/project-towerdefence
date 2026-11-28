// Stil 1 (G6): Türme nach dem Entwurf (Z.105–109). Feste Teile als Sprite je Typ x Stufe x Pixeldichte,
// drehende Teile (Kanonenrohr um (36,40), Gewehr um (30,22)) live. Fußpunkt 0,39 Kachel unter der Kachelmitte.
// Stufenmarke (.bd1) zeichnet render.js in einem eigenen Durchgang nach allen Figuren. Nur Darstellung.
import { TILE, FIGURE_STYLE as S, GOLD_TOWER_STYLE as GOLD } from './config.js';
import { towerFigure } from './figures.js';
import { drawElements, parseFigure, withAlpha } from './svg-figure.js';
import { sprite, drawSprite, dprOf } from './sprites.js';
import { starPath } from './draw-utils.js';
import { idlePose } from './tower-fx.js';

const U = TILE / S.unit; // Entwurfs-px -> Spiel-px
const FOOT = S.towerFoot * U;
const TWO_PI = Math.PI * 2;

// Maßstab je Typ und Stufe (Stufe 3 ist ein eigenes Gebäude mit eigener Box, FIGURE_STYLE.towerScale3)
export function towerScaleOf(type, level) {
  const tbl = level >= 3 ? S.towerScale3 : S.towerScale;
  return (Object.hasOwn(tbl, type) ? tbl[type] : 1) * U;
}
const levelOf = (level) => Math.min(3, Math.max(1, Math.round(level) || 1));
const pose = {}; // Ruhe-Animation, je Aufruf überschrieben (keine Allokation pro Bild)

// Fußpunkt (y in Spiel-px) für die Tiefen-Sortierung
export function towerFootY(t) {
  return t.y + FOOT;
}

// Neigung des Kanonenrohrs aus der Senkrechten: zeigt zur Seite des Ziels, nie nach unten (Mörser)
export function cannonTilt(angle, max = S.cannonTilt) {
  if (!Number.isFinite(angle)) return Math.min(0.56, max); // wie im Entwurf (32 Grad), höchstens max
  let n = (angle + Math.PI / 2) % TWO_PI;
  if (n > Math.PI) n -= TWO_PI;
  if (n <= -Math.PI) n += TWO_PI;
  const m = Math.sign(n) * Math.min(Math.abs(n), Math.PI - Math.abs(n));
  return Math.max(-max, Math.min(max, m));
}

// Spiegelung der Figur (Scharfschütze blickt nach links)
const flipOf = (t) => (t.type === 'sniper' && Math.cos(Number.isFinite(t.angle) ? t.angle : 0) < 0 ? -1 : 1);

// Punkt (x, y) der ungedrehten Figur in Spiel-px (Stufe level, mit Spiegelung); out wird befüllt
export function figurePoint(t, level, x, y, out = [0, 0]) {
  const lv = levelOf(level);
  const f = towerFigure(t.type, lv, S.trim);
  const k = towerScaleOf(t.type, lv);
  out[0] = t.x + (x - (f ? f.w / 2 : 0)) * k * flipOf(t);
  out[1] = t.y + FOOT + (y - (f ? f.h : 0)) * k;
  return out;
}

// Mündung des Turms in Spiel-px (drehende Teile folgen t.angle; feste Türme: Leuchtpunkt bzw. Kachelmitte)
export function towerMuzzle(t, level, out = [0, 0]) {
  const lv = levelOf(level);
  const f = towerFigure(t.type, lv, S.trim);
  if (!f) { out[0] = t.x; out[1] = t.y; return out; }
  if (f.turn.length && f.pivot && f.muzzle && t.type === 'sniper') {
    figurePoint(t, lv, f.pivot[0], f.pivot[1], out);
    const a = Number.isFinite(t.angle) ? t.angle : 0;
    const r = (f.muzzle[0] - f.pivot[0]) * towerScaleOf(t.type, lv);
    out[0] += Math.cos(a) * r;
    out[1] += Math.sin(a) * r;
    return out;
  }
  const p = f.glow || f.muzzle || [f.w / 2, f.h / 2];
  return figurePoint(t, lv, p[0], p[1], out);
}

// ---------- B-185: goldene Türme (Farbtausch, Silhouette bleibt) ----------
const rgbKey = (c) => {
  const m = /^rgba?\(([^,]+),([^,]+),([^,)]+)/.exec(c || '');
  return m ? m.slice(1, 4).map((v) => +v).join(',') : null;
};
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };

// Gold-Palette (rein): Verlaufs- und Farbtausch aus GOLD_TOWER_STYLE; rgb-Schlüssel für Farben mit Deckkraft
export function goldPalette(style = GOLD) {
  const rgb = {};
  for (const [from, to] of Object.entries(style.colors)) rgb[hexRgb(from)] = to;
  return { grads: { ...style.grads }, colors: { ...style.colors }, rgb, gloss: style.gloss };
}

// Eine Farbe golden tauschen (#rrggbb direkt, rgba(...) mit gleicher Deckkraft); sonst unverändert
export function goldColor(c, pal = goldPalette()) {
  if (!c) return c;
  const key = c.toLowerCase();
  if (Object.hasOwn(pal.colors, key)) return pal.colors[key];
  const rgb = rgbKey(c);
  if (rgb && Object.hasOwn(pal.rgb, rgb)) {
    const a = /rgba\([^)]*,\s*([\d.]+)\s*\)/.exec(c);
    return withAlpha(pal.rgb[rgb], a ? parseFloat(a[1]) : 1);
  }
  return c;
}

// Elementliste golden (rein, neue Objekte): Verläufe/Farben tauschen, Glanzkante oben auf Holz-Rechtecken
export function goldElements(els, pal = goldPalette()) {
  const out = [];
  for (const el of els) {
    const grad = el.grad && Object.hasOwn(pal.grads, el.grad) ? pal.grads[el.grad] : el.grad;
    out.push({ ...el, path2d: null, grad, fill: goldColor(el.fill, pal), stroke: goldColor(el.stroke, pal) });
    const s = el.shape;
    if (grad === 's1-wood-gold' && s && s[0] === 'rect' && pal.gloss) {
      const g = pal.gloss;
      const [, x, y, w] = s;
      const r = s[5] || 0;
      const y0 = y + g.inset;
      const svg = `<path d="M${x + r + g.width / 2} ${y0} H${x + w - r - g.width / 2}" stroke="${g.color}" stroke-width="${g.width}" stroke-linecap="round" opacity="${g.alpha}" fill="none"/>`;
      out.push(...parseFigure(svg).all);
    }
  }
  return out;
}

// Goldene Figur je normaler Figur (einmal abgeleitet, Ebenen und Maße gleich)
const goldCache = new WeakMap();
export function goldFigure(f) {
  let g = goldCache.get(f);
  if (g) return g;
  const pal = goldPalette();
  g = { ...f, gold: true, layers: f.layers.map((l) => ({ name: l.name, els: goldElements(l.els, pal) })) };
  goldCache.set(f, g);
  return g;
}

let sparkleEls = null;
// Zwei Funkel (bolt) an festen Stellen der Figur-Box, Takt 1,4 s, zweites versetzt; reduced: stehend
function drawSparkles(ctx, f, k, time, reduced) {
  const P = GOLD.sparkle;
  sparkleEls ??= parseFigure(`<path d="${P.path}" fill="${P.color}" stroke="${P.ink}" stroke-width="${P.line}" stroke-linejoin="round"/>`).all;
  const [x0, y0, x1, y1] = f.box;
  const base = (P.size * TILE) / k / 14; // 14er Box -> 0,25 Kachel
  const t = Number.isFinite(time) ? Math.abs(time) : 0;
  const a0 = typeof ctx.globalAlpha === 'number' ? ctx.globalAlpha : 1;
  P.spots.forEach(([fx, fy], i) => {
    let a = P.reducedAlpha, sc = 1;
    if (!reduced) {
      const w = 0.5 - 0.5 * Math.cos((TWO_PI * (t + i * P.offset)) / P.period); // 0 -> 1 -> 0
      a = P.alpha[0] + (P.alpha[1] - P.alpha[0]) * w;
      sc = P.scale[0] + (P.scale[1] - P.scale[0]) * w;
    }
    ctx.save();
    ctx.globalAlpha = a0 * a;
    ctx.translate(x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy);
    ctx.scale(base * sc, base * sc);
    ctx.translate(-7, -7);
    drawElements(ctx, sparkleEls);
    ctx.restore();
  });
}

// Fester Teil als Sprite (oder direkt, wenn kein Canvas verfügbar ist); goldene Figuren eigener Schlüssel
function drawPart(ctx, f, part, els, k, dpr) {
  if (!els.length) return;
  const sp = sprite(`tower:${f.type}:${f.level}${f.gold ? ':gold' : ''}:${part}:${dpr}`, f.box, k * dpr, (c) => drawElements(c, els));
  if (sp) drawSprite(ctx, sp);
  else drawElements(ctx, els);
}

// Mündungsfeuer als Stern (Entwurf Z.126/129)
function drawFlash(ctx, f, flash) {
  const [r1, r2, n, rot, color, w] = flash;
  ctx.beginPath();
  starPath(ctx, f.muzzle[0], f.muzzle[1], r1, r2, n, rot);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = S.outline;
  ctx.lineWidth = w;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Aufleuchten beim Schuss: weicher Lichthof (wie s1-glow/s1-iceglow), wächst mit dem Rückstoß
function drawShotGlow(ctx, f, type, s) {
  const [gx, gy] = f.glow;
  const r = S.shotGlow.r * (0.5 + 0.5 * s);
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
  g.addColorStop(0, S.shotGlow[type]);
  g.addColorStop(1, S.shotGlow.edge);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(gx, gy, r, 0, TWO_PI);
  ctx.fill();
}

// Teil mit Ruhe-Animation (Stufe 3): Wimpel, Rauch, Kristall, Linsenschein, Wolke, Funke
function drawIdlePart(ctx, layer, cfg, p) {
  if (cfg.spark && layer.name === cfg.spark) {
    if (p.spark) drawElements(ctx, layer.els);
    return;
  }
  if (layer.name !== cfg.part) { drawElements(ctx, layer.els); return; }
  ctx.save();
  if (p.alpha < 1) ctx.globalAlpha = (typeof ctx.globalAlpha === 'number' ? ctx.globalAlpha : 1) * Math.max(0, p.alpha);
  ctx.translate(p.ax + p.dx, p.ay + p.dy);
  if (p.skew) ctx.transform(1, 0, Math.tan(p.skew), 1, 0, 0);
  if (p.sx !== 1 || p.sy !== 1) ctx.scale(p.sx, p.sy);
  ctx.translate(-p.ax, -p.ay);
  drawElements(ctx, layer.els);
  ctx.restore();
}

// Turm ohne Stufenmarke. shot: Anteil des Rückstoßes 0..1 (1 = gerade geschossen).
// time: Spielzeit für die Ruhe-Animation der Stufe 3, reduced: prefers-reduced-motion (Grundstellung),
// level: angezeigte Stufe (beim Aufstieg bis zum Figurwechsel noch 2), sonst t.level.
// opts.gold: goldene Türme (B-185, Kosmetik), gleiche Silhouette mit Gold-Farben und zwei Funkeln.
export function drawTowerFigure(ctx, t, shot, time, reduced = false, level = t.level, opts = null) {
  const lv = levelOf(level);
  const gold = !!opts?.gold;
  const base = towerFigure(t.type, lv, S.trim);
  if (!base) return;
  const f = gold ? goldFigure(base) : base;
  const k = towerScaleOf(t.type, lv);
  const s = Number.isFinite(shot) ? Math.max(0, Math.min(1, shot)) : 0;
  const dpr = dprOf(ctx);
  // Scharfschütze blickt nach links: ganze Figur spiegeln (Gewehr bleibt über dem Turm)
  const a = Number.isFinite(t.angle) ? t.angle : 0;
  const flip = flipOf(t);
  const cfg = lv >= 3 && Object.hasOwn(S.idle, t.type) ? S.idle[t.type] : null;
  if (cfg) idlePose(cfg, time, reduced, pose);
  const flash = lv >= 3 ? S.flash3[t.type] || null : f.flash;
  ctx.save();
  ctx.translate(t.x, t.y + FOOT);
  // Feste Türme stauchen sich beim Schuss kurz (Rückmeldung ohne drehenden Teil)
  ctx.scale(k * flip, f.turn.length ? k : k * (1 - S.squash * s));
  ctx.translate(-f.w / 2, -f.h);
  let glowDone = !(f.glow && s > 0.05);
  for (let i = 0; i < f.layers.length; i++) {
    const layer = f.layers[i];
    if (layer.name === 'main') { drawPart(ctx, f, `L${i}`, layer.els, k, dpr); continue; }
    if (layer.name !== 'turn') { if (cfg) drawIdlePart(ctx, layer, cfg, pose); else drawElements(ctx, layer.els); continue; }
    if (!glowDone) { drawShotGlow(ctx, f, t.type, s); glowDone = true; }
    const [px, py] = f.pivot;
    const rec = s * (S.recoil[t.type] || 0);
    ctx.save();
    ctx.translate(px, py);
    if (t.type === 'cannon') {
      ctx.rotate(cannonTilt(t.angle, lv >= 3 ? S.cannonTilt3 : S.cannonTilt));
      ctx.translate(0, rec); // Rohr zeigt nach oben: Rückstoß nach unten
    } else {
      ctx.rotate(flip < 0 ? Math.PI - a : a); // in der gespiegelten Figur
      ctx.translate(-rec, 0);
    }
    ctx.translate(-px, -py);
    drawElements(ctx, layer.els);
    if (s > S.muzzle && flash && f.muzzle) drawFlash(ctx, f, flash);
    ctx.restore();
  }
  if (!glowDone) drawShotGlow(ctx, f, t.type, s);
  if (gold) drawSparkles(ctx, f, k, time, reduced);
  ctx.restore();
}

// Stufenmarke (.bd1, Z.15): Kreis mit Ziffer rechts unten am Turm
export function drawTowerBadge(ctx, t, shown = t.level) {
  const level = levelOf(shown);
  const f = towerFigure(t.type, level, S.trim);
  if (!f) return;
  const B = S.badge;
  const k = towerScaleOf(t.type, level);
  ctx.save();
  ctx.translate(t.x, t.y + FOOT);
  ctx.scale(k, k);
  ctx.translate(f.w / 2 + B.dx, B.dy);
  ctx.beginPath();
  ctx.arc(0, 0, B.r - B.line / 2, 0, TWO_PI);
  ctx.fillStyle = B.colors[level - 1];
  ctx.fill();
  ctx.strokeStyle = B.ink;
  ctx.lineWidth = B.line;
  ctx.stroke();
  ctx.fillStyle = B.ink;
  ctx.font = B.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(level), 0, B.textDy);
  ctx.restore();
}
