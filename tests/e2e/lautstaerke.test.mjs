// B-188: Browser-Test Lautstärke-Feld: Ton-Knopf öffnet das Feld (Ton-Schalter, Schieber Musik und Effekte),
// Tippziele >= 44 px, keine Überlappung mit der Bedienung, Schieber speichert, Neuladen behält den Wert,
// Schließen per Escape, Klick daneben und erneutem Tippen, Taste M schaltet weiter stumm. Ausführen: npm run test:e2e
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { enterGame } from './tile.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const MIN_TOUCH = 44;
const CONTROLS = ['#hud-bar', '#sound', '#speed', '#pause', '#abilities', '#start-wave'];
const TAPS = ['#sound-toggle', '#vol-music', '#vol-sfx'];
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
const rect = (page, sel) => page.$eval(sel, (e) => e.getBoundingClientRect().toJSON());
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('td-volume') ?? 'null'));

const CASES = [
  { name: 'Desktop 1280x800', viewport: { width: 1280, height: 800 }, mobile: false },
  { name: 'Handy quer 844x390', viewport: { width: 844, height: 390 }, mobile: true },
  { name: 'Handy quer 667x375', viewport: { width: 667, height: 375 }, mobile: true },
];

for (const c of CASES) {
  test(`Lautstärke-Feld ${c.name}: öffnet, >= 44 px, keine Überlappung, speichert, bleibt nach Neuladen`, async () => {
    const ctx = await browser.newContext({ viewport: c.viewport, hasTouch: c.mobile, isMobile: c.mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url);
    await enterGame(page);
    const pop = page.locator('#sound-pop');
    assert.equal(await pop.isVisible(), false, 'anfangs zu');
    assert.equal(await stored(page), null, 'alter Speicherstand: kein Eintrag');
    assert.equal(await page.inputValue('#vol-music'), '100', 'ohne Eintrag 100 %');
    assert.equal(await page.inputValue('#vol-sfx'), '100');

    // Öffnen per Tippen bzw. Klick
    if (c.mobile) await page.locator('#sound').tap(); else await page.locator('#sound').click();
    assert.equal(await pop.isVisible(), true, 'Feld offen');
    assert.equal(await page.getAttribute('#sound', 'aria-expanded'), 'true');
    const p = await rect(page, '#sound-pop');
    assert.ok(p.left >= 0 && p.right <= c.viewport.width && p.top >= 0 && p.bottom <= c.viewport.height, `im Fenster ${JSON.stringify(p)}`);
    for (const sel of TAPS) {
      const r = await rect(page, sel);
      assert.ok(r.width >= MIN_TOUCH && r.height >= MIN_TOUCH, `${sel} Tippziel ${r.width}x${r.height}`);
    }
    for (const sel of CONTROLS) {
      const o = await page.$eval(sel, (e) => (getComputedStyle(e).visibility === 'hidden' ? null : e.getBoundingClientRect().toJSON()));
      if (o && o.width > 0) assert.ok(!cut(p, o), `Feld überlappt ${sel}`);
    }
    assert.equal(await page.locator('label', { has: page.locator('#vol-music') }).innerText().then((t) => t.includes('Musik')), true);
    assert.equal(await page.locator('label', { has: page.locator('#vol-sfx') }).innerText().then((t) => t.includes('Effekte')), true);

    // Schieber Musik auf 40 %, Effekte per Tastatur einen Schritt leiser
    await page.locator('#vol-music').fill('40');
    assert.deepEqual(await stored(page), { music: 0.4, sfx: 1 });
    assert.equal(await page.locator('#vol-music-out').innerText(), '40 %');
    await page.locator('#vol-sfx').focus();
    await page.keyboard.press('ArrowLeft');
    assert.deepEqual(await stored(page), { music: 0.4, sfx: 0.95 });
    assert.equal(await page.evaluate(() => window.__game().waveActive), false, 'Tasten im Feld starten keine Welle');

    // Ton-Schalter im Feld; Schieber bleiben unberührt
    await page.locator('#sound-toggle').click();
    assert.equal(await page.getAttribute('#sound-toggle', 'aria-pressed'), 'false');
    assert.equal(await page.getAttribute('#sound', 'data-on'), 'false');
    assert.deepEqual(await stored(page), { music: 0.4, sfx: 0.95 });

    // Escape schließt, Fokus zurück auf den Ton-Knopf
    await page.keyboard.press('Escape');
    assert.equal(await pop.isVisible(), false, 'Escape schließt');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'sound');
    // Taste M schaltet weiter stumm bzw. an, ohne das Feld zu öffnen
    await page.keyboard.press('m');
    assert.equal(await page.getAttribute('#sound', 'data-on'), 'true');
    assert.equal(await pop.isVisible(), false);

    // Erneutes Tippen schließt, Klick daneben schließt
    await page.locator('#sound').click();
    assert.equal(await pop.isVisible(), true);
    await page.locator('#sound').click();
    assert.equal(await pop.isVisible(), false, 'erneut tippen schließt');
    await page.locator('#sound').click();
    const hud = await rect(page, '#hud-bar');
    await page.mouse.click(hud.left + hud.width / 2, hud.top + hud.height / 2);
    assert.equal(await pop.isVisible(), false, 'Klick daneben schließt');

    // Neuladen behält die Werte
    await page.reload();
    await enterGame(page);
    assert.equal(await page.inputValue('#vol-music'), '40');
    assert.equal(await page.inputValue('#vol-sfx'), '95');
    assert.equal(await page.getAttribute('#sound', 'data-on'), 'true');
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}
