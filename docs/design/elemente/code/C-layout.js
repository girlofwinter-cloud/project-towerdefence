// Vollbild (Stil 1, C1): Pixel des Canvas-Puffers je Spiel-px. Reine Rechnung, kein DOM.
import { VIEW_WIDTH, LAYOUT } from './config.js';

// cssWidth = angezeigte Breite des Canvas in CSS-px, dpr = devicePixelRatio. Ergebnis mindestens 1 (nie unschärfer als bisher).
export function canvasScale(cssWidth, dpr = 1) {
  const d = Math.min(LAYOUT.dprMax, Math.max(1, Number.isFinite(dpr) ? dpr : 1));
  const s = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth / VIEW_WIDTH : 1;
  return Math.max(1, Math.round(s * d * 4) / 4); // Viertelschritte: nicht bei jedem Pixel neu rastern
}
