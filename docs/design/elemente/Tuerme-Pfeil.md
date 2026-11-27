# Tuerme-Pfeil (B-172): Stufe 3 „Adlerhorst“ als eigene Figur des Turms Pfeil
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Tuerme-Pfeil. Backlog: B-172 (Skizze), Umsetzung B-173. Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
- Prinzip: Stufe 1 → 2 gleicher Grundkörper (wie heute); Stufe 3 ist ein **anderes Gebäude** (Marmor, Gold, Himmelblau), nicht Stufe 2 mit Anbau.
- SVG-Box Stufe 3: 80 × 140 Entwurfs-px (Stufe 1/2: 68 × 90). Maßstab Stufe 3 neu `FIGURE_STYLE.towerScale3.arrow` = 1 (Stufe 1/2 bleibt `towerScale` = 1.15), Formen mit TILE/57.
- Desktop 1280x800 (Kachel 48,5 px): 68 × 119 px (Stufe 2: 67 × 88). Handy quer (Kachel 31,3 px): 44 × 77 px.
- Körper höchstens 74 Entwurfs-px breit (1,3 Kacheln, je Seite ≤ 15 % über die Kachel); nur Fernrohr/Flügelspitzen/Schatten dürfen bis 80 reichen.
- Fußpunkt: Schattenmitte (40, 134) auf `towerFoot` (22 Entwurfs-px unter der Kachelmitte) wie heute; die Figur wächst nur nach oben.
- kein drehender Teil (Armbrust zeigt nach oben, Spuren gehen von dort aus).

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure` / `stroke-figure-fine` | #2b1a10, 3 / 2,5 |
| Stufenmarke | `level-3` | #ff8a3d |
| Marmor | neu: `marble-a → marble-b → marble-c (s3-marble)` | #fbf7ef → #e2d9c8 → #b8ab95 |
| Adler, Balkon | gold-light → gold → gold-dark (s3-gold) | #ffe27a → #f2c14e → #b9851d |
| Adlerkopf | `cream` | #fff3d2 |
| Banner | `castle-flag` | #3a7bd5 |
| Armbrust, Bolzen | wood-fig-b / wood-fig-a | #8a5326 / #c88a4c |
- neu: `marble-a` = #fbf7ef, `marble-b` = #e2d9c8, `marble-c` = #b8ab95: Marmor Adlerhorst

## Formen/SVG
`src/figures.js`, in `TOWER_SVG.arrow` ein zweiter Eintrag `l3`; `towerFigure(type, level)` nimmt bei `level >= 3` diesen Eintrag (Cache-Schlüssel enthält die Stufe schon). Neue Gradienten in `src/svg-figure.js` (Tabelle neben s1-*): 's3-marble': linear 0→1 x, [[0,'#fbf7ef'],[0.6,'#e2d9c8'],[1,'#b8ab95']]; 's3-gold': linear diagonal, [[0,'#ffe27a'],[0.5,'#f2c14e'],[1,'#b9851d']]. `trim: []` = keine Goldbänder auf Stufe 3 (`trimSvg` muss leere Liste vertragen).
~~~js
  l3: {
    w: 80, h: 140, trim: [],
    svg: `<ellipse cx="40" cy="134" rx="32" ry="7" fill="rgba(30,20,50,.35)"/><path d="M10 134 L14 118 H66 L70 134 Z" fill="url(#s3-marble)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M18 118 L24 58 H56 L62 118 Z" fill="url(#s3-marble)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M21 104 H59 M23 84 H57" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 104 H59 M23 84 H57" fill="none" stroke="#f2c14e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 134 V124 a7 8 0 0 1 14 0 V134" fill="#3a2a1e" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><g data-part="banners"><path d="M26 62 H35 V96 L30.5 90 L26 96 Z" fill="#3a7bd5" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M45 62 H54 V96 L49.5 90 L45 96 Z" fill="#3a7bd5" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 70 L30.5 74 L33 70 M47 70 L49.5 74 L52 70" fill="none" stroke="#f2c14e" stroke-width="2" stroke-linecap="round"/></g><path d="M40 24 Q28 20 18 10 Q10 3 3 1 Q8 8 7 12 Q12 12 12 16 Q18 16 18 21 Q26 26 40 30 Z" fill="url(#s3-gold)" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 24 Q52 20 62 10 Q70 3 77 1 Q72 8 73 12 Q68 12 68 16 Q62 16 62 21 Q54 26 40 30 Z" fill="url(#s3-gold)" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 8 L20 16 M66 8 L60 16 M24 16 L28 22 M56 16 L52 22" stroke="#b9851d" stroke-width="2" stroke-linecap="round"/><ellipse cx="40" cy="26" rx="7" ry="9" fill="url(#s3-gold)" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="40" cy="12" r="6.5" fill="#fff3d2" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M45 11 L52 14 L45 17 Z" fill="#f2c14e" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><circle cx="41.5" cy="10.5" r="1.4" fill="#2b1a10"/><rect x="10" y="48" width="60" height="11" rx="3" fill="url(#s3-gold)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M24 46 Q40 36 56 46" fill="none" stroke="#2b1a10" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 46 Q40 36 56 46" fill="none" stroke="#8a5326" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 48 L26 38" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 48 L26 38" fill="none" stroke="#c88a4c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26" cy="38" r="3" fill="#f2c14e" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/><path d="M40 48 L40 34" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 48 L40 34" fill="none" stroke="#c88a4c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="34" r="3" fill="#f2c14e" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/><path d="M40 48 L54 38" fill="none" stroke="#2b1a10" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 48 L54 38" fill="none" stroke="#c88a4c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="54" cy="38" r="3" fill="#f2c14e" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/><path d="M22 62 L19 116" stroke="#ffffff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`,
  },
~~~
Ruhe-Animation: Teil `banners`: skewX 0 ↔ 3° um die Oberkante, 2 s.
Schuss: drei Bolzen starten am Balkon (40/48); Mehrfachschuss: Fläche Effekte-Mehrfachschuss.

## Zustände
- Stufe 1 und 2: unverändert (bestehende Figur, 0 bzw. 1 Goldband).
- Stufe 3: anderes Gebäude, keine Goldbänder, Stufenmarke `level-3`. Woran erkennbar (Silhouette und Material, nicht nur Farbe): Eigenes Gebäude: schlanker Marmorturm statt Stein und Holz; Goldener Adler mit ausgebreiteten Flügeln als Krone (oben breit); Balkon mit Dreifach-Armbrust, drei Bolzen gefächert = Mehrfachschuss.
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
| `src/config.js` | `FIGURE_STYLE.towerScale3`, `FIGURE_STYLE.idle.arrow` (Periode, Ausschlag), keine Spielwerte |
Keine IDs/Klassen betroffen.

## Tests
- Bestehend: `tests/fx.test.js` und `tests/render.test.js` (Turmzeichnung ausgewogen, Stufenmarke, Goldbänder) bleiben grün; kein Test muss geändert werden.
- Neu (`tests/render.test.js`): `towerFigure('arrow', 3)` hat Box 80 × 140, enthält die s3-Gradienten und unterscheidet sich von Stufe 2; Zeichnen Stufe 3 bleibt ausgewogen (save/restore) und mit reduced motion ohne Ruhe-Versatz.

## Messbare Abnahme
- Screenshot `#game` 1280x800 mit Stufe 2 und 3 nebeneinander: Stufe 3 ist 31 px höher und auch aus der Entfernung (Bild auf 25 % verkleinert) als anderes Gebäude erkennbar (Vergleichsbild im PR neben der Zeichenfläche).
- Körper ragt je Seite höchstens 0,15 Kacheln über die eigene Kachel (Körperbreite ≤ 63 px bei 1280x800); Fußpunkt auf der Kachel.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
