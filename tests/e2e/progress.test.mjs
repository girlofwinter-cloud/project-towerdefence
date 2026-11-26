// Browser-Test für den gespeicherten Fortschritt (B-093/B-094): Sieg schaltet die nächste Karte frei.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { PROGRESS_KEY, START_LIVES, MAX_WAVES } from '../../src/config.js';
import { MAP_ORDER } from '../../src/progress.js';
import { tileCenter } from './tile.mjs';

// Karten über MAP_ORDER-Indizes (B-101), damit Änderungen an der Kartenliste die Tests nicht brechen.
const [M0, M1] = MAP_ORDER;

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
  assert.equal(await optionDisabled('ice'), true);
});

test('Fortschritt: Sieg schaltet die nächste Karte frei, Overlay meldet es, bleibt nach Neuladen', async () => {
  // Sieg direkt im Spielzustand setzen (das normale Spiel speichert das Ergebnis beim nächsten HUD-Update)
  await page.evaluate(([lives, wave]) => { const s = window.__game(); s.lives = lives; s.wave = wave; s.status = 'won'; }, [START_LIVES, MAX_WAVES]);
  await page.waitForSelector('#overlay:not([hidden]) .result-highlight');
  const lines = await page.locator('#overlay-progress .result-line').allTextContents();
  assert.ok(lines.includes('Neue Karte freigeschaltet: Eiswelt'), lines.join(' | '));
  assert.ok(!lines.includes('Neuer Rekord!'), 'Erstes Ergebnis: keine Rekordmeldung');
  assert.equal(await optionDisabled('ice'), false);
  assert.ok(await page.evaluate((k) => localStorage.getItem(k), PROGRESS_KEY));
  // Nach dem Sieg ist die nächste Karte vorgewählt: der Knopf nennt sie und startet dort
  assert.equal(await page.locator('#restart').textContent(), 'Weiter: Eiswelt');
  await page.locator('#restart').click();
  assert.equal(await page.evaluate(() => window.__game().mapId), 'ice');
  assert.equal(await page.locator('#map-select').inputValue(), 'ice');
  await page.reload();
  await page.waitForSelector('#shop .tower-btn');
  assert.equal(await optionDisabled('ice'), false);
  assert.equal(await optionDisabled('fork'), true);
  assert.deepEqual(errors, []);
});

test('Startkarte (B-101): neueste freigeschaltete Karte, gewählte Karte bleibt nach Neuladen', async () => {
  const p2 = await (await browser.newContext()).newPage();
  const errs = [];
  p2.on('pageerror', (e) => errs.push(e.message));
  await p2.goto(url);
  await p2.waitForSelector('#shop .tower-btn');
  // Stand ohne lastMap: erste Karte geschafft, zweite freigeschaltet
  await p2.evaluate(([k, m0, w]) => localStorage.setItem(k, JSON.stringify({ maps: { [m0]: { bestWave: w, stars: 2 } } })), [PROGRESS_KEY, M0, MAX_WAVES]);
  await p2.reload();
  await p2.waitForSelector('#shop .tower-btn');
  assert.equal(await p2.locator('#map-select').inputValue(), M1);
  assert.equal(await p2.evaluate(() => window.__game().mapId), M1);
  // Zurück auf die erste Karte wechseln, neu laden: sie bleibt
  await p2.selectOption('#map-select', M0);
  assert.equal(await p2.evaluate(() => window.__game().mapId), M0);
  await p2.reload();
  await p2.waitForSelector('#shop .tower-btn');
  assert.equal(await p2.locator('#map-select').inputValue(), M0);
  assert.equal(await p2.evaluate(() => window.__game().mapId), M0);
  assert.deepEqual(errs, []);
  await p2.context().close();
});

test('Startkarte (B-101 Randfall): Kartenwechsel während laufender Welle wird abgelehnt und nicht gespeichert', async () => {
  const p3 = await (await browser.newContext()).newPage();
  const errs = [];
  p3.on('pageerror', (e) => errs.push(e.message));
  await p3.goto(url);
  await p3.waitForSelector('#shop .tower-btn');
  await p3.evaluate(([k, m0, m1, w]) => localStorage.setItem(k, JSON.stringify({ maps: { [m0]: { bestWave: w, stars: 2 } }, lastMap: m1 })), [PROGRESS_KEY, M0, M1, MAX_WAVES]);
  await p3.reload();
  await p3.waitForSelector('#shop .tower-btn');
  assert.equal(await p3.evaluate(() => window.__game().mapId), M1);
  await p3.locator('#start-wave').click();
  assert.equal(await p3.evaluate(() => window.__game().waveActive), true);
  assert.equal(await p3.locator('#map-select').isDisabled(), true, 'Auswahl im Kampf gesperrt');
  // Auch ein erzwungenes change-Ereignis (Sperre umgangen) darf nicht wechseln oder speichern
  await p3.evaluate((m0) => {
    const sel = document.getElementById('map-select');
    sel.value = m0;
    sel.dispatchEvent(new Event('change'));
  }, M0);
  assert.equal(await p3.evaluate(() => window.__game().mapId), M1, 'Karte bleibt');
  assert.equal(await p3.locator('#map-select').inputValue(), M1);
  const saved = await p3.evaluate((k) => JSON.parse(localStorage.getItem(k)), PROGRESS_KEY);
  assert.equal(saved.lastMap, M1, 'nichts gespeichert');
  assert.deepEqual(errs, []);
  await p3.context().close();
});

test('Ohne ResizeObserver (ältere Browser): Seite startet ohne Fehler, Turm-Panel lässt sich öffnen', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { delete window.ResizeObserver; });
  const p4 = await ctx.newPage();
  const errs = [];
  p4.on('pageerror', (e) => errs.push(e.message));
  await p4.goto(`${url}?test`);
  await p4.waitForSelector('#test-panel');
  assert.equal(await p4.evaluate(() => typeof window.ResizeObserver), 'undefined');
  await p4.locator('.tower-btn[data-type="frost"]').click();
  await p4.evaluate(() => window.scrollTo(0, 0));
  const box = await p4.locator('#game').boundingBox();
  const at = tileCenter(box, 0, 0);
  await p4.mouse.click(...at);
  await p4.mouse.click(...at);
  await p4.keyboard.press('Escape');
  await p4.mouse.click(...at);
  await p4.waitForSelector('#tower-info:not([hidden])');
  assert.deepEqual(errs, []);
  await ctx.close();
});
