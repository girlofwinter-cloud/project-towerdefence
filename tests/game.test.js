// Unit-Tests der Spiel-Logik (game.js, path.js, config.js). Ausführen: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, mapModifiers, update, buildTower, upgradeTower, sellTower, startWave, spawnEnemy, canBuild, towerStats, upgradeCost, togglePause, stepGame, setTargetMode, pickTarget } from '../src/game.js';

import { livesText } from '../src/hud.js';

import { buildPath, pointAt, pathTiles } from '../src/path.js';
import { TOWER_TYPES, MAX_WAVES, START_GOLD, START_LIVES, LOW_LIVES, WAYPOINTS, MAPS, DEFAULT_MAP_ID, TILE, COLS, ROWS, TARGET_MODES, waveFor, waveBonus, waveSummary, hpScale, ENEMY_TYPES, SPEED_STEPS, MAX_SUBSTEP } from '../src/config.js';

import { run, freeTileNearPath, mockCtx, recordEnemy } from './helpers.js';

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
  assert.equal(buildTower(s, 'sniper', 1, 0).reason, 'Nicht genug Gold');
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
  assert.equal(startWave(s).ok, false, 'zweite Welle parallel nicht erlaubt');
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
    const hasBoss = waveFor(w).some((e) => e.type === 'boss');
    assert.equal(hasBoss, w % 5 === 0, `Welle ${w}`);
  }
  assert.ok(waveFor(10).length > waveFor(1).length);
});

test('waveSummary: Anzahl pro Gegnertyp für Welle 1, 5 und 10', () => {
  assert.deepEqual(waveSummary(1), { grunt: 9 });
  assert.deepEqual(waveSummary(5), { grunt: 21, runner: 13, tank: 3, boss: 1 });
  assert.deepEqual(waveSummary(10), { grunt: 36, runner: 23, tank: 6, shielded: 1, healer: 1, boss: 2 });
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
  run(s, 90);
  assert.equal(s.waveActive, false);
  assert.equal(s.lives, START_LIVES);
  assert.ok(TILE > 0);
});

test('waveSummary: Summe entspricht waveFor für alle Wellen, Boss nur jede 5. Welle', () => {
  for (let w = 1; w <= MAX_WAVES; w++) {
    const s = waveSummary(w);
    assert.equal(Object.values(s).reduce((a, b) => a + b, 0), waveFor(w).length, `Welle ${w}`);
    assert.equal('boss' in s, w % 5 === 0, `Boss in Welle ${w}`);
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

// Freie Felder neben dem Weg, sortiert nach Anzahl Wegpunkte in Reichweite (deterministisch)
function rankedSpots(state, rangeTiles) {
  const spots = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!canBuild(state, c, r).ok) continue;
    const x = (c + 0.5) * TILE;
    const y = (r + 0.5) * TILE;
    let n = 0;
    for (let d = 0; d < state.path.length; d += 8) {
      const p = pointAt(state.path, d);
      if (Math.hypot(p.x - x, p.y - y) <= rangeTiles * TILE) n++;
    }
    if (n) spots.push({ c, r, n });
  }
  return spots.sort((a, b) => b.n - a.n || a.r - b.r || a.c - b.c);
}

test('Schwierigkeit: hpScale(1) == 1, Faktor pro Welle wächst bis Welle 10 und flacht danach ab', () => {
  assert.equal(hpScale(1), 1);
  const f = (w) => hpScale(w) / hpScale(w - 1);
  assert.ok(f(5) > 1, 'Welle 5 zäher als 4');
  assert.ok(f(10) > f(5), 'mittlere Wellen steiler als frühe');
  assert.ok(f(11) > 1 && f(11) < f(5), 'späte Wellen flacher, aber weiter steigend');
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

function playDt(mix, dt) {
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

const MIX_CANNON = ['arrow', 'cannon', 'cannon', 'frost'];
const MIX_ARROW = ['cannon', 'arrow', 'arrow', 'frost'];

// Wie playDt (gleiche Entscheidungen), liefert zusätzlich pro Welle den größten Wegfortschritt
// (dist / Weglänge, 0..1) eines Gegners und die verlorenen Leben. playDt selbst bleibt unverändert.
function playTracked(mix, dt) {
  const s = createGame();
  const spots = rankedSpots(s, TOWER_TYPES.cannon.range);
  const progress = [];
  const lost = [];
  let i = 0;
  while (s.status === 'playing' && s.wave < MAX_WAVES) {
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

const strategyCache = new Map();
function strategyRun(mix, dt) {
  const key = `${mix.join(',')}@${dt}`;
  if (!strategyCache.has(key)) strategyCache.set(key, playTracked(mix, dt));
  return strategyCache.get(key);
}

// "Nur Pfeiltürme, nie aufrüsten": baut jede Runde so viele Pfeiltürme wie möglich.
const arrowOnlyCache = new Map();
function arrowOnlyRun(dt) {
  if (!arrowOnlyCache.has(dt)) {
    const s = createGame();
    const spots = rankedSpots(s, TOWER_TYPES.arrow.range);
    while (s.status === 'playing' && s.wave < MAX_WAVES) {
      for (const p of spots) {
        if (s.gold < TOWER_TYPES.arrow.cost) break;
        buildTower(s, 'arrow', p.c, p.r);
      }
      startWave(s);
      for (let i = 0; i < Math.round(600 / dt) && s.waveActive && s.status === 'playing'; i++) update(s, dt);
    }
    arrowOnlyCache.set(dt, s);
  }
  return arrowOnlyCache.get(dt);
}

test('Simulation: Fortschrittsmessung ändert den Spielverlauf nicht (gleiches Ergebnis wie playDt)', () => {
  const ref = playDt(MIX_CANNON, 1 / 30);
  const run = strategyRun(MIX_CANNON, 1 / 30);
  assert.equal(run.state.status, ref.status);
  assert.equal(run.state.lives, ref.lives);
  assert.equal(run.state.gold, ref.gold);
  assert.equal(run.progress.length, MAX_WAVES);
});

// Mehrere vernünftige Reihenfolgen müssen Welle 20 mit Reserve gewinnen (kein Münzwurf), robust gegen den Zeitschritt
// (echtes Spiel läuft meist mit 1/60). Ersetzt die früheren Einzeltests zu Gewinn-Strategien (siehe docs/LEDGER.md).
test('Schwierigkeit: robuste Strategien gewinnen Welle 20 mit mindestens 2 Leben (dt 1/20, 1/30, 1/60, 1/120)', () => {
  const cases = [
    [MIX_CANNON, [1 / 30, 1 / 60, 1 / 20, 1 / 120]],
    [MIX_ARROW, [1 / 30, 1 / 60, 1 / 120]],
  ];
  for (const [mix, dts] of cases) {
    for (const dt of dts) {
      const s = strategyRun(mix, dt).state;
      assert.equal(s.status, 'won', `${mix.join(',')} dt=${dt}: Status ${s.status} in Welle ${s.wave}`);
      assert.ok(s.lives >= 2, `${mix.join(',')} dt=${dt}: nur ${s.lives} Leben übrig`);
    }
  }
});

test('Schwierigkeit: nur Pfeiltürme ohne Aufrüstung verlieren vor Welle 12 (dt 1/20, 1/30, 1/60, 1/120)', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 20, 1 / 120]) {
    const s = arrowOnlyRun(dt);
    assert.equal(s.status, 'lost', `dt=${dt}`);
    assert.ok(s.wave < 12, `dt=${dt}: verloren erst in Welle ${s.wave}`);
  }
});

// B-013: In der Spätphase (Welle 14-20) dringen Gegner messbar weit vor, bevor sie sterben.
// Vor B-013 erreichte der weiteste Gegner dort höchstens 75 % des Wegs, danach in mindestens 3 Wellen über 76 %.
// Kanonen-Reichweite 2,6 -> 3,4 (auf Wunsch des Menschen): gemessen 53-81 %, Schwelle 55 % (im schwächsten Lauf bestehen 5 von 7 Wellen, die Schwelle trennt also noch).
const LATE_PROGRESS = 0.55;
test('Spätphase: in mindestens 3 der Wellen 14-20 dringt ein Gegner über 55 % des Wegs vor (beide Strategien, dt 1/30 und 1/60)', () => {
  for (const mix of [MIX_CANNON, MIX_ARROW]) {
    for (const dt of [1 / 30, 1 / 60]) {
      const { progress } = strategyRun(mix, dt);
      const deep = progress.slice(13, 20).filter((p) => p > LATE_PROGRESS).length;
      assert.ok(deep >= 3, `${mix.join(',')} dt=${dt}: nur ${deep} Wellen über ${LATE_PROGRESS * 100} % (${progress.slice(13).map((p) => Math.round(p * 100))})`);
    }
  }
});

// B-013: Schildträger zwingt zu gemischten Setups. Die Strategien ohne Kanonen sterben schon vor Welle 9
// (siehe Test "nur Pfeiltürme"), also wird hier nur die Schildträger-Gruppe der Wellen 9-12 isoliert gegen zwei
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
test('Schildträger: ohne Kanonen kommen sie in den Wellen 9-12 weiter und kosten mehr Leben als mit Kanonen', () => {
  const noCannon = ['arrow', 'arrow', 'frost', 'arrow', 'arrow', 'frost'];
  const withCannon = ['arrow', 'cannon', 'frost', 'arrow', 'cannon', 'frost'];
  for (const dt of [1 / 30, 1 / 60]) {
    let lostNo = 0;
    let lostWith = 0;
    for (const wave of [9, 10, 11, 12]) {
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
      for (const p of r.figure) {
        if (p.depth === 0) continue;
        assert.ok(Math.hypot(p.x - r.e.x, p.y - r.e.y) + p.ext <= 1.4 * r.e.radius, `${type}: Figur zu gross`);
      }
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
    assert.equal(s.projectiles.at(-1)?.targetId, far.id, `${type} ohne Feld = first`);
    setTargetMode(s, t.id, 'close');
    t.cooldown = 0; update(s, 0.001);
    assert.equal(s.projectiles.at(-1).targetId, near.id, `${type} close`);
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
  const c = createGame({ mapId: 'forest' });
  assert.equal(c.mapId, 'forest');
  assert.notDeepEqual(c.path.points, def.path.points);
  assert.deepEqual(c.path.points, buildPath(MAPS.forest.waypoints, TILE).points);
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

// ---------- Map Wald: Hindernisse (B-028) ----------
test('Hindernisse: liegen im Feld, nie auf dem Weg; Wald hat genug Bauplaetze nahe am Weg', async () => {
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
  const f = createGame({ mapId: 'forest' });
  assert.ok(f.obstacles.size >= 30 && f.obstacles.size <= 45);
  let near = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!canBuild(f, c, r).ok) continue;
    let d = 99;
    for (const k of f.blocked) { const [a, b] = k.split(',').map(Number); d = Math.min(d, Math.max(Math.abs(a - c), Math.abs(b - r))); }
    if (d <= 2) near++;
  }
  assert.ok(near >= 25, `baubar nahe am Weg: ${near}`);
});

test('Hindernisse: canBuild lehnt ab, daneben normal; Karten ohne Hindernisse unveraendert', () => {
  const f = createGame({ mapId: 'forest' });
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
  assert.equal(m.obstacles.size, 0);
  assert.equal(createGame({ mapId: 'ice' }).obstacles.size, 0);
  assert.equal(canBuild(m, 0, 0).ok, true);
  assert.equal(canBuild(f, 3, 6).reason, 'Auf dem Weg kann nicht gebaut werden');
});

test('Hindernisse: Goblin erreicht auf dem Wald das Ziel', () => {
  const s = createGame({ mapId: 'forest' });
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
  for (const id of ['meadow', 'forest']) {
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

test('Modifikatoren: Eiswelt verlangsamt Gegner, stärkt Kanone, schwächt Frost', () => {
  const m = MAPS.ice.modifiers;
  assert.deepEqual(mapModifiers('ice'), { enemySpeed: m.enemySpeed, towerDamage: m.towerDamage, slowStrength: m.slowStrength });
  const s = createGame({ mapId: 'ice' });
  spawnEnemy(s, 'grunt', 1);
  assert.ok(s.enemies[0].speed < ENEMY_TYPES.grunt.speed);
  assert.equal(s.enemies[0].speed, ENEMY_TYPES.grunt.speed * m.enemySpeed);
  const c = shootAt('ice', 'cannon');
  assert.ok(c.p.damage > TOWER_TYPES.cannon.damage);
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
  mapModifiers('ice').towerDamage.cannon = 99; // Kopie, keine Mutation der Config
  assert.equal(MAPS.ice.modifiers.towerDamage.cannon, 1.25);
});

test('Eiswelt: Slowfaktor in (0,1), Upgrade-Stufen und Kanonen-Splash skalieren mit', () => {
  const mods = mapModifiers('ice');
  const f = towerStats({ type: 'frost', level: 1 }, mods);
  assert.ok(1 - f.slow > 0 && 1 - f.slow < 1);
  const c1 = towerStats({ type: 'cannon', level: 1 }, mods);
  const c3 = towerStats({ type: 'cannon', level: 3 }, mods);
  assert.ok(Math.abs(c3.damage - TOWER_TYPES.cannon.damage * 1.25 * 2.25) < 1e-9);
  assert.ok(Math.abs(c3.damage / c1.damage - 2.25) < 1e-9);
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
  for (const v of lost) assert.ok(Math.abs(v - TOWER_TYPES.cannon.damage * 1.25) < 1e-6, 'Splash ' + v);
});
