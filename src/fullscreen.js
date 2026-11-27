// B-178: Vollbild auf Wunsch (vor allem Handy im Querformat, damit die Browserleisten verschwinden).
// Kapselt die Fullscreen-API samt webkit-Präfix (ältere Safari, iPad). iPhone-Safari kann das für Seiten nicht:
// dort ist supported false und der Knopf bleibt versteckt (Vollbild nur über "Zum Home-Bildschirm", B-179).
// doc/scr werden übergeben, damit die Logik in Node testbar bleibt.

export function fullscreenControl(doc, scr) {
  const std = typeof doc.documentElement?.requestFullscreen === 'function';
  const wk = !std && typeof doc.documentElement?.webkitRequestFullscreen === 'function';
  const enabled = std ? doc.fullscreenEnabled !== false : wk ? doc.webkitFullscreenEnabled !== false : false;

  const current = () => doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;

  async function enter(el, lockLandscape) {
    if (std) await el.requestFullscreen({ navigationUI: 'hide' });
    else await el.webkitRequestFullscreen();
    // Querformat festhalten geht nur im Vollbild und nur auf Handy/Tablet; sonst lehnt der Browser ab, das ist ok
    if (lockLandscape) await scr?.orientation?.lock?.('landscape')?.catch?.(() => {});
  }

  async function exit() {
    scr?.orientation?.unlock?.();
    if (std) await doc.exitFullscreen();
    else await doc.webkitExitFullscreen();
  }

  return {
    supported: enabled,
    isOn: () => current() !== null,
    // Schaltet um; Fehler (z. B. ohne Nutzeraktion) werden geschluckt, das Spiel läuft normal weiter.
    async toggle(el, lockLandscape = false) {
      if (!enabled) return false;
      try {
        if (current()) await exit(); else await enter(el, lockLandscape);
      } catch { /* Browser hat abgelehnt */ }
      return current() !== null;
    },
    onChange(fn) {
      doc.addEventListener('fullscreenchange', fn);
      doc.addEventListener('webkitfullscreenchange', fn);
    },
  };
}
