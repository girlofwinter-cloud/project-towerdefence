// Unit-Tests der Spiel-Logik. Ausführen: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, update, buildTower, upgradeTower, sellTower, startWave, spawnEnemy,
  canBuild, towerStats, upgradeCost, togglePause, stepGame, setTargetMode, pickTarget,
} from '../src/game.js';
import { tileHash, decorFor, isBorderTile, LARGE_DECOR_KINDS, LARGE_DECOR_RADIUS, BORDER_DECOR_CHANCE, INNER_DECOR_CHANCE } from '../src/decor.js';
import { livesText } from '../src/hud.js';
import { recoilOffset } from '../src/tower-fx.js';
import { buildPath, pointAt, pathTiles } from '../src/path.js';
import { TOWER_TYPES, MAX_WAVES, START_GOLD, START_LIVES, LOW_LIVES, WAYPOINTS, TILE, COLS, ROWS, TARGET_MODES, waveFor, waveBonus, waveSummary, hpScale, ENEMY_TYPES, SPEED_STEPS, MAX_SUBSTEP } from '../src/config.js';

// Hilfsfunktion: Spiel n Sekunden in kleinen Schritten laufen lassen
function run(state, seconds, dt = 1 / 60) {
  for (let t = 0; t < seconds; t += dt) update(state, dt);
}

// Erstes freies Feld neben dem Weg finden
function freeTileNearPath(state) {
  for (let r = 0; r < 14; r++) for (let c = 0; c < 20; c++) {
    if (canBuild(state, c, r).ok && (state.blocked.has(`${c},${r + 1}`) || state.blocked.has(`${c},${r - 1}`))) return [c, r];
  }
  throw new Error('kein Feld gefunden');
}

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
// Vor B-013 erreichte der weiteste Gegner dort höchstens 75 % des Wegs, jetzt in mindestens 3 Wellen über 76 %.
const LATE_PROGRESS = 0.76;
test('Spätphase: in mindestens 3 der Wellen 14-20 dringt ein Gegner über 76 % des Wegs vor (beide Strategien, dt 1/30 und 1/60)', () => {
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
      assert.ok(a.progress >= b.progress + 0.05, `Welle ${wave} dt=${dt}: ohne Kanonen ${a.progress.toFixed(2)}, mit ${b.progress.toFixed(2)}`);
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

// ---------- Dekoration (src/decor.js) ----------

test('Dekoration: deterministisch (gleiche Kachel, gleiches Ergebnis)', () => {
  const s = createGame();
  assert.equal(tileHash(3, 4), tileHash(3, 4));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    assert.deepEqual(decorFor(c, r, s.blocked), decorFor(c, r, s.blocked));
  }
});

test('Dekoration: nie auf Weg-Kacheln, grosse nur am Rand', () => {
  const s = createGame();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const d = decorFor(c, r, s.blocked);
    if (s.blocked.has(`${c},${r}`)) assert.equal(d, null);
    if (d && LARGE_DECOR_KINDS.includes(d.kind)) assert.ok(isBorderTile(c, r));
  }
  assert.equal(decorFor(-1, 2, s.blocked), null);
});

test('Dekoration: Dichte im erwarteten Bereich', () => {
  const s = createGame();
  let inner = 0, innerTotal = 0, border = 0, borderTotal = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (s.blocked.has(`${c},${r}`)) continue;
    const has = decorFor(c, r, s.blocked) !== null;
    if (isBorderTile(c, r)) { borderTotal++; if (has) border++; } else { innerTotal++; if (has) inner++; }
  }
  assert.ok(Math.abs(inner / innerTotal - INNER_DECOR_CHANCE) < 0.12);
  assert.ok(Math.abs(border / borderTotal - BORDER_DECOR_CHANCE) < 0.15);
  assert.ok(BORDER_DECOR_CHANCE <= 0.4, 'Randkacheln bleiben als bebaubar erkennbar');
});

test('Dekoration: grosse Dekoration bleibt samt Radius vollstaendig in ihrer Kachel', () => {
  const empty = new Set();
  let large = 0;
  for (const blocked of [createGame().blocked, empty]) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const d = decorFor(c, r, blocked);
      if (!d || !LARGE_DECOR_KINDS.includes(d.kind)) continue;
      large++;
      const R = LARGE_DECOR_RADIUS[d.kind];
      assert.ok(R > 0, d.kind);
      for (const v of [d.ox * TILE, d.oy * TILE]) {
        assert.ok(v - R >= 0 && v + R <= TILE, `${c},${r} ${d.kind}: ${v} +- ${R}`);
      }
    }
  }
  assert.ok(large > 20);
  for (const k of LARGE_DECOR_KINDS) assert.ok(LARGE_DECOR_RADIUS[k] * 2 <= TILE);
});

// ---------- Dekoration: Randfaelle (Tester) ----------
test('Dekoration: ausserhalb des Felds und negative Koordinaten ergeben null', () => {
  const blocked = new Set();
  for (const [c, r] of [[-1, 0], [0, -1], [-5, -5], [COLS, 0], [0, ROWS], [COLS + 3, ROWS + 3], [-1, 2], [COLS, 11]]) {
    assert.equal(decorFor(c, r, blocked), null, `${c},${r}`);
  }
});

test('Dekoration: keine Dekoration auf echten Weg-Kacheln aus WAYPOINTS', () => {
  const tiles = pathTiles(WAYPOINTS);
  let inField = 0;
  for (const key of tiles) {
    const [c, r] = key.split(',').map(Number);
    assert.equal(decorFor(c, r, tiles), null, key);
    if (c >= 0 && r >= 0 && c < COLS && r < ROWS) inField++;
  }
  assert.ok(inField > 20);
  // dieselbe Kachel ohne Sperre darf (ausser bei Zufallstreffer-Nein) Dekoration haben: Sperre ist der einzige Grund fuer null
  const free = new Set();
  let anyOnPath = 0;
  for (const key of tiles) {
    const [c, r] = key.split(',').map(Number);
    if (decorFor(c, r, free)) anyOnPath++;
  }
  assert.ok(anyOnPath > 0, 'Testbeleg: ohne blocked waere Dekoration moeglich');
});

test('Dekoration: Randkacheln (Ecken, Kanten) korrekt erkannt', () => {
  for (const [c, r] of [[0, 0], [COLS - 1, 0], [0, ROWS - 1], [COLS - 1, ROWS - 1], [0, 5], [COLS - 1, 5], [7, 0], [7, ROWS - 1]]) {
    assert.equal(isBorderTile(c, r), true, `${c},${r}`);
  }
  for (const [c, r] of [[1, 1], [COLS - 2, ROWS - 2], [10, 7], [1, ROWS - 2], [COLS - 2, 1]]) {
    assert.equal(isBorderTile(c, r), false, `${c},${r}`);
  }
  let borderCount = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (isBorderTile(c, r)) borderCount++;
  assert.equal(borderCount, 2 * COLS + 2 * (ROWS - 2));
});

test('Dekoration: innen nur kleine Arten, am Rand nur grosse Arten', () => {
  const empty = new Set();
  const innerKinds = new Set();
  const borderKinds = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const d = decorFor(c, r, empty);
    if (!d) continue;
    (isBorderTile(c, r) ? borderKinds : innerKinds).add(d.kind);
    assert.ok(d.ox >= 0.2 && d.ox <= 0.8 && d.oy >= 0.2 && d.oy <= 0.8);
    assert.ok([0, 1, 2].includes(d.variant));
  }
  for (const k of innerKinds) assert.ok(!LARGE_DECOR_KINDS.includes(k), `innen: ${k}`);
  for (const k of borderKinds) assert.ok(LARGE_DECOR_KINDS.includes(k), `rand: ${k}`);
  assert.ok(innerKinds.size >= 2 && borderKinds.size >= 2);
});

test('Dekoration: Hash stabil ueber viele Aufrufe, im Bereich, ohne Math.random', () => {
  const orig = Math.random;
  Math.random = () => { throw new Error('Math.random verboten'); };
  try {
    const first = [];
    for (let i = 0; i < 2000; i++) first.push(tileHash(i % 37, i % 23, i % 5));
    for (let i = 0; i < 2000; i++) {
      assert.equal(tileHash(i % 37, i % 23, i % 5), first[i]);
      assert.ok(first[i] >= 0 && first[i] < 4294967296 && Number.isInteger(first[i]));
    }
    assert.ok(new Set(first).size > 100);
    const s = createGame();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) decorFor(c, r, s.blocked);
  } finally { Math.random = orig; }
});

test('Dekoration: Verteilung ohne Cluster, weder leer noch voll', () => {
  const s = createGame();
  let total = 0, deco = 0;
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push([]);
    for (let c = 0; c < COLS; c++) {
      const has = decorFor(c, r, s.blocked) !== null;
      grid[r].push(has);
      if (!s.blocked.has(`${c},${r}`)) { total++; if (has) deco++; }
    }
  }
  assert.ok(deco > 0 && deco < total);
  // Innen: keine 3x3-Flaeche komplett voll und keine 3x3-Flaeche komplett leer (ausser Weg)
  let fullInner = 0, emptyBlocks = 0;
  for (let r = 1; r + 2 < ROWS - 1; r++) for (let c = 1; c + 2 < COLS - 1; c++) {
    let cnt = 0, free = 0;
    for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) {
      if (!s.blocked.has(`${c + dc},${r + dr}`)) { free++; if (grid[r + dr][c + dc]) cnt++; }
    }
    if (free === 9 && cnt === 9) fullInner++;
    if (free === 9 && cnt === 0) emptyBlocks++;
  }
  assert.equal(fullInner, 0);
  assert.ok(emptyBlocks < 6, `leere 3x3-Bloecke: ${emptyBlocks}`);
  // keine Zeile/Spalte am Rand komplett leer
  for (const r of [0, ROWS - 1]) assert.ok(grid[r].some(Boolean));
  for (const c of [0, COLS - 1]) assert.ok(grid.some((row) => row[c]));
});

// ---------- Rendering mit Mock-Kontext (Tester) ----------
function mockCtx(counts = {}) {
  const props = {};
  let depth = 0;
  return {
    counts,
    get depth() { return depth; },
    props,
    ctx: new Proxy({}, {
      get(_, k) {
        if (k in props) return props[k];
        return (...a) => {
          counts[k] = (counts[k] || 0) + 1;
          if (k === 'save') depth++;
          if (k === 'restore') { depth--; assert.ok(depth >= 0, 'restore ohne save'); }
        };
      },
      set(_, k, v) { props[k] = v; return true; },
    }),
  };
}

test('Render: laeuft in Node ohne document/OffscreenCanvas, Zustaende ohne Fehler', async () => {
  assert.equal(typeof document, 'undefined');
  const { render } = await import('../src/render.js');
  const s = createGame();
  const m = mockCtx();
  render(m.ctx, s, {});
  render(m.ctx, s, {});
  buildTower(s, 'arrow', 8, 5);
  s.enemies.push({ id: 1, type: 'grunt', x: 100, y: 100, radius: 10, hp: 5, maxHp: 10, slowUntil: 99 });
  s.projectiles.push({ x: 1, y: 1, towerType: 'cannon' });
  s.effects.push({ kind: 'explosion', x: 5, y: 5, r: 30, ttl: 1, max: 2 }, { kind: 'coin', x: 5, y: 5, ttl: 1, max: 2, text: '+5' });
  render(m.ctx, s, { hover: { col: 3, row: 3, ok: false }, buildType: 'arrow', selectedTowerId: s.towers[0].id });
  assert.equal(m.depth, 0, 'save/restore ausgewogen');
});

test('Render: Hintergrund-Cache wird genutzt und bei neuem Weg neu gebaut', async () => {
  const { render } = await import('../src/render.js');
  const offscreen = [];
  globalThis.document = {
    createElement() {
      const m = mockCtx();
      const c = { width: 0, height: 0, getContext: () => m.ctx, m };
      offscreen.push(c);
      return c;
    },
  };
  try {
    const s = createGame();
    const main = mockCtx();
    render(main.ctx, s, {});
    const off = offscreen[offscreen.length - 1];
    assert.equal(off.width, COLS * TILE);
    assert.equal(off.height, ROWS * TILE);
    assert.equal(main.counts.drawImage, 1);
    const drawn = off.m.counts.fillRect;
    assert.ok(drawn > 0);
    render(main.ctx, s, {});
    assert.equal(main.counts.drawImage, 2, 'Cache kopiert');
    assert.equal(off.m.counts.fillRect, drawn, 'nicht neu gezeichnet');
    render(main.ctx, createGame(), {});
    assert.ok(off.m.counts.fillRect > drawn, 'neuer Weg -> neu gebaut');
    assert.equal(off.m.depth, 0, 'save/restore im Hintergrund ausgewogen');
    assert.equal(off.m.props.globalAlpha, undefined);
    assert.equal(main.props.globalAlpha, undefined);
  } finally { delete globalThis.document; }
});

// ---------- Dekoration: tatsaechlich gezeichnete Formen (Tester, Runde 2) ----------
test('Render: gezeichnete Dekoration verlaesst ihre Kachel nicht und ragt nie auf Weg-Kacheln', async () => {
  const prims = [];
  const props = {};
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      return (...a) => {
        if (k === 'arc') prims.push({ k, x: a[0], y: a[1], rx: a[2], ry: a[2] });
        if (k === 'ellipse') prims.push({ k, x: a[0], y: a[1], rx: a[2], ry: a[3] });
        if (k === 'moveTo' || k === 'lineTo') prims.push({ k, x: a[0], y: a[1], rx: 0, ry: 0, stroke: props.strokeStyle });
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
  try {
    // frische Modulinstanz, damit kein Cache aus anderen Tests verwendet wird
    const { render } = await import('../src/render.js?geometrie');
    const s = createGame();
    render({ drawImage() {} }, s, {});
    const eps = 1e-9;
    const kinds = {};
    let checked = 0;
    for (const p of prims) {
      const c = Math.floor(p.x / TILE), r = Math.floor(p.y / TILE);
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
      if (s.blocked.has(`${c},${r}`)) continue; // Kiesel des Wegs selbst
      if (p.k === 'moveTo' || p.k === 'lineTo') { if (p.stroke !== '#5da654') continue; } // nur Grasbuschel-Dekoration, keine Halme
      const d = decorFor(c, r, s.blocked);
      assert.ok(d, `Form ohne Dekoration auf ${c},${r}`);
      checked++;
      kinds[d.kind] = (kinds[d.kind] || 0) + 1;
      const x0 = p.x - p.rx, x1 = p.x + p.rx, y0 = p.y - p.ry, y1 = p.y + p.ry;
      assert.ok(x0 >= c * TILE - eps && x1 <= (c + 1) * TILE + eps && y0 >= r * TILE - eps && y1 <= (r + 1) * TILE + eps,
        `${d.kind} auf ${c},${r} verlaesst die Kachel: x ${x0}..${x1}, y ${y0}..${y1}`);
    }
    assert.ok(checked > 100);
    for (const k of ['tree', 'bush', 'rock', 'flower', 'tuft', 'pebble']) assert.ok(kinds[k] > 0, `Art ${k} nie gezeichnet`);
  } finally { delete globalThis.document; }
});

// ---------- Tuerme: Zeichnung (B-010) ----------
test('recoilOffset: 0 ohne Schuss, Maximum direkt nach dem Schuss, monoton abklingend, nie negativ', () => {
  assert.equal(recoilOffset(0), 0);
  assert.equal(recoilOffset(-0.5), 0);
  assert.equal(recoilOffset(NaN), 0);
  assert.equal(recoilOffset(1), 1);
  assert.equal(recoilOffset(5), 1, 'ueber 1 wird begrenzt');
  let prev = Infinity;
  for (let f = 1; f >= -0.2; f -= 0.05) {
    const r = recoilOffset(f);
    assert.ok(r >= 0 && r <= 1);
    assert.ok(r <= prev + 1e-12, 'monoton fallend');
    prev = r;
  }
});

// Zeichnet einen Turm auf einen aufzeichnenden Mock-Kontext und liefert Fingerabdruck und Grenzen.
async function recordTower(type, level, cooldown = 0, angle = 0, selected = false) {
  const { drawTower } = await import('../src/render.js');
  const s = createGame();
  s.gold = 10000;
  const r = buildTower(s, type, 8, 5);
  assert.ok(r.ok);
  const t = r.tower;
  t.level = level;
  t.cooldown = cooldown;
  t.angle = angle;
  const props = {};
  const calls = [];
  let depth = 0;
  const stack = [];
  let ox = 0, oy = 0, rotated = false, slack = 0;
  const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  const pt = (x, y, rad = 0, radY = rad) => {
    if (rotated) {
      // beweglicher Teil: Radius um den Drehpunkt (Drehwinkel egal)
      const d = Math.hypot(x, y) + rad + slack;
      bounds.minX = Math.min(bounds.minX, ox - d); bounds.maxX = Math.max(bounds.maxX, ox + d);
      bounds.minY = Math.min(bounds.minY, oy - d); bounds.maxY = Math.max(bounds.maxY, oy + d);
    } else {
      bounds.minX = Math.min(bounds.minX, ox + x - rad); bounds.maxX = Math.max(bounds.maxX, ox + x + rad);
      bounds.minY = Math.min(bounds.minY, oy + y - radY); bounds.maxY = Math.max(bounds.maxY, oy + y + radY);
    }
  };
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      return (...a) => {
        calls.push(k + ':' + a.map((v) => (typeof v === 'number' ? v.toFixed(2) : v)).join(',') + '|' + props.fillStyle + '|' + props.strokeStyle);
        if (k === 'save') { depth++; stack.push([ox, oy, rotated, slack]); }
        else if (k === 'restore') { depth--; assert.ok(depth >= 0); [ox, oy, rotated, slack] = stack.pop(); }
        else if (k === 'translate') { if (rotated) { /* Rueckstoss zieht nur zurueck: Reichweite nach vorn wird kleiner */ } else { ox += a[0]; oy += a[1]; } }
        else if (k === 'rotate') rotated = true;
        else if (k === 'fillRect' || k === 'strokeRect') { pt(a[0], a[1]); pt(a[0] + a[2], a[1] + a[3]); }
        else if (k === 'arc') pt(a[0], a[1], a[2]);
        else if (k === 'ellipse') pt(a[0], a[1], a[2], a[3]);
        else if (k === 'moveTo' || k === 'lineTo') pt(a[0], a[1]);
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  drawTower(ctx, t, selected);
  return { t, calls, depth, props, bounds, print: calls.join('\n') };
}

test('Turm-Zeichnung: alle Typen/Stufen ohne Fehler, ausgewogen, innerhalb der Kachel', async () => {
  const TOL_UP = 4; // bewegliche Teile duerfen beim Zielen max. 4 px ueber den oberen Kachelrand ragen
  for (const type of Object.keys(TOWER_TYPES)) {
    for (let level = 1; level <= 3; level++) {
      for (const cooldown of [0, 0.5, TOWER_TYPES[type].rate]) {
        const rec = await recordTower(type, level, cooldown, 0.7);
        assert.equal(rec.depth, 0, `${type} L${level}: save/restore ausgewogen`);
        assert.equal(rec.props.globalAlpha, undefined);
        const x0 = rec.t.col * TILE, y0 = rec.t.row * TILE;
        const b = rec.bounds;
        assert.ok(b.minX >= x0 && b.maxX <= x0 + TILE, `${type} L${level}: x ${b.minX}..${b.maxX}`);
        assert.ok(b.minY >= y0 - TOL_UP && b.maxY <= y0 + TILE, `${type} L${level}: y ${b.minY}..${b.maxY}`);
      }
    }
  }
});

test('Turm-Zeichnung: Typen und Stufen unterscheiden sich, Auswahlrahmen bleibt', async () => {
  const seen = new Map();
  for (const type of Object.keys(TOWER_TYPES)) {
    for (let level = 1; level <= 3; level++) {
      const { print } = await recordTower(type, level);
      assert.ok(!seen.has(print), `${type} L${level} gleicht ${seen.get(print)}`);
      seen.set(print, `${type} L${level}`);
    }
  }
  assert.equal(seen.size, 12);
  const plain = await recordTower('arrow', 1, 0, 0, false);
  const sel = await recordTower('arrow', 1, 0, 0, true);
  assert.ok(!plain.calls.some((c) => c.startsWith('strokeRect')));
  assert.ok(sel.calls.some((c) => c.startsWith('strokeRect:' + (sel.t.x - 18).toFixed(2))));
});

test('Turm-Zeichnung: Rueckstoss zieht den beweglichen Teil direkt nach dem Schuss zurueck', async () => {
  for (const type of Object.keys(TOWER_TYPES)) {
    const rate = TOWER_TYPES[type].rate;
    const ready = await recordTower(type, 1, 0).then((r) => r.print);
    const shot = await recordTower(type, 1, rate).then((r) => r.print);
    const later = await recordTower(type, 1, rate * 0.3).then((r) => r.print);
    assert.notEqual(ready, shot, `${type}: Rueckstoss sichtbar`);
    assert.notEqual(shot, later, `${type}: klingt ab`);
    assert.equal(await recordTower(type, 1, -0.2).then((r) => r.print), ready, `${type}: negativer Cooldown = bereit`);
  }
});

// ---------- Tuerme: unabhaengige Pruefung (Tester, B-010) ----------
test('recoilOffset: Randfaelle (Infinity, -0, undefined, null, winzige Werte)', () => {
  assert.equal(recoilOffset(Infinity), 1);
  assert.equal(recoilOffset(-Infinity), 0);
  assert.ok(Object.is(recoilOffset(-0), 0), 'kein -0');
  assert.equal(recoilOffset(undefined), 0);
  assert.equal(recoilOffset(null), 0);
  assert.equal(recoilOffset(0.5), 0.25);
  assert.ok(recoilOffset(1e-9) >= 0 && recoilOffset(1e-9) < 1e-6);
});

test('Turm: cooldown/def.rate ist auf allen Stufen <= 1 (Rueckstoss nie ueber Maximum)', () => {
  for (const type of Object.keys(TOWER_TYPES)) {
    for (let level = 1; level <= 3; level++) {
      const stats = towerStats({ type, level });
      assert.ok(stats.rate / TOWER_TYPES[type].rate <= 1 + 1e-12, `${type} L${level}`);
    }
  }
});

// Zeichnet drawTower mit echter Transformationsmatrix (translate/rotate/save/restore) und
// liefert die Weltkoordinaten-Ausdehnung aller Primitive.
async function worldExtent(type, level, cooldown, angle) {
  const { drawTower } = await import('../src/render.js');
  const s = createGame();
  s.gold = 1e5;
  const t = buildTower(s, type, 8, 5).tower;
  t.level = level; t.cooldown = cooldown; t.angle = angle;
  let M = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const B = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const P = (x, y) => {
    const X = M[0] * x + M[2] * y + M[4], Y = M[1] * x + M[3] * y + M[5];
    B.minX = Math.min(B.minX, X); B.maxX = Math.max(B.maxX, X);
    B.minY = Math.min(B.minY, Y); B.maxY = Math.max(B.maxY, Y);
  };
  const props = {};
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      return (...a) => {
        if (k === 'save') stack.push(M);
        else if (k === 'restore') M = stack.pop();
        else if (k === 'translate') M = mul(M, [1, 0, 0, 1, a[0], a[1]]);
        else if (k === 'rotate') { const c = Math.cos(a[0]), sn = Math.sin(a[0]); M = mul(M, [c, sn, -sn, c, 0, 0]); }
        else if (k === 'fillRect' || k === 'strokeRect') { P(a[0], a[1]); P(a[0] + a[2], a[1]); P(a[0], a[1] + a[3]); P(a[0] + a[2], a[1] + a[3]); }
        else if (k === 'arc') { const full = Math.abs(a[4] - a[3]) >= 2 * Math.PI - 1e-9; for (let i = 0; i <= 64; i++) { const q = a[3] + (a[4] - a[3]) * i / 64; P(a[0] + a[2] * Math.cos(q), a[1] + a[2] * Math.sin(q)); } void full; }
        else if (k === 'ellipse') { for (let i = 0; i < 64; i++) { const q = i / 64 * 2 * Math.PI; P(a[0] + a[2] * Math.cos(q), a[1] + a[3] * Math.sin(q)); } }
        else if (k === 'moveTo' || k === 'lineTo') P(a[0], a[1]);
        else if (k === 'quadraticCurveTo') { P(a[0], a[1]); P(a[2], a[3]); }
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  drawTower(ctx, t, false);
  assert.equal(stack.length, 0, 'save/restore ausgewogen');
  return { B, x0: t.col * TILE, y0: t.row * TILE };
}

test('Turm: echte Weltkoordinaten bleiben links/rechts/unten in der Kachel, oben max. 3,5 px Ueberstand (nur Pfeil/Scharfschuetze)', async () => {
  const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2, 3 * Math.PI / 2, 5.5];
  for (const type of Object.keys(TOWER_TYPES)) {
    const maxTop = type === 'sniper' ? 3.5 : type === 'arrow' ? 1.5 : 0;
    for (let level = 1; level <= 3; level++) {
      for (const angle of angles) {
        for (const frac of [0, 0.5, 1]) {
          const { B, x0, y0 } = await worldExtent(type, level, frac * TOWER_TYPES[type].rate, angle);
          const tag = `${type} L${level} a=${angle.toFixed(2)} f=${frac}`;
          assert.ok(B.minX >= x0 - 1e-6 && B.maxX <= x0 + TILE + 1e-6, `${tag}: x ${B.minX - x0}..${B.maxX - x0}`);
          assert.ok(B.maxY <= y0 + TILE + 1e-6, `${tag}: unten ${B.maxY - y0}`);
          assert.ok(B.minY >= y0 - maxTop - 1e-6, `${tag}: oben ${B.minY - y0}`);
        }
      }
    }
  }
});

test('Turm: ungueltiger cooldown/angle/Stufe crasht nicht und bleibt in den Grenzen', async () => {
  for (const type of Object.keys(TOWER_TYPES)) {
    for (const cd of [undefined, NaN, -5, 1e9, Infinity, null]) {
      const { B, x0 } = await worldExtent(type, 2, cd, 0.3);
      assert.ok(Number.isFinite(B.minX) && B.minX >= x0 && B.maxX <= x0 + TILE, `${type} cd=${cd}`);
    }
  }
  await worldExtent('cannon', 1, 0, NaN);
});

test('Render: Tuerme aller Typen zeichnen, Cache ungestoert, Alpha und save/restore unveraendert', async () => {
  const { render } = await import('../src/render.js');
  const s = createGame();
  s.gold = 1e5;
  const types = Object.keys(TOWER_TYPES);
  let placed = 0;
  for (let c = 0; c < COLS && placed < types.length; c++) for (let rw = 0; rw < ROWS && placed < types.length; rw += 3) {
    const r = buildTower(s, types[placed], c, rw);
    if (r.ok) { r.tower.level = 1 + (placed % 3); r.tower.cooldown = 0.2; placed++; }
  }
  assert.equal(s.towers.length, types.length);
  const m = mockCtx();
  render(m.ctx, s, {});
  const base = m.counts.drawImage;
  render(m.ctx, s, { selectedTowerId: s.towers[0].id });
  assert.equal(m.counts.drawImage - base, 1, 'Hintergrund pro Frame genau einmal');
  assert.equal(m.depth, 0);
});

// ---------- Gegner: Zeichnung und Animation (B-011) ----------
import { walkPhase, animSpeedFactor, facingFor, facingFlip, facingTilt, WALK_RATE, TILT_MAX } from '../src/enemy-fx.js';

test('walkPhase: Wertebereich, Periodizitaet, Monotonie im Zyklus, Versatz durch id, Tempo ~ speedFactor', () => {
  for (let t = -3; t < 40; t += 0.37) {
    for (const id of [0, 1, 7, 123]) {
      const p = walkPhase(t, id, 1.3);
      assert.ok(p >= 0 && p < Math.PI * 2, `p=${p}`);
    }
  }
  const period = (Math.PI * 2) / (WALK_RATE * 1.7);
  assert.ok(Math.abs(walkPhase(2.5 + period, 4, 1.7) - walkPhase(2.5, 4, 1.7)) < 1e-9
    || Math.abs(Math.abs(walkPhase(2.5 + period, 4, 1.7) - walkPhase(2.5, 4, 1.7)) - Math.PI * 2) < 1e-9);
  // innerhalb eines Zyklus steigend (kleine Schritte ohne Ueberlauf)
  let prev = walkPhase(0, 0, 1);
  let wraps = 0;
  for (let t = 0.01; t < 1; t += 0.01) {
    const p = walkPhase(t, 0, 1);
    if (p < prev) wraps++; else assert.ok(p > prev);
    prev = p;
  }
  assert.ok(wraps <= 2);
  assert.notEqual(walkPhase(1, 1, 1), walkPhase(1, 2, 1), 'id verschiebt die Phase');
  // doppeltes Tempo -> doppelte Phasenaenderung (kleines dt)
  const d1 = walkPhase(0.05, 0, 1) - walkPhase(0, 0, 1);
  const d2 = walkPhase(0.05, 0, 2) - walkPhase(0, 0, 2);
  assert.ok(Math.abs(d2 - 2 * d1) < 1e-9);
});

test('animSpeedFactor: schnelle Gegner schneller, verlangsamte langsamer, fehlende Felder sicher', () => {
  const T = ENEMY_TYPES;
  const f = (type, slow) => animSpeedFactor({ speed: T[type].speed, slowUntil: slow ? 10 : 0, slowFactor: 0.5 }, 1);
  assert.ok(f('runner') > f('grunt') && f('grunt') > f('tank') && f('tank') > f('boss'));
  assert.ok(f('grunt', true) < f('grunt'));
  assert.ok(Math.abs(f('grunt', true) - f('grunt') * 0.5) < 1e-12);
  const bare = animSpeedFactor({}, 1);
  assert.ok(bare > 0 && Number.isFinite(bare));
});

test('facingFor/facingFlip/facingTilt: Richtung des Wegsegments, Spiegelung, Neigung', () => {
  const right = buildPath([[0, 0], [5, 0], [5, 4], [1, 4]], TILE);
  assert.equal(facingFor(right, 0), 0);
  assert.equal(facingFor(right, -5), 0, 'vor dem Start: erstes Segment');
  assert.equal(facingFor(right, 2 * TILE), 0);
  assert.ok(Math.abs(facingFor(right, 5 * TILE + 10) - Math.PI / 2) < 1e-12, 'abwaerts');
  assert.ok(Math.abs(Math.abs(facingFor(right, 9 * TILE + 10)) - Math.PI) < 1e-12, 'nach links');
  assert.ok(Math.abs(Math.abs(facingFor(right, 1e9)) - Math.PI) < 1e-12, 'hinter dem Ende: letztes Segment');
  const up = buildPath([[0, 4], [0, 0]], TILE);
  assert.ok(Math.abs(facingFor(up, 10) + Math.PI / 2) < 1e-12, 'aufwaerts');
  assert.equal(facingFor(null, 5), 0);
  assert.equal(facingFor({ segments: [] }, 5), 0);
  assert.equal(facingFlip(0), 1);
  assert.equal(facingFlip(Math.PI), -1);
  assert.equal(facingFlip(-Math.PI), -1);
  assert.equal(facingFlip(Math.PI / 2), 1);
  assert.equal(facingFlip(-Math.PI / 2), 1);
  assert.equal(facingTilt(0), 0);
  assert.ok(Math.abs(facingTilt(Math.PI / 2) - TILT_MAX) < 1e-12);
  assert.ok(Math.abs(facingTilt(-Math.PI / 2) + TILT_MAX) < 1e-12);
  // jedes Segment des echten Wegs liefert endliche Werte im Bereich
  const real = buildPath(WAYPOINTS, TILE);
  for (let d = 0; d < real.length; d += 7) {
    const a = facingFor(real, d);
    assert.ok(Number.isFinite(a) && Math.abs(facingTilt(a)) <= TILT_MAX + 1e-12);
  }
});

// Zeichnet einen Gegner auf einen Mock mit Matrix-Tracking; liefert Aufrufe, Weltpunkte und Grenzen.
async function recordEnemy(over, time = 1, path = buildPath(WAYPOINTS, TILE)) {
  const { drawEnemy } = await import('../src/render-enemies.js');
  const def = ENEMY_TYPES[over.type];
  const e = { id: 3, x: 200, y: 150, dist: 20, hp: 10, maxHp: 10, slowUntil: 0, slowFactor: 0.5, speed: def ? def.speed : 1, radius: def ? def.radius : 10, ...over };
  const props = {};
  const calls = [];
  const stack = [];
  const world = []; // { x, y, ext, hp }
  let m = [1, 0, 0, 1, 0, 0];
  let depth = 0;
  const HP = new Set(['#300', '#4cd964', '#ffcc00', '#ff3b30']);
  const tp = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const scaleOf = () => Math.max(Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3]));
  const add = (x, y, ext, box) => { const [wx, wy] = tp(x, y); world.push({ x: wx, y: wy, ext, box, hp: HP.has(props.fillStyle), depth }); };
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      return (...a) => {
        calls.push(k + ':' + a.map((v) => (typeof v === 'number' ? v.toFixed(2) : v)).join(',') + '|' + props.fillStyle + '|' + props.strokeStyle);
        if (k === 'save') { depth++; stack.push(m.slice()); }
        else if (k === 'restore') { depth--; assert.ok(depth >= 0); m = stack.pop(); }
        else if (k === 'translate') { m = [m[0], m[1], m[2], m[3], m[0] * a[0] + m[2] * a[1] + m[4], m[1] * a[0] + m[3] * a[1] + m[5]]; }
        else if (k === 'scale') { m = [m[0] * a[0], m[1] * a[0], m[2] * a[1], m[3] * a[1], m[4], m[5]]; }
        else if (k === 'rotate') {
          const c = Math.cos(a[0]), s = Math.sin(a[0]);
          m = [m[0] * c + m[2] * s, m[1] * c + m[3] * s, m[2] * c - m[0] * s, m[3] * c - m[1] * s, m[4], m[5]];
        }
        else if (k === 'fillRect' || k === 'strokeRect') { add(a[0], a[1], 0); add(a[0] + a[2], a[1] + a[3], 0); }
        else if (k === 'arc') add(a[0], a[1], a[2] * scaleOf());
        else if (k === 'ellipse') add(a[0], a[1], Math.max(a[2], a[3]) * scaleOf(), m[1] === 0 && m[2] === 0 && a[4] === 0 ? [a[2] * m[0], a[3] * m[3]] : undefined); // Box nur bei achsparalleler Ellipse
        else if (k === 'moveTo' || k === 'lineTo') add(a[0], a[1], 0);
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  drawEnemy(ctx, e, time, path);
  return { e, calls, depth, props, world, print: calls.join('\n'), figure: world.filter((p) => !p.hp) };
}

test('Gegner-Zeichnung: alle Typen und ein unbekannter ohne Fehler, ausgewogen, globalAlpha unveraendert', async () => {
  for (const type of ['grunt', 'runner', 'tank', 'boss', 'healer']) {
    for (const [slow, hp] of [[false, 10], [true, 10], [false, 3], [true, 0], [false, 10]]) {
      const r = await recordEnemy({ type, slowUntil: slow ? 99 : 0, hp });
      assert.equal(r.depth, 0, `${type}: save/restore`);
      assert.equal(r.props.globalAlpha, undefined, `${type}: globalAlpha`);
    }
  }
  // Gegner ohne dist/speed/slowFactor (wie im alten Render-Test) und ohne Weg
  const r = await recordEnemy({ type: 'grunt', dist: undefined, speed: undefined, slowFactor: undefined, slowUntil: 99 }, 1, null);
  assert.equal(r.depth, 0);
});

test('Gegner-Zeichnung: Figur bleibt im Radius, Schatten und Frost-Ring im groben Rahmen', async () => {
  for (const type of ['grunt', 'runner', 'tank', 'boss', 'healer']) {
    for (const slow of [false, true]) {
      for (const time of [0, 0.3, 1.7]) {
        for (const path of [buildPath([[0, 0], [5, 0]], TILE), buildPath([[5, 0], [0, 0]], TILE), buildPath([[0, 0], [0, 5]], TILE), buildPath([[0, 5], [0, 0]], TILE)]) {
          const r = await recordEnemy({ type, slowUntil: slow ? 99 : 0 }, time, path);
          const rad = r.e.radius;
          for (const p of r.world) {
            if (p.hp) continue;
            const d = p.box ? Math.hypot(Math.abs(p.x - r.e.x) + p.box[0], Math.abs(p.y - r.e.y) + p.box[1]) : Math.hypot(p.x - r.e.x, p.y - r.e.y) + p.ext;
            assert.ok(d <= 1.6 * rad, `${type} slow=${slow}: ${d.toFixed(1)} > ${(1.6 * rad).toFixed(1)}`);
          }
          // Figur selbst (in der transformierten Ebene) hoechstens ca. 1,4x
          for (const p of r.figure) {
            if (p.depth === 0) continue;
            assert.ok(Math.hypot(p.x - r.e.x, p.y - r.e.y) + p.ext <= 1.4 * rad, `${type}: Figur zu gross`);
          }
        }
      }
    }
  }
});

test('Gegner-Zeichnung: Typen unterscheiden sich, Boss ist am groessten', async () => {
  const prints = {};
  const extent = {};
  for (const type of ['grunt', 'runner', 'tank', 'boss', 'healer']) {
    const r = await recordEnemy({ type });
    prints[type] = r.print;
    extent[type] = Math.max(...r.figure.filter((p) => p.depth > 0).map((p) => Math.hypot(p.x - r.e.x, p.y - r.e.y) + p.ext)) / r.e.radius;
  }
  const keys = Object.keys(prints);
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) assert.notEqual(prints[keys[i]], prints[keys[j]], `${keys[i]} == ${keys[j]}`);
  assert.ok(prints.boss.length > prints.grunt.length, 'Boss ist aufwendiger');
  assert.ok(extent.boss > extent.grunt && extent.boss > 1.15, `Boss-Ausdehnung ${extent.boss}`);
  // Unbekannter Typ nutzt den Rueckfall (weiter zeichnen, nicht crashen)
  assert.ok(prints.healer.length > 0);
});

test('Gegner-Zeichnung: Animation ueber time, deterministisch, Tempo und id wirken', async () => {
  for (const type of ['grunt', 'runner', 'tank', 'boss']) {
    const a = await recordEnemy({ type }, 1.0);
    const a2 = await recordEnemy({ type }, 1.0);
    const b = await recordEnemy({ type }, 1.13);
    assert.equal(a.print, a2.print, `${type}: deterministisch`);
    assert.notEqual(a.print, b.print, `${type}: Animation aendert die Zeichnung`);
  }
  const id1 = await recordEnemy({ type: 'grunt', id: 1 }, 1.0);
  const id2 = await recordEnemy({ type: 'grunt', id: 2 }, 1.0);
  assert.notEqual(id1.print, id2.print, 'id verschiebt die Phase');
  // time wird nicht durch Echtzeit ersetzt
  const realNow = Date.now;
  Date.now = () => { throw new Error('Date.now im Zeichnen'); };
  try { await recordEnemy({ type: 'tank' }, 2); } finally { Date.now = realNow; }
});

test('Gegner-Zeichnung: Blick nach links spiegelt die Figur, senkrecht neigt sie', async () => {
  for (const type of ['grunt', 'runner', 'tank', 'boss']) {
    const r = await recordEnemy({ type, x: 200, y: 150 }, 0.8, buildPath([[0, 0], [5, 0]], TILE));
    const l = await recordEnemy({ type, x: 200, y: 150 }, 0.8, buildPath([[5, 0], [0, 0]], TILE));
    assert.ok(l.print.includes('scale:-1.00,1.00') && !r.print.includes('scale:-1.00,1.00'), `${type}: nur links gespiegelt`);
    const rf = r.figure.filter((p) => p.depth > 0);
    const lf = l.figure.filter((p) => p.depth > 0);
    assert.equal(rf.length, lf.length);
    let asym = 0;
    for (let i = 0; i < rf.length; i++) {
      assert.ok(Math.abs((rf[i].x - 200) + (lf[i].x - 200)) < 1e-6, `${type}: x nicht gespiegelt`);
      assert.ok(Math.abs(rf[i].y - lf[i].y) < 1e-6, `${type}: y muss gleich bleiben`);
      asym += Math.abs(rf[i].x - 200);
    }
    assert.ok(asym > 0);
    const down = await recordEnemy({ type }, 0.8, buildPath([[0, 0], [0, 5]], TILE));
    const up = await recordEnemy({ type }, 0.8, buildPath([[0, 5], [0, 0]], TILE));
    assert.notEqual(down.print, up.print, `${type}: auf/ab unterscheidbar`);
    assert.notEqual(down.print, r.print);
  }
});

test('Gegner-Zeichnung: Frost bleibt sichtbar (Ring plus Tint), HP-Balken vorhanden', async () => {
  for (const type of ['grunt', 'runner', 'tank', 'boss', 'healer']) {
    const n = await recordEnemy({ type });
    const f = await recordEnemy({ type, slowUntil: 99 });
    assert.ok(f.calls.length > n.calls.length, `${type}: Frost fuegt Zeichenaufrufe hinzu`);
    assert.ok(f.print.includes('#bdf0ff'), `${type}: Frost-Ring`);
    assert.ok(f.print.includes('rgba(150,220,255,0.4)'), `${type}: Frost-Tint`);
    assert.ok(!n.print.includes('#bdf0ff'));
    assert.ok(f.world.some((p) => p.hp), `${type}: HP-Balken`);
    const full = f.world.filter((p) => p.hp).map((p) => p.y);
    assert.ok(Math.max(...full) < f.e.y - f.e.radius, `${type}: HP-Balken ueber der Figur`);
  }
});

// ---- Tester-Ergaenzungen B-011 (unabhaengig geprueft) ----
function plainCtx() {
  const props = {};
  const st = { depth: 0, minDepth: 0, fills: [], draws: 0 };
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      return (...a) => {
        if (k === 'save') st.depth++;
        if (k === 'restore') { st.depth--; st.minDepth = Math.min(st.minDepth, st.depth); }
        if (k === 'fillRect') st.fills.push(a);
        if (k === 'drawImage') st.draws++;
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  return { ctx, st, props };
}
const testEnemy = (over) => ({ id: 1, x: 100, y: 100, dist: 50, hp: 5, maxHp: 10, slowUntil: 0, slowFactor: 0.5, speed: 1.4, radius: 11, type: 'grunt', ...over });

test('Gegner-Zeichnung: Prototype-Namen als Typ crashen nicht und bleiben ausgewogen', async () => {
  const { drawEnemy } = await import('../src/render-enemies.js');
  const path = buildPath(WAYPOINTS, TILE);
  for (const type of ['constructor', '__proto__', 'toString', 'hasOwnProperty', '', undefined, null]) {
    const { ctx, st } = plainCtx();
    drawEnemy(ctx, testEnemy({ type }), 1, path);
    assert.equal(st.depth, 0, `Typ ${String(type)}`);
    assert.equal(st.minDepth, 0);
  }
});

test('Gegner-Zeichnung: kaputter Weg und exotische dist-Werte crashen nicht', async () => {
  const { drawEnemy } = await import('../src/render-enemies.js');
  for (const path of [null, undefined, {}, { segments: [] }, { segments: null }]) {
    const { ctx, st } = plainCtx();
    drawEnemy(ctx, testEnemy({}), 1, path);
    assert.equal(st.depth, 0);
  }
  const real = buildPath(WAYPOINTS, TILE);
  for (const dist of [-5, 1e9, NaN, Infinity, -Infinity, undefined]) {
    const { ctx, st } = plainCtx();
    drawEnemy(ctx, testEnemy({ dist }), 1, real);
    assert.equal(st.depth, 0, `dist ${dist}`);
  }
});

test('walkPhase: bei grossem und negativem time im Bereich und stetig', async () => {
  const { walkPhase, WALK_RATE } = await import('../src/enemy-fx.js');
  for (const time of [0, 1, 1e3, 1e6, -1e3, -1e6]) {
    for (const id of [0, 1, 7, 1e6, -4, 2.5]) {
      const p = walkPhase(time, id, 1);
      assert.ok(p >= 0 && p < Math.PI * 2, `time ${time} id ${id}: ${p}`);
    }
  }
  // Bei time = 1e6 (ca. 11 Tage Spielzeit) ist ein 16-ms-Schritt noch genau (< 1e-6 Abweichung)
  const d = walkPhase(1e6 + 0.016, 0, 1) - walkPhase(1e6, 0, 1);
  assert.ok(Math.abs(d - 0.016 * WALK_RATE) < 1e-6);
  // speedFactor 0: Phase steht still (nur id-Versatz), kein NaN
  assert.equal(walkPhase(5, 1, 0), walkPhase(50, 1, 0));
});

test('Gegner-Zeichnung: HP-Balken-Randfaelle (voll, leer, ueber max, negativ) ohne Absturz', async () => {
  const { drawEnemy } = await import('../src/render-enemies.js');
  const path = buildPath(WAYPOINTS, TILE);
  const widthOf = (hp, maxHp) => {
    const { ctx, st } = plainCtx();
    drawEnemy(ctx, testEnemy({ hp, maxHp }), 1, path);
    return st.fills[st.fills.length - 1][2];
  };
  assert.equal(widthOf(10, 10), 22);
  assert.equal(widthOf(0, 10), 0);
  assert.equal(widthOf(-5, 10), 0);
  assert.equal(widthOf(5, 10), 11);
  // maxHp = 0 oder NaN: Breite ist nicht endlich -> Canvas zeichnet nichts, aber es wirft nicht
  for (const [hp, maxHp] of [[5, 0], [0, 0], [NaN, 10], [5, NaN]]) widthOf(hp, maxHp);
});

test('Gegner-Zeichnung: Boss-HP-Balken liegt ueber der Krone (Abstand zur Figur > 0)', async () => {
  const { drawEnemy } = await import('../src/render-enemies.js');
  for (const type of ['grunt', 'runner', 'tank', 'boss']) {
    const { ctx, st } = plainCtx();
    const e = testEnemy({ type, radius: ENEMY_TYPES[type].radius, speed: ENEMY_TYPES[type].speed });
    drawEnemy(ctx, e, 1, buildPath(WAYPOINTS, TILE));
    const y = st.fills[st.fills.length - 1][1];
    // Balken-Unterkante muss mindestens 1,35 r (Krone) + Luft ueber der Mitte liegen
    assert.ok(e.y - (y + 4) >= e.radius * 1.2, `${type}: Balken-Unterkante ${e.y - (y + 4)}`);
  }
});

test('Gegner-Zeichnung: Hintergrund-Cache bleibt bei Gegnern aller Typen ungestoert, globalAlpha unveraendert', async () => {
  const hadOff = 'OffscreenCanvas' in globalThis;
  const { render } = await import('../src/render.js');
  const state = createGame();
  for (const type of ['grunt', 'runner', 'tank', 'boss', 'unbekannt']) {
    state.enemies.push(testEnemy({ type, id: state.enemies.length + 1, slowUntil: type === 'tank' ? 99 : 0 }));
  }
  const { ctx, st, props } = plainCtx();
  render(ctx, state, { hover: null, selectedTowerId: null });
  render(ctx, state, { hover: null, selectedTowerId: null });
  assert.equal(st.depth, 0);
  assert.equal(st.minDepth, 0);
  assert.equal(props.globalAlpha, undefined);
  assert.equal(hadOff, 'OffscreenCanvas' in globalThis);
});

// ---------- Projektile und Effekte (B-012) ----------
import {
  createFx, syncTime, resetFx, spawnParticle, updateParticles, liveParticles, syncFx,
  shakeAmplitude, shakeOffset, triggerShake, MAX_PARTICLES, MAX_STEP, SHAKE_COOLDOWN, SHAKE_MAX, SHAKE_DURATION,
  K_SPARK, K_SMOKE, K_COIN,
} from '../src/fx-system.js';

// Math.random darf in der Partikel-Logik nie benutzt werden
async function withoutRandom(fn) {
  const orig = Math.random;
  Math.random = () => { throw new Error('Math.random verboten'); };
  try { return await fn(); } finally { Math.random = orig; }
}

test('fx-system: Pool ist begrenzt und ueberschreibt das Aelteste', () => {
  const fx = createFx();
  for (let i = 0; i < MAX_PARTICLES + 10; i++) spawnParticle(fx, K_SPARK, i, 0, 0, 0, 1, 1);
  assert.equal(liveParticles(fx), MAX_PARTICLES);
  // die ersten 10 (x = 0..9) wurden durch x = 256..265 ersetzt
  assert.equal(fx.px[0], MAX_PARTICLES);
  assert.equal(fx.px[9], MAX_PARTICLES + 9);
  assert.equal(fx.px[10], 10);
});

test('fx-system: Alterung nur bei dt > 0, Partikel laufen ab', () => {
  const fx = createFx();
  spawnParticle(fx, K_SMOKE, 5, 5, 10, 0, 0.5, 2);
  updateParticles(fx, 0);
  updateParticles(fx, -1);
  updateParticles(fx, NaN);
  assert.equal(fx.page[0], 0);
  assert.equal(fx.px[0], 5);
  updateParticles(fx, 0.2);
  assert.ok(Math.abs(fx.page[0] - 0.2) < 1e-6);
  assert.ok(fx.px[0] > 5);
  updateParticles(fx, 0.4);
  assert.equal(liveParticles(fx), 0);
});

test('fx-system: syncTime begrenzt den Zeitschritt, Pause gibt 0, Zeitsprung rueckwaerts und neuer Weg setzen zurueck', () => {
  const fx = createFx();
  const path = {};
  assert.equal(syncTime(fx, 1, path), 0); // erster Aufruf = Reset
  assert.ok(Math.abs(syncTime(fx, 1.05, path) - 0.05) < 1e-9);
  assert.equal(syncTime(fx, 1.05, path), 0, 'Pause');
  assert.equal(syncTime(fx, 500, path), MAX_STEP, 'grosser Sprung begrenzt');
  spawnParticle(fx, K_SPARK, 0, 0, 0, 0, 1, 1);
  assert.equal(syncTime(fx, 3, path), 0, 'Zeit rueckwaerts -> Reset');
  assert.equal(liveParticles(fx), 0);
  spawnParticle(fx, K_SPARK, 0, 0, 0, 0, 1, 1);
  assert.equal(syncTime(fx, 3.1, {}), 0, 'neuer Weg -> Reset');
  assert.equal(liveParticles(fx), 0);
  assert.equal(syncTime(fx, NaN, fx.pathRef), 0);
});

test('fx-system: Screen-Shake ist 0 ausserhalb, begrenzt, klingt monoton ab, deterministisch', () => {
  assert.equal(shakeAmplitude(0.9, 1, 2), 0, 'vor Start');
  assert.equal(shakeAmplitude(1 + SHAKE_DURATION, 1, 2), 0, 'nach Ende');
  assert.equal(shakeAmplitude(1, 1, 0), 0);
  assert.equal(shakeOffset(5, 1, 2, 0), 0);
  let prev = Infinity;
  for (let i = 0; i < 30; i++) {
    const t = 1 + (i / 30) * SHAKE_DURATION;
    const a = shakeAmplitude(t, 1, 100); // viel zu stark angefordert
    assert.ok(a <= SHAKE_MAX && a >= 0 && a <= prev);
    prev = a;
    for (const axis of [0, 1]) {
      const o = shakeOffset(t, 1, 100, axis);
      assert.ok(Math.abs(o) <= SHAKE_MAX);
      assert.equal(o, shakeOffset(t, 1, 100, axis));
    }
  }
  assert.ok(SHAKE_MAX <= 3);
  const fx = createFx();
  triggerShake(fx, 2, 100);
  assert.equal(fx.shakeStrength, SHAKE_MAX);
});

// Spielzustand mit Projektilen/Effekten fuer die Ableitung
function fxState(time = 1) {
  const s = createGame();
  s.time = time;
  return s;
}

test('fx-system: Projektil verschwindet -> Treffer-Blitz; Richtung aus der Bewegung', () => {
  const fx = createFx();
  const s = fxState(1);
  const p = { x: 10, y: 10, tx: 100, ty: 10, towerType: 'arrow' };
  s.projectiles.push(p);
  syncFx(fx, s);
  const slot = fx.slotOf.get(p);
  assert.ok(Math.abs(fx.sDx[slot] - 1) < 1e-6, 'Startrichtung zum Ziel');
  s.time = 1.016;
  p.x = 10; p.y = 20;
  syncFx(fx, s);
  assert.ok(fx.sDy[slot] > 0.99, 'Richtung aus der Bewegung');
  const before = liveParticles(fx);
  s.time = 1.032;
  s.projectiles = [];
  syncFx(fx, s);
  assert.ok(liveParticles(fx) > before, 'Treffer erzeugt Blitz und Funken');
  assert.equal(fx.sActive[slot], 0);
});

test('fx-system: Effekte erzeugen Partikel genau einmal; grosse Explosion loest Shake aus, kleine nicht', () => {
  const fx = createFx();
  const s = fxState(2);
  s.effects.push({ kind: 'explosion', x: 50, y: 50, r: 44, ttl: 0.3, max: 0.3 });
  syncFx(fx, s);
  const n = liveParticles(fx);
  assert.ok(n > 5);
  assert.ok(fx.shakeStrength > 0 && fx.shakeStrength <= SHAKE_MAX);
  syncFx(fx, s); // gleicher Effekt, gleiche Zeit
  assert.equal(liveParticles(fx), n);

  const fx2 = createFx();
  const s2 = fxState(2);
  s2.effects.push({ kind: 'explosion', x: 5, y: 5, r: 10, ttl: 0.3, max: 0.3 }, { kind: 'coin', x: 5, y: 5, ttl: 1, max: 1, text: '+1' }, { kind: 'zzz' }, null);
  syncFx(fx2, s2);
  assert.equal(fx2.shakeStrength, 0);
  let coins = 0;
  for (let i = 0; i < MAX_PARTICLES; i++) if (fx2.pkind[i] === K_COIN) coins++;
  assert.equal(coins, 1);
});

test('fx-system: Shake-Sperrzeit - zwei Explosionen kurz hintereinander = ein Shake, danach wieder moeglich, Reset leert die Sperre', () => {
  const fx = createFx();
  const s = fxState(2);
  s.effects.push({ kind: 'explosion', x: 50, y: 50, r: 44, ttl: 0.3, max: 0.3 });
  syncFx(fx, s);
  assert.equal(fx.shakeStart, 2);
  const n = liveParticles(fx);
  s.time = 2.5; // innerhalb der Sperre: Partikel ja, neuer Shake nein
  s.effects.push({ kind: 'explosion', x: 60, y: 60, r: 44, ttl: 0.3, max: 0.3 });
  syncFx(fx, s);
  assert.equal(fx.shakeStart, 2, 'kein zweiter Shake in der Sperrzeit');
  assert.ok(liveParticles(fx) > n - 1 && fx.pkind.some((k) => k === K_SPARK), 'Funken trotzdem');
  s.time = 2 + SHAKE_COOLDOWN + 0.01; // Sperre vorbei
  s.effects.push({ kind: 'explosion', x: 70, y: 70, r: 44, ttl: 0.3, max: 0.3 });
  syncFx(fx, s);
  assert.equal(fx.shakeStart, s.time, 'nach der Sperre wieder ein Shake');
  // Reset (Zeitsprung rueckwaerts) leert die Sperre
  s.time = 1;
  s.effects.push({ kind: 'explosion', x: 80, y: 80, r: 44, ttl: 0.3, max: 0.3 });
  syncFx(fx, s); // Reset, Effekt wird im selben Frame neu gesehen
  assert.equal(fx.shakeStart, 1, 'nach Reset sofort wieder ein Shake');
});

test('fx-system: deterministisch, ohne Math.random, Zustand nur gelesen', async () => {
  await withoutRandom(() => {
    const run1 = () => {
      const fx = createFx();
      const s = fxState(1);
      const frozen = JSON.stringify(s);
      s.projectiles.push({ x: 0, y: 0, tx: 80, ty: 0, towerType: 'cannon' }, { x: 0, y: 0, tx: 80, ty: 0, towerType: 'frost' });
      s.effects.push({ kind: 'explosion', x: 50, y: 50, r: 44, ttl: 0.3, max: 0.3 });
      const before = JSON.stringify(s);
      for (let i = 0; i < 30; i++) {
        s.time += 1 / 60;
        for (const p of s.projectiles) p.x += 2;
        syncFx(fx, s);
      }
      assert.equal(JSON.stringify(s.projectiles.map((p) => p.towerType)), JSON.stringify(['cannon', 'frost']));
      assert.notEqual(frozen, before);
      return Array.from(fx.px).join() + Array.from(fx.pvy).join() + fx.pkind.join();
    };
    assert.equal(run1(), run1());
  });
});

test('fx-system: viele Projektile (ueber Tracking-Grenze) und Pool-Grenze crashen nicht', () => {
  const fx = createFx();
  const s = fxState(1);
  for (let i = 0; i < 400; i++) s.projectiles.push({ x: i, y: 0, tx: 500, ty: 0, towerType: i % 2 ? 'frost' : 'cannon' });
  for (let f = 0; f < 20; f++) { s.time += 1 / 60; syncFx(fx, s); }
  assert.ok(liveParticles(fx) <= MAX_PARTICLES);
});

// ---------- Render mit Effekten ----------
function fxRenderState() {
  const s = createGame();
  s.time = 5;
  for (const t of ['arrow', 'cannon', 'frost', 'sniper', 'zzz', '__proto__', undefined]) {
    s.projectiles.push({ x: 100, y: 100, tx: 300, ty: 100, towerType: t });
  }
  s.projectiles.push({ x: 1, y: 1, towerType: 'cannon' }, { x: NaN, y: 5, tx: Infinity, towerType: 'arrow' });
  s.effects.push(
    { kind: 'explosion', x: 200, y: 200, r: 44, ttl: 0.2, max: 0.3 },
    { kind: 'coin', x: 220, y: 200, text: '+5', ttl: 0.5, max: 0.8 },
    { kind: 'unbekannt', x: 1, y: 1, ttl: 1, max: 1 },
  );
  return s;
}

test('Effekt-Render: alle Projektil-/Effektarten ohne Fehler, ausgewogen, globalAlpha unveraendert', async () => {
  const { render } = await import('../src/render.js');
  const s = fxRenderState();
  const m = mockCtx();
  m.props.globalAlpha = 1;
  for (let i = 0; i < 40; i++) {
    s.time += 1 / 30;
    render(m.ctx, s, {});
    for (const p of s.projectiles) p.x += 4;
    if (i === 20) s.projectiles = [];
  }
  assert.equal(m.depth, 0);
  assert.equal(m.props.globalAlpha, 1);
});

test('Effekt-Render: deterministisch, aendert sich ueber die Zeit, Pause friert ein', async () => {
  const { render } = await import('../src/render.js');
  const { getFx } = await import('../src/render-fx.js');
  const record = (steps, dtStep) => {
    const s = fxRenderState();
    const log = [];
    const props = {};
    const ctx = new Proxy({}, {
      get(_, k) { if (k in props) return props[k]; return (...a) => { log.push(k + a.map((v) => (typeof v === 'number' ? v.toFixed(3) : '')).join(',')); }; },
      set(_, k, v) { props[k] = v; return true; },
    });
    for (let i = 0; i < steps; i++) { s.time += dtStep; render(ctx, s, {}); }
    return log.join('|');
  };
  const a = await withoutRandom(() => record(10, 1 / 30));
  const b = await withoutRandom(() => record(10, 1 / 30));
  assert.equal(a, b, 'deterministisch (auch nach Neustart des Zustands)');
  assert.notEqual(record(5, 1 / 30), record(10, 1 / 30), 'Bild aendert sich ueber die Zeit');
  // Pause: Partikel altern nicht
  const s = fxRenderState();
  const m = mockCtx();
  render(m.ctx, s, {});
  const fx = getFx();
  const ages = Array.from(fx.page).join();
  render(m.ctx, s, {});
  render(m.ctx, s, {});
  assert.equal(Array.from(fx.page).join(), ages);
});

test('Effekt-Render: Neustart leert den Pool, kein Zustand-Leak zwischen Spielen', async () => {
  const { render } = await import('../src/render.js');
  const { getFx } = await import('../src/render-fx.js');
  const m = mockCtx();
  const s1 = fxRenderState();
  render(m.ctx, s1, {});
  assert.ok(liveParticles(getFx()) > 0);
  assert.ok(getFx().shakeStrength > 0);
  const s2 = createGame(); // neue path.points-Referenz
  s2.time = 9;
  render(m.ctx, s2, {});
  assert.equal(liveParticles(getFx()), 0);
  assert.equal(getFx().shakeStrength, 0);
  // gleiche Referenz, aber Zeit springt zurueck
  const s3 = fxRenderState();
  render(m.ctx, s3, {});
  s3.projectiles = []; s3.effects = [];
  s3.time = 1;
  render(m.ctx, s3, {});
  assert.equal(liveParticles(getFx()), 0);
  assert.equal(m.depth, 0);
});

test('Effekt-Render: Shake verschiebt nur die Zeichnung (translate <= 3 px), Hover/Eingabe unveraendert', async () => {
  // Frisches Modul: unabhaengig davon, ob ein frueherer Test den Hintergrund-Cache gefuellt hat.
  const { render } = await import('../src/render.js?b012-shake');
  const s = createGame();
  s.time = 3;
  const ui = { hover: { col: 3, row: 3, ok: true }, buildType: 'arrow', selectedTowerId: null };
  const uiCopy = JSON.stringify(ui);
  const calls = [];
  const props = {};
  const ctx = new Proxy({}, {
    get(_, k) { if (k in props) return props[k]; return (...a) => { if (k === 'translate') calls.push(a); }; },
    set(_, k, v) { props[k] = v; return true; },
  });
  render(ctx, s, ui); // fuellt ggf. den Cache
  calls.length = 0;
  render(ctx, s, ui);
  const base = calls.length; // translate des Hintergrunds je Frame (0 mit Cache, 2 ohne), ohne Explosion kein Shake
  s.effects.push({ kind: 'explosion', x: 200, y: 200, r: 44, ttl: 0.3, max: 0.3 });
  s.time = 3.016;
  render(ctx, s, ui); // Explosion wird erkannt, Shake startet (Versatz im ersten Moment noch 0)
  s.time = 3.05;
  calls.length = 0;
  render(ctx, s, ui);
  assert.equal(calls.length, 2 * base + 1, 'genau ein Shake-translate zwischen zwei Hintergrund-Zeichnungen');
  const [x, y] = calls[base];
  assert.ok(Math.abs(x) <= SHAKE_MAX && Math.abs(y) <= SHAKE_MAX, 'Shake <= SHAKE_MAX');
  assert.ok(x !== 0 && y !== 0, 'Shake aktiv');
  assert.equal(JSON.stringify(ui), uiCopy, 'ui unveraendert');
  s.time = 10; // Shake abgeklungen
  calls.length = 0;
  render(ctx, s, ui);
  assert.equal(calls.length, base, 'Shake endet');
});

// --- Tester-Ergaenzungen B-012: Fuzz mit Zeitlimit, Reihenfolge-Unabhaengigkeit, Randfaelle ---
// Eigene createFx()-Instanzen bzw. frisches Modul (?query), damit nichts vom Modul-Singleton leakt.
function fuzzRng(seed) {
  let x = seed >>> 0;
  return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296;
}

test('B-012 Tester: Fuzz (NaN/Infinity/Zeitspruenge/viele Objekte) terminiert, jeder Aufruf < 250 ms, Shake <= 3', async () => {
  const fxs = await import('../src/fx-system.js?tester-fuzz');
  const fx = fxs.createFx();
  const R = fuzzRng(4711);
  const weird = [NaN, Infinity, -Infinity, -1, 0, 1e308, -1e308, 1e-300, 5e9, 100, 200.5];
  const pick = () => (R() < 0.5 ? weird[(R() * weird.length) | 0] : R() * 800 - 100);
  const types = ['arrow', 'cannon', 'frost', 'sniper', 'x', '__proto__', 'constructor', undefined, 5];
  const path = { points: [] };
  let time = 0;
  let worst = 0;
  for (let it = 0; it < 600; it++) {
    const projectiles = [];
    const effects = [];
    for (let i = 0, n = (R() * 700) | 0; i < n; i++) {
      projectiles.push({ x: pick(), y: pick(), tx: pick(), ty: pick(), towerType: types[(R() * types.length) | 0] });
    }
    for (let i = 0, n = (R() * 300) | 0; i < n; i++) {
      effects.push({ kind: ['explosion', 'coin', 'x', undefined][(R() * 4) | 0], x: pick(), y: pick(), r: pick(), ttl: pick(), max: pick() });
    }
    const j = R();
    time = j < 0.05 ? pick() : j < 0.1 ? time - R() * 10 : j < 0.2 ? time : time + R() * 3;
    const t0 = performance.now();
    fxs.syncFx(fx, { time, path: R() < 0.05 ? { points: [] } : path, projectiles, effects });
    worst = Math.max(worst, performance.now() - t0);
    assert.ok(fx.head >= 0 && fx.head < fxs.MAX_PARTICLES, 'Ringpuffer-Index gueltig');
    assert.ok(fxs.liveParticles(fx) <= fxs.MAX_PARTICLES);
    const a = fxs.shakeAmplitude(fx.lastTime, fx.shakeStart, fx.shakeStrength);
    assert.ok(a >= 0 && a <= fxs.SHAKE_MAX, `Shake-Amplitude ${a}`);
    const o = fxs.shakeOffset(fx.lastTime, fx.shakeStart, fx.shakeStrength, it & 1);
    assert.ok(Math.abs(o) <= fxs.SHAKE_MAX);
  }
  assert.ok(worst < 250, `langsamster syncFx-Aufruf ${worst.toFixed(1)} ms`);
});

test('B-012 Tester: Zeitschritt-Randfaelle von syncTime (NaN, Infinity, negativ, riesig, gleiche Zeit)', async () => {
  const { createFx, syncTime, MAX_STEP } = await import('../src/fx-system.js?tester-time');
  const fx = createFx();
  const path = {};
  assert.equal(syncTime(fx, 10, path), 0);
  assert.equal(syncTime(fx, 10, path), 0, 'gleiche Zeit = Pause');
  assert.equal(syncTime(fx, 10.05, path), 10.05 - 10);
  assert.equal(syncTime(fx, 1e9, path), MAX_STEP);
  assert.equal(syncTime(fx, Infinity, path), 0, 'Infinity wird wie 0 behandelt (Reset), nie unendlich');
  assert.equal(syncTime(fx, NaN, path), 0);
  assert.ok(Number.isFinite(fx.lastTime));
  assert.equal(syncTime(fx, -5, path), 0);
});

test('B-012 Tester: Pool voll (>256 Spawns) und Projektil-Tracking voll terminieren, Slot wird nach Treffer frei', async () => {
  const fxs = await import('../src/fx-system.js?tester-pool');
  const fx = fxs.createFx();
  const path = {};
  const projectiles = [];
  for (let i = 0; i < 400; i++) projectiles.push({ x: i, y: 0, tx: 500, ty: 0, towerType: 'cannon' });
  const t0 = performance.now();
  for (let f = 0; f < 50; f++) fxs.syncFx(fx, { time: f / 30, path, projectiles, effects: [] });
  assert.ok(performance.now() - t0 < 2000, 'Slot-Suche bleibt schnell');
  assert.equal(fx.sActive.reduce((a, b) => a + b, 0), fxs.MAX_TRACKED);
  assert.ok(fxs.liveParticles(fx) <= fxs.MAX_PARTICLES);
  fxs.syncFx(fx, { time: 3, path, projectiles: [], effects: [] });
  assert.equal(fx.sActive.reduce((a, b) => a + b, 0), 0, 'alle Slots frei');
});

test('B-012 Tester: Hit-Funken nur an der letzten Zielposition; leere Welle/Listen und fehlende Felder crashen nicht', async () => {
  const fxs = await import('../src/fx-system.js?tester-hit');
  const fx = fxs.createFx();
  const path = {};
  fxs.syncFx(fx, { time: 0, path });
  fxs.syncFx(fx, { time: 0.1, path, projectiles: [], effects: [] });
  assert.equal(fxs.liveParticles(fx), 0);
  const p = { x: 10, y: 10, tx: 50, ty: 60, towerType: 'arrow' };
  fxs.syncFx(fx, { time: 0.2, path, projectiles: [p], effects: [] });
  fxs.syncFx(fx, { time: 0.3, path, projectiles: [], effects: [] });
  assert.ok(fxs.liveParticles(fx) > 0, 'Treffer-Blitz');
  for (let i = 0; i < fxs.MAX_PARTICLES; i++) if (fx.pkind[i]) {
    assert.ok(Math.abs(fx.px[i] - 50) < 40 && Math.abs(fx.py[i] - 60) < 40, 'Funken am Ziel');
  }
});

test('B-012 Tester: Reihenfolge-Unabhaengigkeit, Shake-Rendering ohne Hintergrund-Cache (frisches render.js)', async () => {
  // Der vorhandene Shake-Test haengt davon ab, dass ein frueherer Test den Hintergrund-Cache gefuellt hat.
  // Hier: frisches Modul, jede Phase prueft nur die Differenz der translate-Aufrufe.
  const { render } = await import('../src/render.js?tester-shake');
  const { getFx } = await import('../src/render-fx.js');
  const s = createGame();
  s.time = 3;
  const calls = [];
  const props = { globalAlpha: 1 };
  const ctx = new Proxy({}, {
    get(_, k) { if (k in props) return props[k]; return (...a) => { if (k === 'translate') calls.push(a); }; },
    set(_, k, v) { props[k] = v; return true; },
  });
  render(ctx, s, {});
  const base = calls.length; // translate des Tors/Ausgangs, falls ohne Cache direkt gezeichnet
  render(ctx, s, {});
  assert.equal(calls.length, 2 * base, 'ohne Explosion kein zusaetzliches translate');
  s.effects.push({ kind: 'explosion', x: 200, y: 200, r: 44, ttl: 0.3, max: 0.3 });
  s.time = 3.02;
  calls.length = 0;
  render(ctx, s, {});
  assert.ok(calls.some(([x, y]) => (x !== 0 || y !== 0) && Math.abs(x) <= SHAKE_MAX && Math.abs(y) <= SHAKE_MAX), 'Shake aktiv');
  assert.equal(props.globalAlpha, 1);
  assert.ok(getFx().shakeStrength <= SHAKE_MAX);
});

test('B-012 Tester: 3x Update pro Frame (Tempo x3) und Spielende lassen den Pool beschraenkt, Pause friert ein', async () => {
  const fxs = await import('../src/fx-system.js?tester-speed');
  const fx = fxs.createFx();
  const s = createGame();
  const spot = freeTileNearPath(s);
  buildTower(s, 'cannon', spot[0], spot[1]);
  startWave(s);
  const t0 = performance.now();
  for (let f = 0; f < 600 && s.status === 'playing'; f++) {
    for (let i = 0; i < 3; i++) update(s, 0.05);
    fxs.syncFx(fx, s);
    assert.ok(fxs.liveParticles(fx) <= fxs.MAX_PARTICLES);
  }
  assert.ok(performance.now() - t0 < 5000);
  const before = Array.from(fx.page).join();
  fxs.syncFx(fx, s);
  fxs.syncFx(fx, s);
  assert.equal(Array.from(fx.page).join(), before, 'ohne Zeitfortschritt kein Altern');
});

// ---------- B-012 Tester Runde 2: Sperrzeit-Randfaelle ----------
function boom(s, x = 50, r = 44) {
  s.effects.push({ kind: 'explosion', x, y: 50, r, ttl: 0.3, max: 0.3 });
}

test('B-012 Tester R2: Sperrzeit-Grenzen (genau Cooldown, knapp darunter/darueber, gleiche Zeit, Zeit 0, negative Zeit)', () => {
  // Explosion bei time = 0 direkt nach createFx loest aus
  let fx = createFx();
  let s = fxState(0);
  boom(s);
  syncFx(fx, s);
  assert.equal(fx.shakeLock, 0, 'Explosion bei time 0 sperrt ab 0');
  assert.ok(fx.shakeStrength > 0);
  // gleicher Zeitpunkt: zweite Explosion ohne Zeitfortschritt wird gesperrt, Shake nicht neu gestartet
  boom(s, 60);
  const sparksBefore = fx.pkind.filter((k) => k === K_SPARK).length;
  syncFx(fx, s);
  assert.equal(fx.shakeLock, 0);
  assert.equal(fx.shakeStart, 0);
  assert.ok(fx.pkind.filter((k) => k === K_SPARK).length > sparksBefore, 'Funken trotz Sperre');
  assert.ok(fx.pkind.some((k) => k === K_SMOKE), 'Rauch trotz Sperre');
  // knapp unter dem Cooldown: gesperrt, shakeStart/Lock unveraendert
  s.time = SHAKE_COOLDOWN - 0.001;
  boom(s, 70);
  syncFx(fx, s);
  assert.equal(fx.shakeStart, 0, 'Shake nicht verlaengert');
  assert.equal(fx.shakeLock, 0);
  // genau Cooldown (Float exakt 1.2 - 0): wieder frei
  s.time = SHAKE_COOLDOWN;
  boom(s, 80);
  syncFx(fx, s);
  assert.equal(fx.shakeStart, SHAKE_COOLDOWN, 'genau am Cooldown wieder frei');
  assert.equal(fx.shakeLock, SHAKE_COOLDOWN);
  // knapp darueber vom neuen Lock
  s.time = SHAKE_COOLDOWN * 2 + 0.001;
  boom(s, 90);
  syncFx(fx, s);
  assert.equal(fx.shakeStart, s.time);
  // negative Zeit: Reset (rueckwaerts), danach Shake moeglich
  s.time = -5;
  boom(s, 95);
  syncFx(fx, s);
  assert.equal(fx.shakeStart, -5);
  assert.equal(fx.shakeLock, -5);
});

test('B-012 Tester R2: Sperrzeit - neuer Weg leert Sperre; kleine Explosion setzt keine Sperre; NaN/Infinity-Zeit crasht nicht', async () => {
  const { observeEffect } = await import('../src/fx-system.js?tester-r2');
  const fx = createFx();
  let s = fxState(3);
  boom(s, 50, 10); // klein
  syncFx(fx, s);
  assert.equal(fx.shakeLock, -Infinity, 'kleine Explosion sperrt nicht');
  boom(s, 60, 44);
  syncFx(fx, s);
  assert.equal(fx.shakeLock, 3);
  // neues Spiel (anderer Weg), gleiche/spaetere Zeit: Sperre muss weg sein
  const s2 = fxState(3.1);
  boom(s2, 70, 44);
  syncFx(fx, s2);
  assert.equal(fx.shakeStart, 3.1, 'neuer Weg -> Sperre geleert');
  // NaN/Infinity als Zeit direkt in observeEffect: kein Crash, kein NaN im Shake-Zustand
  const fx2 = createFx();
  observeEffect(fx2, { kind: 'explosion', x: 1, y: 1, r: 44 }, NaN);
  assert.equal(fx2.shakeLock, -Infinity, 'NaN-Zeit loest nichts aus');
  assert.ok(!Number.isNaN(fx2.shakeStart) && !Number.isNaN(fx2.shakeStrength));
  assert.ok(liveParticles(fx2) > 0, 'Partikel trotzdem');
  for (const bad of [Infinity, -Infinity]) {
    const f = createFx();
    observeEffect(f, { kind: 'explosion', x: 1, y: 1, r: 44 }, bad);
    assert.ok(shakeAmplitude(0, f.shakeStart, f.shakeStrength) <= SHAKE_MAX);
    assert.ok(shakeAmplitude(10, f.shakeStart, f.shakeStrength) <= SHAKE_MAX);
  }
  // ueber syncFx ist die Zeit immer endlich (syncTime filtert NaN/Infinity)
  const fx3 = createFx();
  const s3 = fxState(NaN);
  boom(s3);
  syncFx(fx3, s3);
  assert.ok(Number.isFinite(fx3.shakeLock) || fx3.shakeLock === -Infinity);
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
