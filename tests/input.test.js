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

// ---------- C6 Handy: Wischen und Zoom (viewport.js), Umrechnung mit Versatz, Backing-Store-Obergrenze ----------
import { clampScroll, scrollEdges, gestureKind, dragScroll } from '../src/viewport.js';
import { VIEWPORT } from '../src/config.js';

test('clampScroll: Wisch-Position bleibt zwischen 0 und Inhalt minus Sichtbreite', () => {
  assert.equal(clampScroll(-30, 1009, 390), 0);
  assert.equal(clampScroll(200, 1009, 390), 200);
  assert.equal(clampScroll(5000, 1009, 390), 619);
  assert.equal(clampScroll(50, 300, 390), 0, 'Inhalt schmaler als Sicht: nicht wischbar');
  assert.equal(clampScroll(NaN, 1009, 390), 0);
});

test('scrollEdges: Schattenkanten nur, wo weiter gewischt werden kann', () => {
  assert.deepEqual(scrollEdges(0, 1009, 390), { canLeft: false, canRight: true });
  assert.deepEqual(scrollEdges(300, 1009, 390), { canLeft: true, canRight: true });
  assert.deepEqual(scrollEdges(619, 1009, 390), { canLeft: true, canRight: false });
  assert.deepEqual(scrollEdges(0, 390, 390), { canLeft: false, canRight: false });
});

test('gestureKind: kleine Bewegung ist ein Tipp, ab tapSlop (Finger oder Feld-Verschiebung) Wischen', () => {
  const s = VIEWPORT.tapSlop;
  assert.equal(gestureKind(0, 0), 'tap');
  assert.equal(gestureKind(s - 1, 0), 'tap');
  assert.equal(gestureKind(s, 0), 'swipe');
  assert.equal(gestureKind(0, -s), 'swipe', 'senkrecht zählt ebenfalls');
  assert.equal(gestureKind(s * 0.6, s * 0.6), 'tap', 'Betrag der Bewegung (Hypotenuse) unter der Schwelle');
  assert.equal(gestureKind(s * 0.8, s * 0.8), 'swipe');
  assert.equal(gestureKind(2, 1, -s), 'swipe', 'Feld hat sich verschoben, auch wenn der Finger kaum wanderte');
  assert.equal(gestureKind(2, 1, s - 1), 'tap');
});

test('dragScroll: Mausziehen nach links schiebt die Ansicht nach rechts, begrenzt', () => {
  assert.equal(dragScroll(100, -50, 1009, 390), 150);
  assert.equal(dragScroll(100, 50, 1009, 390), 50);
  assert.equal(dragScroll(100, 500, 1009, 390), 0);
  assert.equal(dragScroll(600, -500, 1009, 390), 619);
});

test('fieldPoint mit gewischtem Feld: Rechteck links außerhalb des Fensters trifft dieselbe Kachel', () => {
  // Canvas 1009 CSS-px breit, um 400 px gewischt: linke Kante bei -400, oben 56 - Rand (abgeschnitten)
  const k = 1009 / VIEW_WIDTH;
  const rect = { left: -400, top: 56 - FRAME_MARGIN * k, width: 1009, height: VIEW_HEIGHT * k };
  const at = (col, row) => [rect.left + (FRAME_MARGIN + (col + 0.5) * TILE) * k, rect.top + (FRAME_MARGIN + (row + 0.5) * TILE) * k];
  for (const [col, row] of [[9, 0], [12, 7], [COLS - 1, ROWS - 1]]) {
    const p = fieldPoint(...at(col, row), rect);
    assert.deepEqual([p.col, p.row, p.inField], [col, row, true], `Kachel ${col},${row}`);
  }
  // Bildschirmpunkt x = 0 liegt nach dem Wischen in Spalte 7 (nicht 0)
  assert.equal(fieldPoint(0, 300, rect).col, Math.floor((400 / k - FRAME_MARGIN) / TILE));
});

test('canvasSize: Obergrenze maxSide je Seite (Handy), Seitenverhältnis bleibt; ohne Angabe unbegrenzt', () => {
  const s = canvasSize(3000, Infinity, 2, VIEW_FIT.maxSide);
  assert.equal(s.width, VIEW_FIT.maxSide);
  assert.ok(s.height <= VIEW_FIT.maxSide);
  assert.ok(Math.abs(s.width / s.height - VIEW_WIDTH / VIEW_HEIGHT) < 0.01);
  assert.ok(Math.abs(s.sx * VIEW_WIDTH - s.width) < 1e-6, 'Transformation füllt den begrenzten Backing-Store');
  assert.equal(canvasSize(1009, Infinity, 2, VIEW_FIT.maxSide).width, 2018, 'unter der Grenze: volle 2x');
  assert.equal(canvasSize(3000, Infinity, 2).width, 6000);
});
