// Zeichnen der Gegner (nur Darstellung, keine Spiel-Logik).
// Figuren werden in Einheiten von e.radius gezeichnet (Blick nach +x, Boden bei y ~ +0.9),
// damit sie ungefaehr in den Kreis des Gegners passen (Krone/Waffe bis ca. 1,3x).
// Keine Allokationen pro Frame: Konstanten und Tabellen liegen auf Modulebene.
import { ENEMY_TYPES, TILE } from './config.js';
import { walkPhase, animSpeedFactor, facingFor, facingFlip, facingTilt } from './enemy-fx.js';

const TWO_PI = Math.PI * 2;

// Schatten
const SHADOW_COLOR = 'rgba(0,0,0,0.3)';
const SHADOW_DY = 0.8; // Versatz nach unten (in Radien)
const SHADOW_RX = 0.9;
const SHADOW_RY = 0.33;
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
const GOBLIN = { skin: '#6fbf4a', dark: '#4a8a33', feet: '#2f5a22', ear: '#8ad45f' };
const RUNNER = { skin: '#f2c14e', dark: '#c8962a', feet: '#8a6418', streak: 'rgba(242,193,78,0.5)' };
const TANK = { skin: '#b5523b', dark: '#7d3626', plate: '#9aa3a8', plateDark: '#6d767b', rivet: '#d8dcde', feet: '#4a2418' };
const OGRE = { skin: '#7a2e8e', light: '#9a4cb0', dark: '#55206a', gold: '#f2c94c', goldDark: '#b8912a', aura: 'rgba(180,90,220,0.2)', club: '#6b4a2b', tusk: '#f0e6d2', eye: '#ff4a4a' };
const SHAMAN = { robe: '#2f8f6a', dark: '#1f6148', skin: '#8fd4a8', staff: '#6b4a2b', glow: '#b8ffd8', hood: '#3fbf8f' };
const SHIELDED = { skin: '#7d8fae', dark: '#4f607c', helm: '#9aa7ba', shield: '#8a6a3a', shieldDark: '#5b4425', rim: '#c9ccd2', boss: '#e8d27a', feet: '#2c3646' };
// Heil-Aura (deutlich dezenter als der Frost-Ring)
const HEAL_AURA_FILL = 'rgba(90,230,150,0.07)';
const HEAL_AURA_RING = 'rgba(120,240,170,0.28)';
const HEAL_AURA_WIDTH = 1.5;
const HEAL_AURA_PULSE = 0.04; // relative Radius-Schwankung
const HEAL_AURA_SPEED = 2; // Bogenmass pro Sekunde

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function tri(ctx, color, x1, y1, x2, y2, x3, y3) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function disc(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();
}

function oval(ctx, color, x, y, rx, ry, rot) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TWO_PI);
  ctx.fill();
}

// Ein Bein: Huefte (hx, hy), Fuss schwingt mit der Phase vor/zurueck und hebt sich im Vorschwung
function leg(ctx, color, width, hx, hy, len, phase, swing, lift) {
  const fx = hx + Math.sin(phase) * swing;
  const fy = hy + len - Math.max(0, Math.cos(phase)) * lift;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(fx, fy);
  ctx.stroke();
}

// Goblin: kleine gruene Gestalt mit spitzen Ohren
function drawGrunt(ctx, phase) {
  leg(ctx, GOBLIN.feet, 0.28, -0.22, 0.45, 0.4, phase, 0.22, 0.14);
  leg(ctx, GOBLIN.feet, 0.28, 0.22, 0.45, 0.4, phase + Math.PI, 0.22, 0.14);
  ctx.translate(0, -Math.abs(Math.sin(phase)) * BOB);
  oval(ctx, GOBLIN.dark, -0.05, 0.12, 0.55, 0.52, 0);
  tri(ctx, GOBLIN.ear, -0.3, -0.5, -0.98, -0.78, -0.3, -0.88);
  tri(ctx, GOBLIN.ear, 0.15, -0.8, 0.55, -1.0, 0.45, -0.55);
  disc(ctx, 0.12, -0.45, 0.46, GOBLIN.skin);
  disc(ctx, 0.3, -0.5, 0.15, WHITE);
  disc(ctx, 0.35, -0.5, 0.075, EYE_DARK);
  rect(ctx, GOBLIN.feet, 0.12, -0.22, 0.34, 0.07);
}

// Flitzer: schlanke gelbe Gestalt in Streckhaltung (Oberkoerper nach vorn gelehnt)
function drawRunner(ctx, phase) {
  leg(ctx, RUNNER.feet, 0.2, -0.1, 0.3, 0.55, phase, 0.45, 0.25);
  leg(ctx, RUNNER.feet, 0.2, 0.1, 0.3, 0.55, phase + Math.PI, 0.45, 0.25);
  ctx.translate(0, -Math.abs(Math.sin(phase)) * BOB);
  rect(ctx, RUNNER.streak, -0.98, -0.2, 0.4, 0.07);
  rect(ctx, RUNNER.streak, -0.85, 0.05, 0.35, 0.07);
  oval(ctx, RUNNER.dark, 0, 0, 0.7, 0.28, -0.35);
  oval(ctx, RUNNER.skin, 0.05, -0.05, 0.6, 0.24, -0.35);
  disc(ctx, 0.55, -0.4, 0.3, RUNNER.skin);
  tri(ctx, RUNNER.dark, 0.35, -0.6, 0.15, -0.9, 0.55, -0.68);
  disc(ctx, 0.66, -0.43, 0.1, WHITE);
  disc(ctx, 0.69, -0.43, 0.05, EYE_DARK);
}

// Panzer-Troll: breite rotbraune Gestalt mit Ruestungsplatten und Schild
function drawTank(ctx, phase) {
  leg(ctx, TANK.feet, 0.34, -0.35, 0.5, 0.38, phase, 0.14, 0.08);
  leg(ctx, TANK.feet, 0.34, 0.35, 0.5, 0.38, phase + Math.PI, 0.14, 0.08);
  ctx.translate(0, -Math.abs(Math.sin(phase)) * BOB * 0.6);
  rect(ctx, TANK.dark, -0.9, -0.5, 1.8, 1.05);
  rect(ctx, TANK.skin, -0.85, -0.45, 1.7, 0.95);
  rect(ctx, TANK.plate, -0.7, -0.4, 0.35, 0.85);
  rect(ctx, TANK.plate, -0.25, -0.4, 0.35, 0.85);
  rect(ctx, TANK.plateDark, -0.7, 0.2, 0.8, 0.12);
  disc(ctx, -0.52, -0.25, 0.05, TANK.rivet);
  disc(ctx, -0.07, -0.25, 0.05, TANK.rivet);
  // Kopf mit Helm
  disc(ctx, 0.45, -0.55, 0.3, TANK.skin);
  rect(ctx, TANK.plateDark, 0.15, -0.88, 0.62, 0.22);
  disc(ctx, 0.55, -0.5, 0.09, WHITE);
  disc(ctx, 0.58, -0.5, 0.045, EYE_DARK);
  // Schild vorn
  rect(ctx, TANK.plateDark, 0.5, -0.35, 0.42, 0.9);
  rect(ctx, TANK.plate, 0.55, -0.3, 0.32, 0.8);
  disc(ctx, 0.71, 0.1, 0.1, TANK.rivet);
}

// Oger-Koenig: grosse violette Gestalt mit Krone, Keule und pulsierender Aura
function drawBoss(ctx, phase, time) {
  disc(ctx, 0, 0, 1.0 + Math.sin(time * 3) * 0.08, OGRE.aura);
  leg(ctx, OGRE.dark, 0.36, -0.32, 0.55, 0.38, phase, 0.14, 0.08);
  leg(ctx, OGRE.dark, 0.36, 0.32, 0.55, 0.38, phase + Math.PI, 0.14, 0.08);
  ctx.translate(0, -Math.abs(Math.sin(phase)) * BOB * 0.6);
  // Keule hinter dem Koerper (schwingt leicht mit)
  rect(ctx, OGRE.club, 0.62, -0.5, 0.18, 1.0);
  disc(ctx, 0.71, -0.55, 0.24, OGRE.club);
  oval(ctx, OGRE.dark, 0, 0.1, 0.78, 0.7, 0);
  oval(ctx, OGRE.skin, 0, 0.05, 0.72, 0.64, 0);
  oval(ctx, OGRE.light, 0.05, 0.22, 0.42, 0.34, 0);
  // Kopf
  disc(ctx, 0.2, -0.4, 0.42, OGRE.light);
  tri(ctx, OGRE.tusk, 0.35, -0.12, 0.45, 0.1, 0.5, -0.15);
  tri(ctx, OGRE.tusk, 0.1, -0.12, 0.05, 0.1, 0.2, -0.12);
  disc(ctx, 0.36, -0.46, 0.1, OGRE.eye);
  disc(ctx, 0.04, -0.46, 0.08, OGRE.eye);
  // Krone
  rect(ctx, OGRE.goldDark, -0.15, -0.88, 0.72, 0.16);
  tri(ctx, OGRE.gold, -0.15, -0.88, -0.1, -1.2, 0.1, -0.88);
  tri(ctx, OGRE.gold, 0.1, -0.88, 0.21, -1.24, 0.32, -0.88);
  tri(ctx, OGRE.gold, 0.32, -0.88, 0.5, -1.2, 0.57, -0.88);
  disc(ctx, 0.21, -0.8, 0.05, OGRE.eye);
}

// Schamane: gruene Robe mit Kapuze, Stab mit leuchtender Kugel
function drawHealer(ctx, phase, time) {
  leg(ctx, SHAMAN.dark, 0.26, -0.2, 0.5, 0.38, phase, 0.16, 0.1);
  leg(ctx, SHAMAN.dark, 0.26, 0.2, 0.5, 0.38, phase + Math.PI, 0.16, 0.1);
  ctx.translate(0, -Math.abs(Math.sin(phase)) * BOB);
  // Stab hinter der Robe, vorn mit pulsierendem Leuchten
  rect(ctx, SHAMAN.staff, 0.55, -0.75, 0.1, 1.45);
  disc(ctx, 0.6, -0.85, 0.2 + Math.sin(time * 4) * 0.03, SHAMAN.glow);
  disc(ctx, 0.6, -0.85, 0.11, SHAMAN.hood);
  // Robe (unten breiter)
  tri(ctx, SHAMAN.dark, -0.65, 0.6, 0.1, -0.5, 0.65, 0.6);
  tri(ctx, SHAMAN.robe, -0.55, 0.55, 0.05, -0.45, 0.55, 0.55);
  // Kopf mit Kapuze
  disc(ctx, 0.08, -0.5, 0.4, SHAMAN.hood);
  disc(ctx, 0.2, -0.45, 0.26, SHAMAN.skin);
  disc(ctx, 0.3, -0.48, 0.08, WHITE);
  disc(ctx, 0.33, -0.48, 0.04, EYE_DARK);
}

// Schildtraeger: kleine Gestalt hinter einem grossen Schild, der die Vorderseite abdeckt
function drawShielded(ctx, phase) {
  leg(ctx, SHIELDED.feet, 0.3, -0.25, 0.5, 0.38, phase, 0.14, 0.08);
  leg(ctx, SHIELDED.feet, 0.3, 0.25, 0.5, 0.38, phase + Math.PI, 0.14, 0.08);
  ctx.translate(0, -Math.abs(Math.sin(phase)) * BOB * 0.6);
  oval(ctx, SHIELDED.dark, -0.2, 0.05, 0.6, 0.55, 0);
  disc(ctx, -0.05, -0.55, 0.36, SHIELDED.skin);
  rect(ctx, SHIELDED.helm, -0.4, -0.9, 0.7, 0.2);
  disc(ctx, 0.12, -0.55, 0.08, WHITE);
  disc(ctx, 0.15, -0.55, 0.04, EYE_DARK);
  // Grosser Schild vorn (Rand, Holz, Buckel)
  oval(ctx, SHIELDED.rim, 0.5, 0.05, 0.5, 0.88, 0);
  oval(ctx, SHIELDED.shield, 0.5, 0.05, 0.41, 0.77, 0);
  oval(ctx, SHIELDED.shieldDark, 0.5, 0.05, 0.14, 0.55, 0);
  disc(ctx, 0.5, 0.05, 0.14, SHIELDED.boss);
}

// Unbekannter Typ: generische Figur (Kreis in def.color, falls vorhanden) mit Augen
function drawGeneric(ctx, phase, time, color) {
  ctx.translate(0, -Math.abs(Math.sin(phase)) * BOB);
  disc(ctx, 0, 0, 1, color);
  disc(ctx, 0.3, -0.25, 0.2, WHITE);
  disc(ctx, 0.36, -0.25, 0.1, EYE_DARK);
}

// Tabelle statt Objekt-Literal-Lookup (kein Prototype-Treffer bei exotischen Typnamen)
const FIGURES = new Map([
  ['grunt', drawGrunt],
  ['runner', drawRunner],
  ['tank', drawTank],
  ['boss', drawBoss],
  ['healer', drawHealer],
  ['shielded', drawShielded],
]);
const FALLBACK_COLOR = '#999';

// Frost: bluelicher Glanz ueber der Figur plus kleine Eiskristalle (lokale Einheiten)
function drawFrostOverlay(ctx) {
  disc(ctx, 0, 0, 0.95, FROST_TINT);
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

  // Schatten (Weltkoordinaten, dreht sich nicht mit)
  ctx.fillStyle = SHADOW_COLOR;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + r * SHADOW_DY, r * SHADOW_RX, r * SHADOW_RY, 0, 0, TWO_PI);
  ctx.fill();

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
