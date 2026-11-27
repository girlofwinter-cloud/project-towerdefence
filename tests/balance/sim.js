// Gemeinsame Helfer der Balancing-Simulationen (Strategie-Läufe über alle Wellen).
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

// Freie Felder neben dem Weg, sortiert nach Anzahl Wegpunkte in Reichweite (deterministisch).
// Zählt über alle Wege (B-099); bei Karten mit einem Weg ist das genau der Hauptweg.
// cool (B-030): nur Plätze, die nicht neben Lava liegen (Türme dort überhitzen nicht)
export function rankedSpots(state, rangeTiles, cool = false) {
  const spots = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!canBuild(state, c, r).ok) continue;
    if (cool && nearLava(state.lava, c, r)) continue;
    const x = (c + 0.5) * TILE;
    const y = (r + 0.5) * TILE;
    let n = 0;
    for (const path of state.paths || [state.path]) {
      for (let d = 0; d < path.length; d += 8) {
        const p = pointAt(path, d);
        if (Math.hypot(p.x - x, p.y - y) <= rangeTiles * TILE) n++;
      }
    }
    if (n) spots.push({ c, r, n });
  }
  return spots.sort((a, b) => b.n - a.n || a.r - b.r || a.c - b.c);
}

export function playDt(mix, dt) {
  const s = createGame();
  const spots = rankedSpots(s, TOWER_TYPES.cannon.range);
  let i = 0;
  while (s.status === 'playing' && s.wave < MAX_WAVES) {
    for (let progress = true; progress;) {
      progress = false;
      const type = mix[s.towers.length % mix.length];
      if (i < spots.length && s.gold >= TOWER_TYPES[type].cost) {
        buildTower(s, type, spots[i].c, spots[i].r);
        i++;
        progress = true;
      } else {
        let best = null;
        for (const t of s.towers) {
          const c = upgradeCost(t);
          if (c !== null && (!best || c < best.c)) best = { id: t.id, c };
        }
        if (best && s.gold >= best.c) { upgradeTower(s, best.id); progress = true; }
      }
    }
    startWave(s);
    for (let k = 0; k < Math.round(600 / dt) && s.waveActive && s.status === 'playing'; k++) update(s, dt);
  }
  return s;
}

export const MIX_CANNON = ['arrow', 'cannon', 'cannon', 'frost'];
export const MIX_ARROW = ['cannon', 'arrow', 'arrow', 'frost'];

// Gemeinsamer Strategie-Lauf für alle Karten. mix ist eine Bau-Reihenfolge (mit Aufrüsten) oder 'arrowOnly'
// (jede Runde so viele Pfeiltürme wie möglich, nie aufrüsten). Liefert zusätzlich pro Welle den größten
// Wegfortschritt (dist / Weglänge, 0..1) eines Gegners und die verlorenen Leben.
// Jeder Lauf (Schlüssel `mapId:mix@dt`) wird nur einmal simuliert, alle Tests lesen aus demselben Cache.
export function playTracked(mix, dt, mapId = 'meadow', cool = false) {
  const s = createGame({ mapId });
  const arrowOnly = mix === 'arrowOnly';
  const spots = rankedSpots(s, TOWER_TYPES[arrowOnly ? 'arrow' : 'cannon'].range, cool);
  const progress = [];
  const lost = [];
  let i = 0;
  while (s.status === 'playing' && s.wave < MAX_WAVES) {
    if (arrowOnly) {
      for (const p of spots) {
        if (s.gold < TOWER_TYPES.arrow.cost) break;
        buildTower(s, 'arrow', p.c, p.r);
      }
    } else {
      for (let again = true; again;) {
        again = false;
        const type = mix[s.towers.length % mix.length];
        if (i < spots.length && s.gold >= TOWER_TYPES[type].cost) {
          buildTower(s, type, spots[i].c, spots[i].r);
          i++;
          again = true;
        } else {
          let best = null;
          for (const t of s.towers) {
            const c = upgradeCost(t);
            if (c !== null && (!best || c < best.c)) best = { id: t.id, c };
          }
          if (best && s.gold >= best.c) { upgradeTower(s, best.id); again = true; }
        }
      }
    }
    const livesBefore = s.lives;
    let furthest = 0;
    startWave(s);
    for (let k = 0; k < Math.round(600 / dt) && s.waveActive && s.status === 'playing'; k++) {
      update(s, dt);
      for (const e of s.enemies) if (e.dist > furthest) furthest = e.dist;
    }
    progress.push(furthest / s.path.length);
    lost.push(livesBefore - s.lives);
  }
  return { state: s, progress, lost };
}

export const strategyCache = new Map();
export function strategyRun(mix, dt, mapId = 'meadow', cool = false) {
  const key = `${mapId}:${mix === 'arrowOnly' ? mix : mix.join(',')}@${dt}${cool ? ':kühl' : ''}`;
  if (!strategyCache.has(key)) strategyCache.set(key, playTracked(mix, dt, mapId, cool));
  return strategyCache.get(key);
}

// B-046: Die schwächere Reihenfolge Pfeil > Pfeil > Kanone > Frost schafft Welle 20 nicht mehr (Druck bewusst erhöht).
export const MIX_WEAK = ['arrow', 'arrow', 'cannon', 'frost'];
// B-013: In der Spätphase (Welle 14-20) dringen Gegner messbar weit vor, bevor sie sterben.
// Vor B-013 erreichte der weiteste Gegner dort höchstens 75 % des Wegs, danach in mindestens 3 Wellen über 76 %.
// Kanonen-Reichweite 2,6 -> 3,4 (auf Wunsch des Menschen): gemessen 53-81 %, Schwelle 55 % (im schwächsten Lauf bestehen 5 von 7 Wellen, die Schwelle trennt also noch).
export const LATE_PROGRESS = 0.55;
// B-044: Eiswelt etwas fordernder als die Wiese, aber klar schaffbar (eigene Läufe mit mapId, per Cache nur einmal je Strategie).
export const mapRun = (kind, dt, mapId = 'ice') =>
  strategyRun(kind === 'cannon' ? MIX_CANNON : kind === 'arrow' ? MIX_ARROW : kind, dt, mapId).state;

// Nur eine Seite verteidigen reicht nicht: Türme nur an den Bauplätzen des oberen Wegs (Hauptweg).
export function oneSideRun(mapId, dt) {
  const s = createGame({ mapId });
  const top = createGame({ mapId, paths: [s.path] }); // gleiche Karte, Bauplätze nur nach dem Hauptweg bewertet
  const spots = rankedSpots(top, TOWER_TYPES.cannon.range);
  let i = 0;
  while (s.status === 'playing' && s.wave < MAX_WAVES) {
    for (let again = true; again;) {
      again = false;
      const type = MIX_ARROW[s.towers.length % MIX_ARROW.length];
      if (i < spots.length && s.gold >= TOWER_TYPES[type].cost) { buildTower(s, type, spots[i].c, spots[i].r); i++; again = true; }
      else {
        let best = null;
        for (const t of s.towers) { const c = upgradeCost(t); if (c !== null && (!best || c < best.c)) best = { id: t.id, c }; }
        if (best && s.gold >= best.c) { upgradeTower(s, best.id); again = true; }
      }
    }
    startWave(s);
    for (let k = 0; k < Math.round(600 / dt) && s.waveActive && s.status === 'playing'; k++) update(s, dt);
  }
  return s;
}

// Blitz-Mix (Kanone, Pfeil, Blitz, Frost): gewinnt Welle 20 auf Wiese und Eiswelt mit mindestens 1 Leben, unabhängig vom Zeitschritt.
export const MIX_LIGHTNING = ['cannon', 'arrow', 'lightning', 'frost'];
// B-171: nur Kanone und Frost (keine Luftabwehr). Vor den neuen Gegnern gewann sie Wiese, Eiswelt und Zangenangriff
// ohne Lebensverlust (10 Leben, dt 1/30 und 1/60).
export const MIX_CANNON_FROST = ['cannon', 'cannon', 'frost', 'cannon'];
// Perfektes Spiel (Vorgabe: auf jeder Karte muss ein ganzer Durchlauf ohne Lebensverlust möglich sein).
// Optimierte, aber nachvollziehbare Strategie: Türme nur auf Plätze ohne Überhitzung, jeweils der Platz mit der besten
// Wegabdeckung für den Turmtyp; erst Kanone und Pfeil, dann früh Scharfschützen gegen Bosse und Trolle, dazu Frost und
// Blitz; mit Restgold das billigste Upgrade. Meteor auf den vordersten Gegner, sobald er die letzten 12 Kacheln erreicht,
// Kälteschock in den letzten 6 Kacheln; keine Reparatur. Auf dem Vulkan kommt der Scharfschütze als dritter Turm
// (der erste Boss in Welle 5 ist schneller), sonst die zweite Kanone (Zwei Fronten: viele Flitzer in Welle 4).
export const PERFECT_ORDER = ['cannon', 'arrow', 'lightning', 'sniper', 'frost', 'cannon', 'sniper']; // 27.11.: mit Aufrüsten
export const PERFECT_ORDER_VOLCANO = PERFECT_ORDER;
// B-125: Auf Zwei Fronten reicht seit der stärkeren Spätphase der Kanonen-Mix (mit Fähigkeiten) für ein perfektes Spiel,
// die Scharfschützen-Reihenfolge verliert dort Leben.
export const PERFECT_ORDER_TWIN = PERFECT_ORDER;

export function bestCoolSpot(state, rangeTiles) {
  return rankedSpots(state, rangeTiles, true)[0] || null;
}

// Anzahl Türme, die das perfekte Spiel baut, bevor es aufrüstet
export const PERFECT_BASE = { default: 7, twin: 12, meadow: 99 }; // 99: erst alle Plätze bebauen, dann aufrüsten
export function perfectRun(mapId, dt, base = PERFECT_BASE[mapId] ?? PERFECT_BASE.default) {
  const s = createGame({ mapId });
  const order = mapId === 'volcano' ? PERFECT_ORDER_VOLCANO : mapId === 'twin' ? PERFECT_ORDER_TWIN : PERFECT_ORDER;
  let lost = 0;
  while (s.status === 'playing' && s.wave < MAX_WAVES) {
    for (let again = true; again;) {
      again = false;
      // 27.11.: Aufrüsten zuerst (stärkste Spielweise): nach PERFECT_BASE Türmen erst alle voll aufrüsten, dann weiterbauen
      if (s.towers.length >= base) {
        let best = null;
        for (const t of s.towers) {
          const c = upgradeCost(t);
          if (c !== null && (!best || c < best.c)) best = { id: t.id, c };
        }
        if (best) { if (s.gold >= best.c) { upgradeTower(s, best.id); again = true; } continue; }
      }
      const type = order[s.towers.length % order.length];
      const spot = s.gold >= TOWER_TYPES[type].cost ? bestCoolSpot(s, TOWER_TYPES[type].range) : null;
      if (spot) { buildTower(s, type, spot.c, spot.r); again = true; }
    }
    const before = s.lives;
    startWave(s);
    for (let k = 0; k < Math.round(600 / dt) && s.waveActive && s.status === 'playing'; k++) {
      update(s, dt);
      let front = null;
      for (const e of s.enemies) {
        const rest = enemyPath(s, e).length - e.dist;
        if (!front || rest < front.rest) front = { e, rest };
      }
      if (front && front.rest < 12 * TILE) {
        useAbility(s, 'meteor', front.e.x, front.e.y);
        if (front.rest < 6 * TILE) useAbility(s, 'freeze');
      }
    }
    lost += before - s.lives;
  }
  assert.equal(s.abilities.repair.uses, 0, 'keine Reparatur');
  return { state: s, lost };
}

// 27.11.: Strategie "Aufrüsten zuerst" ohne Fähigkeiten (so spielen gute Spieler): erst `base` Türme bauen,
// dann jeden Turm voll aufrüsten, erst danach weiterbauen.
export const MIX_MAX = ['arrow', 'cannon', 'lightning', 'frost', 'sniper'];
export function maxFirstRun(order, dt, mapId = 'meadow', base = 5) {
  const s = createGame({ mapId });
  const spots = rankedSpots(s, TOWER_TYPES.cannon.range);
  let i = 0;
  while (s.status === 'playing' && s.wave < MAX_WAVES) {
    for (let again = true; again;) {
      again = false;
      const up = s.towers.length >= Math.min(base, i + 1) ? s.towers.find((t) => upgradeCost(t) !== null) : null;
      if (up) { if (s.gold >= upgradeCost(up)) { upgradeTower(s, up.id); again = true; } continue; }
      const type = order[s.towers.length % order.length];
      if (i < spots.length && s.gold >= TOWER_TYPES[type].cost) { buildTower(s, type, spots[i].c, spots[i].r); i++; again = true; }
    }
    startWave(s);
    for (let k = 0; k < Math.round(600 / dt) && s.waveActive && s.status === 'playing'; k++) update(s, dt);
  }
  return s;
}
