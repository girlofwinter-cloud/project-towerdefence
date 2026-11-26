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
// (z. B. Palette von Wald oder Zangenangriff); bei true/fehlend gilt der Basisblock der Wiese unverändert.
export function themed(mapId, key, base) {
  const v = MAPS[mapId]?.theme?.[key];
  return v && typeof v === 'object' ? { ...base, ...v } : base;
}

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
    // B-071: Wegpalette der Wiese (STIL.md); Eis nutzt vorerst PATH_STYLE.colors; Wald und Zangenangriff haben eigene Wegfarben (B-072).
    theme: { treeFrame: true, ground: true, accents: true, light: true, islands: true, decorStyle: 'flatpop', path: { main: '#e2c88f', edge: '#8f6a3b', outline: '#4a3418', mid: '#ecd5a0', fringe: '#6fbf4e' } },
  },
  forest: {
    name: 'Wald',
    waypoints: [
      [-1, 6],
      [3, 6],
      [3, 2],
      [8, 2],
      [8, 10],
      [12, 10],
      [12, 5],
      [16, 5],
      [16, 11],
      [20, 11],
    ],
    // Bäume und Felsen [spalte, zeile]: blockieren das Bauen, nicht den Weg.
    obstacles: [
      [1, 0], [2, 1], [2, 3], [2, 4], [2, 9], [4, 3], [4, 6], [4, 8], [6, 9], [7, 0],
      [7, 4], [7, 5], [7, 6], [7, 8], [9, 1], [9, 2], [9, 4], [10, 6], [10, 7], [11, 4],
      [11, 6], [13, 4], [13, 6], [13, 10], [13, 11], [13, 12], [14, 4], [14, 6], [15, 3], [15, 8],
      [15, 9], [16, 3], [17, 3], [17, 5], [18, 5], [18, 9], [18, 12], [19, 7], [19, 12],
    ],
    // B-046: schnellere Gegner im Dickicht. ACHTUNG: gemessen und nur in einem schmalen Bereich stabil
    // (enemySpeed 1,19 trägt zwischen etwa 1,17 und 1,20), nicht ahnungslos ändern; Strategie-Tests prüfen das.
    modifiers: { enemySpeed: 1.19 },
    // B-072: Wald im Flat-Pop-Stil (STIL.md): dichter dunkler Tannenrahmen, Moos-Weg, Pilze und Moos als Streu-Deko.
    theme: {
      treeFrame: {
        rows: [
          { radius: [15, 19], depth: [0, 0.3], spacing: 24, shade: 0.4 },
          { radius: [16, 20], depth: [0.4, 0.7], spacing: 28, shade: 0.22 },
          { radius: [17, 21], depth: [0.75, 1], spacing: 34, shade: 0.06 },
        ],
        spacingJitter: 6,
        kindShare: [0.2, 0, 0, 0.8], // Laubbaum, Apfel, Blüte, Tanne: überwiegend Tannen
        greens: ['#2f8a3c', '#2a7a3a', '#3a9442', '#2c7438'],
        fir: ['#2a6b3a', '#235c33'],
        firLift: 0.42,               // Tannen nach unten rücken, damit die Spitze nicht tief ins Feld ragt
      },
      ground: {
        base: '#4b9448',
        light: 'rgba(110,186,84,0.16)',
        dark: 'rgba(30,92,48,0.2)',
        blade: ['#2f6e33', '#3a8038', '#8fd14f'],
        plateaus: 6,
        plateauTop: '#438a42',
        plateauWall: 'rgba(30,80,42,0.88)',
        plateauRim: 'rgba(20,55,28,0.4)',
        plateauLight: 'rgba(150,215,100,0.16)',
      },
      light: { tint: '214,236,170', gradientAlpha: 0.05, beamAlpha: 0.03, vignetteAlpha: 0.24, vignetteInner: 0.5, treeShadowAlpha: 0.22 },
      decorStyle: 'flatpop',
      decor: {
        flatTrees: true,
        firShare: 0.8,
        treeColors: ['#2f8a3c', '#2a7a3a', '#3a9442'],
        fir: ['#2a6b3a', '#235c33'],
        bush: '#2d7d3b', berry: '#d9453a', rock: '#8c8f98', moss: '#8fd14f',
        flowers: ['#f4f1e6', '#c9a0e8', '#f6d64a'], stem: '#2f6e33', tuft: '#2f6e33', tuftLight: '#8fd14f',
        mushroomCap: '#d9453a', wood: '#a9763f', woodDark: '#6e4d2a',
        scatterChance: 0.12,
        scatterKinds: [['mushroom', 0.26], ['mushrooms', 0.18], ['moss', 0.2], ['stump', 0.12], ['log', 0.14], ['pebbles', 0.1]],
      },
      path: { main: '#c9a56a', edge: '#6e4d2a', outline: '#3b2813', mid: '#d4b277', fringe: '#8fd14f' },
    },
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
    // (dunkler als der Schnee), Eiskristalle und Eisfelsen als Streu-Deko, kühles Licht. Keine Hindernisse.
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
  fork: {
    name: 'Zangenangriff',
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
    // B-046: etwas schnellere Gegner, schwächere Kanone und Pfeile. ACHTUNG: die Werte sind kombiniert gemessen
    // und nur in einem schmalen Bereich stabil (wie bei forest), nicht ahnungslos ändern.
    modifiers: { enemySpeed: 1.03, towerDamage: { cannon: 0.92, arrow: 0.97 } },
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
  meteor: { name: 'Meteor', short: 'Meteor', key: 'q', cooldown: 50, radius: 1.8, damage: 150 },
  freeze: { name: 'Kälteschock', short: 'Kälte', key: 'w', cooldown: 60, slow: 0.7, duration: 4 },
  repair: { name: 'Notfall-Reparatur', short: 'Reparatur', key: 'e', cooldown: 120, maxUses: 2, heal: 1 },
};
ABILITIES.meteor.text = `Flächenschaden (${ABILITIES.meteor.damage}) im Umkreis von ${num(ABILITIES.meteor.radius)} Kacheln, Abklingzeit ${ABILITIES.meteor.cooldown} s.`;
ABILITIES.freeze.text = `Alle Gegner ${pct(ABILITIES.freeze.slow)} langsamer für ${ABILITIES.freeze.duration} s, Abklingzeit ${ABILITIES.freeze.cooldown} s.`;
ABILITIES.repair.text = `+${ABILITIES.repair.heal} Leben, höchstens ${ABILITIES.repair.maxUses}× pro Spiel, Abklingzeit ${ABILITIES.repair.cooldown} s.`;

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
  sizes: { hud: 22, heart: 16, inline: 16, button: 20, ability: 26 }, // Anzeigegröße in CSS-px
  colors: {
    heartEmpty: '#5b4a5e', flag: '#d4503f', meteorRock: '#7a6a64', meteorCrater: '#55474a', flame: '#ff7a1f', flameCore: '#ffc23a',
    glass: '#bff0ff', glassShine: '#ffffff', pause: '#fff3c9', play: '#7fd24a', paper: '#e2c88f', mapMark: '#d4503f',
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
  // B-072 (Wald, Zangenangriff): Bäume, Hindernisse und Laubhaufen im Flat-Pop-Stil; die Wiese nutzt davon nichts.
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
};

// Projektile und Effekte im Flat-Pop-Stil (B-068, nur Darstellung). Maße in px bei 1x, Zeiten in Sekunden Spielzeit.
// Konturen werden aus der Eigenfarbe abgeleitet (outlineOf). Bei prefers-reduced-motion: kein Hopsen, kein Drehen.
export const FX_STYLE = {
  arrow: { shaft: '#c58f55', head: '#b3adaa', fletch: '#d4503f', length: 12, headLen: 4.5, headHalf: 2.6, fletchLen: 3.5, fletchHalf: 2.2, shaftWidth: 1.6 },
  trail: { color: '#fff3c9', points: 4, spacing: 4, size: 1.6, alpha: 0.6 }, // Schweif aus 3 bis 5 Punkten
  cannon: { color: '#4a3f55', radius: 4.5, shine: '#fff3c9', shineR: 1.4 },
  frost: { color: '#7fd8f4', light: '#bff0ff', len: 5.5, half: 2.8, glowColor: '#bff0ff', glowR: 5.5, glowAlpha: 0.25 },
  sniper: { beam: '#efe2ff', core: '#ffffff', bullet: '#e6d1ff', beamLen: 38, beamAlpha: 0.4, bulletR: 2.2 },
  bolt: { outer: '#4f7fc8', outerWidth: 4.5, outerAlpha: 0.55, mid: '#f4c542', midWidth: 2.4, core: '#fff3c9', coreWidth: 1 },
  explosion: { fill: '#ff9a3c', fillAlpha: 0.3, ring: '#f4c542', ringWidth: 3, grow: 0.5 }, // unter den Gegnern
  hit: { flash: '#fff3c9', flashSize: 4, flashAlpha: 0.8, spark: '#f4c542', sparkWidth: 1.5, ice: '#bff0ff', iceSize: 1.6 },
  smoke: { color: '#9a8fa6', alpha: 0.45, grow: 0.6 }, // unter den Gegnern
  coin: { color: '#f4c542', dark: '#b07a14', shine: '#fff3c9', hop: 12, bounce: 0.3, split: 0.55, end: 0.85, spins: 1.5, minWidth: 0.3, fadeFrom: 0.6, drift: 20 },
  coinText: { color: '#f4c542', outline: '#3b2415', outlineWidth: 3, rise: 10, font: 'bold 13px system-ui, sans-serif' },
};
