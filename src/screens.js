// Startbildschirm mit Kartenkarten und Spielende-Plakette (Stil 1, C5).
// Reine Funktionen (mapCards, endView, starSvg) sind in Node testbar; mountStartScreen braucht das DOM
// und wird nur von main.js aufgerufen. Fortschritt wird hier nur gelesen, nie gespeichert.
import { MAPS, MAX_WAVES, STAR_LIVES_SHARE, VIEW_WIDTH, VIEW_HEIGHT, FRAME_MARGIN, SCREENS, BADGE_TIERS, GOLD_CONDITIONS, COSMETICS, NM_STYLE_OF_MAP, NM_ENEMY_STYLE, TOWER_TYPES } from './config.js';
import { NM_STYLE_NAME, NM_WOOD_OF_MAP } from './nm-wood.js';
import { MAP_ORDER, mapProgress, isUnlocked, isNightmareUnlocked, nightmareProgress, badgeCount, BADGE_MAX } from './progress.js';
import { isGoldTowersUnlocked, isNightUnlocked, goldMapsProgress, nightLookChosen, goldTowersChosen, setNightLook, setGoldTowers } from './cosmetics.js';
import { badgeSvg, HORN_L, HORN_R, FACE, EYE_L, EYE_R } from './badge-art.js';
import { createGame } from './game.js';
import { drawTowerFigure, towerFootY } from './render-towers.js';
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
// B-191: Zähler im Normalmodus (Sterne über alle Karten)
export function starCounterText(progress) {
  const n = MAP_ORDER.reduce((sum, id) => sum + mapProgress(progress, id).stars, 0);
  return `Sterne ${n} / ${MAP_ORDER.length * STAR_COUNT}`;
}
// B-191: Albtraum-Stil einer Karte (Name und Augenfarbe, Karten-Bauvorlagen); unbekannte Karte: Stil A
export function nmStyleOf(mapId) {
  const style = NM_STYLE_OF_MAP[mapId] ?? 'A';
  return { name: NM_STYLE_NAME[mapId] ?? NM_STYLE_NAME.meadow, eye: NM_ENEMY_STYLE[style].eye };
}
// B-191: Bedingungskasten einer Albtraum-Karte (Gold-Bedingung und nächste offene Stufe)
export function nightmareCardInfo(progress, mapId) {
  const have = nightmareProgress(progress, mapId).badge ?? 0;
  return { cond: `Gold: ${GOLD_CONDITIONS[mapId]?.label ?? ''}`,
    next: have >= BADGE_TIERS.length ? 'alle Abzeichen geholt' : `nächstes: ${BADGE_TIERS[have]}` };
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
  const cond = badgeConditions(mapId);
  return {
    tier,
    fly: fresh > 0,
    title: `${name} – ${BADGE_TIERS[tier - 1]}-Abzeichen`,
    condition: `${BADGE_TIERS[tier - 1]}: ${cond[tier - 1]}`,
    slots: badgeSlots(progress, mapId),
    reward,
    // B-192: Bedingungsliste (erreicht bis zur gezeigten Stufe) und nächstes Ziel (nur unter Gold)
    conds: BADGE_TIERS.map((t, i) => ({ text: cond[i], tier: t, ok: i < tier })),
    next: tier >= BADGE_TIERS.length ? null : { name: BADGE_TIERS[tier],
      text: tier === 1 ? `Welle ${MAX_WAVES} schaffen, ohne ein Leben zu verlieren.` : `Silber plus: ${cond[2]}.` },
    wood: NM_WOOD_OF_MAP[mapId] ?? 'moss',
  };
}
// B-192: Tipps für den Niederlage-Bildschirm im Albtraum (einer je Niederlage, nach der erreichten Welle)
export const NM_TIPS = [
  'Verbessere wenige Türme kräftig, statt viele schwache zu bauen.',
  'Spar dir eine Fähigkeit für die Boss-Wellen auf.',
  'Frost vor Kanonen: gebremste Gruppen stehen länger im Feuer.',
  'Schau vor jeder Welle in die Vorschau und baue passend.',
  'Baue an Kurven, dort sind Gegner am längsten in Reichweite.',
];
// B-192: Niederlage im Albtraum. run = { wave, lives, maxLives } des Spiels, progress = Stand danach. null = keine bekannte Karte.
export function nightmareLoseView(progress, mapId, run = {}) {
  if (!MAPS[mapId]) return null;
  const wave = Math.max(0, Math.floor(run.wave) || 0);
  const best = nightmareProgress(progress, mapId).bestWave ?? 0;
  return {
    title: `${MAPS[mapId].name} – Welle ${wave} von ${MAX_WAVES}`,
    values: [['Welle', `${wave} / ${MAX_WAVES}`], ['Leben', `${Math.max(0, run.lives ?? 0)} / ${run.maxLives ?? 0}`], ['Bester Lauf', `Welle ${Math.max(best, wave)}`]],
    tip: NM_TIPS[wave % NM_TIPS.length],
    slots: badgeSlots(progress, mapId),
  };
}
// B-192: leerer Ring mit Ogerkopf (Niederlage), Box 100, Augen pulsieren (.nm-pulse)
export function loseRingSvg(size) {
  const head = 'transform="translate(12,12) scale(0.76)"';
  return `<svg class="end-lose-ring" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">`
    + '<circle cx="50" cy="50" r="36" fill="var(--night-card-b)" stroke="var(--muted)" stroke-width="3" stroke-dasharray="7 6"/>'
    + `<g ${head} fill="#5a4a6a" fill-opacity="0.55"><path d="${HORN_L}"/><path d="${HORN_R}"/><path d="${FACE}"/></g>`
    + `<g class="nm-pulse" ${head} fill="var(--nm-eye-moss)"><path d="${EYE_L}"/><path d="${EYE_R}"/></g></svg>`;
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
// night (B-191): Vorschau im Albtraum-Look des Kartenstils; buildPaintedSvg malt ihn ab den Karten (B-194ff), bis dahin wie heute.
const THUMB_SCALE = 0.25;
const thumbCache = new Map();
let thumbQueue = Promise.resolve();
function thumbFor(mapId, night = false) {
  const key = `${mapId}|${night ? 'night' : 'day'}`;
  if (!thumbCache.has(key)) {
    thumbCache.set(key, thumbQueue = thumbQueue.then(() => new Promise((r) => setTimeout(r, 0)))
      .then(() => rasterizePainted(buildPaintedSvg(createGame({ mapId }), { look: night ? 'nightmare' : 'normal' }), THUMB_SCALE))
      .catch(() => null));
  }
  return thumbCache.get(key);
}
function paintThumb(cv, mapId, { night = false } = {}) {
  const c = cv.getContext('2d');
  c.fillStyle = paletteFor(mapId).ground?.[1] ?? '#78a043'; // Bodenfarbe, bis das Bild fertig ist
  c.fillRect(0, 0, cv.width, cv.height);
  thumbFor(mapId, night).then((img) => {
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
export const NM_NEED = '3 Sterne nötig';
// B-191: Mond (24er Box) und Fahne (Symbol im Kopf, Normal)
export const MOON_SVG = (size) => `<svg class="moon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3 A9 9 0 1 0 21 14 A7 7 0 1 1 14 3 Z" fill="var(--cream)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/></svg>`;
const FLAG_SVG = '<svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true"><path d="M18 8 V54" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>'
  + '<path d="M20 10 L50 20 L20 32 Z" fill="var(--flag-red)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/><path d="M10 54 H28" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/></svg>';
// Kopfzeile je Ansicht
export function startHeadView(view) {
  return view === 'nightmare'
    ? { title: 'Albtraum', sub: 'Für Profis: jede Karte mit 3 Sternen' }
    : { title: 'Wähle deine Karte', sub: 'Hol 3 Sterne, um den Albtraum zu öffnen' };
}

// B-191: Inhalt einer Kartenhülle (.map-slot) als HTML (rein, testbar). view 'normal' | 'nightmare'.
// Normal: Karte mit Bestwert und Albtraum-Hinweis. Albtraum: Vorschau mit Stil-Schild, Slots, Bedingungskasten und Knopf;
// gesperrt mit Schloss, „3 Sterne nötig“ und Knopf „Gesperrt“ (aria-disabled).
export function mapSlotHtml(card, view, progress) {
  const nm = view === 'nightmare';
  const thumb = `<canvas class="map-thumb" width="${SCREENS.thumb.width}" height="${SCREENS.thumb.height}"></canvas>`;
  const head = `<span class="map-name">${card.name}</span><span class="map-stars">${starsHtml(card.stars, 28)}</span>`;
  const label = nm ? `${card.name} im Albtraum${card.nightmare ? '' : `, gesperrt: ${NM_LOCKED}`}` : card.label;
  const usable = nm ? card.nightmare : card.open;
  const open = `<button class="map-card plq" data-map="${card.id}" aria-label="${label}"${usable ? '' : ' disabled'}>`;
  if (!nm) {
    const nmLine = !card.open ? '' : card.nightmare
      ? `<span class="map-nm-open">${MOON_SVG(16)}Albtraum offen</span>`
      : '<span class="map-nm-locked">Albtraum ab 3 Sternen</span>';
    return `${open}${thumb}${card.open ? '' : LOCK_SVG}${head}<span class="map-best">${card.line}</span>${nmLine}</button>`;
  }
  const st = nmStyleOf(card.id);
  const shield = `<span class="map-style"><i style="background:${st.eye}"></i>${st.name}</span>`;
  const wrap = `<span class="map-thumb-wrap">${thumb}${card.nightmare ? '' : LOCK_SVG}${shield}</span>`;
  if (!card.nightmare) {
    return `${open}${wrap}${head}<span class="map-need"><b>${NM_NEED}</b><span>Hol den 3. Stern im Normalmodus</span></span></button>`
      + `<button type="button" class="map-nightmare locked" data-map="${card.id}" aria-disabled="true" aria-label="${card.name} im Albtraum: gesperrt, ${NM_NEED}">${SMALL_LOCK}Gesperrt</button>`;
  }
  const slots = badgeSlots(progress, card.id);
  const info = nightmareCardInfo(progress, card.id);
  return `${open}${wrap}${head}</button>`
    + `<button type="button" class="map-badges" data-map="${card.id}" aria-label="Abzeichen ${card.name}: ${slots.map((x) => x.label).join('; ')}">`
    + `${slots.map((x) => badgeSvg(44, x.reached ? x.tier : 0, x.label)).join('')}</button>`
    + `<span class="map-cond"><span>${info.cond}</span><span>${info.next}</span></span>`
    + `<button type="button" class="map-nightmare" data-map="${card.id}" aria-label="${card.name} im Albtraum-Modus spielen">`
    + '<span class="nm-long">Albtraum spielen</span><span class="nm-short">Spielen</span></button>';
}
// B-191: Lernzeile (Albtraum) und Lockplakette (Normal) als HTML
function learnHtml() {
  const tiers = [['Bronze', `Welle ${MAX_WAVES} im Albtraum schaffen`], ['Silber', 'dazu kein Leben verlieren'], ['Gold', 'dazu die Bedingung der Karte']];
  return `<div class="nl-intro"><h2>So holst du Abzeichen</h2><p>Jede Karte hat drei Stufen. Tippe auf die Slots einer Karte für ihre Bedingungen.</p></div>`
    + tiers.map(([name, text], i) => `<div class="nl-tier t${i + 1}">${badgeSvg(64, i + 1)}<span><b>${name}</b>${text}</span></div>`).join('')
    + '<p class="nl-reward">Gold schaltet den Nacht-Look der Karte frei, Gold auf allen Karten die goldenen Türme.</p>';
}
function teaserHtml(n) {
  return `${badgeSvg(62, 3)}<span class="nt-text"><b>Albtraum offen auf ${n} ${n === 1 ? 'Karte' : 'Karten'}</b>Stärkere Gegner, drei Abzeichen je Karte und Belohnungen.</span>`
    + `<button type="button" class="wbtn wbtn-night nt-switch">${MOON_SVG(20)}Umschalten</button>`;
}
export function mountStartScreen(root, opts) {
  const list = root.querySelector('.map-cards');
  const modeBar = root.querySelector('.start-mode');
  const counter = root.querySelector('.badge-count');
  const hint = root.querySelector('.start-hint');
  let closable = false;
  let cards = [];
  let view = 'normal'; // B-184: Ansicht Normal oder Albtraum
  const selectable = () => (view === 'nightmare' ? cards.map((c) => ({ ...c, open: c.nightmare })) : cards);

  const sym = root.querySelector('.start-sym');
  const title = root.querySelector('.start-title');
  const sub = root.querySelector('.start-sub');
  const learn = root.querySelector('.nm-learn');
  const teaser = root.querySelector('.nm-teaser');
  function build() {
    const progress = opts.getProgress();
    cards = mapCards(progress, { allOpen: opts.allOpen });
    const nm = view === 'nightmare';
    // vorgewählte Karte; in der Albtraum-Ansicht die erste spielbare, wenn sie dort gesperrt ist
    const usableIds = cards.filter((c) => (nm ? c.nightmare : c.open)).map((c) => c.id);
    const current = usableIds.includes(opts.currentMap()) ? opts.currentMap() : (usableIds[0] ?? opts.currentMap());
    root.classList.toggle('nightmare', nm);
    for (const b of modeBar?.querySelectorAll('button') ?? []) b.setAttribute('aria-checked', String(b.dataset.mode === view));
    // B-191: Kopf (Symbol, Titel, Untertitel) und Zähler je Ansicht
    const hv = startHeadView(view);
    if (title) title.textContent = hv.title;
    if (sub) sub.textContent = hv.sub;
    if (sym) sym.innerHTML = nm ? badgeSvg(60, 3) : FLAG_SVG;
    if (counter) {
      const text = nm ? badgeCounterText(progress) : starCounterText(progress);
      const [word, num] = [text.slice(0, text.indexOf(' ')), text.slice(text.indexOf(' ') + 1)];
      counter.setAttribute('aria-label', text);
      counter.innerHTML = `${nm ? badgeSvg(38, 3) : starSvg(true, 36)}<span aria-hidden="true"><span class="bc-word">${word} </span><span class="bc-num">${num}</span></span>`;
    }
    hint?.classList.remove('show-badges');
    list.replaceChildren(...cards.map((card) => {
      const slot = document.createElement('div');
      slot.className = 'map-slot';
      slot.setAttribute('role', 'listitem');
      slot.innerHTML = mapSlotHtml(card, view, progress);
      const btn = slot.querySelector('.map-card');
      btn.classList.toggle('current', card.id === current);
      paintThumb(btn.querySelector('canvas'), card.id, { night: nm });
      btn.addEventListener('click', () => pick(card.id, nm ? 'nightmare' : 'normal'));
      // B-182: Karte und Albtraum-Knopf in einer Hülle (kein Knopf im Knopf); B-184: Knopf unten auf der Karte
      slot.classList.toggle('has-nm', nm);
      slot.querySelector('.map-nightmare:not(.locked)')?.addEventListener('click', () => pick(card.id, 'nightmare'));
      slot.querySelector('.map-badges')?.addEventListener('click', () => showBadgeHint(progress, card));
      return slot;
    }));
    // B-191: Lernzeile nur im Albtraum (Höhe per CSS), Lockplakette nur im Normalmodus mit mindestens einer offenen Karte
    const nmOpen = cards.filter((c) => c.nightmare).length;
    if (learn) { learn.hidden = !nm; if (nm && !learn.firstChild) learn.innerHTML = learnHtml(); }
    if (teaser) {
      teaser.hidden = nm || nmOpen === 0;
      if (!teaser.hidden) {
        teaser.innerHTML = teaserHtml(nmOpen);
        teaser.querySelector('.nt-switch').addEventListener('click', () => setView('nightmare'));
      }
    }
  }
  // B-184: Tipp auf die Slot-Reihe schreibt die drei Bedingungen in den Hinweis
  function showBadgeHint(progress, card) {
    if (!hint) return;
    const slots = badgeSlots(progress, card.id);
    let text = hint.querySelector('.badge-hint');
    if (!text) { text = document.createElement('span'); text.className = 'badge-hint'; hint.append(text); }
    text.textContent = `${card.name}: ${slots.map((x) => x.label.replace(', offen', '')).join(' · ')}`;
    hint.classList.add('show-badges');
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
    hide();
    opts.onPick(id, mode);
  }
  function show(canClose = false) {
    closable = canClose;
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
    const ownButton = ev.target instanceof Element && ev.target.closest('.start-mode, .map-badges, .cos-open, .nm-teaser'); // B-185: Knopf „Aussehen“
    if (ownButton && (key === 'Enter' || key === ' ')) return true;
    if (key === 'ArrowLeft' || key === 'ArrowRight') { ev.preventDefault(); focusCard(moveFocus(selectable(), current(), key === 'ArrowLeft' ? -1 : 1)); }
    else if (key === 'Enter' || key === ' ') {
      ev.preventDefault();
      const nm = ev.target instanceof Element ? ev.target.closest('.map-nightmare') : null;
      if (nm?.classList.contains('locked')) return true; // B-191: Knopf „Gesperrt“
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
// B-191: state (Zustandswort), sub (Unterzeile: frei mit Stilname, gesperrt mit Grund und eigener Stufe), tier (bestes Abzeichen)
const tierName = (t) => (t > 0 ? BADGE_TIERS[t - 1] : 'kein Abzeichen');
export function cosmeticsView(progress) {
  const row = (key, mapId, title, unlocked, chosen, reason) => {
    const on = unlocked && chosen;
    return { key, mapId, title, unlocked, on, reason: unlocked ? '' : reason,
      state: unlocked ? (on ? 'An' : 'Aus') : 'Gesperrt',
      label: `${title}, ${unlocked ? (on ? 'an' : 'aus') : 'gesperrt'}` };
  };
  const night = MAP_ORDER.map((id) => {
    const r = row(`night:${id}`, id, `${COSMETICS.night.name} ${MAPS[id].name}`, isNightUnlocked(progress, id), nightLookChosen(progress, id), COS_LOCKED_NIGHT);
    const tier = nightmareProgress(progress, id).badge ?? 0;
    const style = nmStyleOf(id).name;
    return { ...r, tier, style, sub: r.unlocked ? `Frei · Stil ${style}` : `${COS_LOCKED_NIGHT} (du: ${tierName(tier)})` };
  });
  const prog = goldMapsProgress(progress);
  const g = row('gold', null, COSMETICS.goldTowers.name, isGoldTowersUnlocked(progress), goldTowersChosen(progress), COS_LOCKED_GOLD);
  const gold = { ...g, sub: g.unlocked ? 'Frei · alle Türme in Gold' : `${COS_LOCKED_GOLD} (du: ${prog.done} / ${prog.total})`,
    done: prog.done, total: prog.total, progressText: `Gold auf ${prog.done} / ${prog.total} Karten` };
  return { night, gold };
}
// Eine Zeile als HTML: Mini-Vorschau (Canvas, main/screens malt), Name mit Unterzeile, Zustandswort, Schalter rechts.
// name: sichtbarer Name (beim Nacht-Look nur die Karte). Gesperrt: Schloss in Vorschau, Name und Schalter.
function cosRowHtml(r, name) {
  const lock = r.unlocked ? '' : SMALL_LOCK;
  const mini = r.mapId
    ? `<canvas class="cos-mini" data-map="${r.mapId}" width="128" height="88"></canvas>`
    : '<canvas class="cos-mini cos-mini-gold" width="120" height="88"></canvas>';
  return `<div class="cos-row${r.unlocked ? '' : ' locked'}" data-row="${r.key}"><span class="cos-thumb">${mini}${lock}</span>`
    + `<span class="cos-text"><span class="cos-name">${lock}${name}</span><span class="cos-sub">${r.sub}</span></span>`
    + `<span class="cos-state">${r.state}</span>`
    + `<button type="button" class="sw" role="switch" data-key="${r.key}" aria-checked="${r.on}" aria-label="${r.label}"${r.unlocked ? '' : ' disabled'}><span class="knob"></span>${lock}</button></div>`;
}
const MOON_SEC = (size) => MOON_SVG(size).replace('class="moon"', 'class="moon cos-moon"');
// Inhalt der Plakette (rein, testbar). Fortschrittsleiste mit Medaillenreihe nur, solange die goldenen Türme gesperrt sind.
export function cosmeticsHtml(view) {
  const g = view.gold;
  const pct = g.total ? Math.round((100 * g.done) / g.total) : 0;
  const medals = view.night.map((r) => `<span>${badgeSvg(24, r.tier >= BADGE_TIERS.length ? BADGE_TIERS.length : 0)}${MAPS[r.mapId].name}</span>`).join('');
  const prog = g.unlocked ? '' : `<div class="cos-prog"><span class="cos-prog-text">${g.progressText}</span>`
    + `<span class="cos-bar" role="progressbar" aria-label="${g.progressText}" aria-valuemin="0" aria-valuemax="${g.total}" aria-valuenow="${g.done}"><span style="width:${pct}%"></span></span>`
    + `<span class="cos-medals" aria-hidden="true">${medals}</span></div>`;
  return `<h3 class="cos-sec">${MOON_SEC(22)}${COSMETICS.night.name} je Karte</h3>${view.night.map((r) => cosRowHtml(r, MAPS[r.mapId].name)).join('')}`
    + `<h3 class="cos-sec">${MOON_SEC(22)}${COSMETICS.goldTowers.name}</h3>${cosRowHtml(g, COSMETICS.goldTowers.name)}${prog}`;
}
// B-191: Vorschau rechts (ab 1200 px Breite) für eine Zeile (rein, testbar): Titel, Zustand, Beschriftungen und Freischalt-Kasten.
export function cosPreviewView(view, key) {
  const r = view.night.find((x) => x.key === key) ?? (key === 'gold' ? view.gold : view.night[0]);
  const state = r.state;
  if (!r.mapId) {
    return { key: r.key, title: `Vorschau: ${COSMETICS.goldTowers.name}`, state, kind: 'gold', unlocked: r.unlocked,
      text: 'Gleiche Türme, gleiche Werte: Holz und Stein werden zu Gold, dazu ein leises Funkeln.',
      unlockTitle: r.unlocked ? 'Freigeschaltet mit Gold auf allen Karten' : 'Gold-Abzeichen auf allen Karten holen',
      unlockText: `Welle ${MAX_WAVES} im Albtraum, ohne Lebensverlust und mit der Bedingung jeder Karte. Du hast: Gold auf ${view.gold.done} / ${view.gold.total} Karten.` };
  }
  const name = MAPS[r.mapId].name;
  const cond = badgeConditions(r.mapId);
  return { key: r.key, title: `Vorschau: ${name}`, state, kind: 'night', mapId: r.mapId, unlocked: r.unlocked, nightLabel: `Nacht-Look · ${r.style}`,
    text: `Im Nacht-Look spielst du ${name} im Albtraum-Aussehen (${r.style}), auch im Normalmodus. Nur Optik, keine Spielwerte.`,
    unlockTitle: r.unlocked ? `Freigeschaltet mit Gold auf ${name}` : `Gold-Abzeichen auf ${name} holen`,
    unlockText: `${cond.join(', ')}. Du hast: ${tierName(r.tier)}.` };
}
// Schalter umlegen (verändert progress); false, wenn gesperrt oder unbekannt.
export function toggleCosmetic(progress, key) {
  const view = cosmeticsView(progress);
  if (key === 'gold') return setGoldTowers(progress, !view.gold.on);
  const r = view.night.find((x) => x.key === key);
  return r ? setNightLook(progress, r.mapId, !r.on) : false;
}

// B-191: Türme fürs Menü „Aussehen“ (nur Browser): Figuren über drawTowerFigure, golden wie im Spiel (GOLD_TOWER_STYLE)
const PREVIEW_TOWERS = ['arrow', 'cannon', 'frost', 'lightning', 'sniper'];
function paintTowers(cv, types, gold, footY = cv.height - 8, scale = 1) {
  const c = cv.getContext('2d');
  const step = cv.width / types.length;
  types.forEach((type, i) => {
    if (!TOWER_TYPES[type]) return;
    c.save();
    c.translate(step * (i + 0.5), footY);
    c.scale(scale, scale);
    drawTowerFigure(c, { type, x: 0, y: -towerFootY({ y: 0 }), level: 1, angle: -Math.PI / 2 }, 0, 0, true, 1, gold ? { gold: true } : null);
    c.restore();
  });
}
// Vorschau „Goldene Türme“: oben 5 normal, unten 5 golden (Fußlinien bei 130 / 276 von 290, doppelt aufgelöst)
function paintTowerRows(cv) {
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  const k = cv.height / 290;
  paintTowers(cv, PREVIEW_TOWERS, false, 130 * k, 1.35 * k);
  paintTowers(cv, PREVIEW_TOWERS, true, 276 * k, 1.35 * k);
}
// Dialog (DOM, nur Browser). opts: getProgress(), onChange() (speichern und Optik anwenden), returnFocus (Element).
// Rückgabe: open(), close(), isOpen(), handleKey(ev) (true = Taste verbraucht).
export function mountCosmeticsMenu(root, opts) {
  const body = root.querySelector('.cos-body');
  const preview = root.querySelector('.cos-preview');
  let lastFocus = null;
  let selected = null; // B-191: gewählte Zeile (Vorschau rechts)
  function build() {
    const focusedKey = document.activeElement?.closest?.('.sw')?.dataset.key;
    const view = cosmeticsView(opts.getProgress());
    body.innerHTML = cosmeticsHtml(view);
    for (const cv of body.querySelectorAll('canvas.cos-mini[data-map]')) paintThumb(cv, cv.dataset.map, { night: true });
    const goldCv = body.querySelector('canvas.cos-mini-gold');
    if (goldCv) paintTowers(goldCv, ['arrow'], true, goldCv.height - 6, 2.4);
    if (focusedKey) body.querySelector(`.sw[data-key="${focusedKey}"]`)?.focus({ preventScroll: true });
    select(selected ?? view.night[0].key, view);
  }
  // Zeile wählen: Rahmen und Vorschau rechts
  function select(key, view = cosmeticsView(opts.getProgress())) {
    selected = key;
    for (const row of body.querySelectorAll('.cos-row')) row.classList.toggle('chosen', row.dataset.row === key);
    if (!preview) return;
    const v = cosPreviewView(view, key);
    preview.querySelector('.cp-title').textContent = v.title;
    const st = preview.querySelector('.cp-state');
    st.textContent = v.state;
    st.dataset.state = v.state;
    preview.dataset.kind = v.kind;
    preview.querySelector('.cp-text').textContent = v.text;
    preview.querySelector('.cp-medal').innerHTML = badgeSvg(66, v.unlocked ? BADGE_TIERS.length : 0);
    preview.querySelector('.cp-utitle').textContent = v.unlockTitle;
    preview.querySelector('.cp-utext').textContent = v.unlockText;
    if (v.kind === 'night') {
      preview.querySelector('.cp-nightfig figcaption').textContent = v.nightLabel;
      paintThumb(preview.querySelector('.cp-day'), v.mapId);
      paintThumb(preview.querySelector('.cp-nightcv'), v.mapId, { night: true });
    } else {
      paintTowerRows(preview.querySelector('.cp-towers'));
    }
  }
  body.addEventListener('click', (ev) => {
    const sw = ev.target instanceof Element ? ev.target.closest('.sw') : null;
    const row = ev.target instanceof Element ? ev.target.closest('.cos-row') : null;
    if (row && !sw) { select(row.dataset.row); return; }
    if (!sw || sw.disabled) return;
    if (toggleCosmetic(opts.getProgress(), sw.dataset.key)) { opts.onChange(); selected = sw.dataset.key; build(); }
  });
  body.addEventListener('focusin', (ev) => { // Tastatur: Fokus auf einem Schalter wählt seine Zeile
    const sw = ev.target instanceof Element ? ev.target.closest('.sw') : null;
    if (sw && sw.dataset.key !== selected) select(sw.dataset.key);
  });
  root.querySelector('.cos-close')?.addEventListener('click', close);
  root.addEventListener('click', (ev) => { if (ev.target === root) close(); }); // Tipp neben die Plakette
  function open() {
    lastFocus = document.activeElement;
    selected = null;
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
