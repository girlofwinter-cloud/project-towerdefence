// Browser-Test B-185: Menü „Aussehen“ (Kosmetik-Belohnungen) mit vorbelegtem Fortschritt, Testseiten-Kartenwahl im Albtraum.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { PROGRESS_KEY, MAX_WAVES, BADGE_TIERS } from '../../src/config.js';
import { MAP_ORDER } from '../../src/progress.js';
import { enterGame } from './tile.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

let server, browser, url;
const errors = [];
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

// Alle Karten mit drei Sternen, Gold im Albtraum auf den Karten goldIds; cosmetics optional
const seed = (goldIds, cosmetics) => JSON.stringify({
  maps: Object.fromEntries(MAP_ORDER.map((id) => [id, { bestWave: MAX_WAVES, stars: 3 }])),
  nightmare: Object.fromEntries(goldIds.map((id) => [id, { bestWave: MAX_WAVES, badge: BADGE_TIERS.length }])),
  ...(cosmetics ? { cosmetics } : {}),
});
async function openWith(progress, ctxOpts = { viewport: { width: 1280, height: 800 } }) {
  const page = await (await browser.newContext(ctxOpts)).newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [PROGRESS_KEY, progress]);
  await page.reload();
  await page.waitForSelector('#start-screen:not([hidden]) .map-card');
  return page;
}
const switches = (page) => page.$$eval('#cosmetics .sw', (bs) => bs.map((b) => {
  const r = b.getBoundingClientRect();
  return { key: b.dataset.key, on: b.getAttribute('aria-checked') === 'true', disabled: b.disabled, label: b.getAttribute('aria-label'), w: r.width, h: r.height, row: b.parentElement.getBoundingClientRect().height };
}));

test('Aussehen: frisch freigeschaltet = an, gesperrte Einträge mit Grund und Fortschritt, Maße 1280x800', async () => {
  const [A, B] = MAP_ORDER;
  const page = await openWith(seed([A, B]));
  await page.click('#start-screen .cos-open');
  await page.waitForSelector('#cosmetics:not([hidden])');
  const sw = await switches(page);
  assert.equal(sw.length, MAP_ORDER.length + 1);
  for (const s of sw) assert.deepEqual([s.w, s.h, s.row], [64, 44, 56], `${s.key}: Schalter 64 x 44, Zeile 56`);
  const byKey = Object.fromEntries(sw.map((s) => [s.key, s]));
  assert.equal(byKey[`night:${A}`].on, true, 'frisch freigeschaltet = an');
  assert.equal(byKey[`night:${B}`].on, true);
  for (const id of MAP_ORDER.slice(2)) {
    assert.equal(byKey[`night:${id}`].disabled, true);
    assert.match(byKey[`night:${id}`].label, /, gesperrt$/);
  }
  assert.equal(byKey.gold.disabled, true);
  assert.match(await page.textContent('#cosmetics .cos-prog'), /Gold auf 2 \/ 5 Karten/);
  assert.match(await page.textContent('#cosmetics'), /Gold im Albtraum nötig/);
  assert.deepEqual(errors, []);
});

test('Aussehen: Tastatur (Enter öffnet, Leertaste schaltet, Escape schließt), Auswahl bleibt nach Neuladen', async () => {
  const [A, B] = MAP_ORDER;
  const page = await openWith(seed([A, B]));
  await page.focus('#start-screen .cos-open');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#cosmetics:not([hidden])');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.key), `night:${A}`, 'Fokus auf dem ersten freien Schalter');
  await page.keyboard.press(' ');
  assert.equal(await page.getAttribute(`#cosmetics .sw[data-key="night:${A}"]`, 'aria-checked'), 'false');
  await page.keyboard.press('Escape');
  assert.equal(await page.isHidden('#cosmetics'), true);
  assert.equal(await page.isVisible('#start-screen'), true, 'Escape schließt nur das Menü');
  const saved = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), PROGRESS_KEY));
  assert.equal(saved.cosmetics.night[A], false, 'bewusstes Aus gespeichert');
  await page.reload();
  await page.waitForSelector('#start-screen:not([hidden]) .map-card');
  await page.click('#start-screen .cos-open');
  const byKey = Object.fromEntries((await switches(page)).map((s) => [s.key, s]));
  assert.equal(byKey[`night:${A}`].on, false, 'Aus bleibt nach Neuladen');
  assert.equal(byKey[`night:${B}`].on, true);
  assert.deepEqual(errors, []);
});

// Pixel der Feldmitte (B-194: der Nacht-Look ist ein eigener Look je Karte, nicht nur dunkler)
const fieldPixels = (page) => page.evaluate(() => {
  const c = document.getElementById('game');
  return Array.from(c.getContext('2d').getImageData(c.width * 0.3, c.height * 0.3, c.width * 0.4, c.height * 0.4).data);
});
// Mittlere Abweichung je Farbkanal (0–255) zwischen zwei gleich großen Ausschnitten
const meanDiff = (a, b) => {
  let sum = 0, n = 0;
  for (let i = 0; i < a.length; i += 4) { sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); n += 3; }
  return sum / n;
};
test('Aussehen: Nacht-Look wirkt im Normalmodus nur, wenn an (Spielfeld sichtbar anders)', async () => {
  const [A] = MAP_ORDER;
  const on = await openWith(seed([A]));
  await enterGame(on, A);
  await on.waitForTimeout(300);
  const off = await openWith(seed([A], { night: { [A]: false } }));
  await enterGame(off, A);
  await off.waitForTimeout(300);
  const d = meanDiff(await fieldPixels(on), await fieldPixels(off));
  assert.ok(d > 20, `Nacht-Look an sichtbar anders als aus (mittlere Abweichung ${d.toFixed(1)} > 20)`);
  assert.deepEqual(errors, []);
});

test('Aussehen Handy quer 844x390: Tippziele ≥ 44, Seite scrollt nicht, Plakette im Bild, Knopf ohne Überlappung', async () => {
  const page = await openWith(seed(MAP_ORDER), { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const btn = await page.locator('#start-screen .cos-open').boundingBox();
  assert.ok(btn.height >= 44 && btn.y + btn.height <= 390 && btn.x + btn.width <= 844, 'Knopf „Aussehen“ im Bild, ≥ 44 hoch');
  const clash = await page.evaluate(() => {
    const b = document.querySelector('.cos-open').getBoundingClientRect();
    return [...document.querySelectorAll('#start-screen button, #start-screen .start-hint span, .top-buttons button')]
      .filter((e) => !e.classList.contains('cos-open') && e.offsetParent)
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top; })
      .map((e) => e.className);
  });
  assert.deepEqual(clash, [], 'Knopf überdeckt nichts');
  await page.locator('#start-screen .cos-open').tap();
  await page.waitForSelector('#cosmetics:not([hidden])');
  const sw = await switches(page);
  assert.ok(sw.every((s) => s.h >= 44 && s.row >= 44), 'Schalter und Zeilen ≥ 44');
  assert.ok(sw.every((s) => s.on && !s.disabled), 'alles Gold: alles frei und an');
  assert.equal(await page.locator('#cosmetics .cos-prog').count(), 0, '5 / 5: keine Fortschrittsleiste');
  const m = await page.evaluate(() => ({ sh: document.scrollingElement.scrollHeight, sw: document.scrollingElement.scrollWidth, card: document.querySelector('.cos-card').getBoundingClientRect().toJSON(), close: document.querySelector('.cos-close').getBoundingClientRect().height }));
  assert.ok(m.sh <= 390 && m.sw <= 844, 'Seite scrollt nicht');
  assert.ok(m.card.top >= 0 && m.card.bottom <= 390 && m.card.right <= 844, 'Plakette im Bild');
  assert.ok(m.close >= 44, '„Fertig“ ≥ 44');
  await page.locator('#cosmetics .sw[data-key="gold"]').tap();
  assert.equal(await page.getAttribute('#cosmetics .sw[data-key="gold"]', 'aria-checked'), 'false');
  await page.locator('#cosmetics .cos-close').tap();
  assert.equal(await page.isHidden('#cosmetics'), true);
  assert.deepEqual(errors, []);
});

test('Testseite: Kartenwahl bleibt im Albtraum sichtbar (zurück auf Normal), Gold-Anzeige nicht überdeckt', async () => {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${url}?test`);
  await page.waitForSelector('body.test-mode');
  await page.selectOption('#map-select', `${MAP_ORDER[0]}:nightmare`);
  await page.waitForSelector('#gold-goal:not([hidden])');
  assert.equal(await page.isVisible('.map-pick'), true, 'Kartenwahl sichtbar');
  const [a, b] = [await page.locator('.map-pick').boundingBox(), await page.locator('#gold-goal').boundingBox()];
  assert.ok(a.x >= b.x + b.width || b.x >= a.x + a.width || a.y >= b.y + b.height || b.y >= a.y + a.height, 'keine Überlappung');
  await page.selectOption('#map-select', MAP_ORDER[0]);
  await page.waitForSelector('#gold-goal', { state: 'hidden' });
  assert.equal(await page.evaluate(() => document.body.classList.contains('mode-nightmare')), false, 'zurück im Normalmodus');
  assert.deepEqual(errors, []);
});
