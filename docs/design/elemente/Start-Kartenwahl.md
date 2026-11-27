# Start-Kartenwahl (C5): Startbildschirm mit Kartenkarten
Fläche: `canvas/project/Start-Kartenwahl.dc.html`. Ersetzt `.map-pick` und das `<select id="map-select">`. Dateien: index.html, style.css, main.js, render-painted.js (Vorschaubilder), progress.js nur lesen.

## Verhalten
- Erscheint beim Laden (außer Testseite `?test`, dort wie bisher direkt im Spiel) und über "Karten" im Spielende-Fenster. Spiel ist dahinter pausiert (`state` noch nicht gestartet; Musik der vorgewählten Karte darf laufen).
- 5 Karten in `MAP_ORDER`. Klick/Enter auf eine offene Karte = Karte laden (`mapId = id; progress.lastMap = id; saveProgress; restart()`) und Startbild schließen. Vorgewählt (Fokus + gelber Ring) ist `startMap(progress)`.
- Gesperrt: Karte grau, Schloss, Text "Gewinne erst {Vorgänger}", `disabled`.
- Tasten: Pfeil links/rechts bewegt den Fokus, Enter/Leertaste startet, Esc schließt das Startbild nur, wenn schon ein Spiel läuft.
- Rechts oben bleiben Ton und Hilfe (`.top-buttons`) erreichbar; HUD-Leiste, Fähigkeiten, Wellenreihe sind ausgeblendet (`body.on-start`).

## Maße (1280x800)
- Titel-Plakette mittig, top 70: `.plq` 640x86, Radius 22, Text "Project TowerDefence" Lilita 50, #fff3d2, Kontur wie `.num` (±3 px), links Burg-SVG 64 px (Burgform aus render-painted `CASTLE`, scale .5).
- Kartenreihe: top 210, 5 Karten à 196x290, Abstand 20 (gesamt 1060, mittig). Unter 1100 px Breite: Karten 172 breit, Abstand 12; kompakt: 2 Spalten, scrollbar.
- Karte (`button.map-card.plq`): Radius 18, Innenabstand 12. Vorschaubild 172x120 (Feld 20:14), Radius 10, Rand 3 #2b1a10. Name Lilita 24 (#fff3d2, Kontur 2). Sterne: 3 x 24 px, voll #f2c14e, leer #5a3a22, je Kontur #2b1a10. Zeile "Beste Welle 14 / 20" Trebuchet 14 #e8d3a8 (0 → "Noch nicht gespielt").
- Gewählt/Fokus: `transform: translateY(-6px)`, `box-shadow: 0 0 0 4px #ffe266, 0 10px 0 rgba(30,15,5,.45)`. Hover: `filter: brightness(1.08)`.
- Gesperrt: Bild `filter: grayscale(1) brightness(.45)`, Schloss-SVG 44 px mittig auf dem Bild, Name #c9b89a, Zeile "Gewinne erst Wiese".
- Unter den Karten: Zeile "Klicke eine Karte zum Starten" (Trebuchet 16, #fff3d2, Schatten), top 530.
- Hintergrund: `#backdrop` (unscharf) + `rgba(16,28,14,.45)`.

## Vorschaubilder
`thumbFor(mapId)`: `rasterizePainted(buildPaintedSvg(createGame({ mapId })), 0.25)` (225x165), davon das Feld (Ausschnitt `12.5, 12.5, 200, 140`) auf ein `<canvas class="map-thumb" width="344" height="240">` (2x für scharf) zeichnen. Nacheinander erzeugen (eine Karte je `requestIdleCallback` bzw. `setTimeout 0`), gecacht; bis fertig: Fläche in der Bodenfarbe der Karte (`themed(id,'ground').base`).
SVG Schloss: siehe Fläche (Bügel `M13 20 V14 a9 9 0 0 1 18 0 V20`, Körper 28x20 #f2c14e).

## HTML
```html
<section id="start-screen" aria-labelledby="start-title">
  <h1 id="start-title" class="start-title plq">Project TowerDefence</h1>
  <div class="map-cards" role="list"><!-- main.js: je Karte -->
    <button class="map-card plq" data-map="meadow" role="listitem" aria-label="Wiese, 2 von 3 Sternen, beste Welle 14">
      <canvas class="map-thumb" width="344" height="240"></canvas>
      <span class="map-name">Wiese</span><span class="map-stars"><!-- 3 SVG --></span><span class="map-best">Beste Welle 14 / 20</span>
    </button>
  </div>
  <p class="start-hint">Klicke eine Karte zum Starten</p>
</section>
```
## CSS
```css
#start-screen { position: fixed; inset: 0; z-index: 40; display: flex; flex-direction: column; align-items: center; padding-top: 70px; background: rgba(16,28,14,.45); }
#start-screen[hidden] { display: none; }
body.on-start .hud, body.on-start .abilities, body.on-start .wave-row, body.on-start .stage { visibility: hidden; }
.start-title { position: relative; margin: 0; width: 640px; height: 86px; border-radius: 22px; display: grid; place-items: center; font: 50px/1 var(--display);
  text-shadow: -3px 0 #2b1a10, 3px 0 #2b1a10, 0 -3px #2b1a10, 0 3px #2b1a10, 0 5px 0 #2b1a10; }
.map-cards { display: flex; gap: 20px; margin-top: 54px; }
.map-card { position: relative; width: 196px; height: 290px; padding: 12px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.map-thumb { width: 172px; height: 120px; border-radius: 10px; border: 3px solid #2b1a10; box-sizing: border-box; }
.map-name { font: 24px/1.1 var(--display); color: #fff3d2; text-shadow: 0 2px 0 #2b1a10; margin-top: 4px; }
.map-stars { display: flex; gap: 4px; }
.map-best { font: 14px 'Trebuchet MS', sans-serif; color: #e8d3a8; }
.map-card:hover:not(:disabled) { filter: brightness(1.08); }
.map-card:focus-visible, .map-card.current { transform: translateY(-6px); box-shadow: 0 0 0 4px #ffe266, 0 10px 0 rgba(30,15,5,.45); outline: none; }
.map-card:disabled { cursor: default; } .map-card:disabled .map-thumb { filter: grayscale(1) brightness(.45); } .map-card:disabled .map-name { color: #c9b89a; }
.map-lock { position: absolute; left: 76px; top: 50px; }
.start-hint { margin-top: 26px; font: 16px 'Trebuchet MS', sans-serif; color: #fff3d2; text-shadow: 0 2px 0 #2b1a10; }
@media (max-width: 1100px) { .map-card { width: 172px; } .map-thumb { width: 148px; height: 104px; } .map-cards { gap: 12px; } }
@media (max-width: 759.98px), (max-height: 519.98px) { #start-screen { position: absolute; min-height: 100%; padding: 16px 8px; overflow: auto; } .start-title { width: 100%; height: 64px; font-size: 32px; }
  .map-cards { flex-wrap: wrap; justify-content: center; margin-top: 18px; } .map-card { width: 168px; height: 250px; } .map-thumb { width: 144px; height: 100px; } }
```
## Tests
- Alle e2e ohne `?test`: neuer Helfer `enterGame(page, mapId?)` in `tests/e2e/tile.mjs`: wartet auf `#start-screen`, klickt `.map-card[data-map=id]` (ohne id: `.map-card.current`). Betroffen: buttons, panel*, progress, smoke.
- progress (B-101, Freischalten): `#map-select`-Abfragen ersetzen: offen = `.map-card[data-map=x]:not(:disabled)`, gewählt = `.map-card.current`, Sterne = `aria-label`. "Kartenwechsel während laufender Welle abgelehnt": Startbild ist während einer Welle nicht erreichbar → Test prüft, dass "Karten" im Spielende-Fenster erst nach Spielende existiert.
- buttons B-096 "(gesperrt)": stattdessen `aria-label` der gesperrten Karte enthält "gesperrt".
- Neu: Startbild bei 1280x800 ohne Scrollen, alle 5 Karten sichtbar; Enter startet die vorgewählte Karte.
