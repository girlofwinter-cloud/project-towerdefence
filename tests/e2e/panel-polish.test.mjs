// Browser-Test B-097: Feinschliff Turm-Panel (Fokus nach ×, Beschriftung, Klammern, Leistenhöhe bei 200 % Schrift,
// gleich hohe Shop-Karten am Desktop).
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { tileCenter } from './tile.mjs';

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

// Testseite (unbegrenztes Gold), Frostturm auf Kachel (0,0) bauen und anklicken; optional größere Schrift
async function openWithTower(viewport, fontSize) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${url}?test`);
  await page.waitForSelector('#test-panel');
  if (fontSize) await page.addStyleTag({ content: `html { font-size: ${fontSize}; }` });
  await page.locator('.tower-btn[data-type="frost"]').click();
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await page.locator('#game').boundingBox();
  const at = tileCenter(box, 0, 0);
  await page.mouse.click(...at);
  await page.mouse.click(...at);
  await page.keyboard.press('Escape');
  await page.mouse.click(...at);
  await page.waitForSelector('#tower-info:not([hidden])');
  return { ctx, page };
}

test('Handy: × heißt "Turm-Panel schließen", danach liegt der Fokus auf der Karte des Turmtyps', async () => {
  const { ctx, page } = await openWithTower({ width: 390, height: 844 });
  assert.equal(await page.locator('#ti-close').getAttribute('aria-label'), 'Turm-Panel schließen');
  await page.locator('#ti-close').click();
  assert.ok(await page.locator('#tower-info').isHidden());
  assert.equal(await page.evaluate(() => document.activeElement?.dataset?.type), 'frost');
  await ctx.close();
});

test('Desktop: keine Lücke zwischen Münze und schließender Klammer bei Verbessern und Verkaufen', async () => {
  const { ctx, page } = await openWithTower({ width: 1280, height: 800 });
  for (const sel of ['#upgrade', '#sell']) {
    const gap = await page.locator(`${sel} .act-cost`).evaluate((e) => {
      const img = e.querySelector('.ico').getBoundingClientRect();
      const paren = e.querySelectorAll('.paren')[1].getBoundingClientRect();
      return paren.left - img.right;
    });
    assert.ok(gap <= 0, `${sel}: Abstand Münze bis ")" ${gap}px`);
  }
  await ctx.close();
});

test('Desktop 1280x800: alle Shop-Karten gleich hoch, Scharfschütze einzeilig, alle ohne Scrollen sichtbar', async () => {
  const { ctx, page } = await openWithTower({ width: 1280, height: 800 });
  const hs = await page.$$eval('.tower-btn', (bs) => bs.map((b) => b.getBoundingClientRect().height));
  assert.ok(Math.max(...hs) - Math.min(...hs) < 1, `Kartenhöhen ${hs.join(', ')}`);
  const name = await page.locator('.tower-btn[data-type="sniper"] .t-name').evaluate((e) => e.getClientRects().length === 1 && e.getBoundingClientRect().height);
  const kbd = await page.locator('.tower-btn[data-type="sniper"] kbd').evaluate((e) => e.getBoundingClientRect().height);
  assert.ok(name && name < kbd * 2, `Name ${name}px hoch`);
  const last = await page.locator('#shop .tower-btn:last-child').evaluate((e) => e.getBoundingClientRect().bottom);
  assert.ok(last <= 800, `Letzte Karte endet bei ${last}`);
  await ctx.close();
});

for (const fontSize of [null, '200%']) {
  test(`Handy 390x844${fontSize ? ' mit 200 % Schrift' : ''}: ganz unten verdeckt die Leiste keinen Inhalt`, async () => {
    const { ctx, page } = await openWithTower({ width: 390, height: 844 }, fontSize);
    // ResizeObserver setzt die Höhe vor dem nächsten Bild, danach ganz nach unten scrollen
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const r = await page.evaluate(() => {
      const bar = document.getElementById('tower-info').getBoundingClientRect();
      const bottoms = ['#game', '#shop', '#shop .tower-btn:last-child'].map((s) => document.querySelector(s).getBoundingClientRect().bottom);
      return { top: bar.top, bottoms };
    });
    for (const b of r.bottoms) assert.ok(b <= r.top + 0.5, `Inhalt endet bei ${b}, Leiste beginnt bei ${r.top}`);
    await ctx.close();
  });
}
