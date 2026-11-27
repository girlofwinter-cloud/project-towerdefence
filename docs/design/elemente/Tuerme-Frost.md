# Tuerme-Frost (B-172): Stufe 3 „Eiszitadelle“ als eigene Figur des Turms Frost
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Tuerme-Frost. Backlog: B-172 (Skizze), Umsetzung B-173. Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
- Prinzip: Stufe 1 → 2 gleicher Grundkörper (wie heute); Stufe 3 ist ein **anderes Gebäude** (nur Eis, tiefes Blau), nicht Stufe 2 mit Anbau.
- SVG-Box Stufe 3: 80 × 140 Entwurfs-px (Stufe 1/2: 72 × 92). Maßstab Stufe 3 neu `FIGURE_STYLE.towerScale3.frost` = 1 (Stufe 1/2 bleibt `towerScale` = 1.15), Formen mit TILE/57.
- Desktop 1280x800 (Kachel 48,5 px): 68 × 119 px (Stufe 2: 70 × 90). Handy quer (Kachel 31,3 px): 44 × 77 px.
- Körper höchstens 74 Entwurfs-px breit (1,3 Kacheln, je Seite ≤ 15 % über die Kachel); nur Fernrohr/Flügelspitzen/Schatten dürfen bis 80 reichen.
- Fußpunkt: Schattenmitte (40, 134) auf `towerFoot` (22 Entwurfs-px unter der Kachelmitte) wie heute; die Figur wächst nur nach oben.
- glow [40, 40].

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure` / `stroke-figure-fine` | #2b1a10, 3 / 2,5 |
| Stufenmarke | `level-3` | #ff8a3d |
| Eis | ice-a → ice-b → neu: ice-deep (s3-ice) | #e8fbff → #8fd8f2 → #1f5d96 |
| Tor | `ice-deep` | #1f5d96 |
| Eisteller, Risse | ice-a / ice-c | #e8fbff / #3b8fcb |
| Glanz, Flocke | weiß | #ffffff |
| Schein | `s1-iceglow` |  |
- neu: `ice-deep` = #1f5d96: dunkelstes Eis (Eiszitadelle, Tor)

## Formen/SVG
`src/figures.js`, in `TOWER_SVG.frost` ein zweiter Eintrag `l3`; `towerFigure(type, level)` nimmt bei `level >= 3` diesen Eintrag (Cache-Schlüssel enthält die Stufe schon). Neue Gradienten in `src/svg-figure.js` (Tabelle neben s1-*): 's3-ice': linear diagonal, [[0,'#e8fbff'],[0.5,'#8fd8f2'],[1,'#1f5d96']]. `trim: []` = keine Goldbänder auf Stufe 3 (`trimSvg` muss leere Liste vertragen).
~~~js
  l3: {
    w: 80, h: 140, glow: [40,40], trim: [],
    svg: `<circle cx="40" cy="40" r="40" fill="url(#s1-iceglow)" opacity=".7"/><ellipse cx="40" cy="134" rx="34" ry="7" fill="rgba(30,20,50,.35)"/><ellipse cx="40" cy="130" rx="38" ry="9" fill="#e8fbff" stroke="#3b8fcb" stroke-width="2"/><path d="M10 129 L18 132 M62 132 L71 128 M28 134 L34 131" stroke="#3b8fcb" stroke-width="1.5" stroke-linecap="round"/><path d="M8 130 L11 72 L17 56 L23 72 L26 130 Z" fill="url(#s3-ice)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M72 130 L69 72 L63 56 L57 72 L54 130 Z" fill="url(#s3-ice)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 64 L12 124 M66 64 L68 124" stroke="#ffffff" stroke-width="2" opacity=".7" stroke-linecap="round"/><path d="M20 130 L22 96 L27 86 L31 96 L32 130 Z" fill="url(#s3-ice)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M60 130 L58 96 L53 86 L49 96 L48 130 Z" fill="url(#s3-ice)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M24 130 L26 90 L40 78 L54 90 L56 130 Z" fill="url(#s3-ice)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M31 92 L40 22 L49 92 Z" fill="url(#s3-ice)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M40 26 L37 88" stroke="#ffffff" stroke-width="2.5" opacity=".85" stroke-linecap="round"/><path d="M34 130 V118 a6 7 0 0 1 12 0 V130" fill="#1f5d96" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 98 V110 M35 101 L45 107 M45 101 L35 107" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/><g data-part="crystal"><path d="M40 0 L47 9 L40 18 L33 9 Z" fill="url(#s3-ice)" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 2 L38 9 L40 16" stroke="#ffffff" stroke-width="1.5" fill="none"/></g>`,
  },
~~~
Ruhe-Animation: Teil `crystal`: scaleX 1 → 0,25 → 1 (3 s, Mitte 40/9) und translateY ±3 Entwurfs-px (2,4 s).
Schuss: Leuchten wie heute (shotGlow.frost) an `glow`; Eisboden: Fläche Effekte-Eisboden.

## Zustände
- Stufe 1 und 2: unverändert (bestehende Figur, 0 bzw. 1 Goldband).
- Stufe 3: anderes Gebäude, keine Goldbänder, Stufenmarke `level-3`. Woran erkennbar (Silhouette und Material, nicht nur Farbe): Ganz aus Eis: Palast mit fünf Spitzen, kein Stein mehr; Mittlere Spitze am höchsten, Kristall schwebt darüber; Eisteller am Fuß = Eisboden.
- Aufwerten 2 → 3: Lichtsäule, Figur wechselt im hellsten Moment (Bauvorlage Effekte-Aufstieg).
- Gewählt/Reichweite, Verkaufen, Ziel-Modus: wie heute (Ringmenü unverändert).
- Shop-Vorschau (`FIGURE_STYLE.icon`): bleibt Stufe 1.
- reduced motion: Ruhe-Animation aus (Teil steht in Grundstellung).
- Handy quer: dieselbe Figur, kein Extra; Silhouette bei 77 px Höhe noch unterscheidbar (Zeichenfläche, Zeile Handy).

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/figures.js` | `l3`-Eintrag, `towerFigure` wählt ihn ab Stufe 3 |
| `src/svg-figure.js` | Gradienten s3-* (siehe Formen) |
| `src/render-towers.js` | Maßstab `towerScale3` ab Stufe 3, Ruhe-Animation des benannten Teils |
| `src/config.js` | `FIGURE_STYLE.towerScale3`, `FIGURE_STYLE.idle.frost` (Periode, Ausschlag), keine Spielwerte |
Keine IDs/Klassen betroffen.

## Tests
- Bestehend: `tests/fx.test.js` und `tests/render.test.js` (Turmzeichnung ausgewogen, Stufenmarke, Goldbänder) bleiben grün; kein Test muss geändert werden.
- Neu (`tests/render.test.js`): `towerFigure('frost', 3)` hat Box 80 × 140, enthält die s3-Gradienten und unterscheidet sich von Stufe 2; Zeichnen Stufe 3 bleibt ausgewogen (save/restore) und mit reduced motion ohne Ruhe-Versatz.

## Messbare Abnahme
- Screenshot `#game` 1280x800 mit Stufe 2 und 3 nebeneinander: Stufe 3 ist 29 px höher und auch aus der Entfernung (Bild auf 25 % verkleinert) als anderes Gebäude erkennbar (Vergleichsbild im PR neben der Zeichenfläche).
- Körper ragt je Seite höchstens 0,15 Kacheln über die eigene Kachel (Körperbreite ≤ 63 px bei 1280x800); Fußpunkt auf der Kachel.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
