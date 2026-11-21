// Zeichnet den Spielzustand auf ein Canvas. Keine Spiel-Logik hier!
import { TILE, COLS, ROWS, WIDTH, HEIGHT, TOWER_TYPES, MAPS } from './config.js';
import { towerStats } from './game.js';
import { rect, tri, disc } from './draw-utils.js';
import { recoilOffset } from './tower-fx.js';
import { drawEnemy, drawHealAura } from './render-enemies.js';
import { updateFx, shakeX, shakeY, drawProjectileFx, drawParticles } from './render-fx.js';
import { tileHash, tileRand, decorFor, obstacleKind, LARGE_DECOR_RADIUS } from './decor.js';

export function render(ctx, state, ui) {
  // Partikel aus dem Zustand ableiten (nur lesen), danach Shake-Versatz bestimmen.
  updateFx(state);
  const sx = shakeX();
  const sy = shakeY();
  const shaking = sx !== 0 || sy !== 0;
  drawGround(ctx, state); // unverschoben, damit am Rand nichts durchscheint
  if (shaking) {
    ctx.save();
    // Screen-Shake: verschiebt nur die Zeichnung der Welt (Hover-Rahmen und Reichweite werden
    // mitverschoben, bleiben relativ zu den Tuermen also korrekt). Mausziel/Eingabe in main.js
    // rechnet mit Canvas-Koordinaten und ist davon unabhaengig.
    ctx.translate(sx, sy);
    drawGround(ctx, state);
  }
  drawHover(ctx, state, ui);
  for (const t of state.towers) drawTower(ctx, t, ui.selectedTowerId === t.id);
  for (const e of state.enemies) drawHealAura(ctx, e, state.time);
  for (const e of state.enemies) drawEnemy(ctx, e, state.time, state.path);
  for (const p of state.projectiles) drawProjectile(ctx, p);
  drawParticles(ctx);
  for (const fx of state.effects) drawEffect(ctx, fx);
  if (shaking) ctx.restore();
}

// ---------- Hintergrund (Gelaende, Weg, Dekoration) ----------
// Rein visuelle Konstanten (Balancing-Zahlen stehen in config.js).
const GRASS_COLORS = ['#4d9c41', '#51a145']; // Schachbrett-Grundton
const GRASS_SHIFT = 0.07; // max. Helligkeitsversatz pro Kachel (Deckkraft)
const GRASS_BLADE = '#37802f';
const PATH_EDGE = '#8f7140';
const PATH_MAIN = '#dcc189';
const PATH_PEBBLES = ['#bfa06a', '#ead4a0', '#a98a58'];
const PATH_EDGE_WIDTH = 5; // Randbreite in Pixeln
const GATE_WOOD = '#5b3a1e';
const GATE_WOOD_LIGHT = '#7a5230';
const EXIT_STONE = '#6b6f78';
const EXIT_DARK = '#1c1a20';

// Cache: ein Offscreen-Canvas, wird nur bei geaendertem Weg neu gezeichnet.
let bgCanvas = null;
let bgKey = null;

function makeCanvas() {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = WIDTH;
    c.height = HEIGHT;
    return c;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(WIDTH, HEIGHT);
  return null;
}

function drawGround(ctx, state) {
  // Schluessel = Referenz auf den Weg (neuer Weg -> neue Punkte-Liste)
  if (!bgCanvas || bgKey !== state.path.points) {
    bgCanvas = bgCanvas || makeCanvas();
    if (!bgCanvas) return paintBackground(ctx, state);
    paintBackground(bgCanvas.getContext('2d'), state);
    bgKey = state.path.points;
  }
  ctx.drawImage(bgCanvas, 0, 0);
}

function paintBackground(ctx, state) {
  ctx.save();
  drawGrass(ctx, MAPS[state.mapId]?.theme);
  drawPath(ctx, state);
  drawDecor(ctx, state);
  const pts = state.path.points;
  drawGate(ctx, pts[0], pts[1]);
  drawExit(ctx, pts[pts.length - 1], pts[pts.length - 2]);
  ctx.restore();
}

function drawGrass(ctx, theme) {
  const colors = theme?.grass || GRASS_COLORS;
  const blade = theme?.blade || GRASS_BLADE;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = colors[(r + c) % 2];
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      // kleiner Helligkeitsversatz je Kachel, das Schachbrett bleibt erkennbar
      const shift = (tileHash(c, r, 10) / 4294967296 - 0.5) * 2 * GRASS_SHIFT;
      ctx.fillStyle = shift >= 0 ? `rgba(255,255,255,${shift})` : `rgba(0,0,0,${-shift})`;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      // ein paar dunkle Halme
      ctx.strokeStyle = blade;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const x = c * TILE + 4 + tileRand(c, r, 20 + i) * (TILE - 8);
        const y = r * TILE + 6 + tileRand(c, r, 30 + i) * (TILE - 10);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 1.5, y - 4);
        ctx.stroke();
      }
    }
  }
}

function drawPath(ctx, state) {
  const pts = state.path.points;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  // dunkler Rand, darueber der erdige Weg
  ctx.strokeStyle = PATH_EDGE;
  ctx.lineWidth = TILE;
  strokePath(ctx, pts);
  ctx.strokeStyle = PATH_MAIN;
  ctx.lineWidth = TILE - PATH_EDGE_WIDTH * 2;
  strokePath(ctx, pts);
  // Kiesel auf Weg-Kacheln (deterministisch)
  for (const key of state.blocked) {
    const [c, r] = key.split(',').map(Number);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
    for (let i = 0; i < 4; i++) {
      const x = c * TILE + 8 + tileRand(c, r, 40 + i) * (TILE - 16);
      const y = r * TILE + 8 + tileRand(c, r, 50 + i) * (TILE - 16);
      ctx.fillStyle = PATH_PEBBLES[tileHash(c, r, 60 + i) % PATH_PEBBLES.length];
      ctx.beginPath();
      ctx.ellipse(x, y, 2 + tileRand(c, r, 70 + i) * 2, 1.5 + tileRand(c, r, 80 + i), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Dekoration: Regeln stehen in decor.js (gross nur am Rand, innen nur klein, nie auf dem Weg).
function drawDecor(ctx, state) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (state.obstacles && state.obstacles.has(`${c},${r}`)) {
        drawObstacle(ctx, c, r);
        continue;
      }
      const d = decorFor(c, r, state.blocked, state.obstacles);
      if (!d) continue;
      const x = c * TILE + d.ox * TILE;
      const y = r * TILE + d.oy * TILE;
      if (d.kind === 'tree') drawTree(ctx, x, y, d.variant);
      else if (d.kind === 'bush') drawBush(ctx, x, y, d.variant);
      else if (d.kind === 'rock') drawRock(ctx, x, y, d.variant);
      else if (d.kind === 'flower') drawFlower(ctx, x, y, d.variant);
      else if (d.kind === 'tuft') drawTuft(ctx, x, y);
      else drawPebble(ctx, x, y);
    }
  }
}

// Hindernis-Kachel: dunkler Grund, darauf Baum (dichter, zwei Kronen) oder Fels.
function drawObstacle(ctx, c, r) {
  const x0 = c * TILE;
  const y0 = r * TILE;
  ctx.fillStyle = 'rgba(10,40,15,0.35)';
  ctx.fillRect(x0, y0, TILE, TILE);
  const v = Math.floor(tileRand(c, r, 3) * 3);
  if (obstacleKind(c, r) === 'rock') {
    drawRock(ctx, x0 + TILE / 2, y0 + TILE / 2, v);
  } else {
    drawTree(ctx, x0 + TILE * 0.35, y0 + TILE * 0.6, v);
    drawTree(ctx, x0 + TILE * 0.65, y0 + TILE * 0.4, 2 - v);
  }
}

function drawTree(ctx, x, y, v) {
  const size = LARGE_DECOR_RADIUS.tree - 3 - (2 - v); // 6..8, plus Schatten (+1,+2) <= Radius
  disc(ctx, 'rgba(0,0,0,0.2)', x + 1, y + 2, size); // Schatten
  disc(ctx, '#245a2a', x, y, size);
  disc(ctx, '#2f7a36', x - 2, y - 2, size * 0.7);
  disc(ctx, '#4a9c4e', x - 4, y - 4, size * 0.3);
}

function drawBush(ctx, x, y, v) {
  // Breite 4+6 = 10 (= Radius), Oberkante 3+6+1 = 10
  disc(ctx, '#2c6e33', x - 4, y + 1, 6);
  disc(ctx, '#2c6e33', x + 4, y + 1, 6);
  disc(ctx, '#38853e', x, y - 3, 6 + v * 0.5);
}

function drawRock(ctx, x, y, v) {
  ctx.fillStyle = '#7d8088';
  ctx.beginPath();
  ctx.ellipse(x, y, 8 + v, 6 + v * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a3a6ad';
  ctx.beginPath();
  ctx.ellipse(x - 2, y - 2, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(ctx, x, y, v) {
  const petals = ['#f4f1e6', '#f2c14e', '#e88aa8'][v];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    disc(ctx, petals, x + Math.cos(a) * 2.5, y + Math.sin(a) * 2.5, 1.8);
  }
  disc(ctx, '#d98a1f', x, y, 1.5);
}

function drawTuft(ctx, x, y) {
  ctx.strokeStyle = '#5da654';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 2, y + 3);
    ctx.lineTo(x + i * 4, y - 4);
    ctx.stroke();
  }
}

function drawPebble(ctx, x, y) {
  ctx.fillStyle = '#9a9ca2';
  ctx.beginPath();
  ctx.ellipse(x, y, 3.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Zeichnet in lokalen Koordinaten: Ursprung an der Feldkante, +x zeigt ins Feld.
function atEdge(ctx, outer, inner, fn) {
  const dx = inner.x - outer.x;
  const dy = inner.y - outer.y;
  // Kantenpunkt: Wegpunkt auf die Spielfeldgrenze geklemmt
  const ex = Math.min(Math.max(outer.x, 0), WIDTH);
  const ey = Math.min(Math.max(outer.y, 0), HEIGHT);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(Math.atan2(dy, dx));
  fn();
  ctx.restore();
}

// Eingang: Holztor mit zwei Pfosten und Balken.
function drawGate(ctx, start, next) {
  atEdge(ctx, start, next, () => {
    const h = TILE / 2;
    for (const s of [-1, 1]) {
      ctx.fillStyle = GATE_WOOD;
      ctx.fillRect(-4, s * (h + 1) - 5, 14, 10);
      ctx.fillStyle = GATE_WOOD_LIGHT;
      ctx.fillRect(-4, s * (h + 1) - 5, 14, 3);
    }
    // Querbalken ueber dem Weg
    ctx.fillStyle = GATE_WOOD;
    ctx.fillRect(2, -h, 5, TILE);
    ctx.fillStyle = GATE_WOOD_LIGHT;
    ctx.fillRect(2, -h, 2, TILE);
  });
}

// Ausgang: kleine Burg (Steintor mit dunklem Eingang und Zinnen).
function drawExit(ctx, end, prev) {
  atEdge(ctx, end, prev, () => {
    // +x zeigt hier ins Feld hinein (von der Kante weg)
    const h = TILE / 2;
    ctx.fillStyle = EXIT_STONE;
    ctx.fillRect(-2, -h - 6, 16, TILE + 12);
    ctx.fillStyle = EXIT_DARK;
    ctx.fillRect(4, -10, 10, 20);
    ctx.fillStyle = EXIT_STONE;
    for (let i = -2; i <= 2; i++) ctx.fillRect(14, i * 9 - 3, 4, 6); // Zinnen
  });
}

function strokePath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.stroke();
}

function drawHover(ctx, state, ui) {
  const selected = state.towers.find((t) => t.id === ui.selectedTowerId);
  if (selected) rangeCircle(ctx, selected.x, selected.y, towerStats(selected, state.modifiers).range * TILE, 'rgba(255,255,255,0.15)');

  if (!ui.hover || !ui.buildType) return;
  const { col, row, ok } = ui.hover;
  const x = (col + 0.5) * TILE;
  const y = (row + 0.5) * TILE;
  ctx.fillStyle = ok ? 'rgba(255,255,255,0.25)' : 'rgba(255,60,60,0.35)';
  ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
  if (ok) rangeCircle(ctx, x, y, TOWER_TYPES[ui.buildType].range * TILE, 'rgba(255,255,255,0.12)');
}

function rangeCircle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ---------- Türme ----------
// Rein visuelle Konstanten (Farben, Maße in Pixeln). Alles bleibt in der Kachel (TILE 40),
// nur bewegliche Teile ragen beim Zielen höchstens ca. 4 px über den oberen Kachelrand.
const TOWER_SHADOW = 'rgba(0,0,0,0.28)';
const STONE = '#8d8f96';
const STONE_LIGHT = '#a9abb2';
const STONE_DARK = '#5d5f68';
const WOOD = '#8a5a2b';
const WOOD_DARK = '#5e3b1c';
const METAL = '#3d4048';
const GOLD = '#ffd54a';
const GOLD_DARK = '#c9a227';
const BANNER_RED = '#c0392b';
const ICE_LIGHT = '#e3f6fc';
const ICE_DARK = '#4a8fb0';
const FROST_GLOW = 'rgba(110,198,232,0.35)';
const BASE_HALF = 13; // halbe Sockelbreite auf Stufe 1
const BASE_GROW = 1.5; // Sockel wird pro Stufe breiter
const BASE_TOP = 6; // Oberkante des Sockels relativ zur Turmmitte
const BASE_HEIGHT = 9;
const RECOIL_PX = { arrow: 3, cannon: 4, frost: 3, sniper: 3 }; // maximaler Rückstoß in Pixeln
const BOW_Y = 7.13; // Bogenenden (Radius 8, Öffnungswinkel 1.1 rad)
const BOW_X = 0.63;

// Steinsockel mit Fugen; wächst mit der Stufe
function drawTowerBase(ctx, x, y, bw) {
  const top = y + BASE_TOP;
  rect(ctx, STONE, x - bw, top, bw * 2, BASE_HEIGHT);
  rect(ctx, STONE_LIGHT, x - bw, top, bw * 2, 2);
  ctx.strokeStyle = STONE_DARK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - bw, top + 4.5);
  ctx.lineTo(x + bw, top + 4.5);
  ctx.moveTo(x - bw * 0.5, top + 2);
  ctx.lineTo(x - bw * 0.5, top + 4.5);
  ctx.moveTo(x + bw * 0.5, top + 2);
  ctx.lineTo(x + bw * 0.5, top + 4.5);
  ctx.moveTo(x, top + 4.5);
  ctx.lineTo(x, top + BASE_HEIGHT);
  ctx.stroke();
}

// Feste Körper je Typ (drehen sich nicht)
function drawTowerBody(ctx, type, x, y, accent) {
  if (type === 'arrow') {
    // Holzpfosten mit Plattform und Geländer
    rect(ctx, WOOD_DARK, x - 8, y - 6, 3, 12);
    rect(ctx, WOOD_DARK, x + 5, y - 6, 3, 12);
    rect(ctx, WOOD, x - 8, y - 1, 16, 2);
    rect(ctx, WOOD, x - 11, y - 8, 22, 3);
    rect(ctx, WOOD_DARK, x - 11, y - 11, 2, 3);
    rect(ctx, WOOD_DARK, x + 9, y - 11, 2, 3);
  } else if (type === 'cannon') {
    // Steinbunker
    rect(ctx, STONE_DARK, x - 11, y - 7, 22, 13);
    rect(ctx, STONE, x - 11, y - 7, 22, 3);
    rect(ctx, METAL, x - 8, y + 1, 3, 4);
    rect(ctx, METAL, x + 5, y + 1, 3, 4);
  } else if (type === 'frost') {
    // Säule mit Kragen und Eiszapfen
    rect(ctx, ICE_DARK, x - 4, y - 3, 8, 10);
    rect(ctx, STONE_LIGHT, x - 6, y + 3, 12, 3);
    tri(ctx, ICE_LIGHT, x - 9, y + 6, x - 5, y + 6, x - 7, y + 1);
    tri(ctx, ICE_LIGHT, x + 5, y + 6, x + 9, y + 6, x + 7, y + 1);
  } else {
    // schlanker, hoher Turm mit Plattform
    rect(ctx, WOOD_DARK, x - 5, y - 7, 10, 13);
    rect(ctx, accent, x - 5, y - 2, 10, 2);
    rect(ctx, METAL, x - 1, y - 5, 2, 3);
    rect(ctx, STONE_LIGHT, x - 7, y - 10, 14, 3);
  }
}

// Stufen-Merkmale: Stufe 2 Banner, Stufe 3 goldene Zinnen/Wimpel; dazu Stufen-Punkte
function drawTowerLevel(ctx, x, y, bw, level) {
  const top = y + BASE_TOP;
  if (level >= 2) {
    const px = x - bw + 2;
    rect(ctx, WOOD_DARK, px - 0.75, y - 13, 1.5, 19);
    tri(ctx, level >= 3 ? GOLD : BANNER_RED, px + 0.75, y - 13, px + 0.75, y - 6, px + 8, y - 9.5);
  }
  if (level >= 3) {
    rect(ctx, GOLD_DARK, x - bw, top, bw * 2, 1.5);
    rect(ctx, GOLD, x - bw, top - 3, 3, 3);
    rect(ctx, GOLD, x + bw - 3, top - 3, 3, 3);
  }
  ctx.fillStyle = GOLD;
  for (let i = 0; i < level; i++) {
    ctx.beginPath();
    ctx.arc(x - 6 + i * 6, top + 6.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Beweglicher Teil (dreht sich zum Ziel, rec = Rückstoß in Pixeln nach hinten)
function drawTowerHead(ctx, type, x, y, angle, rec, accent) {
  ctx.save();
  if (type === 'arrow') ctx.translate(x, y - 9);
  else if (type === 'cannon') ctx.translate(x, y - 3);
  else if (type === 'frost') ctx.translate(x, y - 9);
  else ctx.translate(x, y - 8);
  ctx.rotate(angle);
  ctx.translate(-rec, 0);
  if (type === 'arrow') {
    // Bogen mit Sehne und aufgelegtem Pfeil
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-3, 0, 8, -1.1, 1.1);
    ctx.stroke();
    ctx.strokeStyle = '#f0e6d2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(BOW_X, -BOW_Y);
    ctx.lineTo(BOW_X, BOW_Y);
    ctx.stroke();
    rect(ctx, WOOD_DARK, -3, -0.75, 11, 1.5);
    tri(ctx, METAL, 8, -2.5, 12, 0, 8, 2.5);
  } else if (type === 'cannon') {
    rect(ctx, METAL, 0, -4, 15, 8);
    rect(ctx, STONE_DARK, 12, -5, 4, 10);
    disc(ctx, accent, 0, 0, 5);
  } else if (type === 'frost') {
    disc(ctx, FROST_GLOW, 0, 0, 6);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(0, -5);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();
    tri(ctx, ICE_LIGHT, 0, -5, 9, 0, 2, 0);
  } else {
    rect(ctx, WOOD, -5, -2, 5, 4);
    rect(ctx, METAL, 0, -1.5, 15, 3);
    rect(ctx, STONE_DARK, 3, -4.5, 7, 2.5);
    disc(ctx, accent, 10, -3.2, 1.2);
  }
  ctx.restore();
}

// Exportiert, damit Tests einen einzelnen Turm gegen einen Mock-Kontext zeichnen koennen.
export function drawTower(ctx, t, selected) {
  const def = TOWER_TYPES[t.type];
  const { x, y } = t;
  const bw = BASE_HALF + (t.level - 1) * BASE_GROW;
  // Rückstoß aus der Abklingzeit (game.js setzt cooldown beim Schuss auf das Intervall)
  const rec = recoilOffset(t.cooldown / def.rate) * RECOIL_PX[t.type];
  ctx.save();
  // Schatten
  ctx.fillStyle = TOWER_SHADOW;
  ctx.beginPath();
  ctx.ellipse(x, y + 14, bw + 1, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  drawTowerBase(ctx, x, y, bw);
  drawTowerBody(ctx, t.type, x, y, def.color);
  drawTowerLevel(ctx, x, y, bw, t.level);
  drawTowerHead(ctx, t.type, x, y, t.angle, rec, def.color);
  ctx.restore();
  if (selected) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 18, y - 18, 36, 36);
  }
}

const PROJECTILE_COLORS = { arrow: '#f5e6c8', cannon: '#222', frost: '#bdf0ff', sniper: '#e6d1ff' };

function drawProjectile(ctx, p) {
  ctx.fillStyle = (Object.hasOwn(PROJECTILE_COLORS, p.towerType) && PROJECTILE_COLORS[p.towerType]) || '#fff';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.towerType === 'cannon' ? 5 : 3, 0, Math.PI * 2);
  ctx.fill();
  drawProjectileFx(ctx, p); // Schweif/Strahl/Leuchten je Typ (unbekannte Typen bleiben ein weisser Kreis)
}

function drawEffect(ctx, fx) {
  const a = fx.ttl / fx.max;
  if (fx.kind === 'explosion') {
    ctx.fillStyle = `rgba(255,150,40,${0.5 * a})`;
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, fx.r * (1.2 - a * 0.5), 0, Math.PI * 2);
    ctx.fill();
  } else if (fx.kind === 'coin') {
    ctx.fillStyle = `rgba(255,213,74,${a})`;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fx.text, fx.x, fx.y - 20 + a * 10);
  }
}

export { WIDTH, HEIGHT };
