// B-180: Boss-Lebensleiste im HUD (DOM, Bauvorlage docs/design/elemente/HUD-Bossleiste.md). Liest den Spielzustand
// nur; Ansichten und Lage rechnet src/hud.js. Nach dem Tod des letzten Bosses steht die leere Leiste noch
// BOSS_BAR.fadeAfter Sekunden, dann verschwindet sie. ui.bossBarShown sagt render.js, dass über Bossen kein
// kleiner Lebensbalken nötig ist.
import { BOSS_BAR, ENEMY_TYPES } from './config.js';
import { bossBarViews, bossBarPlacement } from './hud.js';

const PHASE_TEXT = ['', 'Phase I', 'Phase II'];

// B-193: Zusatz zur Ansicht (Albtraum-Holz): Prozent gerundet 0–100, Krone statt Schädel beim Oger-König
export function bossBarExtras(v) {
  const f = Number.isFinite(v?.frac) ? Math.max(0, Math.min(1, v.frac)) : 0;
  const crown = typeof v?.name === 'string' && v.name.startsWith(ENEMY_TYPES.boss.name);
  return { pct: Math.round(f * 100), crown };
}

export function createBossBars(doc = document) {
  const box = doc.getElementById('boss-bars');
  if (!box) return () => {};
  const bars = [...box.querySelectorAll('.boss-bar')].map((el) => ({
    el,
    name: el.querySelector('.bb-name'),
    phase: el.querySelector('.bb-phase'),
    track: el.querySelector('.bb-track'),
    pct: el.querySelector('.bb-pct'),
    key: '',
    pctText: '',
  }));
  let last = [];
  let goneAt = null;
  let lastState = null; // neues Spiel (Neustart): alte Leiste sofort verwerfen

  function place() {
    const hud = doc.getElementById('hud-bar')?.getBoundingClientRect();
    const btn = doc.querySelector('.top-buttons')?.getBoundingClientRect();
    // B-193: sichtbare Albtraum-Plakette rechts neben dem HUD: Leiste rückt daneben
    const plq = doc.getElementById('nm-plaque');
    const plqRight = plq && !plq.hidden ? plq.getBoundingClientRect().right : 0;
    const p = hud && btn ? bossBarPlacement(Math.max(hud.right, plqRight || 0), btn.left) : null;
    if (!p) return;
    box.style.setProperty('--bb-left', `${Math.round(p.left)}px`);
    box.style.setProperty('--bb-w', `${Math.round(p.width)}px`);
  }

  // now: Sekunden (Echtzeit der Oberfläche, nur fürs Ausblenden)
  return function update(state, ui, now) {
    if (state !== lastState) { lastState = state; last = []; goneAt = null; }
    let views = bossBarViews(state);
    if (views.length) { last = views; goneAt = null; }
    else if (last.length) {
      if (goneAt === null) goneAt = now;
      if (now - goneAt < BOSS_BAR.fadeAfter) views = last.map((v) => ({ ...v, frac: 0, shielded: false }));
      else last = [];
    }
    const show = views.length > 0;
    if (box.hidden === show) box.hidden = !show;
    if (ui) ui.bossBarShown = show;
    if (!show) return;
    place();
    bars.forEach((b, i) => {
      const v = views[i];
      if (b.el.hidden === !!v) b.el.hidden = !v;
      if (!v) return;
      const key = `${v.name}|${v.phase}`;
      if (key !== b.key) {
        b.key = key;
        b.name.textContent = v.name;
        b.phase.textContent = PHASE_TEXT[v.phase] || '';
        b.el.classList.toggle('p2', v.phase === 2);
        b.el.classList.toggle('king', bossBarExtras(v).crown);
      }
      b.el.classList.toggle('shielded', v.shielded);
      b.el.style.setProperty('--f', v.frac.toFixed(3));
      b.track.setAttribute('aria-valuenow', String(Math.round(v.frac * 100)));
      const pct = `${bossBarExtras(v).pct}%`;
      if (b.pct && pct !== b.pctText) { b.pctText = pct; b.pct.textContent = pct; }
    });
  };
}
