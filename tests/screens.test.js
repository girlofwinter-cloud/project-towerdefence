// Tests für Startbildschirm und Spielende-Plakette (C5): reine Funktionen aus screens.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, MAX_WAVES } from '../src/config.js';
import { emptyProgress, MAP_ORDER } from '../src/progress.js';
import { mapCards, moveFocus, endView, starsHtml, STAR_COUNT } from '../src/screens.js';

const [M0, M1, M2] = MAP_ORDER;

test('mapCards: frisch nur die erste Karte offen, gesperrte nennen den Vorgänger', () => {
  const cards = mapCards(emptyProgress());
  assert.deepEqual(cards.map((c) => c.id), MAP_ORDER);
  assert.deepEqual(cards.map((c) => c.open), MAP_ORDER.map((_, i) => i === 0));
  assert.equal(cards[0].line, 'Noch nicht gespielt');
  assert.equal(cards[0].label, `${MAPS[M0].name}, 0 von ${STAR_COUNT} Sternen, noch nicht gespielt`);
  assert.equal(cards[1].line, `Gewinne erst ${MAPS[M0].name}`);
  assert.match(cards[1].label, /gesperrt/);
});

test('mapCards: Sterne und beste Welle aus dem Fortschritt, Sieg schaltet die nächste Karte frei', () => {
  const p = { maps: { [M0]: { bestWave: MAX_WAVES, stars: 2 }, [M1]: { bestWave: 14, stars: 0 } } };
  const [a, b, c] = mapCards(p);
  assert.deepEqual([a.stars, a.bestWave, a.open], [2, MAX_WAVES, true]);
  assert.equal(a.line, `Beste Welle ${MAX_WAVES} / ${MAX_WAVES}`);
  assert.equal(a.label, `${MAPS[M0].name}, 2 von ${STAR_COUNT} Sternen, beste Welle ${MAX_WAVES}`);
  assert.deepEqual([b.open, b.line], [true, `Beste Welle 14 / ${MAX_WAVES}`]);
  assert.deepEqual([c.id, c.open], [M2, false], 'ohne Sieg auf der zweiten Karte bleibt die dritte zu');
});

test('mapCards: Testseite (allOpen) öffnet alle Karten', () => {
  assert.ok(mapCards(emptyProgress(), { allOpen: true }).every((c) => c.open));
});

test('moveFocus: nur über offene Karten, am Rand bleibt der Fokus', () => {
  const cards = mapCards({ maps: { [M0]: { bestWave: MAX_WAVES, stars: 1 } } });
  assert.equal(moveFocus(cards, M0, 1), M1);
  assert.equal(moveFocus(cards, M1, 1), M1, 'gesperrte dritte Karte wird übersprungen');
  assert.equal(moveFocus(cards, M0, -1), M0);
  assert.equal(moveFocus(cards, 'gibtsnicht', 1), M0);
});

test('endView: Sieg rotes Band mit Sternen (begrenzt), Niederlage graues Band ohne Sterne', () => {
  assert.deepEqual(endView('won', 2), { title: 'Gewonnen!', ribbon: '#c4452f', stars: 2, showStars: true });
  assert.equal(endView('won', 9).stars, STAR_COUNT);
  assert.deepEqual(endView('lost', 3), { title: 'Verloren', ribbon: '#6b5a48', stars: 0, showStars: false });
});

test('starsHtml: immer STAR_COUNT Sterne, davon n voll', () => {
  const html = starsHtml(2, 24);
  assert.equal(html.match(/<svg/g).length, STAR_COUNT);
  assert.equal(html.match(/#f2c14e/g).length, 2);
  assert.equal(html.match(/#5a3a22/g).length, STAR_COUNT - 2);
});

// B-180: Boss-Leiste (src/boss-bar.js) mit einem kleinen Schein-DOM: zeigt, füllt, Phase II, blendet nach dem Tod aus
test('B-180 Boss-Leiste: erscheint mit dem Boss, Phase-Text und Schild, steht nach dem Tod noch fadeAfter s', async () => {
  const { createBossBars } = await import('../src/boss-bar.js');
  const { BOSS_BAR } = await import('../src/config.js');
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
  const update = createBossBars(doc);
  const ui = {};
  const necro = { type: 'necro', hp: 600, maxHp: 1000 };
  const state = { time: 0, enemies: [necro] };
  update(state, ui, 0);
  assert.equal(box.hidden, false);
  assert.equal(ui.bossBarShown, true);
  assert.equal(bars[0].hidden, false);
  assert.equal(bars[1].hidden, true, 'nur eine Leiste bei einem Boss');
  assert.equal(bars[0].parts['.bb-name'].textContent, 'Nekromantin');
  assert.equal(bars[0].parts['.bb-phase'].textContent, 'Phase I');
  assert.equal(bars[0].vars['--f'], '0.600');
  assert.equal(bars[0].parts['.bb-track'].attrs['aria-valuenow'], '60');
  assert.equal(box.vars['--bb-w'], '272px');
  Object.assign(necro, { hp: 400, phase: 2, shieldUntil: 2 });
  update(state, ui, 0.1);
  assert.equal(bars[0].parts['.bb-phase'].textContent, 'Phase II');
  assert.ok(bars[0].classList.has('p2') && bars[0].classList.has('shielded'));
  state.enemies = [];
  update(state, ui, 1);
  assert.equal(box.hidden, false, 'leere Leiste steht noch');
  assert.equal(bars[0].vars['--f'], '0.000');
  update(state, ui, 1 + BOSS_BAR.fadeAfter + 0.01);
  assert.equal(box.hidden, true, 'danach ausgeblendet');
  assert.equal(ui.bossBarShown, false);
  // ohne Element im DOM: nichts tun, nicht crashen
  createBossBars({ getElementById: () => null })(state, ui, 0);
});

// B-182: Knopf „Albtraum“ nur auf Karten mit allen Sternen (Testseite: auf allen)
test('B-182: mapCards zeigt den Albtraum nur bei allen Sternen', () => {
  const p = { maps: { [M0]: { bestWave: MAX_WAVES, stars: STAR_COUNT }, [M1]: { bestWave: MAX_WAVES, stars: STAR_COUNT - 1 } } };
  const cards = mapCards(p);
  assert.equal(cards[0].nightmare, true);
  assert.equal(cards[1].nightmare, false);
  assert.equal(cards[2].nightmare, false);
  assert.ok(mapCards(emptyProgress(), { allOpen: true }).every((c) => c.nightmare));
});
