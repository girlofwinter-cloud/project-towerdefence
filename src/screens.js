// Startbildschirm mit Kartenkarten und Spielende-Plakette (Stil 1, C5).
// Reine Funktionen (mapCards, endView, starSvg) sind in Node testbar; mountStartScreen braucht das DOM
// und wird nur von main.js aufgerufen. Fortschritt wird hier nur gelesen, nie gespeichert.
import { MAPS, MAX_WAVES, STAR_LIVES_SHARE, VIEW_WIDTH, VIEW_HEIGHT, FRAME_MARGIN, SCREENS, BADGE_TIERS, GOLD_CONDITIONS, COSMETICS } from './config.js';
import { MAP_ORDER, mapProgress, isUnlocked, isNightmareUnlocked, nightmareProgress, badgeCount, BADGE_MAX } from './progress.js';
import { isGoldTowersUnlocked, isNightUnlocked, goldMapsProgress, nightLookChosen, goldTowersChosen, setNightLook, setGoldTowers } from './cosmetics.js';
import { badgeSvg } from './badge-art.js';
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

// ---------- B-184: Albtraum-Abzeichen in Kartenauswahl und Siegbildschirm ----------
// Bedingungen der drei Stufen einer Karte (Bronze, Silber, Gold).
export function badgeConditions(mapId) {
  return [`Welle ${MAX_WAVES} im Albtraum`, 'ohne Lebensverlust', GOLD_CONDITIONS[mapId]?.label ?? ''];
}
// Drei Slots einer Karte: Stufe, erreicht ja/nein, zugänglicher Name (z. B. „Gold: ohne Fähigkeiten, offen“).
export function badgeSlots(progress, mapId) {
  const have = nightmareProgress(progress, mapId).badge ?? 0;
  const cond = badgeConditions(mapId);
  return BADGE_TIERS.map((name, i) => ({ tier: i + 1, reached: have > i, label: `${name}: ${cond[i]}${have > i ? '' : ', offen'}` }));
}
// Zähler im Kopf der Kartenauswahl (jede Stufe zählt, Gold auf einer Karte = 3)
export function badgeCounterText(progress) {
  return `Abzeichen ${badgeCount(progress)} / ${BADGE_MAX}`;
}
// Siegbildschirm im Albtraum. res = Rückgabe von recordResult (mit newBadge), progress = Stand danach.
// tier = höchstes neue Abzeichen dieses Spiels, sonst die vorhandene höchste Stufe; fly nur bei neuem Abzeichen;
// reward nur, wenn Gold neu erreicht wurde (Nacht-Look der Karte, beim letzten Gold die goldenen Türme). null = kein Albtraum-Sieg.
export function nightmareWinView(progress, mapId, res = {}) {
  const have = nightmareProgress(progress, mapId).badge ?? 0;
  const fresh = res.newBadge > 0 ? Math.min(BADGE_TIERS.length, res.newBadge) : 0;
  const tier = fresh || have;
  if (!tier || !MAPS[mapId]) return null;
  const name = MAPS[mapId].name;
  let reward = null;
  if (fresh === BADGE_TIERS.length) {
    reward = `Neue Belohnung freigeschaltet: ${isGoldTowersUnlocked(progress) ? COSMETICS.goldTowers.name : `${COSMETICS.night.name} ${name}`}`;
  }
  return {
    tier,
    fly: fresh > 0,
    title: `${name} – ${BADGE_TIERS[tier - 1]}-Abzeichen`,
    condition: `${BADGE_TIERS[tier - 1]}: ${badgeConditions(mapId)[tier - 1]}`,
    slots: badgeSlots(progress, mapId),
    reward,
  };
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
// opts: getProgress(), allOpen, currentMap() (vorgewählte Karte), currentMode() (Ansicht beim Öffnen, B-184),
// onPick(id, mode) (mode 'normal' | 'nightmare').
// Rückgabe: show(closable), hide(), isOpen(), handleKey(ev) (true = Taste verbraucht).
// B-184: kleines Schloss (Albtraum gesperrt) und Hinweistext
const SMALL_LOCK = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 11 V8 a5 5 0 0 1 10 0 V11" fill="none" stroke="var(--lock-shackle)" stroke-width="2.5"/>'
  + '<rect x="4" y="10" width="16" height="12" rx="3" fill="#f2c14e" stroke="#2b1a10" stroke-width="2"/></svg>';
const NM_LOCKED = 'Albtraum: 3 Sterne nötig';
export function mountStartScreen(root, opts) {
  const list = root.querySelector('.map-cards');
  const modeBar = root.querySelector('.start-mode');
  const counter = root.querySelector('.badge-count');
  const hint = root.querySelector('.start-hint');
  let closable = false;
  // Knopf „Zurück zum Spiel“: nur sichtbar, wenn die Auswahl aus einem Spiel heraus geöffnet wurde
  const back = root.querySelector('.start-back');
  back?.addEventListener('click', () => close());
  let cards = [];
  let view = 'normal'; // B-184: Ansicht Normal oder Albtraum
  const selectable = () => (view === 'nightmare' ? cards.map((c) => ({ ...c, open: c.nightmare })) : cards);

  function build() {
    const progress = opts.getProgress();
    cards = mapCards(progress, { allOpen: opts.allOpen });
    const nm = view === 'nightmare';
    // vorgewählte Karte; in der Albtraum-Ansicht die erste spielbare, wenn sie dort gesperrt ist
    const usableIds = cards.filter((c) => (nm ? c.nightmare : c.open)).map((c) => c.id);
    const current = usableIds.includes(opts.currentMap()) ? opts.currentMap() : (usableIds[0] ?? opts.currentMap());
    root.classList.toggle('nightmare', nm);
    for (const b of modeBar?.querySelectorAll('button') ?? []) b.setAttribute('aria-checked', String(b.dataset.mode === view));
    if (counter) {
      const text = badgeCounterText(progress);
      counter.setAttribute('aria-label', text);
      counter.innerHTML = `${badgeSvg(36, 3)}<span aria-hidden="true">${text.replace('Abzeichen ', '<span class="bc-word">Abzeichen </span>')}</span>`;
    }
    hint?.classList.remove('show-badges');
    list.replaceChildren(...cards.map((card) => {
      const btn = document.createElement('button');
      btn.className = 'map-card plq';
      btn.dataset.map = card.id;
      const usable = nm ? card.nightmare : card.open;
      btn.setAttribute('aria-label', nm ? `${card.name} im Albtraum${card.nightmare ? '' : `, gesperrt: ${NM_LOCKED}`}` : card.label);
      btn.disabled = !usable;
      btn.classList.toggle('current', card.id === current);
      const thumb = `<canvas class="map-thumb" width="${SCREENS.thumb.width}" height="${SCREENS.thumb.height}"></canvas>`;
      const nmLocked = `<span class="map-nm-locked">${SMALL_LOCK}<span>${NM_LOCKED}</span></span>`;
      const head = `<span class="map-name">${card.name}</span><span class="map-stars">${starsHtml(card.stars, 24)}</span>`;
      btn.innerHTML = nm
        ? `<span class="map-thumb-wrap">${thumb}${card.nightmare ? '' : LOCK_SVG}</span>${head}${card.nightmare ? '' : nmLocked}`
        : thumb + (card.open ? '' : LOCK_SVG) + head + `<span class="map-best">${card.line}</span>`
          + (card.open && !card.nightmare ? nmLocked : '');
      paintThumb(btn.querySelector('canvas'), card.id);
      btn.addEventListener('click', () => pick(card.id, nm ? 'nightmare' : 'normal'));
      // B-182: Karte und Albtraum-Knopf in einer Hülle (kein Knopf im Knopf); B-184: Knopf unten auf der Karte
      const slot = document.createElement('div');
      slot.className = 'map-slot';
      slot.setAttribute('role', 'listitem');
      slot.append(btn);
      if (card.nightmare) {
        slot.classList.add('has-nm');
        if (nm) slot.append(badgeRow(progress, card));
        const b = document.createElement('button');
        b.className = 'map-nightmare';
        b.dataset.map = card.id;
        b.textContent = nm ? 'Albtraum spielen' : 'Albtraum';
        b.setAttribute('aria-label', `${card.name} im Albtraum-Modus spielen`);
        b.addEventListener('click', () => pick(card.id, 'nightmare'));
        slot.append(b);
      }
      return slot;
    }));
  }
  // B-184: Slot-Reihe (ein Tippziel); Tipp schreibt die drei Bedingungen in den Hinweis
  function badgeRow(progress, card) {
    const slots = badgeSlots(progress, card.id);
    const row = document.createElement('button');
    row.className = 'map-badges';
    row.dataset.map = card.id;
    row.setAttribute('aria-label', `Abzeichen ${card.name}: ${slots.map((x) => x.label).join('; ')}`);
    row.innerHTML = slots.map((x) => badgeSvg(44, x.reached ? x.tier : 0, x.label)).join('');
    row.addEventListener('click', () => {
      if (!hint) return;
      let text = hint.querySelector('.badge-hint');
      if (!text) { text = document.createElement('span'); text.className = 'badge-hint'; hint.append(text); }
      text.textContent = `${card.name}: ${slots.map((x) => x.label.replace(', offen', '')).join(' · ')}`;
      hint.classList.add('show-badges');
    });
    return row;
  }
  function setView(v) {
    if (v === view) return;
    view = v;
    build(); // Fokus bleibt auf dem Umschalter
  }
  modeBar?.addEventListener('click', (ev) => {
    const b = ev.target instanceof Element ? ev.target.closest('button[data-mode]') : null;
    if (b) setView(b.dataset.mode === 'nightmare' ? 'nightmare' : 'normal');
  });
  const cardBtn = (id) => list.querySelector(`.map-card[data-map="${id}"]`);
  function focusCard(id) {
    for (const b of list.querySelectorAll('.map-card')) b.classList.toggle('current', b.dataset.map === id);
    cardBtn(id)?.focus({ preventScroll: true });
  }
  function pick(id, mode = 'normal') {
    const card = cards.find((c) => c.id === id);
    if (!card?.open || (mode === 'nightmare' && !card.nightmare)) return;
    if (closable && opts.confirmLeave && !opts.confirmLeave()) return; // laufendes Spiel nicht ungefragt verwerfen
    hide();
    opts.onPick(id, mode);
  }
  function show(canClose = false) {
    closable = canClose;
    if (back) back.hidden = !canClose;
    view = opts.currentMode?.() === 'nightmare' ? 'nightmare' : 'normal';
    build();
    root.hidden = false;
    document.body.classList.add('on-start');
    root.scrollTop = 0;
    list.querySelector('.map-card.current')?.focus({ preventScroll: true });
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
    // B-184: Umschalter und Slot-Reihe sind eigene Knöpfe (B-185: auch „Aussehen“)
    const ownButton = ev.target instanceof Element && ev.target.closest('.start-mode, .map-badges, .cos-open, .start-back'); // B-185: Knopf „Aussehen“
    if (ownButton && (key === 'Enter' || key === ' ')) return true;
    if (key === 'ArrowLeft' || key === 'ArrowRight') { ev.preventDefault(); focusCard(moveFocus(selectable(), current(), key === 'ArrowLeft' ? -1 : 1)); }
    else if (key === 'Enter' || key === ' ') {
      ev.preventDefault();
      const nm = ev.target instanceof Element ? ev.target.closest('.map-nightmare') : null;
      if (nm) { pick(nm.dataset.map, 'nightmare'); return true; }
      const focused = ev.target instanceof Element ? ev.target.closest('.map-card') : null;
      pick(focused?.dataset.map ?? current(), view);
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

// ---------- B-185: Menü „Aussehen“ (Bauvorlage docs/design/elemente/Kosmetik-Aussehen.md) ----------
export const COS_LOCKED_NIGHT = 'Gold im Albtraum nötig';
export const COS_LOCKED_GOLD = 'Gold auf allen Karten nötig';
// Zeilen des Menüs: je Karte (MAP_ORDER) der Nacht-Look, dazu die goldenen Türme mit Fortschritt.
// on = freigeschaltet und nicht abgeschaltet; gesperrt = immer aus.
export function cosmeticsView(progress) {
  const row = (key, mapId, title, unlocked, chosen, reason) => {
    const on = unlocked && chosen;
    return { key, mapId, title, unlocked, on, reason: unlocked ? '' : reason,
      label: `${title}, ${unlocked ? (on ? 'an' : 'aus') : 'gesperrt'}` };
  };
  const night = MAP_ORDER.map((id) => row(`night:${id}`, id, `${COSMETICS.night.name} ${MAPS[id].name}`,
    isNightUnlocked(progress, id), nightLookChosen(progress, id), COS_LOCKED_NIGHT));
  const prog = goldMapsProgress(progress);
  const gold = { ...row('gold', null, COSMETICS.goldTowers.name, isGoldTowersUnlocked(progress), goldTowersChosen(progress), COS_LOCKED_GOLD),
    done: prog.done, total: prog.total, progressText: `Gold auf ${prog.done} / ${prog.total} Karten` };
  return { night, gold };
}
// Eine Zeile als HTML (Name, ggf. Schloss + Grund, Schalter rechts). name: sichtbarer Name (beim Nacht-Look nur die Karte).
function cosRowHtml(r, name) {
  const lock = r.unlocked ? '' : `<span class="cos-lock">${SMALL_LOCK}<span>${r.reason}</span></span>`;
  return `<div class="cos-row${r.unlocked ? '' : ' locked'}"><span class="cos-name">${name}</span>${lock}`
    + `<button type="button" class="sw" role="switch" data-key="${r.key}" aria-checked="${r.on}" aria-label="${r.label}"${r.unlocked ? '' : ' disabled'}><span class="knob"></span></button></div>`;
}
// Inhalt der Plakette (rein, testbar). Fortschrittsleiste nur, solange die goldenen Türme gesperrt sind.
export function cosmeticsHtml(view) {
  const g = view.gold;
  const pct = g.total ? Math.round((100 * g.done) / g.total) : 0;
  const prog = g.unlocked ? '' : `<div class="cos-prog"><span class="cos-prog-text">${g.progressText}</span>`
    + `<span class="cos-bar" role="progressbar" aria-label="${g.progressText}" aria-valuemin="0" aria-valuemax="${g.total}" aria-valuenow="${g.done}"><span style="width:${pct}%"></span></span></div>`;
  return `<h3 class="cos-sec">${COSMETICS.night.name}</h3>${view.night.map((r) => cosRowHtml(r, MAPS[r.mapId].name)).join('')}`
    + `<h3 class="cos-sec">${COSMETICS.goldTowers.name}</h3>${cosRowHtml(g, COSMETICS.goldTowers.name)}${prog}`;
}
// Schalter umlegen (verändert progress); false, wenn gesperrt oder unbekannt.
export function toggleCosmetic(progress, key) {
  const view = cosmeticsView(progress);
  if (key === 'gold') return setGoldTowers(progress, !view.gold.on);
  const r = view.night.find((x) => x.key === key);
  return r ? setNightLook(progress, r.mapId, !r.on) : false;
}

// Dialog (DOM, nur Browser). opts: getProgress(), onChange() (speichern und Optik anwenden), returnFocus (Element).
// Rückgabe: open(), close(), isOpen(), handleKey(ev) (true = Taste verbraucht).
export function mountCosmeticsMenu(root, opts) {
  const body = root.querySelector('.cos-body');
  let lastFocus = null;
  function build() {
    const focusedKey = document.activeElement?.closest?.('.sw')?.dataset.key;
    body.innerHTML = cosmeticsHtml(cosmeticsView(opts.getProgress()));
    if (focusedKey) body.querySelector(`.sw[data-key="${focusedKey}"]`)?.focus({ preventScroll: true });
  }
  body.addEventListener('click', (ev) => {
    const sw = ev.target instanceof Element ? ev.target.closest('.sw') : null;
    if (!sw || sw.disabled) return;
    if (toggleCosmetic(opts.getProgress(), sw.dataset.key)) { opts.onChange(); build(); }
  });
  root.querySelector('.cos-close')?.addEventListener('click', close);
  root.addEventListener('click', (ev) => { if (ev.target === root) close(); }); // Tipp neben die Plakette
  function open() {
    lastFocus = document.activeElement;
    build();
    root.hidden = false;
    body.scrollTop = 0;
    (body.querySelector('.sw:not(:disabled)') ?? root.querySelector('.cos-close'))?.focus({ preventScroll: true });
  }
  function close() {
    if (root.hidden) return;
    root.hidden = true;
    lastFocus?.focus?.({ preventScroll: true });
  }
  const focusables = () => [...root.querySelectorAll('button:not(:disabled)')];
  function handleKey(ev) {
    if (root.hidden) return false;
    if (ev.key === 'Escape') { ev.preventDefault(); close(); return true; }
    if (ev.key === 'Tab') { // Fokus bleibt im Dialog
      const f = focusables();
      const i = f.indexOf(document.activeElement);
      if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1]?.focus(); }
      else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0]?.focus(); }
      return true;
    }
    if (String(ev.key).toLowerCase() === 'm') return false; // Ton bleibt schaltbar
    return true; // Enter/Leertaste lösen den fokussierten Knopf selbst aus; keine Spieltasten
  }
  return { open, close, handleKey, isOpen: () => !root.hidden };
}
