// Reine Dekorations-Logik (kein DOM, kein Canvas -> in Node testbar).
// Regel: Alle Nicht-Weg-Kacheln im Spielfeld sind bebaubar (siehe canBuild in game.js).
// Darum gilt:
//  - Auf Weg-Kacheln liegt nie Dekoration.
//  - Grosse Dekoration (Baum, Busch, Fels) nur auf Randkacheln des Spielfelds.
//  - Im Inneren nur kleine Dekoration (Blumen, Grasbuschel, Kiesel), die flach bleibt.
//  - Die Dekoration wird in den Hintergrund gezeichnet; gebaute Tuerme liegen darueber.
import { COLS, ROWS, TILE } from './config.js';

// Dichten (Wahrscheinlichkeit pro Kachel, 0..1)
export const BORDER_DECOR_CHANCE = 0.3;
export const INNER_DECOR_CHANCE = 0.35;

// Deterministischer Kachel-Hash (ganzzahlig, 0..2^32-1). Kein Math.random.
export function tileHash(col, row, salt = 0) {
  let h = (Math.imul(col + 101, 374761393) + Math.imul(row + 53, 668265263) + Math.imul(salt + 7, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return h >>> 0;
}

// Hash als Zahl in [0, 1)
export function tileRand(col, row, salt = 0) {
  return tileHash(col, row, salt) / 4294967296;
}

export function isPathTile(blocked, col, row) {
  return blocked.has(`${col},${row}`);
}

export function isBorderTile(col, row) {
  return col === 0 || row === 0 || col === COLS - 1 || row === ROWS - 1;
}

// Entscheidet, welche Dekoration auf einer Kachel liegt.
// Rueckgabe: null oder { kind, variant, ox, oy } (ox/oy = Versatz 0..1 innerhalb der Kachel).
export function decorFor(col, row, blocked, obstacles) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return null;
  if (isPathTile(blocked, col, row)) return null;
  if (obstacles && obstacles.has(`${col},${row}`)) return null; // dort zeichnet render.js das Hindernis
  const border = isBorderTile(col, row);
  const chance = border ? BORDER_DECOR_CHANCE : INNER_DECOR_CHANCE;
  if (tileRand(col, row, 1) >= chance) return null;
  const pick = tileRand(col, row, 2);
  let kind;
  if (border) kind = pick < 0.5 ? 'tree' : pick < 0.75 ? 'bush' : 'rock';
  else kind = pick < 0.45 ? 'tuft' : pick < 0.8 ? 'flower' : 'pebble';
  // Kleiner Rand je Art, damit grosse Dekoration (inkl. Schatten) in der Kachel bleibt.
  const margin = Math.max(0.2, (LARGE_DECOR_RADIUS[kind] || 0) / TILE);
  const span = 1 - 2 * margin;
  return {
    kind,
    variant: Math.floor(tileRand(col, row, 3) * 3),
    ox: margin + tileRand(col, row, 4) * span,
    oy: margin + tileRand(col, row, 5) * span,
  };
}

export const LARGE_DECOR_KINDS = ['tree', 'bush', 'rock'];

// Maximaler Radius in Pixeln je grosser Art (achsenparallel, inkl. Schatten).
// render.js zeichnet die Formen mit genau diesen Massen.
export const LARGE_DECOR_RADIUS = { tree: 11, bush: 10, rock: 10 };

// Hindernis-Art je Kachel (deterministisch): ueberwiegend Baeume, manchmal Felsen.
export function obstacleKind(col, row) {
  return tileRand(col, row, 6) < 0.7 ? 'tree' : 'rock';
}
