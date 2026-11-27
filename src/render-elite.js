// B-179: Elite-Abzeichen (Bauvorlage docs/design/elemente/Gegner-Elite.md), nur Zeichnen. Goldstern mit Zeichen der
// Eigenschaft über der Figur, gestrichelter Goldring am Fuß und kleine Eigenschaftszeichen an der Figur
// (schnell: Tempostriche, Schild: Bogen in Laufrichtung, Selbstheilung: steigende Pluszeichen).
// Transparenz nur über Farben mit Alpha (kein globalAlpha). Bosse tragen nie ein Abzeichen.
import { ENEMY_STYLE, FIGURE_STYLE as S, FX_STYLE, TILE } from './config.js';
import { enemyFigure } from './figures.js';
import { withAlpha } from './svg-figure.js';

const E = ENEMY_STYLE.elite;
const TWO_PI = Math.PI * 2;
const U = TILE / S.unit;

// Eigenschaft der Logik (ELITE.traits) -> Zeichen; unbekannt: nur Stern ohne Zeichen
const GLYPH_OF = { swift: 'fast', fast: 'fast', shield: 'shield', regen: 'heal', heal: 'heal' };
export function eliteGlyph(trait) {
  return Object.hasOwn(GLYPH_OF, trait ?? '') ? GLYPH_OF[trait] : null;
}

// Kantenlänge des Abzeichens in Spiel-px: 20 Entwurfs-px mal Gegner-Maßstab, mindestens minPx
export function eliteBadgeSize(scale = 1) {
  return Math.max(E.minPx, E.size * U * (Number.isFinite(scale) && scale > 0 ? scale : 1));
}

const wave01 = (time, period, still) => (still || !Number.isFinite(time) ? 1 : 0.5 + 0.5 * Math.cos((TWO_PI * time) / period));

// Fußring (vor der Figur zeichnen): Ellipse rx = halbe Figurbreite + 4, flach, gestrichelt, pulsiert (still: fest)
export function drawEliteRing(ctx, e, footY, figW, time, still) {
  const rx = figW / 2 + E.ringPad;
  const a = E.ringPulse[0] + (E.ringPulse[1] - E.ringPulse[0]) * wave01(time, E.ringPeriod, still);
  ctx.save();
  ctx.strokeStyle = withAlpha(E.ring, a / E.ringPulse[1]);
  ctx.lineWidth = E.ringWidth;
  ctx.setLineDash(E.ringDash);
  ctx.beginPath();
  ctx.ellipse(e.x, footY, rx, rx * E.ringFlat, 0, 0, TWO_PI);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// Zeichen im Stern (Koordinaten der 20er-Box)
function glyph(ctx, kind) {
  ctx.strokeStyle = E.ink;
  ctx.lineWidth = E.glyphLine;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'fast') {
    ctx.moveTo(4.5, 6); ctx.lineTo(8, 10); ctx.lineTo(4.5, 14);
    ctx.moveTo(9.5, 6); ctx.lineTo(13, 10); ctx.lineTo(9.5, 14);
    ctx.stroke();
  } else if (kind === 'shield') {
    ctx.moveTo(10, 4.5); ctx.lineTo(14.5, 6.5); ctx.lineTo(14.5, 10);
    ctx.quadraticCurveTo(14.5, 13.5, 10, 15.5);
    ctx.quadraticCurveTo(5.5, 13.5, 5.5, 10);
    ctx.lineTo(5.5, 6.5);
    ctx.closePath();
    ctx.fillStyle = E.shield;
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'heal') {
    ctx.moveTo(10, 5); ctx.lineTo(10, 15);
    ctx.moveTo(5, 10); ctx.lineTo(15, 10);
    ctx.stroke();
  }
}

// Abzeichen: linke obere Ecke bei (x, y), Kantenlänge size (Spiel-px)
export function drawEliteBadge(ctx, x, y, size, trait) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / E.size, size / E.size);
  ctx.beginPath();
  for (let i = 0; i < E.star.length; i += 2) {
    if (i === 0) ctx.moveTo(E.star[i], E.star[i + 1]);
    else ctx.lineTo(E.star[i], E.star[i + 1]);
  }
  ctx.closePath();
  ctx.fillStyle = E.gold;
  ctx.fill();
  ctx.strokeStyle = E.ink;
  ctx.lineWidth = E.starLine;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(10, 10, E.innerR, 0, TWO_PI);
  ctx.fillStyle = E.cream;
  ctx.fill();
  ctx.lineWidth = E.innerLine;
  ctx.stroke();
  glyph(ctx, eliteGlyph(trait));
  ctx.restore();
}

// Eigenschaftszeichen an der Figur (Weltkoordinaten). dir: Blickrichtung (1 rechts, -1 links); top/foot: Oberkante
// und Fußpunkt der Figur, w: Figurbreite. still (eingefroren, reduced motion): Zeichen stehen.
export function drawEliteTrait(ctx, e, kind, dir, top, foot, w, time, still) {
  const t = still || !Number.isFinite(time) ? 0 : time;
  const h = foot - top;
  ctx.save();
  ctx.lineCap = 'round';
  if (kind === 'fast') {
    // drei Tempostriche hinter der Figur, laufen dashRun px nach hinten
    const run = still ? 0 : ((t / E.dashPeriod) % 1) * E.dashRun;
    ctx.strokeStyle = E.cream;
    ctx.lineWidth = E.dashWidth;
    ctx.beginPath();
    for (let i = 0; i < E.dashes; i++) {
      const y = top + h * (0.35 + 0.2 * i);
      const x0 = e.x - dir * (w / 2 + E.dashGap + run);
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 - dir * E.dashLen, y);
    }
    ctx.stroke();
  } else if (kind === 'shield' && e.ward > 0) {
    // Bogen vor der Figur (Seite der Laufrichtung), pulsiert; nur solange der Schild hält
    const a = E.arcPulse[0] + (E.arcPulse[1] - E.arcPulse[0]) * wave01(t, E.arcPeriod, still);
    const cx = e.x, cy = top + h / 2, r = h * E.arcR;
    const mid = dir < 0 ? Math.PI : 0;
    ctx.beginPath();
    ctx.arc(cx, cy, r, mid - E.arcSpan / 2, mid + E.arcSpan / 2);
    ctx.strokeStyle = withAlpha(E.ink, a);
    ctx.lineWidth = E.arcInk;
    ctx.stroke();
    ctx.strokeStyle = withAlpha(E.shield, a);
    ctx.lineWidth = E.arcWidth;
    ctx.stroke();
  } else if (kind === 'heal') {
    // drei Pluszeichen steigen versetzt auf
    for (let i = 0; i < E.plus; i++) {
      const u = still ? i / E.plus : ((t / E.plusPeriod + i / E.plus) % 1);
      const x = e.x + (i - 1) * w * 0.3;
      const y = top + h * 0.4 - u * E.plusRise;
      const fade = still ? 1 : 1 - u;
      ctx.beginPath();
      ctx.moveTo(x - E.plusSize, y); ctx.lineTo(x + E.plusSize, y);
      ctx.moveTo(x, y - E.plusSize); ctx.lineTo(x, y + E.plusSize);
      ctx.strokeStyle = withAlpha(E.healB, fade);
      ctx.lineWidth = E.plusInk;
      ctx.stroke();
      ctx.strokeStyle = withAlpha(E.healA, fade);
      ctx.lineWidth = E.plusWidth;
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Tod eines Elite-Gegners (Ereignis kind 'eliteGone'): Abzeichen fliegt rise Entwurfs-px hoch und blendet aus.
// Lage wie in drawEnemy (Figur-Oberkante aus Typ und Maßstab). reduced: steigt nicht, blendet nur aus.
export function drawEliteGone(ctx, fx, reduced = false) {
  if (!fx || !Number.isFinite(fx.x) || !Number.isFinite(fx.y) || !(fx.max > 0)) return;
  const f = enemyFigure(fx.type, false) || enemyFigure('grunt', false);
  const scale = f.big ? S[f.big] : 1;
  const k = U * scale;
  const u = Math.max(0, Math.min(1, 1 - fx.ttl / fx.max));
  const size = eliteBadgeSize(scale);
  const top = fx.y + S.enemyFoot * U - f.h * k;
  ctx.save();
  ctx.globalAlpha = 1 - u;
  drawEliteBadge(ctx, fx.x + 0.28 * f.w * k, top - E.lift * size - (reduced ? 0 : u * FX_STYLE.eliteGone.rise * U), size, fx.elite);
  ctx.restore();
}
