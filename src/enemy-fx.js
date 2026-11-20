// Reine Hilfslogik fuer die Gegner-Darstellung (kein DOM, kein Canvas -> in Node testbar).
// Alles laeuft ueber state.time und Wegdaten, nie ueber echte Zeit.

const TWO_PI = Math.PI * 2;
// Laufzyklus: Bogenmass pro Sekunde bei Referenzgeschwindigkeit (entspricht ca. 1,4 Schritten/s)
export const WALK_RATE = 9;
// Referenz-Gegnergeschwindigkeit (Kacheln/s), bei der der Laufzyklus WALK_RATE entspricht (Goblin)
export const WALK_REF_SPEED = 1.4;
// Phasenversatz pro Gegner-ID (Bogenmass, "goldener Winkel" -> benachbarte IDs laufen nicht im Gleichschritt)
export const WALK_ID_SHIFT = 2.399963;
// Rueckfall, falls ein Gegner kein slowFactor-Feld hat (wie Frostturm-Standard)
const DEFAULT_SLOW_FACTOR = 0.5;
// Maximale Neigung (Bogenmass) fuer Auf/Ab-Bewegung
export const TILT_MAX = 0.3;
// Ab diesem cos-Wert (negativ) wird die Figur gespiegelt (Blick nach links)
const FLIP_THRESHOLD = -0.01;

// Laufphase in [0, 2*PI). Waechst mit der Zeit (modulo), Tempo ~ speedFactor, Versatz pro id.
export function walkPhase(time, id, speedFactor) {
  const raw = time * WALK_RATE * speedFactor + id * WALK_ID_SHIFT;
  const p = raw % TWO_PI;
  return p < 0 ? p + TWO_PI : p;
}

// Animationstempo-Faktor eines Gegners: Basisgeschwindigkeit relativ zum Goblin,
// verlangsamte Gegner (time < slowUntil) animieren entsprechend langsamer.
export function animSpeedFactor(e, time) {
  const base = e.speed > 0 ? e.speed / WALK_REF_SPEED : 1;
  if (time < e.slowUntil) return base * (e.slowFactor > 0 ? e.slowFactor : DEFAULT_SLOW_FACTOR);
  return base;
}

// Blickwinkel (Bogenmass, atan2-Konvention, y nach unten) des Wegsegments an Strecke dist.
// Allokationsfrei. Vor dem Start gilt das erste, hinter dem Ende das letzte Segment.
export function facingFor(path, dist) {
  const segs = path && path.segments;
  if (!segs || segs.length === 0) return 0;
  let s = segs[segs.length - 1];
  for (let i = 0; i < segs.length; i++) {
    if (dist <= segs[i].start + segs[i].len) {
      s = segs[i];
      break;
    }
  }
  return Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x);
}

// Spiegelung: -1 bei Blick nach links, sonst 1 (senkrechte Segmente bleiben ungespiegelt)
export function facingFlip(angle) {
  return Math.cos(angle) < FLIP_THRESHOLD ? -1 : 1;
}

// Neigung fuer Auf/Ab: positiv = Vorderseite nach unten (gilt in der gespiegelten Figur-Ebene)
export function facingTilt(angle) {
  return Math.sin(angle) * TILT_MAX;
}
