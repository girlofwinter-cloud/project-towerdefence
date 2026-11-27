# Tuerme-Blitz (B-172): Stufe 3 „Sturmspule“ als eigene Figur des Turms Blitz
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Tuerme-Blitz. Backlog: B-172 (Skizze), Umsetzung B-174. Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
- Prinzip: Stufe 1 → 2 gleicher Grundkörper (wie heute); Stufe 3 ist ein **anderes Gebäude** (Eisen, Kupfer, Gewitterwolke, Elektroblau), nicht Stufe 2 mit Anbau.
- SVG-Box Stufe 3: 80 × 140 Entwurfs-px (Stufe 1/2: 72 × 96). Maßstab Stufe 3 neu `FIGURE_STYLE.towerScale3.lightning` = 1 (Stufe 1/2 bleibt `towerScale` = 1.15), Formen mit TILE/57.
- Desktop 1280x800 (Kachel 48,5 px): 68 × 119 px (Stufe 2: 70 × 94). Handy quer (Kachel 31,3 px): 44 × 77 px.
- Körper höchstens 74 Entwurfs-px breit (1,3 Kacheln, je Seite ≤ 15 % über die Kachel); nur Fernrohr/Flügelspitzen/Schatten dürfen bis 80 reichen.
- Fußpunkt: Schattenmitte (40, 134) auf `towerFoot` (22 Entwurfs-px unter der Kachelmitte) wie heute; die Figur wächst nur nach oben.
- glow [40, 32].

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure` / `stroke-figure-fine` | #2b1a10, 3 / 2,5 |
| Stufenmarke | `level-3` | #ff8a3d |
| Dreibein | neu: `iron-a / iron-b` | #5d5470 / #3a3346 |
| Spitze | neu: `copper-a → #c9794a → #7a3f1e (s3-copper)` | #e8a070 → #7a3f1e |
| Ringe | `gold` | #f2c14e |
| Wolke | neu: `cloud` | #4a4458 |
| Funken | neu: `bolt / neu: electric` | #fff6a8 / #8fb8ff |
| Schein | electric α 0,3 | #8fb8ff |
- neu: `iron-a` = #5d5470, `iron-b` = #3a3346: Eisen Sturmspule
- neu: `copper-a` = #e8a070: Kupfer Licht
- neu: `cloud` = #4a4458, `bolt` = #fff6a8, `electric` = #8fb8ff: Gewitter

## Formen/SVG
`src/figures.js`, in `TOWER_SVG.lightning` ein zweiter Eintrag `l3`; `towerFigure(type, level)` nimmt bei `level >= 3` diesen Eintrag (Cache-Schlüssel enthält die Stufe schon). Neue Gradienten in `src/svg-figure.js` (Tabelle neben s1-*): 's3-copper': linear x, [[0,'#e8a070'],[0.55,'#c9794a'],[1,'#7a3f1e']]. `trim: []` = keine Goldbänder auf Stufe 3 (`trimSvg` muss leere Liste vertragen).
~~~js
  l3: {
    w: 80, h: 140, glow: [40,32], trim: [],
    svg: `<circle cx="40" cy="34" r="30" fill="#8fb8ff" opacity=".3"/><ellipse cx="40" cy="134" rx="32" ry="7" fill="rgba(30,20,50,.35)"/><path d="M40 132 L40 78" fill="none" stroke="#2b1a10" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 132 L40 78" fill="none" stroke="#3a3346" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 132 L32 76 M72 132 L48 76" fill="none" stroke="#2b1a10" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 132 L32 76 M72 132 L48 76" fill="none" stroke="#5d5470" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 110 H62" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 110 H62" fill="none" stroke="#5d5470" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="128" width="12" height="6" rx="2" fill="#3a3346" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><rect x="65" y="128" width="12" height="6" rx="2" fill="#3a3346" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><rect x="34" y="128" width="12" height="6" rx="2" fill="#3a3346" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><ellipse cx="40" cy="78" rx="17" ry="5" fill="#3a3346" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M29 78 L36 38 H44 L51 78 Z" fill="url(#s3-copper)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M30 72 Q40 76 50 72 M31.5 64 Q40 68 48.5 64 M33 56 Q40 60 47 56 M34.5 48 Q40 51 45.5 48" fill="none" stroke="#7a3f1e" stroke-width="2.5"/><ellipse cx="40" cy="58" rx="20" ry="5" fill="none" stroke="#2b1a10" stroke-width="4.5"/><ellipse cx="40" cy="58" rx="20" ry="5" fill="none" stroke="#f2c14e" stroke-width="2"/><ellipse cx="40" cy="44" rx="15" ry="4" fill="none" stroke="#2b1a10" stroke-width="4"/><ellipse cx="40" cy="44" rx="15" ry="4" fill="none" stroke="#f2c14e" stroke-width="1.8"/><circle cx="40" cy="32" r="9" fill="url(#s1-orb)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><g data-part="cloud"><path d="M20 19 Q18 9 28 9 Q32 1 42 5 Q52 1 56 9 Q64 9 62 19 Z" fill="#4a4458" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/></g><g data-part="spark"><path d="M40 19 L36 23 L42 25 L39 30" fill="none" stroke="#fff6a8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 34 L22 38 L26 42 L16 46 M49 34 L58 38 L54 42 L64 46" fill="none" stroke="#8fb8ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  },
~~~
Ruhe-Animation: Teil `cloud` translateY ±3 (2,4 s); Teil `spark` an/aus in Stufen (an 0–0,27 s, aus bis 0,4, an bis 0,63, aus bis 0,9 s).
Schuss: Kettenblitz startet an der Kugel (40/32), Breite ×1,5, je Segment ein Ast; Gewitter: Fläche Effekte-Gewitter.

## Zustände
- Stufe 1 und 2: unverändert (bestehende Figur, 0 bzw. 1 Goldband).
- Stufe 3: anderes Gebäude, keine Goldbänder, Stufenmarke `level-3`. Woran erkennbar (Silhouette und Material, nicht nur Farbe): Eisernes Dreibein statt Steinsockel; Kupferspitze mit Windungen, zwei schwebende Goldringe; Eigene Gewitterwolke über der Kugel = Gewitter.
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
| `src/config.js` | `FIGURE_STYLE.towerScale3`, `FIGURE_STYLE.idle.lightning` (Periode, Ausschlag), keine Spielwerte |
Keine IDs/Klassen betroffen.

## Tests
- Bestehend: `tests/fx.test.js` und `tests/render.test.js` (Turmzeichnung ausgewogen, Stufenmarke, Goldbänder) bleiben grün; kein Test muss geändert werden.
- Neu (`tests/render.test.js`): `towerFigure('lightning', 3)` hat Box 80 × 140, enthält die s3-Gradienten und unterscheidet sich von Stufe 2; Zeichnen Stufe 3 bleibt ausgewogen (save/restore) und mit reduced motion ohne Ruhe-Versatz.

## Messbare Abnahme
- Screenshot `#game` 1280x800 mit Stufe 2 und 3 nebeneinander: Stufe 3 ist 25 px höher und auch aus der Entfernung (Bild auf 25 % verkleinert) als anderes Gebäude erkennbar (Vergleichsbild im PR neben der Zeichenfläche).
- Körper ragt je Seite höchstens 0,15 Kacheln über die eigene Kachel (Körperbreite ≤ 63 px bei 1280x800); Fußpunkt auf der Kachel.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
