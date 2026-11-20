// Verbindet Spiel-Logik, Rendering und Bedienung (DOM, Maus, Tastatur).
import { TILE, WIDTH, HEIGHT, TOWER_TYPES, ENEMY_TYPES, MAX_WAVES, TARGET_MODES, TARGET_MODE_NAMES, waveSummary } from './config.js';
import {
  createGame, update, buildTower, upgradeTower, sellTower, setTargetMode, startWave,
  canBuild, towerAt, towerStats, upgradeCost, sellValue,
} from './game.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext('2d');

const $ = (id) => document.getElementById(id);
const ui = { buildType: null, selectedTowerId: null, hover: null, speed: 1, message: '', messageTtl: 0 };
let state = createGame();

// Für Tests und Neugierige: im Browser-Konsole `__game` eintippen.
window.__game = () => state;
window.__ui = ui;

// ---------- Turm-Leiste ----------
const shop = $('shop');
for (const [type, def] of Object.entries(TOWER_TYPES)) {
  const btn = document.createElement('button');
  btn.className = 'tower-btn';
  btn.dataset.type = type;
  btn.innerHTML = `<span class="swatch" style="background:${def.color}"></span>
    <span class="t-name">${def.name} <kbd>${def.key}</kbd></span>
    <span class="t-cost">${def.cost} 💰</span>
    <span class="t-desc">${def.description}</span>`;
  btn.addEventListener('click', () => selectBuild(type));
  shop.appendChild(btn);
}

function selectBuild(type) {
  ui.buildType = ui.buildType === type ? null : type;
  ui.selectedTowerId = null;
  refreshUI();
}

function flash(msg) {
  ui.message = msg;
  ui.messageTtl = 2;
}

// ---------- Maus ----------
function tileFromEvent(ev) {
  const rect = canvas.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * WIDTH;
  const y = ((ev.clientY - rect.top) / rect.height) * HEIGHT;
  return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) };
}

canvas.addEventListener('mousemove', (ev) => {
  const { col, row } = tileFromEvent(ev);
  ui.hover = { col, row, ok: canBuild(state, col, row).ok };
});
canvas.addEventListener('mouseleave', () => (ui.hover = null));
canvas.addEventListener('click', (ev) => {
  const { col, row } = tileFromEvent(ev);
  const existing = towerAt(state, col, row);
  if (existing) {
    ui.selectedTowerId = existing.id;
    ui.buildType = null;
  } else if (ui.buildType) {
    const res = buildTower(state, ui.buildType, col, row);
    if (!res.ok) flash(res.reason);
  } else {
    ui.selectedTowerId = null;
  }
  refreshUI();
});
canvas.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  ui.buildType = null;
  ui.selectedTowerId = null;
  refreshUI();
});

// ---------- Buttons & Tastatur ----------
$('start-wave').addEventListener('click', doStartWave);
$('speed').addEventListener('click', toggleSpeed);
$('upgrade').addEventListener('click', doUpgrade);
$('sell').addEventListener('click', doSell);
$('target-mode').addEventListener('click', doCycleTarget);
$('restart').addEventListener('click', restart);

function doStartWave() {
  const res = startWave(state);
  if (!res.ok) flash(res.reason);
  refreshUI();
}
function toggleSpeed() {
  ui.speed = ui.speed === 1 ? 2 : ui.speed === 2 ? 3 : 1;
  refreshUI();
}
function doUpgrade() {
  if (!ui.selectedTowerId) return;
  const res = upgradeTower(state, ui.selectedTowerId);
  if (!res.ok) flash(res.reason);
  refreshUI();
}
function doCycleTarget() {
  const t = state.towers.find((x) => x.id === ui.selectedTowerId);
  if (!t) return;
  const next = TARGET_MODES[(TARGET_MODES.indexOf(t.targetMode) + 1) % TARGET_MODES.length];
  const res = setTargetMode(state, t.id, next);
  if (!res.ok) flash(res.reason);
  refreshUI();
}
function doSell() {
  if (!ui.selectedTowerId) return;
  sellTower(state, ui.selectedTowerId);
  ui.selectedTowerId = null;
  refreshUI();
}
function restart() {
  state = createGame();
  Object.assign(ui, { buildType: null, selectedTowerId: null, speed: 1 });
  refreshUI();
}

window.addEventListener('keydown', (ev) => {
  const type = Object.keys(TOWER_TYPES).find((t) => TOWER_TYPES[t].key === ev.key);
  if (type) selectBuild(type);
  else if (ev.key === ' ') { ev.preventDefault(); doStartWave(); }
  else if (ev.key === 'Escape') { ui.buildType = null; ui.selectedTowerId = null; refreshUI(); }
  else if (ev.key === 'u') doUpgrade();
  else if (ev.key === 's') doSell();
  else if (ev.key === 't') doCycleTarget();
  else if (ev.key === 'f') toggleSpeed();
});

// ---------- HUD ----------
function refreshUI() {
  $('gold').textContent = state.gold;
  $('lives').textContent = state.lives;
  $('wave').textContent = `${state.wave} / ${MAX_WAVES}`;
  $('speed').textContent = `Tempo ×${ui.speed}`;
  $('start-wave').disabled = state.waveActive || state.status !== 'playing';
  $('start-wave').textContent = state.waveActive ? 'Welle läuft…' : `Welle ${state.wave + 1} starten`;

  // Vorschau der nächsten Welle (nur solange keine Welle läuft)
  const showPreview = !state.waveActive && state.status === 'playing' && state.wave < MAX_WAVES;
  $('wave-preview').hidden = !showPreview;
  if (showPreview) {
    const parts = Object.entries(waveSummary(state.wave + 1))
      .map(([type, n]) => `${n}× ${ENEMY_TYPES[type].name}`);
    $('wave-preview').textContent = `Kommt: ${parts.join(', ')}`;
  }

  for (const btn of shop.children) {
    const def = TOWER_TYPES[btn.dataset.type];
    btn.classList.toggle('active', ui.buildType === btn.dataset.type);
    btn.classList.toggle('poor', state.gold < def.cost);
  }

  const t = state.towers.find((x) => x.id === ui.selectedTowerId);
  $('tower-info').hidden = !t;
  if (t) {
    const s = towerStats(t);
    const up = upgradeCost(t);
    $('ti-name').textContent = `${s.name} (Stufe ${t.level})`;
    $('ti-stats').textContent = `Schaden ${Math.round(s.damage)} · Reichweite ${s.range.toFixed(1)} · ${(1 / s.rate).toFixed(1)} Schuss/s`;
    $('upgrade').textContent = up === null ? 'Max. Stufe' : `Verbessern (${up} 💰)`;
    $('upgrade').disabled = up === null || state.gold < up;
    $('target-mode').textContent = `Ziel: ${TARGET_MODE_NAMES[t.targetMode]} (T)`;
    $('sell').textContent = `Verkaufen (+${sellValue(t)} 💰)`;
  }

  $('message').textContent = ui.messageTtl > 0 ? ui.message : '';

  const over = $('overlay');
  over.hidden = state.status === 'playing';
  if (state.status === 'won') $('overlay-title').textContent = '🏆 Gewonnen!';
  if (state.status === 'lost') $('overlay-title').textContent = '💀 Verloren';
  $('overlay-stats').textContent = `Welle ${state.wave} · ${state.kills} Gegner besiegt`;
}

// ---------- Game Loop ----------
let last = performance.now();
let hudTimer = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // Bei hoher Geschwindigkeit mehrere kleine Schritte statt einem großen.
  for (let i = 0; i < ui.speed; i++) update(state, dt);
  ui.messageTtl -= dt;
  render(ctx, state, ui);
  hudTimer -= dt;
  if (hudTimer <= 0) { refreshUI(); hudTimer = 0.1; }
  requestAnimationFrame(frame);
}
refreshUI();
requestAnimationFrame(frame);
