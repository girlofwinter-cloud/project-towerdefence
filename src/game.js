// Spiel-Logik: kompletter Zustand + update(). Kein DOM, kein Canvas -> in Node testbar.
import {
  TILE, COLS, ROWS, START_GOLD, START_LIVES, MAX_WAVES, SELL_RATIO, MAX_LEVEL, MAX_SUBSTEP, TARGET_MODES,
  MAPS, DEFAULT_MAP_ID, LANE_ASYNC, TOWER_TYPES, ABILITIES, WIDTH, HEIGHT, ENEMY_TYPES, LAVA, FX_STYLE, AUTO_WAVE_DELAY, earlyStartBonus, waveFor, waveBonus, hpScale, meteorDamage, isBoss,
} from './config.js';
import { buildPath, pointAt, pathTiles } from './path.js';
import { ELITE, UPGRADE_COST_FACTOR, LEVEL_DAMAGE } from './config.js'; // B-179: Elite-Gegner, Aufrüstkosten
import { MASTER_FX } from './config.js'; // B-173/B-174: Lebensdauer reiner Darstellungs-Ereignisse

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
    autoWaveIn: null, // B-121: Sekunden bis zum automatischen Start der nächsten Welle (null = kein Countdown)
    autoWave: true, // Schalter: nächste Welle nach Wellenende automatisch starten (Spieler-Wahl, main.js merkt sie sich)
    spawnQueue: [],
    towers: [],
    enemies: [],
    projectiles: [],
    effects: [],
    grounds: [], // B-176: Bodenflächen der Stufe 3 (Brand und Eis): { kind, x, y, r, until, ... }
    status: 'playing', // 'playing' | 'won' | 'lost'
    paused: false, // Pause: update() ändert nichts, Bauen bleibt erlaubt
    kills: 0,
    time: 0,
    abilities: Object.fromEntries(Object.keys(ABILITIES).map((id) => [id, { readyAt: 0, uses: 0 }])),
    nextId: 1,
    healAt: ENEMY_TYPES.healer.healInterval, // Zeitpunkt (state.time) des nächsten Heilimpulses
    healTick: 0, // Zähler der Heilimpulse (verhindert doppelte Heilung pro Impuls)
    wardAt: ENEMY_TYPES.mage.wardInterval, // B-126: Zeitpunkt (state.time) des nächsten Schildzaubers der Magier
    path: buildPath(waypoints, TILE),
    blocked: new Set([waypoints, ...extraPaths].flatMap((w) => [...pathTiles(w)])), // alle Wege
    nextLane: 0, // Zähler für die abwechselnde Wegwahl neuer Gegner
    obstacles: new Set((MAPS[id].obstacles || []).map(([c, r]) => `${c},${r}`)), // Bäume/Felsen (kein Weg)
    water: new Set((MAPS[id].water || []).map(([c, r]) => `${c},${r}`)), // B-104: Fluss und See (nicht bebaubar)
    lava: new Set((MAPS[id].lava || []).map(([c, r]) => `${c},${r}`)), // B-030: Lavafluss und Lavatümpel (nicht bebaubar)
    flagTiles: new Set((MAPS[id].flagTiles || []).map(([c, r]) => `${c},${r}`)), // Wellenfahne ragt ins Feld (nicht bebaubar)
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
    damage: base.damage * (LEVEL_DAMAGE[tower.level] ?? Math.pow(1.5, lvl)) * dmgMod,
    range: base.range * Math.pow(1.1, lvl),
    // B-030: überhitzter Turm (neben Lava) schießt langsamer
    rate: base.rate * Math.pow(0.92, lvl) * (tower.overheated ? LAVA.overheat : 1),
  };
}

// B-175/B-176: Stufe-3-Fähigkeit des Turms (TOWER_TYPES[typ].master) oder null, solange er darunter liegt.
export function masterOf(tower) {
  return tower.level >= MAX_LEVEL ? TOWER_TYPES[tower.type]?.master || null : null;
}

// B-175: Text der Stufe-3-Fähigkeit für die Turm-Info; auf Stufe 2 als Vorschau, auf Stufe 1 leer.
export function masterInfo(tower) {
  const m = TOWER_TYPES[tower.type]?.master;
  if (!m || tower.level < MAX_LEVEL - 1) return '';
  return tower.level >= MAX_LEVEL ? `Stufe 3: ${m.text}` : `Auf Stufe 3: ${m.text}`;
}

export function upgradeCost(tower) {
  if (tower.level >= MAX_LEVEL) return null;
  return Math.round(TOWER_TYPES[tower.type].cost * UPGRADE_COST_FACTOR[tower.level] * tower.level);
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
  if (state.flagTiles && state.flagTiles.has(`${col},${row}`)) return { ok: false, reason: 'Hier steht die Fahne' };
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
  // B-174: Lichtsäule beim Aufstieg auf Stufe 3 (nur Darstellung)
  // Gewitter: erster Einschlag erst nach einem vollen Takt (mit Ankündigung)
  if (tower.level === MAX_LEVEL && masterOf(tower)?.stormEvery) tower.stormAt = state.time + masterOf(tower).stormEvery;
  if (tower.level === MAX_LEVEL) state.effects.push({ kind: 'ascend', towerId: tower.id, x: tower.x, y: tower.y, ttl: MASTER_FX.ascend.life, max: MASTER_FX.ascend.life });
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

// B-123: Gesamt-HP einer Welle beim Spawn (ohne Heilung), Grundlage fürs Frühstart-Risiko.
export function waveHp(wave, mapId) {
  return waveFor(wave, mapId).reduce((sum, e) => sum + Math.round(ENEMY_TYPES[e.type].hp * hpScale(Math.max(1, wave))), 0);
}

// B-123: Risiko eines Frühstarts = Gegner-HP auf dem Feld (alle Wellen) im Verhältnis zur HP der laufenden Welle,
// gekappt auf 0..1. Ohne laufende Welle 0.
export function earlyStartRisk(state) {
  if (!state.waveActive || state.wave < 1) return 0;
  const total = waveHp(state.wave, state.mapId);
  const alive = state.enemies.reduce((sum, e) => sum + Math.max(0, e.hp), 0);
  return total > 0 ? Math.min(1, alive / total) : 0;
}

// B-123: Bonus, den ein Frühstart jetzt bringen würde (für den HUD-Knopf).
export function earlyStartPreview(state) {
  return earlyStartBonus(state.wave + 1, earlyStartRisk(state));
}

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
  // B-123: Risiko vor dem Start messen (danach zählt state.wave schon die neue Welle)
  const risk = early ? earlyStartRisk(state) : 0;
  if (early) state.gold += waveBonus(state.wave);
  state.autoWaveIn = null; // B-121: ein Start (manuell oder automatisch) beendet den Countdown
  state.wave += 1;
  const wave = state.wave;
  if (!early) {
    state.waveActive = true;
    state.waveTime = 0;
    state.spawnQueue = planLanes(state, waveFor(wave, state.mapId), wave).map((e) => ({ ...e, wave }));
    return { ok: true, wave, bonus: 0 };
  }
  const offset = state.waveTime;
  const added = planLanes(state, waveFor(wave, state.mapId), wave).map((e) => ({ ...e, at: e.at + offset, wave }));
  // Stabil nach Zeit sortieren: spawnStep arbeitet die Liste von vorne ab
  state.spawnQueue = [...state.spawnQueue, ...added].sort((a, b) => a.at - b.at);
  const bonus = earlyStartBonus(wave, risk);
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

// B-124: Spawn-Liste einer Welle für Karten mit mehreren Eingängen: jeder Eintrag bekommt seine Seite.
// Feste Typen (MAPS[mapId].lanes) bleiben auf ihrer Seite, die übrigen kommen in Schüben von LANE_ASYNC.burst
// (der erste Schub kommt auf der frühen Seite). Eine Seite startet LANE_ASYNC.offset Sekunden später, ebenfalls je Welle wechselnd.
// Mit nur einem Weg bleibt die Liste unverändert.
export function planLanes(state, list, wave) {
  const count = (state.paths || [state.path]).length;
  if (count < 2) return list;
  const fixedLanes = MAPS[state.mapId]?.lanes || {};
  const late = wave % count; // diese Seite startet später
  let n = 0;
  const out = list.map((e) => {
    const fixed = fixedLanes[e.type];
    let lane;
    if (Number.isInteger(fixed) && fixed >= 0 && fixed < count) lane = fixed;
    else lane = (Math.floor(n++ / LANE_ASYNC.burst) + late + 1) % count; // erster Schub auf der frühen Seite
    return { ...e, lane, at: e.at + (lane === late ? LANE_ASYNC.offset : 0) };
  });
  // Stabil nach Zeit sortieren: spawnStep arbeitet die Liste von vorne ab
  return out.sort((a, b) => a.at - b.at);
}

export function spawnEnemy(state, type, wave = state.wave, lane = null, elite = null) {
  const def = ENEMY_TYPES[type];
  const hp = Math.round(def.hp * hpScale(Math.max(1, wave)));
  const paths = state.paths || [state.path];
  // B-124: vorgeplante Seite aus der Spawn-Liste, sonst Wechsel wie bisher
  if (!(Number.isInteger(lane) && lane >= 0 && lane < paths.length)) lane = laneFor(state, type, paths.length);
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
    wave, // B-120: eigene Welle (Lava und Meteor skalieren damit, auch nach Frühstart)
    len: path.length, // Länge des eigenen Wegs (für Restweg-Zielwahl)
    x: pos.x,
    y: pos.y,
    slowUntil: 0,
    slowFactor: 1,
    armor: def.armor || 0,
    healTick: 0,
    ward: 0, // B-126: Schild des Magiers (schluckt Schaden vor den HP)
  };
  if (def.summonInterval) enemy.summonAt = state.time + def.summonInterval; // B-127: nächste Beschwörung
  if (def.shellHits) enemy.shell = def.shellHits; // B-169: Schichten der Schale (Panzerkäfer)
  if (elite && ELITE[elite]) makeElite(enemy, elite);
  state.enemies.push(enemy);
  return enemy;
}

// B-179: Elite-Eigenschaft anwenden (enemy.elite = Eigenschaft, Flag fürs Abzeichen). Werte in ELITE (config.js).
function makeElite(enemy, trait) {
  enemy.elite = trait;
  enemy.reward = Math.round(enemy.reward * ELITE.rewardFactor);
  if (trait === 'swift') enemy.speed *= ELITE.swift.speed;
  else if (trait === 'shield') enemy.ward = ELITE.shield.wardShare * enemy.maxHp;
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
      if (d <= r) damage(state, e, { damage: meteorDamage(e.wave ?? state.wave, d / r) }); // B-120: Welle des Gegners
    }
    const life = meteorLife();
    state.effects.push({ kind: 'explosion', meteor: true, x, y, r, ttl: life, max: life });
    removeDead(state);
  } else if (id === 'freeze') {
    for (const e of state.enemies) {
      // B-170: Glutlinge spüren nur den Anteil chillFactor der Verlangsamung
      const factor = 1 - def.slow * (isSlowImmune(e) ? ENEMY_TYPES[e.type].chillFactor : 1);
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

  autoWaveStep(state, dt);
  spawnStep(state, dt);
  moveEnemies(state, dt);
  if (state.status !== 'playing') return;
  lavaStep(state, dt);
  healStep(state);
  regenStep(state, dt);
  wardStep(state);
  summonStep(state);
  groundsStep(state, dt);
  towersStep(state, dt);
  projectilesStep(state, dt);
  effectsStep(state, dt);
  waveEndCheck(state);
}

// B-121: Countdown nach Wellenende; bei 0 startet die nächste Welle. Läuft in Spielzeit (Pause hält an, Tempo gilt).
function autoWaveStep(state, dt) {
  if (state.autoWaveIn === null) return;
  state.autoWaveIn -= dt;
  if (state.autoWaveIn <= 1e-9) startWave(state);
}

function spawnStep(state, dt) {
  if (!state.waveActive) return;
  state.waveTime += dt;
  while (state.spawnQueue.length && state.spawnQueue[0].at <= state.waveTime) {
    const next = state.spawnQueue.shift();
    spawnEnemy(state, next.type, next.wave ?? state.wave, next.lane ?? null, next.elite ?? null); // HP-Skalierung der eigenen Welle, B-124: geplante Seite, B-179: Elite
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
  let hit = false;
  for (const e of state.enemies) {
    if (isFlying(e)) continue; // Fledermäuse fliegen über die Lava und nehmen keinen Schaden
    const col = Math.floor(e.x / TILE);
    const row = Math.floor(e.y / TILE);
    if (!state.hotPath.has(`${col},${row}`)) continue;
    // B-120: skaliert mit der Welle des Gegners (Rückfall: aktuelle Welle)
    damage(state, e, { damage: LAVA.dps * hpScale(Math.max(1, e.wave ?? state.wave)) * dt, lava: true }); // B-169: kein Treffer auf die Schale
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

// B-179: Selbstheilung der Elite-Gegner mit regen: healPerSec * maxHp pro Sekunde (Rate mal dt), nie über maxHp.
function regenStep(state, dt) {
  const rate = ELITE.regen.healPerSec * dt;
  for (const e of state.enemies) {
    if (e.elite !== 'regen' || e.hp <= 0 || e.hp >= e.maxHp) continue;
    e.hp = Math.min(e.maxHp, e.hp + e.maxHp * rate);
  }
}

// B-127: Beschwörung. Jeder lebende Beschwörer (summonInterval) ruft alle summonInterval Sekunden Spielzeit
// summonCount Gegner vom Typ summonType auf seinem eigenen Weg summonBehind Kacheln hinter sich herbei (nie vor
// den Wegstart), damit Türme zuerst den Beschwörer treffen. Sie bekommen die HP-Skalierung der Welle des Beschwörers und zählen fürs Wellenende.
function summonStep(state) {
  const list = state.enemies;
  const n = list.length; // neu beschworene Gegner beschwören in diesem Schritt nicht
  for (let i = 0; i < n; i++) {
    const s = list[i];
    if (!(s.summonAt <= state.time) || s.hp <= 0) continue;
    const def = ENEMY_TYPES[s.type];
    const phase = s.phase === 2 ? def.phase2 : def; // B-180: zweite Phase beschwört schneller und mehr
    s.summonAt += phase.summonInterval;
    if (s.summonAt <= state.time) s.summonAt = state.time + phase.summonInterval; // nach großem dt nicht aufholen
    const path = enemyPath(state, s);
    for (let k = 0; k < phase.summonCount; k++) {
      const m = spawnEnemy(state, def.summonType, s.wave ?? state.wave, s.lane);
      m.summoned = true; // beschworen, nicht aus der Spawn-Liste
      m.dist = Math.max(0, s.dist - (def.summonBehind + k * def.summonSpacing) * TILE);
      const p = pointAt(path, m.dist);
      m.x = p.x;
      m.y = p.y;
      state.effects.push({ kind: 'summon', x: p.x, y: p.y, ttl: FX_STYLE.summon.life, max: FX_STYLE.summon.life, p2: s.phase === 2 }); // p2: nur Optik (Farbe)
    }
  }
}

// B-126: Schildzauber. Alle wardInterval Sekunden (state.time) schützt jeder lebende Magier alle ANDEREN lebenden
// Gegner im Umkreis wardRadius (Kacheln): ward = max(ward, wardShare * maxHp des Ziels), also kein Stapeln.
function wardStep(state) {
  if (state.wardAt === undefined || state.time < state.wardAt) return;
  const interval = ENEMY_TYPES.mage.wardInterval;
  state.wardAt += interval;
  if (state.wardAt <= state.time) state.wardAt = state.time + interval; // nach großem dt nicht aufholen
  const list = state.enemies;
  for (const m of list) {
    const def = ENEMY_TYPES[m.type];
    if (!def || !def.wardRadius || m.hp <= 0) continue;
    const reach = def.wardRadius * TILE;
    for (const e of list) {
      if (e === m || e.hp <= 0) continue;
      if (Math.hypot(e.x - m.x, e.y - m.y) > reach) continue;
      e.ward = Math.max(e.ward || 0, def.wardShare * e.maxHp);
    }
  }
}

// B-167: Flieger (ENEMY_TYPES[type].flying) und Türme, die sie treffen (TOWER_TYPES[type].hitsAir).
// Ein Turm ohne bekannten Typ trifft Flieger (z. B. Testobjekte nur mit x/y).
function isFlying(e) {
  return ENEMY_TYPES[e?.type]?.flying === true;
}
function hitsAir(tower) {
  return TOWER_TYPES[tower?.type]?.hitsAir !== false;
}

// Reine Zielauswahl: wählt aus den Gegnern in Reichweite nach Zielregel (Gleichstand: erster in Listenreihenfolge).
// Türme ohne hitsAir überspringen Flieger (B-167).
export function pickTarget(enemies, tower, range, mode = 'first') {
  const air = hitsAir(tower);
  let best = null;
  let bestScore = -Infinity;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    if (!air && isFlying(e)) continue;
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

// B-175 Gewitter: Gegner in Reichweite (Pixel) mit den meisten Nachbarn im Umkreis radius (Pixel, sich selbst mitgezählt);
// seine Position ist das Zentrum des Einschlags. Gleichstand: erster in Listenreihenfolge. Ohne Gegner null. Rein.
export function densestCluster(enemies, tower, range, radius) {
  const inRange = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - tower.x, e.y - tower.y) <= range);
  let best = null;
  let bestCount = 0;
  for (const e of inRange) {
    const count = inRange.filter((o) => Math.hypot(o.x - e.x, o.y - e.y) <= radius).length;
    if (count > bestCount) { best = e; bestCount = count; }
  }
  return best ? { x: best.x, y: best.y } : null;
}

function findTarget(state, tower, range) {
  return pickTarget(state.enemies, tower, range, tower.targetMode);
}

function towersStep(state, dt) {
  for (const tower of state.towers) {
    const master = masterOf(tower);
    if (master?.stormEvery) stormStep(state, tower, master);
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
    tower.aimId = target.id; // B-174: Zielstrahl des Falkenauges (nur Darstellung)
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
    shoot(state, tower, stats, target, 1);
    // B-175 Mehrfachschuss: weitere, verschiedene Ziele nach derselben Zielregel, mit geringerem Schaden
    if (master?.multiTargets) {
      const taken = [target];
      for (let i = 1; i < master.multiTargets; i++) {
        const extra = pickTarget(state.enemies.filter((e) => !taken.includes(e)), tower, stats.range * TILE, tower.targetMode);
        if (!extra) break;
        taken.push(extra);
        shoot(state, tower, stats, extra, master.extraDamage);
      }
    }
  }
}

// Geschoss eines Turms auf target; factor skaliert den Schaden (Nebenziele beim Mehrfachschuss).
function shoot(state, tower, stats, target, factor) {
  const sp = stats.special || {};
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
    damage: (breaker ? stats.damage * sp.bonusDamage : stats.damage) * factor,
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
    master: masterOf(tower), // B-176: Stufe-3-Fähigkeit beim Treffer (Brandfläche, Eisboden, Markieren)
    side: factor !== 1, // B-173: Nebenziel des Mehrfachschusses (nur Darstellung)
  });
}

// B-175 Gewitter: Takt je Turm (tower.stormAt); ohne Gegner in Reichweite wartet der Einschlag.
// Flächenschaden wie Splash (ohne Rüstung), trifft auch Flieger. Effekt 'storm' für die Optik.
function stormStep(state, tower, master) {
  if (state.time < (tower.stormAt ?? 0)) {
    // B-174: Ankündigung kurz vor dem Einschlag am dann dichtesten Pulk (nur Darstellung, ändert nichts am Takt)
    const tele = MASTER_FX.storm.tele;
    if (!tower.stormWarned && state.time >= tower.stormAt - tele) {
      const s = towerStats(tower, state.modifiers);
      const c = densestCluster(state.enemies, tower, s.range * TILE, master.stormRadius * TILE);
      if (c) {
        tower.stormWarned = true;
        state.effects.push({ kind: 'stormWarn', x: c.x, y: c.y, r: master.stormRadius * TILE, ttl: tele, max: tele });
      }
    }
    return;
  }
  const stats = towerStats(tower, state.modifiers);
  const radius = master.stormRadius * TILE;
  const center = densestCluster(state.enemies, tower, stats.range * TILE, radius);
  if (!center) return;
  tower.stormAt = state.time + master.stormEvery;
  tower.stormWarned = false;
  const dmg = stats.damage * master.stormDamage;
  for (const e of state.enemies) {
    // Irrlichter weichen Flächenschaden aus (wie bei Splash und Brandfläche)
    if (e.hp > 0 && !isDodger(e) && Math.hypot(e.x - center.x, e.y - center.y) <= radius) damage(state, e, { damage: dmg });
  }
  const life = MASTER_FX.storm.life; // Wolke, Druckring und Rußfleck bleiben länger als der Blitz
  state.effects.push({ kind: 'storm', x: center.x, y: center.y, r: radius, towerId: tower.id, fromX: tower.x, fromY: tower.y, ttl: life, max: life });
}

// Blitzturm: trifft sofort; Schaden sinkt je Sprung um chainFalloff, Rüstung wie bei Direkttreffern.
function lightningStrike(state, tower, stats, target) {
  const chain = chainTargets(state.enemies, target, stats.chainCount, stats.chainRange * TILE);
  const points = [{ x: tower.x, y: tower.y }];
  chain.forEach((e, i) => {
    points.push({ x: e.x, y: e.y });
    damage(state, e, { damage: stats.damage * Math.pow(stats.chainFalloff, i) }, true);
  });
  state.effects.push({ kind: 'bolt', points, master: !!masterOf(tower), ttl: stats.boltDuration, max: stats.boltDuration });
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

// B-168: Irrlicht weicht langsamen Geschossen (projectileSpeed < dodgeBelow) aus. Kein Zufall: Zähler je Irrlicht,
// nur jedes dodgeEvery-te langsame Geschoss trifft. Gibt true zurück, wenn das Geschoss verfehlt.
function dodges(state, target, p) {
  const def = ENEMY_TYPES[target.type];
  if (!def?.dodgeEvery || p.speed >= def.dodgeBelow * TILE) return false;
  target.dodgeCount = (target.dodgeCount || 0) + 1;
  if (target.dodgeCount % def.dodgeEvery === 0) return false;
  const life = FX_STYLE.dodge.life;
  state.effects.push({ kind: 'dodge', x: target.x, y: target.y, ttl: life, max: life });
  return true;
}
const isDodger = (e) => !!ENEMY_TYPES[e.type]?.dodgeEvery;

function hit(state, p, target) {
  const dodged = !!target && dodges(state, target, p);
  if (p.splash) {
    // B-167: der Splash trifft keine Flieger und wirft sie nicht zurück.
    for (const e of state.enemies) {
      if (isFlying(e)) continue;
      // B-168: Irrlicht nimmt nur Schaden von einer auf es gezielten Kugel, die nicht verfehlt (ohne Rüstung wie Splash)
      if (isDodger(e) && (e !== target || dodged)) continue;
      if (Math.hypot(e.x - p.tx, e.y - p.ty) <= p.splash) {
        damage(state, e, p);
      }
    }
    if (p.knockback && target && !isDodger(target) && !isFlying(target)) knockBack(state, target, p); // B-167/B-168: Flieger und Irrlicht nie zurückwerfen
    state.effects.push({ kind: 'explosion', x: p.tx, y: p.ty, r: p.splash, ttl: 0.3, max: 0.3 });
    const m = p.master;
    if (m?.burnDuration) addGround(state, { kind: 'fire', x: p.tx, y: p.ty, r: p.splash, until: state.time + m.burnDuration, dps: p.damage * m.burnShare });
  } else if (target && !dodged) {
    damage(state, target, p, true);
    if (p.master?.multiTargets) {
      // B-173: Treffer-Stern des Mehrfachschusses (nur Darstellung)
      const life = MASTER_FX.multishot.starLife;
      state.effects.push({ kind: 'multiHit', x: target.x, y: target.y, main: !p.side, ttl: life, max: life });
    }
    const tower = p.freezeEvery ? state.towers.find((t) => t.id === p.towerId) : null;
    if (tower) {
      tower.hitCount = (tower.hitCount || 0) + 1;
      // B-170: Treffer zählt auch bei Glutlingen, eingefroren werden sie aber nicht
      if (tower.hitCount % p.freezeEvery === 0 && !isBoss(target) && !isSlowImmune(target)) target.frozenUntil = state.time + p.freezeDuration;
    }
    const m = p.master;
    if (m?.iceDuration) addGround(state, { kind: 'ice', x: p.tx, y: p.ty, r: m.iceRadius * TILE, until: state.time + m.iceDuration, slow: p.slow, linger: m.iceLinger, towerId: p.towerId });
    if (m?.markDuration) {
      if (!(state.time < (target.markedUntil || 0))) target.markedAt = state.time; // B-174: erstes Markieren (Aufploppen), nur Darstellung
      target.markedUntil = state.time + m.markDuration;
      target.markBonus = m.markBonus;
    }
  }
}

function addGround(state, g) {
  g.born = state.time; // B-173: Beginn für Ein- und Ausblenden (nur Darstellung)
  (state.grounds ||= []).push(g);
}

// B-176: Bodenflächen wirken auf Bodengegner darin. Brand: Schaden über Zeit (ohne Rüstung, zählt nicht gegen die Schale,
// Irrlicht ausgenommen wie beim Splash). Eis: Verlangsamung wie der Frost, nie stärker als 1 - slow (kein Stapeln).
function groundsStep(state, dt) {
  if (!state.grounds?.length) return;
  state.grounds = state.grounds.filter((g) => state.time < g.until);
  for (const g of state.grounds) {
    for (const e of state.enemies) {
      if (e.hp <= 0 || isFlying(e) || Math.hypot(e.x - g.x, e.y - g.y) > g.r) continue;
      if (g.kind === 'fire') {
        if (!isDodger(e)) damage(state, e, { damage: g.dps * dt, dot: true });
      } else if (g.kind === 'ice' && !isSlowImmune(e)) {
        const f = 1 - g.slow;
        e.slowFactor = state.time < e.slowUntil ? Math.min(e.slowFactor, f) : f;
        e.slowUntil = Math.max(e.slowUntil || 0, state.time + g.linger);
      }
    }
  }
}

// Rückstoß: Gegner entlang seines Wegs zurückwerfen (nie unter den Weganfang); Boss nur anteilig.
function knockBack(state, e, p) {
  if (state.time < (e.knockUntil || 0)) return; // Schutzzeit: kein Dauer-Zurückwerfen
  e.knockUntil = state.time + p.knockbackCooldown;
  const amount = p.knockback * (isBoss(e) ? p.bossKnockbackFactor : 1);
  e.dist = Math.max(0, e.dist - amount);
  const pt = pointAt(enemyPath(state, e), e.dist);
  e.x = pt.x;
  e.y = pt.y;
}

// Rüstung (Schildträger) und Schild (Magier): Rüstung gilt nur für Direkttreffer (direct = true), also Pfeil, Frost
// und Scharfschütze. Kanonen-Splash trifft immer mit vollem Schaden. Der Frost-Slow
// wirkt unabhängig von der Rüstung unverändert.
function damage(state, enemy, p, direct = false) {
  if (enemy.shieldUntil > state.time) return; // B-180: Schild beim Phasenwechsel, unverwundbar
  // B-169: Solange die Schale hält, nimmt jeder Treffer (nicht Lava) eine Schicht und macht 0 Schaden (vor Rüstung und Schild).
  const shelled = enemy.shell > 0 && !p.lava && !p.dot && crackShell(state, enemy);
  let dmg = shelled ? 0 : direct ? p.damage * (p.ignoreArmor ? 1 : 1 - (enemy.armor || 0)) : p.damage;
  if (!p.lava && state.time < (enemy.markedUntil || 0)) dmg *= 1 + enemy.markBonus; // B-176: markiert (Falkenauge)
  // B-126: Der Schild des Magiers schluckt den Schaden (nach der Rüstung) zuerst, der Rest geht auf die HP.
  if (enemy.ward > 0) {
    const absorbed = Math.min(enemy.ward, dmg);
    enemy.ward -= absorbed;
    dmg -= absorbed;
    // B-179: nur Optik, der Elite-Schild bricht (Splitter)
    // (nur einmal je Gegner, auch wenn ein Magier den Schild später nachfüllt)
    if (enemy.elite === 'shield' && !(enemy.ward > 0) && !enemy.eliteShieldBroken) {
      enemy.eliteShieldBroken = true;
      state.effects.push({ kind: 'eliteBreak', x: enemy.x, y: enemy.y, ttl: FX_STYLE.eliteBreak.life, max: FX_STYLE.eliteBreak.life });
    }
  }
  enemy.hp -= dmg;
  phaseCheck(state, enemy);
  if (p.slow && !isSlowImmune(enemy)) { // B-170: Glutlinge ignorieren den Frost-Slow, der Schaden wirkt
    enemy.slowFactor = 1 - p.slow;
    enemy.slowUntil = state.time + p.slowDuration;
  }
}

// B-180: Phasenwechsel der Nekromantin (ENEMY_TYPES[type].phase2), genau einmal, sobald die HP auf phase2.at * maxHp
// fallen und sie noch lebt: schnellerer Beschwörungstakt ab jetzt, Schild für shieldDuration Sekunden und das
// Logik-Ereignis 'phase2' in state.effects (für die spätere Optik; ttl = Schilddauer, id = Gegner).
function phaseCheck(state, enemy) {
  const p2 = ENEMY_TYPES[enemy.type]?.phase2;
  if (!p2 || enemy.phase === 2 || enemy.hp <= 0 || enemy.hp > p2.at * enemy.maxHp) return;
  enemy.phase = 2;
  enemy.shieldUntil = state.time + p2.shieldDuration;
  enemy.summonAt = state.time + p2.summonInterval;
  state.effects.push({ kind: 'phase2', id: enemy.id, x: enemy.x, y: enemy.y, ttl: p2.shieldDuration, max: p2.shieldDuration });
}

// B-170: immun gegen Frost-Slow und Einfrieren (Merkmal slowImmune des Gegnertyps)
function isSlowImmune(e) {
  return ENEMY_TYPES[e.type]?.slowImmune === true;
}

// B-169: eine Schicht der Schale abziehen; bricht die letzte, entsteht der Effekt 'shellBreak'. Gibt true zurück.
function crackShell(state, enemy) {
  enemy.shell -= 1;
  if (enemy.shell <= 0) {
    const life = FX_STYLE.shellBreak.life;
    state.effects.push({ kind: 'shellBreak', x: enemy.x, y: enemy.y, ttl: life, max: life });
  }
  return true;
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
      // B-179: nur Optik, das Elite-Abzeichen fliegt weg
      if (e.elite) state.effects.push({ kind: 'eliteGone', type: e.type, elite: e.elite, x: e.x, y: e.y, ttl: FX_STYLE.eliteGone.life, max: FX_STYLE.eliteGone.life });
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
  else if (state.autoWave) state.autoWaveIn = AUTO_WAVE_DELAY; // B-121: nach Welle 20 kein Countdown
}

// Schalter Auto-Start: aus beendet einen laufenden Countdown; an startet ihn neu, wenn gerade zwischen zwei Wellen
// gewartet wird (nicht vor Welle 1, nicht nach Spielende oder der letzten Welle).
export function setAutoWave(state, on) {
  state.autoWave = Boolean(on);
  if (!state.autoWave) state.autoWaveIn = null;
  else if (state.autoWaveIn === null && state.status === 'playing' && state.wave >= 1 && state.wave < MAX_WAVES && !state.waveActive) {
    state.autoWaveIn = AUTO_WAVE_DELAY;
  }
  return state.autoWave;
}
