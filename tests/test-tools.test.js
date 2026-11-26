// Tests für die Werkzeuge der Testseite (src/test-tools.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startWave, stepGame, buildTower } from '../src/game.js';
import { MAX_WAVES, START_LIVES, TEST_TOOLS, MAPS } from '../src/config.js';
import { clampWave, prepareWave, clearEnemies, applyCheats, resetCooldowns, forceEnd } from '../src/test-tools.js';

test('Testseite: clampWave begrenzt auf 1..MAX_WAVES, ungültig ergibt 1', () => {
  assert.equal(clampWave(5), 5);
  assert.equal(clampWave('7'), 7);
  assert.equal(clampWave(3.9), 3);
  assert.equal(clampWave(0), 1);
  assert.equal(clampWave(-4), 1);
  assert.equal(clampWave(MAX_WAVES + 10), MAX_WAVES);
  assert.equal(clampWave(NaN), 1);
  assert.equal(clampWave('abc'), 1);
  assert.equal(clampWave(Infinity), 1);
});

test('Testseite: prepareWave setzt vor Welle n, nächster Start ist Welle n, Türme bleiben', () => {
  for (const mapId of Object.keys(MAPS)) {
    const s = createGame({ mapId });
    s.gold = 10000;
    const tower = s.towers.length;
    startWave(s);
    stepGame(s, 3);
    assert.equal(prepareWave(s, 15), 15);
    assert.equal(s.wave, 14);
    assert.equal(s.waveActive, false);
    assert.deepEqual([s.enemies.length, s.spawnQueue.length, s.projectiles.length], [0, 0, 0]);
    assert.equal(s.towers.length, tower);
    const res = startWave(s);
    assert.equal(res.ok, true);
    assert.equal(res.wave, 15);
    assert.ok(s.spawnQueue.length > 0);
  }
});

test('Testseite: prepareWave auf letzte Welle, Sieg danach möglich', () => {
  const s = createGame();
  prepareWave(s, MAX_WAVES);
  assert.equal(startWave(s).wave, MAX_WAVES);
  clearEnemies(s);
  stepGame(s, 0.1);
  assert.equal(s.status, 'won');
});

test('Testseite: prepareWave nach Spielende macht das Spiel wieder spielbar', () => {
  const s = createGame();
  forceEnd(s, 'lost');
  prepareWave(s, 3);
  assert.equal(s.status, 'playing');
  assert.equal(startWave(s).wave, 3);
});

test('Testseite: clearEnemies beendet die Welle beim nächsten Schritt mit Bonus', () => {
  const s = createGame();
  startWave(s);
  stepGame(s, 2);
  const gold = s.gold;
  clearEnemies(s);
  stepGame(s, 0.05);
  assert.equal(s.waveActive, false);
  assert.ok(s.gold > gold);
});

test('Testseite: applyCheats hält Gold und Leben oben, ohne Optionen ändert sich nichts', () => {
  const s = createGame();
  s.gold = 5; s.lives = 2;
  applyCheats(s);
  assert.deepEqual([s.gold, s.lives], [5, 2]);
  applyCheats(s, { infiniteGold: true });
  assert.equal(s.gold, TEST_TOOLS.gold);
  assert.equal(s.lives, 2);
  applyCheats(s, { invincible: true });
  assert.equal(s.lives, START_LIVES);
  // Mehr Gold als der Vorrat wird nicht gekürzt
  s.gold = TEST_TOOLS.gold + 50;
  applyCheats(s, { infiniteGold: true });
  assert.equal(s.gold, TEST_TOOLS.gold + 50);
});

test('Testseite: mit unbegrenztem Gold sind Bauen und Bauen danach weiter möglich', () => {
  const s = createGame();
  applyCheats(s, { infiniteGold: true });
  let built = 0;
  for (let c = 0; c < 20 && built < 3; c++) for (let r = 0; r < 12 && built < 3; r++) {
    if (buildTower(s, 'cannon', c, r).ok) { built++; applyCheats(s, { infiniteGold: true }); }
  }
  assert.equal(built, 3);
  assert.equal(s.gold, TEST_TOOLS.gold);
});

test('Testseite: invincible rettet kein bereits verlorenes Spiel', () => {
  const s = createGame();
  forceEnd(s, 'lost');
  s.lives = 0;
  applyCheats(s, { invincible: true });
  assert.equal(s.lives, 0);
  assert.equal(s.status, 'lost');
});

test('Testseite: resetCooldowns macht alle Fähigkeiten sofort bereit', () => {
  const s = createGame();
  s.time = 100;
  for (const a of Object.values(s.abilities)) { a.readyAt = 500; a.uses = 3; }
  resetCooldowns(s);
  for (const a of Object.values(s.abilities)) assert.deepEqual([a.readyAt, a.uses], [100, 0]);
});

test('Testseite: forceEnd setzt nur won oder lost', () => {
  const s = createGame();
  startWave(s);
  stepGame(s, 2);
  assert.equal(forceEnd(s, 'kaputt'), false);
  assert.equal(s.status, 'playing');
  assert.equal(forceEnd(s, 'won'), true);
  assert.equal(s.status, 'won');
  assert.equal(s.enemies.length, 0);
  assert.equal(s.waveActive, false);
});
