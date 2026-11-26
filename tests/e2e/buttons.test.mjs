// Browser-Test B-058: Knopfhöhen (Touch-Ziel >= 44 px), Tastenkürzel auf dem Handy ausgeblendet,
// zugänglicher Name der Fähigkeitsknöpfe. Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const MIN_TOUCH = 44;
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

async function openPage(viewport, mobile) {
  const ctx = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForSelector('#abilities .ability-btn');
  return { ctx, page };
}

// Höhen aller sichtbaren Knöpfe einer Auswahl
const heights = (page, sel) => page.$$eval(sel, (els) => els
  .filter((e) => e.offsetParent !== null).map((e) => e.getBoundingClientRect().height));

test('Handy 390x844: Fähigkeits-, Zoom-, Pause- und Tempo-Knopf >= 44 px, keine Tastenkürzel sichtbar', async () => {
  const { ctx, page } = await openPage({ width: 390, height: 844 }, true);
  const hs = await heights(page, '.abilities button, #zoom, #pause, #speed');
  assert.equal(hs.length, 6, 'drei Fähigkeiten plus Zoom, Pause, Tempo sichtbar');
  for (const h of hs) assert.ok(h >= MIN_TOUCH, `Knopfhöhe ${h} >= ${MIN_TOUCH}`);
  const visibleKeys = await page.$$eval('.key', (els) => els.filter((e) => e.offsetParent !== null).length);
  assert.equal(visibleKeys, 0, 'Tastenkürzel ausgeblendet');
  assert.equal(await page.locator('.ability-btn[data-ability="meteor"]').getAttribute('aria-label'), 'Meteor, bereit');
  await ctx.close();
});

test('Desktop 1280x800: Fähigkeitsknöpfe kompakt (44-60 px), Tastenkürzel sichtbar', async () => {
  const { ctx, page } = await openPage({ width: 1280, height: 800 }, false);
  const hs = await heights(page, '.abilities button');
  assert.equal(hs.length, 3);
  for (const h of hs) assert.ok(h >= MIN_TOUCH && h <= 60, `Knopfhöhe ${h} zwischen ${MIN_TOUCH} und 60`);
  assert.ok(await page.locator('.ability-btn[data-ability="meteor"] .key').isVisible(), 'Kürzel Q sichtbar');
  // Nach dem Auslösen: Ladezustand im zugänglichen Namen und am Knopf
  await page.keyboard.press('q');
  const box = await page.locator('#game').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const btn = page.locator('.ability-btn[data-ability="meteor"]');
  await page.waitForFunction(() => document.querySelector('.ability-btn[data-ability="meteor"]').dataset.state === 'charging');
  assert.match(await btn.getAttribute('aria-label'), /^Meteor, lädt noch \d+ s$/);
  await ctx.close();
});
