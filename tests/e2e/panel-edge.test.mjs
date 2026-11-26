// Randfälle Turm-Panel B-056/B-057 (Tester): Verkaufen schließt, Wechsel A->B, Fenstergröße,
// Tastatur U/S/T, Spielende mit offener Leiste.
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

// Testseite mit unbegrenztem Gold, Türme auf Kachel (0,0) und (2,0) (B-104: (1,0) ist Fluss)
async function setup(viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${url}?test`);
  await page.waitForSelector('#test-panel');
  // Kachelmitte jedes Mal neu messen (Klick auf eine Karte kann die Seite scrollen)
  const click = async (c, r) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const box = await page.locator('#game').boundingBox();
    const s = box.width / 800;
    await page.mouse.click(box.x + (c + 0.5) * 40 * s, box.y + (r + 0.5) * 40 * s);
  };
  await page.locator('.tower-btn[data-type="arrow"]').click();
  await click(0, 0); await click(0, 0);
  await page.locator('.tower-btn[data-type="frost"]').click();
  await click(2, 0); await click(2, 0);
  await page.keyboard.press('Escape');
  return { ctx, page, click };
}

test('Desktop: Wechsel Turm A zu B, Tastatur T/U/S, Verkaufen schließt das Panel', async () => {
  const { ctx, page, click } = await setup({ width: 1280, height: 800 });
  await click(0, 0);
  await page.waitForSelector('#tower-info:not([hidden])');
  assert.match(await page.locator('#ti-name').textContent(), /Pfeilturm/);
  await click(2, 0);
  assert.match(await page.locator('#ti-name').textContent(), /Stufe 1/);
  assert.doesNotMatch(await page.locator('#ti-name').textContent(), /Pfeilturm/);
  await page.keyboard.press('t');
  assert.match(await page.locator('#target-mode').getAttribute('aria-label'), /^Ziel: /);
  assert.doesNotMatch(await page.locator('#target-mode').getAttribute('aria-label'), /Erster/);
  await page.keyboard.press('u');
  assert.match(await page.locator('#ti-name').textContent(), /Stufe 2/);
  const n = await page.evaluate(() => window.__game().towers.length);
  await page.keyboard.press('s');
  assert.equal(await page.evaluate(() => window.__game().towers.length), n - 1);
  assert.ok(await page.locator('#tower-info').isHidden(), 'Panel nach Verkaufen zu');
  await ctx.close();
});

test('Fenstergröße Desktop -> Handy -> Desktop mit gewähltem Turm: Leiste fest unten, dann wieder unter dem Feld', async () => {
  const { ctx, page, click } = await setup({ width: 1280, height: 800 });
  await click(0, 0);
  await page.waitForSelector('#tower-info:not([hidden])');
  const pos = () => page.locator('#tower-info').evaluate((e) => getComputedStyle(e).position);
  assert.notEqual(await pos(), 'fixed');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await pos(), 'fixed');
  const r = await page.locator('#tower-info').evaluate((e) => e.getBoundingClientRect().toJSON());
  assert.ok(Math.abs(r.bottom - 844) < 1, `Leiste unten bei ${r.bottom}`);
  assert.ok(await page.locator('#ti-close').isVisible());
  await page.setViewportSize({ width: 1280, height: 800 });
  assert.notEqual(await pos(), 'fixed');
  assert.ok(await page.locator('#ti-close').isHidden(), 'Schließen-Knopf am Desktop aus');
  assert.ok((await page.locator('#sell').evaluate((e) => e.getBoundingClientRect().bottom)) < 800);
  await ctx.close();
});

test('Handy: Spielende mit offener Leiste, Neustart-Knopf erreichbar und nicht verdeckt', async () => {
  const { ctx, page, click } = await setup({ width: 390, height: 844 });
  await click(0, 0);
  await page.waitForSelector('#tower-info:not([hidden])');
  await page.evaluate(() => { window.__game().status = 'lost'; });
  await page.waitForSelector('#overlay:not([hidden])');
  const hit = await page.locator('#restart').evaluate((b) => {
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return b.contains(top);
  });
  assert.ok(hit, 'Neustart-Knopf ist von der Leiste verdeckt');
  await page.locator('#restart').click();
  assert.ok(await page.locator('#tower-info').isHidden(), 'Leiste nach Neustart zu');
  await ctx.close();
});
