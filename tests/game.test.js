// Unit-Tests der Spiel-Logik. Ausführen: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, update, buildTower, upgradeTower, sellTower, startWave, spawnEnemy,
  canBuild, towerStats, upgradeCost,
} from '../src/game.js';
import { tileHash, decorFor, isBorderTile, LARGE_DECOR_KINDS, LARGE_DECOR_RADIUS, BORDER_DECOR_CHANCE, INNER_DECOR_CHANCE } from '../src/decor.js';
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
