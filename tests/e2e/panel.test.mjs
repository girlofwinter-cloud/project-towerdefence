// Browser-Test B-057: Turm-Panel bei gewähltem Turm ohne Scrollen sichtbar.
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
