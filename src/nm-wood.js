// B-193: Holz der HUD-Plaketten je Karte im Albtraum und mit Nacht-Look (Bauvorlage docs/design/elemente/HUD-Albtraum-Holz.md).
// Nur Zeichnen, rein und testbar: liefert die Rand-Deko als SVG-Text. Farben als CSS-Tokens (style.css :root).
// Koordinaten in px der Plakette (0..w, 0..h); Deko nur im oberen Rand (0–8 px) und unter der Unterkante.

// Holz je Karte (Wiese moss, Eiswelt ice, Zangenangriff rust, Zwei Fronten iron, Vulkan ember, Nachtfriedhof iron)
export const NM_WOOD_OF_MAP = { meadow: 'moss', ice: 'ice', fork: 'rust', twin: 'iron', volcano: 'ember', graveyard: 'iron' };
export const NM_WOOD_KINDS = ['moss', 'ice', 'rust', 'iron', 'ember'];
// Stilname je Karte für die Albtraum-Plakette (Karten-Bauvorlagen)
export const NM_STYLE_NAME = { meadow: 'Verfluchter Wald', ice: 'Düstere Magie', fork: 'Verbrannte Steppe', twin: 'Düstere Magie', volcano: 'Verbrannte Erde', graveyard: 'Verfluchter Friedhof' };
// Überstand der Deko unter der Plakette in px (Höhe des SVG = Plakettenhöhe + Überstand)
export const NM_WOOD_OVERHANG = { moss: 30, ice: 22, rust: 0, iron: 12, ember: 0 };

// Holz der Karte, wenn Albtraum oder Nacht-Look an ist, sonst null (heutiges Holz, keine Deko)
export function nmWoodKind(mapId, nightLook) {
  if (!nightLook) return null;
  return Object.hasOwn(NM_WOOD_OF_MAP, mapId ?? '') ? NM_WOOD_OF_MAP[mapId] : 'moss';
}

const INK = 'var(--ink)';
const r = (v) => +v.toFixed(1);

// Moosrand oben, hängende Moosfäden, zwei Augenpunkte unten rechts
function moss(w, h) {
  let d = '';
  for (let x = 24; x < w - 16; x += 38 + (x % 4) * 8) d += `M${x} 0 q-3 ${8 + (x % 5) * 2} 1 ${14 + (x % 4) * 3} `;
  return `<path d="M6 1 Q${r(w * 0.3)} 6 ${r(w * 0.55)} 1 Q${r(w * 0.8)} 6 ${w - 6} 1" stroke="var(--nm-moss-dark)" stroke-width="5" fill="none" stroke-linecap="round"/>`
    + (d ? `<path d="${d.trim()}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${d.trim()}" stroke="var(--nm-moss)" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : '')
    + `<circle class="nm-pulse" cx="${w - 30}" cy="${h - 8}" r="2.4" fill="var(--nm-eye-moss)"/><circle class="nm-pulse" cx="${w - 22}" cy="${h - 8}" r="2.4" fill="var(--nm-eye-moss)"/>`;
}

// Eiszapfen in wechselnden Abständen, Schneelinie oben
function ice(w) {
  let s = '';
  for (let i = 0, x = 14; x < w - 8; i++, x += 22 + (i % 3) * 6) {
    const L = 8 + ((i * 7) % 13);
    s += `<path d="M${x - 5} -2 L${x} ${L} L${x + 5} -2 Z" fill="var(--nm-icicle)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  }
  return s + `<path d="M2 -3 Q${r(w * 0.15)} 3 ${r(w * 0.3)} -2 Q${r(w * 0.5)} 4 ${r(w * 0.67)} -2 Q${r(w * 0.83)} 3 ${w - 2} -3" stroke="var(--nm-snow)" stroke-width="5" fill="none" stroke-linecap="round"/>`;
}

// Gezackte Brandkante oben, Brandfleck unten rechts; glow: Glutpunkte (ember), sonst Rostflecken (rust)
function char(w, h, glow) {
  let p = 'M2 2';
  for (let x = 2; x <= w - 2; x += 14) p += ` L${x + 7} ${4 + ((x / 14) % 3) * 3} L${Math.min(x + 14, w - 2)} 2`;
  let s = `<path d="${p} L${w - 2} -2 L2 -2 Z" fill="var(--nm-char-edge)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
    + `<path d="M${w - 70} ${h - 2} Q${w - 40} ${h - 14} ${w - 2} ${h - 6} V${h} H${w - 70} Z" fill="var(--nm-char-edge)" opacity=".7"/>`;
  if (glow) {
    s += `<g class="nm-pulse"><circle cx="${r(w * 0.12)}" cy="6" r="2.2" fill="var(--lava)"/><circle cx="${r(w * 0.47)}" cy="7" r="2.2" fill="var(--lava-core)"/><circle cx="${r(w * 0.74)}" cy="5" r="2.2" fill="var(--lava)"/></g>`;
  } else {
    s += `<ellipse cx="${r(w * 0.3)}" cy="${r(h * 0.55)}" rx="10" ry="4" fill="var(--nm-rust)" opacity=".6"/><ellipse cx="${r(w * 0.62)}" cy="${r(h * 0.35)}" rx="7" ry="3" fill="var(--nm-rust)" opacity=".6"/>`;
  }
  return s;
}

// Eisenband (14 breit) auf jedem Trenner, Runenleiste unten (70 % breit) mit 7 Runen
function iron(w, h, xs) {
  const strap = (x) => `<rect class="nm-strap" x="${r(x - 7)}" y="-2" width="14" height="${h}" rx="2" fill="var(--nm-iron)" stroke="${INK}" stroke-width="2.5"/>`
    + `<path d="M${r(x - 4)} 0 V${h - 4}" stroke="var(--nm-iron-hi)" stroke-width="2" opacity=".7"/><circle cx="${r(x)}" cy="6" r="2.2" fill="#3a3e50"/><circle cx="${r(x)}" cy="${h - 10}" r="2.2" fill="#3a3e50"/>`;
  let runes = '';
  for (let i = 0; i < 7; i++) {
    const x = r(w * 0.18 + i * (w * 0.64 / 6));
    runes += `<path class="nm-pulse" d="M${r(x - 3)} ${h + 4} L${x} ${h - 1} L${r(x + 3)} ${h + 4} M${x} ${h - 1} V${h + 7}" stroke="var(--nm-rune)" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  }
  return xs.map(strap).join('')
    + `<path d="M${r(w * 0.15)} ${h - 1} H${r(w * 0.85)} L${r(w * 0.83)} ${h + 9} H${r(w * 0.17)} Z" fill="var(--nm-wood-iron-b)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` + runes;
}

// Deko-SVG einer Plakette (w × h = Außenmaß in px). sepXs: Mitten der Trenner (nur iron). Unbekannte Art: ''.
export function nmWoodDeco(kind, w, h, sepXs = []) {
  if (!NM_WOOD_KINDS.includes(kind)) return '';
  const W = Math.max(0, Math.round(Number.isFinite(w) ? w : 0));
  const H = Math.max(0, Math.round(Number.isFinite(h) ? h : 0));
  const xs = (sepXs || []).filter(Number.isFinite);
  const body = kind === 'moss' ? moss(W, H) : kind === 'ice' ? ice(W) : kind === 'iron' ? iron(W, H, xs) : char(W, H, kind === 'ember');
  return `<svg class="plq-deco" aria-hidden="true" width="${W}" height="${H + NM_WOOD_OVERHANG[kind]}">${body}</svg>`;
}

// Albtraum-Plakette (180 breit, Lücke 12) rechts neben der HUD-Leiste: linke Kante oder null, wenn bis zu den runden
// Knöpfen kein Platz für Plakette plus eine volle Boss-Leiste (reserve) bleibt. Die Boss-Leiste rückt dann neben die Plakette.
export const NM_PLAQUE = { width: 180, gap: 12 };
export function nmPlaquePlacement(hudRight, buttonsLeft, reserve = 0, { width, gap } = NM_PLAQUE) {
  if (!Number.isFinite(hudRight) || !Number.isFinite(buttonsLeft)) return null;
  const left = hudRight + gap;
  return left + width + Math.max(0, reserve) <= buttonsLeft ? left : null;
}
