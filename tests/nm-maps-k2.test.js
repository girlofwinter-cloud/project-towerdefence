// Unit-Tests B-196 (Eiswelt) und B-198 (Zwei Fronten) im Albtraum-Look: Formen, Lage der Deko, Bewegung
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, canBuild } from '../src/game.js';
import { TILE, COLS, ROWS, WIDTH, HEIGHT, PAINTED_STYLE, NM_MOTION } from '../src/config.js';
import { buildPaintedScene, buildPaintedSvg, toGame } from '../src/render-painted.js';
import { motionParticles, drawNightmareMotion } from '../src/render-nightmare.js';
import { NM_MAPS } from '../src/nm-maps/index.js';
import * as ice from '../src/nm-maps/ice.js';
import * as twin from '../src/nm-maps/twin.js';

const K = TILE / PAINTED_STYLE.unit;
const OVER = PAINTED_STYLE.maxOverhang * TILE;
const IDS = ['ice', 'twin'];
const depth = ([x0, y0, x1, y1], c, r) => {
  const ox = Math.min(x1, (c + 1) * TILE) - Math.max(x0, c * TILE);
  const oy = Math.min(y1, (r + 1) * TILE) - Math.max(y0, r * TILE);
  return ox > 0 && oy > 0 ? Math.min(ox, oy) : 0;
};
const buildableOf = (s) => {
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (canBuild(s, c, r).ok) out.push([c, r]);
  return out;
};

test('B-196/B-198: alle Formen der Rand-Deko und Hindernisse vorhanden, SVG mit eigenen Verläufen, ohne Klippen und Vignette', () => {
  for (const [id, grad] of [['ice', 'nm-froz'], ['twin', 'nm-crypt']]) {
    const nm = NM_MAPS[id];
    const names = [...Object.values(nm.frame).flat(), nm.obstacle.rock, nm.obstacle.tree];
    for (const n of names) assert.ok(nm.shapes[n], `${id}: Form ${n}`);
    for (const [n, sh] of Object.entries(nm.shapes)) assert.ok(sh.w > 0 && sh.h > 0 && sh.svg({}).includes('<'), `${id}: ${n} gültig`);
    assert.equal(nm.noCliffs, true);
    const s = createGame({ mapId: id, mode: 'nightmare' });
    const svg = buildPaintedSvg(s, { look: 'nightmare' });
    assert.ok(svg.includes(`id="${grad}"`) && svg.includes(`url(#${grad})`), `${id}: Verlauf ${grad} definiert und benutzt`);
    assert.ok(!svg.includes('vignette') && !svg.includes('class="cliff"'), `${id}: keine Vignette, keine Klippe`);
    assert.equal(svg, buildPaintedSvg(s, { look: 'nightmare' }), `${id}: deterministisch`);
    const sc = buildPaintedScene(s, 'nightmare');
    const kinds = new Set([...sc.trees, ...sc.rocks].map((t) => t.kind));
    for (const k of kinds) assert.ok(nm.shapes[k], `${id}: Szene nutzt nur Albtraum-Formen (${k})`);
    assert.ok(kinds.has(nm.obstacle.rock) && kinds.has(nm.obstacle.tree), `${id}: Hindernisse in Albtraum-Form`);
  }
  const iceSvg = buildPaintedSvg(createGame({ mapId: 'ice', mode: 'nightmare' }), { look: 'nightmare' });
  for (const part of ['nm-snow-wall', 'nm-frozen-lake', 'nm-open-water', 'nm-relics', 'nm-path-runes']) assert.ok(iceSvg.includes(`id="${part}"`), `ice: ${part}`);
  const twinSvg = buildPaintedSvg(createGame({ mapId: 'twin', mode: 'nightmare' }), { look: 'nightmare' });
  for (const part of ['nm-gate-light', 'nm-crypt-marks', 'nm-path-runes']) assert.ok(twinSvg.includes(`id="${part}"`), `twin: ${part}`);
  // Normal-Look unverändert: keine Albtraum-Teile
  assert.ok(!buildPaintedSvg(createGame({ mapId: 'ice' })).includes('nm-frozen-lake'));
});

test('B-196/B-198: keine Deko auf Bauplätzen (Figuren, Landmarken, Runen), Bauplätze wie im Normalmodus', () => {
  for (const id of IDS) {
    const s = createGame({ mapId: id, mode: 'nightmare' });
    const buildable = buildableOf(s);
    assert.deepEqual(buildable, buildableOf(createGame({ mapId: id })), `${id}: gleiche Bauplätze`);
    const sc = buildPaintedScene(s, 'nightmare');
    for (const t of [...sc.trees, ...sc.rocks]) {
      const fx = t.x * K, fy = t.y * K;
      if (fx >= 0 && fy - 1 >= 0 && fx < WIDTH && fy - 1 < HEIGHT) {
        assert.ok(s.obstacles.has(`${Math.floor(fx / TILE)},${Math.floor((fy - 1) / TILE)}`), `${id}: ${t.kind} im Feld nur auf Hindernis`);
        continue;
      }
      for (const [c, r] of buildable) assert.ok(depth(toGame(t.box), c, r) <= OVER + 1e-9, `${id}: ${t.kind} ragt in ${c},${r}`);
    }
    // Landmarken (Relikte, Obelisk, Gruft-Tore, Runenkreise, Seelenflammen) liegen ganz im Rand
    for (const m of (id === 'ice' ? ice : twin).LANDMARKS) for (const [c, r] of buildable) assert.equal(depth(toGame(m.box), c, r), 0, `${id}: Landmarke auf ${c},${r}`);
    // Runen am Weg liegen auf Wegkacheln (oder außerhalb des Felds)
    const runes = id === 'ice' ? ice.pathRunes() : twin.pathRunes(sc.paths);
    assert.equal(runes.length, id === 'ice' ? 14 : 18);
    const free = new Set(buildable.map(([c, r]) => `${c},${r}`));
    for (const [x, y] of runes) assert.ok(!free.has(`${Math.floor((x * K) / TILE)},${Math.floor((y * K) / TILE)}`), `${id}: Rune auf Bauplatz (${x},${y})`);
  }
  // Eiswelt: Bodentextur nur auf freien Kacheln (kein Weg, kein Hindernis)
  const s = createGame({ mapId: 'ice' });
  for (const [c, r] of ice.freeTiles()) assert.ok(!s.blocked.has(`${c},${r}`) && !s.obstacles.has(`${c},${r}`), `ice: ${c},${r} frei`);
});

test('B-196/B-198: Bewegung innerhalb der Obergrenze, Augen aus der Szene, reduced motion steht still', () => {
  const expect = { ice: [59, 28], twin: [51, 26] }; // B-194 Nachtrag: Glitzern, Puls, Wippen
  for (const id of IDS) {
    const s = createGame({ mapId: id, mode: 'nightmare' });
    const { eyes, marks } = buildPaintedScene(s, 'nightmare');
    assert.ok(eyes.length >= 2, `${id}: Augen in der Rand-Deko (${eyes.length})`);
    const d = motionParticles(id, false, eyes, marks), h = motionParticles(id, true, eyes, marks);
    assert.deepEqual([d.length, h.length], expect[id], `${id}: Teilchen Desktop/Handy`);
    assert.ok(d.length <= NM_MOTION.maxDesktop && h.length <= NM_MOTION.maxCompact);
    for (const p of d.filter((q) => q.kind === 'ripple')) {
      const [x, y] = p.at;
      assert.ok(x < 0 || x > WIDTH, `${id}: Runenkreis im Rand (${x},${y})`);
    }
    const rec = (t) => {
      const calls = [];
      const ctx = new Proxy({}, { get: (_, k) => (...a) => { calls.push([k, ...a]); return { addColorStop() {} }; }, set: (_, k, v) => { calls.push(['=' + String(k), v]); return true; } });
      drawNightmareMotion(ctx, s, t, true, false, eyes, marks);
      return calls;
    };
    assert.deepEqual(rec(0), rec(4), `${id}: reduced motion`);
  }
});

test('B-194 Nachtrag: Randbäume weichen See, offenem Wasser und Gruft-Toren aus (reserve)', () => {
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  for (const id of ['meadow', 'ice', 'twin']) {
    const reserve = NM_MAPS[id].reserve;
    assert.ok(reserve?.length > 0, `${id}: reserve`);
    const sc = buildPaintedScene(createGame({ mapId: id, mode: 'nightmare' }), 'nightmare');
    const { tree, rock } = NM_MAPS[id].obstacle;
    for (const t of sc.trees.filter((q) => q.box && q.kind !== tree && q.kind !== rock)) {
      assert.ok(!reserve.some((r) => hit(r, t.box)), `${id}: ${t.kind} auf freier Fläche`);
    }
  }
});

test('B-194 Nachtrag: Szenen-Marken für Rauch, Risse und Runen; Bewegung nutzt sie', () => {
  const sc = (id) => buildPaintedScene(createGame({ mapId: id, mode: 'nightmare' }), 'nightmare');
  const fork = sc('fork'), twinSc = sc('twin');
  assert.ok(fork.marks.smoke.length > 0 && fork.marks.crack.length >= 4, 'Zangenangriff: Rauch und Glutrisse');
  assert.equal(twinSc.marks.rune.length, 18, 'Zwei Fronten: 18 Runen am Weg');
  assert.equal(motionParticles('fork', false, fork.eyes, fork.marks).filter((p) => p.kind === 'smoke').length, 6);
  assert.equal(motionParticles('fork', false, fork.eyes, {}).filter((p) => p.kind === 'smoke').length, 0, 'ohne Marken kein Rauch');
  assert.deepEqual(buildPaintedScene(createGame({ mapId: 'fork' }), 'normal').marks, {}, 'Normalmodus ohne Marken');
});
