// Zeichnung der Projektil-Schweife und Partikel. Keine Spiel-Logik; der Zustand kommt aus fx-system.js.
// Transparenz nur ueber globalAlpha innerhalb von save/restore. Keine Allokation pro Frame.
import {
  createFx, syncFx, shakeOffset, bossEntryProgress, MAX_PARTICLES,
  K_NONE, K_SMOKE, K_ICE, K_SPARK, K_FLASH, K_COIN,
  T_ARROW, T_CANNON, T_FROST, T_SNIPER,
} from './fx-system.js';
import { BOSS_ENTRY } from './config.js';

// Ein gemeinsamer Partikelzustand fuer das Spiel (wird bei Neustart/Zeitsprung von syncFx geleert).
const fx = createFx();
export function getFx() {
  return fx;
}

// Rein visuelle Konstanten
const ARROW_TAIL = 16; // Schweiflaenge in Pixeln
const ARROW_SEGMENTS = 3;
const SNIPER_BEAM = 38;
const COL_ARROW_TAIL = '#f5e6c8';
const COL_SNIPER_BEAM = '#efe2ff';
const COL_SNIPER_CORE = '#ffffff';
const COL_FROST_GLOW = '#8fdcf5';
const COL_SMOKE = '#6a6a70';
const COL_ICE = '#d6f6ff';
const COL_SPARK = '#ffcf5a';
const COL_FLASH = '#ffffff';
const COL_COIN = '#ffd54a';
const COL_CANNON_SHINE = '#777';
const COL_COIN_EDGE = '#c9a227';
const COL_COIN_SHINE = '#fff6c4';
const TWO_PI = Math.PI * 2;

// Pro Frame einmal aufrufen (vor dem Zeichnen): leitet Partikel aus dem Zustand ab.
// reducedMotion: prefers-reduced-motion (aus main.js ueber ui), schaltet das Boss-Wackeln aus.
export function updateFx(state, reducedMotion = false) {
  syncFx(fx, state, reducedMotion);
}

// Bodenschlag beim Boss-Auftritt (B-067): goldener Ring am Boden, waechst und wird duenner.
// Bei reduzierter Bewegung waechst er nicht, sondern wird nur duenner.
export function drawBossEntry(ctx) {
  const u = bossEntryProgress(fx.lastTime, fx.entryStart);
  if (u < 0) return;
  const k = fx.entryReduced ? 1 : BOSS_ENTRY.ringStart + (BOSS_ENTRY.ringRadius - BOSS_ENTRY.ringStart) * (1 - (1 - u) * (1 - u));
  ctx.save();
  ctx.strokeStyle = BOSS_ENTRY.ringColor;
  ctx.lineWidth = BOSS_ENTRY.ringWidth * (1 - u); // verblasst ueber die Linienbreite (kein globalAlpha noetig)
  ctx.beginPath();
  ctx.ellipse(fx.entryX, fx.entryY + fx.entryR * 0.7, fx.entryR * k, fx.entryR * k * 0.4, 0, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

// Shake-Versatz fuer die Welt-Zeichnung (nur Zeichnung, die Eingabe in main.js bleibt unberuehrt).
export function shakeX() {
  return shakeOffset(fx.lastTime, fx.shakeStart, fx.shakeStrength, 0);
}
export function shakeY() {
  return shakeOffset(fx.lastTime, fx.shakeStart, fx.shakeStrength, 1);
}

// Zusatz-Zeichnung zu einem Projektil (Schweif/Strahl/Leuchten); der Grundkreis kommt aus render.js.
export function drawProjectileFx(ctx, p) {
  const s = fx.slotOf.get(p);
  if (s === undefined || !fx.sActive[s]) return;
  const type = fx.sType[s];
  const dx = fx.sDx[s];
  const dy = fx.sDy[s];
  if (type === T_ARROW) {
    ctx.save();
    ctx.strokeStyle = COL_ARROW_TAIL;
    ctx.lineWidth = 2;
    for (let i = 0; i < ARROW_SEGMENTS; i++) {
      const a = (i * ARROW_TAIL) / ARROW_SEGMENTS;
      const b = ((i + 1) * ARROW_TAIL) / ARROW_SEGMENTS;
      ctx.globalAlpha = 0.7 * (1 - i / ARROW_SEGMENTS);
      ctx.beginPath();
      ctx.moveTo(p.x - dx * a, p.y - dy * a);
      ctx.lineTo(p.x - dx * b, p.y - dy * b);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  } else if (type === T_SNIPER) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = COL_SNIPER_BEAM;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - dx * SNIPER_BEAM, p.y - dy * SNIPER_BEAM);
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = COL_SNIPER_CORE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - dx * SNIPER_BEAM * 0.7, p.y - dy * SNIPER_BEAM * 0.7);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  } else if (type === T_FROST) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = COL_FROST_GLOW;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  } else if (type === T_CANNON) {
    ctx.save();
    ctx.globalAlpha = 0.6; // Glanz auf der Kugel
    ctx.fillStyle = COL_CANNON_SHINE;
    ctx.beginPath();
    ctx.arc(p.x - 1.5, p.y - 1.5, 1.6, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// Alle lebenden Partikel (nach Gegnern und Projektilen).
export function drawParticles(ctx) {
  let any = false;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (fx.pkind[i] !== K_NONE) { any = true; break; }
  }
  if (!any) return;
  ctx.save();
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const k = fx.pkind[i];
    if (k === K_NONE) continue;
    const u = fx.page[i] / fx.plife[i]; // 0 neu .. 1 fast weg
    const x = fx.px[i];
    const y = fx.py[i];
    const size = fx.psize[i];
    if (k === K_SMOKE) {
      ctx.globalAlpha = 0.5 * (1 - u);
      ctx.fillStyle = COL_SMOKE;
      ctx.beginPath();
      ctx.arc(x, y, size * (1 + u * 0.6), 0, TWO_PI);
      ctx.fill();
    } else if (k === K_ICE) {
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = COL_ICE;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TWO_PI);
      ctx.fill();
    } else if (k === K_SPARK) {
      ctx.globalAlpha = 1 - u;
      ctx.strokeStyle = COL_SPARK;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - fx.pvx[i] * 0.04, y - fx.pvy[i] * 0.04);
      ctx.stroke();
    } else if (k === K_FLASH) {
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = COL_FLASH;
      ctx.beginPath();
      ctx.arc(x, y, size * (0.5 + u), 0, TWO_PI);
      ctx.fill();
    } else if (k === K_COIN) {
      ctx.globalAlpha = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
      ctx.fillStyle = COL_COIN_EDGE;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = COL_COIN;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.75, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = COL_COIN_SHINE;
      ctx.beginPath();
      ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.25, 0, TWO_PI);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
