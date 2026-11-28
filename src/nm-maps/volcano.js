// B-199: Vulkan im Albtraum (Stil B Lava), Bauvorlage docs/design/elemente/Karte-Vulkan-Albtraum.md.
// Nur Optik: Weg, Lava der Karte, Hindernisse und Bauplätze bleiben wie MAPS.volcano.
import { MAPS, TILE, COLS, ROWS } from '../config.js';
import { pathTiles } from '../path.js';

const OL = '#2b1a10'; // ink
const FL = 1.1875;    // Fläche-px -> Entwurfs-px
const OBST = 0.42 / 0.62; // Hindernis-Baum: s 0,42 der Vorlage bei PAINTED_STYLE.obstacleTree 0,62
const OBST_ROCK = 1.25 / 1.2; // Fels: s 1,25 der Vorlage bei obstacleRock 1,2

// Form aus der Vorlage (Fläche-px) in Entwurfs-px, Fuß unten Mitte
const shape = (w, h, body, k = FL) => ({ w: w * k, h: h * k, svg: () => `<g transform="scale(${Math.round(k * 10000) / 10000})">${body}</g>` });

const BRANCHES = '<path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2b1a10" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2e201c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2e201c" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 168 C40 140 36 110 40 88 L32 72 L44 76 L42 56 L52 68 L56 46 L60 70 L70 60 L66 86 C70 110 66 140 74 168 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M44 160 C46 140 44 118 46 100" stroke="#5a4440" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>';
const TREE_SHADOW = '<ellipse cx="54" cy="166" rx="44" ry="8" fill="rgba(10,4,2,.45)"/>';
const TREE_GLOW = '<path d="M52 162 L56 144 L50 128 L56 112 L52 98 M62 152 L60 136 L65 122" stroke="#ff7a1f" stroke-width="4.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M52 162 L56 144 L50 128 L56 112 L52 98 M62 152 L60 136 L65 122" stroke="#ffe58a" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="44" cy="58" r="2.6" fill="#ff7a1f"/><circle cx="56" cy="48" r="2.6" fill="#ffc23a"/><circle cx="70" cy="62" r="2.4" fill="#ff7a1f"/><circle cx="56" cy="40" r="8" fill="#5a504c" stroke="#2b1a10" stroke-width="2"/><circle cx="52" cy="40" r="6" fill="#6e6460"/>';
const SPIRE = '<ellipse cx="22" cy="70" rx="20" ry="4" fill="rgba(10,4,2,.45)"/><path d="M4 70 L12 34 L18 30 L22 4 L28 26 L34 30 L40 70 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 64 L18 36 M26 30 L28 50" stroke="#5a4440" stroke-width="2.4" stroke-linecap="round"/><path d="M30 60 L26 48 L30 40" stroke="#ff7a1f" stroke-width="2" fill="none" stroke-linecap="round"/>';
const ROCK = '<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(6,4,14,.4)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#5a4a48" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#8a7a76"/>';

const shapes = {
  charTree: shape(100, 170, TREE_SHADOW + '<ellipse cx="54" cy="164" rx="40" ry="10" fill="#ff5a2a" opacity=".2"/>' + BRANCHES + TREE_GLOW),
  charTreeCold: shape(100, 170, TREE_SHADOW + BRANCHES, FL * OBST),
  spire: shape(44, 74, SPIRE),
  vent: { ...shape(68, 56, '<ellipse cx="34" cy="52" rx="32" ry="5" fill="rgba(10,4,2,.45)"/><circle cx="34" cy="22" r="22" fill="#ff7a1f" opacity=".18" filter="url(#nm-soft)"/><path d="M4 52 L14 30 L22 26 Q34 20 46 26 L54 30 L64 52 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><ellipse cx="34" cy="27" rx="12" ry="4" fill="#2a1a17" stroke="#2b1a10" stroke-width="2.5"/><ellipse cx="34" cy="27" rx="9" ry="2.6" fill="#ff7a1f"/><ellipse cx="34" cy="27" rx="4.5" ry="1.4" fill="#ffe58a"/><path d="M14 46 L20 38 L18 32 M52 44 L48 36" stroke="#ff7a1f" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="34" cy="16" r="9" fill="#6e6460" opacity=".8"/><circle cx="30" cy="16" r="7" fill="#8a7c78" opacity=".7"/><circle cx="38" cy="16" r="8" fill="#5a504c" opacity=".7"/>'), marks: { smoke: [[34 * FL, 20 * FL]] } }, // Rauch über dem Schlot (Bewegungsschicht)
  stump: shape(60, 50, '<ellipse cx="30" cy="48" rx="24" ry="5" fill="rgba(10,4,2,.45)"/><path d="M8 48 L12 22 L18 26 L22 14 L30 22 L36 12 L42 24 L48 20 L52 48 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M30 46 L28 34 L32 26" stroke="#ff7a1f" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 46 L28 34 L32 26" stroke="#ffe58a" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
  ashPile: shape(70, 30, '<ellipse cx="35" cy="28" rx="34" ry="4" fill="rgba(10,4,2,.4)"/><path d="M2 28 Q14 8 34 10 Q56 8 68 28 Z" fill="#5a4a46" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 18 Q24 12 34 14 M44 13 Q52 12 58 18" stroke="#8a7a74" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="24" cy="22" r="2.5" fill="#ff7a1f"/><circle cx="40" cy="20" r="2" fill="#ffc23a"/><circle cx="52" cy="24" r="2.2" fill="#ff7a1f"/>'),
  rock: shape(36, 26, ROCK),
  rockObstacle: shape(36, 26, ROCK + '<path d="M22 8 L19 14 L23 19" stroke="#ff7a1f" stroke-width="1.8" fill="none" stroke-linecap="round"/>', FL * OBST_ROCK),
};

// Rand-Lava (Entwurfs-px): [Pfad, Breite, Anfang verlängern, Ende verlängern]; offene Ströme, die über die Bildkante laufen, und zwei Seen (Breite 0)
const STREAMS = [
  ['M-97.4 -123.5 C-111.6 -16.6 -49.9 54.6 -76 156.8 C-99.7 242.3 -154.4 280.3 -237.5 323', 30.9, true, true],
  ['M-142.5 536.8 C-154.4 565.3 -201.9 579.5 -237.5 596.1', 26.1, false, true],
  ['M1270.6 589 C1251.6 660.3 1303.9 712.5 1280.1 781.4 C1268.3 826.5 1287.3 864.5 1294.4 921.5', 28.5, false, true],
  ['M121.1 921.5 C137.8 862.1 213.8 874 275.5 843.1 C320.6 821.8 368.1 840.8 387.1 921.5', 21.4, true, true],
  ['M1056.9 921.5 C1068.8 869.3 1116.3 862.1 1135.3 838.4 C1149.5 819.4 1175.6 826.5 1189.9 862.1', 16.6, true, false],
];
const LAKES = [
  'M-700 422.8 C-201.9 403.8 -106.9 399 -57 427.5 C-11.9 453.6 -26.1 517.8 -71.2 536.8 C-118.7 558.1 -190 551 -700 541.5 Z',
  'M1840 280.3 C1341.9 270.8 1246.9 268.4 1206.5 301.6 C1175.6 330.1 1197 389.5 1246.9 403.8 C1294.4 415.6 1353.8 410.9 1840 403.8 Z',
];
const FALL = { x: 1268, y1: 404, y2: 589, w: 31 };
const FAR = 2000;
const nums = (d) => d.match(/-?\d+(\.\d+)?/g).map(Number);
// Enden an der Bildkante geradeaus weit verlängern (Seitenzonen der erweiterten Ansicht)
function extendStream(d, atStart, atEnd) {
  const n = nums(d);
  const out = (px, py, qx, qy) => { const l = Math.hypot(px - qx, py - qy) || 1; return [px + ((px - qx) / l) * FAR, py + ((py - qy) / l) * FAR]; };
  let res = d;
  if (atStart) { const [x, y] = out(n[0], n[1], n[2], n[3]); res = `M${x.toFixed(1)} ${y.toFixed(1)} L${n[0]} ${n[1]} ` + d.replace(/^M\S+ \S+ /, ''); }
  const [ex, ey, cx, cy] = [n.at(-2), n.at(-1), n.at(-4), n.at(-3)];
  if (atEnd) { const [x, y] = out(ex, ey, cx, cy); res += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
  return res;
}
// Freihalte-Rechtecke (keine Deko auf Rand-Lava): Hülle je Kurvenstück, um die halbe Glühbreite vergrößert
function reserveOf(d, pad) {
  const n = nums(d), pts = [];
  for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
  const boxes = [];
  for (let i = 0; i + 3 < pts.length || (i === 0 && pts.length > 1); i += 3) {
    const seg = pts.slice(i, i + 4);
    const xs = seg.map((p) => p[0]), ys = seg.map((p) => p[1]);
    boxes.push([Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad]);
  }
  return boxes;
}
const reserve = [
  ...STREAMS.flatMap(([d, w]) => reserveOf(d, w * 1.2)),
  ...LAKES.flatMap((d) => reserveOf(d, 20)),
  [FALL.x - 70, FALL.y1 - 20, FALL.x + 70, FALL.y2 + 20],
];

// Glühende Bodenrisse: Kachelkanten zwischen zwei freien Bauplätzen, Chance 0,2 je Kante, Saat 77 + Karten-Hash
const CRACK = { chance: 0.2, seed: 77, from: 6 * FL, to: 42 * FL, jag: 3.5 * FL };
export function crackEdges(mapId = 'volcano') {
  const map = MAPS[mapId];
  const used = new Set([...pathTiles(map.waypoints), ...(map.lavaRiver || []).map(([c, r]) => `${c},${r}`), ...(map.lava || []).map(([c, r]) => `${c},${r}`),
    ...(map.obstacles || []).map(([c, r]) => `${c},${r}`), ...(map.flagTiles || []).map(([c, r]) => `${c},${r}`)]);
  const free = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && !used.has(`${c},${r}`);
  let s = CRACK.seed;
  for (const ch of mapId) s = (s * 31 + ch.charCodeAt(0)) % 2147483647;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const edges = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // senkrechte Kante rechts der Kachel, waagrechte Kante darunter
      for (const [dc, dr] of [[1, 0], [0, 1]]) {
        const v = rnd(), jag = [rnd(), rnd(), rnd(), rnd(), rnd()];
        if (!free(c, r) || !free(c + dc, r + dr) || v >= CRACK.chance) continue;
        edges.push({ c, r, vertical: dc === 1, jag });
      }
    }
  }
  return edges;
}
function crackPath(e) {
  const U = 57, pts = [];
  for (let i = 0; i < 5; i++) {
    const a = CRACK.from + ((CRACK.to - CRACK.from) * i) / 4, q = (e.jag[i] - 0.5) * 2 * CRACK.jag * (i % 4 ? 1 : 0.3);
    pts.push(e.vertical ? [(e.c + 1) * U + q, e.r * U + a] : [e.c * U + a, (e.r + 1) * U + q]);
  }
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');
}
const CRACKS = crackEdges().map(crackPath).join(' ');

function under(sc, c) {
  const L = c.lava || { glow: '#ff5a1a', crust: '#2a1a17', plate: '#4a2a22', body: '#ff7a1f', core: '#ffc23a', hot: '#ffe58a' };
  const out = ['<g id="nm-rand-lava">'];
  for (const [d0, w, a, b] of STREAMS) {
    const d = extendStream(d0, a, b);
    out.push(`<path d="${d}" fill="none" stroke="#ff5a1a" stroke-width="${(w * 2.4).toFixed(1)}" opacity=".38" filter="url(#nm-soft)" stroke-linecap="round"/>`,
      `<path d="${d}" fill="none" stroke="${OL}" stroke-width="${(w + 10).toFixed(1)}" stroke-linecap="round"/>`,
      `<path d="${d}" fill="none" stroke="${L.plate}" stroke-width="${(w + 5).toFixed(1)}" stroke-linecap="round"/>`,
      `<path d="${d}" fill="none" stroke="${L.body}" stroke-width="${w.toFixed(1)}" stroke-linecap="round"/>`,
      `<path d="${d}" fill="none" stroke="${L.core}" stroke-width="${(w * 0.5).toFixed(1)}" stroke-linecap="round"/>`);
  }
  for (const d of LAKES) {
    out.push(`<path d="${d}" fill="#ff5a1a" stroke="#ff5a1a" stroke-width="40" opacity=".38" filter="url(#nm-soft)"/>`,
      `<path d="${d}" fill="${L.body}" stroke="${OL}" stroke-width="10" stroke-linejoin="round"/>`,
      `<path d="${d}" fill="none" stroke="${L.plate}" stroke-width="5" stroke-linejoin="round"/>`);
  }
  // Lavafall rechts: Felsstufe, Lavaband mit Kern, Gischt unten
  const { x, y1, y2, w } = FALL;
  out.push(`<path d="M${x - 55} ${y1 + 12} Q${x - 36} ${y1 - 14} ${x} ${y1 - 7} Q${x + 40} ${y1 - 14} ${x + 62} ${y1 + 10} L${x + 55} ${(y1 + y2) / 2} L${x + 64} ${y2 - 10} Q${x + 36} ${y2 + 7} ${x + 21} ${y2 - 2} L${x - 21} ${y2 - 2} Q${x - 40} ${y2 + 7} ${x - 59} ${y2 - 7} L${x - 48} ${(y1 + y2) / 2} Z" fill="url(#nm-char)" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/>`,
    `<path d="M${x} ${y1} V${y2}" stroke="${L.body}" stroke-width="${w}" stroke-linecap="round"/>`,
    `<path d="M${x} ${y1} V${y2}" stroke="${L.core}" stroke-width="${w / 2}" stroke-linecap="round"/>`,
    `<ellipse cx="${x}" cy="${y2}" rx="${w * 1.4}" ry="${w * 0.5}" fill="${L.core}" opacity=".6" filter="url(#nm-soft)"/>`);
  out.push('</g>');
  // Glühende Bodenrisse auf Kachelkanten
  if (CRACKS) out.push(`<g id="nm-cracks" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="${CRACKS}" stroke="${OL}" stroke-width="${(3.2 * FL).toFixed(1)}" opacity=".8"/>`
    + `<path d="${CRACKS}" stroke="#ff6a1a" stroke-width="${(5 * FL).toFixed(1)}" opacity=".55" filter="url(#nm-soft)"/><path d="${CRACKS}" stroke="#ffb02a" stroke-width="${(1.5 * FL).toFixed(1)}"/></g>`);
  return out.join('');
}

// Bewegungsschicht (Spiel-px): Tümpel und sichtbare Enden der Rand-Seen pulsieren, Rauch über Fluss und Seen,
// Bodenrisse in zwei Gruppen (jeder dritte Riss, abwechselnd), Rest statisch
const KD = TILE / 48 / FL; // Entwurfs-px -> Spiel-px (Kachel 48 Fläche-px = 57 Entwurfs-px)
const mid = (c, r) => [(c + 0.5) * TILE, (r + 0.5) * TILE];
const POOLS = [[mid(4, 6), mid(4, 7)], [mid(9, 8)], [mid(17, 7)], [[-70 * KD, 480 * KD]], [[1230 * KD, 340 * KD]]];
const SMOKE = [[(790 - 160) * FL * KD, (200 - 64) * FL * KD], [(770 - 160) * FL * KD, (420 - 64) * FL * KD], [-70 * KD, 470 * KD], [1230 * KD, 330 * KD]];
const crackMid = (e) => (e.vertical ? [(e.c + 1) * TILE, (e.r + 0.5) * TILE] : [(e.c + 0.5) * TILE, (e.r + 1) * TILE]);
const CRACK_GROUPS = [0, 3].map((k) => crackEdges().filter((_, i) => i % 6 === k).map(crackMid));

// Lavafluss der Karte in Spiel-px (Kachelmitten) für den Glanz
const riverLine = (dx) => (MAPS.volcano.lavaRiver || []).map(([c, r]) => [(c + 0.5) * TILE + dx, (r + 0.5) * TILE]);

export default {
  painted: {
    ground: ['#4a302c', '#33201e', '#2a1818'],
    mottle: [0.62, 0.16, 0.04], mottleOpacity: 0.32,
    lit: [1.00, 0.62, 0.22], litOpacity: 0.16,
    sun: ['#ff7a1f', '#ff7a1f'],
    path: ['#1c100e', '#2b1a10', '#3a2420', '#9c8478', '#b8a090'], pathDots: ['#ffd8b0', '#3a2420'],
    dotKind: 'ember', dots: ['#ff7a1f', '#ffb04a', '#8a7c78'],
    pineShare: 0, leafy: 'bare',
    trunk: ['#1a1210', '#4a3430'], pine: ['#1a1210', '#2e201c', '#4a3430', '#2e201c'],
    rock: ['#5a4a48', '#8a7a76'],
  },
  shapes,
  frame: { big: ['charTree', 'spire'], mid: ['vent', 'spire', 'charTree'], small: ['stump', 'ashPile', 'rock'], edge: ['ashPile', 'rock', 'stump'] },
  noCliffs: true,
  obstacle: { tree: 'charTreeCold', rock: 'rockObstacle' },
  reserve,
  defs: '<linearGradient id="nm-char" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a3430"/><stop offset="1" stop-color="#1a1210"/></linearGradient>'
    + '<filter id="nm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>',
  svgUnder: under,
  embers: true,
  motion: [
    { kind: 'glint', count: 1, color: '#ffe58a', points: riverLine(-6) },
    { kind: 'glint', count: 1, color: '#ffe58a', alpha: 0.7, points: riverLine(7) },
    { kind: 'rise', count: [26, 10], color: '#ffe58a', halo: '#ff7a1f', haloAlpha: 0.35 },
    { kind: 'fall', count: [12, 4], color: '#d8cfc4', alpha: 0.7, r: [1.4, 2.8] },
    { kind: 'pulse', count: [5, 3], color: '#ffe58a', r: 18, at: POOLS }, // lava-hot
    { kind: 'smoke', count: [4, 2], color: '#8a7c78', alpha: 0.55, at: SMOKE },
    { kind: 'smoke', count: [1, 1], color: '#8a7c78', alpha: 0.55, on: 'smoke' }, // Schlote, falls im Bild
    { kind: 'pulse', count: [2, 2], color: '#ff5a1a', r: 10, at: CRACK_GROUPS }, // nm-lava-glow
  ],
};
