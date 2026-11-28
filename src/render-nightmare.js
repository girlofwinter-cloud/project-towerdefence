// B-194: Bewegungsschicht der Albtraum-Karten (auch Nacht-Look B-185). Nur Zeichnen, keine Spiel-Logik.
// Lage aller Teilchen einmal je Karte (WeakMap je Weg, deterministisch aus mapId), je Frame nur Zeitversätze:
// keine Zufallszahlen, keine Gradienten. Weiche Flecken (Nebel, Hof) kommen aus einem kleinen Sprite je Farbe.
// Arten und Grundwerte: NM_MOTION (config.js); Anzahl und Farben je Karte: motion in src/nm-maps/<id>.js.
import { WIDTH, HEIGHT, TILE, NM_MOTION, NIGHT_STYLE, NM_WARM_LIGHT } from './config.js';
import { nightmareOf } from './nm-maps/index.js';
import { emberPoints, drawEmbers } from './render-light.js';

const TAU = Math.PI * 2;
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

// Teilchen einer Karte (nach Wichtigkeit, compact: Handy-Anzahl), höchstens NM_MOTION.maxDesktop bzw. maxCompact.
// Nebelbänder zählen je 1, Augen je Paar 1, Glanzlinien und Wellenringe je 1.
// eyes: Augenpaare der Szene [{ x, y }] in Spiel-px (Feld ab 0,0)
export function motionParticles(mapId, compact = false, eyes = []) {
  const list = nightmareOf(mapId).motion || [];
  const max = compact ? NM_MOTION.maxCompact : NM_MOTION.maxDesktop;
  const out = [];
  list.forEach((m, k) => {
    const def = NM_MOTION[m.kind];
    if (!def) return;
    const cnt = Array.isArray(m.count) ? m.count[compact ? 1 : 0] : (m.count ?? 1);
    const rnd = seeded(mapId, k);
    const n = m.kind === 'blink' ? Math.min(cnt, eyes.length) : cnt;
    for (let i = 0; i < n && out.length < max; i++) {
      const p = { kind: m.kind, color: m.color, phase: rnd() };
      if (m.kind === 'fog') Object.assign(p, { x: WIDTH / 2 + (rnd() - 0.5) * TILE * 4, y: HEIGHT * (i + 0.5) / n, alpha: range(rnd(), m.alpha ?? def.alpha) });
      else if (m.kind === 'fall' || m.kind === 'rise') {
        Object.assign(p, { x: rnd() * WIDTH, y: rnd() * HEIGHT, r: range(rnd(), m.r ?? def.r ?? def.core), alpha: m.alpha ?? 1, period: m.period ?? def.period, halo: m.halo, haloAlpha: m.haloAlpha ?? def.haloAlpha });
      } else if (m.kind === 'blink') Object.assign(p, eyes[i]);
      else if (m.kind === 'glint') Object.assign(p, { points: m.points || [], alpha: m.alpha ?? 1 });
      else if (m.kind === 'ripple') Object.assign(p, { at: m.at || [0, 0, 0, 0], alpha: m.alpha ?? def.alpha });
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
function layoutFor(state, compact, eyes) {
  const key = `${state.mapId}|${compact ? 1 : 0}|${eyes.length}`;
  const host = state.path || state;
  if (!layoutCache.has(host)) layoutCache.set(host, new Map());
  const m = layoutCache.get(host);
  if (!m.has(key)) m.set(key, motionParticles(state.mapId, compact, eyes));
  return m.get(key);
}

// Bewegung zeichnen (über dem Boden, unter den Figuren). t in Sekunden; reduced: alles steht an der Startlage (t = 0),
// Augen offen. compact: Handy-Anzahl. eyes: Augenpaare aus der gemalten Szene (scene.eyes).
export function drawNightmareMotion(ctx, state, t, reduced = false, compact = false, eyes = []) {
  const T = reduced ? 0 : t;
  const parts = layoutFor(state, compact, eyes);
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
      for (const dx of [-B.gap, B.gap]) {
        ctx.beginPath();
        ctx.ellipse(p.x + dx, p.y, B.rx, shut ? B.ry * B.shut : B.ry, 0, 0, TAU);
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
    }
  }
  ctx.restore();
  // Glut am Weg (B-184) nur auf Karten mit embers (Vulkan, Zangenangriff)
  if (nightmareOf(state.mapId).embers && state.path) {
    if (!emberCache.has(state.path)) emberCache.set(state.path, emberPoints(state.path, NIGHT_STYLE, TILE));
    drawEmbers(ctx, emberCache.get(state.path), t, NIGHT_STYLE, reduced);
  }
}

// B-194: warme Lichtinsel unter jedem Turm ("deine Türme sind die Lichter"), über dem Boden, unter den Figuren; steht still
export function drawWarmLights(ctx, towers) {
  const W = NM_WARM_LIGHT;
  for (const t of towers) spot(ctx, W.color, t.x, t.y + W.dy * TILE, W.rx * TILE, W.ry * TILE);
}
