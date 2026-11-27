// B-173/B-174: Optik der Stufe-3-Fähigkeiten und des Aufstiegs (nur Zeichnen, keine Spiel-Logik).
// Bauvorlagen: docs/design/elemente/Effekte-*.md. Werte in MASTER_FX (config.js). Liest state.grounds (Brand, Eis),
// state.effects ('ascend', 'storm', 'stormWarn', 'multiHit'), Geschosse mit p.master, Markierung am Gegner.
// Alle Teilchen (Funken, Flämmchen, Glanz, Spuren) teilen sich je Bild MASTER_FX.maxParticles.
// Transparenz nur über globalAlpha innerhalb von save/restore.
import { MASTER_FX as M, TILE, ENEMY_TYPES, FIGURE_STYLE as S, isBoss } from './config.js';
import { enemyFigure } from './figures.js';
import { towerMuzzle, figurePoint, towerFootY } from './render-towers.js';
import { enemyFootY } from './render-enemies.js';
import { createBudget, resetBudget, takeBudget, trailTail, hash01, shownLevel } from './tower-fx.js';
import { starPath } from './draw-utils.js';

const TWO_PI = Math.PI * 2;
const U = TILE / S.unit;
const A = M.ascend, MS = M.multishot, ST = M.storm, BU = M.burn, IC = M.iceFloor, MK = M.mark;
const budget = createBudget(M.maxParticles);
const pt = [0, 0];
const towerById = new Map();
const iceCount = new Map();
const clamp01 = (v) => (v > 0 ? (v < 1 ? v : 1) : 0);
const ageOf = (e) => (Number.isFinite(e.max - e.ttl) ? Math.max(0, e.max - e.ttl) : 0);
const ok = (...v) => v.every(Number.isFinite);
// 4-Spitzen-Stern der Bauvorlage: Spitzen r, Innenpunkte 0,25 r auf den Diagonalen
const star4 = (ctx, x, y, r) => starPath(ctx, x, y, r, r * 0.354, 4, -Math.PI / 2);

// Für Tests: verbleibende Teilchen in diesem Bild
export function masterBudgetLeft() {
  return budget.left;
}

// Einmal je Bild vor den Stufe-3-Effekten aufrufen
export function beginMasterFx(state) {
  resetBudget(budget);
  towerById.clear();
  for (const t of state.towers || []) towerById.set(t.id, t);
}

// Angezeigte Stufe eines Turms (beim Aufstieg bis zum Figurwechsel noch Stufe 2)
export function displayLevel(state, t) {
  for (const e of state.effects || []) if (e && e.kind === 'ascend' && e.towerId === t.id) return shownLevel(t.level, ageOf(e), A.swapAt);
  return t.level;
}

// Lage eines Gegners für Marken: Kopfmitte, Oberkante Lebensbalken, Breite, Größenfaktor
const em = { head: 0, bar: 0, w: 0, big: 1, foot: 0 };
function enemyMetrics(e) {
  const f = enemyFigure(Object.hasOwn(ENEMY_TYPES, e.type) ? e.type : 'grunt', false);
  if (!f) return null;
  const big = f.big ? S[f.big] : 1;
  const k = U * big;
  em.foot = enemyFootY(e);
  const top = em.foot + (f.box[1] - f.h) * k;
  em.head = top + (em.foot - top) * 0.3;
  em.bar = top - (S.hp.gap + S.hp.h) * U;
  em.w = f.w * k;
  em.big = big;
  return em;
}
const inside = (e, g) => Math.hypot(e.x - g.x, e.y - g.y) <= g.r;
const flying = (e) => ENEMY_TYPES[e.type]?.flying === true;
const slowImmune = (e) => ENEMY_TYPES[e.type]?.slowImmune === true;

// ---------- Unter den Figuren ----------
// Bodenflächen (Eis, Brand), Gewitter-Ankündigung, Rußfleck/Druckring des Einschlags, Bodenring des Aufstiegs, Reif.
export function drawMasterUnder(ctx, state, reduced = false) {
  const time = state.time || 0;
  const grounds = state.grounds || [];
  iceCount.clear();
  let fires = 0;
  for (let i = grounds.length - 1; i >= 0; i--) {
    const g = grounds[i];
    if (!g || !ok(g.x, g.y, g.r) || !(g.r > 0)) continue;
    if (g.kind === 'ice') {
      const n = iceCount.get(g.towerId) || 0;
      iceCount.set(g.towerId, n + 1);
      if (n < IC.maxPerTower) drawIceFloor(ctx, g, time, reduced);
    } else if (g.kind === 'fire' && fires < BU.maxPatches) {
      fires++;
      drawBurn(ctx, g, time, reduced);
    }
  }
  for (const e of state.enemies || []) if (!flying(e) && !slowImmune(e) && !(time < (e.frozenUntil || 0))) {
    for (const g of grounds) if (g && g.kind === 'ice' && inside(e, g)) { drawRime(ctx, e); break; }
  }
  let strikes = 0;
  for (const e of state.effects || []) {
    if (!e) continue;
    if (e.kind === 'stormWarn') drawStormWarn(ctx, e);
    else if (e.kind === 'storm' && strikes < ST.maxStrikes) { strikes++; drawStormGround(ctx, e, reduced); }
    else if (e.kind === 'ascend') drawAscendRing(ctx, e);
  }
}

// ---------- Über den Figuren ----------
// Gewitterwolke und Blitz, Aufstiegs-Säule, Treffer-Sterne, Zielstrahl, Marken und Flämmchen an Gegnern.
export function drawMasterOver(ctx, state, reduced = false) {
  const time = state.time || 0;
  let strikes = 0;
  for (const e of state.effects || []) {
    if (!e) continue;
    if (e.kind === 'storm' && strikes < ST.maxStrikes) { strikes++; drawStormSky(ctx, e, reduced); }
    else if (e.kind === 'multiHit' && !reduced) drawMultiHit(ctx, e);
    else if (e.kind === 'ascend') drawAscend(ctx, e, reduced);
  }
  drawAimBeams(ctx, state, reduced);
  const grounds = state.grounds || [];
  for (const e of state.enemies || []) {
    if (!(e.hp > 0)) continue;
    let burning = false;
    if (!flying(e)) for (const g of grounds) if (g && g.kind === 'fire' && inside(e, g)) { burning = true; break; }
    const marked = time < (e.markedUntil || 0);
    if (!burning && !marked) continue;
    const m = enemyMetrics(e);
    if (!m) continue;
    if (marked) drawMark(ctx, e, m, time, reduced);
    if (burning && takeBudget(budget, 1)) drawEnemyFlame(ctx, e.x, m.bar - BU.enemyFlame - (marked ? MK.arrow[1] + MK.arrowGap : 0), time, reduced, e.id || 0);
  }
}

// Spuren des Mehrfachschusses und Leuchtspur des Falkenauges (vor den Geschossen zeichnen)
export function drawMasterTrails(ctx, state, reduced = false) {
  let trails = 0;
  const ps = state.projectiles || [];
  if (!ps.some((p) => p && p.master)) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    if (!p || !p.master || !ok(p.x, p.y)) continue;
    const t = towerById.get(p.towerId);
    if (!t) continue;
    if (p.master.multiTargets) {
      if (trails >= MS.maxTrails || !takeBudget(budget, 1)) continue;
      trails++;
      figurePoint(t, 3, MS.muzzle[0], MS.muzzle[1], pt);
      const tail = trailTail(pt[0], pt[1], p.x, p.y, p.tx, p.ty, MS.trailShare, MS.trailMin);
      if (!tail) continue;
      const layers = p.side ? [[MS.side, MS.w[2]]] : reduced ? [[MS.main, MS.w[0]]] : [[MS.glow, MS.w[1]], [MS.main, MS.w[0]]];
      for (const [c, w] of layers) line(ctx, tail[0], tail[1], p.x, p.y, c, w);
    } else if (p.master.markDuration) {
      towerMuzzle(t, 3, pt);
      if (!reduced) line(ctx, pt[0], pt[1], p.x, p.y, MK.traceGlow, MK.traceGlowW);
      line(ctx, pt[0], pt[1], p.x, p.y, MK.trace, MK.traceW);
    }
  }
  ctx.restore();
}

function line(ctx, x0, y0, x1, y1, color, w) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

// ---------- Eisboden ----------
function iceScale(age, rest, reduced) {
  let k = 1;
  if (age < IC.grow) {
    const u = age / IC.grow;
    k = reduced ? 0.2 + 0.8 * u : u < 0.7 ? 0.2 + (IC.overshoot - 0.2) * (u / 0.7) : IC.overshoot - (IC.overshoot - 1) * ((u - 0.7) / 0.3);
  }
  if (rest < IC.fadeOut) k *= IC.shrinkTo + (1 - IC.shrinkTo) * clamp01(rest / IC.fadeOut);
  return k;
}
function drawIceFloor(ctx, g, time, reduced) {
  const age = Math.max(0, time - (Number.isFinite(g.born) ? g.born : time));
  const rest = (Number.isFinite(g.until) ? g.until : time) - time;
  const k = iceScale(age, rest, reduced);
  const alpha = rest < IC.fadeOut ? clamp01(rest / IC.fadeOut) : 1;
  if (!(k > 0) || !(alpha > 0)) return;
  const rx = g.r * k, ry = rx * IC.ry;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(g.x, g.y, rx, ry, 0, 0, TWO_PI);
  ctx.fillStyle = IC.fill;
  ctx.fill();
  ctx.strokeStyle = IC.edge;
  ctx.lineWidth = IC.edgeW;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(g.x - IC.innerShift, g.y - IC.innerShift * IC.ry, rx * IC.innerShare, ry * IC.innerShare, 0, 0, TWO_PI);
  ctx.fillStyle = IC.inner;
  ctx.fill();
  // Risse: je 2-3 Abschnitte, fest je Fläche
  ctx.beginPath();
  for (let c = 0; c < IC.cracks; c++) {
    const a = (c / IC.cracks) * TWO_PI + hash01(g.x + c, g.y) * 1.2;
    let x = g.x + Math.cos(a) * rx * 0.25, y = g.y + Math.sin(a) * ry * 0.25;
    ctx.moveTo(x, y);
    const segs = 2 + (hash01(c, g.x + g.y) > 0.5 ? 1 : 0);
    for (let s = 0; s < segs; s++) {
      const len = 8 + 6 * hash01(g.y + s, c);
      const b = a + (hash01(s, c + g.x) - 0.5) * 0.9;
      x += Math.cos(b) * len * k;
      y += Math.sin(b) * len * k * IC.ry;
      ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = IC.edge;
  ctx.lineWidth = IC.crackW;
  ctx.stroke();
  // Glanzsterne funkeln versetzt
  const n = takeBudget(budget, IC.glints);
  ctx.fillStyle = IC.glint;
  for (let i = 0; i < n; i++) {
    const tw = reduced ? 1 : 0.5 + 0.5 * Math.sin((TWO_PI * (time + i * IC.twinkle / IC.glints)) / IC.twinkle);
    const r = (IC.glintR[0] + (IC.glintR[1] - IC.glintR[0]) * hash01(i, g.x)) * tw;
    if (!(r > 0.3)) continue;
    const a = hash01(g.x, i + g.y) * TWO_PI;
    ctx.beginPath();
    star4(ctx, g.x + Math.cos(a) * rx * 0.55, g.y + Math.sin(a) * ry * 0.55, r);
    ctx.fill();
  }
  ctx.restore();
}

// Reif an den Füßen eines Gegners auf dem Eisboden
function drawRime(ctx, e) {
  const m = enemyMetrics(e);
  if (!m) return;
  const rx = IC.rimeShare * m.w * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(e.x, m.foot, rx, IC.rimeRy, 0, 0, TWO_PI);
  ctx.fillStyle = IC.rime;
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < IC.rimeTicks; i++) {
    const x = e.x - rx * 0.6 + (i * rx * 1.2) / (IC.rimeTicks - 1);
    ctx.moveTo(x, m.foot);
    ctx.lineTo(x + (i - 1) * 1.5, m.foot - IC.rimeTick);
  }
  ctx.strokeStyle = IC.rimeLine;
  ctx.lineWidth = IC.crackW;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

// ---------- Brandfläche ----------
function drawBurn(ctx, g, time, reduced) {
  const age = Math.max(0, time - (Number.isFinite(g.born) ? g.born : time));
  const rest = (Number.isFinite(g.until) ? g.until : time) - time;
  const alpha = clamp01(age / BU.fadeIn) * clamp01(rest / BU.fadeOut);
  if (!(alpha > 0)) return;
  const rx = g.r * 0.9, ry = rx * 0.35;
  ctx.save();
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, rx * 1.1);
  glow.addColorStop(0, BU.glow[0]);
  glow.addColorStop(1, BU.glow[1]);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(g.x, g.y, rx * 1.1, ry * 1.1, 0, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = BU.soot;
  ctx.beginPath();
  ctx.ellipse(g.x, g.y, rx, ry, 0, 0, TWO_PI);
  ctx.fill();
  // Ring der Explosion (Mörserfestung), kurz nach dem Einschlag
  if (age < BU.ring && !reduced) {
    const u = age / BU.ring;
    ctx.strokeStyle = BU.core;
    ctx.lineWidth = BU.ringW * (1 - u);
    ctx.beginPath();
    ctx.ellipse(g.x, g.y, g.r * (BU.ringFrom + (BU.ringTo - BU.ringFrom) * u), g.r * (BU.ringFrom + (BU.ringTo - BU.ringFrom) * u) * 0.35, 0, 0, TWO_PI);
    ctx.stroke();
  }
  const seed = (Number.isFinite(g.born) ? g.born : 0) * 7.3;
  const n = takeBudget(budget, BU.flames);
  for (let i = 0; i < n; i++) {
    const a = hash01(seed + i, g.x) * TWO_PI, d = Math.sqrt(hash01(g.y, seed + i));
    drawFlame(ctx, g.x + Math.cos(a) * rx * 0.75 * d, g.y + Math.sin(a) * ry * 0.75 * d, BU.flameH, reduced ? 1 : flick(time, i), 1);
  }
  if (!reduced) {
    const k = takeBudget(budget, BU.embers);
    ctx.fillStyle = BU.ember;
    for (let i = 0; i < k; i++) {
      const u = (age + i / BU.embers) % 1;
      const x = g.x + (hash01(i, seed) - 0.5) * rx;
      ctx.globalAlpha = alpha * (1 - u);
      ctx.beginPath();
      ctx.arc(x, g.y - u * BU.emberRise, BU.emberR, 0, TWO_PI);
      ctx.fill();
    }
  }
  ctx.restore();
}
const flick = (time, i) => {
  const p = BU.flicker[i % BU.flicker.length];
  return 1 - 0.3 * (0.5 + 0.5 * Math.sin((TWO_PI * time) / p + i));
};
// Flämmchen (Tropfen M0 0 Q-7 -6 0 -18 Q7 -6 0 0, Kern halb so groß), Fuß bei (x, y)
function drawFlame(ctx, x, y, h, sy, inkScale) {
  const k = h / 18;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k * sy);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-7, -6, 0, -18);
  ctx.quadraticCurveTo(7, -6, 0, 0);
  ctx.closePath();
  ctx.fillStyle = BU.flame;
  ctx.fill();
  ctx.strokeStyle = M.ink;
  ctx.lineWidth = (BU.inkW * inkScale) / k;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-3.5, -3, 0, -9);
  ctx.quadraticCurveTo(3.5, -3, 0, 0);
  ctx.closePath();
  ctx.fillStyle = BU.core;
  ctx.fill();
  ctx.restore();
}
function drawEnemyFlame(ctx, x, y, time, reduced, id) {
  drawFlame(ctx, x, y, BU.enemyFlameH, reduced ? 1 : flick(time, id), 1);
}

// ---------- Gewitter ----------
function drawStormWarn(ctx, e) {
  if (!ok(e.x, e.y, e.r) || !(e.r > 0)) return;
  ctx.save();
  ctx.globalAlpha = 0.6 + 0.4 * clamp01(ageOf(e) / ST.tele);
  ctx.setLineDash(ST.teleDash);
  ctx.strokeStyle = M.ink;
  ctx.lineWidth = ST.teleW + 2;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.r, e.r * ST.flat, 0, 0, TWO_PI);
  ctx.stroke();
  ctx.strokeStyle = ST.teleColor;
  ctx.lineWidth = ST.teleW;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
// Blitz sichtbar? Doppeltes Aufblitzen (an, Pause, an); reduced: ein Bild ohne Flackern
function boltOn(age, reduced) {
  if (reduced) return age < ST.reducedFlash;
  const [a, b, c] = ST.flicker;
  return age < a || (age >= a + b && age < a + b + c);
}
function drawStormGround(ctx, e, reduced) {
  if (!ok(e.x, e.y, e.r) || !(e.r > 0)) return;
  const age = ageOf(e), R = e.r;
  ctx.save();
  if (age < ST.sootLife) {
    ctx.globalAlpha = ST.soot * (1 - age / ST.sootLife);
    ctx.fillStyle = BU.soot;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, R * ST.sootR, R * ST.sootR * ST.flat, 0, 0, TWO_PI);
    ctx.fill();
  }
  const lit = ST.flicker[0] + ST.flicker[1] + ST.flicker[2];
  if (age < lit * 1.6) {
    ctx.globalAlpha = 1 - age / (lit * 1.6);
    const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, R * ST.light);
    g.addColorStop(0, ST.bolt);
    g.addColorStop(1, 'rgba(255,246,168,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, R * ST.light, R * ST.light * ST.flat, 0, 0, TWO_PI);
    ctx.fill();
  }
  if (age < ST.ring) {
    const u = age / ST.ring;
    const k = reduced ? 1 : ST.ringFrom + (ST.ringTo - ST.ringFrom) * u;
    ctx.globalAlpha = 1 - u;
    ctx.strokeStyle = ST.bolt;
    ctx.lineWidth = ST.ringW;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, R * k, R * k * ST.flat, 0, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.restore();
}
function drawStormSky(ctx, e, reduced) {
  if (!ok(e.x, e.y, e.r) || !(e.r > 0)) return;
  const age = ageOf(e);
  const cx = e.x, cy = e.y - ST.cloudLift;
  const fade = clamp01((ST.cloudLife - age) / 0.4);
  if (!(fade > 0)) return;
  ctx.save();
  // Funke Spule -> Wolke
  const t = towerById.get(e.towerId);
  if (t && age < ST.link) {
    towerMuzzle(t, 3, pt);
    ctx.setLineDash(ST.linkDash);
    line(ctx, pt[0], pt[1], cx, cy, ST.electric, ST.linkW);
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = fade;
  // Wolke: drei Kreise, Unterkante gerade
  const bottom = cy + 8;
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - 60, cy - 60, 120, bottom - (cy - 60));
  ctx.clip();
  ctx.fillStyle = ST.cloud;
  ctx.strokeStyle = M.ink;
  ctx.lineWidth = ST.cloudInk * 2;
  for (const [dx, dy, r] of ST.puffs) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, TWO_PI); ctx.stroke(); }
  for (const [dx, dy, r] of ST.puffs) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, TWO_PI); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = M.ink;
  ctx.lineWidth = ST.cloudInk;
  ctx.beginPath();
  ctx.moveTo(cx - 28, bottom);
  ctx.lineTo(cx + 28, bottom);
  ctx.stroke();
  // Blitz von der Wolke zum Ziel mit Knicken und zwei Ästen
  if (boltOn(age, reduced)) {
    ctx.globalAlpha = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, bottom);
    const n = ST.kinks + 1;
    for (let i = 1; i <= n; i++) {
      const y = bottom + ((e.y - bottom) * i) / n;
      const x = i === n ? e.x : e.x + (hash01(e.x + i, e.y) - 0.5) * 2 * ST.kinkAmp;
      ctx.lineTo(x, y);
      if (i === 2 || i === 4) {
        const dir = i === 2 ? -1 : 1;
        const len = ST.branchLen[0] + (ST.branchLen[1] - ST.branchLen[0]) * hash01(i, e.x);
        ctx.moveTo(x, y);
        ctx.lineTo(x + dir * len * 0.7, y + len * 0.7);
        ctx.moveTo(x, y);
      }
    }
    const cols = [M.ink, ST.bolt, '#ffffff'];
    for (let k = 0; k < 3; k++) { ctx.strokeStyle = cols[k]; ctx.lineWidth = ST.boltW[k]; ctx.stroke(); }
  }
  ctx.restore();
}

// ---------- Mehrfachschuss ----------
function drawMultiHit(ctx, e) {
  if (!ok(e.x, e.y)) return;
  const u = clamp01(ageOf(e) / MS.starLife);
  const k = u < 0.5 ? 0.3 + 0.7 * (u / 0.5) : 1 + 0.5 * ((u - 0.5) / 0.5);
  const r = (e.main ? MS.star[0] : MS.star[1]) * k;
  ctx.save();
  ctx.globalAlpha = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5;
  ctx.beginPath();
  star4(ctx, e.x, e.y, r);
  ctx.fillStyle = e.main ? MS.main : MS.side;
  ctx.fill();
  ctx.strokeStyle = M.ink;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

// ---------- Markierung (Falkenauge) ----------
function drawAimBeams(ctx, state, reduced) {
  const time = state.time || 0;
  for (const t of state.towers || []) {
    if (t.type !== 'sniper' || displayLevel(state, t) < 3 || !(t.cooldown > 0 && t.cooldown < MK.aim)) continue;
    const target = (state.enemies || []).find((e) => e.id === t.aimId && e.hp > 0);
    if (!target || !ok(target.x, target.y)) continue;
    towerMuzzle(t, 3, pt);
    ctx.save();
    ctx.globalAlpha = reduced ? 1 : 0.65 + 0.35 * Math.sin(time * 40);
    ctx.setLineDash(MK.aimDash);
    line(ctx, pt[0], pt[1], target.x, target.y, M.ink, MK.aimW + 2);
    line(ctx, pt[0], pt[1], target.x, target.y, MK.color, MK.aimW);
    ctx.setLineDash([]);
    ctx.restore();
  }
}
function drawMark(ctx, e, m, time, reduced) {
  const rest = e.markedUntil - time;
  const age = Number.isFinite(e.markedAt) ? Math.max(0, time - e.markedAt) : MK.pop;
  const pop = reduced ? 1 : age < MK.pop ? MK.popFrom + (1 - MK.popFrom) * (age / MK.pop) : 1;
  const alpha = rest < MK.fadeOut ? clamp01(rest / MK.fadeOut) : 1;
  const r = MK.ring * m.big * pop;
  const spin = reduced ? 0 : (time / MK.spin) * TWO_PI;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(e.x, m.head, r, 0, TWO_PI);
  for (let i = 0; i < 4; i++) {
    const a = spin + (i * Math.PI) / 2;
    ctx.moveTo(e.x + Math.cos(a) * r, m.head + Math.sin(a) * r);
    ctx.lineTo(e.x + Math.cos(a) * (r + MK.tick), m.head + Math.sin(a) * (r + MK.tick));
  }
  ctx.strokeStyle = M.ink;
  ctx.lineWidth = MK.inkW;
  ctx.stroke();
  ctx.strokeStyle = MK.color;
  ctx.lineWidth = MK.lineW;
  ctx.stroke();
  // Pfeil über dem Lebensbalken
  const [aw, ah] = MK.arrow;
  const ay = m.bar - MK.arrowGap;
  ctx.beginPath();
  ctx.moveTo(e.x - aw / 2, ay - ah);
  ctx.lineTo(e.x + aw / 2, ay - ah);
  ctx.lineTo(e.x, ay);
  ctx.closePath();
  ctx.fillStyle = MK.color;
  ctx.fill();
  ctx.strokeStyle = M.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Schild "+25 %" beim ersten Markieren großer Gegner
  if (MK.tag && age < MK.tagLife && (isBoss(e) || MK.tagTypes.includes(e.type)) && Number.isFinite(e.markBonus)) {
    const [tw, th] = MK.tagSize;
    const tx = e.x - tw / 2, ty = ay - ah - 4 - th;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(tx, ty, tw, th, MK.tagR) : ctx.rect(tx, ty, tw, th);
    ctx.fillStyle = M.ink;
    ctx.fill();
    ctx.fillStyle = MK.tagText;
    ctx.font = MK.tagFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`+${Math.round(e.markBonus * 100)} %`, e.x, ty + th / 2);
  }
  ctx.restore();
}

// ---------- Aufstieg (Lichtsäule) ----------
function drawAscendRing(ctx, e) {
  const t = towerById.get(e.towerId);
  if (!t) return;
  const age = ageOf(e);
  if (age >= A.ring) return;
  const u = age / A.ring;
  const k = 0.4 + (1.4 - 0.4) * u;
  const foot = towerFootY(t);
  ctx.save();
  ctx.globalAlpha = 1 - u;
  ctx.strokeStyle = A.ringColor;
  ctx.lineWidth = A.ringW;
  ctx.beginPath();
  ctx.ellipse(t.x, foot, A.width * TILE * k, A.width * TILE * k * A.ringFlat, 0, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}
function drawAscend(ctx, e, reduced) {
  const t = towerById.get(e.towerId);
  if (!t) return;
  const age = ageOf(e);
  const foot = towerFootY(t);
  ctx.save();
  if (!reduced) {
    const grow = clamp01(age / A.grow);
    const fade = age < A.fadeFrom ? 1 : clamp01((A.life - age) / (A.life - A.fadeFrom));
    const top = foot - foot * grow; // bis zum oberen Feldrand (y = 0)
    if (grow > 0 && fade > 0) {
      const w = A.width * TILE;
      const g = ctx.createLinearGradient(0, foot, 0, top);
      g.addColorStop(0, A.colors[0]);
      g.addColorStop(0.5, A.colors[1]);
      g.addColorStop(1, A.colors[2]);
      ctx.globalAlpha = fade * 0.85;
      ctx.fillStyle = g;
      ctx.fillRect(t.x - w / 2, top, w, foot - top);
      ctx.globalAlpha = fade;
      ctx.fillStyle = A.coreColor;
      const cw = A.core * TILE;
      ctx.fillRect(t.x - cw / 2, top, cw, foot - top);
    }
    // Funkensterne steigen versetzt
    const n = takeBudget(budget, A.sparks);
    ctx.fillStyle = A.ringColor;
    ctx.strokeStyle = M.ink;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < n; i++) {
      const u = (age - (i / Math.max(1, A.sparks - 1)) * A.sparkSpread) / A.sparkLife;
      if (u < 0 || u > 1) continue;
      ctx.globalAlpha = 1 - u;
      ctx.beginPath();
      star4(ctx, t.x + (hash01(i, t.x) - 0.5) * A.width * TILE, foot - u * A.sparkRise, A.sparkR);
      ctx.fill();
      ctx.stroke();
    }
  }
  if (age < A.textLife) {
    figurePoint(t, 3, 40, 0, pt);
    const u = age / A.textLife;
    const y = pt[1] - A.textLift * TILE + (reduced ? 0 : A.textRise * (1 - Math.min(1, u * 3)));
    ctx.globalAlpha = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
    ctx.font = A.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = A.textInk;
    ctx.strokeStyle = M.ink;
    ctx.strokeText(A.text, t.x, Math.max(18, y));
    ctx.fillStyle = A.ringColor;
    ctx.fillText(A.text, t.x, Math.max(18, y));
  }
  ctx.restore();
}
