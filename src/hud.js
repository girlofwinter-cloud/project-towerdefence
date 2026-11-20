// Reine Darstellungs-Helfer fürs HUD (kein DOM).
import { START_LIVES } from './config.js';

// Herzreihe: gefüllte Herzen für verbleibende, schwarze für verlorene Leben.
export function livesText(lives, max = START_LIVES) {
  const full = Math.max(0, Math.min(max, Math.floor(lives)));
  return '❤️'.repeat(full) + '🖤'.repeat(max - full);
}
