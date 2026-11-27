// Tester-Randfälle B-180 Boss-Leiste (src/boss-bar.js) mit Schein-DOM: neues Spiel nach Niederlage mit lebendem Boss.
import { test } from 'node:test';
import assert from 'node:assert/strict';

function fakeDoc() {
  const el = () => {
    const cls = new Set();
    const vars = {};
    const attrs = {};
    return { hidden: true, textContent: '', classList: { toggle: (c, on) => (on ? cls.add(c) : cls.delete(c)), has: (c) => cls.has(c) }, style: { setProperty: (k, v) => { vars[k] = v; } }, vars, attrs, setAttribute: (k, v) => { attrs[k] = v; } };
  };
  const mkBar = () => { const b = el(); b.parts = { '.bb-name': el(), '.bb-phase': el(), '.bb-track': el() }; b.querySelector = (q) => b.parts[q]; return b; };
  const bars = [mkBar(), mkBar()];
  const box = { ...el(), querySelectorAll: () => bars };
  const rect = (left, right) => ({ getBoundingClientRect: () => ({ left, right }) });
  const doc = { getElementById: (id) => (id === 'boss-bars' ? box : id === 'hud-bar' ? rect(0, 548) : null), querySelector: () => rect(853, 900) };
  return { doc, box, bars };
}

test('B-180 Boss-Leiste: nach Niederlage mit lebendem Boss zeigt ein neues Spiel keine alte (leere) Leiste', async () => {
  const { createBossBars } = await import('../src/boss-bar.js');
  const { doc, box } = fakeDoc();
  const update = createBossBars(doc);
  const ui = {};
  // Spiel verloren, die Nekromantin lebt noch (Endbildschirm)
  const lostGame = { time: 300, status: 'lost', enemies: [{ type: 'necro', hp: 600, maxHp: 1000 }] };
  update(lostGame, ui, 10);
  update(lostGame, ui, 20);
  assert.equal(box.hidden, false);
  // "Nochmal": neues Spielobjekt ohne Gegner
  const fresh = { time: 0, status: 'playing', enemies: [] };
  update(fresh, ui, 20.1);
  assert.equal(box.hidden, true, 'im neuen Spiel keine Boss-Leiste vom alten Spiel');
  assert.equal(ui.bossBarShown, false);
});
