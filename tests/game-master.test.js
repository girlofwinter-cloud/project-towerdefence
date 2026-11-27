// B-175/B-176: Stufe-3-Fähigkeiten der Türme (TOWER_TYPES[typ].master). Eigene Datei neben game.test.js.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, buildTower, spawnEnemy, enemyPath, towerStats, masterOf, masterInfo, densestCluster, upgradeTower, useAbility } from '../src/game.js';
import { buildPath, pointAt } from '../src/path.js';
import { TOWER_TYPES, ENEMY_TYPES, TILE, MAX_LEVEL, MASTER_FX } from '../src/config.js';
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
    for (const type of Object.keys(TOWER_TYPES)) {
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

// Ein Schuss des Turms, Geschoss fliegt ins Ziel; danach schießt der Turm nicht mehr (cooldown 99).
function shootOnce(s, tower) {
  tower.cooldown = 0;
  update(s, 0.001);
  const p = s.projectiles[0];
  for (let i = 0; i < 100 && s.projectiles.length; i++) { tower.cooldown = 99; update(s, 0.01); }
  return p;
}
// Zeit laufen lassen, ohne dass die Türme schießen
function wait(s, seconds, dt = 0.05) {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    for (const tw of s.towers) tw.cooldown = 99;
    update(s, dt);
  }
}
const lost = (e) => e.maxHp - e.hp;

describe('B-176 Kanone: Brandfläche', () => {
  const M = TOWER_TYPES.cannon.master;

  test('Stufe 2: keine Brandfläche', () => {
    const { s, tower } = lineSetup('cannon', 2);
    put(s, 'grunt', 4.5);
    shootOnce(s, tower);
    assert.equal(s.grounds.length, 0);
  });

  test('Stufe 3: brennt burnDuration Sekunden mit burnShare des Treffers je Sekunde, Flieger nicht', () => {
    const { s, tower } = lineSetup('cannon');
    const e = put(s, 'grunt', 4.5);
    const bat = put(s, 'bat', 4.5);
    const p = shootOnce(s, tower);
    assert.equal(s.grounds.length, 1);
    const g = s.grounds[0];
    assert.equal(g.kind, 'fire');
    assert.ok(Math.abs(g.until - s.time - M.burnDuration) < 0.02);
    const dps = p.damage * M.burnShare;
    assert.ok(Math.abs(g.dps - dps) < 1e-9);
    const afterHit = lost(e);
    wait(s, M.burnDuration + 1);
    assert.ok(Math.abs(lost(e) - afterHit - dps * M.burnDuration) < dps * 0.1, 'Schaden über die ganze Dauer (Toleranz: ein Zeitschritt)');
    assert.equal(s.grounds.length, 0, 'Fläche erlischt');
    assert.equal(lost(bat), 0, 'Flieger brennen nicht');
  });

  test('Brandschaden zählt nicht als Treffer gegen die Schale', () => {
    const { s, tower } = lineSetup('cannon');
    const e = put(s, 'beetle', 4.5);
    e.shell = ENEMY_TYPES.beetle.shellHits;
    shootOnce(s, tower);
    const shell = e.shell;
    assert.equal(shell, ENEMY_TYPES.beetle.shellHits - 1, 'Explosion nimmt eine Schicht');
    wait(s, M.burnDuration);
    assert.equal(e.shell, shell, 'Brand nimmt keine Schicht');
  });
});

describe('B-176 Frost: Eisboden', () => {
  const M = TOWER_TYPES.frost.master;
  const slowF = () => 1 - TOWER_TYPES.frost.slow;
  const slowed = (s, e) => s.time < e.slowUntil && e.slowFactor < 1;

  test('Stufe 2: kein Eisboden', () => {
    const { s, tower } = lineSetup('frost', 2);
    put(s, 'grunt', 4.5);
    shootOnce(s, tower);
    assert.equal(s.grounds.length, 0);
  });

  test('Stufe 3: Eisfläche am Treffpunkt verlangsamt Nachzügler im Radius für iceDuration', () => {
    const { s, tower } = lineSetup('frost');
    const e = put(s, 'grunt', 4.5);
    shootOnce(s, tower);
    const g = s.grounds[0];
    assert.equal(g.kind, 'ice');
    assert.equal(g.r, M.iceRadius * TILE);
    assert.deepEqual([g.x, g.y], [e.x, e.y]);
    assert.ok(Math.abs(g.until - s.time - M.iceDuration) < 0.02);
    const late = put(s, 'grunt', 4.5 + M.iceRadius * 0.5);
    const far = put(s, 'grunt', 4.5 + M.iceRadius + 0.3);
    wait(s, 0.1);
    assert.ok(slowed(s, late), 'Nachzügler auf dem Eis');
    assert.ok(Math.abs(late.slowFactor - slowF()) < 1e-9);
    assert.ok(!slowed(s, far), 'außerhalb des Radius');
    wait(s, M.iceDuration);
    const after = put(s, 'grunt', 4.5);
    wait(s, 0.1);
    assert.ok(!slowed(s, after), 'nach Ablauf kein Eis mehr');
  });

  test('Glutling und Flieger sind nicht betroffen', () => {
    const { s, tower } = lineSetup('frost');
    put(s, 'grunt', 4.5);
    shootOnce(s, tower);
    const ember = put(s, 'ember', 4.5);
    const bat = put(s, 'bat', 4.5);
    wait(s, 0.1);
    assert.ok(!slowed(s, ember));
    assert.ok(!slowed(s, bat));
  });

  test('kein Stapeln: getroffenes Ziel bleibt bei 1 - slow, stärkere Verlangsamung bleibt erhalten', () => {
    const { s, tower } = lineSetup('frost');
    const e = put(s, 'grunt', 4.5);
    shootOnce(s, tower);
    wait(s, 0.2);
    assert.ok(Math.abs(e.slowFactor - slowF()) < 1e-9);
    const strong = put(s, 'grunt', 4.5);
    strong.slowFactor = 0.2; strong.slowUntil = s.time + 5;
    wait(s, 0.2);
    assert.equal(strong.slowFactor, 0.2);
  });
});

describe('B-176 Scharfschütze: Markieren', () => {
  const M = TOWER_TYPES.sniper.master;
  function markSetup(level = MAX_LEVEL) {
    const { s, tower } = lineSetup('sniper', level);
    const e = put(s, 'grunt', 4.5);
    const arrow = buildTower(s, 'arrow', ...freeTileNearPath(s)).tower;
    arrow.x = tower.x; arrow.y = tower.y;
    arrow.cooldown = 99;
    return { s, tower, arrow, e };
  }
  function arrowHit(s, arrow, e) {
    const before = lost(e);
    s.towers.find((t) => t.type === 'sniper').cooldown = 99;
    shootOnce(s, arrow);
    return lost(e) - before;
  }

  test('Stufe 2: kein Markieren', () => {
    const { s, tower, arrow, e } = markSetup(2);
    shootOnce(s, tower);
    assert.equal(e.markedUntil, undefined);
    assert.ok(Math.abs(arrowHit(s, arrow, e) - towerStats(arrow, s.modifiers).damage) < 1e-9);
  });

  test('Stufe 3: markBonus mehr Schaden von allen Türmen, nur solange markiert', () => {
    const { s, tower, arrow, e } = markSetup();
    shootOnce(s, tower);
    assert.ok(Math.abs(lost(e) - towerStats(tower, s.modifiers).damage) < 1e-9, 'markierender Schuss selbst ohne Aufschlag');
    assert.ok(Math.abs(e.markedUntil - s.time - M.markDuration) < 0.05);
    const base = towerStats(arrow, s.modifiers).damage;
    assert.ok(Math.abs(arrowHit(s, arrow, e) - base * (1 + M.markBonus)) < 1e-9, 'Aufschlag solange markiert');
    wait(s, M.markDuration);
    assert.ok(Math.abs(arrowHit(s, arrow, e) - base) < 1e-9, 'nach Ablauf normal');
  });
});

// B-173/B-174: reine Darstellungs-Ereignisse der Stufe 3 (ändern keine Spielwerte)
describe('B-173/B-174 Optik-Ereignisse', () => {
  test('Aufstieg: Effekt ascend nur beim Aufwerten auf Stufe 3', () => {
    const { s, tower } = lineSetup('arrow', 1);
    upgradeTower(s, tower.id);
    assert.ok(!s.effects.some((f) => f.kind === 'ascend'), 'nicht auf Stufe 2');
    upgradeTower(s, tower.id);
    const fx = s.effects.filter((f) => f.kind === 'ascend');
    assert.equal(fx.length, 1);
    assert.equal(fx[0].towerId, tower.id);
    assert.equal(fx[0].max, MASTER_FX.ascend.life);
  });

  test('Gewitter: Ankündigung stormWarn kurz vor dem Einschlag, einmal je Takt; Einschlag mit Turm-Bezug', () => {
    const { s, tower } = lineSetup('lightning');
    put(s, 'grunt', 4); put(s, 'grunt', 4.3);
    tower.cooldown = 99;
    update(s, 0.001); // erster Einschlag sofort
    const strike = s.effects.find((f) => f.kind === 'storm');
    assert.equal(strike.towerId, tower.id);
    assert.equal(strike.max, MASTER_FX.storm.life);
    const every = TOWER_TYPES.lightning.master.stormEvery;
    const seen = new Set([strike]);
    let warns = 0, warnAt = null, strikeAt = null;
    for (let i = 0; i < 100 && strikeAt === null; i++) {
      tower.cooldown = 99;
      update(s, 0.05);
      for (const f of s.effects) {
        if (seen.has(f)) continue;
        seen.add(f);
        if (f.kind === 'stormWarn') { warns++; warnAt = s.time; }
        if (f.kind === 'storm') strikeAt = s.time;
      }
    }
    assert.equal(warns, 1, 'eine Ankündigung je Takt');
    assert.ok(Math.abs(strikeAt - 0.001 - every) < 0.06, 'Takt unverändert');
    assert.ok(strikeAt - warnAt > 0 && strikeAt - warnAt <= MASTER_FX.storm.tele + 0.05 + 1e-9, 'kurz vor dem Einschlag');
  });

  test('Mehrfachschuss: Treffer-Sterne für Haupt- und Nebenziele; Markierung merkt sich das erste Markieren', () => {
    const { s, tower } = lineSetup('arrow');
    put(s, 'grunt', 4); put(s, 'grunt', 4.5); put(s, 'grunt', 5);
    shootOnce(s, tower);
    const hits = s.effects.filter((f) => f.kind === 'multiHit');
    assert.equal(hits.length, 3);
    assert.deepEqual(hits.map((h) => h.main).sort(), [false, false, true]);

    const m = lineSetup('sniper');
    const e = put(m.s, 'grunt', 4.5);
    shootOnce(m.s, m.tower);
    const first = e.markedAt;
    assert.ok(Number.isFinite(first));
    wait(m.s, 0.5);
    shootOnce(m.s, m.tower);
    assert.equal(e.markedAt, first, 'erneut getroffen: kein neues Aufploppen');
  });

  test('Bodenflächen tragen ihren Beginn (born), Eis den Turm', () => {
    const { s, tower } = lineSetup('frost');
    put(s, 'grunt', 4.5);
    shootOnce(s, tower);
    const g = s.grounds[0];
    assert.ok(Number.isFinite(g.born) && g.born <= s.time);
    assert.equal(g.towerId, tower.id);
  });
});

// Review-Befunde 27.11.
describe('Review: Gewitter, Aufstieg, Elite-Schild', () => {
  const M = TOWER_TYPES.lightning.master;

  test('Gewitter: Irrlichter weichen aus (wie bei Splash und Brandfläche)', () => {
    const { s, tower } = lineSetup('lightning');
    tower.cooldown = 99;
    const pack = [put(s, 'grunt', 4), put(s, 'wisp', 4.2), put(s, 'grunt', 4.4)];
    update(s, 0.001);
    assert.ok(s.effects.some((f) => f.kind === 'storm'), 'Einschlag');
    assert.ok(pack[0].hp < pack[0].maxHp, 'Goblin getroffen');
    assert.equal(pack[1].hp, pack[1].maxHp, 'Irrlicht nicht getroffen');
  });

  test('Aufstieg auf Stufe 3: erster Einschlag erst nach stormEvery, mit Ankündigung', () => {
    const { s, tower } = lineSetup('lightning', MAX_LEVEL - 1);
    tower.cooldown = 99;
    const e = put(s, 'grunt', 4);
    assert.ok(upgradeTower(s, tower.id).ok);
    assert.ok(Math.abs(tower.stormAt - (s.time + M.stormEvery)) < 1e-9);
    update(s, 0.001);
    assert.equal(e.hp, e.maxHp, 'nicht sofort');
    let warned = false;
    for (let i = 0; i < 40 && e.hp === e.maxHp; i++) {
      tower.cooldown = 99;
      update(s, M.stormEvery / 30);
      warned ||= s.effects.some((f) => f.kind === 'stormWarn');
    }
    assert.ok(e.hp < e.maxHp, 'Einschlag nach dem Takt');
    assert.ok(warned, 'Ankündigung vorher');
    // andere Türme bekommen kein stormAt
    const { s: s2, tower: t2 } = lineSetup('arrow', MAX_LEVEL - 1);
    upgradeTower(s2, t2.id);
    assert.equal(t2.stormAt, undefined);
  });

  test('Elite-Schild: Splitter nur einmal, auch wenn der Schild nachgefüllt wird', () => {
    const { s } = lineSetup('arrow', 1);
    const e = put(s, 'grunt', 4);
    e.elite = 'shield';
    const breaks = () => s.effects.filter((f) => f.kind === 'eliteBreak').length;
    const hit = (amount) => { e.ward = amount; s.towers[0].cooldown = 99; spawnHit(s, e); };
    function spawnHit(st, en) {
      // Meteor als neutraler Schadensweg über die öffentliche API
      st.abilities.meteor.readyAt = 0;
      assert.ok(useAbility(st, 'meteor', en.x, en.y).ok, 'Meteor trifft');
    }
    hit(5);
    assert.equal(breaks(), 1);
    hit(5); // Magier füllt nach, Schild bricht erneut
    assert.equal(breaks(), 1, 'kein zweiter Splitter-Effekt');
  });
});
