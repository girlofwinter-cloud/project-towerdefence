// C6 Handy: Rechenhilfen für Wischen und Tipp-Schwelle (reine Funktionen, in Node getestet).
// B-137: Das Hochformat mit seitlichem Wischen und Zoom-Knopf ist entfallen (Handy = Querformat, ganzes Feld sichtbar);
// mountViewport (DOM) ist daher entfernt, die Funktionen hier werden vom Spiel derzeit nicht mehr aufgerufen.
import { VIEWPORT } from './config.js';

// Gültige Wisch-Position: 0 … (Inhaltsbreite − sichtbare Breite), nie negativ.
export function clampScroll(left, contentW, viewW) {
  const max = Math.max(0, contentW - viewW);
  if (!Number.isFinite(left)) return 0;
  return Math.max(0, Math.min(max, left));
}

// Weiter wischbar nach links/rechts? (1 px Toleranz wegen gebrochener Pixel)
export function scrollEdges(left, contentW, viewW) {
  return { canLeft: left > 1, canRight: left < contentW - viewW - 1 };
}

// Tipp oder Wischen: Bewegung des Fingers (dx, dy) und Verschiebung des Feldes (scrolled) in CSS-px.
// Ab VIEWPORT.tapSlop zählt es als Wischen, dann darf der Klick nicht bauen.
export function gestureKind(dx, dy, scrolled = 0, slop = VIEWPORT.tapSlop) {
  return Math.hypot(dx, dy) >= slop || Math.abs(scrolled) >= slop ? 'swipe' : 'tap';
}

// Mausziehen (schmales Fenster ohne Touch): neue Wisch-Position aus Startposition und Bewegung
export function dragScroll(startLeft, dx, contentW, viewW) {
  return clampScroll(startLeft - dx, contentW, viewW);
}
