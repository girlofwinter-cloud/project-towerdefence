# Menue-Ring-Turm (C4): Verbessern, Verkaufen, Zielwahl
Fläche: `canvas/project/Menue-Ring-Turm.dc.html`. Ersetzt das Turm-Panel. Dateien: index.html, style.css, main.js, render.js.

## Verhalten
- Öffnen: Klick/Tipp auf einen Turm (wie bisher `ui.selectedTowerId`). Reichweite des Turms zeichnet der Canvas wie bisher.
- Knöpfe: **Verbessern** oben (−90°), **Zielwahl** rechts (0°), **Verkaufen** links (180°), **Schließen** unten (90°, klein). Info-Plakette rechts neben dem Ring, links wenn der Ringmittelpunkt in der rechten Hälfte liegt (`.info-left`).
- Hover/Fokus auf Verbessern: Canvas zeichnet zusätzlich den Reichweitenkreis der nächsten Stufe gestrichelt (#ffe266, Strich 2, Strichel 6/6). render.js: `ui.upgradePreview = rangeNextLevel` (main.js rechnet mit `towerStats({...t, level: t.level+1}, state.modifiers).range`; nur lesen).
- Verkaufen: ein Klick verkauft (wie Taste S); Knopf zeigt Erlös. Zielwahl: Klick schaltet weiter, Beschriftung zeigt die aktuelle Regel.
- Tasten U/S/T/Esc unverändert. Schließen: Esc, Rechtsklick, Klick daneben, ×.
- Max. Stufe: Verbessern zeigt Stern, Beschriftung "Max.", `disabled`. Zu teuer: grau, Preis #ff9e8f durchgestrichen, `disabled` (wie bisher).
- Stufe 3 Stern-Abzeichen bleibt am Turm (Block B).

## HTML (ersetzt `#tower-info`; IDs bleiben, damit Tests und Tastatur weiter passen)
```html
<div id="tower-info" class="ring ring-tower" role="dialog" aria-labelledby="ti-name" hidden>
  <span class="ring-yard" aria-hidden="true"></span>
  <div class="ring-acts">
  <button id="upgrade" class="rbtn rbtn-gold" style="--a:-90deg"><!-- SVG Pfeile hoch --><span class="cap act-cost">105 <img class="ico"…></span></button>
  <button id="target-mode" class="rbtn" style="--a:0deg"><!-- SVG Fadenkreuz --><span class="cap">Erster</span></button>
  <button id="sell" class="rbtn rbtn-red" style="--a:180deg"><!-- SVG Münze minus --><span class="cap act-cost">+98 <img class="ico"…></span></button>
  </div>
  <button id="ti-close" class="rbtn rbtn-small" style="--a:90deg" aria-label="Turm-Panel schließen">×</button>
  <div class="ring-info plq"><h3 id="ti-name">Kanone · Stufe 2</h3><p id="ti-stats"></p><p id="ti-special"></p></div>
</div>
```
SVG (40x40, wie Entwurf-Strich):
- Verbessern: `<path d="M10 22 L20 11 L30 22 M10 31 L20 20 L30 31" fill="none" stroke="#2b1a10" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` + gleicher Pfad `stroke="#fff3d2" stroke-width="3"`.
- Max.: Stern `M20 5 L24.5 15 L35 16 L27 23 L29.5 34 L20 28.5 L10.5 34 L13 23 L5 16 L15.5 15 Z` fill #f2c14e, Kontur 3.
- Verkaufen: Münze `circle 18,22 r12 fill #f2c14e stroke 3` + Innenring r6,5 #b9851d + Minus `M26 9 H36` (7 dunkel / 3 hell).
- Zielwahl: Kreis r11 (7 dunkel/3 hell) + Kreuzstriche `M20 4 V12 M20 28 V36 M4 20 H12 M28 20 H36` + Mitte r3 #d6483a.
## CSS
```css
.rbtn { position: absolute; left: -30px; top: -30px; width: 60px; height: 60px; padding: 0; border-radius: 50%; border: 4px solid #2b1a10; cursor: pointer;
  display: grid; place-items: center; background: radial-gradient(circle at 35% 30%, #d79a52, #8a5224); box-shadow: inset 0 3px 0 rgba(255,255,255,.35), 0 4px 0 rgba(30,15,5,.55);
  transform: rotate(var(--a)) translate(var(--R)) rotate(calc(-1 * var(--a))); animation: ring-in .14s ease-out; }
.rbtn-gold { background: radial-gradient(circle at 35% 30%, #ffe27a, #e08a1c); }
.rbtn-red { background: radial-gradient(circle at 35% 30%, #e88a6a, #a8412c); }
.rbtn-small { width: 44px; height: 44px; left: -22px; top: -22px; font: 26px/1 var(--display); color: #fff3d2; background: #2b1a10; border-color: #2b1a10; }
.rbtn .cap { bottom: -15px; } /* .cap aus HUD-Faehigkeiten */
.rbtn:disabled { filter: grayscale(.85) brightness(.85); cursor: default; }
.rbtn:disabled .act-cost { color: #ff9e8f; text-decoration: line-through; }
.rbtn:hover:not(:disabled), .rbtn:focus-visible { box-shadow: 0 0 0 4px #ffe266, 0 4px 0 rgba(30,15,5,.55); }
.ring-info { position: absolute; left: calc(var(--R) + 44px); top: -46px; width: 240px; padding: 8px 12px; font-family: 'Trebuchet MS', sans-serif; }
/* Desktop: .ring-acts ist nur Hülle */ .ring-acts { display: contents; }
.ring-tower.info-left .ring-info { left: auto; right: calc(var(--R) + 44px); }
.ring-info h3 { margin: 0 0 2px; font: 19px/1.1 var(--display); color: #fff3d2; text-shadow: 0 2px 0 #2b1a10; }
.ring-info p { margin: 0; font-size: 13px; line-height: 1.3; color: #e8d3a8; }
#ti-special:empty { display: none; }
/* Handy (kompakt): derselbe Container wird zur festen Leiste unten (wie heute), Knöpfe in einer Reihe; Tests der Handy-Leiste bleiben gültig */
@media (max-width: 759.98px), (max-height: 519.98px) {
  #tower-info.ring { position: fixed; left: 0; right: 0; bottom: 0; top: auto; width: auto; height: auto; z-index: 20; display: grid;
    grid-template-columns: minmax(0,1fr) 44px; grid-template-areas: 'info close' 'acts acts'; gap: 6px 8px; padding: 8px 8px calc(10px + env(safe-area-inset-bottom));
    background: linear-gradient(#a4672f, #7a4520); border-top: 3px solid #2b1a10; border-radius: 14px 14px 0 0; }
  #tower-info .ring-yard { display: none; }
  #tower-info .ring-info { position: static; grid-area: info; width: auto; padding: 0; background: none; border: 0; box-shadow: none; }
  #tower-info .rbtn { position: static; transform: none; animation: none; width: auto; height: 52px; border-radius: 26px; }
  #tower-info #ti-close { grid-area: close; width: 44px; height: 44px; }
  #tower-info .rbtn .cap { position: static; transform: none; margin-left: 4px; }
  /* Knöpfe in eine Reihe: main.js legt #upgrade/#target-mode/#sell in <div class="ring-acts"> (grid-area: acts; display:flex; gap:6px; Knöpfe flex:1) */
  #ti-special { display: none; }
  #tower-info .ring-acts { grid-area: acts; display: flex; gap: 6px; } #tower-info .ring-acts .rbtn { flex: 1 1 0; min-width: 0; }
}
```
Markup in refreshUI: `#upgrade` innerHTML = SVG + `<span class="cap act-cost">${up} ${COIN()}</span>` (Max.: Stern + `<span class="cap">Max.</span>`), `#sell` = SVG + `+${sell}`, `#target-mode` = SVG + Regelname. `aria-label`-Texte **unverändert** ("Verbessern für 105 Gold (U)", "Verkaufen für 98 Gold (S)", "Ziel: Erster (T)"). `#ti-name` = `${name} · Stufe ${level}`; Test-Regex `/Stufe 1/` passt, `/Pfeilturm \(Stufe 1\)/` muss auf `/Pfeilturm · Stufe 1/`.
## Tests
- panel (Desktop 1280/1366): "Verkaufen und alle Turmkarten ohne Scrollen" → nur `#upgrade/#sell/#target-mode/#ti-name` im Fenster prüfen (Turm an (0,0) und (19,13)).
- panel (Handy) und panel-edge "Leiste fest unten": auf dem Handy bleibt die feste Leiste (siehe Handy-Hoch); Desktop-Erwartung `position !== 'fixed'` bleibt wahr.
- panel-polish "keine Lücke Münze/Klammer": Klammern entfallen → Test entfernen (Mensch hat Anpassung freigegeben) oder auf "Münze direkt nach Zahl" umstellen.
- panel-edge Tastatur T/U/S: unverändert grün.
- Neu: Hover auf `#upgrade` setzt `__ui.upgradePreview > 0`; max. Stufe zeigt "Max." und ist disabled.
