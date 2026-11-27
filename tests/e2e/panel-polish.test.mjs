// Browser-Test B-097: Feinschliff Turm-Panel (Fokus nach ×, Beschriftung, Klammern, Leistenhöhe bei 200 % Schrift,
// gleich hohe Shop-Karten am Desktop).
// Ausführen: npm run test:e2e   (braucht Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from '../../scripts/serve.mjs';
import { build, openTower } from './tile.mjs';

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

// Testseite (unbegrenztes Gold), Frostturm auf Kachel (0,0) bauen und anklicken; optional größere Schrift
async function openWithTower(viewport, fontSize) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${url}?test`);
  await page.waitForSelector('#test-panel');
  if (fontSize) await page.addStyleTag({ content: `html { font-size: ${fontSize}; }` });
  await page.evaluate(() => window.scrollTo(0, 0));
  await build(page, 'frost', 0, 0);
  await page.keyboard.press('Escape');
  await openTower(page, 0, 0);
  return { ctx, page };
}

// Fokus liegt auf einem sichtbaren, fokussierbaren Element (nicht verloren auf body)
async function focusInfo(page) {
  return page.evaluate(() => {
    const a = document.activeElement;
    const r = a?.getBoundingClientRect();
    return { id: a?.id || a?.tagName, visible: !!r && r.width > 0 && r.height > 0 && getComputedStyle(a).visibility !== 'hidden' };
  });
}

// C4: Die Turmkarte, auf die früher der Fokus sprang, liegt jetzt im (geschlossenen) Bau-Ring.
// Gleichwertig: nach × (und Esc) springt der Fokus aufs Spielfeld (Canvas mit tabindex), nicht auf body.
test('Handy: × heißt "Turm-Panel schließen", schließt die Leiste, danach liegt der Fokus auf dem Spielfeld', async () => {
  const { ctx, page } = await openWithTower({ width: 390, height: 844 });
  assert.equal(await page.locator('#ti-close').getAttribute('aria-label'), 'Turm-Panel schließen');
  await page.locator('#ti-close').focus();
  await page.locator('#ti-close').click();
  assert.ok(await page.locator('#tower-info').isHidden());
  assert.equal(await page.evaluate(() => window.__ui.selectedTowerId), null);
  assert.deepEqual(await focusInfo(page), { id: 'game', visible: true });
  await ctx.close();
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`${viewport.width}x${viewport.height}: Esc im Turm-Ring und im Bau-Ring gibt den Fokus ans Spielfeld zurück`, async () => {
    const { ctx, page } = await openWithTower(viewport);
    await page.locator('#sell').focus();
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#tower-info').isHidden());
    assert.deepEqual(await focusInfo(page), { id: 'game', visible: true });
    // Bau-Ring auf einer freien Kachel öffnen (Pfeiltasten bis bebaubar, Enter), Fokus liegt dann im Ring
    for (let i = 0; i < 40 && !(await page.evaluate(() => window.__ui.hover?.ok)); i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#shop:not([hidden]) .tower-btn');
    assert.ok(await page.evaluate(() => !!document.activeElement?.closest('#shop')), 'Fokus im Bau-Ring');
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#shop').isHidden());
    assert.deepEqual(await focusInfo(page), { id: 'game', visible: true });
    await ctx.close();
  });
}

// C4 Tastatur: Tab aufs Spielfeld, Pfeiltasten wählen die Kachel, Enter öffnet den Ring mit Fokus auf dem ersten Knopf.
// Leertaste startet weiterhin die Welle.
test('Desktop: Ring per Tastatur öffnen, bauen und Turm-Ring öffnen; Leertaste bleibt Wellenstart', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${url}?test`);
  await page.waitForSelector('#test-panel');
  await page.locator('#game').focus();
  // Erste Pfeiltaste setzt die Fokus-Kachel auf (0,0), dann zwei nach rechts und eine nach unten
  for (const k of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowDown']) await page.keyboard.press(k);
  const tile = await page.evaluate(() => ({ col: window.__ui.hover.col, row: window.__ui.hover.row }));
  assert.deepEqual(tile, { col: 2, row: 1 });
  // freie Kachel suchen (Pfeil nach rechts, bis bebaubar)
  for (let i = 0; i < 18 && !(await page.evaluate(() => window.__ui.hover.ok)); i++) await page.keyboard.press('ArrowRight');
  const at = await page.evaluate(() => ({ col: window.__ui.hover.col, row: window.__ui.hover.row }));
  await page.keyboard.press('Enter');
  await page.waitForSelector('#shop:not([hidden]) .tower-btn');
  assert.deepEqual(await page.evaluate(() => window.__ui.ring), at);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset?.type), 'arrow', 'Fokus auf dem ersten Ring-Knopf');
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(() => window.__game().towers.map((t) => [t.col, t.row])), [[at.col, at.row]]);
  assert.deepEqual(await focusInfo(page), { id: 'game', visible: true }, 'nach dem Bauen zurück aufs Spielfeld');
  // Enter auf dem Turm öffnet den Turm-Ring, Fokus auf dem ersten aktiven Knopf
  await page.keyboard.press('Enter');
  await page.waitForSelector('#tower-info:not([hidden])');
  const f = await page.evaluate(() => document.activeElement?.closest('#tower-info') ? document.activeElement.id : null);
  assert.ok(['upgrade', 'target-mode', 'sell', 'ti-close'].includes(f), `Fokus im Turm-Ring: ${f}`);
  await page.keyboard.press('Escape');
  assert.deepEqual(await focusInfo(page), { id: 'game', visible: true });
  // Leertaste auf dem Spielfeld startet die Welle (nicht den Ring)
  await page.keyboard.press(' ');
  assert.equal(await page.evaluate(() => window.__game().wave), 1);
  assert.equal(await page.evaluate(() => window.__ui.ring), null);
  await ctx.close();
});

// C4: Klammern entfallen im Turm-Ring; Münze steht direkt hinter der Zahl (höchstens ein Leerzeichen Abstand)
test('Desktop: Münze direkt nach der Zahl bei Verbessern und Verkaufen', async () => {
  const { ctx, page } = await openWithTower({ width: 1280, height: 800 });
  for (const sel of ['#upgrade', '#sell']) {
    const gap = await page.locator(`${sel} .act-cost`).evaluate((e) => {
      const img = e.querySelector('.ico').getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(e.firstChild);
      return img.left - range.getBoundingClientRect().right;
    });
    assert.ok(gap >= -0.5 && gap <= 6, `${sel}: Abstand Zahl bis Münze ${gap}px`);
  }
  await ctx.close();
});

for (const fontSize of [null, '200%']) {
  test(`Handy 390x844${fontSize ? ' mit 200 % Schrift' : ''}: ganz unten verdeckt die Leiste keinen Inhalt`, async () => {
    const { ctx, page } = await openWithTower({ width: 390, height: 844 }, fontSize);
    // ResizeObserver setzt die Höhe vor dem nächsten Bild, danach ganz nach unten scrollen.
    // C6: Feld = sichtbarer Ausschnitt .stage (der Canvas ragt oben/unten abgeschnitten darüber hinaus); das Dock darf verdeckt sein.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const r = await page.evaluate(() => {
      const bar = document.getElementById('tower-info').getBoundingClientRect();
      const bottoms = ['.stage', '#game'].map((s) => {
        const e = document.querySelector(s).getBoundingClientRect();
        const st = document.querySelector('.stage').getBoundingClientRect();
        return Math.min(e.bottom, st.bottom); // Canvas ragt im Hochformat abgeschnitten über .stage hinaus: sichtbarer Teil zählt
      });
      // C4+C6: Turm-Leiste liegt genau über dem Dock; dessen Knöpfe sind solange ausgeblendet (keine Überdeckung sichtbarer Knöpfe)
      const dockShown = ['#abilities', '.wave-row'].filter((s) => getComputedStyle(document.querySelector(s)).visibility !== 'hidden');
      return { top: bar.top, bottoms, dockShown };
    });
    for (const b of r.bottoms) assert.ok(b <= r.top + 0.5, `Inhalt endet bei ${b}, Leiste beginnt bei ${r.top}`);
    assert.deepEqual(r.dockShown, [], 'Dock-Knöpfe unter der Turm-Leiste ausgeblendet');
    await ctx.close();
  });
}
