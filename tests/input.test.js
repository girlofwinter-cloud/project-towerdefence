// Unit-Tests der Eingabe (input.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildTapStep } from '../src/input.js';

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
