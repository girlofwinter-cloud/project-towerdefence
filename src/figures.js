// Stil 1 (G6, G7): Formen der Türme und Gegner, SVG unverändert aus docs/design/stil1-entwurf.dc.html.
// Türme Z.105–109, Gegner Z.110–113. <g data-part="turn"> markiert drehende Teile (Kanonenrohr, Gewehr).
// Gegnertypen ohne eigenen Entwurf entstehen aus dem Goblin (Plan G7). Nur Daten, keine Spiel-Logik.
import { parseFigure, boxOf } from './svg-figure.js';

const K = '#2b1a10'; // Kontur

// ---------- Türme ----------
// w, h: SVG-Box; pivot: Drehpunkt des drehenden Teils; muzzle: Mündung im ungedrehten Teil;
// trim: Goldbänder ab Stufe 2 (Stufe 3: beide)
const TOWER_SVG = {
  arrow: {
    w: 68, h: 90, trim: ['M13 44 H55', 'M15 76 H53'],
    svg: `<ellipse cx="38" cy="84" rx="28" ry="7" fill="rgba(30,20,50,.35)"/><path d="M12 84 L17 46 H51 L56 84 Z" fill="url(#s1-stone)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M16 56 H52 M14 68 H54" stroke="#6b5a48" stroke-width="2"/><path d="M26 84 V68 a8 9 0 0 1 16 0 V84" fill="#4b3526" stroke="#2b1a10" stroke-width="2.5"/><rect x="10" y="38" width="48" height="12" rx="3" fill="url(#s1-wood)" stroke="#2b1a10" stroke-width="3"/><path d="M14 38 V26 H22 V30 H29 V26 H39 V30 H46 V26 H54 V38" fill="#a9703d" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><circle cx="34" cy="24" r="6" fill="#f2c9a0" stroke="#2b1a10" stroke-width="2.5"/><path d="M27 22 L34 8 L41 22 Z" fill="#3c9c52" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M45 20 V4 L58 9 L45 14" fill="#d6483a" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 50 L23 82" stroke="#fff3d2" stroke-width="3" opacity=".5" stroke-linecap="round"/>`,
  },
  cannon: {
    w: 72, h: 84, pivot: [36, 40], muzzle: [36, 2], flash: [14, 6, 6, 0.4, '#ffe266', 2.5], trim: ['M12 70 H60', 'M10 75 H62'],
    svg: `<ellipse cx="38" cy="78" rx="30" ry="7" fill="rgba(30,20,50,.35)"/><path d="M8 78 Q6 54 22 46 H50 Q66 54 64 78 Z" fill="url(#s1-stone)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M12 62 H60" stroke="#6b5a48" stroke-width="2"/><g data-part="turn"><rect x="27" y="6" width="18" height="46" rx="7" fill="#5d4a66" stroke="#2b1a10" stroke-width="3"/><rect x="24" y="2" width="24" height="11" rx="4" fill="#3a2d44" stroke="#2b1a10" stroke-width="3"/><path d="M32 14 V48" stroke="#a48fb8" stroke-width="3" stroke-linecap="round" opacity=".8"/><rect x="26" y="30" width="20" height="5" fill="#d79a2b" stroke="#2b1a10" stroke-width="2"/></g><circle cx="36" cy="50" r="13" fill="url(#s1-wood)" stroke="#2b1a10" stroke-width="3"/><circle cx="36" cy="50" r="4" fill="#3a2d44" stroke="#2b1a10" stroke-width="2"/><circle cx="14" cy="50" r="7" fill="#f2c9a0" stroke="#2b1a10" stroke-width="2.5"/><path d="M7 48 Q14 38 21 48 Z" fill="#c4452f" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/>`,
  },
  frost: {
    w: 72, h: 92, glow: [36, 40], trim: ['M14 80 H58', 'M12 84 H60'],
    svg: `<circle cx="36" cy="40" r="34" fill="url(#s1-iceglow)" opacity=".7"/><ellipse cx="38" cy="86" rx="28" ry="6.5" fill="rgba(30,20,50,.35)"/><path d="M10 86 L16 62 H56 L62 86 Z" fill="url(#s1-stone)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M12 66 Q22 56 36 62 Q50 56 60 66 L58 72 Q36 66 14 72 Z" fill="#f4fcff" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 62 L10 30 L24 44 Z" fill="url(#s1-ice)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M54 62 L62 34 L48 46 Z" fill="url(#s1-ice)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M36 64 L22 36 L36 2 L50 36 Z" fill="url(#s1-ice)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M36 6 L30 34 L36 58" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`,
  },
  sniper: {
    w: 76, h: 104, pivot: [30, 22], muzzle: [74, 25], flash: [11, 4, 5, 0.2, '#fff6a8', 2], trim: ['M14 40 H58', 'M18 90 H54'],
    svg: `<ellipse cx="36" cy="98" rx="24" ry="6" fill="rgba(30,20,50,.35)"/><path d="M16 98 L21 42 H51 L56 98 Z" fill="url(#s1-stone)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M19 60 H53 M17 78 H55" stroke="#6b5a48" stroke-width="2"/><rect x="29" y="68" width="14" height="10" rx="2" fill="#3a2a1e" stroke="#2b1a10" stroke-width="2"/><rect x="12" y="34" width="48" height="12" rx="3" fill="url(#s1-wood)" stroke="#2b1a10" stroke-width="3"/><path d="M18 34 V20 H54 V34" fill="#a9703d" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="22" r="6" fill="#f2c9a0" stroke="#2b1a10" stroke-width="2.5"/><path d="M22 20 Q30 8 38 20 Z" fill="#2f7a3d" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><g data-part="turn"><rect x="34" y="22" width="40" height="6" rx="3" fill="#3a2d44" stroke="#2b1a10" stroke-width="2.5"/><circle cx="48" cy="19" r="4" fill="#9fd8f5" stroke="#2b1a10" stroke-width="2.5"/></g><path d="M22 46 L25 94" stroke="#fff3d2" stroke-width="3" opacity=".5" stroke-linecap="round"/>`,
  },
  lightning: {
    w: 72, h: 96, glow: [36, 16], trim: ['M14 84 H58', 'M12 88 H60'],
    svg: `<circle cx="36" cy="16" r="26" fill="url(#s1-glow)"/><ellipse cx="38" cy="90" rx="28" ry="6.5" fill="rgba(30,20,50,.35)"/><path d="M10 90 L16 66 H56 L62 90 Z" fill="url(#s1-stone)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><rect x="24" y="30" width="24" height="40" rx="6" fill="#c9794a" stroke="#2b1a10" stroke-width="3"/><path d="M24 40 H48 M24 50 H48 M24 60 H48" stroke="#7a3f1e" stroke-width="3"/><path d="M28 34 V66" stroke="#f3b78a" stroke-width="3" stroke-linecap="round"/><rect x="30" y="24" width="12" height="9" fill="#5d4a66" stroke="#2b1a10" stroke-width="2.5"/><circle cx="36" cy="16" r="11" fill="url(#s1-orb)" stroke="#2b1a10" stroke-width="3"/><path d="M10 14 L20 16 L14 22 M62 12 L52 16 L58 22" stroke="#fff6a8" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
  },
};

// Goldbänder (Stufe 2: erstes, Stufe 3: beide), mit dunkler Kante darunter
function trimSvg(paths, level, color, ink, width, edge) {
  const n = level >= 3 ? 2 : level >= 2 ? 1 : 0;
  let s = '';
  for (let i = 0; i < n; i++) s += `<path d="${paths[i]}" stroke="${ink}" stroke-width="${edge}" stroke-linecap="round"/><path d="${paths[i]}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
  return s;
}

// Gelesene Turmfiguren je Typ und Stufe: { w, h, back, turn, front, box, pivot, muzzle, flash, glow }
// back/front = feste Teile vor und nach dem drehenden Teil (Sprite), turn = live gezeichnet.
const towerCache = new Map();
export function towerFigure(type, level, trim) {
  const key = `${type}:${level}`;
  let f = towerCache.get(key);
  if (f) return f;
  const T = TOWER_SVG[type];
  if (!T) return null;
  const extra = trimSvg(T.trim, level, trim.color, trim.ink, trim.width, trim.edge);
  // Bänder gehören zum Sockel: vor dem drehenden Teil einfügen (bei festen Türmen ans Ende)
  const svg = T.svg.includes('<g data-part="turn">') ? T.svg.replace('<g data-part="turn">', `${extra}<g data-part="turn">`) : T.svg + extra;
  const parsed = parseFigure(svg);
  const gi = parsed.groups.findIndex((g) => g.name === 'turn');
  const back = gi < 0 ? parsed.all : parsed.groups.slice(0, gi).flatMap((g) => g.els);
  const turn = gi < 0 ? [] : parsed.groups[gi].els;
  const front = gi < 0 ? [] : parsed.groups.slice(gi + 1).flatMap((g) => g.els);
  f = { type, level, w: T.w, h: T.h, back, turn, front, box: pad(boxOf(parsed.all), 2), pivot: T.pivot || null, muzzle: T.muzzle || null, flash: T.flash || null, glow: T.glow || null };
  towerCache.set(key, f);
  return f;
}
export const TOWER_KINDS = Object.keys(TOWER_SVG);

function pad(b, p) {
  return [Math.floor(b[0] - p), Math.floor(b[1] - p), Math.ceil(b[2] + p), Math.ceil(b[3] + p)];
}

// ---------- Gegner ----------
const GOBLIN = { legs: '#4f9a2e', body: '#6cc03a', belt: '#8a5326', ears: '#6cc03a', head: '#7fd048' };
// Goblin (Z.110) mit austauschbaren Farben und Zusätzen; behind = vor dem Körper gezeichnet, front = über dem Kopf
function goblinSvg(o = {}) {
  const c = { ...GOBLIN, ...o };
  const eyes = c.sockets
    ? `<circle cx="19" cy="16" r="3.6" fill="${K}"/><circle cx="29" cy="16" r="3.6" fill="${K}"/>`
    : `<circle cx="19" cy="16" r="3.6" fill="#fff" stroke="#2b1a10" stroke-width="1.5"/><circle cx="29" cy="16" r="3.6" fill="#fff" stroke="#2b1a10" stroke-width="1.5"/><circle cx="20" cy="17" r="1.6" fill="#2b1a10"/><circle cx="30" cy="17" r="1.6" fill="#2b1a10"/>`;
  return `<ellipse cx="24" cy="46" rx="15" ry="4" fill="rgba(20,30,40,.4)"/>${c.behind || ''}`
    + `<path d="M14 40 L12 46 H20 L20 38 M30 38 L30 46 H38 L34 40" fill="${c.legs}" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/>`
    + `<path d="M12 24 Q12 40 24 40 Q36 40 36 24 Z" fill="${c.body}" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/>`
    + (c.belt ? `<path d="M16 34 H32 L30 40 H18 Z" fill="${c.belt}" stroke="#2b1a10" stroke-width="2"/>` : '')
    + (c.body2 || '')
    + (c.ears ? `<path d="M6 14 L14 18 L12 24 Z M42 14 L34 18 L36 24 Z" fill="${c.ears}" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/>` : '')
    + `<circle cx="24" cy="18" r="13" fill="${c.head}" stroke="#2b1a10" stroke-width="3"/>`
    + eyes
    + (c.mouth === false ? '' : `<path d="M18 23 Q24 28 30 23" stroke="#2b1a10" stroke-width="2.2" fill="${c.mouth || '#a53a2a'}" stroke-linecap="round"/>`)
    + (c.front || '')
    + (c.weapon === undefined ? `<path d="M38 24 L46 10" stroke="#8a5326" stroke-width="5" stroke-linecap="round"/>` : c.weapon);
}

// Stab mit Kopfstück (Schamane, Magier, Nekromantin)
const staff = (head) => `<path d="M40 42 L45 6" stroke="#2b1a10" stroke-width="6" stroke-linecap="round"/><path d="M40 42 L45 6" stroke="#8a5326" stroke-width="3" stroke-linecap="round"/>${head}`;
// Kapuze über dem Kopf (Augen bleiben frei)
const hood = (fill) => `<path d="M9 18 Q9 -2 24 -6 Q39 -2 39 18 Q24 6 9 18 Z" fill="${fill}" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/>`;

const TROLL = `<ellipse cx="48" cy="98" rx="34" ry="7" fill="rgba(20,30,40,.45)"/><path d="M26 76 L22 98 H42 L42 78 M56 78 L56 98 H76 L70 76" fill="#8a4a2e" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M14 44 Q10 84 48 86 Q86 84 82 44 Q70 28 48 28 Q26 28 14 44 Z" fill="#b5663e" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/><path d="M18 50 Q30 38 48 42 Q66 38 78 50 L74 62 Q48 54 22 62 Z" fill="#7d8896" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M26 52 L30 60 M48 46 V56 M70 52 L66 60" stroke="#c7d0da" stroke-width="3" stroke-linecap="round"/><circle cx="14" cy="60" r="12" fill="#b5663e" stroke="#2b1a10" stroke-width="3.5"/><circle cx="82" cy="60" r="12" fill="#b5663e" stroke="#2b1a10" stroke-width="3.5"/><path d="M84 54 L92 20 L80 24 L76 54" fill="#7a5230" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M34 26 L28 8 L40 20 M62 26 L68 8 L56 20" fill="#f2e3b8" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><circle cx="48" cy="28" r="17" fill="#c6744a" stroke="#2b1a10" stroke-width="4"/><path d="M36 22 L44 26 M60 22 L52 26" stroke="#2b1a10" stroke-width="3.5" stroke-linecap="round"/><circle cx="41" cy="28" r="3" fill="#ffe266" stroke="#2b1a10" stroke-width="1.5"/><circle cx="55" cy="28" r="3" fill="#ffe266" stroke="#2b1a10" stroke-width="1.5"/><path d="M38 36 Q48 42 58 36 L56 41 H40 Z" fill="#7a2f22" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M41 37 L43 31 M55 37 L53 31" stroke="#f6edd0" stroke-width="3.5" stroke-linecap="round"/>`;

// w, h: SVG-Box (Fußpunkt unten mittig); scale: Zusatzgröße
// Panzerkäfer (B-169): Teile der Figur. Farben: Schale enemy-beetle-shell #b0703a, Kanten enemy-beetle-ridge #7a4a24,
// Glanz enemy-beetle-shine #e8b27a, Kopf enemy-beetle-head #3a2a3a, Leib enemy-beetle-soft #e9a98c / -soft-line #b8705a
const BEETLE_BASE = `<ellipse cx="28" cy="45" rx="22" ry="4" fill="rgba(20,30,40,.4)"/><path d="M14 30 L5 36 L4 42 M16 34 L10 42 M20 36 L17 44 M42 30 L51 36 L52 42 M40 34 L46 42 M36 36 L39 44" fill="none" stroke="#2b1a10" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
const BEETLE_HEAD = `<path d="M20 36 Q28 30 36 36 Q34 44 28 44 Q22 44 20 36 Z" fill="#3a2a3a" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="24.5" cy="38" r="1.6" fill="#ffe27a"/><circle cx="31.5" cy="38" r="1.6" fill="#ffe27a"/><path d="M23 43 L20 47 M33 43 L36 47" stroke="#2b1a10" stroke-width="2.5" stroke-linecap="round"/>`;
const BEETLE_SHELL_SVG = `<path d="M6 34 Q4 10 28 8 Q52 10 50 34 Q28 40 6 34 Z" fill="#b0703a" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M10 28 Q28 20 46 28 M13 21 Q28 13 43 21 M18 15 Q28 9 38 15" fill="none" stroke="#7a4a24" stroke-width="2.5" stroke-linecap="round"/><path d="M28 9 V37" stroke="#2b1a10" stroke-width="2"/><path d="M13 19 Q18 13 24 11" fill="none" stroke="#e8b27a" stroke-width="3" stroke-linecap="round"/>`;
const CRACK_1 = `<path d="M20 14 L23 20 L19 25 M38 20 L35 26 L39 31" fill="none" stroke="#2b1a10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const CRACK_2 = `<path d="M28 9 L25 16 L30 22 L26 30 M10 26 L16 27 L14 32 M44 14 L40 17 L45 22" fill="none" stroke="#2b1a10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 11 Q46 13 48 20 L42 19 L41 14 Z" fill="#7a4a24" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/>`;
const BEETLE_SOFT = `<path d="M11 34 Q10 16 28 14 Q46 16 45 34 Q28 39 11 34 Z" fill="#e9a98c" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 28 Q28 23 42 28 M15 22 Q28 17 41 22" fill="none" stroke="#b8705a" stroke-width="2" stroke-linecap="round"/>`;

// B-180: Nekromantin als Endboss (SVG aus der Bauvorlage docs/design/elemente/Gegner-Nekromantin.md)
const NECRO_GLOW = '#7dff9a'; // necro-glow (Phase 1)
const NECRO_GLOW_2 = '#ff5fd0'; // necro-glow-2 (Phase 2)
const NECRO_SVG = `<ellipse cx="38" cy="88" rx="22" ry="5" fill="rgba(20,30,40,.4)"/><g data-part="cloak"><path d="M16 40 Q8 64 5 86 Q15 80 22 88 Q30 80 38 88 Q46 80 54 88 Q62 80 71 86 Q68 64 60 40 Z" fill="#2a1c40" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/></g><path d="M25 42 Q23 64 25 86 H51 Q53 64 51 42 Z" fill="#5b3d8a" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M38 62 V86" stroke="#7dff9a" stroke-width="2" opacity=".8"/><path d="M25 56 H51 V62 H25 Z" fill="#3d2a5c" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="38" cy="59" r="3" fill="#7dff9a" stroke="#2b1a10" stroke-width="1.5"/><path d="M50 42 Q60 44 62 52 L56 55 Q52 50 50 50 Z" fill="#5b3d8a" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 42 Q16 44 14 52 L20 55 Q24 50 26 50 Z" fill="#5b3d8a" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="16" cy="54" r="4" fill="#a8c8a0" stroke="#2b1a10" stroke-width="2"/><circle cx="14" cy="47" r="4" fill="#7dff9a" opacity=".55"/><path d="M18 42 L23 28 L30 38 L38 32 L46 38 L53 28 L58 42 Z" fill="#3d2a5c" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 32 Q24 10 38 8 Q52 10 52 32 Q46 36 38 36 Q30 36 24 32 Z" fill="#3d2a5c" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M38 8 Q46 2 52 7 Q45 7 43 11" fill="#3d2a5c" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="38" cy="25" rx="9" ry="8" fill="#1a1226"/><circle cx="33" cy="24.5" r="5" fill="#7dff9a" opacity=".3"/><circle cx="43" cy="24.5" r="5" fill="#7dff9a" opacity=".3"/><path d="M31 24 L35 25.5 M45 24 L41 25.5" stroke="#7dff9a" stroke-width="3" stroke-linecap="round"/><path d="M62 88 L64 14" stroke="#2b1a10" stroke-width="6" stroke-linecap="round"/><path d="M62 88 L64 14" stroke="#8a5326" stroke-width="3" stroke-linecap="round"/><circle cx="62" cy="52" r="4.5" fill="#a8c8a0" stroke="#2b1a10" stroke-width="2"/><circle cx="64" cy="10" r="12" fill="#7dff9a" opacity=".3"/><path d="M64 17 Q54 14 55 4 Q59 10 64 11 Q69 10 73 4 Q74 14 64 17 Z" fill="#8a5326" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="64" cy="9" r="5" fill="#7dff9a" stroke="#2b1a10" stroke-width="2"/><circle cx="62.5" cy="7.5" r="1.8" fill="#ffffff"/><circle cx="64" cy="22" r="4.5" fill="#f2e9d8" stroke="#2b1a10" stroke-width="2"/><circle cx="62.4" cy="21.6" r="1.2" fill="#2b1a10"/><circle cx="65.6" cy="21.6" r="1.2" fill="#2b1a10"/>`;
// Verlangsamt: Reif am Saum statt Eisblock (Boss ist immun gegen Einfrieren); Eisfarbe wie ICE_SHELL
const NECRO_RIME = `<path d="M7 84 L10 77 L14 82 L19 76 L23 83 L28 77 L33 83 L38 77 L43 83 L48 77 L53 83 L57 76 L62 82 L66 77 L69 84 Q38 90 7 84 Z" fill="#dff7ff" fill-opacity=".75" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><path d="M14 82 L19 78 M38 79 L43 83 M57 78 L62 82" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
// Phase 2: gleiche Figur, Leuchten magenta (Zeichen zusätzlich: kreisende Schädel in render-necro.js)
const NECRO_PHASE2 = { w: 76, h: 92, big: 'necroScale', svg: NECRO_SVG.replaceAll(NECRO_GLOW, NECRO_GLOW_2) };
export const NECRO_VARIANT_P2 = 2;

const ENEMY_SVG = {
  grunt: { w: 46, h: 50, svg: goblinSvg() },
  runner: {
    w: 56, h: 46,
    svg: `<ellipse cx="30" cy="42" rx="17" ry="3.5" fill="rgba(20,30,40,.4)"/><path d="M2 14 H14 M0 22 H12 M4 30 H14" stroke="#fff3d2" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M18 30 L12 40 M30 32 L36 42" stroke="#2b1a10" stroke-width="5" stroke-linecap="round"/><path d="M18 30 L12 40 M30 32 L36 42" stroke="#e8b928" stroke-width="2" stroke-linecap="round"/><path d="M16 18 Q18 34 32 34 Q44 32 42 20 Q34 12 16 18 Z" fill="#f4cf3a" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 12 L22 6 L26 14 Z" fill="#f4cf3a" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="38" cy="14" r="10" fill="#ffe266" stroke="#2b1a10" stroke-width="3"/><path d="M32 6 L26 0 L36 4 Z" fill="#ffe266" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="41" cy="13" r="3.4" fill="#fff" stroke="#2b1a10" stroke-width="1.5"/><circle cx="42" cy="13" r="1.5" fill="#2b1a10"/><path d="M46 17 L52 18" stroke="#2b1a10" stroke-width="3" stroke-linecap="round"/>`,
  },
  tank: { w: 96, h: 104, svg: TROLL },
  // Oger-König: Troll mit Krone (Größe über FIGURE_STYLE.bossScale)
  boss: {
    w: 96, h: 104, big: 'bossScale',
    svg: TROLL + `<path d="M33 16 L31 -2 L40 7 L48 -6 L56 7 L65 -2 L63 16 Q48 10 33 16 Z" fill="#f2c14e" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><circle cx="48" cy="6" r="3" fill="#d6483a" stroke="#2b1a10" stroke-width="1.5"/>`,
  },
  // Schamane: weiße Robe und Stab mit grünem Licht
  healer: {
    w: 46, h: 50,
    svg: goblinSvg({ legs: '#d9d2bf', body: '#f4f1e6', belt: '#3fbf8f', weapon: staff(`<circle cx="45" cy="6" r="5" fill="#7dff9a" stroke="#2b1a10" stroke-width="2.5"/>`) }),
  },
  // Schildträger: Helm und Rundschild
  shielded: {
    w: 46, h: 50,
    svg: goblinSvg({
      weapon: '',
      front: `<path d="M11 15 Q11 3 24 3 Q37 3 37 15 Z" fill="#9aa6b2" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="33" cy="31" r="11" fill="#8a5326" stroke="#2b1a10" stroke-width="3"/><circle cx="33" cy="31" r="6.5" fill="none" stroke="#c88a4c" stroke-width="2"/><circle cx="33" cy="31" r="3" fill="#d7dde0" stroke="#2b1a10" stroke-width="1.5"/>`,
    }),
  },
  // Magier: lila Kapuze und Robe, Stab mit blauer Kugel
  mage: {
    w: 46, h: 50,
    svg: goblinSvg({ legs: '#4b2a75', body: '#6b3fa0', belt: '#f2c14e', ears: null, front: hood('#7a4bb0'), weapon: staff(`<circle cx="45" cy="6" r="5" fill="#9fe8ff" stroke="#2b1a10" stroke-width="2.5"/>`) }),
  },
  // Skelett: Knochenfarbe, leere Augen, Rippen
  skeleton: {
    w: 46, h: 50,
    svg: goblinSvg({ legs: '#d9cfb8', body: '#e6dcc6', belt: null, ears: null, head: '#f2e9d8', sockets: true, mouth: false,
      body2: `<path d="M17 28 H31 M17 33 H31" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/>`,
      front: `<path d="M19 25 H29" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/>`,
      weapon: `<path d="M38 24 L46 10" stroke="#2b1a10" stroke-width="6" stroke-linecap="round"/><path d="M38 24 L46 10" stroke="#f2e9d8" stroke-width="3" stroke-linecap="round"/>` }),
  },
  // Nekromantin (B-180, Bauvorlage Gegner-Nekromantin): Umhang (<g data-part="cloak">, weht live), Robe, Kapuze,
  // Leuchtstab mit Totenkopf. Farben: necro-cloak #2a1c40, necro-robe #5b3d8a, necro-robe-dark #3d2a5c, necro-face #1a1226,
  // necro-skin #a8c8a0, necro-glow #7dff9a (Phase 2: NECRO_PHASE2 mit necro-glow-2). Größe über FIGURE_STYLE.necroScale.
  necro: { w: 76, h: 92, big: 'necroScale', svg: NECRO_SVG },
  // Glutling (B-170): Flamme mit Gesicht, Bodenglühen; Lodern, Funken und Dampf in render-enemies.js. Nie mit Eis.
  ember: {
    w: 42, h: 52,
    svg: `<ellipse cx="21" cy="49" rx="14" ry="3.6" fill="#ff7a1f" opacity=".35"/><ellipse cx="21" cy="49" rx="8" ry="2" fill="rgba(20,30,40,.35)"/><path d="M21 2 Q25 12 31 14 Q30 8 34 6 Q40 20 37 32 Q34 46 21 46 Q8 46 5 32 Q3 22 10 14 Q12 20 15 20 Q14 10 21 2 Z" fill="#ff7a1f" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M21 16 Q27 24 29 31 Q30 41 21 42 Q12 41 13 31 Q15 24 21 16 Z" fill="#ffc23a"/><ellipse cx="21" cy="37" rx="5" ry="4" fill="#ffe58a"/><ellipse cx="16.5" cy="30" rx="2.4" ry="3" fill="#2a1a17"/><ellipse cx="25.5" cy="30" rx="2.4" ry="3" fill="#2a1a17"/><circle cx="17" cy="29" r="0.9" fill="#ffe58a"/><circle cx="26" cy="29" r="0.9" fill="#ffe58a"/><path d="M13 25 L19 27 M29 25 L23 27" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/><path d="M12 47 L15 42 L18 47 Z M24 47 L27 43 L30 47 Z" fill="#4a2a22" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/>`,
  },
  // Irrlicht (B-168): Lichttropfen mit Schweif, schwebt; Flackern in render-enemies.js, Ausweichen in render-fx.js
  wisp: {
    w: 40, h: 50,
    svg: `<ellipse cx="20" cy="47" rx="8" ry="2.2" fill="rgba(20,30,40,.25)"/><circle cx="20" cy="20" r="18" fill="#9effd9" opacity=".22"/><circle cx="20" cy="20" r="13" fill="#9effd9" opacity=".3"/><path d="M20 8 Q31 8 31 19 Q31 29 23 32 Q21 37 15 41 Q17 35 14 32 Q9 28 9 19 Q9 8 20 8 Z" fill="#c9fff0" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="20" cy="18" rx="6" ry="6.5" fill="#ffffff"/><ellipse cx="17.5" cy="19" rx="1.6" ry="2.4" fill="#2b1a10"/><ellipse cx="22.5" cy="19" rx="1.6" ry="2.4" fill="#2b1a10"/><circle cx="7" cy="30" r="1.8" fill="#ffffff" stroke="#2b1a10" stroke-width="1"/><circle cx="33" cy="35" r="1.4" fill="#ffffff" stroke="#2b1a10" stroke-width="1"/>`,
  },
  // Fledermaus (B-167): fliegt (Körper 17 px über dem Boden), Schatten zeichnet render-enemies.js
  // Farben: Flügel enemy-bat-wing #4a3560, Körper enemy-bat-body #6b4a80, Rippen enemy-bat-vein #8a6aa8
  bat: {
    w: 52, h: 50,
    svg: `<path d="M22 18 Q12 4 1 9 Q5 14 3 21 Q9 18 12 23 Q15 19 19 25 Z" fill="#4a3560" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 18 Q40 4 51 9 Q47 14 49 21 Q43 18 40 23 Q37 19 33 25 Z" fill="#4a3560" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 13 L6 11 M20 16 L10 19 M32 13 L46 11 M32 16 L42 19" stroke="#8a6aa8" stroke-width="1.5" stroke-linecap="round"/><path d="M19 13 L18 3 L24 10 Z M33 13 L34 3 L28 10 Z" fill="#6b4a80" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="26" cy="20" rx="9" ry="10" fill="#6b4a80" stroke="#2b1a10" stroke-width="3"/><circle cx="22.5" cy="18" r="2.6" fill="#ffe27a" stroke="#2b1a10" stroke-width="1.5"/><circle cx="29.5" cy="18" r="2.6" fill="#ffe27a" stroke="#2b1a10" stroke-width="1.5"/><path d="M23 25 L24.5 28.5 L26 25 L27.5 28.5 L29 25" fill="#fff3d2" stroke="#2b1a10" stroke-width="1.2" stroke-linejoin="round"/><path d="M23 30 L22 33 M29 30 L30 33" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/>`,
  },
  // Panzerkäfer (B-169) mit voller Schale; Stufen in BEETLE_SHELL
  beetle: { w: 56, h: 48, svg: BEETLE_BASE + BEETLE_SHELL_SVG + BEETLE_HEAD },
};
// Eingefrorener Goblin (Z.111) und der Eiskristall daraus als Überzug für alle anderen Typen
const ICED = { w: 54, h: 56, svg: `<ellipse cx="27" cy="50" rx="17" ry="4" fill="rgba(20,30,40,.4)"/><path d="M14 28 Q14 44 27 44 Q40 44 40 28 Z" fill="#8fd0e8" stroke="#2b1a10" stroke-width="3"/><path d="M8 18 L16 22 L14 28 Z M46 18 L38 22 L40 28 Z" fill="#9fdcf0" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="27" cy="22" r="13" fill="#a8e2f5" stroke="#2b1a10" stroke-width="3"/><path d="M20 20 H25 M30 20 H35" stroke="#2b1a10" stroke-width="2.5" stroke-linecap="round"/><path d="M5 40 L12 8 L21 36 L28 2 L35 36 L44 10 L50 40 L44 52 H10 Z" fill="#dff7ff" fill-opacity=".55" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 12 L18 36" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` };
// Überzug für andere Typen: Lichthof (Z.139) dahinter, Kristall etwas durchsichtiger, damit die Figur erkennbar bleibt
const ICE_GLOW = `<circle cx="27" cy="30" r="30" fill="url(#s1-iceglow)" opacity=".8"/>`;
const ICE_SHELL = `<path d="M5 40 L12 8 L21 36 L28 2 L35 36 L44 10 L50 40 L44 52 H10 Z" fill="#dff7ff" fill-opacity=".4" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 12 L18 36" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;

// Zusatzbilder (nicht in ENEMY_SVG, damit ENEMY_KINDS nur echte Gegnertypen enthält)
// Fledermaus, Flügel oben (Bild 1 des Flügelschlags)
const BAT_FRAMES = { 1: { w: 52, h: 50, svg: `<path d="M22 18 Q14 0 4 1 Q6 7 3 12 Q10 11 12 16 Q16 14 19 22 Z" fill="#4a3560" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 18 Q38 0 48 1 Q46 7 49 12 Q42 11 40 16 Q36 14 33 22 Z" fill="#4a3560" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 13 L8 4 M20 16 L8 11 M32 13 L44 4 M32 16 L44 11" stroke="#8a6aa8" stroke-width="1.5" stroke-linecap="round"/><path d="M19 13 L18 3 L24 10 Z M33 13 L34 3 L28 10 Z" fill="#6b4a80" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="26" cy="20" rx="9" ry="10" fill="#6b4a80" stroke="#2b1a10" stroke-width="3"/><circle cx="22.5" cy="18" r="2.6" fill="#ffe27a" stroke="#2b1a10" stroke-width="1.5"/><circle cx="29.5" cy="18" r="2.6" fill="#ffe27a" stroke="#2b1a10" stroke-width="1.5"/><path d="M23 25 L24.5 28.5 L26 25 L27.5 28.5 L29 25" fill="#fff3d2" stroke="#2b1a10" stroke-width="1.2" stroke-linejoin="round"/><path d="M23 30 L22 33 M29 30 L30 33" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/>` } };
// Panzerkäfer nach Anzeige-Stufe (5 = ENEMY_SVG.beetle): 3 zwei Risse, 1 Loch, 0 ohne Schale
const BEETLE_SHELL = {
  3: { w: 56, h: 48, svg: BEETLE_BASE + BEETLE_SHELL_SVG + CRACK_1 + BEETLE_HEAD },
  1: { w: 56, h: 48, svg: BEETLE_BASE + BEETLE_SHELL_SVG + CRACK_1 + CRACK_2 + BEETLE_HEAD },
  0: { w: 56, h: 48, svg: BEETLE_BASE + BEETLE_SOFT + BEETLE_HEAD },
};
// Anzeige-Stufe aus den verbliebenen Schichten (5,4 -> 5; 3,2 -> 3; 1 -> 1; 0 -> 0); ohne Zahl: volle Schale
export function shellStage(n) {
  if (!Number.isFinite(n)) return 5;
  return n >= 4 ? 5 : n >= 2 ? 3 : n >= 1 ? 1 : 0;
}
function variantDef(type, variant) {
  if (type === 'bat' && Object.hasOwn(BAT_FRAMES, variant)) return BAT_FRAMES[variant];
  if (type === 'beetle' && Object.hasOwn(BEETLE_SHELL, variant)) return BEETLE_SHELL[variant];
  if (type === 'necro' && variant === NECRO_VARIANT_P2) return NECRO_PHASE2;
  return null;
}

const enemyCache = new Map();
// Eis-Teile (Rahmen 54 x 56 des Entwurfs) auf die Figur gestreckt; Box der Figur wächst mit
function withIce(f, shell) {
  const glow = parseFigure(ICE_GLOW).all;
  const sh = shell ? parseFigure(ICE_SHELL).all : null;
  const sx = (f.w / ICED.w) * (shell ? 1.1 : 1), sy = (f.h / ICED.h) * (shell ? 1.05 : 1);
  const ice = { origin: [f.w / 2, f.h], scale: [sx, sy], size: [ICED.w, ICED.h] };
  const b = boxOf(sh ? glow.concat(sh) : glow);
  const tx = (x) => f.w / 2 + (x - ICED.w / 2) * sx, ty = (y) => f.h + (y - ICED.h) * sy;
  const box = pad([Math.min(f.box[0], tx(b[0])), Math.min(f.box[1], ty(b[1])), Math.max(f.box[2], tx(b[2])), Math.max(f.box[3], ty(b[3]))], 1);
  return { ...f, box, glow, shell: sh, ice };
}
function build(def, extra = '') {
  const parsed = parseFigure(def.svg + extra);
  const f = { w: def.w, h: def.h, big: def.big || null, els: parsed.all, box: pad(boxOf(parsed.all), 2) };
  // B-180: Umhang (<g data-part="cloak">) weht live: back = davor (Schatten), cloak, front = Rest (Sprite)
  const ci = parsed.groups.findIndex((g) => g.name === 'cloak');
  if (ci >= 0) {
    f.back = parsed.groups.slice(0, ci).flatMap((g) => g.els);
    f.cloak = parsed.groups[ci].els;
    f.front = parsed.groups.slice(ci + 1).flatMap((g) => g.els);
  }
  return f;
}
// Figur eines Gegnertyps; frozen: eingefrorene Fassung (Goblin eigener Entwurf, sonst mit Eis-Überzug, Glutling nie).
// variant: Zusatzbild (Fledermaus 1 = Flügel oben, Panzerkäfer = Schalen-Stufe), sonst Grundbild
export function enemyFigure(type, frozen, variant) {
  const base = Object.hasOwn(ENEMY_SVG, type) ? ENEMY_SVG[type] : null;
  if (!base) return null;
  const alt = variantDef(type, variant);
  const ice = !!frozen && type !== 'ember';
  const key = `${type}:${ice ? 1 : 0}:${alt ? variant : ''}`;
  let f = enemyCache.get(key);
  if (f) return f;
  const def = alt || base;
  if (!ice) f = build(def);
  else if (type === 'necro') f = build(def, NECRO_RIME); // B-180: nie Eisblock, nur Reif am Saum
  else if (type === 'grunt') f = withIce(build(ICED), false); // eigener Entwurf (54 x 56)
  else f = withIce(build(def), true);
  enemyCache.set(key, f);
  return f;
}
export const ENEMY_KINDS = Object.keys(ENEMY_SVG);
