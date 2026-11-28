// Stil 1 "Gemalt und warm": Hintergrund als SVG, portiert aus docs/design/stil1-entwurf.dc.html (Zeilen Z.xx dort).
// buildPaintedScene/buildPaintedSvg sind reine Funktionen (kein DOM), deterministisch je Karte, in Node testbar.
// Gerastert wird im Browser einmal je Karte und Anzeigemaßstab (rasterizePainted), pro Frame nur drawImage (render.js).
// Koordinaten: innen in Entwurfs-Einheiten (Kachel = PAINTED_STYLE.unit = 57), Feld ab (0,0);
// die äußere Gruppe verschiebt um den Rand und skaliert mit TILE / unit auf Spiel-px.
import { TILE, COLS, ROWS, MAPS, FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT, PAINTED_STYLE as P, PAINTED_PALETTE, WATER_STYLE, themed } from './config.js';
import { buildPath } from './path.js';
import { obstacleKind } from './decor.js';
import { riverLine, lakeOutline } from './render-water.js';
import { lavaGeometry, poolOutline } from './render-lava.js';
import { nightmareOf } from './nm-maps/index.js';

// Plan G9: Palette einer Karte (Wiese = Basis, andere Karten über theme.painted)
// B-194: Albtraum-Look (look 'nightmare', auch Nacht-Look B-185): darüber flach nightmareOf(mapId).painted (src/nm-maps/<id>.js)
export const paletteFor = (mapId, look = 'normal') => {
  const base = themed(mapId, 'painted', PAINTED_PALETTE);
  const nm = look === 'nightmare' ? nightmareOf(mapId).painted : null;
  return nm ? { ...base, ...nm } : base;
};

const U = P.unit;
const K = TILE / U;            // Entwurfs-px -> Spiel-px
const FW = COLS * U;           // Feldbreite in Entwurfs-px
const FH = ROWS * U;
const MU = FRAME_MARGIN / K;   // Rand in Entwurfs-px
const f = (n) => Math.round(n * 10) / 10;
const cx = (c) => (c + 0.5) * U;
const cy = (r) => (r + 0.5) * U;
const fromGame = (v) => v / K; // Spiel-px -> Entwurfs-px

// Formen aus dem Entwurf (Z.102 Fels, Z.103 Tanne, Z.104 Laubbaum, Z.116 Burgtor, Z.117 Fahne ohne Zahl).
// Maße fest (Szene, Tests), Farben aus der Palette der Karte (svg(c)).
const OL = '#2b1a10'; // Kontur
// Schneekappe auf einer Tannenstufe (Spitze ax/ay, Grundlinie b, halbe Breite hw), Tiefe d
function snowCap(c, ax, ay, b, hw, d) {
  const w = (hw * d) / (b - ay), y = ay + d;
  return `<path d="M${ax} ${ay} L${f(ax + w)} ${f(y)} Q${f(ax + w / 2)} ${f(y - 4)} ${ax} ${f(y + 1)} Q${f(ax - w / 2)} ${f(y - 4)} ${f(ax - w)} ${f(y)} Z" fill="${c.snow}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`;
}
const ROCK = { w: 36, h: 26, svg: (c) => `<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(30,20,50,.3)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="${c.rock[0]}" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="${c.rock[1]}"/>`
  + (c.snow ? `<path d="M6 11 L16 3 L28 6 L31 13 Q25 10 20 13 Q14 10 6 14 Z" fill="${c.snow}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>` : '') };
const PINE = { w: 60, h: 96, svg: (c) => `<ellipse cx="36" cy="92" rx="22" ry="5" fill="rgba(20,30,40,.35)"/><rect x="26" y="74" width="9" height="18" fill="${c.trunk[0]}" stroke="${OL}" stroke-width="2.5"/>`
  + `<path d="M30 32 L52 76 H8 Z" fill="${c.pine[0]}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>${c.snow ? snowCap(c, 30, 32, 76, 22, 22) : ''}`
  + `<path d="M30 14 L48 52 H12 Z" fill="${c.pine[1]}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>${c.snow ? snowCap(c, 30, 14, 52, 18, 25) : ''}`
  + `<path d="M30 2 L43 32 H17 Z" fill="${c.pine[2]}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>`
  + (c.snow ? snowCap(c, 30, 2, 32, 13, 14) : `<path d="M30 6 L22 30 M30 20 L19 50" stroke="${c.pine[3]}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`) };
const ROUND = { w: 72, h: 90, svg: (c) => `<ellipse cx="42" cy="86" rx="26" ry="5.5" fill="rgba(20,30,40,.35)"/><path d="M30 86 L32 56 H42 L44 86 Z" fill="${c.trunk[1]}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><circle cx="22" cy="42" r="18" fill="${c.round[0]}" stroke="${OL}" stroke-width="3"/><circle cx="50" cy="40" r="19" fill="${c.round[0]}" stroke="${OL}" stroke-width="3"/><circle cx="36" cy="24" r="22" fill="${c.round[1]}" stroke="${OL}" stroke-width="3"/><path d="M22 22 Q30 10 44 12" stroke="${c.round[2]}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>`
  + (c.fruit ? `<circle cx="28" cy="38" r="3" fill="${c.fruit}"/><circle cx="52" cy="46" r="3" fill="${c.fruit}"/>` : '') };
// Kahler Baum (Vulkan): Stamm und Äste, gleiche Maße wie der Laubbaum
const BARE_BRANCHES = 'M37 58 V22 M37 46 L22 32 L16 18 M22 32 L11 30 M37 38 L52 26 L57 12 M52 26 L63 27 M37 22 L31 8 M37 22 L44 9';
const BARE = { w: 72, h: 90, svg: (c) => `<ellipse cx="42" cy="86" rx="24" ry="5" fill="rgba(20,10,10,.4)"/><path d="M30 86 L33 54 H41 L44 86 Z" fill="${c.trunk[1]}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>`
  + `<path d="${BARE_BRANCHES}" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  + `<path d="${BARE_BRANCHES}" stroke="${c.trunk[1]}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  + `<path d="M35 70 V60" stroke="${c.pine[3]}" stroke-width="2" stroke-linecap="round" opacity=".7"/>` };
const TREE_SHAPES = { pine: PINE, round: ROUND, bare: BARE };
// B-194: Form nach Name, im Albtraum zuerst aus den Formen der Karte (nm-maps/<id>.js shapes)
const shapeOf = (kind, nm) => nm?.shapes?.[kind] ?? TREE_SHAPES[kind] ?? (kind === 'rock' ? ROCK : PINE);
const pick = (list, v) => list[Math.min(list.length - 1, Math.floor(v * list.length))];
const CASTLE = { w: 104, h: 130, top: -18, left: 10, right: 96, base: 122, svg: '<ellipse cx="54" cy="122" rx="44" ry="8" fill="rgba(20,30,40,.4)"/><path d="M10 122 V50 H30 V36 H40 V50 H58 V122 Z" fill="url(#p-stone)" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M22 122 V90 a14 16 0 0 1 28 0 V122" fill="#33211a" stroke="#2b1a10" stroke-width="3"/><path d="M12 62 H56 M12 78 H20 M40 78 H56" stroke="#6b5a48" stroke-width="2"/><path d="M56 122 V30 H72 V20 H80 V30 H96 V122 Z" fill="url(#p-stone)" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M70 30 L84 -4 L98 30 Z" fill="#c4452f" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><rect x="76" y="48" width="8" height="18" rx="4" fill="#33211a"/><path d="M84 -4 V-18" stroke="#2b1a10" stroke-width="3"/><path d="M84 -18 L104 -12 L84 -6 Z" fill="#3a7bd5" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/>' };
// parts: Tuch und Mast samt Kontur (für die gesperrten Fahnen-Kacheln im Feld)
const FLAG = { w: 110, h: 120, top: 0, left: 0, right: 94, base: 117, parts: [[16, 12, 94, 56], [7.5, -3, 24.5, 116.5]], svg: '<ellipse cx="16" cy="112" rx="18" ry="5" fill="rgba(20,30,40,.4)"/><path d="M16 112 V6" stroke="#2b1a10" stroke-width="9" stroke-linecap="round"/><path d="M16 112 V6" stroke="#a9703d" stroke-width="4" stroke-linecap="round"/><circle cx="16" cy="6" r="6" fill="#f2c14e" stroke="#2b1a10" stroke-width="3"/><path d="M18 14 H92 L80 34 L92 54 H18 Z" fill="#c4452f" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M22 18 H86" stroke="#ea7a5a" stroke-width="3" stroke-linecap="round"/>' };
// Klippen-Plateaus (Z.54–58 oben, Z.60–64 Mitte unten): Umriss im Entwurf, ohne Verschiebung; Farben: Plateau, Wand (p-cliff), Rillen
const CLIFF_TOP = { box: [395, -20, 730, 108], svg: (c) => `<path d="M395 -20 H730 V52 Q700 70 640 62 Q560 74 500 60 Q430 70 395 52 Z" fill="${c.cliff[0]}" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><path d="M395 52 Q430 70 500 60 Q560 74 640 62 Q700 70 730 52 V92 Q690 108 640 98 Q560 110 500 98 Q430 108 395 92 Z" fill="url(#p-cliff)" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><path d="M430 66 V92 M480 64 V98 M560 70 V104 M620 66 V96 M690 62 V94" stroke="${c.cliff[4]}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` };
const CLIFF_LOW = { box: [568, 610, 770, 730], svg: (c) => `<path d="M575 628 Q640 610 740 622 Q770 640 760 668 Q720 692 650 688 Q590 692 568 664 Z" fill="${c.cliff[1]}" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><path d="M568 664 Q590 692 650 688 Q720 692 760 668 V706 Q720 730 650 724 Q590 730 568 700 Z" fill="url(#p-cliff)" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><path d="M600 692 V716 M650 690 V722 M705 688 V716" stroke="${c.cliff[4]}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` };
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

// Fahne (Eingang) bzw. Burgtor (Ausgang) im Rand neben dem Kantenpunkt (die Fahne ragt mit dem Tuch ins Feld).
// below: Fahne an einem seitlichen Eingang unter statt über dem Weg
function landmark(kind, shape, s, edge, below = false) {
  const side = edge.side === 'left' || edge.side === 'right';
  let base; // Fußlinie
  if (kind === 'castle') base = side ? edge.y + 30 : edge.side === 'top' ? -4 : FH + MU;
  else base = side ? edge.y - P.flagLift : edge.side === 'top' ? -4 : FH + MU;
  // Unter dem Weg: Spitze flagLift unter der Wegmitte
  if (kind === 'flag' && side && below) base = edge.y + P.flagLift + (shape.base - shape.top) * s;
  const w = (shape.right - shape.left) * s;
  let x0; // linke Kante der sichtbaren Form
  if (edge.side === 'left') x0 = -MU + 2;
  else if (edge.side === 'right') x0 = FW + 2;
  else x0 = Math.min(Math.max(edge.x + U * 0.6, -MU), FW + MU - w);
  const tx = x0 - shape.left * s;
  const ty = base - shape.base * s;
  const box = [x0, ty + shape.top * s, x0 + w, base + 6 * s];
  return { kind, tx: f(tx), ty: f(ty), s, box };
}

// Gezeichnete Teile der Fahne (Tuch und Mast samt Kontur) als Rechtecke in Entwurfs-px; ohne Schatten
function flagParts(fl) {
  const at = ([x0, y0, x1, y1]) => [fl.tx + x0 * fl.s, fl.ty + y0 * fl.s, fl.tx + x1 * fl.s, fl.ty + y1 * fl.s];
  return FLAG.parts.map(at);
}

// Fahne am Eingang: über oder unter dem Weg, je nachdem, wo das Tuch weniger Bauplätze verdeckt (gleich viele: oben).
// Oben nur, wenn sie dort mit Abstand flagTopGap zur Canvas-Oberkante passt (Zwei Fronten: Eingang in Zeile 1).
// free(c, r): Kachel wäre ohne Fahne bebaubar
function flagAt(edge, free) {
  const above = landmark('flag', FLAG, P.flagScale, edge);
  const below = landmark('flag', FLAG, P.flagScale, edge, true);
  if (edge.side !== 'left' && edge.side !== 'right') return above;
  const cost = (fl) => flagTilesOf({ flags: [fl] }).filter(([c, r]) => free(c, r)).length;
  const fits = above.box[1] >= -MU + P.flagTopGap;
  return fits && cost(above) <= cost(below) ? above : below;
}

// Feldkacheln, die eine Fahne überdeckt (dort kann man nicht bauen; MAPS.<id>.flagTiles muss dazu passen, Test)
export function flagTilesOf(scene) {
  const out = new Set();
  for (const fl of scene.flags) {
    for (const [x0, y0, x1, y1] of flagParts(fl)) {
      for (let r = Math.max(0, Math.floor(y0 / U)); r <= Math.min(ROWS - 1, Math.floor(y1 / U)); r++) {
        for (let c = Math.max(0, Math.floor(x0 / U)); c <= Math.min(COLS - 1, Math.floor(x1 / U)); c++) {
          if (Math.min(x1, (c + 1) * U) > Math.max(x0, c * U) && Math.min(y1, (r + 1) * U) > Math.max(y0, r * U)) out.add(`${c},${r}`);
        }
      }
    }
  }
  return [...out].map((k) => k.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

// Szene einer Karte: alle Teile mit Lage (Entwurfs-px, Feld ab 0,0) und Begrenzungsrahmen (box).
// state: Spielzustand oder Kartendaten { mapId, path|paths, blocked, obstacles, water }.
// look: 'normal' oder 'nightmare' (B-194: Albtraum-Palette und -Rand-Deko aus src/nm-maps/<id>.js)
export function buildPaintedScene(state, look = 'normal') {
  const mapId = state.mapId;
  const nm = look === 'nightmare' ? nightmareOf(mapId) : null;
  const map = MAPS[mapId] || {};
  const rnd = rng(mapId);
  const paths = state.paths || (state.path ? [state.path] : []);
  const blocked = state.blocked || new Set();
  const obstacles = state.obstacles || new Set();
  const flagTiles = state.flagTiles || new Set(); // Fahnen-Kacheln: dort keine Tupfen (Fahne steht darüber)
  const water = state.water || new Set();
  const lavaTiles = state.lava || new Set();
  const pal = paletteFor(mapId, look);
  const scene = { mapId, look, eyes: [], paths: paths.map(pathPoints), trees: [], rocks: [], flowers: [], cliffs: [], castles: [], flags: [], river: null, lakes: [], bridges: [], lava: null };

  // Lava (Plan G9): aus den Lavakacheln der Karte (Geometrie wie render-lava.js), Enden bis über den Canvas-Rand
  const lg = pal.lava ? lavaGeometry(mapId, blocked) : null;
  if (lg) {
    const river = lg.river.map(([x, y]) => [fromGame(x), fromGame(y)]);
    if (river.length) {
      if (river[0][1] < 0) river[0][1] = -MU - 30;
      if (river.at(-1)[1] > FH) river.at(-1)[1] = FH + MU + 30;
    }
    const pools = lg.pools.map((p) => P.lavaPool.map((R) => poolOutline(p, R).map(([x, y]) => [fromGame(x), fromGame(y)])));
    const plates = [];
    river.slice(1, -1).forEach(([x, y], i) => { if (i % 3 === 1) plates.push({ x: f(x + (rnd() - 0.5) * 12), y: f(y + (rnd() - 0.5) * 16), rot: Math.round(rnd() * 180) }); });
    scene.lava = { river, pools, plates };
  }

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
  const keep = [...(nm?.reserve || [])]; // freie Bahnen im Rand: dort keine Randbäume (B-199: reserve = Rand-Lava der Karte)
  for (const path of paths) {
    const pts = path.points;
    if (pts.length < 2) continue;
    const start = edgeOf(pts[0]);
    const end = edgeOf(pts[pts.length - 1]);
    scene.flags.push(flagAt(start, (c, r) => ![blocked, obstacles, water, lavaTiles].some((set) => set.has(`${c},${r}`))));
    // Mehrere Wege mit gemeinsamem Ausgang (Zangenangriff, Zwei Fronten): eine Burg
    const castle = landmark('castle', CASTLE, P.castleScale, end);
    if (!scene.castles.some((c) => c.tx === castle.tx && c.ty === castle.ty)) scene.castles.push(castle);
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
  if (scene.lava) {
    for (const [x, y] of riverSamplesOf(scene.lava.river)) keep.push([x - 44, y - 44, x + 44, y + 44]);
    for (const [glow] of scene.lava.pools) keep.push(bounds(glow));
  }
  if (scene.lakeEllipse) {
    const [lx, ly, rx, ry] = scene.lakeEllipse;
    keep.push([lx - rx - 22, ly - ry - 18, lx + rx + 22, ly + ry + 18]);
  }
  const cliffTop = { kind: 'cliffTop', shape: CLIFF_TOP, dx: -71, dy: -CLIFF_TOP.box[3] - WOB };
  const cliffLow = { kind: 'cliffLow', shape: CLIFF_LOW, dx: -71, dy: FH + WOB - CLIFF_LOW.box[1] };
  for (const c of [cliffTop, cliffLow]) {
    const [x0, y0, x1, y1] = c.shape.box;
    c.box = [x0 + c.dx - WOB, y0 + c.dy - WOB, x1 + c.dx + WOB, y1 + c.dy + WOB];
    if (!nm?.noCliffs && !keep.some((k) => overlap(k, c.box))) scene.cliffs.push(c);
  }
  keep.push(...scene.flags.map((l) => l.box), ...scene.castles.map((l) => l.box), ...scene.cliffs.map((c) => c.box));

  // Rahmenwald nur im Rand (Verteilung wie geo(), Z.219–235): Stamm immer im Rand, Krone höchstens maxOverhang im Feld
  const over = P.maxOverhang * U;
  const tree = (x, y, zone) => {
    const v = rnd(), jx = (rnd() - 0.5) * 22, jy = (rnd() - 0.5) * 16;
    const s = P.treeScale[0] + rnd() * (P.treeScale[1] - P.treeScale[0]);
    const pine = rnd() < pal.pineShare;
    if (v >= P.treeChance) return;
    const big = nm?.frame?.big;
    const kind = big?.length ? pick(big, v / P.treeChance) : pine ? 'pine' : pal.leafy;
    const shape = shapeOf(kind, nm);
    const hw = (shape.w / 2) * s, h = shape.h * s;
    let px = x + jx, py = y + jy;
    if (zone === 'left') px = Math.min(px, Math.min(-4, over - hw));
    if (zone === 'right') px = Math.max(px, Math.max(FW + 4, FW - over + hw));
    if (zone === 'top') py = Math.min(py, -3 - 2 * s);
    if (zone === 'bottom') py = Math.max(py, FH + 4, FH - over + h);
    const t = figure(kind, shape, px, py, s);
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
  if (nm?.frame?.small?.length) smallFrame(scene, nm, keep);

  // Im Feld nur Kleines: Felsen und Bäume auf den Hindernis-Kacheln, Blumen-Tupfen (Z.232) auf freien Kacheln
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${c},${r}`;
      const v = rnd(), jx = (rnd() - 0.5) * 22, jy = (rnd() - 0.5) * 16;
      if (obstacles.has(key)) {
        if (obstacleKind(c, r) === 'rock') {
          const kind = nm?.obstacle?.rock ?? 'rock';
          scene.rocks.push(figure(kind, shapeOf(kind, nm), cx(c), cy(r) + 16, P.obstacleRock));
        } else {
          // Albtraum ohne eigene Form: Tanne nur auf reinen Tannenkarten
          const kind = nm?.obstacle?.tree ?? (v < Math.max(nm ? 1 : 0.5, pal.pineShare) ? 'pine' : pal.leafy);
          scene.trees.push(figure(kind, shapeOf(kind, nm), cx(c), cy(r) + 26, P.obstacleTree));
        }
        continue;
      }
      if (blocked.has(key) || water.has(key) || lavaTiles.has(key) || flagTiles.has(key)) continue;
      // Tupfen der Karte (Blumen, Eiskristalle, Laub, Glut) nur auf freien Kacheln
      if (v < pal.dotChance) scene.flowers.push({ kind: pal.dotKind, x: f(cx(c) + jx * 1.6), y: f(cy(r) + jy * 2), c, r, colors: [0, 1, 2].map((i) => pal.dots[(i + Math.floor(v * 100)) % pal.dots.length]) });
    }
  }
  // Zeichenreihenfolge nach Fußpunkt (z-index im Entwurf)
  scene.trees.sort((a, b) => a.y - b.y || a.x - b.x);
  // B-194: Augen der Rand-Deko (Spiel-px, Feld ab 0,0) für die Bewegungsschicht (blink)
  if (nm) {
    for (const t of [...scene.trees, ...scene.rocks]) {
      const sh = shapeOf(t.kind, nm);
      for (const [ex, ey] of sh.eyes || []) scene.eyes.push({ x: f((t.x + (ex - sh.w / 2) * t.s) * K), y: f((t.y + (ey - sh.h) * t.s) * K) });
    }
  }
  return scene;
}

// B-194: Reihe 1 der Albtraum-Rand-Deko (innen im Canvas-Rand): kleine Formen aus frame.small, Fuß NM_FRAME.small.foot
// Spiel-px vor der Feldkante, höchstens NM_FRAME.small.maxH hoch, Überhang ins Feld höchstens maxOverhang.
// Lage aus hash01 (je Karte fest), damit der Rahmenwald gleich bleibt.
function smallFrame(scene, nm, keep) {
  const S = P.nmSmall, over = P.maxOverhang * U, list = nm.frame.small;
  const add = (i, x, y, zone) => {
    const r = (k) => hash01(scene.mapId, 500 + i * 7 + k, zone.length);
    if (r(0) >= S.chance) return;
    const kind = pick(list, r(1)), shape = shapeOf(kind, nm);
    const s = Math.min(1, fromGame(S.maxH) / shape.h);
    const hw = (shape.w / 2) * s, h = shape.h * s;
    const d = fromGame(S.foot[0] + r(2) * (S.foot[1] - S.foot[0]));
    let px = x, py = y;
    if (zone === 'left') px = Math.min(-d, over - hw);
    if (zone === 'right') px = Math.max(FW + d, FW - over + hw);
    if (zone === 'top') py = Math.min(-d, -2 * s);
    if (zone === 'bottom') py = Math.max(FH + d, FH - over + h);
    const t = figure(kind, shape, px, py, s);
    if (keep.some((k) => overlap(k, t.box))) return;
    scene.trees.push(t);
  };
  for (let i = 0; i <= 2 * ROWS; i++) {
    const y = (i / 2) * U + U / 2;
    add(i, 0, y, 'left');
    add(i, 0, y, 'right');
  }
  for (let c = 0; c < 2 * COLS; c++) {
    add(c, (c / 2) * U + U / 4, 0, 'top');
    add(c, (c / 2) * U + U / 4, 0, 'bottom');
  }
}

// Bézier-Kette [Start, je 3 Punkte] als Pfad bzw. als dichte Punktliste (Kachelprüfung, Brückenlage)
const bezierD = (b) => `M ${b[0][0]} ${b[0][1]}` + Array.from({ length: (b.length - 1) / 3 }, (_, i) => ` C ${b.slice(1 + 3 * i, 4 + 3 * i).map((p) => `${p[0]} ${p[1]}`).join(' ')}`).join('');
// Polylinie (Entwurfs-px) dicht abgetastet, für Freiräume im Rand
function riverSamplesOf(pts, step = 20) {
  const out = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  if (pts.length) out.push(pts.at(-1));
  return out;
}
const bounds = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
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
const place = (t, shape, c) => `<g transform="translate(${f(t.x - (shape.w / 2) * t.s)} ${f(t.y - shape.h * t.s)}) scale(${t.s})">${shape.svg(c)}</g>`;

// Tupfen im Feld je Art (Z.232: vier Punkte je Blumen-Tupfen); alle klein, Mitte (x, y)
const DOTS = {
  flower: ({ x, y, colors: [a, b, c] }) => `<g class="flower"><circle cx="${x}" cy="${y}" r="2" fill="${a}"/><circle cx="${f(x + 7)}" cy="${f(y + 3)}" r="2" fill="${b}"/>`
    + `<circle cx="${f(x - 6)}" cy="${f(y + 5)}" r="2" fill="${c}"/><circle cx="${f(x + 3)}" cy="${f(y - 6)}" r="2" fill="${a}"/></g>`,
  // Eiskristall: kleine Raute mit Glanzpunkten
  crystal: ({ x, y, colors: [a, b, c] }) => `<g class="dot-crystal"><path d="M${x} ${f(y - 8)} L${f(x + 4)} ${y} L${x} ${f(y + 4)} L${f(x - 4)} ${y} Z" fill="${c}" stroke="#2f4560" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<path d="M${x} ${f(y - 6)} L${f(x + 2)} ${y} L${x} ${f(y + 1)} Z" fill="${a}"/><circle cx="${f(x + 9)}" cy="${f(y + 3)}" r="1.8" fill="${b}"/><circle cx="${f(x - 8)}" cy="${f(y + 5)}" r="1.5" fill="${a}"/></g>`,
  // Laub: drei kleine Blätter
  leaf: ({ x, y, colors: [a, b, c] }) => `<g class="dot-leaf"><ellipse cx="${x}" cy="${y}" rx="4.5" ry="2.2" fill="${a}" transform="rotate(-30 ${x} ${y})"/>`
    + `<ellipse cx="${f(x + 8)}" cy="${f(y + 4)}" rx="4" ry="2" fill="${b}" transform="rotate(25 ${f(x + 8)} ${f(y + 4)})"/><ellipse cx="${f(x - 6)}" cy="${f(y + 6)}" rx="3.5" ry="1.8" fill="${c}" transform="rotate(70 ${f(x - 6)} ${f(y + 6)})"/></g>`,
  // Glut: schwach leuchtender Punkt mit Asche daneben
  ember: ({ x, y, colors: [a, b, c] }) => `<g class="dot-ember"><circle cx="${x}" cy="${y}" r="5" fill="${b}" opacity=".25"/><circle cx="${x}" cy="${y}" r="2" fill="${a}"/>`
    + `<circle cx="${f(x + 8)}" cy="${f(y + 4)}" r="1.6" fill="${a}" opacity=".8"/><circle cx="${f(x - 7)}" cy="${f(y + 5)}" r="2.2" fill="${c}"/></g>`,
};

// Filter und Verläufe (Z.33–48, nur was der Hintergrund braucht); Vignette im Feld höchstens fieldVignette
// box: gemalte Fläche (Canvas plus Seitenzonen) in Entwurfs-px. Verläufe liegen im Nutzerraum auf dem Canvas-Rechteck
// (wie objectBoundingBox des Canvas), damit Seitenzonen sie nahtlos fortsetzen, ohne das Bild im Canvas zu ändern.
const ON_CANVAS = `gradientUnits="userSpaceOnUse" gradientTransform="translate(${f(-MU)} ${f(-MU)}) scale(${f(FW + 2 * MU)} ${f(FH + 2 * MU)})"`;
function defs(c, box, extra = '') {
  return '<defs>'
    // Wackel-Filter im Nutzerraum: schmale Formen (gerader Fluss) würden sonst vom Filterbereich abgeschnitten
    + `<filter id="p-wob" filterUnits="userSpaceOnUse" x="${f(box.x - 40)}" y="${f(box.y - 40)}" width="${f(box.w + 80)}" height="${f(box.h + 80)}"><feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G"/></filter>`
    + `<filter id="p-mot"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.016" numOctaves="4" seed="9"/><feColorMatrix values="0 0 0 0 ${c.mottle[0]}  0 0 0 0 ${c.mottle[1]}  0 0 0 0 ${c.mottle[2]}  1.9 0 0 0 -0.78"/></filter>`
    + `<filter id="p-lit"><feTurbulence type="fractalNoise" baseFrequency="0.014 0.02" numOctaves="4" seed="21"/><feColorMatrix values="0 0 0 0 ${c.lit[0]}  0 0 0 0 ${c.lit[1]}  0 0 0 0 ${c.lit[2]}  1.8 0 0 0 -0.8"/></filter>`
    + '<filter id="p-grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.05  0 0 0 0.6 -0.2"/></filter>'
    + `<linearGradient id="p-gr" ${ON_CANVAS} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.ground[0]}"/><stop offset=".55" stop-color="${c.ground[1]}"/><stop offset="1" stop-color="${c.ground[2]}"/></linearGradient>`
    + `<radialGradient id="p-sun" ${ON_CANVAS} cx="0.1" cy="0.05" r="0.85"><stop offset="0" stop-color="${c.sun[0]}" stop-opacity=".55"/><stop offset=".5" stop-color="${c.sun[1]}" stop-opacity=".12"/><stop offset="1" stop-color="${c.sun[1]}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="p-vig" ${ON_CANVAS} cx="0.5" cy="0.5" r="0.75"><stop offset=".55" stop-color="${c.vignette}" stop-opacity="0"/><stop offset="1" stop-color="${c.vignette}" stop-opacity="${P.frameVignette}"/></radialGradient>`
    + `<radialGradient id="p-vig-field" ${ON_CANVAS} cx="0.5" cy="0.5" r="0.72"><stop offset=".5" stop-color="${c.vignette}" stop-opacity="0"/><stop offset="1" stop-color="${c.vignette}" stop-opacity="${P.fieldVignette}"/></radialGradient>`
    // Maske der Rand-Vignette: weiß im Rand, schwarz im Feld, weich über die Feldkante (kein sichtbarer Kasten)
    + `<filter id="p-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="10"/></filter>`
    + `<mask id="p-ring" maskUnits="userSpaceOnUse" x="${f(box.x)}" y="${f(box.y)}" width="${f(box.w)}" height="${f(box.h)}"><rect x="${f(box.x)}" y="${f(box.y)}" width="${f(box.w)}" height="${f(box.h)}" fill="#fff"/><rect x="${-RING_INSET}" y="${-RING_INSET}" width="${FW + 2 * RING_INSET}" height="${FH + 2 * RING_INSET}" fill="#000" filter="url(#p-soft)"/></mask>`
    + '<linearGradient id="p-wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fcbe0"/><stop offset="1" stop-color="#2e86a8"/></linearGradient>'
    + `<linearGradient id="p-cliff" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.cliff[2]}"/><stop offset="1" stop-color="${c.cliff[3]}"/></linearGradient>`
    + `<linearGradient id="p-stone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.stone[0]}"/><stop offset=".6" stop-color="${c.stone[1]}"/><stop offset="1" stop-color="${c.stone[2]}"/></linearGradient>`
    + `<linearGradient id="p-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.bridge[0]}"/><stop offset="1" stop-color="${c.bridge[1]}"/></linearGradient>`
    + (extra || '') + '</defs>';
}

// Komplettes SVG (Canvas-Größe VIEW_WIDTH x VIEW_HEIGHT, Feld ab FRAME_MARGIN). opts.scene: vorberechnete Szene.
// opts.ext = { l, t, r, b }: Seitenzonen in Spiel-px (C-Abnahme 1). Das Bild reicht dann so weit über den Canvas hinaus,
// gleiche Malerei: Boden, Licht und Vignette laufen weiter, Wege und Flüsse bis zum Bildrand, dichter Wald.
// Der Canvas-Ausschnitt bleibt gleich (bis auf Bäume, die vorher an der Canvas-Kante abgeschnitten waren).
export function buildPaintedSvg(state, opts = {}) {
  const look = opts.scene?.look ?? opts.look ?? 'normal';
  const sc = opts.scene || buildPaintedScene(state, look);
  const nm = look === 'nightmare' ? nightmareOf(sc.mapId) : null;
  const c = paletteFor(sc.mapId, look);
  const ex = extentOf(opts.ext);
  const box = { x: -MU - ex.l / K, y: -MU - ex.t / K, w: FW + 2 * MU + (ex.l + ex.r) / K, h: FH + 2 * MU + (ex.t + ex.b) / K };
  const all = `x="${f(box.x)}" y="${f(box.y)}" width="${f(box.w)}" height="${f(box.h)}"`;
  const extended = ex.l + ex.t + ex.r + ex.b > 0;
  const far = Math.max(ex.l, ex.t, ex.r, ex.b) / K + 60; // so weit laufen Wege und Flüsse über den Canvas hinaus
  const reach = (pts) => (extended ? extendEnds(pts, far) : pts);
  const out = [];
  if (extended) {
    const vw = VIEW_WIDTH + ex.l + ex.r, vh = VIEW_HEIGHT + ex.t + ex.b;
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${f(vw)}" height="${f(vh)}" viewBox="${f(-ex.l)} ${f(-ex.t)} ${f(vw)} ${f(vh)}" preserveAspectRatio="none">`);
  } else out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${VIEW_WIDTH}" height="${VIEW_HEIGHT}" viewBox="0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}">`);
  out.push(defs(c, box, nm?.defs));
  out.push(`<g transform="translate(${FRAME_MARGIN} ${FRAME_MARGIN}) scale(${f(K * 10000) / 10000})">`);
  // Boden (Z.50–52)
  out.push(`<rect id="ground" ${all} fill="url(#p-gr)"/>`, `<rect ${all} filter="url(#p-mot)" opacity="${c.mottleOpacity}"/>`, `<rect ${all} filter="url(#p-lit)" opacity="${c.litOpacity}"/>`);
  if (nm?.svgUnder) out.push(nm.svgUnder(sc, c));
  // Klippen-Plateaus im Rand (Z.54–64)
  for (const cl of sc.cliffs) out.push(`<g class="cliff" filter="url(#p-wob)"><g transform="translate(${f(cl.dx)} ${f(cl.dy)})">${cl.shape.svg(c)}</g></g>`);
  // Fluss (Z.66–70)
  if (sc.river || sc.riverBezier) {
    const d = sc.riverBezier ? bezierReach(sc.riverBezier, extended ? far : 0) : smoothOpen(reach(sc.river));
    const [sand, rim, wat] = P.river;
    out.push(`<g id="river"><path d="${d}" fill="none" stroke="#e8d18a" stroke-width="${sand}" stroke-linecap="round" filter="url(#p-wob)"/>`
      + `<path d="${d}" fill="none" stroke="#2b1a10" stroke-width="${rim}" stroke-linecap="round" filter="url(#p-wob)"/>`
      + `<path d="${d}" fill="none" stroke="url(#p-wat)" stroke-width="${wat}" stroke-linecap="round" filter="url(#p-wob)"/>`
      + `<path d="${d}" fill="none" stroke="#e8fbff" stroke-width="3" stroke-dasharray="26 40" stroke-linecap="round" opacity=".7" transform="translate(-12,0)"/>`
      + `<path d="${d}" fill="none" stroke="#e8fbff" stroke-width="3" stroke-dasharray="14 60" stroke-linecap="round" opacity=".6" transform="translate(12,0)"/></g>`);
  }
  // See (Z.72–77)
  for (const [sand, rim, wat] of sc.lakes) {
    const m = wat.reduce((s, p) => [s[0] + p[0] / wat.length, s[1] + p[1] / wat.length], [0, 0]);
    out.push(`<g id="lake"><g filter="url(#p-wob)"><path d="${smoothClosed(sand)}" fill="#e8d18a" stroke="#2b1a10" stroke-width="4"/>`
      + `<path d="${smoothClosed(rim)}" fill="#2b1a10"/><path d="${smoothClosed(wat)}" fill="url(#p-wat)"/></g>`
      + `<ellipse cx="${f(m[0])}" cy="${f(m[1])}" rx="34" ry="24" fill="none" stroke="#e8fbff" stroke-width="3" stroke-dasharray="30 50" opacity=".6"/>`
      + `<ellipse cx="${f(m[0] - 14)}" cy="${f(m[1] - 30)}" rx="20" ry="7" fill="#fff" opacity=".25"/></g>`);
  }
  if (sc.lakeEllipse) {
    const [lx, ly, rx, ry] = sc.lakeEllipse;
    out.push(`<g id="lake"><g filter="url(#p-wob)"><ellipse cx="${lx}" cy="${ly}" rx="${rx + 22}" ry="${ry + 18}" fill="#e8d18a" stroke="#2b1a10" stroke-width="4"/>`
      + `<ellipse cx="${lx}" cy="${ly}" rx="${rx}" ry="${ry}" fill="url(#p-wat)" stroke="#2b1a10" stroke-width="3"/></g>`
      + `<ellipse cx="${lx - 6}" cy="${ly - 5}" rx="${f(rx * 0.55)}" ry="${f(ry * 0.44)}" fill="none" stroke="#e8fbff" stroke-width="3" stroke-dasharray="30 50" opacity=".6"/>`
      + `<ellipse cx="${lx - 46}" cy="${ly - 25}" rx="40" ry="10" fill="#fff" opacity=".25"/></g>`);
  }
  // Lava (Plan G9): gleiche Formsprache wie Fluss und See, Farben glühend (Glühen, Kruste, Fläche, Kern, Glutstriche, Schollen)
  if (sc.lava) {
    const L = c.lava, d = smoothOpen(reach(sc.lava.river)), [glow, crust, body, core] = P.lava;
    const pool = (i, fill, extra = '') => sc.lava.pools.map((ring) => `<path d="${smoothClosed(ring[i])}" fill="${fill}"${extra}/>`).join('');
    out.push(`<g id="lava"><g opacity=".35">${sc.lava.river.length > 1 ? `<path d="${d}" fill="none" stroke="${L.glow}" stroke-width="${glow}" stroke-linecap="round" filter="url(#p-wob)"/>` : ''}${pool(0, L.glow, ' filter="url(#p-wob)"')}</g>`
      + `<g filter="url(#p-wob)">${sc.lava.river.length > 1 ? `<path d="${d}" fill="none" stroke="${L.crust}" stroke-width="${crust}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${L.body}" stroke-width="${body}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${L.core}" stroke-width="${core}" stroke-linecap="round"/>` : ''}`
      + `${pool(1, L.crust)}${pool(2, L.body)}${pool(3, L.core)}</g>`
      + (sc.lava.river.length > 1 ? `<path d="${d}" fill="none" stroke="${L.hot}" stroke-width="4" stroke-dasharray="20 46" stroke-linecap="round" opacity=".85" transform="translate(-6,0)"/>`
        + `<path d="${d}" fill="none" stroke="${L.hot}" stroke-width="3" stroke-dasharray="10 60" stroke-linecap="round" opacity=".7" transform="translate(7,0)"/>` : '')
      + sc.lava.plates.map((p) => `<ellipse cx="${p.x}" cy="${p.y}" rx="8" ry="4.5" fill="${L.plate}" stroke="${L.crust}" stroke-width="1.5" transform="rotate(${p.rot} ${p.x} ${p.y})"/>`).join('')
      + '</g>');
  }
  // Weg, eingesunken (Z.79–87)
  const [groove, rim, edge, main, mid] = c.path;
  // Alle Wege als EIN Pfad mit mehreren Teilstücken: jede Schicht wird für alle Wege gemeinsam gemalt,
  // so fließen Wege an Kreuzungen und Zusammenläufen ineinander, statt dass Rand/Fuge des einen den anderen überdeckt.
  if (sc.paths.length) {
    const d = sc.paths.map((pts) => 'M ' + reach(pts).map((p) => `${f(p[0])} ${f(p[1])}`).join(' L ')).join(' ');
    out.push(`<g class="path"><g filter="url(#p-wob)">`
      + `<path d="${d}" fill="none" stroke="${groove}" stroke-width="86" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="none" stroke="${rim}" stroke-width="72" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="none" stroke="${edge}" stroke-width="64" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="none" stroke="${main}" stroke-width="54" stroke-linejoin="round" transform="translate(0,-3)"/>`
      + `<path d="${d}" fill="none" stroke="${mid}" stroke-width="30" stroke-linejoin="round" transform="translate(-2,-4)" opacity=".8"/></g>`
      + `<path d="${d}" fill="none" stroke="${c.pathDots[0]}" stroke-width="3" stroke-dasharray="2 22" stroke-linecap="round" opacity=".7" transform="translate(0,-8)"/>`
      + `<path d="${d}" fill="none" stroke="${c.pathDots[1]}" stroke-width="3" stroke-dasharray="2 30" stroke-linecap="round" opacity=".7" transform="translate(0,10)"/></g>`);
  }
  // Brücke (Z.89–94)
  for (const b of sc.bridges) {
    out.push(`<g class="bridge" transform="translate(${f(b.x)} ${f(b.y)})${b.horizontal ? '' : ' rotate(90)'}">`
      + '<rect x="-52" y="-34" width="104" height="68" rx="6" fill="url(#p-wood)" stroke="#2b1a10" stroke-width="4"/>'
      + `<path d="M-52 -22 H52 M-52 -10 H52 M-52 2 H52 M-52 14 H52 M-52 26 H52" stroke="${c.bridge[2]}" stroke-width="2" opacity=".7"/>`
      + `<rect x="-52" y="-40" width="104" height="9" rx="4" fill="${c.bridge[3]}" stroke="#2b1a10" stroke-width="3"/>`
      + `<rect x="-52" y="31" width="104" height="9" rx="4" fill="${c.bridge[1]}" stroke="#2b1a10" stroke-width="3"/></g>`);
  }
  // Blumen-Tupfen (Z.232): vier Punkte je Tupfen
  for (const fl of sc.flowers) out.push(DOTS[fl.kind || 'flower'](fl));
  // Licht und Vignette (Z.96–98): starke Vignette nur im Rand (Feld ausgespart), im Feld höchstens fieldVignette
  if (nm?.svgOver) out.push(nm.svgOver(sc, c));
  out.push(`<rect ${all} fill="url(#p-sun)"/>`);
  if (!nm) { // B-194: im Albtraum keine Vignette (Licht p-sun und Korn bleiben)
    out.push(`<rect id="vignette-field" ${all} fill="url(#p-vig-field)"/>`); // über den ganzen Canvas: keine Kante an der Feldgrenze
    out.push(`<rect id="vignette-frame" ${all} fill="url(#p-vig)" mask="url(#p-ring)"/>`);
  }
  out.push(`<rect ${all} filter="url(#p-grain)" opacity="${c.grainOpacity}"/>`);
  // Felsen und Bäume (Z.102–104), nach Fußpunkt sortiert
  const zoneTrees = extended ? sideTrees(sc, box, far, reach, nm) : [];
  const figs = [...sc.rocks.map((r) => [r, shapeOf(r.kind, nm)]), ...sc.trees.map((t) => [t, shapeOf(t.kind, nm)]), ...zoneTrees.map((t) => [t, shapeOf(t.kind, nm)])].sort((a, b) => a[0].y - b[0].y);
  for (const [t, shape] of figs) out.push(`<g class="${t.kind}">${place(t, shape, c)}</g>`);
  // Burgtor mit Rauch (Z.116, Z.120f) und Wellenfahne ohne Zahl (Z.117)
  for (const c of sc.castles) {
    out.push(`<g class="castle" transform="translate(${c.tx} ${c.ty}) scale(${c.s})">${CASTLE.svg}`
      + '<circle cx="40" cy="20" r="9" fill="#d9d3c8" stroke="#2b1a10" stroke-width="2" opacity=".7"/><circle cx="46" cy="4" r="7" fill="#e6e0d4" opacity=".5"/></g>');
  }
  for (const fl of sc.flags) out.push(`<g class="flag" transform="translate(${fl.tx} ${fl.ty}) scale(${fl.s})">${FLAG.svg}</g>`);
  out.push('</g></svg>');
  return out.join('');
}

// ---------- Seitenzonen (C-Abnahme 1) ----------
// Seitenzonen in Spiel-px, ungültige Werte = 0
export function extentOf(ext) {
  const v = (n) => (Number.isFinite(n) && n > 0 ? n : 0);
  return { l: v(ext?.l), t: v(ext?.t), r: v(ext?.r), b: v(ext?.b) };
}
const CANVAS_BOX = [-MU, -MU, FW + MU, FH + MU];
const CANVAS_PAD = [-MU - 4, -MU - 4, FW + MU + 4, FH + MU + 4];
const outsideCanvas = ([x, y]) => x < CANVAS_BOX[0] + 1 || y < CANVAS_BOX[1] + 1 || x > CANVAS_BOX[2] - 1 || y > CANVAS_BOX[3] - 1;
// Linienenden außerhalb des Canvas um far (Entwurfs-px) in Laufrichtung verlängern (Wege, Fluss- und Lavaenden)
function extendEnds(pts, far) {
  if (!pts || pts.length < 2) return pts;
  const out = pts.map((p) => [...p]);
  const push = (a, b) => {
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
    return [a[0] + ((a[0] - b[0]) / d) * far, a[1] + ((a[1] - b[1]) / d) * far];
  };
  if (outsideCanvas(out[0])) out.unshift(push(out[0], out[1]));
  if (outsideCanvas(out.at(-1))) out.push(push(out.at(-1), out.at(-2)));
  return out;
}
// Gemalter Fluss (Bézier) mit geraden Verlängerungen an Enden außerhalb des Canvas
function bezierReach(b, far) {
  const d = bezierD(b);
  if (!far) return d;
  const ends = extendEnds([b[0], b[1]], far), tail = extendEnds([b.at(-2), b.at(-1)], far);
  const head = ends.length > 2 ? `M ${f(ends[0][0])} ${f(ends[0][1])} L ${b[0][0]} ${b[0][1]}` : `M ${b[0][0]} ${b[0][1]}`;
  return head + d.slice(d.indexOf(' C')) + (tail.length > 2 ? ` L ${f(tail.at(-1)[0])} ${f(tail.at(-1)[1])}` : '');
}
// Zufall je Platz (Karte, Spalte, Zeile): gleiche Bäume bei jeder Fenstergröße
function hash01(mapId, i, j) {
  let h = P.seed * 7919;
  for (const ch of String(mapId)) h = (h * 31 + ch.charCodeAt(0)) % 2147483647;
  h = (h ^ Math.imul(i + 1000, 73856093) ^ Math.imul(j + 1000, 19349663)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Dichter Wald in den Seitenzonen: Raster P.sideZone.step, Bäume ganz außerhalb des Canvas, Wege, Flüsse, Burg und Fahne frei
function sideTrees(sc, box, far, reach, nm = null) {
  const pal = paletteFor(sc.mapId, sc.look);
  const zone = nm?.frame ? [...(nm.frame.big || []), ...(nm.frame.mid || [])] : []; // B-194: Reihe 3 und 4 im Albtraum
  const keep = [...sc.flags.map((l) => l.box), ...sc.castles.map((l) => l.box), ...(nm?.reserve || [])];
  const corridor = (pts, half) => { for (const [x, y] of riverSamplesOf(pts)) if (outsideCanvas([x, y])) keep.push([x - half, y - half, x + half, y + half]); };
  for (const pts of sc.paths) corridor(reach(pts), P.keepOut);
  if (sc.river) corridor(reach(sc.river), 50);
  if (sc.riverBezier) corridor(extendEnds(riverSamples(sc.riverBezier, 30), far), 50);
  if (sc.lava) corridor(reach(sc.lava.river), 44);
  const ZONE = P.sideZone, [sx, sy] = ZONE.step;
  const trees = [];
  for (let j = Math.floor(box.y / sy); j * sy <= box.y + box.h + 100; j++) {
    for (let i = Math.floor(box.x / sx) - 1; i * sx <= box.x + box.w + sx; i++) {
      const r = (k) => hash01(sc.mapId, i * 5 + k, j);
      if (r(0) >= ZONE.chance) continue;
      const s = P.treeScale[0] + r(1) * (P.treeScale[1] - P.treeScale[0]);
      const kind = zone.length ? pick(zone, r(2)) : r(2) < pal.pineShare ? 'pine' : pal.leafy;
      const x = i * sx + (j % 2 ? sx / 2 : 0) + (r(3) - 0.5) * ZONE.jitter[0], y = j * sy + (r(4) - 0.5) * ZONE.jitter[1];
      const t = figure(kind, shapeOf(kind, nm), x, y, s);
      if (overlap(t.box, CANVAS_PAD) || keep.some((k) => overlap(k, t.box))) continue; // Pad: Maßstab der Figur ist gerundet
      trees.push(t);
    }
  }
  return trees;
}

// Entwurfs-px (Feld ab 0,0) -> Spiel-px im Feld (Tests, Kachelprüfung)
export function toGame([x0, y0, x1, y1]) {
  return [x0 * K, y0 * K, x1 * K, y1 * K];
}

// ---------- Rasterung (nur Browser) ----------
// SVG -> Blob -> Image -> decode -> Canvas (VIEW_WIDTH x VIEW_HEIGHT mal scale; HiDPI: scale = Geräte-px je Canvas-Einheit,
// Vektor wird direkt in dieser Größe gerastert, daher scharf). Liefert null ohne DOM (Node) oder bei Fehler.
export function canRasterize() {
  return typeof Image !== 'undefined' && typeof Blob !== 'undefined' && typeof document !== 'undefined' && typeof URL?.createObjectURL === 'function';
}

// scale: Zahl (Maßstab) oder { width, height } (genaue Größe in Geräte-px, Seitenzonen inklusive)
export async function rasterizePainted(svg, scale = 1) {
  if (!canRasterize()) return null;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const cv = document.createElement('canvas');
    const exact = typeof scale === 'object' && scale;
    cv.width = Math.max(1, Math.round(exact ? exact.width : VIEW_WIDTH * scale));
    cv.height = Math.max(1, Math.round(exact ? exact.height : VIEW_HEIGHT * scale));
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return cv;
  } finally {
    URL.revokeObjectURL(url);
  }
}
