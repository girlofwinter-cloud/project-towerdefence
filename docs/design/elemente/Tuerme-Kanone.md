# Tuerme-Kanone (B-172): Stufe 3 „Mörserfestung“ als eigene Figur des Turms Kanone
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Tuerme-Kanone. Backlog: B-172 (Skizze), Umsetzung B-173. Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
- Prinzip: Stufe 1 → 2 gleicher Grundkörper (wie heute); Stufe 3 ist ein **anderes Gebäude** (Basalt mit Lava-Glut), nicht Stufe 2 mit Anbau.
- SVG-Box Stufe 3: 80 × 140 Entwurfs-px (Stufe 1/2: 72 × 84). Maßstab Stufe 3 neu `FIGURE_STYLE.towerScale3.cannon` = 1 (Stufe 1/2 bleibt `towerScale` = 1.2), Formen mit TILE/57.
- Desktop 1280x800 (Kachel 48,5 px): 68 × 119 px (Stufe 2: 74 × 86). Handy quer (Kachel 31,3 px): 44 × 77 px.
- Körper höchstens 74 Entwurfs-px breit (1,3 Kacheln, je Seite ≤ 15 % über die Kachel); nur Fernrohr/Flügelspitzen/Schatten dürfen bis 80 reichen.
- Fußpunkt: Schattenmitte (40, 134) auf `towerFoot` (22 Entwurfs-px unter der Kachelmitte) wie heute; die Figur wächst nur nach oben.
- pivot [40, 80] (Achse), muzzle [40, 26].

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure` / `stroke-figure-fine` | #2b1a10, 3 / 2,5 |
| Stufenmarke | `level-3` | #ff8a3d |
| Basalt | map-volcano-2 → map-volcano-3 (s3-basalt) | #4a3a38 → #2d1f20 |
| Lava-Risse | lava α 0,55 (5) + lava-core (2) | #ff7a1f / #ffc23a |
| Ofentür | lava-hot → lava-core → lava (s3-lava) | #ffe58a → #ff7a1f |
| Mörser | (Code wie Stufe 1/2) #3a2d44 / #5d4a66 |  |
| Mündung, Schlotglut | `lava-core` | #ffc23a |
| Nieten, Bänder | `gold-dark` | #b9851d |
| Rauch | stone-c α 0,75 | #8a7560 |


## Formen/SVG
`src/figures.js`, in `TOWER_SVG.cannon` ein zweiter Eintrag `l3`; `towerFigure(type, level)` nimmt bei `level >= 3` diesen Eintrag (Cache-Schlüssel enthält die Stufe schon). Neue Gradienten in `src/svg-figure.js` (Tabelle neben s1-*): 's3-basalt': linear x, [[0,'#4a3a38'],[1,'#2d1f20']]; 's3-lava': radial cx .5 cy .7 r .7, [[0,'#ffe58a'],[0.5,'#ffc23a'],[1,'#ff7a1f']]. `trim: []` = keine Goldbänder auf Stufe 3 (`trimSvg` muss leere Liste vertragen).
~~~js
  l3: {
    w: 80, h: 140, pivot: [40,80], muzzle: [40,26], trim: [],
    svg: `<ellipse cx="40" cy="130" rx="38" ry="9" fill="#ff7a1f" opacity=".35"/><ellipse cx="40" cy="134" rx="34" ry="7" fill="rgba(30,20,50,.35)"/><path d="M4 134 L8 104 H72 L76 134 Z" fill="url(#s3-basalt)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M14 104 L18 82 H62 L66 104 Z" fill="url(#s3-basalt)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M12 130 L20 120 L16 112 M68 130 L60 120 L66 110 M22 100 L28 92 M58 100 L52 90" fill="none" stroke="#ff7a1f" stroke-width="5" opacity=".55" stroke-linecap="round"/><path d="M12 130 L20 120 L16 112 M68 130 L60 120 L66 110 M22 100 L28 92 M58 100 L52 90" fill="none" stroke="#ffc23a" stroke-width="2" stroke-linecap="round"/><path d="M29 134 V121 a11 11 0 0 1 22 0 V134" fill="url(#s3-lava)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M34 134 V125 M40 134 V122 M46 134 V125" stroke="#2b1a10" stroke-width="2"/><rect x="5" y="80" width="11" height="24" fill="url(#s3-basalt)" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><rect x="64" y="80" width="11" height="24" fill="url(#s3-basalt)" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="10.5" cy="80" rx="5.5" ry="2" fill="#ffc23a" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="69.5" cy="80" rx="5.5" ry="2" fill="#ffc23a" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/><g data-part="smoke"><circle cx="10" cy="71" r="5" fill="#8a7560" opacity=".75" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/><circle cx="7" cy="62" r="4" fill="#8a7560" opacity=".6" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/><circle cx="70" cy="71" r="5" fill="#8a7560" opacity=".75" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/><circle cx="73" cy="62" r="4" fill="#8a7560" opacity=".6" stroke="#2b1a10" stroke-width="1.5" stroke-linejoin="round"/></g><g data-part="turn"><path d="M24 80 L27 34 H53 L56 80 Z" fill="#3a2d44" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><rect x="22" y="26" width="36" height="13" rx="5" fill="#5d4a66" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><ellipse cx="40" cy="29" rx="13" ry="3.5" fill="#ffc23a" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><path d="M26 52 H54 M25 66 H55" stroke="#b9851d" stroke-width="3"/><path d="M31 41 V76" stroke="#a48fb8" stroke-width="3" opacity=".6" stroke-linecap="round"/></g><circle cx="40" cy="80" r="11" fill="url(#s3-basalt)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="80" r="4" fill="#ffc23a" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="114" r="2.2" fill="#b9851d" stroke="#2b1a10" stroke-width="1" stroke-linejoin="round"/><circle cx="60" cy="114" r="2.2" fill="#b9851d" stroke="#2b1a10" stroke-width="1" stroke-linejoin="round"/><circle cx="26" cy="94" r="2.2" fill="#b9851d" stroke="#2b1a10" stroke-width="1" stroke-linejoin="round"/><circle cx="54" cy="94" r="2.2" fill="#b9851d" stroke="#2b1a10" stroke-width="1" stroke-linejoin="round"/>`,
  },
~~~
Ruhe-Animation: Teil `smoke`: translateY 0 → −8 Entwurfs-px, Deckkraft 1 → 0, 1,6 s, dann von vorn.
Schuss: Mörser neigt sich wie heute (`cannonTilt`), Mündungsfeuer ×1,4 und Glut-Funken; Brandfläche: Fläche Effekte-Brandflaeche.

## Zustände
- Stufe 1 und 2: unverändert (bestehende Figur, 0 bzw. 1 Goldband).
- Stufe 3: anderes Gebäude, keine Goldbänder, Stufenmarke `level-3`. Woran erkennbar (Silhouette und Material, nicht nur Farbe): Gedrungene Basalt-Festung in zwei Stufen, Lava-Risse glühen; Dicker Mörser mit glühender Mündung statt schlankem Rohr; Zwei Schlote mit Glut und Rauch, Ofentür mit Gitter.
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
| `src/config.js` | `FIGURE_STYLE.towerScale3`, `FIGURE_STYLE.idle.cannon` (Periode, Ausschlag), keine Spielwerte |
Keine IDs/Klassen betroffen.

## Tests
- Bestehend: `tests/fx.test.js` und `tests/render.test.js` (Turmzeichnung ausgewogen, Stufenmarke, Goldbänder) bleiben grün; kein Test muss geändert werden.
- Neu (`tests/render.test.js`): `towerFigure('cannon', 3)` hat Box 80 × 140, enthält die s3-Gradienten und unterscheidet sich von Stufe 2; Zeichnen Stufe 3 bleibt ausgewogen (save/restore) und mit reduced motion ohne Ruhe-Versatz.

## Messbare Abnahme
- Screenshot `#game` 1280x800 mit Stufe 2 und 3 nebeneinander: Stufe 3 ist 33 px höher und auch aus der Entfernung (Bild auf 25 % verkleinert) als anderes Gebäude erkennbar (Vergleichsbild im PR neben der Zeichenfläche).
- Körper ragt je Seite höchstens 0,15 Kacheln über die eigene Kachel (Körperbreite ≤ 63 px bei 1280x800); Fußpunkt auf der Kachel.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
