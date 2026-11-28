// B-195: Wiese im Albtraum (Stil A, verfluchter Wald), Bauvorlage docs/design/elemente/Karte-Wiese-Albtraum.md.
// Nur Optik: Weg, Wasser, Hindernisse und Bauplätze bleiben wie MAPS.meadow.
import { MAPS, TILE, PAINTED_STYLE } from '../config.js';

// Formen der Vorlage in Fläche-px (Kachel 48); Entwurfs-px = Fläche-px · 57/48
const DRAFT = PAINTED_STYLE.unit / 48;
const K = TILE / PAINTED_STYLE.unit; // Entwurfs-px -> Spiel-px
const r2 = (v) => Math.round(v * 100) / 100;
// Form in Entwurfs-px umrechnen (k: Maßstab zusätzlich zu Fläche -> Entwurf), Fuß bleibt unten Mitte
const draft = ({ w, h, svg, eyes, marks }, k = DRAFT) => ({
  w: r2(w * k), h: r2(h * k),
  svg: (c) => `<g transform="scale(${r2(k * 1000) / 1000})">${svg(c)}</g>`,
  ...(eyes ? { eyes: eyes.map(([x, y]) => [r2(x * k), r2(y * k)]) } : {}),
  ...(marks ? { marks: Object.fromEntries(Object.entries(marks).map(([n, l]) => [n, l.map(([x, y]) => [r2(x * k), r2(y * k)])])) } : {}),
});

// Formen aus der Bauvorlage (Fläche-px, unverändert übernommen)
const RAW = {
  twistedTree: { w: 120, h: 180, foot: [60, 180], svg: (c) => `<ellipse cx="60" cy="176" rx="46" ry="8" fill="rgba(6,4,14,.4)"/><path d="M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 C12 80 6 74 8 68" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 C12 80 6 74 8 68" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 76 C110 80 116 74 112 68" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 76 C110 80 116 74 112 68" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 C48 42 44 34 46 28" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 C48 42 44 34 46 28" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 64 C70 58 74 50 80 48" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 64 C70 58 74 50 80 48" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176" fill="none" stroke="#4e4060" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 176 C50 160 52 140 50 122 C48 108 50 98 58 92 C66 98 70 108 68 122 C66 140 70 160 80 176 Z" fill="url(#nm-bark)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M54 168 C56 150 55 132 56 116 M60 64 C58 56 60 50 58 46" stroke="#8a7aa0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><ellipse cx="59" cy="138" rx="8.5" ry="11.5" fill="#0c0814" stroke="#2b1a10" stroke-width="2.5"/><path d="M24 82 q-3 10 1 18 q2 4 -1 8 M34 94 q-2 8 0 14 M96 80 q3 9 -1 16 M106 70 q1 8 -1 12 M48 44 q-2 8 1 12" stroke="#8aa890" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>` },
  twistedTreeEyes: { w: 120, h: 180, foot: [60, 180], svg: (c) => `<ellipse cx="60" cy="176" rx="46" ry="8" fill="rgba(6,4,14,.4)"/><path d="M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 C12 80 6 74 8 68" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 78 C12 80 6 74 8 68" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 76 C110 80 116 74 112 68" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 76 C110 80 116 74 112 68" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 C48 42 44 34 46 28" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 C48 42 44 34 46 28" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 64 C70 58 74 50 80 48" fill="none" stroke="#2b1a10" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 64 C70 58 74 50 80 48" fill="none" stroke="#4e4060" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176" fill="none" stroke="#4e4060" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 176 C50 160 52 140 50 122 C48 108 50 98 58 92 C66 98 70 108 68 122 C66 140 70 160 80 176 Z" fill="url(#nm-bark)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M54 168 C56 150 55 132 56 116 M60 64 C58 56 60 50 58 46" stroke="#8a7aa0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><ellipse cx="59" cy="138" rx="8.5" ry="11.5" fill="#0c0814" stroke="#2b1a10" stroke-width="2.5"/><circle cx="59" cy="136" r="11" fill="#d8ff5a" opacity=".22"/><ellipse cx="55.5" cy="136" rx="2.6" ry="2" fill="#d8ff5a"/><ellipse cx="62.5" cy="136" rx="2.6" ry="2" fill="#d8ff5a"/><path d="M24 82 q-3 10 1 18 q2 4 -1 8 M34 94 q-2 8 0 14 M96 80 q3 9 -1 16 M106 70 q1 8 -1 12 M48 44 q-2 8 1 12" stroke="#8aa890" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>` },
  bushEyes: { w: 80, h: 50, foot: [40, 50], svg: (c) => `<ellipse cx="40" cy="48" rx="38" ry="5" fill="rgba(6,4,14,.4)"/><path d="M2 48 Q0 30 14 26 Q16 10 32 12 Q42 0 56 10 Q72 8 74 26 Q84 32 78 48 Z" fill="#1e1a2c" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 28 Q20 20 28 22 M44 12 Q52 10 56 14 M66 26 Q70 24 72 28" stroke="#3c3254" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="35" cy="30" r="10" fill="#d8ff5a" opacity=".2"/><path d="M28 28 L34 30 L32 33 L29 32 Z M42 28 L36 30 L38 33 L41 32 Z" fill="#d8ff5a"/><ellipse cx="58" cy="38" rx="2.4" ry="1.7" fill="#d8ff5a" opacity=".85"/><ellipse cx="65" cy="38" rx="2.4" ry="1.7" fill="#d8ff5a" opacity=".85"/>` },
  bush: { w: 80, h: 50, foot: [40, 50], svg: (c) => `<ellipse cx="40" cy="48" rx="38" ry="5" fill="rgba(6,4,14,.4)"/><path d="M2 48 Q0 30 14 26 Q16 10 32 12 Q42 0 56 10 Q72 8 74 26 Q84 32 78 48 Z" fill="#1e1a2c" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 28 Q20 20 28 22 M44 12 Q52 10 56 14 M66 26 Q70 24 72 28" stroke="#3c3254" stroke-width="3" fill="none" stroke-linecap="round"/>` },
  mushrooms: { w: 44, h: 32, foot: [22, 32], svg: (c) => `<ellipse cx="22" cy="30" rx="22" ry="4" fill="rgba(6,4,14,.35)"/><circle cx="22" cy="18" r="22" fill="#9effd9" opacity=".22"/><g transform="translate(10,30) scale(0.9)"><path d="M-3 0 V-10 H3 V0 Z" fill="#d8d0c0" stroke="#2b1a10" stroke-width="2"/><path d="M-10 -9 Q-10 -20 0 -20 Q10 -20 10 -9 Z" fill="#9effd9" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="-4" cy="-14" r="1.6" fill="#fff"/><circle cx="3" cy="-12" r="1.3" fill="#fff"/></g><g transform="translate(26,30) scale(1.2)"><path d="M-3 0 V-10 H3 V0 Z" fill="#d8d0c0" stroke="#2b1a10" stroke-width="2"/><path d="M-10 -9 Q-10 -20 0 -20 Q10 -20 10 -9 Z" fill="#9effd9" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="-4" cy="-14" r="1.6" fill="#fff"/><circle cx="3" cy="-12" r="1.3" fill="#fff"/></g><g transform="translate(38,31) scale(0.7)"><path d="M-3 0 V-10 H3 V0 Z" fill="#d8d0c0" stroke="#2b1a10" stroke-width="2"/><path d="M-10 -9 Q-10 -20 0 -20 Q10 -20 10 -9 Z" fill="#9effd9" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="-4" cy="-14" r="1.6" fill="#fff"/><circle cx="3" cy="-12" r="1.3" fill="#fff"/></g>` },
  fern: { w: 52, h: 36, foot: [26, 36], svg: (c) => `<ellipse cx="26" cy="34" rx="22" ry="3.5" fill="rgba(6,4,14,.35)"/><path d="M26 34 C22 24 12 18 2 16 M26 34 C26 22 24 12 26 2 M26 34 C30 24 40 18 50 16 M26 34 C20 28 12 28 6 30 M26 34 C32 28 40 28 46 30" fill="none" stroke="#2b1a10" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 34 C22 24 12 18 2 16 M26 34 C26 22 24 12 26 2 M26 34 C30 24 40 18 50 16 M26 34 C20 28 12 28 6 30 M26 34 C32 28 40 28 46 30" fill="none" stroke="#2e4a44" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 17 l3 -4 M16 20 l2 -5 M44 17 l-3 -4 M36 20 l-2 -5 M25 10 l-4 -2 M27 16 l4 -2" stroke="#7f9e8a" stroke-width="2" stroke-linecap="round"/>` },
  rock: { w: 36, h: 26, foot: [18, 26], svg: (c) => `<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(6,4,14,.4)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#7a7488" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#a8a2b8"/>` },
};
// Augenpaare (Mitte) der Vorlage: Baum (55,5|136)+(62,5|136), Busch (31,30)+(38,30) und (58,38)+(65,38)
RAW.twistedTreeEyes.eyes = [[59, 136]];
RAW.bushEyes.eyes = [[34.5, 30], [61.5, 38]];
// Pilzschein (Mitte des Hofs, Puls in der Bewegungsschicht)
RAW.mushrooms.marks = { shroom: [[22, 18]] };

// Hindernisse: Vorlage Baum s 0,44 und Fels s 1,25 (Fläche), der Renderer setzt obstacleTree bzw. obstacleRock
const shapes = Object.fromEntries(Object.entries(RAW).map(([n, s]) => [n, draft(s)]));
shapes.obstacleTree = draft(RAW.twistedTreeEyes, DRAFT * 0.44 / PAINTED_STYLE.obstacleTree);
shapes.obstacleRock = draft(RAW.rock, DRAFT * 1.25 / PAINTED_STYLE.obstacleRock);

// Fluss der Karte (Bézier-Kette in Entwurfs-px) als Polylinie in Spiel-px, quer um d verschoben (Glanzlinien)
function riverLine(d) {
  const b = MAPS.meadow.paintedWater.river, pts = [];
  for (let i = 0; i + 3 < b.length; i += 3) {
    const [p0, p1, p2, p3] = b.slice(i, i + 4);
    for (let s = i ? 1 : 0; s <= 8; s++) {
      const t = s / 8, u = 1 - t;
      pts.push([0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]));
    }
  }
  return pts.map(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const n = Math.hypot(bx - ax, by - ay) || 1;
    return [r2((x - ((by - ay) / n) * d) * K), r2((y + ((bx - ax) / n) * d) * K)];
  });
}
// See der Karte (Entwurfs-px) als Wellenring in Spiel-px, Anteil a der Seegröße
const lakeRing = (a) => {
  const [x, y, rx, ry] = MAPS.meadow.paintedWater.lake;
  return [r2(x * K), r2(y * K), r2(rx * a * K), r2(ry * a * K)];
};
const LAKE = MAPS.meadow.paintedWater.lake;
// Glitzern auf Fluss (im Bild) und See, Spiel-px
const SPARKLE = [
  ...riverLine(0).filter(([x, y], i) => i % 3 === 1 && x > 0 && y > 0).slice(0, 3),
  ...[[-0.5, -0.3], [0.45, 0.1], [-0.1, 0.45]].map(([a, b]) => [r2((LAKE[0] + a * LAKE[2]) * K), r2((LAKE[1] + b * LAKE[3]) * K)]),
];

export default {
  painted: {
    ground: ['#6e927c', '#476a5e', '#34504e'],
    mottle: [0.05, 0.10, 0.14], mottleOpacity: 0.7,
    lit: [0.75, 0.90, 1.00], litOpacity: 0.2,
    sun: ['#d8f0ff', '#8a7ad0'],
    path: ['#1f302c', '#2b1a10', '#5a4e4a', '#b0a284', '#d0c39e'], pathDots: ['#eef6e0', '#5a4e4a'],
    dotKind: 'tuft', dots: ['#2e4a44', '#7f9e8a', '#2e4a44', '#7f9e8a', '#2e4a44', '#9effd9'],
    pineShare: 0, leafy: 'bare',
    trunk: ['#2e2538', '#4e4060'], pine: ['#2e2538', '#4e4060', '#6a5a80', '#8a7aa0'],
    rock: ['#7a7488', '#a8a2b8'],
    bridge: ['#7a6a72', '#463a46', '#2b1a10', '#342a36'],
    bridgeMoss: '#8aa890', // nm-moss-strand
    water: ['#5fd6b8', '#183e50'], // nm-water-a / -b
  },
  shapes,
  // Rand-Deko: big jeder dritte Baum mit Augen, small jeder zweite Busch mit Augen
  frame: {
    big: ['twistedTree', 'twistedTree', 'twistedTreeEyes'],
    mid: ['twistedTree', 'twistedTreeEyes', 'bushEyes'],
    small: ['bushEyes', 'bush', 'bushEyes', 'mushrooms', 'bushEyes', 'fern', 'bushEyes', 'rock'],
    edge: ['fern', 'mushrooms', 'rock', 'bush', 'fern', 'bushEyes'],
  },
  noCliffs: true,
  obstacle: { rock: 'obstacleRock', tree: 'obstacleTree' },
  defs: '<linearGradient id="nm-bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a5a80"/><stop offset="1" stop-color="#2e2538"/></linearGradient>'
    + '<radialGradient id="nm-glow-moss"><stop offset="0" stop-color="#7dffb0" stop-opacity=".14"/><stop offset="1" stop-color="#7dffb0" stop-opacity="0"/></radialGradient>',
  // Grünschein unten links (nm-glow-moss), über dem Boden
  svgUnder: () => '<ellipse cx="120" cy="700" rx="420" ry="300" fill="url(#nm-glow-moss)"/>',
  // See ohne Rand-Deko (Seitenzonen)
  reserve: [[LAKE[0] - LAKE[2] - 30, LAKE[1] - LAKE[3] - 30, LAKE[0] + LAKE[2] + 30, LAKE[1] + LAKE[3] + 30]],
  // Reihenfolge = Wichtigkeit (Handy schneidet ab); Summe Desktop 54, Handy 23
  motion: [
    { kind: 'glint', count: [1, 1], color: '#d8fff0', alpha: 0.7, points: riverLine(-12) },
    { kind: 'glint', count: [1, 1], color: '#d8fff0', alpha: 0.6, points: riverLine(12) },
    { kind: 'glint', count: [1, 0], color: '#ffffff', alpha: 0.8, points: riverLine(0) },
    { kind: 'ripple', count: [1, 1], color: '#d8fff0', alpha: 0.6, at: lakeRing(0.55) },
    { kind: 'ripple', count: [1, 0], color: '#d8fff0', alpha: 0.5, at: lakeRing(0.8) },
    { kind: 'twinkle', count: [6, 3], color: '#ffffff', at: SPARKLE },
    { kind: 'blink', count: [1, 1], color: '#d8ff5a', at: [[r2(LAKE[0] * K), r2(LAKE[1] * K)]], rx: 5, ry: 2.5, gap: 7 }, // Seeaugen, Mandeln 12 x 6
    { kind: 'fog', count: [4, 2], color: '#c8d4f0', alpha: [0.13, 0.16] },
    { kind: 'blink', count: [10, 4], color: '#d8ff5a' },
    { kind: 'rise', count: [24, 10], color: '#efffc8', halo: '#d8ff9a' },
    { kind: 'pulse', count: [4, 0], color: '#9effd9', base: 0.22, on: 'shroom' }, // nm-shroom
  ],
};
