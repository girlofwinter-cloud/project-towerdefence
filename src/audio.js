// B-113/B-114: Töne mit der Web-Audio-API. Bevorzugt Aufnahmen (assets/sounds, geladen nach der ersten
// Nutzeraktion), sonst Synthese (Oszillatoren, Rauschen-Buffer, Hüllkurven) als Ersatz.
// Ohne Web Audio (Node, alte Browser) tun alle Funktionen nichts.
import { SOUND } from './config.js';
import { sampleUrls, planSound } from './sound-events.js';

const audio = { ctx: null, master: null, noise: null, on: SOUND.defaultOn, buffers: new Map() };

function AudioCtor() {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

// Erst nach einer Nutzeraktion aufrufen (Autoplay-Regeln): erzeugt bzw. weckt den AudioContext.
export function unlockAudio() {
  if (!audio.on) return;
  const Ctor = AudioCtor();
  if (!Ctor) return;
  try {
    if (!audio.ctx) {
      audio.ctx = new Ctor();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = SOUND.masterGain;
      // Tiefpass am Master gegen Schärfe
      const soft = audio.ctx.createBiquadFilter();
      soft.type = 'lowpass';
      soft.frequency.value = SOUND.masterLowpass;
      soft.Q.value = SOUND.masterLowpassQ;
      audio.master.connect(soft);
      soft.connect(audio.ctx.destination);
      audio.noise = makeNoise(audio.ctx);
      loadSamples(audio.ctx);
    }
    if (audio.ctx.state === 'suspended') audio.ctx.resume().catch(() => {});
  } catch { audio.ctx = null; }
}

// Setzt nur den An/Aus-Zustand; den Context erzeugt erst unlockAudio() bei einer Nutzeraktion.
export function setSoundOn(on) {
  audio.on = !!on;
  if (!audio.on && audio.ctx && audio.ctx.state === 'running') audio.ctx.suspend().catch(() => {});
}

// Lädt alle Aufnahmen im Hintergrund. Fehler (fehlende Datei, Dekodieren) bleiben still: dann Synthese.
function loadSamples(ctx) {
  if (typeof fetch !== 'function' || typeof ctx.decodeAudioData !== 'function') return;
  for (const { key, url } of sampleUrls()) {
    Promise.resolve()
      .then(() => fetch(url))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((data) => new Promise((resolve, reject) => {
        // Promise- und alte Callback-Form (Safari) zugleich abdecken
        const p = ctx.decodeAudioData(data, resolve, reject);
        if (p && typeof p.then === 'function') p.then(resolve, reject);
      }))
      .then((buf) => {
        if (!buf) return;
        if (!audio.buffers.has(key)) audio.buffers.set(key, []);
        audio.buffers.get(key).push(buf);
      })
      .catch(() => { /* fehlt oder defekt: Synthese bleibt der Ersatz */ });
  }
}

// Aufnahme abspielen: Variante mit Tonhöhe (playbackRate) und Lautstärke über den Master (Tiefpass)
function playSample(ctx, plan) {
  const src = ctx.createBufferSource();
  src.buffer = plan.buffer;
  src.playbackRate.value = plan.rate;
  const g = ctx.createGain();
  g.gain.value = plan.gain;
  src.connect(g);
  g.connect(audio.master);
  src.start(ctx.currentTime);
}

// Gemeinsamer Rauschen-Buffer (weißes Rauschen)
function makeNoise(ctx) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * SOUND.noiseLength));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// Hüllkurve: schneller Anstieg auf gain, dann exponentiell abfallen bis floorGain
function envelope(ctx, t, layer) { // t = Startzeit der Lage
  const g = ctx.createGain();
  const attack = layer.attack ?? SOUND.attack;
  g.gain.setValueAtTime(SOUND.floorGain, t);
  g.gain.exponentialRampToValueAtTime(Math.max(SOUND.floorGain, layer.gain), t + attack);
  g.gain.exponentialRampToValueAtTime(SOUND.floorGain, t + Math.max(attack, layer.duration));
  g.connect(audio.master);
  return g;
}

function playLayer(ctx, t0, layer, pitch) {
  const t = t0 + (layer.delay || 0);
  const env = envelope(ctx, t, layer);
  const end = t + layer.duration;
  if (layer.type === 'noise') {
    const src = ctx.createBufferSource();
    src.buffer = audio.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = layer.filter;
    f.frequency.setValueAtTime(layer.cutoff * pitch, t);
    // optional: Filter gleitet zum Endwert (z. B. Pfeil-Flug)
    if (layer.endCutoff) f.frequency.exponentialRampToValueAtTime(layer.endCutoff * pitch, end);
    f.Q.value = layer.q;
    src.connect(f);
    f.connect(env);
    src.start(t);
    src.stop(end);
  } else {
    const osc = ctx.createOscillator();
    osc.type = layer.wave;
    osc.frequency.setValueAtTime(layer.freq * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(layer.endFreq * pitch, end);
    osc.connect(env);
    osc.start(t);
    osc.stop(end);
  }
}

function layersFor(ev) {
  if (ev.kind === 'shot') return { layers: SOUND.shots[ev.tower], pitchVar: SOUND.shotPitchVar[ev.tower] || 0 };
  if (ev.kind === 'death') return SOUND.death;
  if (ev.kind === 'boss') return SOUND.boss;
  if (ev.kind === 'lifeLost') return SOUND.lifeLost;
  if (ev.kind === 'meteorFlight') return { layers: SOUND.meteor.flight, pitchVar: 0 };
  if (ev.kind === 'meteorImpact') return { layers: SOUND.meteor.impact, pitchVar: 0 };
  if (Object.hasOwn(SOUND.events, ev.kind)) return SOUND.events[ev.kind]; // B-115
  return null;
}

// Spielt ein Ereignis aus sound-events.js ab (nur wenn Ton an und der Context läuft).
export function playSound(ev) {
  const ctx = audio.ctx;
  if (!audio.on || !ctx || ctx.state !== 'running') return;
  try {
    const plan = planSound(ev, audio.buffers);
    if (plan.type === 'sample') { playSample(ctx, plan); return; }
  } catch { /* Aufnahme ging schief: Synthese versuchen */ }
  const def = layersFor(ev);
  if (!def || !def.layers) return;
  const pitch = 1 + (Math.random() * 2 - 1) * (def.pitchVar || 0);
  try {
    const t = ctx.currentTime;
    for (const layer of def.layers) playLayer(ctx, t, layer, pitch);
  } catch { /* Ton ist Beiwerk: Fehler nie ins Spiel durchreichen */ }
}
