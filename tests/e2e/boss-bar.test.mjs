// Browser-Test B-180 Boss-Leiste (Tester): Lage mit einem und mit drei Bossen (Welle 20: Nekromantin + zwei Oger-Könige)
// auf dem Desktop und dem Handy quer (844x390); die Leisten bleiben im Bild und verdecken keine Bedienknöpfe.
// Ausführen: npm run test:e2e   (braucht Playwright)
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

const CONTROLS = ['#hud-bar', '.top-buttons', '#speed', '#pause', '#sound', '#abilities', '#start-wave'];
const cut = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;

async function open(viewport, phone) {
  const ctx = await browser.newContext(phone ? { viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await enterGame(page, 'meadow');
  return { ctx, page, errors };
}

// Bosse über das Spielmodul erzeugen (gleiche Modul-Instanz wie main.js), Spiel pausieren, damit nichts stirbt
async function spawnBosses(page, types) {
  await page.evaluate(async (list) => {
    const g = await import('/src/game.js');
    const s = window.__game();
    s.wave = 20;
    for (const t of list) g.spawnEnemy(s, t, 20);
    s.paused = true;
  }, types);
  await page.waitForSelector('#boss-bars:not([hidden])');
  await page.waitForTimeout(500); // Einflug-Animation (0,3 s)
}

const rects = (page, sels) => page.evaluate((s) => Object.fromEntries(s.map((q) => {
  const el = document.querySelector(q);
  const r = el && !el.hidden && el.getClientRects().length ? el.getBoundingClientRect().toJSON() : null;
  return [q, r];
})), sels);

for (const [name, viewport, phone] of [['Desktop 1280x720', { width: 1280, height: 720 }, false], ['Handy quer 844x390', { width: 844, height: 390 }, true]]) {
  for (const bosses of [['necro'], ['necro', 'boss', 'boss']]) {
    test(`B-180 Boss-Leiste ${name}, ${bosses.length} Boss(e): im Bild, keine Überdeckung der Bedienelemente`, async () => {
      const { ctx, page, errors } = await open(viewport, phone);
      await spawnBosses(page, bosses);
      const r = await rects(page, ['#boss-bar', '#boss-bar-2', ...CONTROLS]);
      const bars = [r['#boss-bar'], r['#boss-bar-2']].filter(Boolean);
      assert.equal(bars.length, Math.min(2, bosses.length), 'eine Leiste je Boss, höchstens zwei');
      for (const b of bars) {
        assert.ok(b.left >= 0 && b.top >= 0 && b.right <= viewport.width + 0.5 && b.bottom <= viewport.height + 0.5, `Leiste im Bild: ${JSON.stringify(b)}`);
        assert.ok(b.width > 100, `Leiste breit genug: ${b.width}`);
        for (const q of CONTROLS) if (r[q]) assert.ok(!cut(b, r[q]), `Leiste überdeckt ${q}: ${JSON.stringify(b)} / ${JSON.stringify(r[q])}`);
      }
      if (bars.length === 2) assert.ok(!cut(bars[0], bars[1]), 'zwei Leisten überlappen sich nicht');
      assert.deepEqual(errors, []);
      await ctx.close();
    });
  }
}

// Name und Phasen-Text dürfen sich auf dem Desktop nicht überdecken, auch wenn die Lücke zwischen HUD und Knöpfen
// die Leiste schmaler macht (bossBarPlacement), und auch bei "Oger-König ×2".
for (const viewport of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
  test(`B-180 Boss-Leiste ${viewport.width}x${viewport.height}: Name und Phase überdecken sich nicht, Name nicht abgeschnitten`, async () => {
    const { ctx, page, errors } = await open(viewport, false);
    await spawnBosses(page, ['necro', 'boss', 'boss']);
    const r = await page.evaluate(() => [...document.querySelectorAll('.boss-bar:not([hidden])')].map((b) => {
      const box = b.getBoundingClientRect().toJSON();
      const name = b.querySelector('.bb-name').getBoundingClientRect().toJSON();
      const phaseEl = b.querySelector('.bb-phase');
      const phase = phaseEl.textContent ? phaseEl.getBoundingClientRect().toJSON() : null;
      return { box, name, phase, text: b.querySelector('.bb-name').textContent };
    }));
    assert.equal(r.length, 2);
    for (const b of r) {
      assert.ok(b.name.right <= b.box.right + 0.5, `Name ragt aus der Leiste: ${b.text} ${JSON.stringify(b)}`);
      if (b.phase) assert.ok(b.name.right <= b.phase.left + 0.5, `Name "${b.text}" überdeckt den Phasen-Text: Name endet ${b.name.right}, Phase beginnt ${b.phase.left}, Leiste ${b.box.width} breit`);
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}
