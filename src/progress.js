// Fortschritt (B-093): Rekorde, Sterne und freigeschaltete Karten.
// Reine Logik ohne DOM und ohne window: der Speicher wird als Objekt mit getItem/setItem übergeben.
import { MAPS, START_LIVES, PROGRESS_KEY, STAR_LIVES_SHARE, BADGE_TIERS, NIGHTMARE } from './config.js';

// Freischalt-Reihenfolge = Reihenfolge der Karten in MAPS.
export const MAP_ORDER = Object.keys(MAPS);

// B-182: Albtraum-Ergebnisse liegen getrennt in progress.nightmare[mapId] = { bestWave } (fehlt, solange leer);
// B-183: dazu badge (1..3, fehlt solange kein Abzeichen). Normal-Rekorde und -Sterne bleiben davon unberührt.
export function emptyProgress() {
  return { maps: {} };
}

const isCount = (v) => Number.isFinite(v) && v >= 0;

// Bereinigt beliebige Daten zu gültigem Fortschritt: unbekannte Karten und falsche Typen fallen weg.
// lastMap (B-101, zuletzt gewählte Karte) bleibt nur, wenn es eine bekannte Karten-ID ist.
export function sanitizeProgress(raw) {
  const progress = emptyProgress();
  const isObj = raw && typeof raw === 'object' && !Array.isArray(raw);
  if (isObj && MAP_ORDER.includes(raw.lastMap)) progress.lastMap = raw.lastMap;
  const maps = isObj ? raw.maps : null;
  if (!maps || typeof maps !== 'object' || Array.isArray(maps)) return progress;
  for (const id of MAP_ORDER) {
    const entry = Object.prototype.hasOwnProperty.call(maps, id) ? maps[id] : null;
    if (!entry || typeof entry !== 'object') continue;
    const bestWave = isCount(entry.bestWave) ? Math.floor(entry.bestWave) : 0;
    const stars = isCount(entry.stars) ? Math.min(STAR_LIVES_SHARE.length, Math.floor(entry.stars)) : 0;
    progress.maps[id] = { bestWave, stars };
  }
  sanitizeNightmare(raw.nightmare, progress);
  sanitizeCosmetics(raw.cosmetics, progress);
  return progress;
}

// B-185: Kosmetik-Auswahl bereinigen: nur Booleans, nur bekannte Karten (alte Spielstände bleiben ohne Bereich).
// Ob ein Element freigeschaltet ist, prüft src/cosmetics.js bei jeder Abfrage. Fehlt goldTowers, bleibt es weg
// (Default an, B-185); nur ein gespeichertes false ist ein bewusstes Aus.
function sanitizeCosmetics(raw, progress) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  const night = {};
  const rawNight = raw.night && typeof raw.night === 'object' && !Array.isArray(raw.night) ? raw.night : {};
  for (const id of MAP_ORDER) {
    if (Object.prototype.hasOwnProperty.call(rawNight, id) && typeof rawNight[id] === 'boolean') night[id] = rawNight[id];
  }
  progress.cosmetics = { night };
  if (typeof raw.goldTowers === 'boolean') progress.cosmetics.goldTowers = raw.goldTowers;
}

// B-182: Albtraum-Bereich bereinigen (alte Spielstände ohne Bereich bleiben ohne)
function sanitizeNightmare(raw, progress) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  for (const id of MAP_ORDER) {
    const entry = Object.prototype.hasOwnProperty.call(raw, id) ? raw[id] : null;
    if (!entry || typeof entry !== 'object' || !isCount(entry.bestWave)) continue;
    progress.nightmare ??= {};
    progress.nightmare[id] = { bestWave: Math.floor(entry.bestWave) };
    // B-183: Abzeichen auf 0..3 begrenzen, ungültige Werte zählen als keins
    const badge = isCount(entry.badge) ? Math.min(BADGE_TIERS.length, Math.floor(entry.badge)) : 0;
    if (badge > 0) progress.nightmare[id].badge = badge;
  }
}

// Lädt den Fortschritt; jeder Fehler (kein Speicher, werfender Speicher, kaputtes JSON) ergibt leeren Fortschritt.
export function loadProgress(storage) {
  try {
    const text = storage?.getItem(PROGRESS_KEY);
    if (typeof text !== 'string') return emptyProgress();
    return sanitizeProgress(JSON.parse(text));
  } catch {
    return emptyProgress();
  }
}

// Speichert still: liefert true bei Erfolg, false wenn der Speicher fehlt oder wirft (z. B. privater Modus).
export function saveProgress(storage, progress) {
  try {
    if (!storage) return false;
    storage.setItem(PROGRESS_KEY, JSON.stringify(sanitizeProgress(progress)));
    return true;
  } catch {
    return false;
  }
}

// Sterne für ein Spielende: nur bei Sieg, abhängig vom Anteil übriger Leben.
export function starsFor(status, lives) {
  if (status !== 'won') return 0;
  const share = Math.max(0, lives) / START_LIVES;
  return STAR_LIVES_SHARE.filter((min) => share >= min).length;
}

export function mapProgress(progress, mapId) {
  return progress.maps[mapId] ?? { bestWave: 0, stars: 0 };
}

// B-182: Albtraum-Stand einer Karte
export function nightmareProgress(progress, mapId) {
  return progress.nightmare?.[mapId] ?? { bestWave: 0 };
}

// B-182: Albtraum-Modus einer Karte ist offen, sobald sie im Normalmodus alle Sterne hat.
export function isNightmareUnlocked(progress, mapId) {
  return MAP_ORDER.includes(mapId) && mapProgress(progress, mapId).stars >= STAR_LIVES_SHARE.length;
}

// Erste Karte ist immer offen, jede weitere nach einem Sieg (mind. 1 Stern) auf der vorherigen.
export function isUnlocked(progress, mapId) {
  const i = MAP_ORDER.indexOf(mapId);
  if (i < 0) return false;
  if (i === 0) return true;
  return mapProgress(progress, MAP_ORDER[i - 1]).stars > 0;
}

// Karte beim Öffnen des Spiels (B-101): zuletzt gewählte, falls freigeschaltet;
// sonst die neueste freigeschaltete Karte in MAP_ORDER (die erste ist immer offen).
export function startMap(progress) {
  if (MAP_ORDER.includes(progress?.lastMap) && isUnlocked(progress, progress.lastMap)) return progress.lastMap;
  const p = progress ?? emptyProgress();
  return [...MAP_ORDER].reverse().find((id) => isUnlocked(p, id)) ?? MAP_ORDER[0];
}

// Karte fürs nächste Spiel nach einem Spielende: nach einem Sieg die nächste Karte in MAP_ORDER,
// falls es sie gibt und sie offen ist; sonst (Niederlage, letzte Karte) bleibt die Karte.
export function mapAfterResult(progress, mapId, status) {
  const next = MAP_ORDER[MAP_ORDER.indexOf(mapId) + 1];
  if (status !== 'won' || !MAP_ORDER.includes(mapId) || !next) return mapId;
  return isUnlocked(progress, next) ? next : mapId;
}

// B-183: Albtraum-Abzeichen für ein Spielende: 0 keins, 1 Bronze (gewonnen), 2 Silber (ohne Lebensverlust),
// 3 Gold (Silber plus erfüllte Gold-Bedingung der Karte).
// noLoss (true/false): ob im ganzen Spiel kein Leben verloren ging; fehlt es, zählen nur die Leben am Ende.
export function nightmareBadgeFor(status, lives, maxLives, goldOk, noLoss) {
  if (status !== 'won') return 0;
  if (!(lives >= maxLives)) return 1;
  if (noLoss === false) return 1;
  return goldOk ? 3 : 2;
}

// B-183: erreichte Abzeichen über alle Karten (jede Stufe zählt, Gold auf einer Karte = 3); Maximum = Kartenzahl × 3
export function badgeCount(progress) {
  return MAP_ORDER.reduce((sum, id) => sum + (nightmareProgress(progress, id).badge ?? 0), 0);
}
export const BADGE_MAX = MAP_ORDER.length * BADGE_TIERS.length;

// Trägt ein Spielende ein (verändert progress). Rekord und Sterne werden nie schlechter.
// Rückgabe: newRecord (Wellenrekord verbessert), newStars (Sterne verbessert), unlockedMap (neu freigeschaltete Karten-ID oder null).
// mode 'nightmare' (B-182): nur der Albtraum-Rekord zählt; keine Sterne, keine Freischaltung, Normal-Stand bleibt.
// B-183: mit goldOk (true/false, Ergebnis von checkGoldCondition) wird im Albtraum auch das Abzeichen bewertet;
// maxLives = Höchstleben des Spiels (Standard NIGHTMARE.lives), noLoss = kein Leben im Spiel verloren (optional).
// Rückgabe dann zusätzlich newBadge (neu erreichte Stufe oder 0).
export function recordResult(progress, { mapId, status, wave, lives, mode, goldOk, noLoss, maxLives = NIGHTMARE.lives }) {
  const none = { newRecord: false, newStars: false, unlockedMap: null };
  if (!MAP_ORDER.includes(mapId)) return none;
  if (mode === 'nightmare') {
    const badge = typeof goldOk === 'boolean' ? nightmareBadgeFor(status, lives, maxLives, goldOk, noLoss) : null;
    return recordNightmare(progress, mapId, wave, badge);
  }
  const old = mapProgress(progress, mapId);
  const next = MAP_ORDER[MAP_ORDER.indexOf(mapId) + 1] ?? null;
  const wasUnlocked = next !== null && isUnlocked(progress, next);
  const stars = starsFor(status, lives);
  const reached = isCount(wave) ? Math.floor(wave) : 0;
  const entry = { bestWave: Math.max(old.bestWave, reached), stars: Math.max(old.stars, stars) };
  progress.maps[mapId] = entry;
  const unlockedMap = next !== null && !wasUnlocked && isUnlocked(progress, next) ? next : null;
  // Neue Karte freigeschaltet (B-101): gemerkte Karte vergessen, damit der nächste Start dort landet.
  if (unlockedMap) delete progress.lastMap;
  return {
    newRecord: entry.bestWave > old.bestWave,
    newStars: entry.stars > old.stars,
    unlockedMap,
  };
}

// badge: Stufe dieses Spiels (B-183) oder null (nicht bewertet); das gespeicherte Abzeichen wird nie schlechter.
function recordNightmare(progress, mapId, wave, badge) {
  const old = nightmareProgress(progress, mapId);
  const reached = isCount(wave) ? Math.floor(wave) : 0;
  const entry = { ...old, bestWave: Math.max(old.bestWave, reached) };
  const oldBadge = old.badge ?? 0;
  if (badge > oldBadge) entry.badge = badge;
  progress.nightmare ??= {};
  progress.nightmare[mapId] = entry;
  const res = { newRecord: entry.bestWave > old.bestWave, newStars: false, unlockedMap: null };
  if (badge !== null) res.newBadge = badge > oldBadge ? badge : 0;
  return res;
}

// Texte fürs Overlay am Spielende (B-094): erste Zeile Rekord und Sterne, danach Hervorhebungen.
// before = Stand der Karte vor recordResult. Beim ersten Ergebnis ist jeder Rekord „neu“: keine Meldung.
export function resultLines(progress, mapId, res, before = { bestWave: 0, stars: 0 }) {
  const p = mapProgress(progress, mapId);
  const lines = [`Rekord: Welle ${p.bestWave} · ${starText(p.stars)}`];
  if (res.newRecord && before.bestWave > 0) lines.push('Neuer Rekord!');
  if (res.newStars) lines.push('Neue Sterne!');
  if (res.unlockedMap) lines.push(`Neue Karte freigeschaltet: ${MAPS[res.unlockedMap].name}`);
  return lines;
}

// B-182: Overlay-Texte nach einem Albtraum-Spiel
// before = Albtraum-Stand vor recordResult (erstes Ergebnis: keine Rekord-Meldung, wie resultLines)
export function nightmareResultLines(progress, mapId, res, before = { bestWave: 0 }) {
  const p = nightmareProgress(progress, mapId);
  const badge = p.badge ? ` · Abzeichen: ${BADGE_TIERS[p.badge - 1]}` : '';
  const lines = [`Albtraum-Rekord: Welle ${p.bestWave}${badge}`];
  if (res.newRecord && before.bestWave > 0) lines.push('Neuer Rekord!');
  if (res.newBadge > 0) lines.push(`Neues Abzeichen: ${BADGE_TIERS[res.newBadge - 1]}!`); // B-183
  return lines;
}

// Sterne als Text, z. B. "★★☆" (volle und leere Sterne).
export function starText(stars) {
  const max = STAR_LIVES_SHARE.length;
  const n = Math.max(0, Math.min(max, stars));
  return '★'.repeat(n) + '☆'.repeat(max - n);
}
