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
  // Nekromantin: lila Robe, Kapuze, Totenkopfstab (Größe über FIGURE_STYLE.necroScale)
  necro: {
    w: 46, h: 50, big: 'necroScale',
    svg: goblinSvg({ legs: '#3d2a5c', body: '#5b3d8a', belt: '#7dff9a', ears: null, head: '#a8c8a0', front: hood('#3d2a5c'),
      weapon: staff(`<circle cx="45" cy="5" r="5.5" fill="#f2e9d8" stroke="#2b1a10" stroke-width="2.5"/><circle cx="43" cy="5" r="1.4" fill="#2b1a10"/><circle cx="47" cy="5" r="1.4" fill="#2b1a10"/>`) }),
  },
  // Glutling (B-170): Platzhalter, Goblin in Glutfarben mit Flamme auf dem Kopf (finale Figur kommt vom designer)
  ember: {
    w: 46, h: 50,
    svg: goblinSvg({ legs: '#7a3f1e', body: '#c9794a', belt: '#d6483a', ears: '#c9794a', head: '#d79a2b', weapon: '',
      front: `<path d="M18 7 Q20 -2 24 -6 Q28 -2 30 7 Z" fill="#ffe266" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/>` }),
  },
  // Irrlicht (B-168): Platzhalter, leuchtender Kreis mit Schweif (finale Figur kommt vom designer)
  wisp: {
    w: 46, h: 50,
    svg: `<circle cx="24" cy="20" r="18" fill="url(#s1-iceglow)" opacity=".8"/><path d="M14 26 Q10 40 22 48 Q20 38 26 32 Z" fill="#bff0ff" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="24" cy="20" r="10" fill="#dff7ff" stroke="#2b1a10" stroke-width="3"/><circle cx="21" cy="17" r="3.5" fill="#fff"/>`,
  },
  // Fledermaus (B-167, Platzhalter bis zur Figur vom designer): Körper und zwei Flügel hoch über dem Weg,
  // Bodenschatten deutlich darunter, damit sie als Flieger erkennbar ist
  bat: {
    w: 46, h: 50,
    svg: `<ellipse cx="23" cy="46" rx="10" ry="3" fill="rgba(20,30,40,.3)"/>`
      + `<path d="M17 16 Q8 6 1 12 Q5 16 4 22 Q10 18 17 22 Z M29 16 Q38 6 45 12 Q41 16 42 22 Q36 18 29 22 Z" fill="#3a2d44" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/>`
      + `<ellipse cx="23" cy="19" rx="7" ry="8" fill="#5d4a66" stroke="#2b1a10" stroke-width="3"/>`
      + `<path d="M18 13 L19 7 L21 12 M28 13 L27 7 L25 12" fill="#5d4a66" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/>`
      + `<circle cx="20.5" cy="17" r="1.6" fill="#ffe266"/><circle cx="25.5" cy="17" r="1.6" fill="#ffe266"/>`,
  },
  // Panzerkäfer (B-169, Platzhalter bis zur Figur vom designer): Beine, gewölbte Schale mit Mittelnaht, Kopf mit Fühlern
  beetle: {
    w: 46, h: 50,
    svg: `<ellipse cx="24" cy="46" rx="16" ry="4" fill="rgba(20,30,40,.4)"/>`
      + `<path d="M12 36 L6 46 M24 40 L24 46 M36 36 L42 46" stroke="#2b1a10" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M24 4 L18 -2 M24 4 L30 -2" stroke="#2b1a10" stroke-width="2" stroke-linecap="round"/>`
      + `<circle cx="24" cy="10" r="7" fill="#3a2d44" stroke="#2b1a10" stroke-width="2.5"/>`
      + `<path d="M6 30 Q6 12 24 12 Q42 12 42 30 Q42 42 24 42 Q6 42 6 30 Z" fill="#2f7a3d" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/>`
      + `<path d="M24 13 V41" stroke="#2b1a10" stroke-width="2"/><path d="M13 20 Q16 16 20 16" stroke="#9aa6b2" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  },
};
// Eingefrorener Goblin (Z.111) und der Eiskristall daraus als Überzug für alle anderen Typen
const ICED = { w: 54, h: 56, svg: `<ellipse cx="27" cy="50" rx="17" ry="4" fill="rgba(20,30,40,.4)"/><path d="M14 28 Q14 44 27 44 Q40 44 40 28 Z" fill="#8fd0e8" stroke="#2b1a10" stroke-width="3"/><path d="M8 18 L16 22 L14 28 Z M46 18 L38 22 L40 28 Z" fill="#9fdcf0" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="27" cy="22" r="13" fill="#a8e2f5" stroke="#2b1a10" stroke-width="3"/><path d="M20 20 H25 M30 20 H35" stroke="#2b1a10" stroke-width="2.5" stroke-linecap="round"/><path d="M5 40 L12 8 L21 36 L28 2 L35 36 L44 10 L50 40 L44 52 H10 Z" fill="#dff7ff" fill-opacity=".55" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 12 L18 36" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` };
// Überzug für andere Typen: Lichthof (Z.139) dahinter, Kristall etwas durchsichtiger, damit die Figur erkennbar bleibt
const ICE_GLOW = `<circle cx="27" cy="30" r="30" fill="url(#s1-iceglow)" opacity=".8"/>`;
const ICE_SHELL = `<path d="M5 40 L12 8 L21 36 L28 2 L35 36 L44 10 L50 40 L44 52 H10 Z" fill="#dff7ff" fill-opacity=".4" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 12 L18 36" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;

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
function build(def) {
  const parsed = parseFigure(def.svg);
  return { w: def.w, h: def.h, big: def.big || null, els: parsed.all, box: pad(boxOf(parsed.all), 2) };
}
// Figur eines Gegnertyps; frozen: eingefrorene Fassung (Goblin eigener Entwurf, sonst mit Eis-Überzug)
export function enemyFigure(type, frozen) {
  const key = `${type}:${frozen ? 1 : 0}`;
  let f = enemyCache.get(key);
  if (f) return f;
  const def = Object.hasOwn(ENEMY_SVG, type) ? ENEMY_SVG[type] : null;
  if (!def) return null;
  if (!frozen) f = build(def);
  else if (type === 'grunt') f = withIce(build(ICED), false); // eigener Entwurf (54 x 56)
  else f = withIce(build(def), true);
  enemyCache.set(key, f);
  return f;
}
export const ENEMY_KINDS = Object.keys(ENEMY_SVG);
