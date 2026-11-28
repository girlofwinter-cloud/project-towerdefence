// B-197: Zangenangriff im Albtraum (Stil B Steppe), Bauvorlage docs/design/elemente/Karte-Zangenangriff-Albtraum.md. Platzhalter: nur Palette.
export default {
  painted: {
    ground: ['#b48e56', '#86603a', '#664630'],
    mottle: [0.28, 0.16, 0.07], mottleOpacity: 0.6,
    lit: [1.00, 0.74, 0.38], litOpacity: 0.3,
    sun: ['#ffd890', '#ffb060'],
    path: ['#3a2414', '#2b1a10', '#5a3a26', '#c9a682', '#e0c49e'], pathDots: ['#fff0d0', '#5a3a26'],
    dotKind: 'leaf', dots: ['#4a2e18', '#d8b070', '#ff7a1f'],
    pineShare: 0, leafy: 'bare',
    trunk: ['#1a1210', '#4a3430'], pine: ['#1a1210', '#2e201c', '#4a3430', '#2e201c'],
    rock: ['#6a5446', '#9a826e'],
  },
  shapes: {},
  frame: { big: [], mid: [], small: [], edge: [] },
  obstacle: {},
  embers: true,
  motion: [
    { kind: 'fall', count: [28, 12], color: '#e8dccc', alpha: 0.75, r: [1.4, 3] },
    { kind: 'rise', count: [10, 5], color: '#ffe58a', halo: '#ff7a1f', haloAlpha: 0.35 },
    { kind: 'fog', count: [2, 1], color: '#d8cfc4', alpha: [0.10, 0.12] },
  ],
};
