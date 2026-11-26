// Browser-Test der Testseite (test.html bzw. ?test): Panel, Karte/Welle wählen, Gold, kein Speichern.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { TEST_TOOLS, PROGRESS_KEY } from '../../src/config.js';

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
});

after(async () => {
  await browser?.close();
  server?.close();
});

test('Normale Seite hat kein Test-Panel', async () => {
  await page.goto(url);
  await page.waitForSelector('#shop .tower-btn');
  assert.equal(await page.locator('#test-panel').count(), 0);
});

test('test.html leitet auf die Testseite, Panel da, Gold unbegrenzt', async () => {
  await page.goto(`${url}test.html`);
  await page.waitForSelector('#test-panel');
  assert.ok(page.url().endsWith('/?test'));
  await page.waitForFunction((g) => window.__game().gold >= g, TEST_TOOLS.gold);
  assert.deepEqual(errors, []);
});

test('Testseite: gesperrte Karte und Welle 15 wählen, Start ist Welle 15', async () => {
  await page.selectOption('#tp-map', 'fork');
  await page.fill('#tp-wave', '15');
  // Tippen im Panel darf keine Spiel-Taste auslösen (5 = Turm wählen)
  await page.press('#tp-wave', '5');
  assert.equal(await page.evaluate(() => window.__ui.buildType), null);
  await page.fill('#tp-wave', '15');
  await page.click('#tp-new');
  assert.deepEqual(await page.evaluate(() => [window.__game().mapId, window.__game().wave]), ['fork', 14]);
  await page.click('#start-wave');
  assert.equal(await page.evaluate(() => window.__game().wave), 15);
  await page.click('#tp-speeds button[data-speed="10"]');
  assert.equal(await page.evaluate(() => window.__ui.speed), 10);
});

test('Testseite: Sieg erzwingen zeigt Overlay und lässt echten Fortschritt unverändert', async () => {
  // Vorhandener echter Fortschritt darf durch die Testseite weder überschrieben noch gelöscht werden.
  const real = JSON.stringify({ maps: { meadow: { bestWave: 7, stars: 0 } } });
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [PROGRESS_KEY, real]);
  await page.click('#tp-win');
  await page.waitForSelector('#overlay:not([hidden])');
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), PROGRESS_KEY), real);
  assert.deepEqual(errors, []);
});

test('Testseite: nach Spielende weiterspielen, Overlay verschwindet', async () => {
  await page.fill('#tp-wave', '4');
  await page.click('#tp-jump');
  await page.waitForSelector('#overlay', { state: 'hidden' });
  assert.deepEqual(await page.evaluate(() => [window.__game().status, window.__game().wave]), ['playing', 3]);
  assert.equal(await page.locator('#overlay-progress').textContent(), '');
});

test('Testseite Desktop 1280x800: Panel unter dem Spielfeld, alle Turm-Buttons ohne Scrollen sichtbar', async () => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${url}?test`);
  await page.waitForSelector('#test-panel');
  assert.equal(await page.locator('.board #test-panel').count(), 1);
  const btns = page.locator('#shop .tower-btn');
  const box = await btns.nth((await btns.count()) - 1).boundingBox();
  assert.ok(box.y + box.height <= 800, `Letzter Turm endet bei ${box.y + box.height}`);
});
