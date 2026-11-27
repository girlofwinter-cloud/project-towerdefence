// Unit-Tests für den gemalten Hintergrund (Stil 1, src/render-painted.js) und den Rand um das Feld
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, canBuild } from '../src/game.js';
import { TILE, COLS, ROWS, WIDTH, HEIGHT, MAPS, FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT, PAINTED_STYLE, PAINTED_PALETTE } from '../src/config.js';
import { buildPaintedScene, buildPaintedSvg, paintedWaterAt, toGame, paletteFor, flagTilesOf } from '../src/render-painted.js';
import { mockCtx } from './helpers.js';

const meadow = () => createGame({ mapId: 'meadow' });
const OVER = PAINTED_STYLE.maxOverhang * TILE;
// Eindringtiefe eines Rahmens (Spiel-px) in eine Kachel: kleinere der beiden Überlappungen, 0 ohne Überlappung
function depth([x0, y0, x1, y1], c, r) {
  const ox = Math.min(x1, (c + 1) * TILE) - Math.max(x0, c * TILE);
  const oy = Math.min(y1, (r + 1) * TILE) - Math.max(y0, r * TILE);
  return ox > 0 && oy > 0 ? Math.min(ox, oy) : 0;
}
const inField = (x, y) => x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;
const MAP_IDS = Object.keys(MAPS);
const buildableOf = (s) => {
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (canBuild(s, c, r).ok) out.push([c, r]);
  return out;
};

test('Stil 1: SVG deterministisch, Canvas-Größe mit Rand, enthält Boden-Filter, Weg-Schichten, Wasser, Brücke, Burg, Fahne', () => {
  const a = buildPaintedSvg(meadow());
  assert.equal(a, buildPaintedSvg(meadow()), 'deterministisch');
  assert.equal(VIEW_WIDTH, WIDTH + 2 * FRAME_MARGIN);
  assert.equal(VIEW_HEIGHT, HEIGHT + 2 * FRAME_MARGIN);
  assert.match(a, new RegExp(`^<svg [^>]*width="${VIEW_WIDTH}" height="${VIEW_HEIGHT}"`));
  for (const id of ['p-mot', 'p-lit', 'p-grain', 'p-wob', 'p-gr']) assert.ok(a.includes(`id="${id}"`), `Filter/Verlauf ${id}`);
  assert.ok(a.includes('filter="url(#p-mot)"') && a.includes('filter="url(#p-lit)"'), 'Boden gemalt');
  const path = a.match(/<g class="path">(.*?)<\/g><path/)[1];
  for (const w of [86, 72, 64, 54, 30]) assert.ok(path.includes(`stroke-width="${w}"`), `Weg-Schicht ${w}`);
  for (const part of ['id="river"', 'id="lake"', 'class="bridge"', 'class="castle"', 'class="flag"', 'class="cliff"', 'class="flower"']) assert.ok(a.includes(part), part);
  assert.ok(!/<text/.test(a), 'Fahne ohne Zahl (kommt als HUD)');
  // Feld um den Rand verschoben und mit TILE / 57 skaliert
  assert.ok(a.includes(`translate(${FRAME_MARGIN} ${FRAME_MARGIN}) scale(${Math.round((TILE / PAINTED_STYLE.unit) * 1e5) / 1e5}`));
});

test('Stil 1 (alle Karten): kein Baum, Fels oder Klippenstück auf einer bebaubaren Kachel (Krone höchstens maxOverhang)', () => {
  for (const id of MAP_IDS) checkNothingOnBuildable(id);
});

function checkNothingOnBuildable(id) {
  const s = createGame({ mapId: id });
  const sc = buildPaintedScene(s);
  assert.ok(sc.trees.length > 30, `${id}: Rahmenwald vorhanden`);
  const buildable = buildableOf(s);
  for (const t of [...sc.trees, ...sc.rocks]) {
    const box = toGame(t.box);
    const [fx, fy] = [t.x * (TILE / PAINTED_STYLE.unit), t.y * (TILE / PAINTED_STYLE.unit)];
    // Fußpunkt: im Rand oder auf einer Hindernis-Kachel (Fuß sitzt am unteren Kachelrand, darum knapp darüber prüfen)
    if (inField(fx, fy - 1)) assert.ok(s.obstacles.has(`${Math.floor(fx / TILE)},${Math.floor((fy - 1) / TILE)}`), `${id}: ${t.kind} steht im Feld bei ${fx},${fy}`);
    for (const [c, r] of buildable) assert.ok(depth(box, c, r) <= OVER + 1e-9, `${id}: ${t.kind} ragt ${depth(box, c, r).toFixed(1)} px in ${c},${r}`);
  }
  assert.ok(sc.cliffs.length >= 1, `${id}: Klippe`);
  for (const cl of sc.cliffs) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) assert.equal(depth(toGame(cl.box), c, r), 0, `${id}: Klippe in ${c},${r}`);
  // Hindernisse bekommen genau ihre Figur
  assert.equal(sc.rocks.length + sc.trees.filter((t) => inField(t.x * TILE / PAINTED_STYLE.unit, t.y * TILE / PAINTED_STYLE.unit - 1)).length, s.obstacles.size, id);
}

// Entscheidung 2026-11-27: Fahne 1,25x größer, darf ins Feld ragen, aber nur über die gesperrten Fahnen-Kacheln
// Liefert die erste Feldkachel unter Tuch oder Mast, die keine Fahnen-Kachel ist (null = alles gut)
const flagOk = (s, el) => {
  const bad = flagTilesOf({ flags: [el] }).find(([c, r]) => !s.flagTiles.has(`${c},${r}`));
  return bad ? bad.join(',') : null;
};
test('Stil 1 (alle Karten): Burg am Ausgang, Fahne an jedem Eingang; Burg und Klippen ganz im Rand, Fahne ragt höchstens über die Fahnen-Kacheln ins Feld', () => {
  for (const id of MAP_IDS) {
    const s = createGame({ mapId: id });
    const sc = buildPaintedScene(s);
    const paths = s.paths || [s.path];
    assert.equal(sc.flags.length, paths.length, `${id}: eine Fahne je Eingang`);
    assert.equal(sc.castles.length, 1, `${id}: eine Burg am gemeinsamen Ausgang`);
    for (const el of [...sc.castles, ...sc.cliffs]) {
      const [x0, y0, x1, y1] = toGame(el.box);
      assert.ok(x1 <= 0 || x0 >= WIDTH || y1 <= 0 || y0 >= HEIGHT, `${id}: ${el.kind} ragt ins Feld (${x0},${y0},${x1},${y1})`);
      assert.ok(x0 >= -FRAME_MARGIN - 1 && x1 <= WIDTH + FRAME_MARGIN + 1, `${id}: ${el.kind} im Canvas`);
    }
    // Fahnen-Kacheln der Karte = genau die Feldkacheln unter Tuch und Mast; höchstens eine Kachel je Eingang
    assert.deepEqual(flagTilesOf(sc), MAPS[id].flagTiles, `${id}: MAPS.flagTiles passt zur Fahne`);
    assert.ok(MAPS[id].flagTiles.length <= paths.length, `${id}: höchstens eine Fahnen-Kachel je Eingang`);
    for (const fl of sc.flags) {
      assert.equal(flagOk(s, fl), null, `${id}: Fahne ragt über eine bebaubare Kachel`);
      const [x0, , x1] = toGame(fl.box);
      assert.ok(x0 >= -FRAME_MARGIN - 1 && x1 <= TILE, `${id}: Fahne im Canvas, höchstens eine Spalte im Feld`);
    }
    // Fahne neben ihrem Eingang (alle Eingänge liegen links, Mast im Rand)
    paths.forEach((p, i) => {
      const y = p.points[0].y, fl = toGame(sc.flags[i].box);
      assert.ok(fl[0] < 0 && fl[1] < y + 2 * TILE && fl[3] > y - 2 * TILE, `${id}: Fahne ${i} am Eingang`);
    });
    const end = paths[0].points.at(-1), castle = toGame(sc.castles[0].box);
    assert.ok(castle[0] >= WIDTH && castle[1] < end.y && castle[3] > end.y, `${id}: Burg rechts am Ausgang`);
  }
});

test('Stil 1: Burg und Klippen der Wiese liegen ganz im Rand, Fahne ragt nur über ihre Kachel ins Feld', () => {
  const sc = buildPaintedScene(meadow());
  assert.equal(sc.castles.length, 1);
  assert.equal(sc.flags.length, 1);
  assert.equal(flagOk(meadow(), sc.flags[0]), null, 'Fahne nur über der Fahnen-Kachel');
  for (const el of [...sc.castles, ...sc.cliffs]) {
    const [x0, y0, x1, y1] = toGame(el.box);
    assert.ok(x1 <= 0 || x0 >= WIDTH || y1 <= 0 || y0 >= HEIGHT, `${el.kind} ragt ins Feld (${x0},${y0},${x1},${y1})`);
  }
  // Fahne am Eingang (links), Burg am Ausgang (rechts), beide auf Höhe ihres Wegendes
  const s = meadow();
  const [first, last] = [s.path.points[0], s.path.points.at(-1)];
  const flag = toGame(sc.flags[0].box), castle = toGame(sc.castles[0].box);
  // Unter dem Weg: dort verdeckt das Tuch nur Wasser (0,3), über dem Weg wäre es der Bauplatz (0,0)
  assert.ok(flag[0] < 0 && flag[1] > first.y && flag[1] < first.y + TILE, 'Fahne links am Eingang, unter dem Weg');
  assert.ok(castle[0] >= WIDTH && castle[1] < last.y && castle[3] > last.y, 'Burg rechts am Ausgang');
  assert.ok(castle[2] <= WIDTH + FRAME_MARGIN && flag[0] >= -FRAME_MARGIN, 'im Canvas');
});

test('Stil 1 (alle Karten): Vignette im Feld höchstens 0,15, starke Vignette nur im Rand (Maske spart das Feld aus)', () => {
  for (const id of MAP_IDS) checkVignette(buildPaintedSvg(createGame({ mapId: id })));
});

function checkVignette(a) {
  const field = a.match(/<radialGradient id="p-vig-field".*?<\/radialGradient>/)[0];
  const alphas = [...field.matchAll(/stop-opacity="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.ok(alphas.length >= 2 && Math.max(...alphas) <= 0.15, `Feld-Vignette ${alphas}`);
  assert.ok(PAINTED_STYLE.fieldVignette <= 0.15);
  assert.match(a, /id="vignette-frame"[^>]*mask="url\(#p-ring\)"/, 'Rand-Vignette maskiert');
  const mask = a.match(/<mask id="p-ring".*?<\/mask>/)[0];
  const black = mask.match(/<rect x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#000"/);
  assert.ok(black, 'Feld in der Maske schwarz');
  const [x, y, w, h] = black.slice(1).map(Number);
  const U = PAINTED_STYLE.unit;
  assert.ok(x <= 0 && y <= 0 && x + w >= COLS * U && y + h >= ROWS * U, 'Maske deckt das ganze Feld');
}

test('Stil 1: Wasserkacheln der Wiese folgen der gemalten Form (Kachelmitte im Wasser), Malerei ragt höchstens wenig in Bauplätze', () => {
  const s = meadow();
  const bridges = new Set(MAPS.meadow.bridges.map(([c, r]) => `${c},${r}`));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const k = `${c},${r}`;
    const wet = paintedWaterAt('meadow', (c + 0.5) * TILE, (r + 0.5) * TILE);
    assert.equal(wet, s.water.has(k) || bridges.has(k), `Kachel ${k}: gemalt ${wet}, Logik ${s.water.has(k)}`);
    if (!canBuild(s, c, r).ok) continue;
    let n = 0;
    for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) if (paintedWaterAt('meadow', (c + (i + 0.5) / 10) * TILE, (r + (j + 0.5) / 10) * TILE)) n++;
    assert.ok(n <= 15, `Bauplatz ${k} zu ${n} % unter Wasser`);
  }
  // Brücke liegt im Fluss auf dem Weg (Flussmitte kreuzt innerhalb der Brückenkachel)
  const [b] = buildPaintedScene(s).bridges;
  assert.ok(b.horizontal && Math.floor((b.x * TILE) / PAINTED_STYLE.unit / TILE) === 1);
  assert.equal(paintedWaterAt('ice', 60, 60), false, 'andere Karten ohne gemalte Form');
});

test('Stil 1 (alle Karten): Tupfen nur auf freien Feldkacheln, Szene ohne Sets wirft nicht', () => {
  for (const id of MAP_IDS) {
    const s = createGame({ mapId: id });
    const sc = buildPaintedScene(s);
    assert.ok(sc.flowers.length > 10, id);
    for (const f of sc.flowers) assert.ok(canBuild(s, f.c, f.r).ok, `${id}: Tupfen auf ${f.c},${f.r}`);
    assert.ok(sc.flowers.every((f) => f.kind === paletteFor(id).dotKind), id);
  }
  for (const id of Object.keys(MAPS)) {
    const st = createGame({ mapId: id });
    assert.ok(buildPaintedSvg(st).startsWith('<svg'), id);
    assert.ok(buildPaintedSvg({ mapId: id, path: st.path }).endsWith('</svg>'), `${id} ohne Sets`);
  }
});

test('Stil 1: renderView zeichnet Rand und verschiebt das Feld; in Node bleibt das alte Zeichnen als Rückfall', async () => {
  const { renderView, paintedStatus } = await import('../src/render.js?stil1');
  const calls = [];
  const m = mockCtx();
  const ctx = new Proxy({}, {
    get(_, k) { const v = m.ctx[k]; return typeof v === 'function' ? (...a) => { calls.push([k, ...a]); return v(...a); } : v; },
    set(_, k, v) { m.ctx[k] = v; return true; },
  });
  for (const id of ['meadow', 'ice']) {
    calls.length = 0;
    renderView(ctx, createGame({ mapId: id }), {});
    assert.deepEqual(calls.find((c) => c[0] === 'fillRect'), ['fillRect', 0, 0, VIEW_WIDTH, VIEW_HEIGHT], `${id}: einfacher Rahmen`);
    assert.deepEqual(calls.find((c) => c[0] === 'translate'), ['translate', FRAME_MARGIN, FRAME_MARGIN], `${id}: Feld verschoben`);
    assert.equal(m.depth, 0);
  }
  // Plan G9: alle Karten gemalt; ohne Image (Node) wird nicht gerastert
  for (const id of MAP_IDS) {
    assert.ok(MAPS[id].theme?.painted, `${id} gemalt`);
    assert.equal(paintedStatus(id), 'none', `${id}: ohne Image kein Rastern`);
  }
});

// Plan G9: Palette und Elemente je Karte aus der Konfiguration (theme.painted über themed())
test('Stil 1 (G9): Bodenfarben, Bäume und Tupfen je Karte, Wiese behält die Basis-Palette', () => {
  const G9 = { ice: ['#eef6fb', '#a9c6dc'], fork: ['#d9a94e', '#8a5a2b'], twin: ['#a6cf5a', '#4a6e2c'], volcano: ['#6b5a55', '#2d1f20'] };
  assert.deepEqual(paletteFor('meadow'), PAINTED_PALETTE);
  for (const [id, [top, bottom]] of Object.entries(G9)) {
    const a = buildPaintedSvg(createGame({ mapId: id }));
    const gr = a.match(/<linearGradient id="p-gr".*?<\/linearGradient>/)[0];
    assert.ok(gr.includes(`stop-color="${top}"`) && gr.includes(`stop-color="${bottom}"`), `${id}: Boden ${top} -> ${bottom}`);
    assert.equal(a, buildPaintedSvg(createGame({ mapId: id })), `${id}: deterministisch`);
    assert.ok(!/<text/.test(a), id);
  }
  const ice = buildPaintedScene(createGame({ mapId: 'ice' }));
  assert.ok(ice.trees.every((t) => t.kind === 'pine'), 'Eiswelt: nur Tannen');
  const iceSvg = buildPaintedSvg(createGame({ mapId: 'ice' }));
  assert.ok(iceSvg.includes('#5d7e9c') || iceSvg.includes('0.36'), 'Eiswelt: Flecken #5d7e9c');
  assert.ok(iceSvg.includes('class="dot-crystal"') && (iceSvg.match(/fill="#ffffff" stroke="#2b1a10" stroke-width="2"/g) || []).length > 40, 'Eiswelt: Kristalle, Schneekappen');
  const fork = buildPaintedSvg(createGame({ mapId: 'fork' }));
  assert.ok(fork.includes('class="dot-leaf"') && fork.includes('fill="#e0803a"') && fork.includes('fill="#c9562f"'), 'Herbst: Laub');
  const vol = buildPaintedScene(createGame({ mapId: 'volcano' }));
  assert.ok(vol.trees.some((t) => t.kind === 'bare') && !vol.trees.some((t) => t.kind === 'round'), 'Vulkan: kahle Bäume');
  const volSvg = buildPaintedSvg(createGame({ mapId: 'volcano' }));
  assert.ok(volSvg.includes('class="dot-ember"') && volSvg.includes('#ffb04a'), 'Vulkan: Glutflecken');
  assert.ok(volSvg.includes('id="lava"') && !volSvg.includes('id="river"') && volSvg.includes('class="bridge"'), 'Vulkan: Lava statt Wasser, Brücke');
  for (const id of ['ice', 'fork', 'twin']) assert.ok(!buildPaintedSvg(createGame({ mapId: id })).includes('id="lava"'), `${id} ohne Lava`);
});

// Mittellinie wie smoothOpen in render-painted.js (Q-Kurven über die Mittelpunkte), dicht abgetastet
function smoothSamples(pts) {
  const out = [pts[0]];
  let prev = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const end = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    for (let k = 1; k <= 20; k++) {
      const t = k / 20, u = 1 - t;
      out.push([0, 1].map((j) => u * u * prev[j] + 2 * u * t * pts[i][j] + t * t * end[j]));
    }
    prev = end;
  }
  const last = pts.at(-1);
  for (let k = 1; k <= 20; k++) out.push([prev[0] + ((last[0] - prev[0]) * k) / 20, prev[1] + ((last[1] - prev[1]) * k) / 20]);
  return out;
}
const inPoly = (poly, x, y) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

test('Stil 1 (G9): Lava des Vulkans folgt den Lavakacheln, Kruste ragt höchstens wenig in Bauplätze, Brücke auf der Brückenkachel', () => {
  const s = createGame({ mapId: 'volcano' });
  const sc = buildPaintedScene(s);
  const U = PAINTED_STYLE.unit;
  const line = smoothSamples(sc.lava.river);
  const half = PAINTED_STYLE.lava[1] / 2; // Kruste
  const lavaAt = (gx, gy) => {
    const x = gx / (TILE / U), y = gy / (TILE / U);
    return line.some(([px, py]) => Math.hypot(px - x, py - y) <= half) || sc.lava.pools.some((ring) => inPoly(ring[1], x, y));
  };
  // Jede Lavakachel (Mitte) liegt in der gemalten Lava
  for (const k of s.lava) {
    const [c, r] = k.split(',').map(Number);
    assert.ok(lavaAt((c + 0.5) * TILE, (r + 0.5) * TILE), `Lavakachel ${k} nicht gemalt`);
  }
  // Bauplätze höchstens 15 % unter der Kruste (wie beim Wasser der Wiese)
  for (const [c, r] of buildableOf(s)) {
    let n = 0;
    for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) if (lavaAt((c + (i + 0.5) / 10) * TILE, (r + (j + 0.5) / 10) * TILE)) n++;
    assert.ok(n <= 15, `Bauplatz ${c},${r} zu ${n} % unter Lava`);
  }
  // Lavafluss reicht oben und unten bis über den Canvas-Rand, Brücke liegt auf der Brückenkachel
  assert.ok(sc.lava.river[0][1] * (TILE / U) < -FRAME_MARGIN && sc.lava.river.at(-1)[1] * (TILE / U) > HEIGHT + FRAME_MARGIN);
  assert.equal(sc.bridges.length, MAPS.volcano.bridges.length);
  const [bc, br] = MAPS.volcano.bridges[0];
  const b = sc.bridges[0];
  assert.deepEqual([Math.floor((b.x * TILE) / U / TILE), Math.floor((b.y * TILE) / U / TILE)], [bc, br]);
  assert.ok(b.horizontal, 'Weg läuft waagerecht über die Brücke');
  // Randbäume nicht in der Lava
  for (const t of sc.trees) for (const [px, py] of line) assert.ok(!(t.x > px - 30 && t.x < px + 30 && Math.abs(t.y - py) < 30), `Baum in der Lava bei ${t.x},${t.y}`);
});

// Seit der großen Fahne (2026-11-27) je Eingang eine Fahnen-Kachel weniger, außer Wiese (Fahne über Wasser); vorher 226/233/221/196/212
test('Stil 1 (G9): Bauplatzzahl je Karte (gemalter Hintergrund ändert keine Kacheln, nur die Fahnen-Kacheln fallen weg)', () => {
  const expected = { meadow: 226, ice: 232, fork: 219, twin: 194, volcano: 211 };
  for (const id of MAP_IDS) assert.equal(buildableOf(createGame({ mapId: id })).length, expected[id], id);
});

test('Stil 1 (alle Karten): Fahne mit Abstand zur Canvas-Oberkante (Zwei Fronten: Eingang in Zeile 1)', () => {
  const MU = FRAME_MARGIN / (TILE / PAINTED_STYLE.unit);
  for (const id of MAP_IDS) {
    for (const fl of buildPaintedScene(createGame({ mapId: id })).flags) {
      assert.ok(fl.box[1] >= -MU + PAINTED_STYLE.flagTopGap - 1e-9, `${id}: Fahne oben bei ${fl.box[1].toFixed(1)}`);
      assert.equal(fl.s, PAINTED_STYLE.flagScale, `${id}: Fahne in voller Größe (${fl.s})`);
    }
  }
  // Zwei Fronten: oben ist über dem Weg kein Platz, die obere Fahne steht unter dem Weg (volle Größe statt verkleinert)
  const twinState = createGame({ mapId: 'twin' });
  const [top, low] = buildPaintedScene(twinState).flags.map((fl) => toGame(fl.box));
  assert.ok(top[1] > twinState.paths[0].points[0].y, 'obere Fahne unter dem Weg');
  assert.ok(low[3] < twinState.paths[1].points[0].y, 'untere Fahne über dem Weg');
});

test('Stil 1: mehrere Wege werden als ein Weg gemalt (jede Schicht genau einmal, alle Wege als Teilstücke)', () => {
  for (const id of Object.keys(MAPS)) {
    const s = createGame({ mapId: id });
    const n = buildPaintedScene(s).paths.length;
    const svg = buildPaintedSvg(s);
    assert.equal((svg.match(/<g class="path">/g) || []).length, 1, `${id}: eine Weg-Gruppe`);
    const group = svg.slice(svg.indexOf('<g class="path">'));
    const fuge = group.match(/<path d="([^"]*)"[^>]*stroke-width="86"/);
    assert.ok(fuge, `${id}: Fuge vorhanden`);
    assert.equal((fuge[1].match(/M /g) || []).length, n, `${id}: ${n} Wege als Teilstücke derselben Schicht`);
  }
});

// HiDPI im Vollbild: das SVG wird direkt im Anzeigemaßstab gerastert (Vektor, scharf), für alle gemalten Karten gleich
test('HiDPI: rasterizePainted rastert im Maßstab scale (Standard 1)', async () => {
  const { rasterizePainted } = await import('../src/render-painted.js');
  const drawn = [];
  const saved = { Image: globalThis.Image, document: globalThis.document, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  globalThis.Image = class { decode() { return Promise.resolve(); } };
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: (...a) => drawn.push(a) }) }) };
  URL.createObjectURL = () => 'blob:x';
  URL.revokeObjectURL = () => {};
  try {
    const one = await rasterizePainted('<svg/>');
    assert.deepEqual([one.width, one.height], [VIEW_WIDTH, VIEW_HEIGHT]);
    const two = await rasterizePainted('<svg/>', 2.42);
    assert.deepEqual([two.width, two.height], [Math.round(VIEW_WIDTH * 2.42), Math.round(VIEW_HEIGHT * 2.42)]);
    assert.deepEqual(drawn.at(-1).slice(1), [0, 0, two.width, two.height], 'Bild füllt den ganzen Puffer');
  } finally {
    if (saved.Image === undefined) delete globalThis.Image; else globalThis.Image = saved.Image;
    if (saved.document === undefined) delete globalThis.document; else globalThis.document = saved.document;
    URL.createObjectURL = saved.create;
    URL.revokeObjectURL = saved.revoke;
  }
});

// C-Abnahme 1: Seitenzonen als gemalte Fortsetzung (gleiches Bild, größerer Ausschnitt)
test('C-Abnahme 1: buildPaintedSvg mit ext malt die Seitenzonen weiter (Wald, Wege bis zum Rand), ohne ext unverändert', async () => {
  const { extentOf } = await import('../src/render-painted.js');
  assert.deepEqual(extentOf({ l: 10, t: -3, r: NaN }), { l: 10, t: 0, r: 0, b: 0 });
  for (const id of MAP_IDS) {
    const s = createGame({ mapId: id });
    const plain = buildPaintedSvg(s);
    assert.equal(buildPaintedSvg(s, { ext: { l: 0, t: 0, r: 0, b: 0 } }), plain, `${id}: ext 0 = ohne ext`);
    const ext = { l: 130, t: 20, r: 130, b: 20 };
    const a = buildPaintedSvg(s, { ext });
    assert.equal(a, buildPaintedSvg(s, { ext }), `${id}: deterministisch`);
    assert.match(a, new RegExp(`viewBox="-130 -20 ${VIEW_WIDTH + 260} ${VIEW_HEIGHT + 40}" preserveAspectRatio="none"`));
    // Bäume in den Zonen: ganz außerhalb des Canvas, dicht (Abstand des Rasters <= 60 CSS-px bei 1280x800)
    const k = TILE / PAINTED_STYLE.unit, MU = FRAME_MARGIN / k;
    const treesOf = (svg) => [...svg.matchAll(/<g class="(?:pine|round|bare)"><g transform="translate\(([-\d.]+) ([-\d.]+)\)/g)].map((m) => m.slice(1).join(' '));
    const old = new Set(treesOf(plain));
    const added = treesOf(a).filter((t) => !old.has(t)).map((t) => t.split(' ').map(Number));
    const FWU = COLS * PAINTED_STYLE.unit, FHU = ROWS * PAINTED_STYLE.unit;
    for (const [x, y] of added) assert.ok(x <= -MU - 40 || x >= FWU + MU || y >= FHU + MU || y <= -MU - 60, `${id}: Zonenbaum ${x},${y} außerhalb des Canvas`);
    assert.ok(added.length >= 40, `${id}: dichter Wald in den Zonen (${added.length})`);
    assert.equal(treesOf(a).length, old.size + added.length, `${id}: Bäume im Canvas bleiben`);
    assert.ok(PAINTED_STYLE.sideZone.step[0] * k * 1.25 <= 60, 'Baumabstand höchstens 60 px');
    // Wege laufen bis über den Bildrand: ein Wegpunkt liegt weiter draußen als die Zone breit ist
    const path = a.match(/<g class="path">.*?stroke-width="86"/)[0];
    const xs = [...path.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => Number(m[1]));
    assert.ok(Math.min(...xs) < -MU - 130 / k || Math.max(...xs) > COLS * PAINTED_STYLE.unit + MU + 130 / k, `${id}: Weg reicht über die Zone hinaus`);
    // Verläufe im Nutzerraum auf dem Canvas-Rechteck: das Bild im Canvas bleibt gleich
    assert.match(a, /<radialGradient id="p-vig-field" gradientUnits="userSpaceOnUse"/);
    checkVignette(a);
  }
});

// Browser-Attrappe für die Rasterung: decode() löst auf oder scheitert (fail()), Canvas-Größen bleiben prüfbar
async function withRasterMock(fn) {
  const saved = { Image: globalThis.Image, document: globalThis.document, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const mock = { fail: false, decodes: 0, canvases: [] };
  const Img = class { decode() { mock.decodes++; return mock.fail ? Promise.reject(new Error('kaputt')) : Promise.resolve(); } };
  globalThis.Image = Img;
  // Nur Raster-Canvas (bekommen ein Image) zählen; andere Offscreen-Canvas (Rückfall-Zeichnen) bekommen den Mock-Kontext
  globalThis.document = { createElement: () => {
    const cv = { width: 0, height: 0 };
    const c = mockCtx().ctx;
    c.drawImage = (img) => { if (img instanceof Img && !mock.canvases.includes(cv)) mock.canvases.push(cv); };
    cv.getContext = () => c;
    return cv;
  } };
  URL.createObjectURL = () => 'blob:x';
  URL.revokeObjectURL = () => {};
  try {
    await fn(mock);
  } finally {
    if (saved.Image === undefined) delete globalThis.Image; else globalThis.Image = saved.Image;
    if (saved.document === undefined) delete globalThis.document; else globalThis.document = saved.document;
    URL.createObjectURL = saved.create;
    URL.revokeObjectURL = saved.revoke;
  }
}
const settle = () => new Promise((r) => setTimeout(r, 0));

test('Reviewer A1: Cache hält nach Kartenwechsel Wiese -> Eis -> Vulkan nur die aktuelle Karte, alte Raster freigegeben', async () => {
  const { renderView, paintedCacheIds, paintedStatus } = await import('../src/render.js?cache-release');
  await withRasterMock(async (mock) => {
    for (const id of ['meadow', 'ice', 'volcano']) {
      renderView(mockCtx().ctx, createGame({ mapId: id }), {});
      await settle();
      assert.equal(paintedStatus(id), 'ready', `${id} gerastert`);
      assert.deepEqual(paintedCacheIds(), [id], `${id}: nur die aktuelle Karte im Cache`);
    }
    assert.equal(mock.canvases.length, 3);
    for (const cv of mock.canvases.slice(0, 2)) assert.deepEqual([cv.width, cv.height], [0, 0], 'Raster der alten Karte freigegeben');
    assert.ok(mock.canvases[2].width > 0, 'aktuelles Raster bleibt');
  });
});

test('Reviewer A2: gescheitertes Neu-Rastern bei vorhandenem Bild wird nicht jedes Frame wiederholt', async () => {
  const { renderView, paintedStatus, setPaintedExtent } = await import('../src/render.js?cache-fail');
  await withRasterMock(async (mock) => {
    const s = createGame({ mapId: 'meadow' });
    setPaintedExtent(null);
    renderView(mockCtx().ctx, s, {});
    await settle();
    assert.equal(paintedStatus('meadow'), 'ready');
    // Andere Größe (Seitenzonen) und erzwungener Fehler; Entprellzeit abwarten
    mock.fail = true;
    setPaintedExtent({ l: 10, t: 0, r: 10, b: 0 });
    renderView(mockCtx().ctx, s, {});
    await new Promise((r) => setTimeout(r, PAINTED_STYLE.rasterDelay + 20));
    renderView(mockCtx().ctx, s, {});
    await settle();
    const after = mock.decodes;
    for (let i = 0; i < 5; i++) { renderView(mockCtx().ctx, s, {}); await settle(); }
    assert.equal(mock.decodes, after, 'kein neuer Versuch für denselben Schlüssel');
    assert.equal(paintedStatus('meadow'), 'ready', 'altes Bild bleibt');
    // Neue Größe: wieder ein Versuch
    mock.fail = false;
    setPaintedExtent({ l: 20, t: 0, r: 20, b: 0 });
    renderView(mockCtx().ctx, s, {});
    await new Promise((r) => setTimeout(r, PAINTED_STYLE.rasterDelay + 20));
    renderView(mockCtx().ctx, s, {});
    await settle();
    assert.equal(mock.decodes, after + 1, 'neue Größe wird wieder gerastert');
  });
});
