# HUD-Leiste (C2): Gold | Welle | Leben
Fläche: `canvas/project/HUD-Leiste.dc.html`. Entwurf Z.16, Z.17, Z.151–160. Datei: index.html, style.css, main.js (refreshUI).

## HTML (ersetzt `.hud` in index.html)
```html
<div class="hud plq" id="hud-bar">
  <span class="hud-item" id="gold-box" title="Gold">
    <svg class="hud-ico" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="#f2c14e" stroke="#2b1a10" stroke-width="3.5"/><circle cx="20" cy="20" r="9" fill="none" stroke="#b9851d" stroke-width="3"/><path d="M13 12 Q18 8 24 10" stroke="#fff3d2" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
    <span class="sr">Gold</span><b id="gold" class="num">0</b>
  </span>
  <i class="sep" aria-hidden="true"></i>
  <span class="hud-item" id="wave-box" title="Welle">
    <svg class="hud-ico" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><path d="M8 4 V32" stroke="#2b1a10" stroke-width="6" stroke-linecap="round"/><path d="M8 4 V32" stroke="#e8c185" stroke-width="2.5" stroke-linecap="round"/><path d="M10 6 H30 L25 12 L30 18 H10 Z" fill="#d6483a" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/></svg>
    <span class="sr">Welle</span><b id="wave" class="num">0</b>
  </span>
  <i class="sep" aria-hidden="true"></i>
  <span class="hud-item" id="lives-box" title="Leben">
    <svg class="hud-ico" width="38" height="36" viewBox="0 0 38 36" aria-hidden="true"><path d="M19 32 C4 21 2 12 8 7 C13 3 18 6 19 11 C20 6 25 3 30 7 C36 12 34 21 19 32 Z" fill="#e0393e" stroke="#2b1a10" stroke-width="3.5" stroke-linejoin="round"/><path d="M9 11 Q12 8 15 9" stroke="#ffb4b0" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
    <span class="sr">Leben</span><b id="lives" class="num">0</b>
  </span>
</div>
```
## CSS
```css
.plq { background: linear-gradient(#a4672f, #7a4520); border: 3px solid #2b1a10; border-radius: 14px;
  box-shadow: inset 0 2px 0 rgba(255,220,160,.55), inset 0 -3px 0 rgba(0,0,0,.25), 0 4px 0 rgba(30,15,5,.45); color: #fff3d2; font-family: var(--display); }
.num { font-family: var(--display); font-weight: 400; font-size: 28px; line-height: 30px; color: #fff3d2;
  text-shadow: -2px 0 #2b1a10, 2px 0 #2b1a10, 0 -2px #2b1a10, 0 2px #2b1a10, 0 3px 0 #2b1a10; }
.num small { font-size: 20px; }
.hud { position: absolute; z-index: 10; pointer-events: none; left: var(--fx); top: max(2px, calc((var(--fy) - 56px) / 2));
  height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 18px 0 8px; transition: opacity .15s; }
.hud.dim { opacity: .35; }
.hud-item { position: relative; display: inline-flex; align-items: center; gap: 6px; }
.sep { width: 3px; height: 36px; background: #2b1a10; opacity: .5; border-radius: 2px; }
#gold { min-width: 76px; } #wave { min-width: 70px; } #lives { min-width: 30px; }
#lives-box.low #lives { color: #ff6b5a; animation: pulse 1s ease-in-out infinite; }
```
Münzflug B-123 (`.gold-pop`, `.gold-coin`, `gold-gain`) bleibt unverändert, Text `+12` in Lilita 20 mit `text-shadow: 0 2px 0 #2b1a10`.
## Zustände
normal · Gold mit Tausenderpunkt `1.240` (`toLocaleString('de-DE')`) · Welle `8<small> / 20</small>` (setHtml) · wenig Leben (`.low`, ≤ LOW_LIVES: Zahl #ff6b5a, pulsiert; reduced motion: kein Puls) · Frühstart-Bonus (Münzflug) · ausgeblendet (`.dim`, Maus im Rechteck +8 px; Klicks gehen immer durch, `pointer-events:none`).
Maße bei 1280x800: 155–559 x 2–58 (gemessen).
## main.js
Gold/Welle wie oben; `renderHearts`-Aufruf, `#pause-hint`-Zeile löschen; in Canvas-`pointermove`: `ui.hudDim` aus `#hud-bar.getBoundingClientRect()` ±8; refreshUI: `$('hud-bar').classList.toggle('dim', ui.hudDim)`.
## Tests
Keine bestehenden betroffen (`#gold/#wave/#lives` werden nicht als Text geprüft). Neu: `#gold` zeigt bei 1240 Gold `1.240`.
