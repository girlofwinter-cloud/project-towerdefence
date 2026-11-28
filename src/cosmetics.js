// B-185: Kosmetik-Belohnungen (Nacht-Look je Karte, goldene Türme). Reine Logik ohne DOM.
// Die Auswahl liegt in progress.cosmetics = { night: { [mapId]: bool }, goldTowers: bool }.
// Freischaltung ergibt sich immer aus den Albtraum-Abzeichen; abgeschaltete Elemente bleiben frei.
import { BADGE_TIERS } from './config.js';
import { MAP_ORDER, nightmareProgress } from './progress.js';

const GOLD = BADGE_TIERS.length;

function hasGold(progress, mapId) {
  return (nightmareProgress(progress, mapId).badge ?? 0) >= GOLD;
}

// Nacht-Look einer Karte ist frei, sobald diese Karte Gold im Albtraum hat.
export function isNightUnlocked(progress, mapId) {
  return MAP_ORDER.includes(mapId) && hasGold(progress, mapId);
}

// Fortschritt zu den goldenen Türmen: Karten mit Gold von allen Karten („Gold auf x / 5 Karten“).
export function goldMapsProgress(progress) {
  return { done: MAP_ORDER.filter((id) => hasGold(progress, id)).length, total: MAP_ORDER.length };
}

export function isGoldTowersUnlocked(progress) {
  const { done, total } = goldMapsProgress(progress);
  return done === total;
}

// Schaltet den Nacht-Look einer Karte an oder aus (verändert progress). Nur wenn freigeschaltet; Rückgabe true bei Erfolg.
export function setNightLook(progress, mapId, on) {
  if (!isNightUnlocked(progress, mapId)) return false;
  progress.cosmetics ??= { night: {}, goldTowers: false };
  progress.cosmetics.night ??= {};
  progress.cosmetics.night[mapId] = !!on;
  return true;
}

// Schaltet die goldenen Türme an oder aus (verändert progress). Nur wenn freigeschaltet; Rückgabe true bei Erfolg.
export function setGoldTowers(progress, on) {
  if (!isGoldTowersUnlocked(progress)) return false;
  progress.cosmetics ??= { night: {}, goldTowers: false };
  progress.cosmetics.goldTowers = !!on;
  return true;
}

// Für das Rendering: was auf dieser Karte aktiv ist (freigeschaltet und angeschaltet; nicht gewählt = aus).
export function activeCosmetics(progress, mapId) {
  const c = progress?.cosmetics;
  const p = progress ?? { maps: {} };
  return {
    night: c?.night?.[mapId] === true && isNightUnlocked(p, mapId),
    goldTowers: c?.goldTowers === true && isGoldTowersUnlocked(p),
  };
}
