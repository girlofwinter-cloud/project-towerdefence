// Startbildschirm mit Kartenkarten und Spielende-Plakette (Stil 1, C5).
// Reine Funktionen (mapCards, endView, starSvg) sind in Node testbar; mountStartScreen braucht das DOM
// und wird nur von main.js aufgerufen. Fortschritt wird hier nur gelesen, nie gespeichert.
import { MAPS, MAX_WAVES, STAR_LIVES_SHARE, VIEW_WIDTH, VIEW_HEIGHT, FRAME_MARGIN, SCREENS } from './config.js';
import { MAP_ORDER, mapProgress, isUnlocked, isNightmareUnlocked } from './progress.js';
import { createGame } from './game.js';
import { buildPaintedSvg, rasterizePainted, paletteFor } from './render-painted.js';

export const STAR_COUNT = STAR_LIVES_SHARE.length;

// Wert einer Option der Kartenauswahl im Band: 'meadow' (Normal) bzw. 'meadow:nightmare' (Albtraum).
export const mapSelectValue = (mapId, mode = 'normal') => (mode === 'nightmare' ? `${mapId}:nightmare` : mapId);
export function parseMapSelectValue(value) {
  const [mapId, m] = String(value).split(':');
  return { mapId, mode: m === 'nightmare' ? 'nightmare' : 'normal' };
}
// Optionen der Kartenauswahl im Band. testMode: zusätzlich je Karte eine Albtraum-Variante.
export function mapSelectOptions({ testMode = false } = {}) {
  const ids = Object.keys(MAPS);
  const opts = ids.map((mapId) => ({ value: mapId, mapId, mode: 'normal' }));
  if (testMode) for (const mapId of ids) opts.push({ value: mapSelectValue(mapId, 'nightmare'), mapId, mode: 'nightmare' });
  return opts;
}

// Daten je Kartenkarte in MAP_ORDER. allOpen: Testseite (alle Karten offen).
export function mapCards(progress, { allOpen = false } = {}) {
  return MAP_ORDER.map((id, i) => {
    const name = MAPS[id].name;
    const open = allOpen || isUnlocked(progress, id);
    const { bestWave, stars } = mapProgress(progress, id);
    const lockedBy = open ? null : MAPS[MAP_ORDER[i - 1]].name;
    const best = bestWave > 0 ? `Beste Welle ${bestWave} / ${MAX_WAVES}` : 'Noch nicht gespielt';
    const line = open ? best : `Gewinne erst ${lockedBy}`;
    const label = open
      ? `${name}, ${stars} von ${STAR_COUNT} Sternen, ${bestWave > 0 ? `beste Welle ${bestWave}` : 'noch nicht gespielt'}`
      : `${name}, gesperrt: gewinne erst ${lockedBy}`;
    const nightmare = open && (allOpen || isNightmareUnlocked(progress, id)); // B-182: Knopf „Albtraum“
    return { id, name, open, stars, bestWave, line, label, nightmare };
  });
}

// Neuer Fokus in der Kartenreihe bei Pfeil links/rechts: nur offene Karten, am Rand bleibt er stehen.
export function moveFocus(cards, currentId, dir) {
  const open = cards.filter((c) => c.open).map((c) => c.id);
  const i = open.indexOf(currentId);
  if (i < 0) return open[0] ?? currentId;
  return open[Math.max(0, Math.min(open.length - 1, i + dir))];
}

// Anzeige der Spielende-Plakette: Bandfarbe, Titel und volle Sterne (nur bei Sieg).
export function endView(status, stars) {
  if (status === 'won') return { title: 'Gewonnen!', ribbon: '#c4452f', stars: Math.max(0, Math.min(STAR_COUNT, stars)), showStars: true };
  return { title: 'Verloren', ribbon: '#6b5a48', stars: 0, showStars: false };
}

// Stern als SVG (voll Gold, leer Dunkelbraun, Kontur Tinte)
export function starSvg(full, size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">`
    + `<path d="M12 2.2 L14.9 8.6 L21.8 9.3 L16.6 14 L18.1 20.9 L12 17.3 L5.9 20.9 L7.4 14 L2.2 9.3 L9.1 8.6 Z" fill="${full ? '#f2c14e' : '#5a3a22'}" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
export const starsHtml = (n, size) => Array.from({ length: STAR_COUNT }, (_, i) => starSvg(i < n, size)).join('');

const LOCK_SVG = '<svg class="map-lock" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">'
  + '<path d="M13 20 V14 a9 9 0 0 1 18 0 V20" fill="none" stroke="#2b1a10" stroke-width="7"/><path d="M13 20 V14 a9 9 0 0 1 18 0 V20" fill="none" stroke="#d9dde2" stroke-width="3"/>'
  + '<rect x="8" y="20" width="28" height="20" rx="4" fill="#f2c14e" stroke="#2b1a10" stroke-width="3"/><circle cx="22" cy="29" r="3" fill="#2b1a10"/></svg>';

// ---------- Vorschaubilder (nur Browser) ----------
// Gemaltes SVG der Karte klein rastern (Faktor 0.25), davon nur das Feld zeigen. Gecacht, eines nach dem anderen.
const THUMB_SCALE = 0.25;
const thumbCache = new Map();
let thumbQueue = Promise.resolve();
function thumbFor(mapId) {
  if (!thumbCache.has(mapId)) {
    thumbCache.set(mapId, thumbQueue = thumbQueue.then(() => new Promise((r) => setTimeout(r, 0)))
      .then(() => rasterizePainted(buildPaintedSvg(createGame({ mapId })), THUMB_SCALE))
      .catch(() => null));
  }
  return thumbCache.get(mapId);
}
function paintThumb(cv, mapId) {
  const c = cv.getContext('2d');
  c.fillStyle = paletteFor(mapId).ground?.[1] ?? '#78a043'; // Bodenfarbe, bis das Bild fertig ist
  c.fillRect(0, 0, cv.width, cv.height);
  thumbFor(mapId).then((img) => {
    if (!img) return;
    const m = FRAME_MARGIN * THUMB_SCALE;
    c.drawImage(img, m, m, (VIEW_WIDTH - 2 * FRAME_MARGIN) * THUMB_SCALE, (VIEW_HEIGHT - 2 * FRAME_MARGIN) * THUMB_SCALE, 0, 0, cv.width, cv.height);
  });
}

// ---------- Startbildschirm (DOM) ----------
// opts: getProgress(), allOpen, currentMap() (vorgewählte Karte), onPick(id, mode) (mode 'normal' | 'nightmare').
// Rückgabe: show(closable), hide(), isOpen(), handleKey(ev) (true = Taste verbraucht).
export function mountStartScreen(root, opts) {
  const list = root.querySelector('.map-cards');
  let closable = false;
  let cards = [];

  function build() {
    cards = mapCards(opts.getProgress(), { allOpen: opts.allOpen });
    const current = opts.currentMap();
    list.replaceChildren(...cards.map((card) => {
      const btn = document.createElement('button');
      btn.className = 'map-card plq';
      btn.dataset.map = card.id;
      btn.setAttribute('aria-label', card.label);
      btn.disabled = !card.open;
      btn.classList.toggle('current', card.id === current);
      btn.innerHTML = `<canvas class="map-thumb" width="${SCREENS.thumb.width}" height="${SCREENS.thumb.height}"></canvas>`
        + (card.open ? '' : LOCK_SVG)
        + `<span class="map-name">${card.name}</span><span class="map-stars">${starsHtml(card.stars, 24)}</span><span class="map-best">${card.line}</span>`;
      paintThumb(btn.querySelector('canvas'), card.id);
      btn.addEventListener('click', () => pick(card.id));
      // B-182: Karte und Albtraum-Knopf in einer Hülle (kein Knopf im Knopf); der Knopf liegt oben rechts auf der Karte
      const slot = document.createElement('div');
      slot.className = 'map-slot';
      slot.setAttribute('role', 'listitem');
      slot.append(btn);
      if (card.nightmare) {
        const nm = document.createElement('button');
        nm.className = 'map-nightmare';
        nm.dataset.map = card.id;
        nm.textContent = 'Albtraum';
        nm.setAttribute('aria-label', `${card.name} im Albtraum-Modus spielen`);
        nm.addEventListener('click', () => pick(card.id, 'nightmare'));
        slot.append(nm);
      }
      return slot;
    }));
  }
  const cardBtn = (id) => list.querySelector(`.map-card[data-map="${id}"]`);
  function focusCard(id) {
    for (const b of list.querySelectorAll('.map-card')) b.classList.toggle('current', b.dataset.map === id);
    cardBtn(id)?.focus({ preventScroll: true });
  }
  function pick(id, mode = 'normal') {
    const card = cards.find((c) => c.id === id);
    if (!card?.open || (mode === 'nightmare' && !card.nightmare)) return;
    hide();
    opts.onPick(id, mode);
  }
  function show(canClose = false) {
    closable = canClose;
    build();
    root.hidden = false;
    document.body.classList.add('on-start');
    root.scrollTop = 0;
    cardBtn(opts.currentMap())?.focus({ preventScroll: true });
  }
  function hide() {
    root.hidden = true;
    document.body.classList.remove('on-start');
  }
  const current = () => list.querySelector('.map-card.current')?.dataset.map ?? opts.currentMap();
  function handleKey(ev) {
    if (root.hidden) return false;
    const key = ev.key;
    // Ton (M) und Bedienung oben rechts bleiben erreichbar
    const onTopButton = ev.target instanceof Element && ev.target.closest('.top-buttons');
    if (key.toLowerCase() === 'm') return false;
    if (onTopButton && (key === 'Enter' || key === ' ')) return true; // Knopf löst selbst aus, Spiel bekommt die Taste nicht
    if (key === 'ArrowLeft' || key === 'ArrowRight') { ev.preventDefault(); focusCard(moveFocus(cards, current(), key === 'ArrowLeft' ? -1 : 1)); }
    else if (key === 'Enter' || key === ' ') {
      ev.preventDefault();
      const nm = ev.target instanceof Element ? ev.target.closest('.map-nightmare') : null;
      if (nm) { pick(nm.dataset.map, 'nightmare'); return true; }
      const focused = ev.target instanceof Element ? ev.target.closest('.map-card') : null;
      pick(focused?.dataset.map ?? current());
    } else if (key === 'Escape') close();
    return true; // alle Spieltasten sind gesperrt (Tab bewegt weiter den Fokus, main.js nutzt Tab nicht)
  }
  function close() { if (closable) hide(); }
  // Fokus per Tab/Maus zieht den gelben Ring mit
  list.addEventListener('focusin', (ev) => {
    const b = ev.target.closest('.map-card');
    if (b && !b.disabled) for (const x of list.querySelectorAll('.map-card')) x.classList.toggle('current', x === b);
  });
  return { show, hide, handleKey, isOpen: () => !root.hidden };
}
