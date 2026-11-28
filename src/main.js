// Verbindet Spiel-Logik, Rendering und Bedienung (DOM, Maus, Tastatur).
import { BADGE_TIERS, BOSS_BAR, TILE, FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT, PAINTED_STYLE, FIGURE_STYLE, SHOP_CARD, TOWER_TYPES, ENEMY_TYPES, MAX_WAVES, MAPS, SPEED_STEPS, TARGET_MODES, MAX_SUBSTEP, LOW_LIVES, ABILITIES, ICON, VIEW_FIT, COIN_BURST, HUD_BAR, SOUND, waveSummary, meteorText } from './config.js';
import {
  createGame, stepGame, togglePause, buildTower, upgradeTower, sellTower, setTargetMode, startWave, setAutoWave,
  useAbility, abilityCooldownLeft, abilityMaxUses, canBuild, towerAt, towerStats, masterInfo, checkGoldCondition, maxLives,
} from './game.js';
import { renderView, drawTower, paintedStatus, paintedImage, setPaintedExtent, flagBoxes } from './render.js';
import { abilityView, overheatNote, startButtonView, waveProgress, loadAutoWave, saveAutoWave, goldGoalView, goldMissedText } from './hud.js';
import { drawIcon } from './render-icons.js';
import { buildTapStep, aimStep, fieldPoint, canvasSize, moveFocusTile, rotatePauseStep, fullscreenGate } from './input.js';
import { createSoundTracker, collectSounds, loadSoundOn, saveSoundOn, loadVolumes, saveVolumes } from './sound-events.js';
import { unlockAudio, setSoundOn, setVolumes, playSound, updateMusic } from './audio.js';
import { loadProgress, saveProgress, recordResult, isUnlocked, isNightmareUnlocked, nightmareResultLines, nightmareProgress, mapProgress, starText, resultLines, startMap, mapAfterResult, starsFor, MAP_ORDER } from './progress.js';
import { mountStartScreen, mountCosmeticsMenu, endView, starsHtml, STAR_COUNT, nightmareWinView, nightmareLoseView, loseRingSvg, mapSelectOptions, mapSelectValue, parseMapSelectValue } from './screens.js';
import { activeCosmetics } from './cosmetics.js';
import { badgeSvg } from './badge-art.js';
import { fullscreenControl } from './fullscreen.js';
import { createBossBars } from './boss-bar.js';
import { nmWoodKind, nmWoodDeco, nmPlaquePlacement, NM_STYLE_NAME } from './nm-wood.js';
import { ringRadius, tileCenterPx, ringCenter, infoOnLeft, pickTower, buildRingView, towerRingView } from './ring-menu.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_WIDTH; // Stil 1: Feld + Rand (Wald, Burg, Fahne); HiDPI-Größe setzt fitCanvas()
canvas.height = VIEW_HEIGHT;
const ctx = canvas.getContext('2d');

// C1: Vollbild. Die Lage rechnet style.css (--u) aus diesen Maßen; hier nur die Zahlen aus config.js setzen.
for (const [k, v] of Object.entries({ 'view-w': VIEW_WIDTH, 'view-h': VIEW_HEIGHT, 'field-w': VIEW_WIDTH - 2 * FRAME_MARGIN, 'field-h': VIEW_HEIGHT - 2 * FRAME_MARGIN, frame: FRAME_MARGIN })) {
  document.documentElement.style.setProperty(`--${k}`, String(v));
}

// ---------- HiDPI ----------
// Die Anzeigegröße des Canvas legt allein style.css fest (Vollbild und Handy quer: --cw x --ch).
// Hier nur der Backing-Store = Anzeigegröße x Pixeldichte (höchstens VIEW_FIT.maxDpr und maxSide je Seite, canvasSize in input.js);
// frame() zeichnet mit setTransform(view.sx, ...) weiter in Canvas-Einheiten (VIEW_WIDTH x VIEW_HEIGHT).
const view = { sx: 1, sy: 1 };
const compactQuery = window.matchMedia('(max-width: 759.98px), (max-height: 519.98px)'); // = Kompakt-Schwelle in style.css
// B-137: Handy quer (Feld mittig, Landschaft bis an den Rand) und Drehhinweis im Hochformat, gleiche Abfragen wie style.css
const landscapeQuery = window.matchMedia('(max-height: 519.98px) and (orientation: landscape)');
const rotateQuery = window.matchMedia('(max-width: 759.98px) and (orientation: portrait) and (pointer: coarse)');
// Gemalte Seitenzonen (scharf, deckungsgleich mit dem Canvas): Vollbild und Handy quer; sonst unscharfes Bild dahinter
const paintedSides = () => !compactQuery.matches || landscapeQuery.matches;
function fitCanvas() {
  const s = canvasSize(canvas.clientWidth, Infinity, window.devicePixelRatio || 1, compactQuery.matches ? VIEW_FIT.maxSide : Infinity);
  if (canvas.width !== s.width || canvas.height !== s.height) { canvas.width = s.width; canvas.height = s.height; }
  view.sx = s.sx;
  view.sy = s.sy;
  afterFit();
}
let afterFit = () => {}; // misst die Seitenzonen (unten gesetzt, sobald #backdrop bereit ist)
// Wechsel der Pixeldichte (Fenster auf anderen Monitor, Browser-Zoom): Abfrage gilt nur für den aktuellen Wert, daher neu anmelden
function watchDpr() {
  const q = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  q.addEventListener('change', () => { fitCanvas(); watchDpr(); }, { once: true });
}
window.addEventListener('resize', fitCanvas);
if (typeof ResizeObserver === 'function') new ResizeObserver(fitCanvas).observe(canvas);
fitCanvas();
watchDpr();
// Stil 1: Schrift der Stufenmarken früh laden (Canvas-Text löst das Laden selbst nicht aus)
if (document.fonts && document.fonts.load) document.fonts.load('14px "Lilita One"').catch(() => {});
// C-Abnahme 1: Seitenzonen. Im Vollbild ist #backdrop dieselbe gemalte Fläche wie der Canvas (render.js rastert Canvas plus
// Seitenzonen in einem Bild, der Canvas zeigt davon den Ausschnitt 1:1), daher keine Naht an der Canvas-Kante.
// Handy quer genauso (Landschaft bis an den Rand); nur das schmale Fenster (Kompakt) behält das unscharfe, verkleinerte Bild.
const backdrop = document.getElementById('backdrop');
let backdropFor = null;
// Seitenzonen in Geräte-px messen und an render.js melden (auf PAINTED_STYLE.sideZone.quantum aufgerundet: seltener neu rastern)
function measureExtent() {
  if (!paintedSides()) { setPaintedExtent(null); return; }
  const r = canvas.getBoundingClientRect();
  if (!(r.width > 0)) return;
  const k = canvas.width / r.width, q = PAINTED_STYLE.sideZone.quantum;
  const up = (css) => Math.max(0, Math.ceil((css * k) / q) * q);
  setPaintedExtent({ l: up(r.left), t: up(r.top), r: up(window.innerWidth - r.right), b: up(window.innerHeight - r.bottom) });
}
function drawBackdrop() {
  const img = paintedImage(state.mapId);
  if (!img) return;
  const compact = !paintedSides();
  const key = `${img.key}|${compact}|${window.innerWidth}x${window.innerHeight}`;
  if (backdropFor === key) return;
  backdropFor = key;
  const b = backdrop.getContext('2d');
  if (compact) {
    const w = PAINTED_STYLE.sideZone.compactWidth, h = Math.round(w * window.innerHeight / window.innerWidth);
    backdrop.removeAttribute('style');
    backdrop.width = w; backdrop.height = h;
    const sc = Math.max(w / canvas.width, h / canvas.height);
    b.drawImage(canvas, (w - canvas.width * sc) / 2, (h - canvas.height * sc) / 2, canvas.width * sc, canvas.height * sc);
    return;
  }
  const W = img.canvas.width, H = img.canvas.height;
  backdrop.width = W; backdrop.height = H;
  b.drawImage(img.canvas, 0, 0);
  // Nach außen leicht dunkler: ab der Canvas-Kante von 0 bis sideZone.darken am Bildrand
  const { darken: dark, shade } = PAINTED_STYLE.sideZone;
  const side = (x0, y0, x1, y1, rx, ry, rw, rh) => {
    if (rw <= 0 || rh <= 0) return;
    const g = b.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(${shade},0)`);
    g.addColorStop(1, `rgba(${shade},${dark})`);
    b.fillStyle = g;
    b.fillRect(rx, ry, rw, rh);
  };
  const { l, t, r, w, h } = img;
  side(l, 0, 0, 0, 0, 0, l, H);
  side(l + w, 0, W, 0, l + w, 0, W - l - w, H);
  side(0, t, 0, 0, l, 0, w, t);
  side(0, t + h, 0, H, l, t + h, w, H - t - h);
  // Lage: Canvas-Ausschnitt genau über dem Canvas (CSS-px je Geräte-px wie beim Canvas)
  const cr = canvas.getBoundingClientRect(), k = cr.width / w;
  Object.assign(backdrop.style, { left: `${cr.left - l * k}px`, top: `${cr.top - t * (cr.height / h)}px`, width: `${W * k}px`, height: `${H * (cr.height / h)}px` });
}
afterFit = measureExtent;
measureExtent();
compactQuery.addEventListener('change', measureExtent);
landscapeQuery.addEventListener('change', measureExtent);

const $ = (id) => document.getElementById(id);
const ui = { hudDim: false, buildType: null, selectedTowerId: null, ring: null, ringPreview: null, upgradeHover: false, upgradePreview: null, hover: null, pending: null, aiming: false, hoverPx: null, speed: SPEED_STEPS[0], message: '', messageKind: 'error', messageTtl: 0 };
let mapId;
let mode = 'normal'; // B-182: Spielmodus ('normal' | 'nightmare'), bleibt beim Neustart erhalten
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
// B-188: Lautstärke Musik und Effekte (gespeichert wie der Ton)
ui.volume = loadVolumes(soundStorage());
setVolumes(ui.volume);
// Schalter Auto-Start: Spieler-Wahl gilt für jedes neue Spiel (gespeichert wie der Ton)
ui.autoWave = loadAutoWave(soundStorage());
setAutoWave(state, ui.autoWave);
const soundTracker = createSoundTracker();
// AudioContext erst nach der ersten Nutzeraktion (Autoplay-Regeln)
for (const evName of ['pointerdown', 'keydown']) window.addEventListener(evName, unlockAudio, { capture: true });

// Merker: Ergebnis dieses Spiels schon gespeichert? (refreshUI läuft alle 0,1 s)
let resultSaved = false;
let resultText = []; // Zeilen fürs Overlay (resultLines)
let winView = null; // B-184: Albtraum-Sieg (nightmareWinView), sonst null
let loseView = null; // B-192: Albtraum-Niederlage (nightmareLoseView), sonst null
// B-184: Zeichen der Gold-Anzeige (erfüllt: Haken, verletzt: Kreuz), Bauvorlage Albtraum-Gold-Anzeige
const GG_MARK = {
  ok: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="var(--message-info)" stroke="var(--ink)" stroke-width="3"/><path d="M9 16.5 L14 21 L23 11" fill="none" stroke="var(--cream)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  broken: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="var(--message-bad)" stroke="var(--ink)" stroke-width="3"/><path d="M11 11 L21 21 M21 11 L11 21" fill="none" stroke="var(--cream)" stroke-width="3.5" stroke-linecap="round"/></svg>',
};

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
// C4 Turm-Ring: Symbole der Knöpfe (40 x 40, Menue-Ring-Turm.md)
const RING_SVG = {
  upgrade: '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M10 22 L20 11 L30 22 M10 31 L20 20 L30 31" fill="none" stroke="#2b1a10" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 22 L20 11 L30 22 M10 31 L20 20 L30 31" fill="none" stroke="#fff3d2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  max: '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 5 L24.5 15 L35 16 L27 23 L29.5 34 L20 28.5 L10.5 34 L13 23 L5 16 L15.5 15 Z" fill="#f2c14e" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/></svg>',
  sell: '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="18" cy="22" r="12" fill="#f2c14e" stroke="#2b1a10" stroke-width="3"/><circle cx="18" cy="22" r="6.5" fill="none" stroke="#b9851d" stroke-width="2.5"/><path d="M26 9 H36" stroke="#2b1a10" stroke-width="7" stroke-linecap="round"/><path d="M26 9 H36" stroke="#fff3d2" stroke-width="3" stroke-linecap="round"/></svg>',
  target: '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="11" fill="none" stroke="#2b1a10" stroke-width="7"/><circle cx="20" cy="20" r="11" fill="none" stroke="#fff3d2" stroke-width="3"/><path d="M20 4 V12 M20 28 V36 M4 20 H12 M28 20 H36" stroke="#2b1a10" stroke-width="7" stroke-linecap="round"/><path d="M20 4 V12 M20 28 V36 M4 20 H12 M28 20 H36" stroke="#fff3d2" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="20" r="3" fill="#d6483a"/></svg>',
};

// ---------- C4 Bau-Ring (Knöpfe je Turmtyp) ----------
// Mini-Turm als Knopfbild: nutzt dieselbe Zeichenfunktion wie das Spielfeld (kein extra Grafik-Aufwand).
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
for (const v of buildRingView(0)) {
  const { type } = v;
  const def = TOWER_TYPES[type];
  const btn = document.createElement('button');
  btn.className = 'tower-btn ring-btn';
  btn.dataset.type = type;
  btn.setAttribute('role', 'menuitem');
  btn.style.setProperty('--a', `${v.angle}deg`);
  btn.innerHTML = `<canvas class="t-icon" width="${ICON_SIZE}" height="${ICON_SIZE}"></canvas>
    <span class="t-name">${def.name}</span>
    <span class="t-cost">${def.cost} ${COIN()}</span><kbd class="key">${def.key}</kbd>
    <span class="t-desc">${def.description}</span>`;
  // Tooltip mit Name, Preis und Fähigkeit (die runden Knöpfe zeigen nur Bild und Preis)
  btn.title = `${def.name} (${def.cost} Gold): ${def.description}${def.special ? ` ${def.special.text}` : ''}`;
  drawTowerIcon(btn.querySelector('.t-icon'), type);
  btn.addEventListener('click', () => buildFromRing(type));
  // Vorschau: Reichweite und Geistturm dieses Typs auf der Ringkachel (render.js liest ui.ringPreview)
  const preview = (on) => { ui.ringPreview = on ? type : (ui.ringPreview === type ? null : ui.ringPreview); };
  btn.addEventListener('pointerenter', () => preview(true));
  btn.addEventListener('pointerleave', () => preview(false));
  btn.addEventListener('focus', () => preview(true));
  btn.addEventListener('blur', () => preview(false));
  shop.appendChild(btn);
}

// ---------- Fähigkeiten ----------
// Symbole aus dem Entwurf Z.165–167 (46 x 46)
const ABILITY_SVG = {
  meteor: '<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><path d="M8 38 L26 20" stroke="#ffe266" stroke-width="8" stroke-linecap="round" opacity=".6"/><circle cx="29" cy="17" r="11" fill="#7a5a45" stroke="#2b1a10" stroke-width="3"/><path d="M24 12 L30 11" stroke="#d6bfa5" stroke-width="3" stroke-linecap="round"/><path d="M36 22 L42 28 M30 28 L34 36" stroke="#ffe266" stroke-width="3" stroke-linecap="round"/></svg>',
  freeze: '<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><path d="M23 6 V40 M8 14 L38 32 M38 14 L8 32" stroke="#2b1a10" stroke-width="7" stroke-linecap="round"/><path d="M23 6 V40 M8 14 L38 32 M38 14 L8 32" stroke="#f4fcff" stroke-width="3.5" stroke-linecap="round"/></svg>',
  repair: '<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><path d="M10 36 L28 18" stroke="#2b1a10" stroke-width="9" stroke-linecap="round"/><path d="M10 36 L28 18" stroke="#e8c185" stroke-width="4.5" stroke-linecap="round"/><path d="M26 8 Q38 6 38 16 L32 14 L28 20 L22 14 Z" fill="#d9dde2" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/></svg>',
};
const abilityBtns = {};
for (const [id, def] of Object.entries(ABILITIES)) {
  const btn = document.createElement('button');
  btn.className = 'ability-btn ab';
  btn.dataset.ability = id;
  btn.title = def.text;
  // C3: Symbol (SVG aus dem Entwurf), Abklingkuchen, Restsekunden, Ladungs-Abzeichen, Beschriftung darunter
  btn.innerHTML = `${ABILITY_SVG[id]}<span class="ab-cd" aria-hidden="true"></span><span class="ab-num" aria-hidden="true"></span>`
    + `<span class="ab-badge"></span><span class="cap">${def.short}</span><span class="key key-badge">${def.key.toUpperCase()}</span>`;
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
  ui.ring = null;
  refreshUI();
}

// ---------- C4 Ringmenü ----------
const stage = canvas.parentElement;
function closeRings() {
  Object.assign(ui, { ring: null, ringPreview: null, selectedTowerId: null, upgradeHover: false, upgradePreview: null, pending: null });
}
function openBuildRing(col, row) {
  Object.assign(ui, { ring: { col, row }, ringPreview: null, selectedTowerId: null, buildType: null, pending: null });
}
// Bau-Ring: Turm des Typs auf der Ringkachel bauen. Zu teuer: Meldung, Ring bleibt offen.
function buildFromRing(type) {
  if (!ui.ring) return;
  const res = buildTower(state, type, ui.ring.col, ui.ring.row);
  if (!res.ok) flash(res.reason);
  else {
    if (res.tower.overheated) flash(`${overheatNote(res.tower)} (neben Lava)`, 'info'); // B-030
    ui.ring = null;
    ui.ringPreview = null;
    if (lastPointerType !== 'mouse') ui.hover = null;
  }
  refreshUI();
  keepFocus();
}
// Ring an die Kachel (col,row) legen: ganz im sichtbaren Teil des Canvas, nicht über HUD-Leiste und runden Knöpfen.
function placeRing(el, col, row) {
  const cr = canvas.getBoundingClientRect();
  if (!(cr.width > 0)) return;
  const sr = stage.getBoundingClientRect();
  const clips = getComputedStyle(stage).overflow !== 'visible';
  const bounds = {
    left: Math.max(cr.left, clips ? sr.left : -Infinity, 0), top: Math.max(cr.top, clips ? sr.top : -Infinity, 0),
    right: Math.min(cr.right, clips ? sr.right : Infinity, window.innerWidth), bottom: Math.min(cr.bottom, clips ? sr.bottom : Infinity, window.innerHeight),
  };
  // B-137 Handy quer: Ring am Rand ins Feld schieben (nicht in den Baumrand unter der Bedienung in den Ecken)
  if (landscapeQuery.matches) {
    const k = cr.width / VIEW_WIDTH, m = FRAME_MARGIN * k;
    bounds.left = Math.max(bounds.left, cr.left + m); bounds.right = Math.min(bounds.right, cr.right - m);
    bounds.top = Math.max(bounds.top, cr.top + m); bounds.bottom = Math.min(bounds.bottom, cr.bottom - m);
  }
  const R = ringRadius((cr.width / VIEW_WIDTH) * TILE, compactQuery.matches);
  const t = tileCenterPx(col, row, cr.width);
  const p = { x: cr.left + t.x, y: cr.top + t.y };
  const avoid = [$('hud-bar'), document.querySelector('.top-buttons')].map((e) => e?.getBoundingClientRect()).filter((r) => r && r.width > 0);
  const c = ringCenter(p, R, bounds, avoid);
  const px = (v) => `${Math.round(v * 10) / 10}px`;
  el.style.setProperty('--rx', px(c.x - sr.left + stage.scrollLeft - stage.clientLeft));
  el.style.setProperty('--ry', px(c.y - sr.top + stage.scrollTop - stage.clientTop));
  el.style.setProperty('--R', px(R));
  el.style.setProperty('--dx', px(p.x - c.x));
  el.style.setProperty('--dy', px(p.y - c.y));
  el.classList.toggle('info-left', infoOnLeft(c.x, bounds.left, bounds.right));
}

function flash(msg, kind = 'error', ttl = 2) {
  ui.message = msg;
  ui.messageKind = kind;
  ui.messageTtl = ttl;
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
  // C2: Holzleiste blasst aus, wenn die Maus darunter steht; Fahne zeigt Hand-Zeiger
  const hr = $('hud-bar').getBoundingClientRect();
  const pad = HUD_BAR.dimPad;
  ui.hudDim = ev.clientX >= hr.left - pad && ev.clientX <= hr.right + pad && ev.clientY >= hr.top - pad && ev.clientY <= hr.bottom + pad;
  const flag = overFlag(ev);
  canvas.classList.toggle('over-flag', flag);
  ui.hoverPx = pointFromEvent(ev);
  ui.hover = inField && !flag ? { col, row, ok: canBuild(state, col, row).ok } : null; // über der Fahne kein Bau-Rahmen
});
// Bei Touch feuert pointerleave direkt nach dem Loslassen: dort die Vorschau behalten.
canvas.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') { ui.hover = null; ui.hudDim = false; } });
// G5/C3: Klick auf die Wellenfahne startet die Welle (im Rand: Box in Entwurfs-px plus flagHitPad; im Feld: Fahnen-Kacheln)
function overFlag(ev) {
  // Fahnen-Kacheln im Feld (Tuch ragt hinein, nicht bebaubar) zählen ganz als Fahne
  const t = tileFromEvent(ev);
  if (t.inField && state.flagTiles?.has(`${t.col},${t.row}`)) return true;
  const p = pointFromEvent(ev);
  const K = TILE / PAINTED_STYLE.unit, pad = PAINTED_STYLE.flagHitPad;
  return !t.inField && flagBoxes(state).some((f) => p.x >= f.box[0] * K - pad && p.x <= f.box[2] * K + pad && p.y >= f.box[1] * K - pad && p.y <= f.box[3] * K + pad);
}
canvas.addEventListener('click', (ev) => {
  if (!ui.aiming && !ui.buildType && overFlag(ev)) { doStartWave(); return; }
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
  if (!inField) { // Klick in den Rand: nichts bauen, nur Auswahl und Ring schließen
    closeRings();
    refreshUI();
    return;
  }
  const touch = lastPointerType !== 'mouse';
  // C4: ohne Baumodus trifft der Klick auch die Turmfigur (ragt über die Kachel nach oben)
  const pt = pointFromEvent(ev);
  const check = state.status === 'playing' ? canBuild(state, col, row) : { ok: false, reason: '' };
  const existing = ui.buildType ? towerAt(state, col, row) : pickTower(state.towers, pt.x, pt.y, () => check.ok);
  if (existing) {
    ui.selectedTowerId = existing.id;
    ui.buildType = null;
    ui.pending = null;
    ui.ring = null;
    ui.ringPreview = null;
  } else if (ui.buildType) {
    const step = buildTapStep(ui.pending, col, row, touch);
    ui.pending = step.pending;
    if (step.action === 'preview') {
      ui.hover = { col, row, ok: check.ok };
      if (check.ok) flash('Nochmal tippen zum Bauen', 'info');
      else { flash(check.reason); ui.pending = null; }
    } else {
      const res = buildTower(state, ui.buildType, col, row);
      if (!res.ok) flash(res.reason);
      else if (res.tower.overheated) flash(`${overheatNote(res.tower)} (neben Lava)`, 'info'); // B-030
      if (touch) ui.hover = null;
    }
  } else if (check.ok && ui.selectedTowerId !== null) {
    openBuildRing(col, row);
  } else if (ui.selectedTowerId !== null) {
    closeRings(); // Turm-Ring offen: Klick daneben schließt
  } else if (ui.ring && (touch || (ui.ring.col === col && ui.ring.row === row))) {
    closeRings(); // Touch: Tipp daneben schließt; Maus: Klick auf dieselbe Kachel schließt
  } else {
    if (check.ok) openBuildRing(col, row); // Maus: anderer freier Platz -> Ring springt dorthin
    else {
      closeRings();
      if (check.reason) flash(check.reason);
    }
  }
  refreshUI();
});
canvas.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  ui.aiming = false;
  ui.buildType = null;
  closeRings();
  refreshUI();
});
// Rechtsklick auf einen Ring schließt ihn ebenfalls; Tipp/Klick außerhalb von Ring und Spielfeld schließt
for (const el of [shop, $('tower-info')]) {
  el.addEventListener('contextmenu', (ev) => { ev.preventDefault(); closeRings(); refreshUI(); });
}
document.addEventListener('pointerdown', (ev) => {
  if (!ui.ring && ui.selectedTowerId === null) return;
  if (ev.target === canvas || ev.target.closest?.('.ring, #test-panel')) return;
  closeRings();
  refreshUI();
});

// ---------- Buttons & Tastatur ----------
$('start-wave').addEventListener('click', doStartWave);

// Kartenauswahl: nur vor Welle 1 möglich
const mapSelect = $('map-select');
// Testmodus: zusätzlich je Karte ein Eintrag "<Karte> (Albtraum)"
for (const o of mapSelectOptions({ testMode: TEST_MODE })) {
  const opt = document.createElement('option');
  opt.value = o.value;
  mapSelect.appendChild(opt);
}
// Beschriftung mit Sternen, gesperrte Karten mit Zusatz "(gesperrt)" und nicht wählbar.
// <option> kann kein Bild zeigen, darum Text statt Schloss-Emoji (B-096).
function refreshMapOptions() {
  for (const opt of mapSelect.options) {
    const { mapId: id, mode: m } = parseMapSelectValue(opt.value);
    const name = MAPS[id].name;
    if (m === 'nightmare') { opt.textContent = `${name} (Albtraum)`; continue; } // nur Testmodus, immer offen
    const open = mapOpen(id);
    opt.disabled = !open;
    opt.textContent = open ? `${name} ${starText(mapProgress(progress, id).stars)}` : `${name} (gesperrt)`;
  }
}
// Außerhalb des Testmodus zeigt die Auswahl wie bisher nur die Karte (Modus bleibt beim Wechsel erhalten).
function mapSelectCurrent() { return TEST_MODE ? mapSelectValue(state.mapId, state.mode) : state.mapId; }
refreshMapOptions();
mapSelect.value = mapSelectCurrent();
mapSelect.addEventListener('change', () => {
  const picked = parseMapSelectValue(mapSelect.value);
  if (state.wave !== 0 || state.waveActive || !mapOpen(picked.mapId)) { mapSelect.value = mapSelectCurrent(); return; }
  mapId = picked.mapId;
  if (TEST_MODE) mode = picked.mode;
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
// C4: Maus über bzw. Fokus auf Verbessern -> Canvas zeigt die Reichweite der nächsten Stufe (refreshUI setzt ui.upgradePreview)
for (const [evName, on] of [['pointerenter', true], ['pointerleave', false], ['focus', true], ['blur', false]]) {
  $('upgrade').addEventListener(evName, () => { ui.upgradeHover = on; refreshUI(); });
}
$('ti-close').addEventListener('click', () => {
  closeRings();
  refreshUI();
  keepFocus(); // Fokus aufs Spielfeld, nicht verloren auf body
});
// Handy-Leiste (fest unten): echte Höhe als --tower-info-h, damit main genug Platz darunter lässt (auch bei großer Schrift)
const towerInfo = $('tower-info');
if (typeof ResizeObserver === 'function') {
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--tower-info-h', `${Math.ceil(towerInfo.getBoundingClientRect().height)}px`);
  }).observe(towerInfo);
}
$('restart').addEventListener('click', restart);
// ---------- C5: Startbildschirm (screens.js) ----------
// Bei jedem Laden (außer Testseite) und über "Karten" am Spielende. Wahl = Karte merken und neu starten.
const startScreen = mountStartScreen($('start-screen'), {
  getProgress: () => progress,
  allOpen: TEST_MODE,
  currentMap: () => (TEST_MODE ? state.mapId : startMap(progress)),
  currentMode: () => mode, // B-184: nach einem Albtraum-Spiel öffnet die Kartenauswahl in der Albtraum-Ansicht
  onPick: (id, pickedMode = 'normal') => {
    mapId = id;
    mode = pickedMode;
    progress.lastMap = id;
    saveProgress(getStorage(), progress);
    // Handy: Vollbild schon bei der Kartenwahl, damit Chromes Vollbild-Hinweis vor Welle 1 wieder verschwindet
    // nicht im automatisierten Browser (e2e prüft Drehen und Vollbild-Knopf ohne Vollbild)
    if (window.matchMedia('(pointer: coarse)').matches && !navigator.webdriver) fullscreen.enter(document.documentElement, true);
    restart();
  },
});
$('to-maps').addEventListener('click', () => startScreen.show(true));
// ---------- B-185: Menü „Aussehen“ (Kosmetik) ----------
// Testseite: echter Fortschritt fehlt, darum ein eigener Stand im Speicher mit allen Belohnungen frei, anfangs aus
// (sonst sähen alle Testseiten-Spiele golden aus). Normal: Auswahl im Spielfortschritt, gespeichert.
const cosProgress = TEST_MODE ? testCosmeticsProgress() : progress;
function testCosmeticsProgress() {
  const nightmare = Object.fromEntries(MAP_ORDER.map((id) => [id, { bestWave: MAX_WAVES, badge: BADGE_TIERS.length }]));
  return { maps: {}, nightmare, cosmetics: { night: Object.fromEntries(MAP_ORDER.map((id) => [id, false])), goldTowers: false } };
}
// Nacht-Look und goldene Türme fürs Rendering (render.js liest ui.night und ui.goldTowers); reine Optik
function applyCosmetics() {
  const c = activeCosmetics(cosProgress, state.mapId);
  ui.night = c.night;
  ui.goldTowers = c.goldTowers;
}
const cosMenu = mountCosmeticsMenu($('cosmetics'), {
  getProgress: () => cosProgress,
  onChange: () => { if (!TEST_MODE) saveProgress(getStorage(), progress); applyCosmetics(); },
});
document.querySelector('#start-screen .cos-open')?.addEventListener('click', () => cosMenu.open());
$('end-look').addEventListener('click', () => cosMenu.open()); // B-192: Belohnung gleich ansehen
if (!TEST_MODE) startScreen.show();
// B-137: Drehhinweis im Hochformat pausiert das Spiel; nach dem Drehen weiter, wenn die Pause vom Hinweis kam
let pausedByRotate = false;
let fsGate = false; // Pflicht-Knopf "Im Vollbild spielen" noch nicht angetippt (gesetzt unten beim Vollbild)
function applyRotateHint() {
  const hint = rotateQuery.matches || fsGate;
  const s = rotatePauseStep({ portrait: hint, paused: state.paused, playing: state.status === 'playing', byHint: pausedByRotate });
  if (s.pause !== null && s.pause !== state.paused) togglePause(state);
  pausedByRotate = s.byHint;
  document.body.classList.toggle('fs-gate', fsGate);
  $('app').inert = hint; // Tastaturfokus nicht unter dem Hinweis
  refreshUI();
}
rotateQuery.addEventListener('change', applyRotateHint);
// B-188: Ton-Knopf öffnet das Feld mit Ton-Schalter und Schiebern (Taste M schaltet weiter direkt stumm)
const soundPop = $('sound-pop');
function setSoundPop(open) {
  soundPop.hidden = !open;
  $('sound').setAttribute('aria-expanded', String(open));
}
$('sound').addEventListener('click', () => setSoundPop(soundPop.hidden));
$('sound-toggle').addEventListener('click', toggleSound);
for (const kind of ['music', 'sfx']) {
  const input = $(`vol-${kind}`);
  input.step = String(SOUND.volumeStep * 100);
  input.addEventListener('input', () => {
    ui.volume = saveVolumes(soundStorage(), { ...ui.volume, [kind]: Number(input.value) / 100 });
    setVolumes(ui.volume);
    refreshUI();
  });
}
// Schließen per Klick bzw. Tippen daneben (der Klick wirkt trotzdem, z. B. aufs Feld)
document.addEventListener('pointerdown', (ev) => {
  if (!soundPop.hidden && !ev.target.closest?.('#sound-pop, #sound')) setSoundPop(false);
}, { capture: true });
// Schließen, wenn der Fokus per Tab hinauswandert
for (const el of [soundPop, $('sound')]) {
  el.addEventListener('focusout', (ev) => {
    if (ev.relatedTarget && !ev.relatedTarget.closest?.('#sound-pop, #sound')) setSoundPop(false);
  });
}
// Schließen, sobald Startbildschirm oder Spielende-Plakette erscheint (Feld bliebe sonst verdeckt offen)
// (nur beim Erscheinen: auf dem Startbildschirm selbst darf das Feld offen sein)
const isCovered = () => !$('start-screen').hidden || !$('overlay').hidden;
let wasCovered = isCovered();
const closeOnCover = new MutationObserver(() => {
  const covered = isCovered();
  if (covered && !wasCovered) setSoundPop(false);
  wasCovered = covered;
});
for (const id of ['start-screen', 'overlay']) closeOnCover.observe($(id), { attributes: true, attributeFilter: ['hidden'] });
$('auto-wave').addEventListener('click', toggleAutoWave);

// B-178: Vollbild-Knopf (nur wo der Browser es kann). Auf Touch-Geräten zusätzlich Querformat festhalten.
const fullscreen = fullscreenControl(document, window.screen);
$('fullscreen').hidden = !fullscreen.supported;
$('fullscreen').addEventListener('click', () => fullscreen.toggle(document.documentElement, window.matchMedia('(pointer: coarse)').matches));
// Pflicht-Start: auf dem Handy erst "Im Vollbild spielen" antippen, dann Vollbild und Querformat festhalten (dreht von selbst).
// Im automatisierten Browser nur mit ?vollbild (e2e), sonst bleiben die übrigen Handy-Tests ohne Knopf.
fsGate = fullscreenGate({
  coarse: window.matchMedia('(pointer: coarse)').matches && (!navigator.webdriver || new URLSearchParams(location.search).has('vollbild')),
  supported: fullscreen.supported, tapped: false, fullscreenOn: fullscreen.isOn(),
  installed: window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches,
});
$('fs-start').addEventListener('click', () => {
  fullscreen.enter(document.documentElement, true); // sofort im Tipp-Ereignis, sonst lehnt der Browser ab
  fsGate = false; // auch wenn der Browser ablehnt: nie festhängen
  applyRotateHint();
});
fullscreen.onChange(() => {
  const on = fullscreen.isOn();
  $('fullscreen').setAttribute('aria-pressed', String(on));
  $('fullscreen-label').textContent = on ? 'Vollbild beenden' : 'Vollbild';
});

function toggleAutoWave() {
  ui.autoWave = setAutoWave(state, !ui.autoWave);
  saveAutoWave(soundStorage(), ui.autoWave);
  flash(ui.autoWave ? 'Auto-Start an: nächste Welle startet von selbst' : 'Auto-Start aus: Welle selbst starten', 'info');
  refreshUI();
}
function toggleSound() {
  ui.soundOn = !ui.soundOn;
  setSoundOn(ui.soundOn);
  if (ui.soundOn) unlockAudio(); // Klick bzw. Taste ist die Nutzeraktion
  saveSoundOn(soundStorage(), ui.soundOn);
  refreshUI();
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
  keepFocus();
}
function restart() {
  // Gesperrte Karte: auf die erste Karte zurückfallen.
  if (mapId !== undefined && !mapOpen(mapId)) mapId = MAP_ORDER[0];
  // B-182: Albtraum nur auf Karten mit allen Sternen (Testseite: immer)
  if (mode === 'nightmare' && !TEST_MODE && !isNightmareUnlocked(progress, mapId)) mode = 'normal';
  state = createGame({ mapId, mode, autoWave: ui.autoWave });
  resultSaved = false;
  resultText = [];
  winView = null;
  loseView = null;
  Object.assign(ui, { buildType: null, selectedTowerId: null, pending: null, aiming: false, hoverPx: null, speed: SPEED_STEPS[0], ring: null, ringPreview: null, upgradeHover: false, upgradePreview: null });
  refreshUI();
}

// C4 Tastatur auf dem Spielfeld (Canvas hat tabindex): Pfeiltasten bewegen die Fokus-Kachel, Enter öffnet dort den Ring.
// Leertaste bleibt Wellenstart. Liefert true, wenn die Taste verbraucht ist.
function fieldKey(ev) {
  if (ev.target !== canvas || state.status !== 'playing') return false;
  const base = ui.hover ?? ui.ring ?? (ui.selectedTowerId !== null ? state.towers.find((x) => x.id === ui.selectedTowerId) : null);
  const next = moveFocusTile(base ? { col: base.col, row: base.row } : null, ev.key);
  if (next) {
    ev.preventDefault();
    closeRings();
    ui.hover = { ...next, ok: canBuild(state, next.col, next.row).ok };
    refreshUI();
    return true;
  }
  if (ev.key !== 'Enter' || !ui.hover) return false;
  ev.preventDefault();
  const { col, row } = ui.hover;
  const existing = towerAt(state, col, row);
  const check = existing ? { ok: true } : canBuild(state, col, row);
  if (existing) Object.assign(ui, { selectedTowerId: existing.id, buildType: null, pending: null, ring: null, ringPreview: null });
  else if (check.ok) openBuildRing(col, row);
  else flash(check.reason);
  refreshUI();
  // Fokus auf den ersten Ring-Knopf
  const first = existing ? [...document.querySelectorAll('#tower-info .ring-acts .rbtn, #ti-close')].find((b) => !b.disabled) : shop.querySelector('.tower-btn');
  if (check.ok) first?.focus({ preventScroll: true });
  return true;
}
// Ring zu, Fokus lag darin (×, Esc, Bauen, Verkaufen): Fokus zurück aufs Spielfeld statt verloren auf body
function keepFocus() {
  const a = document.activeElement;
  if (!a || a === document.body || a.closest?.('.ring[hidden]')) canvas.focus({ preventScroll: true });
}

window.addEventListener('keydown', (ev) => {
  if (cosMenu.handleKey(ev)) return; // B-185: Menü „Aussehen“ offen
  if (startScreen.handleKey(ev)) return; // C5: Startbildschirm offen (hat Vorrang vor dem Ton-Feld)
  if (ev.key === 'Escape' && !soundPop.hidden) { setSoundPop(false); $('sound').focus(); return; } // B-188
  if (fieldKey(ev)) return;
  const key = String(ev.key ?? '').toLowerCase(); // manche Ereignisse (Autofill) haben kein key
  // Enter/Leertaste auf einem Ringknopf löst den Knopf aus (nicht den Wellenstart)
  if ((key === ' ' || key === 'enter') && ev.target.closest?.('.ring, #sound-pop')) return;
  const type = Object.keys(TOWER_TYPES).find((t) => TOWER_TYPES[t].key === key);
  const ability = Object.keys(ABILITIES).find((a) => ABILITIES[a].key === key);
  if (type && ui.ring) buildFromRing(type); // C4: Bau-Ring offen -> diesen Typ auf der Ringkachel bauen
  else if (type) selectBuild(type);
  else if (ability) doAbility(ability);
  else if (key === ' ') { ev.preventDefault(); if (!ev.repeat) doStartWave(); } // B-005: gehaltene Taste startet nicht mehrfach
  else if (key === 'escape') {
    const inRing = document.activeElement?.closest?.('.ring');
    ui.aiming = false; ui.buildType = null; closeRings(); refreshUI();
    if (inRing) keepFocus();
  }
  else if (key === 'u') doUpgrade();
  else if (key === 's') doSell();
  else if (key === 't') doCycleTarget();
  else if (key === 'f') toggleSpeed();
  else if (key === 'p') doTogglePause();
  else if (key === 'm' && !ev.repeat && !ev.ctrlKey && !ev.metaKey) toggleSound();
  else if (key === 'a' && !ev.repeat && !ev.ctrlKey && !ev.metaKey) toggleAutoWave();
});

// ---------- HUD ----------
const updateBossBars = createBossBars(); // B-180: Boss-Leiste im HUD

// ---------- B-193: HUD im Albtraum (Bauvorlage HUD-Albtraum-Holz) ----------
// Holz je Karte als Klasse nm-wood-<Art> an #app (style.css), Rand-Deko als erstes Kind der Plaketten, neu gebaut bei Größenänderung.
const NM_DECO_IDS = ['hud-bar', 'abilities', 'boss-bar', 'boss-bar-2', 'nm-plaque'];
let nmWood = null;
function buildNmDeco(el) {
  el.querySelector(':scope > .plq-deco')?.remove();
  const w = el.offsetWidth, h = el.offsetHeight;
  if (!nmWood || !w || !h) return;
  // Eisenbänder genau auf den sichtbaren Trennern (Mitte in px ab der Außenkante, Deko beginnt 3 px vor der Innenkante)
  const xs = nmWood === 'iron' ? [...el.querySelectorAll(':scope > .sep')].filter((sp) => sp.offsetParent).map((sp) => sp.offsetLeft + sp.offsetWidth / 2 + 3) : [];
  el.insertAdjacentHTML('afterbegin', nmWoodDeco(nmWood, w, h, xs));
}
const nmDecoObserver = typeof ResizeObserver === 'function' ? new ResizeObserver((entries) => { for (const en of entries) buildNmDeco(en.target); }) : null;
for (const id of NM_DECO_IDS) if ($(id)) nmDecoObserver?.observe($(id));
function applyNmWood(kind) {
  if (kind === nmWood) return;
  const app = $('app');
  if (nmWood) app.classList.remove(`nm-wood-${nmWood}`);
  nmWood = kind;
  if (kind) app.classList.add(`nm-wood-${kind}`);
  for (const id of NM_DECO_IDS) if ($(id)) buildNmDeco($(id));
}
// Albtraum-Plakette: Medaille (beste Stufe der Karte), „Albtraum“, Stilname; nur im Albtraum und wenn neben dem HUD Platz ist
function refreshNmPlaque() {
  const plq = $('nm-plaque');
  const hud = $('hud-bar');
  const btn = document.querySelector('.top-buttons');
  let left = null;
  if (state.mode === 'nightmare' && hud.offsetParent && btn) {
    const hr = hud.getBoundingClientRect();
    const pr = hud.offsetParent.getBoundingClientRect();
    // Boss-Leiste hat Vorrang: während sie steht, braucht die Plakette zusätzlich Platz für eine volle Leiste
    const reserve = ui.bossBarShown ? BOSS_BAR.width + 2 * BOSS_BAR.gapPad : BOSS_BAR.gapPad;
    left = nmPlaquePlacement(hr.right, btn.getBoundingClientRect().left, reserve);
    if (left !== null) left -= pr.left;
  }
  if (plq.hidden !== (left === null)) plq.hidden = left === null;
  if (left === null) return;
  plq.style.setProperty('--nmp-left', `${Math.round(left)}px`);
  const tier = nightmareProgress(progress, state.mapId).badge ?? 0;
  const key = `${state.mapId}|${tier}`;
  if (plq.dataset.key === key) return;
  plq.dataset.key = key;
  const style = NM_STYLE_NAME[state.mapId] ?? '';
  plq.setAttribute('aria-label', `Albtraum-Modus, ${style}, bestes Abzeichen ${tier ? BADGE_TIERS[tier - 1] : 'keins'}`);
  setHtml(plq.querySelector('.nmp-badge'), badgeSvg(46, tier));
  plq.querySelector('.nmp-style').textContent = style;
}
function refreshUI() {
  applyCosmetics(); // B-185: folgt Karte und Auswahl
  if (state.status !== 'playing' || state.paused) ui.aiming = false; // Zielmodus nur im laufenden Spiel
  updateBossBars(state, ui, performance.now() / 1000);
  $('gold').textContent = state.gold.toLocaleString('de-DE');
  $('lives').textContent = state.lives;
  $('lives-box').classList.toggle('low', state.status === 'playing' && state.lives <= LOW_LIVES);
  setHtml($('wave'), `${state.wave}<small> / ${MAX_WAVES}</small>`);
  $('speed-label').textContent = `×${ui.speed}`;
  $('speed').setAttribute('aria-label', `Tempo ×${ui.speed}`);
  $('pause').dataset.paused = String(state.paused);
  $('hud-bar').classList.toggle('dim', ui.hudDim);
  // Deutliches Banner über dem Spielfeld (nur Anzeige, Bauen bleibt möglich)
  $('pause-banner').hidden = !state.paused;
  $('pause-label').textContent = state.paused ? 'Weiter' : 'Pause';
  $('sound-label').textContent = ui.soundOn ? 'Ton an' : 'Ton aus';
  $('sound').dataset.on = String(ui.soundOn);
  $('sound-toggle').dataset.on = String(ui.soundOn);
  $('sound-toggle').setAttribute('aria-pressed', String(ui.soundOn));
  $('sound-toggle-label').textContent = ui.soundOn ? 'Ton an' : 'Ton aus';
  for (const kind of ['music', 'sfx']) {
    const pct = Math.round(ui.volume[kind] * 100);
    if (Number($(`vol-${kind}`).value) !== pct) $(`vol-${kind}`).value = String(pct);
    $(`vol-${kind}-out`).textContent = `${pct} %`;
  }
  $('auto-wave').setAttribute('aria-pressed', String(ui.autoWave));
  $('auto-wave-label').textContent = ui.autoWave ? 'Auto-Start an' : 'Auto-Start aus';
  mapSelect.disabled = state.wave !== 0 || state.waveActive;
  mapSelect.value = mapSelectCurrent();
  // B-005: Während einer Welle bleibt der Knopf bedienbar (vorzeitiger Start mit Bonus), bis zur letzten Welle
  const sb = startButtonView(state);
  $('start-wave').disabled = sb.disabled;
  $('start-label').textContent = sb.label;
  $('start-key').hidden = !sb.showKey;
  $('start-wave').classList.toggle('ready', sb.showKey && !state.waveActive);
  // C-Abnahme 5: schmale Füllung unten im Knopf = Anteil besiegter Gegner der laufenden Welle
  const wp = waveProgress(state, ui.wavePeak);
  ui.wavePeak = wp.peak;
  $('start-wave').classList.toggle('running', state.waveActive);
  $('start-wave').style.setProperty('--wave-fill', wp.fill.toFixed(3));

  // Vorschau der nächsten Welle (nur solange keine Welle läuft)
  const showPreview = !state.waveActive && state.status === 'playing' && state.wave < MAX_WAVES;
  $('wave-preview').hidden = !showPreview;
  if (showPreview) {
    const parts = Object.entries(waveSummary(state.wave + 1, state.mapId))
      .map(([type, n]) => `${n}× ${ENEMY_TYPES[type].name}`);
    $('wave-preview').textContent = `Kommt: ${parts.join(', ')}`;
  }

  // B-183: Gold-Bedingung im Albtraum (erfüllt oder verletzt)
  const gg = goldGoalView(state.mode, checkGoldCondition(state, state.mapId));
  const ggEl = $('gold-goal');
  ggEl.hidden = gg.hidden;
  document.body.classList.toggle('mode-nightmare', state.mode === 'nightmare'); // B-184: Kartenwahl-Liste weicht dem Gold-Chip
  if (gg.hidden) ggEl.dataset.key = '';
  else if (ggEl.dataset.key !== `${gg.text}|${gg.ok}`) {
    // B-184: Wechsel auf verletzt blitzt einmal auf; Handy quer (nur Zeichen): Meldung beim Start und beim Verletzen
    const wasOk = ggEl.dataset.key?.endsWith('|true');
    const first = !ggEl.dataset.key || !ggEl.dataset.key.startsWith(`${gg.text}|`);
    ggEl.dataset.key = `${gg.text}|${gg.ok}`;
    ggEl.classList.toggle('broken', !gg.ok);
    ggEl.classList.remove('flash');
    if (wasOk && !gg.ok && !ui.reducedMotion) { void ggEl.offsetWidth; ggEl.classList.add('flash'); }
    ggEl.title = gg.title;
    ggEl.setAttribute('aria-label', gg.title);
    setHtml(ggEl.querySelector('.gg-mark'), GG_MARK[gg.ok ? 'ok' : 'broken']);
    // B-193: verpasst = „Gold verpasst“ (.gg-state) + nur die Bedingung, kein Durchstreichen
    ggEl.querySelector('.gg-text').textContent = gg.ok ? gg.text : gg.text.replace(/^Gold: /, '');
    if (state.status === 'playing') {
      if (first && landscapeQuery.matches) flash(gg.text, 'info');
      else if (wasOk && !gg.ok) flash(goldMissedText(state), 'error', 2.5); // B-193: Meldung auf allen Geräten, 2,5 s
    }
  }
  applyNmWood(nmWoodKind(state.mapId, state.mode === 'nightmare' || !!ui.night)); // B-193
  refreshNmPlaque();

  for (const [id, def] of Object.entries(ABILITIES)) {
    const btn = abilityBtns[id];
    const v = abilityView({ ...def, maxUses: abilityMaxUses(state, id) }, state.abilities[id].uses, abilityCooldownLeft(state, id)); // B-182: Albtraum
    btn.setAttribute('aria-label', v.aria);
    if (btn.dataset.state === 'charging' && v.state === 'ready') { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
    btn.dataset.state = v.state;
    btn.style.setProperty('--fill', v.fill.toFixed(3));
    btn.querySelector('.ab-badge').textContent = v.badge;
    btn.querySelector('.ab-num').textContent = v.state === 'charging' ? String(Math.ceil(abilityCooldownLeft(state, id))) : '';
    btn.disabled = v.state !== 'ready' || state.status !== 'playing';
    btn.classList.toggle('aiming', id === 'meteor' && ui.aiming);
    // B-112: Meteor-Schaden wächst mit der Welle, der Tooltip zeigt den aktuellen Wert
    if (id === 'meteor' && btn.dataset.wave !== String(state.wave)) {
      btn.dataset.wave = String(state.wave);
      btn.title = meteorText(state.wave, state.modifiers?.hpGrowthLate);
    }
  }

  // C4 Bau-Ring: nur im laufenden Spiel und solange die Kachel frei ist (z. B. nach Neustart zu)
  if (ui.ring && (state.status !== 'playing' || !canBuild(state, ui.ring.col, ui.ring.row).ok)) { ui.ring = null; ui.ringPreview = null; }
  shop.hidden = !ui.ring;
  for (const v of buildRingView(state.gold)) {
    const btn = shop.querySelector(`.tower-btn[data-type="${v.type}"]`);
    btn.classList.toggle('active', ui.buildType === v.type);
    btn.classList.toggle('poor', v.poor);
    btn.setAttribute('aria-disabled', String(v.poor));
    btn.setAttribute('aria-label', v.label);
  }
  if (ui.ring) placeRing(shop, ui.ring.col, ui.ring.row);

  // C4 Turm-Ring (Handy: feste Leiste unten)
  const t = state.towers.find((x) => x.id === ui.selectedTowerId);
  $('tower-info').hidden = !t;
  ui.upgradePreview = null;
  if (t) {
    const s = towerStats(t, state.modifiers);
    const v = towerRingView(t, state.gold, state.modifiers);
    $('ti-name').textContent = v.name;
    const heat = overheatNote(t); // B-030: steht in der Werte-Zeile, damit es auch auf dem Handy sichtbar bleibt
    $('ti-stats').textContent = `Schaden ${Math.round(s.damage)} · Reichweite ${s.range.toFixed(1)} · ${(1 / s.rate).toFixed(1)} Schuss/s${heat ? ` · ${heat}` : ''}`;
    $('ti-special').textContent = [s.special?.text, masterInfo(t)].filter(Boolean).join(' '); // B-175: Stufe 3 (Vorschau ab Stufe 2)
    // Knöpfe: Symbol und Preis bzw. Regel; der zugängliche Name bleibt vollständig (aria-label mit Kürzel)
    setHtml($('upgrade'), v.upgrade.max ? `${RING_SVG.max}<span class="cap">Max.</span>` : `${RING_SVG.upgrade}<span class="cap act-cost">${v.upgrade.cost} ${COIN()}</span>`);
    $('upgrade').setAttribute('aria-label', v.upgrade.label);
    $('upgrade').disabled = v.upgrade.disabled;
    setHtml($('target-mode'), `${RING_SVG.target}<span class="cap">${v.target.mode}</span>`);
    $('target-mode').setAttribute('aria-label', v.target.label);
    setHtml($('sell'), `${RING_SVG.sell}<span class="cap act-cost">+${v.sell.value} ${COIN()}</span>`);
    $('sell').setAttribute('aria-label', v.sell.label);
    if (ui.upgradeHover) ui.upgradePreview = v.upgradeRange;
    placeRing($('tower-info'), t.col, t.row);
  }

  $('message').textContent = ui.messageTtl > 0 ? ui.message : '';
  $('message').classList.toggle('info', ui.messageKind === 'info');

  const over = $('overlay');
  over.hidden = state.status === 'playing';
  // C5: Plakette mit Band (Titel) und erreichten Sternen dieses Spiels
  if (state.status !== 'playing') {
    const end = endView(state.status, starsFor(state.status, state.lives));
    if (state.mode === 'nightmare') end.showStars = false; // B-182: keine Sterne im Albtraum
    $('overlay-title').textContent = end.title;
    $('end-ribbon-band').setAttribute('fill', end.ribbon);
    setHtml($('end-stars'), end.showStars ? starsHtml(end.stars, 52) : '');
    $('end-stars').setAttribute('aria-label', end.showStars ? `${end.stars} von ${STAR_COUNT} Sternen` : '');
  }
  $('overlay-stats').textContent = `Welle ${state.wave} · ${state.kills} Gegner besiegt`;
  if (state.status !== 'playing' && !resultSaved) saveResult();
  renderResultLines($('overlay-progress'), resultText);
  renderNightmareEnd(state.status !== 'playing' ? winView : null, state.status !== 'playing' ? loseView : null);
}

// B-184/B-192: Sieg- und Niederlagebildschirm im Albtraum (Bauvorlage Albtraum-Sieg). v = nightmareWinView, lose = nightmareLoseView, sonst null.
// Medaille fliegt nur bei neuem Abzeichen ein; Band mit Zipfeln, Plakette im Holz der Karte (Niederlage: Eisen, gedimmt).
const RIBBON_NORMAL = { box: '0 0 560 70', w: 560, h: 70, d: 'M20 10 H540 L524 35 L540 60 H20 L36 35 Z', x: 280, y: 37 };
const RIBBON_NM = { box: '0 0 700 76', w: 700, h: 76, d: 'M40 8 H660 V64 H40 Z', x: 350, y: 36 };
const SPARK = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M11 1 L13 9 L21 11 L13 13 L11 21 L9 13 L1 11 L9 9 Z" fill="var(--bolt)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/></svg>';
function setRibbon(r, band, tail) {
  const svg = document.querySelector('#overlay .end-ribbon');
  svg.setAttribute('viewBox', r.box);
  svg.setAttribute('width', r.w);
  svg.setAttribute('height', r.h);
  $('end-ribbon-band').setAttribute('d', r.d);
  $('overlay-title').setAttribute('x', r.x);
  $('overlay-title').setAttribute('y', r.y);
  if (band) $('end-ribbon-band').setAttribute('fill', band);
  for (const t of svg.querySelectorAll('.end-tail:not(.end-shine)')) t.setAttribute('fill', tail ?? 'none');
}
function renderNightmareEnd(v, lose) {
  const over = $('overlay');
  if (lose) v = null;
  const title = v ? 'Albtraum besiegt!' : lose ? 'Der Albtraum war stärker' : null;
  if (title) {
    $('overlay-title').textContent = title;
    $('end-ribbon-band').setAttribute('fill', v ? 'var(--flag-red)' : 'var(--nightmare-btn-a)');
  }
  const key = v ? `${v.title}|${v.fly}|${state.lives}` : lose ? `lose|${lose.title}` : '';
  if (over.dataset.nmKey === key) return;
  over.dataset.nmKey = key;
  over.classList.toggle('nightmare-win', !!v);
  over.classList.toggle('nightmare-lose', !!lose);
  over.classList.toggle('fresh', !!v?.fly);
  $('end-nm').hidden = !v && !lose;
  const card = over.querySelector('.end-card');
  card.querySelector(':scope > .plq-deco')?.remove();
  $('end-look').hidden = !v?.reward;
  if (!v && !lose) {
    setHtml($('end-badge'), '');
    delete card.dataset.wood;
    setRibbon(RIBBON_NORMAL);
    return;
  }
  setRibbon(RIBBON_NM, null, v ? 'var(--flag-red-dark)' : 'var(--nightmare-btn-b)');
  over.querySelector('.end-band-text').textContent = title;
  card.dataset.wood = v ? v.wood : 'iron';
  const pill = ([word, num]) => `<span><small>${word}</small> ${num}</span>`;
  $('end-reward').hidden = !v?.reward;
  $('end-next').hidden = !v?.next || !!v?.reward;
  $('end-tip').hidden = !lose;
  if (lose) {
    setHtml($('end-badge'), loseRingSvg(160));
    $('end-badge').classList.remove('fly');
    setHtml(over.querySelector('.end-sparks'), '');
    $('end-nm-title').textContent = lose.title;
    setHtml($('end-badges'), lose.slots.map((x) => badgeSvg(36, x.reached ? x.tier : 0, x.label)).join(''));
    $('end-cond').textContent = '';
    setHtml($('end-conds'), '');
    setHtml($('end-values'), lose.values.map(pill).join(''));
    over.querySelector('#end-tip .tip-text').textContent = lose.tip;
  } else {
    setHtml($('end-badge'), badgeSvg(200, v.tier, `${v.title}`));
    $('end-badge').classList.remove('fly');
    if (v.fly) { void $('end-badge').offsetWidth; $('end-badge').classList.add('fly'); }
    setHtml(over.querySelector('.end-sparks'), v.tier === BADGE_TIERS.length ? SPARK.repeat(6) : '');
    $('end-nm-title').textContent = v.title;
    setHtml($('end-badges'), v.slots.map((x) => badgeSvg(40, x.reached ? x.tier : 0, x.label)).join(''));
    $('end-cond').textContent = v.condition;
    setHtml($('end-conds'), v.conds.map((c) => `<li class="${c.ok ? 'ok' : 'miss'}">${c.ok ? GG_MARK.ok : GG_MARK.broken}`
      + `<span class="ec-text">${c.text}</span><span class="ec-tier">${c.tier}</span><span class="sr">${c.ok ? 'erreicht' : 'nicht erreicht'}</span></li>`).join(''));
    setHtml($('end-values'), [['Welle', `${state.wave} / ${MAX_WAVES}`], ['Leben', `${Math.max(0, state.lives)} / ${maxLives(state)}`]].map(pill).join(''));
    $('end-reward').querySelector('.er-title').textContent = v.reward ?? '';
    if (v.next) setHtml($('end-next'), `${badgeSvg(44, 0)}<span><b>Nächstes Ziel: ${v.next.name}</b>${v.next.text}</span>`);
    // Rand-Deko des Kartenstils oben auf der Plakette (Maß nach dem Füllen)
    card.insertAdjacentHTML('afterbegin', nmWoodDeco(v.wood, card.offsetWidth, card.offsetHeight));
  }
  $('restart').focus({ preventScroll: true });
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
  const nightmareBefore = { ...nightmareProgress(progress, state.mapId) };
  // B-183: im Albtraum zählt auch das Abzeichen (Gold-Bedingung und kein Leben verloren)
  const badgeInfo = state.mode === 'nightmare'
    ? { goldOk: checkGoldCondition(state, state.mapId).ok, maxLives: maxLives(state), noLoss: !(state.track?.livesLost > 0) }
    : {};
  const res = recordResult(progress, { mapId: state.mapId, status: state.status, wave: state.wave, lives: state.lives, mode: state.mode, ...badgeInfo });
  if (state.mode === 'nightmare') { // B-182: Albtraum bleibt auf der Karte, Normal-Stand unberührt
    saveProgress(getStorage(), progress);
    resultText = nightmareResultLines(progress, state.mapId, res, nightmareBefore);
    winView = state.status === 'won' ? nightmareWinView(progress, state.mapId, res) : null; // B-184
    loseView = state.status === 'lost' ? nightmareLoseView(progress, state.mapId, { wave: state.wave, lives: state.lives, maxLives: maxLives(state) }) : null; // B-192
    $('restart').textContent = loseView ? 'Nochmal versuchen' : 'Neues Spiel';
    $('to-maps').textContent = winView || loseView ? 'Kartenauswahl' : 'Karten';
    return;
  }
  // Nach einem Sieg die nächste Karte vorwählen: „Neues Spiel“ startet dort, gemerkt auch fürs nächste Öffnen.
  mapId = mapAfterResult(progress, state.mapId, state.status);
  if (mapId !== state.mapId) progress.lastMap = mapId;
  saveProgress(getStorage(), progress);
  refreshMapOptions();
  winView = null;
  loseView = null;
  $('to-maps').textContent = 'Karten';
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
  updateMusic({ status: state.status, paused: state.paused, mapId: state.mapId, mode: state.mode });
  ui.messageTtl -= dt;
  ctx.setTransform(view.sx, 0, 0, view.sy, 0, 0); // HiDPI: Canvas-Einheiten (VIEW_WIDTH x VIEW_HEIGHT) -> Geräte-px
  renderView(ctx, state, ui);
  drawBackdrop();
  hudTimer -= dt;
  if (hudTimer <= 0) { refreshUI(); hudTimer = 0.1; }
  requestAnimationFrame(frame);
}
// Start im Hochformat: Hinweis erst hier anwenden, wenn alles initialisiert ist (vorher brach das Laden ab, z. B. ohne Vollbild-Knopf)
if (rotateQuery.matches || fsGate) applyRotateHint();
refreshUI();
requestAnimationFrame(frame);

if (TEST_MODE) {
  import('./test-page.js').then((m) => m.mountTestPanel({
    getState: () => state,
    ui,
    restartOn: (id) => { mapId = id; restart(); },
    // Weiterspielen nach erzwungenem Spielende: Overlay-Text des alten Ergebnisses verwerfen.
    resume: () => { resultSaved = false; resultText = []; winView = null; loseView = null; mapId = state.mapId; },
    refresh: refreshUI,
  }));
}
