// Browser-Test Schalter Auto-Start: Knopf neben dem Wellenknopf auf Desktop und Handy quer (sichtbar, Tippziel >= 44,
// überlappt keine Bedienung), schaltet den Countdown, Wahl bleibt nach dem Neuladen. Ausführen: npm run test:e2e
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { enterGame } from './tile.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const MIN_TOUCH = 44;
const CONTROLS = ['#hud-bar', '#sound', '#speed', '#pause', '#abilities', '#start-wave', '#wave-preview'];
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

const cut = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
const rect = (page, sel) => page.$eval(sel, (e) => (e.offsetParent === null && getComputedStyle(e).position !== 'fixed' ? null : e.getBoundingClientRect().toJSON()));

// Welle 1 starten und sofort beenden (Gegner weg), dann einen Frame warten
async function endWaveOne(page) {
  await page.locator('#start-wave').click();
  await page.evaluate(() => { const s = window.__game(); s.spawnQueue = []; s.enemies = []; });
  await page.waitForFunction(() => !window.__game().waveActive);
}

const CASES = [
  { name: 'Desktop 1280x720', viewport: { width: 1280, height: 720 }, mobile: false },
  { name: 'Desktop 1920x1080', viewport: { width: 1920, height: 1080 }, mobile: false },
  { name: 'Handy quer 844x390', viewport: { width: 844, height: 390 }, mobile: true },
  { name: 'Handy quer 667x375', viewport: { width: 667, height: 375 }, mobile: true },
];

for (const c of CASES) {
  test(`Auto-Start-Schalter ${c.name}: sichtbar, >= 44 px, keine Überlappung, schaltet Countdown, bleibt gespeichert`, async () => {
    const ctx = await browser.newContext({ viewport: c.viewport, hasTouch: c.mobile, isMobile: c.mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url);
    await enterGame(page);
    const btn = page.locator('#auto-wave');
    assert.equal(await btn.isVisible(), true);
    assert.equal(await btn.getAttribute('aria-pressed'), 'true', 'Standard an');
    const r = await rect(page, '#auto-wave');
    assert.ok(r.width >= MIN_TOUCH && r.height >= MIN_TOUCH, `Tippziel ${r.width}x${r.height}`);
    assert.ok(r.left >= 0 && r.right <= c.viewport.width && r.top >= 0 && r.bottom <= c.viewport.height, `im Fenster ${JSON.stringify(r)}`);
    for (const sel of CONTROLS) {
      const o = await rect(page, sel);
      if (o && o.width > 0) assert.ok(!cut(r, o), `#auto-wave überlappt ${sel}: ${JSON.stringify(r)} / ${JSON.stringify(o)}`);
    }
    await page.screenshot({ path: `${process.env.SHOT_DIR || '/tmp'}/auto-wave-${c.viewport.width}x${c.viewport.height}-an.png` });

    // an: nach Wellenende Countdown; Ausschalten beendet ihn
    await endWaveOne(page);
    await page.waitForFunction(() => /^Welle 2 in \d…$/.test(document.getElementById('start-label').textContent));
    if (c.mobile) await btn.tap(); else await btn.click();
    assert.equal(await btn.getAttribute('aria-pressed'), 'false');
    assert.equal(await page.evaluate(() => window.__game().autoWaveIn), null);
    await page.waitForFunction(() => document.getElementById('start-label').textContent === 'Welle 2 starten');
    await page.screenshot({ path: `${process.env.SHOT_DIR || '/tmp'}/auto-wave-${c.viewport.width}x${c.viewport.height}-aus.png` });

    // Neu laden: Wahl "aus" bleibt, neues Spiel ohne Countdown nach Welle 1
    await page.reload();
    await enterGame(page);
    assert.equal(await btn.getAttribute('aria-pressed'), 'false', 'Wahl gespeichert');
    await endWaveOne(page);
    assert.equal(await page.evaluate(() => window.__game().autoWaveIn), null);
    // Taste A schaltet wieder an (nur Desktop) und startet den Countdown
    if (!c.mobile) {
      await page.locator('#game').focus();
      await page.keyboard.press('a');
      assert.equal(await btn.getAttribute('aria-pressed'), 'true');
      assert.ok(await page.evaluate(() => window.__game().autoWaveIn) > 0);
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}
