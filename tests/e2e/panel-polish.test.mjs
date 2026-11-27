// Browser-Test B-097: Feinschliff Turm-Panel (Fokus nach ×, Beschriftung, Klammern, Leistenhöhe bei 200 % Schrift,
// gleich hohe Shop-Karten am Desktop).
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { build, openTower } from './tile.mjs';

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
  await page.evaluate(() => window.scrollTo(0, 0));
  await build(page, 'frost', 0, 0);
  await page.keyboard.press('Escape');
  await openTower(page, 0, 0);
  return { ctx, page };
}

// C4: Die Turmkarte, auf die früher der Fokus sprang, liegt jetzt im (geschlossenen) Bau-Ring; × schließt nur.
test('Handy: × heißt "Turm-Panel schließen" und schließt die Leiste', async () => {
  const { ctx, page } = await openWithTower({ width: 390, height: 844 });
  assert.equal(await page.locator('#ti-close').getAttribute('aria-label'), 'Turm-Panel schließen');
  await page.locator('#ti-close').click();
  assert.ok(await page.locator('#tower-info').isHidden());
  assert.equal(await page.evaluate(() => window.__ui.selectedTowerId), null);
  await ctx.close();
});

// C4: Klammern entfallen im Turm-Ring; Münze steht direkt hinter der Zahl (höchstens ein Leerzeichen Abstand)
test('Desktop: Münze direkt nach der Zahl bei Verbessern und Verkaufen', async () => {
  const { ctx, page } = await openWithTower({ width: 1280, height: 800 });
  for (const sel of ['#upgrade', '#sell']) {
    const gap = await page.locator(`${sel} .act-cost`).evaluate((e) => {
      const img = e.querySelector('.ico').getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(e.firstChild);
      return img.left - range.getBoundingClientRect().right;
    });
    assert.ok(gap >= -0.5 && gap <= 6, `${sel}: Abstand Zahl bis Münze ${gap}px`);
  }
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
      const bottoms = ['#game', '#abilities'].map((s) => document.querySelector(s).getBoundingClientRect().bottom);
      return { top: bar.top, bottoms };
    });
    for (const b of r.bottoms) assert.ok(b <= r.top + 0.5, `Inhalt endet bei ${b}, Leiste beginnt bei ${r.top}`);
    await ctx.close();
  });
}
