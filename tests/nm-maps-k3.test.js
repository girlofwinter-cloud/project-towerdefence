// B-199 Vulkan im Albtraum und B-194 Lichtinsel unter Türmen (nur Optik)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, buildTower } from '../src/game.js';
import { MAPS, TILE, COLS, ROWS, NM_WARM_LIGHT, PAINTED_STYLE } from '../src/config.js';
import { buildPaintedScene, buildPaintedSvg, toGame } from '../src/render-painted.js';
import { motionParticles, drawWarmLights } from '../src/render-nightmare.js';
import volcano, { crackEdges } from '../src/nm-maps/volcano.js';
import { pathTiles } from '../src/path.js';
import { mockCtx } from './helpers.js';

const nmGame = () => createGame({ mapId: 'volcano', mode: 'nightmare' });

test('B-199: Vulkan-Albtraum-SVG mit nm-char, Rand-Lava und Rissen, ohne Vignette, deterministisch', () => {
  const st = nmGame();
  const a = buildPaintedSvg(st, { look: 'nightmare' });
  assert.equal(a, buildPaintedSvg(nmGame(), { look: 'nightmare' }), 'deterministisch');
  for (const part of ['nm-char', 'nm-rand-lava', 'nm-cracks', 'class="charTree"']) assert.ok(a.includes(part), part);
  assert.ok(!a.includes('id="vignette'), 'keine Vignette');
  const normal = buildPaintedSvg(st);
  assert.ok(!normal.includes('nm-rand-lava') && normal.includes('id="vignette'), 'Normalmodus unverändert');
});

test('B-199: Risse nur auf Kanten zwischen zwei freien Bauplätzen, Hindernisse als verkohlter Baum', () => {
  const m = MAPS.volcano;
  const used = new Set([...pathTiles(m.waypoints), ...[...m.lavaRiver, ...m.lava, ...m.obstacles, ...m.flagTiles].map(([c, r]) => `${c},${r}`)]);
  const edges = crackEdges('volcano');
  assert.ok(edges.length > 10, 'genug Risse');
  for (const e of edges) {
    const [c2, r2] = e.vertical ? [e.c + 1, e.r] : [e.c, e.r + 1];
    assert.ok(c2 < COLS && r2 < ROWS && !used.has(`${e.c},${e.r}`) && !used.has(`${c2},${r2}`), `Kante ${e.c},${e.r}`);
  }
  const sc = buildPaintedScene(nmGame(), 'nightmare');
  assert.equal(sc.trees.filter((t) => t.kind === 'charTreeCold').length, m.obstacles.length);
});

test('B-199: keine Rand-Deko auf Rand-Lava, keine Deko-Box mehr als maxOverhang über einer bebaubaren Kachel', () => {
  const sc = buildPaintedScene(nmGame(), 'nightmare');
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const obst = new Set(MAPS.volcano.obstacles.map(([c, r]) => `${c},${r}`));
  const over = PAINTED_STYLE.maxOverhang * TILE;
  for (const t of sc.trees) {
    if (t.kind === 'charTreeCold') continue;
    assert.ok(!volcano.reserve.some((r) => hit(r, t.box)), `${t.kind} auf Rand-Lava`);
    const [x0, y0, x1, y1] = toGame(t.box);
    const inner = [over, over, COLS * TILE - over, ROWS * TILE - over];
    if (hit([x0, y0, x1, y1], inner)) {
      const c = Math.floor((x0 + x1) / 2 / TILE), r = Math.floor(y1 / TILE);
      assert.ok(obst.has(`${c},${r}`), `${t.kind} ragt ins Feld`);
    }
  }
});

test('B-199: Bewegung Vulkan im Rahmen, Glanz auf dem Lavafluss', () => {
  const d = motionParticles('volcano'), h = motionParticles('volcano', true);
  // B-194 Nachtrag: Puls (Tümpel, Risse) und Rauch dazu; Schlot-Rauch nur mit Szenen-Marken.
  // Kein Puls mehr an den Rand-Seen (lagen außerhalb des Felds, hart abgeschnitten): 51 -> 49
  assert.equal(d.length, 49);
  assert.equal(h.length, 23);
  assert.ok(d.length <= 60 && h.length <= 28);
  assert.equal(d.filter((p) => p.kind === 'glint').length, 2);
});

test('B-194: Lichtinsel unter jedem Turm, nur im Albtraum', async () => {
  const st = nmGame();
  st.gold = 9999;
  buildTower(st, 'arrow', 0, 0);
  buildTower(st, 'arrow', 5, 5);
  assert.equal(st.towers.length, 2);
  const m = mockCtx();
  drawWarmLights(m.ctx, st.towers);
  assert.equal(m.counts.ellipse, 2, 'ohne Canvas: ein Fleck je Turm');
  assert.equal(m.props.fillStyle, NM_WARM_LIGHT.color);
  const { render } = await import('../src/render.js');
  const count = (game, ui) => { const k = mockCtx(); render(k.ctx, game, ui); return k.counts.ellipse || 0; };
  const normal = createGame({ mapId: 'volcano' });
  normal.gold = 9999;
  buildTower(normal, 'arrow', 0, 0);
  const without = count(normal, {});
  const withNight = count(normal, { night: true, reducedMotion: true });
  assert.ok(withNight >= without + 1, 'Nacht-Look zeichnet die Lichtinsel');
});
