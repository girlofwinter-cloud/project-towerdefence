// Browser-Test B-057/B-056: Turm-Panel bei gewähltem Turm ohne Scrollen sichtbar,
// auf dem Handy als feste Leiste am unteren Rand.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { tileCenter, enterGame } from './tile.mjs';

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
  const at = tileCenter(box, 0, 0);
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
  await enterGame(page);
  await page.waitForSelector('#shop .tower-btn');
  await page.locator('.tower-btn[data-type="arrow"]').tap();
  const box = await page.locator('#game').boundingBox();
  const tile = (col, row) => tileCenter(box, col, row);
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

// B-056 Nachbesserung: Knopftexte der Leiste brechen nicht ab, Kürzel sind auf dem Handy aus,
// zugängliche Namen bleiben vollständig.
for (const [width, height] of [[390, 844], [360, 740]]) {
  test(`Handy ${width}x${height}: Knöpfe der Turm-Leiste ohne Überlauf, Kürzel unsichtbar`, async () => {
    const { ctx, page } = await openMobileWithTower({ width, height });
    for (const sel of ['#upgrade', '#sell', '#target-mode']) {
      const m = await page.locator(sel).evaluate((e) => ({
        sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight,
        // Kinder dürfen nicht über den Knopf hinausragen
        inside: [...e.querySelectorAll('*')].every((c) => {
          const r = c.getBoundingClientRect(), b = e.getBoundingClientRect();
          return r.width === 0 || (r.left >= b.left - 0.5 && r.right <= b.right + 0.5 && r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5);
        }),
      }));
      assert.ok(m.sw <= m.cw, `${sel} Breite ${m.sw} > ${m.cw}`);
      assert.ok(m.sh <= m.ch, `${sel} Höhe ${m.sh} > ${m.ch}`);
      assert.ok(m.inside, `${sel}: Inhalt ragt heraus`);
      for (const key of await page.locator(`${sel} .key`).all()) assert.ok(await key.isHidden(), `${sel}: Kürzel sichtbar`);
    }
    assert.doesNotMatch(await page.locator('#target-mode').innerText(), /\(T\)/);
    assert.doesNotMatch(await page.locator('#upgrade').innerText(), /[()]/);
    assert.match(await page.locator('#upgrade').getAttribute('aria-label'), /^Verbessern für \d+ Gold/);
    assert.match(await page.locator('#sell').getAttribute('aria-label'), /^Verkaufen für \d+ Gold/);
    assert.match(await page.locator('#target-mode').getAttribute('aria-label'), /^Ziel: Erster/);
    await ctx.close();
  });
}

// B-070: Shop-Karten nutzen die Farben aus SHOP_CARD (die der Kontrast-Test prüft); "zu teuer" sichtbar markiert
test('Shop-Karten: Farben aus SHOP_CARD, zu teure Karte mit eigenem Rahmen und Preisfarbe', async () => {
  const { SHOP_CARD: C } = await import('../../src/config.js');
  const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(url);
  await enterGame(page);
  await page.waitForSelector('#shop .tower-btn');
  await page.evaluate(() => { window.__game().gold = 60; });
  await page.waitForSelector('.tower-btn[data-type="sniper"].poor');
  const style = (sel) => page.locator(sel).evaluate((e) => {
    const s = getComputedStyle(e);
    return { bg: s.backgroundColor, color: s.color, border: s.borderTopColor };
  });
  const card = await style('.tower-btn[data-type="arrow"]');
  assert.equal(card.bg, rgb(C.bg));
  assert.equal(card.color, rgb(C.name));
  assert.equal((await style('.tower-btn[data-type="arrow"] .t-cost')).color, rgb(C.cost));
  assert.equal((await style('.tower-btn[data-type="arrow"] .t-desc')).color, rgb(C.desc));
  const kbd = await style('.tower-btn[data-type="arrow"] kbd');
  assert.deepEqual([kbd.color, kbd.bg], [rgb(C.keyText), rgb(C.keyBg)]);
  assert.equal((await style('.tower-btn[data-type="sniper"]')).border, rgb(C.poorEdge));
  assert.equal((await style('.tower-btn[data-type="sniper"] .t-cost')).color, rgb(C.costPoor));
  await page.locator('.tower-btn[data-type="frost"]').click();
  assert.equal((await style('.tower-btn[data-type="frost"]')).bg, rgb(C.bgActive));
  await ctx.close();
});
