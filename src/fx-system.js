// Reine, DOM-freie Partikel-Logik fuer die Grafik-Effekte (kein Canvas -> in Node testbar).
// Der Zustand lebt NUR hier im Render-Umfeld, nie in game.js. Er laeuft mit der Spielzeit
// (state.time), nicht mit echter Zeit: Pause (dt = 0) altert nichts, Tempo skaliert mit.
// Alles ist vorab allokiert (feste Pools, Typed Arrays); im Hotpath entstehen keine Objekte.
// Zufall ist deterministisch (tileRand mit Zaehler), niemals Math.random.
import { tileRand } from './decor.js';
import { BOSS_ENTRY, FX_STYLE } from './config.js';

export const MAX_PARTICLES = 256; // feste Obergrenze, ist der Pool voll wird das Aelteste ueberschrieben
export const MAX_TRACKED = 256; // gleichzeitig verfolgte Projektile (Schweif-Richtung, Treffer-Erkennung)
export const MAX_STEP = 0.1; // groesster Zeitschritt pro Frame (Tab im Hintergrund -> kein Ausbruch)

// Partikelarten (0 = frei)
export const K_NONE = 0;
export const K_SMOKE = 1;
export const K_ICE = 2;
export const K_SPARK = 3;
export const K_FLASH = 4;
export const K_COIN = 5;

// Projektil-Typcodes (0 = unbekannt)
const TYPE_CODE = { arrow: 1, cannon: 2, frost: 3, sniper: 4 };
export const T_ARROW = 1;
export const T_CANNON = 2;
export const T_FROST = 3;
export const T_SNIPER = 4;

// Physik je Partikelart (Index = Art): Schwerkraft in px/s^2 (negativ = steigt), Daempfung pro Sekunde.
// Muenzen haben keine Schwerkraft: ihr Hopser kommt aus coinHop (B-068), die Physik treibt sie nur seitlich.
const GRAVITY = new Float32Array([0, -14, 40, 160, 0, 0]);
const DRAG = new Float32Array([0, 1.5, 2, 3, 0, 4]);

// Screen-Shake
export const SHAKE_MAX = 3; // Pixel, harte Obergrenze
export const SHAKE_DURATION = 0.3; // Sekunden Spielzeit
const SHAKE_FREQ = 55; // rad/s
export const BIG_EXPLOSION_RADIUS = 36; // ab diesem Radius (px) wackelt der Bildschirm (Kanone)
const SHAKE_STRENGTH = 2.5;
// Sperrzeit (Sekunden Spielzeit) nach einem ausgeloesten Shake: Der Kanonen-Splash ist immer gleich gross
// (die Radius-Schwelle filtert also nichts), bei mehreren Kanonen wuerde das Bild sonst dauernd wackeln.
// Explosionen waehrend der Sperre erzeugen weiter Funken und Rauch, nur keinen Shake.
export const SHAKE_COOLDOWN = 1.2;

// ---------- Aufbau und Reset ----------
export function createFx() {
  return {
    // Partikel-Pool
    px: new Float32Array(MAX_PARTICLES),
    py: new Float32Array(MAX_PARTICLES),
    pvx: new Float32Array(MAX_PARTICLES),
    pvy: new Float32Array(MAX_PARTICLES),
    page: new Float32Array(MAX_PARTICLES),
    plife: new Float32Array(MAX_PARTICLES),
    psize: new Float32Array(MAX_PARTICLES),
    pkind: new Uint8Array(MAX_PARTICLES),
    head: 0,
    seq: 0, // Zaehler fuer den deterministischen Zufall
    // Projektil-Verfolgung
    slotOf: new WeakMap(),
    sActive: new Uint8Array(MAX_TRACKED),
    sType: new Uint8Array(MAX_TRACKED),
    sStamp: new Int32Array(MAX_TRACKED),
    sX: new Float32Array(MAX_TRACKED),
    sY: new Float32Array(MAX_TRACKED),
    sTx: new Float32Array(MAX_TRACKED),
    sTy: new Float32Array(MAX_TRACKED),
    sDx: new Float32Array(MAX_TRACKED),
    sDy: new Float32Array(MAX_TRACKED),
    frame: 0,
    // bereits gesehene Effekte
    seenEffects: new WeakSet(),
    // Zeit und Herkunft
    pathRef: null,
    lastTime: 0,
    // Shake
    shakeStart: 0,
    shakeStrength: 0,
    shakeLock: -Infinity, // Spielzeit des letzten ausgeloesten Shakes (fuer SHAKE_COOLDOWN)
    // Boss-Auftritt (B-067): bereits gesehene Gegner, letzter Bodenschlag
    seenEnemies: new WeakSet(),
    entryStart: -Infinity,
    entryX: 0,
    entryY: 0,
    entryR: 0,
    entryReduced: false,
    // reduzierte Bewegung (B-068): zuletzt von syncFx gesetzt, die Zeichnung liest es
    reduced: false,
    // B-095: letzter Reset kam von einem Zeitsprung rueckwaerts bei gleichem Weg (kein neues Spiel)
    timeJump: false,
  };
}

// Leert alles; es bleibt kein Zustand eines frueheren Spiels uebrig.
export function resetFx(fx) {
  fx.pkind.fill(0);
  fx.page.fill(0);
  fx.head = 0;
  fx.seq = 0;
  fx.sActive.fill(0);
  fx.sStamp.fill(0);
  fx.slotOf = new WeakMap();
  fx.seenEffects = new WeakSet();
  fx.frame = 0;
  fx.shakeStart = 0;
  fx.shakeStrength = 0;
  fx.shakeLock = -Infinity; // Sperre leeren
  fx.seenEnemies = new WeakSet();
  fx.entryStart = -Infinity;
  fx.entryReduced = false;
}

// Gleicht mit der Spielzeit ab. Neuer Weg (= neues Spiel) oder Zeit rueckwaerts -> Reset.
// Rueckgabe: Zeitschritt in Sekunden, 0 bei Pause/Reset, hoechstens MAX_STEP.
export function syncTime(fx, time, pathRef) {
  const t = Number.isFinite(time) ? time : 0;
  fx.timeJump = false;
  if (fx.pathRef !== pathRef || t < fx.lastTime) {
    const jump = fx.pathRef === pathRef;
    resetFx(fx);
    fx.timeJump = jump;
    fx.pathRef = pathRef;
    fx.lastTime = t;
    return 0;
  }
  let dt = t - fx.lastTime;
  fx.lastTime = t;
  if (!(dt > 0)) return 0;
  return dt > MAX_STEP ? MAX_STEP : dt;
}

// ---------- Zufall ----------
export function nextRand(fx) {
  return tileRand(fx.seq++, 17, 99);
}

// ---------- Partikel ----------
export function spawnParticle(fx, kind, x, y, vx, vy, life, size) {
  const i = fx.head;
  fx.head = (i + 1) % MAX_PARTICLES; // Ringpuffer: ueberschreibt das Aelteste
  fx.px[i] = x;
  fx.py[i] = y;
  fx.pvx[i] = vx;
  fx.pvy[i] = vy;
  fx.page[i] = 0;
  fx.plife[i] = life;
  fx.psize[i] = size;
  fx.pkind[i] = kind;
  return i;
}

export function liveParticles(fx) {
  let n = 0;
  for (let i = 0; i < MAX_PARTICLES; i++) if (fx.pkind[i] !== K_NONE) n++;
  return n;
}

// Altert und bewegt alle Partikel; bei dt <= 0 passiert nichts.
export function updateParticles(fx, dt) {
  if (!(dt > 0)) return;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const k = fx.pkind[i];
    if (k === K_NONE) continue;
    const age = fx.page[i] + dt;
    if (age >= fx.plife[i]) {
      fx.pkind[i] = K_NONE;
      continue;
    }
    fx.page[i] = age;
    const damp = Math.max(0, 1 - DRAG[k] * dt);
    fx.pvx[i] *= damp;
    fx.pvy[i] = fx.pvy[i] * damp + GRAVITY[k] * dt;
    fx.px[i] += fx.pvx[i] * dt;
    fx.py[i] += fx.pvy[i] * dt;
  }
}

// ---------- Verfolgung der Projektile ----------
// Projektile haben in game.js eine id, in Tests aber nicht immer: darum Referenz-Zuordnung (WeakMap).
// Liefert den Slot (oder -1, wenn alle belegt sind). Richtung kommt aus der Bewegung seit dem letzten Frame.
export function trackProjectile(fx, p) {
  let s = fx.slotOf.get(p);
  const x = Number.isFinite(p.x) ? p.x : 0;
  const y = Number.isFinite(p.y) ? p.y : 0;
  const tx = Number.isFinite(p.tx) ? p.tx : x;
  const ty = Number.isFinite(p.ty) ? p.ty : y;
  if (s === undefined || !fx.sActive[s]) {
    s = -1;
    for (let i = 0; i < MAX_TRACKED; i++) {
      if (!fx.sActive[i]) { s = i; break; }
    }
    if (s < 0) return -1;
    fx.slotOf.set(p, s);
    fx.sActive[s] = 1;
    fx.sType[s] = Object.hasOwn(TYPE_CODE, p.towerType) ? TYPE_CODE[p.towerType] : 0;
    // Startrichtung: zum Ziel
    const dx = tx - x;
    const dy = ty - y;
    const len = Math.hypot(dx, dy);
    fx.sDx[s] = len > 0.01 ? dx / len : 1;
    fx.sDy[s] = len > 0.01 ? dy / len : 0;
  } else {
    const dx = x - fx.sX[s];
    const dy = y - fx.sY[s];
    const len = Math.hypot(dx, dy);
    if (len > 0.01) { // bei Stillstand (Pause) bleibt die alte Richtung
      fx.sDx[s] = dx / len;
      fx.sDy[s] = dy / len;
    }
  }
  fx.sX[s] = x;
  fx.sY[s] = y;
  fx.sTx[s] = tx;
  fx.sTy[s] = ty;
  fx.sStamp[s] = fx.frame;
  return s;
}

// Spuren je Frame (nur bei dt > 0): Kanone raucht, Frost verliert Eiskristalle.
export function trailParticles(fx, s) {
  const t = fx.sType[s];
  if (t === T_CANNON) {
    const r = nextRand(fx);
    spawnParticle(fx, K_SMOKE, fx.sX[s], fx.sY[s], (r - 0.5) * 16, (nextRand(fx) - 0.5) * 16, 0.35, 3 + r * 2);
  } else if (t === T_FROST) {
    const a = nextRand(fx) * Math.PI * 2;
    const v = 15 + nextRand(fx) * 25;
    spawnParticle(fx, K_ICE, fx.sX[s], fx.sY[s], Math.cos(a) * v, Math.sin(a) * v, 0.4, 1.2 + nextRand(fx));
  }
}

// Alles, was seit dem letzten Frame nicht mehr gemeldet wurde, ist verschwunden = Treffer.
export function sweepProjectiles(fx) {
  for (let s = 0; s < MAX_TRACKED; s++) {
    if (!fx.sActive[s] || fx.sStamp[s] === fx.frame) continue;
    fx.sActive[s] = 0;
    spawnHit(fx, fx.sType[s], fx.sTx[s], fx.sTy[s]);
  }
}

// Treffer-Blitz plus Funken bzw. Eis. Kanonentreffer zeigt die Explosion (kind 'explosion').
export function spawnHit(fx, type, x, y) {
  if (type === T_CANNON) return;
  spawnParticle(fx, K_FLASH, x, y, 0, 0, FX_STYLE.hit.flashLife, 6); // Dauer rein optisch (STIL.md: 0,08 s)
  const n = type === T_FROST ? 5 : 3;
  const kind = type === T_FROST ? K_ICE : K_SPARK;
  for (let i = 0; i < n; i++) {
    const a = nextRand(fx) * Math.PI * 2;
    const v = 50 + nextRand(fx) * 90;
    spawnParticle(fx, kind, x, y, Math.cos(a) * v, Math.sin(a) * v, 0.22 + nextRand(fx) * 0.15, 1.5);
  }
}

// ---------- Effekte aus dem Spielzustand ----------
// Erkennt neue Effekte (Referenz-Merker) und leitet Partikel ab.
// reducedMotion (B-068): kein Wackeln bei Explosionen, Muenzen treiben nicht seitlich.
export function observeEffect(fx, e, time, reducedMotion = false) {
  if (!e || fx.seenEffects.has(e)) return;
  fx.seenEffects.add(e);
  const x = Number.isFinite(e.x) ? e.x : 0;
  const y = Number.isFinite(e.y) ? e.y : 0;
  if (e.kind === 'explosion') {
    const r = Number.isFinite(e.r) ? e.r : 0;
    const n = Math.min(14, 6 + Math.floor(r / 8));
    for (let i = 0; i < n; i++) {
      const a = ((i + nextRand(fx) * 0.8) / n) * Math.PI * 2;
      const v = 100 + nextRand(fx) * 130;
      spawnParticle(fx, K_SPARK, x, y, Math.cos(a) * v, Math.sin(a) * v, 0.25 + nextRand(fx) * 0.2, 1.5);
    }
    for (let i = 0; i < 3; i++) {
      spawnParticle(fx, K_SMOKE, x + (nextRand(fx) - 0.5) * r * 0.6, y + (nextRand(fx) - 0.5) * r * 0.6, 0, 0, 0.5, 5 + nextRand(fx) * 3);
    }
    if (!reducedMotion && r >= BIG_EXPLOSION_RADIUS && time - fx.shakeLock >= SHAKE_COOLDOWN) {
      fx.shakeLock = time;
      triggerShake(fx, time, SHAKE_STRENGTH);
    }
  } else if (e.kind === 'coin') {
    const drift = reducedMotion ? 0 : (nextRand(fx) - 0.5) * FX_STYLE.coin.drift;
    spawnParticle(fx, K_COIN, x, y - 6, drift, 0, 0.7, 3.5);
  }
}

// ---------- Muenzen-Hopser (B-068) ----------
// Hoehenversatz (px, <= 0 = nach oben) einer Muenze beim Lebensanteil u (0..1): ein Sprung bis
// FX_STYLE.coin.hop, danach ein kleiner Nachhopser, dann liegt sie. Reduzierte Bewegung: immer 0.
export function coinHop(u, reducedMotion = false) {
  const c = FX_STYLE.coin;
  if (reducedMotion || !(u > 0) || u >= c.end) return 0;
  if (u < c.split) {
    const t = u / c.split;
    return 0 - c.hop * 4 * t * (1 - t); // 0 - ... vermeidet -0
  }
  const t = (u - c.split) / (c.end - c.split);
  return 0 - c.hop * c.bounce * 4 * t * (1 - t);
}

// Breitenfaktor (minWidth..1) einer sich drehenden Muenze; reduzierte Bewegung: 1 (keine Drehung).
export function coinSpin(u, reducedMotion = false) {
  const c = FX_STYLE.coin;
  if (reducedMotion || !Number.isFinite(u)) return 1;
  const w = Math.abs(Math.cos(u * Math.PI * c.spins));
  return w < c.minWidth ? c.minWidth : w;
}

// ---------- Boss-Auftritt (B-067) ----------
// Wackel-Staerke beim Erscheinen des Bosses: 0 bei prefers-reduced-motion, sonst unter SHAKE_MAX.
export function bossEntryShake(reducedMotion) {
  return reducedMotion ? 0 : Math.min(BOSS_ENTRY.shake, SHAKE_MAX);
}

// Fortschritt des Bodenschlag-Rings: 0..1 waehrend der Dauer, sonst -1 (nichts zeichnen).
export function bossEntryProgress(time, start) {
  const el = time - start;
  if (!(el >= 0) || el >= BOSS_ENTRY.ringDuration) return -1;
  return el / BOSS_ENTRY.ringDuration;
}

// Erkennt neue Gegner (Referenz-Merker); ein neuer Boss loest Bodenschlag (Ring) und Wackeln aus.
// reducedMotion: kein Wackeln, der Ring waechst nicht (bleibt als ruhiger Hinweis).
export function observeEnemy(fx, e, time, reducedMotion) {
  if (!e || fx.seenEnemies.has(e)) return;
  fx.seenEnemies.add(e);
  if (e.type !== 'boss') return;
  const x = Number.isFinite(e.x) ? e.x : 0;
  const y = Number.isFinite(e.y) ? e.y : 0;
  const r = Number.isFinite(e.radius) ? e.radius : 0;
  fx.entryStart = time;
  fx.entryX = x;
  fx.entryY = y;
  fx.entryR = r;
  fx.entryReduced = !!reducedMotion;
  triggerShake(fx, time, bossEntryShake(reducedMotion));
}

// Gesamter Ablauf pro Frame. Liest den Spielzustand nur, veraendert ihn nie.
// reducedMotion (prefers-reduced-motion, kommt aus main.js) schaltet Boss- und Explosions-Wackeln
// sowie Muenzen-Hopser aus.
export function syncFx(fx, state, reducedMotion = false) {
  const dt = syncTime(fx, state.time, state.path && state.path.points);
  fx.frame++;
  fx.reduced = !!reducedMotion;
  updateParticles(fx, dt);
  const projectiles = state.projectiles || [];
  for (let i = 0; i < projectiles.length; i++) {
    const s = trackProjectile(fx, projectiles[i]);
    if (s >= 0 && dt > 0) trailParticles(fx, s);
  }
  sweepProjectiles(fx);
  const effects = state.effects || [];
  for (let i = 0; i < effects.length; i++) observeEffect(fx, effects[i], fx.lastTime, reducedMotion);
  const enemies = state.enemies || [];
  if (fx.timeJump) {
    // Zeitsprung im selben Spiel (z. B. Testseite): schon vorhandene Gegner gelten als gesehen,
    // ein Boss auf dem Feld loest seinen Auftritt nicht noch einmal aus.
    for (let i = 0; i < enemies.length; i++) if (enemies[i] && typeof enemies[i] === 'object') fx.seenEnemies.add(enemies[i]);
  }
  for (let i = 0; i < enemies.length; i++) observeEnemy(fx, enemies[i], fx.lastTime, reducedMotion);
}

// ---------- Screen-Shake ----------
export function triggerShake(fx, time, strength) {
  const s = strength > SHAKE_MAX ? SHAKE_MAX : strength;
  if (!(s > 0)) return;
  if (s >= shakeAmplitude(time, fx.shakeStart, fx.shakeStrength)) {
    fx.shakeStart = time;
    fx.shakeStrength = s;
  }
}

// Amplitude (>= 0): 0 vor dem Start und nach dem Ende, dazwischen monoton fallend, nie ueber SHAKE_MAX.
export function shakeAmplitude(time, startTime, strength) {
  if (!(strength > 0)) return 0;
  const el = time - startTime;
  if (!(el >= 0) || el >= SHAKE_DURATION) return 0;
  const k = 1 - el / SHAKE_DURATION;
  return Math.min(strength, SHAKE_MAX) * k * k;
}

// Versatz in Pixel fuer eine Achse (0 = x, 1 = y); deterministisch, nur Zeichnung.
export function shakeOffset(time, startTime, strength, axis) {
  const a = shakeAmplitude(time, startTime, strength);
  if (a === 0) return 0;
  const phase = (time - startTime) * SHAKE_FREQ + (axis ? 1.7 : 0);
  return a * Math.sin(phase);
}
