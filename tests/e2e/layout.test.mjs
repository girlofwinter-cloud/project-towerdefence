// Browser-Test Stil 1, Block C: Vollbild ohne Scrollen, Bedienflächen nie über dem Feld, Holzleiste, Wellenfahne.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { TILE, FRAME_MARGIN, VIEW_WIDTH, PAINTED_STYLE } from '../../src/config.js';
import { createGame } from '../../src/game.js';
import { flagBoxes } from '../../src/render.js';

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

async function openPage(viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.waitForSelector('#abilities .ability-btn');
  return { ctx, page, errors };
}

for (const [width, height] of [[1280, 800], [1366, 768], [1440, 900]]) {
  test(`C1 Vollbild ${width}x${height}: kein Scrollen, Bedienflächen im Fenster und neben dem Feld`, async () => {
    const { ctx, page, errors } = await openPage({ width, height });
    const r = await page.evaluate(([frame, view]) => {
      const c = document.getElementById('game').getBoundingClientRect();
      const inset = c.width * frame / view; // Feld = Canvas-Box, je Seite um den Rand eingerückt
      const field = { left: c.left + inset, top: c.top + inset, right: c.right - inset, bottom: c.bottom - inset };
      const boxes = Object.fromEntries(['#hud-bar', '.top-buttons', '#abilities', '#start-wave', '#shop'].map((s) => {
        const b = document.querySelector(s).getBoundingClientRect();
        return [s, { left: b.left, top: b.top, right: b.right, bottom: b.bottom }];
      }));
      return { scrollH: document.documentElement.scrollHeight, scrollW: document.documentElement.scrollWidth, field, boxes };
    }, [FRAME_MARGIN, VIEW_WIDTH]);
    assert.ok(r.scrollH <= height, `scrollHeight ${r.scrollH} > ${height}`);
    assert.ok(r.scrollW <= width, `scrollWidth ${r.scrollW} > ${width}`);
    for (const [sel, b] of Object.entries(r.boxes)) {
      assert.ok(b.left >= 0 && b.top >= 0 && b.right <= width && b.bottom <= height, `${sel} liegt im Fenster: ${JSON.stringify(b)}`);
      const f = r.field;
      const overlaps = b.left < f.right && b.right > f.left && b.top < f.bottom && b.bottom > f.top;
      assert.ok(!overlaps, `${sel} schneidet das Feld: ${JSON.stringify(b)} / ${JSON.stringify(f)}`);
    }
    assert.ok(r.boxes['#start-wave'].top >= r.field.bottom, 'Wellenknopf unter der Feldunterkante');
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('C2 Holzleiste: Gold mit Tausenderpunkt, Welle mit Gesamtzahl, Schrift Lilita geladen', async () => {
  const { ctx, page } = await openPage({ width: 1280, height: 800 });
  await page.evaluate(() => { window.__game().gold = 1240; });
  await page.waitForFunction(() => document.getElementById('gold').textContent === '1.240');
  assert.match(await page.locator('#wave').innerText(), /^0\s*\/\s*20$/);
  assert.ok(await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('28px "Lilita One"'); }));
  await ctx.close();
});

test('G5 Wellenfahne: Klick auf die Fahne im Rand startet Welle 1', async () => {
  const { ctx, page } = await openPage({ width: 1280, height: 800 });
  const mapId = await page.evaluate(() => window.__game().mapId);
  const [fl] = flagBoxes(createGame({ mapId }));
  const k = TILE / PAINTED_STYLE.unit;
  const cx = FRAME_MARGIN + ((fl.box[0] + fl.box[2]) / 2) * k;
  const cy = FRAME_MARGIN + ((fl.box[1] + fl.box[3]) / 2) * k;
  const box = await page.locator('#game').boundingBox();
  const s = box.width / VIEW_WIDTH;
  assert.equal(await page.evaluate(() => window.__game().wave), 0);
  await page.mouse.move(box.x + cx * s, box.y + cy * s);
  assert.equal(await page.evaluate(() => document.getElementById('game').classList.contains('over-flag')), true, 'Hand-Zeiger über der Fahne');
  await page.mouse.click(box.x + cx * s, box.y + cy * s);
  assert.equal(await page.evaluate(() => window.__game().wave), 1);
  await ctx.close();
});
