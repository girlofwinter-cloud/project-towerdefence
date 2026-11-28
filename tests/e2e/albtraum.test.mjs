// Browser-Test B-184: Albtraum-Optik (Kartenauswahl mit Umschalter und Abzeichen, Gold-Anzeige im HUD, Siegbildschirm).
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { PROGRESS_KEY, MAX_WAVES } from '../../src/config.js';
import { MAP_ORDER } from '../../src/progress.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
let server, browser, url;
before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  url = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

// Alle Karten mit drei Sternen, erste Karte Gold, zweite Silber, Rest ohne Abzeichen
const [M0, M1] = MAP_ORDER;
const LAST = MAP_ORDER[MAP_ORDER.length - 1];
const PROGRESS = {
  maps: Object.fromEntries(MAP_ORDER.map((id) => [id, { bestWave: MAX_WAVES, stars: 3 }])),
  nightmare: { [M0]: { bestWave: MAX_WAVES, badge: 3 }, [M1]: { bestWave: MAX_WAVES, badge: 2 } },
};
async function open(viewport) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, [PROGRESS_KEY, JSON.stringify(PROGRESS)]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForSelector('#start-screen:not([hidden]) .map-card');
  await page.click('.start-mode [data-mode="nightmare"]');
  return { ctx, page, errors };
}
const box = (page, sel) => page.locator(sel).first().boundingBox();
const overlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test('B-184 1280x800: Umschalter, Slots, Albtraum-Knopf und Gold-Chip in Sollgröße, Sieg mit Medaille', async () => {
  const { ctx, page, errors } = await open({ width: 1280, height: 800 });
  assert.equal(await page.locator('#start-screen').getAttribute('class'), 'nightmare');
  assert.equal(await page.locator('.start-mode [data-mode="nightmare"]').getAttribute('aria-checked'), 'true');
  assert.equal(await page.locator('.badge-count').getAttribute('aria-label'), 'Abzeichen 5 / 15');
  for (const b of await page.locator('.start-mode button').all()) { const r = await b.boundingBox(); assert.ok(r.width >= 130 && r.height >= 44); }
  const nm = await box(page, '.map-nightmare');
  assert.deepEqual([Math.round(nm.width), Math.round(nm.height)], [160, 44]);
  const slot = await box(page, '.map-badges .badge');
  assert.deepEqual([Math.round(slot.width), Math.round(slot.height)], [44, 44]);
  assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), 'kein Scrollen');
  // Slot-Reihe schreibt die Bedingungen in den Hinweis
  await page.click(`.map-badges[data-map="${M0}"]`);
  assert.match(await page.locator('.start-hint .badge-hint').textContent(), /Gold: ohne Fähigkeiten/);
  // Albtraum auf der letzten Karte (ohne Abzeichen): Gold-Chip rechts der Leben, ohne Überlappung
  await page.click(`.map-nightmare[data-map="${LAST}"]`);
  await page.waitForSelector('#start-screen', { state: 'hidden' });
  const gg = await box(page, '#gold-goal');
  const lives = await box(page, '#lives-box');
  assert.ok(Math.abs(gg.height - 36) <= 1, `Chip 36 hoch (${gg.height})`);
  assert.ok(gg.x >= lives.x + lives.width, 'rechts von den Leben');
  assert.equal(overlap(gg, await box(page, '#start-wave')), false);
  // Sieg mit vollen Leben und erfüllter Bedingung: Gold neu, Medaille 200, Belohnung
  await page.evaluate(([w]) => { const s = window.__game(); s.wave = w; s.lives = 5; s.status = 'won'; }, [MAX_WAVES]);
  await page.waitForSelector('#overlay.nightmare-win');
  const medal = await box(page, '#end-badge');
  assert.deepEqual([Math.round(medal.width), Math.round(medal.height)], [200, 200]);
  assert.ok(medal.y >= 0, 'Medaille im Fenster');
  assert.equal(await page.locator('#overlay-title').textContent(), 'Albtraum besiegt!');
  assert.match(await page.locator('#end-nm-title').textContent(), /Gold-Abzeichen$/);
  assert.match(await page.locator('#end-reward').textContent(), /Neue Belohnung freigeschaltet: Nacht-Look/);
  for (const id of ['#restart', '#to-maps']) assert.ok((await box(page, id)).height >= 46);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('B-184 844x390: Kartenauswahl ohne Scrollen, Tippziele >= 44, Gold-Zeichen 24, Sieg ohne Überlappung', async () => {
  const { ctx, page, errors } = await open({ width: 844, height: 390 });
  assert.ok(await page.evaluate(() => document.querySelector('#start-screen').scrollHeight <= innerHeight), 'kein Scrollen');
  for (const c of await page.locator('.map-slot').all()) { const r = await c.boundingBox(); assert.ok(r.y + r.height <= 390, 'Unterkante <= 390'); }
  const heights = await page.evaluate(() => [...document.querySelectorAll('#start-screen button')].filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect().height));
  assert.ok(heights.length > 0 && heights.every((h) => h >= 44), `Tippziele: ${heights}`);
  await page.click(`.map-nightmare[data-map="${LAST}"]`);
  await page.waitForSelector('#start-screen', { state: 'hidden' });
  const mark = await box(page, '#gold-goal');
  assert.deepEqual([Math.round(mark.width), Math.round(mark.height)], [24, 24]);
  assert.ok(mark.x >= 0 && mark.y >= 0 && mark.x + mark.width <= 844, 'Zeichen im Fenster');
  await page.evaluate(([w]) => { const s = window.__game(); s.wave = w; s.lives = 5; s.status = 'won'; }, [MAX_WAVES]);
  await page.waitForSelector('#overlay.nightmare-win');
  const medal = await box(page, '#end-badge');
  const card = await box(page, '.end-card');
  for (const r of [medal, card]) assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= 844 && r.y + r.height <= 390, 'im Fenster');
  assert.equal(overlap(medal, card), false, 'Medaille neben der Plakette');
  for (const id of ['#restart', '#to-maps']) assert.ok((await box(page, id)).height >= 44);
  assert.deepEqual(errors, []);
  await ctx.close();
});
