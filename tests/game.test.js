// Unit-Tests der Spiel-Logik. Ausführen: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, update, buildTower, upgradeTower, sellTower, startWave, spawnEnemy,
  canBuild, towerStats, upgradeCost,
} from '../src/game.js';
import { buildPath, pointAt, pathTiles } from '../src/path.js';
import { TOWER_TYPES, MAX_WAVES, START_GOLD, START_LIVES, WAYPOINTS, TILE, COLS, ROWS, waveFor, waveBonus, waveSummary, hpScale, ENEMY_TYPES } from '../src/config.js';

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
  assert.deepEqual(waveSummary(10), { grunt: 36, runner: 23, tank: 6, boss: 2 });
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

test('Schwierigkeit: nur Pfeiltürme ohne Aufrüstung verlieren vor Welle 12', () => {
  const s = createGame();
  const spots = rankedSpots(s, TOWER_TYPES.arrow.range);
  while (s.status === 'playing' && s.wave < MAX_WAVES) {
    for (const p of spots) {
      if (s.gold < TOWER_TYPES.arrow.cost) break;
      buildTower(s, 'arrow', p.c, p.r);
    }
    startWave(s);
    for (let i = 0; i < 30 * 600 && s.waveActive && s.status === 'playing'; i++) update(s, 1 / 30);
  }
  assert.equal(s.status, 'lost');
  assert.ok(s.wave < 12, `verloren in Welle ${s.wave}`);
});

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

// Mehrere vernünftige Reihenfolgen müssen Welle 20 mit Reserve gewinnen (kein Münzwurf),
// und zwar robust bei dt 1/30 und 1/60 (echtes Spiel läuft meist mit 1/60). playDt steht weiter unten.
test('Schwierigkeit: mehrere gemischte Strategien schaffen Welle 20 mit Reserve (dt 1/30 und 1/60)', () => {
  const orders = [
    ['arrow', 'cannon', 'cannon', 'frost'],
    ['cannon', 'arrow', 'arrow', 'frost'],
  ];
  for (const mix of orders) {
    for (const dt of [1 / 30, 1 / 60]) {
      const s = playDt(mix, dt);
      assert.equal(s.status, 'won', `${mix.join(',')} dt=${dt}: Status ${s.status} in Welle ${s.wave}`);
      assert.ok(s.lives >= 8, `${mix.join(',')} dt=${dt}: nur ${s.lives} Leben übrig`);
    }
  }
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

test('Schwierigkeit (robust): Kanonen-lastige Strategie gewinnt bei dt 1/30 und 1/60 mit Reserve', () => {
  for (const dt of [1 / 30, 1 / 60]) {
    const s = playDt(['arrow', 'cannon', 'cannon', 'frost'], dt);
    assert.equal(s.status, 'won', `dt=${dt}: Status ${s.status} in Welle ${s.wave}`);
    assert.ok(s.lives >= 8, `dt=${dt}: nur ${s.lives} Leben`);
  }
});

test('Schwierigkeit (robust): nur Pfeiltürme verlieren vor Welle 12 auch bei dt 1/60 (echtes Spiel)', () => {
  for (const dt of [1 / 30, 1 / 60]) {
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
    assert.equal(s.status, 'lost', `dt=${dt}`);
    assert.ok(s.wave < 12, `dt=${dt}: verloren erst in Welle ${s.wave}`);
  }
});

test('Schwierigkeit: Boss-Wellen sind effektiv nicht schwächer als vor B-008 (HP * hpScale)', () => {
  const OLD_BOSS_HP = 900;
  const oldScale = (w) => Math.pow(1.13, w - 1);
  for (const w of [5, 10, 15, 20]) {
    const neu = ENEMY_TYPES.boss.hp * hpScale(w);
    assert.ok(neu >= OLD_BOSS_HP * oldScale(w), `Welle ${w}: Boss effektiv ${Math.round(neu)} HP < alt ${Math.round(OLD_BOSS_HP * oldScale(w))}`);
  }
});

// --- Tester-Ergänzungen (Runde 3): feinere und gröbere Zeitschritte ---

test('Schwierigkeit (Runde 3): Pfeil>Kanone>Kanone>Frost gewinnt auch bei dt 1/20 und 1/120 mit Reserve', () => {
  for (const dt of [1 / 20, 1 / 120]) {
    const s = playDt(['arrow', 'cannon', 'cannon', 'frost'], dt);
    assert.equal(s.status, 'won', `dt=${dt}: Status ${s.status} in Welle ${s.wave}`);
    assert.ok(s.lives >= 8, `dt=${dt}: nur ${s.lives} Leben`);
  }
});

test('Schwierigkeit (Runde 3): Kanone>Pfeil>Pfeil>Frost gewinnt bei dt 1/120 mit Reserve', () => {
  const s = playDt(['cannon', 'arrow', 'arrow', 'frost'], 1 / 120);
  assert.equal(s.status, 'won', `Status ${s.status} in Welle ${s.wave}`);
  assert.ok(s.lives >= 8, `nur ${s.lives} Leben`);
});

test('Schwierigkeit (Runde 3): nur Pfeile verlieren auch bei dt 1/20 und 1/120 vor Welle 12', () => {
  for (const dt of [1 / 20, 1 / 120]) {
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
    assert.equal(s.status, 'lost', `dt=${dt}`);
    assert.ok(s.wave < 12, `dt=${dt}: verloren erst in Welle ${s.wave}`);
  }
});
