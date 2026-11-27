# HUD-Wellenknopf (C3): Wellenstart, Vorschau, Kartenwahl im unteren Band
Fläche: `canvas/project/HUD-Wellenknopf.dc.html`. Entwurf Z.168. Dateien: index.html, style.css, main.js.
## HTML
```html
<div class="wave-row">
  <label class="map-pick plq"><span>Karte</span> <select id="map-select"></select></label>
  <button id="start-wave" class="wave-btn" title="Nächste Welle starten (Leertaste)"><span id="start-label">Welle 1 starten</span> <span class="key" id="start-key">(Leertaste)</span></button>
  <p id="wave-preview" class="plq"></p>
</div>
```
## CSS
```css
.wave-row { position: absolute; z-index: 10; left: var(--fx); width: var(--fw); bottom: max(4px, calc((var(--fb) - 46px) / 2)); height: 46px;
  pointer-events: none; display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 12px; align-items: center; }
.wave-row > * { pointer-events: auto; }
.wave-btn { grid-column: 2; position: relative; min-width: 168px; height: 46px; padding: 0 22px; border-radius: 23px; border: 3px solid #2b1a10;
  white-space: nowrap; cursor: pointer; background: linear-gradient(#ffd45a, #e08a1c); box-shadow: inset 0 2px 0 rgba(255,255,255,.6), 0 4px 0 rgba(30,15,5,.5);
  font: 22px/1 var(--display); color: #2b1a10; }
.wave-btn .key { display: none; } /* Kürzel steht im title */
.wave-btn:hover:not(:disabled) { filter: brightness(1.08); }
.wave-btn:active:not(:disabled) { transform: translateY(2px); box-shadow: inset 0 2px 0 rgba(255,255,255,.6), 0 2px 0 rgba(30,15,5,.5); }
.wave-btn:disabled { background: linear-gradient(#cdb48a, #9c8462); color: #4a3a2a; cursor: default; box-shadow: inset 0 2px 0 rgba(255,255,255,.3), 0 4px 0 rgba(30,15,5,.4); }
.wave-btn.ready { animation: wave-ready 1.6s ease-in-out infinite; }
@keyframes wave-ready { 50% { box-shadow: inset 0 2px 0 rgba(255,255,255,.6), 0 4px 0 rgba(30,15,5,.5), 0 0 0 6px rgba(255,212,90,.45); } }
#wave-preview { grid-column: 3; justify-self: start; max-width: 100%; height: 34px; margin: 0; padding: 0 12px; border-radius: 17px;
  font: 15px/28px var(--display); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } /* + .plq */
#wave-preview[hidden] { display: none; }
.map-pick { grid-column: 1; justify-self: start; height: 38px; padding: 0 6px 0 12px; border-radius: 19px; display: flex; align-items: center; gap: 8px; font-size: 16px; }
.map-pick select { font: 15px var(--display); color: #2b1a10; background: #fff3d2; border: 2px solid #2b1a10; border-radius: 12px; padding: 3px 6px; max-width: 170px; }
.map-pick:has(select:disabled) { display: none; }
@media (prefers-reduced-motion: reduce) { .wave-btn.ready { animation: none; } }
```
Kontrast: #2b1a10 auf #ffd45a 12,6:1; #4a3a2a auf #cdb48a 5,3:1.
## Zustände (Texte aus `startButtonView`, unverändert)
"Welle 9 starten" (bereit, pulsiert, `.ready` = `sb.showKey && !state.waveActive`) · "Welle 2 in 5…" (Auto-Countdown, pulsiert) · "Welle läuft…" (aus) · "Nächste Welle +12" (Frühstart, bereit, ohne Puls) · "Letzte Welle läuft…" (aus). Vorschau nur zwischen Wellen ("Kommt: 9× Goblin, 2× Flitzer"); bei Überlänge Ellipse, voller Text als `title`. Kartenwahl nur vor Welle 1 (Block D ersetzt sie durch Start-Kartenwahl).
Lage 1280x800: Knopf 545–735 x 747–793 (mittig unter dem Feld), Vorschau 747–892, Kartenwahl 155–395.
## Tests
smoke B-005 (Texte `#start-label`) und progress (`#map-select`) unverändert grün. Neu: `#start-wave` liegt unterhalb der Feldunterkante.
