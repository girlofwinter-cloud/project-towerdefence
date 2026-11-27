// Browser-Test B-057/B-056: Turm-Panel bei gewähltem Turm ohne Scrollen sichtbar,
// auf dem Handy als feste Leiste am unteren Rand.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { tileCenter, enterGame, build, openRing, openTower } from './tile.mjs';

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

// Testseite (unbegrenztes Gold), Blitzturm (längster Spezialtext) auf Kachel (col,row) über den Bau-Ring bauen und anklicken
async function openWithTower(viewport, col = 0, row = 0) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${url}?test`);
  await page.waitForSelector('#test-panel');
  await build(page, 'lightning', col, row);
  await openTower(page, col, row);
  // Längste Zielregel einstellen (Stärkster)
  await page.keyboard.press('t');
  await page.keyboard.press('t');
  return { ctx, page };
}

// C4: Turm-Ring an den Feldecken (0,0) und (19,13): Name und alle Knöpfe ganz im Fenster, ohne Scrollen
for (const [width, height] of [[1280, 800], [1366, 768]]) {
  for (const [col, row] of [[0, 0], [19, 13]]) {
    test(`Desktop ${width}x${height}: Turm (${col},${row}) gewählt, Turm-Ring ohne Scrollen ganz sichtbar`, async () => {
      const { ctx, page } = await openWithTower({ width, height }, col, row);
      assert.equal(await page.evaluate(() => window.scrollY), 0);
      assert.match(await page.locator('#target-mode').textContent(), /Stärkster/);
      for (const sel of ['#ti-name', '#upgrade', '#sell', '#target-mode', '#ti-close']) {
        assert.ok(await page.locator(sel).isVisible(), `${sel} sichtbar`);
        const r = await page.locator(sel).evaluate((e) => e.getBoundingClientRect().toJSON());
        assert.ok(r.left >= 0 && r.top >= 0 && r.right <= width && r.bottom < height, `${sel} liegt im Fenster: ${JSON.stringify(r)}`);
      }
      await ctx.close();
    });
  }
}

const MIN_TOUCH = 44;
const MIN_CANVAS = 280;

// Schmales Fenster (Kompakt-Ansicht, Turm-Leiste unten): Pfeilturm auf Kachel (0,0) bauen, dritter Klick wählt ihn aus.
// B-137: Handy im Hochformat zeigt nur noch den Drehhinweis; die Leiste bleibt für schmale Fenster ohne Touch (Handy quer: handy.test.mjs).
async function openMobileWithTower(viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(url);
  await enterGame(page);
  await build(page, 'arrow', 0, 0);
  const box = await page.locator('#game').boundingBox();
  const tile = (col, row) => tileCenter(box, col, row);
  await openTower(page, 0, 0);
  return { ctx, page, tile };
}

for (const [width, height] of [[390, 844], [360, 740]]) {
  test(`Schmales Fenster ${width}x${height}: Turm-Leiste unten mit Name, Stufe und Knöpfen im Bild, Feld bleibt sichtbar`, async () => {
    const { ctx, page, tile } = await openMobileWithTower({ width, height });
    assert.match(await page.locator('#ti-name').textContent(), /Pfeilturm · Stufe 1/);
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
    await page.locator('#ti-close').click();
    assert.ok(await page.locator('#tower-info').isHidden());
    assert.equal(await page.evaluate(() => window.__ui.selectedTowerId), null);
    // Wieder wählen, dann Tipp aufs leere Feld schließt ebenfalls
    await page.mouse.click(...tile(0, 0));
    await page.waitForSelector('#tower-info:not([hidden])');
    await page.mouse.click(...tile(1, 4));
    assert.ok(await page.locator('#tower-info').isHidden());
    await ctx.close();
  });
}

// B-056 Nachbesserung: Knopftexte der Leiste brechen nicht ab, Kürzel sind im schmalen Fenster aus,
// zugängliche Namen bleiben vollständig.
for (const [width, height] of [[390, 844], [360, 740]]) {
  test(`Schmales Fenster ${width}x${height}: Knöpfe der Turm-Leiste ohne Überlauf, Kürzel unsichtbar`, async () => {
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

// B-070: Turmknöpfe nutzen die Farben aus SHOP_CARD (die der Kontrast-Test prüft); "zu teuer" sichtbar markiert.
// C4: geprüft im geöffneten Bau-Ring; "aktiv" = Baumodus per Taste (Ring zu).
test('Bau-Ring: Farben aus SHOP_CARD, zu teurer Knopf mit eigenem Rahmen und Preisfarbe', async () => {
  const { SHOP_CARD: C } = await import('../../src/config.js');
  const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(url);
  await enterGame(page);
  await page.evaluate(() => { window.__game().gold = 60; });
  await openRing(page, 0, 0);
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
  assert.equal(await page.locator('.tower-btn[data-type="sniper"]').getAttribute('aria-disabled'), 'true');
  await page.keyboard.press('Escape');
  await page.keyboard.press('3');
  assert.equal((await style('.tower-btn[data-type="frost"]')).bg, rgb(C.bgActive));
  await ctx.close();
});
