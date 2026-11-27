// Stil 1 (G6): Türme nach dem Entwurf (Z.105–109). Feste Teile als Sprite je Typ x Stufe x Pixeldichte,
// drehende Teile (Kanonenrohr um (36,40), Gewehr um (30,22)) live. Fußpunkt 0,39 Kachel unter der Kachelmitte.
// Stufenmarke (.bd1) zeichnet render.js in einem eigenen Durchgang nach allen Figuren. Nur Darstellung.
import { TILE, FIGURE_STYLE as S } from './config.js';
import { towerFigure } from './figures.js';
import { drawElements } from './svg-figure.js';
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
export function cannonTilt(angle) {
  if (!Number.isFinite(angle)) return 0.56; // wie im Entwurf (32 Grad)
  let n = (angle + Math.PI / 2) % TWO_PI;
  if (n > Math.PI) n -= TWO_PI;
  if (n <= -Math.PI) n += TWO_PI;
  const m = Math.sign(n) * Math.min(Math.abs(n), Math.PI - Math.abs(n));
  return Math.max(-S.cannonTilt, Math.min(S.cannonTilt, m));
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

// Fester Teil als Sprite (oder direkt, wenn kein Canvas verfügbar ist)
function drawPart(ctx, f, part, els, k, dpr) {
  if (!els.length) return;
  const sp = sprite(`tower:${f.type}:${f.level}:${part}:${dpr}`, f.box, k * dpr, (c) => drawElements(c, els));
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
export function drawTowerFigure(ctx, t, shot, time, reduced = false, level = t.level) {
  const lv = levelOf(level);
  const f = towerFigure(t.type, lv, S.trim);
  if (!f) return;
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
      ctx.rotate(cannonTilt(t.angle));
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
