# HUD-Knoepfe (C2): Hilfe, Ton, Tempo, Pause
Fläche: `canvas/project/HUD-Knoepfe.dc.html`. Entwurf Z.18, Z.161–163. Dateien: index.html, style.css, main.js.
## HTML
```html
<div class="top-buttons">
  <details class="help">
    <summary class="rb" aria-label="Steuerung"><span class="rb-q" aria-hidden="true">?</span></summary>
    <div class="help-pop plq"><ul><!-- bisherige Liste aus .help, unverändert --></ul></div>
  </details>
  <button id="sound" class="rb" aria-pressed="true" title="Ton an/aus (M)">
    <svg class="ic-on" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 16 H14 L22 9 V31 L14 24 H8 Z" fill="#fff3d2" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M27 14 Q32 20 27 26 M31 10 Q38 20 31 30" fill="none" stroke="#2b1a10" stroke-width="2.5" stroke-linecap="round"/></svg>
    <svg class="ic-off" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 16 H14 L22 9 V31 L14 24 H8 Z" fill="#fff3d2" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M27 15 L35 25 M35 15 L27 25" stroke="#2b1a10" stroke-width="3.5" stroke-linecap="round"/></svg>
    <span class="sr" id="sound-label">Ton an</span><span class="key sr">(M)</span>
  </button>
  <button id="speed" class="rb" title="Tempo (F)">
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 11 L20 20 L8 29 Z M20 11 L32 20 L20 29 Z" fill="#fff3d2" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/></svg>
    <span class="rb-badge" id="speed-label">×1</span><span class="key sr">(F)</span>
  </button>
  <button id="pause" class="rb" title="Pause (P)">
    <svg class="ic-pause" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><rect x="10" y="9" width="7" height="22" rx="2" fill="#fff3d2" stroke="#2b1a10" stroke-width="2.5"/><rect x="23" y="9" width="7" height="22" rx="2" fill="#fff3d2" stroke="#2b1a10" stroke-width="2.5"/></svg>
    <svg class="ic-play" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M13 9 L31 20 L13 31 Z" fill="#fff3d2" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/></svg>
    <span class="sr" id="pause-label">Pause</span><span class="key sr">(P)</span>
  </button>
  <button id="zoom" class="rb" aria-pressed="false"><span class="rb-q" aria-hidden="true">⤢</span><span class="sr" id="zoom-label">Zoom</span></button>
</div>
```
## CSS
```css
.top-buttons { position: absolute; z-index: 12; right: var(--fr); top: max(4px, calc((var(--fy) - 48px) / 2)); display: flex; gap: 8px; align-items: center; }
.rb { position: relative; display: inline-grid; place-items: center; width: 48px; height: 48px; padding: 0; flex: none; border-radius: 50%;
  border: 3px solid #2b1a10; cursor: pointer; list-style: none; background: radial-gradient(circle at 35% 30%, #d79a52, #8a5224);
  box-shadow: inset 0 2px 0 rgba(255,235,190,.6), 0 3px 0 rgba(30,15,5,.5); }
.rb::-webkit-details-marker { display: none; }
.rb:hover { filter: brightness(1.1); }
.rb:active { transform: translateY(2px); box-shadow: inset 0 2px 0 rgba(255,235,190,.6), 0 1px 0 rgba(30,15,5,.5); }
.rb-q { font: 26px/1 var(--display); color: #fff3d2; text-shadow: -2px 0 #2b1a10, 2px 0 #2b1a10, 0 -2px #2b1a10, 0 2px #2b1a10; }
.rb-badge { position: absolute; right: -8px; bottom: -6px; min-width: 26px; height: 22px; padding: 0 4px; border-radius: 11px; border: 2.5px solid #2b1a10; background: #f2c14e; color: #2b1a10; font: 14px/17px var(--display); text-align: center; }
#sound .ic-off, #sound[aria-pressed="false"] .ic-on { display: none; } #sound[aria-pressed="false"] .ic-off { display: block; }
#pause .ic-play, #pause[data-paused="true"] .ic-pause { display: none; } #pause[data-paused="true"] .ic-play { display: block; }
#pause[data-paused="true"] { box-shadow: 0 0 0 3px #ffe266, inset 0 2px 0 rgba(255,235,190,.6), 0 3px 0 rgba(30,15,5,.5); }
#zoom { display: none; } /* nur kompakt */
.help { position: relative; }
.help-pop { position: absolute; right: 0; top: 58px; width: 360px; padding: 10px 14px; font: 15px/1.35 'Trebuchet MS', sans-serif; }
:focus-visible { outline: 3px solid #ffe266; outline-offset: 3px; }
```
## Zustände
Ton an / Ton aus (aria-pressed) · Tempo ×1/×2/×3 (Abzeichen) · Pause / pausiert (Play-Symbol + gelber Ring) · Hilfe zu / offen (Plakette 360 breit unter dem Knopf, rechtsbündig) · Fokus (gelber Rahmen).
Lage 1280x800: 909–1125 x 6–54, rechtsbündig an der Feldkante.
## main.js (refreshUI)
`$('speed-label').textContent = '×'+ui.speed; $('speed').setAttribute('aria-label', 'Tempo ×'+ui.speed); $('pause').dataset.paused = String(state.paused);` Zeilen `setIcon($('sound-icon')…)`/`setIcon($('pause-icon')…)` löschen; `#pause-label`/`#sound-label` bleiben als Text für Screenreader.
## Tests
buttons "Handy …Pause und Tempo ≥ 44": 48 px, grün. Keine weiteren.
