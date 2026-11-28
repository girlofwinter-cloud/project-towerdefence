// Browser-Test: Aus dem laufenden Spiel zur Kartenauswahl (Knopf im Pause-Schild),
// zurück ohne Verlust und Rückfrage, bevor eine neue Karte das Spiel ersetzt.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';

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

test('Kartenauswahl mitten im Spiel: zurück behält das Spiel, neue Karte fragt nach', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.click('.map-card.current');
  await page.waitForSelector('#start-screen', { state: 'hidden' });
  await page.click('#start-wave');
  await page.keyboard.press('p');
  await page.click('#menu-maps');
  await page.waitForSelector('#start-screen', { state: 'visible' });
  // Zurück: Spiel unverändert und weiter pausiert
  await page.click('.start-back');
  await page.waitForSelector('#start-screen', { state: 'hidden' });
  const s = await page.evaluate(() => { const g = window.__game(); return { wave: g.wave, paused: g.paused }; });
  assert.deepEqual(s, { wave: 1, paused: true });
  // Neue Karte: Rückfrage abgelehnt -> Spiel bleibt, Auswahl bleibt offen
  await page.click('#menu-maps');
  page.once('dialog', (d) => d.dismiss());
  await page.click('.map-card.current');
  assert.equal(await page.isVisible('#start-screen'), true);
  assert.equal(await page.evaluate(() => window.__game().wave), 1);
  // Rückfrage bestätigt -> neues Spiel
  page.once('dialog', (d) => d.accept());
  await page.click('.map-card.current');
  await page.waitForSelector('#start-screen', { state: 'hidden' });
  assert.equal(await page.evaluate(() => window.__game().wave), 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});
