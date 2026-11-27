// Zentrale Spiel-Konfiguration: alle Zahlen zum Balancing stehen hier.

export const TILE = 40;
export const COLS = 20;
export const ROWS = 14;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;
// Stil 1: Rand um das Spielfeld (Wald, Burg, Fahne, Klippen). Nur Optik: Spiel-Logik rechnet weiter im Feld (WIDTH x HEIGHT).
export const FRAME_MARGIN = 50; // px bei 1x je Seite (1,25 Kacheln)
export const VIEW_WIDTH = WIDTH + 2 * FRAME_MARGIN;   // Canvas = Feld + 2 * Rand
export const VIEW_HEIGHT = HEIGHT + 2 * FRAME_MARGIN;
// HiDPI (nur Optik): Backing-Store des Canvas = Anzeigegröße (style.css, Vollbild) x Pixeldichte, diese höchstens maxDpr
export const VIEW_FIT = { maxDpr: 2, maxSide: 4096 }; // maxSide: Obergrenze des Backing-Store je Seite in Geräte-px (Handy-Nahansicht)
// C6 Handy: Wischen über das Feld (viewport.js). tapSlop: ab so vielen CSS-px Bewegung (oder Feld-Verschiebung) ist es Wischen, kein Tipp.
export const VIEWPORT = { tapSlop: 10 };

export const START_GOLD = 140;
export const START_LIVES = 10;
// Ab dieser Lebensanzahl (oder weniger) warnt das HUD in Rot.
export const LOW_LIVES = 3;
export const MAX_WAVES = 20;
export const SELL_RATIO = 0.7;
export const MAX_LEVEL = 3;
// Zielregeln der Türme (Reihenfolge = Umschalt-Reihenfolge) mit deutschen Anzeigenamen
export const TARGET_MODES = ['first', 'last', 'strong', 'close'];
export const TARGET_MODE_NAMES = { first: 'Erster', last: 'Letzter', strong: 'Stärkster', close: 'Nächster' };

// Spielgeschwindigkeiten (Taste F / Button) und maximale Teilschrittlänge der Simulation in Sekunden.
export const SPEED_STEPS = [1, 2, 3];
export const MAX_SUBSTEP = 0.05;

// Anteil Bäume bei Hindernissen (Rest sind Felsen), 0..1.
export const OBSTACLE_TREE_SHARE = 0.7;

// Stil-Parameter einer Karte (B-072): Ist theme.<key> ein Objekt, überschreibt es einzelne Werte des Basisblocks
// (z. B. Palette von Eiswelt oder Zangenangriff); bei true/fehlend gilt der Basisblock der Wiese unverändert.
export function themed(mapId, key, base) {
  const v = MAPS[mapId]?.theme?.[key];
  return v && typeof v === 'object' ? { ...base, ...v } : base;
}

// B-104: Fluss und See der Wiese (Kacheln [spalte, zeile]). Der Fluss ist eine Kette von oben (unter dem Baumrahmen)
// bis zum See, inklusive Brückenkachel; Wasser = Fluss + See ohne Brücken (Brücken liegen auf dem Weg).
// Stil 1: Kacheln folgen der gemalten Form aus dem Entwurf (MEADOW_PAINTED_WATER): Wasser, wo die Kachelmitte im gemalten
// Wasser liegt. Gleich viele Wasserkacheln wie vorher (13 ohne Brücke), also gleich viele Bauplätze.
const MEADOW_RIVER = [[1, 0], [1, 1], [1, 2], [1, 3], [0, 3], [0, 4]];
const MEADOW_LAKE = [[0, 11], [1, 11], [2, 11], [3, 11], [0, 12], [1, 12], [2, 12], [3, 12]];
// Gemalte Form (Entwurf Z.66–77) in Entwurfs-px, Feld ab (0,0), Kachel 57: Fluss als kubische Bézier-Kette
// [Start, dann je 3 Punkte; Breite PAINTED_STYLE.river], See als Ellipse des Wassers [cx, cy, rx, ry] (Sandufer im Zeichnen +22/+18 wie im Entwurf).
const MEADOW_PAINTED_WATER = {
  // Karten-Feinschliff: Fluss eng über den Flusskacheln geführt, See etwas kleiner (Bauplätze höchstens 15 % unter Wasser)
  river: [[80, -98], [82, -40], [90, 40], [86, 130], [84, 185], [70, 198], [40, 200], [18, 201], [28, 225], [28, 250], [28, 264], [-30, 262], [-81, 266]],
  lake: [114, 688, 118, 60],
};
const MEADOW_BRIDGES = [[1, 2]];
// Kacheln einer Liste ohne die Brücken-Kacheln (Brücken liegen auf dem Weg, sind also weder Wasser noch Lava)
const withoutBridges = (list, bridges) => list.filter(([c, r]) => !bridges.some(([bc, br]) => bc === c && br === r));

// B-030: Lava des Vulkans (Kacheln [spalte, zeile]). Lavafluss als Kette von oben nach unten (1 Kachel breit, schlängelnd,
// inklusive Brückenkachel), dazu einzelne Lavatümpel neben dem Weg. Lava = Fluss + Tümpel ohne Brücken.
const VOLCANO_LAVA_RIVER = [
  [13, 0], [13, 1], [13, 2], [13, 3], [13, 4], [13, 5], [12, 5], [12, 6], [12, 7], [12, 8], [13, 8], [13, 9], [13, 10], [13, 11], [13, 12], [13, 13],
];
const VOLCANO_LAVA_POOLS = [[4, 6], [4, 7], [9, 8], [17, 7]]; // drei Tümpel: [4,6]+[4,7], [9,8], [17,7]
const VOLCANO_BRIDGES = [[13, 11]];

// Karten: Wegpunkte in Kachel-Koordinaten [spalte, zeile].
// Erster und letzter Punkt liegen außerhalb des Spielfelds (Ein-/Ausgang).
export const MAPS = {
  meadow: {
    name: 'Wiese',
    waypoints: [
      [-1, 2],
      [5, 2],
      [5, 8],
      [11, 8],
      [11, 3],
      [16, 3],
      [16, 11],
      [20, 11],
    ],
    // B-103: wenige Hindernisse (Art aus obstacleKind in decor.js): Fels, Baum
    obstacles: [[8, 1], [12, 12]],
    // B-104: Wasser ist nicht bebaubar (canBuild), Brücken sind Weg-Kacheln (nur Optik, Gegner laufen normal)
    river: MEADOW_RIVER,
    lake: MEADOW_LAKE,
    bridges: MEADOW_BRIDGES,
    water: [...withoutBridges(MEADOW_RIVER, MEADOW_BRIDGES), ...MEADOW_LAKE],
    paintedWater: MEADOW_PAINTED_WATER,
    // B-071: Wegpalette der Wiese (STIL.md); Eiswelt und Zangenangriff haben eigene Wegfarben (B-072, B-073).
    // B-103: decor.flatTrees, damit die Hindernisse im Flat-Pop-Stil erscheinen (Laubbaum, Fels mit Kontur)
    // Stil 1: painted = Hintergrund aus dem SVG des Entwurfs (render-painted.js); die alten Schichten bleiben Rückfall, solange das Bild lädt
    theme: { painted: true, treeFrame: true, ground: true, accents: true, light: true, paint: true, decorStyle: 'flatpop', decor: { flatTrees: true }, path: { main: '#e2c88f', edge: '#8f6a3b', outline: '#4a3418', mid: '#ecd5a0', fringe: '#94d266', fringeAccent: '#46893a', groove: '#3a6a2c' } },
  },
  // Eiswelt (B-029, Glatteis): Gegner rutschen schneller, Kanone und Frost sind schwächer. Modifikatoren (enemySpeed, towerDamage je Typ, slowStrength) und kühles Farbschema (theme).
  ice: {
    name: 'Eiswelt',
    waypoints: [
      [-1, 12],
      [4, 12],
      [4, 7],
      [9, 7],
      [9, 1],
      [14, 1],
      [14, 9],
      [17, 9],
      [17, 4],
      [20, 4],
    ],
    modifiers: { enemySpeed: 1.14, towerDamage: { cannon: 0.95, frost: 0.7 }, slowStrength: 0.85 },
    // B-073: Eiswelt im Flat-Pop-Stil (STIL.md): Schneeboden mit Verwehungen, Tannen mit Schneekappe, glatter blaugrauer Weg
    // (dunkler als der Schnee), Eiskristalle und Eisfelsen als Streu-Deko, kühles Licht.
    // B-103: wenige Hindernisse: Fels, zwei Tannen
    obstacles: [[2, 2], [9, 12], [16, 12]],
    theme: {
      grass: ['#cfe6f2', '#d9edf6'], blade: '#9cc3d8',
      treeFrame: {
        rows: [
          { radius: [15, 19], depth: [0, 0.3], spacing: 26, shade: 0.3 },
          { radius: [16, 20], depth: [0.45, 0.8], spacing: 32, shade: 0.1 },
        ],
        spacingJitter: 6,
        kindShare: [0, 0, 0, 1], // nur Tannen
        fir: ['#2f6f5f', '#285f52'],
        firLift: 0.42,
        snow: '#ffffff',
        snowShade: '#c6dcec',
      },
      ground: {
        base: '#e3f1fa',
        light: 'rgba(255,255,255,0.38)',
        dark: 'rgba(160,196,220,0.22)',
        blade: ['#8fb6cc', '#9cc3d8', '#c9e4f2'],
        tufts: 260,
        plateaus: 7,
        plateauTop: '#f6fbff',
        plateauWall: 'rgba(150,186,210,0.9)',
        plateauRim: 'rgba(70,100,130,0.32)',
        plateauLight: 'rgba(255,255,255,0.55)',
      },
      light: { tint: '214,236,255', shadow: '38,64,108', gradientAlpha: 0.08, beamAlpha: 0.07, vignetteAlpha: 0.14, treeShadowAlpha: 0.14 },
      decorStyle: 'flatpop',
      decor: {
        flatTrees: true,
        firShare: 1,
        fir: ['#2f6f5f', '#285f52'],
        snow: '#ffffff', snowShade: '#c6dcec',
        bush: '#eef7fd', berry: '#7fe0ff', rock: '#8aa6bd', moss: '#ffffff',
        flowers: ['#ffffff', '#bff0ff', '#7fe0ff'], flowerCore: '#4aa8d0', stem: '#8fb6cc', tuft: '#8fb6cc', tuftLight: '#c9e4f2',
        pebble: '#9db3c9', wood: '#b9c7d6', woodDark: '#6a7f96', crystal: '#7fe0ff',
        obstacleGround: 'rgba(47,69,96,0.22)', // B-103: kühler Fleck unter Hindernissen statt Grün
        scatterChance: 0.1,
        scatterKinds: [['crystal', 0.28], ['snowpile', 0.3], ['rockgroup', 0.16], ['pebbles', 0.12], ['stakes', 0.08], ['sign', 0.06]],
      },
      // Stil 1 (G9): Schnee #eef6fb -> #a9c6dc, Flecken #5d7e9c, Tannen und Felsen mit Schneekappe, Eiskristalle als Tupfen
      painted: {
        ground: ['#eef6fb', '#cfe1ee', '#a9c6dc'], mottle: [0.36, 0.49, 0.61], mottleOpacity: 0.75, lit: [1, 1, 1], litOpacity: 0.6,
        sun: ['#ffffff', '#e4f3ff'], vignette: '#1c2c44', grainOpacity: 0.1,
        path: ['#8fb0c8', '#2f4560', '#4f6682', '#9db3c9', '#b4c7d9'], pathDots: ['#ffffff', '#4f6682'],
        dotKind: 'crystal', dots: ['#ffffff', '#bff0ff', '#7fe0ff'], dotChance: 0.16,
        pineShare: 1, pine: ['#285f52', '#2f6f5f', '#3d8270', '#9fd0c0'], snow: '#ffffff',
        rock: ['#8aa6bd', '#c9d8e6'], cliff: ['#f6fbff', '#f2f8fc', '#a9c6dc', '#6f8ea8', '#4f6682'],
        stone: ['#eef2f6', '#c4cfd9', '#8d9cab'],
      },
      path: { main: '#9db3c9', edge: '#4f6682', outline: '#2f4560', mid: '#b4c7d9', fringe: '#ffffff', fringeAccent: '#c6dcec', groove: '#62809a' },
      // B-142 Nacharbeit: gemalter Boden hell (Schnee), Flecken in Halm-Blau und Weiß, Licht kühl
      paint: { dark: [120, 166, 196], darkAlpha: 0.38, light: [255, 255, 255], lightAlpha: 0.55, tint: '214,236,255', shadow: '38,64,108', sunAlpha: 0.3 },
      // Glatter Eisweg: wenige Steine, weißer Glanz statt brauner Spurrillen, kühle Flecken
      pathStyle: {
        stoneChance: 0.14, rutColor: 'rgba(255,255,255,0.5)', rutWidth: 2.2,
        stoneColors: ['#7f94ab', '#c9d8e6'], pebbleColors: ['#8aa0b8', '#c9d8e6'], stoneShadow: 'rgba(38,64,108,0.4)',
        patchDark: 'rgba(79,102,130,0.16)', patchLight: 'rgba(255,255,255,0.3)',
        fringeKind: 'snow', // B-143 Nacharbeit: Schneeklumpen am Wegrand
      },
    },
  },
  // Zangenangriff (B-033): zwei Eingänge links oben und links unten, beide Wege laufen bei [10, 7] zusammen.
  // extraPaths: weitere Wegpunkt-Listen; Gegner verteilen sich abwechselnd auf alle Wege.
  // lanes (B-099): Gegnertyp -> fester Weg (0 = Hauptweg oben, 1 = erster extraPath unten). Nicht genannte Typen
  // wechseln weiter ab. Oben kommt der schnelle Schwarm (Flitzer), unten die schwere Kolonne (Troll, Schildträger,
  // Schamane), damit man auf beiden Seiten unterschiedlich bauen muss.
  fork: {
    name: 'Zangenangriff',
    lanes: { runner: 0, tank: 1, shielded: 1, healer: 1, mage: 1 },
    waypoints: [
      [-1, 2],
      [5, 2],
      [5, 5],
      [10, 5],
      [10, 7],
      [15, 7],
      [15, 2],
      [18, 2],
      [18, 12],
      [20, 12],
    ],
    // B-046/B-099: schwächere Kanone. Seit den festen Seiten (lanes) ohne schnellere Gegner und ohne Pfeil-Abzug:
    // Pfeil-Mix über beide Wege gewinnt mit 2 bis 8 Leben, nur die obere Seite verteidigt verliert in Welle 13 bis 14.
    // Bei enemySpeed 1,02 verliert auch die Strategie über beide Wege. Nicht ahnungslos ändern.
    modifiers: { towerDamage: { cannon: 0.92 } },
    // B-103: wenige Hindernisse: Baum, Fels, Baum, Baum
    obstacles: [[10, 1], [11, 2], [15, 11], [1, 6]],
    // B-072: Zangenangriff im Flat-Pop-Stil (STIL.md Hochland/Herbst): Herbstbäume, Felsgruppen, Laubhaufen.
    theme: {
      treeFrame: {
        kindShare: [0.5, 0.18, 0.17, 0.15],
        greens: ['#e0803a', '#d0642c', '#e8a93a', '#c4502f'],
        apple: '#c9482f',
        appleFruit: '#f2c14e',
        appleGlint: '#fff3c9',
        blossom: '#e8b23a',
        blossomFlower: '#f6e08a',
        fir: ['#5f7a3a', '#546e33'],
      },
      ground: {
        base: '#b3b45a',
        light: 'rgba(214,208,120,0.2)',
        dark: 'rgba(134,136,56,0.22)',
        blade: ['#868838', '#999a44', '#dcd883'],
        plateauTop: '#a8a950',
        plateauWall: 'rgba(112,100,46,0.88)',
        plateauRim: 'rgba(74,56,24,0.38)',
        plateauLight: 'rgba(240,228,150,0.2)',
      },
      light: { tint: '255,214,150', gradientAlpha: 0.08, beamAlpha: 0.04, vignetteAlpha: 0.15, treeShadowAlpha: 0.18 },
      decorStyle: 'flatpop',
      decor: {
        flatTrees: true,
        firShare: 0.2,
        treeColors: ['#e0803a', '#d0642c', '#e8a93a'],
        fir: ['#5f7a3a', '#546e33'],
        bush: '#a39a3a', berry: '#e0803a', rock: '#8b8c94', moss: '#c9a13f',
        flowers: ['#e0803a', '#d9503a', '#f0d070'], flowerCore: '#6e4d2a', stem: '#868838', tuft: '#868838', tuftLight: '#dcd883',
        pebble: '#a39f98', mushroomCap: '#c0652f', wood: '#a9763f', woodDark: '#6e4d2a',
        scatterChance: 0.09,
        scatterKinds: [['leafpile', 0.3], ['rockgroup', 0.2], ['log', 0.14], ['stump', 0.14], ['sign', 0.1], ['mushroom', 0.12]],
      },
      // Stil 1 (G9): Herbst warm: Goldocker #d9a94e -> Rostbraun #8a5a2b, Flecken Rost #b0482a und Orange #e0803a,
      // grüne Reste in der Mitte des Verlaufs und im Wegschatten; Laub #e0803a/#c9562f an Bäumen und als Tupfen
      painted: {
        ground: ['#d9a94e', '#c08a3c', '#8a5a2b'], mottle: [0.69, 0.28, 0.16], mottleOpacity: 0.42, lit: [0.92, 0.55, 0.24], litOpacity: 0.5,
        sun: ['#ffe2a8', '#ffc870'], vignette: '#2a1c0c',
        path: ['#666529', '#2b1a10', '#7d5632', '#d6ab70', '#e8c88e'], pathDots: ['#fff2c8', '#7d5632'],
        dotKind: 'leaf', dots: ['#e0803a', '#c9562f', '#e8a93a'], dotChance: 0.22,
        pineShare: 0.2, pine: ['#4e6a30', '#5f7a3a', '#71904a', '#b5c97a'], round: ['#c9562f', '#e0803a', '#f6c27a'], fruit: '#f2c14e',
        cliff: ['#cf9f4a', '#d3a34e', '#b98c5c', '#7a5a45', '#5e4331'],
      },
      path: { main: '#d6ab70', edge: '#7d5632', outline: '#4a3018', mid: '#e8c88e', fringe: '#e0803a', fringeAccent: '#c9562f', groove: '#666529' },
      pathStyle: { fringeKind: 'leaves' }, // B-143 Nacharbeit: Herbstlaub am Wegrand
      // B-142 Nacharbeit: gemalter Boden in Hochland-Oliv, helle Flecken goldgelb
      paint: { dark: [104, 106, 40], darkAlpha: 0.42, light: [236, 214, 128], lightAlpha: 0.3, tint: '255,214,150' },
    },
    extraPaths: [
      [
        [-1, 12],
        [3, 12],
        [3, 9],
        [10, 9],
        [10, 7],
        [15, 7],
        [15, 2],
        [18, 2],
        [18, 12],
        [20, 12],
      ],
    ],
  },
  // Zwei Fronten (B-099): zwei getrennte Wege, die erst kurz vor dem Ausgang bei [18, 7] zusammenlaufen.
  // Oben läuft der schnelle Schwarm, unten die schwere Kolonne (lanes); ein Turm am Zusammenfluss reicht nicht.
  twin: {
    name: 'Zwei Fronten',
    waypoints: [
      [-1, 1],
      [3, 1],
      [3, 5],
      [7, 5],
      [7, 1],
      [11, 1],
      [11, 5],
      [15, 5],
      [15, 1],
      [18, 1],
      [18, 7],
      [20, 7],
    ],
    extraPaths: [
      [
        [-1, 12],
        [3, 12],
        [3, 8],
        [7, 8],
        [7, 12],
        [11, 12],
        [11, 8],
        [15, 8],
        [15, 12],
        [18, 12],
        [18, 7],
        [20, 7],
      ],
    ],
    lanes: { runner: 0, tank: 1, shielded: 1, healer: 1, mage: 1 },
    // Gegner etwas langsamer, weil sich die Türme auf zwei Wege verteilen. Gemessen (Strategie-Tests, dt 1/30 und 1/60):
    // Kanonen-Mix über beide Wege gewinnt mit 3 bis 4 Leben, eine Seite allein verliert in Welle 2. Bei 0,85 wird es
    // für gute Platzierung zu leicht (10 Leben), bei 1,0 verliert jede Strategie bis Welle 10.
    modifiers: { enemySpeed: 0.9 },
    // B-103: wenige Hindernisse: Baum, Fels, Baum
    obstacles: [[1, 6], [6, 1], [12, 12]],
    // Spätsommer im Flat-Pop-Stil: gemischter Baumrahmen, warmes Gras, Pilze, Baumstümpfe und Wegweiser.
    theme: {
      treeFrame: {
        kindShare: [0.45, 0.15, 0.15, 0.25],
        greens: ['#4f9a3e', '#5aa845', '#448a38', '#62b04a'],
        fir: ['#336f3c', '#2c6236'],
      },
      ground: {
        base: '#7cb24f',
        light: 'rgba(196,226,120,0.18)',
        dark: 'rgba(70,120,40,0.2)',
        blade: ['#5a8f36', '#6aa040', '#c4e278'],
        plateauTop: '#74a94a',
        plateauWall: 'rgba(70,96,36,0.88)',
        plateauRim: 'rgba(40,60,20,0.38)',
        plateauLight: 'rgba(220,240,150,0.2)',
      },
      light: { tint: '255,232,170', gradientAlpha: 0.07, beamAlpha: 0.04, vignetteAlpha: 0.16, treeShadowAlpha: 0.18 },
      decorStyle: 'flatpop',
      decor: {
        flatTrees: true,
        firShare: 0.3,
        treeColors: ['#4f9a3e', '#5aa845', '#448a38'],
        fir: ['#336f3c', '#2c6236'],
        bush: '#4a8f3a', berry: '#c94a8a', rock: '#9a958c', moss: '#a6cf5a',
        flowers: ['#f6d64a', '#c94a8a', '#f4f1e6'], stem: '#5a8f36', tuft: '#5a8f36', tuftLight: '#c4e278',
        mushroomCap: '#c9542f', wood: '#b07c46', woodDark: '#6e4d2a',
        scatterChance: 0.1,
        scatterKinds: [['mushroom', 0.18], ['stump', 0.18], ['log', 0.16], ['rockgroup', 0.18], ['sign', 0.12], ['pebbles', 0.18]],
      },
      // Stil 1 (G9): Spätsommer #a6cf5a -> #4a6e2c, Blumen in Gelb, Pink, Weiß
      painted: {
        ground: ['#a6cf5a', '#78a043', '#4a6e2c'], mottle: [0.16, 0.27, 0.08], mottleOpacity: 0.65, lit: [1, 0.95, 0.55], litOpacity: 0.5,
        path: ['#4a6e2c', '#2b1a10', '#86603a', '#dcc08a', '#e8d2a0'], pathDots: ['#fff2c8', '#86603a'],
        dots: ['#f6d64a', '#c94a8a', '#f4f1e6'], pineShare: 0.35,
        pine: ['#2c6236', '#336f3c', '#4f9a3e', '#a6cf5a'], round: ['#448a38', '#5aa845', '#c4e278'], fruit: '#f6d64a',
        cliff: ['#9cc653', '#a0ca56', '#b98c5c', '#7a5a45', '#5e4331'],
      },
      path: { main: '#dcc08a', edge: '#86603a', outline: '#3e2a14', mid: '#e8d2a0', fringe: '#bcdf6e', fringeAccent: '#5a8f36', groove: '#4a6e2c' },
      // B-142 Nacharbeit: gemalter Boden Spätsommer (dunkel Halm-Grün, hell Gelbgrün)
      paint: { dark: [62, 104, 36], darkAlpha: 0.4, light: [222, 238, 140], lightAlpha: 0.26, tint: '255,232,170' },
    },
  },
  // Vulkan (B-030): schwerste Karte nach Zwei Fronten. Ein Lavafluss quert die Karte (eine Brücke), dazu Lavatümpel neben
  // dem Weg. Lava ist nicht bebaubar; Gegner auf Wegkacheln direkt neben Lava nehmen Schaden (LAVA.dps), Türme direkt
  // neben Lava überhitzen und schießen langsamer (LAVA.overheat). Werte per Strategie-Simulation gemessen.
  volcano: {
    name: 'Vulkan',
    waypoints: [
      [-1, 11],
      [3, 11],
      [3, 2],
      [10, 2],
      [10, 11],
      [16, 11],
      [16, 3],
      [20, 3],
    ],
    // Gemessen (Strategie-Läufe, dt 1/30 und 1/60, Skript im Scratchpad): Kanonen-Mix auf Plätzen ohne Überhitzung gewinnt
    // mit 4 Leben, dieselben Mischungen auf den besten (oft überhitzten) Plätzen verlieren ab Welle 5. Ohne Lava-Schaden
    // verliert jede Strategie bis Welle 4; ohne Überhitzung brechen bei der Platzwahl nach Abdeckung deutlich weniger Gegner durch.
    // Perfektes Spiel (10 von 10 Leben) gelingt mit kühlen Plätzen und dem Scharfschützen als drittem Turm (Test in game.test.js).
    // Nicht ahnungslos ändern.
    modifiers: { enemySpeed: 1.15 },
    lavaRiver: VOLCANO_LAVA_RIVER,
    lavaPools: VOLCANO_LAVA_POOLS,
    bridges: VOLCANO_BRIDGES,
    lava: [...withoutBridges(VOLCANO_LAVA_RIVER, VOLCANO_BRIDGES), ...VOLCANO_LAVA_POOLS],
    // B-103: wenige Hindernisse (verkohlter Baum oder Fels)
    obstacles: [[1, 8], [7, 1], [18, 8]],
    // Flat-Pop-Vulkan (STIL.md): dunkles Vulkangestein, verkohlte Bäume und Felsbrocken als Rahmen, Asche und Glutsteine
    // als Streu-Deko, warmes Licht von der Lava.
    theme: {
      treeFrame: {
        kindShare: [0.55, 0, 0, 0.45],
        greens: ['#3b302f', '#453735', '#352b2b', '#4a3b38'],
        fir: ['#2e2422', '#3a2d2a'],
      },
      ground: {
        base: '#4d3c3e',
        light: 'rgba(112,88,84,0.2)',
        dark: 'rgba(38,26,28,0.26)',
        blade: ['#2e2325', '#3a2c2e', '#6a5450'],
        tufts: 160,
        plateauTop: '#524244',
        plateauWall: 'rgba(30,20,22,0.9)',
        plateauRim: 'rgba(18,10,12,0.42)',
        plateauLight: 'rgba(160,130,125,0.12)',
      },
      light: { tint: '255,170,110', shadow: '24,10,12', gradientAlpha: 0.06, beamAlpha: 0.03, vignetteAlpha: 0.22, treeShadowAlpha: 0.2 },
      decorStyle: 'flatpop',
      decor: {
        flatTrees: true,
        firShare: 0.6,
        treeColors: ['#3b302f', '#453735', '#352b2b'],
        fir: ['#2e2422', '#3a2d2a'],
        trunk: '#241a18',
        bush: '#4a3a36', berry: '#ff7a1f', rock: '#5a4a48', moss: '#7a6a66',
        flowers: ['#ff7a1f', '#ffc23a', '#d4503f'], flowerCore: '#fff1b0', stem: '#2e2325', tuft: '#2e2325', tuftLight: '#6a5450',
        pebble: '#5a4a48', wood: '#3a2a26', woodDark: '#1f1614', logEnd: '#ff9a3a',
        ember: '#ff7a1f', emberCore: '#ffc23a', ash: '#8a7c78',
        obstacleGround: 'rgba(20,10,10,0.3)',
        scatterChance: 0.11,
        scatterKinds: [['ember', 0.26], ['ash', 0.22], ['rockgroup', 0.24], ['stump', 0.12], ['pebbles', 0.16]],
      },
      // Stil 1 (G9): Kruste #6b5a55 -> #2d1f20, schwache Glutflecken #ffb04a, kahle Bäume, Lava statt Wasser, Steinbrücke
      painted: {
        ground: ['#6b5a55', '#4a3a38', '#2d1f20'], mottle: [0.07, 0.04, 0.04], mottleOpacity: 0.6, lit: [1, 0.69, 0.29], litOpacity: 0.16,
        sun: ['#ffb070', '#ff8a40'], vignette: '#140808', grainOpacity: 0.14,
        path: ['#211718', '#1f1415', '#4a3836', '#8b7468', '#9c857a'], pathDots: ['#c8b0a0', '#2d1f20'],
        dotKind: 'ember', dots: ['#ffb04a', '#ff7a1f', '#8a7c78'], dotChance: 0.2,
        pineShare: 0.3, leafy: 'bare', pine: ['#2e2422', '#3a2d2a', '#4a3b38', '#6a5450'], trunk: ['#241a18', '#3a2a26'], fruit: null,
        rock: ['#5a4a48', '#7a6a66'], cliff: ['#4f3f3c', '#54433f', '#5a4644', '#2a1c1c', '#1a1010'],
        stone: ['#a89890', '#7d6e68', '#54463f'], bridge: ['#9a8a80', '#6a5a52', '#3a2c28', '#54463f'],
        lava: { glow: '#ff7a1f', crust: '#2a1a17', body: '#ff7a1f', core: '#ffc23a', hot: '#ffe58a', plate: '#4a2a22' },
      },
      path: { main: '#8b7468', edge: '#2d1f20', outline: '#1f1415', mid: '#9c857a', fringe: '#8a7c78', fringeAccent: '#ffc23a', groove: '#211718' },
      // B-142 Nacharbeit: gemalter Boden dunkel (Kruste), helle Flecken Asche, Licht glutwarm und schwach
      paint: { dark: [26, 16, 18], darkAlpha: 0.5, light: [120, 96, 90], lightAlpha: 0.34, tint: '255,170,110', shadow: '24,10,12', sunAlpha: 0.2, sunMidAlpha: 0.08 },
      pathStyle: {
        rutColor: 'rgba(45,31,32,0.35)', stoneColors: ['#5a4a48', '#7a6a66'], pebbleColors: ['#6a5650', '#a08a80'],
        stoneShadow: 'rgba(20,10,12,0.45)', patchDark: 'rgba(45,31,32,0.16)', patchLight: 'rgba(255,190,140,0.12)',
        fringeKind: 'ash', // B-143 Nacharbeit: Asche mit Glut am Wegrand
      },
    },
  },
};
export const DEFAULT_MAP_ID = 'meadow';

// B-093: Fortschritt im localStorage (Schlüssel mit Version, damit spätere Formate sauber neu beginnen).
export const PROGRESS_KEY = 'td-progress-v1';
// Sterne bei Sieg: Stern i gibt es, wenn der Anteil übriger Leben (an START_LIVES) mindestens STAR_LIVES_SHARE[i] ist.
// 1 Stern: gewonnen; 2 Sterne: mindestens die Hälfte übrig; 3 Sterne: keine Leben verloren. Niederlage: 0 Sterne.
export const STAR_LIVES_SHARE = [0, 0.5, 1];

// ---------- Testseite (test.html bzw. index.html?test) ----------
// Nur für manuelles Testen: Gold-Vorrat bei „Unbegrenztes Gold“ und wählbare Spieltempos.
export const TEST_TOOLS = {
  gold: 99999,
  speeds: [1, 2, 3, 5, 10],
};
// Alias für die Standardkarte (bestehender Code und Tests)
export const WAYPOINTS = MAPS[DEFAULT_MAP_ID].waypoints;

// range in Kacheln, rate = Sekunden zwischen Schüssen, projectileSpeed in Kacheln/Sekunde
export const TOWER_TYPES = {
  arrow: {
    name: 'Pfeilturm',
    key: '1',
    cost: 50,
    range: 3,
    damage: 12,
    rate: 0.6,
    projectileSpeed: 12,
    color: '#c8a165',
    description: 'Günstig und schnell. Guter Allrounder.',
    // Aufwärmen: Schussabstand sinkt je Folgeschuss auf dasselbe Ziel um warmupStep (Anteil), höchstens um warmupMax.
    special: { warmupStep: 0.05, warmupMax: 0.25 },
  },
  cannon: {
    name: 'Kanone',
    key: '2',
    cost: 90,
    range: 3.4,
    damage: 30,
    rate: 1.4,
    projectileSpeed: 7,
    splash: 1.1,
    color: '#5a5f6b',
    description: 'Flächenschaden gegen Gruppen.',
    // Rückstoß: das getroffene Ziel wird knockback Kacheln auf seinem Weg zurückgeworfen (Boss nur Faktor bossKnockbackFactor),
    // danach knockbackCooldown Sekunden Schutzzeit.
    special: { knockback: 0.5, bossKnockbackFactor: 0.5, knockbackCooldown: 6 },
  },
  frost: {
    name: 'Frostturm',
    key: '3',
    cost: 70,
    range: 2.4,
    damage: 4,
    rate: 0.9,
    projectileSpeed: 10,
    slow: 0.5,
    slowDuration: 1.5,
    color: '#6ec6e8',
    description: 'Verlangsamt Gegner um 50 %.',
    // Einfrieren: jeder freezeEvery-te Treffer des Turms stoppt das Ziel für freezeDuration Sekunden (Boss immun).
    special: { freezeEvery: 5, freezeDuration: 0.6 },
  },
  sniper: {
    name: 'Scharfschütze',
    key: '4',
    cost: 140,
    range: 6,
    damage: 80,
    rate: 2.2,
    projectileSpeed: 30,
    color: '#8e5bd1',
    description: 'Riesige Reichweite, hoher Einzelschaden.',
    // Rüstungsbrecher: gegen Gegner, deren Basis-HP (ENEMY_TYPES[type].hp, ohne Wellen-Skalierung) >= bonusMinHp ist, Faktor bonusDamage auf den Schaden; ignoriert dabei Rüstung.
    special: { bonusMinHp: 300, bonusDamage: 1.5, ignoreArmor: true },
  },
  lightning: {
    name: 'Blitzturm',
    key: '5',
    cost: 100,
    range: 3,
    damage: 16,
    rate: 0.8,
    projectileSpeed: 0, // Blitz trifft sofort, kein Projektil
    // Kettenblitz: springt auf bis zu chainCount weitere Gegner im Umkreis chainRange (Kacheln);
    // jeder Sprung macht nur chainFalloff (Anteil) des Schadens des vorigen Treffers. Skaliert nicht mit der Stufe.
    chainCount: 6,
    chainRange: 2.2,
    chainFalloff: 0.9,
    boltDuration: 0.25, // Sekunden, die die Blitzlinie sichtbar bleibt
    color: '#e8c93a',
    description: 'Kettenblitz trifft sofort und verfehlt nie. Ideal gegen schnelle Flitzer und Schwärme.',
    special: {},
  },
};

// Fähigkeitstexte werden aus den Werten gebaut, damit Zahlen nur an einer Stelle stehen.
const pct = (x) => `${Math.round(x * 100)} %`;
const num = (x) => String(x).replace('.', ',');
const SPECIAL_TEXTS = {
  arrow: (s) => `Aufwärmen: Schießt er dasselbe Ziel weiter an, feuert er bis zu ${pct(s.warmupMax)} schneller.`,
  cannon: (s) => `Rückstoß: Treffer wirft das Ziel ${num(s.knockback)} Kacheln auf dem Weg zurück (Bosse nur ${pct(s.bossKnockbackFactor)}).`,
  frost: (s) => `Einfrieren: Jeder ${s.freezeEvery}. Treffer stoppt das Ziel für ${num(s.freezeDuration)} s (Bosse sind immun).`,
  lightning: (s, d) => `Kettenblitz: Springt auf bis zu ${d.chainCount} weitere Gegner im Umkreis von ${num(d.chainRange)} Kacheln, jeder Sprung mit ${pct(d.chainFalloff)} des vorigen Schadens.`,
  sniper: (s) => `Rüstungsbrecher: Gegen zähe Gegner (ab ${s.bonusMinHp} Basis-HP) ${pct(s.bonusDamage - 1)} mehr Schaden, Rüstung wird ignoriert.`,
};
for (const [type, build] of Object.entries(SPECIAL_TEXTS)) TOWER_TYPES[type].special.text = build(TOWER_TYPES[type].special, TOWER_TYPES[type]);

// Aktive Fähigkeiten (B-038): lange Abklingzeiten, damit das Spiel nicht leichter wird.
// Zeiten in Sekunden Spielzeit, radius in Kacheln, slow = Anteil der Verlangsamung (0,7 = 70 % langsamer).
// short = Kurzname auf dem Knopf (B-058), der volle Name steht im zugänglichen Namen.
export const ABILITIES = {
  // Meteor (B-112): damage = Schaden in der Mitte in Welle 1, wächst mit hpScale(Welle) wie die Gegner-HP;
  // edge = Anteil des Schadens am Rand des Radius (linear abfallend). Rüstung zählt nicht (Flächenschaden).
  meteor: { name: 'Meteor', short: 'Meteor', key: 'q', cooldown: 60, radius: 2.5, damage: 250, edge: 0.6 },
  freeze: { name: 'Kälteschock', short: 'Kälte', key: 'w', cooldown: 60, slow: 0.7, duration: 4 },
  repair: { name: 'Notfall-Reparatur', short: 'Reparatur', key: 'e', cooldown: 120, maxUses: 2, heal: 1 },
};
ABILITIES.meteor.text = meteorText(1);

// Meteor-Schaden (B-112) in Welle wave bei Abstand frac (0 = Mitte, 1 = Rand des Radius); Welle < 1 zählt als 1.
export function meteorDamage(wave, frac = 0) {
  const m = ABILITIES.meteor;
  const f = frac > 0 ? Math.min(frac, 1) : 0;
  return m.damage * hpScale(Math.max(1, wave || 0)) * (1 - (1 - m.edge) * f);
}

// Beschreibung mit dem aktuellen Schaden der Welle (Tooltip des Knopfs, main.js aktualisiert sie je Welle).
export function meteorText(wave) {
  const m = ABILITIES.meteor;
  return `Flächenschaden ${Math.round(meteorDamage(wave))} in der Mitte (am Rand ${pct(m.edge)}), wächst mit der Welle. `
    + `Umkreis ${num(m.radius)} Kacheln, Abklingzeit ${m.cooldown} s.`;
}
ABILITIES.freeze.text = `Alle Gegner ${pct(ABILITIES.freeze.slow)} langsamer für ${ABILITIES.freeze.duration} s, Abklingzeit ${ABILITIES.freeze.cooldown} s.`;
ABILITIES.repair.text = `+${ABILITIES.repair.heal} Leben, höchstens ${ABILITIES.repair.maxUses}× pro Spiel, Abklingzeit ${ABILITIES.repair.cooldown} s.`;

// Lava (B-030, Karte Vulkan): dps = Schaden pro Sekunde für Gegner auf einer Wegkachel direkt neben Lava (8er-Nachbarschaft),
// mal hpScale(Welle), damit die Lava auch in späten Wellen spürbar bleibt. Gilt auch für den Boss.
// overheat = Faktor auf das Feuerintervall von Türmen auf einer Kachel direkt neben Lava (größer = langsamer).
export const LAVA = { dps: 7.5, overheat: 1.5 };

// speed in Kacheln/Sekunde, reward = Gold pro Kill, leak = verlorene Leben am Ziel
// Healer: healRadius in Kacheln, healPerSec = Anteil der maxHp des Ziels pro Sekunde,
//   healInterval = Sekunden (Spielzeit) zwischen zwei Heilimpulsen.
// Schildträger: armor = Anteil des Schadens, den Treffer ohne Splash blockiert (0,5 = 50 %).
// Magier (B-126): wardRadius in Kacheln, wardInterval = Sekunden (Spielzeit) zwischen zwei Zaubern,
//   wardShare = Anteil der maxHp des Ziels, den der Schild schluckt (jeder Schaden, auch Splash, Kette, Lava).
// boss: true = Boss (immun gegen Einfrieren, nur anteiliger Rückstoß, Boss-Auftritt und Boss-Sound).
// Nekromantin (B-127): beschwört alle summonInterval Sekunden (Spielzeit) summonCount Gegner vom Typ summonType,
//   summonBehind Kacheln hinter sich auf ihrem Weg (nie vor den Wegstart), jeweils summonSpacing Kacheln versetzt.
export const ENEMY_TYPES = {
  grunt: { name: 'Goblin', hp: 40, speed: 1.4, reward: 4, leak: 1, radius: 11, color: '#6fbf4a' },
  runner: { name: 'Flitzer', hp: 25, speed: 2.6, reward: 3, leak: 1, radius: 9, color: '#f2c14e' },
  tank: { name: 'Panzer-Troll', hp: 450, speed: 0.8, reward: 12, leak: 2, radius: 14, color: '#b5523b' },
  boss: { name: 'Oger-König', hp: 1100, speed: 0.6, reward: 65, leak: 6, radius: 18, color: '#7a2e8e', boss: true },
  healer: { name: 'Schamane', hp: 40, speed: 1.1, reward: 9, leak: 1, radius: 11, color: '#3fbf8f', healRadius: 1.5, healPerSec: 0.02, healInterval: 1 },
  shielded: { name: 'Schildträger', hp: 90, speed: 1.0, reward: 12, leak: 2, radius: 13, color: '#6f86a8', armor: 0.5 },
  mage: { name: 'Magier', hp: 55, speed: 1.1, reward: 6, leak: 1, radius: 11, color: '#d9c3a0', wardRadius: 1.5, wardInterval: 5, wardShare: 0.05 },
  necro: { name: 'Nekromantin', hp: 1000, speed: 0.6, reward: 75, leak: 6, radius: 18, color: '#3d4a5c', boss: true,
    summonInterval: 8, summonCount: 2, summonType: 'skeleton', summonBehind: 0.6, summonSpacing: 0.3 },
  skeleton: { name: 'Skelett', hp: 18, speed: 0.9, reward: 1, leak: 1, radius: 10, color: '#e6e0cf' },
};

// B-127: Boss-Merkmal statt Typname. Nimmt einen Gegner ({ type }) oder einen Typnamen.
export function isBoss(e) {
  const type = typeof e === 'string' ? e : e?.type;
  return Object.hasOwn(ENEMY_TYPES, type ?? '') && ENEMY_TYPES[type].boss === true;
}

// B-005/B-123: Wer die nächste Welle startet, während eine läuft, bekommt sofort einen Bonus nach Risiko:
// höchstens dieses Vielfache ihres Wellenbonus, wenn noch die volle Gegner-HP der laufenden Welle auf dem Feld ist.
export const EARLY_START_MAX = 3;

// B-124: Karten mit mehreren Eingängen: Gegner (ohne feste Seite) kommen in Schüben von `burst` Gegnern je Seite,
// und je Welle startet eine Seite `offset` Sekunden später (die Seite wechselt von Welle zu Welle).
export const LANE_ASYNC = { burst: 5, offset: 6 };

// B-121: Nach Wellenende startet die nächste Welle nach so vielen Sekunden Spielzeit automatisch (nicht vor Welle 1).
export const AUTO_WAVE_DELAY = 5;

// B-123: Münz-Explosion an der Goldanzeige beim Frühstart-Bonus (Darstellung, in CSS-px und Sekunden)
export const COIN_BURST = { count: 12, minDist: 35, maxDist: 75, fall: 40, duration: 1.0, stagger: 0.25 };

// B-005/B-123: Frühstart-Bonus der Welle `wave` bei Risiko `risk` (0..1, Anteil der Gegner-HP auf dem Feld).
// Einzige Stelle der Formel; Spiel-Logik und HUD nutzen sie.
export function earlyStartBonus(wave, risk) {
  const share = Number.isFinite(risk) ? Math.min(1, Math.max(0, risk)) : 0;
  return Math.floor(waveBonus(wave) * EARLY_START_MAX * share);
}

export function waveBonus(wave) {
  return 10 + wave;
}

// HP-Multiplikator pro Welle: Gegner werden mit jeder Welle zäher.
// Welle 1-5 moderat (+15 %), Welle 5-10 steil (+26 %), danach +11 % (B-125: vorher +7 %, Spätphase war zu leicht).
export function hpScale(wave) {
  const early = Math.min(wave, 5) - 1;
  const mid = Math.max(Math.min(wave, 10) - 5, 0);
  const late = Math.max(wave - 10, 0);
  return Math.pow(1.15, early) * Math.pow(1.26, mid) * Math.pow(1.11, late);
}

// Spätphase (B-013): ab dieser Welle laufen Heiler in der Troll-Gruppe mit, ab der Welle danach kommen
// pro Welle ein Troll und zwei Flitzer mehr dazu. Die Wellen 1-13 bleiben davon unberührt.
const LATE_WAVE = 14;

// B-127: In dieser Welle kommt die Nekromantin statt des Oger-Königs (gleiche Anzahl)
export const NECRO_WAVE = 15;

// Erzeugt die Spawn-Liste einer Welle: [{ type, at }] (at = Sekunden nach Wellenstart)
export function waveFor(wave) {
  const list = [];
  let t = 0;
  const add = (type, count, gap) => {
    for (let i = 0; i < count; i++) {
      list.push({ type, at: t });
      t += gap;
    }
    t += 1;
  };

  const lateTanks = Math.max(wave - LATE_WAVE, 0);
  const lateRunners = 2 * lateTanks;
  add('grunt', 6 + wave * 3, Math.max(0.3, 0.9 - wave * 0.04));
  if (wave >= 3) add('runner', 3 + wave * 2 + lateRunners, 0.35);
  const tankStart = t;
  if (wave >= 5) add('tank', Math.floor(wave / 2) + 1 + lateTanks, 1.0);
  if (wave >= 9) add('shielded', 1 + Math.floor((wave - 9) / 2), 1.0);
  // B-126: Magier laufen kurz nach der Troll-Gruppe
  if (wave >= 8) add('mage', 1 + Math.floor((wave - 8) / 4), 1.5);
  if (wave >= 7 && wave < LATE_WAVE) add('healer', 1 + Math.floor((wave - 7) / 4), 1.2);
  // Spätphase: Heiler laufen mitten in der Troll-Gruppe mit, statt ihr als letzte Gruppe hinterherzulaufen
  if (wave >= LATE_WAVE) {
    const healers = 2 + Math.floor((wave - LATE_WAVE) / 3);
    for (let i = 0; i < healers; i++) list.push({ type: 'healer', at: tankStart + 2 + i * 2 });
    list.sort((a, b) => a.at - b.at);
  }
  // B-127: Bosse in jeder 5. Welle; in Welle NECRO_WAVE kommt die Nekromantin statt des Oger-Königs
  if (wave % 5 === 0) add(wave === NECRO_WAVE ? 'necro' : 'boss', Math.floor(wave / 10) + 1, 3);
  return list;
}

// Zusammenfassung einer Welle: Anzahl pro Gegnertyp, z. B. { grunt: 8, runner: 3 }
export function waveSummary(wave) {
  const summary = {};
  for (const { type } of waveFor(wave)) summary[type] = (summary[type] || 0) + 1;
  return summary;
}

// Stil Flat-Pop (docs/STIL.md, Abschnitte 2 und 3): Palette und Maße für src/draw-utils.js
export const STYLE = {
  shadowTone: '#2b1b3d',   // kühles Violett für Schatten und Bodenschatten
  lightTone: '#fff3c9',    // warmes Creme für Licht
  lightMix: 0.28,          // Anteil Lichtton auf der Lichtfläche
  shadeMix: 0.4,           // Anteil Schattenton auf der Schattenfläche
  band: 2,                 // Breite der Licht-/Schattenbänder in px bei 1x
  outlineWidth: 1.3,       // Konturbreite in px bei 1x
  outlineDarken: 0.55,     // Kontur = Eigenfarbe um diesen Anteil abgedunkelt
  outlineMaxLight: 0.35,   // Kontur nie heller als diese Helligkeit (0..1)
  groundShadowAlpha: 0.38, // Alpha des Bodenschattens
  groundShadowWidth: 1.15, // Breite des Bodenschattens in Radien (1,0 bis 1,3)
  groundShadowHeight: 0.33,// Höhe des Bodenschattens in Radien (30 bis 35 %)
  groundShadowOffset: 0.12,// Versatz nach rechts unten in Radien
  palette: {
    gold: '#f4c542', goldDark: '#b07a14', red: '#d4503f', heart: '#e8455a', blue: '#4f7fc8',
    ice: '#7fd8f4', iceLight: '#bff0ff', wood: '#c58f55', woodDark: '#8a5a34', stone: '#b3adaa',
    skin: '#f2c9a0', leaf: '#4a8a3a', leafDark: '#3c7a30', dark: '#4a3030', pole: '#6b4a2b', string: '#f0e6d2',
  },
};

// HUD- und Knopf-Icons im Flat-Pop-Stil (B-069, docs/STIL.md Abschnitt 5). Zeichenraster 32x32, Mitte im Ursprung.
export const ICON = {
  grid: 32,          // Zeichenraster in px (Motiv innerhalb von ±half)
  half: 13,          // halbe Motivgröße (26 px Motiv, 3 px Rand)
  outline: 2,        // Kontur im Raster (bei 16 px noch 1 px)
  maxDpr: 3,         // höchste Pixeldichte der vorgerenderten Bilder
  sizes: { hud: 22, heart: 16, inline: 16, button: 20, ability: 26, title: 26, result: 40 }, // Anzeigegröße in CSS-px (title: Überschrift, result: Sieg/Niederlage)
  colors: {
    heartEmpty: '#5b4a5e', flag: '#d4503f', meteorRock: '#7a6a64', meteorCrater: '#55474a', flame: '#ff7a1f', flameCore: '#ffc23a',
    glass: '#bff0ff', glassShine: '#ffffff', pause: '#fff3c9', play: '#7fd24a', paper: '#e2c88f', mapMark: '#d4503f',
    bone: '#f1e8d2', boneDark: '#4a3030', castleGate: '#4a3030', castleRoof: '#d4503f', // B-096: Totenkopf, Burg
    speaker: '#e2c88f', soundWave: '#7fd8f4', mute: '#d4503f', // B-113: Ton an/aus
  },
};

// Shop-Karten im Flat-Pop-Stil (B-070): flache Flächen statt Verlauf. main.js setzt die Werte als
// CSS-Variablen (--card-*) auf #shop, style.css nutzt nur diese Variablen. Schrift auf Karte und
// aktiver Karte braucht mindestens minContrast (WCAG, Test in tests/render.test.js).
export const SHOP_CARD = {
  bg: '#4e321d',        // Karte
  bgActive: '#62402a',  // gewählte Karte (dazu goldener Rahmen)
  name: '#fff4dc',      // Turmname
  cost: '#ffe27a',      // Preis
  costPoor: '#ff9e8f',  // Preis, wenn das Gold nicht reicht
  desc: '#d1bb94',      // Beschreibung
  keyText: '#fff4dc',   // Tasten-Badge: Schrift
  keyBg: '#2e1d10',     // Tasten-Badge: Fläche
  iconBg: '#5fae48',    // Fläche hinter der Mini-Turm-Vorschau (Wiese)
  poorEdge: '#d4503f',  // Rahmen "zu teuer" (zusätzlich grau getönte Vorschau, nicht nur Farbe)
  minContrast: 4.5,
};

// Stil 1 (G6, G7): Türme und Gegner nach docs/design/stil1-entwurf.dc.html. Maße in Entwurfs-px (Kachel = unit),
// gezeichnet mit TILE / unit. Formen stehen in src/figures.js, hier nur Lage, Größe und Farben.
export const FIGURE_STYLE = {
  unit: 57,
  towerFoot: 22,  // Fußpunkt des Turms unter der Kachelmitte (0,39 Kachel, Entwurf Z.197)
  enemyFoot: 14,  // Fußpunkt des Gegners unter der Wegmitte (Z.199)
  towerScale: { arrow: 1.15, cannon: 1.2, frost: 1.15, sniper: 1.08, lightning: 1.15 }, // Scharfschütze 1,2 x 0,9 (Plan)
  // Stufenmarke (.bd1, Z.15): Kreis rechts unten am Turm, Mitte bei (W + dx, H + dy) der Turm-Box
  badge: { colors: ['#d7dde0', '#f2c14e', '#ff8a3d'], r: 11, line: 2.5, dx: -9, dy: -15, ink: '#2b1a10', font: '14px "Lilita One", "Trebuchet MS", sans-serif', textDy: 0.5 },
  trim: { color: '#f2c14e', ink: '#2b1a10', width: 3, edge: 5 }, // Goldband ab Stufe 2 (Stufe 3: zwei Bänder)
  cannonTilt: 1.25, // größte Neigung des Kanonenrohrs aus der Senkrechten (rad)
  muzzle: 0.55,     // Mündungsfeuer, solange der Rückstoß-Anteil darüber liegt
  squash: 0.05,     // Stauchung feststehender Türme direkt nach dem Schuss (Anteil der Höhe)
  recoil: { arrow: 0, cannon: 4, frost: 0, sniper: 3, lightning: 0 }, // Rückstoß drehender Teile in Entwurfs-px
  shotGlow: { frost: 'rgba(216,247,255,0.85)', lightning: 'rgba(255,246,168,0.9)', edge: 'rgba(255,255,255,0)', r: 26 }, // Aufleuchten beim Schuss
  // Shop-Vorschau (48x48): Skalierung und Verschiebung nach unten in px
  icon: { arrow: { scale: 0.58, dy: 10 }, cannon: { scale: 0.59, dy: 10 }, frost: { scale: 0.57, dy: 10 }, sniper: { scale: 0.53, dy: 11 }, lightning: { scale: 0.54, dy: 11 } },
  // Gegner
  bob: 1.6,          // Wippen beim Laufen (Entwurfs-px)
  sway: 0.05,        // Schwanken beim Laufen (rad)
  tilt: 0.35,        // Anteil der Neigung auf senkrechten Wegstücken (aufrechte Figuren kippen nur leicht)
  bossScale: 1.3,    // Oger-König = Troll x 1,3 mit Krone
  necroScale: 1.5,   // Nekromantin auf Goblin-Basis
  // Lebensbalken (Z.113), nur bei Schaden: Breite = share x Figurbreite (mind. minW), über der Figur
  hp: { back: '#2b1a10', good: '#74d048', mid: '#f2c14e', low: '#e5481f', h: 12, inner: 6, pad: 3, gap: 4, minW: 34, share: 0.71, r: 6 },
  outline: '#2b1a10',
};

// Weg im Flat-Pop-Stil (B-071). Maße in px bei 1x. Gesamtbreite in Kachelmitte = TILE, der wellige
// Rand ragt höchstens `overhangMax` darüber hinaus (Test in tests/render.test.js).
export const PATH_STYLE = {
  overhangMax: 4,          // so weit darf der Rand über die halbe Kachel hinausragen
  edgeOffset: 13,          // Abstand der Randkreise von der Wegachse (Mittelwert); B-143: schmaler, damit die Fuge sichtbar bleibt
  edgeRadius: 4.4,         // Radius der Kontur-Kreise (außen)
  edgeInner: 2.8,          // Radius des helleren Randbands
  waveAmp: 1.4,            // Amplitude der Welle in px
  waveHarmonic: 0.4,       // Anteil der zweiten, schnelleren Welle
  waveLength: 0.11,        // Wellenzahl der Grundwelle (rad pro px)
  circleStep: 4.5,         // Abstand der Randkreise entlang des Wegs
  // B-143: eingesunkener Weg (Stil "Gemalt und warm"): dunkle Grasfuge, Kontur, Erde, helle Mitte nach oben versetzt
  grooveWidth: 48,         // Breite der dunklen Grasfuge (außen um die Kontur); B-143 Nacharbeit: 48, damit unter dem Saum Fuge bleibt
  contourWidth: 36,        // Breite der durchgehenden Kontur (die Randkreise ragen etwas darüber)
  sandWidth: 32,           // Breite der Sandfläche (liegt über den Randkreisen)
  sandShift: [0, -1.5],    // Versatz der oberen Erdschicht (Weg wirkt eingesunken)
  midWidth: 20,            // Breite der helleren Wegmitte
  midShift: [-1, -2],      // Versatz des hellen Mittelstreifens nach oben links (Licht)
  gravelWidth: 1.5,        // Kiesel-Strichel: Strichbreite
  gravelLight: { offset: -4, dash: [1, 11], mix: 0.6 }, // helle Strichel: Abstand zur Achse, Muster, Aufhellung der Wegmitte
  gravelDark: { offset: 5, dash: [1, 15] },             // dunkle Strichel in der Randfarbe (col.edge)
  shadowWidth: 44,         // Breite des Schlagschattens auf dem Gras
  shadowOffset: [2, 4],    // Versatz des Schlagschattens
  shadowColor: 'rgba(43,27,61,0.3)',
  bandShade: 0.12,         // Randband = Wegfarbe um diesen Anteil zum Schattenton gemischt
  // B-143 Nacharbeit: Saum als unterbrochene Büschel über dem äußeren Rand der Fuge (Halme, Laub, Schnee, Asche je Karte)
  fringeStep: 3.2,         // Abstand der Saum-Teile innerhalb eines Büschels (0 = kein Saum)
  fringeClump: [8, 16],    // Länge eines Büschels entlang des Wegs in px (von, bis)
  fringeGap: [12, 22],     // Lücke zwischen zwei Büscheln in px (von, bis); Anteil Saum etwa 30 bis 50 %
  fringeInner: 22.6,       // innerer Rand der Büschel (Abstand zur Achse); innen bleibt die Fuge mindestens 3 px frei
  fringeHeight: [5, 9],    // Länge eines Halms oder Blatts nach außen (in der Büschelmitte; zu den Enden kürzer)
  fringeRadius: 3.6,       // größter Radius eines Schnee- oder Ascheklumpens
  fringeKind: 'blades',    // 'blades' (Halme), 'leaves' (Laub), 'snow' (Schneeklumpen), 'ash' (Asche mit Glut)
  rutOffset: 7.5,          // Abstand der Spurrillen von der Achse
  rutWidth: 1.6,           // Breite der Rillen
  rutDash: [16, 7, 5, 10], // Strichmuster der Rillen
  rutColor: 'rgba(143,106,59,0.34)',
  stoneStep: 6,            // Abstand der Randsteine/Kiesel entlang des Wegs
  stoneChance: 0.45,       // Anteil Randsteine (der Rest: kleine Kiesel in der Mitte)
  stoneOffset: [11, 14],   // Abstand der Randsteine von der Achse (von, bis)
  stoneSize: [2.6, 4.6],   // Größe der Randsteine
  pebbleSize: [1.1, 2.2],  // Größe der Mittelkiesel
  patchStep: 9,            // Abstand der Bodenflecken entlang des Wegs
  patchChance: 0.4,        // Wahrscheinlichkeit eines Flecks pro Schritt
  stoneColors: ['#b8b0a2', '#dcd6c6'], // Stein: Basis, Glanz
  pebbleColors: ['#c9ad74', '#f3e2b4'],
  stoneShadow: 'rgba(110,76,42,0.45)', // Schatten der Randsteine
  patchDark: 'rgba(143,106,59,0.14)',  // dunkle Bodenflecken auf dem Weg
  patchLight: 'rgba(255,248,214,0.22)', // helle Bodenflecken auf dem Weg
  // Standardfarben (heutiger Look), solange eine Karte kein theme.path liefert.
  colors: { main: '#dcc189', edge: '#8f7140', outline: '#8f7140', mid: '#dcc189', fringe: null, groove: '#3a6a2c' },
};

// Baumrahmen der Wiese (B-077): runde Kronen im Randring, rein Hintergrundoptik. Maße in px bei 1x.
// Eine Krone liegt innerhalb ihres Begrenzungskreises (Radius r, inkl. Kontur).
export const TREE_FRAME = {
  // Reihen von hinten (außen, dunkler) nach vorn (innen, heller): Radius, Tiefenanteil der Mitte (0 = am Rand,
  // 1 = so weit innen wie maxOverhang erlaubt), Abstand entlang des Rands, Abdunklung
  rows: [
    { radius: [14, 18], depth: [0, 0.3], spacing: 30, shade: 0.28 },
    { radius: [16, 20], depth: [0.7, 1], spacing: 34, shade: 0 },
  ],
  spacingJitter: 8,       // zufällige Streuung des Abstands (0..jitter)
  maxOverhang: 36,        // so weit darf eine Krone (Rand) ins Spielfeld ragen
  pathMargin: 24,         // Abstand Kronenrand zur Wegachse, mindestens (>= Rand des Wegs, siehe pathReach)
  // Anteile der Arten in der Reihenfolge leaf, apple, blossom, fir (Summe 1)
  kindShare: [0.5, 0.2, 0.2, 0.1],
  greens: ['#3f9a45', '#3a9250', '#58a83e', '#47a04a'],
  apple: '#4aa04a',
  appleFruit: '#d4503f',
  appleGlint: '#ffd9c9',
  blossom: '#f08fb4',
  blossomFlower: '#fff3f6',
  fir: ['#2f7f4a', '#2a7442'],
  outlineWidth: 2,        // Dicke der dunklen Kontur
  coverMargin: 6,         // alte Einzelbäume näher als r + coverMargin an einer Krone entfallen
  lobeScale: 0.6,         // Hauptlappen = r * lobeScale
  firLift: 0,             // Tannen um diesen Anteil von r nach unten rücken (0 = wie bisher)
  snow: null,             // B-073: Farbe der Schneekappen auf Tannen (null = keine)
  snowShade: '#c6dcec',   // Schattenseite der Schneekappe
};

// Boden der Wiese (B-078): weiche Flecken, Plateaus mit dunkler Kante, Grasbüschel. Nur Optik, Maße in px bei 1x.
// Aktiv nur mit MAPS.<id>.theme.ground; andere Karten behalten das Schachbrett.
export const GROUND_STYLE = {
  base: '#5fae48',
  light: 'rgba(125,199,87,0.15)', // helle Flecken (#7dc757, Deckkraft je Lage)
  dark: 'rgba(79,154,59,0.15)',   // dunkle Flecken (#4f9a3b, Deckkraft je Lage)
  blade: ['#46893a', '#4e9b3e', '#86d062'], // Halme: dunkel, mittel, hell
  patchLayers: 4,        // Lagen je Fleck (weiche Kante ohne Blur)
  patchLayerShrink: 0.16, // jede Lage um diesen Anteil kleiner
  lightPatches: 12,
  darkPatches: 9,
  patchRadiusX: [50, 120],
  patchRadiusY: [28, 64],
  blobPoints: 10,        // Stützpunkte der Fleckenform
  plateaus: 8,           // höchstens so viele Plateaus
  plateauTries: 400,
  plateauRadiusX: [34, 62],
  plateauRadiusY: [18, 30],
  plateauPoints: 9,
  plateauInset: [60, 70],  // Mindestabstand der Mitte zum Rand (x, y)
  plateauCenterMargin: 40, // Mindestabstand der Mitte zur Wegachse
  plateauEdgeMargin: 34,   // Mindestabstand der Plateaukante (samt Wand) zur Wegachse
  plateauDrop: 6,          // Höhenversatz der Wand nach unten
  plateauTop: '#66b84d',
  plateauWall: 'rgba(63,133,54,0.85)',
  plateauRim: 'rgba(30,70,30,0.3)', // dezente Kante, schwächer als die Gegnerkontur
  plateauLight: 'rgba(190,240,140,0.16)',
  tufts: 420,
  tuftPathMargin: 28,    // Büschel nie auf dem Weg
  tuftScale: [0.9, 1.4],
};

// Deko der Wiese im Flat-Pop-Stil (B-079): Felsen, Büsche, Blumen, Pilze, Streu-Deko. Nur Optik, Maße in px bei 1x.
// Aktiv nur mit MAPS.<id>.theme.decorStyle === 'flatpop'; andere Karten behalten die alte Deko.
export const DECOR_STYLE = {
  outlineWidth: 1.3,      // Konturbreite aller Teile (entspricht STYLE.outlineWidth, erlaubt 1,3 bis 2,3)
  detailWidth: 0.9,       // Innendetails (Risse, Halme)
  bush: '#3d9a45',
  berry: '#d4503f',
  rock: '#9b9ba5',
  moss: '#8fd14f',
  flowers: ['#f6d64a', '#ff8fb1', '#f4f1e6'], // gelb, rosa, weiss (je Variante)
  flowerCore: '#f0a21c',
  stem: '#3f8a35',
  tuft: '#46893a',
  tuftLight: '#5da654',   // Lichthalm
  pebble: '#b3adaa',
  mushroomCap: '#d9453a',
  mushroomStem: '#f4e7c8',
  mushroomSpot: '#ffffff',
  wood: '#c58f55',
  woodDark: '#8a5a34',
  hoop: '#5a4a52',        // Fassreifen
  logEnd: '#e2b87a',
  // B-072 (Zangenangriff): Bäume, Hindernisse und Laubhaufen im Flat-Pop-Stil; die Wiese nutzt davon nichts.
  flatTrees: false,       // Einzelbäume am Rand im neuen Stil (sonst alter Baum)
  firShare: 0,            // Anteil Tannen unter Hindernis-Bäumen und Einzelbäumen (Rest: Laubbaum)
  obstacleGround: 'rgba(20,48,26,0.3)', // dunkler Fleck unter Hindernissen (zeigt: nicht bebaubar)
  fir: ['#2a6b3a', '#235c33'],
  trunk: '#6e4d2a',
  treeColors: ['#3f9a45', '#3a9250', '#58a83e'], // Laubbaum je Variante
  leaves: ['#e0803a', '#c9562f', '#e3b23c'], // Laubhaufen
  // B-073 (Eis): Schneekappen auf Tannen und Felsen (Moos-Farbe), Eiskristalle; nur Eis setzt snow.
  snow: null,
  snowShade: '#c6dcec',
  crystal: '#7fe0ff',
  // B-030 (Vulkan): Glutsteine und Asche
  ember: '#ff7a1f',
  emberCore: '#ffc23a',
  ash: '#8a7c78',
  // Streu-Deko: wenige flache Stücke auf freien Kacheln, die kein anderes Dekor tragen.
  scatterChance: 0.07,    // Wahrscheinlichkeit je freier Kachel
  scatterEndMargin: 1,    // Abstand (Kacheln, Chebyshev) zu Tor und Ziel
  scatterOffset: [0.3, 0.7], // Lage innerhalb der Kachel
  scatterKinds: [['mushroom', 0.3], ['stakes', 0.2], ['log', 0.15], ['barrel', 0.1], ['sign', 0.1], ['pebbles', 0.15]],
};

// Licht der Wiese (B-081): Lichtstreifen von oben links, sanfter Verlauf, Vignette und Baumschatten.
// Nur Optik im Hintergrund-Cache, aktiv nur mit MAPS.<id>.theme.light. Alle Farben als rgba (kein globalAlpha).
export const LIGHT_STYLE = {
  tint: '255,243,201',     // Lichtton (STIL.md)
  shadow: '43,27,61',      // Schattenton (STIL.md)
  gradientAlpha: 0.1,      // Aufhellung links oben (Verlauf diagonal, läuft nach rechts unten aus)
  gradientReach: 0.7,      // Länge des Verlaufs als Anteil der Felddiagonale
  beamAlpha: 0.045,        // Deckkraft je Lichtstreifen
  beamAngle: 0.5,          // Neigung der Streifen in rad (Lichtrichtung oben links nach rechts unten)
  beams: [[0.04, 0.09], [0.26, 0.05], [0.5, 0.11]], // [Startanteil an der Oberkante, Breite als Anteil der Feldbreite]
  vignetteAlpha: 0.14,     // Abdunklung in den Ecken (Radialverlauf, Mitte unberührt)
  vignetteInner: 0.55,     // Radius ohne Abdunklung, Anteil der halben Felddiagonale
  treeShadowAlpha: 0.15,  // Baumschatten (Schattenton)
  treeShadowDx: 0.45,      // Versatz nach rechts, Anteil des Kronenradius
  treeShadowDy: 0.6,       // Versatz nach unten, Anteil des Kronenradius
  treeShadowScale: 1.0,    // Radius des Schattens, Anteil des Kronenradius
  maxDarken: 0.15,         // Obergrenze je dunkelnder Schicht (Vignette, Baumschatten), Test
};

// Gemalter Boden (B-142, STIL.md 0): große Hell-Dunkel-Flecken aus eigenem Rauschen, warmes Licht oben links,
// Abschattung nach rechts unten und Vignette. Nur Optik im Hintergrund-Cache, aktiv nur mit MAPS.<id>.theme.paint
// (true = diese Werte; Objekt überschreibt einzelne Werte, z. B. Farben einer anderen Welt). Seit der Nacharbeit alle Karten.
export const PAINT_STYLE = {
  seed: 142,               // feste Saat (je Karte kommt ein Hash der Karten-ID dazu)
  cell: 8,                 // Rasterweite des Rausch-Feldes in px (dazwischen weich interpoliert)
  scale: 150,              // Fleckengröße: Grundwellenlänge des Rauschens in px
  octaves: 3,              // Rausch-Oktaven (mehr = unruhigere Ränder)
  stretch: 0.75,           // Verhältnis Wellenlänge x zu y (< 1: Flecken eher breit)
  dark: [26, 72, 22],      // dunkle Flecken (Moos-Grün, RGB)
  darkGain: 2.4,           // Deckkraft = clamp(darkGain * n + darkOffset) * darkAlpha
  darkOffset: -1.05,
  darkAlpha: 0.4,          // B-142 Nacharbeit: kräftiger (vorher 0,32)
  light: [255, 236, 150],  // helle Flecken (warmes Gelb, RGB)
  lightGain: 2.4,
  lightOffset: -1.1,
  lightAlpha: 0.26,        // B-142 Nacharbeit: kräftiger (vorher 0,2)
  // Licht (ersetzt mit theme.light den Diagonalverlauf von LIGHT_STYLE): Stopps als Anteil der Diagonale oben links -> unten rechts
  tint: '255,240,176',     // Sonnenlicht (rgba-Anteil)
  sunAlpha: 0.38,          // Deckkraft in der Ecke oben links
  sunMid: 0.3,             // Stopp mit sunMidAlpha
  sunMidAlpha: 0.14,
  sunEnd: 0.45,            // ab hier kein Licht mehr, danach Abschattung
  shadow: '20,30,24',      // Schattenton für Abschattung und Vignette
  shadeAlpha: 0.13,        // Abschattung diagonal nach rechts unten (höchstens LIGHT_STYLE.maxDarken); B-142 Nacharbeit: 0,13 für helle Tore
  vignetteAlpha: 0.15,     // Vignette (höchstens LIGHT_STYLE.maxDarken)
  vignetteInner: 0.45,     // Radius ohne Abdunklung, Anteil der halben Felddiagonale
  vignetteX: 0.56,         // Mitte der Vignette leicht nach rechts unten (Licht kommt von oben links)
  vignetteY: 0.56,
  gateDarkMax: 0.2,        // B-142 Nacharbeit: Abschattung + Vignette an Weg-Ein-/Ausgang und Burgtor höchstens 20 % (Test)
  // B-142 Nacharbeit: Streudeko gruppiert statt gleichmäßig (Gras-Büschel, Kiesel nur an Wegrand, Wasser, Bäumen)
  tuftBand: 16,            // Bodenbüschel: höchstens so weit außerhalb ihres Mindestabstands zu Weg/Wasser bzw. Kronenrand
  smallNear: 1,            // Kachel-Büschel/Kiesel nur so nah (Kacheln, Manhattan) an Weg, Wasser, Lava oder Hindernis
  flowerGroups: [3, 5],    // Blumen nur in 3 bis 5 kleinen Wiesen-Inseln
  flowerGroupRadius: 1,    // Radius einer Insel in Kacheln (Chebyshev)
  flowerGroupGap: 4,       // Mindestabstand der Inseln in Kacheln
  blossoms: 7,             // Zusatzblüten je Insel (flach, ohne arc)
  blossomSpread: 26,       // Streuradius der Zusatzblüten um die Inselmitte in px
  blossomPathMargin: 28,   // Mindestabstand der Zusatzblüten zur Wegachse
};

// Stil 1 (docs/design/stil1-entwurf.dc.html): gemalter Hintergrund als SVG, einmal in den Hintergrund-Cache gerastert.
// Formen und Farben stehen in render-painted.js (portiert aus dem Entwurf), hier nur Maße und Regeln. Nur Optik.
// C-Abnahme 8: Auswahl eines Turms als Bodenellipse (Breite/Höhe in Kacheln, Strich und Außenkontur in px)
export const SELECT_RING = { width: 0.9, height: 0.35, line: 3, outline: 2, color: '#ffe266', outlineColor: '#2b1a10' };

export const PAINTED_STYLE = {
  unit: 57,                // Kachelgröße des Entwurfs in px; Formen werden mit TILE / unit skaliert
  seed: 42,                // feste Saat (je Karte kommt ein Hash der Karten-ID dazu)
  fieldVignette: 0.15,     // Vignette im Feld höchstens so dunkel (Test)
  frameVignette: 0.72,     // starke Vignette nur im Rand (Entwurf Z.39)
  maxOverhang: 0.3,        // Randbäume dürfen höchstens so viele Kacheln ins Feld ragen (Stamm immer im Rand)
  treeChance: 0.85,        // Rahmenwald: Anteil besetzter Plätze
  treeScale: [0.8, 1.15],  // Größe der Randbäume
  river: [92, 76, 66],     // Fluss: Sand, Kontur, Wasser (Strichbreiten in Entwurfs-px, Z.66–68; schmaler als im Entwurf, Bauplätze frei)
  lakeRadius: [34, 28, 25], // See ohne gemalte Form: Hüllradius je Seekachel für Sand, Kontur, Wasser (px bei 1x)
  castleScale: 0.8,        // Burgtor am Ausgang (im Rand)
  flagScale: 0.73,         // Wellenfahne am Eingang (im Rand); größer geht nicht: Tuch reicht sonst ins Feld (höchstens (Rand - 2) / 94)
  flagNumber: 35,          // C-Abnahme 10: Zahl auf der Wellenfahne (Entwurfs-px vor Fahnen-Maßstab; ca. 22 CSS-px bei 1280x800)
  flagTopGap: 64,          // Fahne: Mindestabstand der Spitze zur Canvas-Oberkante (Entwurfs-px); sonst kleiner (Zwei Fronten, Zeile 1)
  obstacleTree: 0.62,      // Baum auf Hindernis-Kachel
  obstacleRock: 1.2,       // Fels auf Hindernis-Kachel
  keepOut: 46,             // halbe Breite der freien Bahn für den Weg im Rand (Entwurfs-px)
  lava: [96, 60, 50, 26],  // Lavafluss: Glühen, Kruste, Fläche, Kern (Strichbreiten in Entwurfs-px; Kachel 57, Kruste ragt kaum über)
  lavaPool: [28, 18, 15, 8], // Lavatümpel: Radius je Lage wie oben (Spiel-px, Umriss aus render-lava.js poolOutline; Kruste ragt höchstens 15 % in Bauplätze)
  // C-Abnahme 1: Seitenzonen neben dem Canvas = gleiche Malerei mit dichtem Wald (Raster und Versatz in Entwurfs-px;
  // 48 Entwurfs-px sind bei 1280x800 rund 41 CSS-px), nach außen leicht dunkler (darken = Deckkraft am Fensterrand)
  sideZone: { step: [48, 38], chance: 0.85, jitter: [16, 12], darken: 0.35, quantum: 32 },
  rasterDelay: 150,        // ms: nach einer Größenänderung erst so lange warten, dann neu rastern (bis dahin altes Bild skaliert)
};

// Stil 1, Plan G9: Palette und Elemente des gemalten Hintergrunds. Basis = Wiese (Farben aus dem Entwurf);
// andere Karten überschreiben einzelne Schlüssel über MAPS.<id>.theme.painted (themed(), flacher Merge). Nur Optik.
export const PAINTED_PALETTE = {
  ground: ['#9bd25a', '#6aa83f', '#3f7a35'],   // Bodenverlauf oben links -> unten rechts (Z.52)
  mottle: [0.10, 0.27, 0.08], mottleOpacity: 0.75, // dunkle Flecken (RGB 0..1, Z.36)
  lit: [1, 0.93, 0.45], litOpacity: 0.55,      // helle Flecken
  grainOpacity: 0.18,
  sun: ['#fff0b0', '#ffd980'],                 // Licht oben links (innen, außen)
  vignette: '#0c1a1c',
  // Weg von außen nach innen: Grasschatten 86, Kontur 72, Kante 64, Fläche 54, Mitte 30; dann helle und dunkle Punkte
  path: ['#3a6a2c', '#2b1a10', '#8f5f34', '#d5a566', '#e8c185'], pathDots: ['#fff2c8', '#8f5f34'],
  dotKind: 'flower',                           // Tupfen im Feld: flower, crystal, leaf, ember
  dots: ['#fff3d2', '#ffd36a', '#f58aa5'],
  dotChance: 0.19,                             // Tupfen je freier Feldkachel
  pineShare: 0.45,                             // Anteil Tannen im Rahmenwald
  leafy: 'round',                              // zweite Baumart: round (Laubbaum) oder bare (kahl)
  pine: ['#2f7a3d', '#3d9447', '#59b254', '#a6dc6a'], // Stufen unten, Mitte, oben, Glanz
  round: ['#3a8c3c', '#52a849', '#b6e276'],    // Krone dunkel, hell, Glanz
  fruit: '#d6483a',                            // Früchte am Laubbaum (null = keine)
  trunk: ['#6b4524', '#7a4d27'],               // Tanne, Laubbaum
  snow: null,                                  // Schneekappen auf Bäumen und Felsen (null = keine)
  rock: ['#a9a08d', '#d6cdb8'],
  cliff: ['#8fc84f', '#92cc52', '#b98c5c', '#7a5a45', '#5e4331'], // Plateau oben, unten, Wand hell, dunkel, Rillen
  stone: ['#e3d2b0', '#b9a283', '#8a7560'],    // Burg
  bridge: ['#c88a4c', '#8a5326', '#3b2210', '#6d3f1b'], // Holz hell, dunkel, Fugen, obere Brüstung
  lava: null,                                  // Lava (nur Karten mit Lavakacheln): siehe Vulkan
};

// Akzente der Wiese (B-080): Burgmauer oben, Teich und Brunnen unten. Nur Optik, Maße in px bei 1x.
// Aktiv nur mit MAPS.<id>.theme.accents. Rechtecke liegen im Randring (Überhang höchstens TREE_FRAME.maxOverhang).
export const ACCENT_STYLE = {
  pathMargin: 36,         // Abstand Akzent-Rechteck zur Wegachse, mindestens (größer als pathReach der Wegzeichnung)
  crownGap: 4,            // Kronen, die ein Akzent-Rechteck um weniger berühren, entfallen
  wall: { cx: 360, base: 34, w: 150, height: 34 },    // Rechteck: x = cx - w/2, y = base - height
  pond: { cx: 330, cy: 543, rx: 56, ry: 13, reedLift: 19 },
  well: { cx: 70, base: 556, w: 32, height: 28 },
  stone: '#b3adaa', stoneTop: '#c8c2bd', towerStone: '#a7a19e', roof: '#4f7fc8',
  wood: '#c58f55', woodDark: '#8a5a34', gate: '#6b4a2b', wellRoof: '#d4503f',
  water: '#5aa9d6', bank: '#6a8a3e', mud: '#8a6a42', pad: '#4aa84a', padFlower: '#ff8fb1', padCenter: '#ffe07a', reed: '#4d8a3a', reedHead: '#7a4a2a',
  towerW: 14, towerBody: 22, towerRoof: 10, wallHeight: 16, merlon: [8, 5], merlonStep: 11, gateW: 16, gateH: 12,
};

// Fluss, See und Brücke der Wiese (B-104): nur Optik im Hintergrund-Cache, Maße in px bei 1x.
// Gezeichnet nur auf Karten mit MAPS.<id>.water (Kacheln aus river/lake/bridges).
export const WATER_STYLE = {
  water: '#5aa9d6',        // Fläche wie ACCENT_STYLE.water (Teich)
  channelShade: [0.1, 0.2], // Rinne zur Mitte hin: shd(water, t) je Stufe
  channelScale: [0.7, 0.4], // Breite der Rinnen-Stufen als Anteil der Fläche
  outline: '#28506a',
  outlineWidth: 1.3,
  bank: '#6a8a3e',         // Ufersaum
  bankWidth: 3.5,
  mud: '#8a6a42',          // Schlammflecken an Innenkurven
  riverWidth: 28,
  riverWiggle: 4,          // seitlicher Schwung je Kachel, höchstens (deterministisch)
  riverTop: 6,             // y des oberen (runden) Endes, liegt unter den Baumkronen
  lakeRadius: 21,          // Radius je Seekachel (Umriss = Hülle der Kreise um die Kachelmitten)
  lakePoints: 24,          // Stützpunkte des Seeumrisses
  lakeHarmonics: 2,        // Hülle geglättet: nur Radius-Harmonische bis zu dieser Ordnung (rund/oval, keine Zipfel)
  lakeScale: 0.97,         // geglätteter Umriss etwas kleiner, damit er die Seekacheln nur knapp ausfüllt
  mouthFlare: 7,           // Einmündung: Fluss weitet sich je Seite um so viel px zum See hin
  mouthLength: 16,         // Länge der Aufweitung oberhalb des Seeufers
  mudConcave: -40,         // Schlamm an Uferpunkten mit Kreuzprodukt unter dieser Schwelle (Innenkurve)
  mudGap: 18,              // Mindestabstand zwischen Schlammflecken
  mudMouth: [[4.5, 2.6], [4, 2.4]], // Halbachsen der Schlammflecken links/rechts der Einmündung
  mudSpot: [4, 2.4],       // Halbachsen der Schlammflecken an Innenkurven
  glint: 'rgba(255,243,201,0.5)', // Glanzstriche (#fff3c9, Alpha 0,5)
  glintWidth: 1.6,
  riverGlintAt: [0.45, 0.72],        // Glanzstriche auf dem Fluss (Anteil der Flusslänge)
  riverGlint: [[-5, -6], [-4, 5]],   // Glanzstrich relativ zum Flusspunkt
  lakeGlint: [[-14, -12], [-2, -13]], // Glanzstrich relativ zur Seemitte
  pad: '#4aa84a', padFlower: '#ff8fb1', padCenter: '#ffe07a', reed: '#4d8a3a', reedHead: '#7a4a2a',
  // Ufer des Sees (Nachbesserung B-104): Winkel in Grad um die Seemitte (0 = rechts, 90 = unten), d = Abstand zum Ufer
  // (positiv = an Land, negativ = im Wasser). Alles rein Optik; Positionen aus shoreDecor (render-water.js).
  shore: {
    pads: [[18, -0.5, 1, true], [128, -0.45, 0.85, true], [-35, -0.55, 0.7, false]], // [Winkel, Anteil des Radius (negativ: nach innen), Größe, Blüte]
    pad: [6.5, 3.4],       // Halbachsen eines Blatts bei Größe 1
    padNotch: 0.5,         // Kerbe im Blatt (Bogenmaß)
    padBloom: [2.6, 1.8, 1.1], // Blüte: Blatt-Halbachsen x/y, Mitte
    reeds: [[8, -1, 4], [148, -1, 3], [-62, 0, 3]], // [Winkel, d, Halme]
    reedHeights: [17, 13, 20, 11], // Halmhöhen der Reihe nach
    reedStep: 3.2,         // Abstand der Halme
    reedWidth: 1.4,
    reedHead: [1.6, 3.6],  // Rohrkolben (Halbachsen)
    reedLeaf: '#5da044',   // Blätter am Fuß der Halme
    reedLeafLen: 8,
    stones: [[55, 2, 1], [-15, 2, 0.8], [100, 3, 0.9], [180, 1, 0.8]], // [Winkel, d, Größe]
    stone: '#a9a8ae', stoneTop: '#cfcdd0', stoneSize: [4.5, 2.6],
    flowers: [[35, 7, 0], [78, 8, 1], [-88, 8, 2], [-40, 9, 1], [118, 8, 0]], // [Winkel, d, Farbe (Index in DECOR_STYLE.flowers)]
    flowerPetal: 1.3,      // Blütenblatt-Radius
    flowerRing: 1.7,       // Abstand der Blütenblätter von der Mitte
    tufts: [[45, 4], [-28, 4], [92, 5], [162, 3], [-75, 3]], // [Winkel, d]
    tuftHeights: [5, 7, 5.5],
  },
  groundMargin: 6,         // Plateaus und Büschel halten so viel Abstand zu Wasserkacheln
  // Brücke: Holzbohlen quer zur Laufrichtung, Geländer an beiden Seiten, Schlagschatten auf dem Wasser
  bridge: {
    length: 46,            // entlang des Wegs
    width: 30,             // quer zum Weg (Deck)
    plank: 5.5,            // Bohlenbreite (Fugenabstand)
    wood: '#c58f55', seam: '#8a5a34', outline: '#5a3a20', outlineWidth: 1.3,
    rail: 3.5,             // Stärke des Geländerbalkens
    post: 4,               // Pfostengröße
    shadow: 'rgba(43,27,61,0.3)', shadowOffset: [2, 4],
    waterReach: 0.75,      // Wasser wird unter der Brücke bis zu diesem Anteil einer Kachel quer zum Weg neu gemalt
  },
};

// Lava des Vulkans (B-030): Lavafluss, Lavatümpel und Steinbrücke. Nur Optik im Hintergrund-Cache (statisch), Maße in px bei 1x.
// Gezeichnet nur auf Karten mit MAPS.<id>.lava (Kacheln aus lavaRiver/lavaPools/bridges). Palette siehe STIL.md (Vulkan).
export const LAVA_STYLE = {
  glow: 'rgba(255,122,31,0.16)', // Glühen auf dem Boden rund um die Lava (zwei Lagen)
  glowWidth: [18, 9],      // zusätzliche Breite der Glüh-Lagen je Seite
  crust: '#2a1a17',        // dunkle Kruste am Rand (Kontur)
  crustWidth: 4,
  lava: '#ff7a1f',         // Fläche
  core: '#ffc23a',         // heller Kern zur Mitte hin (Glut)
  coreScale: [0.62, 0.3],  // Breite der Kern-Stufen als Anteil der Fläche (zweite Stufe in coreHot)
  coreHot: '#ffe58a',
  riverWidth: 24,
  riverWiggle: 3,          // seitlicher Schwung je Kachel, höchstens (deterministisch)
  edgePad: 24,             // Fluss läuft über Ober- und Unterkante hinaus (unter den Rahmen)
  poolRadius: 17,          // Radius je Tümpelkachel (Umriss wie der See: geglättete Hülle der Kreise)
  poolJoin: 1.15,          // Tümpel aus mehreren Kacheln: Radius mal diesem Faktor (breiteres Oval)
  poolSpan: 0.8,           // Anteil der halben Kachel-Ausdehnung, um den das Oval in Längsrichtung wächst
  poolPoints: 32,          // Stützpunkte des Tümpel-Umrisses (Oval)
  poolShift: 9,            // Tümpel rücken so viele px vom angrenzenden Weg weg (der Wegrand verdeckt sie sonst)
  plate: '#4a2a22',        // Krustenschollen auf der Lava
  plateSize: [4.5, 2.6],   // Halbachsen einer Scholle
  plateEvery: 3,           // jede n-te Flusskachel trägt eine Scholle
  plateSide: 0.35,         // seitlicher Versatz einer Scholle, höchstens dieser Anteil der Flussbreite (je Richtung halb)
  plateJitter: 10,         // senkrechter Versatz einer Scholle in px (±halb)
  sparkOffset: [0.6, 8],   // Glutpunkt neben der Scholle: Anteil des Gegenversatzes, Abstand nach unten in px
  spark: '#fff1b0',        // kleine helle Glutpunkte
  sparkSize: 1.3,
  // Steinbrücke: Steinplatten quer zur Laufrichtung, Brüstung aus Blöcken, Schlagschatten auf der Lava
  bridge: {
    length: 46, width: 30,
    stone: '#9a8a80', stoneTop: '#b8a99e', seam: '#6a5a52', outline: '#2a1c1a', outlineWidth: 1.3,
    slab: 11.5,            // Plattenbreite (Fugenabstand)
    rail: 4.5,             // Stärke der Brüstung
    block: 9,              // Blocklänge der Brüstung
    shadow: 'rgba(30,10,8,0.4)', shadowOffset: [2, 4],
    lavaReach: 0.75,       // Lava wird unter der Brücke bis zu diesem Anteil einer Kachel quer zum Weg neu gemalt
  },
  // Karten-Feinschliff: Glühen über dem gemalten Hintergrund (je Frame wenige weiche Flecken auf den Lavakacheln,
  // Lage einmal je Karte berechnet). Aus bei prefers-reduced-motion. Puls läuft den Fluss hinab (phaseStep je Flecken).
  pulse: { color: '255,205,110', radius: 15, alpha: [0.03, 0.24], speed: 1.7, phaseStep: 0.8, bridgeGap: 30 },
};

// Reichweitenkreis (B-082): kräftiger Ring, sehr dezente Fläche (ca. 8 %), damit er über Deko und Plateaus ruhig wirkt.
export const RANGE_STYLE = {
  fillAlpha: 0.08,
  ringAlpha: 0.75,
  ringWidth: 2,
  maxFillAlpha: 0.1,      // Obergrenze (Test)
};

// Gegner-Zusätze (die Figuren selbst: FIGURE_STYLE und src/figures.js)
export const ENEMY_STYLE = {
  // B-126: Schild-Blase um geschützte Gegner (Stärke ~ ward/Höchstschild)
  mage: {
    wardFill: 'rgba(120,200,255,0.28)', wardRing: 'rgba(190,235,255,0.9)', wardRingWidth: 1.6, wardPad: 4, wardPulse: 0.6, wardSpeed: 3,
  },
};

// Auftritt des Bosses (B-067, nur Darstellung): Bodenschlag-Ring plus leichtes Wackeln.
// Bei prefers-reduced-motion entfällt das Wackeln, der Ring wächst nicht.
export const BOSS_ENTRY = {
  shake: 2.4,          // Wackel-Amplitude in px (unter 3 px, SHAKE_MAX begrenzt zusätzlich)
  ringDuration: 0.55,  // Dauer des Bodenschlag-Rings in Sekunden Spielzeit
  ringRadius: 2.2,     // Endradius des Rings in Boss-Radien
  ringStart: 0.5,      // Startradius in Boss-Radien
  ringWidth: 3.5,      // Linienbreite in px (wird zum Ende dünner)
  ringColor: 'rgba(244,197,66,0.85)',
  ringDrop: 0.7,       // Ring-Mitte unterhalb der Boss-Mitte in Boss-Radien (am Boden)
  ringFlat: 0.4,       // Höhe der Ring-Ellipse relativ zur Breite (Draufsicht)
  // Staub beim Aufstampfen (B-095): wenige Wölkchen am Boden, bei reduzierter Bewegung keine
  dustCount: 8,        // Anzahl Staubpartikel (klein halten, Pool hat 256 Plätze)
  dustColor: 'rgba(245,236,214,0.7)', // heller, halbdurchsichtiger Staub (hebt sich vom Sandweg ab)
  dustLife: 0.6,       // Lebensdauer in Sekunden Spielzeit
  dustSpeed: 90,       // Startgeschwindigkeit nach außen in px/s
  dustStart: 0.9,      // Startabstand von der Ring-Mitte in Boss-Radien (am Rand der Figur)
  dustSize: 4,         // Grundgröße in px (plus bis zu dustSizeVar)
  dustSizeVar: 2,
  dustGrow: 0.8,       // Aufblähen über die Lebensdauer (Anteil der Größe), schrumpft zum Ende auf 0
};

// Projektile und Effekte im Flat-Pop-Stil (B-068, nur Darstellung). Maße in px bei 1x, Zeiten in Sekunden Spielzeit.
// Konturen werden aus der Eigenfarbe abgeleitet (outlineOf). Bei prefers-reduced-motion: kein Hopsen, kein Drehen.
export const FX_STYLE = {
  // Stil 1 (G8): Formen und Farben aus dem Entwurf (Pfeil Z.123, Scharfschuss Z.125, Kugel Z.130, Explosion Z.131–135,
  // Frost Z.137–141, Blitz Z.143–145). Maße in Entwurfs-px (Kachel 57), gezeichnet mit TILE / 57.
  arrow: { shaft: '#e8c185', head: '#d9dde2', fletch: '#d6483a', ink: '#2b1a10', back: 14, front: 12, tip: 14, headLen: 8, headHalf: 5, fletchLen: 5, shaftWidth: 2.4, inkWidth: 5, fletchWidth: 3, headLine: 2 },
  cannon: { color: '#33283a', ink: '#2b1a10', radius: 6, line: 2, trail: 'rgba(43,26,16,0.6)', trailWidth: 3, trailLen: 70, dash: [2, 10] },
  frost: { color: '#bfeeff', light: '#ffffff', ink: '#2b1a10', beam: 'rgba(143,216,242,0.5)', beamWidth: 7, core: '#f4fcff', coreWidth: 3, dash: [10, 6], beamLen: 60, r1: 13, r2: 5, points: 6, spin: 6, line: 2 },
  sniper: { beam: 'rgba(255,246,168,0.85)', bullet: '#fff6a8', ink: '#2b1a10', beamLen: 90, beamWidth: 2, dash: [14, 5], bulletR: 3.5, line: 1.5 },
  bolt: { outer: 'rgba(127,208,255,0.35)', outerWidth: 12, mid: '#2b1a10', midWidth: 6, core: '#fffbd0', coreWidth: 3, step: 30, amp: 8, flicker: 20 },
  // Explosion: Lichthof und Rauch unter den Figuren, drei Sterne darüber (Größe 1,4 Kacheln = Außenradius 40)
  explosion: {
    fill: 'rgba(255,246,168,0.35)', glowR: 58, glowCore: 0.55,
    smoke: [['#6b625b', -14, -18, 15], ['#80776e', 16, -10, 12], ['#80776e', -30, 2, 10]], smokeInk: 'rgba(43,26,16,0.85)', smokeLine: 3,
    stars: [[40, 22, 9, 0.2, '#e5481f', 4], [26, 13, 8, 0.5, '#ffc93c', 3], [12, 6, 7, 0.1, '#fffbd0', 0]], ink: '#2b1a10',
    grow: 0.25, shrink: 0.4, // Anteil der Dauer bis zur vollen Größe; Schrumpfen bis zum Ende
  },
  // Treffer: Blitz (Vierzack-Stern) 0,08 s laut STIL.md; Funken als kurze Striche, Eis als kleine Rauten.
  hit: {
    flash: '#fff3c9', flashSize: 4, flashAlpha: 0.8, flashLife: 0.08, flashStart: 0.6, flashGrow: 0.6, flashWaist: 0.3,
    spark: '#f4c542', sparkWidth: 1.5, sparkTail: 0.04, // sparkTail: Strichlänge in Sekunden Flugweg
    ice: '#bff0ff', iceSize: 1.6, iceBase: 1.5, iceStretch: 1.4, iceLine: 1, // iceBase: Partikelgröße ohne Vergrößerung
  },
  smoke: { color: '#9a8fa6', alpha: 0.45, grow: 0.6 }, // unter den Gegnern
  // B-127: Beschwörung der Nekromantin: grüne Lichtfunken steigen auf (life = Effektdauer in s Spielzeit, size in px)
  summon: { color: '#7dff9a', count: 6, life: 0.6, size: 2.2, sizeVar: 1.2, speed: 30, spread: 8, alpha: 0.85 },
  coin: { color: '#f4c542', dark: '#b07a14', shine: '#fff3c9', hop: 12, bounce: 0.3, split: 0.55, end: 0.85, spins: 1.5, minWidth: 0.3, fadeFrom: 0.6, drift: 20,
    edgeWidth: 1, inner: 0.72, shineMin: 0.6, shineOffset: 0.3, shineR: 0.22 }, // Rand, Innenfläche und Glanz relativ zur Größe
  coinText: { color: '#f4c542', outline: '#3b2415', outlineWidth: 3, rise: 10, lift: 20, font: 'bold 13px system-ui, sans-serif' }, // lift: Start über dem Gegner in px
  chill: { rgb: '120,200,255', alpha: 0.25 }, // Frost-Schimmer über dem ganzen Feld
  // Meteor (B-112): Anflug -> Einschlag -> Krater. Zeiten in Sekunden Spielzeit (flight + blast + crater = Effektdauer),
  // Radien als Anteil des Meteor-Radius r, sonst px. Der Schaden fällt sofort (game.js), der Anflug ist darum kurz.
  meteor: {
    flight: 0.28, blast: 0.75, crater: 4,
    // Anflug: schräg von rechts oben; Gestein mit Kontur, Glanzpunkt, Feuerschweif aus wenigen Kreisen
    fromX: 130, fromY: -230, fromMin: 0.45, rock: '#7a6a64', rockR: 10, rockShine: '#b3adaa',
    glow: '#ff7a1f', glowR: 17, glowAlpha: 0.45,
    tail: ['#ff7a1f', '#ffc23a', '#fff3c9'], tailPoints: 7, tailSpacing: 11, tailSize: 9, tailMin: 0.25, tailAlpha: 0.85,
    shadow: '#2b1b3d', shadowAlpha: 0.4, shadowFrom: 0.12, shadowTo: 0.45, shadowFlat: 0.6,
    target: '#ff5a28', targetAlpha: 0.65, targetWidth: 2.5,
    // Einschlag (Anteile der Einschlagdauer): Blitz, Feuerball in drei Lagen, Schockwellen-Ring bis zum Radius
    flash: '#fffbe8', flashEnd: 0.16, flashR: 0.95,
    // Feuerball als Wolke aus Puffs (Flat-Pop): firePuffs Kreise um die Mitte, puffDist/puffR in Feuerball-Radien
    fire: ['#ff7a1f', '#ffc23a', '#fff3c9'], fireR: [0.5, 0.36, 0.2], fireGrow: 0.18, fireEnd: 0.7, fireStart: 0.3,
    firePuffs: 7, puffDist: 0.55, puffR: 0.55, fireDrift: 0.35, fireEdge: 2,
    wave: '#fff3c9', waveEdge: '#ff7a1f', waveEnd: 0.6, waveFrom: 0.2, waveWidth: 8, waveEdgeWidth: 3,
    // Krater: dunkle Mulde mit hellem Rand, Brandfleck außen, Glutpunkte; verblasst über die Kraterzeit
    pit: '#55474a', craterRim: '#8b7468', craterR: 0.34, craterFlat: 0.72, rimWidth: 3, rimStones: 9, rimStoneR: 3.2,
    scorch: '#2b1b3d', scorchAlpha: 0.32, scorchR: 0.7,
    embers: 5, ember: '#ffc23a', emberR: 2.2, emberEnd: 0.45,
    // Partikel beim Einschlag (Pool hat 256 Plätze; ein Meteor braucht höchstens sparks + rocks + smoke)
    sparks: 14, sparkSpeed: 300, sparkSpeedVar: 220, sparkLife: 0.45,
    rocks: 8, rockSpeed: 220, rockSpeedVar: 120, rockLift: 170, rockLife: 0.75, rockSize: 3.2, chunk: '#5a4a48',
    smoke: 6, smokeSize: 9, smokeSizeVar: 5, smokeLife: 1.1, smokeSpread: 0.5, smokeSpeed: 22,
    shake: 2.8, // Wackeln in px (SHAKE_MAX begrenzt), nur ohne prefers-reduced-motion
  },
};

// B-113: Töne (Web Audio, synthetisiert, keine Dateien). Jeder Ton besteht aus Lagen:
// osc = Oszillator (wave, freq -> endFreq in Hz), noise = gefiltertes Rauschen (filter, cutoff in Hz, q).
// duration in s, gain = Spitzenlautstärke der Lage (0..1), attack = Anstiegszeit in s, delay = Start nach s (optional),
// endCutoff = Filterfrequenz am Ende (optional, Rauschen gleitet exponentiell von cutoff dorthin).
// Die Hüllkurve fällt exponentiell bis SOUND.floorGain ab.
export const SOUND = {
  masterGain: 0.12,     // Gesamtlautstärke (leise)
  masterLowpass: 4500,  // Tiefpass am Master in Hz (nimmt Schärfe)
  masterLowpassQ: 0.7,
  floorGain: 0.0001,    // Endwert der Hüllkurve (exponentiell, darf nicht 0 sein)
  attack: 0.005,        // Standard-Anstiegszeit in s
  noiseLength: 0.5,     // Länge des gemeinsamen Rauschen-Buffers in s
  storageKey: 'td-sound', // localStorage-Schlüssel für Ton an/aus
  defaultOn: true,
  // Begrenzung: höchstens perWindow Töne je Art (Schuss je Turmtyp, Tod, Boss) pro window Sekunden Echtzeit
  // Schuss-Töne zusammen höchstens total pro totalWindow (Tode, Boss, Warnton und Meteor zählen nie dagegen;
  // Kanonenschüsse zählen mit, werden aber nie verschluckt, siehe totalExemptShots).
  limit: { window: 0.12, perWindow: 1, total: 3, totalWindow: 0.15 },
  limitOverrides: { death: { window: 0.1, perWindow: 2 } }, // eigene Grenzen je Art (Warnton: lifeLost.limit)
  totalExempt: ['lifeLost', 'meteorFlight', 'meteorImpact'],
  // Schuss-Arten, die die gemeinsame Grenze nie verschluckt (zählen aber mit); ihre Grenze je Art gilt weiter
  totalExemptShots: ['cannon'],
  // Tonhöhen-Variation je Schuss (Anteil, ±), damit Salven nicht maschinell klingen
  shotPitchVar: { arrow: 0.06, cannon: 0.04, frost: 0.05, sniper: 0.05, lightning: 0.05 },
  shots: {
    // Pfeil: tiefer Sehnen-"Twang" mit leisem Oberton, dann Flug-"Wusch" (Bandpass gleitet nach oben)
    arrow: [
      { type: 'osc', wave: 'triangle', freq: 230, endFreq: 185, duration: 0.12, gain: 0.2, attack: 0.002 },
      { type: 'osc', wave: 'sine', freq: 460, endFreq: 370, duration: 0.06, gain: 0.06, attack: 0.002 },
      { type: 'noise', filter: 'bandpass', cutoff: 900, endCutoff: 2600, q: 1.5, duration: 0.18, gain: 0.11, attack: 0.055, delay: 0.02 },
    ],
    // Kanone: tiefer Abschuss-Bumm mit Rauschen und kurzem Nachgrollen (lauteste Schuss-Synthese, unter dem Warnton)
    cannon: [
      { type: 'osc', wave: 'sine', freq: 110, endFreq: 32, duration: 0.45, gain: 0.44 },
      { type: 'noise', filter: 'lowpass', cutoff: 900, q: 0.7, duration: 0.25, gain: 0.34 },
      { type: 'noise', filter: 'lowpass', cutoff: 250, q: 0.7, duration: 0.5, gain: 0.3, attack: 0.02 },
    ],
    // Frost: sanftes, glasiges "Kling" (zwei Sinus zwischen 1200 und 1800 Hz)
    frost: [
      { type: 'osc', wave: 'sine', freq: 1500, endFreq: 1420, duration: 0.22, gain: 0.1 },
      { type: 'osc', wave: 'sine', freq: 1790, endFreq: 1760, duration: 0.12, gain: 0.04 },
    ],
    // Scharfschütze: kurzes, tieferes "Tock" (Rauschen im Bandpass plus Sinus)
    sniper: [
      { type: 'noise', filter: 'bandpass', cutoff: 1500, q: 2, duration: 0.06, gain: 0.25 },
      { type: 'osc', wave: 'sine', freq: 420, endFreq: 220, duration: 0.07, gain: 0.15 },
    ],
    // Blitz: kurzes Zischen
    lightning: [
      { type: 'noise', filter: 'bandpass', cutoff: 2500, q: 1.2, duration: 0.11, gain: 0.18 },
      { type: 'osc', wave: 'triangle', freq: 95, endFreq: 70, duration: 0.09, gain: 0.03 },
    ],
  },
  // Besiegter Gegner: kurzer "Plopp", Tonhöhe zufällig um ±pitchVar (Anteil) variiert
  death: {
    pitchVar: 0.25,
    layers: [{ type: 'osc', wave: 'sine', freq: 440, endFreq: 170, duration: 0.1, gain: 0.3, attack: 0.008 }],
  },
  // Boss besiegt: tiefer, größerer Ton
  boss: {
    pitchVar: 0,
    layers: [
      { type: 'osc', wave: 'triangle', freq: 220, endFreq: 55, duration: 0.7, gain: 0.7 },
      { type: 'osc', wave: 'sine', freq: 110, endFreq: 40, duration: 0.9, gain: 0.6 },
      { type: 'noise', filter: 'lowpass', cutoff: 500, q: 0.7, duration: 0.4, gain: 0.4 },
    ],
  },
  // Leben verloren (Gegner am Ziel): zwei kurze, absteigende Töne. Höchstens ein Warnton je limit-Fenster,
  // auch wenn mehrere Leben auf einmal verloren gehen.
  lifeLost: {
    pitchVar: 0,
    limit: { window: 0.8, perWindow: 1 },
    layers: [
      { type: 'osc', wave: 'triangle', freq: 494, endFreq: 470, duration: 0.14, gain: 0.45 },
      { type: 'osc', wave: 'triangle', freq: 370, endFreq: 340, duration: 0.22, gain: 0.45, delay: 0.13 },
      { type: 'osc', wave: 'sine', freq: 185, endFreq: 170, duration: 0.3, gain: 0.25, delay: 0.13 },
    ],
  },
  // Meteor (Fähigkeit): kurzes Pfeifen/Rauschen beim Anflug, beim Einschlag dumpfer Knall mit Nachgrollen.
  // Einschlag zählt nur, wenn er höchstens impactLate Anteile der Einschlagphase zurückliegt (sonst nicht nachholen).
  meteor: {
    impactLate: 0.5,
    flight: [
      { type: 'osc', wave: 'sine', freq: 1800, endFreq: 500, duration: 0.28, gain: 0.14 },
      { type: 'noise', filter: 'bandpass', cutoff: 1400, q: 1.5, duration: 0.28, gain: 0.22, attack: 0.15 },
    ],
    impact: [
      { type: 'osc', wave: 'sine', freq: 110, endFreq: 30, duration: 0.9, gain: 1 },
      { type: 'osc', wave: 'triangle', freq: 70, endFreq: 28, duration: 1.4, gain: 0.5 },
      { type: 'noise', filter: 'lowpass', cutoff: 900, q: 0.7, duration: 0.5, gain: 0.9 },
      { type: 'noise', filter: 'lowpass', cutoff: 220, q: 0.7, duration: 1.6, gain: 0.6, attack: 0.06 }, // Nachgrollen
    ],
  },
  // B-114: Aufnahmen (Kenney, CC0, siehe assets/sounds/LIZENZ.md) statt Synthese. Schlüssel wie soundKey().
  // Je Ton mehrere Varianten (zufällig), gain = Lautstärke vor dem Master, pitchVar = Tonhöhen-Variation (±Anteil).
  // Fehlt eine Datei oder schlägt Laden/Dekodieren fehl, spielt die Synthese von oben als Ersatz.
  samples: {
    base: 'assets/sounds/',
    sounds: {
      // Pfeil: echter Bogenschuss (Battle Sound Effects, CC0); feuert oft, daher leise
      'shot:arrow':     { files: ['arrow-1', 'arrow-2', 'arrow-3'], gain: 0.12, pitchVar: 0.08 },
      // Kanone: Abschussknall (Aufnahme schon tiefer gestimmt und laut gemischt), deutlich lauter als andere Schüsse
      'shot:cannon':    { files: ['cannon-1', 'cannon-2', 'cannon-3'], gain: 0.5, pitchVar: 0.06 },
      'shot:frost':     { files: ['frost-1', 'frost-2', 'frost-3'], gain: 0.2, pitchVar: 0.06 },
      'shot:sniper':    { files: ['sniper-1', 'sniper-2', 'sniper-3'], gain: 0.3, pitchVar: 0.06 },
      'shot:lightning': { files: ['lightning-1', 'lightning-2', 'lightning-3'], gain: 0.18, pitchVar: 0.06 },
      // Tod: kurze Monster-Schreie (OpenGameArt, CC0); enemyRate = Tonhöhe je Gegnertyp (klein/schnell höher)
      death:            { files: ['death-1', 'death-2', 'death-3', 'death-4'], gain: 0.55, pitchVar: 0.08,
                          enemyRate: { runner: 1.25, grunt: 1.1, healer: 1.05, mage: 1.0, shielded: 0.95, tank: 0.85, skeleton: 1.35 } },
      // Boss-Tod: langer, tiefer Schrei, zusätzlich tiefer abgespielt (rate = Grund-Tonhöhe)
      boss:             { files: ['boss-1', 'boss-2'], gain: 0.9, pitchVar: 0.03, rate: 0.85 },
      lifeLost:         { files: ['life-lost-1', 'life-lost-2'], gain: 0.8, pitchVar: 0 },
      meteorFlight:     { files: ['meteor-flight-1', 'meteor-flight-2'], gain: 0.7, pitchVar: 0.05 },
      meteorImpact:     { files: ['meteor-impact-1', 'meteor-impact-2'], gain: 1.4, pitchVar: 0.04 },
    },
  },
  // B-115: Ereignis-Töne (Bauen, Ausbauen, Verkaufen, Wellenstart, Sieg, Niederlage). Deutlich lauter als Schüsse,
  // zählen nicht gegen die gemeinsame Schuss-Grenze; je Art eigene Grenze (limit). layers = Synthese-Ersatz.
  events: {
    // Bauen: drei dumpfe Holzschläge
    build: {
      pitchVar: 0.04,
      limit: { window: 0.25, perWindow: 1 },
      layers: [
        { type: 'noise', filter: 'lowpass', cutoff: 900, q: 0.8, duration: 0.07, gain: 0.5 },
        { type: 'osc', wave: 'triangle', freq: 190, endFreq: 120, duration: 0.08, gain: 0.5 },
        { type: 'noise', filter: 'lowpass', cutoff: 900, q: 0.8, duration: 0.07, gain: 0.4, delay: 0.16 },
        { type: 'osc', wave: 'triangle', freq: 180, endFreq: 115, duration: 0.08, gain: 0.4, delay: 0.16 },
        { type: 'noise', filter: 'lowpass', cutoff: 900, q: 0.8, duration: 0.1, gain: 0.5, delay: 0.32 },
        { type: 'osc', wave: 'triangle', freq: 170, endFreq: 105, duration: 0.12, gain: 0.5, delay: 0.32 },
      ],
    },
    // Ausbauen: aufsteigender Dreiklang
    upgrade: {
      pitchVar: 0,
      limit: { window: 0.2, perWindow: 1 },
      layers: [
        { type: 'osc', wave: 'triangle', freq: 523, endFreq: 523, duration: 0.1, gain: 0.35 },
        { type: 'osc', wave: 'triangle', freq: 659, endFreq: 659, duration: 0.1, gain: 0.35, delay: 0.08 },
        { type: 'osc', wave: 'triangle', freq: 784, endFreq: 784, duration: 0.2, gain: 0.35, delay: 0.16 },
      ],
    },
    // Verkaufen: zwei helle Münz-Klänge
    sell: {
      pitchVar: 0.03,
      limit: { window: 0.2, perWindow: 1 },
      layers: [
        { type: 'osc', wave: 'sine', freq: 1900, endFreq: 1850, duration: 0.12, gain: 0.25 },
        { type: 'osc', wave: 'sine', freq: 2300, endFreq: 2250, duration: 0.18, gain: 0.25, delay: 0.07 },
      ],
    },
    // B-123: Münzregen beim Frühstart-Bonus (Ersatz: helles, aufsteigendes Klingeln)
    coinBurst: {
      pitchVar: 0.03,
      limit: { window: 0.3, perWindow: 1 },
      layers: [
        { type: 'osc', wave: 'sine', freq: 1800, endFreq: 1780, duration: 0.1, gain: 0.25 },
        { type: 'osc', wave: 'sine', freq: 2200, endFreq: 2180, duration: 0.1, gain: 0.25, delay: 0.06 },
        { type: 'osc', wave: 'sine', freq: 2700, endFreq: 2650, duration: 0.2, gain: 0.25, delay: 0.12 },
      ],
    },
    // Wellenstart: kurzes Horn (Quinte aufwärts)
    waveStart: {
      pitchVar: 0,
      limit: { window: 1, perWindow: 1 },
      layers: [
        { type: 'osc', wave: 'sawtooth', freq: 233, endFreq: 233, duration: 0.16, gain: 0.25, attack: 0.03 },
        { type: 'osc', wave: 'sawtooth', freq: 349, endFreq: 349, duration: 0.35, gain: 0.25, attack: 0.03, delay: 0.15 },
      ],
    },
    // Sieg: kurze aufsteigende Fanfare
    won: {
      pitchVar: 0,
      limit: { window: 2, perWindow: 1 },
      layers: [
        { type: 'osc', wave: 'triangle', freq: 392, endFreq: 392, duration: 0.14, gain: 0.4 },
        { type: 'osc', wave: 'triangle', freq: 523, endFreq: 523, duration: 0.14, gain: 0.4, delay: 0.13 },
        { type: 'osc', wave: 'triangle', freq: 659, endFreq: 659, duration: 0.14, gain: 0.4, delay: 0.26 },
        { type: 'osc', wave: 'triangle', freq: 784, endFreq: 784, duration: 0.6, gain: 0.45, delay: 0.39 },
      ],
    },
    // Niederlage: dumpfer, absteigender Jingle
    lost: {
      pitchVar: 0,
      limit: { window: 2, perWindow: 1 },
      layers: [
        { type: 'osc', wave: 'triangle', freq: 349, endFreq: 345, duration: 0.3, gain: 0.4 },
        { type: 'osc', wave: 'triangle', freq: 330, endFreq: 326, duration: 0.3, gain: 0.4, delay: 0.3 },
        { type: 'osc', wave: 'triangle', freq: 311, endFreq: 307, duration: 0.3, gain: 0.4, delay: 0.6 },
        { type: 'osc', wave: 'triangle', freq: 294, endFreq: 270, duration: 0.9, gain: 0.45, delay: 0.9 },
        { type: 'osc', wave: 'sine', freq: 147, endFreq: 135, duration: 1.2, gain: 0.3, delay: 0.6 },
      ],
    },
  },
  // B-115: Aufnahmen der Ereignis-Töne (Kenney, CC0, siehe LIZENZ.md). Aufbau wie samples, Schlüssel = Ereignis-Art.
  eventSamples: {
    base: 'assets/sounds/',
    sounds: {
      build:     { files: ['build-1', 'build-2'], gain: 0.8, pitchVar: 0.04 },
      upgrade:   { files: ['upgrade-1', 'upgrade-2'], gain: 0.6, pitchVar: 0 },
      sell:      { files: ['sell-1', 'sell-2'], gain: 0.7, pitchVar: 0.03 },
      // B-123: dieselben Münz-Aufnahmen, lauter und heller als beim Verkaufen
      coinBurst: { files: ['sell-2', 'sell-1'], gain: 0.95, pitchVar: 0.03, rate: 1.18 },
      waveStart: { files: ['wave-start'], gain: 0.8, pitchVar: 0 },
      won:       { files: ['won'], gain: 0.9, pitchVar: 0 },
      lost:      { files: ['lost'], gain: 0.9, pitchVar: 0 },
    },
  },
  // B-116: Hintergrundmusik ("The Old Tower Inn", RandomMind, CC0, siehe assets/sounds/LIZENZ.md).
  // Eigener Gain direkt zum Ausgang (nicht über Master und Effekt-Tiefpass), deutlich leiser als die Effekte.
  // Geladen erst nach den Effekt-Aufnahmen. Stille am Anfang/Ende (Betrag <= silence) wird per loopStart/loopEnd
  // übersprungen; ist danach weniger als minLoop Sekunden übrig, läuft die ganze Datei.
  music: {
    base: 'assets/music/',
    file: 'music-old-tower-inn', // Rückfall für Karten ohne eigenen (oder ladbaren) Titel
    // B-118: eigener Titel je Karte (file = Dateiname ohne Endung). gain = Lautstärkefaktor auf music.gain,
    // gleicht die unterschiedliche Lautheit der Titel aus (RMS gegenüber old-tower-inn: ice -6,5 dB,
    // fork -4,3 dB, twin +5,4 dB, volcano +4,1 dB).
    byMap: {
      meadow:  { file: 'music-old-tower-inn', gain: 1 },
      ice:     { file: 'music-ice', gain: 2.0 },
      fork:    { file: 'music-fork', gain: 1.6 },
      twin:    { file: 'music-twin', gain: 0.55 },
      volcano: { file: 'music-volcano', gain: 0.6 },
    },
    gain: 0.025,         // Lautstärke im laufenden Spiel
    pausedFactor: 0.6,   // bei Pause etwas leiser (Anteil von gain)
    fadeIn: 2,           // Einblenden in s (Start, Ton wieder an, neues Spiel)
    fadeOut: 0.6,        // Ausblenden in s (Sieg, Niederlage), damit die Jingles hörbar sind
    fadeChange: 0.5,     // Übergang Pause <-> Spiel in s
    silence: 0.001,      // Grenzwert für Stille (ca. -60 dB)
    minLoop: 1,          // kürzeste Schleife in s
  },
};
