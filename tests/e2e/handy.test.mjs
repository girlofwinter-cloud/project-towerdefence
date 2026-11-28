// Browser-Test Handy (B-137, Bauvorlagen Handy-Quer.md, Handy-Hoch.md): Querformat zeigt das ganze Feld in voller Höhe,
// Bedienung schwebt in den Ecken; Hochformat zeigt nur den Hinweis "Bitte Handy drehen" und pausiert.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { tileCenter, enterGame, openRing, ringSettled } from './tile.mjs';
import { TILE, FRAME_MARGIN, VIEW_WIDTH, COLS, ROWS } from '../../src/config.js';

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

const MIN_TOUCH = 44;

async function openPhone(viewport) {
  const ctx = await browser.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await enterGame(page, 'meadow');
  await page.waitForSelector('#abilities .ability-btn');
  return { ctx, page, errors };
}

// Seite scrollt nicht, wichtige Bedienflächen liegen ganz im Fenster
async function layoutInfo(page, sels) {
  return page.evaluate((s) => ({
    w: innerWidth, h: innerHeight,
    scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight,
    boxes: Object.fromEntries(s.map((sel) => [sel, document.querySelector(sel).getBoundingClientRect().toJSON()])),
  }), sels);
}
// C4: Der Bau-Ring (#shop) ist geschlossen unsichtbar und wird nach dem Öffnen eigens geprüft
const CONTROLS = ['#hud-bar', '#sound', '#speed', '#pause', '#abilities', '#start-wave'];
function assertInside(r) {
  assert.ok(r.scrollW <= r.w && r.scrollH <= r.h, `Seite scrollt: ${r.scrollW}x${r.scrollH}`);
  for (const [sel, b] of Object.entries(r.boxes)) {
    assert.ok(b.width > 0 && b.left >= -0.5 && b.top >= -0.5 && b.right <= r.w + 0.5 && b.bottom <= r.h + 0.5, `${sel} im Fenster: ${JSON.stringify(b)}`);
  }
}

// Feldrechteck (ohne Rand) in CSS-px aus der Canvas-Box
function fieldRect(box) {
  const k = box.width / VIEW_WIDTH;
  const left = box.x + FRAME_MARGIN * k, top = box.y + FRAME_MARGIN * k;
  return { left, top, right: left + COLS * TILE * k, bottom: top + ROWS * TILE * k, tile: TILE * k };
}
const cut = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
const CORNERS = [[0, 0], [COLS - 1, 0], [0, ROWS - 1], [COLS - 1, ROWS - 1]];

for (const [width, height] of [[844, 390], [932, 430], [740, 360]]) {
  test(`B-137 Querformat ${width}x${height}: ganzes Feld in voller Höhe, kein Scrollen, Bedienung in den Ecken neben dem Feld, Tippziele >= 44`, async () => {
    const { ctx, page, errors } = await openPhone({ width, height });
    const r = await layoutInfo(page, CONTROLS);
    assertInside(r);
    const f = fieldRect(await page.locator('#game').boundingBox());
    // ganzes Feld sichtbar, füllt die Höhe, mittig; kein Zoom-Knopf, kein Wisch-Hinweis mehr
    assert.ok(f.left >= -0.5 && f.right <= width + 0.5 && f.top >= -0.5 && f.bottom <= height + 0.5, `Feld im Fenster: ${JSON.stringify(f)}`);
    assert.ok(Math.abs(f.bottom - f.top - height) < 1.5, `Feld füllt die Höhe: ${f.bottom - f.top}`);
    assert.ok(Math.abs(f.left - (width - f.right)) < 1.5, `Feld mittig: ${f.left} / ${width - f.right}`);
    if (width >= 844) assert.ok(f.tile >= 27, `Kachel ${f.tile} px`);
    assert.equal(await page.locator('#zoom, .swipe-hint').count(), 0, 'kein Zoom-Knopf, kein Wisch-Hinweis');
    // Bedienung schneidet das Feld nicht; Ecken: HUD und Fähigkeiten links, Knöpfe und Wellenknopf rechts
    for (const sel of CONTROLS) assert.ok(!cut(r.boxes[sel], f), `${sel} schneidet das Feld: ${JSON.stringify(r.boxes[sel])}`);
    const b = r.boxes;
    assert.ok(b['#hud-bar'].right <= f.left && b['#abilities'].right <= f.left && b['#abilities'].top >= b['#hud-bar'].bottom, 'HUD oben links, Fähigkeiten darunter');
    for (const sel of ['#speed', '#pause', '#sound', '#start-wave']) assert.ok(b[sel].left >= f.right, `${sel} rechts`);
    assert.ok(b['#start-wave'].top > height / 2 && b['#speed'].bottom < height / 2, 'Tempo oben, Wellenknopf unten');
    const wb = b['#start-wave'];
    assert.ok(Math.abs(wb.width - wb.height) < 1 && (await page.locator('#start-wave').evaluate((e) => getComputedStyle(e).borderRadius)) === '50%', 'Wellenknopf rund');
    // HUD-Zahlen kompakt
    assert.equal(await page.locator('#gold').evaluate((e) => getComputedStyle(e).fontSize), '22px');
    const hs = await page.$$eval('#abilities button, #sound, #speed, #pause, #start-wave', (els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    for (const h of hs) assert.ok(h.height >= MIN_TOUCH && h.width >= MIN_TOUCH, `Tippziel ${h.width}x${h.height}`);
    // Fähigkeiten nur als Symbol, Name im aria-label
    const ab = await page.$$eval('#abilities button', (els) => els.map((e) => ({ label: e.getAttribute('aria-label'), text: e.innerText.trim(), cap: e.querySelector('.cap') && getComputedStyle(e.querySelector('.cap')).display })));
    assert.equal(ab.length, 3);
    for (const a of ab) assert.ok(a.label && a.cap === 'none', `Fähigkeit ohne Text: ${JSON.stringify(a)}`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

// iOS Safari quer mit Adress- und Tab-Leiste lässt nur ca. 300 px Höhe: HUD und Fähigkeiten überlappten (Kanone über dem HUD)
for (const [width, height] of [[932, 300], [844, 280]]) {
  test(`Querformat niedrig ${width}x${height}: HUD und Fähigkeiten überlappen nicht, Feld ganz sichtbar, Tippziele >= 44`, async () => {
    const { ctx, page, errors } = await openPhone({ width, height });
    const r = await layoutInfo(page, CONTROLS);
    assertInside(r);
    const f = fieldRect(await page.locator('#game').boundingBox());
    assert.ok(f.top >= -0.5 && f.bottom <= height + 0.5, `Feld im Fenster: ${JSON.stringify(f)}`);
    const b = r.boxes;
    assert.ok(b['#abilities'].top >= b['#hud-bar'].bottom, `Fähigkeiten unter dem HUD: ${b['#hud-bar'].bottom} / ${b['#abilities'].top}`);
    for (const sel of CONTROLS) assert.ok(!cut(r.boxes[sel], f), `${sel} schneidet das Feld: ${JSON.stringify(r.boxes[sel])}`);
    const hs = await page.$$eval('#abilities button, #sound, #speed, #pause, #start-wave', (els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    for (const h of hs) assert.ok(h.height >= MIN_TOUCH && h.width >= MIN_TOUCH, `Tippziel ${h.width}x${h.height}`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('B-137 Querformat 844x390: Bedienung bleibt außerhalb der Safe-Area (Notch links, Rand rechts und unten)', async () => {
  const { ctx, page } = await openPhone({ width: 844, height: 390 });
  // env(safe-area-inset-*) liefert im Test 0: Werte wie beim iPhone quer über die Variablen setzen, die style.css daraus bildet
  await page.evaluate(() => Object.entries({ '--safe-l': '47px', '--safe-r': '47px', '--safe-b': '21px' }).forEach(([k, v]) => document.documentElement.style.setProperty(k, v)));
  const r = await layoutInfo(page, CONTROLS);
  for (const [sel, b] of Object.entries(r.boxes)) {
    assert.ok(b.left >= 47 - 0.5 && b.right <= 844 - 47 + 0.5 && b.bottom <= 390 - 21 + 0.5, `${sel} in der Safe-Area: ${JSON.stringify(b)}`);
  }
  const hs = await page.$$eval('#abilities button, #sound, #speed, #pause, #start-wave', (els) => els.map((e) => e.getBoundingClientRect().height));
  for (const h of hs) assert.ok(h >= MIN_TOUCH, `Knopfhöhe ${h}`);
  await ctx.close();
});

for (const [width, height] of [[844, 390], [932, 430]]) {
  test(`B-137 Querformat ${width}x${height}: Bau-Ring an allen 4 Feldecken im Bild, Bauen und Turm antippen klappen`, async () => {
    const { ctx, page, errors } = await openPhone({ width, height });
    await page.evaluate(() => { window.__game().gold = 1000; });
    const box = await page.locator('#game').boundingBox();
    const f = fieldRect(box);
    const ctl = (await layoutInfo(page, CONTROLS)).boxes;
    for (const [col, row] of CORNERS) {
      const [x, y] = tileCenter(box, col, row);
      assert.ok(x > f.left && x < f.right && y > f.top && y < f.bottom, `Kachel ${col},${row} sichtbar`);
      await openRing(page, col, row, { touch: true });
      assert.deepEqual(await page.evaluate(() => window.__ui.ring), { col, row }, `Ring an Kachel ${col},${row}`);
      // Ring ganz im Bild, Knöpfe >= 44 px, nicht unter der Bedienung in den Ecken
      const rb = await page.$$eval('#shop .tower-btn', (els) => els.map((e) => e.getBoundingClientRect().toJSON()));
      assert.equal(rb.length, 5);
      for (const b of rb) {
        assert.ok(b.height >= MIN_TOUCH && b.left >= -0.5 && b.top >= -0.5 && b.right <= width + 0.5 && b.bottom <= height + 0.5, `Ringknopf ${col},${row}: ${JSON.stringify(b)}`);
        for (const [sel, c] of Object.entries(ctl)) assert.ok(!cut(b, c), `Ringknopf ${col},${row} unter ${sel}`);
        assert.ok(b.left >= f.left - 0.5 && b.right <= f.right + 0.5, `Ringknopf ${col},${row} ins Feld geschoben: ${JSON.stringify(b)}`);
      }
      await page.locator('#shop .tower-btn[data-type="arrow"]').tap();
    }
    assert.deepEqual(await page.evaluate(() => window.__game().towers.map((x) => [x.col, x.row]).sort()), CORNERS.map((c) => [...c]).sort());
    // Turm antippen: Turm-Ring mit Knöpfen im Bild, Info-Plakette rechts neben dem Feld
    await page.touchscreen.tap(...tileCenter(box, 0, 0));
    await page.waitForSelector('#tower-info:not([hidden])');
    await ringSettled(page);
    for (const sel of ['#upgrade', '#sell', '#target-mode', '#ti-close']) {
      const b = await page.locator(sel).evaluate((e) => e.getBoundingClientRect().toJSON());
      assert.ok(b.height >= MIN_TOUCH && b.left >= -0.5 && b.top >= -0.5 && b.right <= width + 0.5 && b.bottom <= height + 0.5, `${sel}: ${JSON.stringify(b)}`);
    }
    const info = await page.locator('#tower-info .ring-info').evaluate((e) => e.getBoundingClientRect().toJSON());
    assert.ok(info.left >= f.right - 0.5 && info.right <= width + 0.5 && info.top >= -0.5 && info.bottom <= height + 0.5, `Info-Plakette rechts: ${JSON.stringify(info)}`);
    for (const [sel, c] of Object.entries(ctl)) assert.ok(!cut(info, c), `Info-Plakette unter ${sel}`);
    assert.match(await page.locator('#ti-name').textContent(), /Pfeilturm · Stufe 1/);
    await page.locator('#upgrade').tap();
    assert.equal(await page.evaluate(() => window.__game().towers.find((t) => t.col === 0 && t.row === 0).level), 2, 'Verbessern per Tipp');
    await page.locator('#ti-close').tap();
    assert.ok(await page.locator('#tower-info').isHidden());
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('B-137 Hochformat 390x844: Hinweis "Bitte Handy drehen" schon auf dem Startbild, verdeckt alles', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForSelector('#start-screen:not([hidden]) .map-card');
  const hint = page.locator('#rotate-hint');
  assert.ok(await hint.isVisible(), 'Hinweis sichtbar');
  assert.match(await hint.innerText(), /Bitte Handy drehen/);
  assert.equal(await hint.locator('svg').count(), 1, 'mit Symbol');
  const top = await page.evaluate(() => document.getElementById('rotate-hint').contains(document.elementFromPoint(innerWidth / 2, innerHeight - 20)));
  assert.ok(top, 'Hinweis liegt über allem');
  await ctx.close();
});

test('B-137 Drehen 844x390 -> 390x844 -> zurück: Spiel pausiert mit Hinweis und läuft danach weiter; eigene Pause bleibt', async () => {
  const { ctx, page, errors } = await openPhone({ width: 844, height: 390 });
  assert.ok(await page.locator('#rotate-hint').isHidden(), 'quer kein Hinweis');
  await page.locator('#start-wave').tap();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForSelector('#rotate-hint', { state: 'visible' });
  // Media-Ereignis kommt nach dem Neuzeichnen: auf die Pause warten (Zeitüberschreitung = Fehler)
  await page.waitForFunction(() => window.__game().paused === true, null, { timeout: 3000 });
  assert.equal(await page.evaluate(() => document.getElementById('app').inert), true, 'Spielbereich unter dem Hinweis inert');
  const t0 = await page.evaluate(() => window.__game().time);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForSelector('#rotate-hint', { state: 'hidden' });
  await page.waitForFunction(() => window.__game().paused === false, null, { timeout: 3000 }); // läuft weiter
  assert.equal(await page.evaluate(() => document.getElementById('app').inert), false, 'nach dem Drehen wieder bedienbar');
  await page.waitForFunction((t) => window.__game().time > t, t0);
  // Spieler pausiert selbst: nach dem Drehen bleibt die Pause
  await page.locator('#pause').tap();
  assert.equal(await page.evaluate(() => window.__game().paused), true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForSelector('#rotate-hint', { state: 'visible' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForSelector('#rotate-hint', { state: 'hidden' });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 300)))));
  assert.equal(await page.evaluate(() => window.__game().paused), true, 'eigene Pause bleibt');
  assert.deepEqual(errors, []);
  await ctx.close();
});

for (const [width, height] of [[844, 390], [932, 430], [740, 360]]) {
  test(`Startbildschirm ${width}x${height}: alle Karten ohne Scrollen im Fenster`, async () => {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto(url);
    await page.waitForSelector('#start-screen:not([hidden]) .map-card');
    const r = await page.evaluate(() => {
      const s = document.getElementById('start-screen');
      return { sh: s.scrollHeight, ch: s.clientHeight, cards: [...document.querySelectorAll('.map-card, .start-title, #sound')].map((e) => e.getBoundingClientRect().toJSON()) };
    });
    assert.ok(r.sh <= r.ch, `Startbild scrollt: ${r.sh} > ${r.ch}`);
    for (const b of r.cards) assert.ok(b.left >= 0 && b.top >= 0 && b.right <= width && b.bottom <= height, JSON.stringify(b));
    await ctx.close();
  });
}

test('Spielende Querformat 844x390 und 932x430: Plakette im Fenster, Hintergrund bei Sieg wie bei Niederlage abgedunkelt', async () => {
  for (const viewport of [{ width: 844, height: 390 }, { width: 932, height: 430 }]) {
    const { ctx, page } = await openPhone(viewport);
    const look = async (status) => {
      await page.evaluate((st) => { window.__game().status = st; }, status);
      await page.waitForSelector('#overlay:not([hidden]) .end-card');
      return page.evaluate(() => {
        const o = document.getElementById('overlay'), r = o.getBoundingClientRect();
        const top = document.elementFromPoint(5, innerHeight / 2);
        return { bg: getComputedStyle(o).backgroundColor, full: r.left <= 0 && r.top <= 0 && r.right >= innerWidth && r.bottom >= innerHeight, coversHud: o.contains(top) || top === o,
          card: document.querySelector('.end-card').getBoundingClientRect().toJSON(), restart: document.getElementById('restart').getBoundingClientRect().toJSON() };
      });
    };
    const won = await look('won');
    await page.evaluate(() => { window.__game().status = 'playing'; });
    await page.waitForSelector('#overlay', { state: 'hidden' });
    const lost = await look('lost');
    for (const v of [won, lost]) {
      assert.ok(v.full && v.coversHud, `Abdunklung über dem ganzen Fenster (${viewport.width})`);
      assert.ok(v.restart.bottom <= viewport.height && v.restart.top >= 0 && v.card.left >= 0 && v.card.right <= viewport.width, 'Plakette im Fenster');
    }
    assert.equal(won.bg, lost.bg);
    assert.match(won.bg, /rgba\(16, 28, 14, 0\.(7|8)/);
    await ctx.close();
  }
});

// Start im Hochformat, dann drehen: das Laden brach ab (updateBossBars vor der Initialisierung), Vollbild-Knopf fehlte
test('Start im Hochformat, dann quer: keine Fehler beim Laden, Vollbild-Knopf sichtbar, Karte wählbar', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForSelector('#rotate-hint', { state: 'visible' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForSelector('#fullscreen', { state: 'visible' });
  await enterGame(page, 'meadow');
  await page.waitForSelector('#abilities .ability-btn');
  assert.ok(await page.locator('#fullscreen').isVisible(), 'Vollbild-Knopf im Spiel');
  assert.deepEqual(errors, []);
  await ctx.close();
});

// Drehhinweis mit Knopf "Im Vollbild spielen": ein Tippen schaltet Vollbild ein, danach ist der Knopf weg
test('Hochformat: Drehhinweis zeigt Vollbild-Knopf, Tippen startet Vollbild', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  const btn = page.locator('#rotate-fullscreen');
  await btn.waitFor({ state: 'visible' });
  assert.match(await btn.innerText(), /Vollbild/);
  const b = await btn.boundingBox();
  assert.ok(b.height >= MIN_TOUCH && b.y + b.height <= 844, `Knopf tippbar im Bild: ${JSON.stringify(b)}`);
  await btn.tap();
  await page.waitForFunction(() => document.fullscreenElement !== null, null, { timeout: 3000 });
  await btn.waitFor({ state: 'hidden' });
  assert.deepEqual(errors, []);
  await ctx.close();
});
