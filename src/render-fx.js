// Zeichnung der Projektil-Schweife und Partikel. Keine Spiel-Logik; der Zustand kommt aus fx-system.js.
// Transparenz nur ueber globalAlpha innerhalb von save/restore. Keine Allokation pro Frame.
import {
  createFx, syncFx, shakeOffset, bossEntryProgress, MAX_PARTICLES,
  K_NONE, K_SMOKE, K_ICE, K_SPARK, K_FLASH, K_COIN, K_DUST, coinHop, coinSpin,
  T_ARROW, T_CANNON, T_FROST, T_SNIPER,
} from './fx-system.js';
import { BOSS_ENTRY, FX_STYLE, STYLE, WIDTH, HEIGHT } from './config.js';
import { outlineOf } from './draw-utils.js';

// Ein gemeinsamer Partikelzustand fuer das Spiel (wird bei Neustart/Zeitsprung von syncFx geleert).
const fx = createFx();
export function getFx() {
  return fx;
}

// Rein visuelle Konstanten (Farben und Maße in config.js, FX_STYLE). Konturen einmal beim Laden ableiten.
const TWO_PI = Math.PI * 2;
const A = FX_STYLE.arrow;
const TR = FX_STYLE.trail;
const CN = FX_STYLE.cannon;
const FR = FX_STYLE.frost;
const SN = FX_STYLE.sniper;
const BO = FX_STYLE.bolt;
const EX = FX_STYLE.explosion;
const HI = FX_STYLE.hit;
const SM = FX_STYLE.smoke;
const CO = FX_STYLE.coin;
const CT = FX_STYLE.coinText;
const OUT_WIDTH = STYLE.outlineWidth;
const OUT_SHAFT = outlineOf(A.shaft);
const OUT_HEAD = outlineOf(A.head);
const OUT_FLETCH = outlineOf(A.fletch);
const OUT_CANNON = outlineOf(CN.color);
const OUT_FROST = outlineOf(FR.color);
const OUT_EXPLOSION = outlineOf(EX.ring);
const OUT_ICE = outlineOf(HI.ice);
const COIN_EDGE = outlineOf(CO.dark);
const CHILL = FX_STYLE.chill;

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
  else if (type === T_CANNON) drawCannonball(ctx, x, y);
  else if (type === T_FROST) drawFrostShard(ctx, x, y, dx, dy);
  else drawSniperShot(ctx, x, y, dx, dy);
  ctx.globalAlpha = 1;
  ctx.restore();
  return true;
}

// Pfeil: Schweif aus wenigen Punkten, Holzschaft, Steinspitze, rote Federn. Spitze zeigt in Flugrichtung.
function drawArrow(ctx, x, y, dx, dy) {
  const h = A.length / 2;
  ctx.fillStyle = TR.color;
  for (let i = 0; i < TR.points; i++) {
    const k = 1 - i / TR.points;
    const d = h + (i + 1) * TR.spacing;
    ctx.globalAlpha = TR.alpha * k;
    ctx.beginPath();
    ctx.arc(x - dx * d, y - dy * d, TR.size * (TR.minSize + (1 - TR.minSize) * k), 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.translate(x, y);
  ctx.transform(dx, dy, -dy, dx, 0, 0); // lokale x-Achse = Flugrichtung
  // Schaft mit Kontur
  ctx.strokeStyle = OUT_SHAFT;
  ctx.lineWidth = A.shaftWidth + OUT_WIDTH;
  ctx.beginPath();
  ctx.moveTo(-h, 0);
  ctx.lineTo(h - A.headLen, 0);
  ctx.stroke();
  ctx.strokeStyle = A.shaft;
  ctx.lineWidth = A.shaftWidth;
  ctx.stroke();
  ctx.lineWidth = OUT_WIDTH;
  // Federn
  ctx.fillStyle = A.fletch;
  ctx.strokeStyle = OUT_FLETCH;
  ctx.beginPath();
  ctx.moveTo(-h - A.fletchBack, -A.fletchHalf);
  ctx.lineTo(-h + A.fletchLen, 0);
  ctx.lineTo(-h - A.fletchBack, A.fletchHalf);
  ctx.lineTo(-h + A.fletchNotch, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Spitze
  ctx.fillStyle = A.head;
  ctx.strokeStyle = OUT_HEAD;
  ctx.beginPath();
  ctx.moveTo(h, 0);
  ctx.lineTo(h - A.headLen, -A.headHalf);
  ctx.lineTo(h - A.headLen, A.headHalf);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// Kanonenkugel: dunkle Kugel mit Kontur und einem Glanzpunkt oben links.
function drawCannonball(ctx, x, y) {
  ctx.fillStyle = CN.color;
  ctx.strokeStyle = OUT_CANNON;
  ctx.lineWidth = OUT_WIDTH;
  ctx.beginPath();
  ctx.arc(x, y, CN.radius, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CN.shine;
  ctx.beginPath();
  ctx.arc(x - CN.radius * CN.shineOffset, y - CN.radius * CN.shineOffset, CN.shineR, 0, TWO_PI);
  ctx.fill();
}

// Frostsplitter: Raute in Flugrichtung mit heller Oberseite und schwachem Leuchten.
function drawFrostShard(ctx, x, y, dx, dy) {
  ctx.globalAlpha = FR.glowAlpha;
  ctx.fillStyle = FR.glowColor;
  ctx.beginPath();
  ctx.arc(x, y, FR.glowR, 0, TWO_PI);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.translate(x, y);
  ctx.transform(dx, dy, -dy, dx, 0, 0);
  const back = -FR.len * FR.back;
  ctx.fillStyle = FR.color;
  ctx.beginPath();
  ctx.moveTo(FR.len, 0);
  ctx.lineTo(0, -FR.half);
  ctx.lineTo(back, 0);
  ctx.lineTo(0, FR.half);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = FR.light;
  ctx.beginPath();
  ctx.moveTo(FR.len, 0);
  ctx.lineTo(0, -FR.half);
  ctx.lineTo(back, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUT_FROST;
  ctx.lineWidth = OUT_WIDTH;
  ctx.beginPath();
  ctx.moveTo(FR.len, 0);
  ctx.lineTo(0, -FR.half);
  ctx.lineTo(back, 0);
  ctx.lineTo(0, FR.half);
  ctx.closePath();
  ctx.stroke();
}

// Scharfschuetze: heller Strahl hinter einer kleinen Kugel.
function drawSniperShot(ctx, x, y, dx, dy) {
  ctx.strokeStyle = SN.beam;
  ctx.globalAlpha = SN.beamAlpha;
  ctx.lineWidth = SN.beamWidth;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * SN.beamLen, y - dy * SN.beamLen);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = SN.core;
  ctx.lineWidth = SN.coreWidth;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * SN.beamLen * SN.inner, y - dy * SN.beamLen * SN.inner);
  ctx.stroke();
  ctx.fillStyle = SN.bullet;
  ctx.beginPath();
  ctx.arc(x, y, SN.bulletR, 0, TWO_PI);
  ctx.fill();
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
      // kleine Eisraute mit Kontur
      const r = HI.iceSize * (size > 1 ? size / HI.iceBase : 1);
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = HI.ice;
      ctx.strokeStyle = OUT_ICE;
      ctx.lineWidth = HI.iceLine;
      ctx.beginPath();
      ctx.moveTo(x, y - r * HI.iceStretch);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r * HI.iceStretch);
      ctx.lineTo(x - r, y);
      ctx.closePath();
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

// Effekte aus dem Spielzustand, die unter den Gegnern liegen (Explosion als Bodenfleck mit Ring).
export function drawEffectUnder(ctx, e) {
  if (!e || e.kind !== 'explosion') return;
  const a = e.ttl / e.max;
  const r = e.r * (EX.endScale - a * EX.grow);
  if (!(r > 0) || !(a > 0)) return;
  ctx.save();
  ctx.globalAlpha = EX.fillAlpha * a;
  ctx.fillStyle = EX.fill;
  ctx.beginPath();
  ctx.arc(e.x, e.y, r, 0, TWO_PI);
  ctx.fill();
  ctx.globalAlpha = a;
  ctx.strokeStyle = OUT_EXPLOSION;
  ctx.lineWidth = EX.ringWidth * a + OUT_WIDTH;
  ctx.stroke();
  ctx.strokeStyle = EX.ring;
  ctx.lineWidth = EX.ringWidth * a;
  ctx.stroke();
  ctx.globalAlpha = 1;
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

// Blitzlinie: Turm -> Ziel 1 -> Ziel 2 ..., blauer Rand, goldene Mitte, heller Kern; blendet aus.
function drawBolt(ctx, e, a) {
  const pts = e.points;
  if (!Array.isArray(pts) || pts.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  };
  ctx.globalAlpha = BO.outerAlpha * a;
  ctx.strokeStyle = BO.outer;
  ctx.lineWidth = BO.outerWidth;
  path();
  ctx.globalAlpha = a;
  ctx.strokeStyle = BO.mid;
  ctx.lineWidth = BO.midWidth;
  path();
  ctx.strokeStyle = BO.core;
  ctx.lineWidth = BO.coreWidth;
  path();
  ctx.globalAlpha = 1;
  ctx.restore();
}
