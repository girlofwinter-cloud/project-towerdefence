// C4 Ringmenü (Menue-Ring-Bauen.md, Menue-Ring-Turm.md): Bauen, Verbessern, Verkaufen, Zielwahl über die Ringe,
// zu teuer nicht ausführbar, Tastatur unverändert, Touch, Lage an den Feldecken.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { TOWER_TYPES, TILE } from '../../src/config.js';
import { tileCenter, enterGame, clickTile, openRing, build, openTower } from './tile.mjs';

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

// Normales Spiel (Startgold), erste Karte (Wiese: Kacheln (0,0), (2,0), (19,13) frei)
async function open(viewport = { width: 1280, height: 800 }, opts = {}) {
  const ctx = await browser.newContext({ viewport, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await enterGame(page, 'meadow');
  await page.waitForSelector('#shop .tower-btn', { state: 'attached' });
  return { ctx, page, errors };
}
const towers = (page) => page.evaluate(() => window.__game().towers.map((t) => ({ type: t.type, col: t.col, row: t.row, level: t.level, mode: t.targetMode })));
const rect = (page, sel) => page.locator(sel).evaluate((e) => e.getBoundingClientRect().toJSON());

test('Desktop: Turmleiste und Turm-Panel unsichtbar, bis ein Ring offen ist', async () => {
  const { ctx, page, errors } = await open();
  assert.ok(await page.locator('#shop').isHidden());
  assert.ok(await page.locator('#tower-info').isHidden());
  assert.equal(await page.locator('#shop .tower-btn').count(), Object.keys(TOWER_TYPES).length);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Bau-Ring: bauen, Vorschau beim Überfahren, Esc und Rechtsklick schließen, Klick auf Weg öffnet keinen Ring', async () => {
  const { ctx, page, errors } = await open();
  await openRing(page, 2, 0);
  // Vorschau: Maus über Kanone setzt den Vorschau-Typ, Verlassen setzt ihn zurück
  await page.locator('#shop .tower-btn[data-type="cannon"]').hover();
  assert.equal(await page.evaluate(() => window.__ui.ringPreview), 'cannon');
  await page.mouse.move(5, 400);
  assert.equal(await page.evaluate(() => window.__ui.ringPreview), null);
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#shop').isHidden(), 'Esc schließt');
  await openRing(page, 2, 0);
  const box = await page.locator('#game').boundingBox();
  await page.mouse.click(...tileCenter(box, 2, 0), { button: 'right' });
  assert.ok(await page.locator('#shop').isHidden(), 'Rechtsklick schließt');
  // Weg: Meldung, kein Ring
  const [c, r] = await page.evaluate(() => [...window.__game().blocked][5].split(',').map(Number));
  await clickTile(page, c, r);
  assert.ok(await page.locator('#shop').isHidden(), 'Weg öffnet keinen Ring');
  assert.match(await page.locator('#message').textContent(), /Weg/);
  // Anderer freier Platz: Ring springt dorthin
  await openRing(page, 2, 0);
  await openRing(page, 0, 0);
  assert.deepEqual(await page.evaluate(() => window.__ui.ring), { col: 0, row: 0 });
  const gold = await page.evaluate(() => window.__game().gold);
  await page.locator('#shop .tower-btn[data-type="arrow"]').click();
  assert.deepEqual(await towers(page), [{ type: 'arrow', col: 0, row: 0, level: 1, mode: 'first' }]);
  assert.equal(await page.evaluate(() => window.__game().gold), gold - TOWER_TYPES.arrow.cost);
  assert.ok(await page.locator('#shop').isHidden(), 'nach dem Bauen zu');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Bau-Ring zu teuer: Knopf grau und aria-disabled, Klick zeigt Meldung, kein Turm, Ring bleibt offen', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { window.__game().gold = 60; });
  await openRing(page, 2, 0);
  const sniper = page.locator('#shop .tower-btn[data-type="sniper"]');
  await page.waitForFunction(() => document.querySelector('#shop .tower-btn[data-type="sniper"]').classList.contains('poor'));
  assert.equal(await sniper.getAttribute('aria-disabled'), 'true');
  assert.match(await sniper.getAttribute('aria-label'), /zu wenig Gold/);
  assert.equal(await page.locator('#shop .tower-btn[data-type="arrow"]').getAttribute('aria-disabled'), 'false');
  await sniper.click({ force: true }); // Playwright wertet aria-disabled als gesperrt; im Browser bleibt der Knopf klickbar
  assert.equal((await towers(page)).length, 0);
  assert.match(await page.locator('#message').textContent(), /Gold/);
  assert.ok(await page.locator('#shop').isVisible(), 'Ring bleibt offen');
  await ctx.close();
});

test('Tastatur: Taste 3 bei offenem Ring baut Frost auf der Ringkachel; Ring zu: 1 + Klick baut wie bisher; Enter auf Ringknopf', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { window.__game().gold = 1000; });
  await openRing(page, 2, 0);
  await page.keyboard.press('3');
  assert.deepEqual((await towers(page)).map((t) => [t.type, t.col, t.row]), [['frost', 2, 0]]);
  assert.ok(await page.locator('#shop').isHidden());
  // Ohne Ring: Baumodus per Taste, Klick baut sofort (kein Ring)
  await page.keyboard.press('1');
  assert.equal(await page.evaluate(() => window.__ui.buildType), 'arrow');
  await clickTile(page, 0, 0);
  assert.deepEqual((await towers(page)).map((t) => [t.type, t.col, t.row]), [['frost', 2, 0], ['arrow', 0, 0]]);
  assert.ok(await page.locator('#shop').isHidden());
  await page.keyboard.press('Escape');
  // Fokus auf Ringknopf, Enter baut (startet keine Welle)
  await openRing(page, 19, 13);
  await page.locator('#shop .tower-btn[data-type="cannon"]').focus();
  assert.equal(await page.evaluate(() => window.__ui.ringPreview), 'cannon', 'Fokus zeigt Vorschau');
  await page.keyboard.press('Enter');
  assert.deepEqual((await towers(page)).at(-1), { type: 'cannon', col: 19, row: 13, level: 1, mode: 'first' });
  assert.equal(await page.evaluate(() => window.__game().wave), 0);
  await ctx.close();
});

test('Turm-Ring: Verbessern mit Preis und Vorschau, Zielwahl, Verkaufen mit Erlös, max. Stufe "Max."', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { window.__game().gold = 5000; });
  await build(page, 'arrow', 2, 0);
  await openTower(page, 2, 0);
  assert.match(await page.locator('#ti-name').textContent(), /^Pfeilturm · Stufe 1$/);
  assert.match(await page.locator('#upgrade').getAttribute('aria-label'), /^Verbessern für \d+ Gold \(U\)$/);
  const cost = Number((await page.locator('#upgrade').getAttribute('aria-label')).match(/\d+/)[0]);
  assert.match(await page.locator('#upgrade .act-cost').textContent(), new RegExp(`^${cost}`));
  // Vorschau der nächsten Stufe beim Überfahren
  await page.locator('#upgrade').hover();
  await page.waitForFunction(() => window.__ui.upgradePreview > 0);
  await page.locator('#upgrade').click();
  assert.equal((await towers(page))[0].level, 2);
  // Zielwahl schaltet weiter und zeigt die Regel
  await page.locator('#target-mode').click();
  assert.notEqual((await towers(page))[0].mode, 'first');
  assert.doesNotMatch(await page.locator('#target-mode').textContent(), /Erster/);
  await page.locator('#upgrade').click();
  assert.equal((await towers(page))[0].level, 3);
  assert.match(await page.locator('#upgrade').textContent(), /Max\./);
  assert.ok(await page.locator('#upgrade').isDisabled());
  const sell = Number((await page.locator('#sell').getAttribute('aria-label')).match(/\d+/)[0]);
  assert.match(await page.locator('#sell .act-cost').textContent(), new RegExp(`^\\+${sell}`));
  const gold = await page.evaluate(() => window.__game().gold);
  await page.locator('#sell').click();
  assert.equal((await towers(page)).length, 0);
  assert.equal(await page.evaluate(() => window.__game().gold), gold + sell);
  assert.ok(await page.locator('#tower-info').isHidden());
  await ctx.close();
});

test('Turm-Ring: zu teures Verbessern ist gesperrt; Klick auf die Turmspitze über der Kachel öffnet den Ring', async () => {
  const { ctx, page } = await open();
  await build(page, 'sniper', 2, 3);
  await page.evaluate(() => { window.__game().gold = 0; });
  await openTower(page, 2, 3);
  await page.waitForFunction(() => document.getElementById('upgrade').disabled);
  await page.locator('#ti-close').click();
  assert.ok(await page.locator('#tower-info').isHidden(), '× schließt');
  // Klick in die obere Hälfte der Kachel darüber (2,2): dort ragt die Figur hin
  const box = await page.locator('#game').boundingBox();
  const [x, y] = tileCenter(box, 2, 2);
  await page.mouse.click(x, y + (box.width / 900) * TILE * 0.2);
  await page.waitForSelector('#tower-info:not([hidden]) #upgrade');
  assert.ok(await page.locator('#shop').isHidden(), 'kein Bau-Ring');
  await ctx.close();
});

test('Freie Baufläche über jedem Turm öffnet statt Upgrade-Menü den Bau-Ring', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { window.__game().gold = 5000; });
  const cols = [0, 2, 4, 6, 9];
  for (const [i, type] of Object.keys(TOWER_TYPES).entries()) {
    const col = cols[i], row = 1;
    await build(page, type, col, row);
    await openTower(page, col, row);
    assert.ok(await page.locator('#tower-info').isVisible(), `${type}: Upgrade-Menü geöffnet`);
    await page.locator('#ti-close').click();
    assert.ok(await page.locator('#tower-info').isHidden(), `${type}: Upgrade-Menü geschlossen`);
    await clickTile(page, col, row - 1);
    const ring = await page.evaluate(() => window.__ui.ring);
    assert.deepEqual(ring, { col, row: row - 1 }, `${type}: Bau-Ring auf freier Nachbarkachel`);
    assert.equal((await towers(page)).length, i + 1, `${type}: kein zusätzlicher Turm`);
    await page.keyboard.press('Escape');
  }
  await ctx.close();
});

for (const [width, height] of [[1280, 800], [1366, 768]]) {
  test(`${width}x${height}: Bau-Ring an den Feldecken ganz im Fenster, nicht über HUD-Leiste und runden Knöpfen`, async () => {
    const { ctx, page } = await open({ width, height });
    for (const [c, r] of [[0, 0], [19, 0], [0, 13], [19, 13]]) {
      await openRing(page, c, r);
      const hud = await rect(page, '#hud-bar');
      const top = await rect(page, '.top-buttons');
      for (const b of await page.$$eval('#shop .tower-btn', (els) => els.map((e) => e.getBoundingClientRect().toJSON()))) {
        assert.ok(b.left >= 0 && b.top >= 0 && b.right <= width && b.bottom <= height, `(${c},${r}) Knopf ${JSON.stringify(b)}`);
        for (const h of [hud, top]) {
          const hit = b.left < h.right && b.right > h.left && b.top < h.bottom && b.bottom > h.top;
          assert.ok(!hit, `(${c},${r}) Knopf überdeckt ${JSON.stringify(h)}`);
        }
      }
      await page.keyboard.press('Escape');
    }
    await ctx.close();
  });
}

test('Touch 844x390 (B-137: Handy quer): Tipp öffnet Ring, Tipp daneben schließt, Tipp auf Knopf baut; Turm-Ring per Tipp', async () => {
  const { ctx, page, errors } = await open({ width: 844, height: 390 }, { hasTouch: true, isMobile: true });
  await openRing(page, 0, 0, { touch: true });
  assert.equal((await towers(page)).length, 0);
  const vw = await page.evaluate(() => [window.innerWidth, window.innerHeight]);
  for (const b of await page.$$eval('#shop .tower-btn', (els) => els.map((e) => e.getBoundingClientRect().toJSON()))) {
    assert.ok(b.left >= 0 && b.top >= 0 && b.right <= vw[0] && b.bottom <= vw[1], `Knopf ${JSON.stringify(b)}`);
    assert.ok(b.height >= 44, `Knopfhöhe ${b.height}`);
  }
  await clickTile(page, 10, 7, { touch: true });
  assert.ok(await page.locator('#shop').isHidden(), 'Tipp daneben schließt');
  await build(page, 'arrow', 0, 0, { touch: true });
  assert.deepEqual((await towers(page)).map((t) => [t.type, t.col, t.row]), [['arrow', 0, 0]]);
  await openTower(page, 0, 0, { touch: true });
  await page.locator('#target-mode').tap();
  assert.notEqual((await towers(page))[0].mode, 'first');
  await page.locator('#sell').tap();
  assert.equal((await towers(page)).length, 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});
