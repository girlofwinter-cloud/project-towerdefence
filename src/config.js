// Zentrale Spiel-Konfiguration: alle Zahlen zum Balancing stehen hier.

export const TILE = 40;
export const COLS = 20;
export const ROWS = 14;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;

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
const MEADOW_RIVER = [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8]];
const MEADOW_LAKE = [[1, 9], [2, 9], [1, 10], [2, 10], [2, 11]];
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
    // B-071: Wegpalette der Wiese (STIL.md); Eiswelt und Zangenangriff haben eigene Wegfarben (B-072, B-073).
    // B-103: decor.flatTrees, damit die Hindernisse im Flat-Pop-Stil erscheinen (Laubbaum, Fels mit Kontur)
    theme: { treeFrame: true, ground: true, accents: true, light: true, islands: true, decorStyle: 'flatpop', decor: { flatTrees: true }, path: { main: '#e2c88f', edge: '#8f6a3b', outline: '#4a3418', mid: '#ecd5a0', fringe: '#6fbf4e' } },
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
      path: { main: '#9db3c9', edge: '#4f6682', outline: '#2f4560', mid: '#b4c7d9', fringe: '#ffffff' },
      // Glatter Eisweg: wenige Steine, weißer Glanz statt brauner Spurrillen, kühle Flecken
      pathStyle: {
        stoneChance: 0.14, rutColor: 'rgba(255,255,255,0.5)', rutWidth: 2.2,
        stoneColors: ['#7f94ab', '#c9d8e6'], pebbleColors: ['#8aa0b8', '#c9d8e6'], stoneShadow: 'rgba(38,64,108,0.4)',
        patchDark: 'rgba(79,102,130,0.16)', patchLight: 'rgba(255,255,255,0.3)',
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
    lanes: { runner: 0, tank: 1, shielded: 1, healer: 1 },
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
      path: { main: '#d6ab70', edge: '#7d5632', outline: '#4a3018', mid: '#e8c88e', fringe: '#e0803a' },
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
    lanes: { runner: 0, tank: 1, shielded: 1, healer: 1 },
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
      path: { main: '#dcc08a', edge: '#86603a', outline: '#3e2a14', mid: '#e8d2a0', fringe: '#a6cf5a' },
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
      path: { main: '#8b7468', edge: '#2d1f20', outline: '#1f1415', mid: '#9c857a', fringe: '#2e2325' },
      pathStyle: {
        rutColor: 'rgba(45,31,32,0.35)', stoneColors: ['#5a4a48', '#7a6a66'], pebbleColors: ['#6a5650', '#a08a80'],
        stoneShadow: 'rgba(20,10,12,0.45)', patchDark: 'rgba(45,31,32,0.16)', patchLight: 'rgba(255,190,140,0.12)',
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
export const ENEMY_TYPES = {
  grunt: { name: 'Goblin', hp: 40, speed: 1.4, reward: 4, leak: 1, radius: 11, color: '#6fbf4a' },
  runner: { name: 'Flitzer', hp: 25, speed: 2.6, reward: 3, leak: 1, radius: 9, color: '#f2c14e' },
  tank: { name: 'Panzer-Troll', hp: 450, speed: 0.8, reward: 12, leak: 2, radius: 14, color: '#b5523b' },
  boss: { name: 'Oger-König', hp: 1100, speed: 0.6, reward: 65, leak: 6, radius: 18, color: '#7a2e8e' },
  healer: { name: 'Schamane', hp: 40, speed: 1.1, reward: 9, leak: 1, radius: 11, color: '#3fbf8f', healRadius: 1.5, healPerSec: 0.02, healInterval: 1 },
  shielded: { name: 'Schildträger', hp: 90, speed: 1.0, reward: 12, leak: 2, radius: 13, color: '#6f86a8', armor: 0.5 },
};

export function waveBonus(wave) {
  return 10 + wave;
}

// HP-Multiplikator pro Welle: Gegner werden mit jeder Welle zäher.
// Welle 1-5 moderat (+15 %), Welle 5-10 steil (+26 %), danach flach (+7 %), damit Welle 20 schaffbar bleibt.
export function hpScale(wave) {
  const early = Math.min(wave, 5) - 1;
  const mid = Math.max(Math.min(wave, 10) - 5, 0);
  const late = Math.max(wave - 10, 0);
  return Math.pow(1.15, early) * Math.pow(1.26, mid) * Math.pow(1.07, late);
}

// Spätphase (B-013): ab dieser Welle laufen Heiler in der Troll-Gruppe mit, ab der Welle danach kommen
// pro Welle ein Troll und zwei Flitzer mehr dazu. Die Wellen 1-13 bleiben davon unberührt.
const LATE_WAVE = 14;

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
  if (wave >= 7 && wave < LATE_WAVE) add('healer', 1 + Math.floor((wave - 7) / 4), 1.2);
  // Spätphase: Heiler laufen mitten in der Troll-Gruppe mit, statt ihr als letzte Gruppe hinterherzulaufen
  if (wave >= LATE_WAVE) {
    const healers = 2 + Math.floor((wave - LATE_WAVE) / 3);
    for (let i = 0; i < healers; i++) list.push({ type: 'healer', at: tankStart + 2 + i * 2 });
    list.sort((a, b) => a.at - b.at);
  }
  if (wave % 5 === 0) add('boss', Math.floor(wave / 10) + 1, 3);
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

// Pfeilturm im Flat-Pop-Stil (B-063). Alle Maße in px, Ursprung = Bodenmitte des Turms, y nach oben negativ.
export const ARROW_TOWER = {
  scale: 0.85,              // Gesamtskalierung (Turm ca. 30 px breit, ca. 58 px hoch)
  groundDy: 13,             // Boden liegt so weit unter der Turmmitte (x, y)
  shadowR: 15,              // Radius des Bodenschattens
  headY: -34,               // Drehpunkt des Bogens (Brust des Schützen)
  roofBaseY: -41,           // Unterkante des Dachs
  roofHeight: [17, 19, 22], // Dachhöhe je Stufe
  roofHalf: [17, 17.5, 19], // halbe Dachbreite je Stufe
  poleHeight: [0, 6, 5],    // Wimpelstange über dem Dach je Stufe (0 = kein Wimpel)
  bowRadius: 8,             // Bogenradius
  bowSpan: 1.1,             // halber Öffnungswinkel des Bogens (rad)
  bowWidth: 1.6,            // Bogenbreite
  iconScale: 0.75,          // Skalierung in der Shop-Vorschau (40x40-Platz, Turm ist höher)
  iconDy: 9,                // Verschiebung der Shop-Vorschau nach unten in px
  arrowLength: 11,          // Länge des aufgelegten Pfeils
};

// Kanone, Frostturm, Scharfschütze und Blitzturm im Flat-Pop-Stil (B-064). Maße in px, Ursprung = Bodenmitte,
// y nach oben negativ. Arrays haben je einen Wert für Stufe 1 bis 3. iconScale/iconDy: Shop-Vorschau (48x48).
export const TOWER_STYLE = {
  cannon: {
    scale: 0.9, groundDy: 13, shadowR: 15, iconScale: 1.1, iconDy: 4,
    halfWidth: [15, 16.5, 18],    // halbe Breite des Steinbunkers
    height: [12, 14, 16],         // Höhe des Bunkers bis zur Zinne
    merlons: [3, 4, 5],           // Anzahl der Zinnen
    barrelLength: [16, 17.5, 19], // Rohrlänge ab Drehpunkt
    barrelThick: [1, 1.1, 1.2],   // Rohrdicke (Faktor)
  },
  frost: {
    scale: 0.9, groundDy: 13, shadowR: 14, iconScale: 0.9, iconDy: 7,
    pivotY: -35,                  // Drehpunkt des Eissplitters
    shardLength: [11, 13, 15],    // Länge des Eissplitters
    icicleLength: [5, 7, 9],      // Länge der Eiszapfen am Kragen
    crystals: [0, 1, 2],          // Paare seitlicher Eiskristalle am Schaft
  },
  sniper: {
    scale: 0.8, groundDy: 13, shadowR: 13, iconScale: 0.85, iconDy: 8,
    shaftHeight: [30, 33, 36],    // Höhe des Schafts
    barrelLength: [17, 19, 21],   // Länge des Zielrohrs
  },
  lightning: {
    scale: 0.9, groundDy: 13, shadowR: 14, iconScale: 0.9, iconDy: 7,
    pivotY: -37,                 // Drehpunkt des Kristalls
    rings: [2, 3, 4],             // Metallringe an der Spule
    crystalSize: [1, 1.15, 1.3],  // Größe des Kristalls (Faktor)
    arms: [0, 1, 2],              // Paare von Fangarmen mit Leuchtkugel
  },
};

// Weg im Flat-Pop-Stil (B-071). Maße in px bei 1x. Gesamtbreite in Kachelmitte = TILE, der wellige
// Rand ragt höchstens `overhangMax` darüber hinaus (Test in tests/render.test.js).
export const PATH_STYLE = {
  overhangMax: 4,          // so weit darf der Rand über die halbe Kachel hinausragen
  edgeOffset: 15.5,        // Abstand der Randkreise von der Wegachse (Mittelwert)
  edgeRadius: 5.2,         // Radius der Kontur-Kreise (außen)
  edgeInner: 3.6,          // Radius des helleren Randbands
  waveAmp: 2,              // Amplitude der Welle in px
  waveHarmonic: 0.4,       // Anteil der zweiten, schnelleren Welle
  waveLength: 0.11,        // Wellenzahl der Grundwelle (rad pro px)
  circleStep: 4.5,         // Abstand der Randkreise entlang des Wegs
  sandWidth: 32,           // Breite der Sandfläche (liegt über den Randkreisen)
  midWidth: 20,            // Breite der helleren Wegmitte
  shadowWidth: 44,         // Breite des Schlagschattens auf dem Gras
  shadowOffset: [2, 4],    // Versatz des Schlagschattens
  shadowColor: 'rgba(43,27,61,0.3)',
  bandShade: 0.12,         // Randband = Wegfarbe um diesen Anteil zum Schattenton gemischt
  fringeStep: 6,           // Abstand der Gras-Säume entlang des Wegs (0 = kein Saum)
  fringeRadius: 3.4,       // Radius eines Saumpunkts
  fringeOffset: [21, 24],  // Abstand der Saumpunkte von der Achse (von, bis)
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
  colors: { main: '#dcc189', edge: '#8f7140', outline: '#8f7140', mid: '#dcc189', fringe: null },
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
};

// Bauplatz-Inseln der Wiese (B-082): Gras-Plateau mit Kontur und kurzer Wand unter jedem Turm, blasse Vorschau beim Hover.
// Nur Optik im Frame-Pfad (Türme sind dynamisch), aktiv nur mit MAPS.<id>.theme.islands. Maße in px bei 1x.
export const ISLAND_STYLE = {
  offsetY: 11,            // Mittelpunkt der Insel unterhalb der Turmmitte
  rx: 30, ry: 15,         // Halbachsen der Grasfläche
  wall: 4,                // Höhe der Wand unter der Grasfläche
  outline: 1.5,           // Konturbreite
  colors: { shadow: '43,27,61', outline: '47,106,44', wall: '58,125,50', top: '116,193,87', light: '147,217,107' },
  shadowAlpha: 0.3,       // Schlagschatten rechts unten
  ghostAlpha: 0.45,       // Deckkraft der Vorschau-Insel (Hover, gültig)
  badTint: '255,60,60',   // Rötung bei ungültiger Kachel
  badAlpha: 0.45,
};

// Reichweitenkreis (B-082): kräftiger Ring, sehr dezente Fläche (ca. 8 %), damit er über Deko und Plateaus ruhig wirkt.
export const RANGE_STYLE = {
  fillAlpha: 0.08,
  ringAlpha: 0.75,
  ringWidth: 2,
  maxFillAlpha: 0.1,      // Obergrenze (Test)
};

// B-065: Gegner im Flat-Pop-Stil (Goblin, Flitzer, Troll). Maße in Design-Pixeln bei Radius `ref`
// (die Figur wird mit radius/ref skaliert). `main` = Flächenanteil der Hauptfarben (Summe 1) für den Kontrasttest.
export const ENEMY_STYLE = {
  legSwing: 2.6,     // Beinschwung vor/zurück in px
  bob: 1.1,          // Wippen in px
  legLift: 1.2,      // Fuß hebt sich im Vorschwung
  outlineWidth: 1.8, // kräftigere Kontur als STYLE.outlineWidth (Lesbarkeit auf hellem Weg, B-085)
  eyeRim: '#ffffff',
  eyeDark: '#1a1a1a',
  browColor: '#2a1d1a',
  grunt: {
    ref: 12,
    skin: '#6fbf4a', tunic: '#764324', belt: '#4a2a18',
    main: { skin: 0.4, tunic: 0.6 },
  },
  runner: {
    ref: 10.5,
    skin: '#f2c14e', suit: '#a8500f', cap: '#7a3a14', streak: 'rgba(122,58,20,0.55)',
    main: { skin: 0.35, suit: 0.5, cap: 0.15 },
  },
  tank: {
    ref: 14,
    skin: '#b5523b', plate: '#9aa3a8', plateDark: '#6d767b', tusk: '#f1e8d2',
    main: { skin: 0.5, plate: 0.2, plateDark: 0.3 },
  },
  healer: {
    ref: 11,
    skin: '#3fbf8f', robe: '#1f6e50', robeDark: '#154c37', face: '#bfe8cf', staff: '#6b4a2b', orb: '#b8ffd8', cross: '#1f6e50',
    orbRadius: 2.6, orbPulse: 0.3, orbSpeed: 4, // Leuchtkugel: Grundradius, Pulsausschlag (px), Tempo (rad/s)
    main: { skin: 0.3, robe: 0.7 },
  },
  shielded: {
    ref: 13,
    skin: '#6f86a8', body: '#4f607c', helm: '#9aa7ba', shield: '#7a5530', rim: '#c9ccd2', emblem: '#e8d27a',
    main: { skin: 0.3, body: 0.3, shield: 0.4 },
  },
  // Boss Oger-König (B-067): ref wird aus sizeFactor berechnet (render-enemies-flat.js), damit ein Design-Pixel
  // beim Boss sizeFactor-mal so groß ist wie beim Goblin.
  boss: {
    sizeFactor: 1.6,
    skin: '#7a2e8e', belly: '#b77fc4', fur: '#8a5a34', club: '#c58f55', stud: '#b3adaa',
    gold: '#f4c542', jewel: '#d4503f', tusk: '#f1e8d2',
    aura: 'rgba(190,110,235,0.2)', auraRing: 'rgba(225,170,255,0.65)', auraWidth: 1.1,
    auraRadius: 12.6, auraPulse: 0.7, auraSpeed: 3, // Aura: Grundradius, Pulsausschlag (Design-px), Tempo (rad/s)
    main: { skin: 0.55, belly: 0.15, fur: 0.15, gold: 0.15 },
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
  arrow: { shaft: '#c58f55', head: '#b3adaa', fletch: '#d4503f', length: 12, headLen: 4.5, headHalf: 2.6, fletchLen: 3.5, fletchHalf: 2.2, shaftWidth: 1.6, fletchBack: 1, fletchNotch: 0.5 }, // fletchBack/-Notch: Federende und Kerbe in px
  trail: { color: '#fff3c9', points: 4, spacing: 4, size: 1.6, alpha: 0.6, minSize: 0.5 }, // Schweif aus 3 bis 5 Punkten, minSize: Anteil am Ende
  cannon: { color: '#4a3f55', radius: 4.5, shine: '#fff3c9', shineR: 1.4, shineOffset: 0.35 }, // Glanzpunkt-Versatz in Radien
  frost: { color: '#7fd8f4', light: '#bff0ff', len: 5.5, half: 2.8, glowColor: '#bff0ff', glowR: 5.5, glowAlpha: 0.25, back: 0.6 }, // back: Heck der Raute in Längen
  sniper: { beam: '#efe2ff', core: '#ffffff', bullet: '#e6d1ff', beamLen: 38, beamAlpha: 0.4, bulletR: 2.2, beamWidth: 3, coreWidth: 1, inner: 0.7 }, // inner: Anteil des hellen Kerns am Strahl
  bolt: { outer: '#4f7fc8', outerWidth: 4.5, outerAlpha: 0.55, mid: '#f4c542', midWidth: 2.4, core: '#fff3c9', coreWidth: 1 },
  explosion: { fill: '#ff9a3c', fillAlpha: 0.3, ring: '#f4c542', ringWidth: 3, grow: 0.5, endScale: 1.2 }, // unter den Gegnern; endScale: Endradius in Splash-Radien
  // Treffer: Blitz (Vierzack-Stern) 0,08 s laut STIL.md; Funken als kurze Striche, Eis als kleine Rauten.
  hit: {
    flash: '#fff3c9', flashSize: 4, flashAlpha: 0.8, flashLife: 0.08, flashStart: 0.6, flashGrow: 0.6, flashWaist: 0.3,
    spark: '#f4c542', sparkWidth: 1.5, sparkTail: 0.04, // sparkTail: Strichlänge in Sekunden Flugweg
    ice: '#bff0ff', iceSize: 1.6, iceBase: 1.5, iceStretch: 1.4, iceLine: 1, // iceBase: Partikelgröße ohne Vergrößerung
  },
  smoke: { color: '#9a8fa6', alpha: 0.45, grow: 0.6 }, // unter den Gegnern
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
  // Schuss-Töne zusammen höchstens total pro totalWindow (Tode, Boss, Warnton und Meteor zählen nie dagegen).
  limit: { window: 0.12, perWindow: 1, total: 3, totalWindow: 0.15 },
  limitOverrides: { death: { window: 0.1, perWindow: 2 } }, // eigene Grenzen je Art (Warnton: lifeLost.limit)
  totalExempt: ['lifeLost', 'meteorFlight', 'meteorImpact'],
  // Tonhöhen-Variation je Schuss (Anteil, ±), damit Salven nicht maschinell klingen
  shotPitchVar: { arrow: 0.06, cannon: 0.04, frost: 0.05, sniper: 0.05, lightning: 0.05 },
  shots: {
    // Pfeil: tiefer Sehnen-"Twang" mit leisem Oberton, dann Flug-"Wusch" (Bandpass gleitet nach oben)
    arrow: [
      { type: 'osc', wave: 'triangle', freq: 230, endFreq: 185, duration: 0.12, gain: 0.2, attack: 0.002 },
      { type: 'osc', wave: 'sine', freq: 460, endFreq: 370, duration: 0.06, gain: 0.06, attack: 0.002 },
      { type: 'noise', filter: 'bandpass', cutoff: 900, endCutoff: 2600, q: 1.5, duration: 0.18, gain: 0.11, attack: 0.055, delay: 0.02 },
    ],
    // Kanone: dumpfer Knall mit Rauschen
    cannon: [
      { type: 'osc', wave: 'sine', freq: 140, endFreq: 42, duration: 0.3, gain: 0.4 },
      { type: 'noise', filter: 'lowpass', cutoff: 700, q: 0.7, duration: 0.22, gain: 0.28 },
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
      'shot:arrow':     { files: ['arrow-1', 'arrow-2', 'arrow-3'], gain: 0.3, pitchVar: 0.08 },
      'shot:cannon':    { files: ['cannon-1', 'cannon-2', 'cannon-3'], gain: 0.4, pitchVar: 0.06 },
      'shot:frost':     { files: ['frost-1', 'frost-2', 'frost-3'], gain: 0.2, pitchVar: 0.06 },
      'shot:sniper':    { files: ['sniper-1', 'sniper-2', 'sniper-3'], gain: 0.3, pitchVar: 0.06 },
      'shot:lightning': { files: ['lightning-1', 'lightning-2', 'lightning-3'], gain: 0.18, pitchVar: 0.06 },
      death:            { files: ['death-1', 'death-2', 'death-3', 'death-4'], gain: 0.7, pitchVar: 0.15 },
      boss:             { files: ['boss-1', 'boss-2'], gain: 1.2, pitchVar: 0.03 },
      lifeLost:         { files: ['life-lost-1', 'life-lost-2'], gain: 0.8, pitchVar: 0 },
      meteorFlight:     { files: ['meteor-flight-1', 'meteor-flight-2'], gain: 0.7, pitchVar: 0.05 },
      meteorImpact:     { files: ['meteor-impact-1', 'meteor-impact-2'], gain: 1.4, pitchVar: 0.04 },
    },
  },
};
