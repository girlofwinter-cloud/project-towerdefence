// Randfaelle Karte Wald (B-028)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, canBuild, buildTower } from '../src/game.js';
import { MAPS, COLS, ROWS } from '../src/config.js';
import { decorFor } from '../src/decor.js';
import { pathTiles } from '../src/path.js';

test('Wald: Weg gueltig, Hindernisse eindeutig, im Feld, nicht auf Weg', () => {
  const { waypoints, obstacles } = MAPS.forest;
  for (let i = 1; i < waypoints.length; i++) {
    const [a, b] = [waypoints[i - 1], waypoints[i]];
    assert.ok(a[0] === b[0] || a[1] === b[1], 'achsenparallel');
    assert.notDeepEqual(a, b);
  }
  const f = waypoints[0], l = waypoints[waypoints.length - 1];
  assert.ok(f[0] < 0 || f[0] >= COLS || f[1] < 0 || f[1] >= ROWS);
  assert.ok(l[0] < 0 || l[0] >= COLS || l[1] < 0 || l[1] >= ROWS);
  const keys = obstacles.map(([c, r]) => `${c},${r}`);
  assert.equal(new Set(keys).size, keys.length, 'keine Duplikate');
  const blocked = pathTiles(waypoints);
  for (const [c, r] of obstacles) {
    assert.ok(c >= 0 && r >= 0 && c < COLS && r < ROWS);
    assert.ok(!blocked.has(`${c},${r}`), `Hindernis auf Weg ${c},${r}`);
  }
});

test('Wald: canBuild-Reihenfolge Feld, Weg, Hindernis, Turm; overrides ohne obstacles', () => {
  const s = createGame({ mapId: 'forest' });
  assert.match(canBuild(s, -1, 0).reason, /Außerhalb/);
  const [pc, pr] = [...s.blocked].map(k => k.split(',').map(Number)).find(([c, r]) => c >= 0 && r >= 0 && c < COLS && r < ROWS);
  assert.match(canBuild(s, pc, pr).reason, /Weg/);
  const [oc, or] = MAPS.forest.obstacles[0];
  assert.match(canBuild(s, oc, or).reason, /Baum/);
  s.towers.push({ col: oc, row: or });
  assert.match(canBuild(s, oc, or).reason, /Baum/, 'Hindernis vor Turm');
  const g = createGame({ obstacles: undefined });
  assert.equal(canBuild(g, 0, 0).ok, true);
  const h = createGame({ mapId: 'forest', obstacles: new Set() });
  assert.equal(canBuild(h, oc, or).ok, true);
});

test('decorFor: 3-Parameter-Aufruf unveraendert', () => {
  const b = pathTiles(MAPS.forest.waypoints);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    assert.deepEqual(decorFor(c, r, b), decorFor(c, r, b, undefined));
    assert.deepEqual(decorFor(c, r, b), decorFor(c, r, b, new Set()));
  }
});
