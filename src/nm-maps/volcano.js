// B-199: Vulkan im Albtraum (Stil B Lava), Bauvorlage docs/design/elemente/Karte-Vulkan-Albtraum.md. Platzhalter: nur Palette.
export default {
  painted: {
    ground: ['#4a302c', '#33201e', '#2a1818'],
    mottle: [0.62, 0.16, 0.04], mottleOpacity: 0.32,
    lit: [1.00, 0.62, 0.22], litOpacity: 0.16,
    sun: ['#ff7a1f', '#ff7a1f'],
    path: ['#1c100e', '#2b1a10', '#3a2420', '#9c8478', '#b8a090'], pathDots: ['#ffd8b0', '#3a2420'],
    dotKind: 'ember', dots: ['#ff7a1f', '#ffb04a', '#8a7c78'],
    pineShare: 0, leafy: 'bare',
    trunk: ['#1a1210', '#4a3430'], pine: ['#1a1210', '#2e201c', '#4a3430', '#2e201c'],
    rock: ['#5a4a48', '#8a7a76'],
  },
  shapes: {},
  frame: { big: [], mid: [], small: [], edge: [] },
  obstacle: {},
  embers: true,
  motion: [
    { kind: 'rise', count: [26, 10], color: '#ffe58a', halo: '#ff7a1f', haloAlpha: 0.35 },
    { kind: 'fall', count: [12, 4], color: '#d8cfc4', alpha: 0.7, r: [1.4, 2.8] },
  ],
};
