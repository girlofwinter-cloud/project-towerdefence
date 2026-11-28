// B-195: Wiese im Albtraum (Stil A), Bauvorlage docs/design/elemente/Karte-Wiese-Albtraum.md. Platzhalter: nur Palette.
export default {
  painted: {
    ground: ['#6e927c', '#476a5e', '#34504e'],
    mottle: [0.05, 0.10, 0.14], mottleOpacity: 0.7,
    lit: [0.75, 0.90, 1.00], litOpacity: 0.2,
    sun: ['#d8f0ff', '#8a7ad0'],
    path: ['#1f302c', '#2b1a10', '#5a4e4a', '#b0a284', '#d0c39e'], pathDots: ['#eef6e0', '#5a4e4a'],
    dotKind: 'leaf', dots: ['#2e4a44', '#7f9e8a', '#9effd9'],
    pineShare: 0, leafy: 'bare',
    trunk: ['#2e2538', '#4e4060'], pine: ['#2e2538', '#4e4060', '#6a5a80', '#8a7aa0'],
    rock: ['#7a7488', '#a8a2b8'],
  },
  shapes: {},
  frame: { big: [], mid: [], small: [], edge: [] },
  obstacle: {},
  motion: [
    { kind: 'fog', count: [4, 2], color: '#c8d4f0', alpha: [0.13, 0.16] },
    { kind: 'blink', count: [10, 4], color: '#d8ff5a' },
    { kind: 'rise', count: [24, 10], color: '#efffc8', halo: '#d8ff9a' },
  ],
};
