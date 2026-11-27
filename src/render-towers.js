// Stil 1 (G6): Türme nach dem Entwurf (Z.105–109). Feste Teile als Sprite je Typ x Stufe x Pixeldichte,
// drehende Teile (Kanonenrohr um (36,40), Gewehr um (30,22)) live. Fußpunkt 0,39 Kachel unter der Kachelmitte.
// Stufenmarke (.bd1) zeichnet render.js in einem eigenen Durchgang nach allen Figuren. Nur Darstellung.
import { TILE, FIGURE_STYLE as S } from './config.js';
import { towerFigure } from './figures.js';
import { drawElements } from './svg-figure.js';
import { sprite, drawSprite, dprOf } from './sprites.js';
import { starPath } from './draw-utils.js';

const U = TILE / S.unit; // Entwurfs-px -> Spiel-px
const FOOT = S.towerFoot * U;
const TWO_PI = Math.PI * 2;

const scaleOf = (type) => (Object.hasOwn(S.towerScale, type) ? S.towerScale[type] : 1) * U;
const levelOf = (level) => Math.min(3, Math.max(1, Math.round(level) || 1));

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

// Fester Teil als Sprite (oder direkt, wenn kein Canvas verfügbar ist)
function drawPart(ctx, f, part, els, k, dpr) {
  if (!els.length) return;
  const sp = sprite(`tower:${f.type}:${f.level}:${part}:${dpr}`, f.box, k * dpr, (c) => drawElements(c, els));
  if (sp) drawSprite(ctx, sp);
  else drawElements(ctx, els);
}

// Mündungsfeuer als Stern (Entwurf Z.126/129)
function drawFlash(ctx, f) {
  const [r1, r2, n, rot, color, w] = f.flash;
  ctx.beginPath();
  starPath(ctx, f.muzzle[0], f.muzzle[1], r1, r2, n, rot);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = S.outline;
  ctx.lineWidth = w;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Turm ohne Stufenmarke. shot: Anteil des Rückstoßes 0..1 (1 = gerade geschossen)
export function drawTowerFigure(ctx, t, shot) {
  const f = towerFigure(t.type, levelOf(t.level), S.trim);
  if (!f) return;
  const k = scaleOf(t.type);
  const s = Number.isFinite(shot) ? Math.max(0, Math.min(1, shot)) : 0;
  const dpr = dprOf(ctx);
  // Scharfschütze blickt nach links: ganze Figur spiegeln (Gewehr bleibt über dem Turm)
  const a = Number.isFinite(t.angle) ? t.angle : 0;
  const flip = t.type === 'sniper' && Math.cos(a) < 0 ? -1 : 1;
  ctx.save();
  ctx.translate(t.x, t.y + FOOT);
  // Feste Türme stauchen sich beim Schuss kurz (Rückmeldung ohne drehenden Teil)
  ctx.scale(k * flip, f.turn.length ? k : k * (1 - S.squash * s));
  ctx.translate(-f.w / 2, -f.h);
  drawPart(ctx, f, 'back', f.back, k, dpr);
  if (f.glow && s > 0.05) {
    // Aufleuchten beim Schuss: weicher Lichthof (wie s1-glow/s1-iceglow), wächst mit dem Rückstoß
    const [gx, gy] = f.glow;
    const r = S.shotGlow.r * (0.5 + 0.5 * s);
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    g.addColorStop(0, S.shotGlow[t.type]);
    g.addColorStop(1, S.shotGlow.edge);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, TWO_PI);
    ctx.fill();
  }
  if (f.turn.length) {
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
    drawElements(ctx, f.turn);
    if (s > S.muzzle) drawFlash(ctx, f);
    ctx.restore();
    drawPart(ctx, f, 'front', f.front, k, dpr);
  }
  ctx.restore();
}

// Stufenmarke (.bd1, Z.15): Kreis mit Ziffer rechts unten am Turm
export function drawTowerBadge(ctx, t) {
  const level = levelOf(t.level);
  const f = towerFigure(t.type, level, S.trim);
  if (!f) return;
  const B = S.badge;
  const k = scaleOf(t.type);
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
