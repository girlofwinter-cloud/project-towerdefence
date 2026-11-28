// Fortschritt (B-093): Rekorde, Sterne und freigeschaltete Karten.
// Reine Logik ohne DOM und ohne window: der Speicher wird als Objekt mit getItem/setItem übergeben.
import { MAPS, START_LIVES, PROGRESS_KEY, STAR_LIVES_SHARE } from './config.js';

// Freischalt-Reihenfolge = Reihenfolge der Karten in MAPS.
export const MAP_ORDER = Object.keys(MAPS);

// B-182: Albtraum-Ergebnisse liegen getrennt in progress.nightmare[mapId] = { bestWave } (fehlt, solange leer);
// Platz für die Abzeichen aus B-183 im selben Eintrag. Normal-Rekorde und -Sterne bleiben davon unberührt.
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
  return progress;
}

// B-182: Albtraum-Bereich bereinigen (alte Spielstände ohne Bereich bleiben ohne)
function sanitizeNightmare(raw, progress) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  for (const id of MAP_ORDER) {
    const entry = Object.prototype.hasOwnProperty.call(raw, id) ? raw[id] : null;
    if (!entry || typeof entry !== 'object' || !isCount(entry.bestWave)) continue;
    progress.nightmare ??= {};
    progress.nightmare[id] = { bestWave: Math.floor(entry.bestWave) };
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

// Trägt ein Spielende ein (verändert progress). Rekord und Sterne werden nie schlechter.
// Rückgabe: newRecord (Wellenrekord verbessert), newStars (Sterne verbessert), unlockedMap (neu freigeschaltete Karten-ID oder null).
// mode 'nightmare' (B-182): nur der Albtraum-Rekord zählt; keine Sterne, keine Freischaltung, Normal-Stand bleibt.
export function recordResult(progress, { mapId, status, wave, lives, mode }) {
  const none = { newRecord: false, newStars: false, unlockedMap: null };
  if (!MAP_ORDER.includes(mapId)) return none;
  if (mode === 'nightmare') return recordNightmare(progress, mapId, wave);
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

function recordNightmare(progress, mapId, wave) {
  const old = nightmareProgress(progress, mapId);
  const reached = isCount(wave) ? Math.floor(wave) : 0;
  const entry = { ...old, bestWave: Math.max(old.bestWave, reached) };
  progress.nightmare ??= {};
  progress.nightmare[mapId] = entry;
  return { newRecord: entry.bestWave > old.bestWave, newStars: false, unlockedMap: null };
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
  const lines = [`Albtraum-Rekord: Welle ${nightmareProgress(progress, mapId).bestWave}`];
  if (res.newRecord && before.bestWave > 0) lines.push('Neuer Rekord!');
  return lines;
}

// Sterne als Text, z. B. "★★☆" (volle und leere Sterne).
export function starText(stars) {
  const max = STAR_LIVES_SHARE.length;
  const n = Math.max(0, Math.min(max, stars));
  return '★'.repeat(n) + '☆'.repeat(max - n);
}
