// Browser-Test für den gespeicherten Fortschritt (B-093/B-094): Sieg schaltet die nächste Karte frei.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { PROGRESS_KEY, START_LIVES, MAX_WAVES } from '../../src/config.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

let server, browser, page, url;
const errors = [];

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  url = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch();
  // Eigener, frischer Kontext: leerer localStorage
  page = await (await browser.newContext()).newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.waitForSelector('#shop .tower-btn');
});

after(async () => {
  await browser?.close();
  server?.close();
});

const optionDisabled = (id) => page.locator(`#map-select option[value="${id}"]`).evaluate((o) => o.disabled);

test('Fortschritt: frisch ist nur die erste Karte offen', async () => {
  assert.equal(await optionDisabled('meadow'), false);
  assert.equal(await optionDisabled('forest'), true);
});

test('Fortschritt: Sieg schaltet die nächste Karte frei, Overlay meldet es, bleibt nach Neuladen', async () => {
  // Sieg direkt im Spielzustand setzen (das normale Spiel speichert das Ergebnis beim nächsten HUD-Update)
  await page.evaluate(([lives, wave]) => { const s = window.__game(); s.lives = lives; s.wave = wave; s.status = 'won'; }, [START_LIVES, MAX_WAVES]);
  await page.waitForSelector('#overlay:not([hidden]) .result-highlight');
  const lines = await page.locator('#overlay-progress .result-line').allTextContents();
  assert.ok(lines.includes('Neue Karte freigeschaltet: Wald'), lines.join(' | '));
  assert.ok(!lines.includes('Neuer Rekord!'), 'Erstes Ergebnis: keine Rekordmeldung');
  assert.equal(await optionDisabled('forest'), false);
  assert.ok(await page.evaluate((k) => localStorage.getItem(k), PROGRESS_KEY));
  await page.reload();
  await page.waitForSelector('#shop .tower-btn');
  assert.equal(await optionDisabled('forest'), false);
  assert.equal(await optionDisabled('ice'), true);
  assert.deepEqual(errors, []);
});
