// Verbindet Spiel-Logik, Rendering und Bedienung (DOM, Maus, Tastatur).
import { TILE, WIDTH, HEIGHT, TOWER_TYPES, ENEMY_TYPES, MAX_WAVES, MAPS, SPEED_STEPS, TARGET_MODES, TARGET_MODE_NAMES, MAX_SUBSTEP, LOW_LIVES, ABILITIES, waveSummary } from './config.js';
import {
  createGame, stepGame, togglePause, buildTower, upgradeTower, sellTower, setTargetMode, startWave,
  useAbility, abilityCooldownLeft, canBuild, towerAt, towerStats, upgradeCost, sellValue,
} from './game.js';
import { render, drawTower } from './render.js';
import { livesText } from './hud.js';
import { buildTapStep, aimStep } from './input.js';

const canvas = document.getElementById('game');
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext('2d');

const $ = (id) => document.getElementById(id);
const ui = { buildType: null, selectedTowerId: null, hover: null, pending: null, aiming: false, hoverPx: null, speed: SPEED_STEPS[0], message: '', messageKind: 'error', messageTtl: 0 };
let mapId;
let state = createGame();

// Für Tests und Neugierige: im Browser-Konsole `__game` eintippen.
window.__game = () => state;
window.__ui = ui;

// ---------- Turm-Leiste ----------
// Mini-Turm als Kartenbild: nutzt dieselbe Zeichenfunktion wie das Spielfeld (kein extra Grafik-Aufwand).
const ICON_SIZE = 48;
const ICON_SCALE = 1.25;
function drawTowerIcon(cv, type) {
  const c = cv.getContext('2d');
  c.translate(ICON_SIZE / 2, ICON_SIZE / 2 + 2);
  c.scale(ICON_SCALE, ICON_SCALE);
  c.translate(-TILE / 2, -TILE / 2);
  drawTower(c, { type, x: TILE / 2, y: TILE / 2, level: 1, cooldown: 0, angle: -Math.PI / 4 }, false);
}
const shop = $('shop');
for (const [type, def] of Object.entries(TOWER_TYPES)) {
  const btn = document.createElement('button');
  btn.className = 'tower-btn';
  btn.dataset.type = type;
  btn.innerHTML = `<canvas class="t-icon" width="${ICON_SIZE}" height="${ICON_SIZE}"></canvas>
    <span class="t-name">${def.name} <kbd>${def.key}</kbd></span>
    <span class="t-cost">${def.cost} 💰</span>
    <span class="t-desc">${def.description}${def.special ? ' ' + def.special.text : ''}</span>`;
  drawTowerIcon(btn.querySelector('.t-icon'), type);
  btn.addEventListener('click', () => selectBuild(type));
  shop.appendChild(btn);
}

// ---------- Fähigkeiten ----------
const abilityBtns = {};
for (const [id, def] of Object.entries(ABILITIES)) {
  const btn = document.createElement('button');
  btn.title = def.text;
  btn.addEventListener('click', () => doAbility(id));
  $('abilities').appendChild(btn);
  abilityBtns[id] = btn;
}

// Meteor braucht ein Ziel (Zielmodus), die anderen lösen sofort aus.
function doAbility(id) {
  if (state.status !== 'playing') return;
  if (id === 'meteor') {
    ui.aiming = aimStep(ui.aiming, 'key').aiming;
    if (ui.aiming) { ui.buildType = null; ui.selectedTowerId = null; ui.pending = null; }
  } else {
    const res = useAbility(state, id);
    if (!res.ok) flash(res.reason);
  }
  refreshUI();
}

function selectBuild(type) {
  ui.aiming = false;
  ui.buildType = ui.buildType === type ? null : type;
  ui.selectedTowerId = null;
  ui.pending = null;
  refreshUI();
}

function flash(msg, kind = 'error') {
  ui.message = msg;
  ui.messageKind = kind;
  ui.messageTtl = 2;
}

// ---------- Maus ----------
function tileFromEvent(ev) {
  const rect = canvas.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * WIDTH;
  const y = ((ev.clientY - rect.top) / rect.height) * HEIGHT;
  return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) };
}

function pointFromEvent(ev) {
  const rect = canvas.getBoundingClientRect();
  return { x: ((ev.clientX - rect.left) / rect.width) * WIDTH, y: ((ev.clientY - rect.top) / rect.height) * HEIGHT };
}

// Pointer-Events statt nur Maus: so gibt es auch auf Touch eine Vorschau der Kachel.
let lastPointerType = 'mouse';
canvas.addEventListener('pointerdown', (ev) => { lastPointerType = ev.pointerType; });
canvas.addEventListener('pointermove', (ev) => {
  const { col, row } = tileFromEvent(ev);
  ui.hoverPx = pointFromEvent(ev);
  ui.hover = { col, row, ok: canBuild(state, col, row).ok };
});
// Bei Touch feuert pointerleave direkt nach dem Loslassen: dort die Vorschau behalten.
canvas.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') ui.hover = null; });
canvas.addEventListener('click', (ev) => {
  const aim = aimStep(ui.aiming, 'click');
  if (aim.fire) {
    ui.aiming = false;
    const pt = pointFromEvent(ev);
    const res = useAbility(state, 'meteor', pt.x, pt.y);
    if (!res.ok) flash(res.reason);
    refreshUI();
    return;
  }
  const { col, row } = tileFromEvent(ev);
  const existing = towerAt(state, col, row);
  if (existing) {
    ui.selectedTowerId = existing.id;
    ui.buildType = null;
    ui.pending = null;
  } else if (ui.buildType) {
    const touch = lastPointerType !== 'mouse';
    const step = buildTapStep(ui.pending, col, row, touch);
    ui.pending = step.pending;
    if (step.action === 'preview') {
      const check = canBuild(state, col, row);
      ui.hover = { col, row, ok: check.ok };
      if (check.ok) flash('Nochmal tippen zum Bauen', 'info');
      else { flash(check.reason); ui.pending = null; }
    } else {
      const res = buildTower(state, ui.buildType, col, row);
      if (!res.ok) flash(res.reason);
      if (touch) ui.hover = null;
    }
  } else {
    ui.selectedTowerId = null;
  }
  refreshUI();
});
canvas.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  ui.aiming = false;
  ui.buildType = null;
  ui.selectedTowerId = null;
  ui.pending = null;
  refreshUI();
});

// ---------- Buttons & Tastatur ----------
$('start-wave').addEventListener('click', doStartWave);

// Kartenauswahl: nur vor Welle 1 möglich
const mapSelect = $('map-select');
for (const [id, def] of Object.entries(MAPS)) {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = def.name;
  mapSelect.appendChild(opt);
}
mapSelect.value = state.mapId;
mapSelect.addEventListener('change', () => {
  if (state.wave !== 0 || state.waveActive) { mapSelect.value = state.mapId; return; }
  mapId = mapSelect.value;
  restart();
});
$('speed').addEventListener('click', toggleSpeed);
$('pause').addEventListener('click', doTogglePause);
$('upgrade').addEventListener('click', doUpgrade);
$('sell').addEventListener('click', doSell);
$('target-mode').addEventListener('click', doCycleTarget);
$('restart').addEventListener('click', restart);
$('zoom').addEventListener('click', toggleZoom);

// Zoom (mobil): Spielfeld auf doppelte Breite, im Rahmen verschiebbar. Größere Kacheln = treffsicheres Tippen.
function toggleZoom() {
  const on = document.querySelector('.board').classList.toggle('zoomed');
  $('zoom').setAttribute('aria-pressed', String(on));
  $('zoom').textContent = on ? '🔍 Normal' : '🔍 Zoom';
}

function doStartWave() {
  const res = startWave(state);
  if (!res.ok) flash(res.reason);
  refreshUI();
}
function doTogglePause() {
  togglePause(state);
  refreshUI();
}
function toggleSpeed() {
  ui.speed = SPEED_STEPS[(SPEED_STEPS.indexOf(ui.speed) + 1) % SPEED_STEPS.length];
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
  state = createGame({ mapId });
  Object.assign(ui, { buildType: null, selectedTowerId: null, pending: null, aiming: false, hoverPx: null, speed: SPEED_STEPS[0] });
  refreshUI();
}

window.addEventListener('keydown', (ev) => {
  const key = ev.key.toLowerCase();
  const type = Object.keys(TOWER_TYPES).find((t) => TOWER_TYPES[t].key === key);
  const ability = Object.keys(ABILITIES).find((a) => ABILITIES[a].key === key);
  if (type) selectBuild(type);
  else if (ability) doAbility(ability);
  else if (key === ' ') { ev.preventDefault(); doStartWave(); }
  else if (key === 'escape') { ui.aiming = false; ui.buildType = null; ui.selectedTowerId = null; ui.pending = null; refreshUI(); }
  else if (key === 'u') doUpgrade();
  else if (key === 's') doSell();
  else if (key === 't') doCycleTarget();
  else if (key === 'f') toggleSpeed();
  else if (key === 'p') doTogglePause();
});

// ---------- HUD ----------
function refreshUI() {
  if (state.status !== 'playing' || state.paused) ui.aiming = false; // Zielmodus nur im laufenden Spiel
  $('gold').textContent = state.gold;
  $('lives').textContent = state.lives;
  $('hearts').textContent = livesText(state.lives);
  $('lives-box').classList.toggle('low', state.status === 'playing' && state.lives <= LOW_LIVES);
  $('wave').textContent = `${state.wave} / ${MAX_WAVES}`;
  $('speed').textContent = `Tempo ×${ui.speed} (F)`;
  $('pause-hint').hidden = !state.paused;
  // Deutliches Banner über dem Spielfeld (nur Anzeige, Bauen bleibt möglich)
  $('pause-banner').hidden = !state.paused;
  $('pause').textContent = state.paused ? '▶ Weiter (P)' : '⏸ Pause (P)';
  mapSelect.disabled = state.wave !== 0 || state.waveActive;
  mapSelect.value = state.mapId;
  $('start-wave').disabled = state.waveActive || state.status !== 'playing';
  $('start-wave').textContent = state.waveActive ? 'Welle läuft…' : `Welle ${state.wave + 1} starten (Leertaste)`;

  // Vorschau der nächsten Welle (nur solange keine Welle läuft)
  const showPreview = !state.waveActive && state.status === 'playing' && state.wave < MAX_WAVES;
  $('wave-preview').hidden = !showPreview;
  if (showPreview) {
    const parts = Object.entries(waveSummary(state.wave + 1))
      .map(([type, n]) => `${n}× ${ENEMY_TYPES[type].name}`);
    $('wave-preview').textContent = `Kommt: ${parts.join(', ')}`;
  }

  for (const [id, def] of Object.entries(ABILITIES)) {
    const a = state.abilities[id];
    const left = abilityCooldownLeft(state, id);
    const used = def.maxUses !== undefined && a.uses >= def.maxUses;
    const status = used ? 'aufgebraucht' : left > 0 ? `${Math.ceil(left)} s` : def.maxUses !== undefined ? `bereit (${def.maxUses - a.uses}×)` : 'bereit';
    abilityBtns[id].textContent = `${def.name} (${def.key.toUpperCase()}) ${status}`;
    abilityBtns[id].disabled = used || left > 0 || state.status !== 'playing';
    abilityBtns[id].classList.toggle('aiming', id === 'meteor' && ui.aiming);
  }

  for (const btn of shop.children) {
    const def = TOWER_TYPES[btn.dataset.type];
    btn.classList.toggle('active', ui.buildType === btn.dataset.type);
    btn.classList.toggle('poor', state.gold < def.cost);
  }

  const t = state.towers.find((x) => x.id === ui.selectedTowerId);
  $('tower-info').hidden = !t;
  if (t) {
    const s = towerStats(t, state.modifiers);
    const up = upgradeCost(t);
    $('ti-name').textContent = `${s.name} (Stufe ${t.level})`;
    $('ti-stats').textContent = `Schaden ${Math.round(s.damage)} · Reichweite ${s.range.toFixed(1)} · ${(1 / s.rate).toFixed(1)} Schuss/s`;
    $('upgrade').textContent = up === null ? 'Max. Stufe' : `Verbessern (${up} 💰)`;
    $('upgrade').disabled = up === null || state.gold < up;
    $('target-mode').textContent = `Ziel: ${TARGET_MODE_NAMES[t.targetMode]} (T)`;
    $('sell').textContent = `Verkaufen (+${sellValue(t)} 💰)`;
  }

  $('message').textContent = ui.messageTtl > 0 ? ui.message : '';
  $('message').classList.toggle('info', ui.messageKind === 'info');

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
  const dt = Math.min(MAX_SUBSTEP, (now - last) / 1000);
  last = now;
  // Bei hoher Geschwindigkeit in kleinen Teilschritten simulieren.
  stepGame(state, dt, ui.speed);
  ui.messageTtl -= dt;
  render(ctx, state, ui);
  hudTimer -= dt;
  if (hudTimer <= 0) { refreshUI(); hudTimer = 0.1; }
  requestAnimationFrame(frame);
}
refreshUI();
requestAnimationFrame(frame);
