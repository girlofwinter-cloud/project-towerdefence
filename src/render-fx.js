// Zeichnung der Projektil-Schweife und Partikel. Keine Spiel-Logik; der Zustand kommt aus fx-system.js.
// Transparenz nur ueber globalAlpha innerhalb von save/restore. Keine Allokation pro Frame.
import {
  createFx, syncFx, shakeOffset, bossEntryProgress, MAX_PARTICLES,
  K_NONE, K_SMOKE, K_ICE, K_SPARK, K_FLASH, K_COIN, K_DUST, K_ROCK, K_SUMMON, coinHop, coinSpin, meteorPhase,
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
const MT = FX_STYLE.meteor;
const OUT_ROCK = outlineOf(MT.rock);
const OUT_CHUNK = outlineOf(MT.chunk);
const OUT_CRATER = outlineOf(MT.pit);
const OUT_FIRE = outlineOf(MT.fire[0]);
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

// Effekte aus dem Spielzustand, die unter den Gegnern liegen (Explosion als Bodenfleck mit Ring).
export function drawEffectUnder(ctx, e) {
  if (!e || e.kind !== 'explosion') return;
  if (e.meteor) { drawMeteorUnder(ctx, e); return; }
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
  } else if (e.kind === 'explosion' && e.meteor) {
    drawMeteorOver(ctx, e);
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
    // Feuerball als Puff-Wolke in drei Lagen (außen orange mit Kontur, Mitte gelb, Kern creme):
    // schnell auf, dann driften die Puffs nach außen, schrumpfen und verblassen
    if (p.u < MT.fireEnd) {
      const grow = p.u < MT.fireGrow ? easeOut(p.u / MT.fireGrow) : 1;
      const fall = p.u < MT.fireStart ? 1 : 1 - (p.u - MT.fireStart) / (MT.fireEnd - MT.fireStart);
      const drift = 1 + MT.fireDrift * (1 - fall);
      ctx.globalAlpha = fall > 0 ? fall : 0;
      for (let layer = -1; layer < 3; layer++) {
        const R = r * MT.fireR[layer < 0 ? 0 : layer] * grow * (0.7 + 0.3 * fall);
        const edge = layer < 0 ? MT.fireEdge : 0;
        ctx.fillStyle = layer < 0 ? OUT_FIRE : MT.fire[layer];
        ctx.beginPath();
        ctx.arc(e.x, e.y, R + edge, 0, TWO_PI);
        ctx.fill();
        if (layer === 2) continue; // Kern ohne Puffs
        for (let i = 0; i < MT.firePuffs; i++) {
          const a = (i / MT.firePuffs) * TWO_PI + 0.4;
          const d = R * MT.puffDist * drift * (i % 2 ? 1 : 0.8);
          const pr = R * MT.puffR * (i % 3 ? 1 : 0.8) + edge;
          ctx.beginPath();
          ctx.arc(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, pr, 0, TWO_PI);
          ctx.fill();
        }
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
