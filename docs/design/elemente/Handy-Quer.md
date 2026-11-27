# Handy-Quer (C6): Querformat 844x390 / 740x360
Fläche: `canvas/project/Handy-Quer.dc.html`. Media Query: `@media (max-height: 519.98px) and (orientation: landscape)`. Dateien: style.css, tests/e2e (neu).

## Aufteilung (844x390)
Feld 557x390 mittig zwischen zwei Spalten à 143 px (Plan C6). `--u: min(100vh / 560, (100vw - 2 * 143px) / 800)` → 0,696 (844x390), Kachel 27,8 px; 740x360: 0,643, Kachel 25,7, Spalten 113… → Spaltenbreite `max(112px, (100vw - 800u)/2)`.
Canvas: `left: calc(143px - 50u)`, `top: calc((100vh - 560u)/2 - 50u)` (Rand oben/unten abgeschnitten, seitlich unter den Spalten).
| Spalte links (0–143) | Spalte rechts (701–844) |
|---|---|
| HUD senkrecht: Plakette 131 breit, 3 Zeilen à 32 (Münze/Fahne/Herz 26 px, Zahl Lilita 22), top 6 | 4 runde Knöpfe 44 px im 2x2-Raster (Ton, Tempo, Pause, Hilfe aus → Zoom aus), top 6 |
| Fähigkeiten senkrecht: 3 × 48 px, Beschriftung Lilita 12, Abstand 22, Plakette 76 breit, mittig ab top 128 | Wellenknopf 131 x 56, zweizeilig erlaubt (Lilita 18, `white-space: normal`), unten 8 |
| | Turm gewählt: Turm-Ring-Inhalt als Spalte (Name Lilita 16, Werte 12, Knöpfe untereinander 44 hoch), ersetzt die Knöpfe-Zeile; × oben rechts |
Ringmenüs Bauen: Radius 58, Knöpfe 46 (≥ 44), über dem Feld; Klemmung im Feldbereich 143…701.
Hintergrund der Spalten: `#backdrop` (unscharf) + `rgba(16,28,14,.35)`.
## CSS (Kern)
```css
@media (max-height: 519.98px) and (orientation: landscape) {
  :root { --side: max(112px, calc((100vw - 800 * var(--u)) / 2)); --u: min(100vh / 560, (100vw - 286px) / 800); }
  html, body { overflow: hidden; height: 100%; }
  #app { position: fixed; inset: 0; display: block; padding: 0; }
  .stage { position: absolute; left: calc(var(--side) - 50 * var(--u)); top: calc((100vh - 560 * var(--u)) / 2 - 50 * var(--u)); width: calc(900 * var(--u)); height: calc(660 * var(--u)); }
  .hud { position: absolute; left: 6px; top: 6px; width: calc(var(--side) - 12px); height: auto; flex-direction: column; align-items: stretch; gap: 2px; padding: 6px 8px; }
  .hud .sep { display: none; } .hud .num { font-size: 22px; } .hud-ico { width: 26px; height: 26px; }
  .abilities { position: absolute; left: calc((var(--side) - 76px) / 2); top: 128px; transform: none; width: 76px; gap: 22px; padding: 8px 0 18px; }
  .ab { width: 48px; height: 48px; } .cap { font-size: 12px; line-height: 16px; bottom: -12px; }
  .top-buttons { position: absolute; right: 6px; top: 6px; width: calc(var(--side) - 12px); display: grid; grid-template-columns: 44px 44px; justify-content: center; gap: 8px; }
  .top-buttons .rb { width: 44px; height: 44px; } .help, #zoom { display: none; }
  .wave-row { position: absolute; right: 6px; bottom: 8px; left: auto; width: calc(var(--side) - 12px); height: auto; display: block; }
  .wave-btn { width: 100%; min-width: 0; height: 56px; padding: 0 8px; font-size: 18px; white-space: normal; line-height: 1.05; }
  #wave-preview, .map-pick { display: none; }
  #tower-info.ring { position: fixed; right: 0; top: 0; bottom: 0; left: auto; width: var(--side); z-index: 20; display: flex; flex-direction: column; gap: 8px; padding: 8px;
    background: linear-gradient(#a4672f, #7a4520); border-left: 3px solid #2b1a10; }
  #tower-info .rbtn { position: static; transform: none; width: 100%; height: 44px; border-radius: 22px; }
}
```
## Tests (neu, e2e)
844x390 und 740x360 mit `isMobile, hasTouch`: kein Scrollen; Feldrechteck schneidet keine Bedienfläche; alle Knöpfe ≥ 44 px; Bauen per Ring auf Kachel (0,0) und (19,13) klappt (Ringknöpfe im Fenster).
