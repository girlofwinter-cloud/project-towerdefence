// Unit-Tests für B-113: Ton-Ereignisse (sound-events.js), Begrenzung, Ton-Schalter, Web-Audio ohne Browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, buildTower, startWave, spawnEnemy, useAbility, togglePause } from '../src/game.js';
import { SOUND, TOWER_TYPES, FX_STYLE, WIDTH, HEIGHT } from '../src/config.js';
import { createSoundTracker, detectSoundEvents, collectSounds, createLimiter, allowSound, allowEvent, soundKey, loadSoundOn, saveSoundOn } from '../src/sound-events.js';
import { freeTileNearPath } from './helpers.js';

const kinds = (evs) => evs.map((e) => (e.kind === 'shot' ? `shot:${e.tower}` : e.kind));

// Spiel mit einem Turm des Typs neben dem Weg und einem Gegner in Reichweite
function gameWithTower(type) {
  const state = createGame({ gold: 10000 });
  const [c, r] = freeTileNearPath(state);
  assert.ok(buildTower(state, type, c, r).ok);
  return state;
}

// Bis zum ersten Ereignis der Art laufen lassen (höchstens `seconds`)
function runUntil(tr, state, pred, seconds = 30, dt = 1 / 60) {
  for (let t = 0; t < seconds; t += dt) {
    update(state, dt);
    const evs = detectSoundEvents(tr, state);
    if (evs.some(pred)) return evs;
  }
  return null;
}

test('B-113: Typnamen in SOUND.shots passen zu TOWER_TYPES, alle Töne haben gültige Lagen', () => {
  assert.deepEqual(Object.keys(SOUND.shots).sort(), Object.keys(TOWER_TYPES).sort());
  const all = [...Object.values(SOUND.shots), SOUND.death.layers, SOUND.lifeLost.layers, SOUND.boss.layers, SOUND.meteor.flight, SOUND.meteor.impact];
  for (const layers of all) {
    assert.ok(layers.length > 0);
    for (const l of layers) {
      assert.ok(l.type === 'osc' || l.type === 'noise');
      assert.ok(l.duration > 0 && l.duration <= 2, 'kurz');
      assert.ok(l.gain > 0 && l.gain <= 1);
      if (l.type === 'osc') assert.ok(l.freq > 0 && l.endFreq > 0, 'exponentielle Rampe braucht > 0');
      else assert.ok(l.cutoff > 0 && l.q > 0);
    }
  }
  assert.ok(SOUND.masterGain > 0 && SOUND.masterGain <= 0.3, 'leise');
  // Boss tiefer und länger als der normale Plopp; Meteor größer als die Kanone
  const maxDur = (ls) => Math.max(...ls.map((l) => l.duration));
  assert.ok(SOUND.boss.layers[0].freq < SOUND.death.layers[0].freq);
  assert.ok(maxDur(SOUND.boss.layers) > maxDur(SOUND.death.layers));
  assert.ok(maxDur(SOUND.meteor.impact) > maxDur(SOUND.shots.cannon));
  assert.ok(Math.min(...SOUND.meteor.impact.filter((l) => l.type === 'osc').map((l) => l.freq)) < SOUND.shots.cannon[0].freq);
});

test('B-113: jeder Turmtyp löst genau seinen Schuss-Ton aus (Blitz über den bolt-Effekt)', () => {
  for (const type of Object.keys(TOWER_TYPES)) {
    const state = gameWithTower(type);
    const tr = createSoundTracker();
    detectSoundEvents(tr, state); // erster Aufruf: nur merken
    startWave(state);
    const evs = runUntil(tr, state, (e) => e.kind === 'shot');
    assert.ok(evs, `${type}: kein Schuss`);
    assert.deepEqual(evs.filter((e) => e.kind === 'shot').map((e) => e.tower), [type]);
    // dasselbe Geschoss/derselbe Blitz wird nicht doppelt gemeldet
    assert.equal(detectSoundEvents(tr, state).length, 0);
  }
});

test('B-113: besiegter Gegner = death, Boss = boss; Leck und entfernte Gegner sind still', () => {
  const state = createGame();
  const tr = createSoundTracker();
  const g = spawnEnemy(state, 'grunt') ?? state.enemies.at(-1);
  const b = spawnEnemy(state, 'boss') ?? state.enemies.at(-1);
  detectSoundEvents(tr, state);
  g.hp = 0;
  b.hp = -5;
  update(state, 1 / 60); // removeDead im Projektil-Schritt
  assert.deepEqual(kinds(detectSoundEvents(tr, state)).sort(), ['boss', 'death']);
  // Gegner verschwindet mit hp > 0 (Leck, "Gegner entfernen"): kein Ton
  spawnEnemy(state, 'grunt');
  detectSoundEvents(tr, state);
  state.enemies = [];
  assert.deepEqual(detectSoundEvents(tr, state), []);
});

test('B-113: neues Spiel und Zeitsprung rückwärts lösen keinen Schwall alter Ereignisse aus', () => {
  const tr = createSoundTracker();
  const a = gameWithTower('arrow');
  detectSoundEvents(tr, a);
  startWave(a);
  for (let i = 0; i < 600; i++) update(a, 1 / 60);
  detectSoundEvents(tr, a);
  // Neues Spiel mit Geschossen, Blitzen, Meteor und toten Gegnern schon im Zustand
  const b = gameWithTower('arrow');
  b.projectiles = [{ towerType: 'cannon' }, { towerType: 'sniper' }];
  b.effects = [{ kind: 'bolt', ttl: 1, max: 1 }];
  assert.deepEqual(detectSoundEvents(tr, b), []);
  // Zeitsprung rückwärts im selben Spiel: neue Objekte werden nur gemerkt
  b.time = 50;
  detectSoundEvents(tr, b);
  b.time = 10;
  b.projectiles.push({ towerType: 'arrow' });
  b.effects.push({ kind: 'bolt', ttl: 1, max: 1 });
  assert.deepEqual(detectSoundEvents(tr, b), []);
  // danach normal weiter
  b.time = 10.1;
  b.projectiles.push({ towerType: 'frost' });
  assert.deepEqual(kinds(detectSoundEvents(tr, b)), ['shot:frost']);
});

test('B-113: bei Pause und Spielende keine Schuss-Töne', () => {
  const state = gameWithTower('arrow');
  const tr = createSoundTracker();
  detectSoundEvents(tr, state);
  togglePause(state);
  state.projectiles.push({ towerType: 'arrow' });
  state.effects.push({ kind: 'bolt', ttl: 1, max: 1 });
  assert.deepEqual(detectSoundEvents(tr, state), []);
  togglePause(state);
  assert.deepEqual(detectSoundEvents(tr, state), [], 'nicht nachgeholt');
  state.status = 'lost';
  state.projectiles.push({ towerType: 'cannon' });
  assert.deepEqual(detectSoundEvents(tr, state), []);
});

test('B-113: Meteor: Anflug einmal, Einschlag einmal; verpasster Einschlag wird nicht nachgeholt', () => {
  const M = FX_STYLE.meteor;
  const state = createGame();
  const tr = createSoundTracker();
  detectSoundEvents(tr, state);
  assert.ok(useAbility(state, 'meteor', WIDTH / 2, HEIGHT / 2).ok);
  assert.deepEqual(kinds(detectSoundEvents(tr, state)), ['meteorFlight']);
  const seen = [];
  for (let t = 0; t < M.flight + M.blast + 0.5; t += 1 / 60) {
    update(state, 1 / 60);
    seen.push(...kinds(detectSoundEvents(tr, state)));
  }
  assert.deepEqual(seen.filter((k) => k.startsWith('meteor')), ['meteorImpact']);
  // Zeitsprung: ein Meteor kurz vor dem Einschlag gilt danach als gesehen, kommt also nie
  const s2 = createGame();
  const tr2 = createSoundTracker();
  detectSoundEvents(tr2, s2);
  useAbility(s2, 'meteor', WIDTH / 2, HEIGHT / 2);
  s2.time = 100; // vorwärts ok
  detectSoundEvents(tr2, s2);
  s2.time = 50; // rückwärts -> Reset
  detectSoundEvents(tr2, s2);
  const later = [];
  for (let t = 0; t < M.flight + M.blast; t += 1 / 60) { update(s2, 1 / 60); later.push(...detectSoundEvents(tr2, s2)); }
  assert.ok(!later.some((e) => e.kind.startsWith('meteor')));
  // Meteor, der erst weit nach dem Einschlag gesehen wird (z. B. lange im Hintergrund): kein Knall
  const s3 = createGame();
  const tr3 = createSoundTracker();
  detectSoundEvents(tr3, s3);
  useAbility(s3, 'meteor', WIDTH / 2, HEIGHT / 2);
  for (let t = 0; t < M.flight + M.blast * 0.8; t += 1 / 60) update(s3, 1 / 60);
  assert.ok(!detectSoundEvents(tr3, s3).some((e) => e.kind === 'meteorImpact'));
});

test('B-113: Begrenzung je Art pro Zeitfenster (Echtzeit), Arten unabhängig', () => {
  const lim = createLimiter({ window: 0.1, perWindow: 3 });
  const ok = (key, now) => allowSound(lim, key, now);
  assert.deepEqual([ok('shot:arrow', 0), ok('shot:arrow', 0.01), ok('shot:arrow', 0.02), ok('shot:arrow', 0.03)], [true, true, true, false]);
  assert.equal(ok('shot:cannon', 0.03), true, 'andere Art nicht betroffen');
  assert.equal(ok('death', 0.03), true);
  assert.equal(ok('shot:arrow', 0.11), true, 'neues Fenster');
  assert.equal(soundKey({ kind: 'shot', tower: 'frost' }), 'shot:frost');
  assert.equal(soundKey({ kind: 'boss' }), 'boss');
  // collectSounds: 20 Geschosse in einem Frame (Tempo ×3) -> höchstens perWindow Töne
  const state = gameWithTower('arrow');
  const tr = createSoundTracker();
  collectSounds(tr, state, 0);
  for (let i = 0; i < 20; i++) state.projectiles.push({ towerType: 'arrow' });
  state.time += 0.05;
  assert.equal(collectSounds(tr, state, 1).length, SOUND.limit.perWindow);
});

test('B-113: Leben verloren -> ein Warnton je Frame; Reparatur, neues Spiel und Zeitsprung sind still', () => {
  const state = createGame();
  const tr = createSoundTracker();
  detectSoundEvents(tr, state);
  // Gegner erreicht das Ziel (echtes Leck im Spiel)
  const e = spawnEnemy(state, 'tank') ?? state.enemies.at(-1);
  e.dist = 1e9;
  update(state, 1 / 60);
  assert.deepEqual(kinds(detectSoundEvents(tr, state)), ['lifeLost']);
  // mehrere Leben auf einmal: ein Ereignis
  state.lives -= 3;
  assert.deepEqual(kinds(detectSoundEvents(tr, state)), ['lifeLost']);
  // Notfall-Reparatur (+1 Leben): still
  assert.ok(useAbility(state, 'repair').ok);
  assert.deepEqual(detectSoundEvents(tr, state), []);
  // neues Spiel mit anderer Lebenszahl: still; Zeitsprung rückwärts mit weniger Leben: still
  const b = createGame();
  b.lives = 1;
  assert.deepEqual(detectSoundEvents(tr, b), []);
  b.time = 20;
  detectSoundEvents(tr, b);
  b.time = 5;
  b.lives = 0;
  assert.deepEqual(detectSoundEvents(tr, b), []);
  // Begrenzung: höchstens perWindow Warntöne pro Fenster, unabhängig von der Schuss-Grenze
  const lim = createLimiter();
  const L = SOUND.lifeLost.limit;
  const n = [0, 0.01, 0.02, 0.03].filter((t) => allowSound(lim, 'lifeLost', t)).length;
  assert.equal(n, L.perWindow);
  assert.ok(L.perWindow === 1 && L.window >= SOUND.limit.window);
  assert.equal(allowSound(lim, 'lifeLost', L.window + 0.01), true);
});

test('B-113: Ton-Schalter in localStorage (Standard an, defekter Speicher stört nicht)', () => {
  const mem = new Map();
  const storage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)) };
  assert.equal(loadSoundOn(storage), SOUND.defaultOn);
  assert.equal(SOUND.defaultOn, true);
  saveSoundOn(storage, false);
  assert.equal(loadSoundOn(storage), false);
  saveSoundOn(storage, true);
  assert.equal(loadSoundOn(storage), true);
  const broken = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
  assert.equal(loadSoundOn(broken), true);
  assert.doesNotThrow(() => saveSoundOn(broken, false));
  assert.equal(loadSoundOn(null), true);
});

test('B-113: audio.js läuft ohne Web Audio (Node) ohne Fehler', async () => {
  const { unlockAudio, setSoundOn, playSound } = await import('../src/audio.js');
  assert.doesNotThrow(() => {
    unlockAudio();
    setSoundOn(false);
    setSoundOn(true);
    playSound({ kind: 'shot', tower: 'cannon' });
    playSound({ kind: 'meteorImpact' });
  });
});

// ---------- Tester-Ergänzungen (Randfälle) ----------
import { stepGame } from '../src/game.js';
import { MAP_ORDER } from '../src/progress.js';

test('B-113 Rand: echtes Leck (angeschlagener Gegner läuft durch) -> lifeLost, aber kein death', () => {
  const state = createGame();
  const tr = createSoundTracker();
  const e = spawnEnemy(state, 'grunt') ?? state.enemies.at(-1);
  e.hp = e.maxHp / 2;
  detectSoundEvents(tr, state);
  const all = [];
  for (let i = 0; i < 60 * 120 && state.enemies.includes(e); i++) {
    update(state, 1 / 60);
    all.push(...kinds(detectSoundEvents(tr, state)));
  }
  assert.ok(!state.enemies.includes(e), 'Gegner hat das Feld verlassen');
  assert.ok(!all.includes('death') && !all.includes('boss'));
  assert.ok(all.includes('lifeLost'));
});

test('B-113 Rand: Kartenwechsel mitten in Welle (neues state-Objekt) ist still', () => {
  const state = gameWithTower('arrow');
  const tr = createSoundTracker();
  startWave(state);
  for (let i = 0; i < 600; i++) { update(state, 1 / 60); detectSoundEvents(tr, state); }
  state.enemies.forEach((e) => { e.hp = 0; });
  const other = createGame({ mapId: MAP_ORDER[1] ?? MAP_ORDER[0] });
  assert.deepEqual(detectSoundEvents(tr, other), []);
  assert.deepEqual(detectSoundEvents(tr, other), []);
});

test('B-113 Rand: Tempo x3 -> Begrenzung nach Echtzeit, je Art höchstens perWindow pro Fenster', () => {
  const state = gameWithTower('arrow');
  for (const t of ['cannon', 'frost']) {
    const [c, r] = freeTileNearPath(state);
    buildTower(state, t, c, r);
  }
  startWave(state);
  const tr = createSoundTracker();
  const perKey = new Map();
  let real = 0;
  for (let i = 0; i < 60 * 20; i++) {
    real += 1 / 60;
    stepGame(state, 1 / 60, 3);
    for (const ev of collectSounds(tr, state, real)) {
      const k = `${soundKey(ev)}@${Math.floor(real / SOUND.limit.window)}`;
      perKey.set(k, (perKey.get(k) || 0) + 1);
    }
  }
  for (const [k, n] of perKey) {
    const lim = k.startsWith('lifeLost') ? SOUND.lifeLost.limit.perWindow : SOUND.limit.perWindow;
    // Fenster gleiten (Start beim ersten Ton), daher höchstens 2x je festem Raster-Fenster
    assert.ok(n <= 2 * lim, `${k}: ${n}`);
  }
});

test('B-113 Review: gemeinsame Obergrenze aller Töne; Warnton und Meteor fallen nie weg', () => {
  const L = SOUND.limit;
  assert.ok(L.total > 0 && L.total < L.perWindow * 5, 'Obergrenze unter der Summe der Einzelgrenzen');
  const lim = createLimiter();
  const types = ['arrow', 'cannon', 'frost', 'sniper', 'lightning'];
  let n = 0;
  for (const tower of types) for (let i = 0; i < L.perWindow; i++) if (allowEvent(lim, { kind: 'shot', tower }, 0)) n++;
  if (allowEvent(lim, { kind: 'death' }, 0.01)) n++;
  if (allowEvent(lim, { kind: 'boss' }, 0.01)) n++;
  assert.equal(n, L.total);
  // ausgenommen: trotz voller Obergrenze erlaubt
  for (const kind of SOUND.totalExempt) assert.equal(allowEvent(lim, { kind }, 0.02), true, kind);
  assert.deepEqual([...SOUND.totalExempt].sort(), ['lifeLost', 'meteorFlight', 'meteorImpact']);
  // neues Fenster: wieder frei
  assert.equal(allowEvent(lim, { kind: 'shot', tower: 'arrow' }, L.window + 0.05), true);
  // collectSounds: viele Türme bei Tempo x3 in einem Frame -> höchstens total, Warnton trotzdem dabei
  const state = createGame();
  const tr = createSoundTracker();
  collectSounds(tr, state, 0);
  for (const tower of types) for (let i = 0; i < 10; i++) state.projectiles.push({ towerType: tower });
  state.lives -= 2;
  state.time += 0.05;
  const evs = collectSounds(tr, state, 5);
  assert.equal(evs.filter((e) => e.kind === 'shot').length, L.total);
  assert.ok(evs.some((e) => e.kind === 'lifeLost'));
});
