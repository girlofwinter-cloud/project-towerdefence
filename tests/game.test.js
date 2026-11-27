// Unit-Tests der Spiel-Logik (game.js, path.js, config.js). Ausführen: npm test
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, mapModifiers, update, buildTower, upgradeTower, sellTower, startWave, planLanes, earlyStartBonus, earlyStartRisk, earlyStartPreview, waveHp, spawnEnemy, canBuild, towerStats, upgradeCost, togglePause, stepGame, setTargetMode, pickTarget, enemyPath, chainTargets, laneFor, nearLava } from '../src/game.js';

import { livesText, startButtonView } from '../src/hud.js';

import { buildPath, pointAt, pathTiles } from '../src/path.js';
import { TOWER_TYPES, MAX_WAVES, START_GOLD, START_LIVES, LOW_LIVES, WAYPOINTS, MAPS, DEFAULT_MAP_ID, TILE, COLS, ROWS, TARGET_MODES, EARLY_START_MAX, LANE_ASYNC, waveFor, waveBonus, waveSummary, hpScale, ENEMY_TYPES, SPEED_STEPS, MAX_SUBSTEP, isBoss, NECRO_WAVE } from '../src/config.js';

import { run, freeTileNearPath, mockCtx, recordEnemy, enemyExtent } from './helpers.js';

import { useAbility, abilityCooldownLeft } from '../src/game.js';
import { ABILITIES, WIDTH, HEIGHT, LEVEL_DAMAGE } from '../src/config.js';
import { LAVA } from '../src/config.js';
import { sellValue } from '../src/game.js';
import { meteorLife } from '../src/game.js';
import { meteorDamage, meteorText, FX_STYLE } from '../src/config.js';
import { AUTO_WAVE_DELAY } from '../src/config.js';
import { createSoundTracker, detectStateEvents } from '../src/sound-events.js';
import { rankedSpots } from './balance/sim.js';

test('Pfad: Länge und Positionen', () => {
  const path = buildPath([[0, 0], [3, 0], [3, 2]], 10);
  assert.equal(path.length, 50);
  assert.deepEqual(pointAt(path, 0), { x: 5, y: 5 });
  assert.deepEqual(pointAt(path, 30), { x: 35, y: 5 });
  assert.deepEqual(pointAt(path, 40), { x: 35, y: 15 });
  assert.deepEqual(pointAt(path, 999), { x: 35, y: 25 });
});

test('Pfad: Kacheln werden lückenlos erkannt', () => {
  const tiles = pathTiles([[0, 0], [2, 0], [2, 2]]);
  assert.deepEqual([...tiles].sort(), ['0,0', '1,0', '2,0', '2,1', '2,2']);
});

test('Neues Spiel hat Startwerte', () => {
  const s = createGame();
  assert.equal(s.gold, START_GOLD);
  assert.equal(s.lives, START_LIVES);
  assert.equal(s.wave, 0);
  assert.equal(s.status, 'playing');
});

test('Bauen: auf dem Weg verboten', () => {
  const s = createGame();
  const [c, r] = WAYPOINTS[1];
  const res = buildTower(s, 'arrow', c, r);
  assert.equal(res.ok, false);
  assert.equal(s.gold, START_GOLD);
});

test('Bauen: kostet Gold, kein Doppelbau, kein Bau ohne Gold', () => {
  const s = createGame();
  assert.ok(buildTower(s, 'arrow', 0, 0).ok);
  assert.equal(s.gold, START_GOLD - TOWER_TYPES.arrow.cost);
  assert.equal(buildTower(s, 'arrow', 0, 0).ok, false);
  s.gold = 10;
  assert.equal(buildTower(s, 'sniper', 2, 0).reason, 'Nicht genug Gold'); // B-104: [1,0] ist seitdem Fluss
});

test('Bauen: außerhalb des Felds verboten', () => {
  const s = createGame();
  assert.equal(buildTower(s, 'arrow', -1, 0).ok, false);
  assert.equal(buildTower(s, 'arrow', 20, 0).ok, false);
});

test('Verbessern erhöht Werte bis zur Maximalstufe', () => {
  const s = createGame({ gold: 10000 });
  const { tower } = buildTower(s, 'arrow', 0, 0);
  const before = towerStats(tower).damage;
  assert.ok(upgradeTower(s, tower.id).ok);
  assert.equal(tower.level, 2);
  assert.ok(towerStats(tower).damage > before);
  assert.ok(upgradeTower(s, tower.id).ok);
  assert.equal(upgradeCost(tower), null);
  assert.equal(upgradeTower(s, tower.id).ok, false);
});

test('Verkaufen erstattet 70 % der Investition', () => {
  const s = createGame();
  const { tower } = buildTower(s, 'cannon', 0, 0);
  const goldAfterBuild = s.gold;
  const res = sellTower(s, tower.id);
  assert.equal(res.value, Math.floor(TOWER_TYPES.cannon.cost * 0.7));
  assert.equal(s.gold, goldAfterBuild + res.value);
  assert.equal(s.towers.length, 0);
});

test('Welle starten spawnt Gegner über die Zeit', () => {
  const s = createGame();
  assert.ok(startWave(s).ok);
  // B-005: Ein zweiter Start während der Welle ist jetzt erlaubt (vorzeitiger Wellenstart, eigene Tests unten)
  run(s, 0.1);
  assert.equal(s.enemies.length, 1);
  run(s, 3);
  assert.ok(s.enemies.length > 1);
});

test('Gegner am Ziel kosten Leben, bei 0 Leben verloren', () => {
  const s = createGame({ lives: 2 });
  spawnEnemy(s, 'tank', 1); // tank kostet 2 Leben
  run(s, 120);
  assert.equal(s.lives, 0);
  assert.equal(s.status, 'lost');
});

test('Türme töten Gegner und geben Gold', () => {
  const s = createGame({ gold: 1000 });
  const [c, r] = freeTileNearPath(s);
  buildTower(s, 'sniper', c, r);
  buildTower(s, 'arrow', c + 1, r);
  const goldBefore = s.gold;
  spawnEnemy(s, 'grunt', 1);
  run(s, 60);
  assert.equal(s.kills, 1);
  assert.ok(s.gold > goldBefore);
  assert.equal(s.lives, START_LIVES);
});

test('Frostturm verlangsamt Gegner', () => {
  const s = createGame({ gold: 1000 });
  const [c, r] = freeTileNearPath(s);
  buildTower(s, 'frost', c, r);
  const enemy = spawnEnemy(s, 'boss', 1);
  // so lange laufen lassen, bis der Gegner getroffen wurde
  for (let i = 0; i < 60 * 60 && enemy.slowUntil === 0; i++) update(s, 1 / 60);
  assert.ok(enemy.slowUntil > s.time, 'Gegner sollte verlangsamt sein');
  assert.equal(enemy.slowFactor, 0.5);
});

test('Kanone macht Flächenschaden', () => {
  const s = createGame({ gold: 1000 });
  const [c, r] = freeTileNearPath(s);
  buildTower(s, 'cannon', c, r);
  const a = spawnEnemy(s, 'tank', 1);
  const b = spawnEnemy(s, 'tank', 1);
  b.dist = -5; // knapp hinter a
  run(s, 30);
  assert.ok(a.hp < a.maxHp && b.hp < b.maxHp, 'beide sollten Schaden haben');
});

test('Welle endet mit Bonus-Gold', () => {
  const s = createGame();
  startWave(s);
  s.spawnQueue = [];
  const gold = s.gold;
  update(s, 0.016);
  assert.equal(s.waveActive, false);
  assert.equal(s.gold, gold + waveBonus(1));
});

test('Letzte Welle geschafft -> gewonnen', () => {
  const s = createGame({ wave: MAX_WAVES - 1 });
  startWave(s);
  s.spawnQueue = [];
  update(s, 0.016);
  assert.equal(s.status, 'won');
  assert.equal(startWave(s).ok, false);
});

test('Wellen: jede 5. Welle hat einen Boss, Wellen werden größer', () => {
  for (let w = 1; w <= MAX_WAVES; w++) {
    const hasBoss = waveFor(w).some((e) => isBoss(e));
    assert.equal(hasBoss, w % 5 === 0, `Welle ${w}`);
    // B-127: Wellen 5, 10, 20 Oger-König, Welle 15 Nekromantin; letzte Welle (20) zusätzlich Nekromantin
    assert.equal(waveFor(w).some((e) => e.type === 'boss'), w % 5 === 0 && w !== NECRO_WAVE, `Oger-König Welle ${w}`);
    assert.equal(waveFor(w).some((e) => e.type === 'necro'), w === NECRO_WAVE || w === MAX_WAVES, `Nekromantin Welle ${w}`);
  }
  assert.ok(waveFor(10).length > waveFor(1).length);
});

test('B-171: waveFor enthält die neuen Gegner erst ab ihrer Startwelle, Wellen 1-5 unverändert', async () => {
  const { NEW_ENEMY_WAVES, newEnemyCount } = await import('../src/config.js');
  const starts = { bat: 6, ember: 8, wisp: 10, beetle: 11 };
  for (const [type, from] of Object.entries(starts)) {
    assert.equal(NEW_ENEMY_WAVES[type].from, from, type);
    for (let w = 1; w <= MAX_WAVES; w++) {
      const n = waveFor(w).filter((e) => e.type === type).length;
      assert.equal(n > 0, w >= from, `${type} Welle ${w}`);
      assert.equal(n, newEnemyCount(type, w), `${type} Welle ${w}: Anzahl`);
    }
  }
  for (let w = 1; w <= 5; w++) assert.ok(waveFor(w).every((e) => !(e.type in starts)), `Welle ${w}`);
  // Panzerkäfer 3 bis 5, mitten in der Troll-Gruppe (nach dem ersten Troll, vor dem letzten)
  for (let w = 11; w <= MAX_WAVES; w++) {
    const list = waveFor(w);
    const beetles = list.filter((e) => e.type === 'beetle');
    assert.ok(beetles.length >= 3 && beetles.length <= 5, `Welle ${w}: ${beetles.length} Käfer`);
    const tanks = list.filter((e) => e.type === 'tank').map((e) => e.at);
    assert.ok(beetles.every((b) => b.at > tanks[0] && b.at < tanks[tanks.length - 1]), `Welle ${w}: Käfer bei den Trollen`);
    assert.ok(list.every((e, i) => i === 0 || list[i - 1].at <= e.at), `Welle ${w}: sortiert`);
  }
  // Irrlichter mit großen Abständen
  const wisps = waveFor(20).filter((e) => e.type === 'wisp');
  for (let i = 1; i < wisps.length; i++) assert.ok(wisps[i].at - wisps[i - 1].at >= 1.5 - 1e-9);
});

test('B-171: Karten-Faktor newEnemyScale: Zwei Fronten ohne Panzerkäfer, Spiel und Vorschau nutzen die Karte', () => {
  assert.ok(waveSummary(12).beetle >= 3);
  assert.equal(waveSummary(12, 'twin').beetle, undefined);
  assert.equal(waveSummary(12, 'twin').bat, waveSummary(12).bat);
  assert.deepEqual(waveFor(12, 'meadow'), waveFor(12));
  const s = createGame({ mapId: 'twin' });
  s.wave = 11;
  startWave(s);
  assert.equal(s.spawnQueue.length, waveFor(12, 'twin').length);
  assert.ok(s.spawnQueue.every((e) => e.type !== 'beetle'));
});

test('waveSummary: Anzahl pro Gegnertyp für Welle 1, 5 und 10', () => {
  assert.deepEqual(waveSummary(1), { grunt: 9 });
  assert.deepEqual(waveSummary(5), { grunt: 21, runner: 13, tank: 3, boss: 1 });
  assert.deepEqual(waveSummary(10), { grunt: 36, runner: 23, tank: 6, shielded: 1, mage: 1, healer: 1, boss: 2, bat: 4, ember: 2, wisp: 1 }); // 27.11.: mehr Fledermäuse (Entscheidung des Menschen)
  assert.equal(NECRO_WAVE, 15);
  assert.equal(waveSummary(15).necro, 2, 'B-127: Nekromantin in Welle 15 (gleiche Anzahl wie der Oger-König)');
  assert.equal(waveSummary(15).boss, undefined);
  for (const w of [1, 5, 10]) {
    const total = Object.values(waveSummary(w)).reduce((a, b) => a + b, 0);
    assert.equal(total, waveFor(w).length, `Welle ${w}`);
  }
});

test('Spawn-Zeiten sind aufsteigend sortiert', () => {
  for (let w = 1; w <= MAX_WAVES; w++) {
    const list = waveFor(w);
    for (let i = 1; i < list.length; i++) assert.ok(list[i].at >= list[i - 1].at);
  }
});

test('Balancing-Smoke: Welle 1 ist mit Startgold schaffbar', () => {
  const s = createGame();
  // Innenecken der ersten Kurve: dort sieht ein Turm zwei Wegstücke
  assert.ok(buildTower(s, 'arrow', 4, 3).ok);
  assert.ok(buildTower(s, 'arrow', 6, 7).ok);
  startWave(s);
  for (let k = 0; k < 90 * 60 && s.waveActive; k++) update(s, 1 / 60); // B-121: bis Wellenende (sonst startet Welle 2 automatisch)
  assert.equal(s.waveActive, false);
  assert.equal(s.lives, START_LIVES);
  assert.ok(TILE > 0);
});

test('waveSummary: Summe entspricht waveFor für alle Wellen, Boss nur jede 5. Welle', () => {
  for (let w = 1; w <= MAX_WAVES; w++) {
    const s = waveSummary(w);
    assert.equal(Object.values(s).reduce((a, b) => a + b, 0), waveFor(w).length, `Welle ${w}`);
    assert.equal('boss' in s, w % 5 === 0 && w !== NECRO_WAVE, `Boss in Welle ${w}`);
    assert.equal('necro' in s, w === NECRO_WAVE || w === MAX_WAVES, `Nekromantin in Welle ${w}`);
  }
});

test('waveSummary: liefert jedes Mal ein neues Objekt (keine geteilte Mutation)', () => {
  const a = waveSummary(3);
  a.grunt = 999;
  assert.notEqual(waveSummary(3).grunt, 999);
});

test('Schwierigkeit: hpScale steigt streng, Wellen werden nie kleiner', () => {
  for (let w = 2; w <= MAX_WAVES; w++) {
    assert.ok(hpScale(w) > hpScale(w - 1), `hpScale Welle ${w}`);
    assert.ok(waveFor(w).length >= waveFor(w - 1).length, `Gegneranzahl Welle ${w}`);
  }
});

test('Schwierigkeit: hpScale(1) == 1, Faktor pro Welle wächst bis Welle 10 und flacht danach ab', () => {
  assert.equal(hpScale(1), 1);
  const f = (w) => hpScale(w) / hpScale(w - 1);
  assert.ok(f(5) > 1, 'Welle 5 zäher als 4');
  assert.ok(f(10) > f(5), 'mittlere Wellen steiler als frühe');
  assert.ok(f(11) > 1 && f(11) < f(10), 'späte Wellen flacher als die Mitte, aber weiter steigend'); // 27.11.: Vergleich mit der Mitte statt mit früh (Entscheidung des Menschen)
  for (let w = 1; w <= MAX_WAVES; w++) assert.ok(Number.isFinite(hpScale(w)) && hpScale(w) >= 1);
});

test('Schwierigkeit: Spawn-Zeiten aufsteigend und endlich, Wellen nicht leer, Boss in Welle 20', () => {
  for (let w = 1; w <= MAX_WAVES; w++) {
    const list = waveFor(w);
    assert.ok(list.length > 0, `Welle ${w} leer`);
    for (let i = 1; i < list.length; i++) assert.ok(list[i].at >= list[i - 1].at, `Welle ${w} Index ${i}`);
    assert.ok(list.every((e) => Number.isFinite(e.at) && e.at >= 0));
  }
  assert.ok(waveFor(20).some((e) => e.type === 'boss'));
});

test('Schwierigkeit: Wellenbonus steigt monoton, Startgold reicht für Kanone plus Pfeilturm', () => {
  for (let w = 2; w <= MAX_WAVES; w++) assert.ok(waveBonus(w) > waveBonus(w - 1), `Wellenbonus Welle ${w}`);
  assert.ok(START_GOLD >= TOWER_TYPES.cannon.cost + TOWER_TYPES.arrow.cost);
});

// --- Tester-Ergänzungen (Runde 2): Robustheit gegen den Zeitschritt ---

test('Schwierigkeit: Boss-Wellen sind effektiv nicht schwächer als vor B-008 (HP * hpScale)', () => {
  const OLD_BOSS_HP = 900;
  const oldScale = (w) => Math.pow(1.13, w - 1);
  for (const w of [5, 10, 15, 20]) {
    const neu = ENEMY_TYPES.boss.hp * hpScale(w);
    assert.ok(neu >= OLD_BOSS_HP * oldScale(w), `Welle ${w}: Boss effektiv ${Math.round(neu)} HP < alt ${Math.round(OLD_BOSS_HP * oldScale(w))}`);
  }
});

// --- Gebündelte Strategie-Simulationen (B-013) ---
// Jede Kombination aus Strategie und Zeitschritt wird nur einmal simuliert; alle Tests lesen das Ergebnis aus dem Cache.

// B-013: Schildträger zwingt zu gemischten Setups. Die Strategien ohne Kanonen sterben schon vor Welle 9
// (siehe Test "nur Pfeiltürme"), also wird hier nur die Schildträger-Gruppe der Wellen 11-14 isoliert (B-046: in 9-12 leckt mit den stärkeren Fähigkeiten keiner der beiden Aufbauten mehr) gegen zwei
// Aufbauten mit gleich vielen Türmen (je 6, Stufe 2, gleiche Plätze) gespielt, die sich nur durch Kanonen unterscheiden.
function shieldedTrial(types, wave, dt) {
  const s = createGame({ gold: 1e9, wave: wave - 1 });
  const spots = rankedSpots(s, TOWER_TYPES.cannon.range);
  types.forEach((type, i) => {
    buildTower(s, type, spots[i].c, spots[i].r);
    upgradeTower(s, s.towers[s.towers.length - 1].id);
  });
  startWave(s);
  s.spawnQueue = s.spawnQueue.filter((e) => e.type === 'shielded');
  const livesBefore = s.lives;
  let furthest = 0;
  for (let k = 0; k < Math.round(600 / dt) && s.waveActive; k++) {
    update(s, dt);
    for (const e of s.enemies) if (e.dist > furthest) furthest = e.dist;
  }
  return { progress: furthest / s.path.length, lost: livesBefore - s.lives };
}

// Mindestvorsprung ohne Kanonen (Kanonen-Reichweite 3,4: gemessen min. 0,03 in Welle 9; vorher 0,05).
const SHIELD_MARGIN = 0.02;
test('Schildträger: ohne Kanonen kommen sie in den Wellen 11-14 weiter und kosten mehr Leben als mit Kanonen (Wellen 11-14)', () => {
  const noCannon = ['arrow', 'arrow', 'frost', 'arrow', 'arrow', 'frost'];
  const withCannon = ['arrow', 'cannon', 'frost', 'arrow', 'cannon', 'frost'];
  for (const dt of [1 / 30, 1 / 60]) {
    let lostNo = 0;
    let lostWith = 0;
    for (const wave of [11, 12, 13, 14]) {
      assert.ok(waveSummary(wave).shielded >= 1, `Welle ${wave} hat Schildträger`);
      const a = shieldedTrial(noCannon, wave, dt);
      const b = shieldedTrial(withCannon, wave, dt);
      assert.ok(a.progress >= b.progress + SHIELD_MARGIN, `Welle ${wave} dt=${dt}: ohne Kanonen ${a.progress.toFixed(2)}, mit ${b.progress.toFixed(2)}`);
      assert.ok(a.lost >= b.lost, `Welle ${wave} dt=${dt}: Leben ohne Kanonen ${a.lost}, mit ${b.lost}`);
      lostNo += a.lost;
      lostWith += b.lost;
    }
    assert.ok(lostNo > lostWith, `dt=${dt}: verlorene Leben ohne Kanonen ${lostNo}, mit ${lostWith}`);
  }
});

test('Schildträger: stärker als vor B-013 (mehr HP, ab Welle 11 mindestens zwei pro Welle)', () => {
  assert.ok(ENEMY_TYPES.shielded.hp > 60);
  assert.ok(waveSummary(11).shielded >= 2);
  assert.ok(waveSummary(20).shielded > waveSummary(15).shielded);
});

test('Healer: ab Welle 14 spawnen sie mitten in der Troll-Gruppe, Trolle und Flitzer nehmen in der Spätphase zu', () => {
  for (let w = 14; w <= MAX_WAVES; w++) {
    const list = waveFor(w);
    const tanks = list.filter((e) => e.type === 'tank');
    const healers = list.filter((e) => e.type === 'healer');
    assert.ok(healers.length >= 2, `Welle ${w}: Healer`);
    for (const h of healers) {
      assert.ok(h.at > tanks[0].at && h.at < tanks[tanks.length - 1].at, `Welle ${w}: Healer bei ${h.at} nicht in der Troll-Gruppe`);
    }
    for (let i = 1; i < list.length; i++) assert.ok(list[i].at >= list[i - 1].at, `Welle ${w} Index ${i}`);
  }
  for (let w = 15; w <= MAX_WAVES; w++) {
    assert.ok(waveSummary(w).tank > waveSummary(w - 1).tank, `Trolle Welle ${w}`);
    assert.ok(waveSummary(w).runner - waveSummary(w - 1).runner > 2, `Flitzer Welle ${w}`);
  }
  // Wellen vor der Spätphase behalten den Healer als letzte Gruppe nach den Schildträgern/Trollen
  const early = waveFor(10);
  assert.equal(early[early.length - 1].type, 'boss');
});

// --- B-019 / 10 Leben: Start-Leben und Verlust bei 0 Leben ---

test('B-019: START_LIVES ist 10, ein durchgelassener Boss kostet 6 Leben, bei 0 ist das Spiel verloren (nicht negativ)', () => {
  assert.equal(START_LIVES, 10);
  const s = createGame();
  assert.equal(s.lives, 10);
  spawnEnemy(s, 'boss', 1);
  run(s, 600);
  assert.equal(s.lives, 4);
  assert.equal(s.status, 'playing');
  const t = createGame({ lives: 2 });
  spawnEnemy(t, 'boss', 1); // Boss kostet 6 Leben, mehr als vorhanden
  run(t, 600);
  assert.equal(t.status, 'lost');
  assert.equal(t.lives, 0);
});

// ---------- B-006: Heiler und Schildträger ----------

function mkEnemy(state, type, dist, over = {}) {
  const e = spawnEnemy(state, type, 1);
  e.dist = dist; // Position ergibt sich aus dem Weg (erstes Segment: gerade, y = 100)
  e.speed = 0; // bleibt stehen
  Object.assign(e, over);
  const p = pointAt(state.path, dist);
  e.x = p.x;
  e.y = p.y;
  return e;
}
const HEAL = ENEMY_TYPES.healer;

const MAGE = ENEMY_TYPES.mage;

test('B-126 Magier: Schild nach wardInterval, nur im Radius, nicht für sich selbst, kein Stapeln', () => {
  const s = createGame();
  const m = mkEnemy(s, 'mage', 100);
  const near = mkEnemy(s, 'tank', 100 + (MAGE.wardRadius - 0.5) * TILE);
  const far = mkEnemy(s, 'tank', 100 + (MAGE.wardRadius + 0.5) * TILE);
  mkEnemy(s, 'mage', 100 + 0.2 * TILE); // zweiter Magier: Schilde stapeln nicht
  update(s, MAGE.wardInterval - 0.1);
  assert.equal(near.ward, 0, 'vor dem Zauber kein Schild');
  update(s, 0.2);
  assert.ok(Math.abs(near.ward - MAGE.wardShare * near.maxHp) < 1e-9, 'Schild = wardShare * maxHp');
  assert.equal(far.ward, 0, 'außerhalb kein Schild');
  assert.ok(m.ward <= MAGE.wardShare * m.maxHp, 'kein Stapeln beim Magier');
  const solo = createGame();
  const alone = mkEnemy(solo, 'mage', 100);
  update(solo, MAGE.wardInterval + 0.1);
  assert.equal(alone.ward, 0, 'Magier schützt sich nicht selbst');
  update(s, MAGE.wardInterval);
  assert.ok(Math.abs(near.ward - MAGE.wardShare * near.maxHp) < 1e-9, 'neuer Zauber füllt nur auf');
});

test('B-126 Magier: Schild schluckt Schaden bis zur Grenze, Rest auf HP; Rüstung zuerst; auch gegen Splash', () => {
  const s = createGame();
  const e = mkEnemy(s, 'grunt', 240, { hp: 100, maxHp: 100, ward: 10 });
  s.projectiles.push({ x: e.x, y: e.y, targetId: e.id, speed: 1e6, damage: 25, splash: 0 });
  update(s, 1 / 60);
  assert.equal(e.ward, 0);
  assert.equal(e.hp, 85, 'Rest geht auf HP');
  const a = createGame();
  const sh = mkEnemy(a, 'shielded', 240, { hp: 100, maxHp: 100, ward: 30 });
  a.projectiles.push({ x: sh.x, y: sh.y, targetId: sh.id, speed: 1e6, damage: 20, splash: 0 });
  update(a, 1 / 60);
  assert.equal(sh.hp, 100, 'Rüstung halbiert, Schild schluckt den Rest');
  assert.ok(Math.abs(sh.ward - (30 - 20 * (1 - ENEMY_TYPES.shielded.armor))) < 1e-9);
  const b = createGame();
  const g = mkEnemy(b, 'grunt', 240, { hp: 100, maxHp: 100, ward: 5 });
  b.projectiles.push({ x: g.x, y: g.y, targetId: g.id, speed: 1e6, damage: 12, splash: 40 });
  update(b, 1 / 60);
  assert.equal(g.ward, 0, 'Splash trifft zuerst den Schild');
  assert.equal(g.hp, 93);
});

test('B-126 Magier: Wellenplan ab Welle 8 mit 1 + floor((w-8)/4) Magiern, feste Seite wie Schamane', () => {
  for (let w = 1; w <= MAX_WAVES; w++) {
    assert.equal(waveSummary(w).mage || 0, w >= 8 ? 1 + Math.floor((w - 8) / 4) : 0, `Welle ${w}`);
  }
  for (const id of Object.keys(MAPS)) if (MAPS[id].lanes) assert.equal(MAPS[id].lanes.mage, MAPS[id].lanes.healer, id);
  assert.equal(spawnEnemy(createGame(), 'mage').ward, 0);
});

test('B-006 Heilung: Healer heilt verletzten Nachbarn im Radius, aber keinen außerhalb', () => {
  const s = createGame();
  const h = mkEnemy(s, 'healer', 100);
  const near = mkEnemy(s, 'tank', 100 + (HEAL.healRadius - 0.5) * TILE);
  const far = mkEnemy(s, 'tank', 100 + (HEAL.healRadius + 0.5) * TILE);
  near.hp = far.hp = 100;
  update(s, HEAL.healInterval + 0.01);
  assert.ok(near.hp > 100, 'Nachbar geheilt');
  assert.equal(far.hp, 100, 'außerhalb nicht geheilt');
  assert.ok(Math.abs(near.hp - (100 + near.maxHp * HEAL.healPerSec * HEAL.healInterval)) < 1e-9);
  assert.ok(h.hp === h.maxHp);
});

test('B-006 Heilung: nie über maxHp, Healer heilt sich nicht selbst, nur alle healInterval Sekunden', () => {
  const s = createGame();
  const h = mkEnemy(s, 'healer', 100);
  const g = mkEnemy(s, 'tank', 110);
  h.hp = 1;
  g.hp = g.maxHp - 1;
  update(s, 0.5);
  assert.equal(g.hp, g.maxHp - 1, 'vor Ablauf des Intervalls keine Heilung');
  update(s, 0.6);
  assert.equal(g.hp, g.maxHp, 'gedeckelt auf maxHp');
  assert.equal(h.hp, 1, 'Healer heilt sich nicht selbst');
  g.hp = 10;
  update(s, 0.3);
  assert.equal(g.hp, 10, 'zwischen zwei Impulsen keine Heilung');
  update(s, HEAL.healInterval);
  assert.ok(g.hp > 10);
});

test('B-006 Heilung: mehrere Healer stapeln nicht, tote Healer heilen nicht', () => {
  const one = createGame();
  mkEnemy(one, 'healer', 100);
  const t1 = mkEnemy(one, 'tank', 110, { hp: 100 });
  update(one, HEAL.healInterval + 0.01);
  const many = createGame();
  mkEnemy(many, 'healer', 100);
  mkEnemy(many, 'healer', 105);
  mkEnemy(many, 'healer', 95);
  const t3 = mkEnemy(many, 'tank', 110, { hp: 100 });
  update(many, HEAL.healInterval + 0.01);
  assert.ok(t1.hp > 100);
  assert.equal(t3.hp, t1.hp, 'drei Healer heilen nicht mehr als einer');
  const dead = createGame();
  mkEnemy(dead, 'healer', 100, { hp: 0 });
  const t = mkEnemy(dead, 'tank', 110, { hp: 100 });
  update(dead, HEAL.healInterval + 0.01);
  assert.equal(t.hp, 100, 'toter Healer heilt nicht');
});

test('B-006 Rüstung: Pfeilturm macht gegen Schildträger weniger Schaden, Kanone (Splash) voll', () => {
  const dmg = (towerType, enemyType) => {
    const s = createGame();
    s.gold = 1000;
    buildTower(s, towerType, 6, 3);
    const e = mkEnemy(s, enemyType, 240, { hp: 1000, maxHp: 1000 });
    e.slowUntil = 0;
    update(s, 0.001);
    for (let i = 0; i < 100 && e.hp === 1000; i++) update(s, 0.01);
    return 1000 - e.hp;
  };
  const arrowGrunt = dmg('arrow', 'grunt');
  const arrowShield = dmg('arrow', 'shielded');
  assert.ok(arrowGrunt > 0);
  assert.ok(Math.abs(arrowShield - arrowGrunt * (1 - ENEMY_TYPES.shielded.armor)) < 1e-9, `${arrowShield} vs ${arrowGrunt}`);
  const cannonGrunt = dmg('cannon', 'grunt');
  assert.equal(dmg('cannon', 'shielded'), cannonGrunt, 'Splash voll');
  assert.ok(cannonGrunt > 0);
});

test('B-006 Rüstung: Frostturm-Slow wirkt auch gegen Schildträger', () => {
  const s = createGame();
  buildTower(s, 'frost', 6, 3);
  const e = mkEnemy(s, 'shielded', 240, { hp: 1000, maxHp: 1000 });
  for (let i = 0; i < 100 && e.hp === 1000; i++) update(s, 0.01);
  assert.ok(e.hp < 1000 && e.slowFactor < 1 && s.time < e.slowUntil);
});

test('B-006 Wellen: Healer ab Welle 7, Schildträger ab Welle 9, Spawn-Zeiten aufsteigend', () => {
  assert.ok(!('healer' in waveSummary(6)));
  assert.ok(waveSummary(7).healer >= 1);
  assert.ok(!('shielded' in waveSummary(8)));
  assert.ok(waveSummary(9).shielded >= 1);
  for (let w = 1; w <= 6; w++) assert.ok(!('healer' in waveSummary(w)));
  for (let w = 1; w <= 8; w++) assert.ok(!('shielded' in waveSummary(w)));
  for (let w = 7; w <= MAX_WAVES; w++) assert.ok(waveSummary(w).healer >= 1, `Healer Welle ${w}`);
  for (let w = 1; w <= MAX_WAVES; w++) {
    const list = waveFor(w);
    for (let i = 1; i < list.length; i++) assert.ok(list[i].at >= list[i - 1].at, `Welle ${w}`);
  }
});

test('B-006 Config: neue Typen haben Heil-/Rüstungswerte, Schildträger-Rüstung zwischen 0 und 1', () => {
  assert.ok(HEAL.healRadius > 0 && HEAL.healPerSec > 0 && HEAL.healInterval > 0);
  const a = ENEMY_TYPES.shielded.armor;
  assert.ok(a > 0 && a < 1);
  assert.equal(spawnEnemy(createGame(), 'shielded').armor, a);
  assert.equal(spawnEnemy(createGame(), 'grunt').armor, 0);
});

test('B-006 Render: Healer/Schildträger zeichnen ausgewogen, innerhalb des Radius, Aura mit richtigem Radius', async () => {
  const { drawEnemy, drawHealAura } = await import('../src/render-enemies.js?b006');
  for (const type of ['healer', 'shielded']) {
    for (const time of [0, 0.7, 2.1]) {
      const r = await recordEnemy({ type, id: 5 }, time);
      assert.equal(r.depth, 0, `${type}: save/restore`);
      assert.equal(r.props.globalAlpha, undefined);
      // Stil 1: Figur in Goblin-Größe (Entwurf 46 x 50 px bei Kachel 57), Schatten-Ellipse großzügig mitgezählt
      const x = enemyExtent(r);
      assert.ok(x.w <= 1.1 && x.h <= 1.2, `${type}: Figur zu gross (${x.w.toFixed(2)} x ${x.h.toFixed(2)} Kacheln)`);
    }
  }
  const radiiOf = (type, time) => {
    const arcs = [];
    let alphaDepth = 0;
    const props = {};
    const ctx = new Proxy({}, {
      get(_, k) {
        if (k in props) return props[k];
        return (...a) => {
          if (k === 'arc') arcs.push(a[2]);
          if (k === 'save') alphaDepth++;
          if (k === 'restore') alphaDepth--;
        };
      },
      set(_, k, v) { props[k] = v; return true; },
    });
    drawHealAura(ctx, { type, x: 50, y: 50 }, time);
    assert.equal(alphaDepth, 0);
    assert.equal(props.globalAlpha, undefined);
    return arcs;
  };
  const arcs = radiiOf('healer', 1);
  assert.equal(arcs.length, 1);
  assert.ok(Math.abs(arcs[0] - HEAL.healRadius * TILE) <= HEAL.healRadius * TILE * 0.1, `Aura-Radius ${arcs[0]}`);
  assert.notEqual(radiiOf('healer', 0.3)[0], radiiOf('healer', 1.1)[0], 'pulsiert über time');
  assert.equal(radiiOf('grunt', 1).length, 0, 'nur Healer haben eine Aura');
  assert.equal(radiiOf('shielded', 1).length, 0);
  assert.equal(typeof drawEnemy, 'function');
});

test('B-006 Render: render() zeichnet Healer samt Aura, ausgewogen, Alpha unverändert', async () => {
  const { render } = await import('../src/render.js?b006');
  const s = createGame();
  s.enemies.push({ id: 1, type: 'healer', x: 100, y: 100, radius: 11, hp: 5, maxHp: 10, slowUntil: 0, slowFactor: 1, dist: 10, speed: 1 });
  s.enemies.push({ id: 2, type: 'shielded', x: 140, y: 100, radius: 13, hp: 5, maxHp: 10, slowUntil: 99, slowFactor: 0.5, dist: 20, speed: 1 });
  const m = mockCtx();
  render(m.ctx, s, {});
  assert.equal(m.depth, 0);
  assert.equal(m.props.globalAlpha, undefined);
});

// --- B-006 Randfälle (vom Tester, hierher verschoben) ---

test('B-006 Edge: createGame mit overrides behält healAt/healTick, Spawn ohne armor hat armor 0', () => {
  const s = createGame({ lives: 2, gold: 7 });
  assert.equal(s.lives, 2);
  assert.equal(s.gold, 7);
  assert.equal(s.healTick, 0);
  assert.ok(s.healAt > 0);
  assert.equal(spawnEnemy(s, 'grunt').armor, 0);
  assert.equal(spawnEnemy(s, 'shielded').armor, 0.5);
});

test('B-006 Edge: dt 0 heilt nicht, grosser Zeitsprung heilt nur einmal (kein Aufholen)', () => {
  const s = createGame();
  const h = spawnEnemy(s, 'healer');
  const g = spawnEnemy(s, 'grunt');
  g.x = h.x; g.y = h.y; g.hp = 10;
  update(s, 0);
  assert.equal(g.hp, 10);
  s.time = 50; // Zeitsprung
  update(s, 1 / 60);
  const after = g.hp;
  assert.ok(after > 10 && after <= 10 + g.maxHp * 0.02 + 1e-9);
  update(s, 1 / 60);
  assert.equal(g.hp, after);
});

// Tester (B-013): Struktur aller Wellen 1-20 (aufsteigende Zeiten, keine NaN/negativen Werte, Einsatz der Gegnertypen)
test('waveFor: Wellen 1-20 sind geordnet und endlich, Heiler ab 7, Schildträger ab 9, Gegnermenge wächst monoton', () => {
  let prev = 0;
  for (let w = 1; w <= MAX_WAVES; w++) {
    const list = waveFor(w);
    list.forEach((e, i) => {
      assert.ok(Number.isFinite(e.at) && e.at >= 0, `Welle ${w} Index ${i}: at=${e.at}`);
      if (i > 0) assert.ok(e.at >= list[i - 1].at, `Welle ${w} Index ${i} nicht aufsteigend`);
    });
    assert.equal(list.some((e) => e.type === 'healer'), w >= 7, `Welle ${w}: Healer`);
    assert.equal(list.some((e) => e.type === 'shielded'), w >= 9, `Welle ${w}: Schildträger`);
    assert.ok(list.length > prev, `Welle ${w}: Gegnermenge ${list.length} <= ${prev}`);
    prev = list.length;
  }
});

test('Pause: update ändert den Zustand nicht', () => {
  const s = createGame();
  buildTower(s, 'arrow', ...freeTileNearPath(s));
  startWave(s);
  run(s, 3);
  togglePause(s);
  assert.equal(s.paused, true);
  const before = JSON.stringify({ ...s, path: null, blocked: null });
  run(s, 10);
  assert.equal(JSON.stringify({ ...s, path: null, blocked: null }), before);
});

test('Pause: erneutes Umschalten setzt das Spiel fort', () => {
  const s = createGame();
  startWave(s);
  togglePause(s);
  run(s, 1);
  assert.equal(s.time, 0);
  togglePause(s);
  run(s, 1);
  assert.ok(s.time > 0.9);
});

test('Pause: Bauen bleibt erlaubt', () => {
  const s = createGame();
  togglePause(s);
  const [col, row] = freeTileNearPath(s);
  assert.equal(buildTower(s, 'arrow', col, row).ok, true);
  assert.equal(s.towers.length, 1);
});

test('Pause: nicht nach Spielende umschaltbar', () => {
  const s = createGame({ status: 'lost' });
  togglePause(s);
  assert.equal(s.paused, false);
});

// ---------- B-003: Spielgeschwindigkeit ----------
function speedScenario() {
  const s = createGame();
  buildTower(s, 'arrow', ...freeTileNearPath(s));
  s.gold = 1000;
  startWave(s);
  return s;
}

test('SPEED_STEPS enthält x1, x2, x3', () => {
  assert.deepEqual(SPEED_STEPS, [1, 2, 3]);
});

test('stepGame: x2 über 5 s entspricht x1 über 10 s (dt=0.05)', () => {
  const a = speedScenario(), b = speedScenario();
  for (let i = 0; i < 200; i++) stepGame(a, 0.05, 1);
  for (let i = 0; i < 100; i++) stepGame(b, 0.05, 2);
  assert.ok(Math.abs(a.time - 10) < 1e-6 && Math.abs(b.time - 10) < 1e-6);
  assert.ok(a.kills > 0, 'Szenario muss Kills enthalten');
  assert.equal(b.gold, a.gold);
  assert.equal(b.kills, a.kills);
  assert.equal(b.lives, a.lives);
});

test('stepGame: x3 und große dt werden in Teilschritte von höchstens MAX_SUBSTEP zerlegt', () => {
  const s = createGame();
  startWave(s);
  let prev = s.time;
  stepGame(s, 0.05, 3);
  assert.ok(Math.abs(s.time - prev - 0.15) < 1e-9);
  prev = s.time;
  stepGame(s, 1, 1);
  assert.ok(Math.abs(s.time - prev - 1) < 1e-9);
  assert.ok(MAX_SUBSTEP <= 0.05);
});

test('stepGame: dt=1/60 ergibt bei x1 (10 s) und x2 (5 s) gleiche Zeit und Ergebnis', () => {
  const a = speedScenario(), b = speedScenario();
  const frames = 600;
  for (let i = 0; i < frames; i++) stepGame(a, 1 / 60, 1);
  for (let i = 0; i < frames / 2; i++) stepGame(b, 1 / 60, 2);
  assert.ok(Math.abs(a.time - b.time) < 1e-6);
  assert.equal(b.kills, a.kills);
  assert.equal(b.lives, a.lives);
  assert.equal(b.gold, a.gold);
});

// x1 mit dt=1/30 (Gesamt 1/30 s -> 1 Teilschritt) und x2 mit dt=1/60 (Gesamt 1/30 s -> 1 Teilschritt):
// beide rechnen mit identischen Teilschritten von 1/30 s, also muss das Ergebnis exakt gleich sein.
test('stepGame: x1 mit dt=1/30 und x2 mit dt=1/60 ergeben bei gleicher Teilschrittfolge gleiche Zeit und Ergebnis', () => {
  const a = speedScenario(), b = speedScenario();
  const frames = 300;
  for (let i = 0; i < frames; i++) stepGame(a, 1 / 30, 1);
  for (let i = 0; i < frames; i++) stepGame(b, 1 / 60, 2);
  assert.ok(Math.abs(a.time - b.time) < 1e-6);
  assert.ok(a.time > 9.9);
  assert.equal(b.kills, a.kills);
  assert.equal(b.lives, a.lives);
  assert.equal(b.gold, a.gold);
});

test('stepGame: nicht endliches dt*speed (Infinity, NaN) ändert nichts und hängt nicht', () => {
  const s = speedScenario();
  const before = { time: s.time, kills: s.kills, lives: s.lives, gold: s.gold };
  stepGame(s, Infinity, 1);
  stepGame(s, 1 / 60, Infinity);
  stepGame(s, NaN, 1);
  stepGame(s, 1 / 60, NaN);
  assert.deepEqual({ time: s.time, kills: s.kills, lives: s.lives, gold: s.gold }, before);
});

// B-004: Zielmodus pro Turm
test('Zielmodus: neue Türme starten mit first, setTargetMode lehnt unbekannte Modi ab', () => {
  const s = createGame();
  const { tower } = buildTower(s, 'arrow', 0, 0);
  assert.equal(tower.targetMode, 'first');
  assert.deepEqual(TARGET_MODES, ['first', 'last', 'strong', 'close']);
  assert.equal(setTargetMode(s, tower.id, 'strong').ok, true);
  assert.equal(tower.targetMode, 'strong');
  const bad = setTargetMode(s, tower.id, 'foo');
  assert.equal(bad.ok, false);
  assert.ok(bad.reason.length > 0);
  assert.equal(tower.targetMode, 'strong');
});

test('Zielmodus: pickTarget wählt je Modus den erwarteten Gegner', () => {
  const tower = { x: 0, y: 0 };
  const a = { x: 10, y: 0, dist: 100, hp: 20 };
  const b = { x: 50, y: 0, dist: 300, hp: 10 };
  const c = { x: 30, y: 0, dist: 200, hp: 90 };
  const out = { x: 500, y: 0, dist: 999, hp: 999 };
  const list = [a, b, c, out];
  assert.equal(pickTarget(list, tower, 100, 'first'), b);
  assert.equal(pickTarget(list, tower, 100, 'last'), a);
  assert.equal(pickTarget(list, tower, 100, 'strong'), c);
  assert.equal(pickTarget(list, tower, 100, 'close'), a);
  assert.equal(pickTarget([out], tower, 100, 'first'), null);
});

test('Zielmodus Edge: hp<=0, Gleichstand, Reichweitenrand, fehlender Modus, Moduswechsel, Kanone/Frost', () => {
  const tower = { x: 0, y: 0 };
  const dead = { x: 1, y: 0, dist: 999, hp: 0 };
  const a = { x: 10, y: 0, dist: 100, hp: 50 };
  const b = { x: 10, y: 0, dist: 100, hp: 50 };
  for (const m of TARGET_MODES) {
    assert.equal(pickTarget([dead, a, b], tower, 100, m), a, `Gleichstand ${m}`);
    assert.equal(pickTarget([dead], tower, 100, m), null);
  }
  const edge = { x: 100, y: 0, dist: 5, hp: 5 };
  assert.equal(pickTarget([edge], tower, 100, 'first'), edge);
  assert.equal(pickTarget([edge], tower, 99.9, 'first'), null);
  assert.equal(pickTarget([a, edge], tower), a); // Standard first
  assert.equal(pickTarget([a, edge], tower, 100, undefined), a);

  // Turm ohne targetMode-Feld verhält sich wie first; Moduswechsel wirkt sofort; alle Turmtypen
  for (const type of Object.keys(TOWER_TYPES)) {
    const s = createGame();
    s.gold = 9999; const r = buildTower(s, type, 0, 0); assert.ok(r.ok, r.reason); const t = r.tower;
    delete t.targetMode;
    const near = spawnEnemy(s, 'grunt'); const far = spawnEnemy(s, 'grunt');
    const pp = pointAt(s.path, 300); t.x = pp.x; t.y = pp.y;
    near.dist = 302; far.dist = 340;
    t.cooldown = 0; update(s, 0.001);
    // Blitzturm hat kein Projektil: erstes Ziel ist der erste Punkt nach dem Turm im Blitz-Effekt
    const picked = () => {
      if (type !== 'lightning') return s.projectiles.at(-1)?.targetId;
      const p1 = s.effects.filter((f) => f.kind === 'bolt').at(-1).points[1];
      return [near, far].find((e) => e.x === p1.x && e.y === p1.y).id;
    };
    assert.equal(picked(), far.id, `${type} ohne Feld = first`);
    setTargetMode(s, t.id, 'close');
    t.cooldown = 0; update(s, 0.001);
    assert.equal(picked(), near.id, `${type} close`);
  }
});

test('Zielmodus Edge: strong ignoriert Rüstung, setTargetMode mit unbekannter id', () => {
  const tower = { x: 0, y: 0 };
  const armored = { x: 5, y: 0, dist: 1, hp: 30, armor: 0.9 };
  const plain = { x: 5, y: 0, dist: 2, hp: 20, armor: 0 };
  assert.equal(pickTarget([plain, armored], tower, 50, 'strong'), armored);
  const s = createGame();
  assert.equal(setTargetMode(s, 9999, 'first').ok, false);
});

test('livesText: gefüllte und leere Herzen, nie negativ, gekappt', () => {
  assert.equal(livesText(3, 3), '❤️❤️❤️');
  assert.equal(livesText(1, 3), '❤️🖤🖤');
  assert.equal(livesText(0, 3), '🖤🖤🖤');
  assert.equal(livesText(-2, 3), '🖤🖤🖤');
  assert.equal(livesText(5, 3), '❤️❤️❤️');
  assert.equal(livesText(START_LIVES), '❤️'.repeat(START_LIVES));
  assert.ok(LOW_LIVES >= 1 && LOW_LIVES < START_LIVES);
});


// ---------- Karten (MAPS) ----------

test('Jede Karte hat einen gültigen, überschneidungsfreien Weg', () => {
  for (const [id, map] of Object.entries(MAPS)) {
    const w = map.waypoints;
    assert.ok(w.length >= 7, `${id}: mindestens 5 Kurven`);
    const out = ([c, r]) => c < 0 || r < 0 || c >= COLS || r >= ROWS;
    assert.ok(out(w[0]) && out(w[w.length - 1]), `${id}: Ein-/Ausgang außerhalb`);
    let steps = 0;
    for (let i = 0; i < w.length - 1; i++) {
      const dc = w[i + 1][0] - w[i][0];
      const dr = w[i + 1][1] - w[i][1];
      assert.ok((dc === 0) !== (dr === 0), `${id}: Segment ${i} achsenparallel`);
      steps += Math.abs(dc) + Math.abs(dr);
    }
    for (let i = 1; i < w.length - 1; i++) assert.ok(!out(w[i]), `${id}: innerer Punkt im Feld`);
    const tiles = pathTiles(w);
    assert.equal(tiles.size, steps + 1, `${id}: keine Kachel doppelt`);
  }
  assert.equal(WAYPOINTS, MAPS[DEFAULT_MAP_ID].waypoints);
});

test('createGame wählt Karte per mapId, unbekannte fällt auf Standard zurück', () => {
  const def = createGame();
  assert.equal(def.mapId, DEFAULT_MAP_ID);
  const c = createGame({ mapId: 'ice' });
  assert.equal(c.mapId, 'ice');
  assert.notDeepEqual(c.path.points, def.path.points);
  assert.deepEqual(c.path.points, buildPath(MAPS.ice.waypoints, TILE).points);
  assert.equal(createGame({ mapId: 'forest' }).mapId, DEFAULT_MAP_ID, 'Wald gibt es nicht mehr (B-098)');
  const u = createGame({ mapId: 'gibt-es-nicht' });
  assert.equal(u.mapId, DEFAULT_MAP_ID);
  assert.deepEqual(u.path.points, def.path.points);
  assert.equal(createGame({ mapId: 'toString' }).mapId, DEFAULT_MAP_ID);
});

test('Zweitkarte: Weg-Kacheln blockiert, Gegner erreichen das Ziel', () => {
  const s = createGame({ mapId: 'ice' });
  const [pc, pr] = [...s.blocked].map((k) => k.split(',').map(Number)).find(([c, r]) => c >= 0 && r >= 0 && c < 20 && r < 14);
  assert.equal(canBuild(s, pc, pr).ok, false);
  let free = false;
  for (let r = 0; r < 14 && !free; r++) for (let c = 0; c < 20; c++) if (canBuild(s, c, r).ok) { free = true; break; }
  assert.ok(free);
  spawnEnemy(s, 'grunt', 1);
  run(s, 120);
  assert.ok(s.lives < START_LIVES);
});

// ---------- Hindernisse (B-028) ----------
// Seit B-098 (Wald entfernt) hatte keine Karte Hindernisse, seit B-103 hat jede wenige; die Mechanik wird zusätzlich per Override geprüft.
const OBST = [[0, 0], [7, 5], [13, 1]];
const withObstacles = () => createGame({ obstacles: new Set(OBST.map(([c, r]) => `${c},${r}`)) });
test('Hindernisse: liegen im Feld, nie auf dem Weg', async () => {
  const { MAPS, COLS, ROWS } = await import('../src/config.js');
  for (const id of Object.keys(MAPS)) {
    const s = createGame({ mapId: id });
    assert.equal(s.obstacles.size, (MAPS[id].obstacles || []).length, 'keine Duplikate');
    for (const k of s.obstacles) {
      const [c, r] = k.split(',').map(Number);
      assert.ok(c >= 0 && r >= 0 && c < COLS && r < ROWS, `${id} ${k} im Feld`);
      assert.ok(!s.blocked.has(k), `${id} ${k} nicht auf dem Weg`);
    }
  }
  assert.equal(MAPS.forest, undefined, 'Wald entfernt (B-098)');
  const f = withObstacles();
  for (const k of f.obstacles) assert.ok(!f.blocked.has(k), `${k} nicht auf dem Weg der Wiese`);
});

test('Hindernisse: canBuild lehnt ab, daneben normal; Karten ohne Hindernisse unveraendert', () => {
  const f = withObstacles();
  const [c, r] = [...f.obstacles][0].split(',').map(Number);
  const res = canBuild(f, c, r);
  assert.equal(res.ok, false);
  assert.match(res.reason, /Baum|Fels/);
  const g0 = f.gold;
  assert.equal(buildTower(f, 'arrow', c, r).ok, false);
  assert.equal(f.gold, g0);
  let free = null;
  for (let rr = 0; rr < 14 && !free; rr++) for (let cc = 0; cc < 20; cc++) if (canBuild(f, cc, rr).ok) { free = [cc, rr]; break; }
  assert.equal(buildTower(f, 'arrow', ...free).ok, true);
  const m = createGame();
  assert.equal(m.obstacles.size, MAPS.meadow.obstacles.length); // B-103: Karten-Hindernisse aus config
  assert.equal(createGame({ mapId: 'ice' }).obstacles.size, MAPS.ice.obstacles.length);
  assert.equal(canBuild(m, 0, 0).ok, true);
  assert.equal(canBuild(f, 1, 2).reason, 'Auf dem Weg kann nicht gebaut werden');
});

// B-103: jede Karte hat wenige Hindernisse (2 bis 4), nie auf einem Weg, nicht direkt an Tor oder Ziel, nicht bebaubar.
test('B-103: jede Karte hat 2 bis 4 Hindernisse, nie auf Weg/Tor/Ziel, canBuild lehnt sie ab', () => {
  for (const [id, m] of Object.entries(MAPS)) {
    assert.ok(m.obstacles.length >= 2 && m.obstacles.length <= 4, `${id}: ${m.obstacles.length} Hindernisse`);
    const s = createGame({ mapId: id });
    assert.equal(s.obstacles.size, m.obstacles.length);
    // Tor und Ziel: erste und letzte Kachel jedes Wegs, auf das Feld geklemmt
    const ends = [m.waypoints, ...(m.extraPaths || [])].flatMap((w) => [w[0], w[w.length - 1]])
      .map(([c, r]) => [Math.min(COLS - 1, Math.max(0, c)), Math.min(ROWS - 1, Math.max(0, r))]);
    for (const [c, r] of m.obstacles) {
      assert.ok(!s.blocked.has(`${c},${r}`), `${id} ${c},${r} auf dem Weg`);
      for (const [ec, er] of ends) assert.ok(Math.max(Math.abs(ec - c), Math.abs(er - r)) > 1, `${id} ${c},${r} an Tor/Ziel ${ec},${er}`);
      const res = canBuild(s, c, r);
      assert.equal(res.ok, false, `${id} ${c},${r} bebaubar`);
      assert.match(res.reason, /Baum|Fels/);
    }
  }
});

test('Hindernisse: Goblin erreicht trotz Hindernissen das Ziel', () => {
  const s = withObstacles();
  spawnEnemy(s, 'grunt', 1);
  const lives = s.lives;
  run(s, 60);
  assert.ok(s.lives < lives);
});

// ---------- Map Eiswelt: Modifikatoren (B-029) ----------
function shootAt(mapId, type) {
  const s = createGame({ mapId });
  const [c, r] = freeTileNearPath(s);
  s.gold = 1000;
  buildTower(s, type, c, r);
  const t = s.towers[0];
  const e = spawnEnemy(s, 'tank', 1) || s.enemies[0];
  let best = 0;
  for (let d = 0; d < s.path.length; d += 5) {
    const a = pointAt(s.path, d), b = pointAt(s.path, best);
    if (Math.hypot(a.x - t.x, a.y - t.y) < Math.hypot(b.x - t.x, b.y - t.y)) best = d;
  }
  e.dist = best;
  update(s, 0.01);
  return { s, t, e, p: s.projectiles[0] };
}

test('Modifikatoren: Karten ohne modifiers bleiben unverändert', () => {
  for (const id of ['meadow']) {
    const s = createGame({ mapId: id });
    assert.deepEqual(s.modifiers, { enemySpeed: 1, towerDamage: {}, slowStrength: 1 });
    spawnEnemy(s, 'grunt', 1);
    assert.equal(s.enemies[0].speed, ENEMY_TYPES.grunt.speed);
  }
  const { p } = shootAt('meadow', 'cannon');
  assert.equal(p.damage, TOWER_TYPES.cannon.damage);
  const f = shootAt('meadow', 'frost');
  assert.equal(f.p.slow, TOWER_TYPES.frost.slow);
  assert.equal(f.p.damage, TOWER_TYPES.frost.damage);
});

test('Modifikatoren: Eiswelt (Glatteis) beschleunigt Gegner, schwächt Kanone und Frost', () => {
  const m = MAPS.ice.modifiers;
  assert.deepEqual(mapModifiers('ice'), { enemySpeed: m.enemySpeed, towerDamage: m.towerDamage, slowStrength: m.slowStrength });
  const s = createGame({ mapId: 'ice' });
  spawnEnemy(s, 'grunt', 1);
  assert.ok(s.enemies[0].speed > ENEMY_TYPES.grunt.speed);
  assert.equal(s.enemies[0].speed, ENEMY_TYPES.grunt.speed * m.enemySpeed);
  const c = shootAt('ice', 'cannon');
  assert.ok(c.p.damage < TOWER_TYPES.cannon.damage);
  const f = shootAt('ice', 'frost');
  assert.ok(f.p.slow < TOWER_TYPES.frost.slow);
  assert.ok(f.p.damage < TOWER_TYPES.frost.damage);
  run(f.s, 1);
  assert.ok(f.e.slowFactor > 1 - TOWER_TYPES.frost.slow, 'Verlangsamung auf Eis schwächer');
  assert.ok(f.e.slowFactor < 1);
});

test('towerStats: ohne 2. Parameter unverändert, mit Modifikatoren skaliert', () => {
  const t = { type: 'frost', level: 2 };
  const base = towerStats(t);
  assert.equal(base.damage, TOWER_TYPES.frost.damage * 1.5);
  assert.equal(base.slow, TOWER_TYPES.frost.slow);
  assert.deepEqual(towerStats(t, mapModifiers('meadow')), base);
  const ice = towerStats(t, mapModifiers('ice'));
  assert.ok(ice.damage < base.damage && ice.slow < base.slow);
  assert.equal(towerStats({ type: 'arrow', level: 1 }, mapModifiers('ice')).damage, TOWER_TYPES.arrow.damage);
});

test('Eiswelt: Goblin erreicht das Ziel', () => {
  const s = createGame({ mapId: 'ice' });
  assert.equal(canBuild(s, 4, 9).ok, false);
  spawnEnemy(s, 'grunt', 1);
  const lives = s.lives;
  run(s, 90);
  assert.ok(s.lives < lives);
});

test('mapModifiers: unbekannte Karte = Standard, Teil-Modifikatoren werden aufgefüllt', () => {
  const def = { enemySpeed: 1, towerDamage: {}, slowStrength: 1 };
  for (const id of ['nope', undefined, null, '__proto__', 'constructor']) assert.deepEqual(mapModifiers(id), def);
  MAPS.__partial = { name: 'T', waypoints: MAPS.meadow.waypoints, modifiers: { enemySpeed: 0.5 } };
  try {
    assert.deepEqual(mapModifiers('__partial'), { enemySpeed: 0.5, towerDamage: {}, slowStrength: 1 });
  } finally { delete MAPS.__partial; }
  const before = MAPS.ice.modifiers.towerDamage.cannon;
  mapModifiers('ice').towerDamage.cannon = 99; // Kopie, keine Mutation der Config
  assert.equal(MAPS.ice.modifiers.towerDamage.cannon, before);
});

test('Eiswelt: Slowfaktor in (0,1), Upgrade-Stufen und Kanonen-Splash skalieren mit', () => {
  const mods = mapModifiers('ice');
  const f = towerStats({ type: 'frost', level: 1 }, mods);
  assert.ok(1 - f.slow > 0 && 1 - f.slow < 1);
  const c1 = towerStats({ type: 'cannon', level: 1 }, mods);
  const c3 = towerStats({ type: 'cannon', level: 3 }, mods);
  // 27.11. (Entscheidung des Menschen): Stufe 3 = LEVEL_DAMAGE[3] statt 2,25
  assert.ok(LEVEL_DAMAGE[3] > LEVEL_DAMAGE[2] && LEVEL_DAMAGE[3] < 2.25);
  assert.ok(Math.abs(c3.damage - TOWER_TYPES.cannon.damage * MAPS.ice.modifiers.towerDamage.cannon * LEVEL_DAMAGE[3]) < 1e-9);
  assert.ok(Math.abs(c3.damage / c1.damage - LEVEL_DAMAGE[3]) < 1e-9);
  // Splash: Nachbar des Ziels verliert den skalierten Schaden
  const s = createGame({ mapId: 'ice' });
  spawnEnemy(s, 'grunt', 1); spawnEnemy(s, 'grunt', 1);
  const [a, b] = s.enemies;
  a.hp = a.maxHp = b.hp = b.maxHp = 1000;
  b.dist = a.dist + 1; b.x = a.x; b.y = a.y;
  const t = freeTileNearPath(s);
  assert.ok(buildTower(s, 'cannon', t.col, t.row).ok !== false);
  s.gold = 1e6;
  run(s, 0.05);
  const lost = [a, b].map((e) => e.maxHp - e.hp).filter((v) => v > 0);
  for (const v of lost) assert.ok(Math.abs(v - TOWER_TYPES.cannon.damage * MAPS.ice.modifiers.towerDamage.cannon) < 1e-6, 'Splash ' + v);
});

// B-046: Karten haben eigene Modifikatoren, die Wiese bleibt ohne. B-099: Zangenangriff seit den festen Seiten
// ohne schnellere Gegner (bewusste Balancing-Änderung, siehe docs/LEDGER.md), Zwei Fronten mit langsameren.
test('Modifikatoren: Wiese hat keine, Zangenangriff schwächere Kanone, Zwei Fronten langsamere Gegner', () => {
  assert.equal(MAPS.meadow.modifiers, undefined);
  assert.deepEqual(createGame({ mapId: 'meadow' }).modifiers, { enemySpeed: 1, towerDamage: {}, slowStrength: 1 });
  assert.ok(MAPS.fork.modifiers.towerDamage.cannon < 1);
  assert.ok(MAPS.twin.modifiers.enemySpeed < 1);
  for (const id of ['fork', 'twin']) {
    const s = createGame({ mapId: id });
    spawnEnemy(s, 'grunt', 1);
    assert.equal(s.enemies[0].speed, ENEMY_TYPES.grunt.speed * (MAPS[id].modifiers.enemySpeed ?? 1));
  }
});

test('Zwei Eingänge: Karten ohne extraPaths haben genau einen Weg', () => {
  for (const id of ['meadow', 'ice']) {
    const s = createGame({ mapId: id });
    assert.equal(s.paths.length, 1);
    assert.equal(s.paths[0], s.path);
    assert.equal(enemyPath(s, spawnEnemy(s, 'grunt')), s.path);
  }
});

test('Zwei Eingänge: Gegner starten abwechselnd an beiden Eingängen, Wellenanzahl unverändert', () => {
  const s = createGame({ mapId: 'fork' });
  assert.equal(s.paths.length, 2);
  assert.equal(s.path, s.paths[0]);
  const a = spawnEnemy(s, 'grunt');
  const b = spawnEnemy(s, 'grunt');
  const c = spawnEnemy(s, 'grunt');
  assert.deepEqual([a.lane, b.lane, c.lane], [0, 1, 0]);
  assert.deepEqual({ x: a.x, y: a.y }, s.paths[0].points[0]);
  assert.deepEqual({ x: b.x, y: b.y }, s.paths[1].points[0]);
  assert.notDeepEqual({ x: a.x, y: a.y }, { x: b.x, y: b.y });
  const w = createGame({ mapId: 'fork', gold: 1e9 });
  startWave(w);
  const total = w.spawnQueue.length;
  assert.equal(total, waveFor(1).length);
  for (let k = 0; k < 60 * 60 && w.waveActive; k++) update(w, 1 / 60); // B-121: nur Welle 1 (kein Auto-Start)
  assert.equal(w.enemies.length + (START_LIVES - w.lives), total);
});

test('Zwei Eingänge: Gegner beider Wege erreichen das Ziel und kosten Leben', () => {
  const s = createGame({ mapId: 'fork' });
  spawnEnemy(s, 'grunt');
  spawnEnemy(s, 'grunt');
  run(s, 60);
  assert.equal(s.enemies.length, 0);
  assert.equal(s.lives, START_LIVES - 2);
});

test('Zwei Eingänge: pickTarget "first" wählt den Gegner mit weniger Restweg', () => {
  const tower = { x: 0, y: 0 };
  const lang = { hp: 10, x: 0, y: 0, dist: 300, len: 1000 }; // Restweg 700
  const kurz = { hp: 10, x: 0, y: 0, dist: 200, len: 400 }; // Restweg 200
  assert.equal(pickTarget([lang, kurz], tower, 10, 'first'), kurz);
  assert.equal(pickTarget([lang, kurz], tower, 10, 'last'), lang);
});

test('Karte Zangenangriff: Wege gültig, achsenparallel, nur Endstück gemeinsam', () => {
  const m = MAPS.fork;
  const all = [m.waypoints, ...m.extraPaths];
  const inside = ([c, r]) => c >= 0 && c < COLS && r >= 0 && r < ROWS;
  for (const w of all) {
    assert.ok(!inside(w[0]) && !inside(w[w.length - 1]));
    for (const p of w.slice(1, -1)) assert.ok(inside(p));
    for (let i = 0; i < w.length - 1; i++) assert.ok(w[i][0] === w[i + 1][0] || w[i][1] === w[i + 1][1]);
    assert.ok(w.length - 2 >= 3, 'mindestens 3 Kurven');
    const len = buildPath(w, 1).length;
    assert.ok(len >= 40 && len <= 55, `Länge ${len}`);
  }
  assert.notDeepEqual(all[0][0], all[1][0]);
  assert.deepEqual(all[0][all[0].length - 1], all[1][all[1].length - 1]);
  const a = pathTiles(all[0]);
  const b = pathTiles(all[1]);
  const shared = [...a].filter((k) => b.has(k));
  // gemeinsame Kacheln = Endstück ab der Zusammenführung [10,7]
  const tail = pathTiles(all[0].slice(4));
  assert.deepEqual(shared.sort(), [...tail].sort());
});

test('Karte Zangenangriff: canBuild blockt Kacheln beider Wege', () => {
  const s = createGame({ mapId: 'fork' });
  assert.equal(canBuild(s, 3, 2).ok, false); // nur Weg 1
  assert.equal(canBuild(s, 2, 12).ok, false); // nur Weg 2
  assert.equal(canBuild(s, 12, 7).ok, false); // gemeinsam
  assert.equal(canBuild(s, 0, 7).ok, true);
});

// ---- Tester-Ergänzungen B-033 ----
test('Zwei Eingänge: alter Aufruf mit path-Override gibt paths = [path]', () => {
  const p = buildPath([[0, 0], [5, 0]], 10);
  const s = createGame({ mapId: 'fork', path: p });
  assert.equal(s.paths.length, 1);
  assert.equal(s.paths[0], p);
});

test('Zwei Eingänge: Gegner ohne lane/len crashen nicht, pickTarget wie früher', () => {
  const s = createGame();
  const mk = (id, dist, hp) => ({ id, type: 'grunt', hp, maxHp: hp, speed: 1, leak: 1, radius: 10, dist, x: 100 + dist, y: 100, slowUntil: 0, slowFactor: 1 });
  s.enemies = [mk(1, 50, 10), mk(2, 90, 5), mk(3, 20, 99)];
  const t = { x: 100, y: 100 };
  assert.equal(pickTarget(s.enemies, t, 500, 'first').id, 2);
  assert.equal(pickTarget(s.enemies, t, 500, 'last').id, 3);
  assert.equal(pickTarget(s.enemies, t, 500, 'strong').id, 3);
  assert.equal(pickTarget(s.enemies, t, 500, 'close').id, 3);
  update(s, 0.1);
  assert.ok(s.enemies.every((e) => Number.isFinite(e.x)));
});

test('Zangenangriff: jeder Gegner leakt genau einmal, Leben exakt, nichts bleibt hängen', () => {
  const s = createGame({ mapId: 'fork' });
  for (let i = 0; i < 6; i++) spawnEnemy(s, 'grunt');
  assert.deepEqual(s.enemies.map((e) => e.lane), [0, 1, 0, 1, 0, 1]);
  const before = s.lives;
  run(s, 120);
  assert.equal(s.enemies.length, 0);
  assert.equal(s.lives, before - 6 * ENEMY_TYPES.grunt.leak);
});

test('Zangenangriff: Frost-Slow und Heiler funktionieren mit lane', () => {
  const s = createGame({ mapId: 'fork' });
  spawnEnemy(s, 'grunt'); spawnEnemy(s, 'grunt');
  const [a, b] = s.enemies;
  a.slowUntil = 999; a.slowFactor = 0.5;
  update(s, 1);
  assert.ok(a.dist < b.dist && a.dist > 0);
  spawnEnemy(s, 'healer'); spawnEnemy(s, 'healer');
  run(s, 10);
  assert.ok(s.enemies.every((e) => e.hp <= e.maxHp));
});

test('Zangenangriff: Bauplätze nahe beiden Wegen, Wegkacheln/Ein-/Ausgang nicht bebaubar', () => {
  const s = createGame({ mapId: 'fork' });
  const m = MAPS.fork;
  for (const wps of [m.waypoints, ...m.extraPaths]) {
    const tiles = [...pathTiles(wps)].map((k) => k.split(',').map(Number));
    for (const [c, r] of tiles) assert.equal(canBuild(s, c, r).ok, false, `${c},${r}`);
    let near = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!canBuild(s, c, r).ok) continue;
      if (tiles.some(([pc, pr]) => Math.max(Math.abs(pc - c), Math.abs(pr - r)) <= 2)) near++;
    }
    assert.ok(near >= 25, `nur ${near} Bauplätze`);
  }
  for (const [c, r] of [[-1, 2], [-1, 12], [20, 12]]) assert.equal(canBuild(s, c, r).ok, false);
});

// ---------- Feste Seiten (B-099) und Karte Zwei Fronten ----------

test('Feste Seiten: Flitzer oben, Troll/Schildträger/Schamane unten, Goblin und Boss wechseln weiter ab', () => {
  for (const id of ['fork', 'twin']) {
    const s = createGame({ mapId: id });
    const lanes = ['grunt', 'runner', 'grunt', 'tank', 'shielded', 'healer', 'runner', 'grunt', 'boss', 'boss']
      .map((t) => spawnEnemy(s, t, 1).lane);
    // Feste Typen zählen den Wechsel nicht weiter: Goblins/Bosse laufen 0, 1, 0, 1, 0
    assert.deepEqual(lanes, [0, 0, 1, 1, 1, 1, 0, 0, 1, 0], id);
    for (const e of s.enemies) assert.deepEqual({ x: e.x, y: e.y }, s.paths[e.lane].points[0]);
  }
});

test('Feste Seiten: Karten ohne lanes und Ein-Weg-Overrides bleiben beim Wechsel bzw. Hauptweg', () => {
  const m = createGame({ mapId: 'meadow' });
  assert.deepEqual(['runner', 'tank', 'grunt'].map((t) => spawnEnemy(m, t, 1).lane), [0, 0, 0]);
  const one = createGame({ mapId: 'twin', path: buildPath([[0, 0], [5, 0]], 10) });
  assert.equal(spawnEnemy(one, 'tank', 1).lane, 0, 'lane außerhalb der Wege fällt auf Wechsel zurück');
  assert.equal(laneFor({ mapId: 'twin', nextLane: 0 }, 'tank', 2), 1);
  assert.equal(laneFor({ mapId: 'twin', nextLane: 0 }, 'tank', 1), 0);
});

test('Feste Seiten: eine echte Welle verteilt die Typen laut Karte, Anzahl unverändert', () => {
  const s = createGame({ mapId: 'twin', gold: 1e9 });
  s.wave = 8; // nächste Welle 9: Goblins, Flitzer, Trolle, Schildträger, Schamane
  startWave(s);
  const total = s.spawnQueue.length;
  const seen = new Map();
  for (let k = 0; k < 60 * 120 && s.waveActive; k++) {
    for (const e of s.enemies) seen.set(e.id, e);
    update(s, 1 / 60);
    if (s.lives <= 1) s.lives = 99; // nur Verteilung prüfen, nicht verlieren
  }
  assert.equal(seen.size, total);
  for (const e of seen.values()) {
    const fixed = MAPS.twin.lanes[e.type];
    if (fixed !== undefined) assert.equal(e.lane, fixed, e.type);
  }
  const grunts = [...seen.values()].filter((e) => e.type === 'grunt');
  assert.ok(grunts.some((e) => e.lane === 0) && grunts.some((e) => e.lane === 1), 'Goblins auf beiden Seiten');
});

test('Karte Zwei Fronten: Wege gültig, getrennt bis auf ein kurzes Endstück, Bauplätze an beiden Wegen', () => {
  const m = MAPS.twin;
  const all = [m.waypoints, ...m.extraPaths];
  assert.equal(all.length, 2);
  const inside = ([c, r]) => c >= 0 && c < COLS && r >= 0 && r < ROWS;
  for (const w of all) {
    assert.ok(!inside(w[0]) && !inside(w[w.length - 1]));
    for (const p of w.slice(1, -1)) assert.ok(inside(p));
    for (let i = 0; i < w.length - 1; i++) assert.ok((w[i][0] === w[i + 1][0]) !== (w[i][1] === w[i + 1][1]));
    const len = buildPath(w, 1).length;
    assert.ok(len >= 40 && len <= 55, `Länge ${len}`);
  }
  assert.notDeepEqual(all[0][0], all[1][0]);
  assert.deepEqual(all[0].at(-1), all[1].at(-1));
  const a = pathTiles(all[0]);
  const b = pathTiles(all[1]);
  const shared = [...a].filter((k) => b.has(k));
  assert.ok(shared.length <= 4, `gemeinsam nur das Endstück (${shared.length} Kacheln)`);
  const s = createGame({ mapId: 'twin' });
  for (const k of [...a, ...b]) { const [c, r] = k.split(',').map(Number); assert.equal(canBuild(s, c, r).ok, false, k); }
  for (const tiles of [a, b]) {
    const pts = [...tiles].map((k) => k.split(',').map(Number));
    let near = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (canBuild(s, c, r).ok && pts.some(([pc, pr]) => Math.max(Math.abs(pc - c), Math.abs(pr - r)) <= 2)) near++;
    }
    assert.ok(near >= 25, `nur ${near} Bauplätze`);
  }
});

// ---------- B-045: Turm-Spezialfähigkeiten ----------
// Hilfen: Turm und Gegner dicht daneben platzieren (Gegner steht per speed 0 still, wenn nicht anders nötig).
function specialSetup(towerType, enemyType = 'grunt', mapId, dist = 200) {
  const s = createGame({ mapId, gold: 1e9 });
  const [c, r] = freeTileNearPath(s);
  const tower = buildTower(s, towerType, c, r).tower;
  const e = spawnEnemy(s, enemyType, 1);
  e.dist = dist;
  const p = pointAt(enemyPath(s, e), e.dist);
  // Position kommt in update() aus dist: also den Turm neben den Gegner setzen
  e.x = p.x; e.y = p.y; e.speed = 0; e.hp = e.maxHp = 1e9;
  tower.x = p.x + 20; tower.y = p.y;
  return { s, tower, e };
}
const cfg = (t) => TOWER_TYPES[t].special;

test('Spezial: jeder Turmtyp hat special.text (deutscher Satz) und Zahlen nur in der Config', () => {
  for (const t of Object.keys(TOWER_TYPES)) assert.ok(cfg(t).text.length > 10, t);
  assert.equal(towerStats({ type: 'arrow', level: 3 }, {}).special, cfg('arrow'));
});

test('Spezial Pfeil: Aufwärmen verkürzt den Schussabstand pro Folgeschuss bis zur Obergrenze', () => {
  const { s, tower, e } = specialSetup('arrow');
  const rate = TOWER_TYPES.arrow.rate;
  const gaps = [];
  for (let i = 0; i < 12; i++) {
    tower.cooldown = 0;
    update(s, 0.001);
    gaps.push(tower.cooldown);
    s.projectiles = [];
  }
  assert.ok(Math.abs(gaps[0] - rate) < 1e-9, 'erster Schuss ohne Bonus');
  assert.ok(Math.abs(gaps[1] - rate * (1 - cfg('arrow').warmupStep)) < 1e-3);
  assert.ok(gaps[2] < gaps[1]);
  const floor = rate * (1 - cfg('arrow').warmupMax);
  assert.ok(Math.abs(gaps[11] - floor) < 1e-3, 'Obergrenze erreicht');
  assert.ok(gaps.every((g) => g >= floor - 1e-3));
  assert.equal(tower.focusId, e.id);
});

test('Spezial Pfeil: Zielwechsel und fehlendes Ziel setzen Aufwärmen zurück', () => {
  const { s, tower, e } = specialSetup('arrow');
  for (let i = 0; i < 4; i++) { tower.cooldown = 0; update(s, 0.001); s.projectiles = []; }
  assert.ok(tower.focusStacks >= 3);
  const e2 = spawnEnemy(s, 'grunt', 1);
  e2.dist = e.dist + 5; e2.speed = 0; e2.hp = e2.maxHp = 1e9;
  Object.assign(e2, pointAt(enemyPath(s, e2), e2.dist));
  e.hp = 0; s.enemies = [e2];
  tower.cooldown = 0; update(s, 0.001);
  assert.equal(tower.focusId, e2.id);
  assert.equal(tower.focusStacks, 0);
  assert.ok(Math.abs(tower.cooldown - TOWER_TYPES.arrow.rate) < 1e-3);
  s.enemies = [];
  tower.cooldown = 0; update(s, 0.001);
  assert.equal(tower.focusId, null);
  assert.equal(tower.focusStacks, 0);
});

test('Spezial Pfeil: Turm ohne Spezialfelder (alte Testobjekte) funktioniert weiter', () => {
  const { s, tower } = specialSetup('arrow');
  delete tower.focusId; delete tower.focusStacks; delete tower.hitCount;
  tower.cooldown = 0;
  update(s, 0.001);
  assert.equal(s.projectiles.length, 1);
});

test('Spezial Pfeil: Upgrade behält den Aufwärm-Zustand, Spezialzahlen skalieren nicht', () => {
  const { s, tower } = specialSetup('arrow');
  for (let i = 0; i < 3; i++) { tower.cooldown = 0; update(s, 0.001); s.projectiles = []; }
  const stacks = tower.focusStacks;
  assert.ok(upgradeTower(s, tower.id).ok);
  assert.equal(tower.focusStacks, stacks);
  assert.equal(towerStats(tower, s.modifiers).special.warmupStep, cfg('arrow').warmupStep);
});

test('Spezial Kanone: Rückstoß wirft das Ziel zurück, Boss nur halb, nie unter Weganfang', () => {
  const { s, tower, e } = specialSetup('cannon');
  const kb = cfg('cannon').knockback * TILE;
  const before = e.dist;
  tower.cooldown = 0; update(s, 0.001);
  for (let i = 0; i < 200 && s.projectiles.length; i++) update(s, 0.01);
  assert.ok(Math.abs(before - e.dist - kb) < 1e-6, `Rückstoß ${before - e.dist}`);
  const pt = pointAt(enemyPath(s, e), e.dist);
  assert.ok(Math.abs(pt.x - e.x) < 1e-6 && Math.abs(pt.y - e.y) < 1e-6);
  // Schutzzeit: kein zweiter Rückstoß direkt danach
  const d2 = e.dist;
  tower.cooldown = 0; update(s, 0.001);
  for (let i = 0; i < 200 && s.projectiles.length; i++) update(s, 0.01);
  assert.equal(e.dist, d2);

  const b = specialSetup('cannon', 'boss');
  const bBefore = b.e.dist;
  b.tower.cooldown = 0; update(b.s, 0.001);
  for (let i = 0; i < 200 && b.s.projectiles.length; i++) update(b.s, 0.01);
  assert.ok(Math.abs(bBefore - b.e.dist - kb * cfg('cannon').bossKnockbackFactor) < 1e-6);

  const z = specialSetup('cannon', 'grunt', undefined, 1);
  z.tower.cooldown = 0; update(z.s, 0.001);
  for (let i = 0; i < 200 && z.s.projectiles.length; i++) update(z.s, 0.01);
  assert.equal(z.e.dist, 0);
});

test('Spezial Kanone: Rückstoß auf der Zwei-Wege-Karte nutzt den eigenen Weg', () => {
  const { s, tower, e } = specialSetup('cannon', 'grunt', 'fork');
  const e2 = spawnEnemy(s, 'grunt', 1);
  assert.equal(e2.lane, 1);
  e2.dist = 300; e2.speed = 0; e2.hp = e2.maxHp = 1e9;
  const p2 = pointAt(enemyPath(s, e2), e2.dist);
  e2.x = p2.x; e2.y = p2.y;
  tower.x = p2.x - 20; tower.y = p2.y;
  s.enemies = [e2];
  const before = e2.dist;
  tower.cooldown = 0; update(s, 0.001);
  for (let i = 0; i < 200 && s.projectiles.length; i++) update(s, 0.01);
  assert.ok(Math.abs(before - e2.dist - cfg('cannon').knockback * TILE) < 1e-6);
  const pt = pointAt(s.paths[1], e2.dist);
  assert.ok(Math.abs(pt.x - e2.x) < 1e-6 && Math.abs(pt.y - e2.y) < 1e-6);
  void e;
});

function fireAndLand(s, tower) {
  tower.cooldown = 0;
  update(s, 0.001);
  for (let i = 0; i < 300 && s.projectiles.length; i++) update(s, 0.01);
}

test('Spezial Frost: jeder N-te Treffer friert ein, eingefrorener Gegner steht und taut auf', () => {
  const { s, tower, e } = specialSetup('frost');
  const n = cfg('frost').freezeEvery;
  e.speed = 1;
  for (let i = 1; i < n; i++) fireAndLand(s, tower);
  assert.equal(tower.hitCount, n - 1);
  assert.ok(!(e.frozenUntil > s.time), 'noch nicht eingefroren');
  fireAndLand(s, tower);
  assert.equal(tower.hitCount, n);
  assert.ok(e.frozenUntil > s.time, 'eingefroren');
  const d = e.dist;
  const x = e.x;
  const rest = e.frozenUntil - s.time;
  update(s, rest / 2);
  assert.equal(e.dist, d);
  assert.equal(e.x, x);
  update(s, rest);
  update(s, 0.1);
  assert.ok(e.dist > d, 'taut auf');
});

test('Spezial Frost: Boss ist immun, Zähler läuft trotzdem; Verkauf des Turms mit fliegendem Schuss ist sicher', () => {
  const { s, tower, e } = specialSetup('frost', 'boss');
  for (let i = 0; i < cfg('frost').freezeEvery * 2; i++) fireAndLand(s, tower);
  assert.equal(e.frozenUntil || 0, 0);
  assert.equal(tower.hitCount, cfg('frost').freezeEvery * 2);
  tower.cooldown = 0; update(s, 0.001);
  sellTower(s, tower.id);
  for (let i = 0; i < 100; i++) update(s, 0.01);
  assert.equal(s.projectiles.length, 0);
});

test('Spezial Sniper: Bonus nach Basis-HP des Gegnertyps (nicht nach skalierter maxHp), Rüstung wird dabei ignoriert', () => {
  const sp = cfg('sniper');
  const base = TOWER_TYPES.sniper.damage;
  const shot = (type, wave) => {
    const { s, tower, e } = specialSetup('sniper', type);
    e.maxHp = Math.round(ENEMY_TYPES[type].hp * hpScale(wave)); e.hp = e.maxHp;
    fireAndLand(s, tower);
    return e.maxHp - e.hp;
  };
  const armor = (t) => 1 - (ENEMY_TYPES[t].armor || 0);
  for (const wave of [1, 10, 20]) {
    // Troll und Boss (Basis-HP >= Schwelle): Bonus in jeder Welle
    assert.ok(ENEMY_TYPES.tank.hp >= sp.bonusMinHp && ENEMY_TYPES.boss.hp >= sp.bonusMinHp);
    assert.ok(Math.abs(shot('tank', wave) - base * sp.bonusDamage) < 1e-6, `Troll Welle ${wave}`);
    assert.ok(Math.abs(shot('boss', wave) - base * sp.bonusDamage) < 1e-6, `Boss Welle ${wave}`);
    // Schildträger, Goblin, Flitzer, Schamane: nie Bonus, auch wenn die skalierte maxHp über der Schwelle liegt
    assert.ok(Math.abs(shot('shielded', wave) - base * armor('shielded')) < 1e-6, `Schildträger Welle ${wave}: Rüstung normal, kein Bonus`);
    for (const t of ['grunt', 'runner', 'healer']) assert.ok(Math.abs(shot(t, wave) - base) < 1e-6, `${t} Welle ${wave}`);
  }
  // Zur Einordnung: nach der alten Regel (skalierte maxHp) hätte der Schildträger in Welle 20 den Bonus bekommen
  assert.ok(ENEMY_TYPES.shielded.hp < sp.bonusMinHp && ENEMY_TYPES.shielded.hp * hpScale(20) >= sp.bonusMinHp);
});

test('Spezial: Fähigkeiten sind spürbar (Rückstoß >= 0,5 Kacheln, Aufwärmen >= 25 %, Einfrieren höchstens jeder 5. Treffer, Dauer >= 0,5 s)', () => {
  assert.ok(cfg('cannon').knockback >= 0.5);
  assert.ok(cfg('arrow').warmupMax >= 0.25);
  assert.ok(cfg('arrow').warmupStep * 10 >= cfg('arrow').warmupMax, 'Obergrenze nach höchstens 10 Folgeschüssen erreicht');
  assert.ok(cfg('frost').freezeEvery <= 5);
  assert.ok(cfg('frost').freezeDuration >= 0.5);
  assert.ok(cfg('sniper').bonusDamage >= 1.5);
});

test('Spezial: special.text wird aus den Config-Werten gebaut (Zahlen im Text stimmen mit den Werten überein)', () => {
  const pct = (x) => `${Math.round(x * 100)} %`;
  assert.ok(cfg('arrow').text.includes(pct(cfg('arrow').warmupMax)));
  assert.ok(cfg('cannon').text.includes(String(cfg('cannon').knockback).replace('.', ',')));
  assert.ok(cfg('frost').text.includes(`${cfg('frost').freezeEvery}.`));
  assert.ok(cfg('frost').text.includes(String(cfg('frost').freezeDuration).replace('.', ',')));
  assert.ok(cfg('sniper').text.includes(pct(cfg('sniper').bonusDamage - 1)));
  assert.ok(cfg('sniper').text.includes(String(cfg('sniper').bonusMinHp)));
});

test('Spezial: andere Türme bleiben unverändert (Pfeil ohne Rückstoß/Frost/Bonus, Kanone ohne Frost)', () => {
  const { s, tower, e } = specialSetup('arrow', 'tank');
  e.maxHp = e.hp = 5000;
  const d = e.dist;
  fireAndLand(s, tower);
  assert.equal(5000 - e.hp, TOWER_TYPES.arrow.damage * (1 - 0));
  assert.equal(e.dist, d);
  assert.equal(tower.hitCount, 0);
  const c = specialSetup('cannon');
  fireAndLand(c.s, c.tower);
  assert.equal(c.tower.hitCount, 0);
  assert.equal(c.e.frozenUntil || 0, 0);
});

// ---------- B-034: Blitzturm (Kettenblitz) ----------
const LT = TOWER_TYPES.lightning;
const mkE = (id, x, y, hp = 100) => ({ id, x, y, hp, maxHp: hp });

test('chainTargets: nur nahe Gegner, nie doppelt, Obergrenze, kein Sprung ohne Ziel, Tote ignoriert', () => {
  const a = mkE(1, 0, 0);
  const b = mkE(2, 50, 0);
  const c = mkE(3, 100, 0);
  const d = mkE(4, 150, 0);
  const far = mkE(5, 400, 0);
  const dead = mkE(6, 25, 0, 0);
  assert.deepEqual(chainTargets([a, b, c, d, far, dead], a, 3, 60), [a, b, c, d]);
  assert.deepEqual(chainTargets([a, b, c, d], a, 2, 60), [a, b, c], 'Obergrenze');
  assert.deepEqual(chainTargets([a, far], a, 3, 60), [a], 'kein Sprung ohne Ziel');
  assert.deepEqual(chainTargets([a, b], a, 3, 60), [a, b], 'nie doppelt (b nicht zweimal)');
  assert.deepEqual(chainTargets([a, b, c], a, 0, 60), [a]);
});

function lightningSetup(types, mapId, spacing = 20) {
  const { s, tower, e } = specialSetup('lightning', types[0], mapId, 200);
  const list = [e];
  for (let i = 1; i < types.length; i++) {
    const o = spawnEnemy(s, types[i], 1);
    o.lane = e.lane; o.len = e.len; o.speed = 0; o.hp = o.maxHp = 1000; o.dist = e.dist - i * spacing;
    const p = pointAt(enemyPath(s, o), o.dist);
    o.x = p.x; o.y = p.y;
    list.push(o);
  }
  list.forEach((x) => { x.hp = x.maxHp = 1000; });
  tower.cooldown = 0;
  return { s, tower, list };
}

test('Blitzturm: Config, Taste 5, Text aus Werten, trifft sofort ohne Projektil', () => {
  assert.equal(LT.key, '5');
  assert.ok(LT.chainCount >= 1 && LT.chainRange > 0 && LT.chainFalloff > 0 && LT.chainFalloff < 1);
  assert.ok(LT.special.text.includes(String(LT.chainCount)) && LT.special.text.includes(`${Math.round(LT.chainFalloff * 100)} %`));
  const { s, list } = lightningSetup(['grunt', 'grunt']);
  update(s, 0.001);
  assert.equal(s.projectiles.length, 0);
  assert.ok(list[0].hp < 1000 && list[1].hp < 1000);
});

test('Blitzturm: Schaden sinkt je Sprung, höchstens chainCount Sprünge, Effekt hat Punktliste', () => {
  const n = LT.chainCount + 3;
  const { s, tower, list } = lightningSetup(Array(n).fill('grunt'));
  update(s, 0.001);
  const dealt = list.map((e) => 1000 - e.hp);
  const hits = dealt.filter((x) => x > 0);
  assert.equal(hits.length, LT.chainCount + 1);
  for (let i = 0; i < hits.length; i++) assert.ok(Math.abs(hits[i] - LT.damage * Math.pow(LT.chainFalloff, i)) < 1e-9, `Treffer ${i}`);
  const bolt = s.effects.find((f) => f.kind === 'bolt');
  assert.equal(bolt.points.length, LT.chainCount + 2);
  assert.deepEqual(bolt.points[0], { x: tower.x, y: tower.y });
  assert.ok(bolt.ttl > 0 && bolt.max === LT.boltDuration);
});

test('Blitzturm: Gegner außerhalb chainRange bleiben unberührt', () => {
  const { s, list } = lightningSetup(['grunt', 'grunt'], undefined, LT.chainRange * TILE + 15);
  update(s, 0.001);
  assert.ok(list[0].hp < 1000);
  assert.equal(list[1].hp, 1000);
  assert.equal(s.effects.find((f) => f.kind === 'bolt').points.length, 2);
});

test('Blitzturm: Tod, Gold und Kills korrekt (auch Kettenopfer), Rüstung wie Direkttreffer, Boss ohne Sonderlogik', () => {
  const { s, list } = lightningSetup(['grunt', 'grunt', 'grunt']);
  list.forEach((e) => { e.hp = 1; });
  const gold = s.gold;
  update(s, 0.001);
  assert.equal(s.enemies.length, 0);
  assert.equal(s.kills, 3);
  assert.equal(s.gold, gold + 3 * ENEMY_TYPES.grunt.reward);

  const sh = lightningSetup(['shielded', 'boss']);
  update(sh.s, 0.001);
  assert.ok(Math.abs(1000 - sh.list[0].hp - LT.damage * (1 - ENEMY_TYPES.shielded.armor)) < 1e-9);
  assert.ok(Math.abs(1000 - sh.list[1].hp - LT.damage * LT.chainFalloff) < 1e-9);
  assert.equal(sh.list[1].frozenUntil, undefined);
});

test('Blitzturm: Kette funktioniert auf der Karte fork; Stufen skalieren Schaden, Kettenwerte nicht', () => {
  const { s, list } = lightningSetup(['grunt', 'grunt'], 'fork');
  update(s, 0.001);
  assert.ok(list[0].hp < 1000 && list[1].hp < 1000);
  const st1 = towerStats({ type: 'lightning', level: 1 }, {});
  const st3 = towerStats({ type: 'lightning', level: 3 }, {});
  assert.ok(st3.damage > st1.damage && st3.range > st1.range && st3.rate < st1.rate);
  assert.equal(st3.chainCount, st1.chainCount);
  assert.equal(st3.chainRange, st1.chainRange);
  assert.equal(st3.chainFalloff, st1.chainFalloff);
});

// B-053: eigene Rolle des Blitzturms. Gleiche Anzahl Türme am selben Wegstück (2 Blitztürme kosten mehr als 2 Kanonen: Vorteil für die Kanone).
function duel(type, n, enemyType, count, gap, wave) {
  const s = createGame();
  s.gold = 1e6;
  s.lives = 1000;
  s.wave = wave;
  s.waveActive = true;
  const spots = rankedSpots(s, TOWER_TYPES[type].range);
  for (let i = 0; i < n; i++) buildTower(s, type, spots[i].c, spots[i].r);
  s.spawnQueue = Array.from({ length: count }, (_, i) => ({ type: enemyType, at: i * gap }));
  const seen = new Map();
  for (let k = 0; k < 600 * 30 && (s.spawnQueue.length || s.enemies.length); k++) {
    update(s, 1 / 30);
    for (const e of s.enemies) seen.set(e.id, e);
  }
  let dealt = 0;
  for (const e of seen.values()) dealt += e.maxHp - Math.max(0, e.hp);
  return { leaked: 1000 - s.lives, dealt };
}

test('Blitzturm-Rolle: gegen Flitzer- und Goblin-Schwärme besser als Kanonen, gegen Boss und Panzer-Troll schlechter', () => {
  const swarms = [['runner', 16, 0.35, 8], ['grunt', 20, 0.5, 8]];
  for (const [type, count, gap, wave] of swarms) {
    const l = duel('lightning', 2, type, count, gap, wave);
    const c = duel('cannon', 2, type, count, gap, wave);
    assert.ok(l.leaked < c.leaked, `${type}: Blitz ${l.leaked} Durchbrüche, Kanone ${c.leaked}`);
    assert.ok(l.dealt > c.dealt, `${type}: Blitz ${Math.round(l.dealt)} Schaden, Kanone ${Math.round(c.dealt)}`);
  }
  for (const [type, count, gap, wave] of [['boss', 1, 3, 3], ['tank', 3, 1, 5]]) {
    const l = duel('lightning', 2, type, count, gap, wave);
    const c = duel('cannon', 2, type, count, gap, wave);
    assert.ok(l.dealt < c.dealt, `${type}: Blitz ${Math.round(l.dealt)} Schaden, Kanone ${Math.round(c.dealt)}`);
  }
  assert.ok(LT.damage / LT.rate < TOWER_TYPES.cannon.damage / TOWER_TYPES.cannon.rate, 'Einzelziel-Schaden pro Sekunde unter der Kanone');
});

const enemyAt = (s, type, x, y) => { const e = spawnEnemy(s, type); e.x = x; e.y = y; return e; };

test('Fähigkeiten: Zustand startet bereit, neues Spiel setzt zurück', () => {
  const s = createGame();
  assert.deepEqual(Object.keys(s.abilities).sort(), Object.keys(ABILITIES).sort());
  s.lives = 5;
  assert.ok(useAbility(s, 'repair').ok);
  assert.equal(createGame().abilities.repair.uses, 0);
  assert.equal(abilityCooldownLeft(createGame(), 'repair'), 0);
});

test('Fähigkeiten: unbekannte Id, Pause und Spielende werden abgelehnt', () => {
  const s = createGame();
  assert.equal(useAbility(s, 'nix').ok, false);
  s.paused = true;
  assert.equal(useAbility(s, 'freeze').ok, false);
  s.paused = false;
  s.status = 'lost';
  assert.equal(useAbility(s, 'freeze').ok, false);
  assert.equal(s.abilities.freeze.uses, 0);
});

test('Meteor: Radius, Kills und Gold, Abklingzeit und Wiederverwendung', () => {
  const s = createGame();
  const r = ABILITIES.meteor.radius * TILE;
  const near = enemyAt(s, 'runner', 300, 300);
  const far = enemyAt(s, 'runner', 300 + r + 5, 300);
  near.hp = 1;
  const gold = s.gold;
  assert.ok(useAbility(s, 'meteor', 300, 300).ok);
  assert.equal(s.enemies.includes(near), false);
  assert.equal(s.kills, 1);
  assert.equal(s.gold, gold + near.reward);
  assert.equal(far.hp, far.maxHp);
  assert.ok(s.effects.some((f) => f.kind === 'explosion'));
  assert.equal(useAbility(s, 'meteor', 300, 300).ok, false);
  assert.equal(abilityCooldownLeft(s, 'meteor'), ABILITIES.meteor.cooldown);
  s.time += ABILITIES.meteor.cooldown;
  assert.equal(abilityCooldownLeft(s, 'meteor'), 0);
  assert.ok(useAbility(s, 'meteor', 300, 300).ok);
});

test('Meteor: ungültige Koordinaten, Rüstung ignoriert, Fork-Karte', () => {
  const s = createGame({ mapId: 'fork' });
  assert.equal(useAbility(s, 'meteor').ok, false);
  assert.equal(useAbility(s, 'meteor', -5, 10).ok, false);
  assert.equal(useAbility(s, 'meteor', NaN, 10).ok, false);
  assert.equal(s.abilities.meteor.uses, 0);
  const e = enemyAt(s, 'shielded', 100, 100);
  e.hp = 1000;
  const hp = e.hp;
  assert.ok(useAbility(s, 'meteor', 100, 100).ok);
  assert.equal(e.hp, hp - ABILITIES.meteor.damage);
});

test('Kälteschock: verlangsamt alle (auch Boss), stärkeren Slow nicht überschreiben, läuft aus', () => {
  const s = createGame();
  const a = enemyAt(s, 'runner', 10, 10);
  const boss = enemyAt(s, 'boss', 20, 20);
  const strong = enemyAt(s, 'runner', 30, 30);
  strong.slowUntil = s.time + 1;
  strong.slowFactor = 0.1;
  assert.ok(useAbility(s, 'freeze').ok);
  const f = 1 - ABILITIES.freeze.slow;
  for (const e of [a, boss]) { assert.ok(Math.abs(e.slowFactor - f) < 1e-9); assert.equal(e.slowUntil, s.time + ABILITIES.freeze.duration); }
  assert.equal(strong.slowFactor, 0.1);
  assert.equal(strong.slowUntil, s.time + ABILITIES.freeze.duration);
  s.time += ABILITIES.freeze.duration + 0.1;
  assert.equal(s.time < a.slowUntil, false);
});

test('Reparatur: nie über START_LIVES, bei vollen Leben kein Verbrauch, maxUses', () => {
  const s = createGame();
  const res = useAbility(s, 'repair');
  assert.equal(res.ok, false);
  assert.equal(s.abilities.repair.uses, 0);
  s.lives = START_LIVES - 3;
  assert.ok(useAbility(s, 'repair').ok);
  assert.equal(s.lives, START_LIVES - 3 + ABILITIES.repair.heal);
  s.time += ABILITIES.repair.cooldown;
  assert.ok(useAbility(s, 'repair').ok);
  s.time += ABILITIES.repair.cooldown;
  s.lives = 1;
  assert.equal(useAbility(s, 'repair').ok, false);
  assert.match(useAbility(s, 'repair').reason, /aufgebraucht/);
  s.lives = START_LIVES - 1;
  s.abilities.repair.uses = 0;
  useAbility(s, 'repair');
  assert.equal(s.lives, START_LIVES);
});

test('Abklingzeit zählt nur mit laufender Spielzeit (Pause ohne Wirkung)', () => {
  const s = createGame();
  useAbility(s, 'freeze');
  s.paused = true;
  update(s, 10);
  assert.equal(abilityCooldownLeft(s, 'freeze'), ABILITIES.freeze.cooldown);
  s.paused = false;
  update(s, 1);
  assert.ok(Math.abs(abilityCooldownLeft(s, 'freeze') - (ABILITIES.freeze.cooldown - 1)) < 1e-9);
  assert.equal(abilityCooldownLeft(s, 'nix'), 0);
});

test('Fähigkeiten: Config-Texte ohne undefined/NaN, Rendern ohne Fehler (Meteor-Zielmodus, Kälteeffekt)', async () => {
  for (const d of Object.values(ABILITIES)) assert.ok(d.text && !/undefined|NaN/.test(d.text) && d.name && d.key);
  const { render } = await import('../src/render.js');
  const s = createGame();
  s.lives = 5;
  useAbility(s, 'freeze');
  useAbility(s, 'meteor', 200, 200);
  render(mockCtx().ctx, s, { aiming: true, hoverPx: { x: 100, y: 100 }, hover: null });
  render(mockCtx().ctx, s, { aiming: false });
});

test('Faehigkeiten: Prototyp-Ids, ungueltige Meteor-Ziele, Spielende ohne Wiederbelebung', () => {
  const s = createGame();
  for (const id of ['__proto__', 'toString', 'constructor', undefined]) assert.equal(useAbility(s, id, 100, 100).ok, false);
  for (const [x, y] of [[undefined, undefined], [Infinity, 5], [WIDTH + 1, 5], [5, HEIGHT + 1], [null, 5]]) {
    assert.equal(useAbility(s, 'meteor', x, y).ok, false);
  }
  assert.equal(abilityCooldownLeft(s, 'meteor'), 0);
  s.lives = 0; s.status = 'lost';
  assert.equal(useAbility(s, 'repair').ok, false);
  assert.equal(s.lives, 0);
  s.status = 'won';
  assert.equal(useAbility(s, 'freeze').ok, false);
});

// Aus forest-edge.test.js (B-043), seit B-098 mit Hindernissen per Override statt Wald-Karte
test('Hindernisse: canBuild-Reihenfolge Feld, Weg, Hindernis, Turm; overrides ohne obstacles', () => {
  const s = withObstacles();
  assert.match(canBuild(s, -1, 0).reason, /Außerhalb/);
  const [pc, pr] = [...s.blocked].map(k => k.split(',').map(Number)).find(([c, r]) => c >= 0 && r >= 0 && c < COLS && r < ROWS);
  assert.match(canBuild(s, pc, pr).reason, /Weg/);
  const [oc, or] = OBST[0];
  assert.match(canBuild(s, oc, or).reason, /Baum/);
  s.towers.push({ col: oc, row: or });
  assert.match(canBuild(s, oc, or).reason, /Baum/, 'Hindernis vor Turm');
  const g = createGame({ obstacles: undefined });
  assert.equal(canBuild(g, 0, 0).ok, true);
  const h = createGame({ obstacles: new Set() });
  assert.equal(canBuild(h, oc, or).ok, true);
});

test('Eingefrorene Gegner: Slow läuft weiter ab, Heilung wirkt weiter (B-048)', () => {
  const s = createGame();
  const e = spawnEnemy(s, 'grunt', 1);
  e.frozenUntil = s.time + 1;
  e.slowUntil = s.time + 0.3;
  e.slowFactor = 0.5;
  const d0 = e.dist;
  update(s, 0.5);
  assert.equal(e.dist, d0, 'steht');
  assert.ok(s.time >= e.slowUntil, 'Slow ist abgelaufen, obwohl eingefroren');
  const h = spawnEnemy(s, 'healer', 1);
  h.frozenUntil = s.time + 5;
  h.x = e.x; h.y = e.y;
  e.hp = e.maxHp / 2;
  e.frozenUntil = s.time + 5;
  s.healAt = s.time;
  const before = e.hp;
  update(s, 0.01);
  assert.ok(e.hp > before, 'Heilung wirkt auf eingefrorenen Gegner');
});

test('Sniper: unbekannter Gegnertyp ohne Basis-HP crasht nicht, kein Bonus (B-050)', () => {
  const { s, tower, e } = specialSetup('sniper');
  e.type = 'unbekannt';
  fireAndLand(s, tower);
  assert.ok(Math.abs((e.maxHp - e.hp) - TOWER_TYPES.sniper.damage) < 1e-6);
});

test('B-069: heartStates liefert die Herzreihe als Liste (gefüllt/leer), nie negativ, gekappt', async () => {
  const { heartStates } = await import('../src/hud.js');
  assert.deepEqual(heartStates(2, 4), [true, true, false, false]);
  assert.deepEqual(heartStates(-1, 3), [false, false, false]);
  assert.deepEqual(heartStates(9, 3), [true, true, true]);
  assert.deepEqual(heartStates(2.7, 3), [true, true, false]);
  assert.equal(heartStates(START_LIVES).length, START_LIVES);
});

test('B-058: abilityView liefert Zustand, Füllanteil, Abzeichen und zugänglichen Namen', async () => {
  const { abilityView } = await import('../src/hud.js');
  const { ABILITIES } = await import('../src/config.js');
  const m = ABILITIES.meteor;
  assert.deepEqual(abilityView(m, 0, 0), { state: 'ready', fill: 1, badge: '', aria: 'Meteor, bereit' });
  const c = abilityView(m, 1, m.cooldown * 0.25);
  assert.equal(c.state, 'charging');
  assert.ok(Math.abs(c.fill - 0.75) < 1e-9);
  assert.equal(c.aria, `Meteor, lädt noch ${Math.ceil(m.cooldown * 0.25)} s`);
  assert.equal(abilityView(m, 1, m.cooldown).fill, 0, 'frisch ausgelöst = leerer Balken');
  assert.equal(abilityView(m, 1, m.cooldown * 2).fill, 0, 'gekappt nach unten');
  assert.equal(abilityView(m, 1, -3).state, 'ready', 'negative Restzeit = bereit');
  const r = ABILITIES.repair;
  assert.deepEqual(abilityView(r, 0, 0), { state: 'ready', fill: 1, badge: `${r.maxUses}×`, aria: `Notfall-Reparatur, bereit, noch ${r.maxUses} Ladungen` });
  assert.equal(abilityView(r, r.maxUses - 1, 0).aria, 'Notfall-Reparatur, bereit, noch 1 Ladung');
  assert.deepEqual(abilityView(r, r.maxUses, 10), { state: 'used', fill: 0, badge: '', aria: 'Notfall-Reparatur, aufgebraucht' });
  for (const def of Object.values(ABILITIES)) assert.ok(def.short && def.short.length <= 10, `${def.name}: Kurzname vorhanden und kurz`);
});

test('B-058 Randfälle (Tester): abilityView bei Überbuchung, Restzeit knapp über 0, monotoner Balken', async () => {
  const { abilityView } = await import('../src/hud.js');
  const m = ABILITIES.meteor, r = ABILITIES.repair;
  assert.equal(abilityView(r, r.maxUses + 3, 0).state, 'used', 'mehr Einsätze als erlaubt bleibt aufgebraucht');
  assert.equal(abilityView(r, r.maxUses + 3, 0).badge, '');
  assert.equal(abilityView(m, 0, 0.01).aria, 'Meteor, lädt noch 1 s', 'Restzeit wird aufgerundet, nie 0 s');
  assert.equal(abilityView(m, 0, 0.01).state, 'charging');
  let prev = -1;
  for (let left = m.cooldown; left >= 0; left -= m.cooldown / 10) {
    const { fill } = abilityView(m, 1, left);
    assert.ok(fill >= prev && fill >= 0 && fill <= 1, `Füllanteil monoton in [0,1], left=${left}`);
    prev = fill;
  }
  assert.equal(abilityView(m, 0, 0).badge, '', 'unbegrenzte Fähigkeit ohne Abzeichen');
});

test('B-096: abilityView ist robust gegen uses undefined/NaN und Restzeit NaN/undefined', async () => {
  const { abilityView } = await import('../src/hud.js');
  const m = ABILITIES.meteor, r = ABILITIES.repair;
  // uses fehlt -> wie 0 Einsätze, kein "NaN×"
  assert.deepEqual(abilityView(r, undefined, 0), abilityView(r, 0, 0));
  assert.equal(abilityView(r, NaN, 0).badge, `${r.maxUses}×`);
  for (const v of [abilityView(r, undefined, 0), abilityView(m, undefined, 0)]) assert.ok(!/NaN|undefined/.test(v.badge + v.aria));
  // Restzeit ungültig -> nicht bereit, leerer Balken, lesbarer Text
  for (const left of [NaN, undefined]) {
    const v = abilityView(m, 0, left);
    assert.equal(v.state, 'charging', `left=${left}`);
    assert.equal(v.fill, 0, `left=${left}`);
    assert.equal(v.aria, `Meteor, lädt noch ${m.cooldown} s`);
  }
  // aufgebraucht bleibt aufgebraucht, auch mit ungültiger Restzeit
  assert.equal(abilityView(r, r.maxUses, NaN).state, 'used');
});

test('B-069 Randfälle (Tester): heartStates bei 0 Leben, NaN und max 0', async () => {
  const { heartStates, livesText } = await import('../src/hud.js');
  assert.deepEqual(heartStates(0, 3), [false, false, false]);
  assert.deepEqual(heartStates(NaN, 2), [false, false]);
  assert.deepEqual(heartStates(5, 0), []);
  assert.equal(livesText(1, 2), '❤️🖤');
});

// ---------- Wasser (B-104): Fluss und See auf der Wiese ----------
test('B-104: Wasser liegt im Feld, nie auf dem Weg; Brücke liegt auf dem Weg und im Fluss', () => {
  const m = MAPS.meadow;
  const s = createGame({ mapId: 'meadow' });
  assert.ok(s.water.size >= 10, 'Fluss und See vorhanden');
  assert.equal(s.water.size, m.water.length, 'keine Duplikate');
  for (const k of s.water) {
    const [c, r] = k.split(',').map(Number);
    assert.ok(c >= 0 && r >= 0 && c < COLS && r < ROWS, `${k} im Feld`);
    assert.ok(!s.blocked.has(k), `${k} nicht auf dem Weg`);
    assert.ok(!s.obstacles.has(k), `${k} nicht auf einem Hindernis`);
  }
  assert.deepEqual(m.bridges, [[1, 2]]);
  for (const [c, r] of m.bridges) {
    assert.ok(s.blocked.has(`${c},${r}`), 'Brücke auf dem Weg');
    assert.ok(m.river.some(([rc, rr]) => rc === c && rr === r), 'Brücke im Fluss');
    assert.ok(!s.water.has(`${c},${r}`), 'Brücke ist kein Wasser');
  }
  // Fluss ist eine zusammenhängende Kette, Wasser = Fluss + See ohne Brücke
  for (let i = 1; i < m.river.length; i++) assert.equal(Math.abs(m.river[i][0] - m.river[i - 1][0]) + Math.abs(m.river[i][1] - m.river[i - 1][1]), 1);
  assert.equal(s.water.size, m.river.length - m.bridges.length + m.lake.length);
  // andere Karten ohne Wasser
  for (const id of Object.keys(MAPS)) if (id !== 'meadow') assert.equal(createGame({ mapId: id }).water.size, 0, id);
});

test('B-104: canBuild lehnt Wasser ab ("Hier ist Wasser"), kein Gold weg; Gegner laufen über die Brücke', () => {
  const s = createGame({ mapId: 'meadow' });
  for (const k of s.water) {
    const [c, r] = k.split(',').map(Number);
    assert.deepEqual(canBuild(s, c, r), { ok: false, reason: 'Hier ist Wasser' });
  }
  const g0 = s.gold;
  assert.equal(buildTower(s, 'arrow', 0, 4).reason, 'Hier ist Wasser'); // Stil 1: Fluss biegt bei Zeile 4 nach links ab
  assert.equal(s.gold, g0);
  assert.equal(canBuild(s, 1, 2).reason, 'Auf dem Weg kann nicht gebaut werden', 'Brücke ist Weg');
  assert.equal(canBuild(s, 0, 5).ok, true, 'Ufer daneben bebaubar');
  assert.equal(canBuild(createGame({ water: undefined }), 1, 5).ok, true, 'override ohne water');
  const e = spawnEnemy(s, 'grunt', 1);
  run(s, 3);
  assert.ok(e.x > 2 * TILE, 'Goblin hat die Brücke überquert');
});

test('Stil 1: Wiese hat nach dem Umbau von Fluss und See gleich viele Bauplätze wie vorher (226), 13 Wasserkacheln', () => {
  const s = createGame({ mapId: 'meadow' });
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (canBuild(s, c, r).ok) n++;
  assert.equal(n, 226);
  assert.equal(s.water.size, 13);
});

// ---------- B-103/B-104 Randfälle (Tester) ----------
test('B-103/B-104 Randfälle (Tester): canBuild-Reihenfolge Weg > Hindernis > Wasser > Turm; fehlende Sets; unbekannte Karte', () => {
  const s = createGame({ mapId: 'meadow', gold: 1000 });
  const [pc, pr] = [...s.blocked].map((k) => k.split(',').map(Number)).find(([c, r]) => c >= 0 && r >= 0 && c < COLS && r < ROWS); // erste Wegkachel im Feld
  const free = freeTileNearPath(s);
  const fk = `${free.col ?? free[0]},${free.row ?? free[1]}`;
  // Überlappende Overrides: Weg, Hindernis und Wasser auf derselben Kachel
  const o = createGame({ mapId: 'meadow', obstacles: new Set([`${pc},${pr}`, fk]), water: new Set([`${pc},${pr}`, fk]) });
  assert.equal(canBuild(o, pc, pr).reason, 'Auf dem Weg kann nicht gebaut werden');
  const [fc, fr] = fk.split(',').map(Number);
  assert.match(canBuild(o, fc, fr).reason, /Baum|Fels/, 'Hindernis vor Wasser');
  const w = createGame({ mapId: 'meadow', gold: 1000, obstacles: new Set(), water: new Set() });
  assert.equal(buildTower(w, 'arrow', fc, fr).ok, true);
  w.water = new Set([fk]);
  assert.equal(canBuild(w, fc, fr).reason, 'Hier ist Wasser', 'Wasser vor Turm');
  // Fehlende Sets (null/undefined) werfen nicht
  const n = createGame({ mapId: 'meadow', obstacles: null, water: null });
  assert.equal(canBuild(n, 1, 5).ok, true);
  // Unbekannte Karte fällt auf eine gültige Karte mit Sets zurück
  const u = createGame({ mapId: 'gibtsnicht' });
  assert.ok(u.water instanceof Set && u.obstacles instanceof Set);
  // Brücke: auf keiner Karte gleichzeitig Wasser und bebaubar
  for (const [id, m] of Object.entries(MAPS)) for (const [c, r] of m.bridges || []) {
    const g = createGame({ mapId: id });
    assert.ok(!g.water.has(`${c},${r}`) && !canBuild(g, c, r).ok, `${id} Brücke ${c},${r}`);
  }
});

// ---------- Vulkan (B-030): Lava, Lava-Schaden, Überhitzung ----------

const keyOf = ([c, r]) => `${c},${r}`;
const V = MAPS.volcano;

test('B-030 Vulkan: Lava im Feld, nie auf Weg oder Hindernis; Brücke ist Weg im Lavafluss, keine Lava', () => {
  const s = createGame({ mapId: 'volcano' });
  assert.equal(s.lava.size, V.lava.length, 'keine Duplikate');
  assert.equal(s.lava.size, V.lavaRiver.length - V.bridges.length + V.lavaPools.length);
  for (const k of s.lava) {
    const [c, r] = k.split(',').map(Number);
    assert.ok(c >= 0 && r >= 0 && c < COLS && r < ROWS, `${k} im Feld`);
    assert.ok(!s.blocked.has(k), `${k} nicht auf dem Weg`);
    assert.ok(!s.obstacles.has(k), `${k} nicht auf einem Hindernis`);
  }
  // Lavafluss: zusammenhängende Kette von Rand zu Rand, kreuzt den Weg genau an den Brücken (1 bis 2 Mal)
  const river = V.lavaRiver;
  for (let i = 1; i < river.length; i++) assert.equal(Math.abs(river[i][0] - river[i - 1][0]) + Math.abs(river[i][1] - river[i - 1][1]), 1);
  assert.equal(river[0][1], 0);
  assert.equal(river.at(-1)[1], ROWS - 1);
  const crossings = river.filter((t) => s.blocked.has(keyOf(t)));
  assert.deepEqual(crossings, V.bridges);
  assert.ok(V.bridges.length >= 1 && V.bridges.length <= 2);
  for (const b of V.bridges) {
    assert.ok(s.blocked.has(keyOf(b)) && !s.lava.has(keyOf(b)), 'Brücke ist Weg, keine Lava');
    assert.equal(canBuild(s, ...b).reason, 'Auf dem Weg kann nicht gebaut werden');
  }
  // 2 bis 4 Lavatümpel (zusammenhängende Gruppen), jeder direkt neben dem Weg
  const pools = [];
  for (const t of V.lavaPools) {
    const g = pools.find((p) => p.some(([c, r]) => Math.abs(c - t[0]) + Math.abs(r - t[1]) === 1));
    if (g) g.push(t); else pools.push([t]);
  }
  assert.ok(pools.length >= 2 && pools.length <= 4, `${pools.length} Tümpel`);
  for (const p of pools) assert.ok(p.some(([c, r]) => [...s.blocked].some((k) => { const [pc, pr] = k.split(',').map(Number); return Math.max(Math.abs(pc - c), Math.abs(pr - r)) === 1; })), 'Tümpel neben dem Weg');
  // Andere Karten ohne Lava, Vulkan ohne Wasser
  for (const id of Object.keys(MAPS)) if (id !== 'volcano') assert.equal(createGame({ mapId: id }).lava.size, 0, id);
  assert.equal(s.water.size, 0);
});

test('B-030 Vulkan: canBuild lehnt Lava ab ("Hier ist Lava"), kein Gold weg; Nachbarkachel bebaubar', () => {
  const s = createGame({ mapId: 'volcano' });
  for (const k of s.lava) assert.deepEqual(canBuild(s, ...k.split(',').map(Number)), { ok: false, reason: 'Hier ist Lava' });
  const g0 = s.gold;
  assert.equal(buildTower(s, 'arrow', 4, 6).reason, 'Hier ist Lava');
  assert.equal(s.gold, g0);
  assert.equal(canBuild(s, 5, 6).ok, true);
  assert.equal(canBuild(createGame({ mapId: 'volcano', lava: undefined }), 4, 6).ok, true, 'override ohne lava');
});

test('B-030 nearLava: 8er-Nachbarschaft, die Lavakachel selbst zählt nicht, fehlendes Set ist false', () => {
  const lava = new Set(['5,5']);
  for (const [c, r] of [[4, 4], [5, 4], [6, 6], [4, 5]]) assert.equal(nearLava(lava, c, r), true, `${c},${r}`);
  for (const [c, r] of [[5, 5], [7, 5], [3, 3], [5, 7]]) assert.equal(nearLava(lava, c, r), false, `${c},${r}`);
  assert.equal(nearLava(null, 4, 4), false);
  assert.equal(nearLava(new Set(), 4, 4), false);
});

// Gegner steht still auf einer Kachel (Mitte); liefert verlorene HP nach t Sekunden mit Zeitschritt dt.
function lavaBurn(type, col, row, t, dt, wave = 1) {
  const s = createGame({ mapId: 'volcano' });
  s.wave = wave;
  const e = spawnEnemy(s, type, wave);
  e.speed = 0;
  e.hp = e.maxHp = 1e6;
  s.paths = [buildPath([[col, row], [col + 1, row]], TILE)]; // Weg beginnt in der Kachelmitte
  e.dist = 0;
  run(s, t, dt);
  return { lost: 1e6 - e.hp, s, e };
}

test('B-030 Lava-Schaden: Gegner auf Wegkachel neben Lava verliert dps * hpScale pro Sekunde, dt-unabhängig, auch Boss; Rüstung zählt nicht', () => {
  const hot = [10, 8]; // Wegkachel neben dem Lavatümpel [9, 8]
  const cold = [6, 2]; // Wegkachel weit weg von Lava
  const s = createGame({ mapId: 'volcano' });
  assert.ok(s.blocked.has(keyOf(hot)) && nearLava(s.lava, ...hot));
  assert.ok(s.blocked.has(keyOf(cold)) && !nearLava(s.lava, ...cold));
  const a = lavaBurn('grunt', ...hot, 1, 1 / 30);
  const b = lavaBurn('grunt', ...hot, 1, 1 / 60);
  assert.ok(Math.abs(a.lost - LAVA.dps) < LAVA.dps * 0.05, `1/30: ${a.lost}`);
  assert.ok(Math.abs(a.lost - b.lost) < LAVA.dps * 0.05, `dt-unabhängig: ${a.lost} vs ${b.lost}`);
  assert.equal(lavaBurn('grunt', ...cold, 1, 1 / 60).lost, 0, 'weiter weg kein Schaden');
  // Skaliert mit der Welle, trifft Boss und Schildträger (Rüstung wirkt nur bei Direkttreffern) voll
  const w10 = lavaBurn('boss', ...hot, 1, 1 / 60, 10).lost;
  assert.ok(Math.abs(w10 - LAVA.dps * hpScale(10)) < LAVA.dps * hpScale(10) * 0.05, `Boss Welle 10: ${w10}`);
  const sh = lavaBurn('shielded', ...hot, 1, 1 / 60).lost;
  assert.ok(Math.abs(sh - b.lost) < 1e-6, 'Schildträger voller Schaden');
  // Andere Karten: kein Lava-Schaden
  const m = createGame({ mapId: 'meadow' });
  const e = spawnEnemy(m, 'grunt', 1);
  run(m, 2);
  assert.equal(e.hp, e.maxHp);
});

test('B-030 Lava-Schaden: Tod durch Lava bringt die normale Belohnung und zählt als Abschuss', () => {
  const { s, e } = lavaBurn('grunt', 10, 8, 0.01, 1 / 60);
  e.hp = 0.01;
  const g0 = s.gold;
  run(s, 0.1);
  assert.equal(s.enemies.length, 0);
  assert.equal(s.gold, g0 + ENEMY_TYPES.grunt.reward);
  assert.equal(s.kills, 1);
});

test('B-030 Überhitzung: Turm neben Lava schießt mit LAVA.overheat-fachem Intervall, sonst unverändert', () => {
  const s = createGame({ mapId: 'volcano', gold: 1e6 });
  const hot = buildTower(s, 'cannon', 11, 8).tower; // neben dem Lavafluss
  const cool = buildTower(s, 'cannon', 6, 6).tower;
  assert.equal(hot.overheated, true);
  assert.equal(cool.overheated, false);
  assert.ok(LAVA.overheat > 1);
  const rh = towerStats(hot, s.modifiers).rate;
  const rc = towerStats(cool, s.modifiers).rate;
  assert.ok(Math.abs(rc - TOWER_TYPES.cannon.rate) < 1e-9);
  assert.ok(Math.abs(rh - TOWER_TYPES.cannon.rate * LAVA.overheat) < 1e-9);
  // gilt für alle Turmtypen und jede Stufe; im Spiel: Schuss setzt die Abklingzeit auf das längere Intervall
  for (const type of Object.keys(TOWER_TYPES)) {
    for (const level of [1, 3]) {
      const t = { type, level, overheated: true };
      assert.ok(Math.abs(towerStats(t).rate - towerStats({ type, level }).rate * LAVA.overheat) < 1e-9, `${type} ${level}`);
    }
  }
  s.paths = [buildPath([[11, 9], [11, 10]], TILE)]; // Gegner steht direkt unter dem überhitzten Turm
  const e = spawnEnemy(s, 'tank', 1);
  e.speed = 0; e.hp = e.maxHp = 1e9;
  update(s, 1 / 60);
  assert.ok(Math.abs(hot.cooldown - rh) < 1e-9, `Abklingzeit ${hot.cooldown}`);
  // Auf anderen Karten überhitzt nichts
  const m = createGame({ mapId: 'meadow', gold: 1e6 });
  const [c, r] = freeTileNearPath(m);
  assert.equal(buildTower(m, 'arrow', c, r).tower.overheated, false);
});

test('B-030 Vulkan: Wege gültig (Eingang links, Ausgang rechts), Modifikator schnellere Gegner, Freischaltung nach Zwei Fronten', async () => {
  const w = V.waypoints;
  assert.ok(w[0][0] < 0 && w.at(-1)[0] >= COLS, 'links rein, rechts raus');
  assert.equal(V.name, 'Vulkan');
  assert.deepEqual(V.modifiers, { enemySpeed: 1.15 });
  const { MAP_ORDER } = await import('../src/progress.js');
  assert.equal(MAP_ORDER[MAP_ORDER.indexOf('twin') + 1], 'volcano');
});

test('B-030 hotPath: genau die Wegkacheln neben Lava, einmal in createGame; ohne Lava leer', () => {
  const s = createGame({ mapId: 'volcano' });
  const expected = [...s.blocked].filter((k) => nearLava(s.lava, ...k.split(',').map(Number)));
  assert.deepEqual([...s.hotPath].sort(), expected.sort());
  assert.ok(s.hotPath.has('10,8') && !s.hotPath.has('6,2'));
  for (const k of s.hotPath) assert.ok(s.blocked.has(k) && !s.lava.has(k));
  for (const id of Object.keys(MAPS)) if (id !== 'volcano') assert.equal(createGame({ mapId: id }).hotPath.size, 0, id);
  assert.equal(createGame({ mapId: 'volcano', lava: undefined }).hotPath.size, 0, 'override ohne Lava');
});

test('B-030 HUD: overheatNote nennt die Überhitzung nur für überhitzte Türme', async () => {
  const { overheatNote, OVERHEAT_NOTE } = await import('../src/hud.js');
  assert.equal(OVERHEAT_NOTE, 'Überhitzt: schießt langsamer');
  const s = createGame({ mapId: 'volcano', gold: 1e6 });
  assert.equal(overheatNote(buildTower(s, 'arrow', 11, 8).tower), OVERHEAT_NOTE);
  assert.equal(overheatNote(buildTower(s, 'arrow', 6, 6).tower), '');
  assert.equal(overheatNote(null), '');
});

// ---------- B-030 Randfälle (Tester) ----------
test('B-030 Randfall (Tester): Brücke liegt zwischen Lava, Gegner auf der Brücke und davor/danach brennt', () => {
  const s = createGame({ mapId: 'volcano' });
  for (const b of V.bridges) {
    assert.ok(nearLava(s.lava, ...b), 'Brücke grenzt an Lava');
    assert.ok(lavaBurn('grunt', ...b, 1, 1 / 60).lost > 0, 'Schaden auf der Brücke');
    assert.ok(lavaBurn('grunt', b[0] - 1, b[1], 1, 1 / 60).lost > 0, 'Schaden vor der Brücke');
  }
});

test('B-030 Randfall (Tester): Lava-Schaden bei Tempo x3 gleich, in der Pause und nach Spielende keiner', () => {
  const mk = () => {
    const s = createGame({ mapId: 'volcano' });
    s.wave = 1;
    const e = spawnEnemy(s, 'grunt', 1);
    e.speed = 0; e.hp = e.maxHp = 1e6;
    s.paths = [buildPath([[10, 8], [11, 8]], TILE)];
    e.dist = 0;
    return { s, e };
  };
  const a = mk(), b = mk();
  for (let i = 0; i < 60; i++) stepGame(a.s, 1 / 60, 1);
  for (let i = 0; i < 20; i++) stepGame(b.s, 1 / 60, 3);
  assert.ok(Math.abs((1e6 - a.e.hp) - (1e6 - b.e.hp)) < LAVA.dps * 0.05, `x1 ${1e6 - a.e.hp} vs x3 ${1e6 - b.e.hp}`);
  const p = mk();
  togglePause(p.s);
  stepGame(p.s, 1, 1);
  assert.equal(p.e.hp, 1e6, 'Pause: kein Schaden');
  const l = mk();
  l.s.status = 'lost';
  stepGame(l.s, 1, 1);
  assert.equal(l.e.hp, 1e6, 'nach Spielende kein Schaden');
});

test('B-030 Randfall (Tester): Überhitzung bleibt beim Upgrade, Verkauf unverändert, Neubau am Platz entscheidet neu', () => {
  const s = createGame({ mapId: 'volcano', gold: 1e6 });
  const hot = buildTower(s, 'cannon', 11, 8).tower;
  upgradeTower(s, hot.id);
  upgradeTower(s, hot.id);
  assert.equal(hot.overheated, true, 'nach Upgrade weiter überhitzt');
  assert.ok(Math.abs(towerStats(hot, s.modifiers).rate - towerStats({ type: 'cannon', level: hot.level }, s.modifiers).rate * LAVA.overheat) < 1e-9);
  const cool = buildTower(s, 'cannon', 6, 6).tower;
  upgradeTower(s, cool.id); upgradeTower(s, cool.id);
  assert.equal(sellValue(hot), sellValue(cool), 'Verkaufswert unabhängig von Überhitzung');
  // Turmtausch: verkaufen und anderen Typ an derselben Stelle bauen
  assert.equal(sellTower(s, hot.id).ok, true);
  const swapped = buildTower(s, 'arrow', 11, 8).tower;
  assert.equal(swapped.overheated, true, 'neuer Turm neben Lava wieder überhitzt');
  assert.equal(swapped.level, 1);
  assert.equal(sellTower(s, cool.id).ok, true);
  assert.equal(buildTower(s, 'frost', 6, 6).tower.overheated, false, 'Neubau weg von Lava normal');
});

// ---------- B-112: Meteor stärker, wächst mit der Welle ----------

test('B-112 Meteor: Schaden wächst mit hpScale(Welle), Welle 0 zählt als 1, Rüstung zählt nicht', () => {
  for (const w of [1, 5, 10, 20]) {
    const s = createGame();
    s.wave = w;
    const e = enemyAt(s, 'shielded', 300, 300);
    e.hp = 1e6;
    assert.ok(useAbility(s, 'meteor', 300, 300).ok);
    const dealt = 1e6 - e.hp;
    assert.ok(Math.abs(dealt - ABILITIES.meteor.damage * hpScale(w)) < 1e-6, `Welle ${w}: ${dealt}`);
    assert.ok(Math.abs(dealt - meteorDamage(w)) < 1e-6);
  }
  assert.equal(meteorDamage(0), meteorDamage(1));
  assert.ok(meteorDamage(20) > meteorDamage(10) && meteorDamage(10) > meteorDamage(5) && meteorDamage(5) > meteorDamage(1));
});

test('B-112 Meteor: Radius 2,5 Kacheln, Schaden fällt zum Rand linear auf edge ab, außerhalb nichts', () => {
  const s = createGame();
  s.wave = 7;
  const r = ABILITIES.meteor.radius * TILE;
  assert.ok(ABILITIES.meteor.radius >= 2.5, 'Reichweite gewachsen (alt 1,8)');
  const mk = (dx) => { const e = enemyAt(s, 'tank', 400 + dx, 300); e.hp = 1e6; return e; };
  const mid = mk(0);
  const half = mk(r / 2);
  const edge = mk(r - 0.01);
  const out = mk(r + 1);
  useAbility(s, 'meteor', 400, 300);
  const near = (a, b) => Math.abs(a - b) < 0.05;
  assert.ok(near(1e6 - mid.hp, meteorDamage(7)));
  assert.ok(near(1e6 - half.hp, meteorDamage(7) * (1 + ABILITIES.meteor.edge) / 2));
  assert.ok(near(1e6 - edge.hp, meteorDamage(7) * ABILITIES.meteor.edge), `${1e6 - edge.hp}`);
  assert.equal(out.hp, 1e6);
  assert.ok(meteorDamage(7, 5) === meteorDamage(7, 1) && meteorDamage(7, -1) === meteorDamage(7, 0), 'frac begrenzt');
});

test('B-112 Meteor: tötet in jeder Welle Goblin, Flitzer, Schamane und Schildträger (auch am Rand), Troll stark verletzt, Boss 20-30 %', () => {
  for (let w = 1; w <= MAX_WAVES; w++) {
    const s = createGame();
    s.wave = w;
    const r = ABILITIES.meteor.radius * TILE;
    const weak = ['grunt', 'runner', 'healer', 'shielded'].map((t, i) => enemyAt(s, t, 400 + (i % 2 ? r - 1 : 0), 300));
    const troll = enemyAt(s, 'tank', 400, 300);
    const boss = enemyAt(s, 'boss', 400, 300);
    for (const e of [...weak, troll, boss]) e.hp = e.maxHp = ENEMY_TYPES[e.type].hp * hpScale(w);
    useAbility(s, 'meteor', 400, 300);
    for (const e of weak) assert.ok(!s.enemies.includes(e), `Welle ${w}: ${e.type} überlebt`);
    const tLoss = 1 - troll.hp / troll.maxHp;
    const bLoss = 1 - boss.hp / boss.maxHp;
    assert.ok(tLoss >= 0.5 && tLoss < 1, `Welle ${w}: Troll ${tLoss}`);
    assert.ok(bLoss >= 0.2 && bLoss <= 0.3, `Welle ${w}: Boss ${bLoss}`);
  }
});

test('B-112 Meteor: Effekt lebt Anflug + Einschlag + Krater, altert nur mit Spielzeit und verschwindet (dt 1/30, 1/60)', () => {
  const M = FX_STYLE.meteor;
  assert.ok(M.flight <= 0.3, 'Schaden fällt sofort, Anflug darum kurz');
  assert.ok(M.flight + M.blast >= 0.9 && M.flight + M.blast <= 1.2, 'Ablauf bis zum Krater ca. 1 s');
  assert.equal(meteorLife(), M.flight + M.blast + M.crater);
  for (const dt of [1 / 30, 1 / 60]) {
    const s = createGame();
    useAbility(s, 'meteor', 300, 300);
    const fx = s.effects.find((f) => f.meteor);
    assert.equal(fx.kind, 'explosion');
    assert.equal(fx.ttl, meteorLife());
    s.paused = true;
    update(s, 10);
    assert.equal(fx.ttl, meteorLife(), 'Pause altert nicht');
    s.paused = false;
    run(s, meteorLife() - 0.2, dt);
    assert.ok(s.effects.includes(fx), `dt=${dt}: Krater noch da`);
    run(s, 0.3, dt);
    assert.ok(!s.effects.includes(fx), `dt=${dt}: Krater verschwunden`);
  }
});

test('B-112 Meteor: Beschreibung nennt den aktuellen Schaden der Welle', () => {
  assert.match(ABILITIES.meteor.text, /250/);
  assert.match(meteorText(10), new RegExp(String(Math.round(meteorDamage(10)))));
  assert.match(meteorText(0), new RegExp(`Mitte.*wächst mit der Welle.*2,5 Kacheln.*${ABILITIES.meteor.cooldown} s`));
  for (const w of [0, 1, 20]) assert.ok(!/undefined|NaN/.test(meteorText(w)));
});

// ---------- B-112 Tester: Randfälle ----------
test('B-112 Tester: Gegner genau auf dem Rand wird getroffen (edge-Schaden), Krater blockiert das Wellenende nicht', () => {
  const s = createGame();
  s.wave = 3;
  const r = ABILITIES.meteor.radius * TILE;
  const e = enemyAt(s, 'tank', 300 + r, 300);
  e.hp = 1e6;
  assert.ok(useAbility(s, 'meteor', 300, 300).ok);
  assert.ok(Math.abs(1e6 - e.hp - meteorDamage(3) * ABILITIES.meteor.edge) < 1e-6);
  // Welle läuft, Krater liegt noch: ohne Gegner und Warteschlange endet die Welle trotzdem sofort
  s.enemies.length = 0;
  s.spawnQueue = [];
  s.waveActive = true;
  update(s, 0.05);
  assert.equal(s.waveActive, false, 'Krater-Effekt hält die Welle nicht offen');
  assert.ok(s.effects.some((f) => f.meteor), 'Krater lebt weiter, nur Darstellung');
  assert.ok(Number.isFinite(meteorDamage(undefined)) && meteorDamage(NaN, NaN) === meteorDamage(1, 0));
});

// ---------- B-005: Vorzeitiger Wellenstart ----------

// Läuft, bis alle Gegner der laufenden Welle gespawnt sind (Frühstart ist erst dann erlaubt). Leben hoch, damit nichts endet.
function spawnAll(s, dt = 1 / 60) {
  s.lives = 1e9;
  for (let k = 0; k < Math.round(600 / dt) && s.spawnQueue.length; k++) update(s, dt);
  assert.equal(s.spawnQueue.length, 0);
}

test('B-005: Frühstart vor vollständigem Spawn der laufenden Welle wird abgelehnt (kein Gold, keine Welle)', () => {
  const s = createGame();
  startWave(s);
  run(s, 1);
  const gold = s.gold;
  const res = startWave(s);
  assert.equal(res.ok, false);
  assert.match(res.reason, /kommen noch/);
  assert.equal(s.gold, gold);
  assert.equal(s.wave, 1);
  spawnAll(s);
  assert.ok(startWave(s).ok, 'nach leerer Spawn-Liste erlaubt');
  assert.equal(s.wave, 2);
});

test('B-005/B-123: Frühstart-Bonus = floor(waveBonus * EARLY_START_MAX * Risiko), nur während einer Welle, mit Münz-Text', () => {
  assert.equal(EARLY_START_MAX, 3);
  const s = createGame();
  const gold = s.gold;
  const first = startWave(s);
  assert.equal(first.bonus, 0, 'ohne laufende Welle kein Bonus');
  assert.equal(s.gold, gold);
  spawnAll(s);
  const before = s.gold;
  const coins = s.effects.filter((e) => e.kind === 'coin').length;
  const risk = earlyStartRisk(s);
  assert.ok(risk > 0.5, `direkt nach dem Spawn ist die Welle fast vollständig auf dem Feld (${risk})`);
  const res = startWave(s);
  assert.ok(res.ok);
  assert.equal(res.wave, 2);
  assert.equal(res.bonus, earlyStartBonus(2, risk));
  assert.equal(res.bonus, Math.floor(waveBonus(2) * EARLY_START_MAX * risk));
  // sofort: Frühstart-Bonus der neuen Welle + normaler Wellenbonus der laufenden Welle
  assert.equal(s.gold, before + res.bonus + waveBonus(1));
  const fx = s.effects.filter((e) => e.kind === 'coin');
  assert.equal(fx.length, coins + 1);
  assert.equal(fx.at(-1).text, `+${res.bonus}`);
});

test('B-005: Jede Welle zahlt ihren Wellenbonus genau einmal', () => {
  const s = createGame();
  const gold = s.gold;
  startWave(s);
  s.spawnQueue = [];
  assert.ok(startWave(s).ok);
  s.spawnQueue = [];
  assert.ok(startWave(s).ok);
  // Leeres Feld: kein Risiko, also kein Frühstart-Bonus (B-123)
  const early = earlyStartBonus(2, 0) + earlyStartBonus(3, 0);
  assert.equal(early, 0);
  assert.equal(s.gold, gold + early + waveBonus(1) + waveBonus(2));
  s.spawnQueue = [];
  s.enemies = [];
  update(s, 0.016);
  assert.equal(s.waveActive, false);
  assert.equal(s.gold, gold + early + waveBonus(1) + waveBonus(2) + waveBonus(3));
  update(s, 0.016);
  assert.equal(s.gold, gold + early + waveBonus(1) + waveBonus(2) + waveBonus(3), 'nicht doppelt');
});

test('B-005: Zwei Wellen parallel spawnen relativ zum Start ihrer Welle, Gegner behalten die HP ihrer Welle', () => {
  const s = createGame();
  startWave(s);
  const seen = [];
  const dt = 1 / 120;
  spawnAll(s, dt);
  const already = s.enemies.length + s.kills;
  const old = s.enemies.map((e) => [e, e.maxHp]);
  assert.ok(startWave(s).ok);
  const w1 = waveFor(1).filter((e) => e.at > s.waveTime);
  const w2 = waveFor(2);
  const tStart = s.waveTime;
  const ids = new Set(s.enemies.map((e) => e.id));
  for (let k = 0; k < 120 * 60 && s.spawnQueue.length; k++) {
    update(s, dt);
    for (const e of s.enemies) {
      if (ids.has(e.id)) continue;
      ids.add(e.id);
      seen.push({ time: s.waveTime, type: e.type, maxHp: e.maxHp });
    }
  }
  assert.ok(already > 0);
  assert.equal(seen.length, w1.length + w2.length);
  const hp = (type, w) => Math.round(ENEMY_TYPES[type].hp * hpScale(w));
  // Erwartete Spawns beider Wellen, nach Zeit sortiert (Welle 1 absolut, Welle 2 ab ihrem Start)
  const expected = [
    ...w1.map((e) => ({ at: e.at, type: e.type, maxHp: hp(e.type, 1) })),
    ...w2.map((e) => ({ at: tStart + e.at, type: e.type, maxHp: hp(e.type, 2) })),
  ].sort((a, b) => a.at - b.at);
  const bySpawn = (list) => list.map((e) => `${e.type}:${e.maxHp}`).sort();
  assert.deepEqual(bySpawn(seen), bySpawn(expected));
  for (const e of expected) {
    const hit = seen.find((x) => x.type === e.type && x.maxHp === e.maxHp && Math.abs(x.time - e.at) <= dt + 1e-9);
    assert.ok(hit, `Spawn ${e.type} (HP ${e.maxHp}) bei ${e.at.toFixed(2)} s`);
  }
  assert.ok(hp('grunt', 2) > hp('grunt', 1), 'Welle 2 ist zäher');
  for (const [e, maxHp] of old) assert.equal(e.maxHp, maxHp, 'Gegner der Welle 1 unverändert');
  assert.ok(old.some(([e]) => s.enemies.includes(e)), 'Welle 1 lief parallel weiter');
});

test('B-005: Gegner einer früheren Welle behalten ihre HP-Skalierung, auch nach späterem Start', () => {
  const s = createGame({ wave: 4 });
  startWave(s); // Welle 5
  s.spawnQueue = [];
  assert.ok(startWave(s).ok); // Welle 6 vorzeitig
  // Ein Eintrag trägt seine Wellennummer: spawnStep nutzt sie statt state.wave
  s.spawnQueue = [{ type: 'grunt', at: s.waveTime + 1, wave: 5 }];
  run(s, 2);
  const g = s.enemies.find((e) => e.type === 'grunt');
  assert.ok(g);
  assert.equal(g.maxHp, Math.round(ENEMY_TYPES.grunt.hp * hpScale(5)));
});

test("B-005: 'won' erst, wenn alle Wellen gespawnt und alle Gegner besiegt sind; kein Start über MAX_WAVES", () => {
  const s = createGame({ wave: MAX_WAVES - 2 });
  startWave(s);
  s.spawnQueue = [];
  assert.ok(startWave(s).ok, 'letzte Welle vorzeitig');
  assert.equal(s.wave, MAX_WAVES);
  assert.equal(startWave(s).ok, false, 'keine Welle über MAX_WAVES');
  // Spawn-Liste leer, aber noch Gegner da: nicht gewonnen
  s.spawnQueue = [];
  spawnEnemy(s, 'grunt', MAX_WAVES - 1);
  update(s, 0.016);
  assert.equal(s.status, 'playing');
  // Gegner weg, aber noch ein Eintrag der vorletzten Welle in der Liste: nicht gewonnen
  s.enemies = [];
  s.spawnQueue = [{ type: 'grunt', at: s.waveTime + 100, wave: MAX_WAVES - 1 }];
  update(s, 0.016);
  assert.equal(s.status, 'playing');
  s.spawnQueue = [];
  update(s, 0.016);
  assert.equal(s.status, 'won');
});

test('B-005: HUD-Knopf während der Welle erst nach vollständigem Spawn bedienbar, zeigt dann den Frühstart-Bonus', () => {
  const s = createGame();
  assert.deepEqual(startButtonView(s), { disabled: false, label: 'Welle 1 starten', showKey: true });
  startWave(s);
  assert.deepEqual(startButtonView(s), { disabled: true, label: 'Welle läuft…', showKey: false });
  s.spawnQueue = [];
  assert.deepEqual(startButtonView(s), { disabled: false, label: 'Nächste Welle +0', showKey: true }, 'leeres Feld: kein Bonus');
  spawnEnemy(s, 'tank');
  const preview = earlyStartPreview(s);
  assert.ok(preview > 0);
  assert.equal(preview, earlyStartBonus(2, earlyStartRisk(s)));
  assert.deepEqual(startButtonView(s), { disabled: false, label: `Nächste Welle +${preview}`, showKey: true });
  const last = createGame({ wave: MAX_WAVES - 1 });
  startWave(last);
  assert.deepEqual(startButtonView(last), { disabled: true, label: 'Letzte Welle läuft…', showKey: false });
  last.status = 'lost';
  last.waveActive = false;
  assert.equal(startButtonView(last).disabled, true);
});

// ---------- B-005: Randfälle (Tester) ----------

test('B-005 Rand: Frühstart bei Status lost und won abgelehnt, kein Gold', () => {
  const s = createGame();
  startWave(s);
  s.status = 'lost';
  const g = s.gold;
  assert.equal(startWave(s).ok, false);
  assert.equal(s.gold, g);
  assert.equal(s.wave, 1);
  assert.equal(startButtonView(s).disabled, true);
});

test('B-005 Rand: Frühstart in der Pause ist möglich, Spawns warten auf das Ende der Pause', () => {
  const s = createGame();
  startWave(s);
  spawnAll(s);
  togglePause(s);
  const n = s.enemies.length;
  assert.ok(startWave(s).ok);
  run(s, 5);
  assert.equal(s.enemies.length, n, 'in der Pause kein Spawn');
  togglePause(s);
  run(s, 0.1);
  assert.ok(s.enemies.length > n);
});

test('B-005 Rand: direkter zweiter Start abgelehnt; frühestmöglicher Frühstart bis 20 spawnt alles genau einmal, won erst am Ende', () => {
  const s = createGame();
  const gold0 = s.gold;
  startWave(s);
  const g = s.gold;
  assert.equal(startWave(s).ok, false, 'direkter zweiter Start abgelehnt');
  assert.equal(s.gold, g, 'kein Gold beim abgelehnten Start');
  assert.equal(s.wave, 1);
  let expected = 0;
  for (let w = 1; w <= MAX_WAVES; w++) expected += waveFor(w).length;
  // Jeweils frühestmöglich rufen, nie Leben verlieren, Gegner nie töten (keine Türme, also kein Kill-Gold)
  s.lives = 1e9;
  let spawned = 0, summoned = 0, bonus = 0, earlyBonuses = 0;
  const seen = new Set();
  for (let i = 0; i < 60 * 2000 && s.status === 'playing'; i++) {
    if (s.waveActive && !s.spawnQueue.length && s.wave < MAX_WAVES) {
      earlyBonuses += earlyStartPreview(s);
      const r = startWave(s);
      assert.ok(r.ok, `Frühstart Welle ${s.wave + 1}`);
      bonus += r.bonus;
    } else if (s.wave < MAX_WAVES) assert.equal(startWave(s).ok, false);
    if (s.spawnQueue.length || s.enemies.length) assert.equal(s.status, 'playing');
    update(s, 1 / 60);
    for (const e of s.enemies) if (!seen.has(e)) { seen.add(e); if (e.summoned) summoned++; else spawned++; }
  }
  assert.equal(s.wave, MAX_WAVES);
  assert.equal(spawned, expected, 'jeder Gegner genau einmal');
  assert.ok(summoned > 0, 'B-127: Nekromantinnen beschwören Skelette (zählen nicht zur Spawn-Liste)');
  assert.equal(s.status, 'won');
  let waveBonuses = 0;
  for (let w = 1; w <= MAX_WAVES; w++) waveBonuses += waveBonus(w);
  assert.ok(earlyBonuses > 0);
  assert.equal(bonus, earlyBonuses);
  assert.equal(s.gold, gold0 + waveBonuses + earlyBonuses, 'jeder Wellenbonus genau einmal');
});

test('B-005 Rand: Frühstart 19 -> 20, won nicht, solange Gegner von Welle 19 leben', () => {
  const s = createGame();
  s.wave = 18;
  startWave(s);
  spawnAll(s);
  assert.ok(startWave(s).ok);
  assert.equal(s.wave, 20);
  s.spawnQueue = [];
  const g = s.gold;
  update(s, 0.016);
  assert.ok(s.enemies.length > 0);
  assert.equal(s.status, 'playing');
  s.enemies = [];
  update(s, 0.016);
  assert.equal(s.status, 'won');
  assert.equal(s.gold, g + waveBonus(20));
});

// ---------- B-121: Nächste Welle startet automatisch ----------

// Beendet die laufende Welle sofort (keine Gegner mehr) und lässt waveEndCheck laufen.
function finishWave(s) {
  s.spawnQueue = [];
  s.enemies = [];
  update(s, 1 / 60);
}

test('B-121: kein Countdown vor Welle 1', () => {
  const s = createGame();
  assert.equal(s.autoWaveIn, null);
  run(s, AUTO_WAVE_DELAY * 3);
  assert.equal(s.wave, 0);
  assert.equal(s.waveActive, false);
});

test('B-121: nach Wellenende startet die nächste Welle nach AUTO_WAVE_DELAY Sekunden, nicht früher', () => {
  const s = createGame();
  startWave(s);
  finishWave(s);
  assert.equal(s.waveActive, false);
  assert.equal(s.autoWaveIn, AUTO_WAVE_DELAY);
  run(s, AUTO_WAVE_DELAY - 0.1);
  assert.equal(s.wave, 1, 'vor Ablauf kein Start');
  run(s, 0.2);
  assert.equal(s.wave, 2);
  assert.equal(s.waveActive, true);
  assert.equal(s.autoWaveIn, null);
});

test('B-121: Spieltempo gilt für den Countdown (stepGame mit speed)', () => {
  const s = createGame();
  startWave(s);
  finishWave(s);
  for (let i = 0; i < Math.ceil(AUTO_WAVE_DELAY / 2 * 60) + 1; i++) stepGame(s, 1 / 60, 2);
  assert.equal(s.wave, 2);
});

test('B-121: Pause hält den Countdown an', () => {
  const s = createGame();
  startWave(s);
  finishWave(s);
  togglePause(s);
  run(s, AUTO_WAVE_DELAY * 2);
  assert.equal(s.wave, 1);
  assert.equal(s.autoWaveIn, AUTO_WAVE_DELAY);
  togglePause(s);
  run(s, AUTO_WAVE_DELAY + 0.1);
  assert.equal(s.wave, 2);
});

test('B-121: manueller Start im Countdown startet sofort ohne Frühstart-Bonus und beendet den Countdown', () => {
  const s = createGame();
  startWave(s);
  finishWave(s);
  run(s, 1);
  const g = s.gold;
  const r = startWave(s);
  assert.ok(r.ok);
  assert.equal(r.bonus, 0);
  assert.equal(s.gold, g);
  assert.equal(s.wave, 2);
  assert.equal(s.autoWaveIn, null);
  run(s, AUTO_WAVE_DELAY + 1);
  assert.equal(s.wave, 2, 'kein zusätzlicher Auto-Start');
});

test('B-121: Frühstart während laufender Welle bleibt unverändert und setzt keinen Countdown', () => {
  const s = createGame();
  startWave(s);
  s.spawnQueue = [];
  const expected = earlyStartPreview(s);
  const r = startWave(s);
  assert.ok(r.ok);
  assert.equal(r.bonus, expected);
  assert.equal(s.autoWaveIn, null);
});

test('B-121: kein Countdown nach Welle 20 (Sieg) und nach Niederlage', () => {
  const s = createGame({ wave: MAX_WAVES - 1 });
  startWave(s);
  finishWave(s);
  assert.equal(s.status, 'won');
  assert.equal(s.autoWaveIn, null);
  const l = createGame();
  startWave(l);
  spawnEnemy(l, 'boss');
  l.lives = 1;
  l.spawnQueue = [];
  run(l, 120);
  assert.equal(l.status, 'lost');
  assert.equal(l.autoWaveIn, null);
  assert.equal(l.wave, 1);
});

test('B-121: HUD-Knopf zeigt den Countdown (aufgerundet) und bleibt bedienbar', () => {
  const s = createGame();
  startWave(s);
  finishWave(s);
  assert.deepEqual(startButtonView(s), { disabled: false, label: `Welle 2 in ${AUTO_WAVE_DELAY}…`, showKey: true });
  s.autoWaveIn = 2.3;
  assert.equal(startButtonView(s).label, 'Welle 2 in 3…');
  s.autoWaveIn = 0.2;
  assert.equal(startButtonView(s).label, 'Welle 2 in 1…');
  s.status = 'lost';
  assert.equal(startButtonView(s).disabled, true);
});

// ---------- B-121: Tester-Randfälle ----------

test('B-121 Rand: Tempo x3 läuft den Countdown dreimal so schnell ab', () => {
  const s = createGame();
  startWave(s);
  finishWave(s);
  const frames = Math.floor(AUTO_WAVE_DELAY / 3 * 60);
  for (let i = 0; i < frames - 2; i++) stepGame(s, 1 / 60, 3);
  assert.equal(s.wave, 1, 'nicht zu früh');
  for (let i = 0; i < 4; i++) stepGame(s, 1 / 60, 3);
  assert.equal(s.wave, 2);
});

test('B-121 Rand: Status lost während Countdown startet nichts, startWave lehnt ab', () => {
  const s = createGame();
  startWave(s);
  finishWave(s);
  s.status = 'lost';
  run(s, AUTO_WAVE_DELAY * 2);
  assert.equal(s.wave, 1);
  assert.equal(startWave(s).ok, false);
});

test('B-121 Rand: kein Lebensverlust und keine Gegner während des Countdowns', () => {
  const s = createGame();
  startWave(s);
  finishWave(s);
  const lives = s.lives;
  run(s, AUTO_WAVE_DELAY - 0.1);
  assert.equal(s.lives, lives);
  assert.equal(s.enemies.length, 0);
});

test('B-121 Rand: Countdown nach Welle 19 startet Welle 20, danach Sieg ohne Countdown', () => {
  const s = createGame({ wave: MAX_WAVES - 2 });
  startWave(s);
  finishWave(s);
  assert.equal(s.autoWaveIn, AUTO_WAVE_DELAY);
  run(s, AUTO_WAVE_DELAY + 0.1);
  assert.equal(s.wave, MAX_WAVES);
  finishWave(s);
  assert.equal(s.status, 'won');
  assert.equal(s.autoWaveIn, null);
  assert.equal(startButtonView(s).disabled, true);
});

test('B-121 Rand: Auto-Start löst den Wellenstart-Ton aus', () => {
  const s = createGame();
  const tr = createSoundTracker();
  startWave(s);
  detectStateEvents(tr, s);
  finishWave(s);
  detectStateEvents(tr, s);
  let started = false;
  for (let i = 0; i < (AUTO_WAVE_DELAY + 0.5) * 60; i++) {
    update(s, 1 / 60);
    if (detectStateEvents(tr, s).some((e) => e.kind === 'waveStart')) started = true;
  }
  assert.equal(s.wave, 2);
  assert.ok(started, 'waveStart-Ton beim automatischen Start');
});

test('B-121 Rand: Frühstart-Kette lässt nur nach Ende aller Wellen einen Countdown zu', () => {
  const s = createGame();
  startWave(s);
  s.spawnQueue = [];
  startWave(s); // Frühstart Welle 2, Welle-1-Gegner noch unterwegs
  assert.equal(s.autoWaveIn, null);
  update(s, 1 / 60);
  assert.equal(s.autoWaveIn, null, 'kein Countdown, solange Welle 2 läuft');
  finishWave(s);
  assert.equal(s.autoWaveIn, AUTO_WAVE_DELAY);
});

// ---------- B-120: Lava und Meteor nach Gegnerwelle skalieren ----------

test('B-120: spawnEnemy speichert die Welle; Spawn aus der Warteschlange trägt die eigene Welle', () => {
  const s = createGame();
  assert.equal(spawnEnemy(s, 'grunt', 4).wave, 4);
  s.wave = 6;
  assert.equal(spawnEnemy(s, 'grunt').wave, 6, 'Standard: aktuelle Welle');
  const g = createGame();
  startWave(g);
  spawnAll(g);
  assert.ok(startWave(g).ok); // Frühstart: Welle 2 läuft parallel
  run(g, 1);
  assert.equal(g.wave, 2);
  assert.ok(g.enemies.length && g.enemies.every(e => e.wave === 1 || e.wave === 2));
  assert.ok(g.enemies.some(e => e.wave === 1), 'Gegner der älteren Welle behalten Welle 1');
});

test('B-120 Lava: Gegner der älteren Welle bekommt Lava-Schaden seiner Welle, ohne Frühstart wie bisher', () => {
  const hot = [10, 8];
  // Zwei parallele Wellen: state.wave ist 8, der Gegner stammt aus Welle 3
  const s = createGame({ mapId: 'volcano' });
  s.wave = 8;
  const e = spawnEnemy(s, 'grunt', 3);
  e.speed = 0;
  e.hp = e.maxHp = 1e6;
  s.paths = [buildPath([hot, [hot[0] + 1, hot[1]]], TILE)];
  run(s, 1, 1 / 60);
  const lost = 1e6 - e.hp;
  assert.ok(Math.abs(lost - LAVA.dps * hpScale(3)) < LAVA.dps * hpScale(3) * 0.05, `Welle 3: ${lost}`);
  assert.ok(lost < LAVA.dps * hpScale(8) * 0.9, 'nicht nach state.wave');
  // Ohne Frühstart (Gegnerwelle = state.wave) unverändert
  const same = lavaBurn('grunt', ...hot, 1, 1 / 60, 8).lost;
  assert.ok(Math.abs(same - LAVA.dps * hpScale(8)) < LAVA.dps * hpScale(8) * 0.05, `Welle 8: ${same}`);
  // Rückfall ohne enemy.wave (z. B. von Hand erzeugt): state.wave
  const f = lavaBurn('grunt', ...hot, 0, 1 / 60, 8);
  delete f.e.wave;
  run(f.s, 1, 1 / 60);
  const lostF = 1e6 - f.e.hp;
  assert.ok(Math.abs(lostF - LAVA.dps * hpScale(8)) < LAVA.dps * hpScale(8) * 0.05, `Rückfall: ${lostF}`);
});

test('B-120 Meteor: Gegner der älteren Welle bekommt Meteor-Schaden seiner Welle, ohne Frühstart wie bisher', () => {
  const s = createGame();
  s.wave = 9;
  const old = enemyAt(s, 'shielded', 300, 300);
  old.wave = 5; // aus der vorigen, noch laufenden Welle
  const cur = enemyAt(s, 'shielded', 300, 300);
  const none = enemyAt(s, 'shielded', 300, 300);
  delete none.wave; // Rückfall: state.wave
  for (const e of [old, cur, none]) e.hp = 1e6;
  assert.ok(useAbility(s, 'meteor', 300, 300).ok);
  assert.ok(Math.abs(1e6 - old.hp - meteorDamage(5)) < 1e-6, 'ältere Welle');
  assert.ok(Math.abs(1e6 - cur.hp - meteorDamage(9)) < 1e-6, 'aktuelle Welle wie bisher');
  assert.ok(Math.abs(1e6 - none.hp - meteorDamage(9)) < 1e-6, 'Rückfall state.wave');
});

// --- B-123: Frühstart-Bonus nach Risiko ---

test('B-123: earlyStartBonus wächst mit dem Risiko, gekappt auf 0..1', () => {
  for (const w of [2, 10, MAX_WAVES]) {
    assert.equal(earlyStartBonus(w, 0), 0);
    assert.equal(earlyStartBonus(w, 1), Math.floor(waveBonus(w) * EARLY_START_MAX));
    assert.equal(earlyStartBonus(w, 5), earlyStartBonus(w, 1), 'über 1 gekappt');
    assert.equal(earlyStartBonus(w, -1), 0);
    assert.equal(earlyStartBonus(w, NaN), 0);
    assert.equal(earlyStartBonus(w), 0, 'ohne Risiko kein Bonus');
    assert.ok(earlyStartBonus(w, 0.8) >= earlyStartBonus(w, 0.4));
  }
  // Volles Risiko zahlt deutlich mehr als der alte feste Bonus (halber Wellenbonus)
  assert.ok(earlyStartBonus(2, 1) >= 3 * Math.floor(waveBonus(2) * 0.5));
});

test('B-123: earlyStartRisk = HP auf dem Feld / HP der laufenden Welle', () => {
  const s = createGame();
  assert.equal(earlyStartRisk(s), 0, 'ohne laufende Welle');
  startWave(s);
  s.spawnQueue = [];
  assert.equal(earlyStartRisk(s), 0, 'leeres Feld');
  for (const e of waveFor(1)) spawnEnemy(s, e.type, 1);
  assert.equal(waveHp(1), s.enemies.reduce((a, e) => a + e.hp, 0));
  assert.equal(earlyStartRisk(s), 1, 'ganze Welle unverletzt');
  for (const e of s.enemies) e.hp = e.maxHp / 2;
  assert.ok(Math.abs(earlyStartRisk(s) - 0.5) < 1e-9, 'halbe HP');
  for (const e of waveFor(1)) spawnEnemy(s, e.type, 1);
  assert.equal(earlyStartRisk(s), 1, 'mehr als eine Welle: gekappt');
});

test('B-123: mehr Gegner auf dem Feld = mehr Frühstart-Gold, besiegte Gegner senken den Bonus', () => {
  const full = createGame();
  startWave(full);
  spawnAll(full);
  const few = createGame();
  startWave(few);
  spawnAll(few);
  few.enemies = few.enemies.slice(0, Math.ceil(few.enemies.length / 4));
  const a = startWave(full).bonus;
  const b = startWave(few).bonus;
  assert.ok(a > b, `volles Feld ${a} > fast leeres Feld ${b}`);
});

// --- B-124: asynchrone Eingänge (Schübe und Versatz) ---

test('B-124: planLanes ändert Karten mit einem Weg nicht', () => {
  const s = createGame({ mapId: 'meadow' });
  const list = waveFor(12);
  assert.equal(planLanes(s, list, 12), list);
});

test('B-124: freie Typen kommen in Schüben je Seite, der erste auf der frühen Seite (wechselt je Welle), feste Typen bleiben auf ihrer Seite', () => {
  for (const mapId of ['fork', 'twin']) {
    const s = createGame({ mapId });
    const fixed = MAPS[mapId].lanes;
    for (const wave of [1, 2, 12]) {
      const raw = waveFor(wave);
      const planned = planLanes(s, raw, wave);
      assert.equal(planned.length, raw.length);
      for (const e of planned) if (fixed[e.type] !== undefined) assert.equal(e.lane, fixed[e.type], `${mapId} W${wave} ${e.type}`);
      // Seiten der freien Typen in Rohreihenfolge (planned ist nach Zeit umsortiert, daher Index i mitgeben)
      const count = s.paths.length;
      const lanes = planLanes(s, raw.map((e, i) => ({ ...e, i })), wave).filter((e) => fixed[e.type] === undefined).sort((a, b) => a.i - b.i).map((e) => e.lane);
      lanes.forEach((lane, k) => {
        const expected = (Math.floor(k / LANE_ASYNC.burst) + (wave % count) + 1) % count; // erster Schub auf der frühen Seite
        assert.equal(lane, expected, `${mapId} W${wave} freier Gegner ${k}`);
      });
      // Seiten nicht streng abwechselnd: mindestens ein Schub mit burst Gegnern hintereinander auf einer Seite
      if (lanes.length >= LANE_ASYNC.burst) assert.ok(lanes.slice(0, LANE_ASYNC.burst).every((l) => l === lanes[0]));
    }
  }
});

test('B-124: je Welle startet eine Seite um LANE_ASYNC.offset später, die Seite wechselt; Liste bleibt nach Zeit sortiert', () => {
  const s = createGame({ mapId: 'fork' });
  for (const wave of [3, 4]) {
    const raw = waveFor(wave).map((e, i) => ({ ...e, i }));
    const planned = planLanes(s, raw, wave);
    const late = wave % 2;
    for (const e of planned) {
      const base = raw[e.i].at;
      assert.equal(e.at, base + (e.lane === late ? LANE_ASYNC.offset : 0), `W${wave} Eintrag ${e.i}`);
    }
    for (let k = 1; k < planned.length; k++) assert.ok(planned[k].at >= planned[k - 1].at);
    const first = (lane) => Math.min(...planned.filter((e) => e.lane === lane).map((e) => e.at));
    assert.ok(first(late) >= first(1 - late) + LANE_ASYNC.offset - 1e-9, `W${wave}: späte Seite startet später`);
  }
  assert.ok(LANE_ASYNC.burst >= 2 && LANE_ASYNC.offset > 0);
});

test('B-124: gespawnte Gegner laufen auf der geplanten Seite, auch beim Frühstart', () => {
  const s = createGame({ mapId: 'twin' });
  startWave(s);
  const plannedLanes = s.spawnQueue.map((e) => e.lane);
  assert.ok(plannedLanes.every((l) => l === 0 || l === 1));
  spawnAll(s);
  assert.deepEqual(s.enemies.map((e) => e.lane).sort(), [...plannedLanes].sort());
  const n = s.enemies.length;
  assert.ok(startWave(s).ok);
  assert.ok(s.spawnQueue.every((e) => e.lane === 0 || e.lane === 1 ), 'Frühstart-Welle geplant');
  spawnAll(s);
  for (const e of s.enemies.slice(n)) assert.equal(e.path ?? enemyPath(s, e), s.paths[e.lane]);
  // Direkter Aufruf ohne Seite: Wechsel wie bisher (B-099)
  const d = createGame({ mapId: 'fork' });
  assert.deepEqual([spawnEnemy(d, 'grunt', 1).lane, spawnEnemy(d, 'grunt', 1).lane], [0, 1]);
  assert.equal(spawnEnemy(d, 'grunt', 1, 1).lane, 1);
  assert.equal(spawnEnemy(d, 'grunt', 1, 7).lane, 0, 'ungültige Seite -> Wechsel');
});

// --- B-124: Tester-Ergänzungen ---

test('B-124 (Tester): Frühstart addiert den Versatz relativ zur laufenden waveTime, Queue bleibt sortiert', () => {
  const s = createGame({ mapId: 'fork' });
  startWave(s);
  s.lives = 1e6; // nur Zeitplanung prüfen
  while (s.spawnQueue.length) update(s, 1 / 60); // Frühstart erst, wenn alle Gegner der Welle gespawnt sind
  assert.ok(s.waveActive && s.waveTime > LANE_ASYNC.offset);
  const t = s.waveTime;
  const before = s.spawnQueue.length;
  assert.ok(startWave(s).ok);
  const added = s.spawnQueue.filter((e) => e.wave === 2);
  const planned = planLanes(s, waveFor(2), 2);
  assert.equal(added.length, planned.length);
  assert.equal(s.spawnQueue.length, before + planned.length);
  const exp = planned.map((e) => e.at + t).sort((a, b) => a - b);
  const got = added.map((e) => e.at).sort((a, b) => a - b);
  for (let k = 0; k < exp.length; k++) assert.ok(Math.abs(got[k] - exp[k]) < 1e-9, `Eintrag ${k}: ${got[k]} vs ${exp[k]}`);
  // späte Seite (2 % 2 = 0) startet frühestens t + offset
  const lateFirst = Math.min(...added.filter((e) => e.lane === 0).map((e) => e.at));
  assert.ok(lateFirst >= t + LANE_ASYNC.offset - 1e-9);
  for (let k = 1; k < s.spawnQueue.length; k++) assert.ok(s.spawnQueue[k].at >= s.spawnQueue[k - 1].at);
});

test('B-124 (Tester): Welle 20 mit Bossen auf beiden Karten vollständig geplant, Eingabe unverändert', () => {
  for (const mapId of ['fork', 'twin']) {
    const s = createGame({ mapId });
    const raw = waveFor(20);
    const copy = JSON.stringify(raw);
    const planned = planLanes(s, raw, 20);
    assert.equal(JSON.stringify(raw), copy, `${mapId}: Eingabeliste verändert`);
    assert.equal(planned.length, raw.length);
    const count = s.paths.length;
    assert.ok(planned.every((e) => Number.isInteger(e.lane) && e.lane >= 0 && e.lane < count));
    const bosses = planned.filter((e) => e.type === 'boss');
    assert.equal(bosses.length, raw.filter((e) => e.type === 'boss').length);
    // Typ-Anzahl bleibt gleich
    const tally = (l) => l.reduce((m, e) => ((m[e.type] = (m[e.type] || 0) + 1), m), {});
    assert.deepEqual(tally(planned), tally(raw));
  }
});

// --- B-127: Zweiter Boss Nekromantin ---

test('B-127: Boss-Merkmal: Oger-König und Nekromantin sind Bosse, Skelett und andere nicht', () => {
  assert.ok(isBoss('boss') && isBoss('necro') && isBoss({ type: 'necro' }));
  for (const t of ['grunt', 'runner', 'tank', 'healer', 'shielded', 'skeleton', 'unbekannt', 'toString', undefined]) assert.equal(isBoss(t), false, `${t}`);
  assert.equal(isBoss(null), false);
});

test('B-127: Nekromantin beschwört im Takt summonCount Skelette summonBehind Kacheln hinter sich auf ihrem Weg', () => {
  const def = ENEMY_TYPES.necro;
  const s = createGame();
  s.waveActive = true; // keine Wellenende-Logik
  const n = spawnEnemy(s, 'necro', 10);
  n.dist = 5 * TILE;
  const p0 = pointAt(enemyPath(s, n), n.dist);
  n.x = p0.x; n.y = p0.y;
  n.speed = 0; // steht still, damit die Position genau prüfbar ist
  const step = 1 / 60;
  for (let t = 0; t < def.summonInterval - 0.05; t += step) update(s, step);
  assert.equal(s.enemies.length, 1, 'vor summonInterval keine Beschwörung');
  for (let t = 0; t < 0.1; t += step) update(s, step);
  const sk = s.enemies.filter((e) => e.type === def.summonType);
  assert.equal(sk.length, def.summonCount);
  const hp = Math.round(ENEMY_TYPES.skeleton.hp * hpScale(10));
  for (const [k, e] of sk.entries()) {
    assert.equal(e.lane, n.lane);
    assert.equal(e.maxHp, hp, 'HP-Skalierung der Welle der Nekromantin');
    assert.ok(e.summoned);
    // höchstens 0,1 s Bewegung nach dem Erscheinen
    const want = n.dist - (def.summonBehind + k * def.summonSpacing) * TILE;
    assert.ok(want > 0 && e.dist < n.dist, 'hinter ihr');
    assert.ok(e.dist >= want - 1e-6 && e.dist <= want + e.speed * TILE * 0.1 + 1e-6, `Position ${e.dist} statt ${want}`);
    const p = pointAt(enemyPath(s, e), e.dist);
    assert.ok(Math.abs(p.x - e.x) < 1e-6 && Math.abs(p.y - e.y) < 1e-6, 'auf dem Weg');
  }
  assert.ok(s.effects.some((fx) => fx.kind === 'summon'), 'Beschwörungs-Effekt');
  // zweiter Takt
  for (let t = 0; t < def.summonInterval; t += step) update(s, step);
  assert.equal(s.enemies.filter((e) => e.type === def.summonType).length, 2 * def.summonCount);
});

test('B-127: Beschwörung nie vor den Wegstart; tote Nekromantin beschwört nicht mehr; Skelette halten das Wellenende auf', () => {
  const def = ENEMY_TYPES.necro;
  const s = createGame();
  s.waveActive = true;
  const n = spawnEnemy(s, 'necro', 10);
  n.speed = 0;
  n.dist = 0.1 * TILE;
  n.summonAt = s.time;
  update(s, 1 / 60);
  const sk = s.enemies.filter((e) => e.type === 'skeleton');
  assert.equal(sk.length, def.summonCount);
  for (const e of sk) assert.ok(e.dist >= 0 && e.dist <= n.dist, 'nicht vor dem Wegstart, nicht vor ihr');

  const d = createGame();
  startWave(d);
  d.spawnQueue = [];
  d.enemies = [];
  const m = spawnEnemy(d, 'necro', 10);
  m.speed = 0;
  m.hp = 0; // tot, wird im selben Schritt entfernt
  m.summonAt = d.time;
  update(d, 1 / 60);
  assert.equal(d.enemies.filter((e) => e.type === 'skeleton').length, 0);
  assert.equal(d.waveActive, false, 'Welle endet ohne Skelette');

  const w = createGame();
  startWave(w);
  w.spawnQueue = [];
  w.enemies = [];
  const sk2 = spawnEnemy(w, 'skeleton', 10);
  sk2.speed = 0;
  update(w, 1 / 60);
  assert.equal(w.waveActive, true, 'lebendes Skelett hält die Welle offen');
});

test('B-127: Nekromantin ist immun gegen Einfrieren und bekommt nur anteiligen Rückstoß', () => {
  const { s, tower, e } = specialSetup('frost', 'necro');
  for (let i = 0; i < cfg('frost').freezeEvery * 2; i++) fireAndLand(s, tower);
  assert.equal(e.frozenUntil || 0, 0);
  const sk = specialSetup('frost', 'skeleton');
  for (let i = 0; i < cfg('frost').freezeEvery; i++) fireAndLand(sk.s, sk.tower);
  assert.ok(sk.e.frozenUntil > sk.s.time, 'Skelett wird eingefroren');

  const b = specialSetup('cannon', 'necro');
  const before = b.e.dist;
  b.tower.cooldown = 0; update(b.s, 0.001);
  for (let i = 0; i < 200 && b.s.projectiles.length; i++) update(b.s, 0.01);
  assert.ok(Math.abs(before - b.e.dist - cfg('cannon').knockback * TILE * cfg('cannon').bossKnockbackFactor) < 1e-6);
});

test('C-Abnahme 5: waveProgress füllt den Wellenknopf mit dem Anteil besiegter Gegner der laufenden Welle', async () => {
  const { waveProgress } = await import('../src/hud.js');
  const s = createGame();
  assert.deepEqual(waveProgress(s, 7), { peak: 0, fill: 0 }, 'ohne Welle leer, Merker zurückgesetzt');
  startWave(s);
  const total = s.spawnQueue.length;
  let v = waveProgress(s, 0);
  assert.deepEqual(v, { peak: total, fill: 0 }, 'Start: nichts besiegt');
  spawnEnemy(s, 'tank');
  s.spawnQueue.shift(); // ein Gegner aus der Warteschlange ist jetzt auf dem Feld: offen bleibt gleich
  assert.equal(waveProgress(s, v.peak).fill, 0);
  s.enemies.length = 0; // besiegt
  v = waveProgress(s, v.peak);
  assert.equal(v.peak, total);
  assert.ok(Math.abs(v.fill - 1 / total) < 1e-9, 'ein Gegner von allen besiegt');
  s.spawnQueue = [];
  assert.equal(waveProgress(s, v.peak).fill, 1, 'alle besiegt');
  assert.ok(waveProgress(s, NaN).fill === 0 && waveProgress({ waveActive: true }, 0).fill === 0, 'ungültige Werte');
});

// Entscheidung 2026-11-27: große Wellenfahne ragt ins Feld; ihre Kacheln sind nicht bebaubar, die Nachbarn schon.
// Wiese: Fahne steht unter dem Weg über dem Fluss (0,3), dort ist ohnehin Wasser (kein Bauplatz geht verloren).
test('Fahnen-Kacheln: canBuild lehnt ab ("Hier steht die Fahne"), Nachbarkacheln bleiben bebaubar, alle Karten', () => {
  for (const id of Object.keys(MAPS)) {
    const s = createGame({ mapId: id });
    const tiles = MAPS[id].flagTiles;
    assert.ok(tiles.length >= 1, `${id}: Fahnen-Kachel vorhanden`);
    assert.equal(s.flagTiles.size, tiles.length);
    for (const [c, r] of tiles) {
      assert.ok(c >= 0 && c < COLS && r >= 0 && r < ROWS, `${id}: ${c},${r} im Feld`);
      assert.ok(!s.blocked.has(`${c},${r}`) && !s.obstacles.has(`${c},${r}`), `${id}: Fahne nicht auf Weg oder Hindernis`);
      const want = s.water.has(`${c},${r}`) ? 'Hier ist Wasser' : 'Hier steht die Fahne';
      assert.deepEqual(canBuild(s, c, r), { ok: false, reason: want }, `${id}: ${c},${r}`);
      const g0 = s.gold;
      assert.equal(buildTower(s, 'arrow', c, r).ok, false);
      assert.equal(s.gold, g0, 'kein Gold abgezogen');
    }
  }
  assert.deepEqual(MAPS.meadow.flagTiles, [[0, 3]]);
  assert.ok(createGame({ mapId: 'meadow' }).water.has('0,3'), 'Wiese: Fahnen-Kachel ist Wasser');
  // Zangenangriff: Fahne oben über dem Weg auf (0,0); Nachbarn rechts und unten bleiben bebaubar
  const f = createGame({ mapId: 'fork' });
  assert.deepEqual(MAPS.fork.flagTiles, [[0, 0], [0, 10]]);
  for (const [c, r] of [[0, 1], [1, 0], [0, 11], [1, 10]]) assert.ok(canBuild(f, c, r).ok, `fork ${c},${r}`);
  // Zwei Fronten: zwei Eingänge, zwei Fahnen-Kacheln
  assert.equal(createGame({ mapId: 'twin' }).flagTiles.size, 2);
  // Override ohne flagTiles: alles wie früher
  assert.ok(canBuild(createGame({ mapId: 'fork', flagTiles: undefined }), 0, 0).ok);
});

describe('B-170: Glutling ist immun gegen Verlangsamung und Einfrieren', () => {
  test('Konfiguration: slowImmune und chillFactor gesetzt, Frost-Text nennt die Immunität', () => {
    assert.equal(ENEMY_TYPES.ember.slowImmune, true);
    assert.equal(ENEMY_TYPES.ember.chillFactor, 0.5);
    assert.match(TOWER_TYPES.frost.special.text, /Glutlinge sind immun/);
  });

  test('Frost-Treffer verlangsamt nicht, macht aber Schaden', () => {
    const { s, tower, e } = specialSetup('frost', 'ember');
    const hp0 = e.hp;
    fireAndLand(s, tower);
    assert.ok(e.hp < hp0, 'Frost-Schaden wirkt');
    assert.ok(!(s.time < (e.slowUntil || 0)) || e.slowFactor === 1, 'kein Slow');
    // Gegenprobe: Goblin wird verlangsamt
    const g = specialSetup('frost', 'grunt');
    fireAndLand(g.s, g.tower);
    assert.ok(g.s.time < g.e.slowUntil && g.e.slowFactor < 1, 'Goblin verlangsamt');
  });

  test('kein Einfrieren, auch nicht beim N-ten Treffer; Treffer zählen weiter', () => {
    const { s, tower, e } = specialSetup('frost', 'ember');
    const n = cfg('frost').freezeEvery;
    for (let i = 0; i < n; i++) fireAndLand(s, tower);
    assert.equal(tower.hitCount, n, 'Treffer zählen im hitCount');
    assert.equal(e.frozenUntil || 0, 0, 'nicht eingefroren');
  });

  test('Kälteschock wirkt nur zur Hälfte (chillFactor), auf Goblins voll', () => {
    const s = createGame();
    const em = spawnEnemy(s, 'ember', 1);
    const gr = spawnEnemy(s, 'grunt', 1);
    assert.equal(useAbility(s, 'freeze').ok, true);
    const slow = ABILITIES.freeze.slow;
    assert.ok(Math.abs(em.slowFactor - (1 - slow * ENEMY_TYPES.ember.chillFactor)) < 1e-9);
    assert.ok(Math.abs(gr.slowFactor - (1 - slow)) < 1e-9);
    assert.ok(em.slowUntil > s.time);
  });
});

describe('B-168: Irrlicht weicht langsamen Geschossen aus', () => {
  const every = ENEMY_TYPES.wisp.dodgeEvery;

  test('genau jedes dodgeEvery-te Kanonen-Geschoss trifft, nie Rückstoß, Ausweich-Effekt entsteht', () => {
    const { s, tower, e } = specialSetup('cannon', 'wisp');
    const dist0 = e.dist;
    const hits = [];
    for (let i = 1; i <= every * 2; i++) {
      const hp = e.hp;
      fireAndLand(s, tower);
      hits.push(e.hp < hp);
      if (i === 1) assert.ok(s.effects.some((f) => f.kind === 'dodge'), 'dodge-Effekt');
    }
    assert.deepEqual(hits, hits.map((_, i) => (i + 1) % every === 0));
    assert.equal(e.dist, dist0, 'kein Rückstoß');
  });

  test('Frost: verfehlte Treffer machen keinen Schaden, verlangsamen nicht und zählen nicht fürs Einfrieren', () => {
    const { s, tower, e } = specialSetup('frost', 'wisp');
    const hp0 = e.hp;
    for (let i = 1; i < every; i++) fireAndLand(s, tower);
    assert.equal(e.hp, hp0);
    assert.ok(!(s.time < (e.slowUntil || 0)), 'kein Slow');
    assert.equal(tower.hitCount || 0, 0);
    fireAndLand(s, tower);
    assert.ok(e.hp < hp0, 'jeder dodgeEvery-te trifft');
    assert.ok(s.time < e.slowUntil && e.slowFactor < 1, 'Treffer verlangsamt');
    assert.equal(tower.hitCount, 1);
  });

  test('fremde Explosion verletzt das Irrlicht nicht, den Goblin daneben schon', () => {
    const { s, tower, e: g } = specialSetup('cannon', 'grunt');
    const w = spawnEnemy(s, 'wisp', 1);
    w.speed = 0; w.hp = w.maxHp = 1e8; // schwächer als der Goblin: Zielregel "strong" wählt den Goblin
    setTargetMode(s, tower.id, 'strong');
    w.dist = g.dist - 5; // knapp hinter dem Goblin, steht im Splash
    const p = pointAt(enemyPath(s, w), w.dist);
    w.x = p.x; w.y = p.y;
    for (let i = 0; i < every; i++) {
      const gh = g.hp;
      fireAndLand(s, tower);
      assert.ok(g.hp < gh, 'Goblin getroffen');
      assert.ok(Math.hypot(w.x - g.x, w.y - g.y) <= TOWER_TYPES.cannon.splash * TILE, 'Irrlicht im Splash');
    }
    assert.equal(w.hp, w.maxHp, 'Irrlicht unverletzt');
    assert.equal(w.dodgeCount || 0, 0, 'kein Ausweichen nötig');
  });

  test('Pfeil trifft immer', () => {
    const { s, tower, e } = specialSetup('arrow', 'wisp');
    for (let i = 0; i < every * 2; i++) {
      const hp = e.hp;
      fireAndLand(s, tower);
      assert.ok(e.hp < hp, `Pfeil ${i + 1} trifft`);
    }
    assert.ok(!s.effects.some((f) => f.kind === 'dodge'));
  });
});

// ---------- B-167: Fledermaus (Flieger) ----------
describe('B-167 Fledermaus: Flieger, die Kanone und Frost nicht treffen', () => {
  // Turm neben einer Fledermaus (und optional einem Goblin an derselben Stelle)
  function batSetup(towerType, withGrunt = false) {
    const { s, tower, e: bat } = specialSetup(towerType, 'bat');
    let grunt = null;
    if (withGrunt) {
      grunt = spawnEnemy(s, 'grunt', 1);
      grunt.dist = bat.dist; grunt.x = bat.x; grunt.y = bat.y; grunt.speed = 0; grunt.hp = grunt.maxHp = 1e9;
    }
    return { s, tower, bat, grunt };
  }

  test('Config: Fledermaus fliegt, hitsAir je Turm, Text in special.text', () => {
    assert.equal(ENEMY_TYPES.bat.flying, true);
    assert.equal(ENEMY_TYPES.bat.name, 'Fledermaus');
    for (const t of ['arrow', 'sniper', 'lightning']) {
      assert.equal(TOWER_TYPES[t].hitsAir, true, t);
      assert.ok(TOWER_TYPES[t].special.text.endsWith('Trifft Flieger.'), t);
    }
    for (const t of ['cannon', 'frost']) {
      assert.equal(TOWER_TYPES[t].hitsAir, false, t);
      assert.ok(TOWER_TYPES[t].special.text.endsWith('Trifft keine Flieger.'), t);
    }
  });

  test('pickTarget ist rein und überspringt Flieger nur bei Türmen ohne hitsAir', () => {
    const bat = { type: 'bat', x: 0, y: 0, hp: 10, dist: 90, len: 100 };
    const grunt = { type: 'grunt', x: 10, y: 0, hp: 10, dist: 10, len: 100 };
    const enemies = [bat, grunt];
    const snap = JSON.stringify(enemies);
    assert.equal(pickTarget(enemies, { type: 'arrow', x: 0, y: 0 }, 50), bat);
    assert.equal(pickTarget(enemies, { type: 'cannon', x: 0, y: 0 }, 50), grunt);
    assert.equal(pickTarget(enemies, { type: 'frost', x: 0, y: 0 }, 50), grunt);
    assert.equal(pickTarget([bat], { type: 'cannon', x: 0, y: 0 }, 50), null);
    assert.equal(pickTarget(enemies, { x: 0, y: 0 }, 50), bat, 'ohne Turmtyp wie bisher');
    assert.equal(JSON.stringify(enemies), snap, 'keine Änderung an den Gegnern');
  });

  test('Kanone und Frost zielen nicht auf eine Fledermaus', () => {
    for (const t of ['cannon', 'frost']) {
      const { s, tower } = batSetup(t);
      tower.cooldown = 0;
      update(s, 0.001);
      assert.equal(s.projectiles.length, 0, t);
    }
  });

  test('Kanonen-Splash verletzt Fledermäuse nicht und wirft sie nicht zurück', () => {
    const { s, tower, bat, grunt } = batSetup('cannon', true);
    const dist0 = bat.dist;
    tower.cooldown = 0;
    update(s, 0.001);
    assert.equal(s.projectiles.length, 1);
    assert.equal(s.projectiles[0].targetId, grunt.id);
    for (let i = 0; i < 60 && s.projectiles.length; i++) { tower.cooldown = 99; update(s, 0.02); }
    assert.ok(grunt.hp < grunt.maxHp, 'Goblin getroffen');
    assert.equal(bat.hp, bat.maxHp, 'Fledermaus unverletzt');
    assert.equal(bat.dist, dist0, 'Fledermaus nicht zurückgeworfen');
  });

  test('Pfeil und Scharfschütze treffen Fledermäuse', () => {
    for (const t of ['arrow', 'sniper']) {
      const { s, tower, bat } = batSetup(t);
      tower.cooldown = 0;
      update(s, 0.001);
      assert.equal(s.projectiles[0]?.targetId, bat.id, t);
      for (let i = 0; i < 60 && s.projectiles.length; i++) { tower.cooldown = 99; update(s, 0.02); }
      assert.ok(bat.hp < bat.maxHp, `${t}: Fledermaus getroffen`);
    }
  });

  test('Kettenblitz springt auf eine Fledermaus über', () => {
    const grunt = { type: 'grunt', x: 0, y: 0, hp: 10 };
    const bat = { type: 'bat', x: 20, y: 0, hp: 10 };
    assert.deepEqual(chainTargets([grunt, bat], grunt, 3, 50), [grunt, bat]);
    const { s, tower, bat: b2, grunt: g2 } = batSetup('lightning', true);
    tower.cooldown = 0;
    update(s, 0.001);
    assert.ok(b2.hp < b2.maxHp && g2.hp < g2.maxHp, 'beide getroffen');
  });

  test('Meteor und Kälteschock treffen Fledermäuse', () => {
    const { s, bat } = batSetup('arrow');
    s.towers = [];
    const hp0 = bat.hp;
    assert.ok(useAbility(s, 'meteor', bat.x, bat.y).ok);
    assert.ok(bat.hp < hp0, 'Meteor');
    assert.ok(useAbility(s, 'freeze').ok);
    assert.ok(bat.slowUntil > s.time, 'Kälteschock');
  });

  test('Fledermaus nimmt keinen Lava-Schaden, Goblin auf derselben Kachel schon', () => {
    const hot = [10, 8]; // Wegkachel neben dem Lavatümpel der Vulkan-Karte
    const bat = lavaBurn('bat', ...hot, 1, 1 / 60);
    assert.equal(bat.lost, 0, 'Fledermaus verliert keine HP');
    assert.ok(lavaBurn('grunt', ...hot, 1, 1 / 60).lost > 0, 'Goblin verliert HP');
  });
});

// ---------- B-169: Panzerkäfer (Schale) ----------
describe('B-169 Panzerkäfer: Schale fängt die ersten Treffer ab', () => {
  const SHELL = ENEMY_TYPES.beetle.shellHits;
  // Turm schießt einmal, Geschoss fliegt ins Ziel
  function shoot(s, tower) {
    tower.cooldown = 0;
    update(s, 0.001);
    for (let i = 0; i < 60 && s.projectiles.length; i++) { tower.cooldown = 99; update(s, 0.02); }
  }

  test('Spawn: Schale mit shellHits Schichten, andere Gegner ohne Schale', () => {
    const s = createGame();
    assert.equal(spawnEnemy(s, 'beetle', 1).shell, SHELL);
    assert.equal(spawnEnemy(s, 'grunt', 1).shell, undefined);
  });

  test('Pfeil: shellHits Treffer machen 0 Schaden, der nächste normal', () => {
    const { s, tower, e } = specialSetup('arrow', 'beetle');
    for (let i = 0; i < SHELL; i++) {
      shoot(s, tower);
      assert.equal(e.hp, e.maxHp, `Treffer ${i + 1} ohne Schaden`);
      assert.equal(e.shell, SHELL - i - 1);
    }
    shoot(s, tower);
    assert.equal(e.maxHp - e.hp, TOWER_TYPES.arrow.damage, 'Treffer nach der Schale normal');
  });

  test('Kettenblitz: jeder Sprung zählt als Treffer', () => {
    const { s, tower, e } = specialSetup('lightning', 'beetle');
    const b2 = spawnEnemy(s, 'beetle', 1);
    b2.dist = e.dist; b2.x = e.x + 10; b2.y = e.y; b2.speed = 0; b2.hp = b2.maxHp = 1e9;
    tower.cooldown = 0;
    update(s, 0.001);
    assert.equal(e.shell, SHELL - 1);
    assert.equal(b2.shell, SHELL - 1);
    assert.equal(e.hp, e.maxHp);
    assert.equal(b2.hp, b2.maxHp);
  });

  test('Kanonen-Splash zählt einmal je Käfer und Explosion', () => {
    const { s, tower, e } = specialSetup('cannon', 'beetle');
    shoot(s, tower);
    assert.equal(e.shell, SHELL - 1);
    assert.equal(e.hp, e.maxHp);
  });

  test('Meteor zählt einmal', () => {
    const { s, e } = specialSetup('arrow', 'beetle');
    s.towers = [];
    assert.ok(useAbility(s, 'meteor', e.x, e.y).ok);
    assert.equal(e.shell, SHELL - 1);
    assert.equal(e.hp, e.maxHp);
  });

  test('Scharfschütze ignoriert Rüstung, nicht die Schale', () => {
    const { s, tower, e } = specialSetup('sniper', 'beetle');
    e.armor = 0.5;
    shoot(s, tower);
    assert.equal(e.hp, e.maxHp);
    assert.equal(e.shell, SHELL - 1);
  });

  test('Schale vor Magier-Schild: der Schild bleibt bei intakter Schale unberührt', () => {
    const { s, tower, e } = specialSetup('arrow', 'beetle');
    e.ward = 5;
    shoot(s, tower);
    assert.equal(e.ward, 5);
    assert.equal(e.shell, SHELL - 1);
  });

  test('Lava zählt nicht als Treffer und macht Schaden', () => {
    const { lost, e } = lavaBurn('beetle', 10, 8, 1, 1 / 60);
    assert.ok(lost > 0, 'Lava-Schaden');
    assert.equal(e.shell, SHELL, 'Schale unverändert');
  });

  test('Frost verlangsamt (und friert ein) trotz intakter Schale', () => {
    const { s, tower, e } = specialSetup('frost', 'beetle');
    shoot(s, tower);
    assert.equal(e.hp, e.maxHp);
    assert.ok(e.slowUntil > s.time && e.slowFactor < 1, 'verlangsamt');
    tower.hitCount = TOWER_TYPES.frost.special.freezeEvery - 1;
    shoot(s, tower);
    assert.ok(e.frozenUntil > s.time, 'eingefroren');
  });

  test('shellBreak-Effekt entsteht genau beim Bruch der letzten Schicht', () => {
    const { s, tower, e } = specialSetup('arrow', 'beetle');
    const breaks = () => s.effects.filter((fx) => fx.kind === 'shellBreak').length;
    for (let i = 0; i < SHELL - 1; i++) shoot(s, tower);
    assert.equal(breaks(), 0);
    shoot(s, tower);
    const fx = s.effects.find((f) => f.kind === 'shellBreak');
    assert.ok(fx, 'Effekt da');
    assert.equal(fx.max, FX_STYLE.shellBreak.life);
    assert.ok(Math.abs(fx.x - e.x) < 1e-9 && Math.abs(fx.y - e.y) < 1e-9);
    shoot(s, tower);
    assert.equal(breaks(), 1, 'kein zweiter Effekt');
  });
});

// ---------- Tester: Randfälle der neuen Gegner (B-167 bis B-171) ----------
describe('Tester: Randfälle neue Gegner', () => {
  const still = (s, type) => {
    const e = spawnEnemy(s, type, 1);
    e.dist = 300; e.speed = 0; e.hp = e.maxHp = 1e6;
    return e;
  };

  test('Meteor trifft das Irrlicht (Fähigkeit ist kein fremder Splash)', () => {
    const s = createGame();
    const e = still(s, 'wisp');
    update(s, 0.001);
    assert.ok(useAbility(s, 'meteor', e.x, e.y).ok);
    assert.ok(e.hp < e.maxHp);
  });

  test('Glutling: nach Ende des Kälteschocks wieder volles Tempo', () => {
    const s = createGame();
    const e = still(s, 'ember');
    e.speed = ENEMY_TYPES.ember.speed;
    assert.ok(useAbility(s, 'freeze').ok);
    run(s, ABILITIES.freeze.duration + 0.5);
    const d0 = e.dist;
    update(s, 0.1);
    assert.ok(Math.abs((e.dist - d0) - e.speed * TILE * 0.1) < 1e-6, 'kein Rest-Slow');
  });

  test('Lava knackt die Schale nicht, macht aber Schaden', () => {
    const s = createGame({ mapId: 'volcano' });
    const e = spawnEnemy(s, 'beetle', 1);
    e.speed = 0; e.hp = e.maxHp = 1e6;
    const shell = e.shell;
    let hit = false;
    for (let d = 0; d < 2000 && !hit; d += 5) {
      e.dist = d; e.hp = e.maxHp; update(s, 0.05);
      if (e.hp < e.maxHp) hit = true;
    }
    assert.ok(hit, 'Lava-Kachel gefunden');
    assert.equal(e.shell, shell);
  });

  test('waveHp mit Karte entspricht der Summe aus waveFor(wave, mapId)', () => {
    for (const mapId of Object.keys(MAPS)) {
      for (const w of [1, 8, 15, MAX_WAVES]) {
        const exp = waveFor(w, mapId).reduce((a, e) => a + Math.round(ENEMY_TYPES[e.type].hp * hpScale(w)), 0);
        assert.equal(waveHp(w, mapId), exp, `${mapId} Welle ${w}`);
      }
    }
  });
});

// --- B-179: Elite-Gegner und gemischtere Mitte ---
import { ELITE, eliteCount, WAVE_EXTRAS } from '../src/config.js';

test('B-179: Elite-Gegner erst ab ELITE.from, Anzahl wächst bis ELITE.max, nur erlaubte Typen und Eigenschaften', () => {
  const traits = new Set();
  for (let w = 1; w <= MAX_WAVES; w++) {
    const elites = waveFor(w).filter((e) => e.elite);
    assert.equal(elites.length, eliteCount(w), `Welle ${w}`);
    assert.equal(elites.length > 0, w >= ELITE.from, `Welle ${w}: Elite`);
    assert.ok(eliteCount(w) <= ELITE.max);
    for (const e of elites) {
      assert.ok(ELITE.types.includes(e.type), `Welle ${w}: ${e.type}`);
      assert.ok(ELITE.traits.includes(e.elite), `Welle ${w}: ${e.elite}`);
      traits.add(e.elite);
    }
  }
  assert.equal(ELITE.from, 10); // Balancing 27.11.: ab Welle 10
  assert.ok(eliteCount(20) > eliteCount(8));
  assert.deepEqual([...traits].sort(), [...ELITE.traits].sort(), 'alle Eigenschaften kommen vor');
  assert.deepEqual(waveFor(12), waveFor(12), 'feste Auswahl, kein Zufall');
});

test('B-179: Elite-Eigenschaften: schneller, Schild, Selbstheilung, mehr Gold, Flag fürs Abzeichen', () => {
  const s = createGame();
  const plain = spawnEnemy(s, 'tank', 10);
  const swift = spawnEnemy(s, 'tank', 10, null, 'swift');
  const shield = spawnEnemy(s, 'tank', 10, null, 'shield');
  const regen = spawnEnemy(s, 'tank', 10, null, 'regen');
  assert.equal(plain.elite, undefined);
  assert.equal(swift.elite, 'swift');
  assert.ok(Math.abs(swift.speed - plain.speed * ELITE.swift.speed) < 1e-9);
  assert.equal(shield.ward, ELITE.shield.wardShare * shield.maxHp);
  assert.equal(plain.ward, 0);
  for (const e of [swift, shield, regen]) assert.equal(e.reward, Math.round(plain.reward * ELITE.rewardFactor));
  // Selbstheilung: healPerSec * maxHp pro Sekunde, nie über maxHp; normale Gegner heilen nicht
  regen.hp = regen.maxHp / 2;
  plain.hp = plain.maxHp / 2;
  for (let i = 0; i < 60; i++) update(s, 1 / 60);
  assert.ok(Math.abs(regen.hp - (regen.maxHp / 2 + regen.maxHp * ELITE.regen.healPerSec)) < 1e-6, `regen ${regen.hp}`);
  assert.equal(plain.hp, plain.maxHp / 2);
  regen.hp = regen.maxHp - 0.001;
  update(s, 1);
  assert.equal(regen.hp, regen.maxHp);
  assert.equal(spawnEnemy(s, 'grunt', 10, null, 'unbekannt').elite, undefined, 'unbekannte Eigenschaft wird ignoriert');
});

test('B-179: Elite-Markierung läuft über startWave und Spawn-Liste bis zum Gegner', () => {
  const s = createGame();
  s.wave = 11;
  startWave(s);
  const want = s.spawnQueue.filter((e) => e.elite).map((e) => e.elite);
  assert.equal(want.length, eliteCount(12));
  const seen = [];
  for (let k = 0; k < 200 * 60 && s.spawnQueue.length; k++) {
    update(s, 1 / 60);
    for (const e of s.enemies) if (e.elite && !seen.includes(e)) seen.push(e);
    s.lives = START_LIVES; // Leben spielen hier keine Rolle
  }
  assert.deepEqual(seen.map((e) => e.elite), want);
});

test('B-179: gemischtere Mitte (WAVE_EXTRAS nur Wellen 6-12, nicht 5 und 10), Welle 5 unverändert', () => {
  for (const w of Object.keys(WAVE_EXTRAS).map(Number)) assert.ok(w >= 6 && w <= 12 && w !== 10, `Welle ${w}`);
  assert.equal(waveSummary(6).tank, Math.floor(6 / 2) + 1 + WAVE_EXTRAS[6].tank);
  assert.equal(waveSummary(9).shielded, 1 + WAVE_EXTRAS[9].shielded);
  assert.equal(waveSummary(7).healer, 1 + WAVE_EXTRAS[7].healer);
  // Welle 5 bleibt wie bisher (Wunsch des Menschen): normale Abstände in der Goblin-Gruppe
  const grunts = waveFor(5).filter((e) => e.type === 'grunt');
  assert.ok(Math.abs(grunts[1].at - grunts[0].at - Math.max(0.3, 0.9 - 5 * 0.04)) < 1e-9);
});

// --- B-180: Nekromantin Phase 2 ---
const P2 = ENEMY_TYPES.necro.phase2;
// Direkttreffer mit festem Schaden (sofortiges Geschoss), ein kurzer Schritt
function shootNecro(s, e, dmg) {
  s.projectiles.push({ x: e.x, y: e.y, targetId: e.id, speed: 1e6, damage: dmg, splash: 0 });
  update(s, 1e-3);
}

test('B-180: Phasenwechsel genau einmal, sobald die HP auf phase2.at * maxHp fallen, mit Ereignis phase2', () => {
  const s = createGame();
  const n = spawnEnemy(s, 'necro', 10);
  const limit = P2.at * n.maxHp;
  shootNecro(s, n, n.maxHp - limit - 1); // knapp über der Schwelle
  assert.equal(n.phase, undefined);
  assert.equal(s.effects.filter((fx) => fx.kind === 'phase2').length, 0);
  shootNecro(s, n, 2); // über die Schwelle
  assert.equal(n.phase, 2);
  const ev = s.effects.filter((fx) => fx.kind === 'phase2');
  assert.equal(ev.length, 1);
  assert.equal(ev[0].id, n.id);
  assert.equal(ev[0].max, P2.shieldDuration);
  // nach dem Schild: weiterer Schaden, Heilung über die Schwelle und erneuter Fall lösen keinen zweiten Wechsel aus
  for (let t = 0; t < P2.shieldDuration + 0.1; t += 0.05) update(s, 0.05);
  s.enemies = s.enemies.filter((e) => e === n); // Beschworene stören hier nicht
  n.hp = n.maxHp;
  shootNecro(s, n, n.maxHp * 0.6);
  assert.equal(n.phase, 2);
  assert.ok(n.hp < limit, 'Schaden wirkt wieder');
  assert.equal(s.effects.filter((fx) => fx.kind === 'phase2').length, 0, 'kein zweites Ereignis');
  // Wer mit einem Treffer stirbt, wechselt nicht mehr die Phase
  const d = createGame();
  const m = spawnEnemy(d, 'necro', 10);
  shootNecro(d, m, m.maxHp + 1);
  assert.equal(d.effects.filter((fx) => fx.kind === 'phase2').length, 0);
  // Andere Bosse haben keine zweite Phase
  const o = spawnEnemy(d, 'boss', 10);
  shootNecro(d, o, o.maxHp * 0.6);
  assert.equal(o.phase, undefined);
});

test('B-180: Schild beim Phasenwechsel hält genau shieldDuration Sekunden', () => {
  const s = createGame();
  const n = spawnEnemy(s, 'necro', 10);
  shootNecro(s, n, n.maxHp * (1 - P2.at) + 1);
  const hp = n.hp;
  const t0 = n.shieldUntil - P2.shieldDuration;
  while (s.time < t0 + P2.shieldDuration - 0.05) {
    shootNecro(s, n, 50);
    update(s, 0.04);
  }
  assert.equal(n.hp, hp, 'im Schild kein Schaden');
  while (s.time < t0 + P2.shieldDuration + 0.01) update(s, 0.01);
  shootNecro(s, n, 50);
  assert.ok(Math.abs(n.hp - (hp - 50)) < 1e-9, 'nach dem Schild wieder Schaden');
});

test('B-180: zweite Phase beschwört im Takt phase2.summonInterval je phase2.summonCount Skelette', () => {
  assert.ok(P2.summonInterval < ENEMY_TYPES.necro.summonInterval && P2.summonCount > ENEMY_TYPES.necro.summonCount);
  const s = createGame();
  const n = spawnEnemy(s, 'necro', 10);
  n.dist = 8 * TILE; // Platz hinter ihr für die Beschworenen
  shootNecro(s, n, n.maxHp * (1 - P2.at) + 1);
  const t0 = s.time;
  const skeletons = () => s.enemies.filter((e) => e.type === 'skeleton').length;
  const step = 0.01;
  while (s.time < t0 + P2.summonInterval - 0.05) update(s, step);
  assert.equal(skeletons(), 0, 'vor phase2.summonInterval keine Beschwörung');
  while (s.time < t0 + P2.summonInterval + 0.05) update(s, step);
  assert.equal(skeletons(), P2.summonCount);
  while (s.time < t0 + 2 * P2.summonInterval + 0.05) update(s, step);
  assert.equal(skeletons(), 2 * P2.summonCount);
});
