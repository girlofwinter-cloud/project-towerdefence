# Menue-Ring-Bauen (C4): Turm auf freier Kachel bauen
Fläche: `canvas/project/Menue-Ring-Bauen.dc.html`. Ersetzt die Turmleiste (`HUD-Turmwahl-Uebergang`). Dateien: index.html, style.css, main.js, render.js (Vorschau), tests/e2e.

## Verhalten
- **Öffnen:** Klick/Tipp auf eine freie bebaubare Feldkachel, wenn kein Bau- oder Zielmodus aktiv ist. Unbebaubar (Weg, Wasser, Lava, Hindernis, Turm) → wie bisher Meldung (`canBuild().reason`), kein Ring. Klick auf einen Turm → Menue-Ring-Turm.
- **Bauen:** Klick auf einen Turmknopf baut sofort auf der Ringkachel (`buildTower`), Ring schließt. Touch: Tipp Kachel → Ring, Tipp Knopf → gebaut (2 Tipps wie bisher; der Vorschau-Tipp `buildTapStep` entfällt im Ring).
- **Zu teuer:** Knopf bleibt fokussier- und klickbar (`aria-disabled="true"`), Klick → Meldung "Zu wenig Gold" (Text aus `buildTower().reason`), Ring bleibt offen.
- **Vorschau:** Maus über bzw. Fokus auf einem Knopf → Canvas zeigt Reichweitenkreis und Geistturm dieses Typs auf der Ringkachel (bestehende Bau-Vorschau: `ui.buildType = type; ui.hover = {col,row,ok:true}` setzen, beim Verlassen zurück auf `null`).
- **Schließen:** Esc, Rechtsklick, Klick außerhalb (anderer freier Platz → Ring springt dorthin), nach dem Bauen, Wellenstart per Taste lässt ihn offen.
- **Tasten:** Ring offen: `1`–`5` bauen diesen Typ auf der Ringkachel. Ring zu: `1`–`5` wie bisher Baumodus (Klick baut direkt, kein Ring); Tab/Shift-Tab wandert im Ring, Enter/Leertaste auf Knopf baut. Beim Öffnen per Tastatur Fokus auf den ersten bezahlbaren Knopf; per Maus kein Fokuswechsel.

## Lage und Maße
- Ring liegt in `.stage` (absolut). Mittelpunkt = Kachelmitte in CSS-px: `x = u*(50 + (col+0.5)*40)`, `y = u*(50 + (row+0.5)*40)`, `u = canvasRect.width/900`; danach geklemmt auf `[R+42, cw-R-42]` bzw. `[R+42, ch-R-42]` (Knöpfe bleiben ganz im Canvas, auch an Feldkanten).
- Radius `R = max(68px, 1.55 Kacheln)`; bei 1280x800 (Kachel 48,5) 75 px. Knopf 60 px (kompakt 48). 5 Knöpfe bei Winkel −90°, −18°, 54°, 126°, 198° (oben beginnend, im Uhrzeigersinn, Reihenfolge = TOWER_TYPES = Tasten 1–5).
- Hof: Kreis Ø `2R+76`, `radial-gradient(circle, rgba(43,26,16,.38) 0 45%, rgba(43,26,16,0) 70%)`, `pointer-events:none`.
- Kachelmarke: Canvas zeichnet die Hover-Kachel wie bisher (grün). Dazu im Ring Mitte ein Punkt 10 px #fff3d2 mit Kontur 3 #2b1a10.

## HTML (in `.stage` nach dem Canvas; ersetzt `#shop`)
```html
<div id="shop" class="ring ring-build" role="menu" aria-label="Turm bauen" hidden>
  <span class="ring-yard" aria-hidden="true"></span><span class="ring-dot" aria-hidden="true"></span>
  <!-- main.js: je TOWER_TYPES ein Knopf -->
  <button class="tower-btn ring-btn" data-type="arrow" role="menuitem" style="--a:-90deg" aria-label="Pfeilturm bauen, 50 Gold (1)">
    <canvas class="t-icon" width="48" height="48"></canvas>
    <span class="t-cost">50 <img class="ico" …></span><kbd class="key">1</kbd>
  </button>
</div>
```
## CSS
```css
.ring { position: absolute; z-index: 16; left: var(--rx); top: var(--ry); width: 0; height: 0; --R: max(68px, calc(var(--u) * 62)); }
.ring[hidden] { display: none; }
.ring-yard { position: absolute; left: calc(-1 * (var(--R) + 38px)); top: calc(-1 * (var(--R) + 38px)); width: calc(2 * var(--R) + 76px); height: calc(2 * var(--R) + 76px);
  border-radius: 50%; background: radial-gradient(circle, rgba(43,26,16,.38) 0 45%, rgba(43,26,16,0) 70%); pointer-events: none; }
.ring-dot { position: absolute; left: -5px; top: -5px; width: 10px; height: 10px; border-radius: 50%; background: #fff3d2; border: 3px solid #2b1a10; box-sizing: border-box; }
.ring-btn { position: absolute; left: -30px; top: -30px; transform: rotate(var(--a)) translate(var(--R)) rotate(calc(-1 * var(--a))); animation: ring-in .14s ease-out; }
@keyframes ring-in { from { opacity: 0; transform: rotate(var(--a)) translate(calc(var(--R) * .5)) rotate(calc(-1 * var(--a))) scale(.6); } }
.ring-btn:hover, .ring-btn:focus-visible { box-shadow: 0 0 0 4px #ffe266, 0 0 16px 4px rgba(255,226,102,.6), 0 4px 0 rgba(30,15,5,.55); z-index: 1; }
/* .tower-btn, .t-icon, .t-cost, .poor, kbd.key: wie HUD-Turmwahl-Uebergang (SHOP_CARD-Farben) */
@media (prefers-reduced-motion: reduce) { .ring-btn { animation: none; } }
@media (max-width: 759.98px), (max-height: 519.98px) { .ring { --R: 62px; } .ring-btn { width: 48px; height: 48px; left: -24px; top: -24px; } .ring-btn .t-icon { width: 38px; height: 38px; } }
```
main.js setzt beim Öffnen `ring.style.setProperty('--rx', x+'px')`, `--ry`, `ui.ring = {col,row}`, `ring.hidden = false`; `refreshUI` setzt `.poor` + `aria-disabled` + `aria-label` ("Pfeilturm bauen, 50 Gold (1)"; zu teuer: "…, zu wenig Gold").
Kontrast: Preis #ffe27a auf #2b1a10 12:1, zu teuer #ff9e8f auf #2b1a10 8:1, zusätzlich durchgestrichen.

## Tests
- Ersetzt: alle Stellen `.tower-btn[data-type="x"].click()` + Klick auf Kachel → neuer Helfer in `tests/e2e/tile.mjs`: `build(page, type, col, row)` = Klick Kachel, dann `#shop .tower-btn[data-type=type]` klicken (Touch: `tap`). Betroffen: smoke (Bauen, Touch, Stil 1), panel, panel-edge, panel-polish, progress, testpage.
- Entfallen: smoke/testpage/panel "alle Turm-Buttons ohne Scrollen sichtbar", panel-polish "alle Shop-Karten gleich hoch" (nur im Ring sichtbar). Ersatz: Ring an Kachel (0,0) und (19,13) offen → alle 5 Knöpfe vollständig im Fenster.
- panel "Shop-Karten Farben": prüft weiter Farben, aber nach Öffnen des Rings.
- buttons B-096: `.tower-btn kbd` sichtbar nur bei offenem Ring; Zählung nach Öffnen.
- Neu: Esc schließt; Klick auf Weg öffnet keinen Ring; Taste 3 bei offenem Ring baut Frostturm auf der Ringkachel; zu teuer → Meldung, kein Turm.
