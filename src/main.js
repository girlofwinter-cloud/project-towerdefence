// Verbindet Spiel-Logik, Rendering und Bedienung (DOM, Maus, Tastatur).
import { TILE, WIDTH, HEIGHT, ARROW_TOWER, TOWER_STYLE, TOWER_TYPES, ENEMY_TYPES, MAX_WAVES, MAPS, SPEED_STEPS, TARGET_MODES, TARGET_MODE_NAMES, MAX_SUBSTEP, LOW_LIVES, ABILITIES, ICON, waveSummary } from './config.js';
import {
  createGame, stepGame, togglePause, buildTower, upgradeTower, sellTower, setTargetMode, startWave,
  useAbility, abilityCooldownLeft, canBuild, towerAt, towerStats, upgradeCost, sellValue,
} from './game.js';
import { render, drawTower } from './render.js';
import { heartStates, abilityView } from './hud.js';
import { drawIcon } from './render-icons.js';
import { buildTapStep, aimStep } from './input.js';
import { loadProgress, saveProgress, recordResult, isUnlocked, mapProgress, starText, resultLines, MAP_ORDER } from './progress.js';

const canvas = document.getElementById('game');
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext('2d');

const $ = (id) => document.getElementById(id);
const ui = { buildType: null, selectedTowerId: null, hover: null, pending: null, aiming: false, hoverPx: null, speed: SPEED_STEPS[0], message: '', messageKind: 'error', messageTtl: 0 };
let mapId;
let state = createGame();

// prefers-reduced-motion (B-067): schaltet das Wackeln beim Boss-Auftritt aus (render liest ui.reducedMotion)
const motionQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
ui.reducedMotion = !!(motionQuery && motionQuery.matches);
if (motionQuery && motionQuery.addEventListener) motionQuery.addEventListener('change', (ev) => { ui.reducedMotion = ev.matches; });

// Testseite (test.html bzw. index.html?test): alle Karten offen, nichts speichern, Werkzeug-Panel.
const TEST_MODE = new URLSearchParams(location.search).has('test');

// ---------- Fortschritt (B-093) ----------
// Schon der Zugriff auf window.localStorage kann werfen (privater Modus): dann ohne Speicher weiter.
function getStorage() {
  if (TEST_MODE) return null; // Testmodus: echter Fortschritt bleibt unberührt
  try { return window.localStorage; } catch { return null; }
}
const progress = loadProgress(getStorage());
const mapOpen = (id) => TEST_MODE || isUnlocked(progress, id);
// Merker: Ergebnis dieses Spiels schon gespeichert? (refreshUI läuft alle 0,1 s)
let resultSaved = false;
let resultText = []; // Zeilen fürs Overlay (resultLines)

// Für Tests und Neugierige: im Browser-Konsole `__game` eintippen.
window.__game = () => state;
window.__ui = ui;

// ---------- Icons (B-069) ----------
// Icons werden einmal je Name und Größe auf ein Canvas gezeichnet und als Bild-URL wiederverwendet.
const ICON_DPR = Math.min(ICON.maxDpr, Math.max(1, Math.ceil(window.devicePixelRatio || 1)));
const iconCache = new Map();
function iconUrl(name, size) {
  const key = `${name}@${size}`;
  let url = iconCache.get(key);
  if (!url) {
    const px = size * ICON_DPR;
    const cv = document.createElement('canvas');
    cv.width = px;
    cv.height = px;
    drawIcon(cv.getContext('2d'), name, px / 2, px / 2, px);
    url = cv.toDataURL();
    iconCache.set(key, url);
  }
  return url;
}
// <img> eines Icons; alt leer = nur Schmuck (Text daneben trägt den Namen)
function iconHtml(name, sizeKey, alt = '') {
  const size = ICON.sizes[sizeKey];
  return `<img class="ico ico-${sizeKey}" src="${iconUrl(name, size)}" width="${size}" height="${size}" alt="${alt}">`;
}
function setIcon(img, name) {
  const sizeKey = Object.keys(ICON.sizes).find((k) => img.classList.contains(`ico-${k}`)) ?? 'inline';
  const size = ICON.sizes[sizeKey];
  img.width = size;
  img.height = size;
  img.dataset.icon = name;
  img.src = iconUrl(name, size);
}
// Statisches Markup (index.html): <img data-icon="..."> mit Bildern füllen
for (const img of document.querySelectorAll('img[data-icon]')) setIcon(img, img.dataset.icon);
// innerHTML nur bei Änderung neu setzen (refreshUI läuft alle 0,1 s)
function setHtml(el, html) {
  if (el.dataset.html === html) return;
  el.dataset.html = html;
  el.innerHTML = html;
}
const COIN = () => iconHtml('gold', 'inline', 'Gold');

// ---------- Turm-Leiste ----------
// Mini-Turm als Kartenbild: nutzt dieselbe Zeichenfunktion wie das Spielfeld (kein extra Grafik-Aufwand).
const ICON_SIZE = 48;
function drawTowerIcon(cv, type) {
  const c = cv.getContext('2d');
  // Die Türme sind unterschiedlich hoch: jeder Typ hat eigene Skalierung und Verschiebung nach unten
  const st = type === 'arrow' ? ARROW_TOWER : TOWER_STYLE[type];
  const k = st.iconScale;
  c.translate(ICON_SIZE / 2, ICON_SIZE / 2 + 2 + st.iconDy);
  c.scale(k, k);
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
    <span class="t-cost">${def.cost} ${COIN()}</span>
    <span class="t-desc">${def.description}</span>`;
  // Fähigkeiten-Text: als Tooltip der Karte (und im Turm-Info-Panel des gewählten Turms)
  if (def.special) btn.title = def.special.text;
  drawTowerIcon(btn.querySelector('.t-icon'), type);
  btn.addEventListener('click', () => selectBuild(type));
  shop.appendChild(btn);
}

// ---------- Fähigkeiten ----------
const abilityBtns = {};
for (const [id, def] of Object.entries(ABILITIES)) {
  const btn = document.createElement('button');
  btn.className = 'ability-btn';
  btn.dataset.ability = id;
  btn.title = def.text;
  // Großes Symbol, Kurzname mit Tastenkürzel, Ladungs-Abzeichen, Abklingbalken (B-058)
  btn.innerHTML = `${iconHtml(id, 'ability')}<span class="ab-label">${def.short} <span class="key">${def.key.toUpperCase()}</span></span>`
    + '<span class="ab-badge"></span><span class="ab-bar"><span class="ab-fill"></span></span>';
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
for (const id of Object.keys(MAPS)) {
  const opt = document.createElement('option');
  opt.value = id;
  mapSelect.appendChild(opt);
}
// Beschriftung mit Sternen, gesperrte Karten mit Schloss und nicht wählbar.
function refreshMapOptions() {
  for (const opt of mapSelect.options) {
    const name = MAPS[opt.value].name;
    const open = mapOpen(opt.value);
    opt.disabled = !open;
    opt.textContent = open ? `${name} ${starText(mapProgress(progress, opt.value).stars)}` : `🔒 ${name}`;
  }
}
refreshMapOptions();
mapSelect.value = state.mapId;
mapSelect.addEventListener('change', () => {
  if (state.wave !== 0 || state.waveActive || !mapOpen(mapSelect.value)) { mapSelect.value = state.mapId; return; }
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
  $('zoom-label').textContent = on ? 'Normal' : 'Zoom';
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
  // Gesperrte Karte: auf die erste Karte zurückfallen.
  if (mapId !== undefined && !mapOpen(mapId)) mapId = MAP_ORDER[0];
  state = createGame({ mapId });
  resultSaved = false;
  resultText = [];
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
  renderHearts($('hearts'), state.lives);
  $('lives-box').classList.toggle('low', state.status === 'playing' && state.lives <= LOW_LIVES);
  $('wave').textContent = `${state.wave} / ${MAX_WAVES}`;
  $('speed-label').textContent = `Tempo ×${ui.speed}`;
  $('pause-hint').hidden = !state.paused;
  // Deutliches Banner über dem Spielfeld (nur Anzeige, Bauen bleibt möglich)
  $('pause-banner').hidden = !state.paused;
  $('pause-label').textContent = state.paused ? 'Weiter' : 'Pause';
  if ($('pause-icon').dataset.icon !== (state.paused ? 'play' : 'pause')) setIcon($('pause-icon'), state.paused ? 'play' : 'pause');
  mapSelect.disabled = state.wave !== 0 || state.waveActive;
  mapSelect.value = state.mapId;
  $('start-wave').disabled = state.waveActive || state.status !== 'playing';
  $('start-label').textContent = state.waveActive ? 'Welle läuft…' : `Welle ${state.wave + 1} starten`;
  $('start-key').hidden = state.waveActive;

  // Vorschau der nächsten Welle (nur solange keine Welle läuft)
  const showPreview = !state.waveActive && state.status === 'playing' && state.wave < MAX_WAVES;
  $('wave-preview').hidden = !showPreview;
  if (showPreview) {
    const parts = Object.entries(waveSummary(state.wave + 1))
      .map(([type, n]) => `${n}× ${ENEMY_TYPES[type].name}`);
    $('wave-preview').textContent = `Kommt: ${parts.join(', ')}`;
  }

  for (const [id, def] of Object.entries(ABILITIES)) {
    const btn = abilityBtns[id];
    const v = abilityView(def, state.abilities[id].uses, abilityCooldownLeft(state, id));
    btn.setAttribute('aria-label', v.aria);
    btn.dataset.state = v.state;
    btn.style.setProperty('--fill', v.fill.toFixed(3));
    btn.querySelector('.ab-badge').textContent = v.badge;
    btn.disabled = v.state !== 'ready' || state.status !== 'playing';
    btn.classList.toggle('aiming', id === 'meteor' && ui.aiming);
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
    $('ti-special').textContent = s.special?.text ?? '';
    setHtml($('upgrade'), up === null ? 'Max. Stufe' : `Verbessern (${up} ${COIN()})`);
    $('upgrade').disabled = up === null || state.gold < up;
    $('target-mode').textContent = `Ziel: ${TARGET_MODE_NAMES[t.targetMode]} (T)`;
    setHtml($('sell'), `Verkaufen (+${sellValue(t)} ${COIN()})`);
  }

  $('message').textContent = ui.messageTtl > 0 ? ui.message : '';
  $('message').classList.toggle('info', ui.messageKind === 'info');

  const over = $('overlay');
  over.hidden = state.status === 'playing';
  if (state.status === 'won') $('overlay-title').textContent = '🏆 Gewonnen!';
  if (state.status === 'lost') $('overlay-title').textContent = '💀 Verloren';
  $('overlay-stats').textContent = `Welle ${state.wave} · ${state.kills} Gegner besiegt`;
  if (state.status !== 'playing' && !resultSaved) saveResult();
  renderResultLines($('overlay-progress'), resultText);
}

// Herzreihe als Icons (gefüllt/leer); nur neu bauen, wenn sich die Lebenszahl ändert.
function renderHearts(el, lives) {
  const key = String(lives);
  if (el.dataset.key === key) return;
  el.dataset.key = key;
  setHtml(el, heartStates(lives).map((full) => iconHtml(full ? 'heart' : 'heartEmpty', 'heart')).join(''));
}

// Erste Zeile normal, weitere als hervorgehobene Meldungen (nur neu bauen, wenn sich etwas ändert).
function renderResultLines(el, lines) {
  const key = lines.join('\n');
  if (el.dataset.key === key) return;
  el.dataset.key = key;
  el.replaceChildren(...lines.map((text, i) => {
    const span = document.createElement('span');
    span.className = i === 0 ? 'result-line' : 'result-line result-highlight';
    span.textContent = text;
    return span;
  }));
}

// Genau einmal pro Spielende: Ergebnis eintragen, speichern und Overlay-Text bauen.
function saveResult() {
  resultSaved = true;
  const before = { ...mapProgress(progress, state.mapId) };
  const res = recordResult(progress, { mapId: state.mapId, status: state.status, wave: state.wave, lives: state.lives });
  saveProgress(getStorage(), progress);
  refreshMapOptions();
  resultText = resultLines(progress, state.mapId, res, before);
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

if (TEST_MODE) {
  import('./test-page.js').then((m) => m.mountTestPanel({
    getState: () => state,
    ui,
    restartOn: (id) => { mapId = id; restart(); },
    // Weiterspielen nach erzwungenem Spielende: Overlay-Text des alten Ergebnisses verwerfen.
    resume: () => { resultSaved = false; resultText = []; },
    refresh: refreshUI,
  }));
}
