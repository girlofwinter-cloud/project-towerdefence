// Werkzeuge der Testseite: reine Logik ohne DOM, verändern nur den Spielzustand.
// Nicht für das normale Spiel gedacht; die Testseite (src/test-page.js) ruft sie auf.
import { MAX_WAVES, START_LIVES, TEST_TOOLS } from './config.js';

// Gewünschte Welle auf 1..MAX_WAVES begrenzen (ungültige Eingaben ergeben Welle 1).
export function clampWave(n) {
  const w = Math.floor(Number(n));
  if (!Number.isFinite(w)) return 1;
  return Math.max(1, Math.min(MAX_WAVES, w));
}

// Entfernt alle Gegner, Geschosse und noch nicht gespawnte Gegner der laufenden Welle.
export function clearEnemies(state) {
  state.enemies = [];
  state.spawnQueue = [];
  state.projectiles = [];
}

// Setzt das Spiel direkt vor Welle n: der nächste Wellenstart startet Welle n. Türme bleiben stehen.
export function prepareWave(state, n) {
  const wave = clampWave(n);
  clearEnemies(state);
  state.wave = wave - 1;
  state.waveActive = false;
  state.waveTime = 0;
  // Nach einem Spielende mit vollen Leben weiterspielen (sonst endet das Spiel beim ersten Leck).
  if (state.status !== 'playing') state.lives = START_LIVES;
  state.status = 'playing';
  return wave;
}

// Wird pro Frame aufgerufen: hält Gold bzw. Leben oben.
export function applyCheats(state, { infiniteGold = false, invincible = false } = {}) {
  if (infiniteGold && state.gold < TEST_TOOLS.gold) state.gold = TEST_TOOLS.gold;
  if (invincible && state.status === 'playing' && state.lives < START_LIVES) state.lives = START_LIVES;
}

// Alle Fähigkeiten sofort wieder bereit (auch aufgebrauchte).
export function resetCooldowns(state) {
  for (const a of Object.values(state.abilities)) {
    a.readyAt = state.time;
    a.uses = 0;
  }
}

// Spielende erzwingen, um Overlay und Meldungen zu prüfen.
export function forceEnd(state, status) {
  if (status !== 'won' && status !== 'lost') return false;
  clearEnemies(state);
  state.waveActive = false;
  state.status = status;
  return true;
}
