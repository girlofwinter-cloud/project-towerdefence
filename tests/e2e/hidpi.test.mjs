// Browser-Test HiDPI (C1): Canvas mit Pixeldichte 2 scharf, Klicks treffen die richtige Kachel.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { COLS, ROWS, VIEW_WIDTH, VIEW_HEIGHT } from '../../src/config.js';
import { tileCenter } from './tile.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

let server, browser, page;
const errors = [];

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`http://localhost:${server.address().port}/?test`);
  await page.waitForFunction(() => window.__painted && window.__painted() === 'ready');
});

after(async () => {
  await browser?.close();
  server?.close();
});

const canvasInfo = () => page.evaluate(() => {
  const c = document.getElementById('game');
  const t = c.getContext('2d').getTransform();
  return { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight, a: t.a, d: t.d };
});

test('HiDPI: Backing-Store = 2 x CSS-Größe, Transformation füllt ihn, Seitenverhältnis bleibt', async () => {
  const c = await canvasInfo();
  assert.equal(c.w, c.cw * 2);
  assert.ok(Math.abs(c.h - c.ch * 2) <= 2, `Höhe ${c.h} vs. ${c.ch}`);
  assert.ok(Math.abs(c.a * VIEW_WIDTH - c.w) < 0.5 && Math.abs(c.d * VIEW_HEIGHT - c.h) < 0.5);
  assert.ok(Math.abs(c.cw / c.ch - VIEW_WIDTH / VIEW_HEIGHT) < 0.01, 'keine Verzerrung');
  assert.ok(c.cw > 800, `breites Layout nutzt den Platz (${c.cw} px)`);
  const bottom = await page.evaluate(() => document.getElementById('game').getBoundingClientRect().bottom);
  assert.ok(bottom <= 800, `Canvas passt in die Fensterhöhe (${bottom})`);
  assert.deepEqual(errors, []);
});

test('HiDPI: Klick baut auf den Ecken-Kacheln (0,0) und (19,13)', async () => {
  await page.evaluate(() => { window.__game().gold = 9999; });
  const box = await page.locator('#game').boundingBox();
  const inner = await page.evaluate(() => { const c = document.getElementById('game'); return { b: (c.offsetWidth - c.clientWidth) / 2 }; });
  const content = { x: box.x + inner.b, y: box.y + inner.b, width: box.width - 2 * inner.b };
  for (const [col, row] of [[0, 0], [COLS - 1, ROWS - 1]]) {
    const free = await page.evaluate(async ([c, r]) => (await import('/src/game.js')).canBuild(window.__game(), c, r), [col, row]);
    assert.ok(free, `Kachel ${col},${row} frei`);
    await page.evaluate(() => { window.__ui.buildType = 'arrow'; window.__ui.selectedTowerId = null; });
    await page.mouse.click(...tileCenter(content, col, row));
    const hit = await page.evaluate(([c, r]) => window.__game().towers.some((t) => t.col === c && t.row === r), [col, row]);
    assert.ok(hit, `Turm auf ${col},${row}`);
  }
});

test('HiDPI: Fenstergröße ändern passt Canvas und Backing-Store an', async () => {
  await page.setViewportSize({ width: 1200, height: 700 });
  await page.waitForTimeout(200);
  const c = await canvasInfo();
  assert.equal(c.w, c.cw * 2);
  assert.ok(Math.abs(c.a * VIEW_WIDTH - c.w) < 0.5);
  const bottom = await page.evaluate(() => document.getElementById('game').getBoundingClientRect().bottom);
  assert.ok(bottom <= 700, `Canvas passt in die Fensterhöhe (${bottom})`);
  assert.deepEqual(errors, []);
});
