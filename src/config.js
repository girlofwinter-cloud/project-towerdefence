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
  },
  canyon: {
    name: 'Schlucht',
    waypoints: [
      [-1, 11],
      [3, 11],
      [3, 2],
      [8, 2],
      [8, 10],
      [13, 10],
      [13, 4],
      [17, 4],
      [17, 12],
      [20, 12],
    ],
  },
};
export const DEFAULT_MAP_ID = 'meadow';
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
  },
};

// speed in Kacheln/Sekunde, reward = Gold pro Kill, leak = verlorene Leben am Ziel
// Healer: healRadius in Kacheln, healPerSec = Anteil der maxHp des Ziels pro Sekunde,
//   healInterval = Sekunden (Spielzeit) zwischen zwei Heilimpulsen.
// Schildträger: armor = Anteil des Schadens, den Treffer ohne Splash blockiert (0,5 = 50 %).
export const ENEMY_TYPES = {
  grunt: { name: 'Goblin', hp: 40, speed: 1.4, reward: 6, leak: 1, radius: 11, color: '#6fbf4a' },
  runner: { name: 'Flitzer', hp: 25, speed: 2.6, reward: 5, leak: 1, radius: 9, color: '#f2c14e' },
  tank: { name: 'Panzer-Troll', hp: 450, speed: 0.8, reward: 14, leak: 2, radius: 14, color: '#b5523b' },
  boss: { name: 'Oger-König', hp: 850, speed: 0.6, reward: 80, leak: 6, radius: 18, color: '#7a2e8e' },
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
