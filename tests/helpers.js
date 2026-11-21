// Gemeinsame Hilfsfunktionen für die Unit-Tests
import assert from 'node:assert/strict';
import { update, canBuild } from '../src/game.js';
import { buildPath } from '../src/path.js';
import { WAYPOINTS, TILE, ENEMY_TYPES } from '../src/config.js';


// Hilfsfunktion: Spiel n Sekunden in kleinen Schritten laufen lassen
export function run(state, seconds, dt = 1 / 60) {
  for (let t = 0; t < seconds; t += dt) update(state, dt);
}

// Erstes freies Feld neben dem Weg finden
export function freeTileNearPath(state) {
  for (let r = 0; r < 14; r++) for (let c = 0; c < 20; c++) {
    if (canBuild(state, c, r).ok && (state.blocked.has(`${c},${r + 1}`) || state.blocked.has(`${c},${r - 1}`))) return [c, r];
  }
  throw new Error('kein Feld gefunden');
}

// ---------- Rendering mit Mock-Kontext (Tester) ----------
export function mockCtx(counts = {}) {
  const props = {};
  let depth = 0;
  return {
    counts,
    get depth() { return depth; },
    props,
    ctx: new Proxy({}, {
      get(_, k) {
        if (k in props) return props[k];
        return (...a) => {
          counts[k] = (counts[k] || 0) + 1;
          if (k === 'save') depth++;
          if (k === 'restore') { depth--; assert.ok(depth >= 0, 'restore ohne save'); }
        };
      },
      set(_, k, v) { props[k] = v; return true; },
    }),
  };
}

// Zeichnet einen Gegner auf einen Mock mit Matrix-Tracking; liefert Aufrufe, Weltpunkte und Grenzen.
export async function recordEnemy(over, time = 1, path = buildPath(WAYPOINTS, TILE)) {
  const { drawEnemy } = await import('../src/render-enemies.js');
  const def = ENEMY_TYPES[over.type];
  const e = { id: 3, x: 200, y: 150, dist: 20, hp: 10, maxHp: 10, slowUntil: 0, slowFactor: 0.5, speed: def ? def.speed : 1, radius: def ? def.radius : 10, ...over };
  const props = {};
  const calls = [];
  const stack = [];
  const world = []; // { x, y, ext, hp }
  let m = [1, 0, 0, 1, 0, 0];
  let depth = 0;
  const HP = new Set(['#300', '#4cd964', '#ffcc00', '#ff3b30']);
  const tp = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const scaleOf = () => Math.max(Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3]));
  const add = (x, y, ext, box) => { const [wx, wy] = tp(x, y); world.push({ x: wx, y: wy, ext, box, hp: HP.has(props.fillStyle), depth }); };
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k in props) return props[k];
      return (...a) => {
        calls.push(k + ':' + a.map((v) => (typeof v === 'number' ? v.toFixed(2) : v)).join(',') + '|' + props.fillStyle + '|' + props.strokeStyle);
        if (k === 'save') { depth++; stack.push(m.slice()); }
        else if (k === 'restore') { depth--; assert.ok(depth >= 0); m = stack.pop(); }
        else if (k === 'translate') { m = [m[0], m[1], m[2], m[3], m[0] * a[0] + m[2] * a[1] + m[4], m[1] * a[0] + m[3] * a[1] + m[5]]; }
        else if (k === 'scale') { m = [m[0] * a[0], m[1] * a[0], m[2] * a[1], m[3] * a[1], m[4], m[5]]; }
        else if (k === 'rotate') {
          const c = Math.cos(a[0]), s = Math.sin(a[0]);
          m = [m[0] * c + m[2] * s, m[1] * c + m[3] * s, m[2] * c - m[0] * s, m[3] * c - m[1] * s, m[4], m[5]];
        }
        else if (k === 'fillRect' || k === 'strokeRect') { add(a[0], a[1], 0); add(a[0] + a[2], a[1] + a[3], 0); }
        else if (k === 'arc') add(a[0], a[1], a[2] * scaleOf());
        else if (k === 'ellipse') add(a[0], a[1], Math.max(a[2], a[3]) * scaleOf(), m[1] === 0 && m[2] === 0 && a[4] === 0 ? [a[2] * m[0], a[3] * m[3]] : undefined); // Box nur bei achsparalleler Ellipse
        else if (k === 'moveTo' || k === 'lineTo') add(a[0], a[1], 0);
      };
    },
    set(_, k, v) { props[k] = v; return true; },
  });
  drawEnemy(ctx, e, time, path);
  return { e, calls, depth, props, world, print: calls.join('\n'), figure: world.filter((p) => !p.hp) };
}

// Math.random darf in der Partikel-Logik nie benutzt werden
export async function withoutRandom(fn) {
  const orig = Math.random;
  Math.random = () => { throw new Error('Math.random verboten'); };
  try { return await fn(); } finally { Math.random = orig; }
}
