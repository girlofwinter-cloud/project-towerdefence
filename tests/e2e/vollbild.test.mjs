// Browser-Test B-178/B-179: Vollbild-Knopf (Handy-Querformat und Desktop) und Web-App-Manifest mit Symbolen.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { enterGame } from './tile.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

let server, browser, url;

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  url = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.close();
});

const overlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test('B-178 Querformat 844x390: Vollbild-Knopf im Fenster, Tippziel >= 44, überdeckt weder Feld noch andere Knöpfe; schaltet an und aus', async () => {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(url);
  assert.ok(await page.locator('#fullscreen').isVisible(), 'schon auf dem Startbildschirm sichtbar');
  await enterGame(page);
  const fs = await page.locator('#fullscreen').boundingBox();
  assert.ok(fs.width >= 44 && fs.height >= 44, `Tippziel ${fs.width}x${fs.height}`);
  assert.ok(fs.x >= 0 && fs.y >= 0 && fs.x + fs.width <= 844 && fs.y + fs.height <= 390, 'im Fenster');
  assert.ok(!overlap(fs, await page.locator('#game').boundingBox()), 'nicht über dem Feld');
  for (const id of ['#sound', '#speed', '#pause', '#start-wave']) {
    assert.ok(!overlap(fs, await page.locator(id).boundingBox()), `nicht über ${id}`);
  }
  await page.locator('#fullscreen').tap();
  await page.waitForFunction(() => document.fullscreenElement !== null);
  // Knopf wird erst im fullscreenchange-Ereignis umgestellt: darauf warten statt sofort lesen (Wackler in der CI)
  await page.waitForFunction(() => document.getElementById('fullscreen').getAttribute('aria-pressed') === 'true');
  assert.equal(await page.locator('#fullscreen').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#fullscreen-label').textContent(), 'Vollbild beenden');
  await page.locator('#fullscreen').tap();
  await page.waitForFunction(() => document.fullscreenElement === null);
  await page.waitForFunction(() => document.getElementById('fullscreen').getAttribute('aria-pressed') === 'false');
  assert.equal(await page.locator('#fullscreen').getAttribute('aria-pressed'), 'false');
  await ctx.close();
});

test('B-178 Desktop 1440x900: Vollbild-Knopf in der Knopfreihe oben rechts, Ton und Pause bleiben frei', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url);
  await enterGame(page);
  const fs = await page.locator('#fullscreen').boundingBox();
  assert.ok(fs && fs.x + fs.width <= 1440 && fs.y >= 0, 'sichtbar im Fenster');
  for (const id of ['#sound', '#speed', '#pause']) {
    assert.ok(!overlap(fs, await page.locator(id).boundingBox()), `nicht über ${id}`);
  }
  await ctx.close();
});

test('B-179 Web-App: Manifest verlinkt, mit richtigem Typ ausgeliefert, Symbole und iPhone-Angaben vorhanden', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(url);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const res = await page.request.get(new URL(href, url).href);
  assert.equal(res.status(), 200);
  assert.match(res.headers()['content-type'], /application\/manifest\+json/);
  const m = await res.json();
  assert.equal(m.display, 'fullscreen');
  assert.equal(m.orientation, 'landscape');
  const sizes = m.icons.map((i) => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'), 'Symbole 192 und 512');
  const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  for (const src of [...m.icons.map((i) => i.src), touchIcon]) {
    const r = await page.request.get(new URL(src, url).href);
    assert.equal(r.status(), 200, src);
    assert.equal(r.headers()['content-type'], 'image/png', src);
  }
  assert.equal(await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content'), 'yes');
  await ctx.close();
});
