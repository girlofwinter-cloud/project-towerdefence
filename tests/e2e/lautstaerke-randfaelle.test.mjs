// B-188 Randfälle (Tester): kaputte Speicherstände, Leertaste/Enter im Feld und außerhalb, Schieber 0 %,
// Hochformat ohne Überlappung, Pause und Spielende mit offenem Feld. Ausführen: npm run test:e2e
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { enterGame } from './tile.mjs';

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

const cut = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
const rect = (page, sel) => page.$eval(sel, (e) => e.getBoundingClientRect().toJSON());
const waveActive = (page) => page.evaluate(() => window.__game().waveActive);

async function open(viewport = { width: 1280, height: 800 }, opts = {}) {
  const ctx = await browser.newContext({ viewport, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return { ctx, page, errors };
}

const BAD = [
  ['Text', 'laut', '100', '100'],
  ['NaN', '{"music":"NaN","sfx":null}', '100', '100'],
  ['über 1', '{"music":5,"sfx":1.2}', '100', '100'],
  ['unter 0', '{"music":-1,"sfx":-0.3}', '0', '0'],
  ['Array', '[0.5,0.5]', '100', '100'],
  ['Zahl als Text', '{"music":"0.25","sfx":"0.5"}', '25', '50'],
];
for (const [name, raw, music, sfx] of BAD) {
  test(`B-188 Speicherstand td-volume ${name} -> Schieber ${music}/${sfx} %, keine Fehler`, async () => {
    const { ctx, page, errors } = await open();
    await page.addInitScript((r) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('td-volume', r); sessionStorage.setItem('seeded', '1'); } }, raw);
    await page.goto(url);
    await enterGame(page);
    assert.equal(await page.inputValue('#vol-music'), music);
    assert.equal(await page.inputValue('#vol-sfx'), sfx);
    assert.equal(await page.locator('#vol-music-out').innerText(), `${music} %`);
    assert.equal(await page.locator('#vol-sfx-out').innerText(), `${sfx} %`);
    const v = await page.evaluate(() => window.__ui.volume);
    for (const k of ['music', 'sfx']) assert.ok(Number.isFinite(v[k]) && v[k] >= 0 && v[k] <= 1, `${k}=${v[k]}`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('B-188 Leertaste/Enter: im offenen Feld kein Wellenstart, außerhalb weiter', async () => {
  const { ctx, page, errors } = await open();
  await page.goto(url);
  await enterGame(page);
  await page.locator('#sound').click();
  for (const sel of ['#vol-music', '#vol-sfx', '#sound-toggle']) {
    await page.locator(sel).focus();
    await page.keyboard.press(' ');
    await page.keyboard.press('Enter');
    assert.equal(await waveActive(page), false, `Taste auf ${sel} startet keine Welle`);
  }
  // Leertaste auf dem Ton-Schalter schaltet den Ton (zweimal gedrückt: Leertaste + Enter -> wieder an)
  assert.equal(await page.getAttribute('#sound', 'data-on'), 'true');
  // M mit Fokus im Schieber schaltet stumm, Schieber unverändert
  await page.locator('#vol-music').focus();
  await page.keyboard.press('m');
  assert.equal(await page.getAttribute('#sound', 'data-on'), 'false', 'M im Feld schaltet stumm');
  assert.equal(await page.inputValue('#vol-music'), '100');
  await page.keyboard.press('m');
  // Feld schließen (Klick aufs Spielfeld), dann Leertaste außerhalb startet die Welle
  const box = await rect(page, '#game');
  await page.mouse.click(box.left + 5, box.top + 5);
  assert.equal(await page.locator('#sound-pop').isVisible(), false);
  await page.locator('#game').focus();
  await page.keyboard.press(' ');
  assert.equal(await waveActive(page), true, 'Leertaste außerhalb startet die Welle');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('B-188 Schieber 0 %: Ton-Schalter bleibt an, Speicher 0', async () => {
  const { ctx, page, errors } = await open();
  await page.goto(url);
  await enterGame(page);
  await page.locator('#sound').click();
  await page.locator('#vol-music').fill('0');
  await page.locator('#vol-sfx').fill('0');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('td-volume'))), { music: 0, sfx: 0 });
  assert.equal(await page.getAttribute('#sound', 'data-on'), 'true');
  assert.equal(await page.getAttribute('#sound-toggle', 'aria-pressed'), 'true');
  assert.equal(await page.evaluate(() => localStorage.getItem('td-sound')), null, 'Ton-Schalter nicht angefasst');
  // Lautsprecher-Symbol: an sichtbar, aus versteckt; nach Ton aus umgekehrt
  const shown = (sel) => page.$eval(sel, (e) => getComputedStyle(e).display !== 'none');
  assert.equal(await shown('#sound .ic-on'), true);
  assert.equal(await shown('#sound .ic-off'), false);
  await page.locator('#sound-toggle').click();
  assert.equal(await shown('#sound .ic-on'), false);
  assert.equal(await shown('#sound .ic-off'), true);
  assert.equal(await shown('#sound-toggle .ic-off'), true);
  await page.locator('#sound-toggle').click();
  assert.equal(await shown('#sound .ic-on'), true);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('B-188 Hochformat 390x844: Feld im Fenster, überlappt keine Knöpfe (HUD-Leiste darf es wie die Hilfe überdecken), Tippziele >= 44 px', async () => {
  const { ctx, page, errors } = await open({ width: 390, height: 844 }) // Handy hochkant zeigt den Dreh-Hinweis; schmales Fenster ohne Touch;
  await page.goto(url);
  await enterGame(page);
  await page.locator('#sound').click();
  assert.equal(await page.locator('#sound-pop').isVisible(), true);
  const p = await rect(page, '#sound-pop');
  assert.ok(p.left >= 0 && p.right <= 390 && p.top >= 0 && p.bottom <= 844, JSON.stringify(p));
  for (const sel of ['#sound', '#speed', '#pause', '#start-wave', '#auto-wave', '.help > summary', '#abilities', '#map-select']) {
    const o = await page.$$eval(sel, (es) => es.map((e) => (getComputedStyle(e).visibility === 'hidden' ? null : e.getBoundingClientRect().toJSON())));
    for (const r of o) if (r && r.width > 0) assert.ok(!cut(p, r), `Feld überlappt ${sel}`);
  }
  for (const sel of ['#sound-toggle', '#vol-music', '#vol-sfx']) {
    const r = await rect(page, sel);
    assert.ok(r.width >= 44 && r.height >= 44, `${sel} ${r.width}x${r.height}`);
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('B-188 Pause und Spielende mit offenem Feld: Pause bleibt bedienbar, Spielende-Plakette liegt über dem Feld', async () => {
  const { ctx, page, errors } = await open();
  await page.goto(url);
  await enterGame(page);
  await page.locator('#sound').click();
  await page.keyboard.press('p');
  assert.equal(await page.evaluate(() => window.__game().paused), true, 'P wirkt bei offenem Feld');
  assert.equal(await page.locator('#sound-pop').isVisible(), true);
  await page.locator('#vol-music').fill('50');
  assert.equal(await page.inputValue('#vol-music'), '50', 'Schieber geht in der Pause');
  await page.keyboard.press('p');
  await page.locator('#sound').focus();
  await page.evaluate(() => { window.__game().status = 'lost'; });
  await page.waitForSelector('#overlay:not([hidden]) .end-card');
  const restart = await rect(page, '#restart');
  const top = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('#restart, #sound-pop')?.id, [restart.left + restart.width / 2, restart.top + restart.height / 2]);
  assert.equal(top, 'restart', 'Neustart-Knopf nicht vom Feld verdeckt');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('B-188 Startbildschirm über offenem Feld: Escape schließt den Startbildschirm (nicht das verdeckte Feld)', async () => {
  const { ctx, page, errors } = await open();
  await page.goto(url);
  await enterGame(page);
  await page.locator('#sound').click();
  await page.evaluate(() => { window.__game().status = 'lost'; });
  await page.waitForSelector('#overlay:not([hidden]) .end-card');
  await page.locator('#to-maps').focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#start-screen:not([hidden])');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#start-screen').isHidden(), true, 'ein Escape schließt den Startbildschirm');
  assert.deepEqual(errors, []);
  await ctx.close();
});
