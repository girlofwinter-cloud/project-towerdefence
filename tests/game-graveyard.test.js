// B-210: Friedhof-Spawns (Nebenwege mit Start mitten auf der Karte)
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startWave, planLanes, canBuild, update } from '../src/game.js';
import { MAPS, DEFAULT_MAP_ID, GRAVEYARD, TILE, waveFor } from '../src/config.js';
import { pointAt } from '../src/path.js';

const ID = 'graveyardTest';
let gy;

// Freie senkrechte Strecke aus drei Kacheln auf der Standardkarte suchen
function freeColumn() {
  const s = createGame({ mapId: DEFAULT_MAP_ID });
  for (let c = 0; c < 20; c++) for (let r = 1; r < 10; r++) {
    if ([0, 1, 2, 3].every((d) => canBuild(s, c, r + d).ok)) return [c, r];
  }
  throw new Error('kein Platz');
}

before(() => {
  const [c, r] = freeColumn();
  gy = { tiles: [[c, r]], waypoints: [[c, r + 1], [c, r + 3]] };
  MAPS[ID] = { ...MAPS[DEFAULT_MAP_ID], graveyards: [gy] };
});
after(() => { delete MAPS[ID]; });

const skeletons = (s) => s.enemies.filter((e) => e.lane === s.graveyards[0].lane);

// Welle starten und nur die Friedhof-Trupps beobachten (Wellengegner bleiben in der Warteschlange stehen)
function atWave(wave) {
  const s = createGame({ mapId: ID });
  s.wave = wave - 1;
  startWave(s);
  s.spawnQueue = s.spawnQueue.map((e) => ({ ...e, at: 1e9 }));
  return s;
}

function runFor(s, seconds, dt = 1 / 60) {
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) update(s, dt);
}

describe('Friedhof-Spawns (B-210)', () => {
  test('Friedhof-Weg hängt hinter den Eingängen, Kacheln nicht bebaubar', () => {
    const s = createGame({ mapId: ID });
    assert.equal(s.entranceCount, 1);
    assert.equal(s.paths.length, 2);
    assert.equal(s.graveyards[0].lane, 1);
    assert.equal(canBuild(s, ...gy.tiles[0]).ok, false);
    assert.equal(canBuild(s, ...gy.waypoints[1]).ok, false);
  });

  test('nach interval genau ein Trupp aus size Skeletten am ersten Wegpunkt', () => {
    const s = atWave(GRAVEYARD.fromWave);
    runFor(s, GRAVEYARD.interval - 0.1);
    assert.equal(skeletons(s).length, 0);
    runFor(s, 0.2);
    assert.equal(skeletons(s).length, 1);
    const start = pointAt(s.paths[1], 0);
    assert.equal(start.x, gy.waypoints[0][0] * TILE + TILE / 2);
    assert.equal(start.y, gy.waypoints[0][1] * TILE + TILE / 2);
    assert.ok(skeletons(s).every((e) => e.type === GRAVEYARD.type));
    // Weg ist kurz: alle je gesehenen Skelette zählen (frühe können schon durch sein)
    const seen = new Set(skeletons(s).map((e) => e.id));
    for (let i = 0; i < Math.round(GRAVEYARD.spacing * GRAVEYARD.size * 60); i++) {
      update(s, 1 / 60);
      for (const e of skeletons(s)) seen.add(e.id);
    }
    assert.equal(seen.size, GRAVEYARD.size);
  });

  test('keine Trupps vor fromWave', () => {
    const s = atWave(GRAVEYARD.fromWave - 1);
    runFor(s, GRAVEYARD.interval * 2);
    assert.equal(skeletons(s).length, 0);
  });

  test('keine Trupps ohne laufende Welle', () => {
    const s = createGame({ mapId: ID });
    s.wave = GRAVEYARD.fromWave;
    runFor(s, GRAVEYARD.interval * 2);
    assert.equal(s.enemies.length, 0);
  });

  test('spawnQueue leer, aber Wellengegner lebt: Trupp kommt', () => {
    const s = atWave(GRAVEYARD.fromWave);
    s.autoWave = false;
    s.spawnQueue = [];
    // einen langsamen Wellengegner auf Lane 0 einsetzen
    const slow = { id: -1, type: 'x', lane: 0, dist: 0, x: 0, y: 0, hp: 1e9, maxHp: 1e9, speed: 0, slowUntil: 0, slowFactor: 1, leak: 1, reward: 0 };
    s.enemies = [slow];
    runFor(s, GRAVEYARD.interval + 0.1);
    assert.ok(skeletons(s).length >= 1);
    assert.equal(s.waveActive, true);
  });

  test('nur Trupp-Skelette übrig: kein neuer Trupp, Welle endet nach deren Tod', () => {
    const s = atWave(GRAVEYARD.fromWave);
    s.autoWave = false;
    runFor(s, GRAVEYARD.interval + 0.05);
    s.spawnQueue = [];
    s.enemies = s.enemies.filter((e) => e.lane >= s.entranceCount);
    const seen = new Set();
    for (let i = 0; i < Math.round(GRAVEYARD.interval * 3 * 60); i++) {
      update(s, 1 / 60);
      for (const e of skeletons(s)) seen.add(e.id);
    }
    assert.ok(seen.size <= GRAVEYARD.size);
    assert.equal(s.enemies.length, 0);
    assert.equal(s.waveActive, false);
  });

  test('Welle endet nicht, solange ein Trupp aussteht', () => {
    const s = atWave(GRAVEYARD.fromWave);
    runFor(s, GRAVEYARD.interval + 0.05);
    s.spawnQueue = [];
    s.enemies = [];
    update(s, 0.01);
    assert.equal(s.waveActive, true);
  });

  test('Wellengegner landen nie auf Friedhof-Lanes', () => {
    const s = createGame({ mapId: ID });
    for (let w = 1; w <= 20; w++) {
      assert.ok(planLanes(s, waveFor(w, ID), w).every((e) => (e.lane ?? 0) < s.entranceCount));
    }
  });

  test('Karten ohne graveyards unverändert', () => {
    for (const id of Object.keys(MAPS)) {
      if (id === ID) continue;
      const s = createGame({ mapId: id });
      const extra = (MAPS[id].extraPaths || []).length;
      assert.equal(s.paths.length, 1 + extra);
      assert.equal(s.entranceCount, s.paths.length);
      assert.deepEqual(s.graveyards, []);
      const list = waveFor(5, id);
      const plain = { ...s, entranceCount: undefined };
      assert.deepEqual(planLanes(s, list, 5), planLanes(plain, list, 5));
    }
  });
});
