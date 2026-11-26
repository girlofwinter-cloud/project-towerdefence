// Stil 1 "Gemalt und warm": Hintergrund als SVG, portiert aus docs/design/stil1-entwurf.dc.html (Zeilen Z.xx dort).
// buildPaintedScene/buildPaintedSvg sind reine Funktionen (kein DOM), deterministisch je Karte, in Node testbar.
// Gerastert wird im Browser genau einmal je Karte (rasterizePainted), pro Frame nur drawImage (render.js).
// Koordinaten: innen in Entwurfs-Einheiten (Kachel = PAINTED_STYLE.unit = 57), Feld ab (0,0);
// die äußere Gruppe verschiebt um den Rand und skaliert mit TILE / unit auf Spiel-px.
import { TILE, COLS, ROWS, MAPS, FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT, PAINTED_STYLE as P, WATER_STYLE } from './config.js';
import { buildPath } from './path.js';
import { obstacleKind } from './decor.js';
import { riverLine, lakeOutline } from './render-water.js';

const U = P.unit;
const K = TILE / U;            // Entwurfs-px -> Spiel-px
const FW = COLS * U;           // Feldbreite in Entwurfs-px
const FH = ROWS * U;
const MU = FRAME_MARGIN / K;   // Rand in Entwurfs-px
const f = (n) => Math.round(n * 10) / 10;
const cx = (c) => (c + 0.5) * U;
const cy = (r) => (r + 0.5) * U;
const fromGame = (v) => v / K; // Spiel-px -> Entwurfs-px

// Formen aus dem Entwurf (Z.102 Fels, Z.103 Tanne, Z.104 Laubbaum, Z.116 Burgtor, Z.117 Fahne ohne Zahl)
const ROCK = { w: 36, h: 26, svg: '<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(30,20,50,.3)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#a9a08d" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#d6cdb8"/>' };
const PINE = { w: 60, h: 96, svg: '<ellipse cx="36" cy="92" rx="22" ry="5" fill="rgba(20,30,40,.35)"/><rect x="26" y="74" width="9" height="18" fill="#6b4524" stroke="#2b1a10" stroke-width="2.5"/><path d="M30 32 L52 76 H8 Z" fill="#2f7a3d" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M30 14 L48 52 H12 Z" fill="#3d9447" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M30 2 L43 32 H17 Z" fill="#59b254" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M30 6 L22 30 M30 20 L19 50" stroke="#a6dc6a" stroke-width="3" stroke-linecap="round" opacity=".8"/>' };
const ROUND = { w: 72, h: 90, svg: '<ellipse cx="42" cy="86" rx="26" ry="5.5" fill="rgba(20,30,40,.35)"/><path d="M30 86 L32 56 H42 L44 86 Z" fill="#7a4d27" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><circle cx="22" cy="42" r="18" fill="#3a8c3c" stroke="#2b1a10" stroke-width="3"/><circle cx="50" cy="40" r="19" fill="#3a8c3c" stroke="#2b1a10" stroke-width="3"/><circle cx="36" cy="24" r="22" fill="#52a849" stroke="#2b1a10" stroke-width="3"/><path d="M22 22 Q30 10 44 12" stroke="#b6e276" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/><circle cx="28" cy="38" r="3" fill="#d6483a"/><circle cx="52" cy="46" r="3" fill="#d6483a"/>' };
const CASTLE = { w: 104, h: 130, top: -18, left: 10, right: 96, base: 122, svg: '<ellipse cx="54" cy="122" rx="44" ry="8" fill="rgba(20,30,40,.4)"/><path d="M10 122 V50 H30 V36 H40 V50 H58 V122 Z" fill="url(#p-stone)" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M22 122 V90 a14 16 0 0 1 28 0 V122" fill="#33211a" stroke="#2b1a10" stroke-width="3"/><path d="M12 62 H56 M12 78 H20 M40 78 H56" stroke="#6b5a48" stroke-width="2"/><path d="M56 122 V30 H72 V20 H80 V30 H96 V122 Z" fill="url(#p-stone)" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M70 30 L84 -4 L98 30 Z" fill="#c4452f" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><rect x="76" y="48" width="8" height="18" rx="4" fill="#33211a"/><path d="M84 -4 V-18" stroke="#2b1a10" stroke-width="3"/><path d="M84 -18 L104 -12 L84 -6 Z" fill="#3a7bd5" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/>' };
const FLAG = { w: 110, h: 120, top: 0, left: 0, right: 94, base: 117, svg: '<ellipse cx="16" cy="112" rx="18" ry="5" fill="rgba(20,30,40,.4)"/><path d="M16 112 V6" stroke="#2b1a10" stroke-width="9" stroke-linecap="round"/><path d="M16 112 V6" stroke="#a9703d" stroke-width="4" stroke-linecap="round"/><circle cx="16" cy="6" r="6" fill="#f2c14e" stroke="#2b1a10" stroke-width="3"/><path d="M18 14 H92 L80 34 L92 54 H18 Z" fill="#c4452f" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M22 18 H86" stroke="#ea7a5a" stroke-width="3" stroke-linecap="round"/>' };
// Klippen-Plateaus (Z.54–58 oben, Z.60–64 Mitte unten): Umriss im Entwurf, ohne Verschiebung
const CLIFF_TOP = { box: [395, -20, 730, 108], svg: '<path d="M395 -20 H730 V52 Q700 70 640 62 Q560 74 500 60 Q430 70 395 52 Z" fill="#8fc84f" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M395 52 Q430 70 500 60 Q560 74 640 62 Q700 70 730 52 V92 Q690 108 640 98 Q560 110 500 98 Q430 108 395 92 Z" fill="url(#p-cliff)" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M430 66 V92 M480 64 V98 M560 70 V104 M620 66 V96 M690 62 V94" stroke="#5e4331" stroke-width="3" stroke-linecap="round" opacity=".7"/>' };
const CLIFF_LOW = { box: [568, 610, 770, 730], svg: '<path d="M575 628 Q640 610 740 622 Q770 640 760 668 Q720 692 650 688 Q590 692 568 664 Z" fill="#92cc52" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M568 664 Q590 692 650 688 Q720 692 760 668 V706 Q720 730 650 724 Q590 730 568 700 Z" fill="url(#p-cliff)" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M600 692 V716 M650 690 V722 M705 688 V716" stroke="#5e4331" stroke-width="3" stroke-linecap="round" opacity=".7"/>' };
const WOB = 8;
const RING_INSET = 30; // Maske der Rand-Vignette: Feld-Schwarz reicht so weit (Entwurfs-px) in den Rand, Weichzeichnung ~3 sigma // Versatz durch den Wackel-Filter höchstens (scale 14 / 2 + Rand)

// Deterministischer Zufall je Karte (wie geo() im Entwurf, Z.219f)
function rng(mapId) {
  let h = P.seed;
  for (const ch of String(mapId)) h = (h * 31 + ch.charCodeAt(0)) % 2147483647;
  let s = Math.max(1, h);
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const overlap = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

// Figur mit Fußpunkt (x, y) unten mittig, Größe s (wie .w1 im Entwurf: translate(-50%,-100%) scale(s))
function figure(kind, shape, x, y, s) {
  return { kind, x: f(x), y: f(y), s: f(s), box: [x - (shape.w / 2) * s, y - shape.h * s, x + (shape.w / 2) * s, y + 2 * s] };
}

// Wegpunkte in Entwurfs-px; die Enden reichen bis über den Canvas-Rand hinaus
function pathPoints(path) {
  const pts = path.points.map((p) => [fromGame(p.x), fromGame(p.y)]);
  const extend = (a, b) => {
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
    return [a[0] + ((a[0] - b[0]) / d) * (MU + 40), a[1] + ((a[1] - b[1]) / d) * (MU + 40)];
  };
  if (pts.length >= 2) {
    pts[0] = extend(pts[0], pts[1]);
    pts[pts.length - 1] = extend(pts[pts.length - 1], pts[pts.length - 2]);
  }
  return pts;
}

// Seite, an der ein Wegende das Feld verlässt, und der Kantenpunkt (in Entwurfs-px)
function edgeOf(p) {
  const x = fromGame(p.x), y = fromGame(p.y);
  const side = x < 0 ? 'left' : x > FW ? 'right' : y < 0 ? 'top' : 'bottom';
  return { side, x: Math.min(Math.max(x, 0), FW), y: Math.min(Math.max(y, 0), FH) };
}

// Fahne (Eingang) bzw. Burgtor (Ausgang) ganz im Rand neben dem Kantenpunkt
function landmark(kind, shape, s, edge) {
  const w = (shape.right - shape.left) * s;
  let x0; // linke Kante der sichtbaren Form
  let base; // Fußlinie
  if (edge.side === 'left') x0 = -MU + 2;
  else if (edge.side === 'right') x0 = FW + 2;
  else x0 = Math.min(Math.max(edge.x + U * 0.6, -MU), FW + MU - w);
  if (kind === 'castle') base = edge.side === 'left' || edge.side === 'right' ? edge.y + 30 : edge.side === 'top' ? -4 : FH + MU;
  else base = edge.side === 'left' || edge.side === 'right' ? edge.y - 22 : edge.side === 'top' ? -4 : FH + MU;
  const tx = x0 - shape.left * s;
  const ty = base - shape.base * s;
  const box = [x0, ty + shape.top * s, x0 + w, base + 6 * s];
  return { kind, tx: f(tx), ty: f(ty), s, box };
}

// Szene einer Karte: alle Teile mit Lage (Entwurfs-px, Feld ab 0,0) und Begrenzungsrahmen (box).
// state: Spielzustand oder Kartendaten { mapId, path|paths, blocked, obstacles, water }.
export function buildPaintedScene(state) {
  const mapId = state.mapId;
  const map = MAPS[mapId] || {};
  const rnd = rng(mapId);
  const paths = state.paths || (state.path ? [state.path] : []);
  const blocked = state.blocked || new Set();
  const obstacles = state.obstacles || new Set();
  const water = state.water || new Set();
  const scene = { mapId, paths: paths.map(pathPoints), trees: [], rocks: [], flowers: [], cliffs: [], castles: [], flags: [], river: null, lakes: [], bridges: [] };

  // Wasser (Z.66–77): gemalte Form der Karte (paintedWater, die Kacheln folgen ihr); sonst aus den Kacheln wie in render-water.js
  const pw = map.paintedWater;
  if (pw) {
    scene.riverBezier = pw.river;
    if (pw.lake) scene.lakeEllipse = pw.lake;
  } else if (map.river?.length) {
    const line = riverLine(map.river, map.bridges || [], WATER_STYLE.riverWiggle).map(([x, y]) => [fromGame(x), fromGame(y)]);
    if (map.river[0][1] === 0) line.unshift([line[0][0], -MU - 30]);
    scene.river = line;
  }
  if (!pw && map.lake?.length) {
    const discs = map.lake.map(([c, r]) => [(c + 0.5) * TILE, (r + 0.5) * TILE]);
    const lake = { cx: discs.reduce((s, d) => s + d[0], 0) / discs.length, cy: discs.reduce((s, d) => s + d[1], 0) / discs.length, discs };
    scene.lakes.push(P.lakeRadius.map((R) => lakeOutline(lake, R).map(([x, y]) => [fromGame(x), fromGame(y)])));
    if (scene.river) {
      const last = scene.river[scene.river.length - 1];
      let best = null;
      for (const [x, y] of discs.map(([x, y]) => [fromGame(x), fromGame(y)])) if (!best || Math.hypot(x - last[0], y - last[1]) < Math.hypot(best[0] - last[0], best[1] - last[1])) best = [x, y];
      scene.river.push(best);
    }
  }
  for (const [c, r] of map.bridges || []) {
    const horizontal = blocked.has(`${c - 1},${r}`) || blocked.has(`${c + 1},${r}`);
    // Mit gemalter Form: Brücke dort, wo die Flussmitte den Weg kreuzt (innerhalb der Brückenkachel)
    let x = cx(c), y = cy(r);
    if (pw) {
      const pts = riverSamples(pw.river);
      const hit = pts.reduce((b, p) => (Math.abs((horizontal ? p[1] - y : p[0] - x)) < Math.abs((horizontal ? b[1] - y : b[0] - x)) ? p : b));
      if (horizontal) x = Math.min(Math.max(hit[0], c * U), (c + 1) * U); else y = Math.min(Math.max(hit[1], r * U), (r + 1) * U);
    }
    scene.bridges.push({ x, y, horizontal });
  }

  // Burg am Ausgang, Fahne am Eingang, Klippen oben und unten im Rand
  const keep = []; // freie Bahnen im Rand: dort keine Randbäume
  for (const path of paths) {
    const pts = path.points;
    if (pts.length < 2) continue;
    const start = edgeOf(pts[0]);
    const end = edgeOf(pts[pts.length - 1]);
    scene.flags.push(landmark('flag', FLAG, P.flagScale, start));
    scene.castles.push(landmark('castle', CASTLE, P.castleScale, end));
    for (const e of [start, end]) {
      const k = P.keepOut;
      if (e.side === 'left') keep.push([-MU - 50, e.y - k, 0, e.y + k]);
      else if (e.side === 'right') keep.push([FW, e.y - k, FW + MU + 50, e.y + k]);
      else if (e.side === 'top') keep.push([e.x - k, -MU - 50, e.x + k, 0]);
      else keep.push([e.x - k, FH, e.x + k, FH + MU + 50]);
    }
  }
  // Fluss und See: dort keine Randbäume (Sandufer + Abstand)
  const riverPts = scene.riverBezier ? riverSamples(scene.riverBezier) : scene.river || [];
  for (const [x, y] of riverPts) keep.push([x - 50, y - 50, x + 50, y + 50]);
  if (scene.lakeEllipse) {
    const [lx, ly, rx, ry] = scene.lakeEllipse;
    keep.push([lx - rx - 22, ly - ry - 18, lx + rx + 22, ly + ry + 18]);
  }
  const cliffTop = { kind: 'cliffTop', shape: CLIFF_TOP, dx: -71, dy: -CLIFF_TOP.box[3] - WOB };
  const cliffLow = { kind: 'cliffLow', shape: CLIFF_LOW, dx: -71, dy: FH + WOB - CLIFF_LOW.box[1] };
  for (const c of [cliffTop, cliffLow]) {
    const [x0, y0, x1, y1] = c.shape.box;
    c.box = [x0 + c.dx - WOB, y0 + c.dy - WOB, x1 + c.dx + WOB, y1 + c.dy + WOB];
    if (!keep.some((k) => overlap(k, c.box))) scene.cliffs.push(c);
  }
  keep.push(...scene.flags.map((l) => l.box), ...scene.castles.map((l) => l.box), ...scene.cliffs.map((c) => c.box));

  // Rahmenwald nur im Rand (Verteilung wie geo(), Z.219–235): Stamm immer im Rand, Krone höchstens maxOverhang im Feld
  const over = P.maxOverhang * U;
  const tree = (x, y, zone) => {
    const v = rnd(), jx = (rnd() - 0.5) * 22, jy = (rnd() - 0.5) * 16;
    const s = P.treeScale[0] + rnd() * (P.treeScale[1] - P.treeScale[0]);
    const pine = rnd() < P.pineShare;
    if (v >= P.treeChance) return;
    const shape = pine ? PINE : ROUND;
    const hw = (shape.w / 2) * s, h = shape.h * s;
    let px = x + jx, py = y + jy;
    if (zone === 'left') px = Math.min(px, Math.min(-4, over - hw));
    if (zone === 'right') px = Math.max(px, Math.max(FW + 4, FW - over + hw));
    if (zone === 'top') py = Math.min(py, -3 - 2 * s);
    if (zone === 'bottom') py = Math.max(py, FH + 4, FH - over + h);
    const t = figure(pine ? 'pine' : 'round', shape, px, py, s);
    if (keep.some((k) => overlap(k, t.box))) return;
    scene.trees.push(t);
  };
  for (let i = -1; i <= 2 * ROWS + 1; i++) {
    const y = (i / 2) * U + 24;
    tree(i % 2 ? -MU * 0.62 : -MU * 0.34, y, 'left');
    tree(i % 2 ? FW + MU * 0.38 : FW + MU * 0.66, y, 'right');
  }
  for (let c = 0; c < COLS; c++) {
    tree(cx(c), -8, 'top');
    tree(cx(c), FH + MU - 2, 'bottom');
  }

  // Im Feld nur Kleines: Felsen und Bäume auf den Hindernis-Kacheln, Blumen-Tupfen (Z.232) auf freien Kacheln
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${c},${r}`;
      const v = rnd(), jx = (rnd() - 0.5) * 22, jy = (rnd() - 0.5) * 16;
      if (obstacles.has(key)) {
        if (obstacleKind(c, r) === 'rock') scene.rocks.push(figure('rock', ROCK, cx(c), cy(r) + 16, P.obstacleRock));
        else {
          const pine = v < 0.5;
          scene.trees.push(figure(pine ? 'pine' : 'round', pine ? PINE : ROUND, cx(c), cy(r) + 26, P.obstacleTree));
        }
        continue;
      }
      if (blocked.has(key) || water.has(key)) continue;
      if (v < P.flowerChance) scene.flowers.push({ x: f(cx(c) + jx * 1.6), y: f(cy(r) + jy * 2), c, r, colors: [0, 1, 2].map((i) => P.flowers[(i + Math.floor(v * 100)) % P.flowers.length]) });
    }
  }
  // Zeichenreihenfolge nach Fußpunkt (z-index im Entwurf)
  scene.trees.sort((a, b) => a.y - b.y || a.x - b.x);
  return scene;
}

// Bézier-Kette [Start, je 3 Punkte] als Pfad bzw. als dichte Punktliste (Kachelprüfung, Brückenlage)
const bezierD = (b) => `M ${b[0][0]} ${b[0][1]}` + Array.from({ length: (b.length - 1) / 3 }, (_, i) => ` C ${b.slice(1 + 3 * i, 4 + 3 * i).map((p) => `${p[0]} ${p[1]}`).join(' ')}`).join('');
function riverSamples(b, n = 120) {
  const out = [];
  for (let i = 0; i + 3 < b.length; i += 3) {
    const [a, c1, c2, d] = b.slice(i, i + 4);
    for (let k = 0; k <= n; k++) {
      const t = k / n, u = 1 - t;
      out.push([0, 1].map((j) => u * u * u * a[j] + 3 * u * u * t * c1[j] + 3 * u * t * t * c2[j] + t * t * t * d[j]));
    }
  }
  return out;
}

// Liegt der Spiel-Punkt (px im Feld) im gemalten Wasser der Karte? (Fluss: Abstand zur Mitte <= halbe Wasserbreite; See: Ellipse)
export function paintedWaterAt(mapId, gx, gy) {
  const pw = MAPS[mapId]?.paintedWater;
  if (!pw) return false;
  const x = fromGame(gx), y = fromGame(gy);
  if (pw.lake) {
    const [lx, ly, rx, ry] = pw.lake;
    if (((x - lx) / rx) ** 2 + ((y - ly) / ry) ** 2 <= 1) return true;
  }
  const half = P.river[2] / 2;
  return riverSamples(pw.river).some(([px, py]) => Math.hypot(px - x, py - y) <= half);
}

// ---------- SVG ----------
const smoothOpen = (pts) => {
  if (pts.length < 3) return 'M ' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L ');
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q ${f(pts[i][0])} ${f(pts[i][1])} ${f(mx)} ${f(my)}`;
  }
  const l = pts[pts.length - 1];
  return d + ` L ${f(l[0])} ${f(l[1])}`;
};
const smoothClosed = (pts) => {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M ${f(m0[0])} ${f(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q ${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + ' Z';
};
const place = (t, shape) => `<g transform="translate(${f(t.x - (shape.w / 2) * t.s)} ${f(t.y - shape.h * t.s)}) scale(${t.s})">${shape.svg}</g>`;

// Filter und Verläufe (Z.33–48, nur was der Hintergrund braucht); Vignette im Feld höchstens fieldVignette
function defs() {
  return '<defs>'
    // Wackel-Filter im Nutzerraum: schmale Formen (gerader Fluss) würden sonst vom Filterbereich abgeschnitten
    + `<filter id="p-wob" filterUnits="userSpaceOnUse" x="${f(-MU - 40)}" y="${f(-MU - 40)}" width="${f(FW + 2 * MU + 80)}" height="${f(FH + 2 * MU + 80)}"><feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G"/></filter>`
    + '<filter id="p-mot"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.016" numOctaves="4" seed="9"/><feColorMatrix values="0 0 0 0 0.10  0 0 0 0 0.27  0 0 0 0 0.08  1.9 0 0 0 -0.78"/></filter>'
    + '<filter id="p-lit"><feTurbulence type="fractalNoise" baseFrequency="0.014 0.02" numOctaves="4" seed="21"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 0.93  0 0 0 0 0.45  1.8 0 0 0 -0.8"/></filter>'
    + '<filter id="p-grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.05  0 0 0 0.6 -0.2"/></filter>'
    + '<linearGradient id="p-gr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9bd25a"/><stop offset=".55" stop-color="#6aa83f"/><stop offset="1" stop-color="#3f7a35"/></linearGradient>'
    + '<radialGradient id="p-sun" cx="0.1" cy="0.05" r="0.85"><stop offset="0" stop-color="#fff0b0" stop-opacity=".55"/><stop offset=".5" stop-color="#ffd980" stop-opacity=".12"/><stop offset="1" stop-color="#ffd980" stop-opacity="0"/></radialGradient>'
    + `<radialGradient id="p-vig" cx="0.5" cy="0.5" r="0.75"><stop offset=".55" stop-color="#10240f" stop-opacity="0"/><stop offset="1" stop-color="#0c1a1c" stop-opacity="${P.frameVignette}"/></radialGradient>`
    + `<radialGradient id="p-vig-field" cx="0.5" cy="0.5" r="0.72"><stop offset=".5" stop-color="#0c1a1c" stop-opacity="0"/><stop offset="1" stop-color="#0c1a1c" stop-opacity="${P.fieldVignette}"/></radialGradient>`
    // Maske der Rand-Vignette: weiß im Rand, schwarz im Feld, weich über die Feldkante (kein sichtbarer Kasten)
    + `<filter id="p-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="10"/></filter>`
    + `<mask id="p-ring" maskUnits="userSpaceOnUse" x="${f(-MU)}" y="${f(-MU)}" width="${f(FW + 2 * MU)}" height="${f(FH + 2 * MU)}"><rect x="${f(-MU)}" y="${f(-MU)}" width="${f(FW + 2 * MU)}" height="${f(FH + 2 * MU)}" fill="#fff"/><rect x="${-RING_INSET}" y="${-RING_INSET}" width="${FW + 2 * RING_INSET}" height="${FH + 2 * RING_INSET}" fill="#000" filter="url(#p-soft)"/></mask>`
    + '<linearGradient id="p-wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fcbe0"/><stop offset="1" stop-color="#2e86a8"/></linearGradient>'
    + '<linearGradient id="p-cliff" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b98c5c"/><stop offset="1" stop-color="#7a5a45"/></linearGradient>'
    + '<linearGradient id="p-stone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3d2b0"/><stop offset=".6" stop-color="#b9a283"/><stop offset="1" stop-color="#8a7560"/></linearGradient>'
    + '<linearGradient id="p-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c88a4c"/><stop offset="1" stop-color="#8a5326"/></linearGradient>'
    + '</defs>';
}

// Komplettes SVG (Canvas-Größe VIEW_WIDTH x VIEW_HEIGHT, Feld ab FRAME_MARGIN). opts.scene: vorberechnete Szene.
export function buildPaintedSvg(state, opts = {}) {
  const sc = opts.scene || buildPaintedScene(state);
  const all = `x="${f(-MU)}" y="${f(-MU)}" width="${f(FW + 2 * MU)}" height="${f(FH + 2 * MU)}"`;
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${VIEW_WIDTH}" height="${VIEW_HEIGHT}" viewBox="0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}">`);
  out.push(defs());
  out.push(`<g transform="translate(${FRAME_MARGIN} ${FRAME_MARGIN}) scale(${f(K * 10000) / 10000})">`);
  // Boden (Z.50–52)
  out.push(`<rect id="ground" ${all} fill="url(#p-gr)"/>`, `<rect ${all} filter="url(#p-mot)" opacity=".75"/>`, `<rect ${all} filter="url(#p-lit)" opacity=".55"/>`);
  // Klippen-Plateaus im Rand (Z.54–64)
  for (const c of sc.cliffs) out.push(`<g class="cliff" filter="url(#p-wob)"><g transform="translate(${f(c.dx)} ${f(c.dy)})">${c.shape.svg}</g></g>`);
  // Fluss (Z.66–70)
  if (sc.river || sc.riverBezier) {
    const d = sc.riverBezier ? bezierD(sc.riverBezier) : smoothOpen(sc.river);
    const [sand, rim, wat] = P.river;
    out.push(`<g id="river"><path d="${d}" fill="none" stroke="#e8d18a" stroke-width="${sand}" stroke-linecap="round" filter="url(#p-wob)"/>`
      + `<path d="${d}" fill="none" stroke="#2b1a10" stroke-width="${rim}" stroke-linecap="round" filter="url(#p-wob)"/>`
      + `<path d="${d}" fill="none" stroke="url(#p-wat)" stroke-width="${wat}" stroke-linecap="round" filter="url(#p-wob)"/>`
      + `<path d="${d}" fill="none" stroke="#e8fbff" stroke-width="3" stroke-dasharray="26 40" stroke-linecap="round" opacity=".7" transform="translate(-12,0)"/>`
      + `<path d="${d}" fill="none" stroke="#e8fbff" stroke-width="3" stroke-dasharray="14 60" stroke-linecap="round" opacity=".6" transform="translate(12,0)"/></g>`);
  }
  // See (Z.72–77)
  for (const [sand, rim, wat] of sc.lakes) {
    const c = wat.reduce((s, p) => [s[0] + p[0] / wat.length, s[1] + p[1] / wat.length], [0, 0]);
    out.push(`<g id="lake"><g filter="url(#p-wob)"><path d="${smoothClosed(sand)}" fill="#e8d18a" stroke="#2b1a10" stroke-width="4"/>`
      + `<path d="${smoothClosed(rim)}" fill="#2b1a10"/><path d="${smoothClosed(wat)}" fill="url(#p-wat)"/></g>`
      + `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="34" ry="24" fill="none" stroke="#e8fbff" stroke-width="3" stroke-dasharray="30 50" opacity=".6"/>`
      + `<ellipse cx="${f(c[0] - 14)}" cy="${f(c[1] - 30)}" rx="20" ry="7" fill="#fff" opacity=".25"/></g>`);
  }
  if (sc.lakeEllipse) {
    const [lx, ly, rx, ry] = sc.lakeEllipse;
    out.push(`<g id="lake"><g filter="url(#p-wob)"><ellipse cx="${lx}" cy="${ly}" rx="${rx + 22}" ry="${ry + 18}" fill="#e8d18a" stroke="#2b1a10" stroke-width="4"/>`
      + `<ellipse cx="${lx}" cy="${ly}" rx="${rx}" ry="${ry}" fill="url(#p-wat)" stroke="#2b1a10" stroke-width="3"/></g>`
      + `<ellipse cx="${lx - 6}" cy="${ly - 5}" rx="${f(rx * 0.55)}" ry="${f(ry * 0.44)}" fill="none" stroke="#e8fbff" stroke-width="3" stroke-dasharray="30 50" opacity=".6"/>`
      + `<ellipse cx="${lx - 46}" cy="${ly - 25}" rx="40" ry="10" fill="#fff" opacity=".25"/></g>`);
  }
  // Weg, eingesunken (Z.79–87)
  for (const pts of sc.paths) {
    const d = 'M ' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L ');
    out.push(`<g class="path"><g filter="url(#p-wob)">`
      + `<path d="${d}" fill="none" stroke="#3a6a2c" stroke-width="86" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="none" stroke="#2b1a10" stroke-width="72" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="none" stroke="#8f5f34" stroke-width="64" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="none" stroke="#d5a566" stroke-width="54" stroke-linejoin="round" transform="translate(0,-3)"/>`
      + `<path d="${d}" fill="none" stroke="#e8c185" stroke-width="30" stroke-linejoin="round" transform="translate(-2,-4)" opacity=".8"/></g>`
      + `<path d="${d}" fill="none" stroke="#fff2c8" stroke-width="3" stroke-dasharray="2 22" stroke-linecap="round" opacity=".7" transform="translate(0,-8)"/>`
      + `<path d="${d}" fill="none" stroke="#8f5f34" stroke-width="3" stroke-dasharray="2 30" stroke-linecap="round" opacity=".7" transform="translate(0,10)"/></g>`);
  }
  // Brücke (Z.89–94)
  for (const b of sc.bridges) {
    out.push(`<g class="bridge" transform="translate(${f(b.x)} ${f(b.y)})${b.horizontal ? '' : ' rotate(90)'}">`
      + '<rect x="-52" y="-34" width="104" height="68" rx="6" fill="url(#p-wood)" stroke="#2b1a10" stroke-width="4"/>'
      + '<path d="M-52 -22 H52 M-52 -10 H52 M-52 2 H52 M-52 14 H52 M-52 26 H52" stroke="#3b2210" stroke-width="2" opacity=".7"/>'
      + '<rect x="-52" y="-40" width="104" height="9" rx="4" fill="#6d3f1b" stroke="#2b1a10" stroke-width="3"/>'
      + '<rect x="-52" y="31" width="104" height="9" rx="4" fill="#8a5326" stroke="#2b1a10" stroke-width="3"/></g>');
  }
  // Blumen-Tupfen (Z.232): vier Punkte je Tupfen
  for (const fl of sc.flowers) {
    const [a, b, c] = fl.colors;
    out.push(`<g class="flower"><circle cx="${fl.x}" cy="${fl.y}" r="2" fill="${a}"/><circle cx="${f(fl.x + 7)}" cy="${f(fl.y + 3)}" r="2" fill="${b}"/>`
      + `<circle cx="${f(fl.x - 6)}" cy="${f(fl.y + 5)}" r="2" fill="${c}"/><circle cx="${f(fl.x + 3)}" cy="${f(fl.y - 6)}" r="2" fill="${a}"/></g>`);
  }
  // Licht und Vignette (Z.96–98): starke Vignette nur im Rand (Feld ausgespart), im Feld höchstens fieldVignette
  out.push(`<rect ${all} fill="url(#p-sun)"/>`);
  out.push(`<rect id="vignette-field" ${all} fill="url(#p-vig-field)"/>`); // über den ganzen Canvas: keine Kante an der Feldgrenze
  out.push(`<rect id="vignette-frame" ${all} fill="url(#p-vig)" mask="url(#p-ring)"/>`);
  out.push(`<rect ${all} filter="url(#p-grain)" opacity=".18"/>`);
  // Felsen und Bäume (Z.102–104), nach Fußpunkt sortiert
  const figs = [...sc.rocks.map((r) => [r, ROCK]), ...sc.trees.map((t) => [t, t.kind === 'pine' ? PINE : ROUND])].sort((a, b) => a[0].y - b[0].y);
  for (const [t, shape] of figs) out.push(`<g class="${t.kind}">${place(t, shape)}</g>`);
  // Burgtor mit Rauch (Z.116, Z.120f) und Wellenfahne ohne Zahl (Z.117)
  for (const c of sc.castles) {
    out.push(`<g class="castle" transform="translate(${c.tx} ${c.ty}) scale(${c.s})">${CASTLE.svg}`
      + '<circle cx="40" cy="20" r="9" fill="#d9d3c8" stroke="#2b1a10" stroke-width="2" opacity=".7"/><circle cx="46" cy="4" r="7" fill="#e6e0d4" opacity=".5"/></g>');
  }
  for (const fl of sc.flags) out.push(`<g class="flag" transform="translate(${fl.tx} ${fl.ty}) scale(${fl.s})">${FLAG.svg}</g>`);
  out.push('</g></svg>');
  return out.join('');
}

// Entwurfs-px (Feld ab 0,0) -> Spiel-px im Feld (Tests, Kachelprüfung)
export function toGame([x0, y0, x1, y1]) {
  return [x0 * K, y0 * K, x1 * K, y1 * K];
}

// ---------- Rasterung (nur Browser) ----------
// SVG -> Blob -> Image -> decode -> Canvas (VIEW_WIDTH x VIEW_HEIGHT). Liefert null ohne DOM (Node) oder bei Fehler.
export function canRasterize() {
  return typeof Image !== 'undefined' && typeof Blob !== 'undefined' && typeof document !== 'undefined' && typeof URL?.createObjectURL === 'function';
}

export async function rasterizePainted(svg) {
  if (!canRasterize()) return null;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = VIEW_WIDTH;
    cv.height = VIEW_HEIGHT;
    cv.getContext('2d').drawImage(img, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    return cv;
  } finally {
    URL.revokeObjectURL(url);
  }
}
