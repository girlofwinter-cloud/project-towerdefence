// Browser-Test: startet das Spiel in echtem Chromium und spielt kurz.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { TOWER_TYPES, VIEW_WIDTH, VIEW_HEIGHT } from '../../src/config.js';
import { tileCenter, enterGame, build, openRing } from './tile.mjs';

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

// C4: Turmleiste entfällt, Bauen über den Ring (Ring an den Feldecken: tests/e2e/ring.test.mjs)
test('Turm bauen per Klick (Bau-Ring)', async () => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const goldBefore = await page.evaluate(() => window.__game().gold);
  // Feld (0,0) ist frei: Klick in die Mitte der ersten Kachel öffnet den Ring, Knopf baut
  await build(page, 'arrow', 0, 0);
  assert.ok(await page.locator('#shop').isHidden(), 'Ring nach dem Bauen zu');
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

test('Handy: Bauen per Touch in zwei Schritten (Tipp Kachel -> Ring, Tipp Knopf), Zoom auf Übersicht verkleinert das Spielfeld', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const m = await ctx.newPage();
  const mErrors = [];
  m.on('pageerror', (e) => mErrors.push(e.message));
  await m.goto(url);
  await enterGame(m);
  try {
    const box = await m.locator('#game').boundingBox();
    // Feld (0,0) ist frei. Erster Tipp: nur der Ring öffnet, es wird nichts gebaut.
    await openRing(m, 0, 0, { touch: true });
    assert.equal(await m.evaluate(() => window.__game().towers.length), 0);
    assert.deepEqual(await m.evaluate(() => window.__ui.ring), { col: 0, row: 0 });
    // Zweiter Tipp auf den Knopf baut.
    await m.locator('#shop .tower-btn[data-type="arrow"]').tap();
    assert.equal(await m.evaluate(() => window.__game().towers.length), 1);
    // C6: Standard ist Nah (Feld breiter als der Bildschirm, wischbar). Zoom-Knopf schaltet auf Übersicht: ganzes Feld sichtbar.
    assert.ok(box.width > 390, `Nah: Feld ${box.width} breiter als der Bildschirm`);
    await m.locator('#zoom').tap();
    const zoomed = await m.locator('#game').boundingBox();
    assert.ok(zoomed.width < box.width * 0.5, `Übersicht: ${zoomed.width} statt ${box.width}`);
    assert.ok(zoomed.x >= 0 && zoomed.x + zoomed.width <= 390, 'Übersicht: ganzes Feld im Bild');
    assert.equal(await m.locator('#zoom').getAttribute('aria-pressed'), 'true');
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
    const box = await p.locator('#game').boundingBox();
    // Rand links neben Kachel (0,5) und Rand oben über Kachel (6,0): kein Turm, keine Fehlermeldung
    const [x0, y5] = tileCenter(box, 0, 5);
    await p.mouse.click(box.x + 10 * (box.width / VIEW_WIDTH), y5);
    const [x6, y0] = tileCenter(box, 6, 0);
    await p.mouse.click(x6, box.y + 10 * (box.width / VIEW_WIDTH));
    assert.equal(await p.evaluate(() => window.__game().towers.length), 0);
    assert.equal(await p.locator('#message').textContent(), '');
    assert.ok(await p.locator('#shop').isHidden(), 'Klick in den Rand öffnet keinen Ring');
    await build(p, 'arrow', 0, 5);
    assert.deepEqual(await p.evaluate(() => window.__game().towers.map((t) => [t.col, t.row])), [[0, 5]]);
    assert.deepEqual(pErrors, []);
  } finally {
    await p.close();
  }
});
