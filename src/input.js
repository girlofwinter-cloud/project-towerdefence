import { TILE, COLS, ROWS, FRAME_MARGIN, VIEW_WIDTH, VIEW_HEIGHT } from './config.js';

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

// Stil 1: Canvas = Feld + Rand. Bildschirmpunkt (clientX/Y, rect = getBoundingClientRect des Canvas) -> Feldkoordinaten in px,
// Kachel und inField (false im Rand: dort wird nichts gebaut).
export function fieldPoint(clientX, clientY, rect) {
  const x = ((clientX - rect.left) / rect.width) * VIEW_WIDTH - FRAME_MARGIN;
  const y = ((clientY - rect.top) / rect.height) * VIEW_HEIGHT - FRAME_MARGIN;
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  return { x, y, col, row, inField: col >= 0 && row >= 0 && col < COLS && row < ROWS };
}
