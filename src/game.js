// Spiel-Logik: kompletter Zustand + update(). Kein DOM, kein Canvas -> in Node testbar.
import {
  TILE, COLS, ROWS, START_GOLD, START_LIVES, MAX_WAVES, SELL_RATIO, MAX_LEVEL,
  WAYPOINTS, TOWER_TYPES, ENEMY_TYPES, waveFor, waveBonus, hpScale,
} from './config.js';
import { buildPath, pointAt, pathTiles } from './path.js';

export function createGame(overrides = {}) {
  return {
    gold: START_GOLD,
    lives: START_LIVES,
    wave: 0,
    waveActive: false,
    waveTime: 0,
    spawnQueue: [],
    towers: [],
    enemies: [],
    projectiles: [],
    effects: [],
    status: 'playing', // 'playing' | 'won' | 'lost'
    kills: 0,
    time: 0,
    nextId: 1,
    path: buildPath(WAYPOINTS, TILE),
    blocked: pathTiles(WAYPOINTS),
    ...overrides,
  };
}

// ---------- Türme ----------

export function towerStats(tower) {
  const base = TOWER_TYPES[tower.type];
  const lvl = tower.level - 1;
  return {
    ...base,
    damage: base.damage * Math.pow(1.5, lvl),
    range: base.range * Math.pow(1.1, lvl),
    rate: base.rate * Math.pow(0.92, lvl),
  };
}

export function upgradeCost(tower) {
  if (tower.level >= MAX_LEVEL) return null;
  return Math.round(TOWER_TYPES[tower.type].cost * 0.75 * tower.level);
}

export function sellValue(tower) {
  return Math.floor(tower.invested * SELL_RATIO);
}

export function towerAt(state, col, row) {
  return state.towers.find((t) => t.col === col && t.row === row) || null;
}

export function canBuild(state, col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return { ok: false, reason: 'Außerhalb des Spielfelds' };
  if (state.blocked.has(`${col},${row}`)) return { ok: false, reason: 'Auf dem Weg kann nicht gebaut werden' };
  if (towerAt(state, col, row)) return { ok: false, reason: 'Hier steht schon ein Turm' };
  return { ok: true };
}

export function buildTower(state, type, col, row) {
  const def = TOWER_TYPES[type];
  if (!def) return { ok: false, reason: 'Unbekannter Turm' };
  if (state.status !== 'playing') return { ok: false, reason: 'Spiel ist vorbei' };
  const check = canBuild(state, col, row);
  if (!check.ok) return check;
  if (state.gold < def.cost) return { ok: false, reason: 'Nicht genug Gold' };
  state.gold -= def.cost;
  const tower = {
    id: state.nextId++,
    type,
    col,
    row,
    x: (col + 0.5) * TILE,
    y: (row + 0.5) * TILE,
    level: 1,
    invested: def.cost,
    cooldown: 0,
    angle: 0,
  };
  state.towers.push(tower);
  return { ok: true, tower };
}

export function upgradeTower(state, id) {
  const tower = state.towers.find((t) => t.id === id);
  if (!tower) return { ok: false, reason: 'Turm nicht gefunden' };
  const cost = upgradeCost(tower);
  if (cost === null) return { ok: false, reason: 'Maximale Stufe erreicht' };
  if (state.gold < cost) return { ok: false, reason: 'Nicht genug Gold' };
  state.gold -= cost;
  tower.level += 1;
  tower.invested += cost;
  return { ok: true, tower };
}

export function sellTower(state, id) {
  const idx = state.towers.findIndex((t) => t.id === id);
  if (idx === -1) return { ok: false, reason: 'Turm nicht gefunden' };
  const [tower] = state.towers.splice(idx, 1);
  const value = sellValue(tower);
  state.gold += value;
  return { ok: true, value };
}

// ---------- Wellen ----------

export function startWave(state) {
  if (state.status !== 'playing') return { ok: false, reason: 'Spiel ist vorbei' };
  if (state.waveActive) return { ok: false, reason: 'Welle läuft bereits' };
  if (state.wave >= MAX_WAVES) return { ok: false, reason: 'Alle Wellen geschafft' };
  state.wave += 1;
  state.waveActive = true;
  state.waveTime = 0;
  state.spawnQueue = waveFor(state.wave);
  return { ok: true, wave: state.wave };
}

export function spawnEnemy(state, type, wave = state.wave) {
  const def = ENEMY_TYPES[type];
  const hp = Math.round(def.hp * hpScale(Math.max(1, wave)));
  const pos = pointAt(state.path, 0);
  const enemy = {
    id: state.nextId++,
    type,
    hp,
    maxHp: hp,
    speed: def.speed,
    reward: def.reward,
    leak: def.leak,
    radius: def.radius,
    dist: 0,
    x: pos.x,
    y: pos.y,
    slowUntil: 0,
    slowFactor: 1,
  };
  state.enemies.push(enemy);
  return enemy;
}

// ---------- Update-Schleife ----------

export function update(state, dt) {
  if (state.status !== 'playing') return;
  state.time += dt;

  spawnStep(state, dt);
  moveEnemies(state, dt);
  if (state.status !== 'playing') return;
  towersStep(state, dt);
  projectilesStep(state, dt);
  effectsStep(state, dt);
  waveEndCheck(state);
}

function spawnStep(state, dt) {
  if (!state.waveActive) return;
  state.waveTime += dt;
  while (state.spawnQueue.length && state.spawnQueue[0].at <= state.waveTime) {
    spawnEnemy(state, state.spawnQueue.shift().type);
  }
}

function moveEnemies(state, dt) {
  for (const e of state.enemies) {
    const slowed = state.time < e.slowUntil ? e.slowFactor : 1;
    e.dist += e.speed * TILE * slowed * dt;
    const p = pointAt(state.path, e.dist);
    e.x = p.x;
    e.y = p.y;
  }
  const leaked = state.enemies.filter((e) => e.dist >= state.path.length);
  if (!leaked.length) return;
  state.enemies = state.enemies.filter((e) => e.dist < state.path.length);
  for (const e of leaked) state.lives -= e.leak;
  if (state.lives <= 0) {
    state.lives = 0;
    state.status = 'lost';
  }
}

function findTarget(state, tower, range) {
  let best = null;
  for (const e of state.enemies) {
    if (e.hp <= 0) continue;
    if (Math.hypot(e.x - tower.x, e.y - tower.y) > range) continue;
    if (!best || e.dist > best.dist) best = e; // "Erster": am weitesten gelaufen
  }
  return best;
}

function towersStep(state, dt) {
  for (const tower of state.towers) {
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;
    const stats = towerStats(tower);
    const target = findTarget(state, tower, stats.range * TILE);
    if (!target) {
      tower.cooldown = 0;
      continue;
    }
    tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    tower.cooldown = stats.rate;
    state.projectiles.push({
      id: state.nextId++,
      towerType: tower.type,
      x: tower.x,
      y: tower.y,
      targetId: target.id,
      tx: target.x,
      ty: target.y,
      speed: stats.projectileSpeed * TILE,
      damage: stats.damage,
      splash: stats.splash ? stats.splash * TILE : 0,
      slow: stats.slow || 0,
      slowDuration: stats.slowDuration || 0,
    });
  }
}

function projectilesStep(state, dt) {
  const remaining = [];
  for (const p of state.projectiles) {
    const target = state.enemies.find((e) => e.id === p.targetId && e.hp > 0);
    if (target) {
      p.tx = target.x;
      p.ty = target.y;
    }
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const dist = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (dist <= step || dist < 1) {
      hit(state, p, target);
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
      remaining.push(p);
    }
  }
  state.projectiles = remaining;
  removeDead(state);
}

function hit(state, p, target) {
  if (p.splash) {
    for (const e of state.enemies) {
      if (Math.hypot(e.x - p.tx, e.y - p.ty) <= p.splash) damage(state, e, p);
    }
    state.effects.push({ kind: 'explosion', x: p.tx, y: p.ty, r: p.splash, ttl: 0.3, max: 0.3 });
  } else if (target) {
    damage(state, target, p);
  }
}

function damage(state, enemy, p) {
  enemy.hp -= p.damage;
  if (p.slow) {
    enemy.slowFactor = 1 - p.slow;
    enemy.slowUntil = state.time + p.slowDuration;
  }
}

function removeDead(state) {
  const alive = [];
  for (const e of state.enemies) {
    if (e.hp > 0) {
      alive.push(e);
    } else {
      state.gold += e.reward;
      state.kills += 1;
      state.effects.push({ kind: 'coin', x: e.x, y: e.y, text: `+${e.reward}`, ttl: 0.8, max: 0.8 });
    }
  }
  state.enemies = alive;
}

function effectsStep(state, dt) {
  for (const fx of state.effects) fx.ttl -= dt;
  state.effects = state.effects.filter((fx) => fx.ttl > 0);
}

function waveEndCheck(state) {
  if (!state.waveActive || state.spawnQueue.length || state.enemies.length) return;
  state.waveActive = false;
  state.gold += waveBonus(state.wave);
  if (state.wave >= MAX_WAVES) state.status = 'won';
}
