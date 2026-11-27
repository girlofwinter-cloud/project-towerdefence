# Tuerme-Scharfschuetze (B-172): Stufe 3 „Falkenauge“ als eigene Figur des Turms Scharfschütze
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Tuerme-Scharfschuetze. Backlog: B-172 (Skizze), Umsetzung B-174. Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
- Prinzip: Stufe 1 → 2 gleicher Grundkörper (wie heute); Stufe 3 ist ein **anderes Gebäude** (Ziegel, dunkles Holz, Messing, rote Linse), nicht Stufe 2 mit Anbau.
- SVG-Box Stufe 3: 80 × 140 Entwurfs-px (Stufe 1/2: 76 × 104). Maßstab Stufe 3 neu `FIGURE_STYLE.towerScale3.sniper` = 1 (Stufe 1/2 bleibt `towerScale` = 1.08), Formen mit TILE/57.
- Desktop 1280x800 (Kachel 48,5 px): 68 × 119 px (Stufe 2: 70 × 96). Handy quer (Kachel 31,3 px): 44 × 77 px.
- Körper höchstens 74 Entwurfs-px breit (1,3 Kacheln, je Seite ≤ 15 % über die Kachel); nur Fernrohr/Flügelspitzen/Schatten dürfen bis 80 reichen.
- Fußpunkt: Schattenmitte (40, 134) auf `towerFoot` (22 Entwurfs-px unter der Kachelmitte) wie heute; die Figur wächst nur nach oben.
- pivot [40, 30] (Mitte des Auges), muzzle [79, 30].

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure` / `stroke-figure-fine` | #2b1a10, 3 / 2,5 |
| Stufenmarke | `level-3` | #ff8a3d |
| Ziegel | neu: `brick-a → brick-b (s3-brick)` | #c0563c → #8a3424 |
| Fugen | neu: `brick-line` | #5a2016 |
| Galerie, Kappe | neu: `darkwood-a → darkwood-b (s3-darkwood)` | #6b4a2e → #3a2414 |
| Auge, Fernrohr | gold-light → #d79a2b → #8a5a1e (s3-brass) |  |
| Linse, Schein | neu: `mark` | #ff4f6e |
| Wimpel | `cream` | #fff3d2 |
| Fenster | `gold-light` | #ffe27a |
- neu: `brick-a` = #c0563c, `brick-b` = #8a3424, `brick-line` = #5a2016: Ziegel Falkenauge
- neu: `darkwood-a` = #6b4a2e, `darkwood-b` = #3a2414: dunkles Holz
- neu: `mark` = #ff4f6e (siehe Effekte-Markierung)

## Formen/SVG
`src/figures.js`, in `TOWER_SVG.sniper` ein zweiter Eintrag `l3`; `towerFigure(type, level)` nimmt bei `level >= 3` diesen Eintrag (Cache-Schlüssel enthält die Stufe schon). Neue Gradienten in `src/svg-figure.js` (Tabelle neben s1-*): 's3-brick': linear x, [[0,'#c0563c'],[1,'#8a3424']]; 's3-darkwood': linear x, [[0,'#6b4a2e'],[1,'#3a2414']]; 's3-brass': linear diagonal, [[0,'#ffe27a'],[0.55,'#d79a2b'],[1,'#8a5a1e']]. `trim: []` = keine Goldbänder auf Stufe 3 (`trimSvg` muss leere Liste vertragen).
~~~js
  l3: {
    w: 80, h: 140, pivot: [40,30], muzzle: [79,30], trim: [],
    svg: `<ellipse cx="40" cy="134" rx="26" ry="6" fill="rgba(30,20,50,.35)"/><path d="M22 134 L26 56 H54 L58 134 Z" fill="url(#s3-brick)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M24 120 H56 M25 106 H55 M25 92 H55 M26 78 H54 M26 66 H54 M34 120 V106 M46 106 V92 M36 92 V78 M44 78 V66 M32 134 V120 M48 134 V120" stroke="#5a2016" stroke-width="1.5"/><rect x="36" y="94" width="8" height="12" rx="4" fill="#ffe27a" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><path d="M34 134 V125 a6 6 0 0 1 12 0 V134" fill="#3a2414" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 46 V38 M28 46 V38 M52 46 V38 M62 46 V38 M16 38 H64" stroke="#3a2414" stroke-width="3" stroke-linecap="round"/><path d="M16 38 L6 34 L16 30 Z" fill="#fff3d2" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><path d="M64 38 L74 34 L64 30 Z" fill="#fff3d2" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/><rect x="14" y="46" width="52" height="10" rx="2" fill="url(#s3-darkwood)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><g data-part="glow"><circle cx="40" cy="30" r="20" fill="#ff4f6e" opacity=".25"/></g><g data-part="turn"><rect x="50" y="26" width="29" height="8" rx="3" fill="url(#s3-brass)" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="40" cy="30" r="14" fill="url(#s3-brass)" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="30" r="8.5" fill="#ff4f6e" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="37" cy="27" r="2.5" fill="#ffffff"/></g><path d="M28 18 L40 8 L52 18 Z" fill="url(#s3-darkwood)" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M36 8 Q40 0 44 6 L48 6 L44 9 Q40 11 36 8 Z" fill="#5a3a22" stroke="#2b1a10" stroke-width="1.8" stroke-linejoin="round"/><circle cx="42" cy="4.5" r="0.9" fill="#ffe27a"/>`,
  },
~~~
Ruhe-Animation: Teil `glow` (Linsenschein): scale 1 → 1,3, Deckkraft 1 → 0,6, 1,4 s.
Schuss: Fernrohr dreht zum Ziel; Zielstrahl kommt aus der Linse (Effekte-Markierung).

## Zustände
- Stufe 1 und 2: unverändert (bestehende Figur, 0 bzw. 1 Goldband).
- Stufe 3: anderes Gebäude, keine Goldbänder, Stufenmarke `level-3`. Woran erkennbar (Silhouette und Material, nicht nur Farbe): Schlanker Ziegel-Leuchtturm mit Holzgalerie und Wimpeln; Großes Messing-Auge mit roter Linse und Fernrohr (dreht zum Ziel); Falke sitzt auf der Kappe.
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
| `src/config.js` | `FIGURE_STYLE.towerScale3`, `FIGURE_STYLE.idle.sniper` (Periode, Ausschlag), keine Spielwerte |
Keine IDs/Klassen betroffen.

## Tests
- Bestehend: `tests/fx.test.js` und `tests/render.test.js` (Turmzeichnung ausgewogen, Stufenmarke, Goldbänder) bleiben grün; kein Test muss geändert werden.
- Neu (`tests/render.test.js`): `towerFigure('sniper', 3)` hat Box 80 × 140, enthält die s3-Gradienten und unterscheidet sich von Stufe 2; Zeichnen Stufe 3 bleibt ausgewogen (save/restore) und mit reduced motion ohne Ruhe-Versatz.

## Messbare Abnahme
- Screenshot `#game` 1280x800 mit Stufe 2 und 3 nebeneinander: Stufe 3 ist 24 px höher und auch aus der Entfernung (Bild auf 25 % verkleinert) als anderes Gebäude erkennbar (Vergleichsbild im PR neben der Zeichenfläche).
- Körper ragt je Seite höchstens 0,15 Kacheln über die eigene Kachel (Körperbreite ≤ 63 px bei 1280x800); Fußpunkt auf der Kachel.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
