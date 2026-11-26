// B-113: Erkennt Ton-Ereignisse aus dem Spielzustand (Schüsse, besiegte Gegner, Meteor).
// Reine Logik ohne DOM und ohne Web Audio: liest den Zustand nur, verändert ihn nie. Abgespielt wird in audio.js.
import { SOUND, isBoss } from './config.js';
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
    towers: new Map(),            // B-115: Turm -> Stufe im letzten Frame (Bauen, Ausbauen, Verkaufen)
    waveActive: false,            // B-115: Welle lief im letzten Frame (Wellenstart)
    wave: 0,                      // B-005: Wellennummer im letzten Frame (vorzeitiger Wellenstart)
    status: 'playing',            // B-115: Status im letzten Frame (Sieg, Niederlage)
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
  tr.towers = towerLevels(state);
  tr.waveActive = !!state.waveActive;
  tr.wave = state.wave;
  tr.status = state.status;
}

function towerLevels(state) {
  const m = new Map();
  for (const t of state.towers || []) if (t && typeof t === 'object') m.set(t, t.level);
  return m;
}

// Ereignisse seit dem letzten Aufruf (ohne Begrenzung):
// { kind: 'shot', tower }, { kind: 'death', enemy }, { kind: 'boss' }, { kind: 'meteorFlight' }, { kind: 'meteorImpact' },
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
    out.push(isBoss(e) ? { kind: 'boss' } : { kind: 'death', enemy: e.type });
  }
  tr.enemies = now.slice();
  if (Number.isFinite(state.lives) && Number.isFinite(tr.lives) && state.lives < tr.lives) out.push({ kind: 'lifeLost' });
  tr.lives = state.lives;
  return out;
}

// B-115: Ereignis-Töne aus Zustandswechseln, je Art höchstens einmal pro Frame:
// { kind: 'build' }, { kind: 'upgrade' }, { kind: 'sell' }, { kind: 'waveStart' }, { kind: 'won' }, { kind: 'lost' }
// Abgelehnte Aktionen ändern nichts und bleiben still. Neues Spiel oder Zeit rückwärts -> nur merken (wie oben).
export function detectStateEvents(tr, state) {
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
  const now = towerLevels(state);
  let built = false, upgraded = false, sold = false;
  for (const [t, level] of now) {
    if (!tr.towers.has(t)) built = true;
    else if (level > tr.towers.get(t)) upgraded = true;
  }
  for (const t of tr.towers.keys()) if (!now.has(t)) sold = true;
  tr.towers = now;
  if (built) out.push({ kind: 'build' });
  if (upgraded) out.push({ kind: 'upgrade' });
  if (sold) out.push({ kind: 'sell' });
  const active = !!state.waveActive;
  // Wellenstart: Welle beginnt, oder (B-005) die nächste Welle startet vorzeitig, während eine läuft
  const started = !tr.waveActive || state.wave > tr.wave;
  if (active && started && state.status === 'playing') out.push({ kind: 'waveStart' });
  tr.waveActive = active;
  tr.wave = state.wave;
  if (state.status !== tr.status && (state.status === 'won' || state.status === 'lost')) out.push({ kind: state.status });
  tr.status = state.status;
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
// B-115: Ereignis-Töne mit eigener Grenze aus SOUND.events (zählen nie gegen die gemeinsame Schuss-Grenze)
function eventLimits() {
  const o = {};
  for (const [k, def] of Object.entries(SOUND.events)) o[k] = def.limit;
  return o;
}

export function createLimiter(limit = SOUND.limit, overrides = { ...SOUND.limitOverrides, lifeLost: SOUND.lifeLost.limit, ...eventLimits() }) {
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
  // Kanone (totalExemptShots): nie von der gemeinsamen Grenze verschluckt, zählt aber mit
  if (total.count >= lim.limit.total && !SOUND.totalExemptShots.includes(ev.tower)) return false;
  if (!allowSound(lim, key, now)) return false;
  total.count += 1;
  return true;
}

// Erkennen und begrenzen in einem Schritt (Aufruf pro Frame aus main.js).
export function collectSounds(tr, state, now) {
  const evs = [...detectSoundEvents(tr, state), ...detectStateEvents(tr, state)];
  return evs.filter((ev) => allowEvent(tr.limiter, ev, now));
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

// ---------- B-114: Aufnahmen (Zuordnung, Variante, Ersatz) ----------
// Standard: Aufnahmen der Schüsse usw. (B-114) und der Ereignis-Töne (B-115). Einzelne Gruppe oder Liste erlaubt.
const SAMPLE_GROUPS = [SOUND.samples, SOUND.eventSamples];
const groupsOf = (samples) => (Array.isArray(samples) ? samples : [samples]);

// Alle zu ladenden Dateien: [{ key, url }] (key wie soundKey, url relativ zur Seite)
export function sampleUrls(samples = SAMPLE_GROUPS) {
  const out = [];
  for (const group of groupsOf(samples)) {
    for (const [key, def] of Object.entries(group.sounds)) {
      for (const f of def.files || []) out.push({ key, url: `${group.base}${f}.m4a` });
    }
  }
  return out;
}

// Wahl für ein Ereignis. buffers: Map key -> geladene Varianten. rnd() liefert [0, 1).
// { type: 'sample', buffer, gain, rate } oder { type: 'synth' } (keine Aufnahme geladen: Synthese als Ersatz)
export function planSound(ev, buffers, rnd = Math.random, samples = SAMPLE_GROUPS) {
  const key = soundKey(ev);
  const group = groupsOf(samples).find((g) => Object.hasOwn(g.sounds, key));
  const def = group && group.sounds[key];
  const list = def && buffers && typeof buffers.get === 'function' ? buffers.get(key) : null;
  if (!list || list.length === 0) return { type: 'synth' };
  const i = Math.min(list.length - 1, Math.floor(rnd() * list.length));
  // Grund-Tonhöhe (rate) und je Gegnertyp (enemyRate), dazu zufällige Variation
  const base = (def.rate ?? 1) * (def.enemyRate?.[ev.enemy] ?? 1);
  const rate = base * (1 + (rnd() * 2 - 1) * (def.pitchVar || 0));
  return { type: 'sample', buffer: list[i], gain: def.gain, rate };
}

// ---------- B-116: Hintergrundmusik (reine Logik) ----------
// B-118: URL des Titels für eine Karte; Karten ohne Eintrag in byMap (oder ohne mapId) -> Rückfall cfg.file
export function musicUrl(cfg = SOUND.music, mapId) {
  const byMap = cfg.byMap || {};
  const name = mapId != null && Object.hasOwn(byMap, mapId) ? byMap[mapId].file : cfg.file;
  return `${cfg.base}${name}.m4a`;
}

// B-118: Lautstärkefaktor eines Titels (nach URL, damit der Rückfalltitel seinen eigenen Faktor behält);
// Titel ohne Eintrag oder ohne gültigen Faktor -> 1
export function musicGainFactor(url, cfg = SOUND.music) {
  for (const [id, entry] of Object.entries(cfg.byMap || {})) {
    if (musicUrl(cfg, id) === url && Number.isFinite(entry.gain) && entry.gain >= 0) return entry.gain;
  }
  return 1;
}

// B-118: welcher Titel laufen soll. failed: URLs, deren Laden gescheitert ist.
// Kartentitel gescheitert -> Rückfalltitel; auch der gescheitert -> null (keine Musik).
export function pickMusicUrl(mapId, failed = [], cfg = SOUND.music) {
  const bad = new Set(failed);
  for (const url of [musicUrl(cfg, mapId), musicUrl(cfg)]) if (!bad.has(url)) return url;
  return null;
}

// Ziel-Lautstärke der Musik: aus bei Ton aus und nach Sieg/Niederlage, bei Pause leiser.
// B-118: url = laufender Titel, dessen Faktor (musicGainFactor) auf gain wirkt.
export function musicLevel({ soundOn, status, paused, url }, cfg = SOUND.music) {
  if (!soundOn || status !== 'playing') return 0;
  const gain = cfg.gain * musicGainFactor(url, cfg);
  return paused ? gain * cfg.pausedFactor : gain;
}

// Übergang von current zu next: null = nichts zu tun, sonst { target, time } (Dauer der linearen Rampe in s).
// Von 0 aus einblenden (fadeIn), auf 0 ausblenden (fadeOut), sonst fadeChange.
export function musicRamp(current, next, cfg = SOUND.music) {
  if (!Number.isFinite(next) || Math.abs(next - current) < 1e-9) return null;
  const time = !(current > 0) ? cfg.fadeIn : next <= 0 ? cfg.fadeOut : cfg.fadeChange;
  return { target: next, time };
}

// Schleifenpunkte ohne Stille an den Rändern. channels: Liste von Sample-Arrays (gleich lang).
// Liefert { start, end } in Sekunden; ganz still, ungültig oder kürzer als minLoop -> ganze Länge.
export function findLoopPoints(channels, sampleRate, threshold = SOUND.music.silence, minLoop = SOUND.music.minLoop) {
  const n = channels && channels.length ? Math.min(...channels.map((c) => c.length)) : 0;
  const whole = { start: 0, end: sampleRate > 0 ? n / sampleRate : 0 };
  if (!(n > 0) || !(sampleRate > 0)) return whole;
  const loud = (i) => channels.some((c) => Math.abs(c[i]) > threshold);
  let a = 0;
  while (a < n && !loud(a)) a++;
  if (a >= n) return whole;
  let e = n - 1;
  while (e > a && !loud(e)) e--;
  const start = a / sampleRate;
  const end = (e + 1) / sampleRate;
  return end - start >= minLoop ? { start, end } : whole;
}
