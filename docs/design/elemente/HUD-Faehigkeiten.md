# HUD-Faehigkeiten (C3): Meteor, Kälte, Reparatur
Fläche: `canvas/project/HUD-Faehigkeiten.dc.html`. Entwurf Z.19, Z.20, Z.164–167. Dateien: style.css, main.js (Knopfbau + refreshUI).
## Markup (main.js baut je Fähigkeit)
```js
const ABILITY_SVG = {
  meteor: '<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><path d="M8 38 L26 20" stroke="#ffe266" stroke-width="8" stroke-linecap="round" opacity=".6"/><circle cx="29" cy="17" r="11" fill="#7a5a45" stroke="#2b1a10" stroke-width="3"/><path d="M24 12 L30 11" stroke="#d6bfa5" stroke-width="3" stroke-linecap="round"/><path d="M36 22 L42 28 M30 28 L34 36" stroke="#ffe266" stroke-width="3" stroke-linecap="round"/></svg>',
  freeze: '<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><path d="M23 6 V40 M8 14 L38 32 M38 14 L8 32" stroke="#2b1a10" stroke-width="7" stroke-linecap="round"/><path d="M23 6 V40 M8 14 L38 32 M38 14 L8 32" stroke="#f4fcff" stroke-width="3.5" stroke-linecap="round"/></svg>',
  repair: '<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><path d="M10 36 L28 18" stroke="#2b1a10" stroke-width="9" stroke-linecap="round"/><path d="M10 36 L28 18" stroke="#e8c185" stroke-width="4.5" stroke-linecap="round"/><path d="M26 8 Q38 6 38 16 L32 14 L28 20 L22 14 Z" fill="#d9dde2" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/></svg>',
};
btn.className = 'ability-btn ab';
btn.innerHTML = `${ABILITY_SVG[id]}<span class="ab-cd" aria-hidden="true"></span><span class="ab-num" aria-hidden="true"></span>`
  + `<span class="ab-badge"></span><span class="cap">${def.short}</span><span class="key key-badge">${def.key.toUpperCase()}</span>`;
```
refreshUI zusätzlich: `btn.querySelector('.ab-num').textContent = v.state === 'charging' ? String(Math.ceil(abilityCooldownLeft(state, id))) : '';`
und vor `btn.dataset.state = v.state`: `if (btn.dataset.state === 'charging' && v.state === 'ready') { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }`
`--fill`, `aria-label`, `.ab-badge`, `disabled`, `.aiming` wie bisher (abilityView unverändert).
## CSS
```css
.abilities { position: absolute; z-index: 10; left: max(6px, calc(var(--cx) - 98px)); top: 50%; transform: translateY(-50%);
  width: 92px; padding: 10px 0 22px; border-radius: 42px; display: flex; flex-direction: column; align-items: center; gap: 18px; } /* + .plq */
.ab { position: relative; width: 64px; height: 64px; padding: 0; flex: none; border-radius: 50%; border: 4px solid #2b1a10; cursor: pointer;
  box-shadow: inset 0 3px 0 rgba(255,255,255,.35), 0 4px 0 rgba(30,15,5,.55); display: grid; place-items: center; color: #fff3d2; }
.ab[data-ability="meteor"] { background: radial-gradient(circle at 35% 30%, #ffb04a, #c4381f); }
.ab[data-ability="freeze"] { background: radial-gradient(circle at 35% 30%, #8fd8f2, #2e6fb0); }
.ab[data-ability="repair"] { background: radial-gradient(circle at 35% 30%, #a8e070, #3a8a3c); }
.ab > svg { grid-area: 1 / 1; }
.ab-cd { position: absolute; inset: -4px; border-radius: 50%; pointer-events: none;
  background: conic-gradient(rgba(20,30,50,.72) 0 calc((1 - var(--fill, 1)) * 100%), rgba(20,30,50,0) 0 100%); }
.ab-num { position: absolute; inset: 0; display: grid; place-items: center; font: 24px/1 var(--display); color: #fff3d2;
  text-shadow: -2px 0 #2b1a10, 2px 0 #2b1a10, 0 -2px #2b1a10, 0 2px #2b1a10; pointer-events: none; }
.ab-num:empty, .ab-badge:empty { display: none; }
.ab-badge { position: absolute; right: -10px; top: -10px; min-width: 26px; height: 26px; padding: 0 3px; border-radius: 13px; background: #f2c14e; border: 3px solid #2b1a10; font: 15px/20px var(--display); color: #2b1a10; text-align: center; }
.cap { position: absolute; left: 50%; bottom: -14px; transform: translateX(-50%); padding: 0 8px; border-radius: 9px; background: #2b1a10; color: #fff3d2; font: 15px/20px var(--display); white-space: nowrap; pointer-events: none; }
.ab > .key-badge { position: absolute; left: -8px; top: -8px; min-width: 22px; height: 22px; border-radius: 11px; background: #2b1a10; color: #fff3d2; font: 14px/22px var(--display); text-align: center; }
.ab[data-state="used"] { filter: saturate(.3); } .ab[data-state="used"] > svg { filter: grayscale(1) brightness(.7); }
.ab:disabled { cursor: default; } .ab:not(:disabled):hover { filter: brightness(1.12); }
.ab.aiming { box-shadow: 0 0 0 4px #ffe266, 0 0 18px 6px rgba(255,226,102,.7), 0 4px 0 rgba(30,15,5,.55); }
.ab.pop { animation: ab-ready .5s ease-out 1; } @keyframes ab-ready { 50% { transform: scale(1.12); } }
@media (hover: none), (pointer: coarse), (max-width: 700px) { .ab > .key-badge { display: none; } }
@media (prefers-reduced-motion: reduce) { .ab.pop { animation: none; } }
```
## Zustände
bereit · lädt (dunkler Kuchen = Restanteil, große Restsekunden "14") · Zielmodus Meteor (gelber Leuchtring) · Ladungen "2×"/"1×" (Abzeichen) · aufgebraucht (entsättigt, kein Abzeichen) · gerade bereit geworden (Aufploppen 0,5 s, nicht beim Laden) · Spielende (disabled, wie bisher).
Lage 1280x800: Leiste 6–98 x 267–533, Knöpfe 64 px, mittig links neben dem Canvas (Eingänge der Karten liegen in Zeilen 1, 2, 11, 12 und bleiben frei). Kompakt: waagerecht, Knöpfe 56 px.
## Tests
buttons "Desktop Fähigkeitsknöpfe kompakt (44–60 px)": Grenzen auf 56–72, Kürzelprüfung `.ability-btn[data-ability="meteor"] .key-badge` sichtbar. smoke "Meteor" bleibt (`#abilities button` = 3). Mobil ≥ 44: 56 px, grün.
