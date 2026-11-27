// Verbindet Spiel-Logik, Rendering und Bedienung (DOM, Maus, Tastatur).
import { TILE, VIEW_WIDTH, VIEW_HEIGHT, VIEW_FIT, FIGURE_STYLE, SHOP_CARD, TOWER_TYPES, ENEMY_TYPES, MAX_WAVES, MAPS, SPEED_STEPS, TARGET_MODES, TARGET_MODE_NAMES, MAX_SUBSTEP, LOW_LIVES, ABILITIES, ICON, COIN_BURST, waveSummary, meteorText } from './config.js';
import {
  createGame, stepGame, togglePause, buildTower, upgradeTower, sellTower, setTargetMode, startWave,
  useAbility, abilityCooldownLeft, canBuild, towerAt, towerStats, upgradeCost, sellValue,
} from './game.js';
import { renderView, drawTower, paintedStatus } from './render.js';
import { heartStates, abilityView, overheatNote, startButtonView } from './hud.js';
import { drawIcon } from './render-icons.js';
import { buildTapStep, aimStep, fieldPoint, canvasSize } from './input.js';
import { createSoundTracker, collectSounds, loadSoundOn, saveSoundOn } from './sound-events.js';
import { unlockAudio, setSoundOn, playSound, updateMusic } from './audio.js';
import { loadProgress, saveProgress, recordResult, isUnlocked, mapProgress, starText, resultLines, startMap, mapAfterResult, MAP_ORDER } from './progress.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_WIDTH; // Stil 1: Feld + Rand (Wald, Burg, Fahne); HiDPI-Größe setzt fitCanvas()
canvas.height = VIEW_HEIGHT;
const ctx = canvas.getContext('2d');

// ---------- HiDPI und Größe des Canvas ----------
// Breites Layout (Seitenpanel daneben): Canvas so groß, wie Breite neben dem Panel und Fensterhöhe erlauben
// (Turm-Panel darunter bleibt ohne Scrollen sichtbar).
// Schmal (Panel darunter): volle Breite, höchstens VIEW_FIT.baseWidth (wie bisher). Backing-Store = CSS-Größe x Pixeldichte.
const view = { sx: 1, sy: 1 };
const wideQuery = window.matchMedia('(min-width: 1141px)');
function fitBoard() {
  const board = document.querySelector('.board');
  const main = board.parentElement;
  const cs = getComputedStyle(main);
  const border = canvas.offsetWidth - canvas.clientWidth;
  let availW = main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - border;
  let cssW = Math.min(availW, VIEW_FIT.baseWidth);
  if (wideQuery.matches) {
    const aside = document.querySelector('main > aside');
    availW -= (aside ? aside.offsetWidth : 0) + (parseFloat(cs.columnGap) || 0);
    const top = canvas.getBoundingClientRect().top + window.scrollY + border / 2;
    const availH = window.innerHeight - top - border / 2 - VIEW_FIT.panelBelow - VIEW_FIT.bottomGap;
    cssW = Math.max(canvasSize(availW, availH, 1).cssW, Math.min(availW, VIEW_FIT.baseWidth));
  }
  board.style.setProperty('--board-w', `${Math.floor(cssW) + border}px`);
}
// Backing-Store an die tatsächliche Anzeigegröße (inkl. Zoom) und Pixeldichte anpassen
function fitCanvas() {
  const s = canvasSize(canvas.clientWidth, Infinity, window.devicePixelRatio || 1);
  if (canvas.width !== s.width || canvas.height !== s.height) { canvas.width = s.width; canvas.height = s.height; }
  view.sx = s.sx;
  view.sy = s.sy;
}
function relayout() { fitBoard(); fitCanvas(); }
// Wechsel der Pixeldichte (Fenster auf anderen Monitor, Browser-Zoom): Abfrage gilt nur für den aktuellen Wert, daher neu anmelden
function watchDpr() {
  const q = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  q.addEventListener('change', () => { relayout(); watchDpr(); }, { once: true });
}
window.addEventListener('resize', relayout);
if (typeof ResizeObserver === 'function') new ResizeObserver(fitCanvas).observe(canvas);
relayout();
watchDpr();
// Stil 1: Schrift der Stufenmarken früh laden (Canvas-Text löst das Laden selbst nicht aus)
if (document.fonts && document.fonts.load) document.fonts.load('14px "Lilita One"').catch(() => {});

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
// Startkarte merken (B-101): zuletzt gewählte bzw. neueste freigeschaltete Karte. Testmodus bleibt bei der ersten.
if (!TEST_MODE) {
  mapId = startMap(progress);
  state = createGame({ mapId });
}
// ---------- Ton (B-113) ----------
// Eigener Speicherzugriff: die Ton-Wahl gilt auch auf der Testseite (kein Spielfortschritt).
function soundStorage() {
  try { return window.localStorage; } catch { return null; }
}
ui.soundOn = loadSoundOn(soundStorage());
setSoundOn(ui.soundOn);
const soundTracker = createSoundTracker();
// AudioContext erst nach der ersten Nutzeraktion (Autoplay-Regeln)
for (const evName of ['pointerdown', 'keydown']) window.addEventListener(evName, unlockAudio, { capture: true });

// Merker: Ergebnis dieses Spiels schon gespeichert? (refreshUI läuft alle 0,1 s)
let resultSaved = false;
let resultText = []; // Zeilen fürs Overlay (resultLines)

// Für Tests und Neugierige: im Browser-Konsole `__game` eintippen.
window.__game = () => state;
window.__ui = ui;
window.__painted = () => paintedStatus(state.mapId); // Stil 1: 'ready', sobald der gemalte Hintergrund gerastert ist

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
// Knopf im Turm-Panel: "Verbessern (38 Gold) (U)" am Desktop, auf dem Handy zweizeilig ohne Klammern und Kürzel
const actionHtml = (label, cost, key) => `<span class="act-label">${label}</span> `
  + `<span class="act-cost"><span class="paren">(</span>${cost}<span class="paren">)</span></span> <span class="key">(${key})</span>`;

// ---------- Turm-Leiste ----------
// Mini-Turm als Kartenbild: nutzt dieselbe Zeichenfunktion wie das Spielfeld (kein extra Grafik-Aufwand).
const ICON_SIZE = 48;
function drawTowerIcon(cv, type) {
  const c = cv.getContext('2d');
  // Die Türme sind unterschiedlich hoch: jeder Typ hat eigene Skalierung und Verschiebung nach unten
  const st = FIGURE_STYLE.icon[type];
  const k = st.scale;
  c.translate(ICON_SIZE / 2, ICON_SIZE / 2 + 2 + st.dy);
  c.scale(k, k);
  c.translate(-TILE / 2, -TILE / 2);
  drawTower(c, { type, x: TILE / 2, y: TILE / 2, level: 1, cooldown: 0, angle: -Math.PI / 4 }, false);
}
const shop = $('shop');
// Kartenfarben aus config.js (B-070): camelCase -> --card-kebab-case
for (const [k, v] of Object.entries(SHOP_CARD)) {
  if (typeof v === 'string') shop.style.setProperty(`--card-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, v);
}
for (const [type, def] of Object.entries(TOWER_TYPES)) {
  const btn = document.createElement('button');
  btn.className = 'tower-btn';
  btn.dataset.type = type;
  btn.innerHTML = `<canvas class="t-icon" width="${ICON_SIZE}" height="${ICON_SIZE}"></canvas>
    <span class="t-name">${def.name} <kbd class="key">${def.key}</kbd></span>
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
// Stil 1: Feldkoordinaten ohne den Rand (fieldPoint in input.js)
function tileFromEvent(ev) {
  const p = fieldPoint(ev.clientX, ev.clientY, canvas.getBoundingClientRect());
  return { col: p.col, row: p.row, inField: p.inField };
}

function pointFromEvent(ev) {
  const p = fieldPoint(ev.clientX, ev.clientY, canvas.getBoundingClientRect());
  return { x: p.x, y: p.y };
}

// Pointer-Events statt nur Maus: so gibt es auch auf Touch eine Vorschau der Kachel.
let lastPointerType = 'mouse';
canvas.addEventListener('pointerdown', (ev) => { lastPointerType = ev.pointerType; });
canvas.addEventListener('pointermove', (ev) => {
  const { col, row, inField } = tileFromEvent(ev);
  ui.hoverPx = pointFromEvent(ev);
  ui.hover = inField ? { col, row, ok: canBuild(state, col, row).ok } : null;
});
// Bei Touch feuert pointerleave direkt nach dem Loslassen: dort die Vorschau behalten.
canvas.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') ui.hover = null; });
canvas.addEventListener('click', (ev) => {
  if (ui.aiming && !tileFromEvent(ev).inField) return; // Meteor nur aufs Feld, im Rand bleibt der Zielmodus
  const aim = aimStep(ui.aiming, 'click');
  if (aim.fire) {
    ui.aiming = false;
    const pt = pointFromEvent(ev);
    const res = useAbility(state, 'meteor', pt.x, pt.y);
    if (!res.ok) flash(res.reason);
    refreshUI();
    return;
  }
  const { col, row, inField } = tileFromEvent(ev);
  if (!inField) { // Klick in den Rand: nichts bauen, nur Auswahl aufheben
    ui.selectedTowerId = null;
    ui.pending = null;
    refreshUI();
    return;
  }
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
      else if (res.tower.overheated) flash(`${overheatNote(res.tower)} (neben Lava)`, 'info'); // B-030
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
// Beschriftung mit Sternen, gesperrte Karten mit Zusatz "(gesperrt)" und nicht wählbar.
// <option> kann kein Bild zeigen, darum Text statt Schloss-Emoji (B-096).
function refreshMapOptions() {
  for (const opt of mapSelect.options) {
    const name = MAPS[opt.value].name;
    const open = mapOpen(opt.value);
    opt.disabled = !open;
    opt.textContent = open ? `${name} ${starText(mapProgress(progress, opt.value).stars)}` : `${name} (gesperrt)`;
  }
}
refreshMapOptions();
mapSelect.value = state.mapId;
mapSelect.addEventListener('change', () => {
  if (state.wave !== 0 || state.waveActive || !mapOpen(mapSelect.value)) { mapSelect.value = state.mapId; return; }
  mapId = mapSelect.value;
  // Gewählte Karte merken (B-101); im Testmodus gibt es keinen Speicher.
  progress.lastMap = mapId;
  saveProgress(getStorage(), progress);
  restart();
});
$('speed').addEventListener('click', toggleSpeed);
$('pause').addEventListener('click', doTogglePause);
$('upgrade').addEventListener('click', doUpgrade);
$('sell').addEventListener('click', doSell);
$('target-mode').addEventListener('click', doCycleTarget);
// Nach dem Schließen geht der Fokus auf die Shop-Karte des eben gezeigten Turmtyps: der ×-Knopf verschwindet,
// sonst fiele der Fokus auf <body> und Tab begänne wieder oben. Die Karte gehört zum Turm und liegt in der
// Tab-Reihenfolge. Das Spielfeld (Canvas) wäre nur mit tabindex fokussierbar und zeigte dann bei jedem
// Tastendruck einen Fokusrahmen.
$('ti-close').addEventListener('click', () => {
  const type = state.towers.find((t) => t.id === ui.selectedTowerId)?.type;
  ui.selectedTowerId = null;
  refreshUI();
  shop.querySelector(`.tower-btn[data-type="${type}"]`)?.focus({ preventScroll: true });
});
// Handy-Leiste (fest unten): echte Höhe als --tower-info-h, damit main genug Platz darunter lässt (auch bei großer Schrift)
const towerInfo = $('tower-info');
if (typeof ResizeObserver === 'function') {
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--tower-info-h', `${Math.ceil(towerInfo.getBoundingClientRect().height)}px`);
  }).observe(towerInfo);
}
$('restart').addEventListener('click', restart);
$('zoom').addEventListener('click', toggleZoom);
$('sound').addEventListener('click', toggleSound);

function toggleSound() {
  ui.soundOn = !ui.soundOn;
  setSoundOn(ui.soundOn);
  if (ui.soundOn) unlockAudio(); // Klick bzw. Taste ist die Nutzeraktion
  saveSoundOn(soundStorage(), ui.soundOn);
  refreshUI();
}

// Zoom (mobil): Spielfeld auf doppelte Breite, im Rahmen verschiebbar. Größere Kacheln = treffsicheres Tippen.
function toggleZoom() {
  const on = document.querySelector('.board').classList.toggle('zoomed');
  $('zoom').setAttribute('aria-pressed', String(on));
  $('zoom-label').textContent = on ? 'Normal' : 'Zoom';
}

function doStartWave() {
  const res = startWave(state);
  if (!res.ok) flash(res.reason);
  if (res.ok && res.bonus > 0) {
    coinBurst(res.bonus);
    flash(`Frühstart-Bonus: +${res.bonus} Gold`, 'info');
  }
  refreshUI();
}
// B-123: Münzen explodieren aus der Goldanzeige in alle Richtungen und fallen, dazu „+Betrag“ und Münzklang.
// Bahnen per CSS-Variablen (Animation in style.css, ohne Bewegung bei reduced motion).
function coinBurst(amount) {
  const item = $('gold').closest('.hud-item');
  const pop = document.createElement('span');
  pop.className = 'gold-pop';
  pop.setAttribute('aria-hidden', 'true');
  const { count, minDist, maxDist, fall, duration, stagger } = COIN_BURST;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const coin = document.createElement('span');
    coin.className = 'gold-coin';
    coin.innerHTML = iconHtml('gold', 'inline');
    coin.style.setProperty('--dx', `${(Math.cos(angle) * dist).toFixed(1)}px`);
    coin.style.setProperty('--dy', `${(Math.sin(angle) * dist * 0.8).toFixed(1)}px`);
    coin.style.setProperty('--fall', `${fall}px`);
    coin.style.setProperty('--spin', `${Math.random() < 0.5 ? -1 : 1}`);
    coin.style.animationDuration = `${duration}s`;
    coin.style.animationDelay = `${(Math.random() * stagger).toFixed(2)}s`;
    pop.appendChild(coin);
  }
  const text = document.createElement('b');
  text.textContent = `+${amount}`;
  pop.appendChild(text);
  item.appendChild(pop);
  setTimeout(() => pop.remove(), (duration + stagger) * 1000 + 400);
  item.classList.remove('gold-gain');
  void item.offsetWidth; // Animation neu starten, auch bei schnellen Folge-Starts
  item.classList.add('gold-gain');
  if (ui.soundOn) playSound({ kind: 'coinBurst' });
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
  else if (key === ' ') { ev.preventDefault(); if (!ev.repeat) doStartWave(); } // B-005: gehaltene Taste startet nicht mehrfach
  else if (key === 'escape') { ui.aiming = false; ui.buildType = null; ui.selectedTowerId = null; ui.pending = null; refreshUI(); }
  else if (key === 'u') doUpgrade();
  else if (key === 's') doSell();
  else if (key === 't') doCycleTarget();
  else if (key === 'f') toggleSpeed();
  else if (key === 'p') doTogglePause();
  else if (key === 'm' && !ev.repeat && !ev.ctrlKey && !ev.metaKey) toggleSound();
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
  $('sound-label').textContent = ui.soundOn ? 'Ton an' : 'Ton aus';
  $('sound').setAttribute('aria-pressed', String(ui.soundOn));
  if ($('sound-icon').dataset.icon !== (ui.soundOn ? 'sound' : 'soundOff')) setIcon($('sound-icon'), ui.soundOn ? 'sound' : 'soundOff');
  if ($('pause-icon').dataset.icon !== (state.paused ? 'play' : 'pause')) setIcon($('pause-icon'), state.paused ? 'play' : 'pause');
  mapSelect.disabled = state.wave !== 0 || state.waveActive;
  mapSelect.value = state.mapId;
  // B-005: Während einer Welle bleibt der Knopf bedienbar (vorzeitiger Start mit Bonus), bis zur letzten Welle
  const sb = startButtonView(state);
  $('start-wave').disabled = sb.disabled;
  $('start-label').textContent = sb.label;
  $('start-key').hidden = !sb.showKey;

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
    // B-112: Meteor-Schaden wächst mit der Welle, der Tooltip zeigt den aktuellen Wert
    if (id === 'meteor' && btn.dataset.wave !== String(state.wave)) {
      btn.dataset.wave = String(state.wave);
      btn.title = meteorText(state.wave);
    }
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
    const heat = overheatNote(t); // B-030: steht in der Werte-Zeile, damit es auch auf dem Handy sichtbar bleibt
    $('ti-stats').textContent = `Schaden ${Math.round(s.damage)} · Reichweite ${s.range.toFixed(1)} · ${(1 / s.rate).toFixed(1)} Schuss/s${heat ? ` · ${heat}` : ''}`;
    $('ti-special').textContent = s.special?.text ?? '';
    // Knöpfe (B-056): Beschriftung und Preis als eigene Zeilen-Teile, Klammern und Kürzel
    // fallen auf dem Handy weg (CSS); der zugängliche Name bleibt vollständig (aria-label).
    const sell = sellValue(t);
    const mode = TARGET_MODE_NAMES[t.targetMode];
    setHtml($('upgrade'), up === null ? 'Max. Stufe' : actionHtml('Verbessern', `${up} ${COIN()}`, 'U'));
    $('upgrade').setAttribute('aria-label', up === null ? 'Max. Stufe' : `Verbessern für ${up} Gold (U)`);
    $('upgrade').disabled = up === null || state.gold < up;
    setHtml($('target-mode'), `<span class="act-label">Ziel: ${mode}</span> <span class="key">(T)</span>`);
    $('target-mode').setAttribute('aria-label', `Ziel: ${mode} (T)`);
    setHtml($('sell'), actionHtml('Verkaufen', `+${sell} ${COIN()}`, 'S'));
    $('sell').setAttribute('aria-label', `Verkaufen für ${sell} Gold (S)`);
  }

  $('message').textContent = ui.messageTtl > 0 ? ui.message : '';
  $('message').classList.toggle('info', ui.messageKind === 'info');

  const over = $('overlay');
  over.hidden = state.status === 'playing';
  // B-096: Trophäe bzw. Totenkopf vor dem Text (nur Schmuck, alt leer)
  if (state.status === 'won') setHtml($('overlay-title'), `${iconHtml('trophy', 'result')} Gewonnen!`);
  if (state.status === 'lost') setHtml($('overlay-title'), `${iconHtml('skull', 'result')} Verloren`);
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
  // Nach einem Sieg die nächste Karte vorwählen: „Neues Spiel“ startet dort, gemerkt auch fürs nächste Öffnen.
  mapId = mapAfterResult(progress, state.mapId, state.status);
  if (mapId !== state.mapId) progress.lastMap = mapId;
  saveProgress(getStorage(), progress);
  refreshMapOptions();
  resultText = resultLines(progress, state.mapId, res, before);
  $('restart').textContent = mapId !== state.mapId ? `Weiter: ${MAPS[mapId].name}` : 'Neues Spiel';
}

// ---------- Game Loop ----------
let last = performance.now();
let hudTimer = 0;
function frame(now) {
  const dt = Math.min(MAX_SUBSTEP, (now - last) / 1000);
  last = now;
  // Bei hoher Geschwindigkeit in kleinen Teilschritten simulieren.
  stepGame(state, dt, ui.speed);
  // Töne: Ereignisse immer erkennen (sonst käme nach dem Einschalten ein Schwall), nur bei Ton an abspielen
  for (const ev of collectSounds(soundTracker, state, now / 1000)) if (ui.soundOn) playSound(ev);
  // B-116/B-118: Musik der Karte laden/starten und je nach Spielstatus ein- oder ausblenden
  updateMusic({ status: state.status, paused: state.paused, mapId: state.mapId });
  ui.messageTtl -= dt;
  ctx.setTransform(view.sx, 0, 0, view.sy, 0, 0); // HiDPI: Canvas-Einheiten (VIEW_WIDTH x VIEW_HEIGHT) -> Geräte-px
  renderView(ctx, state, ui);
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
    resume: () => { resultSaved = false; resultText = []; mapId = state.mapId; },
    refresh: refreshUI,
  }));
}
