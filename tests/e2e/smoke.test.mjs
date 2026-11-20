// Browser-Test: startet das Spiel in echtem Chromium und spielt kurz.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';

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
  assert.equal(await page.locator('#shop .tower-btn').count(), 4);
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

test('Welle starten bringt Gegner aufs Feld', async () => {
  await page.locator('#start-wave').click();
  await page.waitForFunction(() => window.__game().enemies.length > 0, null, { timeout: 5000 });
  assert.equal(await page.evaluate(() => window.__game().wave), 1);
  assert.deepEqual(errors, []);
});
