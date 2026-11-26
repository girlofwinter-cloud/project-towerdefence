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

// Anzeige eines Fähigkeitsknopfs (B-058): Zustand, Füllanteil des Abklingbalkens, Ladungs-Abzeichen
// und zugänglicher Name. def = Eintrag aus ABILITIES, uses = bisherige Einsätze, left = Rest-Abklingzeit in s.
// fill: 1 = voll geladen (bereit), 0 = gerade ausgelöst; wächst während des Ladens.
export function abilityView(def, uses, left) {
  // Härtung (B-096): fehlende/ungültige Einsätze zählen wie 0 (sonst Abzeichen "NaN×").
  const n = Number.isFinite(uses) ? uses : 0;
  const remaining = def.maxUses !== undefined ? Math.max(0, def.maxUses - n) : null;
  const used = remaining === 0;
  // Ungültige Restzeit (NaN, undefined, ±Infinity) nicht als "bereit" werten (sonst voller Balken):
  // Rückfall auf die volle Abklingzeit, also "lädt" mit leerem Balken.
  const wait = Math.max(0, Number.isFinite(left) ? left : def.cooldown);
  const charging = !used && wait > 0;
  const fill = used ? 0 : charging ? Math.max(0, Math.min(1, 1 - wait / def.cooldown)) : 1;
  const state = used ? 'used' : charging ? 'charging' : 'ready';
  const badge = remaining !== null && !used ? `${remaining}×` : '';
  const status = used ? 'aufgebraucht' : charging ? `lädt noch ${Math.ceil(wait)} s` : 'bereit';
  const charges = badge ? `, noch ${remaining} ${remaining === 1 ? 'Ladung' : 'Ladungen'}` : '';
  return { state, fill, badge, aria: `${def.name}, ${status}${charges}` };
}

// Relative Leuchtdichte einer Hex-Farbe (#rrggbb) nach WCAG 2.x.
export function relativeLuminance(hex) {
  const lin = (i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5);
}

// Kontrastverhältnis zweier Hex-Farben (1 bis 21), Reihenfolge egal.
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
