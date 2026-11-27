// C4 Ringmenü: reine Rechen-Teile (kein DOM). main.js liest Maße und setzt die Ergebnisse als CSS-Variablen.
// Bau-Ring auf freier Kachel (Menue-Ring-Bauen.md), Turm-Ring auf einem Turm (Menue-Ring-Turm.md).
import { TILE, FRAME_MARGIN, VIEW_WIDTH, TOWER_TYPES, TARGET_MODE_NAMES, FIGURE_STYLE, RING_MENU } from './config.js';
import { towerFigure } from './figures.js';
import { towerStats, upgradeCost, sellValue } from './game.js';

// Ringradius in CSS-px. tilePx = Kachelgröße in CSS-px, compact = Handy-Layout (fester, kleinerer Radius).
export function ringRadius(tilePx, compact = false) {
  if (compact) return RING_MENU.compactRadius;
  const t = Number.isFinite(tilePx) && tilePx > 0 ? tilePx : 0;
  return Math.max(RING_MENU.minRadius, RING_MENU.radiusTiles * t);
}

// Kachelmitte in CSS-px relativ zur linken oberen Canvas-Ecke (canvasW = angezeigte Canvas-Breite).
export function tileCenterPx(col, row, canvasW) {
  const u = canvasW / VIEW_WIDTH;
  return { x: u * (FRAME_MARGIN + (col + 0.5) * TILE), y: u * (FRAME_MARGIN + (row + 0.5) * TILE) };
}

const EPS = 0.01; // Rundung: genau anliegende Kanten gelten nicht als Überdeckung
const overlaps = (a, b) => a.left < b.right - EPS && a.right > b.left + EPS && a.top < b.bottom - EPS && a.bottom > b.top + EPS;
const boxAround = (x, y, ext) => ({ left: x - ext, right: x + ext, top: y - ext, bottom: y + ext });

// Ringmitte: Wunschpunkt p (meist die Kachelmitte) so verschieben, dass der ganze Ring (Radius R + edge) in bounds liegt
// und keine der Flächen in avoid (HUD-Leiste, runde Knöpfe) überdeckt. Alle Werte im selben Bezugssystem (z. B. clientX/Y).
// Passt der Ring nicht zwischen die Ränder, steht er dort mittig. Liefert { x, y }.
export function ringCenter(p, R, bounds, avoid = []) {
  const ext = R + RING_MENU.edge;
  const fit = (v, lo, hi) => (hi - lo >= 2 * ext ? Math.min(hi - ext, Math.max(lo + ext, v)) : (lo + hi) / 2);
  const start = { x: fit(p.x, bounds.left, bounds.right), y: fit(p.y, bounds.top, bounds.bottom) };
  const gap = RING_MENU.gap;
  const rects = avoid.filter(Boolean).map((r) => ({ left: r.left - gap, right: r.right + gap, top: r.top - gap, bottom: r.bottom + gap }));
  const free = (c) => !rects.some((r) => overlaps(boxAround(c.x, c.y, ext), r));
  if (free(start)) return start;
  const inside = (c) => c.x - ext >= bounds.left - 0.5 && c.x + ext <= bounds.right + 0.5 && c.y - ext >= bounds.top - 0.5 && c.y + ext <= bounds.bottom + 0.5;
  const options = [];
  for (const r of rects) {
    options.push({ x: start.x, y: r.bottom + ext }, { x: start.x, y: r.top - ext }, { x: r.right + ext, y: start.y }, { x: r.left - ext, y: start.y });
  }
  const ok = options.filter((c) => inside(c) && free(c));
  if (!ok.length) return start;
  const dist = (c) => Math.hypot(c.x - start.x, c.y - start.y);
  return ok.reduce((best, c) => (dist(c) < dist(best) ? c : best));
}

// Info-Plakette des Turm-Rings links vom Ring, wenn die Ringmitte in der rechten Hälfte liegt.
export function infoOnLeft(centerX, boundsLeft, boundsRight) {
  return centerX > (boundsLeft + boundsRight) / 2;
}

// Treffer-Box der Turmfigur in Feld-px (Stil 1: die Türme ragen über ihre Kachel nach oben).
// Gleiche Lage wie drawTowerFigure (render-towers.js): Fuß unter der Kachelmitte, Box der Figur, seitlich eingerückt.
export function towerHitBox(t) {
  const f = towerFigure(t.type, Math.min(3, Math.max(1, Math.round(t.level) || 1)), FIGURE_STYLE.trim);
  const half = TILE / 2;
  if (!f) return { left: t.x - half, right: t.x + half, top: t.y - half, bottom: t.y + half };
  const k = (FIGURE_STYLE.towerScale[t.type] ?? 1) * (TILE / FIGURE_STYLE.unit);
  const foot = t.y + FIGURE_STYLE.towerFoot * (TILE / FIGURE_STYLE.unit);
  const left = t.x + (f.box[0] - f.w / 2) * k;
  const right = t.x + (f.box[2] - f.w / 2) * k;
  const inset = (right - left) * RING_MENU.silhouetteInset;
  return { left: left + inset, right: right - inset, top: foot + (f.box[1] - f.h) * k, bottom: Math.max(t.y + half, foot + (f.box[3] - f.h) * k) };
}

// Turm unter dem Punkt (x, y in Feld-px): zuerst der Turm auf der Kachel selbst, sonst die vorderste Figur
// (größter Fußpunkt), deren Silhouette den Punkt enthält. null, wenn keiner getroffen ist.
export function pickTower(towers, x, y, canBuildAt = () => false) {
  const col = Math.floor(x / TILE), row = Math.floor(y / TILE);
  const own = towers.find((t) => t.col === col && t.row === row);
  if (own) return own;
  if (canBuildAt(col, row)) return null;
  let best = null;
  for (const t of towers) {
    const b = towerHitBox(t);
    if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom && (!best || t.y > best.y)) best = t;
  }
  return best;
}

// Knöpfe des Bau-Rings: Reihenfolge und Winkel wie Tasten 1–5; poor = zu teuer (bleibt klickbar, aria-disabled).
export function buildRingView(gold) {
  return Object.entries(TOWER_TYPES).map(([type, def], i) => {
    const poor = !(gold >= def.cost);
    return {
      type, cost: def.cost, poor, angle: RING_MENU.buildAngles[i],
      label: `${def.name} bauen, ${def.cost} Gold${poor ? ', zu wenig Gold' : ''} (${def.key})`,
    };
  });
}

// Knöpfe des Turm-Rings für Turm t. upgradeRange = Reichweite (Kacheln) der nächsten Stufe, null bei max. Stufe.
export function towerRingView(t, gold, modifiers) {
  const s = towerStats(t, modifiers);
  const up = upgradeCost(t);
  const sell = sellValue(t);
  const mode = TARGET_MODE_NAMES[t.targetMode] ?? t.targetMode;
  return {
    name: `${s.name} · Stufe ${t.level}`,
    upgrade: {
      max: up === null, cost: up, disabled: up === null || !(gold >= up),
      label: up === null ? 'Max. Stufe' : `Verbessern für ${up} Gold (U)`,
    },
    sell: { value: sell, label: `Verkaufen für ${sell} Gold (S)` },
    target: { mode, label: `Ziel: ${mode} (T)` },
    upgradeRange: up === null ? null : towerStats({ ...t, level: t.level + 1 }, modifiers).range,
  };
}
