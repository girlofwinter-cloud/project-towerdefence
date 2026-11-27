// Balancing-Simulationen (Teil 2/4), laufen mit npm run test:balance und in der CI.
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

// B-125 (Spätphase schwerer, vom Menschen freigegeben): Früher mussten beide robusten Reihenfolgen Welle 20 mit Reserve
// gewinnen. Jetzt gilt: Welle 1-9 bleiben unverändert (kein Lebensverlust), der Kanonen-Mix schafft die Wiese weiter
// (robust gegen den Zeitschritt), der Pfeil-Mix ohne Fähigkeiten scheitert erst in der Spätphase (ab Welle 15).
// 27.11. (Entscheidung des Menschen): Maßstab ist jetzt das Spiel mit Aufrüsten; der Kanonen-Mix (viele Türme, kaum Stufe 3, ohne Fähigkeiten) darf verlieren, aber nicht vor Welle 15.
test('Schwierigkeit (B-125): Kanonen-Mix hält auf der Wiese bis Welle 15, Pfeil-Mix verliert erst in der Spätphase (dt 1/20, 1/30, 1/60, 1/120)', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 20, 1 / 120]) {
    const s = strategyRun(MIX_CANNON, dt).state;
    assert.ok(s.status === 'won' || s.wave >= 15, `Kanonen-Mix dt=${dt}: verloren schon in Welle ${s.wave}`);
  }
  for (const dt of [1 / 30, 1 / 60, 1 / 120]) {
    const { state, lost } = strategyRun(MIX_ARROW, dt);
    assert.equal(state.status, 'lost', `Pfeil-Mix dt=${dt}: ${state.status} mit ${state.lives} Leben`);
    assert.ok(state.wave >= 15, `Pfeil-Mix dt=${dt}: verloren schon in Welle ${state.wave}`);
    assert.equal(lost.slice(0, 9).reduce((a, b) => a + b, 0), 0, `Pfeil-Mix dt=${dt}: Leben vor Welle 10 verloren`);
  }
});

// Balancing (B-030, gemessen per Strategie-Simulation): Wer Türme nicht neben die Lava stellt,
// gewinnt mit dem Kanonen-Mix mit 4 Leben (ein Boss bricht durch). Die Platzwahl nur nach Abdeckung (viele beste Plätze
// liegen neben Lava) verliert mit allen Mischungen, ebenso nur Pfeiltürme.
// 27.11. (Entscheidung des Menschen): Maßstab ist jetzt das Spiel mit Aufrüsten; der Kanonen-Mix (viele Türme, kaum Stufe 3, ohne Fähigkeiten) darf verlieren, aber nicht vor Welle 15 und nie mit vollen Leben.
test('Vulkan: Kanonen-Mix auf Plätzen ohne Überhitzung hält bis Welle 15, gewinnt höchstens knapp (dt 1/30, 1/60)', () => {
  for (const dt of [1 / 30, 1 / 60]) {
    const s = strategyRun(MIX_CANNON, dt, 'volcano', true).state;
    assert.ok(s.status === 'won' || s.wave >= 15, `dt=${dt}: verloren schon in Welle ${s.wave}`);
    assert.ok(s.status !== 'won' || s.lives <= 7, `dt=${dt}: ${s.lives} Leben`);
  }
});

test('Eiswelt: nur Pfeiltürme verlieren vor Welle 12 (dt 1/30, 1/60)', () => {
  for (const dt of [1 / 30, 1 / 60]) {
    const s = mapRun('arrowOnly', dt);
    assert.equal(s.status, 'lost', `dt=${dt}`);
    assert.ok(s.wave < 12, `dt=${dt}: verloren erst in Welle ${s.wave}`);
  }
});
