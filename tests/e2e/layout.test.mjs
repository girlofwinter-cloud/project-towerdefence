// Browser-Test Stil 1, Block C: Vollbild ohne Scrollen, Bedienflächen nie über dem Feld, Holzleiste, Wellenfahne.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { enterGame } from './tile.mjs';
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
  await enterGame(page);
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
      const boxes = Object.fromEntries(['#hud-bar', '.top-buttons', '#abilities', '#start-wave', '#shop', '.map-pick'].map((s) => {
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
    // C-Abnahme 2/3: Fähigkeiten waagerecht links neben dem Wellenknopf, Kartenwahl oben zwischen Holzleiste und Knöpfen
    const ab = r.boxes['#abilities'], sw = r.boxes['#start-wave'], mp = r.boxes['.map-pick'];
    assert.ok(ab.right - ab.left > ab.bottom - ab.top && ab.right <= sw.left && ab.top >= r.field.bottom, `Fähigkeiten waagerecht unten links: ${JSON.stringify(ab)}`);
    assert.ok(mp.left >= r.boxes['#hud-bar'].right && mp.right <= r.boxes['.top-buttons'].left && mp.bottom <= r.field.top, `Kartenwahl oben: ${JSON.stringify(mp)}`);
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

// C-Abnahme 1: Seitenzonen sind die scharfe Fortsetzung des Bildes; keine Naht an den Canvas-Kanten
for (const [width, height] of [[1280, 800], [1366, 768]]) {
  test(`C-Abnahme 1 ${width}x${height}: keine Naht an der Canvas-Kante (Spaltendifferenz < 12/255), kein Weichzeichner`, async () => {
    const { ctx, page } = await openPage({ width, height });
    await page.waitForFunction(() => window.__painted() === 'ready');
    await page.addStyleTag({ content: '#shop { display: none !important; }' }); // Turmwahl liegt (bis Block D) über der rechten Kante
    await page.waitForTimeout(400);
    const edges = await page.evaluate(() => { const b = document.getElementById('game').getBoundingClientRect(); return [b.left, b.right]; });
    assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('backdrop')).filter), 'none');
    const png = (await page.screenshot()).toString('base64');
    const diffs = await page.evaluate(async ([png, edges]) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      return edges.map((e) => {
        const ex = Math.round(e), a = x.getImageData(ex - 1, 0, 1, c.height).data, b = x.getImageData(ex, 0, 1, c.height).data;
        let s = 0; for (let i = 0; i < a.length; i += 4) s += (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3;
        return s / (a.length / 4);
      });
    }, [png, edges]);
    for (const d of diffs) assert.ok(d < 12, `Spaltendifferenz ${d.toFixed(2)} an ${edges.map(Math.round)}`);
    await ctx.close();
  });
}
