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

test('B-193 Boss-Leiste: Prozentzahl gerundet 0–100, Krone nur beim Oger-König', async () => {
  const { bossBarExtras } = await import('../src/boss-bar.js');
  const { ENEMY_TYPES: T } = await import('../src/config.js');
  assert.deepEqual(bossBarExtras({ name: T.boss.name, frac: 0.624 }), { pct: 62, crown: true });
  assert.deepEqual(bossBarExtras({ name: `${T.boss.name} ×2`, frac: 1.4 }), { pct: 100, crown: true });
  assert.deepEqual(bossBarExtras({ name: T.necro.name, frac: -1 }), { pct: 0, crown: false });
  assert.deepEqual(bossBarExtras({ name: 'Bosse ×3', frac: NaN }), { pct: 0, crown: false });
  // Schein-DOM: .bb-pct bekommt den Text
  const pct = { textContent: '' };
  const el = () => ({ hidden: true, textContent: '', classList: { toggle() {} }, style: { setProperty() {} }, setAttribute() {} });
  const bar = el();
  const parts = { '.bb-name': el(), '.bb-phase': el(), '.bb-track': el(), '.bb-pct': pct };
  bar.querySelector = (q) => parts[q];
  const box = { ...el(), querySelectorAll: () => [bar], style: { setProperty() {} } };
  const doc = { getElementById: (id) => (id === 'boss-bars' ? box : null), querySelector: () => null };
  const { createBossBars } = await import('../src/boss-bar.js');
  createBossBars(doc)({ time: 0, enemies: [{ type: 'boss', hp: 682, maxHp: 1100 }] }, {}, 0);
  assert.equal(pct.textContent, '62%');
});
