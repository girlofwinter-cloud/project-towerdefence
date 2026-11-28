// Zeichnung der Projektil-Schweife und Partikel. Keine Spiel-Logik; der Zustand kommt aus fx-system.js.
// Transparenz nur ueber globalAlpha innerhalb von save/restore. Keine Allokation pro Frame.
import {
  createFx, syncFx, shakeOffset, bossEntryProgress, MAX_PARTICLES,
  K_NONE, K_SMOKE, K_ICE, K_SPARK, K_FLASH, K_COIN, K_DUST, K_ROCK, K_SUMMON, coinHop, coinSpin, meteorPhase,
  T_ARROW, T_CANNON, T_FROST, T_SNIPER,
} from './fx-system.js';
import { BOSS_ENTRY, ENEMY_STYLE, FX_STYLE, STYLE, WIDTH, HEIGHT, TILE, FIGURE_STYLE, MASTER_FX } from './config.js';
import { outlineOf, starPath, zigPath } from './draw-utils.js';
import { enemyFigure } from './figures.js';
import { drawElements } from './svg-figure.js';
import { drawNecroPhase, drawSummonSpot, drawSummonSkull } from './render-necro.js';
import { drawEliteGone } from './render-elite.js';

// Ein gemeinsamer Partikelzustand fuer das Spiel (wird bei Neustart/Zeitsprung von syncFx geleert).
const fx = createFx();
export function getFx() {
  return fx;
}

// Rein visuelle Konstanten (Farben und Maße in config.js, FX_STYLE). Konturen einmal beim Laden ableiten.
const TWO_PI = Math.PI * 2;
const U = TILE / FIGURE_STYLE.unit; // Stil 1: Entwurfs-px -> Spiel-px
const A = FX_STYLE.arrow;
const CN = FX_STYLE.cannon;
const FR = FX_STYLE.frost;
const SN = FX_STYLE.sniper;
const BO = FX_STYLE.bolt;
const EX = FX_STYLE.explosion;
const HI = FX_STYLE.hit;
const SM = FX_STYLE.smoke;
const GLOW_STEPS = [1, EX.glowCore];
const BOLT_LAYERS = [[BO.outer, BO.outerWidth], [BO.mid, BO.midWidth], [BO.core, BO.coreWidth]];
const CO = FX_STYLE.coin;
const CT = FX_STYLE.coinText;
const OUT_WIDTH = STYLE.outlineWidth;
const OUT_ICE = outlineOf(HI.ice);
const COIN_EDGE = outlineOf(CO.dark);
const CHILL = FX_STYLE.chill;
const DG = FX_STYLE.dodge;
const MT = FX_STYLE.meteor;
const OUT_ROCK = outlineOf(MT.rock);
const OUT_CHUNK = outlineOf(MT.chunk);
const OUT_CRATER = outlineOf(MT.pit);
const MT_DIR = Math.hypot(MT.fromX, MT.fromY); // Länge des Anflugwegs in px
const meteorScratch = { phase: 'none', u: 0 };

// Pro Frame einmal aufrufen (vor dem Zeichnen): leitet Partikel aus dem Zustand ab.
// reducedMotion: prefers-reduced-motion (aus main.js ueber ui), schaltet das Boss-Wackeln aus.
export function updateFx(state, reducedMotion = false) {
  syncFx(fx, state, reducedMotion);
}

// Bodenschlag beim Boss-Auftritt (B-067): goldener Ring am Boden, waechst und wird duenner.
// Bei reduzierter Bewegung waechst er nicht, sondern wird nur duenner.
// Dazu der Staub (B-095, eigene Partikelart, unter den Gegnern).
export function drawBossEntry(ctx) {
  drawBossDust(ctx);
  const u = bossEntryProgress(fx.lastTime, fx.entryStart);
  if (u < 0) return;
  const k = fx.entryReduced ? 1 : BOSS_ENTRY.ringStart + (BOSS_ENTRY.ringRadius - BOSS_ENTRY.ringStart) * (1 - (1 - u) * (1 - u));
  ctx.save();
  ctx.strokeStyle = BOSS_ENTRY.ringColor;
  ctx.lineWidth = BOSS_ENTRY.ringWidth * (1 - u); // verblasst ueber die Linienbreite (kein globalAlpha noetig)
  ctx.beginPath();
  ctx.ellipse(fx.entryX, fx.entryY + fx.entryR * BOSS_ENTRY.ringDrop, fx.entryR * k, fx.entryR * k * BOSS_ENTRY.ringFlat, 0, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

// Staubwoelkchen: Deckkraft steckt in der Farbe, sie vergehen ueber die Groesse (kein globalAlpha noetig).
function drawBossDust(ctx) {
  let any = false;
  for (let i = 0; i < MAX_PARTICLES; i++) if (fx.pkind[i] === K_DUST) { any = true; break; }
  if (!any) return;
  ctx.save();
  ctx.fillStyle = BOSS_ENTRY.dustColor;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (fx.pkind[i] !== K_DUST) continue;
    const u = fx.page[i] / fx.plife[i];
    const r = fx.psize[i] * (1 + u * BOSS_ENTRY.dustGrow) * (1 - u);
    if (!(r > 0)) continue;
    ctx.beginPath();
    ctx.arc(fx.px[i], fx.py[i], r, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}

// Shake-Versatz fuer die Welt-Zeichnung (nur Zeichnung, die Eingabe in main.js bleibt unberuehrt).
export function shakeX() {
  return shakeOffset(fx.lastTime, fx.shakeStart, fx.shakeStrength, 0);
}
export function shakeY() {
  return shakeOffset(fx.lastTime, fx.shakeStart, fx.shakeStrength, 1);
}

// Zeichnet ein Projektil im Flat-Pop-Stil (B-068). Rueckgabe: true, wenn gezeichnet; false bei
// unbekanntem Typ oder nicht verfolgtem Projektil (dann zeichnet render.js einen einfachen Kreis).
export function drawProjectileFx(ctx, p) {
  const s = fx.slotOf.get(p);
  if (s === undefined || !fx.sActive[s]) return false;
  const type = fx.sType[s];
  if (type !== T_ARROW && type !== T_CANNON && type !== T_FROST && type !== T_SNIPER) return false;
  const x = fx.sX[s];
  const y = fx.sY[s];
  const dx = fx.sDx[s];
  const dy = fx.sDy[s];
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (type === T_ARROW) drawArrow(ctx, x, y, dx, dy);
  else if (type === T_CANNON) drawCannonball(ctx, x, y, dx, dy);
  else if (type === T_FROST) drawFrostShard(ctx, x, y, dx, dy, fx.lastTime);
  else drawSniperShot(ctx, x, y, dx, dy);
  ctx.globalAlpha = 1;
  ctx.restore();
  return true;
}

// Pfeil (Z.123): Schaft mit dunkler Kontur, Steinspitze, rote Federn. Spitze zeigt in Flugrichtung.
function drawArrow(ctx, x, y, dx, dy) {
  ctx.translate(x, y);
  ctx.transform(dx, dy, -dy, dx, 0, 0); // lokale x-Achse = Flugrichtung
  ctx.scale(U, U);
  ctx.beginPath();
  ctx.moveTo(-A.back, 0);
  ctx.lineTo(A.front, 0);
  ctx.strokeStyle = A.ink;
  ctx.lineWidth = A.inkWidth;
  ctx.stroke();
  ctx.strokeStyle = A.shaft;
  ctx.lineWidth = A.shaftWidth;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(A.tip, 0);
  ctx.lineTo(A.tip - A.headLen, -A.headHalf);
  ctx.lineTo(A.tip - A.headLen, A.headHalf);
  ctx.closePath();
  ctx.fillStyle = A.head;
  ctx.fill();
  ctx.strokeStyle = A.ink;
  ctx.lineWidth = A.headLine;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-A.back, 0);
  ctx.lineTo(-A.back - A.fletchLen, -A.fletchLen);
  ctx.moveTo(-A.back, 0);
  ctx.lineTo(-A.back - A.fletchLen, A.fletchLen);
  ctx.strokeStyle = A.fletch;
  ctx.lineWidth = A.fletchWidth;
  ctx.stroke();
}

// Kanonenkugel (Z.130): gepunktete Flugspur, dunkle Kugel mit Kontur
function drawCannonball(ctx, x, y, dx, dy) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * CN.trailLen * U, y - dy * CN.trailLen * U);
  ctx.strokeStyle = CN.trail;
  ctx.lineWidth = CN.trailWidth * U;
  ctx.setLineDash(CN.dash);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, CN.radius * U, 0, TWO_PI);
  ctx.fillStyle = CN.color;
  ctx.fill();
  ctx.strokeStyle = CN.ink;
  ctx.lineWidth = CN.line * U;
  ctx.stroke();
}

// Frost (Z.137–141): hellblauer Strahl mit gestricheltem Kern, vorn ein drehender Eisstern
function drawFrostShard(ctx, x, y, dx, dy, time) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * FR.beamLen * U, y - dy * FR.beamLen * U);
  ctx.strokeStyle = FR.beam;
  ctx.lineWidth = FR.beamWidth * U;
  ctx.stroke();
  ctx.strokeStyle = FR.core;
  ctx.lineWidth = FR.coreWidth * U;
  ctx.setLineDash(FR.dash);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  starPath(ctx, x, y, FR.r1 * U, FR.r2 * U, FR.points, (Number.isFinite(time) ? time : 0) * FR.spin);
  ctx.fillStyle = FR.color;
  ctx.fill();
  ctx.strokeStyle = FR.ink;
  ctx.lineWidth = FR.line * U;
  ctx.stroke();
}

// Scharfschuss (Z.125): gelbe gestrichelte Spur hinter einer kleinen Kugel
function drawSniperShot(ctx, x, y, dx, dy) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * SN.beamLen * U, y - dy * SN.beamLen * U);
  ctx.strokeStyle = SN.beam;
  ctx.lineWidth = SN.beamWidth * U;
  ctx.setLineDash(SN.dash);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, SN.bulletR * U, 0, TWO_PI);
  ctx.fillStyle = SN.bullet;
  ctx.fill();
  ctx.strokeStyle = SN.ink;
  ctx.lineWidth = SN.line * U;
  ctx.stroke();
}

// Partikel in zwei Schichten: under = true zeichnet Rauch (unter den Gegnern), sonst Funken, Eis,
// Treffer-Blitz und Muenzen (ueber den Gegnern, klein gehalten, damit sie keine Figur verdecken).
export function drawParticles(ctx, under = false) {
  let any = false;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const k = fx.pkind[i];
    if (k !== K_NONE && k !== K_DUST && (k === K_SMOKE) === under) { any = true; break; }
  }
  if (!any) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const k = fx.pkind[i];
    if (k === K_NONE || k === K_DUST || (k === K_SMOKE) !== under) continue;
    const u = fx.page[i] / fx.plife[i]; // 0 neu .. 1 fast weg
    const x = fx.px[i];
    const y = fx.py[i];
    const size = fx.psize[i];
    if (k === K_SMOKE) {
      ctx.globalAlpha = SM.alpha * (1 - u);
      ctx.fillStyle = SM.color;
      ctx.beginPath();
      ctx.arc(x, y, size * (1 + u * SM.grow), 0, TWO_PI);
      ctx.fill();
    } else if (k === K_ICE) {
      // kleiner Eisstern mit Kontur (Stil 1, wie der Frost-Treffer Z.140)
      const r = HI.iceSize * (size > 1 ? size / HI.iceBase : 1) * HI.iceStretch;
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = HI.ice;
      ctx.strokeStyle = OUT_ICE;
      ctx.lineWidth = HI.iceLine;
      ctx.beginPath();
      starPath(ctx, x, y, r * 2, r * 0.8, 6, u * 2);
      ctx.fill();
      ctx.stroke();
    } else if (k === K_SPARK) {
      ctx.globalAlpha = 1 - u;
      ctx.strokeStyle = HI.spark;
      ctx.lineWidth = HI.sparkWidth;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - fx.pvx[i] * HI.sparkTail, y - fx.pvy[i] * HI.sparkTail);
      ctx.stroke();
    } else if (k === K_FLASH) {
      // kleiner Vierzack-Stern statt grosser Scheibe
      const r = HI.flashSize * (HI.flashStart + u * HI.flashGrow);
      const q = r * HI.flashWaist;
      ctx.globalAlpha = HI.flashAlpha * (1 - u);
      ctx.fillStyle = HI.flash;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + q, y - q);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x + q, y + q);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - q, y + q);
      ctx.lineTo(x - r, y);
      ctx.lineTo(x - q, y - q);
      ctx.closePath();
      ctx.fill();
    } else if (k === K_ROCK) {
      // Gesteinsbrocken: kleine Raute mit Kontur, verblasst zum Ende
      ctx.globalAlpha = u < 0.6 ? 1 : (1 - u) / 0.4;
      ctx.fillStyle = MT.chunk;
      ctx.strokeStyle = OUT_CHUNK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size * 1.1, y);
      ctx.lineTo(x + size * 0.3, y + size);
      ctx.lineTo(x - size, y + size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (k === K_SUMMON) {
      // B-127: grüner Lichtfunke der Beschwörung, schrumpft und verblasst
      ctx.globalAlpha = FX_STYLE.summon.alpha * (1 - u);
      ctx.fillStyle = FX_STYLE.summon.color;
      ctx.beginPath();
      ctx.arc(x, y, size * (1 - u * 0.5), 0, TWO_PI);
      ctx.fill();
    } else if (k === K_COIN) {
      const cy = y + coinHop(u, fx.reduced);
      const w = size * coinSpin(u, fx.reduced);
      ctx.globalAlpha = u < CO.fadeFrom ? 1 : 1 - (u - CO.fadeFrom) / (1 - CO.fadeFrom);
      ctx.fillStyle = CO.dark;
      ctx.strokeStyle = COIN_EDGE;
      ctx.lineWidth = CO.edgeWidth;
      ctx.beginPath();
      ctx.ellipse(x, cy, w, size, 0, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = CO.color;
      ctx.beginPath();
      ctx.ellipse(x, cy, w * CO.inner, size * CO.inner, 0, 0, TWO_PI);
      ctx.fill();
      if (w > size * CO.shineMin) {
        ctx.fillStyle = CO.shine;
        ctx.beginPath();
        ctx.arc(x - w * CO.shineOffset, cy - size * CO.shineOffset, size * CO.shineR, 0, TWO_PI);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Effekte aus dem Spielzustand, die unter den Figuren liegen: Lichthof und Rauch der Explosion (Z.131f)
// B-212: Friedhof leuchtet beim Skelett-Trupp auf: Schein (ohne Verlauf, zwei Kreise) steigt schnell an und klingt aus
// (ease-out), dazu kurz ein Rand in Laternenfarbe. Bei reduzierter Bewegung statisch an, ohne Puls.
export function graveyardGlowAlpha(e, reduced = false) {
  const G = FX_STYLE.graveyardGlow;
  if (!(e.ttl > 0) || !(e.max > 0)) return 0;
  if (reduced) return G.alpha;
  const u = 1 - e.ttl / e.max; // 0..1
  const up = 0.15;
  return u < up ? G.alpha * (u / up) : G.alpha * (1 - (u - up) / (1 - up)) ** 2;
}
export function drawGraveyardGlow(ctx, e, reduced = false) {
  const G = FX_STYLE.graveyardGlow;
  const a = graveyardGlowAlpha(e, reduced);
  if (!(a > 0) || !Number.isFinite(e.x) || !Number.isFinite(e.y)) return;
  ctx.save();
  ctx.fillStyle = G.color;
  for (const k of [1, 0.55]) {
    ctx.globalAlpha = a * (k === 1 ? 0.5 : 1);
    ctx.beginPath();
    ctx.arc(e.x, e.y, G.radius * TILE * k, 0, TWO_PI);
    ctx.fill();
  }
  if (Array.isArray(e.area)) {
    const [x0, y0, x1, y1] = e.area;
    ctx.globalAlpha = a / G.alpha;
    ctx.strokeStyle = G.color;
    ctx.lineWidth = G.edgeWidth;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawEffectUnder(ctx, e, reduced = false) {
  if (e && e.kind === 'summon') { drawSummonSpot(ctx, e); return; } // B-180: Bodenfleck der Beschwörung
  if (e && e.kind === 'graveyardGlow') { drawGraveyardGlow(ctx, e, reduced); return; }
  if (!e || e.kind !== 'explosion') return;
  if (e.meteor) { drawMeteorUnder(ctx, e); return; }
  const a = e.ttl / e.max;
  const k = explosionScale(a);
  if (!(k > 0) || !Number.isFinite(e.x) || !Number.isFinite(e.y)) return;
  ctx.save();
  ctx.globalAlpha = a > 1 ? 1 : a;
  ctx.fillStyle = EX.fill;
  for (const f of GLOW_STEPS) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, EX.glowR * U * k * f, 0, TWO_PI);
    ctx.fill();
  }
  ctx.strokeStyle = EX.smokeInk;
  ctx.lineWidth = EX.smokeLine * U;
  for (const [color, ox, oy, r] of EX.smoke) {
    ctx.beginPath();
    ctx.arc(e.x + ox * U * k, e.y + oy * U * k, r * U * k, 0, TWO_PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Größe der Explosion über die Zeit: schnell auf, dann langsam kleiner (a = Restzeit-Anteil 1..0)
function explosionScale(a) {
  if (!(a > 0)) return 0;
  const u = 1 - Math.min(1, a);
  return u < EX.grow ? 0.4 + 0.6 * (u / EX.grow) : 1 - EX.shrink * ((u - EX.grow) / (1 - EX.grow));
}

// Explosionssterne (Z.133–135) über den Figuren
function drawExplosionStars(ctx, e, a) {
  const k = explosionScale(a);
  if (!(k > 0) || !Number.isFinite(e.x) || !Number.isFinite(e.y)) return;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = EX.ink;
  for (const [r1, r2, n, rot, color, w] of EX.stars) {
    ctx.beginPath();
    starPath(ctx, e.x, e.y, r1 * U * k, r2 * U * k, n, rot);
    ctx.fillStyle = color;
    ctx.fill();
    if (w) { ctx.lineWidth = w * U; ctx.stroke(); }
  }
  ctx.restore();
}

// Effekte ueber den Gegnern: Frost-Schimmer, Blitz, Muenz-Text. reducedMotion: Text steigt nicht.
export function drawEffectOver(ctx, e, reducedMotion = false) {
  if (!e) return;
  const a = e.ttl / e.max;
  if (e.kind === 'chill') {
    ctx.fillStyle = `rgba(${CHILL.rgb},${CHILL.alpha * a})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else if (e.kind === 'bolt') {
    drawBolt(ctx, e, a);
  } else if (e.kind === 'dodge') {
    drawDodge(ctx, e, reducedMotion);
  } else if (e.kind === 'explosion' && e.meteor) {
    drawMeteorOver(ctx, e);
  } else if (e.kind === 'explosion') {
    drawExplosionStars(ctx, e, a);
  } else if (e.kind === 'steam') {
    drawSteam(ctx, e, reducedMotion); // B-178: Frost trifft Glutling
  } else if (e.kind === 'shellChip') {
    drawShellBreak(ctx, e, reducedMotion, FX_STYLE.shellChip); // B-178: eine Schicht platzt ab
  } else if (e.kind === 'shellBreak') {
    drawShellBreak(ctx, e, reducedMotion);
  } else if (e.kind === 'eliteBreak') {
    drawShellBreak(ctx, e, reducedMotion, FX_STYLE.eliteBreak); // B-179: Elite-Schild bricht
  } else if (e.kind === 'eliteGone') {
    drawEliteGone(ctx, e, reducedMotion); // B-179: Abzeichen fliegt weg
  } else if (e.kind === 'phase2') {
    drawNecroPhase(ctx, e, reducedMotion); // B-180: Druckwelle und „Zweite Phase!“
  } else if (e.kind === 'summon') {
    drawSummonSkull(ctx, e, reducedMotion);
  } else if (e.kind === 'coin') {
    const ty = e.y - CT.lift + (reducedMotion ? 0 : a * CT.rise);
    ctx.save();
    ctx.globalAlpha = a > 0 ? (a < 1 ? a : 1) : 0;
    ctx.font = CT.font;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = CT.outlineWidth;
    ctx.strokeStyle = CT.outline;
    ctx.strokeText(e.text, e.x, ty);
    ctx.fillStyle = CT.color;
    ctx.fillText(e.text, e.x, ty);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// Alter eines Effekts in Sekunden (0 bei kaputten Werten)
function ageOf(e) {
  const t = e.max - e.ttl;
  return Number.isFinite(t) && t > 0 ? t : 0;
}
const clamp01 = (v) => (v > 0 ? (v < 1 ? v : 1) : 0);

// B-168: Irrlicht weicht aus. Nachbild der Figur (verblasst), kurzer weißer Blitz, Text "Verfehlt" steigt auf.
// reducedMotion: kein Nachbild, kein Blitz, Text bleibt am Ort.
function drawDodge(ctx, e, reducedMotion) {
  const age = ageOf(e);
  const foot = e.y + FIGURE_STYLE.enemyFoot * U;
  const f = enemyFigure('wisp', false);
  ctx.save();
  if (!reducedMotion && age < DG.ghostLife) {
    ctx.save();
    ctx.globalAlpha = DG.ghostAlpha * (1 - age / DG.ghostLife);
    // B-178: seitliches Zucken (hin und zurück in dodgeTime), Richtung aus dem Effekt
    const z = age < DG.dodgeTime ? Math.sin(Math.PI * age / DG.dodgeTime) * DG.dodgeDx * U : 0;
    const zx = Number.isFinite(e.dx) ? e.dx : 0, zy = Number.isFinite(e.dy) ? e.dy : 0;
    ctx.translate(e.x + zx * z, foot + zy * z);
    ctx.scale(U, U);
    ctx.translate(-f.w / 2, -f.h);
    drawElements(ctx, f.els);
    ctx.restore();
  }
  if (!reducedMotion && age < DG.flashLife) {
    ctx.globalAlpha = DG.flashAlpha * (1 - age / DG.flashLife);
    ctx.fillStyle = DG.flash;
    ctx.beginPath();
    ctx.arc(e.x, foot - f.h * U * 0.6, DG.flashR * U, 0, TWO_PI);
    ctx.fill();
  }
  const life = e.max > 0 ? e.max : DG.life;
  const u = clamp01(age / life);
  const ty = foot - f.h * U - DG.missLift - (reducedMotion ? 0 : u * DG.missRise);
  ctx.globalAlpha = 1 - u * u;
  ctx.font = DG.missFont;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = DG.missOutlineWidth;
  ctx.strokeStyle = DG.missOutline;
  ctx.strokeText(DG.missText, e.x, ty);
  ctx.fillStyle = DG.missColor;
  ctx.fillText(DG.missText, e.x, ty);
  ctx.restore();
}

// B-178: Dampfwölkchen beim Frost-Treffer auf einen Glutling (Werte aus ENEMY_STYLE.ember). reducedMotion: am Ort.
function drawSteam(ctx, e, reducedMotion) {
  const c = ENEMY_STYLE.ember;
  const life = e.max > 0 ? e.max : FX_STYLE.steam.life;
  const u = clamp01(ageOf(e) / life);
  const foot = e.y + FIGURE_STYLE.enemyFoot * U;
  ctx.save();
  ctx.fillStyle = `rgba(${c.steamRgb},${(c.steamAlpha * (1 - u)).toFixed(3)})`;
  ctx.strokeStyle = c.steamInk;
  ctx.lineWidth = c.steamLine;
  for (const [dx, dy] of c.steamPuffs) {
    const r = (c.steamR[0] + (c.steamR[1] - c.steamR[0]) * u) * U;
    ctx.beginPath();
    ctx.arc(e.x + dx * U, foot + (dy - (reducedMotion ? 0 : u * c.steamRise)) * U, r, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// B-169: letzte Schicht der Schale bricht. Dreieck-Splitter fliegen nach oben weg und fallen (deterministisch je Index),
// dazu ein heller Ring. reducedMotion: Splitter bleiben am Ort und verblassen in reducedLife, Ring wächst nicht.
function drawShellBreak(ctx, e, reducedMotion, c = FX_STYLE.shellBreak) {
  const age = ageOf(e);
  const ox = e.x, oy = e.y + (FIGURE_STYLE.enemyFoot + c.originDy) * U;
  const life = reducedMotion ? c.reducedLife : c.life;
  const u = clamp01(age / life);
  ctx.save();
  if (age < c.flashLife) {
    const w = reducedMotion ? 1 : age / c.flashLife;
    ctx.globalAlpha = 1 - age / c.flashLife;
    ctx.strokeStyle = c.flash;
    ctx.lineWidth = c.flashLine;
    ctx.beginPath();
    ctx.arc(ox, oy, (c.flashR[0] + (c.flashR[1] - c.flashR[0]) * w) * U, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.globalAlpha = u < c.fadeFrom ? 1 : 1 - (u - c.fadeFrom) / (1 - c.fadeFrom);
  ctx.strokeStyle = c.shardInk;
  ctx.lineWidth = c.shardLine;
  ctx.lineJoin = 'round';
  const t = reducedMotion ? 0 : age;
  for (let i = 0; i < c.shards; i++) {
    const q = c.shards > 1 ? i / (c.shards - 1) : 0.5;
    const ang = (c.shardAngle[0] + (c.shardAngle[1] - c.shardAngle[0]) * q) * Math.PI / 180;
    const sp = c.shardSpeed[i % 2] ?? c.shardSpeed[0];
    const x = ox + Math.cos(ang) * sp * t;
    const y = oy + Math.sin(ang) * sp * t + 0.5 * c.gravity * t * t;
    const r = c.shardSize[i % 2] * U * 0.6;
    const rot = i * 2.1 + c.spin * t;
    ctx.fillStyle = c.shardColors[i % c.shardColors.length];
    ctx.beginPath();
    for (let j = 0; j < 3; j++) {
      const a = rot + j * TWO_PI / 3;
      if (j === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// Kettenblitz (Z.143–145): Zickzack Turm -> Ziel 1 -> Ziel 2 ..., blauer Schein, dunkle Kontur, heller Kern.
// Die Zacken springen mit der Restzeit hin und her (flackert), deterministisch.
function drawBolt(ctx, e, a) {
  const pts = e.points;
  if (!Array.isArray(pts) || pts.length < 2) return;
  const sign = Math.floor((e.ttl || 0) * BO.flicker) % 2 ? -1 : 1;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i];
    const n = Math.max(2, Math.round(Math.hypot(q.x - p.x, q.y - p.y) / (BO.step * U)));
    zigPath(ctx, p.x, p.y, q.x, q.y, n, BO.amp * U, i === 1, sign);
  }
  // B-174 Sturmspule: dicker und je Segment ein Ast
  const big = e.master ? MASTER_FX.bolt3.width : 1;
  if (e.master) {
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i];
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, dx = q.x - p.x, dy = q.y - p.y;
      const s = MASTER_FX.bolt3.branch * sign * (i % 2 ? 1 : -1);
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + dx * 0.35 - dy * s, my + dy * 0.35 + dx * s);
    }
  }
  ctx.globalAlpha = a > 1 ? 1 : a > 0 ? a : 0;
  for (const [color, w] of BOLT_LAYERS) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w * U * big;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---------- Meteor (B-112) ----------
// Ablauf aus meteorPhase (Spielzeit): Anflug (Schatten und Zielring am Boden, Gestein mit Feuerschweif),
// Einschlag (Blitz, Feuerball, Schockwellen-Ring bis zum Radius, Partikel aus fx-system), Krater verblasst.
// Unter den Gegnern: Schatten, Zielring, Brandfleck, Krater, Schockwelle. Darüber: Gestein, Blitz, Feuerball.
const easeOut = (t) => 1 - (1 - t) * (1 - t);

function drawMeteorUnder(ctx, e) {
  const p = meteorPhase(e, meteorScratch);
  const r = Number.isFinite(e.r) && e.r > 0 ? e.r : 0;
  if (p.phase === 'none' || !r) return;
  ctx.save();
  if (p.phase === 'flight') {
    // Schatten wächst, Zielring zieht sich leicht zusammen
    const k = MT.shadowFrom + (MT.shadowTo - MT.shadowFrom) * p.u;
    ctx.globalAlpha = MT.shadowAlpha * (0.4 + 0.6 * p.u);
    ctx.fillStyle = MT.shadow;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, r * k, r * k * MT.shadowFlat, 0, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = MT.targetAlpha;
    ctx.strokeStyle = MT.target;
    ctx.lineWidth = MT.targetWidth;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r * (1.08 - 0.08 * p.u), 0, TWO_PI);
    ctx.stroke();
  } else {
    // Krater und Brandfleck: ab dem Einschlag voll, in der Kraterphase verblassend
    const fade = p.phase === 'crater' ? 1 - p.u : 1;
    ctx.globalAlpha = MT.scorchAlpha * fade;
    ctx.fillStyle = MT.scorch;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, r * MT.scorchR, r * MT.scorchR * MT.craterFlat, 0, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = fade;
    const cr = r * MT.craterR;
    ctx.fillStyle = MT.pit;
    ctx.strokeStyle = MT.craterRim;
    ctx.lineWidth = MT.rimWidth;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, cr, cr * MT.craterFlat, 0, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = OUT_CRATER;
    ctx.lineWidth = OUT_WIDTH;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, cr + MT.rimWidth / 2, (cr + MT.rimWidth / 2) * MT.craterFlat, 0, 0, TWO_PI);
    ctx.stroke();
    // aufgeworfene Steine am Kraterrand
    ctx.fillStyle = MT.craterRim;
    ctx.strokeStyle = OUT_CRATER;
    ctx.lineWidth = 1;
    for (let i = 0; i < MT.rimStones; i++) {
      const a = (i / MT.rimStones) * TWO_PI + 0.3;
      const d = cr + MT.rimWidth * (i % 2 ? 1.6 : 0.8);
      const sr = MT.rimStoneR * (i % 3 ? 1 : 0.7);
      ctx.beginPath();
      ctx.arc(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d * MT.craterFlat, sr, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
    }
    // Glutpunkte in der Mulde (kurz nach dem Einschlag)
    const glow = p.phase === 'blast' ? 1 : 1 - p.u / MT.emberEnd;
    if (glow > 0) {
      ctx.globalAlpha = glow;
      ctx.fillStyle = MT.ember;
      for (let i = 0; i < MT.embers; i++) {
        const a = (i / MT.embers) * TWO_PI + 0.6;
        const d = cr * (0.35 + 0.25 * (i % 2));
        ctx.beginPath();
        ctx.arc(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d * MT.craterFlat, MT.emberR, 0, TWO_PI);
        ctx.fill();
      }
    }
    // Schockwelle: heller Ring mit orangem Rand, wächst bis zum Radius (reduzierte Bewegung: steht, wird dünner)
    if (p.phase === 'blast' && p.u < MT.waveEnd) {
      const w = p.u / MT.waveEnd;
      const rr = r * (fx.reduced ? 1 : MT.waveFrom + (1 - MT.waveFrom) * easeOut(w));
      ctx.globalAlpha = 1 - w * w;
      ctx.strokeStyle = MT.waveEdge;
      ctx.lineWidth = MT.waveWidth * (1 - w) + MT.waveEdgeWidth;
      ctx.beginPath();
      ctx.arc(e.x, e.y, rr, 0, TWO_PI);
      ctx.stroke();
      ctx.strokeStyle = MT.wave;
      ctx.lineWidth = MT.waveWidth * (1 - w);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawMeteorOver(ctx, e) {
  const p = meteorPhase(e, meteorScratch);
  const r = Number.isFinite(e.r) && e.r > 0 ? e.r : 0;
  if (!r || (p.phase !== 'flight' && p.phase !== 'blast')) return;
  ctx.save();
  if (p.phase === 'flight') {
    // Gestein fliegt beschleunigt von rechts oben ins Ziel, Schweif zeigt zurück zum Start
    // Ziel nahe am oberen Rand: Anflug kürzer, damit das Gestein sichtbar bleibt
    const room = Math.min(1, Math.max(MT.fromMin, (e.y - MT.rockR) / -MT.fromY));
    const k = (1 - p.u * p.u) * room;
    const x = e.x + MT.fromX * k;
    const y = e.y + MT.fromY * k;
    const dx = MT.fromX / MT_DIR;
    const dy = MT.fromY / MT_DIR;
    for (let i = MT.tailPoints - 1; i >= 0; i--) {
      const t = 1 - i / MT.tailPoints; // 1 vorn .. klein hinten
      const d = (i + 1) * MT.tailSpacing;
      const size = MT.tailSize * (MT.tailMin + (1 - MT.tailMin) * t);
      ctx.globalAlpha = MT.tailAlpha * t;
      ctx.fillStyle = MT.tail[i < 2 ? 2 : i < 4 ? 1 : 0];
      ctx.beginPath();
      ctx.arc(x + dx * d, y + dy * d, size, 0, TWO_PI);
      ctx.fill();
    }
    ctx.globalAlpha = MT.glowAlpha;
    ctx.fillStyle = MT.glow;
    ctx.beginPath();
    ctx.arc(x, y, MT.glowR, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = MT.rock;
    ctx.strokeStyle = OUT_ROCK;
    ctx.lineWidth = OUT_WIDTH;
    ctx.beginPath();
    ctx.arc(x, y, MT.rockR, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = MT.rockShine;
    ctx.beginPath();
    ctx.arc(x - MT.rockR * 0.35, y + MT.rockR * 0.1, MT.rockR * 0.3, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = MT.tail[1]; // glühende Front zum Ziel hin
    ctx.beginPath();
    ctx.arc(x - dx * MT.rockR * 0.45, y - dy * MT.rockR * 0.45, MT.rockR * 0.45, 0, TWO_PI);
    ctx.fill();
  } else {
    // Feuerball in der Sternsprache der Explosion (Stil 1, Z.133–135): Lichthof, Rauchballen, drei Sterne;
    // schnell auf, dann schrumpfen und verblassen
    if (p.u < MT.fireEnd) {
      const grow = p.u < MT.fireGrow ? easeOut(p.u / MT.fireGrow) : 1;
      const fall = p.u < MT.fireStart ? 1 : 1 - (p.u - MT.fireStart) / (MT.fireEnd - MT.fireStart);
      const drift = 1 + MT.fireDrift * (1 - fall);
      const R = r * grow * (0.7 + 0.3 * fall); // Feuerball-Radius
      ctx.globalAlpha = fall > 0 ? fall : 0;
      ctx.fillStyle = EX.fill;
      ctx.beginPath();
      ctx.arc(e.x, e.y, R * 1.1, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = EX.smokeInk;
      ctx.lineWidth = EX.smokeLine * U;
      for (let i = 0; i < MT.firePuffs; i++) {
        const a = (i / MT.firePuffs) * TWO_PI + 0.4;
        const d = R * MT.puffDist * drift;
        ctx.fillStyle = EX.smoke[i % EX.smoke.length][0];
        ctx.beginPath();
        ctx.arc(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, R * MT.puffR * 0.45 * (i % 3 ? 1 : 0.8), 0, TWO_PI);
        ctx.fill();
        ctx.stroke();
      }
      ctx.lineJoin = 'round';
      ctx.strokeStyle = EX.ink;
      for (let layer = 0; layer < 3; layer++) {
        const R1 = R * MT.fireR[layer] * 1.3;
        const [, , n, rot, color, w] = EX.stars[layer];
        ctx.beginPath();
        starPath(ctx, e.x, e.y, R1, R1 * 0.5, n + 2, rot);
        ctx.fillStyle = color;
        ctx.fill();
        if (w) { ctx.lineWidth = w * U * 1.4; ctx.stroke(); }
      }
    }
    // Heller Blitz ganz am Anfang
    if (p.u < MT.flashEnd) {
      const f = p.u / MT.flashEnd;
      ctx.globalAlpha = 1 - f;
      ctx.fillStyle = MT.flash;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r * MT.flashR * (0.6 + 0.4 * f), 0, TWO_PI);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
