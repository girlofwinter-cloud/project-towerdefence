// B-198: Zwei Fronten im Albtraum (Stil C Gruft), Bauvorlage docs/design/elemente/Karte-ZweiFronten-Albtraum.md. Nur Optik.
// Formen in Fläche-px der Bauvorlage, hier mit SC auf Entwurfs-px gebracht. Wege, Hindernisse und Bauplätze bleiben wie in MAPS.twin.
import { TILE, PAINTED_STYLE } from '../config.js';

const SC = 1.1875;                  // Fläche-px -> Entwurfs-px
const U = PAINTED_STYLE.unit;       // Kachel in Entwurfs-px
const K = TILE / U;                 // Entwurfs-px -> Spiel-px
const OL = '#2b1a10';               // ink
const ex = (x) => (x - 160) * SC;   // Fläche-px -> Entwurfs-px (Feld ab 0,0)
const ey = (y) => (y - 64) * SC;
const r1 = (v) => Math.round(v * 10) / 10;
const gy = (y) => r1(ey(y) * K);    // Fläche-px -> Spiel-px (Feld ab 0,0)

// Form aus Fläche-px; k = Maßstab Fläche -> Entwurf (Hindernisse: so, dass mit PAINTED_STYLE.obstacle* der Vorlagen-Maßstab entsteht)
const form = (w, h, body, eyes, k = SC) => ({ w: w * k, h: h * k, svg: () => `<g transform="scale(${k})">${body}</g>`, ...(eyes ? { eyes: eyes.map(([x, y]) => [x * k, y * k]) } : {}) });

// ---------- Formen (Bauvorlage, statische Fassung) ----------
// Rune mit weichem Schein (#c58aff, Kern #f0dcff)
const rune = (x, y, s, d) => `<g transform="translate(${x},${y}) scale(${s})"><path d="${d}" fill="none" stroke="#c58aff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="${d}" fill="none" stroke="#f0dcff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const RUNE_EYE = 'M-6 0 Q0 -7 6 0 Q0 7 -6 0 Z M0 -1.5 V1.5', RUNE_X = 'M-5 -5 L5 5 M5 -5 L-5 5 M0 -7 V-3', RUNE_P = 'M-5 6 L-5 -6 L5 0 L-5 6';
const CRYPT = `<ellipse cx="60" cy="128" rx="60" ry="7" fill="rgba(4,4,16,.45)"/><path d="M10 128 V54 H110 V128 Z" fill="url(#nm-crypt)" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><path d="M10 74 H110 M10 96 H40 M80 96 H110 M10 112 H34 M86 112 H110" stroke="#2e2c44" stroke-width="2"/><path d="M2 58 L60 14 L118 58 Z" fill="#3e3a58" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><path d="M14 52 L60 20" stroke="#6a6688" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M42 128 V92 a18 20 0 0 1 36 0 V128 Z" fill="#120c24" stroke="${OL}" stroke-width="3"/><path d="M46 128 V94 a14 16 0 0 1 28 0 V128 Z" fill="#8a4aff" opacity=".45"/>${rune(60, 38, 1.3, RUNE_EYE)}<path d="M18 128 V60 M102 128 V60" stroke="${OL}" stroke-width="7"/><path d="M18 128 V60 M102 128 V60" stroke="#7a7898" stroke-width="3"/>`;
const GATE = `${CRYPT}<path d="M36 128 H84 L90 136 H30 Z" fill="#4a4866" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 136 H90 L96 144 H24 Z" fill="#3a3854" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="60" cy="150" rx="46" ry="9" fill="#c58aff" opacity=".35" filter="url(#nm-soft)"/><path d="M48 118 L52 112 L56 118 M64 120 L68 114 L72 120" stroke="#e6b8ff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const GRAVE_BASE = `<ellipse cx="30" cy="78" rx="30" ry="5" fill="rgba(4,4,16,.4)"/><path d="M0 78 Q30 64 60 78 Z" fill="#262842" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>`;
const GRAVE_TAIL = `<path d="M16 70 V34 Q16 18 27 14" stroke="#d8dcec" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/><path d="M42 30 L38 38 L42 44" stroke="${OL}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M10 74 Q16 68 22 74 M40 74 Q46 70 50 74" stroke="#5a7a6a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
const GRAVE0 = `${GRAVE_BASE}<path d="M10 76 V32 Q10 8 30 8 Q50 8 50 32 V76 Z" fill="url(#nm-grave)" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round"/>${GRAVE_TAIL}${rune(30, 46, 1.4, RUNE_X)}`;
const GRAVE1 = `${GRAVE_BASE}<path d="M12 76 V20 L18 12 H42 L48 20 V76 Z" fill="url(#nm-grave)" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round"/>${GRAVE_TAIL}${rune(30, 46, 1.4, RUNE_P)}`;
const bar = (d, w1 = 5, w2 = 2.4) => `<path d="${d}" fill="none" stroke="${OL}" stroke-width="${w1}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#4a4660" stroke-width="${w2}" stroke-linecap="round" stroke-linejoin="round"/>`;
const tip = (x) => `<path d="M${x - 4} 18 L${x} 6 L${x + 4} 18 Z" fill="#5a5672" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`;
const FENCE = '<ellipse cx="60" cy="58" rx="58" ry="4" fill="rgba(4,4,16,.4)"/>' + bar('M4 26 H116 M4 48 H116')
  + [10, 30, 50, 90, 110].map((x) => bar(`M${x} 58 V16`) + tip(x)).join('')
  + bar('M70 58 V30 Q70 20 78 14') + `<path d="M74 16 L82 8 L82 18 Z" fill="#5a5672" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`;
const limb = (d, w1 = 12, w2 = 7) => `<path d="${d}" fill="none" stroke="${OL}" stroke-width="${w1}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#46465e" stroke-width="${w2}" stroke-linecap="round" stroke-linejoin="round"/>`;
const TREE = '<ellipse cx="60" cy="176" rx="46" ry="8" fill="rgba(6,4,14,.4)"/>'
  + ['M56 112 C44 98 30 94 20 78 C14 68 18 58 10 50', 'M58 98 C60 78 52 64 58 46 C62 34 54 24 60 12', 'M64 106 C78 94 92 92 100 76 C106 64 116 62 114 50',
    'M20 78 C12 80 6 74 8 68', 'M100 76 C110 80 116 74 112 68', 'M58 46 C48 42 44 34 46 28', 'M60 64 C70 58 74 50 80 48'].map((d) => limb(d)).join('')
  + limb('M44 174 C34 168 26 172 18 176 M76 174 C86 168 94 172 102 176', 9, 4.5)
  + `<path d="M42 176 C50 160 52 140 50 122 C48 108 50 98 58 92 C66 98 70 108 68 122 C66 140 70 160 80 176 Z" fill="url(#nm-bark)" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round"/><path d="M54 168 C56 150 55 132 56 116 M60 64 C58 56 60 50 58 46" stroke="#8a8ab0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><ellipse cx="59" cy="138" rx="8.5" ry="11.5" fill="#0c0814" stroke="${OL}" stroke-width="2.5"/>`;
const BUSH = `<ellipse cx="40" cy="48" rx="38" ry="5" fill="rgba(6,4,14,.4)"/><path d="M2 48 Q0 30 14 26 Q16 10 32 12 Q42 0 56 10 Q72 8 74 26 Q84 32 78 48 Z" fill="#24283e" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M14 28 Q20 20 28 22 M44 12 Q52 10 56 14 M66 26 Q70 24 72 28" stroke="#3e4462" stroke-width="3" fill="none" stroke-linecap="round"/>`;
const FERN_D = 'M26 34 C22 24 12 18 2 16 M26 34 C26 22 24 12 26 2 M26 34 C30 24 40 18 50 16 M26 34 C20 28 12 28 6 30 M26 34 C32 28 40 28 46 30';
const FERN = `<ellipse cx="26" cy="34" rx="22" ry="3.5" fill="rgba(6,4,14,.35)"/><path d="${FERN_D}" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="${FERN_D}" fill="none" stroke="#2e4448" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 17 l3 -4 M16 20 l2 -5 M44 17 l-3 -4 M36 20 l-2 -5 M25 10 l-4 -2 M27 16 l4 -2" stroke="#8aa6a0" stroke-width="2" stroke-linecap="round"/>`;
const ROCK = `<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(6,4,14,.4)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#6a7090" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#a6acc8"/>`;

const shapes = {
  crypt: form(120, 136, CRYPT, [[60, 118]]), // Augen in der Tür (blink)
  grave0: form(60, 80, GRAVE0),
  grave1: form(60, 80, GRAVE1),
  ironFence: form(120, 60, FENCE),
  twistedTree: form(120, 180, TREE),
  bushDark: form(80, 50, BUSH),
  fern: form(52, 36, FERN),
  cryptRock: form(36, 26, ROCK),
  // Hindernisse: Bäume s 0,44 und Fels s 1,25 (Fläche), umgerechnet auf obstacleTree/obstacleRock
  twistedTreeObstacle: form(120, 180, TREE, null, (SC * 0.44) / PAINTED_STYLE.obstacleTree),
  cryptRockObstacle: form(36, 26, ROCK, null, (SC * 1.25) / PAINTED_STYLE.obstacleRock),
};

// Seelenflamme (Fläche-px, Fuß unten Mitte, 20 x 30): wippt in der Bewegungsschicht (render-nightmare.js, drawFlame)
// Runenkreis am Boden (Fläche-px, 80 x 32)
const CIRCLE = `<ellipse cx="40" cy="16" rx="38" ry="14" fill="none" stroke="#c58aff" stroke-width="5" opacity=".45" filter="url(#nm-soft)"/><ellipse cx="40" cy="16" rx="38" ry="14" fill="none" stroke="#c58aff" stroke-width="2" stroke-dasharray="8 7"/><ellipse cx="40" cy="16" rx="24" ry="8" fill="none" stroke="#f0dcff" stroke-width="1.6"/>`;

// Feste Landmarken im Rand (Fläche-px, Fuß unten Mitte): Gruft-Tore an den Eingängen, Runenkreise (Seelenflammen wippen in der Bewegungsschicht)
const mark = (body, w, h, x, y, s) => ({ body, w, h, x, y, s, box: [ex(x) - (w / 2) * SC * s, ey(y) - h * SC * s, ex(x) + (w / 2) * SC * s, ey(y)] });
export const GATES = [mark(GATE, 120, 152, 44, 96, 0.74), mark(GATE, 120, 152, 40, 646, 0.72)];
const FLAMES_AT = [[24, 330], [130, 560], [1150, 330], [1262, 480], [1150, 720], [400, 770], [960, 772], [24, 760], [1240, 120]];
export const LANDMARKS = [
  ...[[74, 400, 0.9], [1210, 220, 0.75], [1210, 640, 0.75]].map(([x, y, s]) => mark(CIRCLE, 80, 32, x, y, s)),
  ...GATES,
];
const put = (m) => `<g transform="translate(${r1(m.box[0])} ${r1(m.box[1])}) scale(${r1(SC * m.s * 1000) / 1000})">${m.body}</g>`;

// Punkt und Normale bei Weglänge d (Entwurfs-px)
function along(pts, d) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    if (d <= L || i + 2 === pts.length) { const v = Math.min(d, L) / L; return { x: ax + (bx - ax) * v, y: ay + (by - ay) * v, nx: -(by - ay) / L, ny: (bx - ax) / L }; }
    d -= L;
  }
  return null;
}
// Runen an der Wegkante (auf der Wegkachel): oben 10, unten 8; ways = Wege der Szene (Entwurfs-px)
export const pathRunes = (ways) => ways.slice(0, 2).flatMap((way, k) => {
  const n = k ? 8 : 10;
  const total = way.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - way[i][0], p[1] - way[i][1]), 0);
  return Array.from({ length: n }, (_, i) => {
    const p = along(way, ((i + 0.5) / n) * total), off = (i % 2 ? 1 : -1) * 22;
    return [r1(p.x + p.nx * off), r1(p.y + p.ny * off)];
  });
});

function svgUnder() {
  // Violetter Lichtschein vor jeder Gruft-Tür (auf dem Weg)
  return `<g id="nm-gate-light">${GATES.map((g) => `<ellipse cx="${r1(ex(g.x))}" cy="${r1(ey(g.y) + 8)}" rx="${r1(50 * SC)}" ry="${r1(10 * SC)}" fill="#c58aff" opacity=".22" filter="url(#nm-soft)"/>`).join('')}</g>`;
}
function svgOver(sc) {
  const runes = pathRunes(sc.paths).map(([x, y], i) => rune(x, y, 0.9, [RUNE_X, RUNE_P, RUNE_EYE][i % 3]));
  return `<g id="nm-path-runes">${runes.join('')}</g><g id="nm-crypt-marks">${LANDMARKS.map(put).join('')}</g>`;
}

const DEFS = '<linearGradient id="nm-grave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#aab0c8"/><stop offset="1" stop-color="#5a5f78"/></linearGradient>'
  + '<linearGradient id="nm-crypt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a8ea8"/><stop offset="1" stop-color="#4a4c66"/></linearGradient>'
  + '<linearGradient id="nm-bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5e5e7c"/><stop offset="1" stop-color="#2a2a40"/></linearGradient>'
  + '<filter id="nm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>';

// Spiel-px der Bewegungsschicht
const toGame = ([x, y]) => [r1(x * K), r1(y * K)];
// Tür der Gruft (Form-px (60, 100) im Tor), Lichtschein pulsiert
const DOORS = GATES.map((g) => toGame([g.box[0] + 60 * SC * g.s, g.box[1] + 100 * SC * g.s]));
const FLAMES = FLAMES_AT.map(([x, y]) => toGame([ex(x), ey(y)]));

export default {
  painted: {
    ground: ['#66807c', '#4a6468', '#3a4a62'],
    mottle: [0.10, 0.14, 0.24], mottleOpacity: 0.65,
    lit: [0.62, 0.84, 0.86], litOpacity: 0.24,
    sun: ['#9fe8ff', '#8a4aff'],
    path: ['#161a32', '#2b1a10', '#3c3a5a', '#a6acc6', '#c8cde2'], pathDots: ['#f0f0ff', '#3c3a5a'],
    dotKind: 'tuft', dots: ['#2e4448', '#8aa6a0', '#c58aff'],
    pineShare: 0, leafy: 'bare',
    trunk: ['#2a2a40', '#5e5e7c'], pine: ['#2a2a40', '#5e5e7c', '#5e5e7c', '#8a8ab0'],
    rock: ['#6a7090', '#a6acc8'],
  },
  shapes,
  frame: {
    big: ['twistedTree', 'twistedTree', 'twistedTree', 'crypt'],
    mid: ['grave0', 'grave1', 'ironFence', 'twistedTree'],
    small: ['grave0', 'grave1', 'bushDark', 'cryptRock', 'fern'],
    edge: ['fern', 'cryptRock', 'bushDark'],
  },
  noCliffs: true,
  obstacle: { rock: 'cryptRockObstacle', tree: 'twistedTreeObstacle' },
  defs: DEFS,
  svgUnder,
  svgOver,
  // Gruft-Tore ohne Rand-Deko (Seitenzonen)
  reserve: GATES.map((g) => [g.box[0] - 20, g.box[1] - 20, g.box[2] + 20, g.box[3] + 20]),
  // Marken der Szene: Runen am Weg (Spiel-px)
  marks: (sc) => ({ rune: pathRunes(sc.paths).map(toGame) }),
  // Bewegung (Spiel-px, Feld ab 0,0), Reihenfolge = Wichtigkeit; Summe Desktop 51, Handy 26
  motion: [
    { kind: 'pulse', count: [2, 2], color: '#8a4aff', base: 0.45, r: [22, 16], at: DOORS },
    { kind: 'blink', count: [2, 2], color: '#e6b8ff' },
    { kind: 'bob', count: [9, 5], color: '#9fe8ff', core: '#e6f6ff', halo: '#9fe8ff', shape: 'flame', scale: r1(SC * K * 100) / 100, at: FLAMES },
    { kind: 'pulse', count: [18, 8], color: '#c58aff', r: 12, on: 'rune' },
    { kind: 'ripple', count: [1, 1], color: '#c58aff', at: [-25, gy(400), 26, 9] },
    { kind: 'ripple', count: [1, 0], color: '#c58aff', at: [825, gy(220), 22, 8] },
    { kind: 'ripple', count: [1, 0], color: '#c58aff', at: [825, gy(640), 22, 8] },
    { kind: 'fog', count: [3, 2], color: '#a8c0ff', alpha: [0.08, 0.12] },
    { kind: 'twinkle', count: [14, 6], color: '#e6f6ff', alpha: [0.45, 1] },
  ],
};
