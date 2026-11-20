// Zeichnet den Spielzustand auf ein Canvas. Keine Spiel-Logik hier!
import { TILE, COLS, ROWS, WIDTH, HEIGHT, TOWER_TYPES, ENEMY_TYPES } from './config.js';
import { towerStats } from './game.js';
import { tileHash, tileRand, decorFor, LARGE_DECOR_RADIUS } from './decor.js';

export function render(ctx, state, ui) {
  drawGround(ctx, state);
  drawHover(ctx, state, ui);
  for (const t of state.towers) drawTower(ctx, t, ui.selectedTowerId === t.id);
  for (const e of state.enemies) drawEnemy(ctx, e, state.time);
  for (const p of state.projectiles) drawProjectile(ctx, p);
  for (const fx of state.effects) drawEffect(ctx, fx);
}

// ---------- Hintergrund (Gelaende, Weg, Dekoration) ----------
// Rein visuelle Konstanten (Balancing-Zahlen stehen in config.js).
const GRASS_COLORS = ['#3f7d3a', '#468843']; // Schachbrett-Grundton
const GRASS_SHIFT = 0.07; // max. Helligkeitsversatz pro Kachel (Deckkraft)
const GRASS_BLADE = '#2f6a2e';
const PATH_EDGE = '#5a4228';
const PATH_MAIN = '#a5845a';
const PATH_PEBBLES = ['#8a6b43', '#b99a6f', '#76593a'];
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
  drawGrass(ctx);
  drawPath(ctx, state);
  drawDecor(ctx, state);
  const pts = state.path.points;
  drawGate(ctx, pts[0], pts[1]);
  drawExit(ctx, pts[pts.length - 1], pts[pts.length - 2]);
  ctx.restore();
}

function drawGrass(ctx) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = GRASS_COLORS[(r + c) % 2];
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      // kleiner Helligkeitsversatz je Kachel, das Schachbrett bleibt erkennbar
      const shift = (tileHash(c, r, 10) / 4294967296 - 0.5) * 2 * GRASS_SHIFT;
      ctx.fillStyle = shift >= 0 ? `rgba(255,255,255,${shift})` : `rgba(0,0,0,${-shift})`;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      // ein paar dunkle Halme
      ctx.strokeStyle = GRASS_BLADE;
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
      const d = decorFor(c, r, state.blocked);
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

function disc(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawTree(ctx, x, y, v) {
  const size = LARGE_DECOR_RADIUS.tree - 3 - (2 - v); // 6..8, plus Schatten (+1,+2) <= Radius
  disc(ctx, x + 1, y + 2, size, 'rgba(0,0,0,0.2)'); // Schatten
  disc(ctx, x, y, size, '#245a2a');
  disc(ctx, x - 2, y - 2, size * 0.7, '#2f7a36');
  disc(ctx, x - 4, y - 4, size * 0.3, '#4a9c4e');
}

function drawBush(ctx, x, y, v) {
  // Breite 4+6 = 10 (= Radius), Oberkante 3+6+1 = 10
  disc(ctx, x - 4, y + 1, 6, '#2c6e33');
  disc(ctx, x + 4, y + 1, 6, '#2c6e33');
  disc(ctx, x, y - 3, 6 + v * 0.5, '#38853e');
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
    disc(ctx, x + Math.cos(a) * 2.5, y + Math.sin(a) * 2.5, 1.8, petals);
  }
  disc(ctx, x, y, 1.5, '#d98a1f');
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
  if (selected) rangeCircle(ctx, selected.x, selected.y, towerStats(selected).range * TILE, 'rgba(255,255,255,0.15)');

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

function drawTower(ctx, t, selected) {
  const def = TOWER_TYPES[t.type];
  const { x, y } = t;
  // Sockel
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(x - 16, y - 16, 32, 32);
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  // Rohr
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t.angle);
  ctx.fillStyle = '#1d1d1d';
  const len = t.type === 'sniper' ? 20 : 15;
  const w = t.type === 'cannon' ? 8 : 4;
  ctx.fillRect(0, -w / 2, len, w);
  ctx.restore();
  // Stufen-Punkte
  for (let i = 0; i < t.level; i++) {
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.arc(x - 8 + i * 8, y + 13, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (selected) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 18, y - 18, 36, 36);
  }
}

function drawEnemy(ctx, e, time) {
  const def = ENEMY_TYPES[e.type];
  const wobble = Math.sin(time * 10 + e.id) * 1.5;
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(e.x, e.y + wobble, e.radius, 0, Math.PI * 2);
  ctx.fill();
  if (time < e.slowUntil) {
    ctx.strokeStyle = '#bdf0ff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // Augen
  ctx.fillStyle = '#fff';
  ctx.fillRect(e.x - 5, e.y + wobble - 4, 3, 3);
  ctx.fillRect(e.x + 2, e.y + wobble - 4, 3, 3);
  // HP-Balken
  const w = e.radius * 2;
  const frac = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = '#300';
  ctx.fillRect(e.x - w / 2, e.y - e.radius - 8, w, 4);
  ctx.fillStyle = frac > 0.5 ? '#4cd964' : frac > 0.25 ? '#ffcc00' : '#ff3b30';
  ctx.fillRect(e.x - w / 2, e.y - e.radius - 8, w * frac, 4);
}

function drawProjectile(ctx, p) {
  const colors = { arrow: '#f5e6c8', cannon: '#222', frost: '#bdf0ff', sniper: '#e6d1ff' };
  ctx.fillStyle = colors[p.towerType] || '#fff';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.towerType === 'cannon' ? 5 : 3, 0, Math.PI * 2);
  ctx.fill();
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
