// Reine Darstellungs-Helfer fürs HUD (kein DOM).
import { START_LIVES, MAX_WAVES, ENEMY_TYPES, BOSS_BAR, AUTO_WAVE_SETTING, isBoss } from './config.js';
import { earlyStartPreview } from './game.js';

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

// B-005: Zustand des Knopfs „Welle starten“. Während einer Welle wird er bedienbar, sobald alle ihre Gegner
// gespawnt sind (bis zur letzten Welle), und zeigt dann den Frühstart-Bonus (B-123: sinkt mit jedem besiegten Gegner).
export function startButtonView(state) {
  const spawning = state.waveActive && state.spawnQueue.length > 0;
  const canStart = state.status === 'playing' && state.wave < MAX_WAVES && !spawning;
  const next = state.wave + 1;
  let label = `Welle ${next} starten`;
  if (state.waveActive) {
    if (state.wave >= MAX_WAVES) label = 'Letzte Welle läuft…';
    else label = spawning ? 'Welle läuft…' : `Nächste Welle +${earlyStartPreview(state)}`;
  } else if (canStart && state.autoWaveIn != null) {
    // B-121: Countdown bis zum automatischen Start (ganze Sekunden, aufgerundet); Klick startet sofort
    label = `Welle ${next} in ${Math.max(1, Math.ceil(state.autoWaveIn))}…`;
  }
  return { disabled: !canStart, label, showKey: canStart };
}

// C-Abnahme 5: Fortschritt der laufenden Welle für die Füllung im Wellenknopf (nur Anzeige).
// Offen = noch zu spawnende plus lebende Gegner; peak = größter bisher gesehener Wert dieser Welle (main.js merkt ihn sich).
// Liefert den neuen peak und fill 0..1 (Anteil besiegter bzw. durchgelaufener Gegner); ohne laufende Welle 0.
export function waveProgress(state, peak = 0) {
  if (!state.waveActive) return { peak: 0, fill: 0 };
  const open = (state.spawnQueue?.length || 0) + (state.enemies?.length || 0);
  const top = Math.max(Number.isFinite(peak) ? peak : 0, open);
  return { peak: top, fill: top > 0 ? Math.min(1, Math.max(0, 1 - open / top)) : 0 };
}

// B-180: Boss-Leisten (nur Anzeige). Eine Ansicht je lebendem Boss, die Nekromantin zuerst; mehr als max Bosse
// zählen in der letzten Leiste zusammen. Ansicht: { name, frac 0..1, phase (0 = ohne Phasen, 1, 2), shielded }.
export function bossBarViews(state, max = BOSS_BAR.maxBars) {
  const time = Number.isFinite(state?.time) ? state.time : 0;
  const bosses = (state?.enemies || []).filter((e) => e && isBoss(e) && e.hp > 0);
  bosses.sort((a, b) => (b.type === 'necro') - (a.type === 'necro'));
  const view = (list) => {
    const hp = list.reduce((s, e) => s + (Number.isFinite(e.hp) ? e.hp : 0), 0);
    const maxHp = list.reduce((s, e) => s + (Number.isFinite(e.maxHp) ? e.maxHp : 0), 0);
    const one = list.length === 1;
    const def = ENEMY_TYPES[list[0].type];
    const same = list.every((e) => e.type === list[0].type);
    return {
      name: one ? def.name : `${same ? def.name : 'Bosse'} ×${list.length}`,
      frac: maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0,
      phase: one && def.phase2 ? (list[0].phase === 2 ? 2 : 1) : 0,
      shielded: list.some((e) => e.shieldUntil > time),
    };
  };
  const n = Math.max(1, max);
  if (bosses.length <= n) return bosses.map((e) => view([e]));
  return [...bosses.slice(0, n - 1).map((e) => view([e])), view(bosses.slice(n - 1))];
}

// B-180: Lage der Boss-Leiste auf dem Desktop: mittig in der Lücke zwischen HUD-Leiste (rechter Rand) und runden
// Knöpfen (linker Rand), Breite BOSS_BAR.width; ist die Lücke schmaler als width + gapPad, Breite = Lücke - gapPad.
export function bossBarPlacement(hudRight, buttonsLeft, width = BOSS_BAR.width, pad = BOSS_BAR.gapPad) {
  const gap = buttonsLeft - hudRight;
  if (!Number.isFinite(gap)) return null;
  const w = Math.max(0, gap < width + pad ? gap - pad : width);
  return { left: hudRight + (gap - w) / 2, width: w };
}

// Lücke zu schmal (unter BOSS_BAR.minWidth, z. B. mit Albtraum-Plakette): Leiste in voller Breite unter die HUD-Leiste,
// rechtsbündig mit deren rechtem Rand (nie links aus dem Bild). Sonst die Lage aus bossBarPlacement mit top = BOSS_BAR.top.
export function bossBarLayout(hudLeft, hudRight, hudBottom, buttonsLeft) {
  const p = bossBarPlacement(hudRight, buttonsLeft);
  if (!p) return null;
  if (p.width >= BOSS_BAR.minWidth) return { ...p, top: BOSS_BAR.top };
  return { left: Math.max(hudLeft, hudRight - BOSS_BAR.width), width: BOSS_BAR.width, top: hudBottom + BOSS_BAR.gapPad };
}

// Schalter Auto-Start: gespeicherte Wahl lesen und schreiben (Speicher fehlt oder wirft: Standard bzw. nichts tun).
export function loadAutoWave(storage) {
  try {
    const v = storage?.getItem(AUTO_WAVE_SETTING.storageKey);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch { /* Speicher nicht lesbar: Standard */ }
  return AUTO_WAVE_SETTING.defaultOn;
}
export function saveAutoWave(storage, on) {
  try { storage?.setItem(AUTO_WAVE_SETTING.storageKey, on ? '1' : '0'); } catch { /* Speicher voll oder gesperrt */ }
}

// B-183: kleine Gold-Anzeige im HUD (nur Albtraum). check = Ergebnis von checkGoldCondition ({ ok, label }).
// Zeichen statt Emoji: ✓ noch erfüllt, ✗ verletzt. Ohne Albtraum oder ohne Bedingung: hidden.
export function goldGoalView(mode, check) {
  if (mode !== 'nightmare' || !check?.label) return { hidden: true, ok: false, text: '', mark: '', title: '' };
  const ok = check.ok === true;
  return {
    hidden: false,
    ok,
    text: `Gold: ${check.label}`,
    mark: ok ? '✓' : '✗',
    title: `Gold-Bedingung ${ok ? 'noch erfüllt' : 'verletzt'}: ${check.label}`,
  };
}

// B-193: Meldung beim Verpassen der Gold-Bedingung (Bauvorlage Albtraum-Gold-Anzeige). Silber ist noch möglich,
// solange in diesem Spiel kein Leben verloren ging (state.track.livesLost).
export function goldMissedText(state) {
  return state?.track?.livesLost > 0 ? 'Gold verpasst' : 'Gold verpasst – Silber ist noch möglich';
}
