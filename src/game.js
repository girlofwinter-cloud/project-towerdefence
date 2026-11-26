// Spiel-Logik: kompletter Zustand + update(). Kein DOM, kein Canvas -> in Node testbar.
import {
  TILE, COLS, ROWS, START_GOLD, START_LIVES, MAX_WAVES, SELL_RATIO, MAX_LEVEL, MAX_SUBSTEP, TARGET_MODES,
  MAPS, DEFAULT_MAP_ID, TOWER_TYPES, ABILITIES, WIDTH, HEIGHT, ENEMY_TYPES, LAVA, FX_STYLE, earlyStartBonus, waveFor, waveBonus, hpScale, meteorDamage,
} from './config.js';
import { buildPath, pointAt, pathTiles } from './path.js';

// Map-Modifikatoren mit Standardwerten (1 = unverändert); unbekannte Karte = Standardkarte.
export function mapModifiers(mapId) {
  const m = (Object.hasOwn(MAPS, mapId) ? MAPS[mapId] : MAPS[DEFAULT_MAP_ID]).modifiers || {};
  return { enemySpeed: m.enemySpeed ?? 1, towerDamage: { ...(m.towerDamage || {}) }, slowStrength: m.slowStrength ?? 1 };
}

export function createGame({ mapId, ...overrides } = {}) {
  const id = Object.hasOwn(MAPS, mapId) ? mapId : DEFAULT_MAP_ID;
  const waypoints = MAPS[id].waypoints;
  const extraPaths = MAPS[id].extraPaths || [];
  const state = {
    mapId: id,
    modifiers: mapModifiers(id),
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
    abilities: Object.fromEntries(Object.keys(ABILITIES).map((id) => [id, { readyAt: 0, uses: 0 }])),
    nextId: 1,
    healAt: ENEMY_TYPES.healer.healInterval, // Zeitpunkt (state.time) des nächsten Heilimpulses
    healTick: 0, // Zähler der Heilimpulse (verhindert doppelte Heilung pro Impuls)
    path: buildPath(waypoints, TILE),
    blocked: new Set([waypoints, ...extraPaths].flatMap((w) => [...pathTiles(w)])), // alle Wege
    nextLane: 0, // Zähler für die abwechselnde Wegwahl neuer Gegner
    obstacles: new Set((MAPS[id].obstacles || []).map(([c, r]) => `${c},${r}`)), // Bäume/Felsen (kein Weg)
    water: new Set((MAPS[id].water || []).map(([c, r]) => `${c},${r}`)), // B-104: Fluss und See (nicht bebaubar)
    lava: new Set((MAPS[id].lava || []).map(([c, r]) => `${c},${r}`)), // B-030: Lavafluss und Lavatümpel (nicht bebaubar)
    ...overrides,
  };
  // Alle Wege: Hauptweg (state.path, auch per override) plus extraPaths; ohne extraPaths genau ein Weg.
  if (!overrides.paths) state.paths = [state.path, ...(overrides.path ? [] : extraPaths.map((w) => buildPath(w, TILE)))];
  // B-030: Wegkacheln direkt neben Lava, einmal berechnet (lavaStep schlägt pro Gegner nur nach)
  if (!overrides.hotPath) state.hotPath = new Set([...state.blocked].filter((k) => nearLava(state.lava, ...k.split(',').map(Number))));
  return state;
}

// B-030: Liegt die Kachel direkt neben Lava (8er-Nachbarschaft, die Kachel selbst zählt nicht)?
export function nearLava(lava, col, row) {
  if (!lava || !lava.size) return false;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if ((dc || dr) && lava.has(`${col + dc},${row + dr}`)) return true;
  }
  return false;
}

// Weg, auf dem der Gegner läuft (Fallback: Hauptweg).
export function enemyPath(state, e) {
  return (state.paths && state.paths[e.lane || 0]) || state.path;
}

// ---------- Türme ----------

export function towerStats(tower, modifiers) {
  const base = TOWER_TYPES[tower.type];
  const lvl = tower.level - 1;
  const dmgMod = modifiers?.towerDamage?.[tower.type] ?? 1;
  const slowMod = modifiers?.slowStrength ?? 1;
  return {
    ...base,
    ...(base.slow ? { slow: base.slow * slowMod } : {}),
    damage: base.damage * Math.pow(1.5, lvl) * dmgMod,
    range: base.range * Math.pow(1.1, lvl),
    // B-030: überhitzter Turm (neben Lava) schießt langsamer
    rate: base.rate * Math.pow(0.92, lvl) * (tower.overheated ? LAVA.overheat : 1),
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
  if (state.water && state.water.has(`${col},${row}`)) return { ok: false, reason: 'Hier ist Wasser' };
  if (state.lava && state.lava.has(`${col},${row}`)) return { ok: false, reason: 'Hier ist Lava' };
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
    focusId: null, // Pfeilturm: aktuelles Ziel für Aufwärmen
    focusStacks: 0, // Pfeilturm: Folgeschüsse auf dasselbe Ziel
    hitCount: 0, // Frostturm: Treffer-Zähler
    overheated: nearLava(state.lava, col, row), // B-030: neben Lava, Feuerintervall mal LAVA.overheat
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

// B-005: Bonus für den vorzeitigen Start (Formel in config.js), hier weiter exportiert.
export { earlyStartBonus };

// Startet die nächste Welle. Läuft schon eine, startet sie vorzeitig (B-005), aber erst wenn alle Gegner der laufenden
// Welle gespawnt sind (höchstens zwei Wellen gleichzeitig, kein Gold-Stapeln). Ihre Gegner kommen zusätzlich in die
// Spawn-Liste (Zeiten relativ zu ihrem eigenen Start, jeder Eintrag trägt seine Wellennummer). Die laufende Welle
// bekommt ihren normalen Wellenbonus sofort, dazu gibt es den Frühstart-Bonus. Jede Welle zahlt ihren Bonus genau einmal:
// die zuletzt gestartete beim Ende aller Wellen (waveEndCheck), jede frühere beim Frühstart ihrer Nachfolgerin.
export function startWave(state) {
  if (state.status !== 'playing') return { ok: false, reason: 'Spiel ist vorbei' };
  if (state.wave >= MAX_WAVES) return { ok: false, reason: 'Alle Wellen geschafft' };
  const early = state.waveActive;
  if (early && state.spawnQueue.length) return { ok: false, reason: 'Gegner der laufenden Welle kommen noch' };
  if (early) state.gold += waveBonus(state.wave);
  state.wave += 1;
  const wave = state.wave;
  if (!early) {
    state.waveActive = true;
    state.waveTime = 0;
    state.spawnQueue = waveFor(wave).map((e) => ({ ...e, wave }));
    return { ok: true, wave, bonus: 0 };
  }
  const offset = state.waveTime;
  const added = waveFor(wave).map((e) => ({ ...e, at: e.at + offset, wave }));
  // Stabil nach Zeit sortieren: spawnStep arbeitet die Liste von vorne ab
  state.spawnQueue = [...state.spawnQueue, ...added].sort((a, b) => a.at - b.at);
  const bonus = earlyStartBonus(wave);
  state.gold += bonus;
  const pos = pointAt(state.path, TILE);
  state.effects.push({ kind: 'coin', x: pos.x, y: pos.y, text: `+${bonus}`, ttl: 0.8, max: 0.8 });
  return { ok: true, wave, bonus };
}

// Weg eines neuen Gegners: feste Seite laut MAPS[mapId].lanes (B-099), sonst abwechselnd über alle Wege.
// Nur abwechselnde Typen zählen den Wechsel weiter, feste Typen stören die Reihenfolge nicht.
export function laneFor(state, type, count) {
  const fixed = MAPS[state.mapId]?.lanes?.[type];
  if (Number.isInteger(fixed) && fixed >= 0 && fixed < count) return fixed;
  const lane = (state.nextLane || 0) % count;
  state.nextLane = lane + 1;
  return lane;
}

export function spawnEnemy(state, type, wave = state.wave) {
  const def = ENEMY_TYPES[type];
  const hp = Math.round(def.hp * hpScale(Math.max(1, wave)));
  const paths = state.paths || [state.path];
  const lane = laneFor(state, type, paths.length);
  const path = paths[lane];
  const pos = pointAt(path, 0);
  const enemy = {
    id: state.nextId++,
    type,
    hp,
    maxHp: hp,
    speed: def.speed * (state.modifiers?.enemySpeed ?? 1),
    reward: def.reward,
    leak: def.leak,
    radius: def.radius,
    dist: 0,
    lane,
    len: path.length, // Länge des eigenen Wegs (für Restweg-Zielwahl)
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

// ---------- Fähigkeiten (B-038) ----------

// Restliche Abklingzeit in Sekunden Spielzeit (0 = bereit).
export function abilityCooldownLeft(state, id) {
  const a = state.abilities?.[id];
  return a ? Math.max(0, a.readyAt - state.time) : 0;
}

export function useAbility(state, id, x, y) {
  const def = Object.hasOwn(ABILITIES, id) ? ABILITIES[id] : null;
  if (!def) return { ok: false, reason: 'Unbekannte Fähigkeit' };
  if (state.status !== 'playing') return { ok: false, reason: 'Spiel ist vorbei' };
  if (state.paused) return { ok: false, reason: 'Spiel ist pausiert' };
  const a = state.abilities[id];
  if (def.maxUses !== undefined && a.uses >= def.maxUses) return { ok: false, reason: `${def.name} ist aufgebraucht` };
  if (state.time < a.readyAt) return { ok: false, reason: `${def.name} lädt noch (${Math.ceil(a.readyAt - state.time)} s)` };
  if (id === 'meteor') {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > WIDTH || y > HEIGHT) return { ok: false, reason: 'Ziel liegt außerhalb des Spielfelds' };
    // B-112: Schaden sofort (wie bisher), wächst mit der Welle und fällt zum Rand linear ab; Rüstung zählt nicht.
    // Der Effekt bleibt eine 'explosion' mit meteor = true und lebt bis zum Ende des Kraters (nur Darstellung).
    const r = def.radius * TILE;
    for (const e of state.enemies) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d <= r) damage(state, e, { damage: meteorDamage(state.wave, d / r) });
    }
    const life = meteorLife();
    state.effects.push({ kind: 'explosion', meteor: true, x, y, r, ttl: life, max: life });
    removeDead(state);
  } else if (id === 'freeze') {
    const factor = 1 - def.slow;
    for (const e of state.enemies) {
      const active = state.time < (e.slowUntil || 0);
      e.slowFactor = active ? Math.min(e.slowFactor, factor) : factor;
      e.slowUntil = Math.max(e.slowUntil || 0, state.time + def.duration);
    }
    state.effects.push({ kind: 'chill', ttl: 0.4, max: 0.4 });
  } else if (id === 'repair') {
    if (state.lives >= START_LIVES) return { ok: false, reason: 'Leben sind bereits voll' };
    state.lives = Math.min(START_LIVES, state.lives + def.heal);
  }
  a.uses += 1;
  a.readyAt = state.time + def.cooldown;
  return { ok: true };
}

// Gesamtdauer des Meteor-Effekts in Sekunden Spielzeit: Anflug + Einschlag + Krater (B-112).
export function meteorLife() {
  const m = FX_STYLE.meteor;
  return m.flight + m.blast + m.crater;
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
  lavaStep(state, dt);
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
    const next = state.spawnQueue.shift();
    spawnEnemy(state, next.type, next.wave ?? state.wave); // HP-Skalierung der eigenen Welle
  }
}

function moveEnemies(state, dt) {
  for (const e of state.enemies) {
    if (state.time < (e.frozenUntil || 0)) continue; // eingefroren: keine Bewegung
    const slowed = state.time < e.slowUntil ? e.slowFactor : 1;
    e.dist += e.speed * TILE * slowed * dt;
    const p = pointAt(enemyPath(state, e), e.dist);
    e.x = p.x;
    e.y = p.y;
  }
  const done = (e) => e.dist >= enemyPath(state, e).length;
  const leaked = state.enemies.filter(done);
  if (!leaked.length) return;
  state.enemies = state.enemies.filter((e) => !done(e));
  for (const e of leaked) state.lives -= e.leak;
  if (state.lives <= 0) {
    state.lives = 0;
    state.status = 'lost';
  }
}

// B-030: Lava-Schaden. Gegner auf einer Wegkachel direkt neben Lava verlieren LAVA.dps * hpScale(Welle) pro Sekunde
// (Rate mal dt, also unabhängig vom Zeitschritt), auch der Boss. Wie Kanonen-Splash ignoriert die Lava die Rüstung
// (kein Direkttreffer). Wer daran stirbt, bringt die normale Belohnung.
function lavaStep(state, dt) {
  if (!state.hotPath || !state.hotPath.size || !state.enemies.length) return;
  const amount = LAVA.dps * hpScale(Math.max(1, state.wave)) * dt;
  let hit = false;
  for (const e of state.enemies) {
    const col = Math.floor(e.x / TILE);
    const row = Math.floor(e.y / TILE);
    if (!state.hotPath.has(`${col},${row}`)) continue;
    damage(state, e, { damage: amount });
    hit = true;
  }
  if (hit) removeDead(state);
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
    const rest = (e.len || 0) - e.dist; // Restweg auf dem eigenen Weg
    if (mode === 'last') score = rest;
    else if (mode === 'strong') score = e.hp;
    else if (mode === 'close') score = -d;
    else score = -rest; // "Erster": geringster Restweg
    if (score > bestScore) { best = e; bestScore = score; }
  }
  return best;
}

// Reine Kettenauswahl: Liste [first, Sprung 1, ...]. Jeder Sprung geht zum nächsten noch nicht
// getroffenen, lebenden Gegner im Umkreis chainRange (Pixel) des vorigen Treffers; höchstens chainCount Sprünge.
export function chainTargets(enemies, first, chainCount, chainRange) {
  const chain = [first];
  for (let i = 0; i < chainCount; i++) {
    const from = chain[chain.length - 1];
    let best = null;
    let bestD = Infinity;
    for (const e of enemies) {
      if (e.hp <= 0 || chain.includes(e)) continue;
      const d = Math.hypot(e.x - from.x, e.y - from.y);
      if (d <= chainRange && d < bestD) { best = e; bestD = d; }
    }
    if (!best) break;
    chain.push(best);
  }
  return chain;
}

function findTarget(state, tower, range) {
  return pickTarget(state.enemies, tower, range, tower.targetMode);
}

function towersStep(state, dt) {
  for (const tower of state.towers) {
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;
    const stats = towerStats(tower, state.modifiers);
    const target = findTarget(state, tower, stats.range * TILE);
    const sp = stats.special || {};
    if (!target) {
      tower.cooldown = 0;
      tower.focusId = null;
      tower.focusStacks = 0;
      continue;
    }
    tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    tower.cooldown = stats.rate;
    if (sp.warmupStep) {
      if (tower.focusId === target.id) tower.focusStacks = (tower.focusStacks || 0) + 1;
      else { tower.focusId = target.id; tower.focusStacks = 0; }
      tower.cooldown = stats.rate * (1 - Math.min(tower.focusStacks * sp.warmupStep, sp.warmupMax));
    }
    if (stats.chainCount) {
      lightningStrike(state, tower, stats, target);
      continue;
    }
    const breaker = sp.bonusMinHp !== undefined && (ENEMY_TYPES[target.type]?.hp ?? 0) >= sp.bonusMinHp;
    state.projectiles.push({
      id: state.nextId++,
      towerType: tower.type,
      x: tower.x,
      y: tower.y,
      targetId: target.id,
      tx: target.x,
      ty: target.y,
      speed: stats.projectileSpeed * TILE,
      damage: breaker ? stats.damage * sp.bonusDamage : stats.damage,
      ignoreArmor: breaker && !!sp.ignoreArmor,
      towerId: tower.id,
      knockback: sp.knockback ? sp.knockback * TILE : 0,
      bossKnockbackFactor: sp.bossKnockbackFactor ?? 1,
      knockbackCooldown: sp.knockbackCooldown || 0,
      freezeEvery: sp.freezeEvery || 0,
      freezeDuration: sp.freezeDuration || 0,
      splash: stats.splash ? stats.splash * TILE : 0,
      slow: stats.slow || 0,
      slowDuration: stats.slowDuration || 0,
    });
  }
}

// Blitzturm: trifft sofort; Schaden sinkt je Sprung um chainFalloff, Rüstung wie bei Direkttreffern.
function lightningStrike(state, tower, stats, target) {
  const chain = chainTargets(state.enemies, target, stats.chainCount, stats.chainRange * TILE);
  const points = [{ x: tower.x, y: tower.y }];
  chain.forEach((e, i) => {
    points.push({ x: e.x, y: e.y });
    damage(state, e, { damage: stats.damage * Math.pow(stats.chainFalloff, i) }, true);
  });
  state.effects.push({ kind: 'bolt', points, ttl: stats.boltDuration, max: stats.boltDuration });
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
      if (Math.hypot(e.x - p.tx, e.y - p.ty) <= p.splash) {
        damage(state, e, p);
      }
    }
    if (p.knockback && target) knockBack(state, target, p);
    state.effects.push({ kind: 'explosion', x: p.tx, y: p.ty, r: p.splash, ttl: 0.3, max: 0.3 });
  } else if (target) {
    damage(state, target, p, true);
    const tower = p.freezeEvery ? state.towers.find((t) => t.id === p.towerId) : null;
    if (tower) {
      tower.hitCount = (tower.hitCount || 0) + 1;
      if (tower.hitCount % p.freezeEvery === 0 && target.type !== 'boss') target.frozenUntil = state.time + p.freezeDuration;
    }
  }
}

// Rückstoß: Gegner entlang seines Wegs zurückwerfen (nie unter den Weganfang); Boss nur anteilig.
function knockBack(state, e, p) {
  if (state.time < (e.knockUntil || 0)) return; // Schutzzeit: kein Dauer-Zurückwerfen
  e.knockUntil = state.time + p.knockbackCooldown;
  const amount = p.knockback * (e.type === 'boss' ? p.bossKnockbackFactor : 1);
  e.dist = Math.max(0, e.dist - amount);
  const pt = pointAt(enemyPath(state, e), e.dist);
  e.x = pt.x;
  e.y = pt.y;
}

// Rüstung (Schildträger): gilt nur für Direkttreffer (direct = true), also Pfeil, Frost
// und Scharfschütze. Kanonen-Splash trifft immer mit vollem Schaden. Der Frost-Slow
// wirkt unabhängig von der Rüstung unverändert.
function damage(state, enemy, p, direct = false) {
  enemy.hp -= direct ? p.damage * (p.ignoreArmor ? 1 : 1 - (enemy.armor || 0)) : p.damage;
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
