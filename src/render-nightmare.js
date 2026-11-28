// B-194: Bewegungsschicht der Albtraum-Karten (auch Nacht-Look B-185). Nur Zeichnen, keine Spiel-Logik.
// Lage aller Teilchen einmal je Karte (WeakMap je Weg, deterministisch aus mapId), je Frame nur Zeitversätze:
// keine Zufallszahlen, keine Gradienten. Weiche Flecken (Nebel, Hof) kommen aus einem kleinen Sprite je Farbe.
// Arten und Grundwerte: NM_MOTION (config.js); Anzahl und Farben je Karte: motion in src/nm-maps/<id>.js.
import { WIDTH, HEIGHT, TILE, NM_MOTION, NIGHT_STYLE, NM_WARM_LIGHT } from './config.js';
import { nightmareOf } from './nm-maps/index.js';
import { emberPoints, drawEmbers } from './render-light.js';

const TAU = Math.PI * 2;
const INK = '#2b1a10'; // Kontur (ink)
const frac = (v) => ((v % 1) + 1) % 1;
const lerp = (a, b, v) => a + (b - a) * v;
const range = (v, r) => (Array.isArray(r) ? lerp(r[0], r[1], v) : r);

// Deterministischer Zufall je Karte und Eintrag
function seeded(mapId, salt) {
  let s = 7 + salt * 131;
  for (const ch of String(mapId)) s = (s * 31 + ch.charCodeAt(0)) % 2147483647;
  s = Math.max(1, s);
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Feste Punkte eines Eintrags: at (Spiel-px) oder on = Name der Szenen-Marken (marks); n gleichmäßig verteilt gewählt
function pointsOf(m, marks) {
  const list = m.on ? marks[m.on] || [] : m.at || [];
  return (n) => Array.from({ length: Math.min(n, list.length) }, (_, i) => list[Math.floor(((i + 0.5) * list.length) / Math.min(n, list.length))]);
}

// Teilchen einer Karte (nach Wichtigkeit, compact: Handy-Anzahl), höchstens NM_MOTION.maxDesktop bzw. maxCompact.
// Nebelbänder zählen je 1, Augen je Paar 1, Glanzlinien und Wellenringe je 1, Puls-Gruppen je 1.
// eyes: Augenpaare der Szene [{ x, y }] in Spiel-px (Feld ab 0,0); marks: Marken der Szene { name: [[x, y], …] } (Spiel-px)
export function motionParticles(mapId, compact = false, eyes = [], marks = {}) {
  const list = nightmareOf(mapId).motion || [];
  const max = compact ? NM_MOTION.maxCompact : NM_MOTION.maxDesktop;
  const out = [];
  list.forEach((m, k) => {
    const def = NM_MOTION[m.kind];
    if (!def) return;
    let n = Array.isArray(m.count) ? m.count[compact ? 1 : 0] : (m.count ?? 1);
    const rnd = seeded(mapId, k);
    const fixed = m.at || m.on ? pointsOf(m, marks)(m.kind === 'ripple' ? 0 : n) : null;
    if (m.kind === 'blink') n = Math.min(n, (m.at ? fixed : eyes).length);
    else if (fixed && m.kind !== 'ripple') n = fixed.length;
    else if (!fixed && (m.kind === 'pulse' || m.kind === 'smoke' || m.kind === 'bob')) n = 0; // brauchen feste Punkte
    for (let i = 0; i < n && out.length < max; i++) {
      const p = { kind: m.kind, color: m.color, phase: rnd() };
      const at = fixed?.[i], x = at ? at[0] : rnd() * WIDTH, y = at ? at[1] : rnd() * HEIGHT;
      if (m.kind === 'fog') Object.assign(p, { x: WIDTH / 2 + (rnd() - 0.5) * TILE * 4, y: HEIGHT * (i + 0.5) / n, alpha: range(rnd(), m.alpha ?? def.alpha) });
      else if (m.kind === 'fall' || m.kind === 'rise') {
        Object.assign(p, { x: rnd() * WIDTH, y: rnd() * HEIGHT, r: range(rnd(), m.r ?? def.r ?? def.core), alpha: m.alpha ?? 1, period: m.period ?? def.period, halo: m.halo, haloAlpha: m.haloAlpha ?? def.haloAlpha });
      } else if (m.kind === 'blink') Object.assign(p, m.at ? { x: at[0], y: at[1] } : eyes[i], m.rx ? { rx: m.rx, ry: m.ry, gap: m.gap } : {});
      else if (m.kind === 'glint') Object.assign(p, { points: m.points || [], alpha: m.alpha ?? 1 });
      else if (m.kind === 'ripple') Object.assign(p, { at: m.at || [0, 0, 0, 0], alpha: m.alpha ?? def.alpha });
      else if (m.kind === 'twinkle') Object.assign(p, { x, y, alpha: m.alpha ?? def.alpha, size: m.size ?? def.size, period: m.period ?? def.period });
      else if (m.kind === 'pulse') {
        // Gruppe (Liste von Punkten) oder ein Punkt; r: Halbachsen [rx, ry] oder Radius
        const pts = Array.isArray(at[0]) ? at : [at], r = m.r ?? def.r;
        Object.assign(p, { pts, rx: Array.isArray(r) ? r[0] : r, ry: Array.isArray(r) ? r[1] : r, base: m.base ?? 1, alpha: m.alpha ?? def.alpha, period: m.period ?? def.period });
      } else if (m.kind === 'smoke') Object.assign(p, { x, y, r: m.r ?? def.r, alpha: m.alpha ?? 1, period: m.period ?? def.period });
      else if (m.kind === 'bob') Object.assign(p, { x, y, shape: m.shape || 'floe', scale: m.scale ?? 1, core: m.core, halo: m.halo, rot: (i * 37 * Math.PI) / 180, amp: m.amp ?? def.amp, period: m.period ?? def.period });
      out.push(p);
    }
  });
  return out;
}

// Weicher Fleck je Farbe (Sprite, einmal gemalt); null ohne Canvas (Node), dann flache Kreise/Ellipsen
const sprites = new Map();
function soft(color) {
  if (sprites.has(color)) return sprites.get(color);
  let cv = null;
  const n = NM_MOTION.sprite;
  if (typeof document !== 'undefined') { cv = document.createElement('canvas'); cv.width = n; cv.height = n; }
  else if (typeof OffscreenCanvas !== 'undefined') cv = new OffscreenCanvas(n, n);
  if (cv) {
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, n, n);
  }
  sprites.set(color, cv);
  return cv;
}
function spot(ctx, color, x, y, rx, ry) {
  const s = soft(color);
  if (s) { ctx.drawImage(s, x - rx, y - ry, 2 * rx, 2 * ry); return; }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

const layoutCache = new WeakMap(); // Weg -> Map(Schlüssel -> Teilchen)
const emberCache = new WeakMap(); // Weg -> Glutpunkte
function layoutFor(state, compact, eyes, marks) {
  const key = `${state.mapId}|${compact ? 1 : 0}|${eyes.length}|${Object.entries(marks).map(([n, l]) => `${n}${l.length}`).join()}`;
  const host = state.path || state;
  if (!layoutCache.has(host)) layoutCache.set(host, new Map());
  const m = layoutCache.get(host);
  if (!m.has(key)) m.set(key, motionParticles(state.mapId, compact, eyes, marks));
  return m.get(key);
}

// Bewegung zeichnen (über dem Boden, unter den Figuren). t in Sekunden; reduced: alles steht an der Startlage (t = 0),
// Augen offen. compact: Handy-Anzahl. eyes/marks: Augenpaare und Marken aus der gemalten Szene (scene.eyes, scene.marks).
export function drawNightmareMotion(ctx, state, t, reduced = false, compact = false, eyes = [], marks = {}) {
  const T = reduced ? 0 : t;
  const parts = layoutFor(state, compact, eyes, marks);
  ctx.save();
  for (const p of parts) {
    if (p.kind === 'fog') {
      const F = NM_MOTION.fog;
      ctx.save(); // Nebel nur über dem Feld, nie am Rand
      ctx.beginPath();
      ctx.rect(0, 0, WIDTH, HEIGHT);
      ctx.clip();
      ctx.globalAlpha = p.alpha;
      spot(ctx, p.color, p.x + F.sway * Math.sin(TAU * (T / F.period + p.phase)), p.y, F.rx, F.ry);
      ctx.restore();
    } else if (p.kind === 'fall') {
      const F = NM_MOTION.fall;
      const v = frac(T / p.period + p.phase);
      const a = Math.min(1, v / F.fade, (1 - v) / F.fade);
      ctx.globalAlpha = p.alpha * a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x + F.drift * Math.sin(TAU * v), p.y + F.drop * v - F.drop / 2, p.r, 0, TAU);
      ctx.fill();
    } else if (p.kind === 'rise') {
      const R = NM_MOTION.rise;
      const v = frac(T / p.period + p.phase);
      const s = lerp(1, R.shrink, v), x = p.x, y = p.y - R.lift * v + R.lift / 2;
      if (p.halo) { ctx.globalAlpha = p.haloAlpha; spot(ctx, p.halo, x, y, R.halo * s, R.halo * s); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, p.r * s, 0, TAU);
      ctx.fill();
    } else if (p.kind === 'blink') {
      const B = NM_MOTION.blink;
      const shut = !reduced && frac(T / B.period + p.phase) < B.closed / B.period;
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.color;
      const rx = p.rx ?? B.rx, ry = p.ry ?? B.ry, gap = p.gap ?? B.gap;
      for (const dx of [-gap, gap]) {
        ctx.beginPath();
        ctx.ellipse(p.x + dx, p.y, rx, shut ? ry * B.shut : ry, 0, 0, TAU);
        ctx.fill();
      }
    } else if (p.kind === 'glint' && p.points.length > 1) {
      const G = NM_MOTION.glint;
      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = G.width;
      ctx.setLineDash(G.dash);
      ctx.lineDashOffset = -T * G.speed;
      ctx.beginPath();
      p.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (p.kind === 'ripple') {
      const R = NM_MOTION.ripple;
      const [x, y, rx, ry] = p.at;
      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = R.width;
      ctx.setLineDash(R.dash);
      ctx.lineDashOffset = -frac(T / R.period) * (R.dash[0] + R.dash[1]);
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (p.kind === 'twinkle') {
      // Vierzack-Stern, Deckkraft und Größe schwingen gemeinsam
      const W = NM_MOTION.twinkle, v = wave(T, p);
      const s = lerp(p.size[0], p.size[1], v), r = W.r * s, w = W.waist * s;
      ctx.globalAlpha = lerp(p.alpha[0], p.alpha[1], v);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      [[0, -r], [w, -w], [r, 0], [w, w], [0, r], [-w, w], [-r, 0], [-w, -w]].forEach(([dx, dy], i) => (i ? ctx.lineTo(p.x + dx, p.y + dy) : ctx.moveTo(p.x + dx, p.y + dy)));
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === 'pulse') {
      ctx.globalAlpha = p.base * lerp(p.alpha[0], p.alpha[1], wave(T, p));
      for (const [x, y] of p.pts) spot(ctx, p.color, x, y, p.rx, p.ry);
    } else if (p.kind === 'smoke') {
      // Wölkchen steigt, wächst und verblasst, dann von vorn
      const S = NM_MOTION.smoke, v = frac(T / p.period + p.phase), r = p.r * lerp(S.grow[0], S.grow[1], v);
      ctx.globalAlpha = p.alpha * Math.min(1, v / S.fade, (1 - v) / S.fade);
      spot(ctx, p.color, p.x, p.y - S.lift * v, r, r);
    } else if (p.kind === 'bob') {
      const dy = p.amp * Math.sin(TAU * (T / p.period + p.phase));
      ctx.globalAlpha = 1;
      if (p.shape === 'flame') drawFlame(ctx, p, p.x, p.y + dy);
      else drawFloe(ctx, p, p.x, p.y + dy);
    }
  }
  ctx.restore();
  // Glut am Weg (B-184) nur auf Karten mit embers (Vulkan, Zangenangriff)
  if (nightmareOf(state.mapId).embers && state.path) {
    if (!emberCache.has(state.path)) emberCache.set(state.path, emberPoints(state.path, NIGHT_STYLE, TILE));
    drawEmbers(ctx, emberCache.get(state.path), t, NIGHT_STYLE, reduced);
  }
}

// Schwingung 0..1 (Sinus) mit Phase des Teilchens
function wave(T, p) { return 0.5 + 0.5 * Math.sin(TAU * (T / p.period + p.phase)); }
// Eisscholle (Vorlage Eiswelt: Sechseck 22 x 13 Fläche-px, Kontur ink), Mitte x, y
const FLOE = [[-11, 0], [-6, -6.5], [6, -6.5], [11, 0], [6, 6.5], [-6, 6.5]];
function drawFloe(ctx, p, x, y) {
  const c = Math.cos(p.rot), s = Math.sin(p.rot), k = p.scale;
  ctx.fillStyle = p.color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2 * k;
  ctx.beginPath();
  FLOE.forEach(([a, b], i) => { const px = x + (a * c - b * s) * k, py = y + (a * s + b * c) * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
// Seelenflamme (Vorlage Zwei Fronten: 20 x 30 Fläche-px, Fuß unten Mitte): Schein, Flamme, Kern
function drawFlame(ctx, p, x, y) {
  const k = p.scale, X = (v) => x + (v - 10) * k, Y = (v) => y + (v - 30) * k;
  if (p.halo) { ctx.globalAlpha = 0.35; spot(ctx, p.halo, X(10), Y(16), 12 * k, 14 * k); ctx.globalAlpha = 1; }
  const drop = (pts, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(X(pts[0]), Y(pts[1]));
    for (let i = 2; i < pts.length; i += 4) ctx.quadraticCurveTo(X(pts[i]), Y(pts[i + 1]), X(pts[i + 2]), Y(pts[i + 3]));
    ctx.closePath();
    ctx.fill();
  };
  drop([10, 0, 18, 12, 16, 20, 14, 30, 10, 30, 6, 30, 4, 20, 2, 12, 10, 0], p.color);
  if (p.core) drop([10, 12, 14, 19, 12, 24, 10, 28, 8, 24, 6, 19, 10, 12], p.core);
}

// B-194: warme Lichtinsel unter jedem Turm ("deine Türme sind die Lichter"), über dem Boden, unter den Figuren; steht still
export function drawWarmLights(ctx, towers) {
  const W = NM_WARM_LIGHT;
  for (const t of towers) spot(ctx, W.color, t.x, t.y + W.dy * TILE, W.rx * TILE, W.ry * TILE);
}
