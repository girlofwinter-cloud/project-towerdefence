// Unit-Tests der Eingabe (input.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildTapStep, fieldPoint, canvasSize } from '../src/input.js';
import { TILE, COLS, ROWS, FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT, VIEW_FIT } from '../src/config.js';

// ---------- Bauen per Touch in zwei Schritten (buildTapStep) ----------

test('buildTapStep: Maus baut sofort und merkt sich keine Kachel', () => {
  assert.deepEqual(buildTapStep(null, 3, 4, false), { action: 'build', pending: null });
  assert.deepEqual(buildTapStep({ col: 1, row: 1 }, 3, 4, false), { action: 'build', pending: null });
});

test('buildTapStep: Touch zeigt erst die Vorschau, der zweite Tipp auf dieselbe Kachel baut', () => {
  const first = buildTapStep(null, 3, 4, true);
  assert.deepEqual(first, { action: 'preview', pending: { col: 3, row: 4 } });
  assert.deepEqual(buildTapStep(first.pending, 3, 4, true), { action: 'build', pending: null });
});

test('buildTapStep: Touch auf eine andere Kachel verschiebt nur die Vorschau (baut nicht)', () => {
  const second = buildTapStep({ col: 3, row: 4 }, 5, 4, true);
  assert.deepEqual(second, { action: 'preview', pending: { col: 5, row: 4 } });
  // Spalte gleich, Zeile anders zählt ebenfalls als andere Kachel
  assert.equal(buildTapStep({ col: 3, row: 4 }, 3, 5, true).action, 'preview');
});


import { aimStep } from '../src/input.js';

test('aimStep: Taste schaltet den Zielmodus, Klick löst aus, Abbruch beendet', () => {
  assert.deepEqual(aimStep(false, 'key'), { aiming: true, fire: false });
  assert.deepEqual(aimStep(true, 'key'), { aiming: false, fire: false });
  assert.deepEqual(aimStep(true, 'click'), { aiming: false, fire: true });
  assert.deepEqual(aimStep(false, 'click'), { aiming: false, fire: false });
  assert.deepEqual(aimStep(true, 'cancel'), { aiming: false, fire: false });
});

// ---------- Stil 1: Klick-Umrechnung mit Rand (fieldPoint) ----------
test('fieldPoint: zieht den Rand ab, auch bei skaliertem Canvas; Klicks im Rand liegen nicht im Feld', () => {
  const rect = { left: 10, top: 20, width: VIEW_WIDTH, height: VIEW_HEIGHT };
  // Mitte der Kachel 0,0 und der letzten Kachel
  assert.deepEqual(fieldPoint(10 + FRAME_MARGIN + TILE / 2, 20 + FRAME_MARGIN + TILE / 2, rect), { x: TILE / 2, y: TILE / 2, col: 0, row: 0, inField: true });
  const last = fieldPoint(10 + FRAME_MARGIN + (COLS - 0.5) * TILE, 20 + FRAME_MARGIN + (ROWS - 0.5) * TILE, rect);
  assert.deepEqual([last.col, last.row, last.inField], [COLS - 1, ROWS - 1, true]);
  // Rand: links, oben, rechts, unten
  for (const [x, y] of [[10 + FRAME_MARGIN - 1, 300], [400, 20 + FRAME_MARGIN - 1], [10 + VIEW_WIDTH - 2, 300], [400, 20 + VIEW_HEIGHT - 2]]) {
    assert.equal(fieldPoint(x, y, rect).inField, false, `${x},${y}`);
  }
  // halb so groß angezeigt: gleiche Kachel
  const half = { left: 0, top: 0, width: VIEW_WIDTH / 2, height: VIEW_HEIGHT / 2 };
  const p = fieldPoint((FRAME_MARGIN + 5.5 * TILE) / 2, (FRAME_MARGIN + 3.5 * TILE) / 2, half);
  assert.deepEqual([p.col, p.row, p.inField], [5, 3, true]);
});

test('fieldPoint: genau auf der Feldkante gehört der Punkt zum Feld, genau hinter der letzten Kachel zum Rand', () => {
  const rect = { left: 0, top: 0, width: VIEW_WIDTH, height: VIEW_HEIGHT };
  const first = fieldPoint(FRAME_MARGIN, FRAME_MARGIN, rect);
  assert.deepEqual([first.col, first.row, first.inField], [0, 0, true]);
  assert.equal(fieldPoint(FRAME_MARGIN + COLS * TILE, FRAME_MARGIN + 5, rect).inField, false, 'rechte Kante');
  assert.equal(fieldPoint(FRAME_MARGIN + 5, FRAME_MARGIN + ROWS * TILE, rect).inField, false, 'untere Kante');
  assert.equal(fieldPoint(FRAME_MARGIN - 0.01, FRAME_MARGIN + 5, rect).inField, false, 'knapp links davor');
  // Ecken des Canvas und Punkte außerhalb (Pointer-Capture) liegen nie im Feld
  for (const [x, y] of [[0, 0], [VIEW_WIDTH, VIEW_HEIGHT], [-20, 300], [VIEW_WIDTH + 20, 300]]) assert.equal(fieldPoint(x, y, rect).inField, false, `${x},${y}`);
});

// ---------- HiDPI: Canvas-Größe (canvasSize) ----------

test('canvasSize: Seitenverhältnis bleibt, Breite oder Höhe begrenzt', () => {
  const byW = canvasSize(450, Infinity, 1);
  assert.deepEqual([byW.cssW, byW.cssH], [450, 330]);
  const byH = canvasSize(5000, 330, 1);
  assert.deepEqual([byH.cssW, byH.cssH], [450, 330]);
  for (const [w, h] of [[917, 700], [1234, 567], [375, 9999], [801, 589]]) {
    const s = canvasSize(w, h, 1);
    assert.ok(s.cssW <= w && s.cssH <= h + 0.5, `${w}x${h} passt`);
    assert.ok(Math.abs(s.cssW / s.cssH - VIEW_WIDTH / VIEW_HEIGHT) < 0.01, 'keine Verzerrung');
  }
});

test('canvasSize: Backing-Store = CSS-Größe x Pixeldichte, höchstens maxDpr, Transformation passt', () => {
  const s = canvasSize(900, Infinity, 2);
  assert.deepEqual([s.width, s.height, s.dpr], [1800, 1320, 2]);
  assert.equal(s.sx, 2);
  assert.equal(s.sy, 2);
  const capped = canvasSize(900, Infinity, 3);
  assert.equal(capped.dpr, VIEW_FIT.maxDpr);
  assert.equal(capped.width, 900 * VIEW_FIT.maxDpr);
  const odd = canvasSize(917, Infinity, 2);
  assert.equal(odd.width, 1834);
  assert.ok(Math.abs(odd.sx * VIEW_WIDTH - odd.width) < 1e-6, 'Canvas-Einheiten füllen den Backing-Store genau');
  assert.ok(Math.abs(odd.sy * VIEW_HEIGHT - odd.height) < 1e-6);
});

// Vollbild: Anzeigebreite kommt aus style.css; ganze CSS-px dürfen durch Rundungsfehler nicht 1 px verlieren
test('canvasSize: ganze Anzeigebreiten bleiben exakt (kein Gleitkomma-Verlust beim Abrunden)', () => {
  for (let w = 300; w <= 2600; w++) assert.equal(canvasSize(w, Infinity, 2).width, 2 * w, `Breite ${w}`);
});

test('canvasSize: ungültige Werte (0, negativ, NaN, kleine dpr) fallen auf sinnvolle Größen zurück', () => {
  assert.equal(canvasSize(800, Infinity, 0.5).dpr, 1);
  assert.equal(canvasSize(800, Infinity, NaN).dpr, 1);
  assert.equal(canvasSize(800, Infinity, undefined).dpr, 1);
  assert.equal(canvasSize(0, Infinity, 1).cssW, VIEW_WIDTH);
  assert.equal(canvasSize(NaN, -5, 1).cssW, VIEW_WIDTH);
  const tiny = canvasSize(1, 1, 2);
  assert.ok(tiny.width >= 1 && tiny.height >= 1);
});

test('fieldPoint + canvasSize: Ecken-Kacheln treffen bei jeder Größe und Pixeldichte', () => {
  for (const dpr of [1, 1.5, 2, 3]) {
    for (const avail of [375, 800, 917, 1600]) {
      const s = canvasSize(avail, Infinity, dpr);
      const rect = { left: 13, top: 27, width: s.cssW, height: s.cssH };
      const at = (col, row) => fieldPoint(rect.left + ((FRAME_MARGIN + (col + 0.5) * TILE) / VIEW_WIDTH) * s.cssW,
        rect.top + ((FRAME_MARGIN + (row + 0.5) * TILE) / VIEW_HEIGHT) * s.cssH, rect);
      assert.deepEqual([at(0, 0).col, at(0, 0).row], [0, 0]);
      assert.deepEqual([at(COLS - 1, ROWS - 1).col, at(COLS - 1, ROWS - 1).row], [COLS - 1, ROWS - 1]);
    }
  }
});

// ---------- C4 Ringmenü (ring-menu.js) ----------
import { ringRadius, tileCenterPx, ringCenter, infoOnLeft, towerHitBox, pickTower, buildRingView, towerRingView } from '../src/ring-menu.js';
import { RING_MENU, TOWER_TYPES } from '../src/config.js';
import { createGame, buildTower, upgradeTower } from '../src/game.js';

test('C4 ringRadius: mindestens minRadius, sonst 1,55 Kacheln; kompakt fest', () => {
  assert.equal(ringRadius(20), RING_MENU.minRadius);
  assert.ok(Math.abs(ringRadius(48.5) - 75.175) < 1e-9, '1280x800: Kachel 48,5 -> 75 px');
  assert.equal(ringRadius(100, true), RING_MENU.compactRadius);
  assert.equal(ringRadius(NaN), RING_MENU.minRadius);
});

test('C4 tileCenterPx: Kachelmitte mit Rand, skaliert mit der Canvas-Breite', () => {
  assert.deepEqual(tileCenterPx(0, 0, VIEW_WIDTH), { x: FRAME_MARGIN + TILE / 2, y: FRAME_MARGIN + TILE / 2 });
  const p = tileCenterPx(19, 13, VIEW_WIDTH * 2);
  assert.deepEqual(p, { x: 2 * (FRAME_MARGIN + 19.5 * TILE), y: 2 * (FRAME_MARGIN + 13.5 * TILE) });
});

test('C4 ringCenter: an allen Feldrändern ganz im sichtbaren Bereich, in der Mitte unverändert', () => {
  const R = 75, ext = R + RING_MENU.edge;
  const bounds = { left: 94, top: 0, right: 1186, bottom: 800 };
  const inside = (c) => c.x - ext >= bounds.left && c.x + ext <= bounds.right && c.y - ext >= bounds.top && c.y + ext <= bounds.bottom;
  for (const p of [{ x: 120, y: 20 }, { x: 1180, y: 790 }, { x: 100, y: 790 }, { x: 1180, y: 5 }, { x: -50, y: 2000 }]) {
    assert.ok(inside(ringCenter(p, R, bounds)), `Punkt ${p.x},${p.y}`);
  }
  assert.deepEqual(ringCenter({ x: 600, y: 400 }, R, bounds), { x: 600, y: 400 });
  // Zu schmaler Bereich: mittig statt außerhalb
  assert.deepEqual(ringCenter({ x: 0, y: 0 }, R, { left: 0, top: 0, right: 100, bottom: 100 }), { x: 50, y: 50 });
});

test('C4 ringCenter: weicht der HUD-Leiste aus (kürzester Weg), ohne den Bereich zu verlassen', () => {
  const R = 75, ext = R + RING_MENU.edge;
  const bounds = { left: 94, top: 0, right: 1186, bottom: 800 };
  const hud = { left: 154, top: 2, right: 480, bottom: 58 };
  const c = ringCenter({ x: 250, y: 85 }, R, bounds, [hud]);
  assert.equal(c.x, 250, 'nur senkrecht verschoben');
  assert.ok(c.y - ext >= hud.bottom + RING_MENU.gap - 1e-9, `oberer Rand ${c.y - ext} unter der Leiste`);
  // Weit weg von der Leiste: keine Verschiebung
  assert.deepEqual(ringCenter({ x: 800, y: 400 }, R, bounds, [hud]), { x: 800, y: 400 });
  // Leere/fehlende Flächen stören nicht
  assert.deepEqual(ringCenter({ x: 800, y: 400 }, R, bounds, [null]), { x: 800, y: 400 });
});

test('C4 infoOnLeft: Plakette links, wenn die Ringmitte rechts der Mitte liegt', () => {
  assert.equal(infoOnLeft(300, 0, 1000), false);
  assert.equal(infoOnLeft(700, 0, 1000), true);
});

test('C4 pickTower: Treffer auch auf der Turmsilhouette über der Kachel, eigene Kachel hat Vorrang', () => {
  const s = createGame();
  s.gold = 99999;
  // zwei freie, senkrecht benachbarte Kacheln suchen
  let spot = null;
  for (let r = 1; r < ROWS && !spot; r++) for (let c = 0; c < COLS && !spot; c++) {
    if (buildTower(createGame(), 'arrow', c, r).ok && buildTower(createGame(), 'arrow', c, r - 1).ok) spot = [c, r];
  }
  const [c, r] = spot;
  const t = buildTower(s, 'sniper', c, r).tower;
  const x = (c + 0.5) * TILE;
  // Spitze der Figur liegt in der Kachel darüber (frei): trifft trotzdem den Turm
  const box = towerHitBox(t);
  assert.ok(box.top < r * TILE - TILE / 2, `Figur ragt nach oben (${box.top})`);
  assert.equal(pickTower(s.towers, x, (r - 0.5) * TILE)?.id, t.id);
  // Neben der Figur (zwei Kacheln seitlich) und weit darüber: kein Treffer
  assert.equal(pickTower(s.towers, x + 2 * TILE, (r - 0.5) * TILE), null);
  assert.equal(pickTower(s.towers, x, box.top - 2), null);
  // Turm auf der Kachel darüber hat dort Vorrang vor der Silhouette des unteren
  const top = buildTower(s, 'arrow', c, r - 1).tower;
  assert.equal(pickTower(s.towers, x, (r - 0.5) * TILE)?.id, top.id);
  assert.equal(pickTower([], x, x), null);
});

test('C4 buildRingView: fünf Knöpfe in Tastenreihenfolge, zu teuer markiert mit eigenem Namen', () => {
  const types = Object.keys(TOWER_TYPES);
  const cheapest = Math.min(...types.map((k) => TOWER_TYPES[k].cost));
  const v = buildRingView(cheapest);
  assert.deepEqual(v.map((b) => b.type), types);
  assert.deepEqual(v.map((b) => b.angle), RING_MENU.buildAngles);
  for (const b of v) {
    assert.equal(b.poor, TOWER_TYPES[b.type].cost > cheapest);
    assert.equal(/zu wenig Gold/.test(b.label), b.poor);
    assert.match(b.label, new RegExp(`^${TOWER_TYPES[b.type].name} bauen, ${TOWER_TYPES[b.type].cost} Gold`));
  }
  assert.ok(buildRingView(0).every((b) => b.poor));
  assert.ok(buildRingView(1e9).every((b) => !b.poor));
  assert.ok(buildRingView(NaN).every((b) => b.poor), 'ungültiges Gold zählt als zu wenig');
});

test('C4 towerRingView: Verbessern teuer/günstig/max., Verkaufen mit Erlös, Zielregel, Reichweite nächste Stufe', () => {
  const s = createGame();
  s.gold = 99999;
  const t = buildTower(s, 'arrow', ...findFree(s)).tower;
  const rich = towerRingView(t, 99999, s.modifiers);
  assert.match(rich.name, /^Pfeilturm · Stufe 1$/);
  assert.equal(rich.upgrade.disabled, false);
  assert.match(rich.upgrade.label, /^Verbessern für \d+ Gold \(U\)$/);
  assert.ok(rich.upgradeRange >= TOWER_TYPES.arrow.range);
  assert.match(rich.sell.label, /^Verkaufen für \d+ Gold \(S\)$/);
  assert.equal(rich.target.label, 'Ziel: Erster (T)');
  const poor = towerRingView(t, 0, s.modifiers);
  assert.equal(poor.upgrade.disabled, true);
  assert.equal(poor.upgrade.max, false);
  while (upgradeTower(s, t.id).ok);
  const max = towerRingView(t, 99999, s.modifiers);
  assert.equal(max.upgrade.max, true);
  assert.equal(max.upgrade.disabled, true);
  assert.equal(max.upgrade.label, 'Max. Stufe');
  assert.equal(max.upgradeRange, null);
});

function findFree(s) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (buildTower(createGame({ mapId: s.mapId }), 'arrow', c, r).ok) return [c, r];
  throw new Error('kein freies Feld');
}
