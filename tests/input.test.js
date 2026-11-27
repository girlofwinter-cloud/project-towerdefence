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
