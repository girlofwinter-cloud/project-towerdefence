// B-216: Nachtfriedhof im Albtraum, Bauvorlage docs/design/elemente/Karte-Nachtfriedhof-Albtraum.md. Nur Optik.
// Formen wie Zwei Fronten im Albtraum (Gruft, Grabsteine, verdrehte Bäume), dazu glühende Gruft-Tore, Glutrisse auf den
// Friedhöfen und rote Augen im Randwald. Wege, Friedhöfe, Hindernisse und Bauplätze bleiben wie in MAPS.graveyard.
import { TILE, PAINTED_STYLE, MAPS } from '../config.js';
import twin from './twin.js';

const U = PAINTED_STYLE.unit;        // Kachel in Entwurfs-px
const r1 = (v) => Math.round(v * 10) / 10;
const EMBER = '#ff5a2a', EMBER_CORE = '#ffd0a0', EYE = '#ff3a3a'; // night-ember, nm-rim-ember, nm-eye-red

// Friedhofflächen in Kacheln (aus MAPS.graveyard)
const YARDS = MAPS.graveyard.graveyards.map(({ tiles }) => {
  const cs = tiles.map((t) => t[0]), rs = tiles.map((t) => t[1]);
  return { c0: Math.min(...cs), r0: Math.min(...rs), c1: Math.max(...cs) + 1, r1: Math.max(...rs) + 1 };
});

// Glutrisse (Box 40x12 Entwurfs-px), nur auf Friedhofkacheln (nicht bebaubar): Lage als Anteil der Fläche
const CRACK_D = 'M0 6 L8 4 L13 8 L21 3 L28 7 L34 5 L40 8';
const CRACK_AT = [[[0.1, 0.12], [0.62, 0.2], [0.12, 0.6], [0.6, 0.86]], [[0.06, 0.15], [0.55, 0.12], [0.3, 0.8]]];
export const CRACKS = YARDS.flatMap((y, i) => CRACK_AT[i].map(([u, v]) => [
  r1((y.c0 + u * (y.c1 - y.c0)) * U), r1((y.r0 + v * (y.r1 - y.r0)) * U),
]));
const crack = ([x, y]) => `<g transform="translate(${x} ${y})"><path d="${CRACK_D}" fill="none" stroke="${EMBER}" stroke-width="5" opacity=".4" filter="url(#nm-soft)"/>`
  + `<path d="${CRACK_D}" fill="none" stroke="${EMBER}" stroke-width="2" stroke-linejoin="round"/><path d="${CRACK_D}" fill="none" stroke="${EMBER_CORE}" stroke-width="1" stroke-linejoin="round"/></g>`;

// Gruft-Tür je Friedhof (Spiel-px): Mitte der Fläche, etwas unten (wie die Gruft im gemalten Hintergrund)
export const DOORS = YARDS.map((y) => [r1(((y.c0 + y.c1) / 2) * TILE), r1((y.r1 - 0.45) * TILE)]);

// Verdrehter Baum mit roten Augen im Astloch (Form-px (59, 138), Maßstab wie twin)
const tree = twin.shapes.twistedTree;
const shapes = { ...twin.shapes, eyeTree: { ...tree, eyes: [[tree.w * (59 / 120), tree.h * (138 / 180)]] } };

function svgOver() {
  return `<g id="nm-cracks">${CRACKS.map(crack).join('')}</g>`;
}

export default {
  painted: {
    ground: ['#3e3446', '#2a2232', '#1a1420'],
    mottle: [0.16, 0.12, 0.2], mottleOpacity: 0.6,
    lit: [1, 0.35, 0.16], litOpacity: 0.14,
    sun: ['#ff5a2a', '#c58aff'],
    path: ['#120c16', '#2b1a10', '#4a3036', '#9a8a9a', '#b8a8b6'], pathDots: ['#e6d8e6', '#4a3036'],
    dotKind: 'tuft', dots: ['#2a2232', '#5a2030', '#c58aff'],
    pineShare: 0, leafy: 'bare',
    trunk: ['#2a2a40', '#5e5e7c'], pine: ['#2a2a40', '#5e5e7c', '#5e5e7c', '#8a8ab0'],
    rock: ['#6a7090', '#a6acc8'],
    // Friedhöfe: dunkler Boden, roter Rand, Gruft-Tor glüht (night-ember)
    yard: { ground: '#241c2a', edge: '#5a2030', grave: ['#aab0c8', '#5a5f78'], crypt: ['#8a8ea8', '#4a4c66'], door: EMBER, lantern: EMBER },
  },
  shapes,
  frame: {
    big: ['twistedTree', 'eyeTree', 'twistedTree', 'crypt'],
    mid: ['grave0', 'grave1', 'ironFence', 'twistedTree'],
    small: ['grave0', 'grave1', 'bushDark', 'cryptRock', 'fern'],
    edge: ['fern', 'cryptRock', 'bushDark'],
  },
  noCliffs: true,
  obstacle: { rock: 'cryptRockObstacle', tree: 'twistedTreeObstacle' },
  defs: twin.defs,
  svgOver,
  // Bewegung (Spiel-px), Reihenfolge = Wichtigkeit; Summe Desktop 10, Handy 8 (keine Glut-Funken: nie auf Bauplätzen)
  motion: [
    { kind: 'pulse', count: [2, 2], color: EMBER, base: 0.55, r: [22, 14], at: DOORS }, // Tor glimmt
    { kind: 'blink', count: [5, 4], color: EYE },                                        // rote Augen im Randwald
    { kind: 'fog', count: [3, 2], color: '#c58aff', alpha: [0.1, 0.16] },
  ],
};
