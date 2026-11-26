// Streu-Deko (B-079): gezeichnete Punkte (inkl. Transformationen) bleiben in der Kachel bzw. kommen nie auf Wegkacheln.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game.js';
import { scatterFor } from '../src/decor.js';
import { drawScatter } from '../src/render-decor.js';
import { TILE, COLS, ROWS } from '../src/config.js';

function recorder() {
  let m = [1, 0, 0, 1, 0, 0]; const stack = []; const pts = [];
  const add = (x, y) => pts.push([m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]);
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k === 'save') return () => stack.push(m.slice());
      if (k === 'restore') return () => { m = stack.pop(); };
      if (k === 'translate') return (x, y) => { m = [m[0], m[1], m[2], m[3], m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; };
      if (k === 'rotate') return (a) => { const c = Math.cos(a), s = Math.sin(a); m = [m[0] * c + m[2] * s, m[1] * c + m[3] * s, m[0] * -s + m[2] * c, m[1] * -s + m[3] * c, m[4], m[5]]; };
      if (k === 'moveTo' || k === 'lineTo') return (x, y) => add(x, y);
      if (k === 'bezierCurveTo') return (a, b, c, d, e, f) => add(e, f);
      if (k === 'quadraticCurveTo') return (a, b, c, d) => add(c, d);
      if (k === 'arcTo') return (a, b, c, d) => add(c, d);
      if (k === 'ellipse' || k === 'arc') return (x, y, rx) => add(x, y);
      return () => {};
    },
    set() { return true; },
  });
  return { ctx, pts };
}

test('Streu-Deko: gezeichnete Punkte erreichen nie eine Wegkachel und bleiben im Spielfeld', () => {
  const s = createGame({ mapId: 'meadow' });
  let n = 0; let outTile = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const a = scatterFor(c, r, s.blocked, s.obstacles, 'meadow');
    if (!a) continue;
    n++;
    const { ctx, pts } = recorder();
    drawScatter(ctx, a, c * TILE + a.ox * TILE, r * TILE + a.oy * TILE);
    assert.ok(pts.length > 0, `${a.kind} zeichnet nichts`);
    for (const [x, y] of pts) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
      const pc = Math.floor(x / TILE), pr = Math.floor(y / TILE);
      if (pc !== c || pr !== r) outTile++;
      assert.ok(!s.blocked.has(`${pc},${pr}`), `${a.kind} auf ${c},${r} ragt auf Wegkachel ${pc},${pr}`);
      assert.ok(pc >= 0 && pr >= 0 && pc < COLS && pr < ROWS, `${a.kind} auf ${c},${r} ausserhalb`);
    }
  }
  assert.ok(n >= 5);
  console.log(`Streu-Deko: ${n} Stuecke, ${outTile} Punkte ausserhalb der eigenen Kachel`);
});

// B-072/B-099: Zangenangriff und Zwei Fronten haben eigene Streu-Deko; auch sie erreicht nie eine Wegkachel.
test('Streu-Deko Zangenangriff/Zwei Fronten: gezeichnete Punkte erreichen nie eine Wegkachel und bleiben im Spielfeld', () => {
  for (const id of ['twin', 'fork']) {
    const s = createGame({ mapId: id });
    const kinds = new Set();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const a = scatterFor(c, r, s.blocked, s.obstacles, id);
      if (!a) continue;
      kinds.add(a.kind);
      const { ctx, pts } = recorder();
      drawScatter(ctx, a, c * TILE + a.ox * TILE, r * TILE + a.oy * TILE);
      assert.ok(pts.length > 0, `${id}: ${a.kind} zeichnet nichts`);
      for (const [x, y] of pts) {
        assert.ok(Number.isFinite(x) && Number.isFinite(y));
        const pc = Math.floor(x / TILE), pr = Math.floor(y / TILE);
        assert.ok(!s.blocked.has(`${pc},${pr}`), `${id}: ${a.kind} auf ${c},${r} ragt auf Wegkachel ${pc},${pr}`);
        assert.ok(pc >= 0 && pr >= 0 && pc < COLS && pr < ROWS, `${id}: ${a.kind} auf ${c},${r} ausserhalb`);
      }
    }
    assert.ok(kinds.size >= 4, `${id}: Vielfalt ${[...kinds]}`);
  }
});

// B-030: Vulkan mit Glutsteinen und Asche; auch sie erreichen nie Weg oder Lava.
test('Streu-Deko Vulkan: Glutsteine und Asche, Punkte nie auf Weg- oder Lavakachel, im Spielfeld', () => {
  const s = createGame({ mapId: 'volcano' });
  const kinds = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const a = scatterFor(c, r, s.blocked, s.obstacles, 'volcano');
    if (!a) continue;
    kinds.add(a.kind);
    const { ctx, pts } = recorder();
    drawScatter(ctx, a, c * TILE + a.ox * TILE, r * TILE + a.oy * TILE);
    assert.ok(pts.length > 0, `${a.kind} zeichnet nichts`);
    for (const [x, y] of pts) {
      const k = `${Math.floor(x / TILE)},${Math.floor(y / TILE)}`;
      assert.ok(!s.blocked.has(k) && !s.lava.has(k), `${a.kind} auf ${c},${r} ragt auf ${k}`);
      assert.ok(x >= 0 && y >= 0 && x < COLS * TILE && y < ROWS * TILE, `${a.kind} auf ${c},${r} ausserhalb`);
    }
  }
  for (const k of ['ember', 'ash']) assert.ok(kinds.has(k), `Art ${k} fehlt (${[...kinds]})`);
});
