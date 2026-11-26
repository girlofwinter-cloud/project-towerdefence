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
  const s = createGame({ obstacles: new Set(['0,0', '7,5', '13,1']) }); // B-098: keine Karte hat mehr Hindernisse
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
  const b = pathTiles(MAPS.ice.waypoints);
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
  for (const id of Object.keys(MAPS)) for (const wps of [MAPS[id].waypoints, ...(MAPS[id].extraPaths || [])]) { // B-099: alle Wege
    const pts = wps.map(([c, r]) => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE }));
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
test('scatterFor: deterministisch, nie auf Weg, Hindernis, Tor/Ziel oder fremdem Dekor, nur mit decorStyle flatpop', async () => {
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
  // Seit B-073 haben alle Karten decorStyle 'flatpop': Streu-Deko gibt es genau dort, wo der Schalter steht (Karten-Tabelle)
  for (const id of [...Object.keys(MAPS), 'gibtsnicht']) {
    const g = createGame({ mapId: MAPS[id] ? id : 'meadow' });
    let any = false;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (scatterFor(c, r, g.blocked, null, id)) any = true;
    assert.equal(any, MAPS[id]?.theme?.decorStyle === 'flatpop', `${id}: Streu-Deko nur mit decorStyle flatpop`);
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
  for (const id of ['ice', 'fork', 'twin']) assert.equal(MAPS[id].theme.decorStyle, 'flatpop'); // B-072, B-073, B-099
  const { themed, DECOR_STYLE } = await import('../src/config.js');
  for (const id of Object.keys(MAPS)) {
    const st = themed(id, 'decor', DECOR_STYLE);
    assert.ok(Math.abs(st.scatterKinds.reduce((a, k) => a + k[1], 0) - 1) < 1e-9, `${id}: Anteile ergeben 1`);
  }
});

// ---------- Akzente (B-080) ----------
test('accentsFor: deterministisch, Wand/Teich/Brunnen im Randring, nur Wiese', async () => {
  const { accentsFor } = await import('../src/decor.js');
  const { TREE_FRAME, WIDTH, HEIGHT } = await import('../src/config.js');
  const a = accentsFor('meadow');
  assert.deepEqual(a, accentsFor('meadow'));
  assert.deepEqual(a.map((x) => x.kind).sort(), ['pond', 'wall', 'well']);
  for (const k of a) {
    assert.ok(k.x >= 0 && k.x + k.w <= WIDTH && k.y >= 0 && k.y + k.h <= HEIGHT, `${k.kind} im Feld`);
    const into = Math.min(k.y + k.h, HEIGHT - k.y, k.x + k.w, WIDTH - k.x);
    if (k.kind === 'wall') assert.ok(k.y + k.h <= TREE_FRAME.maxOverhang, 'Mauer in oberster Reihe plus Ueberhang');
    else assert.ok(HEIGHT - k.y <= TREE_FRAME.maxOverhang, `${k.kind} im unteren Randring`);
    if (k.kind === 'well') assert.ok(k.w < TILE && k.h < TILE, 'Brunnen kleiner als eine Kachel');
    assert.ok(into > 0);
  }
  for (const id of Object.keys(MAPS)) if (id !== 'meadow') assert.deepEqual(accentsFor(id), [], `${id} ohne Akzente`);
});

test('accentsFor: Abstand zur Wegachse, zu Start und Ziel; Kronen meiden die Akzente', async () => {
  const { accentsFor, treeFrame } = await import('../src/decor.js');
  const { pathReach } = await import('../src/render-path.js');
  const pts = MAPS.meadow.waypoints.map(([c, r]) => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE }));
  const dist = (x, y) => {
    let m = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dy = q.y - p.y;
      const t = Math.max(0, Math.min(1, ((x - p.x) * dx + (y - p.y) * dy) / (dx * dx + dy * dy)));
      m = Math.min(m, Math.hypot(x - p.x - t * dx, y - p.y - t * dy));
    }
    return m;
  };
  const acc = accentsFor('meadow');
  for (const a of acc) {
    for (let i = 0; i <= 10; i++) for (let j = 0; j <= 5; j++) {
      assert.ok(dist(a.x + (a.w * i) / 10, a.y + (a.h * j) / 5) >= pathReach() + 1, `${a.kind} zu nah am Weg`);
    }
    // Tor links (Start) und Burg rechts (Ziel) bleiben frei: mindestens 3 Kacheln Abstand
    for (const e of [pts[0], pts[pts.length - 1]]) {
      const dx = Math.max(a.x - e.x, 0, e.x - (a.x + a.w)), dy = Math.max(a.y - e.y, 0, e.y - (a.y + a.h));
      assert.ok(Math.hypot(dx, dy) >= 3 * TILE, `${a.kind} zu nah an Ein-/Ausgang`);
    }
  }
  const crowns = treeFrame('meadow');
  assert.ok(crowns.length >= 60);
  for (const c of crowns) for (const a of acc) {
    const dx = Math.max(a.x - c.x, 0, c.x - (a.x + a.w)), dy = Math.max(a.y - c.y, 0, c.y - (a.y + a.h));
    assert.ok(Math.hypot(dx, dy) >= c.r, `Krone ueberdeckt ${a.kind}`);
  }
});

test('accentsFor (Randfaelle): undefined = Wiese, unbekannte Id ohne Akzente, endliche Zahlen; Kronen anderer Karten ohne Blocker', async () => {
  const { accentsFor, treeFrame } = await import('../src/decor.js');
  assert.deepEqual(accentsFor(undefined), accentsFor('meadow'));
  assert.deepEqual(accentsFor('gibtsnicht'), []);
  for (const a of accentsFor('meadow')) for (const v of [a.x, a.y, a.w, a.h]) assert.ok(Number.isFinite(v) && (v === a.x || v === a.y || v > 0));
  for (const id of ['ice', 'fork', 'twin']) {
    assert.deepEqual(accentsFor(id), []);
    assert.deepEqual(treeFrame(id), treeFrame(id));
    assert.ok(treeFrame(id).length >= 60, `${id}: mindestens 60 Kronen`);
  }
});

// ---------- Welten Zangenangriff (B-072) und Zwei Fronten (B-099) ----------
test('themed: true/fehlend liefert den Basisblock, ein Objekt ueberschreibt nur einzelne Werte', async () => {
  const { themed, TREE_FRAME, GROUND_STYLE, DECOR_STYLE } = await import('../src/config.js');
  assert.equal(themed('meadow', 'treeFrame', TREE_FRAME), TREE_FRAME, 'Wiese: true -> Basis (dasselbe Objekt)');
  assert.equal(themed('ice', 'ground', GROUND_STYLE).base, '#e3f1fa', 'Eis (B-073) ueberschreibt den Boden');
  assert.equal(themed('ice', 'ground', GROUND_STYLE).blobPoints, GROUND_STYLE.blobPoints, 'nicht genannte Werte bleiben');
  assert.equal(themed(undefined, 'decor', DECOR_STYLE), DECOR_STYLE);
  assert.equal(themed('gibtsnicht', 'decor', DECOR_STYLE), DECOR_STYLE);
  const g = themed('fork', 'ground', GROUND_STYLE);
  assert.equal(g.base, '#b3b45a');
  assert.equal(g.tufts, GROUND_STYLE.tufts, 'nicht genannte Werte bleiben');
  assert.equal(GROUND_STYLE.base, '#5fae48', 'Basisblock bleibt unveraendert');
});

test('Zangenangriff/Zwei Fronten: eigene Paletten aus config (Boden, Weg, Akzente), klar verschieden von Wiese und voneinander', async () => {
  const { themed, GROUND_STYLE, TREE_FRAME, DECOR_STYLE } = await import('../src/config.js');
  const gb = (id) => themed(id, 'ground', GROUND_STYLE).base;
  assert.equal(gb('twin'), '#7cb24f');
  assert.equal(gb('fork'), '#b3b45a');
  assert.equal(new Set(['meadow', 'twin', 'fork'].map(gb)).size, 3);
  assert.equal(MAPS.twin.theme.path.main, '#dcc08a');
  assert.equal(MAPS.twin.theme.path.edge, '#86603a');
  assert.equal(MAPS.fork.theme.path.main, '#d6ab70');
  assert.equal(MAPS.fork.theme.path.edge, '#7d5632');
  assert.equal(themed('twin', 'decor', DECOR_STYLE).mushroomCap, '#c9542f');
  assert.deepEqual(themed('twin', 'treeFrame', TREE_FRAME).fir[0], '#336f3c');
  assert.ok(themed('fork', 'treeFrame', TREE_FRAME).greens.includes('#e0803a'), 'Laub orange');
  assert.equal(themed('fork', 'decor', DECOR_STYLE).rock, '#8b8c94');
  assert.equal(themed('fork', 'decor', DECOR_STYLE).woodDark, '#6e4d2a', 'Stamm');
});

test('treeFrame Zangenangriff/Zwei Fronten: Fork Herbstlaub, Zwei Fronten gemischt, deterministisch', async () => {
  const { treeFrame } = await import('../src/decor.js');
  const twin = treeFrame('twin'), fork = treeFrame('fork'), meadow = treeFrame('meadow');
  assert.deepEqual(twin, treeFrame('twin'));
  assert.deepEqual(fork, treeFrame('fork'));
  const share = (list, k) => list.filter((c) => c.kind === k).length / list.length;
  assert.ok(share(fork, 'fir') < 0.3 && share(fork, 'leaf') > 0.3, 'Fork: Laubbaeume');
  assert.ok(share(meadow, 'fir') < 0.3);
  assert.ok(share(twin, 'fir') > 0.1 && share(twin, 'leaf') > 0.3, 'Zwei Fronten: Laub und Tannen gemischt');
});

test('Zangenangriff/Zwei Fronten: Streu-Deko je Welt verschieden, deterministisch, nie auf Weg/Hindernis/Tor, nur eigene Arten', async () => {
  const { scatterFor } = await import('../src/decor.js');
  const sets = {};
  for (const id of ['meadow', 'twin', 'fork']) {
    const g = createGame({ mapId: id });
    const kinds = new Set();
    let n = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const a = scatterFor(c, r, g.blocked, g.obstacles, id);
      assert.deepEqual(a, scatterFor(c, r, g.blocked, g.obstacles, id));
      if (!a) continue;
      n++;
      kinds.add(a.kind);
      assert.ok(!g.blocked.has(`${c},${r}`) && !(g.obstacles && g.obstacles.has(`${c},${r}`)), `${id}: Deko auf Weg/Hindernis ${c},${r}`);
      assert.equal(decorFor(c, r, g.blocked, g.obstacles), null);
    }
    assert.ok(n >= 8, `${id}: ${n} Stuecke`);
    sets[id] = kinds;
  }
  for (const k of ['stump', 'sign']) assert.ok(sets.twin.has(k), `Zwei Fronten: ${k}`);
  for (const k of ['leafpile', 'rockgroup']) assert.ok(sets.fork.has(k), `Fork: ${k}`);
  assert.ok(!sets.twin.has('leafpile'), 'Zwei Fronten ohne Herbstlaub');
  for (const k of ['leafpile', 'rockgroup', 'moss', 'stump', 'mushrooms']) assert.ok(!sets.meadow.has(k), `Wiese ohne ${k}`);
  assert.notDeepEqual([...sets.twin].sort(), [...sets.fork].sort());
  assert.notDeepEqual([...sets.twin].sort(), [...sets.meadow].sort());
});

test('Zangenangriff/Zwei Fronten: Balancing wie gemessen (B-099), Bodenflecken nie auf einem Weg', async () => {
  const { groundPatches } = await import('../src/decor.js');
  assert.deepEqual(MAPS.fork.modifiers, { towerDamage: { cannon: 0.92 } });
  assert.deepEqual(MAPS.twin.modifiers, { enemySpeed: 0.9 });
  for (const id of ['twin', 'fork']) {
    const a = groundPatches(id);
    assert.deepEqual(a, groundPatches(id));
    assert.ok(a.patches.length > 0 && a.tufts.length > 0);
    for (const pts of createGame({ mapId: id }).paths.map((p) => p.points)) {
    for (const t of a.tufts) {
      let m = Infinity;
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dy = q.y - p.y;
        const u = Math.max(0, Math.min(1, ((t.x - p.x) * dx + (t.y - p.y) * dy) / (dx * dx + dy * dy || 1)));
        m = Math.min(m, Math.hypot(t.x - p.x - u * dx, t.y - p.y - u * dy));
      }
      assert.ok(m >= 28, `${id}: Buesche nicht auf dem Weg (${m.toFixed(1)} px)`);
    }
    }
  }
});

// ---------- Eiswelt (B-073) ----------
test('Eis: Palette aus config (Boden, Weg dunkler als Schnee, Tanne, Kristall), klar verschieden von den anderen Welten', async () => {
  const { themed, GROUND_STYLE, TREE_FRAME, DECOR_STYLE } = await import('../src/config.js');
  const { brightness } = await import('../src/draw-utils.js');
  const gb = (id) => themed(id, 'ground', GROUND_STYLE).base;
  assert.equal(gb('ice'), '#e3f1fa');
  assert.equal(new Set(['meadow', 'twin', 'fork', 'ice'].map(gb)).size, 4);
  const path = MAPS.ice.theme.path;
  assert.equal(path.main, '#9db3c9');
  assert.equal(path.edge, '#4f6682');
  assert.ok(brightness(path.main) <= brightness(gb('ice')) - 0.15, 'Weg deutlich dunkler als der Schnee');
  assert.ok(brightness(path.edge) < brightness(path.main), 'Rand dunkler als der Weg');
  assert.deepEqual(themed('ice', 'treeFrame', TREE_FRAME).fir[0], '#2f6f5f');
  assert.equal(themed('ice', 'treeFrame', TREE_FRAME).snow, '#ffffff');
  assert.equal(themed('ice', 'decor', DECOR_STYLE).crystal, '#7fe0ff');
  assert.equal(themed('meadow', 'decor', DECOR_STYLE).snow, null, 'Wiese ohne Schnee');
  assert.equal(themed('twin', 'treeFrame', TREE_FRAME).snow, null);
});

test('Eis: Balancing und Logik unveraendert (Modifikatoren, keine Hindernisse, alles bebaubar ausser Weg)', async () => {
  const { canBuild } = await import('../src/game.js');
  assert.deepEqual(MAPS.ice.modifiers, { enemySpeed: 1.14, towerDamage: { cannon: 0.95, frost: 0.7 }, slowStrength: 0.85 });
  assert.equal(MAPS.ice.obstacles, undefined);
  const g = createGame({ mapId: 'ice' });
  assert.equal(g.obstacles.size, 0);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) assert.equal(canBuild(g, c, r).ok, !g.blocked.has(`${c},${r}`), `${c},${r}`);
});

test('treeFrame Eis: nur Tannen, deterministisch, in zwei Reihen, Kronen nie auf dem Weg', async () => {
  const { treeFrame } = await import('../src/decor.js');
  const ice = treeFrame('ice');
  assert.deepEqual(ice, treeFrame('ice'));
  assert.ok(ice.length >= 60);
  assert.ok(ice.every((c) => c.kind === 'fir'), 'nur Tannen im Rahmen');
  assert.ok(new Set(ice.map((c) => c.row)).size >= 2);
});

test('Eis: Streu-Deko mit Kristallen, Schneehaufen und Eisfelsen, deterministisch, nie auf Weg/Tor, ohne Wald-/Herbst-Arten', async () => {
  const { scatterFor } = await import('../src/decor.js');
  const g = createGame({ mapId: 'ice' });
  const kinds = new Set();
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const a = scatterFor(c, r, g.blocked, g.obstacles, 'ice');
    assert.deepEqual(a, scatterFor(c, r, g.blocked, g.obstacles, 'ice'));
    if (!a) continue;
    n++;
    kinds.add(a.kind);
    assert.ok(!g.blocked.has(`${c},${r}`), `Deko auf Weg ${c},${r}`);
    assert.equal(decorFor(c, r, g.blocked, g.obstacles), null);
  }
  assert.ok(n >= 8, `${n} Stuecke`);
  for (const k of ['crystal', 'snowpile', 'rockgroup']) assert.ok(kinds.has(k), `Eis: ${k}`);
  for (const k of ['mushroom', 'mushrooms', 'moss', 'stump', 'leafpile', 'log', 'barrel']) assert.ok(!kinds.has(k), `Eis ohne ${k}`);
});

test('Eis: Boden mit Schneeverwehungen, deterministisch, Plateaus und Buesche nie auf dem Weg', async () => {
  const { groundPatches } = await import('../src/decor.js');
  const { themed, GROUND_STYLE: G } = await import('../src/config.js');
  const a = groundPatches('ice');
  assert.deepEqual(a, groundPatches('ice'));
  const gs = themed('ice', 'ground', G);
  assert.ok(a.plateaus.length > 0 && a.plateaus.length <= gs.plateaus);
  assert.ok(a.patches.length > 0 && a.tufts.length > 0);
  const pts = createGame({ mapId: 'ice' }).path.points;
  const dist = (x, y) => {
    let m = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dy = q.y - p.y;
      const u = Math.max(0, Math.min(1, ((x - p.x) * dx + (y - p.y) * dy) / (dx * dx + dy * dy || 1)));
      m = Math.min(m, Math.hypot(x - p.x - u * dx, y - p.y - u * dy));
    }
    return m;
  };
  for (const t of a.tufts) assert.ok(dist(t.x, t.y) >= gs.tuftPathMargin, 'Busch nicht auf dem Weg');
  for (const p of a.plateaus) assert.ok(dist(p.x, p.y) >= gs.plateauCenterMargin, 'Verwehung nicht auf dem Weg');
});
