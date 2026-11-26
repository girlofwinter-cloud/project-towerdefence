// B-113: Erkennt Ton-Ereignisse aus dem Spielzustand (Schüsse, besiegte Gegner, Meteor).
// Reine Logik ohne DOM und ohne Web Audio: liest den Zustand nur, verändert ihn nie. Abgespielt wird in audio.js.
import { SOUND } from './config.js';
import { meteorPhase } from './fx-system.js';

// Merker für ein Spiel. Neues Spiel (anderes state-Objekt) oder Zeit rückwärts -> Reset ohne Ereignisse.
export function createSoundTracker() {
  return {
    state: null,
    lastTime: 0,
    lives: 0,                     // Leben im letzten Frame (Warnton, wenn sie sinken)
    seenProjectiles: new WeakSet(),
    seenEffects: new WeakSet(),   // Blitz-Effekte ('bolt')
    meteorFlights: new WeakSet(), // Meteore, deren Anflug schon zu hören war (oder verpasst ist)
    meteorImpacts: new WeakSet(), // Meteore, deren Einschlag schon ausgewertet ist
    enemies: [],                  // Gegner im letzten Frame (für Tode)
    limiter: createLimiter(),
  };
}

// Alles Aktuelle als gesehen merken, ohne Ereignisse (neues Spiel, Zeitsprung).
function absorb(tr, state) {
  tr.seenProjectiles = new WeakSet();
  tr.seenEffects = new WeakSet();
  tr.meteorFlights = new WeakSet();
  tr.meteorImpacts = new WeakSet();
  for (const p of state.projectiles || []) if (p && typeof p === 'object') tr.seenProjectiles.add(p);
  for (const e of state.effects || []) {
    if (!e || typeof e !== 'object') continue;
    tr.seenEffects.add(e);
    tr.meteorFlights.add(e);
    tr.meteorImpacts.add(e);
  }
  tr.enemies = (state.enemies || []).slice();
  tr.lives = state.lives;
}

// Ereignisse seit dem letzten Aufruf (ohne Begrenzung):
// { kind: 'shot', tower }, { kind: 'death' }, { kind: 'boss' }, { kind: 'meteorFlight' }, { kind: 'meteorImpact' },
// { kind: 'lifeLost' } (einmal je Frame, auch wenn mehrere Leben verloren gehen; Reparatur = mehr Leben = still)
export function detectSoundEvents(tr, state) {
  const out = [];
  if (!state) return out;
  const time = Number.isFinite(state.time) ? state.time : 0;
  if (tr.state !== state || time < tr.lastTime) {
    tr.state = state;
    tr.lastTime = time;
    absorb(tr, state);
    return out;
  }
  tr.lastTime = time;
  // Bei Pause und Spielende keine Schuss-Töne (neue Geschosse gelten trotzdem als gesehen)
  const shots = state.status === 'playing' && !state.paused;
  for (const p of state.projectiles || []) {
    if (!p || typeof p !== 'object' || tr.seenProjectiles.has(p)) continue;
    tr.seenProjectiles.add(p);
    if (shots && p.towerType) out.push({ kind: 'shot', tower: p.towerType });
  }
  for (const e of state.effects || []) {
    if (!e || typeof e !== 'object') continue;
    if (e.kind === 'bolt' && !tr.seenEffects.has(e)) {
      tr.seenEffects.add(e);
      if (shots) out.push({ kind: 'shot', tower: 'lightning' });
    }
    if (e.kind === 'explosion' && e.meteor) meteorEvents(tr, e, !state.paused, out);
  }
  // Tode: Gegner, die verschwunden sind und hp <= 0 hatten (Lecks und "Gegner entfernen" haben hp > 0)
  const now = state.enemies || [];
  const alive = new Set(now);
  for (const e of tr.enemies) {
    if (alive.has(e) || !(e.hp <= 0)) continue;
    out.push({ kind: e.type === 'boss' ? 'boss' : 'death' });
  }
  tr.enemies = now.slice();
  if (Number.isFinite(state.lives) && Number.isFinite(tr.lives) && state.lives < tr.lives) out.push({ kind: 'lifeLost' });
  tr.lives = state.lives;
  return out;
}

// Meteor: Anflug-Ton einmal, solange er noch fliegt; Einschlag einmal, nur wenn er frisch ist (wie fx-system meteorStep).
function meteorEvents(tr, e, running, out) {
  const p = meteorPhase(e);
  if (!tr.meteorFlights.has(e)) {
    if (p.phase !== 'flight') tr.meteorFlights.add(e); // verpasst: nicht nachholen
    else if (running) { tr.meteorFlights.add(e); out.push({ kind: 'meteorFlight' }); }
  }
  if (tr.meteorImpacts.has(e) || p.phase === 'flight' || p.phase === 'none') return;
  tr.meteorImpacts.add(e);
  if (p.phase === 'blast' && p.u <= SOUND.meteor.impactLate) out.push({ kind: 'meteorImpact' });
}

// ---------- Begrenzung ----------
// Je Art (Schuss je Turmtyp, Tod, Boss, Meteor) höchstens perWindow Töne pro window Sekunden Echtzeit.
// overrides: eigene Grenzen je Art (Warnton beim Lebensverlust seltener)
export function createLimiter(limit = SOUND.limit, overrides = { ...SOUND.limitOverrides, lifeLost: SOUND.lifeLost.limit }) {
  return { limit, overrides, slots: new Map() };
}

export function soundKey(ev) {
  return ev.kind === 'shot' ? `shot:${ev.tower}` : ev.kind;
}

// true = Ton darf spielen; now in Sekunden Echtzeit
export function allowSound(lim, key, now) {
  const limit = lim.overrides?.[key] ?? lim.limit;
  let s = lim.slots.get(key);
  if (!s || !(now >= s.start) || now - s.start >= limit.window) {
    s = { start: now, count: 0 };
    lim.slots.set(key, s);
  }
  if (s.count >= limit.perWindow) return false;
  s.count += 1;
  return true;
}

// Gemeinsame Obergrenze aller Schuss-Töne (Schlüssel '*'): erst prüfen, dann je Art, dann zählen.
const TOTAL = '*';
function totalSlot(lim, now) {
  let s = lim.slots.get(TOTAL);
  if (!s || !(now >= s.start) || now - s.start >= (lim.limit.totalWindow ?? lim.limit.window)) {
    s = { start: now, count: 0 };
    lim.slots.set(TOTAL, s);
  }
  return s;
}

// true = Ton darf spielen (Grenze je Art; Schüsse zusätzlich die gemeinsame Grenze)
export function allowEvent(lim, ev, now) {
  const key = soundKey(ev);
  if (ev.kind !== 'shot' || SOUND.totalExempt.includes(ev.kind)) return allowSound(lim, key, now);
  const total = totalSlot(lim, now);
  if (total.count >= lim.limit.total) return false;
  if (!allowSound(lim, key, now)) return false;
  total.count += 1;
  return true;
}

// Erkennen und begrenzen in einem Schritt (Aufruf pro Frame aus main.js).
export function collectSounds(tr, state, now) {
  return detectSoundEvents(tr, state).filter((ev) => allowEvent(tr.limiter, ev, now));
}

// ---------- Ton an/aus (localStorage, Speicher wird übergeben) ----------
export function loadSoundOn(storage) {
  try {
    const v = storage?.getItem(SOUND.storageKey);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch { /* Speicher nicht lesbar: Standard */ }
  return SOUND.defaultOn;
}

export function saveSoundOn(storage, on) {
  try { storage?.setItem(SOUND.storageKey, on ? '1' : '0'); } catch { /* Speicher voll oder gesperrt */ }
}
