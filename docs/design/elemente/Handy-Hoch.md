# Handy-Hoch (C6): Hochformat 390x844 / 360x740
Fläche: `canvas/project/Handy-Hoch.dc.html`. Ersetzt im Media-Block der Kompakt-Ansicht aus C den Teil für Hochformat. Dateien: style.css, index.html (Dock-Hülle), main.js (Zoom-Knopf, Startposition), tests/e2e.
Media Query: `@media (max-width: 759.98px) and (orientation: portrait)`.

## Aufteilung (390x844)
| Zone | y | Inhalt |
|---|---|---|
| Kopfleiste | 0–56 (+ `env(safe-area-inset-top)`) | HUD-Leiste kompakt links (Zahl 20 px, Symbole 28, Höhe 44, ca. 226 breit), rechts 3 runde Knöpfe 44 px (Ton, Tempo, Pause), Abstand 6 |
| Feld | 56 – (vh − 160) | Feld füllt die Höhe, seitlich wischen; Kachel 45,6 px (390x844), 38,1 px (360x740) |
| Dock | vh − 160 – vh | Zeile 1: Fähigkeiten 3 × 56 links + Zoom-Knopf 44 rechts; Zeile 2: Wellenknopf volle Breite, 52 hoch |

Feldmaß: `--u: calc((100vh - 56px - 160px) / 560)` (dvh, wo vorhanden: `100dvh`). Canvas `900u x 660u`, in `.stage` mit `overflow-x: auto; overflow-y: hidden; height: calc(100dvh - 216px)`, Canvas `margin-top: calc(-50 * var(--u))` (Rand oben/unten abgeschnitten, links/rechts sichtbar beim Wischen). `touch-action: pan-x` auf `.stage`, Tippen auf den Canvas bleibt Bauen (Ring). Startposition: `scrollLeft` so, dass der erste Eingang (Fahne) links sichtbar ist (= 0).
Wisch-Hinweis: Pille "Wischen für mehr Feld" mit Pfeil, unten mittig über dem Feld, verschwindet nach erstem Scroll (`.stage.scrolled`), reduced motion: ohne Wackeln. Schattenkanten links/rechts: `.stage::before/::after` 18 px `linear-gradient(90deg, rgba(0,0,0,.35), transparent)` nur wenn weiter wischbar (Klassen `can-left`/`can-right` aus main.js bei `scroll`).

## Zoom-Knopf (`#zoom`)
Bedeutung umgedreht: Standard = **Nah** (oben). Knopf schaltet auf **Übersicht** (`.zoomed-out`: `--u: calc((100vw - 12px) / 900)`, ganzes Feld sichtbar, Kachel 19 px; Bauen über Ring geht weiter) und zurück. Symbol: Lupe minus / Lupe plus (Kreis r9 + Griff, Strich wie andere Symbole), `aria-label` "Übersicht" / "Nah", `aria-pressed`.

## Dock (fest unten)
```css
.dock { position: fixed; left: 0; right: 0; bottom: 0; z-index: 18; height: calc(160px + env(safe-area-inset-bottom)); padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
  background: linear-gradient(#a4672f, #7a4520); border-top: 3px solid #2b1a10; border-radius: 16px 16px 0 0; box-shadow: inset 0 2px 0 rgba(255,220,160,.55);
  display: grid; grid-template-columns: 1fr 44px; grid-template-rows: 78px 52px; gap: 10px; }
.dock .abilities { position: static; transform: none; width: auto; background: none; border: 0; box-shadow: none; padding: 0; flex-direction: row; gap: 18px; align-items: start; }
.dock .ab { width: 56px; height: 56px; }
.dock .wave-btn { grid-column: 1 / -1; width: 100%; height: 52px; border-radius: 26px; font-size: 22px; }
.dock #wave-preview { display: none; } /* Vorschau als title und im Startbild-Text der Welle */
```
Markup: `#abilities`, `#zoom`, `#start-wave` stehen im Hochformat in `<div class="dock">` (eine Hülle in index.html; auf Desktop `display: contents`).
Turm-Leiste (Menue-Ring-Turm kompakt) liegt über dem Dock (z-index 20), `body:has(#tower-info:not([hidden])) .stage` behält seine Höhe (Feld wird nicht verschoben).

## Tests
- smoke "Handy: Bauen per Touch … Zoom vergrößert": neu "Zoom auf Übersicht verkleinert": `box.width` nach Tipp < 0,5 × vorher. Bauen per Ring (zwei Tipps).
- buttons Handy ≥ 44: Fähigkeiten 56, Zoom/Pause/Tempo 44 → grün; `assert.equal(hs.length, 6)` bleibt.
- panel Handy (390x844, 360x740): Leiste unten, `MIN_CANVAS = 280`: sichtbarer Feldteil über der Leiste ≥ 280 (Feld 56…ca. 580) → grün; "kein horizontaler Scroll" der Seite: Seite scrollt nicht, nur `.stage` → grün.
- panel-polish "ganz unten verdeckt": Liste auf `['.stage', '.dock']` anpassen (Dock darf von der Leiste verdeckt sein → Erwartung: Leiste deckt Dock ganz ab, Feld nicht).
- Neu: 390x844 ohne Seiten-Scroll (`scrollHeight <= innerHeight`), Kachel ≥ 44 px (`canvas.getBoundingClientRect().width / 900 * 40 >= 44`), Dock-Unterkante = Fensterunterkante.

## Schmal (< 380 px Breite, z. B. 360x740)
HUD-Zahlen 18 px, Symbole 24 px, Welle ohne "/ 20" (nur Zahl, `#wave small { display:none }`), damit die Leiste neben den drei 44-px-Knöpfen Platz hat (Fläche zeigt bei 360 noch die zu breite Fassung).
