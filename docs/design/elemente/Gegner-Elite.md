# Gegner-Elite (G7-Erweiterung): Elite-Abzeichen und Fußring für Elite-Gegner mit Eigenschaft schnell, Schild oder Selbstheilung
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Gegner-Elite. Backlog: B-179 (Optik; Eigenschaften und Werte in B-179). Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
- Abzeichen 20 × 20 Entwurfs-px (Box −1..21), × `TILE/57` × Gegner-Maßstab, mindestens 14 Spiel-px: Desktop ≈ 17 px, Handy quer ≈ 11 px.
- Lage: linke obere Ecke bei (Fußpunkt x + 0,28 × Figurbreite, Figur-Oberkante − 0,55 × Abzeichen); immer über Eisblock und Lebensbalken.
- Fußring: Ellipse rx = 0,5 × Figurbreite + 4, ry = rx × 0,3, gestrichelt 6/4, 2,5 px, um den Fußpunkt; bei Fliegern am Schatten.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Stern | `gold`, Rand `ink` 2 | #f2c14e |
| Innenkreis | `cream`, Rand `ink` 1,2 | #fff3d2 |
| Zeichen | `ink` 2 (Schild gefüllt `boss-shield`) | #2b1a10 |
| Fußring | neu `elite-ring` | rgba(242,193,78,0.9) |
| Tempostriche | `cream` 2,5 | #fff3d2 |
| Schildbogen | `boss-shield` 3 auf `ink` 5 | #bff6ff |
| Heilplus | `ab-repair-a` 2,5 auf `ab-repair-b` 5 | #a8e070 / #3a8a3c |
- neu: `elite-ring` = rgba(242,193,78,0.9), Fußring der Elite-Gegner

## Formen/SVG
Canvas, Bezugsbox 20 × 20, Mitte (10, 10):
~~~js
const ELITE_BADGE = new Path2D('M10.0 0.5 L12.9 3.0 L16.7 3.3 L17.0 7.1 L19.5 10.0 L17.0 12.9 L16.7 16.7 L12.9 17.0 L10.0 19.5 L7.1 17.0 L3.3 16.7 L3.0 12.9 L0.5 10.0 L3.0 7.1 L3.3 3.3 L7.1 3.0 Z'); // 8-zackiger Stern R 9,5 / r 7,6
const ELITE_GLYPH = {
  fast: new Path2D('M4.5 6 L8 10 L4.5 14 M9.5 6 L13 10 L9.5 14'),   // » Tempo
  shield: new Path2D('M10 4.5 L14.5 6.5 V10 Q14.5 13.5 10 15.5 Q5.5 13.5 5.5 10 V6.5 Z'), // Schild (füllen)
  heal: new Path2D('M10 5 V15 M5 10 H15'),     // + Heilung
};
// Reihenfolge: Stern füllen gold + Rand ink 2, Kreis r 6,2 cream + Rand ink 1,2, Zeichen ink 2 (round caps)
~~~

## Zustände
- Normal: Abzeichen + Fußring (dreht nicht, pulsiert α 0,9 ↔ 0,5, 2 s) + Eigenschaftszeichen:
  - schnell: 3 Tempostriche hinter der Figur, laufen 10 px nach hinten (0,5 s).
  - Schild: Bogen vor der Figur (Seite der Laufrichtung), pulsiert α 1 ↔ 0,55 (1,2 s); bricht er (Logik), Splitter wie `shellChip`.
  - Selbstheilung: 3 Pluszeichen steigen 14 px (1,5 s, versetzt 0,5 s).
- Eingefroren: Abzeichen bleibt sichtbar über dem Eisblock, Zeichen-Animationen stehen.
- Boss: kein Elite (Bosse haben eigene Optik).
- Tod: Abzeichen fliegt 12 px hoch und blendet aus (0,3 s).
- Handy quer: Abzeichen ≥ 11 px, Fußring trägt die Erkennbarkeit (Zeichenfläche, Zeile Handy).
- reduced motion: Ring pulsiert nicht, Zeichen statisch (Striche/Plus stehen).
- Barrierefreiheit: Eigenschaft über Zeichen (» Schild +), nicht nur Farbe.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/enemy-fx.js` | Abzeichen, Fußring, Eigenschaftszeichen nach der Figur zeichnen (`e.elite` = 'fast' / 'shield' / 'heal', Namen aus B-179) |
| `src/config.js` | `ENEMY_STYLE.elite` (Größen, Takte, Farben), keine Spielwerte |

## Tests
- Bestehend: `tests/fx.test.js` Gegner-Zeichnung bleibt grün (ohne `elite` keine Änderung).
- Neu (`tests/fx.test.js`): mit `elite` wird Stern-Farbe `#f2c14e` gezeichnet, je Eigenschaft ein anderes Zeichen, unbekannte Eigenschaft crasht nicht, ausgewogen; reduced motion ohne Versatz.

## Messbare Abnahme
- Screenshot Welle 8+ bei 1280x800: jedes Elite-Abzeichen ≥ 16 px, im Pulk von 6 Goblins sofort auffindbar (Fußring).
- 844x390: Abzeichen ≥ 11 px.
- `npm test` und `npm run test:e2e` grün.
