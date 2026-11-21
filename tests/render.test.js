// Unit-Tests für Rendering mit Mock-Kontext (Gelände, Türme, Effekte)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, buildTower, towerStats } from '../src/game.js';
import { decorFor } from '../src/decor.js';

import { recoilOffset } from '../src/tower-fx.js';

import { TOWER_TYPES, TILE, COLS, ROWS } from '../src/config.js';

import { liveParticles, SHAKE_MAX } from '../src/fx-system.js';
import { mockCtx, withoutRandom } from './helpers.js';

test('Render: laeuft in Node ohne document/OffscreenCanvas, Zustaende ohne Fehler', async () => {
  assert.equal(typeof document, 'undefined');
  const { render } = await import('../src/render.js');
  const s = createGame();
  const m = mockCtx();
  render(m.ctx, s, {});
  render(m.ctx, s, {});
  buildTower(s, 'arrow', 8, 5);
  s.enemies.push({ id: 1, type: 'grunt', x: 100, y: 100, radius: 10, hp: 5, maxHp: 10, slowUntil: 99 });
  s.projectiles.push({ x: 1, y: 1, towerType: 'cannon' });
  s.effects.push({ kind: 'explosion', x: 5, y: 5, r: 30, ttl: 1, max: 2 }, { kind: 'coin', x: 5, y: 5, ttl: 1, max: 2, text: '+5' });
  render(m.ctx, s, { hover: { col: 3, row: 3, ok: false }, buildType: 'arrow', selectedTowerId: s.towers[0].id });
  assert.equal(m.depth, 0, 'save/restore ausgewogen');
});

test('Render: Hintergrund-Cache wird genutzt und bei neuem Weg neu gebaut', async () => {
  const { render } = await import('../src/render.js');
  const offscreen = [];
  globalThis.document = {
    createElement() {
      const m = mockCtx();
      const c = { width: 0, height: 0, getContext: () => m.ctx, m };
      offscreen.push(c);
      return c;
    },
  };
  try {
    const s = createGame();
    const main = mockCtx();
    render(main.ctx, s, {});
    const off = offscreen[offscreen.length - 1];
    assert.equal(off.width, COLS * TILE);
    assert.equal(off.height, ROWS * TILE);
    assert.equal(main.counts.drawImage, 1);
    const drawn = off.m.counts.fillRect;
    assert.ok(drawn > 0);
    render(main.ctx, s, {});
    assert.equal(main.counts.drawImage, 2, 'Cache kopiert');
    assert.equal(off.m.counts.fillRect, drawn, 'nicht neu gezeichnet');
    render(main.ctx, createGame(), {});
    assert.ok(off.m.counts.fillRect > drawn, 'neuer Weg -> neu gebaut');
    assert.equal(off.m.depth, 0, 'save/restore im Hintergrund ausgewogen');
    assert.equal(off.m.props.globalAlpha, undefined);
    assert.equal(main.props.globalAlpha, undefined);
  } finally { delete globalThis.document; }
});

// ---------- Dekoration: tatsaechlich gezeichnete Formen (Tester, Runde 2) ----------
test('Render: gezeichnete Dekoration verlaesst ihre Kachel nicht und ragt nie auf Weg-Kacheln', async () => {
  const prims = [];
  const props = {};
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      return (...a) => {
        if (k === 'arc') prims.push({ k, x: a[0], y: a[1], rx: a[2], ry: a[2] });
        if (k === 'ellipse') prims.push({ k, x: a[0], y: a[1], rx: a[2], ry: a[3] });
        if (k === 'moveTo' || k === 'lineTo') prims.push({ k, x: a[0], y: a[1], rx: 0, ry: 0, stroke: props.strokeStyle });
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
  try {
    // frische Modulinstanz, damit kein Cache aus anderen Tests verwendet wird
    const { render } = await import('../src/render.js?geometrie');
    // Karte ohne Baumrahmen: hier gilt die alte Einzel-Deko (auf der Wiese ersetzt der Rahmen die Randbaeume)
    const s = createGame({ mapId: 'fork' });
    render({ drawImage() {} }, s, {});
    const eps = 1e-9;
    const kinds = {};
    let checked = 0;
    for (const p of prims) {
      const c = Math.floor(p.x / TILE), r = Math.floor(p.y / TILE);
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
      if (s.blocked.has(`${c},${r}`)) continue; // Kiesel des Wegs selbst
      if (p.k === 'moveTo' || p.k === 'lineTo') { if (p.stroke !== '#5da654') continue; } // nur Grasbuschel-Dekoration, keine Halme
      const d = decorFor(c, r, s.blocked);
      assert.ok(d, `Form ohne Dekoration auf ${c},${r}`);
      checked++;
      kinds[d.kind] = (kinds[d.kind] || 0) + 1;
      const x0 = p.x - p.rx, x1 = p.x + p.rx, y0 = p.y - p.ry, y1 = p.y + p.ry;
      assert.ok(x0 >= c * TILE - eps && x1 <= (c + 1) * TILE + eps && y0 >= r * TILE - eps && y1 <= (r + 1) * TILE + eps,
        `${d.kind} auf ${c},${r} verlaesst die Kachel: x ${x0}..${x1}, y ${y0}..${y1}`);
    }
    assert.ok(checked > 100);
    for (const k of ['tree', 'bush', 'rock', 'flower', 'tuft', 'pebble']) assert.ok(kinds[k] > 0, `Art ${k} nie gezeichnet`);
  } finally { delete globalThis.document; }
});

test('Render (Wiese mit Baumrahmen): uebrige Einzel-Deko verlaesst ihre Kachel nicht und liegt nie auf dem Weg', async () => {
  const prims = [];
  const props = {};
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      return (...a) => {
        if (k === 'arc') prims.push({ k, x: a[0], y: a[1], rx: a[2], ry: a[2] });
        if (k === 'ellipse') prims.push({ k, x: a[0], y: a[1], rx: a[2], ry: a[3] });
        if (k === 'moveTo' || k === 'lineTo') prims.push({ k, x: a[0], y: a[1], rx: 0, ry: 0, stroke: props.strokeStyle });
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
  try {
    // frische Modulinstanz, damit kein Cache aus anderen Tests verwendet wird
    const { render } = await import('../src/render.js?geometrie-wiese');
    // Wiese: Kronen nutzen roundRect (keine arc/ellipse), also pruefen arc/ellipse nur die Einzel-Deko
    const s = createGame({ mapId: 'meadow' });
    render({ drawImage() {} }, s, {});
    const eps = 1e-9;
    const kinds = {};
    let checked = 0;
    for (const p of prims) {
      const c = Math.floor(p.x / TILE), r = Math.floor(p.y / TILE);
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
      if (s.blocked.has(`${c},${r}`)) continue; // Kiesel des Wegs selbst
      if (p.k === 'moveTo' || p.k === 'lineTo') { if (p.stroke !== '#5da654') continue; } // nur Grasbuschel-Dekoration, keine Halme
      const d = decorFor(c, r, s.blocked);
      assert.ok(d, `Form ohne Dekoration auf ${c},${r}`);
      checked++;
      kinds[d.kind] = (kinds[d.kind] || 0) + 1;
      const x0 = p.x - p.rx, x1 = p.x + p.rx, y0 = p.y - p.ry, y1 = p.y + p.ry;
      assert.ok(x0 >= c * TILE - eps && x1 <= (c + 1) * TILE + eps && y0 >= r * TILE - eps && y1 <= (r + 1) * TILE + eps,
        `${d.kind} auf ${c},${r} verlaesst die Kachel: x ${x0}..${x1}, y ${y0}..${y1}`);
    }
    assert.ok(checked > 100);
    for (const k of ['bush', 'rock', 'flower', 'tuft', 'pebble']) assert.ok(kinds[k] > 0, `Art ${k} nie gezeichnet`);
  } finally { delete globalThis.document; }
});

test('Render: Baumrahmen mit unbekannter/fehlender mapId wirft nicht, treeFrame liefert fuer alle Karten Daten', async () => {
  const { treeFrame } = await import('../src/decor.js');
  const { MAPS } = await import('../src/config.js');
  const { render } = await import('../src/render.js?unbekannt');
  globalThis.document = { createElement() { const m = mockCtx(); return { width: 0, height: 0, getContext: () => m.ctx }; } };
  try {
    for (const id of Object.keys(MAPS)) assert.ok(Array.isArray(treeFrame(id)));
    const s = createGame();
    for (const id of [undefined, 'gibtsnicht']) { s.mapId = id; render(mockCtx().ctx, s, {}); }
    assert.ok(treeFrame(undefined).length > 0, 'Default ist die Wiese');
  } finally { delete globalThis.document; }
});

test('Render: Kartenwechsel baut den Hintergrund-Cache neu (Kronen nur auf der Wiese)', async () => {
  const { render } = await import('../src/render.js?kartenwechsel');
  const offscreen = [];
  globalThis.document = { createElement() { const m = mockCtx(); const c = { width: 0, height: 0, getContext: () => m.ctx, m }; offscreen.push(c); return c; } };
  try {
    const main = mockCtx();
    render(main.ctx, createGame({ mapId: 'fork' }), {});
    const forkCalls = offscreen[offscreen.length - 1].m.counts.roundRect || 0;
    render(main.ctx, createGame({ mapId: 'meadow' }), {});
    const meadowCalls = offscreen[offscreen.length - 1].m.counts.roundRect || 0;
    assert.ok(meadowCalls > forkCalls + 1000, `Wiese ${meadowCalls} vs Fork ${forkCalls}`);
  } finally { delete globalThis.document; }
});

// ---------- Tuerme: Zeichnung (B-010) ----------
test('recoilOffset: 0 ohne Schuss, Maximum direkt nach dem Schuss, monoton abklingend, nie negativ', () => {
  assert.equal(recoilOffset(0), 0);
  assert.equal(recoilOffset(-0.5), 0);
  assert.equal(recoilOffset(NaN), 0);
  assert.equal(recoilOffset(1), 1);
  assert.equal(recoilOffset(5), 1, 'ueber 1 wird begrenzt');
  let prev = Infinity;
  for (let f = 1; f >= -0.2; f -= 0.05) {
    const r = recoilOffset(f);
    assert.ok(r >= 0 && r <= 1);
    assert.ok(r <= prev + 1e-12, 'monoton fallend');
    prev = r;
  }
});

// Zeichnet einen Turm auf einen aufzeichnenden Mock-Kontext und liefert Fingerabdruck und Grenzen.
async function recordTower(type, level, cooldown = 0, angle = 0, selected = false) {
  const { drawTower } = await import('../src/render.js');
  const s = createGame();
  s.gold = 10000;
  const r = buildTower(s, type, 8, 5);
  assert.ok(r.ok);
  const t = r.tower;
  t.level = level;
  t.cooldown = cooldown;
  t.angle = angle;
  const props = {};
  const calls = [];
  let depth = 0;
  const stack = [];
  let ox = 0, oy = 0, rotated = false, slack = 0, sc = 1;
  const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  const pt = (x0, y0, rad0 = 0, radY0 = rad0) => {
    const x = x0 * sc, y = y0 * sc, rad = rad0 * sc, radY = radY0 * sc;
    if (rotated) {
      // beweglicher Teil: Radius um den Drehpunkt (Drehwinkel egal)
      const d = Math.hypot(x, y) + rad + slack;
      bounds.minX = Math.min(bounds.minX, ox - d); bounds.maxX = Math.max(bounds.maxX, ox + d);
      bounds.minY = Math.min(bounds.minY, oy - d); bounds.maxY = Math.max(bounds.maxY, oy + d);
    } else {
      bounds.minX = Math.min(bounds.minX, ox + x - rad); bounds.maxX = Math.max(bounds.maxX, ox + x + rad);
      bounds.minY = Math.min(bounds.minY, oy + y - radY); bounds.maxY = Math.max(bounds.maxY, oy + y + radY);
    }
  };
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      return (...a) => {
        calls.push(k + ':' + a.map((v) => (typeof v === 'number' ? v.toFixed(2) : v)).join(',') + '|' + props.fillStyle + '|' + props.strokeStyle);
        if (k === 'save') { depth++; stack.push([ox, oy, rotated, slack, sc]); }
        else if (k === 'restore') { depth--; assert.ok(depth >= 0); [ox, oy, rotated, slack, sc] = stack.pop(); }
        else if (k === 'translate') { if (rotated) { /* Rueckstoss zieht nur zurueck: Reichweite nach vorn wird kleiner */ } else { ox += a[0] * sc; oy += a[1] * sc; } }
        else if (k === 'scale') sc *= a[0];
        else if (k === 'rotate') rotated = true;
        else if (k === 'fillRect' || k === 'strokeRect') { pt(a[0], a[1]); pt(a[0] + a[2], a[1] + a[3]); }
        else if (k === 'arc') pt(a[0], a[1], a[2]);
        else if (k === 'ellipse') pt(a[0], a[1], a[2], a[3]);
        else if (k === 'moveTo' || k === 'lineTo') pt(a[0], a[1]);
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  drawTower(ctx, t, selected);
  return { t, calls, depth, props, bounds, print: calls.join('\n') };
}

// Pfeilturm: hoher Turm, darf bis ca. 58 px ueber dem Boden (= ca. 26 px ueber der Kachel) ragen
const ARROW_TOP = 28;

test('Turm-Zeichnung: alle Typen/Stufen ohne Fehler, ausgewogen, innerhalb der Kachel', async () => {
  const TOL_UP = 4; // bewegliche Teile duerfen beim Zielen max. 4 px ueber den oberen Kachelrand ragen
  for (const type of Object.keys(TOWER_TYPES)) {
    const tolUp = type === 'arrow' ? ARROW_TOP : TOL_UP; // Pfeilturm (B-063) ragt als hoher Turm ueber die Kachel
    for (let level = 1; level <= 3; level++) {
      for (const cooldown of [0, 0.5, TOWER_TYPES[type].rate]) {
        const rec = await recordTower(type, level, cooldown, 0.7);
        assert.equal(rec.depth, 0, `${type} L${level}: save/restore ausgewogen`);
        assert.equal(rec.props.globalAlpha, undefined);
        const x0 = rec.t.col * TILE, y0 = rec.t.row * TILE;
        const b = rec.bounds;
        assert.ok(b.minX >= x0 && b.maxX <= x0 + TILE, `${type} L${level}: x ${b.minX}..${b.maxX}`);
        assert.ok(b.minY >= y0 - tolUp && b.maxY <= y0 + TILE, `${type} L${level}: y ${b.minY}..${b.maxY}`);
      }
    }
  }
});

test('Turm-Zeichnung: Typen und Stufen unterscheiden sich, Auswahlrahmen bleibt', async () => {
  const seen = new Map();
  for (const type of Object.keys(TOWER_TYPES)) {
    for (let level = 1; level <= 3; level++) {
      const { print } = await recordTower(type, level);
      assert.ok(!seen.has(print), `${type} L${level} gleicht ${seen.get(print)}`);
      seen.set(print, `${type} L${level}`);
    }
  }
  assert.equal(seen.size, Object.keys(TOWER_TYPES).length * 3);
  const plain = await recordTower('arrow', 1, 0, 0, false);
  const sel = await recordTower('arrow', 1, 0, 0, true);
  assert.ok(!plain.calls.some((c) => c.startsWith('strokeRect')));
  assert.ok(sel.calls.some((c) => c.startsWith('strokeRect:' + (sel.t.x - 18).toFixed(2))));
});

test('Turm-Zeichnung: Rueckstoss zieht den beweglichen Teil direkt nach dem Schuss zurueck', async () => {
  for (const type of Object.keys(TOWER_TYPES)) {
    const rate = TOWER_TYPES[type].rate;
    const ready = await recordTower(type, 1, 0).then((r) => r.print);
    const shot = await recordTower(type, 1, rate).then((r) => r.print);
    const later = await recordTower(type, 1, rate * 0.3).then((r) => r.print);
    assert.notEqual(ready, shot, `${type}: Rueckstoss sichtbar`);
    assert.notEqual(shot, later, `${type}: klingt ab`);
    assert.equal(await recordTower(type, 1, -0.2).then((r) => r.print), ready, `${type}: negativer Cooldown = bereit`);
  }
});

// ---------- Tuerme: unabhaengige Pruefung (Tester, B-010) ----------
test('recoilOffset: Randfaelle (Infinity, -0, undefined, null, winzige Werte)', () => {
  assert.equal(recoilOffset(Infinity), 1);
  assert.equal(recoilOffset(-Infinity), 0);
  assert.ok(Object.is(recoilOffset(-0), 0), 'kein -0');
  assert.equal(recoilOffset(undefined), 0);
  assert.equal(recoilOffset(null), 0);
  assert.equal(recoilOffset(0.5), 0.25);
  assert.ok(recoilOffset(1e-9) >= 0 && recoilOffset(1e-9) < 1e-6);
});

test('Turm: cooldown/def.rate ist auf allen Stufen <= 1 (Rueckstoss nie ueber Maximum)', () => {
  for (const type of Object.keys(TOWER_TYPES)) {
    for (let level = 1; level <= 3; level++) {
      const stats = towerStats({ type, level });
      assert.ok(stats.rate / TOWER_TYPES[type].rate <= 1 + 1e-12, `${type} L${level}`);
    }
  }
});

// Zeichnet drawTower mit echter Transformationsmatrix (translate/rotate/save/restore) und
// liefert die Weltkoordinaten-Ausdehnung aller Primitive.
async function worldExtent(type, level, cooldown, angle) {
  const { drawTower } = await import('../src/render.js');
  const s = createGame();
  s.gold = 1e5;
  const t = buildTower(s, type, 8, 5).tower;
  t.level = level; t.cooldown = cooldown; t.angle = angle;
  let M = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const B = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const P = (x, y) => {
    const X = M[0] * x + M[2] * y + M[4], Y = M[1] * x + M[3] * y + M[5];
    B.minX = Math.min(B.minX, X); B.maxX = Math.max(B.maxX, X);
    B.minY = Math.min(B.minY, Y); B.maxY = Math.max(B.maxY, Y);
  };
  const props = {};
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      return (...a) => {
        if (k === 'save') stack.push(M);
        else if (k === 'restore') M = stack.pop();
        else if (k === 'translate') M = mul(M, [1, 0, 0, 1, a[0], a[1]]);
        else if (k === 'scale') M = mul(M, [a[0], 0, 0, a[1], 0, 0]);
        else if (k === 'rotate') { const c = Math.cos(a[0]), sn = Math.sin(a[0]); M = mul(M, [c, sn, -sn, c, 0, 0]); }
        else if (k === 'fillRect' || k === 'strokeRect') { P(a[0], a[1]); P(a[0] + a[2], a[1]); P(a[0], a[1] + a[3]); P(a[0] + a[2], a[1] + a[3]); }
        else if (k === 'arc') { const full = Math.abs(a[4] - a[3]) >= 2 * Math.PI - 1e-9; for (let i = 0; i <= 64; i++) { const q = a[3] + (a[4] - a[3]) * i / 64; P(a[0] + a[2] * Math.cos(q), a[1] + a[2] * Math.sin(q)); } void full; }
        else if (k === 'ellipse') { for (let i = 0; i < 64; i++) { const q = i / 64 * 2 * Math.PI; P(a[0] + a[2] * Math.cos(q), a[1] + a[3] * Math.sin(q)); } }
        else if (k === 'moveTo' || k === 'lineTo') P(a[0], a[1]);
        else if (k === 'quadraticCurveTo') { P(a[0], a[1]); P(a[2], a[3]); }
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  drawTower(ctx, t, false);
  assert.equal(stack.length, 0, 'save/restore ausgewogen');
  return { B, x0: t.col * TILE, y0: t.row * TILE };
}

test('Turm: echte Weltkoordinaten bleiben links/rechts/unten in der Kachel, oben max. 3,5 px Ueberstand (nur Pfeil/Scharfschuetze)', async () => {
  const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2, 3 * Math.PI / 2, 5.5];
  for (const type of Object.keys(TOWER_TYPES)) {
    const maxTop = type === 'sniper' ? 3.5 : type === 'arrow' ? ARROW_TOP : 0;
    for (let level = 1; level <= 3; level++) {
      for (const angle of angles) {
        for (const frac of [0, 0.5, 1]) {
          const { B, x0, y0 } = await worldExtent(type, level, frac * TOWER_TYPES[type].rate, angle);
          const tag = `${type} L${level} a=${angle.toFixed(2)} f=${frac}`;
          assert.ok(B.minX >= x0 - 1e-6 && B.maxX <= x0 + TILE + 1e-6, `${tag}: x ${B.minX - x0}..${B.maxX - x0}`);
          assert.ok(B.maxY <= y0 + TILE + 1e-6, `${tag}: unten ${B.maxY - y0}`);
          assert.ok(B.minY >= y0 - maxTop - 1e-6, `${tag}: oben ${B.minY - y0}`);
        }
      }
    }
  }
});

test('Turm: ungueltiger cooldown/angle/Stufe crasht nicht und bleibt in den Grenzen', async () => {
  for (const type of Object.keys(TOWER_TYPES)) {
    for (const cd of [undefined, NaN, -5, 1e9, Infinity, null]) {
      const { B, x0 } = await worldExtent(type, 2, cd, 0.3);
      assert.ok(Number.isFinite(B.minX) && B.minX >= x0 && B.maxX <= x0 + TILE, `${type} cd=${cd}`);
    }
  }
  await worldExtent('cannon', 1, 0, NaN);
});

test('Render: Tuerme aller Typen zeichnen, Cache ungestoert, Alpha und save/restore unveraendert', async () => {
  const { render } = await import('../src/render.js');
  const s = createGame();
  s.gold = 1e5;
  const types = Object.keys(TOWER_TYPES);
  let placed = 0;
  for (let c = 0; c < COLS && placed < types.length; c++) for (let rw = 0; rw < ROWS && placed < types.length; rw += 3) {
    const r = buildTower(s, types[placed], c, rw);
    if (r.ok) { r.tower.level = 1 + (placed % 3); r.tower.cooldown = 0.2; placed++; }
  }
  assert.equal(s.towers.length, types.length);
  const m = mockCtx();
  render(m.ctx, s, {});
  const base = m.counts.drawImage;
  render(m.ctx, s, { selectedTowerId: s.towers[0].id });
  assert.equal(m.counts.drawImage - base, 1, 'Hintergrund pro Frame genau einmal');
  assert.equal(m.depth, 0);
});

// ---------- Render mit Effekten ----------
function fxRenderState() {
  const s = createGame();
  s.time = 5;
  for (const t of ['arrow', 'cannon', 'frost', 'sniper', 'lightning', 'zzz', '__proto__', undefined]) {
    s.projectiles.push({ x: 100, y: 100, tx: 300, ty: 100, towerType: t });
  }
  s.projectiles.push({ x: 1, y: 1, towerType: 'cannon' }, { x: NaN, y: 5, tx: Infinity, towerType: 'arrow' });
  s.effects.push(
    { kind: 'explosion', x: 200, y: 200, r: 44, ttl: 0.2, max: 0.3 },
    { kind: 'coin', x: 220, y: 200, text: '+5', ttl: 0.5, max: 0.8 },
    { kind: 'bolt', points: [{ x: 10, y: 10 }, { x: 60, y: 40 }, { x: 90, y: 80 }], ttl: 0.1, max: 0.25 },
    { kind: 'bolt', points: [], ttl: 0.1, max: 0.25 },
    { kind: 'bolt', ttl: 0.1, max: 0.25 },
    { kind: 'unbekannt', x: 1, y: 1, ttl: 1, max: 1 },
  );
  return s;
}

test('Effekt-Render: alle Projektil-/Effektarten ohne Fehler, ausgewogen, globalAlpha unveraendert', async () => {
  const { render } = await import('../src/render.js');
  const s = fxRenderState();
  const m = mockCtx();
  m.props.globalAlpha = 1;
  for (let i = 0; i < 40; i++) {
    s.time += 1 / 30;
    render(m.ctx, s, {});
    for (const p of s.projectiles) p.x += 4;
    if (i === 20) s.projectiles = [];
  }
  assert.equal(m.depth, 0);
  assert.equal(m.props.globalAlpha, 1);
});

test('Effekt-Render: deterministisch, aendert sich ueber die Zeit, Pause friert ein', async () => {
  const { render } = await import('../src/render.js');
  const { getFx } = await import('../src/render-fx.js');
  const record = (steps, dtStep) => {
    const s = fxRenderState();
    const log = [];
    const props = {};
    const ctx = new Proxy({}, {
      get(_, k) { if (k in props) return props[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} }); return (...a) => { log.push(k + a.map((v) => (typeof v === 'number' ? v.toFixed(3) : '')).join(',')); }; },
      set(_, k, v) { props[k] = v; return true; },
    });
    for (let i = 0; i < steps; i++) { s.time += dtStep; render(ctx, s, {}); }
    return log.join('|');
  };
  const a = await withoutRandom(() => record(10, 1 / 30));
  const b = await withoutRandom(() => record(10, 1 / 30));
  assert.equal(a, b, 'deterministisch (auch nach Neustart des Zustands)');
  assert.notEqual(record(5, 1 / 30), record(10, 1 / 30), 'Bild aendert sich ueber die Zeit');
  // Pause: Partikel altern nicht
  const s = fxRenderState();
  const m = mockCtx();
  render(m.ctx, s, {});
  const fx = getFx();
  const ages = Array.from(fx.page).join();
  render(m.ctx, s, {});
  render(m.ctx, s, {});
  assert.equal(Array.from(fx.page).join(), ages);
});

test('Effekt-Render: Neustart leert den Pool, kein Zustand-Leak zwischen Spielen', async () => {
  const { render } = await import('../src/render.js');
  const { getFx } = await import('../src/render-fx.js');
  const m = mockCtx();
  const s1 = fxRenderState();
  render(m.ctx, s1, {});
  assert.ok(liveParticles(getFx()) > 0);
  assert.ok(getFx().shakeStrength > 0);
  const s2 = createGame(); // neue path.points-Referenz
  s2.time = 9;
  render(m.ctx, s2, {});
  assert.equal(liveParticles(getFx()), 0);
  assert.equal(getFx().shakeStrength, 0);
  // gleiche Referenz, aber Zeit springt zurueck
  const s3 = fxRenderState();
  render(m.ctx, s3, {});
  s3.projectiles = []; s3.effects = [];
  s3.time = 1;
  render(m.ctx, s3, {});
  assert.equal(liveParticles(getFx()), 0);
  assert.equal(m.depth, 0);
});

test('Effekt-Render: Shake verschiebt nur die Zeichnung (translate <= 3 px), Hover/Eingabe unveraendert', async () => {
  // Frisches Modul: unabhaengig davon, ob ein frueherer Test den Hintergrund-Cache gefuellt hat.
  const { render } = await import('../src/render.js?b012-shake');
  const s = createGame();
  s.time = 3;
  const ui = { hover: { col: 3, row: 3, ok: true }, buildType: 'arrow', selectedTowerId: null };
  const uiCopy = JSON.stringify(ui);
  const calls = [];
  const props = {};
  const ctx = new Proxy({}, {
    get(_, k) { if (k in props) return props[k]; if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} }); return (...a) => { if (k === 'translate') calls.push(a); }; },
    set(_, k, v) { props[k] = v; return true; },
  });
  render(ctx, s, ui); // fuellt ggf. den Cache
  calls.length = 0;
  render(ctx, s, ui);
  const base = calls.length; // translate des Hintergrunds je Frame (0 mit Cache, 2 ohne), ohne Explosion kein Shake
  s.effects.push({ kind: 'explosion', x: 200, y: 200, r: 44, ttl: 0.3, max: 0.3 });
  s.time = 3.016;
  render(ctx, s, ui); // Explosion wird erkannt, Shake startet (Versatz im ersten Moment noch 0)
  s.time = 3.05;
  calls.length = 0;
  render(ctx, s, ui);
  assert.equal(calls.length, 2 * base + 1, 'genau ein Shake-translate zwischen zwei Hintergrund-Zeichnungen');
  const [x, y] = calls[base];
  assert.ok(Math.abs(x) <= SHAKE_MAX && Math.abs(y) <= SHAKE_MAX, 'Shake <= SHAKE_MAX');
  assert.ok(x !== 0 && y !== 0, 'Shake aktiv');
  assert.equal(JSON.stringify(ui), uiCopy, 'ui unveraendert');
  s.time = 10; // Shake abgeklungen
  calls.length = 0;
  render(ctx, s, ui);
  assert.equal(calls.length, base, 'Shake endet');
});


test('Render: Karte Wald mit Hindernissen zeichnet ohne Fehler, auch nach Kartenwechsel', async () => {
  const { render } = await import('../src/render.js');
  const m = mockCtx();
  render(m.ctx, createGame({ mapId: 'forest' }), {});
  render(m.ctx, createGame(), {});
  render(m.ctx, createGame({ mapId: 'forest' }), {});
  assert.equal(m.depth, 0);
});

test('Render: Kartenwechsel ice -> meadow ohne Theme-Reste', async () => {
  const { render } = await import('../src/render.js?eis') // frische Instanz, kein Cache aus anderen Tests;
  const styles = () => {
    const seen = new Set();
    const ctx = new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}), set(_, k, v) { if (k === 'fillStyle' || k === 'strokeStyle') seen.add(v); return true; } });
    return { ctx, seen };
  };
  const a = styles();
  render(a.ctx, createGame({ mapId: 'ice' }), {});
  assert.ok(a.seen.has('#cfe6f2'), 'Eis-Theme sichtbar');
  const b = styles();
  render(b.ctx, createGame(), {});
  assert.ok(!b.seen.has('#cfe6f2') && !b.seen.has('#9cc3d8') && !b.seen.has('#d9edf6'));
});

test('Render: Karte Zangenangriff zeichnet beide Wege ohne Fehler', async () => {
  const { render } = await import('../src/render.js');
  const m = mockCtx();
  const s = createGame({ mapId: 'fork' });
  const { spawnEnemy } = await import('../src/game.js');
  spawnEnemy(s, 'grunt');
  spawnEnemy(s, 'grunt');
  render(m.ctx, s, {});
  assert.equal(m.depth, 0);
});

test('Stil-Helfer: lit/shd mischen Farben, Kontur dunkel', async () => {
  const { lit, shd, outlineOf, brightness } = await import('../src/draw-utils.js');
  const { STYLE } = await import('../src/config.js');
  assert.equal(lit('#336699', 0), '#336699');
  assert.equal(lit('#336699', 1), STYLE.lightTone);
  assert.equal(shd('#336699', 0), '#336699');
  assert.equal(shd('#336699', 1), STYLE.shadowTone);
  assert.equal(shd('#000000', 0.5), '#160e1f');
  assert.ok(brightness(lit('#336699', 0.5)) > brightness('#336699'));
  for (const c of ['#ffffff', '#f4c542', '#e3f1fa', '#7bcb4f', '#2a6b3a', '#000000']) {
    const o = outlineOf(c);
    assert.ok(brightness(o) <= STYLE.outlineMaxLight + 0.01, c);
    assert.ok(brightness(o) <= brightness(c) + 1e-9, c);
  }
  assert.ok(brightness(outlineOf('#7bcb4f')) < brightness('#7bcb4f') * 0.6);
});

test('Stil-Helfer: part/poly/rr/ell/shadow ausgewogen, Fuellung+Kontur, ohne Verlaeufe', async () => {
  const { poly, rr, ell, shadow } = await import('../src/draw-utils.js');
  const draws = [
    (c) => poly(c, [[0, 0], [10, 0], [5, 8]], '#7bcb4f'),
    (c) => rr(c, 0, 0, 20, 10, 3, '#4f7fc8'),
    (c) => ell(c, 5, 5, 8, 4, '#d4503f'),
  ];
  for (const d of draws) {
    const m = mockCtx();
    d(m.ctx);
    assert.equal(m.depth, 0);
    assert.ok(m.counts.fill >= 3 && m.counts.stroke === 1 && m.counts.clip === 1);
    assert.equal(m.props.lineJoin, 'round');
    assert.equal(m.counts.createLinearGradient, undefined);
    assert.equal(m.counts.createRadialGradient, undefined);
  }
  const m = mockCtx();
  shadow(m.ctx, 10, 10, 12);
  assert.equal(m.depth, 0);
  assert.equal(m.counts.fill, 1);
  assert.equal(m.counts.createRadialGradient, undefined);
});

test('Stil-Helfer: rr mit winzigem w/h und grossem Radius bleibt endlich und ausgewogen', async () => {
  const { rr } = await import('../src/draw-utils.js');
  for (const [w, h, r] of [[2, 2, 50], [0, 0, 5], [30, 1, 99]]) {
    const m = mockCtx();
    rr(m.ctx, 0, 0, w, h, r, '#ffffff');
    assert.equal(m.depth, 0);
    assert.equal(m.counts.stroke, 1);
  }
});

test('Render: Pfeilturm Stufe 1-3 im neuen Stil, Stufen unterscheiden sich, andere Typen unveraendert', async () => {
  const { drawTower } = await import('../src/render.js');
  const draw = (type, level) => {
    const counts = {};
    const m = mockCtx(counts);
    const fills = new Set();
    const ctx = new Proxy(m.ctx, {
      get: (t, k) => t[k],
      set: (t, k, v) => { if (k === 'fillStyle') fills.add(v); t[k] = v; return true; },
    });
    drawTower(ctx, { type, x: 100, y: 100, level, cooldown: 0.3, angle: 0.7 }, true);
    assert.equal(m.depth, 0, 'save/restore ausgewogen');
    return { total: Object.values(counts).reduce((a, b) => a + b, 0), fills };
  };
  const l1 = draw('arrow', 1);
  const l2 = draw('arrow', 2);
  const l3 = draw('arrow', 3);
  assert.ok(l2.total > l1.total && l3.total > l2.total, 'mehr Zeichenoperationen je Stufe');
  assert.ok(l3.fills.has('#f4c542') && !l1.fills.has('#f4c542'), 'Gold nur auf Stufe 3');
  for (const type of ['cannon', 'frost', 'sniper', 'lightning']) {
    assert.ok(draw(type, 1).total > 0 && draw(type, 3).total > draw(type, 1).total);
  }
});

// ---------- Weg im Flat-Pop-Stil (B-071) ----------
test('Weg: Breite 40 px in Kachelmitte, Rand ragt hoechstens 4 px darueber hinaus', async () => {
  const { PATH_STYLE, MAPS } = await import('../src/config.js');
  const { pathReach } = await import('../src/render-path.js');
  assert.ok(pathReach() - TILE / 2 <= PATH_STYLE.overhangMax, `Rand ragt ${pathReach() - TILE / 2} px hinaus`);
  assert.ok(PATH_STYLE.sandWidth < TILE);
  assert.equal(MAPS.meadow.theme.path.main, '#e2c88f');
});

test('Weg: Gegner-Konturen heben sich mindestens 25 % von der Wegmitte ab', async () => {
  const { PATH_STYLE, MAPS, ENEMY_TYPES } = await import('../src/config.js');
  const { brightness, outlineOf } = await import('../src/draw-utils.js');
  for (const theme of [MAPS.meadow.theme.path, PATH_STYLE.colors]) {
    for (const [k, def] of Object.entries(ENEMY_TYPES)) {
      const d = Math.abs(brightness(theme.mid) - brightness(outlineOf(def.color)));
      assert.ok(d >= 0.25, `${k}: Abstand ${d.toFixed(2)}`);
    }
  }
});

test('Weg: im Frame-Pfad wird nichts vom Weg gezeichnet, Aufbau bleibt schnell', async () => {
  const { render } = await import('../src/render.js?weg');
  const offscreen = [];
  globalThis.document = { createElement() { const m = mockCtx(); const c = { width: 0, height: 0, getContext: () => m.ctx, m }; offscreen.push(c); return c; } };
  try {
    const s = createGame();
    const main = mockCtx();
    const t0 = performance.now();
    render(main.ctx, s, {});
    const ms = performance.now() - t0;
    const off = offscreen[offscreen.length - 1];
    assert.ok(off.m.counts.roundRect > 0, 'Randkreise im Cache');
    const before = { ...main.counts };
    render(main.ctx, s, {});
    for (const k of ['roundRect', 'arc', 'stroke', 'ellipse']) assert.ok((main.counts[k] || 0) - (before[k] || 0) <= 0, `Frame-Pfad zeichnet ${k}`);
    assert.ok(ms < 60, `Aufbau ${ms.toFixed(1)} ms`);
  } finally { delete globalThis.document; }
});

// ---------- Weg: Randfaelle (Tester B-071) ----------
test('Weg: alle Karten rendern ausgewogen, Cache wird einmal gebaut und bei Kartenwechsel neu', async () => {
  const { render } = await import('../src/render.js?wegmaps');
  const { MAPS } = await import('../src/config.js');
  const offscreen = [];
  globalThis.document = { createElement() { const m = mockCtx(); const c = { width: 0, height: 0, getContext: () => m.ctx, m }; offscreen.push(c); return c; } };
  try {
    for (const mapId of Object.keys(MAPS)) {
      const s = createGame({ mapId });
      const main = mockCtx();
      render(main.ctx, s, {});
      const off = offscreen[0];
      const strokes = off.m.counts.stroke || 0;
      assert.ok(strokes > 0, `${mapId}: Weg im Cache`);
      render(main.ctx, s, {});
      assert.equal(off.m.counts.stroke || 0, strokes, `${mapId}: zweiter Aufruf zeichnet Weg nicht neu`);
      assert.equal(off.m.depth, 0, `${mapId}: save/restore ausgewogen`);
      assert.equal(main.depth, 0);
    }
  } finally { delete globalThis.document; }
});

test('Weg: drawPathStyled ist deterministisch, endlich und deckt Randecken und mehrere Wege ab', async () => {
  const { drawPathStyled } = await import('../src/render-path.js');
  const { MAPS, WIDTH, HEIGHT } = await import('../src/config.js');
  const run = (paths, theme) => {
    const calls = [];
    const m = mockCtx();
    const ctx = new Proxy(m.ctx, { get(t, k) { const v = t[k]; return typeof v === 'function' ? (...a) => { calls.push([k, ...a]); return v.apply(t, a); } : v; } });
    drawPathStyled(ctx, paths, theme);
    assert.equal(m.depth, 0);
    return calls;
  };
  const corner = [{ points: [{ x: 0, y: 0 }, { x: WIDTH, y: 0 }, { x: WIDTH, y: HEIGHT }, { x: 0, y: HEIGHT }] }];
  const degenerate = [{ points: [{ x: 5, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 5 }] }];
  for (const paths of [corner, degenerate]) {
    const a = run(paths), b = run(paths);
    assert.deepEqual(a, b, 'gleiche Aufrufe');
    for (const c of a) for (const v of c.slice(1)) if (typeof v === 'number') assert.ok(Number.isFinite(v), `${c[0]} nicht endlich`);
  }
  for (const id of Object.keys(MAPS)) {
    const s = createGame({ mapId: id });
    const paths = s.paths || [s.path];
    assert.deepEqual(run(paths, MAPS[id].theme), run(paths, MAPS[id].theme), `${id} deterministisch`);
  }
});

// ---------- Baumrahmen (B-077) ----------
test('Baumrahmen: nur im Hintergrund-Cache, Frame-Pfad zeichnet keine Kronen, Aufbau schnell', async () => {
  const { render } = await import('../src/render.js?baumrahmen');
  const offscreen = [];
  globalThis.document = { createElement() { const m = mockCtx(); const c = { width: 0, height: 0, getContext: () => m.ctx, m }; offscreen.push(c); return c; } };
  try {
    const s = createGame();
    const main = mockCtx();
    const t0 = performance.now();
    render(main.ctx, s, {});
    const ms = performance.now() - t0;
    const off = offscreen[offscreen.length - 1];
    const n = off.m.counts.roundRect;
    assert.ok(n > 100 * 20, `Kronen im Cache (${n} Kreise)`);
    render(main.ctx, s, {});
    assert.equal(off.m.counts.roundRect, n, 'zweiter Frame zeichnet keine Kronen neu');
    for (const k of ['roundRect', 'arc', 'fill']) assert.equal(main.counts[k] || 0, 0, `Frame-Pfad zeichnet ${k}`);
    assert.ok(ms < 60, `Aufbau ${ms.toFixed(1)} ms`);
  } finally { delete globalThis.document; }
});

// ---------- Boden der Wiese (B-078) ----------
test('groundPatches: deterministisch, Plateaus nie auf dem Weg, nur Wiese hat Flecken', async () => {
  const { groundPatches } = await import('../src/decor.js');
  const { buildPath } = await import('../src/path.js');
  const { MAPS, GROUND_STYLE } = await import('../src/config.js');
  const a = groundPatches('meadow');
  assert.deepEqual(a, groundPatches('meadow'), 'deterministisch');
  assert.ok(a.patches.length > 0 && a.plateaus.length > 0 && a.tufts.length > 0);
  assert.ok(a.plateaus.length <= GROUND_STYLE.plateaus);
  const pts = buildPath(MAPS.meadow.waypoints, TILE).points;
  const dist = (x, y) => {
    let m = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dy = q.y - p.y;
      const t = Math.max(0, Math.min(1, ((x - p.x) * dx + (y - p.y) * dy) / (dx * dx + dy * dy || 1)));
      m = Math.min(m, Math.hypot(x - p.x - t * dx, y - p.y - t * dy));
    }
    return m;
  };
  for (const p of a.plateaus) assert.ok(dist(p.x, p.y) >= GROUND_STYLE.plateauCenterMargin, 'Plateau-Mitte nicht auf dem Weg');
  for (const t of a.tufts) assert.ok(dist(t.x, t.y) >= GROUND_STYLE.tuftPathMargin, 'Büschel nicht auf dem Weg');
  for (const id of Object.keys(MAPS)) {
    const g = groundPatches(id);
    const on = !!MAPS[id].theme?.ground;
    assert.equal(g.patches.length > 0, on, `${id}: Flecken nur mit theme.ground`);
  }
  assert.equal(groundPatches('fork').plateaus.length, 0);
});

test('Boden der Wiese: nur im Cache, Kartenwechsel baut neu, Aufbau schnell', async () => {
  const { render } = await import('../src/render.js?boden');
  const offscreen = [];
  globalThis.document = { createElement() { const m = mockCtx(); const c = { width: 0, height: 0, getContext: () => m.ctx, m }; offscreen.push(c); return c; } };
  try {
    const s = createGame();
    const main = mockCtx();
    const t0 = performance.now();
    render(main.ctx, s, {});
    const ms = performance.now() - t0;
    console.log(`B-078 Aufbau bgCanvas Wiese: ${ms.toFixed(1)} ms`);
    const off = offscreen[offscreen.length - 1];
    const q = off.m.counts.quadraticCurveTo;
    assert.ok(q > 21 * 4 * 10, `Flecken im Cache (${q} Kurven)`);
    render(main.ctx, s, {});
    assert.equal(off.m.counts.quadraticCurveTo, q, 'zweiter Frame zeichnet den Boden nicht neu');
    assert.equal(main.counts.quadraticCurveTo || 0, 0, 'Frame-Pfad zeichnet keine Flecken');
    assert.ok(ms < 60, `Aufbau ${ms.toFixed(1)} ms`);
    const f = createGame({ mapId: 'fork' });
    render(main.ctx, f, {});
    assert.equal(off.m.counts.quadraticCurveTo, q, 'Fork (ohne theme.ground) zeichnet keine Flecken');
    render(main.ctx, createGame(), {});
    assert.ok(off.m.counts.quadraticCurveTo > q, 'Wechsel zurueck zur Wiese baut den Boden neu');
  } finally { delete globalThis.document; }
});

test('groundPatches (Randfälle): alle Karten, undefined, unbekannt, endlich, nie auf Wegkacheln, Tore frei', async () => {
  const { groundPatches, blobPoints } = await import('../src/decor.js');
  const { pathTiles } = await import('../src/path.js');
  const { MAPS, GROUND_STYLE: G, WIDTH, HEIGHT } = await import('../src/config.js');
  const empty = { patches: [], plateaus: [], tufts: [] };
  assert.deepEqual(groundPatches('gibts-nicht'), empty);
  assert.doesNotThrow(() => groundPatches(undefined));
  assert.deepEqual(groundPatches(undefined), groundPatches('meadow'), 'undefined = Standardkarte');
  for (const id of Object.keys(MAPS)) assert.doesNotThrow(() => groundPatches(id), id);
  const g = groundPatches('meadow');
  const tile = (x, y) => `${Math.floor(x / TILE)},${Math.floor(y / TILE)}`;
  const wp = MAPS.meadow.waypoints;
  const onPath = pathTiles(wp);
  // Wegrandkacheln: Wegkacheln samt 8 Nachbarn
  for (const t of g.tufts) {
    assert.ok(Number.isFinite(t.x) && Number.isFinite(t.y) && Number.isFinite(t.s));
    assert.ok(!onPath.has(tile(t.x, t.y)), 'Büschel nicht auf Wegkachel');
  }
  const nearAxis = (x, y) => wp.slice(0, -1).some((a, i) => {
    const b = wp[i + 1], ax = (a[0] + 0.5) * TILE, ay = (a[1] + 0.5) * TILE, bx = (b[0] + 0.5) * TILE, by = (b[1] + 0.5) * TILE;
    const cx = Math.max(Math.min(ax, bx), Math.min(Math.max(ax, bx), x)), cy = Math.max(Math.min(ay, by), Math.min(Math.max(ay, by), y));
    return Math.hypot(x - cx, y - cy) < 30;
  });
  const start = wp[0], goal = wp[wp.length - 1];
  for (const p of g.plateaus) {
    for (const v of [p.x, p.y, p.rx, p.ry]) assert.ok(Number.isFinite(v));
    const pts = blobPoints(p.x, p.y, p.rx, p.ry, p.seed, G.plateauPoints);
    for (const [x, y] of pts) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
      assert.ok(!onPath.has(tile(x, y)), 'Plateaukante nicht auf Wegkachel');
      assert.ok(!nearAxis(x, y), 'Plateaukante nicht im Wegsaum (<30 px zur Achse)');
      assert.ok(x >= 0 && x <= WIDTH && y >= 0 && y <= HEIGHT, 'Plateau im Spielfeld');
    }
    for (const [c, r] of [start, goal]) {
      assert.ok(Math.hypot(p.x - (c + 0.5) * TILE, p.y - (r + 0.5) * TILE) > p.rx, 'Plateau deckt Start/Ziel nicht');
    }
  }
  for (const p of g.patches) for (const v of [p.x, p.y, p.rx, p.ry]) assert.ok(Number.isFinite(v));
});

test('Wald/Eis/Fork zeichnen weiter das Schachbrett, Wiese nicht', async () => {
  const { render } = await import('../src/render.js?schach');
  const { MAPS } = await import('../src/config.js');
  const made = [];
  globalThis.document = { createElement() { const m = mockCtx(); const c = { width: 0, height: 0, getContext: () => m.ctx, m }; made.push(c); return c; } };
  const rects = {};
  try {
    for (const id of Object.keys(MAPS)) {
      const before = made.map((c) => c.m.counts.fillRect || 0);
      render(mockCtx().ctx, createGame({ mapId: id }), {});
      rects[id] = Math.max(...made.map((c, i) => (c.m.counts.fillRect || 0) - (before[i] || 0)));
    }
  } finally { delete globalThis.document; }
  for (const id of Object.keys(MAPS)) if (id !== 'meadow') assert.ok(rects[id] > rects.meadow, `${id}: Schachbrett (${rects[id]} vs ${rects.meadow})`);
});

test('Wiesen-Deko (flatpop): nur im Cache, Aufbau schnell', async () => {
  const { render } = await import('../src/render.js?flatdeko');
  const offscreen = [];
  globalThis.document = { createElement() { const m = mockCtx(); const c = { width: 0, height: 0, getContext: () => m.ctx, m }; offscreen.push(c); return c; } };
  try {
    const main = mockCtx();
    const s = createGame();
    const t0 = performance.now();
    render(main.ctx, s, {});
    const ms = performance.now() - t0;
    console.log(`B-079 Aufbau bgCanvas Wiese: ${ms.toFixed(1)} ms`);
    const off = offscreen[offscreen.length - 1];
    const b = off.m.counts.bezierCurveTo;
    assert.ok(b > 0, 'Streu-Deko im Cache');
    render(main.ctx, s, {});
    assert.equal(off.m.counts.bezierCurveTo, b, 'zweiter Frame zeichnet die Deko nicht neu');
    assert.equal(main.counts.bezierCurveTo || 0, 0, 'Frame-Pfad zeichnet keine Deko');
    assert.ok(ms < 60, `Aufbau ${ms.toFixed(1)} ms`);
  } finally { delete globalThis.document; }
});

test('Wiesen-Akzente: nur im Cache, zweiter Frame zeichnet nichts neu, Aufbau schnell', async () => {
  const { render } = await import('../src/render.js?akzente');
  const offscreen = [];
  globalThis.document = { createElement() { const m = mockCtx(); const c = { width: 0, height: 0, getContext: () => m.ctx, m }; offscreen.push(c); return c; } };
  try {
    const main = mockCtx();
    const s = createGame();
    const t0 = performance.now();
    render(main.ctx, s, {});
    const ms = performance.now() - t0;
    console.log(`B-080 Aufbau bgCanvas Wiese: ${ms.toFixed(1)} ms`);
    const off = offscreen[offscreen.length - 1];
    const e = off.m.counts.bezierCurveTo, f = off.m.counts.fill;
    assert.ok(e > 0, 'Akzente im Cache');
    render(main.ctx, s, {});
    assert.equal(off.m.counts.bezierCurveTo, e, 'zweiter Frame zeichnet Akzente nicht neu');
    assert.equal(off.m.counts.fill, f);
    assert.ok(ms < 60, `Aufbau ${ms.toFixed(1)} ms`);
  } finally { delete globalThis.document; }
});

test('Wiesen-Licht: Abdunklung begrenzt, nur Wiese, Gradienten nur im Cache, Aufbau schnell', async () => {
  const { LIGHT_STYLE: L, MAPS } = await import('../src/config.js');
  assert.ok(L.vignetteAlpha <= L.maxDarken && L.treeShadowAlpha <= L.maxDarken, 'Abdunklung höchstens 15 %');
  assert.ok(L.maxDarken <= 0.15);
  const lighten = L.gradientAlpha + L.beamAlpha * L.beams.length;
  assert.ok(lighten <= 0.3, 'Aufhellung bleibt dezent');
  assert.equal(MAPS.meadow.theme.light, true);
  for (const id of Object.keys(MAPS)) if (id !== 'meadow') assert.ok(!MAPS[id].theme?.light, `${id} ohne Licht`);
  const { render } = await import('../src/render.js?licht');
  const offscreen = [];
  globalThis.document = { createElement() { const m = mockCtx(); const c = { width: 0, height: 0, getContext: () => m.ctx, m }; offscreen.push(c); return c; } };
  try {
    const main = mockCtx();
    const s = createGame();
    const t0 = performance.now();
    render(main.ctx, s, {});
    const ms = performance.now() - t0;
    console.log(`B-081 Aufbau bgCanvas Wiese: ${ms.toFixed(1)} ms`);
    const off = offscreen[offscreen.length - 1];
    assert.equal(off.m.counts.createLinearGradient, 1, 'Verlauf im Cache');
    assert.equal(off.m.counts.createRadialGradient, 1, 'Vignette im Cache');
    assert.equal(off.m.props.shadowBlur, undefined);
    assert.equal(off.m.props.globalAlpha, undefined);
    const built = offscreen.length;
    render(main.ctx, s, {});
    assert.equal(offscreen.length, built, 'Hintergrund nur einmal gebaut');
    assert.equal(off.m.counts.createLinearGradient, 1);
    assert.equal(off.m.counts.createRadialGradient, 1);
    for (const k of ['createLinearGradient', 'createRadialGradient']) assert.equal(main.counts[k], undefined, `Frame-Pfad: kein ${k}`);
    assert.equal(main.props.shadowBlur, undefined);
    assert.ok(ms < 60, `Aufbau ${ms.toFixed(1)} ms`);
  } finally { delete globalThis.document; }
});

test('B-082: Insel wird im Frame-Pfad mit dem Turm gezeichnet (nur Wiese), nicht im Hintergrund-Cache', async () => {
  const { MAPS } = await import('../src/config.js');
  const { render } = await import('../src/render.js?insel');
  assert.equal(MAPS.meadow.theme.islands, true);
  for (const id of Object.keys(MAPS)) if (id !== 'meadow') assert.ok(!MAPS[id].theme?.islands, `${id} ohne Inseln`);
  const offscreen = [];
  globalThis.document = { createElement() { const m = mockCtx(); const c = { width: 0, height: 0, getContext: () => m.ctx, m }; offscreen.push(c); return c; } };
  try {
    const frame = (s, ui = {}) => { const m = mockCtx(); render(m.ctx, s, ui); return m.counts.ellipse || 0; };
    const build = (s) => { s.gold = 9999; for (const [c, r] of [[3, 1], [5, 1], [7, 1]]) assert.ok(buildTower(s, 'cannon', c, r).ok, `${s.mapId} ${c},${r}`); };
    const s = createGame({ mapId: 'meadow' });
    const empty = frame(s);
    const cache = offscreen[offscreen.length - 1];
    const bgEll = cache.m.counts.ellipse || 0;
    build(s);
    const withTowers = frame(s);
    assert.equal(cache.m.counts.ellipse || 0, bgEll, 'Cache enthält keine Insel');
    assert.ok(withTowers > empty, 'Insel im Frame-Pfad');
    assert.equal(frame(s), withTowers, 'zweiter Frame zeichnet die Insel erneut');
    // gleiche Türme auf dem Wald: weniger Ellipsen pro Turm (keine Inseln)
    const f = createGame({ mapId: 'forest' });
    const forestEmpty = frame(f);
    build(f);
    assert.ok(withTowers - empty > frame(f) - forestEmpty, 'Wiese zeichnet je Turm zusätzlich eine Insel');
    // Vorschau: gültig und ungültig bekommen eine Insel (nur Wiese)
    const hover = (map, ok) => frame(createGame({ mapId: map }), { buildType: 'cannon', hover: { col: 3, row: 1, ok } });
    assert.ok(hover('meadow', true) > frame(createGame({ mapId: 'meadow' })));
    assert.ok(hover('meadow', false) > frame(createGame({ mapId: 'meadow' })));
  } finally { delete globalThis.document; }
});

test('B-082: Reichweitenkreis ist Ring mit dezenter Fläche; drawTower (Shop-Vorschau) zeichnet keine Insel', async () => {
  const { RANGE_STYLE } = await import('../src/config.js');
  const { render, drawTower } = await import('../src/render.js?reichweite');
  assert.ok(RANGE_STYLE.fillAlpha <= RANGE_STYLE.maxFillAlpha && RANGE_STYLE.maxFillAlpha <= 0.1);
  assert.ok(RANGE_STYLE.ringAlpha > RANGE_STYLE.fillAlpha * 4, 'Ring deutlich kräftiger als Fläche');
  assert.ok(RANGE_STYLE.ringWidth >= 2);
  const s = createGame({ mapId: 'meadow' });
  s.gold = 9999;
  const { tower } = buildTower(s, 'cannon', 3, 1);
  const strokes = [];
  const m = mockCtx();
  const spy = new Proxy(m.ctx, { get(t, k) { return k === 'stroke' ? () => strokes.push([m.props.strokeStyle, m.props.lineWidth]) : t[k]; }, set(t, k, v) { t[k] = v; return true; } });
  render(spy, s, { selectedTowerId: tower.id });
  assert.ok(strokes.some(([c, w]) => c === `rgba(255,255,255,${RANGE_STYLE.ringAlpha})` && w === RANGE_STYLE.ringWidth), 'Ring gezeichnet');
  const a = mockCtx(), b = mockCtx();
  drawTower(a.ctx, tower, false);
  render(b.ctx, s, {});
  assert.ok((b.counts.ellipse || 0) > (a.counts.ellipse || 0), 'drawTower allein ohne Insel');
});

test('Tester B-082: Rand-Turm, Hover null/Rand, Meteor-Zielkreis und Kartenwechsel crashen nicht; Inseln nur auf der Wiese', async () => {
  const { render } = await import('../src/render.js?tester082');
  const run = (s, ui) => { const m = mockCtx(); render(m.ctx, s, ui); return m; };
  const s = createGame();
  s.gold = 99999;
  buildTower(s, 'arrow', 0, 0);
  buildTower(s, 'arrow', COLS - 1, ROWS - 1);
  assert.ok(s.towers.length >= 1);
  for (const ui of [{}, { hover: null, buildType: 'arrow' }, { hover: undefined }, { hover: { col: -1, row: 99, ok: false }, buildType: 'arrow' },
    { hover: { col: 0, row: 0, ok: true }, buildType: 'arrow' }, { aiming: true, hoverPx: { x: 0, y: 0 } }, { aiming: true }])
    run(s, ui);
  const wiese = run(s, {}).counts.ellipse || 0;
  const wald = createGame({ mapId: 'forest' });
  for (const id of ['forest', 'ice', 'fork']) {
    const g = createGame({ mapId: id }); g.gold = 99999;
    buildTower(g, 'arrow', 0, 0); buildTower(g, 'arrow', COLS - 1, ROWS - 1);
    const g0 = createGame({ mapId: id });
    const withT = run(g, {}).counts.ellipse || 0, without = run(g0, {}).counts.ellipse || 0;
    assert.ok(withT - without < 20, `${id}: keine Insel-Ellipsen (Insel hätte 7 je Turm)`);
  }
  assert.ok(wiese > 0 && wald);
});
