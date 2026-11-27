// Tester-Randfälle zu B-175/B-176 (Stufe 3), B-179 (Elite) und B-180 (Nekromantin Phase 2, Welle 20, Boss-Leiste).
// Ergänzt game-master.test.js und game.test.js, schwächt dort nichts ab.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, buildTower, spawnEnemy, enemyPath, towerStats, upgradeTower, sellTower, useAbility } from '../src/game.js';
import { buildPath, pointAt } from '../src/path.js';
import { TOWER_TYPES, ENEMY_TYPES, TILE, MAX_LEVEL, ELITE, waveFor, MAX_WAVES, hpScale } from '../src/config.js';
import { bossBarViews } from '../src/hud.js';
import { freeTileNearPath } from './helpers.js';

// Gerader Weg in Zeile 5; Turm eine Kachel unter dem Weg, 5 Kacheln vom Weganfang (wie game-master.test.js).
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
function put(s, type, distTiles, hp = 1e6, wave = 1, elite = null) {
  const e = spawnEnemy(s, type, wave, null, elite);
  e.dist = distTiles * TILE;
  Object.assign(e, pointAt(enemyPath(s, e), e.dist));
  e.speed = 0;
  e.hp = e.maxHp = hp;
  return e;
}
const lost = (e) => e.maxHp - e.hp;
function shootOnce(s, tower) {
  tower.cooldown = 0;
  update(s, 0.001);
  for (let i = 0; i < 100 && s.projectiles.length; i++) { tower.cooldown = 99; update(s, 0.01); }
}
function wait(s, seconds, dt = 0.05) {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    for (const tw of s.towers) tw.cooldown = 99;
    update(s, dt);
  }
}

describe('Gewitter: Randfälle', () => {
  const M = TOWER_TYPES.lightning.master;

  test('Aufrüsten auf Stufe 3 mitten im Kampf: kein Sofort-Einschlag, erster Einschlag mit Ankündigung', () => {
    const { s, tower } = lineSetup('lightning', 2);
    const e = put(s, 'grunt', 4.5);
    tower.cooldown = 99;
    update(s, 0.1);
    assert.ok(upgradeTower(s, tower.id).ok);
    const kinds = [];
    for (let t = 0; t < M.stormEvery + 0.5; t += 0.05) {
      tower.cooldown = 99;
      update(s, 0.05);
      for (const fx of s.effects) if ((fx.kind === 'storm' || fx.kind === 'stormWarn') && !kinds.includes(fx)) kinds.push(fx);
    }
    const first = kinds[0];
    assert.ok(first, 'es gibt ein Gewitter');
    assert.equal(first.kind, 'stormWarn', `erstes Ereignis nach dem Aufrüsten ist die Ankündigung, nicht der Einschlag (war: ${first.kind})`);
    assert.ok(lost(e) > 0, 'nach einem Takt schlägt es ein');
  });

  test('Irrlicht weicht dem Gewitter aus wie dem Splash, die anderen im Radius nehmen Schaden', () => {
    const { s, tower } = lineSetup('lightning');
    const g = put(s, 'grunt', 4.5);
    const w = put(s, 'wisp', 4.6);
    tower.cooldown = 99;
    update(s, 0.001);
    assert.ok(lost(g) > 0, 'Goblin getroffen');
    assert.equal(lost(w), 0, 'Irrlicht nimmt keinen Flächenschaden');
  });

  test('Verkaufen während der Ankündigung: kein Einschlag mehr, nichts wirft', () => {
    const { s, tower } = lineSetup('lightning');
    const e = put(s, 'grunt', 4.5);
    tower.cooldown = 99;
    update(s, 0.001); // erster Einschlag
    const after = lost(e);
    wait(s, M.stormEvery - 0.1); // Ankündigung läuft
    assert.ok(s.effects.some((fx) => fx.kind === 'stormWarn'));
    assert.ok(sellTower(s, tower.id).ok);
    wait(s, M.stormEvery * 2);
    assert.equal(lost(e), after, 'verkaufter Turm schlägt nicht mehr ein');
  });

  test('Schild der Nekromantin hält auch gegen Gewitter und Brandfläche', () => {
    const { s, tower } = lineSetup('lightning');
    const n = put(s, 'necro', 4.5, 1000);
    n.hp = 400;
    n.phase = 2;
    n.shieldUntil = s.time + 10;
    s.grounds.push({ kind: 'fire', x: n.x, y: n.y, r: TILE, until: s.time + 5, dps: 100, born: s.time });
    tower.cooldown = 99;
    update(s, 0.001);
    wait(s, 1);
    assert.equal(n.hp, 400);
  });
});

describe('Brandfläche und Eisboden: Randfälle', () => {
  test('Verkaufen der Kanone, während der Boden brennt: Brand läuft ab, Gold für Kills zählt', () => {
    const { s, tower } = lineSetup('cannon');
    const e = put(s, 'grunt', 4.5, 1e6);
    shootOnce(s, tower);
    assert.equal(s.grounds.length, 1);
    assert.ok(sellTower(s, tower.id).ok);
    e.hp = 0.5; // stirbt am Brand
    const gold = s.gold;
    wait(s, 0.2);
    assert.equal(s.enemies.includes(e), false, 'am Brand gestorben');
    assert.equal(s.gold, gold + e.reward, 'Belohnung trotz verkauftem Turm');
    wait(s, TOWER_TYPES.cannon.master.burnDuration);
    assert.equal(s.grounds.length, 0);
  });

  test('Brand löst den Phasenwechsel der Nekromantin aus und trifft dann 2 s nicht', () => {
    const s = createGame({ gold: 1e9, path: buildPath([[0, 5], [19, 5]], TILE) });
    const n = put(s, 'necro', 4.5, 1000);
    n.summonAt = 1e9;
    n.hp = 501;
    s.grounds.push({ kind: 'fire', x: n.x, y: n.y, r: TILE, until: s.time + 10, dps: 10, born: s.time });
    wait(s, 0.5);
    assert.equal(n.phase, 2);
    const hp = n.hp;
    wait(s, ENEMY_TYPES.necro.phase2.shieldDuration - 0.6); // Phase begann nach etwa 0,1 s
    assert.equal(n.hp, hp, 'Schild hält gegen den Brand');
  });

  test('Eisboden verlangsamt auch den Boss, Rückkehr zu voller Geschwindigkeit nach iceLinger', () => {
    const s = createGame({ gold: 1e9, path: buildPath([[0, 5], [19, 5]], TILE) });
    const b = put(s, 'boss', 4.5);
    s.grounds.push({ kind: 'ice', x: b.x, y: b.y, r: TILE, until: s.time + 0.5, slow: 0.5, linger: 0.25, born: s.time });
    update(s, 0.05);
    assert.ok(s.time < b.slowUntil && b.slowFactor === 0.5);
    wait(s, 1);
    assert.ok(!(s.time < b.slowUntil), 'Verlangsamung endet');
  });
});

describe('Elite und Markierung: Randfälle', () => {
  test('Elite-Schild + Markierung + Rüstung: Rüstung, dann Aufschlag, dann Schild', () => {
    const { s, tower } = lineSetup('arrow', 1);
    const e = put(s, 'shielded', 4.5, 1000, 1, 'shield');
    assert.ok(e.ward > 0, 'Elite-Schild aus spawnEnemy');
    e.ward = 30;
    e.markedUntil = s.time + 5;
    e.markBonus = TOWER_TYPES.sniper.master.markBonus;
    const dmg = towerStats(tower, s.modifiers).damage;
    const expected = dmg * (1 - ENEMY_TYPES.shielded.armor) * (1 + e.markBonus);
    shootOnce(s, tower);
    const absorbed = Math.min(30, expected);
    assert.ok(Math.abs(30 - e.ward - absorbed) < 1e-9, 'Schild schluckt den markierten Schaden nach der Rüstung');
    assert.ok(Math.abs(lost(e) - (expected - absorbed)) < 1e-9);
  });

  test('Elite-Schild bricht nur einmal (Splitter), auch wenn ein Magier später nachfüllt', () => {
    const { s, tower } = lineSetup('arrow', 1);
    const e = put(s, 'grunt', 4.5, 1000, 1, 'shield'); // Magier-Schild = wardShare * 1000
    e.ward = 1;
    const m = put(s, 'mage', 4.6);
    m.hp = m.maxHp = 1e6;
    const seen = new Set();
    const collect = () => { for (const fx of s.effects) if (fx.kind === 'eliteBreak') seen.add(fx); };
    const shoot = () => { tower.cooldown = 0; update(s, 0.001); collect(); for (let i = 0; i < 100 && s.projectiles.length; i++) { tower.cooldown = 99; update(s, 0.01); collect(); } };
    tower.targetMode = 'last';
    shoot();
    assert.equal(seen.size, 1);
    s.wardAt = s.time; // Magier zaubert
    update(s, 0.001);
    assert.ok(e.ward > 0, 'Magier-Schild auf dem Elite-Gegner');
    for (let i = 0; i < 20 && e.ward > 0; i++) shoot();
    assert.ok(!(e.ward > 0), 'Magier-Schild ist weg');
    assert.equal(seen.size, 1, 'der Magier-Schild ist kein Elite-Schild, keine zweiten Splitter');
  });

  test('Selbstheilung: nie über maxHp, kein Wiederbeleben bei hp <= 0, große dt ohne Überlauf', () => {
    const s = createGame({ gold: 0, path: buildPath([[0, 5], [19, 5]], TILE) });
    const e = put(s, 'grunt', 4.5, 100, 1, 'regen');
    e.hp = 99.9;
    update(s, 1);
    assert.equal(e.hp, 100);
    const d = put(s, 'grunt', 6, 100, 1, 'regen');
    d.hp = 0;
    update(s, 0.5);
    assert.equal(s.enemies.includes(d), false, 'toter Elite-Gegner wird entfernt, nicht geheilt');
  });
});

describe('Nekromantin: Meteor und Schild', () => {
  test('Meteor löst Phase 2 aus; ein zweiter Meteor im Schild macht keinen Schaden', () => {
    const s = createGame({ gold: 0, path: buildPath([[0, 5], [19, 5]], TILE) });
    s.wave = 15;
    const n = put(s, 'necro', 4.5, 1000 * hpScale(15), 15);
    n.summonAt = 1e9;
    n.hp = n.maxHp * 0.5 + 1;
    assert.ok(useAbility(s, 'meteor', n.x, n.y).ok);
    assert.equal(n.phase, 2);
    assert.ok(n.shieldUntil > s.time);
    const hp = n.hp;
    s.abilities.meteor.readyAt = 0;
    assert.ok(useAbility(s, 'meteor', n.x, n.y).ok);
    assert.equal(n.hp, hp);
  });
});

describe('Welle 20 und Boss-Leiste', () => {
  test(`Welle ${MAX_WAVES}: zwei Oger-Könige und eine Nekromantin, Leiste: Nekromantin + "Oger-König ×2"`, () => {
    const list = waveFor(MAX_WAVES);
    assert.equal(list.filter((e) => e.type === 'boss').length, 2);
    assert.equal(list.filter((e) => e.type === 'necro').length, 1);
    assert.ok(list.every((e) => !e.elite || ELITE.types.includes(e.type)), 'Bosse nie Elite');
    const s = createGame();
    for (const e of list.filter((x) => x.type === 'boss' || x.type === 'necro')) spawnEnemy(s, e.type, MAX_WAVES);
    const v = bossBarViews(s);
    assert.deepEqual(v.map((x) => x.name), ['Nekromantin', `${ENEMY_TYPES.boss.name} ×2`]);
    assert.equal(v[1].phase, 0);
  });

  test('zwei Nekromantinnen: zwei Leisten mit eigener Phase; Tote zählen nicht', () => {
    const s = createGame();
    const a = spawnEnemy(s, 'necro', 20);
    const b = spawnEnemy(s, 'necro', 20);
    b.phase = 2;
    b.shieldUntil = s.time + 1;
    let v = bossBarViews(s);
    assert.deepEqual(v.map((x) => [x.name, x.phase, x.shielded]), [['Nekromantin', 1, false], ['Nekromantin', 2, true]]);
    a.hp = 0;
    v = bossBarViews(s);
    assert.equal(v.length, 1);
    assert.equal(v[0].phase, 2);
  });
});
