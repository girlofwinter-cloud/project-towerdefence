import { TILE, COLS, ROWS, FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT, VIEW_FIT } from './config.js';

// Reine Eingabe-Logik (kein DOM): Bauen per Touch geht in zwei Schritten.
// Erster Tipp auf eine Kachel zeigt nur die Vorschau (Reichweite, grün/rot), zweiter Tipp auf dieselbe Kachel baut.
// Mit der Maus gibt es den Hover schon, dort wird sofort gebaut.
// pending = zuletzt angetippte Kachel { col, row } oder null.
export function buildTapStep(pending, col, row, touch) {
  if (!touch) return { action: 'build', pending: null };
  if (pending && pending.col === col && pending.row === row) return { action: 'build', pending: null };
  return { action: 'preview', pending: { col, row } };
}

// Zielmodus der Fähigkeit Meteor (kein DOM). aiming = true, wenn der nächste Klick/Tipp aufs Feld auslöst.
// event: 'key' (Taste oder Button) | 'click' (Klick aufs Feld) | 'cancel' (Esc/Rechtsklick).
// Liefert { aiming, fire }: fire = true heißt, der Meteor soll jetzt an der Klickposition auslösen.
export function aimStep(aiming, event) {
  if (event === 'key') return { aiming: !aiming, fire: false };
  if (event === 'click' && aiming) return { aiming: false, fire: true };
  if (event === 'cancel') return { aiming: false, fire: false };
  return { aiming, fire: false };
}

// C4 Tastatur: Fokus-Kachel per Pfeiltaste verschieben (ev.key, z. B. 'ArrowLeft'), am Feldrand begrenzt.
// Ohne bisherige Kachel startet sie bei (0,0). Andere Tasten: null (nicht zuständig).
const ARROW_STEPS = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };
export function moveFocusTile(tile, key) {
  const step = ARROW_STEPS[String(key).toLowerCase()];
  if (!step) return null;
  if (!tile) return { col: 0, row: 0 };
  const clamp = (v, n) => Math.max(0, Math.min(n - 1, v));
  return { col: clamp(tile.col + step[0], COLS), row: clamp(tile.row + step[1], ROWS) };
}

// Stil 1: Canvas = Feld + Rand. Bildschirmpunkt (clientX/Y, rect = getBoundingClientRect des Canvas) -> Feldkoordinaten in px,
// Kachel und inField (false im Rand: dort wird nichts gebaut).
export function fieldPoint(clientX, clientY, rect) {
  const x = ((clientX - rect.left) / rect.width) * VIEW_WIDTH - FRAME_MARGIN;
  const y = ((clientY - rect.top) / rect.height) * VIEW_HEIGHT - FRAME_MARGIN;
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  return { x, y, col, row, inField: col >= 0 && row >= 0 && col < COLS && row < ROWS };
}

// HiDPI: Größe des Canvas für verfügbaren Platz (availW x availH in CSS-px) und Pixeldichte dpr.
// Seitenverhältnis VIEW_WIDTH:VIEW_HEIGHT bleibt; dpr wird auf [1, VIEW_FIT.maxDpr] begrenzt, jede Seite auf maxSide (Geräte-px).
// cssW/cssH: Anzeigegröße, width/height: Backing-Store in Geräte-px, sx/sy: Transformation Canvas-Einheit -> Geräte-px.
export function canvasSize(availW, availH, dpr, maxSide = Infinity) {
  const d = Number.isFinite(dpr) && dpr > 0 ? Math.min(VIEW_FIT.maxDpr, Math.max(1, dpr)) : 1;
  const w = Number.isFinite(availW) && availW > 0 ? availW : VIEW_WIDTH;
  const h = availH > 0 ? availH : Infinity; // Infinity = nur die Breite zählt
  const scale = Math.min(w / VIEW_WIDTH, h / VIEW_HEIGHT);
  const cssW = Math.max(1, Math.floor(VIEW_WIDTH * scale + 1e-6)); // + 1e-6: 939 / 900 * 900 ergibt sonst 938,999…
  const cssH = Math.max(1, Math.round((cssW * VIEW_HEIGHT) / VIEW_WIDTH));
  // C6: Obergrenze je Seite in Geräte-px (main.js gibt im Handy-Layout VIEW_FIT.maxSide mit, sonst unbegrenzt)
  const k = maxSide > 0 ? Math.min(d, maxSide / Math.max(cssW, cssH)) : d;
  const width = Math.round(cssW * k);
  const height = Math.round(cssH * k);
  return { cssW, cssH, dpr: d, width, height, sx: width / VIEW_WIDTH, sy: height / VIEW_HEIGHT };
}

// B-137: Drehhinweis im Hochformat (Handy). portrait = Hinweis sichtbar, paused/playing aus dem Spielzustand,
// byHint = die aktuelle Pause kam vom Hinweis. Liefert { pause: true | false | null (nichts ändern), byHint }.
// Nach dem Drehen läuft das Spiel nur weiter, wenn der Hinweis selbst pausiert hat (eigene Pause des Spielers bleibt).
export function rotatePauseStep({ portrait, paused, playing, byHint }) {
  if (portrait) {
    if (playing && !paused) return { pause: true, byHint: true };
    return { pause: null, byHint: byHint && paused };
  }
  if (byHint && paused && playing) return { pause: false, byHint: false };
  return { pause: null, byHint: false };
}
