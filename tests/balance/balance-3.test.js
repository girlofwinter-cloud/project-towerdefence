// Balancing-Simulationen (Teil 3/4), laufen mit npm run test:balance und in der CI.
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

// B-125: Der Blitz-Mix gewann früher Wiese und Eiswelt; seit der stärkeren Spätphase hält er ohne Fähigkeiten
// bis mindestens Welle 15 und ist weiterhin nicht leichter als der Kanonen-Mix.
test('Strategie (B-125): Blitz-Mix hält auf Wiese und Eiswelt bis zur Spätphase (dt 1/30, 1/60), nicht leichter als der Kanonen-Mix', () => {
  for (const mapId of ['meadow', 'ice']) {
    for (const dt of [1 / 30, 1 / 60]) {
      const { state: s, lost } = strategyRun(MIX_LIGHTNING, dt, mapId);
      assert.ok(s.status === 'won' || s.wave >= 15, `${mapId} dt=${dt}: verloren schon in Welle ${s.wave}`);
      assert.equal(lost.slice(0, 9).reduce((a, b) => a + b, 0), 0, `${mapId} dt=${dt}: Leben vor Welle 10 verloren`);
    }
  }
  for (const dt of [1 / 30, 1 / 60]) {
    const s = strategyRun(MIX_LIGHTNING, dt).state;
    assert.ok(s.lives <= strategyRun(MIX_CANNON, dt).state.lives, `Wiese dt=${dt}: Blitz-Mix nicht mit mehr Reserve als der Kanonen-Mix`);
  }
});

// ---------- B-038: Fähigkeiten ----------

// B-124: Seit den asynchronen Schüben reicht der Kanonen-Mix ohne Fähigkeiten auf Zwei Fronten nicht mehr
// (früher: Sieg mit 1-9 Leben); er hält aber bis in die Spätphase und verliert in Welle 1-8 keine Leben.
// Mit Meteor und Kälteschock gewinnt er ohne Lebensverlust (siehe „Perfektes Spiel möglich“).
test('Zwei Fronten (B-124): Kanonen-Mix ohne Fähigkeiten verliert erst in der Spätphase (dt 1/30, 1/60)', () => {
  for (const dt of [1 / 30, 1 / 60]) {
    const { state: s, lost } = strategyRun(MIX_CANNON, dt, 'twin');
    assert.equal(s.status, 'lost', `dt=${dt}: Status ${s.status} mit ${s.lives} Leben`);
    assert.ok(s.wave >= 15, `dt=${dt}: verloren schon in Welle ${s.wave}`);
    assert.equal(lost.slice(0, 8).reduce((a, b) => a + b, 0), 0, `dt=${dt}: Leben vor Welle 9 verloren`);
  }
});

test('Simulation: Fortschrittsmessung ändert den Spielverlauf nicht (gleiches Ergebnis wie playDt)', () => {
  const ref = playDt(MIX_CANNON, 1 / 30);
  const run = strategyRun(MIX_CANNON, 1 / 30);
  assert.equal(run.state.status, ref.status);
  assert.equal(run.state.lives, ref.lives);
  assert.equal(run.state.gold, ref.gold);
  assert.equal(run.progress.length, MAX_WAVES);
});

test('Vulkan: perfektes Spiel möglich, die Strategie stellt keinen Turm neben die Lava', () => {
  for (const dt of [1 / 30, 1 / 60]) {
    const { state } = perfectRun('volcano', dt);
    assert.equal(state.status, 'won');
    assert.equal(state.lives, START_LIVES);
    assert.ok(state.towers.length > 0 && state.towers.every((t) => !t.overheated), 'nur kühle Plätze');
  }
});

test('Vulkan: ohne Lava-Schaden verliert auch der Kanonen-Mix ohne Überhitzung (Lava hilft dem Spieler)', () => {
  const before = LAVA.dps;
  LAVA.dps = 0;
  try {
    const s = playTracked(MIX_CANNON, 1 / 30, 'volcano', true).state;
    assert.equal(s.status, 'lost', `Status ${s.status} mit ${s.lives} Leben`);
  } finally { LAVA.dps = before; }
});

test('Spätphase: in mindestens 3 der Wellen 14-20 dringt ein Gegner über 55 % des Wegs vor (beide Strategien, dt 1/30 und 1/60)', () => {
  for (const mix of [MIX_CANNON, MIX_ARROW]) {
    for (const dt of [1 / 30, 1 / 60]) {
      const { progress } = strategyRun(mix, dt);
      const deep = progress.slice(13, 20).filter((p) => p > LATE_PROGRESS).length;
      assert.ok(deep >= 3, `${mix.join(',')} dt=${dt}: nur ${deep} Wellen über ${LATE_PROGRESS * 100} % (${progress.slice(13).map((p) => Math.round(p * 100))})`);
    }
  }
});

test('Schwierigkeit: die Reserve ist klein, mindestens eine robuste Strategie endet mit höchstens 8 Leben (dt 1/30, 1/60)', () => {
  for (const dt of [1 / 30, 1 / 60]) {
    assert.ok(strategyRun(MIX_ARROW, dt).state.lives <= 8, `dt=${dt}`);
  }
});
