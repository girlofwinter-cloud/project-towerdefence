// Reine Dekorations-Logik (kein DOM, kein Canvas -> in Node testbar).
// Regel: Alle Nicht-Weg-Kacheln im Spielfeld sind bebaubar (siehe canBuild in game.js).
// Darum gilt:
//  - Auf Weg-Kacheln liegt nie Dekoration.
//  - Grosse Dekoration (Baum, Busch, Fels) nur auf Randkacheln des Spielfelds.
//  - Im Inneren nur kleine Dekoration (Blumen, Grasbuschel, Kiesel), die flach bleibt.
//  - Die Dekoration wird in den Hintergrund gezeichnet; gebaute Tuerme liegen darueber.
import { COLS, ROWS, TILE, WIDTH, HEIGHT, OBSTACLE_TREE_SHARE, MAPS, TREE_FRAME, GROUND_STYLE, DECOR_STYLE } from './config.js';
import { buildPath } from './path.js';

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
  return tileRand(col, row, 6) < OBSTACLE_TREE_SHARE ? 'tree' : 'rock';
}

// Kleinster Abstand eines Punkts zu den Wegsegmenten einer Karte (px).
function distToWaypoints(points, x, y) {
  let m = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    m = Math.min(m, Math.hypot(x - a.x - t * dx, y - a.y - t * dy));
  }
  return m;
}

// Baumrahmen (B-077): Kronen im Randring, deterministisch (tileRand, kein Math.random).
// Rueckgabe: [{ x, y, r, row, shade, kind: 'leaf'|'apple'|'blossom'|'fir', seed }], hintere Reihe zuerst, darin kleines y zuerst.
// Keine Krone beruehrt den Weg (Abstand >= r + pathMargin); sie ragt hoechstens maxOverhang ins Feld.
// Spiellogik bleibt unberuehrt: jede Nicht-Weg-Kachel ist weiter bebaubar.
export function treeFrame(mapId = 'meadow') {
  const T = TREE_FRAME;
  const points = buildPath(MAPS[mapId].waypoints, TILE).points;
  const out = [];
  // Seiten: Start, Richtung entlang des Rands, Richtung nach innen
  const sides = [
    { x: 0, y: 0, ax: 1, ay: 0, nx: 0, ny: 1, len: WIDTH },
    { x: WIDTH, y: 0, ax: 0, ay: 1, nx: -1, ny: 0, len: HEIGHT },
    { x: WIDTH, y: HEIGHT, ax: -1, ay: 0, nx: 0, ny: -1, len: WIDTH },
    { x: 0, y: HEIGHT, ax: 0, ay: -1, nx: 1, ny: 0, len: HEIGHT },
  ];
  T.rows.forEach((row, ri) => sides.forEach((sd, rs) => {
    const si = ri * 4 + rs; // eigener Hash-Strom je Reihe und Seite
    let t = 4 + tileRand(si, 0, 40) * row.spacing * 0.5;
    for (let i = 1; t < sd.len; i++) {
      const r = row.radius[0] + tileRand(si, i, 41) * (row.radius[1] - row.radius[0]);
      // Mitte so weit innen, dass der Kronenrand hoechstens maxOverhang ins Feld ragt
      const f = row.depth[0] + tileRand(si, i, 42) * (row.depth[1] - row.depth[0]);
      const depth = Math.max(0, T.maxOverhang - r) * f;
      const x = sd.x + sd.ax * t + sd.nx * depth;
      const y = sd.y + sd.ay * t + sd.ny * depth;
      if (distToWaypoints(points, x, y) >= r + T.pathMargin) {
        const q = tileRand(si, i, 43);
        let acc = 0, k = 0;
        while (k < T.kindShare.length - 1 && q >= (acc += T.kindShare[k])) k++;
        out.push({ x, y, r, row: ri, shade: row.shade, kind: ['leaf', 'apple', 'blossom', 'fir'][k], seed: tileHash(si, i, 44) });
      }
      t += row.spacing + tileRand(si, i, 45) * T.spacingJitter;
    }
  }));
  return out.sort((a, b) => a.row - b.row || a.y - b.y || a.x - b.x);
}

// Liegt ein Punkt im Bereich einer Krone des Rahmens? Dann entfaellt dort der alte Einzelbaum (kein Doppel).
export function coveredByCrown(crowns, x, y) {
  return crowns.some((c) => Math.hypot(c.x - x, c.y - y) < c.r + TREE_FRAME.coverMargin);
}

// Fleckenform (B-078): Phase und Radiusfaktoren je Stuetzpunkt, deterministisch aus seed.
export function blobShape(seed, n) {
  return { phase: tileRand(seed, 0, 50) * Math.PI * 2, ks: Array.from({ length: n }, (_, i) => 0.76 + tileRand(seed, i + 1, 51) * 0.42) };
}

// Stuetzpunkte der Form (Mitte, Radien, Stuetzpunkte); dieselbe Formel nutzt render-ground.js.
export function blobPoints(cx, cy, rx, ry, seed, n) {
  const { phase, ks } = blobShape(seed, n);
  return ks.map((k, i) => { const a = phase + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
}

// Boden der Wiese (B-078): Flecken, Plateaus (nur Optik) und Grasbueschel, rein deterministisch.
// Plateaus liegen nie auf dem Weg: Kante samt Wand haelt Abstand zur Wegachse. Alle Nicht-Weg-Kacheln bleiben bebaubar.
// Karten ohne theme.ground liefern leere Listen (dort bleibt das Schachbrett).
export function groundPatches(mapId = 'meadow') {
  const G = GROUND_STYLE;
  const out = { patches: [], plateaus: [], tufts: [] };
  if (!MAPS[mapId]?.theme?.ground) return out;
  const points = buildPath(MAPS[mapId].waypoints, TILE).points;
  const lerp = (r, u) => r[0] + u * (r[1] - r[0]);
  const total = G.lightPatches + G.darkPatches;
  for (let i = 0; i < total; i++) {
    out.patches.push({ x: tileRand(i, 0, 60) * WIDTH, y: tileRand(i, 0, 61) * HEIGHT, rx: lerp(G.patchRadiusX, tileRand(i, 0, 62)), ry: lerp(G.patchRadiusY, tileRand(i, 0, 63)), tone: i < G.lightPatches ? 'light' : 'dark', seed: tileHash(i, 0, 64) });
  }
  for (let t = 0; t < G.plateauTries && out.plateaus.length < G.plateaus; t++) {
    const x = lerp([G.plateauInset[0], WIDTH - G.plateauInset[0]], tileRand(t, 0, 70));
    const y = lerp([G.plateauInset[1], HEIGHT - G.plateauInset[1]], tileRand(t, 0, 71));
    const rx = lerp(G.plateauRadiusX, tileRand(t, 0, 72)), ry = lerp(G.plateauRadiusY, tileRand(t, 0, 73));
    const seed = tileHash(t, 0, 74);
    if (distToWaypoints(points, x, y) < G.plateauCenterMargin) continue;
    const edge = blobPoints(x, y, rx, ry, seed, G.plateauPoints).map((p) => [p[0] + (p[0] - x) * 0.3, p[1] + (p[1] - y) * 0.3 + G.plateauDrop]);
    if (edge.some((p) => distToWaypoints(points, p[0], p[1]) < G.plateauEdgeMargin)) continue;
    out.plateaus.push({ x, y, rx, ry, seed });
  }
  for (let i = 0; i < G.tufts; i++) {
    const x = 4 + tileRand(i, 0, 80) * (WIDTH - 8), y = 6 + tileRand(i, 0, 81) * (HEIGHT - 8);
    if (distToWaypoints(points, x, y) < G.tuftPathMargin) continue;
    out.tufts.push({ x, y, s: lerp(G.tuftScale, tileRand(i, 0, 82)), dark: i % 3 === 0, seed: tileHash(i, 0, 83) });
  }
  return out;
}

// Streu-Deko (B-079): flache Einzelstuecke auf freien Kacheln (nicht Weg, Hindernis, Tor/Ziel, ohne anderes Dekor).
// Nur auf Karten mit theme.decorStyle 'flatpop'. Rueckgabe: null oder { kind, ox, oy, angle (rad) }.
// Alle Kacheln bleiben bebaubar; Tuerme verdecken die Deko (sie liegt im Hintergrund-Cache).
export function scatterFor(col, row, blocked, obstacles, mapId = 'meadow') {
  const map = MAPS[mapId];
  if (map?.theme?.decorStyle !== 'flatpop') return null;
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return null;
  if (isPathTile(blocked, col, row)) return null;
  if (obstacles && obstacles.has(`${col},${row}`)) return null;
  if (decorFor(col, row, blocked, obstacles)) return null;
  const D = DECOR_STYLE;
  const wp = map.waypoints;
  for (const [wc, wr] of [wp[0], wp[wp.length - 1]]) {
    const ec = Math.min(Math.max(wc, 0), COLS - 1), er = Math.min(Math.max(wr, 0), ROWS - 1);
    if (Math.max(Math.abs(col - ec), Math.abs(row - er)) <= D.scatterEndMargin) return null;
  }
  if (tileRand(col, row, 90) >= D.scatterChance) return null;
  const q = tileRand(col, row, 91);
  let acc = 0, kind = D.scatterKinds[D.scatterKinds.length - 1][0];
  for (const [k, share] of D.scatterKinds) if (q < (acc += share)) { kind = k; break; }
  const [lo, hi] = D.scatterOffset;
  return { kind, ox: lo + tileRand(col, row, 92) * (hi - lo), oy: lo + tileRand(col, row, 93) * (hi - lo), angle: (tileRand(col, row, 94) - 0.5) * 0.6 };
}
