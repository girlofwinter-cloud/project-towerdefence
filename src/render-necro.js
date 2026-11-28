// B-180: Optik der Nekromantin als Endboss (nur Zeichnen, keine Spiel-Logik). Bauvorlage
// docs/design/elemente/Gegner-Nekromantin.md: Boden-Aura mit Runenring, pulsierende Stabkugel, wehender Umhang,
// Phase 2 mit kreisenden Schädeln, Schild-Kugel, Phasenwechsel (Druckwelle + Schrift) und Beschwörungs-Fleck.
// Transparenz nur über Farben mit Alpha (kein globalAlpha), damit der Zustand des Kontexts sauber bleibt.
import { ENEMY_STYLE, FIGURE_STYLE as S, TILE } from './config.js';
import { enemyFigure } from './figures.js';
import { drawElements, withAlpha } from './svg-figure.js';

const N = ENEMY_STYLE.necro;
const TWO_PI = Math.PI * 2;
const U = TILE / S.unit; // Entwurfs-px -> Spiel-px
const K = U * S.necroScale; // Entwurfs-px der Nekromantin -> Spiel-px
const FOOT = S.enemyFoot * U;

const glowOf = (e) => (e && e.phase === 2 ? N.glow2 : N.glow);
const finite = (v) => Number.isFinite(v);

// Drehwinkel der Aura (Phase 2 doppelt so schnell); reduced motion oder ohne Zeit: steht
export function necroAuraAngle(e, time, reduced = false) {
  if (reduced || !finite(time)) return 0;
  const turn = e && e.phase === 2 ? N.auraTurn2 : N.auraTurn;
  return ((time / turn) % 1) * TWO_PI;
}

// Boden-Aura unter der Figur (render.js zeichnet sie vor allen Figuren): Lichtfleck und flacher Runenring
// mit Dreieck-Spitzen. Andere Gegnertypen: nichts.
export function drawNecroAura(ctx, e, time, reduced = false) {
  if (!e || e.type !== 'necro' || !finite(e.x) || !finite(e.y)) return;
  const glow = glowOf(e);
  const y = e.y + FOOT;
  const rx = N.spotRx * TILE;
  ctx.save();
  ctx.fillStyle = withAlpha(glow, N.spotAlpha);
  ctx.beginPath();
  ctx.ellipse(e.x, y, rx, rx * N.flat, 0, 0, TWO_PI);
  ctx.fill();
  ctx.translate(e.x, y);
  ctx.scale(1, N.flat);
  ctx.rotate(necroAuraAngle(e, time, reduced));
  ctx.strokeStyle = withAlpha(glow, N.ringAlpha);
  ctx.lineWidth = N.ringWidth;
  for (const r of [N.ringOuter, N.ringInner]) {
    ctx.beginPath();
    ctx.arc(0, 0, r * K, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.fillStyle = withAlpha(glow, N.ringAlpha);
  for (let i = 0; i < N.spikes; i++) {
    const a = (i / N.spikes) * TWO_PI;
    const c = Math.cos(a), s = Math.sin(a);
    const r0 = N.ringOuter * K, r1 = r0 + N.spikeLen * K, h = N.spikeHalf * K;
    ctx.beginPath();
    ctx.moveTo(c * r0 - s * h, s * r0 + c * h);
    ctx.lineTo(c * r1, s * r1);
    ctx.lineTo(c * r0 + s * h, s * r0 - c * h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Teile der Figur vor dem Sprite, in Figur-Koordinaten (Transformation setzt drawEnemy): Schatten, pulsierender
// Leuchtschein der Stabkugel (scale 1 -> 1,3) und der Umhang (skewX 0 -> -4 Grad um die Oberkante). still: steht.
export function drawNecroBack(ctx, f, e, time, still) {
  if (f.back) drawElements(ctx, f.back);
  const live = !still && finite(time);
  const wave = (period) => (live ? 0.5 - 0.5 * Math.cos((TWO_PI * time) / period) : 0); // 0..1
  const k = 1 + N.orbPulse * wave(1 / N.orbHz);
  ctx.fillStyle = withAlpha(glowOf(e), N.orbAlpha);
  ctx.beginPath();
  ctx.arc(N.orb[0], N.orb[1], N.orbR * k, 0, TWO_PI);
  ctx.fill();
  if (!f.cloak) return;
  const skew = Math.tan((N.cloakSkew * Math.PI / 180) * wave(e && e.phase === 2 ? N.cloakPeriod2 : N.cloakPeriod));
  if (skew === 0) { drawElements(ctx, f.cloak); return; }
  ctx.save();
  ctx.translate(0, N.cloakTop);
  ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.translate(0, -N.cloakTop);
  drawElements(ctx, f.cloak);
  ctx.restore();
}

// So weit ragt der größte Kugelschein über die Box der Figur hinaus (Entwurfs-px), damit der Lebensbalken darüber bleibt
export function necroGlowOverflow(f) {
  return Math.max(0, (f.body || f.box)[1] - (N.orb[1] - N.orbR * (1 + N.orbPulse)));
}

// Lage der kreisenden Schädel (Phase 2) relativ zur Kopfmitte in Spiel-px; reduced: stehen links und rechts.
// Liefert [dx, dy, vorn] je Schädel (vorn: vor der Figur zeichnen).
export function skullOffsets(time, reduced = false) {
  const base = reduced || !finite(time) ? 0 : ((time / N.skullTurn) % 1) * TWO_PI;
  const out = [];
  for (let i = 0; i < 2; i++) {
    const a = base + i * Math.PI;
    out.push([Math.cos(a) * N.skullOrbit * K, Math.sin(a) * N.skullOrbit * K * N.flat, reduced || Math.sin(a) >= 0]);
  }
  return out;
}

// Ein kleiner Schädel (Weltkoordinaten), r in Spiel-px
export function drawSkull(ctx, x, y, r) {
  ctx.fillStyle = N.skull;
  ctx.strokeStyle = N.ink;
  ctx.lineWidth = Math.max(1, r * 0.4);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = N.ink;
  for (const dx of [-0.38, 0.38]) {
    ctx.beginPath();
    ctx.arc(x + dx * r, y - 0.1 * r, r * 0.27, 0, TWO_PI);
    ctx.fill();
  }
}

// Phase 2: zwei Schädel kreisen um den Kopf. front: nur die vorderen (nach der Figur) bzw. hinteren (davor).
export function drawNecroSkulls(ctx, e, time, reduced, front) {
  if (!e || e.phase !== 2 || !finite(e.x) || !finite(e.y)) return;
  const f = enemyFigure('necro', false);
  const hx = e.x + (N.head[0] - f.w / 2) * K;
  const hy = e.y + FOOT - (f.h - N.head[1]) * K;
  ctx.save();
  for (const [dx, dy, isFront] of skullOffsets(time, reduced)) if (isFront === front) drawSkull(ctx, hx + dx, hy + dy, N.skullR * K);
  ctx.restore();
}

// Radius der Schild-Kugel (0,8 x Figurhöhe) und ihre Mitte (Figurmitte) in Spiel-px
export function necroShieldGeometry(e) {
  const f = enemyFigure('necro', false);
  const h = f.h * K;
  return { x: e.x, y: e.y + FOOT - h / 2, r: N.shieldR * h };
}

// Schild-Kugel, solange der Schild beim Phasenwechsel hält (e.shieldUntil aus der Logik)
export function drawNecroShield(ctx, e, time) {
  if (!e || !(e.shieldUntil > time) || !finite(e.x) || !finite(e.y)) return;
  const g = necroShieldGeometry(e);
  ctx.save();
  ctx.beginPath();
  ctx.arc(g.x, g.y, g.r, 0, TWO_PI);
  ctx.fillStyle = withAlpha(N.shieldColor, N.shieldAlpha);
  ctx.fill();
  ctx.strokeStyle = N.ink;
  ctx.lineWidth = N.shieldInk;
  ctx.stroke();
  ctx.strokeStyle = N.shieldColor;
  ctx.lineWidth = N.shieldLine;
  ctx.stroke();
  ctx.restore();
}

const age = (fx) => {
  const t = fx.max - fx.ttl;
  return finite(t) && t > 0 ? t : 0;
};

// Phasenwechsel (Ereignis kind 'phase2'): Druckwelle (scale 0,3 -> 1,3 in 0,6 s) und Schrift „Zweite Phase!“ (1,2 s).
// reduced: Druckwelle wächst nicht (steht in voller Größe und verblasst), Schrift steht.
export function drawNecroPhase(ctx, fx, reduced = false) {
  if (!fx || fx.kind !== 'phase2' || !finite(fx.x) || !finite(fx.y)) return;
  const t = age(fx);
  const g = necroShieldGeometry(fx);
  ctx.save();
  if (t < N.waveLife) {
    const u = t / N.waveLife;
    const k = reduced ? N.waveTo : N.waveFrom + (N.waveTo - N.waveFrom) * u;
    ctx.strokeStyle = withAlpha(N.glow2, 1 - u);
    ctx.lineWidth = N.waveWidth;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r * k, 0, TWO_PI);
    ctx.stroke();
  }
  if (t < N.textLife) {
    const fade = Math.min(1, (N.textLife - t) / (N.textLife * 0.25));
    const y = g.y - g.r - N.textGap;
    ctx.font = N.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = N.textLine;
    ctx.strokeStyle = withAlpha(N.ink, fade);
    ctx.strokeText(N.text, g.x, y);
    ctx.fillStyle = withAlpha(N.glow2, fade);
    ctx.fillText(N.text, g.x, y);
  }
  ctx.restore();
}

// Beschwörung (Ereignis kind 'summon'): leuchtender Bodenfleck (unter den Figuren) ...
export function drawSummonSpot(ctx, fx) {
  if (!fx || fx.kind !== 'summon' || !finite(fx.x) || !finite(fx.y) || !(fx.max > 0)) return;
  const a = Math.max(0, Math.min(1, fx.ttl / fx.max));
  ctx.save();
  ctx.fillStyle = withAlpha(fx.p2 ? N.glow2 : N.glow, N.summonAlpha * a);
  ctx.beginPath();
  ctx.ellipse(fx.x, fx.y + FOOT, N.summonRx * U, N.summonRy * U, 0, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

// ... und ein Schädel, der 8 Entwurfs-px aufsteigt (über den Figuren); reduced: steigt nicht
export function drawSummonSkull(ctx, fx, reduced = false) {
  if (!fx || fx.kind !== 'summon' || !finite(fx.x) || !finite(fx.y) || !(fx.max > 0)) return;
  const u = 1 - Math.max(0, Math.min(1, fx.ttl / fx.max));
  ctx.save();
  drawSkull(ctx, fx.x, fx.y + FOOT - N.summonSkullR * U - (reduced ? 0 : u * N.summonRise * U), N.summonSkullR * U);
  ctx.restore();
}
