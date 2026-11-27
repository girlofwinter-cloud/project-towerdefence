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
