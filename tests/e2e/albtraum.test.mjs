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

// Tester: kleines Handy quer (667x375). Die Medaille darf nicht aus dem Fenster ragen und die Plakette nicht verdecken.
test('B-184 667x375: Kartenauswahl ohne Scrollen, Sieg-Medaille ganz im Fenster', async () => {
  const { ctx, page, errors } = await open({ width: 667, height: 375 });
  assert.ok(await page.evaluate(() => document.querySelector('#start-screen').scrollHeight <= innerHeight), 'kein Scrollen');
  const heights = await page.evaluate(() => [...document.querySelectorAll('#start-screen button')].filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect().height));
  assert.ok(heights.length > 0 && heights.every((h) => h >= 44), `Tippziele: ${heights}`);
  await page.click(`.map-nightmare[data-map="${LAST}"]`);
  await page.waitForSelector('#start-screen', { state: 'hidden' });
  await page.evaluate(([w]) => { const s = window.__game(); s.wave = w; s.lives = 5; s.status = 'won'; }, [MAX_WAVES]);
  await page.waitForSelector('#overlay.nightmare-win');
  const medal = await box(page, '#end-badge');
  const card = await box(page, '.end-card');
  for (const [name, r] of [['Medaille', medal], ['Plakette', card]]) {
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= 667 && r.y + r.height <= 375, `${name} im Fenster: ${JSON.stringify(r)}`);
  }
  assert.equal(overlap(medal, card), false, 'Medaille neben der Plakette');
  assert.deepEqual(errors, []);
  await ctx.close();
});

// ---------- B-193: HUD im Albtraum (Holz je Karte, Rand-Deko, Plakette, Boss-Leiste, „Gold verpasst“) ----------
async function openTest(viewport) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${url}?test`);
  await page.waitForSelector('body.test-mode');
  return { ctx, page, errors };
}

test('B-193 1280x800: Wiese im Albtraum mit Moos-Holz und Deko, Gold verpasst ohne Durchstreichen, Normalmodus ohne Deko', async () => {
  const { ctx, page, errors } = await openTest({ width: 1280, height: 800 });
  assert.equal(await page.locator('#app .plq-deco').count(), 0, 'Normalmodus: keine Deko');
  assert.match(await page.evaluate(() => getComputedStyle(document.querySelector('.hud')).backgroundImage), /rgb\(164, 103, 47\)/, 'Normalmodus: heutiges Holz');
  await page.selectOption('#map-select', 'meadow:nightmare');
  await page.waitForSelector('#hud-bar > .plq-deco');
  assert.match(await page.evaluate(() => getComputedStyle(document.querySelector('.hud')).backgroundImage), /rgb\(94, 78, 102\)/, 'nm-wood-moss-a');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.plq-deco')).pointerEvents), 'none');
  // Fähigkeit benutzt: Bedingung „ohne Fähigkeiten“ verpasst
  await page.evaluate(() => { window.__game().abilities.freeze.uses = 1; });
  await page.waitForSelector('#gold-goal.broken');
  assert.equal(await page.isVisible('#gold-goal .gg-state'), true);
  assert.equal(await page.locator('#gold-goal .gg-state').textContent(), 'Gold verpasst');
  assert.equal(await page.locator('#gold-goal .gg-text').textContent(), 'ohne Fähigkeiten');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#gold-goal .gg-state')).color), 'rgb(255, 154, 138)');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#gold-goal .gg-text'), '::after').content), 'none', 'kein Strich');
  const gg = await box(page, '#gold-goal');
  assert.ok(Math.abs(gg.height - 36) <= 1 && gg.width <= 320, `Chip ${gg.width} x ${gg.height}`);
  await page.waitForFunction(() => document.getElementById('message').textContent.includes('Gold verpasst – Silber ist noch möglich'));
  // zurück auf Normal: Holz und Deko wieder weg
  await page.selectOption('#map-select', 'meadow');
  await page.waitForSelector('#gold-goal', { state: 'hidden' });
  assert.equal(await page.locator('#app .plq-deco').count(), 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('B-193 1920x1080: Albtraum-Plakette 180 x 56 neben dem HUD, Boss-Leiste mit Prozentzahl und Krone', async () => {
  const { ctx, page, errors } = await openTest({ width: 1920, height: 1080 });
  await page.selectOption('#map-select', 'twin:nightmare');
  await page.waitForSelector('#nm-plaque:not([hidden])');
  const plq = await box(page, '#nm-plaque');
  assert.deepEqual([Math.round(plq.width), Math.round(plq.height)], [180, 56]);
  for (const sel of ['#gold-goal', '#hud-bar', '.top-buttons']) assert.equal(overlap(plq, await box(page, sel)), false, `überlappt ${sel} nicht`);
  assert.match(await page.locator('#nm-plaque').getAttribute('aria-label'), /^Albtraum-Modus, Düstere Magie, bestes Abzeichen /);
  // Eisenbänder (Zwei Fronten) liegen auf den Trennern
  const straps = await page.evaluate(() => {
    const seps = [...document.querySelectorAll('#hud-bar > .sep')].map((s) => { const r = s.getBoundingClientRect(); return r.left + r.width / 2; });
    const bands = [...document.querySelectorAll('#hud-bar .nm-strap')].map((s) => { const r = s.getBoundingClientRect(); return r.left + r.width / 2; });
    return { seps, bands };
  });
  assert.equal(straps.bands.length, straps.seps.length);
  straps.seps.forEach((x, i) => assert.ok(Math.abs(straps.bands[i] - x) <= 2, `Band ${i} auf dem Trenner`));
  // Oger-König mit 62 % Leben
  await page.evaluate(async () => {
    const g = await import('/src/game.js');
    const s = window.__game();
    g.spawnEnemy(s, 'boss', 20);
    const e = s.enemies[s.enemies.length - 1];
    e.hp = e.maxHp * 0.62;
    s.paused = true;
  });
  await page.waitForSelector('#boss-bar:not([hidden])');
  await page.waitForFunction(() => document.querySelector('#boss-bar .bb-pct').textContent === '62%');
  assert.equal(await page.isVisible('#boss-bar .bb-crown'), true, 'Krone beim Oger-König');
  assert.equal(await page.isVisible('#boss-bar .bb-skull'), false);
  // Boss-Leiste hat Vorrang: Plakette nur, wenn daneben noch eine volle Leiste passt, sonst ausgeblendet
  const bar = await box(page, '#boss-bar');
  const plq2 = (await page.isVisible('#nm-plaque')) ? await box(page, '#nm-plaque') : null;
  assert.ok(!plq2 || !overlap(bar, plq2), 'Boss-Leiste überdeckt die Plakette nicht');
  assert.ok(bar.width >= 200, `Boss-Leiste breit genug (${bar.width})`);
  assert.deepEqual(errors, []);
  await ctx.close();
});
