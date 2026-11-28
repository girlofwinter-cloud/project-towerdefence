// B-113/B-114: Töne mit der Web-Audio-API. Bevorzugt Aufnahmen (assets/sounds, geladen nach der ersten
// Nutzeraktion), sonst Synthese (Oszillatoren, Rauschen-Buffer, Hüllkurven) als Ersatz.
// Ohne Web Audio (Node, alte Browser) tun alle Funktionen nichts.
import { SOUND } from './config.js';
import { sampleUrls, planSound, pickMusicUrl, musicLevel, musicRamp, findLoopPoints, clampVolume, sfxGain } from './sound-events.js';

// B-188: volume = Schieber Musik und Effekte (0..1)
const audio = { ctx: null, master: null, noise: null, on: SOUND.defaultOn, buffers: new Map(), samplesSettled: false,
  volume: { music: SOUND.defaultVolume, sfx: SOUND.defaultVolume } };
// B-116/B-118: Musik. tracks: Cache je URL { state: 'loading' | 'ready' | 'failed', buffer, loop };
// url/src/gain/level = laufender Titel (level = zuletzt angesteuerte Lautstärke); broken = Musik ganz aus.
const music = { tracks: new Map(), url: null, src: null, gain: null, level: 0, broken: false };

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
      audio.master.gain.value = sfxGain(audio.volume.sfx);
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
  if (!audio.on) musicSilence(); // beim Wiedereinschalten neu einblenden
  if (!audio.on && audio.ctx && audio.ctx.state === 'running') audio.ctx.suspend().catch(() => {});
}

// B-188: Lautstärke setzen. Effekte sofort am Master, Musik im nächsten updateMusic (kurze Rampe).
export function setVolumes({ music, sfx } = {}) {
  audio.volume = { music: clampVolume(music), sfx: clampVolume(sfx) };
  if (audio.master) audio.master.gain.value = sfxGain(audio.volume.sfx);
}

// Lädt alle Aufnahmen im Hintergrund. Fehler (fehlende Datei, Dekodieren) bleiben still: dann Synthese.
function loadSamples(ctx) {
  if (typeof fetch !== 'function' || typeof ctx.decodeAudioData !== 'function') { audio.samplesSettled = true; return; }
  const loads = sampleUrls().map(({ key, url }) => loadBuffer(ctx, url)
    .then((buf) => {
      if (!buf) return;
      if (!audio.buffers.has(key)) audio.buffers.set(key, []);
      audio.buffers.get(key).push(buf);
    })
    .catch(() => { /* fehlt oder defekt: Synthese bleibt der Ersatz */ }));
  // B-116: Musik erst laden, wenn alle Effekt-Dateien fertig (oder gescheitert) sind
  Promise.all(loads).then(() => { audio.samplesSettled = true; });
}

// Datei holen und dekodieren (Promise mit AudioBuffer)
function loadBuffer(ctx, url) {
  return Promise.resolve()
    .then(() => fetch(url))
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((data) => new Promise((resolve, reject) => {
      // Promise- und alte Callback-Form (Safari) zugleich abdecken
      const p = ctx.decodeAudioData(data, resolve, reject);
      if (p && typeof p.then === 'function') p.then(resolve, reject);
    }));
}

// ---------- B-116: Hintergrundmusik ----------
// Einen Titel laden, jede URL nur einmal (still bei Fehlern: Titel gilt als gescheitert, keine Synthese-Musik)
function loadMusic(ctx, url) {
  const track = { state: 'loading', buffer: null, loop: null };
  music.tracks.set(url, track);
  if (typeof fetch !== 'function' || typeof ctx.decodeAudioData !== 'function') { track.state = 'failed'; return; }
  loadBuffer(ctx, url)
    .then((buf) => {
      if (!buf || typeof buf.getChannelData !== 'function') throw new Error('kein Buffer');
      const chans = [];
      for (let c = 0; c < buf.numberOfChannels; c++) chans.push(buf.getChannelData(c));
      track.loop = findLoopPoints(chans, buf.sampleRate);
      track.buffer = buf;
      track.state = 'ready';
    })
    .catch(() => { track.state = 'failed'; });
}

// URLs, deren Laden gescheitert ist
function failedMusicUrls() {
  return [...music.tracks].filter(([, t]) => t.state === 'failed').map(([url]) => url);
}

// Schleife starten (Gain bei 0, eingeblendet wird über updateMusic). Eigener Gain direkt zum Ausgang.
function startMusic(ctx, url, track) {
  music.gain = ctx.createGain();
  music.gain.gain.value = 0;
  music.gain.connect(ctx.destination);
  const src = ctx.createBufferSource();
  src.buffer = track.buffer;
  src.loop = true;
  src.loopStart = track.loop.start;
  src.loopEnd = track.loop.end;
  src.connect(music.gain);
  src.start(ctx.currentTime, track.loop.start);
  music.url = url;
  music.src = src;
  music.level = 0;
}

// B-118: laufenden Titel mit fadeOut ausblenden und danach stoppen (Kartenwechsel)
function stopMusic(ctx) {
  const { src, gain, level } = music;
  music.url = null;
  music.src = null;
  music.gain = null;
  music.level = 0;
  if (!src) return;
  const r = musicRamp(level, 0);
  const t = ctx.currentTime;
  const p = gain.gain;
  const from = Number.isFinite(p.value) ? p.value : level;
  p.cancelScheduledValues(t);
  p.setValueAtTime(from, t);
  if (r) p.linearRampToValueAtTime(0, t + r.time);
  // B-119: nach dem Ende Quelle und Gain trennen, sonst bleibt je Kartenwechsel ein toter Knoten am Ausgang
  src.onended = () => {
    try { src.disconnect(); gain.disconnect(); } catch { /* Musik ist Beiwerk */ }
  };
  src.stop(t + (r ? r.time : 0));
}

// Musik sofort stumm (Ton aus); nächstes updateMusic blendet wieder ein
function musicSilence() {
  if (!music.gain || !audio.ctx) return;
  try {
    const p = music.gain.gain;
    p.cancelScheduledValues(audio.ctx.currentTime);
    p.setValueAtTime(0, audio.ctx.currentTime);
  } catch { /* Musik ist Beiwerk */ }
  music.level = 0;
}

// Pro Frame aus main.js: lädt den Titel der Karte (nach den Effekten), wechselt bei neuer Karte, sobald
// der neue Titel geladen ist (alten aus-, neuen einblenden), und blendet je nach Spielstatus.
// B-187: mode 'nightmare' wählt den Albtraum-Titel; Moduswechsel wechselt den Titel wie ein Kartenwechsel.
export function updateMusic({ status, paused, mapId, mode } = {}) {
  const ctx = audio.ctx;
  if (!audio.on || !ctx || ctx.state !== 'running' || music.broken || !audio.samplesSettled) return;
  try {
    const url = pickMusicUrl(mapId, failedMusicUrls(), undefined, mode);
    const track = url ? music.tracks.get(url) : null;
    if (url && !track) loadMusic(ctx, url);
    // Wechsel erst, wenn der neue Titel bereit ist (bis dahin läuft der alte weiter; scheitert das Laden,
    // ist der Rückfall oft der laufende Titel, dann gibt es gar keinen Wechsel)
    if (track?.state === 'ready') {
      if (music.src && music.url !== url) stopMusic(ctx);
      if (!music.src) startMusic(ctx, url, track);
    } else if (!url && music.src) stopMusic(ctx);
    if (!music.src) return;
    const r = musicRamp(music.level, musicLevel({ soundOn: audio.on, status, paused, url: music.url, volume: audio.volume.music }));
    if (!r) return;
    const p = music.gain.gain;
    const t = ctx.currentTime;
    // laufende Rampe am aktuellen Wert abholen (sonst Sprung)
    const from = Number.isFinite(p.value) ? p.value : music.level;
    p.cancelScheduledValues(t);
    p.setValueAtTime(from, t);
    p.linearRampToValueAtTime(r.target, t + r.time);
    music.level = r.target;
  } catch { music.broken = true; /* Musik ist Beiwerk: Fehler nie ins Spiel durchreichen */ }
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
