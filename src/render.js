// Zeichnet den Spielzustand auf ein Canvas. Keine Spiel-Logik hier!
import { TILE, COLS, ROWS, WIDTH, HEIGHT, TOWER_TYPES, MAPS, ABILITIES, RANGE_STYLE, TREE_FRAME, GROUND_STYLE, LIGHT_STYLE, DECOR_STYLE, themed } from './config.js';
import { towerStats, enemyPath } from './game.js';
import { disc } from './draw-utils.js';
import { drawPathStyled } from './render-path.js';
import { TOWER_DRAWERS } from './render-towers.js';
import { recoilOffset } from './tower-fx.js';
import { drawEnemy, drawHealAura } from './render-enemies.js';
import { updateFx, shakeX, shakeY, drawProjectileFx, drawParticles, drawBossEntry, drawEffectUnder, drawEffectOver } from './render-fx.js';
import { drawTreeFrame } from './render-trees.js';
import * as flat from './render-decor.js';
import { drawIsland } from './render-island.js';
import { drawAccents } from './render-accents.js';
import { drawTreeShadows, drawLight } from './render-light.js';
import { drawGround as drawGroundFill, drawGroundTufts } from './render-ground.js';
import { tileHash, tileRand, decorFor, obstacleKind, treeFrame, groundPatches, accentsFor, coveredByCrown, scatterFor, LARGE_DECOR_RADIUS } from './decor.js';

export function render(ctx, state, ui) {
  const reduced = !!(ui && ui.reducedMotion);
  // Partikel aus dem Zustand ableiten (nur lesen), danach Shake-Versatz bestimmen.
  updateFx(state, reduced);
  const sx = shakeX();
  const sy = shakeY();
  const shaking = sx !== 0 || sy !== 0;
  drawGround(ctx, state); // unverschoben, damit am Rand nichts durchscheint
  if (shaking) {
    ctx.save();
    // Screen-Shake: verschiebt nur die Zeichnung der Welt (Hover-Rahmen und Reichweite werden
    // mitverschoben, bleiben relativ zu den Tuermen also korrekt). Mausziel/Eingabe in main.js
    // rechnet mit Canvas-Koordinaten und ist davon unabhaengig.
    ctx.translate(sx, sy);
    drawGround(ctx, state);
  }
  drawHover(ctx, state, ui);
  // Wiese (theme.islands): Inseln aller Türme zuerst, damit sie keinen Nachbarturm überdecken
  if (MAPS[state.mapId]?.theme?.islands) for (const t of state.towers) drawIsland(ctx, t.x, t.y);
  for (const t of state.towers) drawTower(ctx, t, ui.selectedTowerId === t.id);
  for (const e of state.enemies) drawHealAura(ctx, e, state.time);
  drawBossEntry(ctx);
  // Explosionen und Rauch unter den Gegnern, damit sie keine Figur verdecken (B-068)
  for (const fx of state.effects) drawEffectUnder(ctx, fx);
  drawParticles(ctx, true);
  for (const e of state.enemies) drawEnemy(ctx, e, state.time, enemyPath(state, e));
  for (const p of state.projectiles) drawProjectile(ctx, p);
  drawParticles(ctx);
  for (const fx of state.effects) drawEffectOver(ctx, fx, reduced);
  if (shaking) ctx.restore();
}

// ---------- Hintergrund (Gelaende, Weg, Dekoration) ----------
// Rein visuelle Konstanten (Balancing-Zahlen stehen in config.js).
const GRASS_COLORS = ['#4d9c41', '#51a145']; // Schachbrett-Grundton
const GRASS_SHIFT = 0.07; // max. Helligkeitsversatz pro Kachel (Deckkraft)
const GRASS_BLADE = '#37802f';
const GATE_WOOD = '#5b3a1e';
const GATE_WOOD_LIGHT = '#7a5230';
const EXIT_STONE = '#6b6f78';
const EXIT_DARK = '#1c1a20';

// Cache: ein Offscreen-Canvas, wird nur bei geaendertem Weg neu gezeichnet.
let bgCanvas = null;
let bgKey = null;

function makeCanvas() {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = WIDTH;
    c.height = HEIGHT;
    return c;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(WIDTH, HEIGHT);
  return null;
}

function drawGround(ctx, state) {
  // Schluessel = Referenz auf den Weg (neuer Weg -> neue Punkte-Liste)
  if (!bgCanvas || bgKey !== state.path.points) {
    bgCanvas = bgCanvas || makeCanvas();
    if (!bgCanvas) return paintBackground(ctx, state);
    paintBackground(bgCanvas.getContext('2d'), state);
    bgKey = state.path.points;
  }
  ctx.drawImage(bgCanvas, 0, 0);
}

function paintBackground(ctx, state) {
  ctx.save();
  // Wiese (theme.ground): Flecken und Plateaus statt Schachbrett; Büschel nach dem Weg (nie auf Wegkacheln)
  // Eiswelt, Zangenangriff und Zwei Fronten (B-072, B-073, B-099) überschreiben Paletten über themed(); die Wiese nutzt die Basisblöcke
  const id = state.mapId;
  const groundStyle = themed(id, 'ground', GROUND_STYLE);
  const lightStyle = themed(id, 'light', LIGHT_STYLE);
  const ground = MAPS[id]?.theme?.ground ? groundPatches(id) : null;
  flat.useDecorStyle(themed(id, 'decor', DECOR_STYLE));
  if (ground) drawGroundFill(ctx, ground, groundStyle);
  else drawGrass(ctx, MAPS[id]?.theme);
  drawPath(ctx, state);
  if (ground) drawGroundTufts(ctx, ground, groundStyle);
  const crowns = MAPS[id]?.theme?.treeFrame ? treeFrame(id) : null;
  drawDecor(ctx, state, crowns);
  const light = MAPS[id]?.theme?.light;
  if (crowns && light) drawTreeShadows(ctx, crowns, lightStyle); // vor den Kronen
  if (crowns) drawTreeFrame(ctx, crowns, themed(id, 'treeFrame', TREE_FRAME));
  if (MAPS[state.mapId]?.theme?.accents) drawAccents(ctx, accentsFor(state.mapId));
  if (light) drawLight(ctx, lightStyle); // Licht und Vignette vor den Toren, damit Start/Ziel lesbar bleiben
  for (const path of state.paths || [state.path]) {
    const pts = path.points;
    drawGate(ctx, pts[0], pts[1]);
    drawExit(ctx, pts[pts.length - 1], pts[pts.length - 2]);
  }
  ctx.restore();
}

function drawGrass(ctx, theme) {
  const colors = theme?.grass || GRASS_COLORS;
  const blade = theme?.blade || GRASS_BLADE;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = colors[(r + c) % 2];
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      // kleiner Helligkeitsversatz je Kachel, das Schachbrett bleibt erkennbar
      const shift = (tileHash(c, r, 10) / 4294967296 - 0.5) * 2 * GRASS_SHIFT;
      ctx.fillStyle = shift >= 0 ? `rgba(255,255,255,${shift})` : `rgba(0,0,0,${-shift})`;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      // ein paar dunkle Halme
      ctx.strokeStyle = blade;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const x = c * TILE + 4 + tileRand(c, r, 20 + i) * (TILE - 8);
        const y = r * TILE + 6 + tileRand(c, r, 30 + i) * (TILE - 10);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 1.5, y - 4);
        ctx.stroke();
      }
    }
  }
}

function drawPath(ctx, state) {
  drawPathStyled(ctx, state.paths || [state.path], MAPS[state.mapId]?.theme);
}

// Dekoration: Regeln stehen in decor.js (gross nur am Rand, innen nur klein, nie auf dem Weg).
// crowns: Der Baumrahmen ersetzt die einzelnen Rand-Baeume, soweit eine Krone sie verdeckt (kein Doppel).
function drawDecor(ctx, state, crowns) {
  const flatpop = MAPS[state.mapId]?.theme?.decorStyle === 'flatpop'; // B-079: neue Deko (alle Karten)
  const style = themed(state.mapId, 'decor', DECOR_STYLE);
  const flatTrees = flatpop && style.flatTrees; // B-072: Bäume und Hindernisse im neuen Stil
  const firShare = style.firShare;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (state.obstacles && state.obstacles.has(`${c},${r}`)) {
        if (flatTrees) flat.drawObstacleFlat(ctx, c, r, obstacleKind(c, r), tileRand(c, r, 8) < firShare, Math.floor(tileRand(c, r, 3) * 3));
        else drawObstacle(ctx, c, r);
        continue;
      }
      const d = decorFor(c, r, state.blocked, state.obstacles);
      if (!d) {
        const sc = flatpop && scatterFor(c, r, state.blocked, state.obstacles, state.mapId);
        if (sc) flat.drawScatter(ctx, sc, c * TILE + sc.ox * TILE, r * TILE + sc.oy * TILE);
        continue;
      }
      const x = c * TILE + d.ox * TILE;
      const y = r * TILE + d.oy * TILE;
      if (crowns && d.kind === 'tree' && coveredByCrown(crowns, x, y)) continue;
      if (flatTrees && d.kind === 'tree') {
        flat.drawTree(ctx, x, y, d.variant, tileRand(c, r, 8) < firShare, 0.9);
        continue;
      }
      if (flatpop && d.kind !== 'tree') {
        if (d.kind === 'bush') flat.drawBush(ctx, x, y, d.variant);
        else if (d.kind === 'rock') flat.drawRock(ctx, x, y, d.variant);
        else if (d.kind === 'flower') flat.drawFlower(ctx, x, y, d.variant);
        else if (d.kind === 'tuft') flat.drawTuft(ctx, x, y);
        else flat.drawPebble(ctx, x, y);
        continue;
      }
      if (d.kind === 'tree') drawTree(ctx, x, y, d.variant);
      else if (d.kind === 'bush') drawBush(ctx, x, y, d.variant);
      else if (d.kind === 'rock') drawRock(ctx, x, y, d.variant);
      else if (d.kind === 'flower') drawFlower(ctx, x, y, d.variant);
      else if (d.kind === 'tuft') drawTuft(ctx, x, y);
      else drawPebble(ctx, x, y);
    }
  }
}

const OBSTACLE_SHADE = 'rgba(10,40,15,0.35)';

// Hindernis-Kachel: dunkler Grund, darauf Baum (dichter, zwei Kronen) oder Fels.
function drawObstacle(ctx, c, r) {
  const x0 = c * TILE;
  const y0 = r * TILE;
  ctx.fillStyle = OBSTACLE_SHADE;
  ctx.fillRect(x0, y0, TILE, TILE);
  const v = Math.floor(tileRand(c, r, 3) * 3);
  if (obstacleKind(c, r) === 'rock') {
    drawRock(ctx, x0 + TILE / 2, y0 + TILE / 2, v);
  } else {
    drawTree(ctx, x0 + TILE * 0.35, y0 + TILE * 0.6, v);
    drawTree(ctx, x0 + TILE * 0.65, y0 + TILE * 0.4, 2 - v);
  }
}

function drawTree(ctx, x, y, v) {
  const size = LARGE_DECOR_RADIUS.tree - 3 - (2 - v); // 6..8, plus Schatten (+1,+2) <= Radius
  disc(ctx, 'rgba(0,0,0,0.2)', x + 1, y + 2, size); // Schatten
  disc(ctx, '#245a2a', x, y, size);
  disc(ctx, '#2f7a36', x - 2, y - 2, size * 0.7);
  disc(ctx, '#4a9c4e', x - 4, y - 4, size * 0.3);
}

function drawBush(ctx, x, y, v) {
  // Breite 4+6 = 10 (= Radius), Oberkante 3+6+1 = 10
  disc(ctx, '#2c6e33', x - 4, y + 1, 6);
  disc(ctx, '#2c6e33', x + 4, y + 1, 6);
  disc(ctx, '#38853e', x, y - 3, 6 + v * 0.5);
}

function drawRock(ctx, x, y, v) {
  ctx.fillStyle = '#7d8088';
  ctx.beginPath();
  ctx.ellipse(x, y, 8 + v, 6 + v * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a3a6ad';
  ctx.beginPath();
  ctx.ellipse(x - 2, y - 2, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(ctx, x, y, v) {
  const petals = ['#f4f1e6', '#f2c14e', '#e88aa8'][v];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    disc(ctx, petals, x + Math.cos(a) * 2.5, y + Math.sin(a) * 2.5, 1.8);
  }
  disc(ctx, '#d98a1f', x, y, 1.5);
}

function drawTuft(ctx, x, y) {
  ctx.strokeStyle = '#5da654';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 2, y + 3);
    ctx.lineTo(x + i * 4, y - 4);
    ctx.stroke();
  }
}

function drawPebble(ctx, x, y) {
  ctx.fillStyle = '#9a9ca2';
  ctx.beginPath();
  ctx.ellipse(x, y, 3.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Zeichnet in lokalen Koordinaten: Ursprung an der Feldkante, +x zeigt ins Feld.
function atEdge(ctx, outer, inner, fn) {
  const dx = inner.x - outer.x;
  const dy = inner.y - outer.y;
  // Kantenpunkt: Wegpunkt auf die Spielfeldgrenze geklemmt
  const ex = Math.min(Math.max(outer.x, 0), WIDTH);
  const ey = Math.min(Math.max(outer.y, 0), HEIGHT);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(Math.atan2(dy, dx));
  fn();
  ctx.restore();
}

// Eingang: Holztor mit zwei Pfosten und Balken.
function drawGate(ctx, start, next) {
  atEdge(ctx, start, next, () => {
    const h = TILE / 2;
    for (const s of [-1, 1]) {
      ctx.fillStyle = GATE_WOOD;
      ctx.fillRect(-4, s * (h + 1) - 5, 14, 10);
      ctx.fillStyle = GATE_WOOD_LIGHT;
      ctx.fillRect(-4, s * (h + 1) - 5, 14, 3);
    }
    // Querbalken ueber dem Weg
    ctx.fillStyle = GATE_WOOD;
    ctx.fillRect(2, -h, 5, TILE);
    ctx.fillStyle = GATE_WOOD_LIGHT;
    ctx.fillRect(2, -h, 2, TILE);
  });
}

// Ausgang: kleine Burg (Steintor mit dunklem Eingang und Zinnen).
function drawExit(ctx, end, prev) {
  atEdge(ctx, end, prev, () => {
    // +x zeigt hier ins Feld hinein (von der Kante weg)
    const h = TILE / 2;
    ctx.fillStyle = EXIT_STONE;
    ctx.fillRect(-2, -h - 6, 16, TILE + 12);
    ctx.fillStyle = EXIT_DARK;
    ctx.fillRect(4, -10, 10, 20);
    ctx.fillStyle = EXIT_STONE;
    for (let i = -2; i <= 2; i++) ctx.fillRect(14, i * 9 - 3, 4, 6); // Zinnen
  });
}

function drawHover(ctx, state, ui) {
  const selected = state.towers.find((t) => t.id === ui.selectedTowerId);
  if (selected) rangeCircle(ctx, selected.x, selected.y, towerStats(selected, state.modifiers).range * TILE, `rgba(255,255,255,${RANGE_STYLE.fillAlpha})`);

  if (ui.aiming && ui.hoverPx) rangeCircle(ctx, ui.hoverPx.x, ui.hoverPx.y, ABILITIES.meteor.radius * TILE, 'rgba(255,90,40,0.25)');
  if (!ui.hover || !ui.buildType) return;
  const { col, row, ok } = ui.hover;
  const x = (col + 0.5) * TILE;
  const y = (row + 0.5) * TILE;
  if (MAPS[state.mapId]?.theme?.islands) drawIsland(ctx, x, y, ok ? 'ghost' : 'bad');
  ctx.fillStyle = ok ? 'rgba(255,255,255,0.25)' : 'rgba(255,60,60,0.35)';
  ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
  if (ok) rangeCircle(ctx, x, y, TOWER_TYPES[ui.buildType].range * TILE, `rgba(255,255,255,${RANGE_STYLE.fillAlpha})`);
}

function rangeCircle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = `rgba(255,255,255,${RANGE_STYLE.ringAlpha})`;
  ctx.lineWidth = RANGE_STYLE.ringWidth;
  ctx.stroke();
}

// ---------- Türme ----------
// Zeichenfunktionen je Typ: src/render-towers.js (Maße in TOWER_STYLE, config.js).
const RECOIL_PX = { arrow: 3, cannon: 4, frost: 3, sniper: 3, lightning: 2 }; // maximaler Rückstoß in Pixeln

// Exportiert, damit Tests einen einzelnen Turm gegen einen Mock-Kontext zeichnen koennen.
export function drawTower(ctx, t, selected) {
  const def = TOWER_TYPES[t.type];
  // Rückstoß aus der Abklingzeit (game.js setzt cooldown beim Schuss auf das Intervall)
  const rec = recoilOffset(t.cooldown / def.rate) * RECOIL_PX[t.type];
  TOWER_DRAWERS[t.type](ctx, t.x, t.y, t.level, t.angle, rec, def.color);
  if (selected) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(t.x - 18, t.y - 18, 36, 36);
  }
}

const PROJECTILE_COLORS = { arrow: '#f5e6c8', cannon: '#222', frost: '#bdf0ff', sniper: '#e6d1ff', lightning: '#fff7a8' };

function drawProjectile(ctx, p) {
  if (drawProjectileFx(ctx, p)) return; // Flat-Pop-Projektil je Typ (B-068)
  // Rueckfall: unbekannter Typ oder nicht verfolgt -> einfacher Kreis
  ctx.fillStyle = (Object.hasOwn(PROJECTILE_COLORS, p.towerType) && PROJECTILE_COLORS[p.towerType]) || '#fff';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.towerType === 'cannon' ? 5 : 3, 0, Math.PI * 2);
  ctx.fill();
}

export { WIDTH, HEIGHT };
