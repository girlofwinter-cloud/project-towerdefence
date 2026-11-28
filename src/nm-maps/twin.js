// B-198: Zwei Fronten im Albtraum (Stil C Gruft), Bauvorlage docs/design/elemente/Karte-ZweiFronten-Albtraum.md. Platzhalter: nur Palette.
export default {
  painted: {
    ground: ['#66807c', '#4a6468', '#3a4a62'],
    mottle: [0.10, 0.14, 0.24], mottleOpacity: 0.65,
    lit: [0.62, 0.84, 0.86], litOpacity: 0.24,
    sun: ['#9fe8ff', '#8a4aff'],
    path: ['#161a32', '#2b1a10', '#3c3a5a', '#a6acc6', '#c8cde2'], pathDots: ['#f0f0ff', '#3c3a5a'],
    dotKind: 'leaf', dots: ['#2e4448', '#8aa6a0', '#c58aff'],
    pineShare: 0, leafy: 'bare',
    trunk: ['#2a2a40', '#5e5e7c'], pine: ['#2a2a40', '#5e5e7c', '#5e5e7c', '#8a8ab0'],
    rock: ['#6a7090', '#a6acc8'],
  },
  shapes: {},
  frame: { big: [], mid: [], small: [], edge: [] },
  obstacle: {},
  motion: [
    { kind: 'blink', count: [2, 2], color: '#e6b8ff' },
    { kind: 'fog', count: [3, 2], color: '#a8c0ff', alpha: [0.08, 0.12] },
  ],
};
