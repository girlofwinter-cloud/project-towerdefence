// Gemeinsamer Helfer der Browser-Tests (kein Test): Bildschirmpunkt der Mitte einer Feldkachel.
// Stil 1: Der Canvas zeigt Feld + Rand (FRAME_MARGIN), angezeigt ggf. skaliert.
import { TILE, FRAME_MARGIN, VIEW_WIDTH } from '../../src/config.js';

export function tileCenter(box, col, row) {
  const s = box.width / VIEW_WIDTH;
  return [box.x + (FRAME_MARGIN + (col + 0.5) * TILE) * s, box.y + (FRAME_MARGIN + (row + 0.5) * TILE) * s];
}

// C5: Startbildschirm erscheint bei jedem Laden (außer ?test). Wählt die Karte mapId (ohne: die vorgewählte)
// und wartet, bis das Spiel sichtbar ist.
export async function enterGame(page, mapId) {
  await page.waitForSelector('#start-screen:not([hidden]) .map-card');
  await page.locator(mapId ? `.map-card[data-map="${mapId}"]` : '.map-card.current').click();
  await page.waitForSelector('#start-screen', { state: 'hidden' });
}

// C4 Ringmenü: Klick bzw. Tipp auf die Kachel (Mitte jedes Mal neu gemessen), touch = Tipp statt Mausklick.
export async function clickTile(page, col, row, { touch = false } = {}) {
  const box = await page.locator('#game').boundingBox();
  const at = tileCenter(box, col, row);
  if (touch) await page.touchscreen.tap(...at);
  else await page.mouse.click(...at);
}

// Bau-Ring auf der freien Kachel öffnen und warten, bis er sichtbar ist.
export async function openRing(page, col, row, opts) {
  await clickTile(page, col, row, opts);
  await page.waitForSelector('#shop:not([hidden]) .tower-btn');
  await ringSettled(page);
}

// Einblend-Animation der Ringknöpfe (0,14 s) abwarten, damit Maße und Klickziele stimmen
export async function ringSettled(page) {
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || !a.effect?.target?.closest?.('.ring')));
}

// Turm über den Bau-Ring bauen: Kachel anklicken, dann den Turmknopf im Ring (ersetzt Turmleiste + Klick aufs Feld).
export async function build(page, type, col, row, opts = {}) {
  await openRing(page, col, row, opts);
  const btn = page.locator(`#shop .tower-btn[data-type="${type}"]`);
  if (opts.touch) await btn.tap();
  else await btn.click();
}

// Turm-Ring eines Turms öffnen (Klick auf seine Kachel).
export async function openTower(page, col, row, opts) {
  await clickTile(page, col, row, opts);
  await page.waitForSelector('#tower-info:not([hidden])');
  await ringSettled(page);
}
