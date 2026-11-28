// B-196: Eiswelt im Albtraum (Stil C kalt), Bauvorlage docs/design/elemente/Karte-Eiswelt-Albtraum.md. Platzhalter: nur Palette.
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
  },
  shapes: {},
  frame: { big: [], mid: [], small: [], edge: [] },
  obstacle: {},
  motion: [
    { kind: 'fall', count: [10, 6], color: '#ffffff', alpha: 0.95, r: [2.4, 4], period: 5 },
    { kind: 'fall', count: [18, 8], color: '#ffffff', alpha: 0.55, r: [0.9, 1.8], period: 11 },
    { kind: 'blink', count: [2, 0], color: '#9fe8ff' },
  ],
};
