// Unit-Tests der Dekoration (decor.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game.js';
import { tileHash, decorFor, isBorderTile, LARGE_DECOR_KINDS, LARGE_DECOR_RADIUS, BORDER_DECOR_CHANCE, INNER_DECOR_CHANCE } from '../src/decor.js';

import { pathTiles } from '../src/path.js';
import { WAYPOINTS, TILE, COLS, ROWS, MAPS } from '../src/config.js';

// ---------- Dekoration (src/decor.js) ----------

test('Dekoration: deterministisch (gleiche Kachel, gleiches Ergebnis)', () => {
  const s = createGame();
  assert.equal(tileHash(3, 4), tileHash(3, 4));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    assert.deepEqual(decorFor(c, r, s.blocked), decorFor(c, r, s.blocked));
  }
});

test('Dekoration: nie auf Weg-Kacheln, grosse nur am Rand', () => {
  const s = createGame();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const d = decorFor(c, r, s.blocked);
    if (s.blocked.has(`${c},${r}`)) assert.equal(d, null);
    if (d && LARGE_DECOR_KINDS.includes(d.kind)) assert.ok(isBorderTile(c, r));
  }
  assert.equal(decorFor(-1, 2, s.blocked), null);
});

test('Dekoration: Dichte im erwarteten Bereich', () => {
  const s = createGame();
  let inner = 0, innerTotal = 0, border = 0, borderTotal = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (s.blocked.has(`${c},${r}`)) continue;
    const has = decorFor(c, r, s.blocked) !== null;
    if (isBorderTile(c, r)) { borderTotal++; if (has) border++; } else { innerTotal++; if (has) inner++; }
  }
  assert.ok(Math.abs(inner / innerTotal - INNER_DECOR_CHANCE) < 0.12);
  assert.ok(Math.abs(border / borderTotal - BORDER_DECOR_CHANCE) < 0.15);
  assert.ok(BORDER_DECOR_CHANCE <= 0.4, 'Randkacheln bleiben als bebaubar erkennbar');
});

test('Dekoration: grosse Dekoration bleibt samt Radius vollstaendig in ihrer Kachel', () => {
  const empty = new Set();
  let large = 0;
  for (const blocked of [createGame().blocked, empty]) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const d = decorFor(c, r, blocked);
      if (!d || !LARGE_DECOR_KINDS.includes(d.kind)) continue;
      large++;
      const R = LARGE_DECOR_RADIUS[d.kind];
      assert.ok(R > 0, d.kind);
      for (const v of [d.ox * TILE, d.oy * TILE]) {
        assert.ok(v - R >= 0 && v + R <= TILE, `${c},${r} ${d.kind}: ${v} +- ${R}`);
      }
    }
  }
  assert.ok(large > 20);
  for (const k of LARGE_DECOR_KINDS) assert.ok(LARGE_DECOR_RADIUS[k] * 2 <= TILE);
});

// ---------- Dekoration: Randfaelle (Tester) ----------
test('Dekoration: ausserhalb des Felds und negative Koordinaten ergeben null', () => {
  const blocked = new Set();
  for (const [c, r] of [[-1, 0], [0, -1], [-5, -5], [COLS, 0], [0, ROWS], [COLS + 3, ROWS + 3], [-1, 2], [COLS, 11]]) {
    assert.equal(decorFor(c, r, blocked), null, `${c},${r}`);
  }
});

test('Dekoration: keine Dekoration auf echten Weg-Kacheln aus WAYPOINTS', () => {
  const tiles = pathTiles(WAYPOINTS);
  let inField = 0;
  for (const key of tiles) {
    const [c, r] = key.split(',').map(Number);
    assert.equal(decorFor(c, r, tiles), null, key);
    if (c >= 0 && r >= 0 && c < COLS && r < ROWS) inField++;
  }
  assert.ok(inField > 20);
  // dieselbe Kachel ohne Sperre darf (ausser bei Zufallstreffer-Nein) Dekoration haben: Sperre ist der einzige Grund fuer null
  const free = new Set();
  let anyOnPath = 0;
  for (const key of tiles) {
    const [c, r] = key.split(',').map(Number);
    if (decorFor(c, r, free)) anyOnPath++;
  }
  assert.ok(anyOnPath > 0, 'Testbeleg: ohne blocked waere Dekoration moeglich');
});

test('Dekoration: Randkacheln (Ecken, Kanten) korrekt erkannt', () => {
  for (const [c, r] of [[0, 0], [COLS - 1, 0], [0, ROWS - 1], [COLS - 1, ROWS - 1], [0, 5], [COLS - 1, 5], [7, 0], [7, ROWS - 1]]) {
    assert.equal(isBorderTile(c, r), true, `${c},${r}`);
  }
  for (const [c, r] of [[1, 1], [COLS - 2, ROWS - 2], [10, 7], [1, ROWS - 2], [COLS - 2, 1]]) {
    assert.equal(isBorderTile(c, r), false, `${c},${r}`);
  }
  let borderCount = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (isBorderTile(c, r)) borderCount++;
  assert.equal(borderCount, 2 * COLS + 2 * (ROWS - 2));
});

test('Dekoration: innen nur kleine Arten, am Rand nur grosse Arten', () => {
  const empty = new Set();
  const innerKinds = new Set();
  const borderKinds = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const d = decorFor(c, r, empty);
    if (!d) continue;
    (isBorderTile(c, r) ? borderKinds : innerKinds).add(d.kind);
    assert.ok(d.ox >= 0.2 && d.ox <= 0.8 && d.oy >= 0.2 && d.oy <= 0.8);
    assert.ok([0, 1, 2].includes(d.variant));
  }
  for (const k of innerKinds) assert.ok(!LARGE_DECOR_KINDS.includes(k), `innen: ${k}`);
  for (const k of borderKinds) assert.ok(LARGE_DECOR_KINDS.includes(k), `rand: ${k}`);
  assert.ok(innerKinds.size >= 2 && borderKinds.size >= 2);
});

test('Dekoration: Hash stabil ueber viele Aufrufe, im Bereich, ohne Math.random', () => {
  const orig = Math.random;
  Math.random = () => { throw new Error('Math.random verboten'); };
  try {
    const first = [];
    for (let i = 0; i < 2000; i++) first.push(tileHash(i % 37, i % 23, i % 5));
    for (let i = 0; i < 2000; i++) {
      assert.equal(tileHash(i % 37, i % 23, i % 5), first[i]);
      assert.ok(first[i] >= 0 && first[i] < 4294967296 && Number.isInteger(first[i]));
    }
    assert.ok(new Set(first).size > 100);
    const s = createGame();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) decorFor(c, r, s.blocked);
  } finally { Math.random = orig; }
});

test('Dekoration: Verteilung ohne Cluster, weder leer noch voll', () => {
  const s = createGame();
  let total = 0, deco = 0;
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push([]);
    for (let c = 0; c < COLS; c++) {
      const has = decorFor(c, r, s.blocked) !== null;
      grid[r].push(has);
      if (!s.blocked.has(`${c},${r}`)) { total++; if (has) deco++; }
    }
  }
  assert.ok(deco > 0 && deco < total);
  // Innen: keine 3x3-Flaeche komplett voll und keine 3x3-Flaeche komplett leer (ausser Weg)
  let fullInner = 0, emptyBlocks = 0;
  for (let r = 1; r + 2 < ROWS - 1; r++) for (let c = 1; c + 2 < COLS - 1; c++) {
    let cnt = 0, free = 0;
    for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) {
      if (!s.blocked.has(`${c + dc},${r + dr}`)) { free++; if (grid[r + dr][c + dc]) cnt++; }
    }
    if (free === 9 && cnt === 9) fullInner++;
    if (free === 9 && cnt === 0) emptyBlocks++;
  }
  assert.equal(fullInner, 0);
  assert.ok(emptyBlocks < 6, `leere 3x3-Bloecke: ${emptyBlocks}`);
  // keine Zeile/Spalte am Rand komplett leer
  for (const r of [0, ROWS - 1]) assert.ok(grid[r].some(Boolean));
  for (const c of [0, COLS - 1]) assert.ok(grid.some((row) => row[c]));
});


test('Hindernis-Art: deterministisch, nur tree/rock; Kleindeko nie auf Hindernis', async () => {
  const { obstacleKind } = await import('../src/decor.js');
  const s = createGame({ mapId: 'forest' });
  const kinds = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const k = obstacleKind(c, r);
    assert.equal(k, obstacleKind(c, r));
    assert.ok(k === 'tree' || k === 'rock');
    kinds.add(k);
    if (s.obstacles.has(`${c},${r}`)) assert.equal(decorFor(c, r, s.blocked, s.obstacles), null);
  }
  assert.equal(kinds.size, 2);
});

// Aus forest-edge.test.js (B-043)
test('decorFor: 3-Parameter-Aufruf unveraendert', () => {
  const b = pathTiles(MAPS.forest.waypoints);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    assert.deepEqual(decorFor(c, r, b), decorFor(c, r, b, undefined));
    assert.deepEqual(decorFor(c, r, b), decorFor(c, r, b, new Set()));
  }
});

// ---------- Baumrahmen (B-077) ----------
test('treeFrame: mindestens 60 Kronen in mehreren Reihen, deterministisch, Kronen im Randring', async () => {
  const { treeFrame } = await import('../src/decor.js');
  const { TREE_FRAME, WIDTH, HEIGHT } = await import('../src/config.js');
  const a = treeFrame('meadow');
  assert.ok(a.length >= 60, `nur ${a.length} Kronen`);
  assert.deepEqual(a, treeFrame('meadow'));
  const kinds = new Set(a.map((c) => c.kind));
  for (const k of ['leaf', 'apple', 'blossom', 'fir']) assert.ok(kinds.has(k), `Art ${k} fehlt`);
  assert.ok(new Set(a.map((c) => c.row)).size >= 2, 'mehrere Reihen');
  for (const c of a) {
    const overhang = Math.min(c.x, c.y, WIDTH - c.x, HEIGHT - c.y) + c.r;
    assert.ok(overhang <= TREE_FRAME.maxOverhang + 1e-9, `Krone ragt ${overhang} px ins Feld`);
  }
});

test('treeFrame: keine Krone schneidet den Weg (inkl. Wegrand), Ein- und Ausgang bleiben frei', async () => {
  const { treeFrame } = await import('../src/decor.js');
  const { pathReach } = await import('../src/render-path.js');
  for (const id of Object.keys(MAPS)) {
    const pts = MAPS[id].waypoints.map(([c, r]) => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE }));
    for (const c of treeFrame(id)) {
      let m = Infinity;
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dy = q.y - p.y;
        const t = Math.max(0, Math.min(1, ((c.x - p.x) * dx + (c.y - p.y) * dy) / (dx * dx + dy * dy)));
        m = Math.min(m, Math.hypot(c.x - p.x - t * dx, c.y - p.y - t * dy));
      }
      assert.ok(m >= c.r + pathReach(), `${id}: Krone ${c.x.toFixed(0)},${c.y.toFixed(0)} nur ${m.toFixed(1)} px vom Weg`);
    }
  }
});

// ---------- Streu-Deko (B-079) ----------
test('scatterFor: deterministisch, nie auf Weg, Hindernis, Tor/Ziel oder fremdem Dekor, nur auf der Wiese', async () => {
  const { scatterFor, decorFor } = await import('../src/decor.js');
  const { DECOR_STYLE: D } = await import('../src/config.js');
  const s = createGame({ mapId: 'meadow' });
  const obstacles = new Set(['3,5', '9,9']);
  let n = 0;
  const kinds = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const a = scatterFor(c, r, s.blocked, obstacles, 'meadow');
    assert.deepEqual(a, scatterFor(c, r, s.blocked, obstacles, 'meadow'), 'deterministisch');
    if (!a) continue;
    n++;
    kinds.add(a.kind);
    assert.ok(!s.blocked.has(`${c},${r}`), `Streu-Deko auf Weg ${c},${r}`);
    assert.ok(!obstacles.has(`${c},${r}`), `Streu-Deko auf Hindernis ${c},${r}`);
    assert.equal(decorFor(c, r, s.blocked, obstacles), null, 'kein Doppel mit anderem Dekor');
    assert.ok(a.ox >= D.scatterOffset[0] && a.ox <= D.scatterOffset[1] && a.oy >= D.scatterOffset[0] && a.oy <= D.scatterOffset[1]);
    // Abstand zu Tor und Ziel
    const wp = MAPS.meadow.waypoints;
    for (const [wc, wr] of [wp[0], wp[wp.length - 1]]) {
      const ec = Math.min(Math.max(wc, 0), COLS - 1), er = Math.min(Math.max(wr, 0), ROWS - 1);
      assert.ok(Math.max(Math.abs(c - ec), Math.abs(r - er)) > D.scatterEndMargin, `Streu-Deko am Tor/Ziel ${c},${r}`);
    }
  }
  assert.ok(n >= 5 && n <= 35, `ruhig: ${n} Stuecke`);
  assert.ok(kinds.size >= 4, `Vielfalt: ${[...kinds]}`);
  for (const id of ['forest', 'ice', 'fork']) {
    const g = createGame({ mapId: id });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) assert.equal(scatterFor(c, r, g.blocked, null, id), null, `${id} ohne Streu-Deko`);
  }
  assert.equal(scatterFor(-1, 0, s.blocked, null, 'meadow'), null);
  assert.equal(scatterFor(0, ROWS, s.blocked, null, 'meadow'), null);
});

test('DECOR_STYLE: Konturbreite 1,3 bis 2,3 px, Anteile der Streu-Deko ergeben 1', async () => {
  const { DECOR_STYLE: D, STYLE } = await import('../src/config.js');
  for (const w of [D.outlineWidth, STYLE.outlineWidth]) assert.ok(w >= 1.3 && w <= 2.3, `Kontur ${w}`);
  assert.equal(D.outlineWidth, STYLE.outlineWidth, 'part() zeichnet mit STYLE.outlineWidth');
  assert.ok(Math.abs(D.scatterKinds.reduce((a, k) => a + k[1], 0) - 1) < 1e-9);
  assert.equal(MAPS.meadow.theme.decorStyle, 'flatpop');
  for (const id of ['forest', 'ice', 'fork']) assert.equal(MAPS[id].theme?.decorStyle, undefined);
});
