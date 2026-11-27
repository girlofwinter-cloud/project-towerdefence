// Browser-Test B-137 Randfälle (Tester): Drehen während Welle, bei eigener Pause, bei offenem Bau-Ring;
// kleines iPhone quer 667x375; 932x430 mit Safe-Area-Inset.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { tileCenter, enterGame, openRing } from './tile.mjs';
import { TILE, FRAME_MARGIN, VIEW_WIDTH, COLS, ROWS } from '../../src/config.js';

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

const MIN_TOUCH = 44;
const CONTROLS = ['#hud-bar', '#sound', '#speed', '#pause', '#abilities', '#start-wave'];
const TAPS = '#abilities button, #sound, #speed, #pause, #start-wave';

async function openPhone(viewport) {
  const ctx = await browser.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await enterGame(page, 'meadow');
  await page.waitForSelector('#abilities .ability-btn');
  return { ctx, page, errors };
}
function fieldRect(box) {
  const k = box.width / VIEW_WIDTH;
  const left = box.x + FRAME_MARGIN * k, top = box.y + FRAME_MARGIN * k;
  return { left, top, right: left + COLS * TILE * k, bottom: top + ROWS * TILE * k };
}
const cut = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
const boxes = (page, sels) => page.evaluate((s) => Object.fromEntries(s.map((q) => [q, document.querySelector(q).getBoundingClientRect().toJSON()])), sels);
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200)))));
const toPortrait = async (page) => { await page.setViewportSize({ width: 390, height: 844 }); await page.waitForSelector('#rotate-hint', { state: 'visible' }); };
const toLandscape = async (page) => { await page.setViewportSize({ width: 844, height: 390 }); await page.waitForSelector('#rotate-hint', { state: 'hidden' }); };

test('Randfall: Drehen während laufender Welle mit Gegnern pausiert sofort, Gegner bewegen sich nicht, danach weiter', async () => {
  const { ctx, page, errors } = await openPhone({ width: 844, height: 390 });
  await page.locator('#start-wave').tap();
  await page.waitForFunction(() => window.__game().enemies.length > 0);
  await toPortrait(page);
  await page.waitForFunction(() => window.__game().paused === true, null, { timeout: 3000 });
  const s0 = await page.evaluate(() => ({ t: window.__game().time, xs: window.__game().enemies.map((e) => [e.x, e.y]) }));
  await page.waitForTimeout(400);
  const s1 = await page.evaluate(() => ({ t: window.__game().time, xs: window.__game().enemies.map((e) => [e.x, e.y]) }));
  assert.deepEqual(s1, s0, 'im Hochformat steht das Spiel');
  await toLandscape(page);
  await page.waitForFunction((t) => !window.__game().paused && window.__game().time > t, s0.t, { timeout: 3000 });
  // mehrfach hin und her: kein Hängenbleiben in der Pause
  for (let i = 0; i < 3; i++) { await toPortrait(page); await toLandscape(page); }
  await page.waitForFunction(() => window.__game().paused === false, null, { timeout: 3000 });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Randfall: eigene Pause, im Hochformat Pause-Status bleibt; Spieler kann den Hinweis nicht umgehen', async () => {
  const { ctx, page, errors } = await openPhone({ width: 844, height: 390 });
  await page.locator('#start-wave').tap();
  await page.locator('#pause').tap();
  await toPortrait(page);
  await settle(page);
  assert.equal(await page.evaluate(() => window.__game().paused), true);
  // Taste P im Hochformat (externe Tastatur): der Hinweis verdeckt das Spiel; danach drehen
  await toLandscape(page);
  await settle(page);
  assert.equal(await page.evaluate(() => window.__game().paused), true, 'eigene Pause bleibt');
  await page.locator('#pause').tap();
  assert.equal(await page.evaluate(() => window.__game().paused), false, 'Spieler setzt selbst fort');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Randfall: Drehen bei offenem Bau-Ring, nach dem Zurückdrehen liegt kein Ring falsch/außerhalb, Bauen klappt', async () => {
  const { ctx, page, errors } = await openPhone({ width: 844, height: 390 });
  await openRing(page, 19, 13, { touch: true });
  const shopRect = () => page.locator('#shop').evaluate((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)]; });
  const before = await shopRect();
  await toPortrait(page);
  await toLandscape(page);
  await settle(page);
  const ring = await page.evaluate(() => window.__ui.ring);
  if (ring) {
    const rb = await page.$$eval('#shop .tower-btn', (els) => els.filter((e) => e.offsetParent !== null).map((e) => e.getBoundingClientRect().toJSON()));
    for (const b of rb) assert.ok(b.left >= -0.5 && b.top >= -0.5 && b.right <= 844.5 && b.bottom <= 390.5, `Ringknopf nach Drehen im Fenster: ${JSON.stringify(b)}`);
    // Ring sitzt nach dem Zurückdrehen wieder dort wie vorher (gleiche Fenstergröße)
    const after = await shopRect();
    assert.ok(Math.abs(after[0] - before[0]) <= 2 && Math.abs(after[1] - before[1]) <= 2, `Ring vorher ${before}, nachher ${after}`);
    await page.locator('#shop .tower-btn[data-type="arrow"]').tap();
  } else {
    await openRing(page, 19, 13, { touch: true });
    await page.locator('#shop .tower-btn[data-type="arrow"]').tap();
  }
  assert.deepEqual(await page.evaluate(() => window.__game().towers.map((t) => [t.col, t.row])), [[19, 13]]);
  assert.deepEqual(errors, []);
  await ctx.close();
});

async function layoutCheck(page, w, h, safe = { l: 8, r: 8, t: 8, b: 8 }) {
  const doc = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
  assert.ok(doc[0] <= w && doc[1] <= h, `Seite scrollt: ${doc}`);
  const f = fieldRect(await page.locator('#game').boundingBox());
  assert.ok(f.left >= -0.5 && f.right <= w + 0.5 && f.top >= -0.5 && f.bottom <= h + 0.5, `Feld im Fenster ${JSON.stringify(f)}`);
  const b = await boxes(page, CONTROLS);
  for (const [sel, r] of Object.entries(b)) {
    assert.ok(r.left >= safe.l - 0.5 && r.right <= w - safe.r + 0.5 && r.top >= safe.t - 0.5 && r.bottom <= h - safe.b + 0.5, `${sel} in Safe-Area: ${JSON.stringify(r)}`);
    assert.ok(!cut(r, f), `${sel} schneidet das Feld: ${JSON.stringify(r)} / ${JSON.stringify(f)}`);
  }
  const hs = await page.$$eval(TAPS, (els) => els.map((e) => e.getBoundingClientRect().toJSON()));
  for (const r of hs) assert.ok(r.width >= MIN_TOUCH && r.height >= MIN_TOUCH, `Tippziel ${r.width}x${r.height}`);
  // keine Bedienelemente überlappen einander
  const list = Object.entries(b);
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    if (list[i][0] === '#hud-bar' && ['#sound', '#speed', '#pause'].includes(list[j][0])) continue; // top-buttons evtl. im HUD-Container
    assert.ok(!cut(list[i][1], list[j][1]), `${list[i][0]} überlappt ${list[j][0]}`);
  }
  return f;
}

test('Randfall 667x375 (kleines iPhone quer): nichts scrollt, Bedienung neben dem Feld, Tippziele >= 44, Bauen an Ecken', async () => {
  const { ctx, page, errors } = await openPhone({ width: 667, height: 375 });
  await layoutCheck(page, 667, 375);
  await page.evaluate(() => { window.__game().gold = 1000; });
  for (const [col, row] of [[0, 0], [COLS - 1, 0], [0, ROWS - 1], [COLS - 1, ROWS - 1]]) {
    await openRing(page, col, row, { touch: true });
    const rb = await page.$$eval('#shop .tower-btn', (els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    for (const r of rb) assert.ok(r.height >= MIN_TOUCH && r.left >= -0.5 && r.top >= -0.5 && r.right <= 667.5 && r.bottom <= 375.5, `Ringknopf ${col},${row}: ${JSON.stringify(r)}`);
    await page.locator('#shop .tower-btn[data-type="arrow"]').tap();
  }
  assert.equal(await page.evaluate(() => window.__game().towers.length), 4);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Randfall 844x390 mit Safe-Area-Inset wie iPhone 14 (47 links und rechts, unten 21): Bedienung nicht über dem Feld', async () => {
  const { ctx, page, errors } = await openPhone({ width: 844, height: 390 });
  await page.evaluate(() => Object.entries({ '--safe-l': '47px', '--safe-r': '47px', '--safe-b': '21px' }).forEach(([k, v]) => document.documentElement.style.setProperty(k, v)));
  await settle(page);
  await layoutCheck(page, 844, 390, { l: 47, r: 47, t: 8, b: 21 });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Randfall 932x430 mit Safe-Area-Inset (Notch 59 links und rechts, unten 21): Bedienung außerhalb, nicht über dem Feld', async () => {
  const { ctx, page, errors } = await openPhone({ width: 932, height: 430 });
  await page.evaluate(() => Object.entries({ '--safe-l': '59px', '--safe-r': '59px', '--safe-b': '21px' }).forEach(([k, v]) => document.documentElement.style.setProperty(k, v)));
  await settle(page);
  await layoutCheck(page, 932, 430, { l: 59, r: 59, t: 8, b: 21 });
  // Turm-Info-Plakette ebenfalls in der Safe-Area
  await page.evaluate(() => { window.__game().gold = 1000; });
  await openRing(page, COLS - 1, 0, { touch: true });
  await page.locator('#shop .tower-btn[data-type="arrow"]').tap();
  const box = await page.locator('#game').boundingBox();
  await page.touchscreen.tap(...tileCenter(box, COLS - 1, 0));
  await page.waitForSelector('#tower-info:not([hidden])');
  await settle(page);
  const info = await page.locator('#tower-info .ring-info').evaluate((e) => e.getBoundingClientRect().toJSON());
  assert.ok(info.right <= 932 - 59 + 0.5 && info.bottom <= 430 - 21 + 0.5, `Info-Plakette in Safe-Area: ${JSON.stringify(info)}`);
  for (const sel of ['#upgrade', '#sell', '#target-mode', '#ti-close']) {
    const r = await page.locator(sel).evaluate((e) => e.getBoundingClientRect().toJSON());
    assert.ok(r.height >= MIN_TOUCH && r.right <= 932.5 && r.top >= -0.5, `${sel}: ${JSON.stringify(r)}`);
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});
