// B-197: Zangenangriff im Albtraum (Stil B, verbrannte Steppe ohne Lava), Bauvorlage docs/design/elemente/Karte-Zangenangriff-Albtraum.md.
// Nur Optik: Weg, Hindernisse und Bauplätze bleiben wie MAPS.fork.
import { TILE, PAINTED_STYLE } from '../config.js';

// Formen der Vorlage in Fläche-px (Kachel 48); Entwurfs-px = Fläche-px · 57/48
const DRAFT = PAINTED_STYLE.unit / 48;
const K = TILE / PAINTED_STYLE.unit; // Entwurfs-px -> Spiel-px
const r2 = (v) => Math.round(v * 100) / 100;
// Form in Entwurfs-px umrechnen (k: Maßstab zusätzlich zu Fläche -> Entwurf), Fuß bleibt unten Mitte
const draft = ({ w, h, svg, marks }, k = DRAFT) => ({
  w: r2(w * k), h: r2(h * k),
  svg: (c) => `<g transform="scale(${r2(k * 1000) / 1000})">${svg(c)}</g>`,
  ...(marks ? { marks: Object.fromEntries(Object.entries(marks).map(([n, l]) => [n, l.map(([x, y]) => [r2(x * k), r2(y * k)])])) } : {}),
});

// Formen aus der Bauvorlage (Fläche-px, unverändert übernommen)
const RAW = {
  charTree: { w: 100, h: 170, foot: [50, 170], svg: (c) => `<ellipse cx="54" cy="166" rx="44" ry="8" fill="rgba(10,4,2,.45)"/><ellipse cx="54" cy="164" rx="40" ry="10" fill="#ff5a2a" opacity=".2"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2b1a10" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2e201c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2e201c" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 168 C40 140 36 110 40 88 L32 72 L44 76 L42 56 L52 68 L56 46 L60 70 L70 60 L66 86 C70 110 66 140 74 168 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M44 160 C46 140 44 118 46 100" stroke="#5a4440" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><path d="M52 162 L56 144 L50 128 L56 112 L52 98 M62 152 L60 136 L65 122" stroke="#ff7a1f" stroke-width="4.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M52 162 L56 144 L50 128 L56 112 L52 98 M62 152 L60 136 L65 122" stroke="#ffe58a" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="44" cy="58" r="2.6" fill="#ff7a1f"/><circle cx="56" cy="48" r="2.6" fill="#ffc23a"/><circle cx="70" cy="62" r="2.4" fill="#ff7a1f"/><circle cx="56" cy="40" r="8" fill="#5a504c" stroke="#2b1a10" stroke-width="2"/><circle cx="52" cy="40" r="6" fill="#6e6460"/>` },
  charTreeCold: { w: 100, h: 170, foot: [50, 170], svg: (c) => `<ellipse cx="54" cy="166" rx="44" ry="8" fill="rgba(10,4,2,.45)"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 104 C32 96 24 94 12 84 L6 78" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2b1a10" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 96 C76 88 84 86 94 74" fill="none" stroke="#2e201c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2b1a10" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 84 L4 90 M88 80 L96 84" fill="none" stroke="#2e201c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2b1a10" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 166 C28 162 20 164 12 168 M72 166 C80 162 88 164 96 168" fill="none" stroke="#2e201c" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 168 C40 140 36 110 40 88 L32 72 L44 76 L42 56 L52 68 L56 46 L60 70 L70 60 L66 86 C70 110 66 140 74 168 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M44 160 C46 140 44 118 46 100" stroke="#5a4440" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>` },
  hay: { w: 80, h: 60, foot: [40, 60], svg: (c) => `<ellipse cx="40" cy="56" rx="38" ry="5" fill="rgba(10,4,2,.4)"/><path d="M4 56 Q2 30 20 18 Q40 4 60 18 Q78 30 76 56 Z" fill="#6a4a26" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 40 Q24 30 36 34 M44 24 Q56 22 64 30 M20 52 Q30 46 42 50 M50 46 Q60 42 70 48" stroke="#a07a40" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M20 18 Q40 4 60 18 Q50 26 40 22 Q30 26 20 18 Z" fill="#2e201c" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 20 L36 14 L40 20 L46 13 L52 19" stroke="#ff7a1f" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="8" r="7" fill="#6e6460"/>` },
  fence: { w: 90, h: 50, foot: [45, 50], svg: (c) => `<ellipse cx="44" cy="48" rx="42" ry="4" fill="rgba(10,4,2,.4)"/><path d="M8 48 V14 L12 10 L16 16 V48 Z M40 48 V20 L44 12 L48 22 V48 Z M72 48 V10 L76 16 L80 12 V48 Z" fill="#3a2a24" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M4 26 H60 L56 32 H4 Z" fill="#2e201c" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M56 32 L52 38" stroke="#ff7a1f" stroke-width="2" stroke-linecap="round"/>` },
  dryGrass: { w: 44, h: 32, foot: [22, 32], svg: (c) => `<ellipse cx="22" cy="30" rx="20" ry="3.5" fill="rgba(10,4,2,.35)"/><path d="M22 30 Q18 18 8 8 M22 30 Q22 16 20 2 M22 30 Q26 18 36 8 M22 30 Q14 24 2 22 M22 30 Q30 24 42 22" fill="none" stroke="#2b1a10" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 30 Q18 18 8 8 M22 30 Q22 16 20 2 M22 30 Q26 18 36 8 M22 30 Q14 24 2 22 M22 30 Q30 24 42 22" fill="none" stroke="#4a2e18" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 30 Q22 16 20 2 M22 30 Q26 18 36 8" stroke="#c08a4a" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="20" cy="3" r="2.2" fill="#ff7a1f"/><circle cx="36" cy="8" r="1.8" fill="#ffc23a"/>` },
  stump: { w: 60, h: 50, foot: [30, 50], svg: (c) => `<ellipse cx="30" cy="48" rx="24" ry="5" fill="rgba(10,4,2,.45)"/><path d="M8 48 L12 22 L18 26 L22 14 L30 22 L36 12 L42 24 L48 20 L52 48 Z" fill="url(#nm-char)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M30 46 L28 34 L32 26" stroke="#ff7a1f" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 46 L28 34 L32 26" stroke="#ffe58a" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
  ashPile: { w: 70, h: 30, foot: [35, 30], svg: (c) => `<ellipse cx="35" cy="28" rx="34" ry="4" fill="rgba(10,4,2,.4)"/><path d="M2 28 Q14 8 34 10 Q56 8 68 28 Z" fill="#6a5040" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 18 Q24 12 34 14 M44 13 Q52 12 58 18" stroke="#a08870" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="24" cy="22" r="2.5" fill="#ff7a1f"/><circle cx="40" cy="20" r="2" fill="#ffc23a"/><circle cx="52" cy="24" r="2.2" fill="#ff7a1f"/>` },
  rock: { w: 36, h: 26, foot: [18, 26], svg: (c) => `<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(6,4,14,.4)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#6a5446" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#9a826e"/>` },
};

// Rauch über dem glimmenden Baum und dem Heuhaufen (Bewegungsschicht)
RAW.charTree.marks = { smoke: [[54, 60]] };
RAW.hay.marks = { smoke: [[40, 14]] };

// Hindernisse: Vorlage Baum s 0,42 und Fels s 1,25 (Fläche), der Renderer setzt obstacleTree bzw. obstacleRock
const shapes = Object.fromEntries(Object.entries(RAW).map(([n, s]) => [n, draft(s)]));
shapes.obstacleTree = draft(RAW.charTreeCold, DRAFT * 0.42 / PAINTED_STYLE.obstacleTree);
shapes.obstacleRock = draft(RAW.rock, DRAFT * 1.25 / PAINTED_STYLE.obstacleRock);

// Glutriss: Lagen ink 7, lava 7 weich (σ 4, α .8), lava-core 2,6 (Spiel-px, hier in Entwurfs-px umgerechnet)
const CRACK = { ink: '#2b1a10', lava: '#ff7a1f', core: '#ffc23a', width: 7, core_w: 2.6, blur: 4, alpha: 0.8 };
const line = (pts) => `M${pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join(' L')}`;
function crack(pts, glow = true) {
  const d = line(pts), w = r2(CRACK.width / K);
  if (!glow) return `<path d="${d}" fill="none" stroke="${CRACK.ink}" stroke-width="${r2(w / 2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<path d="${d}" fill="none" stroke="${CRACK.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="none" stroke="${CRACK.lava}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${CRACK.alpha}" filter="url(#nm-crack-soft)"/>`
    + `<path d="${d}" fill="none" stroke="${CRACK.core}" stroke-width="${r2(CRACK.core_w / K)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// Zickzack zwischen zwei Punkten (Entwurfs-px): 4 Punkte, Knick q quer zur Richtung
function zig([ax, ay], [bx, by], q) {
  const dx = bx - ax, dy = by - ay, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
  return [[ax, ay], [ax + dx / 3 + nx * q, ay + dy / 3 + ny * q], [ax + (2 * dx) / 3 - nx * q, ay + (2 * dy) / 3 - ny * q], [bx, by]];
}
// Glimmende Bodenrisse nur im Rand (Vorlage, Spiel-px ab Feld 0,0)
const RIM_CRACKS = [[[-72, 307], [-38, 395]], [[947, 88], [950, 155]], [[875, 347], [913, 405]], [[-58, 572], [-25, 618]]];
// Glutflecken im Rand (Vorlage Fläche (1210,560) und (70,300), hier Spiel-px ab Feld 0,0)
const RIM_GLOW = [[875, 413], [-75, 197]];
const toDraft = ([x, y]) => [x / K, y / K];
// Risse im Weg: alle 3,5 Kacheln ein Zickzack (±13 Fläche-px längs, ±4 quer), jeder dritte glüht; geteilte Wegstücke nur einmal
const PATH_CRACK = { every: 3.5, along: 13 * DRAFT, across: 4 * DRAFT, glowEvery: 3 };
export function pathCracks(paths) {
  const step = PATH_CRACK.every * PAINTED_STYLE.unit, out = [];
  for (const pts of paths) {
    let next = step / 2, walked = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], len = Math.hypot(bx - ax, by - ay);
      while (len && next <= walked + len) {
        const t = (next - walked) / len, ux = (bx - ax) / len, uy = (by - ay) / len;
        const x = ax + ux * len * t, y = ay + uy * len * t;
        if (!out.some((c) => Math.hypot(c.x - x, c.y - y) < step / 2)) {
          const a = PATH_CRACK.along;
          out.push({ x, y, pts: zig([x - ux * a, y - uy * a], [x + ux * a, y + uy * a], PATH_CRACK.across) });
        }
        next += step;
      }
      walked += len;
    }
  }
  return out.map((c, i) => ({ ...c, glow: i % PATH_CRACK.glowEvery === 2 }));
}

export default {
  painted: {
    ground: ['#b48e56', '#86603a', '#664630'],
    mottle: [0.28, 0.16, 0.07], mottleOpacity: 0.6,
    lit: [1.00, 0.74, 0.38], litOpacity: 0.3,
    sun: ['#ffd890', '#ffb060'],
    path: ['#3a2414', '#2b1a10', '#5a3a26', '#c9a682', '#e0c49e'], pathDots: ['#fff0d0', '#5a3a26'],
    // verbrannte Halme, jeder siebte ein Glutpunkt
    dotKind: 'tuft', dots: ['#4a2e18', '#d8b070', '#4a2e18', '#d8b070', '#4a2e18', '#d8b070', '#ff7a1f'],
    pineShare: 0, leafy: 'bare',
    trunk: ['#1a1210', '#4a3430'], pine: ['#1a1210', '#2e201c', '#4a3430', '#2e201c'],
    rock: ['#6a5446', '#9a826e'],
  },
  shapes,
  // Rand-Deko: big jeder zweite Baum mit Glut
  frame: {
    big: ['charTree', 'charTreeCold'],
    mid: ['hay', 'fence', 'charTreeCold'],
    small: ['dryGrass', 'stump', 'ashPile', 'rock'],
    edge: ['dryGrass', 'ashPile', 'rock'],
  },
  noCliffs: true,
  obstacle: { rock: 'obstacleRock', tree: 'obstacleTree' },
  defs: '<linearGradient id="nm-char" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a3430"/><stop offset="1" stop-color="#1a1210"/></linearGradient>'
    + '<radialGradient id="nm-ember-spot"><stop offset="0" stop-color="#ff5a2a" stop-opacity=".14"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>'
    + `<filter id="nm-crack-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${r2(CRACK.blur / K)}"/></filter>`,
  // Glutflecken und glimmende Risse im Rand, über dem Boden
  svgUnder: () => '<g id="nm-rim-cracks">'
    + RIM_GLOW.map(toDraft).map(([x, y]) => `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="140" ry="90" fill="url(#nm-ember-spot)"/>`).join('')
    + RIM_CRACKS.map(([a, b]) => crack(zig(toDraft(a), toDraft(b), 10))).join('') + '</g>',
  // Risse im Weg, über dem Weg
  svgOver: (sc) => `<g id="nm-path-cracks">${pathCracks(sc.paths).map((c) => crack(c.pts, c.glow)).join('')}</g>`,
  embers: true,
  // Marken der Szene: Glutrisse (4 im Rand, dann jeder dritte Wegriss), Spiel-px
  marks: (sc) => ({
    crack: [...RIM_CRACKS.map(([[ax, ay], [bx, by]]) => [r2((ax + bx) / 2), r2((ay + by) / 2)]),
      ...pathCracks(sc.paths).filter((c) => c.glow).map((c) => [r2(c.x * K), r2(c.y * K)])],
  }),
  // Reihenfolge = Wichtigkeit (Handy schneidet ab); Summe Desktop 55, Handy 25
  motion: [
    { kind: 'fall', count: [28, 12], color: '#e8dccc', alpha: 0.75, r: [1.4, 3] },
    { kind: 'rise', count: [10, 5], color: '#ffe58a', halo: '#ff7a1f', haloAlpha: 0.35 },
    { kind: 'smoke', count: [6, 3], color: '#6e6460', alpha: 0.75, on: 'smoke' },
    { kind: 'pulse', count: [9, 4], color: '#ff7a1f', r: 14, on: 'crack' }, // lava
    { kind: 'fog', count: [2, 1], color: '#d8cfc4', alpha: [0.10, 0.12] },
  ],
};
