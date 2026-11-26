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
      const key = soundKey(ev);
      const w = (key === 'lifeLost' ? SOUND.lifeLost.limit : SOUND.limitOverrides[key] ?? SOUND.limit).window;
      const k = `${key}@${Math.floor(real / w)}`;
      perKey.set(k, (perKey.get(k) || 0) + 1);
    }
  }
  for (const [k, n] of perKey) {
    const key = k.split('@')[0];
    const lim = (key === 'lifeLost' ? SOUND.lifeLost.limit : SOUND.limitOverrides[key] ?? SOUND.limit).perWindow;
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
  assert.equal(n, L.total);
  // Tode und Boss zählen nicht gegen die Schuss-Obergrenze: trotz voller Grenze erlaubt
  assert.equal(allowEvent(lim, { kind: 'death' }, 0.01), true);
  assert.equal(allowEvent(lim, { kind: 'boss' }, 0.01), true);
  // ausgenommen: trotz voller Obergrenze erlaubt
  for (const kind of SOUND.totalExempt) assert.equal(allowEvent(lim, { kind }, 0.02), true, kind);
  assert.deepEqual([...SOUND.totalExempt].sort(), ['lifeLost', 'meteorFlight', 'meteorImpact']);
  // neues Fenster: wieder frei
  assert.equal(allowEvent(lim, { kind: 'shot', tower: 'arrow' }, Math.max(L.window, L.totalWindow) + 0.01), true);
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

test('B-113: Pfeil-Ton = tiefe Sehne plus Flug-Rauschen mit steigendem Bandpass, leichte Variation nur beim Pfeil', () => {
  const arrow = SOUND.shots.arrow;
  const twang = arrow.find((l) => l.type === 'osc');
  assert.ok(twang.freq < 400 && twang.endFreq < twang.freq, 'tiefer, fallender Sehnenton');
  const whoosh = arrow.find((l) => l.type === 'noise');
  assert.equal(whoosh.filter, 'bandpass');
  assert.ok(whoosh.endCutoff > whoosh.cutoff, 'Mittenfrequenz gleitet nach oben');
  assert.ok(whoosh.delay > 0 && whoosh.attack > twang.attack);
  assert.deepEqual(Object.keys(SOUND.shotPitchVar).sort(), Object.keys(TOWER_TYPES).sort());
  assert.ok(SOUND.shotPitchVar.arrow > 0 && SOUND.shotPitchVar.arrow <= 0.1);
  for (const [t, v] of Object.entries(SOUND.shotPitchVar)) assert.ok(v >= 0.04 && v <= 0.06, t);
  // endCutoff nur bei Rauschen und immer > 0 (exponentielle Rampe)
  const all = [...Object.values(SOUND.shots), SOUND.death.layers, SOUND.boss.layers, SOUND.lifeLost.layers, SOUND.meteor.flight, SOUND.meteor.impact];
  for (const l of all.flat()) if ('endCutoff' in l) assert.ok(l.type === 'noise' && l.endCutoff > 0);
});

test('B-113: audio.js setzt endCutoff als Filter-Rampe und variiert die Pfeil-Tonhöhe (Web Audio nachgebaut)', async () => {
  const calls = [];
  const param = (name) => ({ value: 0, setValueAtTime: (v, t) => calls.push([name, 'set', v, t]), exponentialRampToValueAtTime: (v, t) => calls.push([name, 'ramp', v, t]) });
  const node = () => ({ connect() {}, start() {}, stop() {} });
  class FakeCtx {
    constructor() { this.state = 'running'; this.currentTime = 1; this.sampleRate = 100; this.destination = {}; }
    createGain() { return { ...node(), gain: param('gain') }; }
    createBuffer(_c, len) { return { getChannelData: () => new Float32Array(len) }; }
    createBufferSource() { return node(); }
    createBiquadFilter() { return { ...node(), frequency: param('filter'), Q: { value: 0 } }; }
    createOscillator() { return { ...node(), frequency: param('osc') }; }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
  }
  const hadWindow = 'window' in globalThis;
  globalThis.window = { AudioContext: FakeCtx };
  const origRandom = Math.random;
  try {
    const { unlockAudio, setSoundOn, playSound } = await import(`../src/audio.js?fake=${Date.now()}`);
    setSoundOn(true);
    unlockAudio();
    Math.random = () => 1; // höchste Variation: pitch = 1 + pitchVar
    playSound({ kind: 'shot', tower: 'arrow' });
    const k = 1 + SOUND.shotPitchVar.arrow;
    const w = SOUND.shots.arrow.find((l) => l.endCutoff);
    const f = calls.filter((c) => c[0] === 'filter');
    assert.ok(Math.abs(f[0][2] - w.cutoff * k) < 1e-9 && f[0][1] === 'set');
    assert.ok(Math.abs(f[1][2] - w.endCutoff * k) < 1e-9 && f[1][1] === 'ramp');
    assert.ok(Math.abs(f[1][3] - (1 + w.delay + w.duration)) < 1e-9, 'Rampe endet am Lagenende');
    const o = calls.find((c) => c[0] === 'osc' && c[1] === 'set');
    assert.ok(Math.abs(o[2] - SOUND.shots.arrow[0].freq * k) < 1e-9, 'Sehne mitvariiert');
    // Kanone: ohne endCutoff kein Filter-Ramp; Math.random = 0,5 -> keine Variation
    calls.length = 0;
    Math.random = () => 0.5;
    playSound({ kind: 'shot', tower: 'cannon' });
    assert.ok(!calls.some((c) => c[0] === 'filter' && c[1] === 'ramp'));
    assert.equal(calls.find((c) => c[0] === 'osc' && c[1] === 'set')[2], SOUND.shots.cannon[0].freq);
  } finally {
    Math.random = origRandom;
    if (hadWindow) globalThis.window = undefined; else delete globalThis.window;
  }
});

test('B-113: Töne weicher und seltener (Grenzen, Lautstärken, Klangfarbe aus SOUND)', () => {
  const L = SOUND.limit;
  assert.ok(L.perWindow === 1 && L.window >= 0.1, 'je Turmtyp höchstens 1 Ton pro ~0,12 s');
  assert.ok(L.total <= 3 && L.totalWindow >= 0.15, 'alle Schüsse zusammen höchstens ~3 pro 0,15 s');
  assert.ok(SOUND.limitOverrides.death.perWindow <= 2);
  // Tode: höchstens 2 pro Fenster
  const lim = createLimiter();
  const d = [0, 0.01, 0.02, 0.03].filter((t) => allowEvent(lim, { kind: 'death' }, t)).length;
  assert.equal(d, SOUND.limitOverrides.death.perWindow);
  // Schüsse: über alle Typen höchstens total im Fenster, auch über mehrere Frames verteilt
  let s = 0;
  for (let i = 0; i < 10; i++) for (const tower of Object.keys(TOWER_TYPES)) if (allowEvent(lim, { kind: 'shot', tower }, i * 0.01)) s++;
  assert.equal(s, L.total);
  // weich: Master-Tiefpass, kein Rechteck/Sägezahn, Frost ohne hohen Oberton
  assert.ok(SOUND.masterLowpass >= 3000 && SOUND.masterLowpass <= 6000);
  assert.ok(SOUND.masterGain <= 0.12);
  for (const layers of Object.values(SOUND.shots)) for (const l of layers) assert.ok(l.wave !== 'square' && l.wave !== 'sawtooth');
  for (const l of SOUND.shots.frost) assert.ok(l.freq <= 1800 && l.endFreq <= 1800);
  assert.ok(SOUND.shots.lightning.every((l) => l.type !== 'noise' || l.cutoff <= 3000));
  // Schüsse leiser als Meteor, Boss und Warnton
  const peak = (ls) => Math.max(...ls.map((l) => l.gain));
  const loudestShot = Math.max(...Object.values(SOUND.shots).map(peak));
  for (const ls of [SOUND.meteor.impact, SOUND.boss.layers, SOUND.lifeLost.layers]) assert.ok(peak(ls) > loudestShot);
  assert.equal(SOUND.death.layers[0].wave, 'sine');
});

// ---------- B-114: Aufnahmen statt Synthese ----------
import { sampleUrls, planSound } from '../src/sound-events.js';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('B-114: jedes B-113-Ereignis hat 2–4 Aufnahmen, Dateien vorhanden, zusammen höchstens 400 KB, Lizenz je Datei', () => {
  const keys = [...Object.keys(TOWER_TYPES).map((t) => `shot:${t}`), 'death', 'boss', 'lifeLost', 'meteorFlight', 'meteorImpact'];
  assert.deepEqual(Object.keys(SOUND.samples.sounds).sort(), keys.sort());
  const lic = fs.readFileSync(`${ROOT}assets/sounds/LIZENZ.md`, 'utf8');
  assert.match(lic, /CC0/);
  assert.match(lic, /https:\/\/kenney\.nl/);
  let total = 0;
  for (const def of Object.values(SOUND.samples.sounds)) {
    assert.ok(def.files.length >= 2 && def.files.length <= 4);
    assert.ok(def.gain > 0 && def.pitchVar >= 0 && def.pitchVar < 0.3);
  }
  for (const { url } of sampleUrls()) {
    assert.match(url, /^assets\/sounds\/[a-z0-9-]+\.m4a$/);
    total += fs.statSync(`${ROOT}${url}`).size;
    assert.ok(lic.includes(url.split('/').pop()), `${url} fehlt in LIZENZ.md`);
  }
  assert.ok(total <= 400 * 1024, `zu groß: ${total}`);
});

test('B-114: Schüsse leiser als Tod, Boss, Meteor und Warnton', () => {
  const s = SOUND.samples.sounds;
  const shotMax = Math.max(...Object.keys(TOWER_TYPES).map((t) => s[`shot:${t}`].gain));
  for (const k of ['death', 'boss', 'lifeLost', 'meteorFlight', 'meteorImpact']) assert.ok(s[k].gain > shotMax, k);
});

test('B-114: planSound wählt Variante und Tonhöhe, sonst Synthese als Ersatz', () => {
  const ev = { kind: 'shot', tower: 'cannon' };
  const def = SOUND.samples.sounds['shot:cannon'];
  assert.deepEqual(planSound(ev, new Map()), { type: 'synth' });
  assert.deepEqual(planSound(ev, new Map([['shot:cannon', []]])), { type: 'synth' });
  assert.deepEqual(planSound(ev, null), { type: 'synth' });
  assert.deepEqual(planSound({ kind: 'unbekannt' }, new Map([['unbekannt', ['x']]])), { type: 'synth' });
  // andere Art geladen, diese nicht -> Synthese
  assert.deepEqual(planSound(ev, new Map([['shot:arrow', ['a']]])), { type: 'synth' });
  const bufs = new Map([['shot:cannon', ['a', 'b', 'c']]]);
  const seq = (...v) => { let i = 0; return () => v[i++]; };
  let p = planSound(ev, bufs, seq(0, 0.5));
  assert.equal(p.type, 'sample');
  assert.equal(p.buffer, 'a');
  assert.equal(p.rate, 1);
  assert.equal(p.gain, def.gain);
  p = planSound(ev, bufs, seq(0.999999, 0.999999));
  assert.equal(p.buffer, 'c');
  assert.ok(Math.abs(p.rate - (1 + def.pitchVar)) < 1e-4);
  p = planSound(ev, bufs, seq(0.4, 0));
  assert.equal(p.buffer, 'b');
  assert.ok(Math.abs(p.rate - (1 - def.pitchVar)) < 1e-9);
  // rnd() == 1 (außerhalb [0,1)) bleibt im Bereich
  assert.equal(planSound(ev, bufs, () => 1).buffer, 'c');
  // Verteilung: alle Varianten kommen vor
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(planSound(ev, bufs).buffer);
  assert.equal(seen.size, 3);
});

// Web Audio und fetch nachgebaut: Aufnahme spielt, wenn geladen; sonst Synthese
async function withFakeAudio({ fetchImpl, decode }, fn) {
  const log = [];
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = (kind) => ({ kind, connect() {}, start() { log.push(['start', kind, this]); }, stop() {} });
  class FakeCtx {
    constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 100; this.destination = {}; }
    createGain() { return { ...node('gain'), gain: param() }; }
    createBuffer(_c, len) { return { getChannelData: () => new Float32Array(len) }; }
    createBufferSource() { return { ...node('source'), playbackRate: { value: 1 } }; }
    createBiquadFilter() { return { ...node('filter'), frequency: param(), Q: { value: 0 } }; }
    createOscillator() { return { ...node('osc'), frequency: param() }; }
    decodeAudioData(data) { return decode(data); }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
  }
  const hadWindow = 'window' in globalThis;
  const origFetch = globalThis.fetch;
  globalThis.window = { AudioContext: FakeCtx };
  globalThis.fetch = fetchImpl;
  try {
    const mod = await import(`../src/audio.js?b114=${Math.random()}`);
    mod.setSoundOn(true);
    mod.unlockAudio();
    await new Promise((r) => setTimeout(r, 20)); // Laden abwarten
    await fn(mod, log);
  } finally {
    globalThis.fetch = origFetch;
    if (hadWindow) globalThis.window = undefined; else delete globalThis.window;
  }
}

test('B-114: audio.js lädt die Aufnahmen nach unlockAudio und spielt sie mit playbackRate', async () => {
  const fetched = [];
  await withFakeAudio({
    fetchImpl: async (url) => { fetched.push(url); return { ok: true, arrayBuffer: async () => ({ url }) }; },
    decode: async (data) => ({ decoded: data.url }),
  }, async ({ playSound }, log) => {
    assert.deepEqual(fetched.sort(), sampleUrls().map((u) => u.url).sort());
    log.length = 0;
    playSound({ kind: 'meteorImpact' });
    const src = log.find((l) => l[1] === 'source')?.[2];
    assert.ok(src, 'Aufnahme gestartet');
    assert.match(src.buffer.decoded, /meteor-impact-\d\.m4a$/);
    const v = SOUND.samples.sounds.meteorImpact.pitchVar;
    assert.ok(Math.abs(src.playbackRate.value - 1) <= v + 1e-9);
    assert.ok(!log.some((l) => l[1] === 'osc'), 'keine Synthese');
  });
});

test('B-114: fehlende Datei oder Dekodier-Fehler -> Synthese, kein Fehler', async () => {
  // 404 für Kanone, Dekodier-Fehler für Tod, alles andere kaputt per Netzwerkfehler
  await withFakeAudio({
    fetchImpl: async (url) => {
      if (url.includes('cannon')) return { ok: false, status: 404 };
      if (url.includes('death')) return { ok: true, arrayBuffer: async () => ({ url }) };
      if (url.includes('frost')) return { ok: true, arrayBuffer: async () => ({ url }) };
      throw new TypeError('Netzwerk');
    },
    decode: async (data) => {
      if (data.url.includes('death')) throw new Error('kaputt');
      return { decoded: data.url };
    },
  }, async ({ playSound }, log) => {
    for (const ev of [{ kind: 'shot', tower: 'cannon' }, { kind: 'death' }, { kind: 'boss' }]) {
      log.length = 0;
      assert.doesNotThrow(() => playSound(ev));
      assert.ok(log.some((l) => l[1] === 'osc'), `${ev.kind}: Synthese als Ersatz`);
    }
    log.length = 0;
    playSound({ kind: 'shot', tower: 'frost' });
    assert.ok(log.some((l) => l[1] === 'source' && l[2].buffer?.decoded), 'Frost als Aufnahme');
  });
});

test('B-114: serve.mjs liefert .m4a als audio/mp4', async () => {
  const { createServer } = await import('../scripts/serve.mjs');
  const server = createServer().listen(0);
  await new Promise((r) => server.once('listening', r));
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/${sampleUrls()[0].url}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'audio/mp4');
    await res.arrayBuffer();
  } finally {
    server.close();
  }
});

// ---------- B-115: Ereignis-Töne (Bauen, Ausbauen, Verkaufen, Wellenstart, Sieg, Niederlage) ----------
import { upgradeTower, sellTower } from '../src/game.js';
import { detectStateEvents } from '../src/sound-events.js';
import { prepareWave, applyCheats, forceEnd, clearEnemies } from '../src/test-tools.js';
import { MAX_WAVES } from '../src/config.js';

const EVENT_KINDS = ['build', 'upgrade', 'sell', 'waveStart', 'won', 'lost'];

test('B-115: jede Ereignis-Art hat Synthese, Grenze und Aufnahmen; lauter als Schüsse; Lizenz und Größe', () => {
  assert.deepEqual(Object.keys(SOUND.events).sort(), [...EVENT_KINDS].sort());
  assert.deepEqual(Object.keys(SOUND.eventSamples.sounds).sort(), [...EVENT_KINDS].sort());
  const lic = fs.readFileSync(`${ROOT}assets/sounds/LIZENZ.md`, 'utf8');
  const shotMax = Math.max(...Object.keys(TOWER_TYPES).map((t) => SOUND.samples.sounds[`shot:${t}`].gain));
  for (const k of EVENT_KINDS) {
    const ev = SOUND.events[k];
    assert.ok(ev.limit.window > 0 && ev.limit.perWindow >= 1, k);
    assert.ok(ev.pitchVar >= 0 && ev.pitchVar < 0.3);
    assert.ok(ev.layers.length > 0);
    for (const l of ev.layers) {
      assert.ok(l.type === 'osc' || l.type === 'noise');
      assert.ok(l.duration > 0 && l.duration <= 2 && l.gain > 0 && l.gain <= 1);
      if (l.type === 'osc') assert.ok(l.freq > 0 && l.endFreq > 0);
      else assert.ok(l.cutoff > 0 && l.q > 0);
    }
    const s = SOUND.eventSamples.sounds[k];
    assert.ok(s.files.length >= 1 && s.gain > shotMax, `${k} lauter als Schüsse`);
  }
  // Ausbauen steigt auf, Niederlage fällt ab (Synthese-Ersatz)
  const up = SOUND.events.upgrade.layers.map((l) => l.freq);
  assert.ok(up.every((f, i) => i === 0 || f > up[i - 1]));
  const lost = SOUND.events.lost.layers.filter((l) => l.wave === 'triangle').map((l) => l.freq);
  assert.ok(lost.every((f, i) => i === 0 || f < lost[i - 1]));
  const urls = sampleUrls().map((u) => u.url);
  let total = 0;
  for (const k of EVENT_KINDS) {
    for (const f of SOUND.eventSamples.sounds[k].files) {
      const url = `assets/sounds/${f}.m4a`;
      assert.ok(urls.includes(url), `${url} wird geladen`);
      assert.ok(lic.includes(`${f}.m4a`), `${f} fehlt in LIZENZ.md`);
    }
  }
  for (const f of fs.readdirSync(`${ROOT}assets/sounds`)) total += fs.statSync(`${ROOT}assets/sounds/${f}`).size;
  assert.ok(total <= 400 * 1024, `assets/sounds zu groß: ${total}`);
});

test('B-115: Bauen, Ausbauen, Verkaufen je einmal; abgelehnte Aktionen sind still', () => {
  const state = createGame({ gold: 10000 });
  const tr = createSoundTracker();
  assert.deepEqual(detectStateEvents(tr, state), []);
  const [c, r] = freeTileNearPath(state);
  const { tower } = buildTower(state, 'arrow', c, r);
  assert.deepEqual(kinds(detectStateEvents(tr, state)), ['build']);
  assert.deepEqual(detectStateEvents(tr, state), [], 'nicht doppelt');
  assert.equal(buildTower(state, 'arrow', c, r).ok, false);
  assert.deepEqual(detectStateEvents(tr, state), [], 'besetztes Feld');
  assert.ok(upgradeTower(state, tower.id).ok);
  assert.deepEqual(kinds(detectStateEvents(tr, state)), ['upgrade']);
  while (upgradeTower(state, tower.id).ok);
  detectStateEvents(tr, state);
  assert.equal(upgradeTower(state, tower.id).ok, false);
  assert.deepEqual(detectStateEvents(tr, state), [], 'Höchststufe');
  state.gold = 0;
  assert.equal(buildTower(state, 'cannon', ...freeTileNearPath(state)).ok, false);
  assert.deepEqual(detectStateEvents(tr, state), [], 'kein Gold');
  assert.ok(sellTower(state, tower.id).ok);
  assert.deepEqual(kinds(detectStateEvents(tr, state)), ['sell']);
  assert.equal(sellTower(state, tower.id).ok, false);
  assert.deepEqual(detectStateEvents(tr, state), []);
  // Mehrere Türme in einem Frame: ein Ton
  state.gold = 10000;
  for (let i = 0; i < 3; i++) buildTower(state, 'arrow', ...freeTileNearPath(state));
  assert.deepEqual(kinds(detectStateEvents(tr, state)), ['build']);
});

test('B-115: Wellenstart einmal je Welle, nicht bei abgelehntem Start; Sieg und Niederlage einmal', () => {
  const state = createGame();
  const tr = createSoundTracker();
  detectStateEvents(tr, state);
  assert.ok(startWave(state).ok);
  assert.deepEqual(kinds(detectStateEvents(tr, state)), ['waveStart']);
  assert.equal(startWave(state).ok, false);
  const seen = [];
  for (let t = 0; t < 2; t += 1 / 60) { update(state, 1 / 60); seen.push(...kinds(detectStateEvents(tr, state))); }
  assert.ok(!seen.includes('waveStart'));
  // Letzte Welle wirklich gewinnen
  prepareWave(state, MAX_WAVES);
  assert.deepEqual(detectStateEvents(tr, state), [], 'prepareWave ist still');
  assert.ok(startWave(state).ok);
  assert.deepEqual(kinds(detectStateEvents(tr, state)), ['waveStart']);
  clearEnemies(state);
  update(state, 1 / 60);
  assert.equal(state.status, 'won');
  assert.deepEqual(kinds(detectStateEvents(tr, state)), ['won']);
  assert.deepEqual(detectStateEvents(tr, state), []);
  // Niederlage durch Leck
  const s2 = createGame();
  const tr2 = createSoundTracker();
  detectStateEvents(tr2, s2);
  s2.lives = 1;
  startWave(s2);
  const evs = [];
  for (let t = 0; t < 120 && s2.status === 'playing'; t += 1 / 30) { update(s2, 1 / 30); evs.push(...kinds(detectStateEvents(tr2, s2))); }
  assert.equal(s2.status, 'lost');
  assert.deepEqual(evs.filter((k) => k === 'lost' || k === 'won'), ['lost']);
});

test('B-115: neues Spiel, Kartenwechsel, Zeitsprung und Testseiten-Cheats lösen keinen Schwall aus', () => {
  const a = createGame({ gold: 10000 });
  const tr = createSoundTracker();
  detectStateEvents(tr, a);
  // Neues Spiel mit Türmen, laufender Welle und Spielende: still
  const b = createGame({ gold: 10000 });
  for (let i = 0; i < 4; i++) buildTower(b, 'arrow', ...freeTileNearPath(b));
  startWave(b);
  b.status = 'lost';
  assert.deepEqual(collectSounds(tr, b, 0), []);
  // Zeitsprung rückwärts mit Änderungen: still
  b.status = 'playing';
  update(b, 0.5);
  detectStateEvents(tr, b);
  b.time = 0;
  b.towers.pop();
  buildTower(b, 'cannon', ...freeTileNearPath(b));
  assert.deepEqual(detectStateEvents(tr, b), []);
  // Cheats der Testseite (Gold/Leben auffüllen, Welle vorspulen) sind still; erzwungenes Ende genau ein Ton
  const c = createGame();
  const tc = createSoundTracker();
  detectStateEvents(tc, c);
  for (let i = 0; i < 30; i++) {
    applyCheats(c, { infiniteGold: true, invincible: true });
    prepareWave(c, 5 + (i % 3));
    assert.deepEqual(detectStateEvents(tc, c), []);
  }
  forceEnd(c, 'won');
  assert.deepEqual(kinds(detectStateEvents(tc, c)), ['won']);
  prepareWave(c, 3);
  assert.deepEqual(detectStateEvents(tc, c), []);
});

test('B-115: Ereignis-Töne zählen nicht gegen die Schuss-Grenze, eigene Grenze je Art', () => {
  const lim = createLimiter();
  for (let i = 0; i < 10; i++) allowEvent(lim, { kind: 'shot', tower: Object.keys(TOWER_TYPES)[i % 5] }, 0);
  assert.equal(allowEvent(lim, { kind: 'shot', tower: 'arrow' }, 0.01), false, 'Schüsse voll');
  for (const k of EVENT_KINDS) {
    assert.equal(allowEvent(lim, { kind: k }, 0.01), true, k);
    assert.equal(allowEvent(lim, { kind: k }, 0.02), false, `${k}: eigene Grenze`);
    assert.equal(allowEvent(lim, { kind: k }, 0.011 + SOUND.events[k].limit.window), true, `${k}: nach dem Fenster wieder`);
  }
  // collectSounds liefert Spiel- und Zustands-Ereignisse zusammen
  const state = createGame({ gold: 10000 });
  const tr = createSoundTracker();
  collectSounds(tr, state, 0);
  buildTower(state, 'arrow', ...freeTileNearPath(state));
  startWave(state);
  assert.deepEqual(kinds(collectSounds(tr, state, 1)).sort(), ['build', 'waveStart']);
});

test('B-115: planSound findet Ereignis-Aufnahmen; audio.js spielt sie oder die Synthese als Ersatz', async () => {
  const bufs = new Map([['won', ['w']]]);
  const p = planSound({ kind: 'won' }, bufs, () => 0);
  assert.equal(p.type, 'sample');
  assert.equal(p.buffer, 'w');
  assert.equal(p.gain, SOUND.eventSamples.sounds.won.gain);
  assert.deepEqual(planSound({ kind: 'lost' }, bufs), { type: 'synth' });
  await withFakeAudio({
    fetchImpl: async (url) => (url.includes('build') ? { ok: true, arrayBuffer: async () => ({ url }) } : { ok: false, status: 404 }),
    decode: async (data) => ({ decoded: data.url }),
  }, async ({ playSound }, log) => {
    log.length = 0;
    playSound({ kind: 'build' });
    const src = log.find((l) => l[1] === 'source')?.[2];
    assert.match(src?.buffer?.decoded || '', /build-\d\.m4a$/);
    for (const k of EVENT_KINDS.filter((x) => x !== 'build')) {
      log.length = 0;
      assert.doesNotThrow(() => playSound({ kind: k }));
      assert.equal(log.filter((l) => l[1] === 'osc').length, SOUND.events[k].layers.filter((l) => l.type === 'osc').length, `${k}: Synthese`);
    }
  });
});

// ---------- B-116: Hintergrundmusik ----------
import { musicUrl, musicLevel, musicRamp, findLoopPoints } from '../src/sound-events.js';

test('B-116: Musik-Datei, Lizenz, Größe und Zahlen in SOUND.music; leiser als die Effekte', () => {
  const M = SOUND.music;
  const url = musicUrl();
  assert.equal(url, 'assets/music/music-old-tower-inn.m4a');
  const size = fs.statSync(`${ROOT}${url}`).size;
  assert.ok(size > 100 * 1024 && size <= 1.5 * 1024 * 1024, `Größe ${size}`);
  const lic = fs.readFileSync(`${ROOT}assets/sounds/LIZENZ.md`, 'utf8');
  for (const s of ['music-old-tower-inn.m4a', 'The Old Tower Inn', 'RandomMind', 'https://opengameart.org/content/medieval-the-old-tower-inn']) assert.ok(lic.includes(s), s);
  assert.ok(!sampleUrls().some((u) => u.url === url), 'Musik nicht unter den Effekten');
  for (const k of ['gain', 'pausedFactor', 'fadeIn', 'fadeOut', 'fadeChange', 'silence', 'minLoop']) assert.ok(M[k] > 0, k);
  assert.ok(M.pausedFactor <= 1 && M.fadeIn >= 1 && M.silence < 0.01);
  // Musik läuft ohne Master: deutlich leiser als der leiseste Ereignis-Ton und als der Master selbst
  const minEvent = Math.min(...Object.values(SOUND.eventSamples.sounds).map((s) => s.gain)) * SOUND.masterGain;
  assert.ok(M.gain < minEvent * 0.75 && M.gain < SOUND.masterGain);
});

test('B-116: musicLevel und musicRamp (Ton an/aus, Pause, Sieg/Niederlage, Ein-/Ausblenden)', () => {
  const M = SOUND.music;
  assert.equal(musicLevel({ soundOn: true, status: 'playing', paused: false }), M.gain);
  assert.ok(Math.abs(musicLevel({ soundOn: true, status: 'playing', paused: true }) - M.gain * M.pausedFactor) < 1e-12);
  assert.equal(musicLevel({ soundOn: false, status: 'playing', paused: false }), 0);
  assert.equal(musicLevel({ soundOn: true, status: 'won', paused: false }), 0);
  assert.equal(musicLevel({ soundOn: true, status: 'lost', paused: true }), 0);
  assert.equal(musicRamp(M.gain, M.gain), null, 'unverändert: nichts tun');
  assert.equal(musicRamp(0, 0), null);
  assert.deepEqual(musicRamp(0, M.gain), { target: M.gain, time: M.fadeIn });
  assert.deepEqual(musicRamp(M.gain, 0), { target: 0, time: M.fadeOut });
  assert.deepEqual(musicRamp(M.gain, M.gain * M.pausedFactor), { target: M.gain * M.pausedFactor, time: M.fadeChange });
  assert.equal(musicRamp(0, NaN), null);
  // Ablauf: Start -> Sieg -> neues Spiel blendet wieder ein
  let level = 0;
  const step = (s) => { const r = musicRamp(level, musicLevel(s)); if (r) level = r.target; return r; };
  assert.equal(step({ soundOn: true, status: 'playing' }).time, M.fadeIn);
  assert.equal(step({ soundOn: true, status: 'playing' }), null);
  assert.equal(step({ soundOn: true, status: 'won' }).time, M.fadeOut);
  assert.equal(step({ soundOn: true, status: 'playing' }).time, M.fadeIn);
});

test('B-116: findLoopPoints schneidet Stille an den Rändern ab', () => {
  const sr = 100;
  const sig = (len, from, to, v = 0.5) => Float32Array.from({ length: len }, (_, i) => (i >= from && i < to ? v : 0));
  // Stille 0,3 s vorne, 0,5 s hinten
  let p = findLoopPoints([sig(500, 30, 450)], sr, 0.001, 1);
  assert.ok(Math.abs(p.start - 0.3) < 1e-9 && Math.abs(p.end - 4.5) < 1e-9);
  // Stereo: der lautere Kanal zählt
  p = findLoopPoints([sig(500, 100, 300), sig(500, 20, 480)], sr, 0.001, 1);
  assert.ok(Math.abs(p.start - 0.2) < 1e-9 && Math.abs(p.end - 4.8) < 1e-9);
  // Grenzwert: Werte unter dem Grenzwert gelten als Stille, negative zählen per Betrag
  const a = sig(500, 0, 500, 0.0009); a[50] = -0.01; a[400] = 0.01;
  p = findLoopPoints([a], sr, 0.001, 1);
  assert.ok(Math.abs(p.start - 0.5) < 1e-9 && Math.abs(p.end - 4.01) < 1e-9);
  // keine Stille: ganze Länge
  assert.deepEqual(findLoopPoints([sig(500, 0, 500)], sr, 0.001, 1), { start: 0, end: 5 });
  // ganz still, zu kurz, leer, ungültig: ganze Länge
  assert.deepEqual(findLoopPoints([sig(500, 0, 0)], sr, 0.001, 1), { start: 0, end: 5 });
  assert.deepEqual(findLoopPoints([sig(500, 200, 250)], sr, 0.001, 1), { start: 0, end: 5 });
  assert.deepEqual(findLoopPoints([], sr), { start: 0, end: 0 });
  assert.deepEqual(findLoopPoints([sig(10, 0, 10)], 0), { start: 0, end: 0 });
  // Standardwerte aus SOUND.music
  p = findLoopPoints([sig(500, 30, 450)], sr);
  assert.ok(Math.abs(p.start - 0.3) < 1e-9);
});

// Web Audio nachgebaut mit Rampen-Protokoll; Laden der Effekte steuerbar (release)
async function withFakeMusic({ musicFails = false } = {}, fn) {
  const log = [];
  const fetched = [];
  let release;
  const effectsDone = new Promise((r) => { release = r; });
  const param = (name) => ({
    name, value: 0,
    setValueAtTime(v, t) { log.push([name, 'set', v, t]); },
    linearRampToValueAtTime(v, t) { log.push([name, 'ramp', v, t]); this.value = v; },
    exponentialRampToValueAtTime() {},
    cancelScheduledValues(t) { log.push([name, 'cancel', t]); },
  });
  const node = (kind) => ({ kind, outs: [], connect(n) { this.outs.push(n); }, start(...a) { log.push(['start', kind, this, a]); }, stop() {} });
  const sr = 100;
  const musicBuf = {
    numberOfChannels: 2, sampleRate: sr, length: 1000,
    getChannelData: (c) => Float32Array.from({ length: 1000 }, (_, i) => (i >= 50 + c * 10 && i < 900 ? 0.3 : 0)),
  };
  let ctx;
  class FakeCtx {
    constructor() { ctx = this; this.state = 'running'; this.currentTime = 10; this.sampleRate = sr; this.destination = { kind: 'destination' }; }
    createGain() { return { ...node('gain'), gain: param('gain') }; }
    createBuffer(_c, len) { return { getChannelData: () => new Float32Array(len) }; }
    createBufferSource() { return { ...node('source'), playbackRate: { value: 1 } }; }
    createBiquadFilter() { return { ...node('filter'), frequency: param('filter'), Q: { value: 0 } }; }
    createOscillator() { return { ...node('osc'), frequency: param('osc') }; }
    decodeAudioData(data) { return Promise.resolve(data.url.includes('music') ? musicBuf : { url: data.url }); }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
  }
  const hadWindow = 'window' in globalThis;
  const origFetch = globalThis.fetch;
  globalThis.window = { AudioContext: FakeCtx };
  globalThis.fetch = async (url) => {
    fetched.push(url);
    if (url.includes('music')) {
      if (musicFails) return { ok: false, status: 404 };
      return { ok: true, arrayBuffer: async () => ({ url }) };
    }
    await effectsDone;
    return { ok: true, arrayBuffer: async () => ({ url }) };
  };
  const tick = () => new Promise((r) => setTimeout(r, 10));
  try {
    const mod = await import(`../src/audio.js?b116=${Math.random()}`);
    await fn({ mod, log, fetched, release, tick, getCtx: () => ctx });
  } finally {
    globalThis.fetch = origFetch;
    if (hadWindow) globalThis.window = undefined; else delete globalThis.window;
  }
}

test('B-116: Musik lädt erst nach Nutzeraktion und nach den Effekten, Schleife ohne Stille, eigener Gain', async () => {
  await withFakeMusic({}, async ({ mod, log, fetched, release, tick, getCtx }) => {
    const M = SOUND.music;
    const play = { status: 'playing', paused: false };
    mod.setSoundOn(true);
    mod.updateMusic(play); // vor der Nutzeraktion: nichts
    await tick();
    assert.equal(fetched.length, 0);
    mod.unlockAudio();
    mod.updateMusic(play);
    await tick();
    assert.ok(fetched.length > 0 && !fetched.some((u) => u.includes('music')), 'Effekte zuerst, Musik wartet');
    release();
    await tick();
    mod.updateMusic(play);
    await tick();
    assert.equal(fetched.filter((u) => u === musicUrl()).length, 1);
    mod.updateMusic(play);
    const start = log.find((l) => l[0] === 'start' && l[1] === 'source');
    assert.ok(start, 'Musik gestartet');
    const src = start[2];
    assert.equal(src.loop, true);
    assert.ok(Math.abs(src.loopStart - 0.5) < 1e-9 && Math.abs(src.loopEnd - 9) < 1e-9, 'Stille weggeschnitten');
    assert.ok(Math.abs(start[3][1] - 0.5) < 1e-9, 'startet bei loopStart');
    const g = src.outs[0];
    assert.equal(g.kind, 'gain');
    assert.deepEqual(g.outs, [getCtx().destination], 'direkt zum Ausgang, nicht über den Effekt-Tiefpass');
    const ramps = () => log.filter((l) => l[0] === 'gain' && l[1] === 'ramp');
    assert.deepEqual(ramps().at(-1), ['gain', 'ramp', M.gain, 10 + M.fadeIn], 'sanft einblenden');
    // gleicher Zustand: keine neue Rampe
    const n = ramps().length;
    mod.updateMusic(play);
    assert.equal(ramps().length, n);
    // Pause leiser, Sieg aus, neues Spiel wieder einblenden
    mod.updateMusic({ status: 'playing', paused: true });
    assert.ok(Math.abs(ramps().at(-1)[2] - M.gain * M.pausedFactor) < 1e-12);
    mod.updateMusic({ status: 'won', paused: false });
    assert.deepEqual(ramps().at(-1), ['gain', 'ramp', 0, 10 + M.fadeOut]);
    mod.updateMusic(play);
    assert.deepEqual(ramps().at(-1), ['gain', 'ramp', M.gain, 10 + M.fadeIn]);
    // Ton aus: sofort stumm; wieder an: neu einblenden, dieselbe Schleife läuft weiter
    mod.setSoundOn(false);
    assert.deepEqual(log.filter((l) => l[0] === 'gain' && l[1] === 'set').at(-1), ['gain', 'set', 0, 10]);
    mod.updateMusic(play);
    mod.setSoundOn(true);
    mod.unlockAudio();
    await tick();
    mod.updateMusic(play);
    assert.deepEqual(ramps().at(-1), ['gain', 'ramp', M.gain, 10 + M.fadeIn]);
    assert.equal(log.filter((l) => l[0] === 'start' && l[1] === 'source' && l[2].loop).length, 1, 'nur eine Schleife');
  });
});

test('B-116: Fehler beim Laden der Musik bleibt still, Effekte spielen weiter', async () => {
  await withFakeMusic({ musicFails: true }, async ({ mod, log, fetched, release, tick }) => {
    mod.setSoundOn(true);
    mod.unlockAudio();
    release();
    await tick();
    for (let i = 0; i < 3; i++) { assert.doesNotThrow(() => mod.updateMusic({ status: 'playing', paused: false })); await tick(); }
    assert.equal(fetched.filter((u) => u.includes('music')).length, 1, 'kein erneuter Versuch');
    assert.ok(!log.some((l) => l[0] === 'start' && l[1] === 'source' && l[2].loop), 'keine Musik');
    assert.ok(!log.some((l) => l[0] === 'start' && l[1] === 'osc'), 'keine Synthese-Musik');
    log.length = 0;
    mod.playSound({ kind: 'won' });
    assert.ok(log.some((l) => l[0] === 'start' && l[1] === 'source'), 'Effekt spielt');
  });
});

test('Kanone: Abschussknall lauter als andere Schüsse, aber leiser als Boss und Meteor', () => {
  const s = SOUND.samples.sounds;
  const cannon = s['shot:cannon'].gain;
  for (const t of Object.keys(TOWER_TYPES)) if (t !== 'cannon') assert.ok(cannon >= 1.5 * s[`shot:${t}`].gain, t);
  for (const k of ['boss', 'meteorImpact', 'meteorFlight']) assert.ok(cannon < s[k].gain, k);
  // Synthese-Ersatz: tiefer, kräftiger Bumm (Grundton unter 150 Hz, lauteste Lage der Kanone über allen anderen Schüssen)
  const peak = (layers) => Math.max(...layers.map((l) => l.gain));
  const osc = SOUND.shots.cannon.find((l) => l.type === 'osc');
  assert.ok(osc.freq < 150 && osc.endFreq < osc.freq);
  for (const t of Object.keys(SOUND.shots)) if (t !== 'cannon') assert.ok(peak(SOUND.shots.cannon) > peak(SOUND.shots[t]), t);
});

test('Kanone: gemeinsame Schuss-Grenze verschluckt Kanonenschüsse nicht, eigene Grenze gilt weiter', () => {
  const L = SOUND.limit;
  assert.deepEqual(SOUND.totalExemptShots, ['cannon']);
  const lim = createLimiter();
  // gemeinsame Grenze mit anderen Schüssen füllen
  const others = ['arrow', 'frost', 'sniper', 'lightning'];
  let n = 0;
  for (const tower of others) if (allowEvent(lim, { kind: 'shot', tower }, 0)) n++;
  assert.equal(n, L.total);
  assert.equal(allowEvent(lim, { kind: 'shot', tower: 'arrow' }, 0.01), false);
  // Kanone trotzdem erlaubt, aber nur einmal pro eigenem Fenster
  assert.equal(allowEvent(lim, { kind: 'shot', tower: 'cannon' }, 0.01), true);
  assert.equal(allowEvent(lim, { kind: 'shot', tower: 'cannon' }, 0.02), false);
  assert.equal(allowEvent(lim, { kind: 'shot', tower: 'cannon' }, 0.01 + L.window + 0.001), true);
  // collectSounds: viele Pfeile zuerst im Frame, Kanone trotzdem zu hören
  const state = createGame();
  const tr = createSoundTracker();
  collectSounds(tr, state, 0);
  for (const tower of others) for (let i = 0; i < 10; i++) state.projectiles.push({ towerType: tower });
  state.projectiles.push({ towerType: 'cannon' });
  state.time += 0.05;
  const shots = collectSounds(tr, state, 5).filter((e) => e.kind === 'shot');
  assert.ok(shots.some((e) => e.tower === 'cannon'));
  assert.equal(shots.filter((e) => e.tower !== 'cannon').length, L.total);
});

test('Kanone: Ton beim Abschuss (neues Geschoss), kein Ton beim Aufschlag', () => {
  const state = createGame();
  const tr = createSoundTracker();
  detectSoundEvents(tr, state);
  const ball = { towerType: 'cannon' };
  state.projectiles.push(ball);
  state.time += 0.02;
  assert.deepEqual(detectSoundEvents(tr, state), [{ kind: 'shot', tower: 'cannon' }]);
  // Aufschlag: Geschoss verschwindet, Explosions-Effekt ohne Meteor erscheint -> still
  state.projectiles.length = 0;
  state.effects.push({ kind: 'explosion', x: 0, y: 0, t: 0 });
  state.time += 0.02;
  assert.deepEqual(detectSoundEvents(tr, state), []);
});

test('Gegner-Tod: Monster-Schreie für death und boss, Lizenz je Datei, Tonhöhe je Gegnertyp', () => {
  const s = SOUND.samples.sounds;
  assert.deepEqual(s.death.files, ['death-1', 'death-2', 'death-3', 'death-4']);
  assert.deepEqual(s.boss.files, ['boss-1', 'boss-2']);
  const lic = fs.readFileSync(`${ROOT}assets/sounds/LIZENZ.md`, 'utf8');
  assert.ok(!lic.includes('impactSoft'), 'alte Aufprall-Töne entfernt');
  for (const f of [...s.death.files, ...s.boss.files]) {
    const row = lic.split('\n').find((l) => l.startsWith(`| ${f}.m4a |`));
    assert.ok(row, `${f} fehlt in LIZENZ.md`);
    assert.match(row, /Monster sound effects pack/);
    assert.match(row, /https:\/\/opengameart\.org\/content\/monster-sound-effects-pack/);
    assert.match(row, /monster-\d+\.wav/);
    assert.match(row, /CC0/);
  }
  // Boss lauter und tiefer als normale Tode; Begrenzung Tod bleibt 2 pro 0,1 s
  assert.ok(s.boss.gain > s.death.gain);
  assert.ok(s.boss.rate < 1);
  assert.deepEqual(SOUND.limitOverrides.death, { window: 0.1, perWindow: 2 });
  // kleine/schnelle Gegner höher, schwere tiefer
  const r = s.death.enemyRate;
  assert.ok(r.runner > r.grunt && r.grunt > 1 && r.tank < 1);
  const bufs = new Map([['death', ['a']], ['boss', ['b']]]);
  const mid = () => 0.5; // keine Zufalls-Variation
  assert.ok(Math.abs(planSound({ kind: 'death', enemy: 'runner' }, bufs, mid).rate - r.runner) < 1e-9);
  assert.ok(Math.abs(planSound({ kind: 'death', enemy: 'tank' }, bufs, mid).rate - r.tank) < 1e-9);
  assert.equal(planSound({ kind: 'death' }, bufs, mid).rate, 1);
  assert.equal(planSound({ kind: 'death', enemy: 'unbekannt' }, bufs, mid).rate, 1);
  assert.ok(Math.abs(planSound({ kind: 'boss' }, bufs, mid).rate - s.boss.rate) < 1e-9);
});

test('Gegner-Tod: Ereignis nennt den Gegnertyp (Boss weiter eigenes Ereignis)', () => {
  const state = createGame();
  const tr = createSoundTracker();
  const g = spawnEnemy(state, 'runner') ?? state.enemies.at(-1);
  const b = spawnEnemy(state, 'boss') ?? state.enemies.at(-1);
  detectSoundEvents(tr, state);
  g.hp = 0;
  b.hp = 0;
  update(state, 1 / 60);
  const evs = detectSoundEvents(tr, state);
  assert.ok(evs.some((e) => e.kind === 'death' && e.enemy === 'runner'));
  assert.ok(evs.some((e) => e.kind === 'boss'));
});
