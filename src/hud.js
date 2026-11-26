// Reine Darstellungs-Helfer fürs HUD (kein DOM).
import { START_LIVES } from './config.js';

// Herzreihe als Liste: true = verbleibendes Leben, false = verlorenes (nie negativ, gekappt).
export function heartStates(lives, max = START_LIVES) {
  const full = Math.max(0, Math.min(max, Math.floor(lives)));
  return Array.from({ length: max }, (_, i) => i < full);
}

// Herzreihe als Text: gefüllte Herzen für verbleibende, schwarze für verlorene Leben (Emoji-Rückfall).
export function livesText(lives, max = START_LIVES) {
  return heartStates(lives, max).map((f) => (f ? '❤️' : '🖤')).join('');
}
