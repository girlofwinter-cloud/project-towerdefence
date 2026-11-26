// Testseite: Werkzeug-Panel für manuelles Testen (Karte, Welle, Gold, Tempo, Spielende).
// Wird von main.js nur im Testmodus geladen (test.html bzw. index.html?test).
import { MAPS, MAX_WAVES, TEST_TOOLS } from './config.js';
import { prepareWave, clearEnemies, applyCheats, resetCooldowns, forceEnd, clampWave } from './test-tools.js';

// api: { getState, ui, restartOn(mapId), resume(), refresh }
export function mountTestPanel(api) {
  const opts = { infiniteGold: true, invincible: false };
  document.body.classList.add('test-mode');
  document.title = '🧪 Test · Project TowerDefence';

  const panel = document.createElement('section');
  panel.id = 'test-panel';
  panel.innerHTML = `
    <h3>🧪 Testmodus</h3>
    <p class="tp-note">Alle Karten offen · Fortschritt wird nicht gespeichert</p>
    <div class="tp-row">
      <label>Karte <select id="tp-map"></select></label>
      <label>Welle <input id="tp-wave" type="number" min="1" max="${MAX_WAVES}" value="1" /></label>
    </div>
    <div class="tp-row">
      <button id="tp-new" title="Neues Spiel auf der Karte, direkt vor der gewählten Welle">Neues Spiel ab Welle</button>
      <button id="tp-jump" title="Türme bleiben stehen, Gegner werden entfernt">Zu Welle springen</button>
    </div>
    <div class="tp-row">
      <label><input id="tp-gold" type="checkbox" checked /> Unbegrenztes Gold</label>
      <label><input id="tp-lives" type="checkbox" /> Unverwundbar</label>
    </div>
    <div class="tp-row" id="tp-speeds"></div>
    <div class="tp-row">
      <button id="tp-clear">Gegner entfernen</button>
      <button id="tp-cool">Fähigkeiten laden</button>
    </div>
    <div class="tp-row">
      <button id="tp-win">Sieg erzwingen</button>
      <button id="tp-lose">Niederlage erzwingen</button>
    </div>`;
  document.querySelector('aside').prepend(panel);
  // Eingaben im Panel dürfen keine Spiel-Tasten auslösen (z. B. „5“ im Wellenfeld = Turm 5).
  panel.addEventListener('keydown', (ev) => ev.stopPropagation());

  const $ = (id) => panel.querySelector(`#${id}`);
  const mapSel = $('tp-map');
  for (const [id, def] of Object.entries(MAPS)) mapSel.add(new Option(def.name, id));
  mapSel.value = api.getState().mapId;

  for (const s of TEST_TOOLS.speeds) {
    const b = document.createElement('button');
    b.textContent = `×${s}`;
    b.dataset.speed = s;
    b.addEventListener('click', () => { api.ui.speed = s; api.refresh(); markSpeed(); });
    $('tp-speeds').appendChild(b);
  }
  function markSpeed() {
    for (const b of $('tp-speeds').children) b.classList.toggle('active', Number(b.dataset.speed) === api.ui.speed);
  }

  const wave = () => { const w = clampWave($('tp-wave').value); $('tp-wave').value = w; return w; };
  const act = (fn) => () => { fn(api.getState()); api.refresh(); };

  $('tp-new').addEventListener('click', () => {
    const w = wave();
    api.restartOn(mapSel.value);
    prepareWave(api.getState(), w);
    api.refresh();
  });
  $('tp-jump').addEventListener('click', act((s) => { prepareWave(s, wave()); api.resume(); }));
  $('tp-clear').addEventListener('click', act(clearEnemies));
  $('tp-cool').addEventListener('click', act(resetCooldowns));
  $('tp-win').addEventListener('click', act((s) => forceEnd(s, 'won')));
  $('tp-lose').addEventListener('click', act((s) => forceEnd(s, 'lost')));
  $('tp-gold').addEventListener('change', (ev) => { opts.infiniteGold = ev.target.checked; });
  $('tp-lives').addEventListener('change', (ev) => { opts.invincible = ev.target.checked; });

  // Cheats in jedem Frame anwenden; Tempo-Markierung mitführen (F-Taste ändert es auch).
  function tick() {
    applyCheats(api.getState(), opts);
    markSpeed();
    requestAnimationFrame(tick);
  }
  tick();
  api.refresh();
}
