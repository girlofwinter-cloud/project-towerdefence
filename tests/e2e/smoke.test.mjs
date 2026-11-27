// Browser-Test: startet das Spiel in echtem Chromium und spielt kurz.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { TOWER_TYPES, VIEW_WIDTH, VIEW_HEIGHT } from '../../src/config.js';
import { tileCenter, enterGame } from './tile.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

let server, browser, page, url;
const errors = [];

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  url = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await enterGame(page);
});

after(async () => {
  await browser?.close();
  server?.close();
});

test('Seite lädt ohne Fehler', async () => {
  assert.equal(await page.title(), 'Project TowerDefence');
  assert.equal(await page.locator('#shop .tower-btn').count(), Object.keys(TOWER_TYPES).length);
  assert.deepEqual(errors, []);
});

test('Desktop 1280x800: alle Turm-Buttons ohne Scrollen sichtbar', async () => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const btns = page.locator('#shop .tower-btn');
  const n = await btns.count();
  for (let i = 0; i < n; i++) assert.equal(await btns.nth(i).isVisible(), true);
  const box = await btns.nth(n - 1).boundingBox();
  assert.ok(box.y + box.height <= 800, `Letzter Turm endet bei ${box.y + box.height}`);
});

test('Turm bauen per Klick', async () => {
  const goldBefore = await page.evaluate(() => window.__game().gold);
  await page.locator('.tower-btn[data-type="arrow"]').click();
  // Feld (0,0) ist frei: Klick in die Mitte der ersten Kachel
  const box = await page.locator('#game').boundingBox();
  await page.mouse.click(...tileCenter(box, 0, 0));
  const s = await page.evaluate(() => ({ gold: window.__game().gold, towers: window.__game().towers.length }));
  assert.equal(s.towers, 1);
  assert.equal(s.gold, goldBefore - 50);
});

test('Fähigkeit Meteor: Q drücken, aufs Feld klicken löst aus', async () => {
  await page.keyboard.press('q');
  assert.equal(await page.evaluate(() => window.__ui.aiming), true);
  const box = await page.locator('#game').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  assert.equal(await page.evaluate(() => window.__ui.aiming), false);
  assert.equal(await page.evaluate(() => window.__game().abilities.meteor.uses), 1);
  assert.equal(await page.locator('#abilities button').count(), 3);
});

test('Welle starten bringt Gegner aufs Feld', async () => {
  await page.locator('#start-wave').click();
  await page.waitForFunction(() => window.__game().enemies.length > 0, null, { timeout: 5000 });
  assert.equal(await page.evaluate(() => window.__game().wave), 1);
  assert.deepEqual(errors, []);
});

test('B-005: Leertaste startet früh, gehaltene Taste (Wiederholung) startet nicht mehrfach', async () => {
  const before = await page.evaluate(() => window.__game().wave);
  // Solange Gegner der laufenden Welle noch kommen: Knopf aus, Leertaste wirkungslos
  assert.equal(await page.locator('#start-wave').isDisabled(), true);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })));
  assert.equal(await page.evaluate(() => window.__game().wave), before);
  await page.evaluate(() => { window.__game().spawnQueue = []; });
  await page.waitForFunction(() => /^Nächste Welle \+\d+$/.test(document.getElementById('start-label').textContent), null, { timeout: 5000 });
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    for (let i = 0; i < 5; i++) window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true }));
  });
  assert.equal(await page.evaluate(() => window.__game().wave), before + 1);
  // Neue Welle spawnt: Knopf wieder aus bis zum vollständigen Spawn
  assert.equal(await page.locator('#start-label').textContent(), 'Welle läuft…');
  assert.deepEqual(errors, []);
});

test('Handy: Bauen per Touch in zwei Schritten, Zoom vergrößert das Spielfeld', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const m = await ctx.newPage();
  const mErrors = [];
  m.on('pageerror', (e) => mErrors.push(e.message));
  await m.goto(url);
  await enterGame(m);
  try {
    await m.locator('.tower-btn[data-type="arrow"]').tap();
    const box = await m.locator('#game').boundingBox();
    const at = (col, row) => tileCenter(box, col, row);
    // Feld (0,0) ist frei. Erster Tipp: nur Vorschau, es wird nichts gebaut.
    await m.touchscreen.tap(...at(0, 0));
    assert.equal(await m.evaluate(() => window.__game().towers.length), 0);
    assert.deepEqual(await m.evaluate(() => ({ c: window.__ui.hover.col, r: window.__ui.hover.row })), { c: 0, r: 0 });
    // Zweiter Tipp auf dieselbe Kachel baut.
    await m.touchscreen.tap(...at(0, 0));
    assert.equal(await m.evaluate(() => window.__game().towers.length), 1);
    // Zoom: Spielfeld wird deutlich breiter als der Bildschirm und liegt in einem scrollbaren Rahmen.
    await m.locator('#zoom').tap();
    const zoomed = await m.locator('#game').boundingBox();
    assert.ok(zoomed.width > box.width * 1.8, `Zoom: ${zoomed.width} statt ${box.width}`);
    assert.deepEqual(mErrors, []);
  } finally {
    await ctx.close();
  }
});

test('Stil 1: gemalter Hintergrund wird gerastert; Klick in den Rand baut nichts, Randkachel Spalte 0 bleibt bebaubar', async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pErrors = [];
  p.on('pageerror', (e) => pErrors.push(e.message));
  try {
    await p.goto(`${url}?test`);
    await p.waitForFunction(() => window.__painted() === 'ready', null, { timeout: 10000 });
    // HiDPI (C1): Backing-Store = Anzeigegröße x Pixeldichte (hier 1), Seitenverhältnis VIEW_WIDTH:VIEW_HEIGHT
    const cv = await p.evaluate(() => { const c = document.getElementById('game'); return [c.width, c.height, c.clientWidth, c.clientHeight]; });
    assert.equal(cv[0], cv[2]);
    assert.ok(Math.abs(cv[1] - cv[3]) <= 1 && Math.abs(cv[0] / cv[1] - VIEW_WIDTH / VIEW_HEIGHT) < 0.01, `Canvas ${cv.join(' x ')}`);
    await p.locator('.tower-btn[data-type="arrow"]').click();
    const box = await p.locator('#game').boundingBox();
    // Rand links neben Kachel (0,5) und Rand oben über Kachel (6,0): kein Turm, keine Fehlermeldung
    const [x0, y5] = tileCenter(box, 0, 5);
    await p.mouse.click(box.x + 10 * (box.width / VIEW_WIDTH), y5);
    const [x6, y0] = tileCenter(box, 6, 0);
    await p.mouse.click(x6, box.y + 10 * (box.width / VIEW_WIDTH));
    assert.equal(await p.evaluate(() => window.__game().towers.length), 0);
    assert.equal(await p.locator('#message').textContent(), '');
    await p.mouse.click(x0, y5);
    assert.deepEqual(await p.evaluate(() => window.__game().towers.map((t) => [t.col, t.row])), [[0, 5]]);
    assert.deepEqual(pErrors, []);
  } finally {
    await p.close();
  }
});
