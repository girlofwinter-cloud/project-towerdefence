// Browser-Test C5: Startbildschirm mit Kartenkarten und Spielende-Plakette.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { PROGRESS_KEY, START_LIVES, MAX_WAVES } from '../../src/config.js';
import { MAP_ORDER } from '../../src/progress.js';
import { enterGame } from './tile.mjs';

const [M0, M1] = MAP_ORDER;
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

// Frischer Kontext (leerer Speicher), optional mit vorgegebenem Fortschritt
async function open(viewport = { width: 1280, height: 800 }, progress = null) {
  const ctx = await browser.newContext({ viewport });
  if (progress) await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), [PROGRESS_KEY, JSON.stringify(progress)]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForSelector('#start-screen:not([hidden]) .map-card');
  return { ctx, page, errors };
}
const game = (page) => page.evaluate(() => { const s = window.__game(); return { mapId: s.mapId, wave: s.wave, status: s.status }; });

test('C5 Start 1280x800: alle Karten ohne Scrollen sichtbar, nur die erste offen, HUD verborgen', async () => {
  const { ctx, page, errors } = await open();
  const cards = page.locator('.map-card');
  assert.equal(await cards.count(), MAP_ORDER.length);
  for (const id of MAP_ORDER) {
    const box = await page.locator(`.map-card[data-map="${id}"]`).boundingBox();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 1280 && box.y + box.height <= 800, `${id} im Fenster`);
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), 'kein Scrollen');
  assert.equal(await page.locator(`.map-card[data-map="${M0}"]`).isDisabled(), false);
  assert.equal(await page.locator(`.map-card[data-map="${M1}"]`).isDisabled(), true);
  assert.match(await page.locator(`.map-card[data-map="${M1}"]`).getAttribute('aria-label'), /gesperrt/);
  assert.match(await page.locator(`.map-card[data-map="${M1}"] .map-best`).textContent(), /^Gewinne erst /);
  assert.equal(await page.locator(`.map-card[data-map="${M0}"] .map-best`).textContent(), 'Noch nicht gespielt');
  assert.equal(await page.locator('.map-card.current').getAttribute('data-map'), M0);
  assert.equal(await page.locator('#hud-bar').isVisible(), false, 'HUD hinter dem Startbild verborgen');
  assert.equal(await page.locator('#sound').isVisible(), true, 'Ton bleibt erreichbar');
  // Esc schließt das Startbild beim ersten Laden nicht (es läuft noch kein Spiel)
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#start-screen').isVisible(), true, 'Startbild bleibt');
  // Leertaste startet die vorgewählte Karte, aber keine Welle
  await page.keyboard.press(' ');
  await page.waitForSelector('#start-screen', { state: 'hidden' });
  assert.deepEqual(await game(page), { mapId: M0, wave: 0, status: 'playing' });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('C5 Start: Tastatur (Pfeile + Enter) startet die gewählte Karte, Klick startet eine andere', async () => {
  const progress = { maps: { [M0]: { bestWave: MAX_WAVES, stars: 2 } } };
  const { ctx, page, errors } = await open(undefined, progress);
  // Neueste offene Karte ist vorgewählt, Sterne stehen im zugänglichen Namen
  assert.equal(await page.locator('.map-card.current').getAttribute('data-map'), M1);
  assert.match(await page.locator(`.map-card[data-map="${M0}"]`).getAttribute('aria-label'), /2 von 3 Sternen, beste Welle 20/);
  assert.equal(await page.locator(`.map-card[data-map="${M0}"] .map-best`).textContent(), `Beste Welle ${MAX_WAVES} / ${MAX_WAVES}`);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('.map-card.current').getAttribute('data-map'), M0);
  await page.keyboard.press('Enter');
  await page.waitForSelector('#start-screen', { state: 'hidden' });
  assert.equal((await game(page)).mapId, M0);
  assert.equal(await page.locator('#hud-bar').isVisible(), true);
  assert.equal(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).lastMap, PROGRESS_KEY), M0, 'Wahl gemerkt');
  // Neu laden und per Klick die zweite Karte starten
  await page.reload();
  await enterGame(page, M1);
  assert.equal((await game(page)).mapId, M1);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('C5 Spielende: Sieg zeigt Plakette mit Sternen, "Karten" öffnet die Kartenwahl, Esc zurück, Wahl startet neu', async () => {
  const { ctx, page, errors } = await open();
  await enterGame(page);
  await page.evaluate(([lives, wave]) => { const s = window.__game(); s.lives = lives; s.wave = wave; s.status = 'won'; }, [START_LIVES, MAX_WAVES]);
  await page.waitForSelector('#overlay:not([hidden]) .end-card');
  assert.equal(await page.locator('#overlay-title').textContent(), 'Gewonnen!');
  assert.equal(await page.locator('#end-stars svg').count(), 3);
  assert.equal(await page.locator('#end-stars').getAttribute('aria-label'), '3 von 3 Sternen');
  assert.equal(await page.locator('#to-maps').isVisible(), true);
  await page.locator('#to-maps').click();
  await page.waitForSelector('#start-screen:not([hidden])');
  // Nach dem Sieg ist die nächste Karte offen und vorgewählt
  assert.equal(await page.locator('.map-card.current').getAttribute('data-map'), M1);
  await page.keyboard.press('Escape');
  await page.waitForSelector('#start-screen', { state: 'hidden' });
  assert.equal(await page.locator('#overlay').isVisible(), true, 'zurück zur Plakette');
  await page.locator('#to-maps').click();
  await enterGame(page, M0);
  assert.deepEqual(await game(page), { mapId: M0, wave: 0, status: 'playing' });
  assert.equal(await page.locator('#overlay').isHidden(), true);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('C5 Spielende: Niederlage ohne Sterne, Neustart (Enter auf dem Knopf) beginnt neu', async () => {
  const { ctx, page, errors } = await open({ width: 390, height: 844 });
  await enterGame(page);
  await page.evaluate(() => { window.__game().status = 'lost'; });
  await page.waitForSelector('#overlay:not([hidden]) .end-card');
  assert.equal(await page.locator('#overlay-title').textContent(), 'Verloren');
  assert.equal(await page.locator('#end-stars svg').count(), 0);
  const card = await page.locator('.end-card').boundingBox();
  assert.ok(card.x >= 0 && card.x + card.width <= 390, 'Plakette passt aufs Handy');
  await page.locator('#restart').focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#overlay', { state: 'hidden' });
  assert.equal((await game(page)).status, 'playing');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('C5 Testseite (?test): kein Startbild, direkt im Spiel', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${url}?test`);
  await page.waitForSelector('#test-panel');
  assert.equal(await page.locator('#start-screen').isHidden(), true);
  await ctx.close();
});
