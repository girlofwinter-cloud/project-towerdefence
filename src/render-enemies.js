// Zeichnen der Gegner (nur Darstellung, keine Spiel-Logik).
// Stil 1 (G7): Figuren aus dem Entwurf (Goblin Z.110, Flitzer Z.112, Troll Z.113, eingefroren Z.111), übrige
// Typen auf Goblin-Basis (src/figures.js). Je Typ x Frost x Pixeldichte ein Sprite, pro Frame nur drawImage
// mit Wippen, Schwanken und Spiegelung. Fußpunkt FIGURE_STYLE.enemyFoot unter der Wegmitte. Lebensbalken nur bei Schaden.
import { ENEMY_TYPES, ENEMY_STYLE, FIGURE_STYLE as S, TILE } from './config.js';
import { enemyFigure } from './figures.js';
import { drawElements } from './svg-figure.js';
import { sprite, drawSprite, dprOf } from './sprites.js';
import { walkPhase, animSpeedFactor, facingFor, facingFlip, facingTilt } from './enemy-fx.js';

const TWO_PI = Math.PI * 2;
const U = TILE / S.unit; // Entwurfs-px -> Spiel-px
const FOOT = S.enemyFoot * U;
const HP = S.hp;

// Heil-Aura (deutlich dezenter als der Frost-Ring)
const HEAL_AURA_FILL = 'rgba(90,230,150,0.07)';
const HEAL_AURA_RING = 'rgba(120,240,170,0.28)';
const HEAL_AURA_WIDTH = 1.5;
const HEAL_AURA_PULSE = 0.04; // relative Radius-Schwankung
const HEAL_AURA_SPEED = 2; // Bogenmass pro Sekunde

// Fußpunkt (y in Spiel-px) für die Tiefen-Sortierung
export function enemyFootY(e) {
  return e.y + FOOT;
}

// Heil-Aura: pulsierender, halbtransparenter Kreis mit Radius healRadius * TILE um einen Healer.
// Wird von render.js VOR den Figuren gezeichnet (liegt unter den Figuren). Andere Typen: nichts.
export function drawHealAura(ctx, e, time) {
  const def = ENEMY_TYPES[e.type];
  if (!def || !def.healRadius) return;
  const r = def.healRadius * TILE * (1 + Math.sin(time * HEAL_AURA_SPEED) * HEAL_AURA_PULSE);
  ctx.fillStyle = HEAL_AURA_FILL;
  ctx.beginPath();
  ctx.arc(e.x, e.y, r, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = HEAL_AURA_RING;
  ctx.lineWidth = HEAL_AURA_WIDTH;
  ctx.stroke();
}

// B-126: Schild-Blase um Gegner mit ward > 0 (Weltkoordinaten); Stärke = Anteil am Höchstschild
export function drawWardBubble(ctx, e, time) {
  if (!(e.ward > 0)) return;
  const c = ENEMY_STYLE.mage;
  const frac = Math.min(1, e.ward / (ENEMY_TYPES.mage.wardShare * e.maxHp));
  const r = e.radius + c.wardPad + Math.sin(time * c.wardSpeed + e.id) * c.wardPulse;
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.65 * frac;
  ctx.fillStyle = c.wardFill;
  ctx.beginPath();
  ctx.arc(e.x, e.y, r, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = c.wardRing;
  ctx.lineWidth = c.wardRingWidth;
  ctx.stroke();
  ctx.restore();
}

// Figur zeichnen (Sprite, sonst direkt); eingefroren: Eis-Überzug über der Figur (Z.111)
function paintFigure(c, f) {
  if (f.glow) iceLayer(c, f, f.glow);
  drawElements(c, f.els);
  if (f.shell) iceLayer(c, f, f.shell);
}
// Eis-Teile im 54 x 56-Rahmen des Entwurfs auf die Figur gestreckt (Fußpunkt unten mittig, Maße in figures.js)
function iceLayer(c, f, els) {
  const { origin, scale, size } = f.ice;
  c.save();
  c.translate(origin[0], origin[1]);
  c.scale(scale[0], scale[1]);
  c.translate(-size[0] / 2, -size[1]);
  drawElements(c, els);
  c.restore();
}

// Lebensbalken (Z.113) in Weltkoordinaten über der Figur: dunkle Kapsel, farbige Füllung
function capsule(ctx, x, y, w, h) {
  const r = h / 2;
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
}
function drawHpBar(ctx, e, f, k) {
  if (!(e.hp < e.maxHp)) return; // nur bei Schaden
  const frac = Math.max(0, Math.min(1, e.hp / e.maxHp));
  if (!Number.isFinite(frac)) return;
  const w = Math.max(HP.minW, HP.share * f.w) * k;
  const top = enemyFootY(e) + (f.box[1] - f.h) * k; // oberster Punkt der Figur
  const y = top - (HP.gap + HP.h) * U;
  const x = e.x - w / 2;
  ctx.fillStyle = HP.back;
  capsule(ctx, x, y, w, HP.h * U);
  ctx.fill();
  if (frac <= 0) return;
  const p = HP.pad * U;
  const iw = Math.max(HP.inner * U, (w - 2 * p) * frac);
  ctx.fillStyle = frac > 0.5 ? HP.good : frac > 0.25 ? HP.mid : HP.low;
  capsule(ctx, x + p, y + p, iw, HP.inner * U);
  ctx.fill();
}

// path ist optional (state.path); ohne Weg blickt die Figur nach rechts.
export function drawEnemy(ctx, e, time, path) {
  const slowed = time < e.slowUntil;
  const known = Object.hasOwn(ENEMY_TYPES, e.type) && enemyFigure(e.type, slowed);
  const type = known ? e.type : 'grunt'; // unbekannte Typen: Goblin
  const f = enemyFigure(type, slowed);
  const k = U * (f.big ? S[f.big] : 1);
  const angle = facingFor(path, e.dist);
  const phase = walkPhase(time, e.id, animSpeedFactor(e, time));
  const s = Math.sin(phase);
  const dpr = dprOf(ctx);

  ctx.save();
  ctx.translate(e.x, enemyFootY(e));
  ctx.scale(facingFlip(angle), 1);
  ctx.rotate(facingTilt(angle) * S.tilt + (slowed ? 0 : s * S.sway));
  ctx.scale(k, k);
  ctx.translate(-f.w / 2, -f.h - (slowed ? 0 : Math.abs(s) * S.bob));
  const sp = sprite(`enemy:${type}:${slowed ? 1 : 0}:${dpr}`, f.box, k * dpr, (c) => paintFigure(c, f));
  if (sp) drawSprite(ctx, sp);
  else paintFigure(ctx, f);
  ctx.restore();

  drawWardBubble(ctx, e, time);
  drawHpBar(ctx, e, f, k);
  drawShellPips(ctx, e, f, k);
}

// B-169 (Platzhalter): je verbliebene Schicht der Schale ein kleines Segment über der Figur (über dem Lebensbalken)
export function drawShellPips(ctx, e, f, k) {
  if (!(e.shell > 0)) return;
  const c = ENEMY_STYLE.beetle;
  const n = Math.floor(e.shell);
  const total = n * c.segW + (n - 1) * c.segGap;
  const top = enemyFootY(e) + (f.box[1] - f.h) * k - (HP.gap + HP.h) * U; // Oberkante des Lebensbalkens
  const y = top - c.lift - c.segH;
  ctx.save();
  ctx.fillStyle = c.fill;
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = c.line;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.rect(e.x - total / 2 + i * (c.segW + c.segGap), y, c.segW, c.segH);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
