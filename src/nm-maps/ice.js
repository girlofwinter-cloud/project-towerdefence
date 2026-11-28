// B-196: Eiswelt im Albtraum (Stil C kalt), Bauvorlage docs/design/elemente/Karte-Eiswelt-Albtraum.md. Nur Optik.
// Formen in Fläche-px der Bauvorlage, hier mit SC auf Entwurfs-px gebracht. Weg, Hindernisse und Bauplätze aus MAPS.ice.
import { MAPS, TILE, PAINTED_STYLE } from '../config.js';

const SC = 1.1875;                  // Fläche-px -> Entwurfs-px
const U = PAINTED_STYLE.unit;       // Kachel in Entwurfs-px
const K = TILE / U;                 // Entwurfs-px -> Spiel-px
const OL = '#2b1a10';               // ink
const ex = (x) => (x - 160) * SC;   // Fläche-px -> Entwurfs-px (Feld ab 0,0)
const ey = (y) => (y - 64) * SC;
const r1 = (v) => Math.round(v * 10) / 10;

// Form aus Fläche-px; k = Maßstab Fläche -> Entwurf (Hindernisse: so, dass mit PAINTED_STYLE.obstacle* der Vorlagen-Maßstab entsteht)
const form = (w, h, body, eyes, k = SC) => ({ w: w * k, h: h * k, svg: () => `<g transform="scale(${k})">${body}</g>`, ...(eyes ? { eyes: eyes.map(([x, y]) => [x * k, y * k]) } : {}) });

// ---------- Formen (Bauvorlage, statische Fassung) ----------
const FIR = `<ellipse cx="35" cy="128" rx="32" ry="6" fill="rgba(6,8,24,.35)"/><path d="M28 128 V104 H42 V128 Z" fill="#3a3046" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M2 108 L22 74 H14 L28 44 H20 L35 6 L50 44 H42 L56 74 H48 L68 108 Z" fill="url(#nm-fir)" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round"/><path d="M35 6 L44 28 Q39 32 35 27 Q31 32 26 28 Z M20 44 Q28 50 35 45 Q42 51 50 44 L45 36 Q40 40 35 36 Q30 40 25 36 Z M14 74 Q24 81 35 75 Q46 81 56 74 L50 64 Q42 69 35 65 Q28 69 20 64 Z M2 108 Q18 116 35 109 Q52 116 68 108 L60 96 Q48 102 35 98 Q22 102 10 96 Z" fill="#eef4ff" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 50 l2 7 l2 -6 M44 49 l2 6 l2 -6 M18 80 l2 7 l2 -7 M48 80 l2 6 l2 -6 M10 113 l2 6 l2 -6 M56 113 l2 7 l2 -7" fill="#bfe8ff" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>`;
const FIR_EYES = '<circle cx="35" cy="88" r="10" fill="#9fe8ff" opacity=".25"/><path d="M28 86 L33 88 L31 91 Z M42 86 L37 88 L39 91 Z" fill="#9fe8ff"/>';
const FIR_SMALL = `<ellipse cx="20" cy="56" rx="18" ry="4" fill="rgba(6,8,24,.3)"/><path d="M17 56 V48 H23 V56 Z" fill="#3a3046" stroke="${OL}" stroke-width="2.4"/><path d="M2 50 L13 30 H9 L20 4 L31 30 H27 L38 50 Z" fill="url(#nm-fir)" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M20 4 L26 18 Q23 21 20 18 Q17 21 14 18 Z M9 30 Q15 35 20 31 Q25 35 31 30 L28 24 Q24 27 20 24 Q16 27 12 24 Z M2 50 Q11 55 20 51 Q29 55 38 50 L33 43 Q26 47 20 44 Q14 47 7 43 Z" fill="#eef4ff" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`;
// Rune mit weichem Schein (Frostrune #7fe0ff, Kern weiß)
const rune = (x, y, s, d) => `<g transform="translate(${x},${y}) scale(${s})"><path d="${d}" fill="none" stroke="#7fe0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#nm-soft)"/><path d="${d}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const RUNE_X = 'M-5 -5 L5 5 M5 -5 L-5 5 M0 -7 V-3', RUNE_P = 'M-5 6 L-5 -6 L5 0 L-5 6', RUNE_V = 'M-5 -6 L0 6 L5 -6', RUNE_A = 'M0 -6 V6 M-5 -2 L0 -6 L5 -2';
const CRYSTAL = `<ellipse cx="30" cy="56" rx="26" ry="4" fill="rgba(6,8,24,.35)"/><ellipse cx="30" cy="40" rx="26" ry="20" fill="#7fe0ff" opacity=".25" filter="url(#nm-soft)"/><path d="M8 56 L4 34 L14 26 L18 56 Z" fill="url(#nm-ice)" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 56 L46 30 L56 38 L52 56 Z" fill="url(#nm-ice)" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 56 L22 14 L30 2 L38 14 L42 56 Z" fill="url(#nm-ice)" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M28 8 L25 50" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>${rune(32, 34, 0.9, RUNE_A)}`;
const MOUND = `<ellipse cx="34" cy="26" rx="32" ry="4" fill="rgba(6,8,24,.3)"/><path d="M2 26 Q10 10 24 12 Q34 2 46 10 Q62 10 66 26 Z" fill="#eef4ff" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 20 Q22 14 30 16 M42 12 Q50 12 56 18" stroke="#b8c8e6" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
const RUNESTONE = `<ellipse cx="26" cy="46" rx="24" ry="4.5" fill="rgba(6,8,24,.35)"/><path d="M6 46 L8 20 Q10 8 26 6 Q42 8 44 20 L46 46 Z" fill="url(#nm-grave)" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M8 20 Q10 8 26 6 Q42 8 44 20 Q38 15 32 19 Q26 13 19 18 Q13 15 8 20 Z" fill="#f2f8ff" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 42 L13 24" stroke="#d8e4f6" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>${rune(26, 31, 1, RUNE_P)}`;
const GRAVE_BASE = `<ellipse cx="30" cy="78" rx="30" ry="5" fill="rgba(4,4,16,.4)"/><path d="M0 78 Q30 64 60 78 Z" fill="#dfe8f8" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>`;
const GRAVE_TAIL = `<path d="M16 70 V34 Q16 18 27 14" stroke="#d8dcec" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/><path d="M42 30 L38 38 L42 44" stroke="${OL}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
const GRAVE0 = `${GRAVE_BASE}<path d="M10 76 V32 Q10 8 30 8 Q50 8 50 32 V76 Z" fill="url(#nm-grave)" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round"/><path d="M10 32 Q10 8 30 8 Q50 8 50 32 Q44 26 38 30 Q30 24 22 30 Q16 26 10 32 Z" fill="#f2f8ff" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>${GRAVE_TAIL}${rune(30, 46, 1.4, RUNE_X)}`;
const GRAVE1 = `${GRAVE_BASE}<path d="M12 76 V20 L18 12 H42 L48 20 V76 Z" fill="url(#nm-grave)" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round"/><path d="M12 20 L18 12 H42 L48 20 Q42 26 34 22 Q26 27 20 22 Q16 25 12 20 Z" fill="#f2f8ff" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>${GRAVE_TAIL}${rune(30, 46, 1.4, RUNE_P)}`;
const OBELISK = `<ellipse cx="24" cy="100" rx="24" ry="5" fill="rgba(6,8,24,.4)"/><ellipse cx="24" cy="60" rx="26" ry="44" fill="#7fe0ff" opacity=".2" filter="url(#nm-soft)"/><path d="M8 100 L12 22 L24 4 L36 22 L40 100 Z" fill="url(#nm-grave)" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round"/><path d="M12 22 L24 4 L36 22 Q30 28 24 24 Q18 28 12 22 Z" fill="#f2f8ff" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M15 94 L17 30" stroke="#d8e4f6" stroke-width="2.6" stroke-linecap="round" opacity=".6"/>${rune(24, 44, 1.1, RUNE_V)}${rune(24, 68, 1.1, RUNE_P)}`;
// Relikt im Eisblock: Block, Inhalt (gedämpft), Glanz, Riss, Schneekappe, Glitzerstern
const relic = (inner) => `<ellipse cx="30" cy="52" rx="30" ry="5" fill="rgba(6,8,24,.3)"/><path d="M4 52 L2 18 Q2 6 14 4 L46 2 Q58 4 58 16 L56 52 Z" fill="#cfeaf8" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><g opacity=".75">${inner}</g><path d="M4 52 L2 18 Q2 6 14 4 L46 2 Q58 4 58 16 L56 52 Z" fill="#e8f8ff" opacity=".45"/><path d="M10 12 L22 6 M8 22 L14 18" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><path d="M36 30 L42 40 L38 48 M42 40 L50 42" stroke="#7aa6c8" stroke-width="1.4" fill="none"/><path d="M2 18 Q2 6 14 4 L46 2 Q58 4 58 16 Q48 12 40 16 Q30 10 20 15 Q10 11 2 18 Z" fill="#f6fbff" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M48 4.6 L49.17 8.83 L53.4 10 L49.17 11.17 L48 15.4 L46.83 11.17 L42.6 10 L46.83 8.83 Z" fill="#ffffff"/>`;
const SWORD = relic('<path d="M14 42 L46 14" stroke="#8a96a8" stroke-width="5" stroke-linecap="round"/><path d="M14 42 L46 14" stroke="#c9d2de" stroke-width="2" stroke-linecap="round"/><path d="M16 32 L24 40" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/><circle cx="12" cy="44" r="3" fill="#c9a13f"/>');
const HELM = relic('<path d="M16 40 Q16 18 30 16 Q44 18 44 40 Z" fill="#8a96a8" stroke="#4a5468" stroke-width="2"/><path d="M28 16 V40 M20 30 H40" stroke="#4a5468" stroke-width="2"/><path d="M30 16 Q34 6 42 8" stroke="#a8463a" stroke-width="3" fill="none" stroke-linecap="round"/>');
const BONES = relic('<path d="M14 36 L44 24" stroke="#e6dcc6" stroke-width="5" stroke-linecap="round"/><circle cx="13" cy="33" r="3.4" fill="#e6dcc6"/><circle cx="15" cy="39" r="3.4" fill="#e6dcc6"/><circle cx="45" cy="21" r="3.4" fill="#e6dcc6"/><circle cx="47" cy="27" r="3.4" fill="#e6dcc6"/>');
const ROCK_SNOW = `<ellipse cx="20" cy="23" rx="15" ry="3.5" fill="rgba(6,4,14,.4)"/><path d="M3 22 L6 10 L16 3 L28 6 L33 17 L30 23 Z" fill="#6a7aa0" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M7 11 L16 5 L18 12 L8 20 Z" fill="#b8c8e6"/><path d="M5 12 L16 4 L28 7 L24 11 L16 8 L8 14 Z" fill="#f2f8ff" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`;

const shapes = {
  iceFir: form(70, 132, FIR),
  iceFirEyes: form(70, 132, FIR + FIR_EYES, [[35, 88]]),
  iceFirSmall: form(40, 60, FIR_SMALL),
  iceCrystal: form(60, 60, CRYSTAL),
  snowMound: form(68, 30, MOUND),
  runeStone: form(52, 50, RUNESTONE),
  graveSnow0: form(60, 80, GRAVE0),
  graveSnow1: form(60, 80, GRAVE1),
  obelisk: form(48, 104, OBELISK),
  rockSnow: form(36, 26, ROCK_SNOW),
  // Hindernisse: Tanne s 0,52 und Fels s 1,25 (Fläche), umgerechnet auf obstacleTree/obstacleRock
  iceFirObstacle: form(70, 132, FIR, null, (SC * 0.52) / PAINTED_STYLE.obstacleTree),
  rockSnowObstacle: form(36, 26, ROCK_SNOW, null, (SC * 1.25) / PAINTED_STYLE.obstacleRock),
};

// Feste Landmarken im Rand (Fläche-px, Fuß unten Mitte): Relikte im Eis und Eis-Obelisk am Eingang
export const LANDMARKS = [
  { body: SWORD, w: 60, h: 56, x: 108, y: 440, s: 0.85 },
  { body: HELM, w: 60, h: 56, x: 1212, y: 484, s: 0.8 },
  { body: BONES, w: 60, h: 56, x: 330, y: 798, s: 0.62 },
  { body: SWORD, w: 60, h: 56, x: 930, y: 796, s: 0.6 },
  { body: BONES, w: 60, h: 56, x: 1250, y: 120, s: 0.7 },
  { body: OBELISK, w: 48, h: 104, x: 44, y: 630, s: 0.8 },
].map((m) => ({ ...m, box: [ex(m.x) - (m.w / 2) * SC * m.s, ey(m.y) - m.h * SC * m.s, ex(m.x) + (m.w / 2) * SC * m.s, ey(m.y)] }));
const put = (m) => `<g transform="translate(${r1(m.box[0])} ${r1(m.box[1])}) scale(${r1(SC * m.s * 1000) / 1000})">${m.body}</g>`;

// ---------- Hilfen: Weg und freie Kacheln (aus MAPS.ice, Entwurfs-px) ----------
const MAP = MAPS.ice;
const WAY = MAP.waypoints.map(([c, r]) => [(c + 0.5) * U, (r + 0.5) * U]);
// Punkt und Normale bei Weglänge d (Entwurfs-px)
function along(pts, d) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    if (d <= L || i + 2 === pts.length) { const v = Math.min(d, L) / L; return { x: ax + (bx - ax) * v, y: ay + (by - ay) * v, nx: -(by - ay) / L, ny: (bx - ax) / L }; }
    d -= L;
  }
  return null;
}
function pathCells(pts) {
  const out = new Set();
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.ceil(Math.hypot(bx - ax, by - ay) / (U / 4));
    for (let k = 0; k <= n; k++) out.add(`${Math.floor((ax + ((bx - ax) * k) / n) / U)},${Math.floor((ay + ((by - ay) * k) / n) / U)}`);
  }
  return out;
}
// Freie Kacheln (kein Weg, kein Hindernis, keine Fahne), Reihenfolge fest
export function freeTiles() {
  const taken = pathCells(WAY);
  for (const [c, r] of [...(MAP.obstacles || []), ...(MAP.flagTiles || [])]) taken.add(`${c},${r}`);
  const out = [];
  for (let r = 0; r < 14; r++) for (let c = 0; c < 20; c++) if (!taken.has(`${c},${r}`)) out.push([c, r]);
  return out;
}
// Deterministischer Zufall (fest je Karte)
function rnd(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ---------- Gemalte Schichten ----------
const LAKE = 'M-296.9 123.5 C-213.7 97.4 -80.7 109.3 -35.6 154.4 C-9.5 185.3 -21.4 270.8 -68.9 301.6 C-118.7 332.5 -213.7 325.4 -296.9 306.4 C-352 290 -362 140 -296.9 123.5 Z';
const BROOK = 'M-106.9 133 C-90.2 66.5 -135.4 7.1 -114 -123.5';
const WATER = [[1413.1, 574.8], [1315.8, 596.1], [1239.8, 641.3], [1249.3, 733.9], [1258.8, 807.5], [1213.6, 864.5], [1201.8, 933.4]].map(([x, y]) => [ex(x), ey(y)]);
const bez = (p, t) => { const u = 1 - t; return [0, 1].map((i) => u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i]); };
// Punkte entlang des offenen Wassers (Entwurfs-px)
export const waterSamples = (n = 12) => Array.from({ length: n + 1 }, (_, i) => { const v = (2 * i) / n, seg = Math.min(1, Math.floor(v)); return bez(WATER.slice(seg * 3, seg * 3 + 4), v - seg); });
const dOf = (pts) => `M${pts[0].map(r1).join(' ')} C${pts.slice(1).map((p) => p.map(r1).join(' ')).join(' ')}`;

function svgUnder(sc, c = {}) {
  const out = [];
  const lines = sc.paths.map((pts) => 'M ' + pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(' L ')).join(' ');
  // Schneewall am Weg: Schatten, darüber weicher Schnee (liegt unter dem Weg)
  out.push(`<g id="nm-snow-wall"><path d="${lines}" fill="none" stroke="#1c2050" stroke-width="${r1(84 * SC)}" stroke-linejoin="round" opacity=".25" transform="translate(0 ${r1(6 * SC)})" filter="url(#nm-soft)"/>`
    + `<path d="${lines}" fill="none" stroke="#eef4ff" stroke-width="${r1(96 * SC)}" stroke-linejoin="round" opacity=".42" filter="url(#nm-soft)"/></g>`);
  // Bodentextur auf freien Kacheln: Schneewehen, Eisrisse, Kristallsplitter
  const R = rnd(4242), free = freeTiles(), tex = [];
  for (let i = 0; i < 26; i++) {
    const [c, r] = free[Math.floor(R() * free.length)];
    const x = r1((c + 0.5) * U), y = r1((r + 0.5) * U), rx = r1((36 + R() * 60) * SC * 0.5), ry = r1((9 + R() * 9) * SC * 0.5);
    tex.push(`<ellipse cx="${x}" cy="${r1(y + 7 * SC)}" rx="${rx}" ry="${ry}" fill="#1c2050" opacity=".32"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#eef4ff" opacity=".42" filter="url(#nm-soft)"/>`);
  }
  for (const [c, r] of free) {
    const v = R(), x = (c + 0.2 + R() * 0.6) * U, y = (r + 0.2 + R() * 0.6) * U;
    if (v < 0.13) {
      const d = `M${r1(x)} ${r1(y)} l${r1(12 * R() - 6)} ${r1(-8 - 6 * R())} M${r1(x)} ${r1(y)} l${r1(8 + 6 * R())} ${r1(4 * R())} M${r1(x)} ${r1(y)} l${r1(-6 - 6 * R())} ${r1(6 * R())}`;
      tex.push(`<path d="${d}" stroke="#1c2050" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#dff4ff" stroke-width="1.1" fill="none" stroke-linecap="round"/>`);
    } else if (v < 0.3) tex.push(`<path d="M${r1(x)} ${r1(y - 5)} l3 5 l-3 5 l-3 -5 Z" fill="#bff0ff" opacity=".7"/>`);
  }
  out.push(`<g id="nm-ice-ground">${tex.join('')}</g>`);
  // Fußspuren am Wegrand, abwechselnd links/rechts
  const prints = [];
  for (const [a, b] of [[1.2, 9.5], [21.5, 27.5], [35.5, 41]]) {
    for (let d = a, k = 0; d <= b; d += 0.42, k++) {
      const p = along(WAY, d * U);
      if (!p) continue;
      const off = (k % 2 ? 1 : -1) * (38 + 5 * Math.sin(d * 7)) * SC;
      prints.push(`<ellipse cx="${r1(p.x + p.nx * off)}" cy="${r1(p.y + p.ny * off)}" rx="${r1(1.5 * SC)}" ry="${r1(2.3 * SC)}" fill="#1c2050" opacity=".38"/>`);
    }
  }
  out.push(`<g id="nm-prints">${prints.join('')}</g>`);
  // Gefrorener See mit Bach (linker Rand)
  out.push(`<g id="nm-frozen-lake"><path d="${BROOK}" fill="none" stroke="#eef4ff" stroke-width="${r1(32 * SC + 20)}" stroke-linecap="round"/>`
    + `<path d="${BROOK}" fill="none" stroke="${OL}" stroke-width="${r1(32 * SC + 8)}" stroke-linecap="round"/>`
    + `<path d="${BROOK}" fill="none" stroke="#9cc8ea" stroke-width="${r1(32 * SC)}" stroke-linecap="round"/>`
    + `<path d="${LAKE}" fill="#eef4ff" stroke="#eef4ff" stroke-width="16" stroke-linejoin="round"/>`
    + `<path d="${LAKE}" fill="url(#nm-froz)" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/>`
    + '<path d="M-250 170 L-200 210 L-150 196 M-200 210 L-190 260 M-110 150 L-90 200 L-60 214" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>'
    + '<path d="M-240 260 l30 -30 M-222 270 l30 -30 M-204 280 l30 -30" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".55"/></g>');
  // Offenes Wasser mit Schollen (rechts unten): Schneeufer, Kontur, Eisrand, Wasser
  const wd = dOf(WATER.slice(0, 4)) + ' ' + `C${WATER.slice(4).map((p) => p.map(r1).join(' ')).join(' ')}`;
  // Eisrand nm-froz-b, Wasser nm-ice-water (Palette water); Schollen wippen in der Bewegungsschicht
  const [rim, wat] = c.water || ['#9cc8ea', '#1e3a6a'];
  const layers = [[70, '#eef4ff'], [54, OL], [48, rim], [30, wat]];
  out.push(`<g id="nm-open-water">${layers.map(([w, col]) => `<path d="${wd}" fill="none" stroke="${col}" stroke-width="${r1(w * SC)}" stroke-linecap="round"/>`).join('')}</g>`);
  return out.join('');
}

// Runen am Weg (14 Lagen an der Wegkante, auf der Wegkachel) und Landmarken im Rand
export const pathRunes = () => {
  const total = WAY.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - WAY[i][0], p[1] - WAY[i][1]), 0);
  return Array.from({ length: 14 }, (_, i) => {
    const p = along(WAY, ((i + 0.5) / 14) * total), off = (i % 2 ? 1 : -1) * 22;
    return [r1(p.x + p.nx * off), r1(p.y + p.ny * off)];
  });
};
function svgOver() {
  const runes = pathRunes().map(([x, y], i) => rune(x, y, 0.9, [RUNE_X, RUNE_P, RUNE_V, RUNE_A][i % 4]));
  return `<g id="nm-path-runes">${runes.join('')}</g><g id="nm-relics">${LANDMARKS.map(put).join('')}</g>`;
}

const DEFS = '<linearGradient id="nm-fir" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a5a78"/><stop offset="1" stop-color="#1e2e4a"/></linearGradient>'
  + '<linearGradient id="nm-grave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8c4dc"/><stop offset="1" stop-color="#6a7494"/></linearGradient>'
  + '<linearGradient id="nm-froz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8f0ff"/><stop offset=".5" stop-color="#9cc8ea"/><stop offset="1" stop-color="#6a98c8"/></linearGradient>'
  + '<linearGradient id="nm-ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset=".5" stop-color="#8fd8f2"/><stop offset="1" stop-color="#3b8fcb"/></linearGradient>'
  + '<filter id="nm-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>';

// Spiel-px der Bewegungsschicht
const toGame = ([x, y]) => [r1(x * K), r1(y * K)];
const FLOES = waterSamples(10).filter((_, i) => i % 2 === 1).slice(0, 4).map(toGame);
// Glitzern: über Relikten und Obelisk, auf dem gefrorenen See (sichtbarer Teil im Rand)
const SPARKLE = [...LANDMARKS.map((m) => toGame([(m.box[0] + m.box[2]) / 2, m.box[1] + (m.box[3] - m.box[1]) * 0.3])),
  ...[[-60, 180], [-40, 260], [-90, 300], [-30, 140]].map(toGame)];
const lakeBox = (d, pad) => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number), xs = n.filter((_, i) => !(i % 2)), ys = n.filter((_, i) => i % 2); return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad]; };

export default {
  painted: {
    ground: ['#6a74aa', '#454e86', '#323a6e'],
    mottle: [0.14, 0.14, 0.34], mottleOpacity: 0.55,
    lit: [0.86, 0.92, 1.00], litOpacity: 0.3,
    sun: ['#bff0ff', '#8a4aff'],
    path: ['#1c2244', '#2b1a10', '#3a4a7a', '#a8c2e2', '#d6e6f6'], pathDots: ['#ffffff', '#3a4a7a'],
    dotKind: 'crystal', dots: ['#e6f2ff', '#bff0ff', '#ffffff'],
    pineShare: 1,
    pine: ['#1e2e4a', '#3a5a78', '#3a5a78', '#bfe8ff'], snow: '#eef4ff',
    rock: ['#6a7aa0', '#b8c8e6'],
    water: ['#9cc8ea', '#1e3a6a'], // nm-froz-b, nm-ice-water
  },
  shapes,
  frame: {
    big: ['iceFir', 'iceFir', 'iceFir', 'iceFirEyes', 'obelisk'],
    mid: ['iceFir', 'iceFirSmall', 'graveSnow0', 'graveSnow1', 'runeStone', 'iceCrystal'],
    small: ['iceCrystal', 'snowMound', 'runeStone', 'iceFirSmall', 'rockSnow', 'graveSnow0', 'graveSnow1'],
    edge: ['snowMound', 'iceFirSmall', 'rockSnow', 'iceCrystal', 'runeStone'],
  },
  noCliffs: true,
  obstacle: { rock: 'rockSnowObstacle', tree: 'iceFirObstacle' },
  defs: DEFS,
  svgUnder,
  svgOver,
  // Gefrorener See, Bach und offenes Wasser ohne Rand-Deko (Seitenzonen)
  reserve: [lakeBox(LAKE, 30), lakeBox(BROOK, 30), lakeBox(dOf(WATER), 45)],
  // Bewegung (Spiel-px, Feld ab 0,0), Reihenfolge = Wichtigkeit; Summe Desktop 59, Handy 28
  motion: [
    { kind: 'fall', count: [10, 6], color: '#ffffff', alpha: 0.95, r: [2.4, 4], period: 5 },
    { kind: 'fall', count: [18, 8], color: '#ffffff', alpha: 0.55, r: [0.9, 1.8], period: 11 },
    { kind: 'twinkle', count: [10, 4], color: '#ffffff', at: SPARKLE },
    { kind: 'pulse', count: [7, 4], color: '#7fe0ff', r: 12, at: pathRunes().filter((_, i) => i % 2).map(toGame) }, // nm-frost-rune, jede zweite Rune
    { kind: 'fog', count: [5, 2], color: '#ffffff', alpha: [0.08, 0.12] },
    { kind: 'bob', count: [4, 2], color: '#f6fbff', shape: 'floe', scale: r1(SC * K * 100) / 100, at: FLOES },
    { kind: 'glint', count: [1, 1], color: '#9fe8ff', points: waterSamples(12).map(toGame) },
    { kind: 'ripple', count: [1, 1], color: '#7fe0ff', at: [-25, 260, 16, 6] },
    { kind: 'ripple', count: [1, 0], color: '#7fe0ff', at: [825, 420, 16, 6] },
    { kind: 'blink', count: [2, 0], color: '#9fe8ff' },
  ],
};
