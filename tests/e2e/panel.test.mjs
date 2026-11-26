// Browser-Test B-057/B-056: Turm-Panel bei gewähltem Turm ohne Scrollen sichtbar,
// auf dem Handy als feste Leiste am unteren Rand.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';

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

// Testseite (unbegrenztes Gold), Blitzturm (längster Spezialtext) auf Kachel (0,0) bauen und anklicken
async function openWithTower(viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${url}?test`);
  await page.waitForSelector('#test-panel');
  await page.locator('.tower-btn[data-type="lightning"]').click();
  const box = await page.locator('#game').boundingBox();
  const at = [box.x + 20 * box.width / 800, box.y + 20 * box.width / 800];
  await page.mouse.click(...at);
  await page.mouse.click(...at);
  await page.waitForSelector('#tower-info:not([hidden])');
  // Längste Zielregel einstellen (Stärkster)
  await page.keyboard.press('t');
  await page.keyboard.press('t');
  return { ctx, page };
}

const bottom = (page, sel) => page.locator(sel).evaluate((e) => e.getBoundingClientRect().bottom);

for (const [width, height] of [[1280, 800], [1366, 768]]) {
  test(`Desktop ${width}x${height}: Turm gewählt, Verkaufen und alle Turmkarten ohne Scrollen sichtbar`, async () => {
    const { ctx, page } = await openWithTower({ width, height });
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    assert.match(await page.locator('#target-mode').textContent(), /Stärkster/);
    for (const sel of ['#ti-name', '#upgrade', '#sell', '#target-mode']) {
      assert.ok(await page.locator(sel).isVisible(), `${sel} sichtbar`);
      const b = await bottom(page, sel);
      assert.ok(b < height, `${sel} endet bei ${b}`);
    }
    const last = await bottom(page, '#shop .tower-btn:last-child');
    assert.ok(last <= height, `Letzter Turm endet bei ${last}`);
    await ctx.close();
  });
}

const MIN_TOUCH = 44;
const MIN_CANVAS = 280;

// Handy: Pfeilturm auf Kachel (0,0) per Touch bauen (zwei Tipps), dritter Tipp wählt ihn aus
async function openMobileWithTower(viewport) {
  const ctx = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForSelector('#shop .tower-btn');
  await page.locator('.tower-btn[data-type="arrow"]').tap();
  const box = await page.locator('#game').boundingBox();
  const s = box.width / 800;
  const tile = (col, row) => [box.x + (col + 0.5) * 40 * s, box.y + (row + 0.5) * 40 * s];
  for (let i = 0; i < 3; i++) await page.touchscreen.tap(...tile(0, 0));
  await page.waitForSelector('#tower-info:not([hidden])');
  return { ctx, page, tile };
}

for (const [width, height] of [[390, 844], [360, 740]]) {
  test(`Handy ${width}x${height}: Turm-Leiste unten mit Name, Stufe und Knöpfen im Bild, Feld bleibt sichtbar`, async () => {
    const { ctx, page, tile } = await openMobileWithTower({ width, height });
    assert.match(await page.locator('#ti-name').textContent(), /Pfeilturm \(Stufe 1\)/);
    assert.ok(await page.locator('#ti-name').isVisible(), 'Turmname sichtbar');
    for (const sel of ['#upgrade', '#sell', '#target-mode', '#ti-close']) {
      const r = await page.locator(sel).evaluate((e) => e.getBoundingClientRect().toJSON());
      assert.ok(r.top >= 0 && r.bottom < height, `${sel} von ${r.top} bis ${r.bottom}`);
      assert.ok(r.height >= MIN_TOUCH, `${sel} Höhe ${r.height}`);
    }
    // Spielfeld: sichtbarer Teil oberhalb der Leiste mindestens 280 px (bzw. ganz, wenn das Feld kleiner ist)
    const vis = await page.evaluate(() => {
      const c = document.querySelector('#game').getBoundingClientRect();
      const top = document.querySelector('#tower-info').getBoundingClientRect().top;
      return { visible: Math.min(c.bottom, top) - Math.max(c.top, 0), full: c.height };
    });
    assert.ok(vis.visible >= Math.min(MIN_CANVAS, vis.full), `Feld sichtbar ${vis.visible} von ${vis.full}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, 'kein horizontaler Scroll');
    // Schließen per ×
    await page.locator('#ti-close').tap();
    assert.ok(await page.locator('#tower-info').isHidden());
    assert.equal(await page.evaluate(() => window.__ui.selectedTowerId), null);
    // Wieder wählen, dann Tipp aufs leere Feld schließt ebenfalls
    await page.touchscreen.tap(...tile(0, 0));
    await page.waitForSelector('#tower-info:not([hidden])');
    await page.touchscreen.tap(...tile(1, 4));
    assert.ok(await page.locator('#tower-info').isHidden());
    await ctx.close();
  });
}
