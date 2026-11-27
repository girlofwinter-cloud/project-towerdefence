// Unit-Tests für Gegner-Animation und Effekte (enemy-fx.js, fx-system.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, buildTower, startWave } from '../src/game.js';

import { buildPath } from '../src/path.js';
import { WAYPOINTS, TILE, ENEMY_TYPES, TOWER_TYPES } from '../src/config.js';
import { walkPhase, animSpeedFactor, facingFor, facingFlip, facingTilt, WALK_RATE, TILT_MAX } from '../src/enemy-fx.js';
import { createFx, syncTime, spawnParticle, updateParticles, liveParticles, syncFx, shakeAmplitude, shakeOffset, triggerShake, bossEntryShake, bossEntryProgress, MAX_PARTICLES, MAX_STEP, SHAKE_COOLDOWN, SHAKE_MAX, SHAKE_DURATION, K_SPARK, K_SMOKE, K_COIN } from '../src/fx-system.js';
import { freeTileNearPath, recordEnemy, withoutRandom, enemyExtent, mockCtx } from './helpers.js';

// ---------- Gegner: Zeichnung und Animation (B-011) ----------

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
  // Boss (B-067, Flat-Pop) hat die laengste Zeichenspur (Krone, Keule, Aura)
  for (const type of keys) if (type !== 'boss') assert.ok(prints.boss.length > prints[type].length, `Boss-Spur nicht laenger als ${type}`);
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

// ---- Tester-Ergaenzungen B-011 (unabhaengig geprueft) ----
function plainCtx() {
  const props = {};
  const st = { depth: 0, minDepth: 0, fills: [], draws: 0 };
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
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

// ---------- Stil 1 (G7): Gegner nach dem Entwurf ----------
const ALL_ENEMIES = ['grunt', 'runner', 'tank', 'boss', 'healer', 'shielded', 'mage', 'skeleton', 'necro'];

// Sichtbare Größe einer Figur in Kacheln: umrandete Formen (Kontur #2b1a10) mal Maßstab, ohne Schatten
async function figureSize(type, frozen = false) {
  const { enemyFigure } = await import('../src/figures.js');
  const { boxOf } = await import('../src/svg-figure.js');
  const { FIGURE_STYLE: S } = await import('../src/config.js');
  const f = enemyFigure(type, frozen);
  const b = boxOf(f.els.filter((e) => e.stroke === S.outline));
  const k = (f.big ? S[f.big] : 1) / S.unit;
  return { w: (b[2] - b[0]) * k, h: (b[3] - b[1]) * k };
}

test('Stil 1 Gegner: Größe wie im Plan, Boss = Troll x 1,3, Nekromantin größer als der Goblin, Fußpunkt unter der Wegmitte', async () => {
  const { FIGURE_STYLE: S } = await import('../src/config.js');
  const { enemyFootY } = await import('../src/render-enemies.js');
  // Plan: Goblin 0,7 x 0,9; Flitzer 0,9 x 0,75; Troll 1,45 x 1,9 (Höhe dort samt Lebensbalken Z.113, Breite ohne Fäuste)
  const bar = (S.hp.h + S.hp.gap) / S.unit;
  const plan = { grunt: [0.7, 0.9, 0], runner: [0.9, 0.75, 0], tank: [1.45, 1.9, bar] };
  for (const [type, [pw, ph, extra]] of Object.entries(plan)) {
    const { w, h } = await figureSize(type);
    assert.ok(Math.abs(w - pw) <= 0.25, `${type}: Breite ${w.toFixed(2)} statt ${pw}`);
    assert.ok(Math.abs(h + extra - ph) <= 0.15, `${type}: Höhe ${(h + extra).toFixed(2)} statt ${ph}`);
  }
  const tank = await figureSize('tank'), boss = await figureSize('boss'), grunt = await figureSize('grunt');
  assert.ok(Math.abs(boss.w / tank.w - S.bossScale) < 0.05, 'Boss 1,3 x so breit wie der Troll');
  assert.ok(boss.h > tank.h * S.bossScale, 'Krone ragt über den Troll hinaus');
  assert.ok((await figureSize('necro')).h > grunt.h * 1.4, 'Nekromantin deutlich größer als der Goblin');
  for (const type of ['healer', 'shielded', 'mage', 'skeleton']) {
    const z = await figureSize(type);
    assert.ok(z.w <= 0.85 && z.h <= 1, `${type}: Goblin-Größe (${z.w.toFixed(2)} x ${z.h.toFixed(2)})`);
  }
  // Fußpunkt 14 Entwurfs-px unter der Wegmitte; Linienpunkte der Figur liegen nie tiefer (Schatten ausgenommen)
  const e = { x: 200, y: 150 };
  assert.ok(Math.abs(enemyFootY(e) - 150 - (S.enemyFoot / S.unit) * TILE) < 1e-9);
  for (const type of ALL_ENEMIES) {
    const r = await recordEnemy({ type }, 0.4, buildPath([[0, 0], [5, 0]], TILE));
    const lines = r.figure.filter((p) => p.depth > 0 && p.ext === 0);
    assert.ok(lines.length > 0 && Math.max(...lines.map((p) => p.y)) <= enemyFootY(r.e) + 0.05 * TILE, `${type}: Figur steht auf dem Fußpunkt`);
  }
});

test('Stil 1 Gegner: alle Typen zeichnen ausgewogen in alle Richtungen und gefroren, Laufen wippt und schwankt', async () => {
  const paths = [buildPath([[0, 0], [5, 0]], TILE), buildPath([[5, 0], [0, 0]], TILE), buildPath([[0, 0], [0, 5]], TILE), buildPath([[0, 5], [0, 0]], TILE)];
  for (const type of ALL_ENEMIES) {
    for (const slow of [false, true]) for (const time of [0, 0.45, 1.1]) for (const path of paths) {
      const r = await recordEnemy({ type, slowUntil: slow ? 99 : 0, hp: 4 }, time, path);
      assert.equal(r.depth, 0, `${type}: save/restore`);
      assert.equal(r.props.globalAlpha, undefined, `${type}: globalAlpha`);
      const x = enemyExtent(r);
      assert.ok(x.w < 3.5 && x.h < 3.5 && Number.isFinite(x.w), `${type}: Ausdehnung ${x.w.toFixed(2)} x ${x.h.toFixed(2)}`);
    }
    const seen = new Set();
    for (const time of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]) seen.add((await recordEnemy({ type }, time)).print);
    assert.ok(seen.size >= 4, `${type}: Phasen unterscheiden sich`);
    // gefroren steht die Figur still
    const still = new Set();
    for (const time of [0, 0.2, 0.4]) still.add((await recordEnemy({ type, slowUntil: 99 }, time)).print);
    assert.equal(still.size, 1, `${type}: eingefroren ohne Wippen`);
  }
  // Heil-Aura bleibt dem Schamanen vorbehalten
  const { drawHealAura } = await import('../src/render-enemies.js');
  const count = (type) => { let n = 0; drawHealAura(new Proxy({}, { get: () => () => { n++; }, set: () => true }), { type, x: 1, y: 1 }, 0); return n; };
  for (const type of ALL_ENEMIES) assert.equal(count(type) > 0, type === 'healer', `${type}: Aura`);
});

test('Stil 1 Gegner: dunkle Kontur hebt sich >= 0,25 von jeder Wegfarbe ab, Hauptfarben je Typ werden gezeichnet', async () => {
  const { MAPS, PATH_STYLE, FIGURE_STYLE: S } = await import('../src/config.js');
  const { brightness } = await import('../src/draw-utils.js');
  for (const id of Object.keys(MAPS)) {
    const road = { ...PATH_STYLE.colors, ...(MAPS[id].theme?.path || {}) }.mid;
    assert.ok(Math.abs(brightness(S.outline) - brightness(road)) >= 0.25, `${id}: Kontur gegen Weg ${road}`);
  }
  const main = { grunt: '#6cc03a', runner: '#f4cf3a', tank: '#b5663e', boss: '#f2c14e', healer: '#f4f1e6', shielded: '#8a5326', mage: '#7a4bb0', skeleton: '#f2e9d8', necro: '#5b3d8a' };
  for (const type of ALL_ENEMIES) {
    const r = await recordEnemy({ type });
    assert.ok(r.print.includes('fill:|' + main[type]), `${type}: Hauptfarbe ${main[type]}`);
    const strokes = r.calls.filter((c) => c.startsWith('stroke:'));
    assert.ok(strokes.filter((c) => c.endsWith('|' + S.outline)).length >= strokes.length / 2, `${type}: überwiegend dunkel umrandet`);
  }
  const necro = await recordEnemy({ type: 'necro' });
  assert.ok(necro.print.includes('|#f2e9d8'), 'Nekromantin: Totenkopf am Stab');
});

test('Stil 1 Gegner: eingefroren mit Eis-Kristall (Z.111), Goblin als eigener Entwurf; unbekannte Typen als Goblin', async () => {
  for (const type of ALL_ENEMIES) {
    const n = await recordEnemy({ type });
    const f = await recordEnemy({ type, slowUntil: 99 });
    assert.ok(f.print.includes('rgba(223,247,255,'), `${type}: Eis-Kristall`);
    assert.ok(!n.print.includes('rgba(223,247,255,'), `${type}: ohne Frost kein Eis`);
  }
  const iced = await recordEnemy({ type: 'grunt', slowUntil: 99 });
  assert.ok(iced.print.includes('|#a8e2f5') && !iced.print.includes('|#7fd048'), 'gefrorener Goblin: blauer Kopf statt grünem');
  for (const type of ['zzz', '__proto__', 'constructor']) {
    const r = await recordEnemy({ type });
    assert.equal(r.depth, 0);
    assert.ok(r.print.includes('|#7fd048'), `${type}: Goblin-Rückfall`);
  }
});

test('Stil 1 Lebensbalken: nur bei Schaden, über der Figur (auch über der Krone), Füllung wächst mit den HP, Randfälle', async () => {
  const { FIGURE_STYLE: S } = await import('../src/config.js');
  const bars = (r) => r.world.filter((p) => p.hp);
  for (const type of ALL_ENEMIES) {
    assert.equal(bars(await recordEnemy({ type, hp: 10, maxHp: 10 })).length, 0, `${type}: voll ohne Balken`);
    const r = await recordEnemy({ type, hp: 4, maxHp: 10 });
    assert.ok(bars(r).length > 0, `${type}: Balken bei Schaden`);
    const top = Math.min(...r.figure.filter((p) => p.depth > 0).map((p) => p.y - (p.box ? p.box[1] : p.ext)));
    const bottom = Math.max(...bars(r).map((p) => p.y + p.ext));
    assert.ok(bottom < top, `${type}: Balken ${bottom.toFixed(1)} über der Figur ${top.toFixed(1)}`);
  }
  // Füllung: Abstand der Kappen-Mittelpunkte der farbigen Kapsel ~ HP-Anteil
  const inner = async (hp) => {
    const r = await recordEnemy({ type: 'tank', hp, maxHp: 100 });
    const xs = r.calls.filter((c) => c.startsWith('arc:') && [S.hp.good, S.hp.mid, S.hp.low].some((col) => c.includes('|' + col + '|'))).map((c) => parseFloat(c.slice(4)));
    return xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
  };
  const w90 = await inner(90), w45 = await inner(45);
  assert.ok(w90 > w45 * 1.7 && w45 > 0, `Füllung ${w90} / ${w45}`);
  assert.ok((await recordEnemy({ type: 'grunt', hp: 2, maxHp: 10 })).print.includes('|' + S.hp.low), 'wenig HP: rot');
  for (const [hp, maxHp] of [[0, 10], [-5, 10], [15, 10], [5, 0], [NaN, 10], [5, NaN]]) {
    const r = await recordEnemy({ type: 'grunt', hp, maxHp });
    assert.equal(r.depth, 0, `hp ${hp}/${maxHp}`);
  }
});

test('Stil 1 Sprites: je Typ x Stufe x Pixeldichte genau einmal gebaut, danach nur drawImage', async () => {
  const { setSpriteFactory, spriteStats } = await import('../src/sprites.js');
  const { drawTower } = await import('../src/render.js');
  const { drawEnemy } = await import('../src/render-enemies.js');
  const made = [];
  setSpriteFactory((w, h) => { const m = mockCtx(); const c = { width: w, height: h, getContext: () => m.ctx }; made.push(c); return c; });
  try {
    const frame = (scale) => {
      const counts = {};
      const m = mockCtx(counts);
      const ctx = new Proxy(m.ctx, { get: (t, k) => (k === 'getTransform' ? () => ({ a: scale, b: 0 }) : t[k]), set: (t, k, v) => { t[k] = v; return true; } });
      for (const type of Object.keys(TOWER_TYPES)) for (let level = 1; level <= 3; level++) drawTower(ctx, { type, level, x: 100, y: 100, cooldown: 0, angle: 0.5 }, false);
      for (const type of ALL_ENEMIES) for (const slowUntil of [0, 99]) drawEnemy(ctx, { id: 1, type, x: 50, y: 50, dist: 0, hp: 5, maxHp: 10, slowUntil, speed: 1, radius: 10 }, 1, null);
      assert.equal(m.depth, 0);
      return counts;
    };
    const before = spriteStats.builds;
    const first = frame(1);
    const built = spriteStats.builds - before;
    // Türme: 5 Typen x 3 Stufen, Kanone und Scharfschütze mit Teil vor dem drehenden Rohr (+2 x 3); Gegner: 9 Typen x 2
    assert.equal(built, 15 + 6 + 18, 'jede Figur genau ein Sprite');
    assert.ok(first.drawImage >= 15 + 6 + 18);
    frame(1);
    frame(1);
    assert.equal(spriteStats.builds - before, built, 'zweiter Frame baut nichts neu');
    frame(2);
    assert.equal(spriteStats.builds - before, 2 * built, 'neue Pixeldichte: eigener Satz');
    assert.ok(made.every((c) => c.width >= 1 && c.height >= 1));
    // Sprite doppelter Dichte ist doppelt so groß
    const w1 = made[0].width, w2 = made[built].width;
    assert.ok(Math.abs(w2 / w1 - 2) < 0.1, `Pixeldichte ${w1} -> ${w2}`);
  } finally { setSpriteFactory(); }
});

// ---------- Projektile und Effekte (B-012) ----------

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
    get(_, k) { if (k in props) return props[k]; if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} }); return (...a) => { if (k === 'translate') calls.push(a); }; },
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




// ---------- Magier (B-126): Figur und Schild-Blase ----------

test('Magier B-126: Hut und Kugel gezeichnet, Schild-Blase nur bei ward > 0, Deckkraft wächst mit dem Schild', async () => {
  const { ENEMY_STYLE } = await import('../src/config.js');
  const c = ENEMY_STYLE.mage;
  const r = await recordEnemy({ type: 'mage' });
  for (const col of ['#7a4bb0', '#6b3fa0', '#9fe8ff', '#8a5326']) assert.ok(r.print.includes('|' + col), `Farbe ${col} fehlt`); // Stil 1: Kapuze, Robe, Kugel, Stab
  assert.ok(!r.print.includes(c.wardFill), 'ohne Schild keine Blase');
  const max = ENEMY_TYPES.mage.wardShare * 100;
  const alphaOf = async (ward) => {
    const rec = await recordEnemy({ type: 'grunt', hp: 100, maxHp: 100, ward });
    const fill = rec.calls.find((k) => k.startsWith('fill:') && k.includes('|' + c.wardFill + '|'));
    assert.ok(fill, `Blase bei ward ${ward}`);
    assert.ok(rec.calls.some((k) => k.startsWith('stroke:') && k.endsWith('|' + c.wardRing)), 'Ring der Blase');
    assert.equal(rec.depth, 0, 'save/restore ausgeglichen');
    return rec;
  };
  await alphaOf(max);
  await alphaOf(max / 4);
  const { drawWardBubble } = await import('../src/render-enemies.js');
  const alphas = (ward) => {
    const seen = [];
    const ctx = new Proxy({}, { get: () => () => {}, set: (_, k, v) => { if (k === 'globalAlpha') seen.push(v); return true; } });
    drawWardBubble(ctx, { id: 1, x: 0, y: 0, radius: 10, maxHp: 100, ward }, 0);
    return seen;
  };
  assert.deepEqual(alphas(0), [], 'ward 0: nichts');
  assert.ok(alphas(max)[0] > alphas(max / 4)[0], 'voller Schild deckender');
  assert.ok(alphas(max)[0] <= 1 && alphas(max / 4)[0] > 0);
});


test('Boss-Auftritt B-067: Wackeln unter 3 px, reduced motion schaltet es aus, Ring-Fortschritt', async () => {
  const { BOSS_ENTRY } = await import('../src/config.js');
  assert.ok(bossEntryShake(false) > 0 && bossEntryShake(false) < 3);
  assert.equal(bossEntryShake(true), 0);
  assert.equal(bossEntryProgress(5, 5), 0);
  assert.ok(Math.abs(bossEntryProgress(5 + BOSS_ENTRY.ringDuration / 2, 5) - 0.5) < 1e-9);
  assert.equal(bossEntryProgress(5 + BOSS_ENTRY.ringDuration + 1e-6, 5), -1);
  assert.equal(bossEntryProgress(BOSS_ENTRY.ringDuration, 0), -1);
  assert.equal(bossEntryProgress(4.9, 5), -1);
  assert.equal(bossEntryProgress(5, -Infinity), -1);
  const path = { points: [] };
  const boss = { type: 'boss', x: 100, y: 80, radius: 18 };
  const run = (reduced) => {
    const fx = createFx();
    const s = { time: 1, path, projectiles: [], effects: [], enemies: [] };
    syncFx(fx, s, reduced);
    s.time = 1.02;
    s.enemies.push(boss);
    syncFx(fx, s, reduced);
    const dust = liveParticles(fx);
    let maxOff = 0;
    for (let t = 1.02; t < 1.5; t += 0.005) maxOff = Math.max(maxOff, Math.abs(shakeOffset(t, fx.shakeStart, fx.shakeStrength, 0)), Math.abs(shakeOffset(t, fx.shakeStart, fx.shakeStrength, 1)));
    // gleicher Boss im naechsten Frame: kein zweiter Auftritt
    const start = fx.entryStart;
    s.time = 1.2;
    syncFx(fx, s, reduced);
    assert.equal(fx.entryStart, start, 'nur einmal pro Boss');
    return { fx, dust, maxOff };
  };
  const normal = run(false);
  assert.ok(normal.maxOff > 0 && normal.maxOff < 3, `Wackeln ${normal.maxOff}`);
  assert.ok(normal.dust > 0 && normal.dust <= BOSS_ENTRY.dustCount, `Auftritt erzeugt wenige Staubpartikel (${normal.dust})`);
  assert.equal(normal.fx.entryStart, 1.02);
  assert.equal(normal.fx.entryX, 100);
  const calm = run(true);
  assert.equal(calm.maxOff, 0, 'reduced motion: kein Wackeln');
  assert.equal(calm.fx.entryStart, 1.02, 'Ring bleibt als Hinweis');
  // normaler Gegner loest nichts aus
  const fx = createFx();
  syncFx(fx, { time: 1, path, enemies: [] });
  syncFx(fx, { time: 1.1, path, enemies: [{ type: 'grunt', x: 1, y: 1, radius: 12 }] });
  assert.equal(fx.entryStart, -Infinity);
  assert.equal(fx.shakeStrength, 0);
});

test('Boss-Auftritt B-067: render reicht ui.reducedMotion durch, Ring wird gezeichnet', async () => {
  const { render } = await import('../src/render.js');
  const { getFx, drawBossEntry } = await import('../src/render-fx.js');
  const { BOSS_ENTRY } = await import('../src/config.js');
  for (const reducedMotion of [false, true]) {
    const state = createGame();
    const { ctx, st } = plainCtx();
    render(ctx, state, { hover: null, selectedTowerId: null, reducedMotion });
    state.time += 0.05;
    state.enemies.push(testEnemy({ type: 'boss', radius: ENEMY_TYPES.boss.radius }));
    const before = st.fills.length;
    render(ctx, state, { hover: null, selectedTowerId: null, reducedMotion });
    assert.ok(st.fills.length > before);
    const fx = getFx();
    assert.equal(fx.entryStart, state.time);
    assert.equal(fx.shakeStrength > 0, !reducedMotion, `reducedMotion=${reducedMotion}`);
    assert.equal(st.depth, 0);
    // Ring: Ellipse am Boden in Ringfarbe; bei reduced motion ohne Wachsen (Radius = Boss-Radius)
    const rings = [];
    const props = {};
    drawBossEntry(new Proxy({}, { get: (_, k) => (k in props ? props[k] : (...a) => { if (k === 'ellipse') rings.push([a[2], props.strokeStyle]); }), set: (_, k, v) => { props[k] = v; return true; } }));
    assert.equal(rings.length, 1);
    assert.equal(rings[0][1], BOSS_ENTRY.ringColor);
    if (reducedMotion) assert.equal(rings[0][0], ENEMY_TYPES.boss.radius);
    else assert.ok(rings[0][0] < ENEMY_TYPES.boss.radius, 'Ring startet klein und waechst');
  }
});

// ---------- B-068: Projektile und Effekte im Flat-Pop-Stil ----------
test('B-068: Partikel-Obergrenze unveraendert, Treffer hoechstens 6 Funken, Muenze genau ein Partikel', async () => {
  const { spawnHit, observeEffect, T_ARROW, T_FROST, T_SNIPER } = await import('../src/fx-system.js');
  assert.equal(MAX_PARTICLES, 256);
  for (const type of [T_ARROW, T_FROST, T_SNIPER, 0]) {
    const fx = createFx();
    spawnHit(fx, type, 10, 10);
    assert.ok(liveParticles(fx) - 1 <= 6, `Typ ${type}: Funken`); // minus Treffer-Blitz
  }
  const fx = createFx();
  observeEffect(fx, { kind: 'coin', x: 5, y: 5 }, 1);
  assert.equal(liveParticles(fx), 1);
});

test('B-068: coinHop springt hoch, hopst nach und liegt dann; reduzierte Bewegung = kein Hopser', async () => {
  const { coinHop, coinSpin } = await import('../src/fx-system.js');
  const { FX_STYLE } = await import('../src/config.js');
  const c = FX_STYLE.coin;
  assert.equal(coinHop(0), 0);
  assert.equal(coinHop(c.split), 0);
  assert.equal(coinHop(c.end), 0);
  assert.equal(coinHop(1), 0);
  assert.ok(Math.abs(coinHop(c.split / 2) + c.hop) < 1e-9, 'Scheitel = volle Hoehe');
  assert.ok(Math.abs(coinHop((c.split + c.end) / 2) + c.hop * c.bounce) < 1e-9, 'Nachhopser kleiner');
  for (let u = -0.5; u <= 1.5; u += 0.01) {
    const h = coinHop(u);
    assert.ok(h <= 0 && h >= -c.hop, `u=${u}`);
    assert.equal(coinHop(u, true), 0);
    const w = coinSpin(u);
    assert.ok(w >= c.minWidth && w <= 1);
    assert.equal(coinSpin(u, true), 1);
  }
  for (const bad of [NaN, undefined, Infinity]) {
    assert.equal(coinHop(bad), 0);
    assert.equal(coinSpin(bad), 1);
  }
});

test('B-068: reduzierte Bewegung - Explosion ohne Wackeln, Muenze ohne Seitendrift, Partikel bleiben', () => {
  const run = (reduced) => {
    const fx = createFx();
    const s = fxState(2);
    s.effects.push({ kind: 'explosion', x: 50, y: 50, r: 44, ttl: 0.3, max: 0.3 }, { kind: 'coin', x: 9, y: 9, ttl: 1, max: 1, text: '+1' });
    syncFx(fx, s, reduced);
    let coin = -1;
    for (let i = 0; i < MAX_PARTICLES; i++) if (fx.pkind[i] === K_COIN) coin = i;
    return { fx, coin };
  };
  const calm = run(true);
  assert.equal(calm.fx.shakeStrength, 0);
  assert.equal(calm.fx.reduced, true);
  assert.equal(calm.fx.pvx[calm.coin], 0);
  assert.equal(calm.fx.pvy[calm.coin], 0);
  assert.ok(liveParticles(calm.fx) > 5, 'Funken und Rauch bleiben');
  const normal = run(false);
  assert.ok(normal.fx.shakeStrength > 0);
  assert.equal(normal.fx.reduced, false);
});

// Zeichen-Protokoll: jede Fuell-/Strichoperation mit aktueller Farbe; prueft save/restore und globalAlpha.
function logCtx() {
  const props = { globalAlpha: 1 };
  const st = { depth: 0, minDepth: 0, ops: [] };
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (k === 'measureText') return () => ({ width: 10 });
      return (...a) => {
        if (k === 'save') st.depth++;
        if (k === 'restore') { st.depth--; st.minDepth = Math.min(st.minDepth, st.depth); }
        if (k === 'fill' || k === 'fillRect' || k === 'fillText') st.ops.push(['fill', props.fillStyle]);
        if (k === 'stroke' || k === 'strokeText') st.ops.push(['stroke', props.strokeStyle]);
        if (k === 'ellipse') st.ops.push(['ellipse', a[1]]);
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  return { ctx, st, props };
}

test('B-068: Projektile je Typ im eigenen Stil, unbekannte als Rueckfall; save/restore und globalAlpha bleiben', async () => {
  const { getFx, drawProjectileFx } = await import('../src/render-fx.js');
  const { FX_STYLE } = await import('../src/config.js');
  const fx = getFx();
  const path = { points: [] };
  const ps = ['arrow', 'cannon', 'frost', 'sniper', 'lightning', 'zzz', undefined].map((t) => ({ x: 100, y: 100, tx: 200, ty: 100, towerType: t }));
  syncFx(fx, { time: 1, path, projectiles: ps });
  const expect = { arrow: FX_STYLE.arrow.head, cannon: FX_STYLE.cannon.color, frost: FX_STYLE.frost.color, sniper: FX_STYLE.sniper.bullet };
  for (const p of ps) {
    const { ctx, st, props } = logCtx();
    const drawn = drawProjectileFx(ctx, p);
    assert.equal(drawn, Object.hasOwn(expect, p.towerType), `${p.towerType}`);
    if (drawn) assert.ok(st.ops.some(([, c]) => c === expect[p.towerType]), `${p.towerType}: Stilfarbe`);
    assert.equal(st.depth, 0);
    assert.equal(st.minDepth, 0);
    assert.equal(props.globalAlpha, 1);
  }
  // nicht verfolgtes Projektil -> Rueckfall
  assert.equal(drawProjectileFx(logCtx().ctx, { x: 1, y: 1, towerType: 'arrow' }), false);
});

test('B-068: Explosion und Rauch unter den Gegnern, Funken/Muenzen darueber; Muenze hopst nur ohne reduzierte Bewegung', async () => {
  const { render } = await import('../src/render.js');
  const { getFx, drawParticles } = await import('../src/render-fx.js');
  const { FX_STYLE } = await import('../src/config.js');
  const s = createGame();
  s.time = 2;
  const { ctx, st, props } = logCtx();
  render(ctx, s, {});
  s.time = 2.05;
  s.enemies.push(testEnemy({ x: 200, y: 200 }));
  s.effects.push({ kind: 'explosion', x: 200, y: 200, r: 44, ttl: 0.25, max: 0.3 }, { kind: 'coin', x: 300, y: 200, ttl: 0.8, max: 0.8, text: '+5' });
  const baseColors = new Set(st.ops.map(([, c]) => c)); // Farben ohne Gegner (Boden, Deko)
  st.ops.length = 0;
  render(ctx, s, {});
  const first = (c) => st.ops.findIndex(([, x]) => x === c);
  const last = (c) => st.ops.map(([, x]) => x).lastIndexOf(c);
  // Gegner erkennen: erste Operation mit einer Farbe, die nur die Gegner-Zeichnung nutzt
  const { drawEnemy } = await import('../src/render-enemies.js');
  const solo = logCtx();
  drawEnemy(solo.ctx, testEnemy({ x: 200, y: 200 }), s.time, buildPath(WAYPOINTS, TILE));
  const fxColors = new Set(Object.values(FX_STYLE).flatMap((v) => Object.values(v)));
  const enemyColors = new Set(solo.st.ops.map(([, c]) => c).filter((c) => typeof c === 'string' && !fxColors.has(c) && !baseColors.has(c)));
  const enemy = st.ops.findIndex(([, c]) => enemyColors.has(c));
  assert.ok(first(FX_STYLE.explosion.fill) >= 0, 'Explosion gezeichnet');
  assert.ok(enemy >= 0, 'Gegner gezeichnet');
  assert.ok(last(FX_STYLE.explosion.fill) < enemy, 'Explosion vor (unter) dem Gegner');
  assert.ok(last(FX_STYLE.smoke.color) < enemy, 'Rauch vor (unter) dem Gegner');
  assert.ok(st.ops.slice(enemy).some(([k, c]) => k === 'stroke' && c === FX_STYLE.hit.spark), 'Funken ueber dem Gegner');
  assert.ok(st.ops.slice(enemy).some(([k, c]) => k === 'fill' && c === FX_STYLE.coin.color), 'Muenze ueber dem Gegner');
  assert.equal(st.depth, 0);
  assert.equal(props.globalAlpha, 1);
  // Schichten getrennt
  const under = logCtx();
  drawParticles(under.ctx, true);
  assert.ok(under.st.ops.every(([, c]) => c === FX_STYLE.smoke.color));
  const over = logCtx();
  drawParticles(over.ctx);
  assert.ok(!over.st.ops.some(([, c]) => c === FX_STYLE.smoke.color));
  // Muenz-Hoehe: mit Bewegung ueber dem Startpunkt, bei reduzierter Bewegung genau dort
  const fx = getFx();
  let coin = -1;
  for (let i = 0; i < MAX_PARTICLES; i++) if (fx.pkind[i] === K_COIN) coin = i;
  assert.ok(coin >= 0);
  for (const reduced of [false, true]) {
    fx.page[coin] = fx.plife[coin] * FX_STYLE.coin.split / 2;
    fx.reduced = reduced;
    const l = logCtx();
    drawParticles(l.ctx);
    const ys = l.st.ops.filter(([k]) => k === 'ellipse').map(([, y]) => y);
    assert.ok(ys.length > 0);
    if (reduced) assert.ok(ys.every((y) => Math.abs(y - fx.py[coin]) < 1e-6));
    else assert.ok(ys.every((y) => y < fx.py[coin] - FX_STYLE.coin.hop * 0.9));
  }
});

// ---------- Block A: Randfaelle vom Tester ----------
test('Boss-Auftritt Tester: zweiter Boss loest erneut aus, neues Spiel (neuer Weg) setzt Merker zurueck', () => {
  const fx = createFx();
  const path = { points: [] };
  const b1 = { type: 'boss', x: 10, y: 10, radius: 18 };
  const b2 = { type: 'boss', x: 40, y: 10, radius: 18 };
  const s = { time: 1, path, enemies: [b1] };
  syncFx(fx, s);
  assert.equal(fx.entryStart, 1);
  s.time = 3; syncFx(fx, s);
  assert.equal(fx.entryStart, 1, 'gleicher Boss: kein zweiter Auftritt');
  s.time = 4; s.enemies = [b1, b2]; syncFx(fx, s);
  assert.equal(fx.entryStart, 4);
  assert.equal(fx.entryX, 40);
  // Neues Spiel: neuer Weg -> Reset, derselbe Boss-Bezug wird wieder als neu erkannt
  syncFx(fx, { time: 0.5, path: { points: [] }, enemies: [b1] });
  assert.equal(fx.entryStart, 0.5);
});

test('Boss-Auftritt Tester: ungueltige Koordinaten und reduced motion ohne Wackeln, kein Absturz', () => {
  const fx = createFx();
  syncFx(fx, { time: 1, path: { points: [] }, enemies: [null, { type: 'boss', x: NaN, y: undefined, radius: Infinity }] }, true);
  assert.equal(fx.entryX, 0);
  assert.equal(fx.entryY, 0);
  assert.equal(fx.entryR, 0);
  assert.equal(fx.entryReduced, true);
  assert.equal(fx.shakeStrength, 0);
});

test('B-068 Tester: Partikel-Obergrenze haelt bei Massen von Explosionen und Muenzen', async () => {
  const { observeEffect } = await import('../src/fx-system.js');
  const fx = createFx();
  for (let i = 0; i < 400; i++) {
    observeEffect(fx, { kind: 'explosion', x: i, y: i, r: 44 }, i * 0.01);
    observeEffect(fx, { kind: 'coin', x: i, y: i }, i * 0.01);
  }
  assert.ok(liveParticles(fx) <= MAX_PARTICLES, `${liveParticles(fx)} > ${MAX_PARTICLES}`);
  assert.ok(fx.shakeStrength <= SHAKE_MAX);
});

test('B-068 Tester: coinHop stetig an split und end, coinSpin an Grenzen', async () => {
  const { coinHop, coinSpin } = await import('../src/fx-system.js');
  const { FX_STYLE } = await import('../src/config.js');
  const c = FX_STYLE.coin;
  for (const k of [c.split, c.end]) {
    assert.ok(Math.abs(coinHop(k - 1e-7)) < 1e-4, `Sprung vor ${k}`);
    assert.ok(Math.abs(coinHop(k + 1e-7)) < 1e-4, `Sprung nach ${k}`);
  }
  assert.ok(!Object.is(coinHop(0), -0) && !Object.is(coinHop(c.split), -0));
  assert.equal(coinSpin(0), 1);
  assert.equal(coinSpin(-Infinity), 1);
  assert.ok(coinSpin(1 / (2 * c.spins)) === c.minWidth, 'Kante: Mindestbreite');
});

// ---------- B-095: Boss und Effekte Feinschliff ----------
test('B-095: Zeitsprung rueckwaerts im selben Spiel loest den Boss-Auftritt nicht erneut aus, neuer Boss schon', () => {
  const fx = createFx();
  const path = { points: [] };
  const boss = { type: 'boss', x: 10, y: 10, radius: 18 };
  const s = { time: 5, path, enemies: [boss] };
  syncFx(fx, s);
  assert.equal(fx.entryStart, 5);
  // Zeitsprung zurueck (Reset), Boss steht noch auf dem Feld: kein Ring, kein Wackeln
  s.time = 2; syncFx(fx, s);
  assert.equal(fx.entryStart, -Infinity, 'kein erneuter Auftritt');
  assert.equal(fx.shakeStrength, 0, 'kein Wackeln');
  s.time = 2.5; syncFx(fx, s);
  assert.equal(fx.entryStart, -Infinity, 'auch im naechsten Frame nicht');
  // ein spaeter erscheinender Boss loest normal aus
  const boss2 = { type: 'boss', x: 40, y: 10, radius: 18 };
  s.time = 3; s.enemies = [boss, boss2, null]; syncFx(fx, s);
  assert.equal(fx.entryStart, 3);
  assert.equal(fx.entryX, 40);
});

test('B-095: Treffer-Blitz dauert laut STIL.md 0,08 s', async () => {
  const { spawnHit, T_ARROW, K_FLASH } = await import('../src/fx-system.js');
  const { FX_STYLE } = await import('../src/config.js');
  assert.equal(FX_STYLE.hit.flashLife, 0.08);
  const fx = createFx();
  spawnHit(fx, T_ARROW, 10, 10);
  const i = fx.pkind.indexOf(K_FLASH);
  assert.ok(i >= 0);
  assert.ok(Math.abs(fx.plife[i] - 0.08) < 1e-6);
  updateParticles(fx, 0.09);
  assert.equal(fx.pkind.indexOf(K_FLASH), -1, 'nach 0,09 s verschwunden');
});

test('Boss-Auftritt B-095: Staub aus BOSS_ENTRY, bei reduzierter Bewegung keiner, Pool-Grenze bleibt', async () => {
  const { BOSS_ENTRY } = await import('../src/config.js');
  const { K_DUST } = await import('../src/fx-system.js');
  const path = { points: [] };
  const run = (reduced, extra = 0) => {
    const fx = createFx();
    const s = { time: 1, path, projectiles: [], effects: [], enemies: [] };
    syncFx(fx, s, reduced);
    for (let i = 0; i < extra; i++) spawnParticle(fx, K_SPARK, 0, 0, 0, 0, 10, 1);
    s.time = 1.02;
    s.enemies.push({ type: 'boss', x: 100, y: 80, radius: 18 });
    syncFx(fx, s, reduced);
    return fx;
  };
  const fx = run(false);
  const dust = [];
  for (let i = 0; i < MAX_PARTICLES; i++) if (fx.pkind[i] === K_DUST) dust.push(i);
  assert.equal(dust.length, BOSS_ENTRY.dustCount);
  for (const i of dust) {
    assert.equal(fx.plife[i], Math.fround(BOSS_ENTRY.dustLife));
    assert.ok(Math.hypot(fx.pvx[i], fx.pvy[i]) <= BOSS_ENTRY.dustSpeed + 1e-3, 'Tempo aus Config');
    assert.ok(Math.hypot(fx.pvx[i], fx.pvy[i]) > 0, 'Staub bewegt sich');
  }
  // Staub verschwindet nach seiner Lebensdauer
  updateParticles(fx, BOSS_ENTRY.dustLife / 2);
  updateParticles(fx, BOSS_ENTRY.dustLife / 2 + 0.01);
  assert.equal(fx.pkind.filter((k) => k === K_DUST).length, 0);
  // reduzierte Bewegung: kein Staub
  assert.equal(liveParticles(run(true)), 0, 'reduced motion: kein Staub');
  // voller Pool: Obergrenze MAX_PARTICLES bleibt
  assert.equal(liveParticles(run(false, MAX_PARTICLES)), MAX_PARTICLES);
});

test('Boss-Auftritt B-095: Staub wird ohne globalAlpha in der Staubfarbe gezeichnet', async () => {
  const { updateFx, drawBossEntry } = await import('../src/render-fx.js');
  const { BOSS_ENTRY } = await import('../src/config.js');
  const state = createGame();
  updateFx(state, false);
  state.time += 0.05;
  state.enemies.push(testEnemy({ type: 'boss', radius: ENEMY_TYPES.boss.radius }));
  updateFx(state, false);
  const fills = [];
  const props = {};
  let depth = 0;
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      return () => {
        if (k === 'save') depth++;
        if (k === 'restore') depth--;
        if (k === 'fill') fills.push(props.fillStyle);
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  drawBossEntry(ctx);
  assert.equal(fills.filter((c) => c === BOSS_ENTRY.dustColor).length, BOSS_ENTRY.dustCount);
  assert.equal(props.globalAlpha, undefined);
  assert.equal(depth, 0);
});

// ---------- Tester Block D: Randfälle B-095 ----------
test('B-095 Randfall: Zeitsprung vorwaerts setzt nicht zurueck, Boss wird nicht erneut ausgeloest, timeJump bleibt aus', () => {
  const fx = createFx();
  const path = { points: [] };
  const boss = { type: 'boss', x: 10, y: 10, radius: 18 };
  const s = { time: 5, path, enemies: [boss] };
  syncFx(fx, s);
  assert.equal(fx.entryStart, 5);
  s.time = 500; syncFx(fx, s);
  assert.equal(fx.timeJump, false);
  assert.equal(fx.entryStart, 5, 'kein neuer Auftritt nach Sprung vorwaerts');
});

test('B-095 Randfall: timeJump gilt nur einen Frame, neues Spiel (neuer Weg) zeigt den Auftritt wieder', () => {
  const fx = createFx();
  const path = { points: [] };
  const boss = { type: 'boss', x: 10, y: 10, radius: 18 };
  const s = { time: 5, path, enemies: [boss] };
  syncFx(fx, s);
  s.time = 1; syncFx(fx, s);
  assert.equal(fx.timeJump, true);
  s.time = 1.05; syncFx(fx, s);
  assert.equal(fx.timeJump, false, 'Merker nur im Sprung-Frame');
  // neuer Weg = neues Spiel: kein Zeitsprung, Boss loest aus
  const s2 = { time: 0.5, path: { points: [] }, enemies: [boss] };
  syncFx(fx, s2);
  assert.equal(fx.timeJump, false);
  assert.equal(fx.entryStart, 0.5);
});

test('B-095 Randfall: Staub bei vollem Partikel-Pool ueberschreibt nur, Pool bleibt begrenzt, kein Absturz', async () => {
  const { BOSS_ENTRY } = await import('../src/config.js');
  const { K_DUST, spawnBossDust } = await import('../src/fx-system.js');
  const fx = createFx();
  for (let i = 0; i < MAX_PARTICLES; i++) spawnParticle(fx, K_SPARK, 0, 0, 0, 0, 10, 1);
  assert.equal(liveParticles(fx), MAX_PARTICLES);
  for (let k = 0; k < 50; k++) spawnBossDust(fx, 100, 80, 18);
  assert.equal(liveParticles(fx), MAX_PARTICLES);
  const dust = Array.from(fx.pkind).filter((k) => k === K_DUST).length;
  assert.equal(dust, Math.min(MAX_PARTICLES, 50 * BOSS_ENTRY.dustCount));
  for (let i = 0; i < MAX_PARTICLES; i++) assert.ok(Number.isFinite(fx.px[i]) && Number.isFinite(fx.py[i]));
});

// ---------- B-112: Meteor-Animation ----------
import { meteorPhase, meteorStep, K_ROCK } from '../src/fx-system.js';
import { FX_STYLE as FXS_B112 } from '../src/config.js';

const meteorFx = (age, over = {}) => {
  const M = FXS_B112.meteor;
  const max = M.flight + M.blast + M.crater;
  return { kind: 'explosion', meteor: true, x: 200, y: 200, r: 100, ttl: max - age, max, ...over };
};

test('B-112 meteorPhase: Anflug -> Einschlag -> Krater -> none, u läuft 0..1', () => {
  const M = FXS_B112.meteor;
  const ph = (age) => ({ ...meteorPhase(meteorFx(age)) });
  assert.deepEqual(ph(0), { phase: 'flight', u: 0 });
  assert.equal(ph(M.flight / 2).phase, 'flight');
  assert.equal(ph(M.flight + 0.01).phase, 'blast');
  assert.ok(Math.abs(ph(M.flight + M.blast / 2).u - 0.5) < 1e-9);
  assert.equal(ph(M.flight + M.blast + 0.01).phase, 'crater');
  assert.equal(ph(M.flight + M.blast + M.crater).phase, 'none', 'ttl 0 = vorbei');
  for (const bad of [null, {}, { ttl: NaN, max: 1 }, { ttl: 2, max: 1 }]) assert.equal(meteorPhase(bad).phase, 'none');
});

test('B-112 meteorStep: Einschlag genau einmal nach dem Anflug, Brocken und Funken begrenzt, Wackeln nur ohne reduced motion', () => {
  const M = FXS_B112.meteor;
  const fx = createFx();
  const e = meteorFx(0.05);
  assert.equal(meteorStep(fx, e, 1), false, 'im Anflug noch nichts');
  assert.equal(liveParticles(fx), 0);
  e.ttl -= M.flight;
  assert.equal(meteorStep(fx, e, 1.3), true);
  const n = liveParticles(fx);
  assert.equal(n, M.sparks + M.rocks + M.smoke);
  assert.ok(fx.pkind.some((k) => k === K_ROCK));
  assert.ok(fx.shakeStrength > 0 && fx.shakeStrength <= SHAKE_MAX);
  assert.equal(meteorStep(fx, e, 1.31), false, 'nur einmal');
  assert.equal(liveParticles(fx), n);

  const calm = createFx();
  assert.equal(meteorStep(calm, meteorFx(M.flight + 0.01), 1, true), true);
  assert.equal(calm.shakeStrength, 0, 'reduced motion: kein Wackeln');
  assert.ok(!calm.pkind.some((k) => k === K_ROCK || k === K_SPARK), 'reduced motion: keine fliegenden Brocken/Funken');
  assert.equal(liveParticles(calm), M.smoke);

  const late = createFx();
  assert.equal(meteorStep(late, meteorFx(M.flight + M.blast + 1), 5), false, 'vergangener Einschlag wird nicht nachgeholt');
  assert.equal(liveParticles(late), 0);
  assert.equal(meteorStep(late, { kind: 'explosion', x: 1, y: 1, r: 40, ttl: 0.3, max: 0.3 }, 5), false, 'Kanonen-Explosion ist kein Meteor');
});

test('B-112 syncFx: Meteor erzeugt beim ersten Sehen keine Kanonen-Partikel, der Einschlag folgt mit der Spielzeit; viele Meteore sprengen den Pool nicht', () => {
  const M = FXS_B112.meteor;
  const fx = createFx();
  const s = fxState(2);
  const e = meteorFx(0);
  s.effects.push(e);
  syncFx(fx, s);
  assert.equal(liveParticles(fx), 0);
  assert.equal(fx.shakeStrength, 0);
  s.time += M.flight + 0.02;
  e.ttl -= M.flight + 0.02;
  syncFx(fx, s);
  assert.ok(liveParticles(fx) > 0);
  assert.equal(fx.shakeStart, s.time);
  // 30 Meteore auf einmal: Ringpuffer bleibt in der Grenze
  for (let i = 0; i < 30; i++) s.effects.push(meteorFx(M.flight + 0.01, { x: i * 10 }));
  syncFx(fx, s);
  assert.ok(liveParticles(fx) <= MAX_PARTICLES);
});

// ---------- B-112 Tester: resetFx und Ablauf über syncFx ----------
import { resetFx as resetFxB112 } from '../src/fx-system.js';

test('B-112 Tester: Einschlag über syncFx genau einmal, nach resetFx kein Nachholen eines alten Kraters', () => {
  const M = FXS_B112.meteor;
  const fx = createFx();
  const s = fxState(2);
  const e = meteorFx(M.flight + 0.01);
  s.effects.push(e);
  syncFx(fx, s);
  const n = liveParticles(fx);
  assert.ok(n > 0);
  for (let i = 0; i < 3; i++) { s.time += 0.01; e.ttl -= 0.01; syncFx(fx, s); }
  assert.ok(liveParticles(fx) <= n, 'kein zweiter Einschlag in Folgeframes');
  resetFxB112(fx);
  assert.equal(liveParticles(fx), 0);
  const old = meteorFx(M.flight + M.blast + 0.5);
  const s2 = fxState(10);
  s2.effects.push(old);
  syncFx(fx, s2);
  assert.equal(liveParticles(fx), 0, 'Krater nach Reset löst keinen Einschlag aus');
  assert.equal(fx.shakeStrength, 0);
});

// ---------- B-127: Nekromantin und Skelett ----------

import { observeEnemy, observeEffect, K_SUMMON } from '../src/fx-system.js';

test('B-127: Boss-Auftritt auch für die Nekromantin, nicht für Skelette; Beschwörung erzeugt grüne Funken', () => {
  const fx = createFx();
  observeEnemy(fx, { type: 'skeleton', x: 10, y: 10, radius: 10 }, 1, false);
  assert.equal(bossEntryProgress(1, fx.entryStart ?? -99), -1);
  observeEnemy(fx, { type: 'necro', x: 50, y: 60, radius: 18 }, 2, false);
  assert.equal(fx.entryStart, 2);
  assert.equal(fx.entryX, 50);
  const g = createFx();
  observeEffect(g, { kind: 'summon', x: 30, y: 40, ttl: 0.6, max: 0.6 }, 0, false);
  const n = Array.from(g.pkind).filter((k) => k === K_SUMMON).length;
  assert.equal(n, FX_STYLE_B127.summon.count);
  const calm = createFx();
  observeEffect(calm, { kind: 'summon', x: 30, y: 40, ttl: 0.6, max: 0.6 }, 0, true);
  for (let i = 0; i < MAX_PARTICLES; i++) if (calm.pkind[i] === K_SUMMON) assert.equal(calm.pvy[i], 0, 'reduzierte Bewegung: steigt nicht');
});
import { FX_STYLE as FX_STYLE_B127 } from '../src/config.js';

// ---------- Stil 1 (G8): Effekte in der Sternsprache des Entwurfs ----------
test('Stil 1 Effekte: starPath und zigPath wie star()/zig() im Entwurf (Punkte, Radien, Enden, Ausschlag)', async () => {
  const { starPath, zigPath } = await import('../src/draw-utils.js');
  const pts = [];
  const ctx = { moveTo: (x, y) => pts.push([x, y]), lineTo: (x, y) => pts.push([x, y]), closePath: () => pts.push('Z') };
  starPath(ctx, 10, 20, 40, 22, 9, 0.2);
  assert.equal(pts.length, 19);
  assert.equal(pts[18], 'Z');
  pts.slice(0, 18).forEach(([x, y], i) => assert.ok(Math.abs(Math.hypot(x - 10, y - 20) - (i % 2 ? 22 : 40)) < 1e-9, `Zacke ${i}`));
  pts.length = 0;
  zigPath(ctx, 0, 0, 100, 0, 7, 8);
  assert.equal(pts.length, 8);
  assert.deepEqual(pts[0], [0, 0]);
  assert.ok(Math.abs(pts[7][0] - 100) < 1e-9 && Math.abs(pts[7][1]) < 1e-9);
  assert.ok(pts.every(([, y]) => Math.abs(y) <= 8 + 1e-9) && pts.some(([, y]) => Math.abs(y) > 4));
  const flip = [];
  zigPath({ moveTo: (x, y) => flip.push(y), lineTo: (x, y) => flip.push(y) }, 0, 0, 100, 0, 7, 8, true, -1);
  flip.forEach((y, i) => assert.ok(Math.abs(y + pts[i][1]) < 1e-9, 'sign kehrt die Zacken um'));
});

test('Stil 1 Effekte: Explosion mit Lichthof/Rauch unter und drei Sternen über den Figuren, Blitz als Zickzack in drei Lagen', async () => {
  const { drawEffectUnder, drawEffectOver } = await import('../src/render-fx.js');
  const { FX_STYLE } = await import('../src/config.js');
  const EX = FX_STYLE.explosion;
  const ex = { kind: 'explosion', x: 200, y: 200, r: 44, ttl: 0.2, max: 0.3 };
  const under = logCtx();
  drawEffectUnder(under.ctx, ex);
  const over = logCtx();
  drawEffectOver(over.ctx, ex);
  const stars = EX.stars.map((s) => s[4]);
  assert.ok(under.st.ops.some(([k, c]) => k === 'fill' && c === EX.fill), 'Lichthof unten');
  assert.ok(!under.st.ops.some(([, c]) => stars.includes(c)), 'keine Sterne unter den Figuren');
  for (const c of stars) assert.ok(over.st.ops.some(([k, x]) => k === 'fill' && x === c), `Stern ${c} oben`);
  for (const l of [under, over]) { assert.equal(l.st.depth, 0); assert.equal(l.props.globalAlpha === undefined || l.props.globalAlpha === 1, true); }
  // Größe: wächst schnell, schrumpft dann; abgelaufen zeichnet nichts
  const radius = (ttl) => { let r = 0; const c = { moveTo: (x, y) => { r = Math.max(r, Math.hypot(x - 200, y - 200)); }, lineTo: (x, y) => { r = Math.max(r, Math.hypot(x - 200, y - 200)); } }; drawEffectOver(new Proxy({}, { get: (_, k) => c[k] || (() => {}), set: () => true }), { ...ex, ttl }); return r; };
  assert.ok(radius(0.28) < radius(0.2) && radius(0.02) < radius(0.2) && radius(0) === 0);
  assert.ok(Math.abs(radius(0.3 * (1 - EX.grow)) - (EX.stars[0][0] * TILE) / 57) < 0.5, 'Außenstern 1,4 Kacheln breit');
  // Blitz: drei Lagen (Schein, Kontur, Kern), Zickzack mit mehr Punkten als Zielen, flackert über die Restzeit
  const bolt = (ttl) => {
    const props = {};
    const log = [];
    const ctx = new Proxy({}, { get: (_, k) => (k in props ? props[k] : (...a) => log.push(k === 'stroke' ? 'stroke:' + props.strokeStyle : k + ':' + a.map((v) => (typeof v === 'number' ? v.toFixed(2) : v)).join(','))), set: (_, k, v) => { props[k] = v; return true; } });
    drawEffectOver(ctx, { kind: 'bolt', points: [{ x: 0, y: 0 }, { x: 120, y: 0 }, { x: 120, y: 90 }], ttl, max: 0.25 });
    return log;
  };
  const b = bolt(0.2);
  assert.deepEqual(b.filter((c) => c.startsWith('stroke:')), ['stroke:' + FX_STYLE.bolt.outer, 'stroke:' + FX_STYLE.bolt.mid, 'stroke:' + FX_STYLE.bolt.core]);
  assert.ok(b.filter((c) => c.startsWith('lineTo')).length > 4, 'Zickzack');
  assert.notDeepEqual(bolt(0.2), bolt(0.15), 'flackert');
  assert.deepEqual(bolt(0.2), b, 'deterministisch');
});
