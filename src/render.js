// Zeichnet den Spielzustand auf ein Canvas. Keine Spiel-Logik hier!
import { TILE, COLS, ROWS, WIDTH, HEIGHT, FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT, TOWER_TYPES, MAPS, MAX_WAVES, PAINTED_STYLE, ABILITIES, RANGE_STYLE, RING_MENU, TREE_FRAME, GROUND_STYLE, LIGHT_STYLE, DECOR_STYLE, PAINT_STYLE, SELECT_RING, NIGHT_STYLE, themed } from './config.js';
import { towerStats, enemyPath } from './game.js';
import { disc, shd } from './draw-utils.js';
import { buildPaintedSvg, buildPaintedScene, rasterizePainted, canRasterize, extentOf } from './render-painted.js';
import { drawPathStyled } from './render-path.js';
import { drawTowerFigure, drawTowerBadge, towerFootY } from './render-towers.js';
import { recoilOffset } from './tower-fx.js';
import { drawEnemy, drawHealAura, enemyFootY, nmEnemyStyle } from './render-enemies.js';
import { drawNecroAura } from './render-necro.js';
import { updateFx, shakeX, shakeY, drawProjectileFx, drawParticles, drawBossEntry, drawEffectUnder, drawEffectOver } from './render-fx.js';
import { drawTreeFrame } from './render-trees.js';
import { beginMasterFx, drawMasterUnder, drawMasterOver, drawMasterTrails, displayLevel } from './render-master.js';
import * as flat from './render-decor.js';
import { drawAccents } from './render-accents.js';
import { drawTreeShadows, drawLight, drawNightTint, drawNightGlow, emberPoints, drawEmbers } from './render-light.js';
import { drawGround as drawGroundFill, drawGroundTufts, drawMottle } from './render-ground.js';
import { waterGeometry, drawWater, drawBridges } from './render-water.js';
import { lavaGeometry, drawLava, drawLavaBridges, lavaGlowSpots, drawLavaGlow } from './render-lava.js';
import { tileHash, tileRand, decorFor, obstacleKind, treeFrame, groundPatches, accentsFor, coveredByCrown, scatterFor, LARGE_DECOR_RADIUS, mottleField, groupedDecor } from './decor.js';

// Stil 1: ganzer Canvas (Feld + Rand). Zeichnet den Rand und verschiebt das Feld um FRAME_MARGIN;
// render() selbst rechnet weiter in Feldkoordinaten (Eingabe: main.js zieht den Rand ab).
export function renderView(ctx, state, ui) {
  if (!paintedFor(state, ctx)) drawFramePlain(ctx, state);
  ctx.save();
  ctx.translate(FRAME_MARGIN, FRAME_MARGIN);
  render(ctx, state, ui);
  drawFlagNumbers(ctx, state);
  ctx.restore();
}

// G5: Fahnen am Eingang je Karte (Box in Entwurfs-px, Feld ab 0,0); main.js macht sie klickbar (Wellenstart)
const flagCache = new Map();
export function flagBoxes(state) {
  if (!MAPS[state.mapId]?.theme?.painted) return [];
  if (!flagCache.has(state.mapId)) flagCache.set(state.mapId, buildPaintedScene(state).flags);
  return flagCache.get(state.mapId);
}
// Zahl der kommenden bzw. laufenden Welle auf der Fahne (Entwurf Z.117: x 50, y 45, 30 px, Kontur 5)
function drawFlagNumbers(ctx, state) {
  if (!paintedFor(state, ctx)) return;
  const n = String(Math.min(state.waveActive ? state.wave : state.wave + 1, MAX_WAVES));
  const k = TILE / PAINTED_STYLE.unit;
  for (const fl of flagBoxes(state)) {
    ctx.save();
    ctx.scale(k, k);
    ctx.translate(fl.tx, fl.ty);
    ctx.scale(fl.s, fl.s);
    ctx.font = `${PAINTED_STYLE.flagNumber}px "Lilita One", sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#2b1a10';
    ctx.fillStyle = '#fff3d2';
    ctx.strokeText(n, 50, 45);
    ctx.fillText(n, 50, 45);
    ctx.restore();
  }
}

// Einfacher dunkler Rahmen in Kartenfarbe (Karten ohne theme.painted und Rückfall, solange das Bild lädt)
function drawFramePlain(ctx, state) {
  ctx.fillStyle = shd(themed(state.mapId, 'ground', GROUND_STYLE).base, 0.7);
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

// ---------- HiDPI: Maßstab der Hintergrund-Caches ----------
// Maßstab Canvas-Einheit -> Geräte-px aus der aktuellen Transformation (main.js setzt sie je Frame), auf 1/100 gerundet.
// Ohne getTransform (Node, Mock) gilt 1. Die Caches werden in genau diesem Maßstab gerastert (scharf bei jeder Pixeldichte).
export function bgScaleOf(ctx) {
  const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
  const s = m ? Math.hypot(m.a, m.b) : 1;
  return Number.isFinite(s) && s > 0 ? Math.min(4, Math.max(0.25, Math.round(s * 100) / 100)) : 1;
}
// Schlüssel eines Hintergrund-Cache: Karte (bzw. Weg) x Maßstab
export function bgCacheKey(id, scale) {
  return `${id}@${scale}`;
}

// ---------- Gemalter Hintergrund (Stil 1, theme.painted) ----------
// Je Karte die Szene einmal bauen und im Browser genau in Geräte-px des Canvas rastern (plus Seitenzonen, C-Abnahme 1);
// bis dahin (und in Node) gilt das alte Zeichnen als Rückfall. Ändert sich die Größe (Fenster, Monitor), wird erst nach
// PAINTED_STYLE.rasterDelay ms Ruhe neu gerastert; bis das neue Bild fertig ist, bleibt das alte (skaliert) sichtbar.
// Nur die aktuelle Karte wird behalten (neuestes Bild); beim Kartenwechsel werden die Raster der anderen freigegeben.
// Gleiche Größe: Ausschnitt 1:1 ohne Skalierung (schnell, scharf).
const paintedCache = new Map(); // mapId -> { status, canvas, key, size, loading, wantKey, wantSince, scene, failedKey }
// Karten im Cache (Tests: nach einem Kartenwechsel nur noch die aktuelle)
export function paintedCacheIds() {
  return [...paintedCache.keys()];
}
// Raster aller anderen Karten freigeben (Canvas auf 0x0, damit der Browser den Speicher sofort abgibt)
function releasePaintedExcept(id) {
  for (const [k, e] of paintedCache) {
    if (k === id) continue;
    if (e.canvas) { e.canvas.width = 0; e.canvas.height = 0; }
    e.loading = null; // laufende Rasterung verwerfen
    paintedCache.delete(k);
  }
}
export function paintedStatus(mapId) {
  return paintedCache.get(mapId)?.status ?? (MAPS[mapId]?.theme?.painted ? 'none' : 'off');
}
// Seitenzonen in Geräte-px je Seite (main.js meldet sie im Vollbild-Layout, sonst 0)
let paintedExt = { l: 0, t: 0, r: 0, b: 0 };
export function setPaintedExtent(ext) {
  const e = extentOf(ext);
  paintedExt = { l: Math.round(e.l), t: Math.round(e.t), r: Math.round(e.r), b: Math.round(e.b) };
}
// Fertiges Bild einer Karte samt Lage des Canvas darin (Geräte-px), für #backdrop in main.js; null solange keins da ist
export function paintedImage(mapId) {
  const e = paintedCache.get(mapId);
  return e?.status === 'ready' ? { canvas: e.canvas, key: e.key, ...e.size } : null;
}
// Größe des Canvas in Geräte-px aus der aktuellen Transformation (1 je Canvas-Einheit ohne getTransform)
export function deviceSizeOf(ctx) {
  const s = bgScaleOf(ctx);
  const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
  const sy = m ? Math.hypot(m.c, m.d) : s;
  return { w: Math.round(VIEW_WIDTH * (m ? Math.hypot(m.a, m.b) : s)), h: Math.round(VIEW_HEIGHT * (Number.isFinite(sy) && sy > 0 ? sy : s)) };
}
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
function paintedFor(state, ctx) {
  const id = state.mapId;
  if (!MAPS[id]?.theme?.painted) return null;
  let e = paintedCache.get(id);
  if (!e) {
    if (!canRasterize()) return null;
    releasePaintedExcept(id);
    e = { status: 'loading', canvas: null, key: null, size: null, loading: null, wantKey: null, wantSince: 0, scene: buildPaintedScene(state), failedKey: null };
    paintedCache.set(id, e);
  }
  const { w, h } = deviceSizeOf(ctx);
  const x = paintedExt;
  const key = `${bgCacheKey(id, `${w}x${h}`)}+${x.l},${x.t},${x.r},${x.b}`;
  // failedKey: diese Größe ist schon einmal gescheitert, nicht jedes Frame neu versuchen (erst wieder bei anderer Größe)
  if (e.status !== 'failed' && e.key !== key && e.loading !== key && e.failedKey !== key) {
    // Entprellen: erst rastern, wenn der Wunsch PAINTED_STYLE.rasterDelay ms besteht (ohne Bild sofort)
    if (e.wantKey !== key) { e.wantKey = key; e.wantSince = now(); }
    if (!e.canvas || now() - e.wantSince >= PAINTED_STYLE.rasterDelay) {
      e.loading = key;
      const size = { w, h, l: x.l, t: x.t, r: x.r, b: x.b };
      const kx = VIEW_WIDTH / w, ky = VIEW_HEIGHT / h; // Geräte-px -> Spiel-px
      const svg = buildPaintedSvg(state, { scene: e.scene, ext: { l: x.l * kx, t: x.t * ky, r: x.r * kx, b: x.b * ky } });
      rasterizePainted(svg, { width: w + x.l + x.r, height: h + x.t + x.b })
        .then((cv) => {
          if (e.loading !== key) return; // inzwischen andere Größe angefordert
          e.loading = null;
          if (cv) { e.canvas = cv; e.key = key; e.size = size; e.status = 'ready'; e.failedKey = null; } else { e.failedKey = key; if (!e.canvas) e.status = 'failed'; }
        })
        .catch(() => { if (e.loading !== key) return; e.loading = null; e.failedKey = key; if (!e.canvas) e.status = 'failed'; });
    }
  }
  return e.status === 'ready' ? e : null;
}
// Bild zeichnen: passt die Größe, Ausschnitt 1:1 auf ganze Geräte-px (ohne Skalierung), sonst skaliert (Übergang)
function drawPainted(ctx, e) {
  const { w, h, l, t } = e.size;
  const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
  const cur = deviceSizeOf(ctx);
  if (m && m.b === 0 && m.c === 0 && cur.w === w && cur.h === h && typeof ctx.setTransform === 'function') {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(e.canvas, l, t, w, h, Math.round(m.e - FRAME_MARGIN * m.a), Math.round(m.f - FRAME_MARGIN * m.d), w, h);
    ctx.restore();
  } else ctx.drawImage(e.canvas, l, t, w, h, -FRAME_MARGIN, -FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT);
}

export function render(ctx, state, ui) {
  const reduced = !!(ui && ui.reducedMotion);
  // Partikel aus dem Zustand ableiten (nur lesen), danach Shake-Versatz bestimmen.
  updateFx(state, reduced);
  const sx = shakeX();
  const sy = shakeY();
  const shaking = sx !== 0 || sy !== 0;
  drawGround(ctx, state, reduced); // unverschoben, damit am Rand nichts durchscheint
  if (shaking) {
    ctx.save();
    // Screen-Shake: verschiebt nur die Zeichnung der Welt (Hover-Rahmen und Reichweite werden
    // mitverschoben, bleiben relativ zu den Tuermen also korrekt). Mausziel/Eingabe in main.js
    // rechnet mit Canvas-Koordinaten und ist davon unabhaengig.
    ctx.translate(sx, sy);
    drawGround(ctx, state, reduced);
  }
  if (nightOn(state, ui)) drawNightLayer(ctx, state, reduced); // B-184: über dem Boden, unter allen Figuren
  drawHover(ctx, state, ui);
  for (const e of state.enemies) drawHealAura(ctx, e, state.time);
  for (const e of state.enemies) drawNecroAura(ctx, e, state.time, reduced); // B-180: Boden-Aura unter allen Figuren
  drawBossEntry(ctx);
  // Explosionen und Rauch unter den Figuren, damit sie keine Figur verdecken (B-068)
  beginMasterFx(state);
  drawMasterUnder(ctx, state, reduced); // B-173/B-174: Eis- und Brandflächen, Gewitter-Ankündigung, Reif
  for (const fx of state.effects) drawEffectUnder(ctx, fx);
  drawParticles(ctx, true);
  // Stil 1: Türme und Gegner nach Fußpunkt sortiert (weiter unten = davor), Stufenmarken danach
  drawFigures(ctx, state, ui);
  for (const t of state.towers) drawTowerBadge(ctx, t, displayLevel(state, t));
  drawMasterTrails(ctx, state, reduced);
  for (const p of state.projectiles) drawProjectile(ctx, p);
  drawParticles(ctx);
  for (const fx of state.effects) drawEffectOver(ctx, fx, reduced);
  drawMasterOver(ctx, state, reduced); // Gewitter, Aufstieg, Treffer-Sterne, Zielstrahl, Marken
  if (shaking) ctx.restore();
}

// ---------- Hintergrund (Gelaende, Weg, Dekoration) ----------
// Nur Rückfall (Node, während des Ladens, bei Rasterfehler): im Browser zeichnet der gemalte Hintergrund (paintedFor).
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
let bgScale = 1;

// B-142: Rausch-Felder des gemalten Bodens, je Karte genau einmal berechnet (neues Spiel auf derselben Karte nutzt sie weiter)
const mottleCache = new Map();
export const paintStats = { builds: 0 }; // Zähler für Tests

function mottleFor(mapId, P) {
  if (!mottleCache.has(mapId)) {
    mottleCache.set(mapId, mottleField(mapId, P));
    paintStats.builds++;
  }
  return mottleCache.get(mapId);
}

function makeCanvas(w, h) {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  return null;
}

// Glühen der Lava über dem gemalten Bild: Flecken je Karte einmal berechnet
const glowCache = new Map();
function glowSpotsFor(state) {
  if (!glowCache.has(state.mapId)) glowCache.set(state.mapId, lavaGlowSpots(lavaGeometry(state.mapId, state.blocked)));
  return glowCache.get(state.mapId);
}

function drawGround(ctx, state, reduced = false) {
  const scale = bgScaleOf(ctx);
  const painted = paintedFor(state, ctx);
  if (painted) {
    drawPainted(ctx, painted); // Bild enthält Feld und Rand (HiDPI: in Geräte-px gerastert)
    if (!reduced && state.lava?.size) drawLavaGlow(ctx, glowSpotsFor(state), (typeof performance !== 'undefined' ? performance.now() : 0) / 1000);
    return;
  }
  // Schluessel = Referenz auf den Weg (neuer Weg -> neue Punkte-Liste) und Maßstab (HiDPI)
  if (!bgCanvas || bgKey !== state.path.points || bgScale !== scale) {
    const w = Math.round(WIDTH * scale), h = Math.round(HEIGHT * scale);
    if (bgCanvas && (bgCanvas.width !== w || bgCanvas.height !== h)) { bgCanvas.width = w; bgCanvas.height = h; }
    bgCanvas = bgCanvas || makeCanvas(w, h);
    if (!bgCanvas) return paintBackground(ctx, state);
    const c = bgCanvas.getContext('2d');
    if (typeof c.setTransform === 'function') c.setTransform(scale, 0, 0, scale, 0, 0);
    paintBackground(c, state);
    bgKey = state.path.points;
    bgScale = scale;
  }
  ctx.drawImage(bgCanvas, 0, 0, WIDTH, HEIGHT);
}

// ---------- B-184: Albtraum-Stimmung (Nacht-Tönung, rotes Licht, Vignette, Glut am Weg) ----------
// An im Albtraum oder mit ui.night (Nacht-Look, B-185 schaltet ihn im Normalmodus als Belohnung ein).
export function nightOn(state, ui) {
  return state?.mode === 'nightmare' || !!ui?.night;
}
// Licht und Vignette (Gradienten) einmal je Maßstab in ein eigenes Canvas; die Tönung (multiply) läuft pro Frame
// direkt auf dem Feld, weil ein Cache-Bild nicht multipliziert. Alles nur im Feld (Clip), Rand und HUD bleiben hell.
let nightCanvas = null;
let nightScale = 0;
const emberCache = new WeakMap(); // Weg -> Glutpunkte
function drawNightLayer(ctx, state, reduced) {
  drawNightTint(ctx, NIGHT_STYLE);
  const scale = bgScaleOf(ctx);
  if (nightScale !== scale) {
    const w = Math.round(WIDTH * scale), h = Math.round(HEIGHT * scale);
    const cv = makeCanvas(w, h);
    if (cv) {
      const c = cv.getContext('2d');
      if (typeof c.setTransform === 'function') c.setTransform(scale, 0, 0, scale, 0, 0);
      drawNightGlow(c, NIGHT_STYLE);
      nightCanvas = cv;
      nightScale = scale;
    }
  }
  if (nightCanvas && nightScale === scale) ctx.drawImage(nightCanvas, 0, 0, WIDTH, HEIGHT);
  else drawNightGlow(ctx, NIGHT_STYLE); // ohne Canvas (Node): direkt
  if (!emberCache.has(state.path)) emberCache.set(state.path, emberPoints(state.path, NIGHT_STYLE, TILE));
  drawEmbers(ctx, emberCache.get(state.path), now() / 1000, NIGHT_STYLE, reduced);
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
  // B-142: gemalte Flecken unter Wasser und Weg, damit der Weg lesbar bleibt
  const paint = MAPS[id]?.theme?.paint ? themed(id, 'paint', PAINT_STYLE) : null;
  if (paint) drawMottle(ctx, mottleFor(id, paint), paint);
  const water = waterGeometry(id, state.blocked); // B-104: Ebenen Boden, Wasser, Weg, Brücke
  drawWater(ctx, water);
  const lava = lavaGeometry(id, state.blocked); // B-030: Lava wie Wasser zwischen Boden und Weg, Steinbrücke darüber
  drawLava(ctx, lava);
  drawPath(ctx, state);
  drawBridges(ctx, water);
  drawLavaBridges(ctx, lava);
  if (ground) drawGroundTufts(ctx, ground, groundStyle);
  const crowns = MAPS[id]?.theme?.treeFrame ? treeFrame(id) : null;
  drawDecor(ctx, state, crowns);
  const light = MAPS[id]?.theme?.light;
  if (crowns && light) drawTreeShadows(ctx, crowns, lightStyle); // vor den Kronen
  if (crowns) drawTreeFrame(ctx, crowns, themed(id, 'treeFrame', TREE_FRAME));
  if (MAPS[state.mapId]?.theme?.accents) drawAccents(ctx, accentsFor(state.mapId));
  // Licht und Vignette vor den Toren, damit Start/Ziel lesbar bleiben; B-142: mit theme.paint kräftiger (Licht oben links, Schatten rechts unten)
  if (light) drawLight(ctx, lightStyle, paint);
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
  const terrain = new Set([...(state.water || []), ...(state.lava || [])]); // B-030: nie Deko auf Wasser oder Lava
  // B-142 Nacharbeit (theme.paint): Büschel und Kiesel nur an Weg/Wasser/Hindernis, Blumen nur in kleinen Inseln
  const grouped = flatpop ? groupedDecor(state.mapId, state.blocked, state.obstacles) : null;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (state.obstacles && state.obstacles.has(`${c},${r}`)) {
        if (flatTrees) flat.drawObstacleFlat(ctx, c, r, obstacleKind(c, r), tileRand(c, r, 8) < firShare, Math.floor(tileRand(c, r, 3) * 3));
        else drawObstacle(ctx, c, r);
        continue;
      }
      const d = decorFor(c, r, state.blocked, state.obstacles, terrain);
      if (!d) {
        const sc = flatpop && scatterFor(c, r, state.blocked, state.obstacles, state.mapId);
        if (sc && !(grouped && sc.kind === 'pebbles' && !grouped.near(c, r))) flat.drawScatter(ctx, sc, c * TILE + sc.ox * TILE, r * TILE + sc.oy * TILE);
        continue;
      }
      if (grouped && d.kind === 'flower' && !grouped.flowers.has(`${c},${r}`)) continue;
      if (grouped && (d.kind === 'tuft' || d.kind === 'pebble') && !grouped.small.has(`${c},${r}`)) continue;
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
  if (grouped) for (const b of grouped.blossoms) flat.drawBlossom(ctx, b.x, b.y, b.v); // Zusatzblüten der Wiesen-Inseln
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

  // C4: Reichweite der nächsten Stufe (Maus/Fokus auf Verbessern im Turm-Ring), gestrichelt
  if (selected && ui.upgradePreview > 0) {
    const P = RING_MENU.upgradePreview;
    ctx.save();
    ctx.setLineDash(P.dash);
    ctx.strokeStyle = P.color;
    ctx.lineWidth = P.width;
    ctx.beginPath();
    ctx.arc(selected.x, selected.y, ui.upgradePreview * TILE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (ui.aiming && ui.hoverPx) rangeCircle(ctx, ui.hoverPx.x, ui.hoverPx.y, ABILITIES.meteor.radius * TILE, 'rgba(255,90,40,0.25)');
  // C4 Bau-Ring: Ringkachel markiert; Maus/Fokus auf einem Knopf zeigt Reichweite und Geistturm dieses Typs
  const ring = ui.ring;
  const ringType = ring && Object.hasOwn(TOWER_TYPES, ui.ringPreview) ? ui.ringPreview : null;
  const type = ringType || ui.buildType;
  const tile = ring ? { col: ring.col, row: ring.row, ok: true } : ui.hover;
  if (!tile || !(type || ring)) return;
  const { col, row, ok } = tile;
  const x = (col + 0.5) * TILE;
  const y = (row + 0.5) * TILE;
  ctx.fillStyle = ok ? 'rgba(255,255,255,0.25)' : 'rgba(255,60,60,0.35)';
  ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
  if (!ok || !Object.hasOwn(TOWER_TYPES, type)) return;
  rangeCircle(ctx, x, y, TOWER_TYPES[type].range * TILE, `rgba(255,255,255,${RANGE_STYLE.fillAlpha})`);
  if (ringType) {
    ctx.save();
    ctx.globalAlpha *= RING_MENU.ghostAlpha;
    drawTowerFigure(ctx, { type: ringType, x, y, level: 1, angle: -Math.PI / 4 }, 0, undefined, false, 1, ui.goldTowers ? GOLD_OPT : null);
    ctx.restore();
  }
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
// Zeichnung je Typ: src/render-towers.js (Formen in src/figures.js, Maße in FIGURE_STYLE, config.js).

// Tiefen-Sortierung ohne Allokation pro Frame: eine Liste wird wiederverwendet
const figures = [];
const GOLD_OPT = { gold: true }; // B-185: goldene Türme (Kosmetik), ein Objekt statt einem je Frame
const footOf = (o) => (o.hp === undefined ? towerFootY(o) : enemyFootY(o));
const byFoot = (a, b) => footOf(a) - footOf(b);
function drawFigures(ctx, state, ui) {
  figures.length = 0;
  for (const t of state.towers) figures.push(t);
  for (const e of state.enemies) figures.push(e);
  figures.sort(byFoot);
  const nm = nmEnemyStyle(state.mapId, nightOn(state, ui)); // B-190: Gegner im Albtraum-Look
  for (const o of figures) {
    if (o.hp === undefined) drawTower(ctx, o, ui.selectedTowerId === o.id, state.time, !!ui.reducedMotion, displayLevel(state, o), ui.goldTowers ? GOLD_OPT : null);
    else drawEnemy(ctx, o, state.time, enemyPath(state, o), !!ui.reducedMotion, !!ui.bossBarShown, nm); // B-180: Leiste im HUD
  }
  figures.length = 0;
}

// Exportiert, damit Tests einen einzelnen Turm gegen einen Mock-Kontext zeichnen koennen (ohne Stufenmarke).
// time/reduced: Ruhe-Animation der Stufe 3; level: angezeigte Stufe (Aufstieg), sonst t.level.
// opts.gold: goldene Türme (B-185, ui.goldTowers aus main.js); reine Optik.
export function drawTower(ctx, t, selected, time, reduced = false, level = t.level, opts = null) {
  const def = TOWER_TYPES[t.type];
  // Rückstoß aus der Abklingzeit (game.js setzt cooldown beim Schuss auf das Intervall)
  if (selected) drawSelectRing(ctx, t);
  drawTowerFigure(ctx, t, def ? recoilOffset(t.cooldown / def.rate) : 0, time, reduced, level, opts);
}

// C-Abnahme 8: Auswahl als Bodenellipse unter dem Turm (Maße und Farben in SELECT_RING, config.js)
export function drawSelectRing(ctx, t) {
  const R = SELECT_RING;
  ctx.beginPath();
  ctx.ellipse(t.x, towerFootY(t), (R.width * TILE) / 2, (R.height * TILE) / 2, 0, 0, Math.PI * 2);
  ctx.lineWidth = R.line + 2 * R.outline;
  ctx.strokeStyle = R.outlineColor;
  ctx.stroke();
  ctx.lineWidth = R.line;
  ctx.strokeStyle = R.color;
  ctx.stroke();
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
