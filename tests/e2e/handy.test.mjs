// Browser-Test C6 Handy (Bauvorlagen Handy-Hoch.md, Handy-Quer.md): Hochformat wischt das Feld seitlich, Querformat mit Spalten.
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { tileCenter, enterGame, openRing, ringSettled } from './tile.mjs';
import { TILE, FRAME_MARGIN, VIEW_WIDTH, COLS, ROWS } from '../../src/config.js';
import { createGame, canBuild } from '../../src/game.js';

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

// Wischen per Touch (CDP: echte Touch-Ereignisse, der Browser scrollt selbst)
async function swipe(page, x0, y, dx) {
  const cdp = await page.context().newCDPSession(page);
  const steps = 8;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (dx * i) / steps, y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  // Nachlauf (Schwung) abwarten: scrollLeft über mehrere Bilder unverändert
  await page.evaluate(() => new Promise((r) => {
    const st = document.querySelector('.stage');
    let last = -1, same = 0;
    const tick = () => { if (st.scrollLeft === last) same++; else { same = 0; last = st.scrollLeft; } if (same >= 10) r(); else requestAnimationFrame(tick); };
    tick();
  }));
}

// Erste freie Kachel der Wiese, deren Mitte im sichtbaren Feldteil liegt (mit Abstand zum Rand)
function visibleFreeTile(box, stage, minCol = 0) {
  const s = createGame({ mapId: 'meadow' });
  for (let col = minCol; col < COLS; col++) {
    for (let row = 1; row < ROWS - 1; row++) {
      const [x, y] = tileCenter(box, col, row);
      if (x > stage.left + 20 && x < stage.right - 90 && y > stage.top + 20 && y < stage.bottom - 60 && canBuild(s, col, row).ok) return { col, row, x, y };
    }
  }
  return null;
}

for (const [width, height] of [[390, 844], [360, 740]]) {
  test(`C6 Hochformat ${width}x${height}: kein Seiten-Scroll, Bedienung im Fenster, Dock unten, Feld füllt die Höhe`, async () => {
    const { ctx, page, errors } = await openPhone({ width, height });
    const r = await layoutInfo(page, [...CONTROLS, '#zoom']);
    assertInside(r);
    const b = { ...r.boxes, ...(await layoutInfo(page, ['.stage', '#game'])).boxes };
    assert.ok(Math.abs(b['#start-wave'].bottom - (height - 10)) < 1, `Wellenknopf unten: ${b['#start-wave'].bottom}`);
    for (const sel of ['#sound', '#speed', '#pause', '#zoom']) assert.ok(b[sel].height >= MIN_TOUCH, `${sel} ${b[sel].height}`);
    assert.ok(b['.stage'].top >= b['#hud-bar'].bottom && b['.stage'].bottom <= b['#abilities'].top, 'Feld zwischen Kopfleiste und Dock');
    // Feld füllt die Höhe: Feldhöhe (ohne Rand) = Höhe des Ausschnitts
    const k = b['#game'].width / VIEW_WIDTH;
    assert.ok(Math.abs(ROWS * TILE * k - b['.stage'].height) < 1.5, `Feld ${ROWS * TILE * k} / Ausschnitt ${b['.stage'].height}`);
    if (width >= 390) assert.ok(TILE * k >= MIN_TOUCH, `Kachel ${TILE * k} px`);
    assert.ok(b['#game'].width > width, 'Feld breiter als der Bildschirm (wischbar)');
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('C6 Hochformat 390x844: Wischen bewegt die Ansicht, baut nicht und scrollt die Seite nicht; Tipp danach baut auf der richtigen Kachel', async () => {
  const { ctx, page, errors } = await openPhone({ width: 390, height: 844 });
  assert.equal(await page.locator('.swipe-hint').isVisible(), true, 'Wisch-Hinweis sichtbar');
  const before = await page.locator('#game').boundingBox();
  await swipe(page, 300, 400, -220);
  const after = await page.locator('#game').boundingBox();
  const st = await page.evaluate(() => ({ left: document.querySelector('.stage').scrollLeft, sx: scrollX, sy: scrollY }));
  assert.ok(st.left > 100, `Ansicht gewischt: scrollLeft ${st.left}`);
  assert.ok(after.x < before.x - 100, `Canvas nach links: ${before.x} -> ${after.x}`);
  assert.deepEqual([st.sx, st.sy], [0, 0], 'Seite selbst scrollt nicht');
  assert.equal(await page.evaluate(() => window.__game().towers.length), 0, 'Wischen baut nicht');
  assert.equal(await page.evaluate(() => window.__ui.pending), null, 'Wischen setzt keine Vorschau');
  assert.equal(await page.evaluate(() => window.__ui.ring), null, 'C4: Wischen öffnet keinen Bau-Ring (Tipp-Schwelle)');
  assert.equal(await page.locator('.swipe-hint').isVisible(), false, 'Hinweis nach dem Wischen weg');
  assert.ok(await page.evaluate(() => document.getElementById('app').classList.contains('can-left')), 'Schattenkante links');
  // Kachel rechts der Startansicht (vorher nicht sichtbar) per Tipp bauen
  const stage = await page.locator('.stage').evaluate((e) => e.getBoundingClientRect().toJSON());
  const t = visibleFreeTile(after, stage, 8);
  assert.ok(t, 'freie Kachel im gewischten Ausschnitt');
  await page.touchscreen.tap(t.x, t.y);
  await page.waitForSelector('#shop:not([hidden]) .tower-btn');
  assert.deepEqual(await page.evaluate(() => window.__ui.ring), { col: t.col, row: t.row }, 'Tipp öffnet den Ring an der richtigen Kachel');
  await ringSettled(page);
  await page.locator('#shop .tower-btn[data-type="arrow"]').tap();
  assert.deepEqual(await page.evaluate(() => window.__game().towers.map((x) => [x.col, x.row])), [[t.col, t.row]]);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('C6 Hochformat 390x844: Zoom-Knopf Übersicht zeigt das ganze Feld, Tipp trifft dort die richtige Kachel, zurück auf Nah', async () => {
  const { ctx, page } = await openPhone({ width: 390, height: 844 });
  assert.equal(await page.locator('#zoom').getAttribute('aria-label'), 'Übersicht');
  await page.locator('#zoom').tap();
  assert.equal(await page.locator('#zoom').getAttribute('aria-label'), 'Nah');
  const box = await page.locator('#game').boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390 + 0.5, `Feld ganz sichtbar (keine Turmleiste mehr): ${JSON.stringify(box)}`);
  await openRing(page, 0, 0, { touch: true });
  await page.locator('#shop .tower-btn[data-type="arrow"]').tap();
  assert.deepEqual(await page.evaluate(() => window.__game().towers.map((x) => [x.col, x.row])), [[0, 0]]);
  await page.locator('#zoom').tap();
  assert.ok((await page.locator('#game').boundingBox()).width > 390, 'wieder Nah');
  await ctx.close();
});

for (const [width, height] of [[844, 390], [740, 360]]) {
  test(`C6 Querformat ${width}x${height}: kein Scrollen, Spalten neben dem Feld, Knöpfe >= 44, Bauen auf (0,0) und (19,13)`, async () => {
    const { ctx, page, errors } = await openPhone({ width, height });
    const r = await layoutInfo(page, CONTROLS);
    assertInside(r);
    const f = (await layoutInfo(page, ['.stage'])).boxes['.stage'];
    assert.ok(Math.abs(f.height - height) < 1.5, `Feld füllt die Höhe: ${f.height}`);
    for (const sel of CONTROLS) {
      const b = r.boxes[sel];
      const overlaps = b.left < f.right - 0.5 && b.right > f.left + 0.5 && b.top < f.bottom && b.bottom > f.top;
      assert.ok(!overlaps, `${sel} schneidet das Feld: ${JSON.stringify(b)}`);
    }
    const hs = await page.$$eval('#abilities button, #sound, #speed, #pause, #start-wave', (els) => els.map((e) => e.getBoundingClientRect().height));
    for (const h of hs) assert.ok(h >= MIN_TOUCH, `Knopfhöhe ${h}`);
    // Feld genau 800u breit: Spalten links und rechts gleich breit
    assert.ok(Math.abs(f.left - (width - f.right)) < 1.5, `Spalten ${f.left} / ${width - f.right}`);
    const box = await page.locator('#game').boundingBox();
    // Alle 20 Spalten ganz sichtbar: linke Kante von Spalte 0 und rechte Kante von Spalte 19 im Feldausschnitt
    // (nur der Rand mit Fahne und Burg liegt laut Handy-Quer.md unter den Spalten; Welle startet über den Knopf)
    const k = box.width / VIEW_WIDTH;
    const col0 = box.x + FRAME_MARGIN * k, col19end = box.x + (FRAME_MARGIN + COLS * TILE) * k;
    assert.ok(col0 >= f.left - 0.5 && col19end <= f.right + 0.5, `Spalten 0–19: ${col0}–${col19end}, Feld ${f.left}–${f.right}`);
    for (const [col, row] of [[0, 0], [COLS - 1, ROWS - 1]]) {
      const [x, y] = tileCenter(box, col, row);
      assert.ok(x > f.left && x < f.right && y > f.top && y < f.bottom, `Kachel ${col},${row} sichtbar`);
      await openRing(page, col, row, { touch: true });
      // C4: Bau-Ring ganz im Fenster, Knöpfe >= 44 px
      const rb = await page.$$eval('#shop .tower-btn', (els) => els.map((e) => e.getBoundingClientRect().toJSON()));
      for (const b of rb) assert.ok(b.height >= MIN_TOUCH && b.left >= -0.5 && b.top >= -0.5 && b.right <= width + 0.5 && b.bottom <= height + 0.5, `Ringknopf ${JSON.stringify(b)}`);
      await page.locator('#shop .tower-btn[data-type="arrow"]').tap();
    }
    assert.deepEqual(await page.evaluate(() => window.__game().towers.map((x) => [x.col, x.row]).sort()), [[0, 0], [COLS - 1, ROWS - 1]]);
    // Turm gewählt: Werte und Knöpfe in der rechten Spalte, Feld bleibt frei
    await page.touchscreen.tap(...tileCenter(box, 0, 0));
    await page.waitForSelector('#tower-info:not([hidden])');
    const ti = await page.locator('#tower-info').evaluate((e) => e.getBoundingClientRect().toJSON());
    assert.ok(ti.left >= f.right - 0.5 && ti.right <= width + 0.5, `Turm-Spalte rechts neben dem Feld: ${JSON.stringify(ti)}`);
    for (const sel of ['#upgrade', '#sell', '#target-mode', '#ti-close']) {
      const b = await page.locator(sel).evaluate((e) => e.getBoundingClientRect().toJSON());
      assert.ok(b.height >= MIN_TOUCH && b.bottom <= height + 0.5 && b.left >= ti.left - 0.5, `${sel}: ${JSON.stringify(b)}`);
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

for (const [width, height] of [[390, 844], [360, 740], [844, 390], [740, 360]]) {
  test(`C6 Startbildschirm ${width}x${height}: alle Karten ohne Scrollen im Fenster`, async () => {
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

test('C6 Spielende Hochformat und Querformat: Plakette im Fenster, Hintergrund bei Sieg wie bei Niederlage abgedunkelt', async () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
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
