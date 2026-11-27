// Balancing-Simulationen (Teil 1/4), laufen mit npm run test:balance und in der CI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, mapModifiers, update, buildTower, upgradeTower, sellTower, startWave, planLanes, earlyStartBonus, earlyStartRisk, earlyStartPreview, waveHp, spawnEnemy, canBuild, towerStats, upgradeCost, togglePause, stepGame, setTargetMode, pickTarget, enemyPath, chainTargets, laneFor, nearLava } from '../../src/game.js';

import { livesText, startButtonView } from '../../src/hud.js';

import { buildPath, pointAt, pathTiles } from '../../src/path.js';
import { TOWER_TYPES, MAX_WAVES, START_GOLD, START_LIVES, LOW_LIVES, WAYPOINTS, MAPS, DEFAULT_MAP_ID, TILE, COLS, ROWS, TARGET_MODES, EARLY_START_MAX, LANE_ASYNC, waveFor, waveBonus, waveSummary, hpScale, ENEMY_TYPES, SPEED_STEPS, MAX_SUBSTEP, isBoss, NECRO_WAVE } from '../../src/config.js';

import { run, freeTileNearPath, mockCtx, recordEnemy, enemyExtent } from '../helpers.js';

import { useAbility, abilityCooldownLeft } from '../../src/game.js';
import { ABILITIES, WIDTH, HEIGHT } from '../../src/config.js';
import { LAVA } from '../../src/config.js';
import { sellValue } from '../../src/game.js';
import { meteorLife } from '../../src/game.js';
import { meteorDamage, meteorText, FX_STYLE } from '../../src/config.js';
import { AUTO_WAVE_DELAY } from '../../src/config.js';
import { createSoundTracker, detectStateEvents } from '../../src/sound-events.js';
import { rankedSpots, playDt, MIX_CANNON, MIX_ARROW, playTracked, strategyCache, strategyRun, MIX_WEAK, LATE_PROGRESS, mapRun, oneSideRun, MIX_LIGHTNING, PERFECT_ORDER, PERFECT_ORDER_VOLCANO, PERFECT_ORDER_TWIN, bestCoolSpot, perfectRun } from './sim.js';

test('Perfektes Spiel möglich: optimierte Strategie gewinnt Welle 20 auf jeder Karte ohne Lebensverlust (dt 1/30, 1/60)', async () => {
  const { MAP_ORDER } = await import('../../src/progress.js');
  assert.deepEqual([...MAP_ORDER].sort(), Object.keys(MAPS).sort(), 'alle Karten');
  for (const mapId of MAP_ORDER) {
    for (const dt of [1 / 30, 1 / 60]) {
      const { state, lost } = perfectRun(mapId, dt);
      assert.equal(state.status, 'won', `${mapId} dt=${dt}: Status ${state.status} in Welle ${state.wave}`);
      assert.equal(state.lives, START_LIVES, `${mapId} dt=${dt}: ${state.lives} von ${START_LIVES} Leben`);
      assert.equal(lost, 0, `${mapId} dt=${dt}: ${lost} Leben verloren`);
    }
  }
});

test('Vulkan: Platzwahl nur nach Abdeckung (Kanonen-Mix, schwache Strategie) und nur Pfeiltürme verlieren (dt 1/30, 1/60)', () => {
  for (const dt of [1 / 30, 1 / 60]) {
    for (const mix of [MIX_CANNON, MIX_WEAK, 'arrowOnly']) {
      const s = strategyRun(mix, dt, 'volcano').state;
      assert.equal(s.status, 'lost', `${mix} dt=${dt}: ${s.status} mit ${s.lives} Leben`);
    }
  }
});

test('Schwierigkeit: nur Pfeiltürme ohne Aufrüstung verlieren vor Welle 12 (dt 1/20, 1/30, 1/60, 1/120)', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 20, 1 / 120]) {
    const s = strategyRun('arrowOnly', dt).state;
    assert.equal(s.status, 'lost', `dt=${dt}`);
    assert.ok(s.wave < 12, `dt=${dt}: verloren erst in Welle ${s.wave}`);
  }
});

// 27.11.: Stufe 3 darf nicht übermächtig sein. Die Aufrüst-Strategie ohne Fähigkeiten gewinnt nicht auf allen Karten
// mit vollen Leben (vorher: auf 4 von 5 Karten mit 10 Leben, schon in Welle 10 sechs Endstufen).
test('Stufe 3 nicht übermächtig: Aufrüsten ohne Fähigkeiten gewinnt nicht überall mit vollen Leben (dt 1/30)', async () => {
  const { maxFirstRun, MIX_MAX } = await import('./sim.js');
  const { MAP_ORDER } = await import('../../src/progress.js');
  const results = MAP_ORDER.map((m) => maxFirstRun(MIX_MAX, 1 / 30, m));
  const perfect = results.filter((s) => s.status === 'won' && s.lives === START_LIVES).length;
  assert.ok(perfect <= 1, `${perfect} Karten mit vollen Leben: ${results.map((s) => `${s.mapId}:${s.status}${s.lives}`).join(' ')}`);
});
