# HUD-Turmwahl-Uebergang (nur bis Block D)
Fläche: `canvas/project/HUD-Turmwahl-Uebergang.dc.html`. Nur nötig, wenn Block C ohne Block D gemergt wird; D (Menue-Ring-Bauen/-Turm) ersetzt beides.
## Turmwahl rechts (`#shop`, `.tower-btn` wie bisher von main.js gebaut)
```css
#shop { position: absolute; z-index: 10; right: max(8px, calc(var(--cx) - 92px)); top: 50%; transform: translateY(-50%);
  width: 84px; padding: 10px 0 24px; border-radius: 42px; display: flex; flex-direction: column; align-items: center; gap: 22px; } /* + .plq */
.tower-btn { position: relative; width: 60px; height: 60px; padding: 0; border-radius: 50%; border: 4px solid #2b1a10; cursor: pointer;
  background-color: var(--card-bg); background-image: radial-gradient(circle at 35% 30%, rgba(255,255,255,.22), rgba(0,0,0,.18));
  color: var(--card-name); box-shadow: inset 0 3px 0 rgba(255,255,255,.3), 0 4px 0 rgba(30,15,5,.55); display: grid; place-items: center; }
.tower-btn .t-icon { width: 48px; height: 48px; border-radius: 50%; background: var(--card-icon-bg); }
.tower-btn .t-name, .tower-btn .t-desc { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.tower-btn .t-desc { color: var(--card-desc); }
.tower-btn .t-cost { position: absolute; left: 50%; bottom: -15px; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 2px; padding: 0 6px; border-radius: 9px; background: #2b1a10; color: var(--card-cost); font: 15px/20px var(--display); white-space: nowrap; }
.tower-btn .t-cost .ico { width: 14px; height: 14px; }
.tower-btn kbd.key { position: absolute; left: -8px; top: -8px; font: 13px/18px var(--display); padding: 0 5px; background: var(--card-key-bg); color: var(--card-key-text); border-radius: 9px; border: 0; }
.tower-btn.active { background-color: var(--card-bg-active); box-shadow: 0 0 0 4px #ffe266, 0 0 16px 4px rgba(255,226,102,.6), 0 4px 0 rgba(30,15,5,.55); }
.tower-btn.poor { border-color: var(--card-poor-edge); }
.tower-btn.poor .t-icon { filter: grayscale(1) brightness(.8); }
.tower-btn.poor .t-cost { color: var(--card-cost-poor); text-decoration: line-through; text-decoration-thickness: 2px; }
```
main.js: `btn.title = `${def.name} (${def.cost} Gold): ${def.description}${def.special ? ' ' + def.special.text : ''}``. Farben weiter aus SHOP_CARD (Test "Shop-Karten" bleibt grün).
## Turm-Panel schwebend (`#tower-info`, Markup unverändert, Knöpfe mit Klasse `wbtn`, Verbessern `wbtn wbtn-gold`)
```css
#tower-info { position: absolute; z-index: 15; left: calc(var(--fx) + var(--fw) / 2); transform: translateX(-50%); bottom: calc(var(--fb) + 10px);
  width: min(560px, calc(var(--fw) - 24px)); display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: 'name' 'stats' 'special' 'actions';
  gap: 4px; padding: 8px 12px; font-family: 'Trebuchet MS', sans-serif; } /* + .plq */
#tower-info.ti-top { bottom: auto; top: calc(var(--fy) + 10px); }   /* main.js: t.row >= 9 */
#tower-info h3 { grid-area: name; margin: 0; font: 20px/1.1 var(--display); color: #fff3d2; text-shadow: 0 2px 0 #2b1a10; }
#tower-info p { margin: 0; font-size: 14px; color: #e8d3a8; }
.wbtn { font: 17px/1 var(--display); color: #fff3d2; padding: 0 14px; min-height: 40px; border: 3px solid #2b1a10; border-radius: 20px; white-space: nowrap;
  background: linear-gradient(#b97a3e, #7a4520); box-shadow: inset 0 2px 0 rgba(255,235,190,.5), 0 3px 0 rgba(30,15,5,.5); text-shadow: 0 2px 0 #2b1a10;
  display: inline-flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; }
.wbtn-gold { background: linear-gradient(#ffd45a, #e08a1c); color: #2b1a10; text-shadow: none; }
.wbtn:disabled { filter: grayscale(.8) brightness(.8); cursor: default; }
```
## Tests
Alle panel-/panel-edge-Tests grün im Prototyp (siehe Layout-Vollbild). Mockup: `C-play-1280x800.png`.
