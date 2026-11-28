// Zeichnen der Gegner (nur Darstellung, keine Spiel-Logik).
// Stil 1 (G7): Figuren aus dem Entwurf (Goblin Z.110, Flitzer Z.112, Troll Z.113, eingefroren Z.111), übrige
// Typen auf Goblin-Basis (src/figures.js). Je Typ x Frost x Pixeldichte ein Sprite, pro Frame nur drawImage
// mit Wippen, Schwanken und Spiegelung. Fußpunkt FIGURE_STYLE.enemyFoot unter der Wegmitte. Lebensbalken nur bei Schaden.
import { ENEMY_TYPES, ENEMY_STYLE, FIGURE_STYLE as S, TILE, ABILITIES, isBoss, NM_ENEMY_STYLE, NM_STYLE_OF_MAP } from './config.js';
import { enemyFigure, shellStage, NECRO_VARIANT_P2 } from './figures.js';
import { drawNecroBack, drawNecroSkulls, drawNecroShield, necroGlowOverflow } from './render-necro.js';
import { drawEliteRing, drawEliteBadge, drawEliteTrait, eliteBadgeSize, eliteGlyph } from './render-elite.js';
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

// B-190: Albtraum-Stil der Gegner ('A' | 'B' | 'C') je Karte, wenn der Albtraum- oder Nacht-Look an ist, sonst null
export function nmEnemyStyle(mapId, on) {
  if (!on) return null;
  return Object.hasOwn(NM_STYLE_OF_MAP, mapId ?? '') ? NM_STYLE_OF_MAP[mapId] : 'A';
}

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
  drawElements(c, f.cloak ? f.front : f.els); // B-180: Schatten und Umhang zeichnet drawNecroBack live
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

// B-190 Bildrate: Albtraum-Figur als Randlicht (ungedreht, schneller Blit) + ein Sprite (Eis-Schein, Fußaura, Körper,
// Eis-Hülle). Das Randlicht liegt damit unter der Fußaura statt darüber (am Fuß Deckkraft ~0,1, kaum sichtbar).
// Nekromantin: Randlicht, Fußaura, Live-Teil ohne Randlicht, Rest. false = ohne Sprites, Aufrufer zeichnet wie bisher.
const unionBox = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
function drawNmSplit(ctx, f, key, scale, e, time, still) {
  const n = f.nm;
  const box = f.cloak ? n.underBox : unionBox(n.underBox, f.body);
  const sp = sprite(`enemy-nm:${key}`, box, scale, (c) => {
    if (f.glow) iceLayer(c, f, f.glow);
    drawElements(c, n.under);
    if (f.cloak) return;
    drawElements(c, n.els);
    if (f.shell) iceLayer(c, f, f.shell);
  });
  if (!sp) return false;
  drawRim(ctx, n.rim, key, scale);
  drawSprite(ctx, sp);
  if (!f.cloak) return true;
  drawNecroBack(ctx, n.live, e, time, still);
  const front = sprite(`enemy-nm-front:${key}`, f.body, scale, (c) => drawElements(c, f.front));
  if (front) drawSprite(ctx, front);
  return true;
}
// Randlicht (Kreis mit radialem Verlauf, dreh- und spiegelgleich): bei gleichmäßiger Skalierung ungedreht auf ganze
// Geräte-px (schneller Blit ohne Neuabtastung), sonst (Lodern des Glutlings) als Sprite in Figur-Koordinaten
function drawRim(ctx, rim, key, scale) {
  const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
  const sx = m ? Math.hypot(m.a, m.b) : 0, sy = m ? Math.hypot(m.c, m.d) : 0;
  if (!(sx > 0) || Math.abs(sx - sy) > 1e-3 * sx || Math.abs(m.a * m.c + m.b * m.d) > 1e-3 * sx * sx) {
    const sp = sprite(`enemy-nm-rim:${key}`, rim.box, scale, (c) => drawElements(c, [rim]));
    if (sp) drawSprite(ctx, sp);
    return;
  }
  const ds = Math.round(sx * 100) / 100;
  const [x0, y0, x1, y1] = rim.box;
  const sp = sprite(`enemy-nm-rimd:${rim.grad}:${x1 - x0}:${ds}`, rim.box, ds, (c) => drawElements(c, [rim]));
  if (!sp) return;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const X = m.a * cx + m.c * cy + m.e, Y = m.b * cx + m.d * cy + m.f;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(sp.canvas, Math.round(X - (cx - x0) * ds), Math.round(Y - (cy - y0) * ds));
  ctx.restore();
}

// Lebensbalken (Z.113) in Weltkoordinaten über der Figur: dunkle Kapsel, farbige Füllung
function capsule(ctx, x, y, w, h) {
  const r = h / 2;
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
}
function drawHpBar(ctx, e, f, k, rise = 0) {
  if (!(e.hp < e.maxHp)) return; // nur bei Schaden
  const frac = Math.max(0, Math.min(1, e.hp / e.maxHp));
  if (!Number.isFinite(frac)) return;
  const w = Math.max(HP.minW, HP.share * f.w) * k;
  const top = enemyFootY(e) + ((f.body || f.box)[1] - f.h) * k - rise; // B-190: ohne Randlicht (f.body) // oberster Punkt der Figur (rise: Wippen, Lodern)
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

const frac = (v) => v - Math.floor(v);
// fester Zufallswert in [0, 1) aus zwei Zahlen (Flackern), ohne Math.random
const hash01 = (a, b) => frac(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453);

// Zusatzbild: Fledermaus Flügel oben/unten (steht bei Frost und reduzierter Bewegung), Panzerkäfer nach Schichten
function variantOf(e, type, time, still) {
  if (type === 'beetle') return shellStage(e.shell);
  if (type === 'bat' && !still && Number.isFinite(time)) return Math.floor(Math.abs(time) * ENEMY_STYLE.bat.flapHz) % 2;
  if (type === 'necro' && e.phase === 2) return NECRO_VARIANT_P2; // B-180: Phase 2 leuchtet magenta
  return 0;
}

// path ist optional (state.path); ohne Weg blickt die Figur nach rechts. reduced: prefers-reduced-motion
// (Fledermaus/Irrlicht wippen nicht, Glutling lodert nicht und sprüht keine Funken, Flügelschlag steht).
// bossBar (B-180): die Boss-Leiste im HUD ist sichtbar, dann kein kleiner Lebensbalken über Bossen.
// nm (B-190): Albtraum-Stil der Karte (nmEnemyStyle), null = heutige Figuren
export function drawEnemy(ctx, e, time, path, reduced = false, bossBar = false, nm = null) {
  const known = Object.hasOwn(ENEMY_TYPES, e.type) && enemyFigure(e.type, false);
  const type = known ? e.type : 'grunt'; // unbekannte Typen: Goblin
  const slowed = type !== 'ember' && time < e.slowUntil; // Glutling: nie Eis-Fassung
  const still = slowed || reduced;
  const variant = variantOf(e, type, time, still);
  const style = nm && Object.hasOwn(NM_ENEMY_STYLE, nm) ? nm : null;
  const f = enemyFigure(type, slowed, variant, style);
  const k = U * (f.big ? S[f.big] : 1);
  const angle = facingFor(path, e.dist);
  const flip = facingFlip(angle);
  const phase = walkPhase(time, e.id, animSpeedFactor(e, time));
  const s = Math.sin(phase);
  const dpr = dprOf(ctx);
  const c = ENEMY_STYLE[type];
  const floats = type === 'bat' || type === 'wisp' || type === 'ember'; // eigenes Wippen/Lodern statt Gehen
  const wave = (hz) => (still || !Number.isFinite(time) ? 0 : Math.sin(TWO_PI * hz * time + (e.id || 0)));
  const lift = type === 'bat' || type === 'wisp' ? c.hover * wave(c.hoverHz) : 0;
  const stretch = type === 'ember' && !still ? 1 + c.flameStretch * (0.5 + 0.5 * wave(c.flameHz)) : 1;
  const sway = slowed || floats ? 0 : s * S.sway;
  const bob = slowed || floats ? 0 : Math.abs(s) * S.bob;

  const elite = e.elite && !isBoss(e) ? e.elite : null; // B-179: Bosse tragen nie ein Abzeichen
  if (elite) drawEliteRing(ctx, e, enemyFootY(e), f.w * k, time, still, style ? NM_ENEMY_STYLE[style].eye : null);
  if (type === 'bat') drawBatShadow(ctx, e, flip, lift);
  if (type === 'wisp' && !slowed) drawWispGlow(ctx, e, time, reduced, lift);
  if (type === 'necro') drawNecroSkulls(ctx, e, time, reduced, false); // hintere Schädel (Phase 2)

  ctx.save();
  ctx.translate(e.x, enemyFootY(e));
  ctx.scale(flip, 1);
  ctx.rotate(facingTilt(angle) * S.tilt + sway);
  ctx.scale(k, k * stretch);
  ctx.translate(-f.w / 2, -f.h - bob - lift);
  const key = `${type}:${variant}:${slowed ? 1 : 0}:${style || ''}:${dpr}`;
  if (!(f.nm && drawNmSplit(ctx, f, key, k * dpr, e, time, still))) {
    if (f.cloak) drawNecroBack(ctx, f, e, time, still); // B-180: Schatten, Kugelschein und Umhang live, Rest als Sprite
    const sp = sprite(`enemy:${key}`, f.box, k * dpr, (cx) => paintFigure(cx, f));
    if (sp) drawSprite(ctx, sp);
    else paintFigure(ctx, f);
  }
  ctx.restore();
  if (type === 'necro') {
    drawNecroSkulls(ctx, e, time, reduced, true);
    drawNecroShield(ctx, e, time);
  }

  if (type === 'ember') {
    if (!reduced) drawEmberSparks(ctx, e, time);
    drawEmberSteam(ctx, e, time, reduced);
  }
  drawWardBubble(ctx, e, time);
  const rise = Math.max(0, lift) * k + (stretch - 1) * (f.h - f.box[1]) * k + (f.cloak ? necroGlowOverflow(f) * k : 0);
  if (!(bossBar && isBoss(e))) drawHpBar(ctx, e, f, k, rise);
  if (elite) {
    const top = enemyFootY(e) - (f.h + lift) * k;
    const kind = eliteGlyph(elite);
    if (kind) drawEliteTrait(ctx, e, kind, flip, top, enemyFootY(e), f.w * k, time, still);
    const size = eliteBadgeSize(f.big ? S[f.big] : 1);
    drawEliteBadge(ctx, e.x + 0.28 * f.w * k, top - ENEMY_STYLE.elite.lift * size, size, elite);
  }
}

// B-167: ruhender Bodenschatten der Fledermaus, versetzt in Blickrichtung; kleiner, wenn der Körper oben ist
export function drawBatShadow(ctx, e, flip = 1, lift = 0) {
  const c = ENEMY_STYLE.bat;
  const h01 = Number.isFinite(lift) && c.hover > 0 ? Math.max(0, Math.min(1, (lift / c.hover + 1) / 2)) : 0.5;
  const rx = c.shadowRx * U * (1 - c.shadowShrink * h01);
  ctx.fillStyle = c.shadow;
  ctx.beginPath();
  ctx.ellipse(e.x + (flip < 0 ? -1 : 1) * c.shadowDx * U, enemyFootY(e), rx, c.shadowRy * U, 0, 0, TWO_PI);
  ctx.fill();
}

// B-168: flackernder Lichthof hinter dem Irrlicht (Alpha springt je Bild im Bereich flicker; reduziert: fest)
export function drawWispGlow(ctx, e, time, reduced = false, lift = 0) {
  const c = ENEMY_STYLE.wisp;
  const step = Number.isFinite(time) ? Math.floor(time * c.flickerHz) : 0;
  const f = reduced ? c.reducedFlicker : c.flicker[0] + (c.flicker[1] - c.flicker[0]) * hash01(e.id || 0, step);
  const y = enemyFootY(e) - (c.glowY + (Number.isFinite(lift) ? lift : 0)) * U;
  ctx.fillStyle = `rgba(${c.glowRgb},${(c.glowAlpha * f).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(e.x, y, c.glowR * U, 0, TWO_PI);
  ctx.fill();
}

// B-170: Funken steigen aus der Flammenspitze; höchstens sparkMax je Glutling, je Funke feste Phase (kein Zustand)
export function drawEmberSparks(ctx, e, time) {
  const c = ENEMY_STYLE.ember;
  if (!Number.isFinite(time) || !(c.sparkRate > 0)) return;
  const n = Math.min(c.sparkMax, Math.ceil(c.sparkRate * c.sparkLife));
  const period = n / c.sparkRate;
  const tipY = enemyFootY(e) - c.sparkTop * U;
  ctx.fillStyle = c.sparkColor;
  for (let i = 0; i < n; i++) {
    const age = frac((time + i / c.sparkRate + (e.id || 0) * 0.37) / period) * period;
    if (age >= c.sparkLife) continue;
    const u = age / c.sparkLife;
    const r = c.sparkSize[i % 2] * (1 - 0.5 * u);
    ctx.beginPath();
    ctx.arc(e.x + Math.sin(u * Math.PI + i * 2) * c.sparkDrift, tipY - u * c.sparkRise, r, 0, TWO_PI);
    ctx.fill();
  }
}

// B-170: Dampf statt Eis. Aus dem Zustand ablesbar ist nur der Kälteschock (setzt slowUntil = Beginn + Dauer):
// in den ersten steamLife Sekunden danach steigen Dampfwölkchen auf. reduced: am Ort, ohne Steigen.
export function drawEmberSteam(ctx, e, time, reduced = false) {
  const c = ENEMY_STYLE.ember;
  const age = time - (e.slowUntil - ABILITIES.freeze.duration);
  if (!(age >= 0 && age < c.steamLife)) return;
  const u = age / c.steamLife;
  const foot = enemyFootY(e);
  ctx.fillStyle = `rgba(${c.steamRgb},${(c.steamAlpha * (1 - u)).toFixed(3)})`;
  ctx.strokeStyle = c.steamInk;
  ctx.lineWidth = c.steamLine;
  for (const [dx, dy] of c.steamPuffs) {
    const r = (c.steamR[0] + (c.steamR[1] - c.steamR[0]) * u) * U;
    ctx.beginPath();
    ctx.arc(e.x + dx * U, foot + (dy - (reduced ? 0 : u * c.steamRise)) * U, r, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
  }
}

// B-169 (Platzhalter, wird nicht mehr gezeichnet: die Figur zeigt die Schalen-Stufe): je Schicht ein Segment
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
