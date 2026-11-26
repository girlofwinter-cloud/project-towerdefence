// Reine Darstellungs-Helfer fürs HUD (kein DOM).
import { START_LIVES, MAX_WAVES, EARLY_START_BONUS, waveBonus } from './config.js';

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

// B-030: Hinweis für überhitzte Türme (neben Lava auf der Karte Vulkan); leer, wenn der Turm normal schießt.
export const OVERHEAT_NOTE = 'Überhitzt: schießt langsamer';
export function overheatNote(tower) {
  return tower && tower.overheated ? OVERHEAT_NOTE : '';
}

// Relative Leuchtdichte einer Hex-Farbe (#rrggbb oder #rgb) nach WCAG 2.x. Ungültige Eingaben ergeben NaN.
export function relativeLuminance(hex) {
  // Kurzform #rgb auf #rrggbb erweitern
  if (typeof hex === 'string' && /^#[0-9a-f]{3}$/i.test(hex)) hex = `#${[...hex.slice(1)].map((c) => c + c).join('')}`;
  if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) return NaN;
  const lin = (i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5);
}

// Kontrastverhältnis zweier Hex-Farben (1 bis 21), Reihenfolge egal; NaN bei ungültiger Farbe.
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// B-005: Zustand des Knopfs „Welle starten“. Während einer Welle bleibt er bis zur letzten Welle bedienbar
// und zeigt den Frühstart-Bonus der nächsten Welle.
export function startButtonView(state) {
  const canStart = state.status === 'playing' && state.wave < MAX_WAVES;
  const next = state.wave + 1;
  let label = `Welle ${next} starten`;
  if (state.waveActive) label = canStart ? `Nächste Welle +${Math.floor(waveBonus(next) * EARLY_START_BONUS)}` : 'Letzte Welle läuft…';
  return { disabled: !canStart, label, showKey: canStart };
}
