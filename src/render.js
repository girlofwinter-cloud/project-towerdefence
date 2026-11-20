// Zeichnet den Spielzustand auf ein Canvas. Keine Spiel-Logik hier!
import { TILE, COLS, ROWS, WIDTH, HEIGHT, TOWER_TYPES, ENEMY_TYPES } from './config.js';
import { towerStats } from './game.js';

export function render(ctx, state, ui) {
  drawGround(ctx, state);
  drawHover(ctx, state, ui);
  for (const t of state.towers) drawTower(ctx, t, ui.selectedTowerId === t.id);
  for (const e of state.enemies) drawEnemy(ctx, e, state.time);
  for (const p of state.projectiles) drawProjectile(ctx, p);
  for (const fx of state.effects) drawEffect(ctx, fx);
}

function drawGround(ctx, state) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = (r + c) % 2 ? '#3f7d3a' : '#448541';
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
  // Weg
  const pts = state.path.points;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
  ctx.strokeStyle = '#8a6b43';
  ctx.lineWidth = TILE;
  strokePath(ctx, pts);
  ctx.strokeStyle = '#a5845a';
  ctx.lineWidth = TILE - 10;
  strokePath(ctx, pts);
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
