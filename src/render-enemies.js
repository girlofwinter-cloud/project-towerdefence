// Zeichnen der Gegner (nur Darstellung, keine Spiel-Logik).
// Figuren werden in Einheiten von e.radius gezeichnet (Blick nach +x, Boden bei y ~ +0.9),
// damit sie ungefaehr in den Kreis des Gegners passen (Krone/Waffe bis ca. 1,3x).
// Keine Allokationen pro Frame: Konstanten und Tabellen liegen auf Modulebene.
import { ENEMY_TYPES, TILE } from './config.js';
import { tri, disc, groundShadow } from './draw-utils.js';
import { drawGruntFlat, drawRunnerFlat, drawTankFlat, drawHealerFlat, drawShieldedFlat, drawBossFlat } from './render-enemies-flat.js';
import { walkPhase, animSpeedFactor, facingFor, facingFlip, facingTilt } from './enemy-fx.js';

const TWO_PI = Math.PI * 2;

// Schatten
const SHADOW_COLOR = 'rgba(0,0,0,0.3)';
const SHADOW_DY = 0.8; // Versatz nach unten (in Radien)
const SHADOW_RX = 0.9;
const SHADOW_RY = 0.33;
const FLAT_SHADOW_DY = 0.72; // Bodenschatten der Flat-Pop-Figuren: Mitte (in Radien)
const FLAT_SHADOW_R = 0.8; // und Groesse (haelt ihn im Rahmen von 1,6 Radien)
// Laufen
const BOB = 0.07; // Wippen nach oben (in Radien)
// Frost
const FROST_TINT = 'rgba(150,220,255,0.4)';
const FROST_RING = '#bdf0ff';
const FROST_CRYSTAL = '#e8fbff';
const FROST_RING_PX = 1.5; // Abstand des Rings ausserhalb des Radius
const FROST_RING_WIDTH = 2.5;
// HP-Balken (wie bisher)
const HP_BACK = '#300';
const HP_GOOD = '#4cd964';
const HP_MID = '#ffcc00';
const HP_LOW = '#ff3b30';
const HP_BAR_DY = 8;
const HP_BAR_H = 4;
const HP_BOSS_LIFT = 6; // Boss-Krone ragt hoeher -> Balken weiter oben
// Farben
const WHITE = '#fff';
const EYE_DARK = '#1a1a1a';
// Heil-Aura (deutlich dezenter als der Frost-Ring)
const HEAL_AURA_FILL = 'rgba(90,230,150,0.07)';
const HEAL_AURA_RING = 'rgba(120,240,170,0.28)';
const HEAL_AURA_WIDTH = 1.5;
const HEAL_AURA_PULSE = 0.04; // relative Radius-Schwankung
const HEAL_AURA_SPEED = 2; // Bogenmass pro Sekunde

// Unbekannter Typ: generische Figur (Kreis in def.color, falls vorhanden) mit Augen
function drawGeneric(ctx, phase, time, color) {
  ctx.translate(0, -Math.abs(Math.sin(phase)) * BOB);
  disc(ctx, color, 0, 0, 1);
  disc(ctx, WHITE, 0.3, -0.25, 0.2);
  disc(ctx, EYE_DARK, 0.36, -0.25, 0.1);
}

// Tabelle statt Objekt-Literal-Lookup (kein Prototype-Treffer bei exotischen Typnamen)
const FIGURES = new Map([
  ['grunt', drawGruntFlat],
  ['runner', drawRunnerFlat],
  ['tank', drawTankFlat],
  ['boss', drawBossFlat],
  ['healer', drawHealerFlat],
  ['shielded', drawShieldedFlat],
]);
const FLAT_TYPES = new Set(['grunt', 'runner', 'tank', 'healer', 'shielded', 'boss']);
const FALLBACK_COLOR = '#999';

// Frost: bluelicher Glanz ueber der Figur plus kleine Eiskristalle (lokale Einheiten)
function drawFrostOverlay(ctx) {
  disc(ctx, FROST_TINT, 0, 0, 0.95);
  tri(ctx, FROST_CRYSTAL, -0.55, -0.7, -0.4, -0.95, -0.25, -0.7);
  tri(ctx, FROST_CRYSTAL, 0.55, 0.1, 0.7, -0.15, 0.85, 0.1);
  tri(ctx, FROST_CRYSTAL, -0.2, 0.55, -0.05, 0.3, 0.1, 0.55);
}

// Heil-Aura: pulsierender, halbtransparenter Kreis mit Radius healRadius * TILE um einen Healer.
// Wird von render.js VOR den Gegnern gezeichnet (liegt unter den Figuren). Andere Typen: nichts.
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

function drawHpBar(ctx, e, lift) {
  const w = e.radius * 2;
  const frac = Math.max(0, e.hp / e.maxHp);
  const y = e.y - e.radius - HP_BAR_DY - lift;
  ctx.fillStyle = HP_BACK;
  ctx.fillRect(e.x - w / 2, y, w, HP_BAR_H);
  ctx.fillStyle = frac > 0.5 ? HP_GOOD : frac > 0.25 ? HP_MID : HP_LOW;
  ctx.fillRect(e.x - w / 2, y, w * frac, HP_BAR_H);
}

// path ist optional (state.path); ohne Weg blickt die Figur nach rechts.
export function drawEnemy(ctx, e, time, path) {
  const def = ENEMY_TYPES[e.type];
  const figure = FIGURES.get(e.type);
  const r = e.radius;
  const slowed = time < e.slowUntil;
  const angle = facingFor(path, e.dist);
  const phase = walkPhase(time, e.id, animSpeedFactor(e, time));

  // Schatten (Weltkoordinaten, dreht sich nicht mit); Flat-Pop-Figuren nutzen den Stil-Bodenschatten
  if (FLAT_TYPES.has(e.type)) groundShadow(ctx, e.x, e.y + r * FLAT_SHADOW_DY, r * FLAT_SHADOW_R);
  else {
    ctx.fillStyle = SHADOW_COLOR;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + r * SHADOW_DY, r * SHADOW_RX, r * SHADOW_RY, 0, 0, TWO_PI);
    ctx.fill();
  }

  // Figur: Ursprung = Gegnermitte, gespiegelt/geneigt, Einheit = Radius
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(facingFlip(angle), 1);
  ctx.rotate(facingTilt(angle));
  ctx.scale(r, r);
  if (figure) figure(ctx, phase, time);
  else drawGeneric(ctx, phase, time, def && def.color ? def.color : FALLBACK_COLOR);
  if (slowed) drawFrostOverlay(ctx);
  ctx.restore();

  if (slowed) {
    ctx.strokeStyle = FROST_RING;
    ctx.lineWidth = FROST_RING_WIDTH;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r + FROST_RING_PX, 0, TWO_PI);
    ctx.stroke();
  }
  drawHpBar(ctx, e, e.type === 'boss' ? HP_BOSS_LIFT : 0);
}
