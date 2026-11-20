// Reine Hilfslogik fuer Turm-Effekte (kein DOM, kein Canvas -> in Node testbar).

// Maximaler Rueckstoss (Anteil 0..1) -> render.js skaliert das pro Turmtyp in Pixel.
// Eingabe: Anteil der verbleibenden Abklingzeit (cooldown / Schussintervall).
// 1 = Schuss gerade erfolgt, 0 = bereit. Ausserhalb von 0..1 wird begrenzt.
// Verlauf: quadratisch, also schnelles Zurueckziehen und weiches Abklingen.
export function recoilOffset(cooldownFraction) {
  if (!(cooldownFraction > 0)) return 0; // 0, negativ, NaN
  const f = cooldownFraction > 1 ? 1 : cooldownFraction;
  return f * f;
}
