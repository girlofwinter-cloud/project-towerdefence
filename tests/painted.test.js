// Unit-Tests für den gemalten Hintergrund (Stil 1, src/render-painted.js) und den Rand um das Feld
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, canBuild } from '../src/game.js';
import { TILE, COLS, ROWS, WIDTH, HEIGHT, MAPS, FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT, PAINTED_STYLE } from '../src/config.js';
import { buildPaintedScene, buildPaintedSvg, paintedWaterAt, toGame } from '../src/render-painted.js';
import { mockCtx } from './helpers.js';

const meadow = () => createGame({ mapId: 'meadow' });
const OVER = PAINTED_STYLE.maxOverhang * TILE;
// Eindringtiefe eines Rahmens (Spiel-px) in eine Kachel: kleinere der beiden Überlappungen, 0 ohne Überlappung
function depth([x0, y0, x1, y1], c, r) {
  const ox = Math.min(x1, (c + 1) * TILE) - Math.max(x0, c * TILE);
  const oy = Math.min(y1, (r + 1) * TILE) - Math.max(y0, r * TILE);
  return ox > 0 && oy > 0 ? Math.min(ox, oy) : 0;
}
const inField = (x, y) => x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;

test('Stil 1: SVG deterministisch, Canvas-Größe mit Rand, enthält Boden-Filter, Weg-Schichten, Wasser, Brücke, Burg, Fahne', () => {
  const a = buildPaintedSvg(meadow());
  assert.equal(a, buildPaintedSvg(meadow()), 'deterministisch');
  assert.equal(VIEW_WIDTH, WIDTH + 2 * FRAME_MARGIN);
  assert.equal(VIEW_HEIGHT, HEIGHT + 2 * FRAME_MARGIN);
  assert.match(a, new RegExp(`^<svg [^>]*width="${VIEW_WIDTH}" height="${VIEW_HEIGHT}"`));
  for (const id of ['p-mot', 'p-lit', 'p-grain', 'p-wob', 'p-gr']) assert.ok(a.includes(`id="${id}"`), `Filter/Verlauf ${id}`);
  assert.ok(a.includes('filter="url(#p-mot)"') && a.includes('filter="url(#p-lit)"'), 'Boden gemalt');
  const path = a.match(/<g class="path">(.*?)<\/g><path/)[1];
  for (const w of [86, 72, 64, 54, 30]) assert.ok(path.includes(`stroke-width="${w}"`), `Weg-Schicht ${w}`);
  for (const part of ['id="river"', 'id="lake"', 'class="bridge"', 'class="castle"', 'class="flag"', 'class="cliff"', 'class="flower"']) assert.ok(a.includes(part), part);
  assert.ok(!/<text/.test(a), 'Fahne ohne Zahl (kommt als HUD)');
  // Feld um den Rand verschoben und mit TILE / 57 skaliert
  assert.ok(a.includes(`translate(${FRAME_MARGIN} ${FRAME_MARGIN}) scale(${Math.round((TILE / PAINTED_STYLE.unit) * 1e5) / 1e5}`));
});

test('Stil 1: kein Baum, Fels oder Klippenstück auf einer bebaubaren Kachel (Krone höchstens maxOverhang)', () => {
  const s = meadow();
  const sc = buildPaintedScene(s);
  assert.ok(sc.trees.length > 30, 'Rahmenwald vorhanden');
  const buildable = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (canBuild(s, c, r).ok) buildable.push([c, r]);
  for (const t of [...sc.trees, ...sc.rocks]) {
    const box = toGame(t.box);
    const [fx, fy] = [t.x * (TILE / PAINTED_STYLE.unit), t.y * (TILE / PAINTED_STYLE.unit)];
    // Fußpunkt: im Rand oder auf einer Hindernis-Kachel (Fuß sitzt am unteren Kachelrand, darum knapp darüber prüfen)
    if (inField(fx, fy - 1)) assert.ok(s.obstacles.has(`${Math.floor(fx / TILE)},${Math.floor((fy - 1) / TILE)}`), `${t.kind} steht im Feld bei ${fx},${fy}`);
    for (const [c, r] of buildable) assert.ok(depth(box, c, r) <= OVER + 1e-9, `${t.kind} ragt ${depth(box, c, r).toFixed(1)} px in ${c},${r}`);
  }
  assert.ok(sc.cliffs.length >= 1);
  for (const cl of sc.cliffs) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) assert.equal(depth(toGame(cl.box), c, r), 0, `Klippe in ${c},${r}`);
  // Hindernisse bekommen genau ihre Figur
  assert.equal(sc.rocks.length + sc.trees.filter((t) => inField(t.x * TILE / PAINTED_STYLE.unit, t.y * TILE / PAINTED_STYLE.unit - 1)).length, s.obstacles.size);
});

test('Stil 1: Burg, Fahne und Klippen liegen ganz im Rand, Randbäume mit Stamm im Rand', () => {
  const sc = buildPaintedScene(meadow());
  assert.equal(sc.castles.length, 1);
  assert.equal(sc.flags.length, 1);
  for (const el of [...sc.castles, ...sc.flags, ...sc.cliffs]) {
    const [x0, y0, x1, y1] = toGame(el.box);
    assert.ok(x1 <= 0 || x0 >= WIDTH || y1 <= 0 || y0 >= HEIGHT, `${el.kind} ragt ins Feld (${x0},${y0},${x1},${y1})`);
  }
  // Fahne am Eingang (links), Burg am Ausgang (rechts), beide auf Höhe ihres Wegendes
  const s = meadow();
  const [first, last] = [s.path.points[0], s.path.points.at(-1)];
  const flag = toGame(sc.flags[0].box), castle = toGame(sc.castles[0].box);
  assert.ok(flag[2] <= 0 && flag[1] < first.y && flag[3] > first.y - TILE, 'Fahne links am Eingang');
  assert.ok(castle[0] >= WIDTH && castle[1] < last.y && castle[3] > last.y, 'Burg rechts am Ausgang');
  assert.ok(castle[2] <= WIDTH + FRAME_MARGIN && flag[0] >= -FRAME_MARGIN, 'im Canvas');
});

test('Stil 1: Vignette im Feld höchstens 0,15, starke Vignette nur im Rand (Maske spart das Feld aus)', () => {
  const a = buildPaintedSvg(meadow());
  const field = a.match(/<radialGradient id="p-vig-field".*?<\/radialGradient>/)[0];
  const alphas = [...field.matchAll(/stop-opacity="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.ok(alphas.length >= 2 && Math.max(...alphas) <= 0.15, `Feld-Vignette ${alphas}`);
  assert.ok(PAINTED_STYLE.fieldVignette <= 0.15);
  assert.match(a, /id="vignette-frame"[^>]*mask="url\(#p-ring\)"/, 'Rand-Vignette maskiert');
  const mask = a.match(/<mask id="p-ring".*?<\/mask>/)[0];
  const black = mask.match(/<rect x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#000"/);
  assert.ok(black, 'Feld in der Maske schwarz');
  const [x, y, w, h] = black.slice(1).map(Number);
  const U = PAINTED_STYLE.unit;
  assert.ok(x <= 0 && y <= 0 && x + w >= COLS * U && y + h >= ROWS * U, 'Maske deckt das ganze Feld');
});

test('Stil 1: Wasserkacheln der Wiese folgen der gemalten Form (Kachelmitte im Wasser), Malerei ragt höchstens wenig in Bauplätze', () => {
  const s = meadow();
  const bridges = new Set(MAPS.meadow.bridges.map(([c, r]) => `${c},${r}`));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const k = `${c},${r}`;
    const wet = paintedWaterAt('meadow', (c + 0.5) * TILE, (r + 0.5) * TILE);
    assert.equal(wet, s.water.has(k) || bridges.has(k), `Kachel ${k}: gemalt ${wet}, Logik ${s.water.has(k)}`);
    if (!canBuild(s, c, r).ok) continue;
    let n = 0;
    for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) if (paintedWaterAt('meadow', (c + (i + 0.5) / 10) * TILE, (r + (j + 0.5) / 10) * TILE)) n++;
    assert.ok(n <= 35, `Bauplatz ${k} zu ${n} % unter Wasser`);
  }
  // Brücke liegt im Fluss auf dem Weg (Flussmitte kreuzt innerhalb der Brückenkachel)
  const [b] = buildPaintedScene(s).bridges;
  assert.ok(b.horizontal && Math.floor((b.x * TILE) / PAINTED_STYLE.unit / TILE) === 1);
  assert.equal(paintedWaterAt('ice', 60, 60), false, 'andere Karten ohne gemalte Form');
});

test('Stil 1: Blumen-Tupfen nur auf freien Feldkacheln, Szene für andere Karten und fehlende Sets wirft nicht', () => {
  const s = meadow();
  const sc = buildPaintedScene(s);
  assert.ok(sc.flowers.length > 10);
  for (const f of sc.flowers) assert.ok(canBuild(s, f.c, f.r).ok, `Blume auf ${f.c},${f.r}`);
  for (const id of Object.keys(MAPS)) {
    const st = createGame({ mapId: id });
    assert.ok(buildPaintedSvg(st).startsWith('<svg'), id);
    assert.ok(buildPaintedSvg({ mapId: id, path: st.path }).endsWith('</svg>'), `${id} ohne Sets`);
  }
});

test('Stil 1: renderView zeichnet Rand und verschiebt das Feld; in Node bleibt das alte Zeichnen als Rückfall', async () => {
  const { renderView, paintedStatus } = await import('../src/render.js?stil1');
  const calls = [];
  const m = mockCtx();
  const ctx = new Proxy({}, {
    get(_, k) { const v = m.ctx[k]; return typeof v === 'function' ? (...a) => { calls.push([k, ...a]); return v(...a); } : v; },
    set(_, k, v) { m.ctx[k] = v; return true; },
  });
  for (const id of ['meadow', 'ice']) {
    calls.length = 0;
    renderView(ctx, createGame({ mapId: id }), {});
    assert.deepEqual(calls.find((c) => c[0] === 'fillRect'), ['fillRect', 0, 0, VIEW_WIDTH, VIEW_HEIGHT], `${id}: einfacher Rahmen`);
    assert.deepEqual(calls.find((c) => c[0] === 'translate'), ['translate', FRAME_MARGIN, FRAME_MARGIN], `${id}: Feld verschoben`);
    assert.equal(m.depth, 0);
  }
  assert.equal(paintedStatus('meadow'), 'none', 'ohne Image kein Rastern');
  assert.equal(paintedStatus('ice'), 'off');
  assert.equal(MAPS.meadow.theme.painted, true);
  for (const id of Object.keys(MAPS)) if (id !== 'meadow') assert.ok(!MAPS[id].theme?.painted, `${id} vorerst ohne painted`);
});
