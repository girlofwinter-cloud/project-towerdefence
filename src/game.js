// Spiel-Logik: kompletter Zustand + update(). Kein DOM, kein Canvas -> in Node testbar.
import {
  TILE, COLS, ROWS, START_GOLD, START_LIVES, MAX_WAVES, SELL_RATIO, MAX_LEVEL, MAX_SUBSTEP, TARGET_MODES,
  MAPS, DEFAULT_MAP_ID, TOWER_TYPES, ENEMY_TYPES, waveFor, waveBonus, hpScale,
} from './config.js';
import { buildPath, pointAt, pathTiles } from './path.js';

export function createGame({ mapId, ...overrides } = {}) {
  const id = Object.hasOwn(MAPS, mapId) ? mapId : DEFAULT_MAP_ID;
  const waypoints = MAPS[id].waypoints;
  return {
    mapId: id,
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
    paused: false, // Pause: update() ändert nichts, Bauen bleibt erlaubt
    kills: 0,
    time: 0,
    nextId: 1,
    healAt: ENEMY_TYPES.healer.healInterval, // Zeitpunkt (state.time) des nächsten Heilimpulses
    healTick: 0, // Zähler der Heilimpulse (verhindert doppelte Heilung pro Impuls)
    path: buildPath(waypoints, TILE),
    blocked: pathTiles(waypoints),
    obstacles: new Set((MAPS[id].obstacles || []).map(([c, r]) => `${c},${r}`)), // Bäume/Felsen (kein Weg)
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
  if (state.obstacles && state.obstacles.has(`${col},${row}`)) return { ok: false, reason: 'Hier wächst ein Baum oder liegt ein Fels' };
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
    targetMode: TARGET_MODES[0],
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

export function setTargetMode(state, id, mode) {
  if (!TARGET_MODES.includes(mode)) return { ok: false, reason: 'Unbekannte Zielregel' };
  const tower = state.towers.find((t) => t.id === id);
  if (!tower) return { ok: false, reason: 'Turm nicht gefunden' };
  tower.targetMode = mode;
  return { ok: true };
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
    armor: def.armor || 0,
    healTick: 0,
  };
  state.enemies.push(enemy);
  return enemy;
}

// ---------- Update-Schleife ----------

// Pause umschalten (nur während des Spiels sinnvoll).
export function togglePause(state) {
  if (state.status === 'playing') state.paused = !state.paused;
  return state.paused;
}

// Simuliert dt*speed Sekunden in gleich großen Teilschritten von höchstens MAX_SUBSTEP.
export function stepGame(state, dt, speed = 1) {
  const total = dt * speed;
  if (!Number.isFinite(total) || !(total > 0)) return;
  const steps = Math.max(1, Math.ceil(total / MAX_SUBSTEP - 1e-9));
  const sub = total / steps;
  for (let i = 0; i < steps; i++) update(state, sub);
}

export function update(state, dt) {
  if (state.status !== 'playing' || state.paused) return;
  state.time += dt;

  spawnStep(state, dt);
  moveEnemies(state, dt);
  if (state.status !== 'playing') return;
  healStep(state);
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

// Heilimpuls: Nur alle healInterval Sekunden (state.time), nicht jedes Frame.
// Jeder lebende Healer heilt alle verletzten Gegner im Umkreis healRadius (Kacheln),
// aber nie sich selbst und nie über maxHp. Pro Impuls und Ziel gibt es höchstens EINE
// Heilung (healTick-Marke), auch wenn mehrere Healer in Reichweite sind: Heiler stapeln nicht.
// Die Radiusprüfung ist O(n²) pro Impuls, läuft aber ohne Allokationen.
function healStep(state) {
  if (state.time < state.healAt) return;
  const interval = ENEMY_TYPES.healer.healInterval;
  state.healAt += interval;
  if (state.healAt <= state.time) state.healAt = state.time + interval; // nach großem dt nicht aufholen
  const tick = ++state.healTick;
  const list = state.enemies;
  for (const h of list) {
    const def = ENEMY_TYPES[h.type];
    if (!def || !def.healRadius || h.hp <= 0) continue;
    const reach = def.healRadius * TILE;
    for (const e of list) {
      if (e === h || e.hp <= 0 || e.hp >= e.maxHp || e.healTick === tick) continue;
      if (Math.hypot(e.x - h.x, e.y - h.y) > reach) continue;
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * def.healPerSec * def.healInterval);
      e.healTick = tick;
    }
  }
}

// Reine Zielauswahl: wählt aus den Gegnern in Reichweite nach Zielregel (Gleichstand: erster in Listenreihenfolge)
export function pickTarget(enemies, tower, range, mode = 'first') {
  let best = null;
  let bestScore = -Infinity;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const d = Math.hypot(e.x - tower.x, e.y - tower.y);
    if (d > range) continue;
    let score;
    if (mode === 'last') score = -e.dist;
    else if (mode === 'strong') score = e.hp;
    else if (mode === 'close') score = -d;
    else score = e.dist; // "Erster": am weitesten gelaufen
    if (score > bestScore) { best = e; bestScore = score; }
  }
  return best;
}

function findTarget(state, tower, range) {
  return pickTarget(state.enemies, tower, range, tower.targetMode);
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
    damage(state, target, p, true);
  }
}

// Rüstung (Schildträger): gilt nur für Direkttreffer (direct = true), also Pfeil, Frost
// und Scharfschütze. Kanonen-Splash trifft immer mit vollem Schaden. Der Frost-Slow
// wirkt unabhängig von der Rüstung unverändert.
function damage(state, enemy, p, direct = false) {
  enemy.hp -= direct ? p.damage * (1 - (enemy.armor || 0)) : p.damage;
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
