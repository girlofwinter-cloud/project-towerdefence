// Unit-Tests der Eingabe (input.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildTapStep, fieldPoint } from '../src/input.js';
import { TILE, COLS, ROWS, FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT } from '../src/config.js';

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
