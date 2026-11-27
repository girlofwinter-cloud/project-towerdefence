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

// ---------- B-173/B-174: Stufe 3 ----------
const TAU = Math.PI * 2;
const frac01 = (v) => v - Math.floor(v);

// Ruhe-Animation des benannten Teils der Stufe-3-Figur (FIGURE_STYLE.idle[typ]).
// Rückgabe (out wird wiederverwendet): dx/dy Versatz, sx/sy Maßstab um (ax, ay), skew (rad, um ay), alpha,
// spark: ob der Funke (Sturmspule) gerade sichtbar ist. reduced oder ungültige Zeit: Grundstellung.
export function idlePose(cfg, time, reduced, out = {}) {
  out.dx = 0; out.dy = 0; out.sx = 1; out.sy = 1; out.skew = 0; out.alpha = 1; out.spark = true;
  out.ax = cfg?.at ? cfg.at[0] : 0;
  out.ay = cfg?.at ? cfg.at[1] : cfg?.top || 0;
  if (!cfg || reduced || !Number.isFinite(time)) return out;
  const t = Math.abs(time);
  const wave = (p) => 0.5 - 0.5 * Math.cos((TAU * t) / p); // 0 -> 1 -> 0
  if (cfg.skew) out.skew = (cfg.skew * Math.PI / 180) * wave(cfg.period);
  else if (cfg.rise) {
    const u = frac01(t / cfg.period);
    out.dy = -cfg.rise * u;
    out.alpha = 1 - u;
  } else if (cfg.squeeze) {
    out.sx = cfg.squeeze + (1 - cfg.squeeze) * Math.abs(Math.cos((Math.PI * t) / cfg.period));
    out.dy = cfg.bob * Math.sin((TAU * t) / cfg.bobPeriod);
  } else if (cfg.grow) {
    const u = wave(cfg.period);
    out.sx = out.sy = 1 + cfg.grow * u;
    out.alpha = 1 - cfg.fade * u;
  } else if (cfg.bob) out.dy = cfg.bob * Math.sin((TAU * t) / cfg.period);
  if (cfg.sparkOn) {
    const u = frac01(t / cfg.sparkPeriod) * cfg.sparkPeriod;
    out.spark = cfg.sparkOn.some(([a, b]) => u >= a && u < b);
  }
  return out;
}

// Angezeigte Stufe während des Aufstiegs: bis swapAt noch Stufe 2, dann die neue Figur (Effekte-Aufstieg)
export function shownLevel(level, ascendAge, swapAt) {
  return level >= 3 && Number.isFinite(ascendAge) && ascendAge >= 0 && ascendAge < swapAt ? 2 : level;
}

// Mehrfachschuss: Anfang der Spur hinter dem Geschoss (p) auf dem Weg von s zum Ziel t.
// Länge share x Gesamtstrecke, mindestens min, nie hinter den Startpunkt. Rückgabe [x, y] oder null.
export function trailTail(sx, sy, px, py, tx, ty, share, min) {
  const flown = Math.hypot(px - sx, py - sy);
  if (!(flown > 0)) return null;
  const total = flown + Math.hypot(tx - px, ty - py);
  const len = Math.min(flown, Math.max(min, share * total));
  if (!Number.isFinite(len)) return null;
  return [px - ((px - sx) / flown) * len, py - ((py - sy) / flown) * len];
}

// Teilchen-Obergrenze der Stufe-3-Effekte (MASTER_FX.maxParticles): je Bild neu füllen, take gibt die erlaubte Zahl
export function createBudget(max) {
  return { max, left: max };
}
export function resetBudget(b) {
  b.left = b.max;
}
export function takeBudget(b, n) {
  const k = Math.max(0, Math.min(b.left, Math.floor(n) || 0));
  b.left -= k;
  return k;
}

// Fester Zufallswert in [0, 1) aus zwei Zahlen (Plätze der Flämmchen, Risse, Zacken), ohne Math.random
export function hash01(a, b) {
  return frac01(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453);
}
