// Balancing-Simulationen (Teil 4/4), laufen mit npm run test:balance und in der CI.
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
import { rankedSpots, playDt, MIX_CANNON, MIX_ARROW, playTracked, strategyCache, strategyRun, MIX_WEAK, LATE_PROGRESS, mapRun, oneSideRun, MIX_LIGHTNING, PERFECT_ORDER, PERFECT_ORDER_VOLCANO, PERFECT_ORDER_TWIN, bestCoolSpot, perfectRun, MIX_CANNON_FROST } from './sim.js';

// B-125: Eiswelt bleibt fordernder als die Wiese. Ohne Fähigkeiten scheitern beide robusten Reihenfolgen,
// aber erst in der Spätphase (ab Welle 15) und mit höchstens 1 verlorenen Leben vor Welle 10.
// B-127: Seit der Nekromantin (vom Menschen am 2026-11-26 freigegeben) darf ein knapper Sieg mit höchstens 5 Leben vorkommen.
test('Eiswelt (B-125): einfache Strategien ohne Fähigkeiten verlieren erst in der Spätphase (dt 1/30, 1/60)', () => {
  for (const mix of [MIX_CANNON, MIX_ARROW]) {
    for (const dt of [1 / 30, 1 / 60]) {
      const { state, lost } = strategyRun(mix, dt, 'ice');
      const tightWin = state.status === 'won' && state.lives <= 5;
      assert.ok(state.status === 'lost' || tightWin, `${mix.join(',')} dt=${dt}: ${state.status} mit ${state.lives} Leben`);
      if (state.status === 'lost') assert.ok(state.wave >= 15, `${mix.join(',')} dt=${dt}: verloren schon in Welle ${state.wave}`);
      assert.ok(lost.slice(0, 9).reduce((a, b) => a + b, 0) <= 1, `${mix.join(',')} dt=${dt}: zu viele Leben vor Welle 10`);
    }
  }
});

// B-046/B-125: Zangenangriff (fork): der Kanonen-Mix schafft Welle 20 weiter (dt 1/30 und 1/60).
test('Zangenangriff (B-125): Kanonen-Mix gewinnt Welle 20 (dt 1/30, 1/60)', () => {
  for (const dt of [1 / 30, 1 / 60]) {
    const s = mapRun('cannon', dt, 'fork');
    assert.equal(s.status, 'won', `dt=${dt}: Status ${s.status} in Welle ${s.wave}`);
  }
});

// B-125: Die Reihenfolge „Kanone zuerst“ gewann früher mit 1-9 Leben; jetzt scheitert sie ohne Fähigkeiten in der
// Spätphase (ab Welle 15), ohne vor Welle 10 Leben zu verlieren.
test('Zangenangriff (B-125): Strategie Kanone zuerst verliert erst in der Spätphase (dt 1/30, 1/60)', () => {
  for (const dt of [1 / 30, 1 / 60]) {
    const { state, lost } = strategyRun(MIX_ARROW, dt, 'fork');
    assert.equal(state.status, 'lost', `dt=${dt}: ${state.status} mit ${state.lives} Leben`);
    assert.ok(state.wave >= 15, `dt=${dt}: verloren schon in Welle ${state.wave}`);
    assert.equal(lost.slice(0, 9).reduce((a, b) => a + b, 0), 0, `dt=${dt}: Leben vor Welle 10 verloren`);
  }
});

// ---------- Zwei Eingänge (B-033) ----------

test('Schwierigkeit: die schwächere Strategie a>a>c>f verliert (dt 1/30, 1/60)', () => {
  for (const dt of [1 / 30, 1 / 60]) {
    const s = strategyRun(MIX_WEAK, dt).state;
    assert.equal(s.status, 'lost', `dt=${dt}: Status ${s.status}, ${s.lives} Leben`);
  }
});

test('Feste Seiten: nur oben bauen verliert auf Zangenangriff (vor Welle 18) und Zwei Fronten (vor Welle 5)', () => {
  for (const [mapId, maxWave] of [['fork', 18], ['twin', 5]]) {
    const s = oneSideRun(mapId, 1 / 30);
    assert.equal(s.status, 'lost', `${mapId}: ${s.status} mit ${s.lives} Leben`);
    assert.ok(s.wave < maxWave, `${mapId}: verloren erst in Welle ${s.wave}`);
  }
});

// B-171: Mit Fledermaus, Irrlicht, Panzerkäfer und Glutling reicht „nur Kanone + Frost“ nirgends mehr für ein perfektes
// Spiel (vorher: Wiese, Eiswelt und Zangenangriff ohne Lebensverlust gewonnen). Pfeil oder Blitz werden gebraucht.
test('B-171: nur Kanone + Frost schafft Welle 20 auf keiner Karte ohne Lebensverlust (dt 1/30, 1/60)', () => {
  for (const mapId of Object.keys(MAPS)) {
    for (const dt of [1 / 30, 1 / 60]) {
      const { state } = strategyRun(MIX_CANNON_FROST, dt, mapId, mapId === 'volcano');
      assert.ok(state.status === 'lost' || state.lives < START_LIVES, `${mapId} dt=${dt}: ${state.status} mit ${state.lives} Leben`);
    }
  }
});

// B-171: Die perfekten Reihenfolgen enthalten Pfeil oder Blitz (Luftabwehr gegen Fledermäuse).
test('B-171: jede perfekte Reihenfolge enthält Pfeil oder Blitz', () => {
  for (const order of [PERFECT_ORDER, PERFECT_ORDER_VOLCANO, PERFECT_ORDER_TWIN]) {
    assert.ok(order.includes('arrow') || order.includes('lightning'), order.join(','));
  }
});
