// B-195 (Wiese) und B-197 (Zangenangriff) im Albtraum-Look: Formen, Rand-Deko, Bauplätze frei, Bewegung begrenzt
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, canBuild } from '../src/game.js';
import { TILE, COLS, ROWS, HEIGHT, NM_MOTION, PAINTED_STYLE } from '../src/config.js';
import { buildPaintedScene, buildPaintedSvg, toGame } from '../src/render-painted.js';
import { motionParticles, drawNightmareMotion } from '../src/render-nightmare.js';
import { nightmareOf } from '../src/nm-maps/index.js';
import { pathCracks } from '../src/nm-maps/fork.js';

const IDS = { meadow: 'nm-bark', fork: 'nm-char' };

test('B-195/B-197: Albtraum-SVG mit eigenen Formen und Verläufen, ohne Vignette, deterministisch', () => {
  for (const [id, grad] of Object.entries(IDS)) {
    const s = createGame({ mapId: id });
    const a = buildPaintedSvg(s, { look: 'nightmare' });
    assert.equal(a, buildPaintedSvg(createGame({ mapId: id }), { look: 'nightmare' }), `${id}: deterministisch`);
    assert.ok(a.includes(`id="${grad}"`) && a.includes(`url(#${grad})`), `${id}: Verlauf ${grad} definiert und benutzt`);
    assert.ok(!a.includes('vignette-field') && !a.includes('vignette-frame'), `${id}: keine Vignette`);
    const nm = nightmareOf(id);
    for (const list of Object.values(nm.frame)) for (const k of list) assert.ok(nm.shapes[k], `${id}: Form ${k} vorhanden`);
    const sc = buildPaintedScene(s, 'nightmare');
    assert.equal(sc.cliffs.length, 0, `${id}: keine Klippen`);
    const kinds = new Set(sc.trees.map((t) => t.kind));
    assert.ok([...kinds].every((k) => nm.shapes[k]), `${id}: nur Albtraum-Formen (${[...kinds]})`);
  }
});

test('B-195/B-197: Hindernisse in Albtraum-Form an derselben Stelle, Weg und Bauplätze wie im Normalmodus', () => {
  for (const id of Object.keys(IDS)) {
    const s = createGame({ mapId: id });
    const n = buildPaintedScene(s), m = buildPaintedScene(s, 'nightmare');
    assert.deepEqual(m.paths, n.paths, `${id}: Weg gleich`);
    assert.deepEqual(m.rocks.map((r) => [r.x, r.y]), n.rocks.map((r) => [r.x, r.y]), `${id}: Felsen an derselben Stelle`);
    assert.ok(m.rocks.every((r) => r.kind === 'obstacleRock'), `${id}: Fels-Form`);
    assert.ok(m.trees.filter((t) => t.kind === 'obstacleTree').length === s.obstacles.size - n.rocks.length, `${id}: Baum-Hindernisse`);
  }
});

test('B-195/B-197: Rand-Deko ragt höchstens maxOverhang in bebaubare Kacheln', () => {
  const max = PAINTED_STYLE.maxOverhang * TILE + 0.5;
  for (const id of Object.keys(IDS)) {
    const s = createGame({ mapId: id });
    const sc = buildPaintedScene(s, 'nightmare');
    const frame = sc.trees.filter((t) => t.kind !== 'obstacleTree');
    assert.ok(frame.length > 20, `${id}: Rand-Deko vorhanden`);
    for (const t of frame) {
      const [x0, y0, x1, y1] = toGame(t.box);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (!canBuild(s, c, r).ok) continue;
        const ox = Math.min(x1, (c + 1) * TILE) - Math.max(x0, c * TILE), oy = Math.min(y1, (r + 1) * TILE) - Math.max(y0, r * TILE);
        if (ox > 0 && oy > 0) assert.ok(Math.min(ox, oy) <= max, `${id}: ${t.kind} ragt ${Math.min(ox, oy).toFixed(1)} px in Bauplatz ${c},${r}`);
      }
    }
  }
});

test('B-195: Wiese hat blinzelnde Augen in der Rand-Deko, Zangenangriff keine', () => {
  const eyes = buildPaintedScene(createGame({ mapId: 'meadow' }), 'nightmare').eyes;
  assert.ok(eyes.length > 0);
  assert.equal(buildPaintedScene(createGame({ mapId: 'fork' }), 'nightmare').eyes.length, 0);
  assert.ok(motionParticles('meadow', false, eyes).some((p) => p.kind === 'blink'));
});

test('B-195/B-197: Teilchen höchstens maxDesktop bzw. maxCompact, Glanz und Wellen der Wiese auf dem Wasser', () => {
  for (const id of Object.keys(IDS)) {
    const eyes = buildPaintedScene(createGame({ mapId: id }), 'nightmare').eyes;
    const d = motionParticles(id, false, eyes), c = motionParticles(id, true, eyes);
    assert.ok(d.length > 0 && d.length <= NM_MOTION.maxDesktop, `${id}: ${d.length} Teilchen`);
    assert.ok(c.length > 0 && c.length <= NM_MOTION.maxCompact && c.length < d.length, `${id}: Handy ${c.length}`);
  }
  const water = motionParticles('meadow').filter((p) => p.kind === 'glint' || p.kind === 'ripple');
  assert.equal(water.length, 5);
  for (const p of water.filter((q) => q.kind === 'ripple')) assert.ok(p.at[0] > 0 && p.at[1] < HEIGHT && p.at[1] > HEIGHT / 2, 'Wellen im See unten links');
  for (const p of water.filter((q) => q.kind === 'glint')) assert.ok(p.points.length > 10 && p.points.every(([x]) => x < 3 * TILE), 'Glanz am Fluss links');
});

test('B-195/B-197: reduced motion zeichnet zwei Frames gleich, ohne Verläufe je Frame', () => {
  for (const id of Object.keys(IDS)) {
    const s = createGame({ mapId: id });
    const eyes = buildPaintedScene(s, 'nightmare').eyes;
    const rec = (t) => {
      const calls = [];
      const ctx = new Proxy({}, { get: (_, k) => (...a) => { calls.push([k, ...a]); return { addColorStop() {} }; }, set: (_, k, v) => { calls.push(['=', k, v]); return true; } });
      drawNightmareMotion(ctx, s, t, true, false, eyes);
      return calls;
    };
    const a = rec(0);
    assert.deepEqual(rec(3), a, `${id}: stillstehend`);
    assert.ok(!a.some(([k]) => k === 'createRadialGradient' || k === 'createLinearGradient'), `${id}: keine Verläufe je Frame`);
  }
});

test('B-197: Wegrisse alle 3,5 Kacheln auf dem Weg, jeder dritte glüht, geteilte Wegstücke nur einmal', () => {
  const sc = buildPaintedScene(createGame({ mapId: 'fork' }), 'nightmare');
  const cracks = pathCracks(sc.paths);
  assert.ok(cracks.length >= 10);
  assert.equal(cracks.filter((c) => c.glow).length, Math.floor(cracks.length / 3));
  for (const a of cracks) for (const b of cracks) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 1.75 * PAINTED_STYLE.unit);
  const svg = buildPaintedSvg(createGame({ mapId: 'fork' }), { look: 'nightmare' });
  assert.ok(svg.includes('id="nm-path-cracks"') && svg.includes('id="nm-rim-cracks"'));
  assert.ok(!buildPaintedSvg(createGame({ mapId: 'fork' })).includes('nm-path-cracks'), 'Normalmodus unverändert');
});

test('B-195 Nachtrag: Wiese mit Wasser nm-water-a/-b, Moosfäden an der Brücke, Grasbüscheln und Seeaugen; Normalmodus unverändert', () => {
  const s = createGame({ mapId: 'meadow' });
  const nm = buildPaintedSvg(s, { look: 'nightmare' }), normal = buildPaintedSvg(s, {});
  for (const c of ['#5fd6b8', '#183e50', '#8aa890']) assert.ok(nm.includes(c), `Albtraum: ${c}`);
  assert.ok(nm.includes('dot-tuft'), 'Tupfen als Grasbüschel');
  assert.ok(normal.includes('#6fcbe0') && !normal.includes('#5fd6b8') && !normal.includes('#8aa890') && !normal.includes('dot-tuft'), 'Normalmodus wie bisher');
  const lake = motionParticles('meadow').filter((p) => p.kind === 'blink' && p.rx);
  assert.equal(lake.length, 1, 'ein Augenpaar im See');
  const [lx, ly] = nightmareOf('meadow').reserve[0];
  assert.ok(lake[0].x > lx * TILE / PAINTED_STYLE.unit && lake[0].y > ly * TILE / PAINTED_STYLE.unit, 'Seeaugen im See');
  assert.ok(motionParticles('meadow').some((p) => p.kind === 'twinkle'), 'Glitzern auf dem Wasser');
});
