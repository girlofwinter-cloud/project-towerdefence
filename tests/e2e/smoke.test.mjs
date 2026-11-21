// Browser-Test: startet das Spiel in echtem Chromium und spielt kurz.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { TOWER_TYPES } from '../../src/config.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

let server, browser, page, url;
const errors = [];

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  url = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
});

after(async () => {
  await browser?.close();
  server?.close();
});

test('Seite lädt ohne Fehler', async () => {
  assert.equal(await page.title(), 'Project TowerDefence');
  assert.equal(await page.locator('#shop .tower-btn').count(), Object.keys(TOWER_TYPES).length);
  assert.deepEqual(errors, []);
});

test('Turm bauen per Klick', async () => {
  const goldBefore = await page.evaluate(() => window.__game().gold);
  await page.locator('.tower-btn[data-type="arrow"]').click();
  // Feld (0,0) ist frei: Klick in die Mitte der ersten Kachel
  const box = await page.locator('#game').boundingBox();
  const scale = box.width / 800;
  await page.mouse.click(box.x + 20 * scale, box.y + 20 * scale);
  const s = await page.evaluate(() => ({ gold: window.__game().gold, towers: window.__game().towers.length }));
  assert.equal(s.towers, 1);
  assert.equal(s.gold, goldBefore - 50);
});

test('Fähigkeit Meteor: Q drücken, aufs Feld klicken löst aus', async () => {
  await page.keyboard.press('q');
  assert.equal(await page.evaluate(() => window.__ui.aiming), true);
  const box = await page.locator('#game').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  assert.equal(await page.evaluate(() => window.__ui.aiming), false);
  assert.equal(await page.evaluate(() => window.__game().abilities.meteor.uses), 1);
  assert.equal(await page.locator('#abilities button').count(), 3);
});

test('Welle starten bringt Gegner aufs Feld', async () => {
  await page.locator('#start-wave').click();
  await page.waitForFunction(() => window.__game().enemies.length > 0, null, { timeout: 5000 });
  assert.equal(await page.evaluate(() => window.__game().wave), 1);
  assert.deepEqual(errors, []);
});

test('Handy: Bauen per Touch in zwei Schritten, Zoom vergrößert das Spielfeld', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const m = await ctx.newPage();
  const mErrors = [];
  m.on('pageerror', (e) => mErrors.push(e.message));
  await m.goto(url);
  try {
    await m.locator('.tower-btn[data-type="arrow"]').tap();
    const box = await m.locator('#game').boundingBox();
    const scale = box.width / 800;
    const at = (col, row) => [box.x + (col + 0.5) * 40 * scale, box.y + (row + 0.5) * 40 * scale];
    // Feld (0,0) ist frei. Erster Tipp: nur Vorschau, es wird nichts gebaut.
    await m.touchscreen.tap(...at(0, 0));
    assert.equal(await m.evaluate(() => window.__game().towers.length), 0);
    assert.deepEqual(await m.evaluate(() => ({ c: window.__ui.hover.col, r: window.__ui.hover.row })), { c: 0, r: 0 });
    // Zweiter Tipp auf dieselbe Kachel baut.
    await m.touchscreen.tap(...at(0, 0));
    assert.equal(await m.evaluate(() => window.__game().towers.length), 1);
    // Zoom: Spielfeld wird deutlich breiter als der Bildschirm und liegt in einem scrollbaren Rahmen.
    await m.locator('#zoom').tap();
    const zoomed = await m.locator('#game').boundingBox();
    assert.ok(zoomed.width > box.width * 1.8, `Zoom: ${zoomed.width} statt ${box.width}`);
    assert.deepEqual(mErrors, []);
  } finally {
    await ctx.close();
  }
});
