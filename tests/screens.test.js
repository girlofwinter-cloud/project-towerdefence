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
