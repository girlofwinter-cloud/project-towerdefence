// Stil 1: SVG-Formen aus dem Entwurf (docs/design/stil1-entwurf.dc.html) auf ein Canvas zeichnen.
// parseFigure liest einen SVG-Ausschnitt (path, circle, ellipse, rect, line) einmal beim Laden in eine Liste;
// drawFigure zeichnet die Liste. Im Browser laufen Pfade über new Path2D(d) (Pfad unverändert), ohne Path2D
// (Node, Tests) über einen eigenen Pfad-Leser mit moveTo/lineTo/... Reine Zeichen-Hilfe, keine Spiel-Logik.
// Transparenz steckt in den Farben (rgba), globalAlpha bleibt unberührt.

// Verläufe aus dem Entwurf (Z.42–48), objectBoundingBox wie in SVG: Werte relativ zur Form
export const GRADIENTS = {
  's1-stone': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#e3d2b0'], [0.6, '#b9a283'], [1, '#8a7560']] },
  's1-wood': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#c88a4c'], [1, '#8a5326']] },
  's1-ice': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 1, stops: [[0, '#e8fbff'], [0.5, '#8fd8f2'], [1, '#3b8fcb']] },
  's1-orb': { type: 'radial', cx: 0.35, cy: 0.3, r: 0.8, stops: [[0, '#ffffff'], [0.4, '#bff6ff'], [1, '#4aa6e8']] },
  's1-boom': { type: 'radial', cx: 0.5, cy: 0.5, r: 0.5, stops: [[0, '#fffbd0'], [0.45, '#ffc93c'], [1, '#e5481f']] },
  's1-glow': { type: 'radial', cx: 0.5, cy: 0.5, r: 0.5, stops: [[0, 'rgba(255,246,168,0.9)'], [1, 'rgba(255,246,168,0)']] },
  's1-iceglow': { type: 'radial', cx: 0.5, cy: 0.5, r: 0.5, stops: [[0, 'rgba(216,247,255,0.95)'], [1, 'rgba(127,208,255,0)']] },
  // B-173/B-174: Stufe 3 (docs/design/elemente/Tuerme-*.md)
  's3-marble': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#fbf7ef'], [0.6, '#e2d9c8'], [1, '#b8ab95']] },
  's3-gold': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 1, stops: [[0, '#ffe27a'], [0.5, '#f2c14e'], [1, '#b9851d']] },
  's3-basalt': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#4a3a38'], [1, '#2d1f20']] },
  's3-lava': { type: 'radial', cx: 0.5, cy: 0.7, r: 0.7, stops: [[0, '#ffe58a'], [0.5, '#ffc23a'], [1, '#ff7a1f']] },
  's3-ice': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 1, stops: [[0, '#e8fbff'], [0.5, '#8fd8f2'], [1, '#1f5d96']] },
  's3-brick': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#c0563c'], [1, '#8a3424']] },
  's3-darkwood': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#6b4a2e'], [1, '#3a2414']] },
  's3-brass': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 1, stops: [[0, '#ffe27a'], [0.55, '#d79a2b'], [1, '#8a5a1e']] },
  's3-copper': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#e8a070'], [0.55, '#c9794a'], [1, '#7a3f1e']] },
  // B-185: goldene Türme (docs/design/elemente/Kosmetik-Aussehen.md), Tausch per GOLD_TOWER_STYLE.grads
  's1-stone-gold': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#fff3d2'], [0.6, '#e3d2b0'], [1, '#b9a283']] }, // cream, stone-a, stone-b
  's1-wood-gold': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#ffe27a'], [1, '#b9851d']] }, // gold-light, gold-dark
};

// Farbe mit Deckkraft: #rgb/#rrggbb/rgba(...) -> rgba(...) (einmal beim Laden)
export function withAlpha(color, a) {
  if (a >= 1 || !color) return color;
  if (color[0] === '#') {
    const h = color.length === 4 ? color.slice(1).split('').map((c) => c + c).join('') : color.slice(1);
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${+a.toFixed(3)})`;
  }
  const m = /rgba?\(([^)]*)\)/.exec(color);
  if (!m) return color;
  const p = m[1].split(',').map((s) => s.trim());
  const base = p.length > 3 ? parseFloat(p[3]) : 1;
  return `rgba(${p[0]},${p[1]},${p[2]},${+(base * a).toFixed(3)})`;
}

// ---------- Pfad-Leser (SVG path d -> absolute Befehle) ----------
// Unterstützt M L H V Q C A Z (groß und klein), wie sie im Entwurf vorkommen.
export function parsePathD(d) {
  const tok = d.match(/[MLHVQCAZmlhvqcaz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) || [];
  const out = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;
  const num = () => parseFloat(tok[i++]);
  const isNum = () => i < tok.length && !/[A-Za-z]/.test(tok[i]);
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'Z') { out.push(['Z']); x = sx; y = sy; continue; }
    if (!isNum()) { i++; continue; }
    if (C === 'M') {
      x = (rel ? x : 0) + num(); y = (rel ? y : 0) + num();
      sx = x; sy = y; out.push(['M', x, y]);
      cmd = rel ? 'l' : 'L'; // weitere Zahlenpaare nach M sind Linien
    } else if (C === 'L') {
      x = (rel ? x : 0) + num(); y = (rel ? y : 0) + num(); out.push(['L', x, y]);
    } else if (C === 'H') {
      x = (rel ? x : 0) + num(); out.push(['L', x, y]);
    } else if (C === 'V') {
      y = (rel ? y : 0) + num(); out.push(['L', x, y]);
    } else if (C === 'Q') {
      const ox = rel ? x : 0, oy = rel ? y : 0;
      const x1 = ox + num(), y1 = oy + num();
      x = ox + num(); y = oy + num(); out.push(['Q', x1, y1, x, y]);
    } else if (C === 'C') {
      const ox = rel ? x : 0, oy = rel ? y : 0;
      const x1 = ox + num(), y1 = oy + num(), x2 = ox + num(), y2 = oy + num();
      x = ox + num(); y = oy + num(); out.push(['C', x1, y1, x2, y2, x, y]);
    } else if (C === 'A') {
      const rx = num(), ry = num(), rot = num(), large = num(), sweep = num();
      const x2 = (rel ? x : 0) + num(), y2 = (rel ? y : 0) + num();
      out.push(arcToEllipse(x, y, rx, ry, rot, large, sweep, x2, y2));
      x = x2; y = y2;
    } else i++;
  }
  return out;
}

// SVG-Bogen (Endpunkte) -> Canvas-Ellipse (Mittelpunkt), nach SVG 1.1 Anhang F.6.5
function arcToEllipse(x1, y1, rx, ry, rotDeg, large, sweep, x2, y2) {
  const phi = (rotDeg * Math.PI) / 180;
  const c = Math.cos(phi), s = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const xp = c * dx + s * dy, yp = -s * dx + c * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
  const den = rx * rx * yp * yp + ry * ry * xp * xp;
  let k = Math.sqrt(Math.max(0, num / den));
  if (large === sweep) k = -k;
  const cxp = (k * rx * yp) / ry, cyp = (-k * ry * xp) / rx;
  const cx = c * cxp - s * cyp + (x1 + x2) / 2, cy = s * cxp + c * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const a1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
  let da = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!sweep && da > 0) da -= 2 * Math.PI;
  else if (sweep && da < 0) da += 2 * Math.PI;
  return ['A', cx, cy, rx, ry, phi, a1, a1 + da, !sweep];
}

// Befehle auf den Kontext übertragen (ohne beginPath)
export function tracePath(ctx, cmds) {
  for (const p of cmds) {
    switch (p[0]) {
      case 'M': ctx.moveTo(p[1], p[2]); break;
      case 'L': ctx.lineTo(p[1], p[2]); break;
      case 'Q': ctx.quadraticCurveTo(p[1], p[2], p[3], p[4]); break;
      case 'C': ctx.bezierCurveTo(p[1], p[2], p[3], p[4], p[5], p[6]); break;
      case 'A': ctx.ellipse(p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8]); break;
      default: ctx.closePath();
    }
  }
}

function pathBox(cmds) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (const p of cmds) {
    if (p[0] === 'A') { add(p[1] - p[3], p[2] - p[4]); add(p[1] + p[3], p[2] + p[4]); }
    else for (let k = 1; k + 1 < p.length; k += 2) add(p[k], p[k + 1]);
  }
  return [x0, y0, x1, y1];
}

// Füllung ohne Angabe ist in SVG schwarz; offene Linien mit nur zwei Punkten je Teilpfad haben keine Fläche
function hasArea(cmds) {
  let n = 0;
  for (const p of cmds) {
    if (p[0] === 'M') n = 1;
    else if (p[0] !== 'Z' && ++n >= 3) return true;
    if (p[0] === 'Q' || p[0] === 'C' || p[0] === 'A') return true;
  }
  return false;
}

// ---------- SVG-Ausschnitt lesen ----------
const ATTR = /([\w-]+)="([^"]*)"/g;
function attrs(s) {
  const a = {};
  for (const m of s.matchAll(ATTR)) a[m[1]] = m[2];
  return a;
}

// Ein Element in eine Zeichenanweisung umwandeln
function element(tag, a) {
  const n = (k, d = 0) => (a[k] === undefined ? d : parseFloat(a[k]));
  let cmds;
  let shape = null;
  if (tag === 'path') cmds = parsePathD(a.d);
  else if (tag === 'circle') { shape = ['circle', n('cx'), n('cy'), n('r')]; }
  else if (tag === 'ellipse') { shape = ['ellipse', n('cx'), n('cy'), n('rx'), n('ry')]; }
  else if (tag === 'rect') { shape = ['rect', n('x'), n('y'), n('width'), n('height'), Math.min(n('rx'), n('width') / 2, n('height') / 2)]; }
  else if (tag === 'line') cmds = [['M', n('x1'), n('y1')], ['L', n('x2'), n('y2')]];
  else if (tag === 'polygon' || tag === 'polyline') {
    const v = (a.points || '').trim().split(/[\s,]+/).map(parseFloat);
    cmds = [];
    for (let k = 0; k + 1 < v.length; k += 2) cmds.push([k ? 'L' : 'M', v[k], v[k + 1]]);
    if (tag === 'polygon') cmds.push(['Z']);
  } else return null;
  let box;
  if (shape) {
    const [k, x, y, p, q, r] = shape;
    box = k === 'circle' ? [x - p, y - p, x + p, y + p] : k === 'ellipse' ? [x - p, y - q, x + p, y + q] : [x, y, x + p, y + q];
    void r;
  } else box = pathBox(cmds);
  const op = n('opacity', 1);
  const fillOp = op * n('fill-opacity', 1);
  const strokeOp = op * n('stroke-opacity', 1);
  let fill = a.fill === undefined ? (shape || hasArea(cmds) ? '#000' : null) : a.fill === 'none' ? null : a.fill;
  let grad = null;
  if (fill && fill.startsWith('url(')) { grad = fill.slice(5, -1); fill = null; }
  const stroke = a.stroke && a.stroke !== 'none' ? withAlpha(a.stroke, strokeOp) : null;
  return {
    tag, cmds, shape, box, d: a.d || null, path2d: null,
    fill: fill ? withAlpha(fill, fillOp) : null,
    grad, gradAlpha: fillOp,
    stroke, width: n('stroke-width', 1),
    join: a['stroke-linejoin'] || 'miter', cap: a['stroke-linecap'] || 'butt',
    dash: a['stroke-dasharray'] ? a['stroke-dasharray'].split(/[\s,]+/).map(parseFloat) : null,
  };
}

// Liest einen SVG-Ausschnitt. <g data-part="name"> ... </g> trennt benannte Teile (z. B. drehendes Rohr);
// Rückgabe: { all: [...], parts: { name: [...] }, order: [['main'|name, [...]], ...] } in Zeichenreihenfolge.
export function parseFigure(svg) {
  const order = [];
  let cur = { name: 'main', els: [] };
  order.push(cur);
  const re = /<(\/?)(\w+)([^>]*?)\/?>/g;
  for (const m of svg.matchAll(re)) {
    const [, close, tag, rest] = m;
    if (tag === 'g') {
      if (close) { cur = { name: 'main', els: [] }; order.push(cur); }
      else { cur = { name: attrs(rest)['data-part'] || 'main', els: [] }; order.push(cur); }
      continue;
    }
    if (close) continue;
    const el = element(tag, attrs(rest));
    if (el) cur.els.push(el);
  }
  const groups = order.filter((g) => g.els.length);
  return { groups, all: groups.flatMap((g) => g.els) };
}

// ---------- Zeichnen ----------
function gradientFor(ctx, el) {
  const g = GRADIENTS[el.grad];
  if (!g) return '#000';
  const [x0, y0, x1, y1] = el.box;
  const w = x1 - x0, h = y1 - y0;
  const grad = g.type === 'linear'
    ? ctx.createLinearGradient(x0 + g.x1 * w, y0 + g.y1 * h, x0 + g.x2 * w, y0 + g.y2 * h)
    : ctx.createRadialGradient(x0 + g.cx * w, y0 + g.cy * h, 0, x0 + g.cx * w, y0 + g.cy * h, g.r * Math.max(w, h));
  if (!grad) return withAlpha(g.stops[0][1], el.gradAlpha); // Kontext ohne Verläufe: erste Farbe
  for (const [o, c] of g.stops) grad.addColorStop(o, withAlpha(c, el.gradAlpha));
  return grad;
}

const HAS_PATH2D = typeof Path2D !== 'undefined';

function buildShape(ctx, el) {
  ctx.beginPath();
  const s = el.shape;
  if (!s) { tracePath(ctx, el.cmds); return; }
  if (s[0] === 'circle') ctx.arc(s[1], s[2], s[3], 0, Math.PI * 2);
  else if (s[0] === 'ellipse') ctx.ellipse(s[1], s[2], s[3], s[4], 0, 0, Math.PI * 2);
  else {
    const [, x, y, w, h, r] = s;
    if (r > 0) {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    } else ctx.rect(x, y, w, h);
  }
}

// Zeichnet die Elemente einer Liste (Koordinaten des Entwurfs; Transformation setzt der Aufrufer)
export function drawElements(ctx, els) {
  for (const el of els) {
    let p = null;
    if (HAS_PATH2D && el.d) p = el.path2d || (el.path2d = new Path2D(el.d));
    else buildShape(ctx, el);
    if (el.fill || el.grad) {
      ctx.fillStyle = el.grad ? gradientFor(ctx, el) : el.fill;
      if (p) ctx.fill(p); else ctx.fill();
    }
    if (el.stroke) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = el.width;
      ctx.lineJoin = el.join;
      ctx.lineCap = el.cap;
      if (el.dash) ctx.setLineDash(el.dash);
      if (p) ctx.stroke(p); else ctx.stroke();
      if (el.dash) ctx.setLineDash([]);
    }
  }
}

// Begrenzungsrahmen einer Liste (inkl. halber Strichbreite)
export function boxOf(els) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const el of els) {
    const w = el.stroke ? el.width / 2 : 0;
    x0 = Math.min(x0, el.box[0] - w); y0 = Math.min(y0, el.box[1] - w);
    x1 = Math.max(x1, el.box[2] + w); y1 = Math.max(y1, el.box[3] + w);
  }
  return [x0, y0, x1, y1];
}
