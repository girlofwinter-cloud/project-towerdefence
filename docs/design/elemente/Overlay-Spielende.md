# Overlay-Spielende (C5): Gewonnen / Verloren als Plakette, Pause-Banner
Fläche: `canvas/project/Overlay-Spielende.dc.html`. Dateien: index.html, style.css, main.js (saveResult, Knöpfe).
## Verhalten
- `#overlay` bleibt über `.stage` (dunkelt nur das Spiel ab, rgba(16,28,14,.7)), darin eine Plakette `.end-card`.
- Knöpfe: `#restart` (Gold, Text wie bisher "Neues Spiel" bzw. "Weiter: Eiswelt") und neu `#to-maps` "Karten" (Holz) → Startbild.
- Gewonnen: Band rot `#c4452f` mit "Gewonnen!", darunter 3 Sterne (erreichte Sterne voll, Plopp nacheinander 0,15 s versetzt; reduced motion: ohne). Verloren: Band grau-braun `#6b5a48` mit "Verloren", keine Sterne.
- `#overlay-stats` "Welle 20 · 312 Gegner besiegt", `#overlay-progress` Zeilen wie bisher (`.result-highlight` Gold).
## Maße
Plakette 520 breit, Innenabstand 64 oben / 24 seitlich / 22 unten, Radius 22. Band: SVG 560x70 über dem oberen Rand (top −34), Form
`<path d="M20 10 H540 L524 35 L540 60 H20 L36 35 Z" fill="#c4452f" stroke="#2b1a10" stroke-width="4" stroke-linejoin="round"/>`, Text Lilita 44 #fff3d2, Kontur ±3.
Sterne 52 px (Stern-Pfad aus Start-Kartenwahl), Abstand 10. Knöpfe: `#restart` 46 hoch, Lilita 22, `linear-gradient(#ffd45a,#e08a1c)`; `#to-maps` `.wbtn` 46 hoch. Abstand 12.
## CSS
```css
#overlay { background: rgba(16,28,14,.7); }
.end-card { position: relative; width: 520px; padding: 64px 24px 22px; border-radius: 22px; text-align: center; } /* + .plq */
.end-ribbon { position: absolute; left: -20px; top: -34px; width: 560px; height: 70px; }
.end-ribbon text { font: 44px var(--display); }
.end-stars { display: flex; justify-content: center; gap: 10px; margin: 0 0 8px; }
.end-stars svg { animation: star-pop .35s ease-out both; } .end-stars svg:nth-child(2) { animation-delay: .15s; } .end-stars svg:nth-child(3) { animation-delay: .3s; }
@keyframes star-pop { from { transform: scale(0); } 70% { transform: scale(1.2); } }
#overlay-stats { font: 18px 'Trebuchet MS', sans-serif; color: #fff3d2; margin: 0 0 6px; }
.end-actions { display: flex; justify-content: center; gap: 12px; margin-top: 10px; }
@media (prefers-reduced-motion: reduce) { .end-stars svg { animation: none; } }
```
`#overlay-title` (h2) wird zum `<text>` im Band (main.js setzt `textContent`), Trophäe/Totenkopf-Icon entfällt.
Pause-Banner: wie in C (`#pause-banner` als Plakette Lilita 34) – keine Änderung.
## Tests
progress "Sieg … Overlay meldet es" und testpage "Sieg erzwingen" prüfen `.result-highlight`/`#overlay-progress` → unverändert. panel-edge "Neustart-Knopf erreichbar" → unverändert (`#restart`). Neu: `#to-maps` öffnet `#start-screen`.
