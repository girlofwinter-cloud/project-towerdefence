// B-175/B-176: Stufe-3-Fähigkeiten der Türme (TOWER_TYPES[typ].master). Eigene Datei neben game.test.js.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, buildTower, spawnEnemy, enemyPath, towerStats, masterOf, masterInfo, densestCluster } from '../src/game.js';
import { buildPath, pointAt } from '../src/path.js';
import { TOWER_TYPES, TILE, MAX_LEVEL } from '../src/config.js';
import { freeTileNearPath } from './helpers.js';

// Gerader Weg in Zeile 5; Turm eine Kachel unter dem Weg bei x = 5 Kacheln vom Weganfang.
function lineSetup(type, level = MAX_LEVEL) {
  const s = createGame({ gold: 1e9, path: buildPath([[0, 5], [19, 5]], TILE) });
  const [c, r] = freeTileNearPath(s);
  const tower = buildTower(s, type, c, r).tower;
  tower.level = level;
  const start = pointAt(s.path, 0);
  tower.x = start.x + 5 * TILE;
  tower.y = start.y + TILE;
  return { s, tower };
}
// Gegner bei dist Kacheln, steht still und hält viel aus
function put(s, type, distTiles) {
  const e = spawnEnemy(s, type, 1);
  e.dist = distTiles * TILE;
  Object.assign(e, pointAt(enemyPath(s, e), e.dist));
  e.speed = 0;
  e.hp = e.maxHp = 1e6;
  return e;
}

describe('B-175 Grundgerüst: Stufe-3-Fähigkeit', () => {
  test('masterOf nur auf Stufe 3; masterInfo mit Vorschau auf Stufe 2', () => {
    for (const type of ['arrow', 'lightning']) {
      const m = TOWER_TYPES[type].master;
      assert.ok(m.text.length > 20 && m.text.startsWith(m.name), type);
      assert.equal(masterOf({ type, level: 1 }), null);
      assert.equal(masterOf({ type, level: 2 }), null);
      assert.equal(masterOf({ type, level: 3 }), m);
      assert.equal(masterInfo({ type, level: 1 }), '');
      assert.equal(masterInfo({ type, level: 2 }), `Auf Stufe 3: ${m.text}`);
      assert.equal(masterInfo({ type, level: 3 }), `Stufe 3: ${m.text}`);
    }
  });
});

describe('B-175 Pfeil: Mehrfachschuss', () => {
  const M = TOWER_TYPES.arrow.master;

  test('Stufe 2: nur ein Geschoss', () => {
    const { s, tower } = lineSetup('arrow', 2);
    put(s, 'grunt', 4); put(s, 'grunt', 4.5); put(s, 'grunt', 5);
    tower.cooldown = 0;
    update(s, 0.001);
    assert.equal(s.projectiles.length, 1);
  });

  test('Stufe 3: bis zu multiTargets verschiedene Ziele, Nebenziele mit extraDamage', () => {
    const { s, tower } = lineSetup('arrow');
    const a = put(s, 'grunt', 4); const b = put(s, 'grunt', 4.5); const main = put(s, 'grunt', 5); put(s, 'grunt', 3.8);
    tower.cooldown = 0;
    update(s, 0.001);
    assert.equal(s.projectiles.length, M.multiTargets);
    const ids = s.projectiles.map((p) => p.targetId);
    assert.equal(new Set(ids).size, ids.length, 'kein Ziel doppelt');
    assert.equal(ids[0], main.id, 'Hauptziel nach Zielregel "Erster"');
    assert.deepEqual(ids.slice(1).sort(), [a.id, b.id].sort());
    const dmg = towerStats(tower, s.modifiers).damage;
    assert.ok(Math.abs(s.projectiles[0].damage - dmg) < 1e-9);
    for (const p of s.projectiles.slice(1)) assert.ok(Math.abs(p.damage - dmg * M.extraDamage) < 1e-9);
  });

  test('Stufe 3: weniger Gegner als Ziele, nie dasselbe Ziel doppelt', () => {
    for (const n of [1, 2]) {
      const { s, tower } = lineSetup('arrow');
      for (let i = 0; i < n; i++) put(s, 'grunt', 4 + i * 0.5);
      tower.cooldown = 0;
      update(s, 0.001);
      assert.equal(s.projectiles.length, n);
      assert.equal(new Set(s.projectiles.map((p) => p.targetId)).size, n);
    }
  });

  test('Aufwärmen zählt nur das Hauptziel', () => {
    const { s, tower } = lineSetup('arrow');
    const main = put(s, 'grunt', 5); put(s, 'grunt', 4); put(s, 'grunt', 4.5);
    for (let i = 0; i < 4; i++) { tower.cooldown = 0; update(s, 0.001); s.projectiles = []; }
    assert.equal(tower.focusId, main.id);
    assert.equal(tower.focusStacks, 3);
  });
});

describe('B-175 Blitz: Gewitter', () => {
  const M = TOWER_TYPES.lightning.master;
  // Pulk aus zwei Goblins und einer Fledermaus, dazu ein einzelner Goblin abseits (noch in Reichweite)
  function stormSetup(level = MAX_LEVEL) {
    const { s, tower } = lineSetup('lightning', level);
    const pack = [put(s, 'grunt', 4), put(s, 'bat', 4.3), put(s, 'grunt', 4.6)];
    const lone = put(s, 'grunt', 7.5);
    tower.cooldown = 99; // normaler Kettenblitz bleibt aus
    return { s, tower, pack, lone };
  }
  const lost = (e) => e.maxHp - e.hp;

  test('densestCluster ist rein und wählt den Gegner mit den meisten Nachbarn', () => {
    const enemies = [
      { x: 0, y: 0, hp: 1 }, { x: 100, y: 0, hp: 1 }, { x: 110, y: 0, hp: 1 }, { x: 120, y: 0, hp: 1 }, { x: 105, y: 0, hp: 0 },
    ];
    const snap = JSON.stringify(enemies);
    assert.deepEqual(densestCluster(enemies, { x: 0, y: 0 }, 500, 25), { x: 100, y: 0 });
    assert.deepEqual(densestCluster(enemies, { x: 0, y: 0 }, 50, 25), { x: 0, y: 0 }, 'nur Gegner in Reichweite');
    assert.equal(densestCluster([], { x: 0, y: 0 }, 500, 25), null);
    assert.equal(JSON.stringify(enemies), snap);
  });

  test('Stufe 2: kein Gewitter', () => {
    const { s, pack, lone } = stormSetup(2);
    update(s, 0.001);
    assert.ok([...pack, lone].every((e) => lost(e) === 0));
    assert.ok(!s.effects.some((f) => f.kind === 'storm'));
  });

  test('Stufe 3: trifft das Zentrum des dichtesten Pulks und alle im Radius, auch Flieger', () => {
    const { s, tower, pack, lone } = stormSetup();
    update(s, 0.001);
    const dmg = towerStats(tower, s.modifiers).damage * M.stormDamage;
    for (const e of pack) assert.ok(Math.abs(lost(e) - dmg) < 1e-6, e.type);
    assert.equal(lost(lone), 0, 'einzelner Gegner außerhalb des Radius');
    const fx = s.effects.find((f) => f.kind === 'storm');
    assert.deepEqual([fx.x, fx.y], [pack[0].x, pack[0].y]);
    assert.equal(fx.r, M.stormRadius * TILE);
  });

  test('Takt je Turm: höchstens ein Einschlag alle stormEvery Sekunden', () => {
    const { s, tower, pack } = stormSetup();
    const t2 = buildTower(s, 'lightning', ...freeTileNearPath(s)).tower;
    t2.level = 1; // zweiter Turm ohne Gewitter stört den Takt nicht
    update(s, 0.001);
    const one = lost(pack[0]);
    for (let i = 0; i < 10; i++) { tower.cooldown = 99; t2.cooldown = 99; update(s, (M.stormEvery - 0.05) / 10); }
    assert.equal(lost(pack[0]), one, 'vor Ablauf kein zweiter Einschlag');
    tower.cooldown = 99; t2.cooldown = 99;
    update(s, 0.1);
    assert.ok(Math.abs(lost(pack[0]) - 2 * one) < 1e-6, 'danach genau ein zweiter');
  });

  test('ohne Gegner in Reichweite wartet der Einschlag', () => {
    const { s, tower } = lineSetup('lightning');
    tower.cooldown = 99;
    update(s, 0.5);
    assert.equal(tower.stormAt, undefined);
    const e = put(s, 'grunt', 4.5);
    tower.cooldown = 99;
    update(s, 0.001);
    assert.ok(lost(e) > 0);
  });
});
