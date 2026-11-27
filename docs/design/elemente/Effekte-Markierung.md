# Effekte-Markierung (B-176): Optik der Markierung (Scharfschütze Stufe 3): Zielstrahl, Leuchtspur, Fadenkreuz am Ziel
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Effekte-Markierung. Backlog: B-176 (Logik), B-174 (Optik). Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
Spiel-px (Kachel 40), Ablauf siehe Zeichenfläche (Kasten „Ablauf“).
- Zielstrahl 0,6 s vor dem Schuss von der Mündung (Linse, Fernrohr-Ende 79/30 in l3) zum Ziel, 1,6 px gestrichelt 4/4, flackert (α 1 ↔ 0,3).
- Leuchtspur über die ganze Strecke 0,2 s: weiß 2,5 px + Schein `cream` 7 px α 0,4.
- Marke um die Kopfmitte: Ring r 18 Spiel-px (× Figurmaßstab bei Bossen), 4 Zacken 9 px nach außen, Pfeil 18 × 11 px über dem Lebensbalken.
- Optional Schild „+25 %“ 46 × 20, `radius-tag` 9, nur Bosse/Trolle, nur beim ersten Markieren 1 s.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Zielstrahl, Marke | neu: `mark` | #ff4f6e |
| Marken-Umriss | `ink` | 6 px unter 3 px |
| Leuchtspur | weiß / cream α 0,4 |  |
| Schild-Text | price-poor auf ink | #ff9e8f, Schrift badge 14 px (8:1) |
- neu: `mark` = #ff4f6e, Markierung und Zielstrahl (nur mit ink-Umriss auf dem Feld)

## Formen/SVG
Werte in `src/config.js`, neuer Block `MASTER_FX` (nur Optik, keine Spielzahlen):
~~~js
  mark: { color: '#ff4f6e', aim: 0.6, aimDash: [4, 4], traceLife: 0.2, ring: 18, tick: 9, spin: 3, popFrom: 1.6, fadeOut: 0.2, tag: true },
  maxParticles: 120, // Obergrenze aller Stufe-3-Effekte zusammen (B-173)
~~~
Formen: Kreise, Ellipsen und Polylinien direkt per Canvas, Stern wie `star(x, y, r)`: Punkte (0,−r) (0,25r,−0,25r) (r,0) (0,25r,0,25r) (0,r) (−0,25r,0,25r) (−r,0) (−0,25r,−0,25r).

## Zustände
- Markiert: Fadenkreuz dreht (3 s je Umdrehung), Form statt nur Farbe.
- Erneut getroffen: nur Zeit zurücksetzen, kein neues Aufploppen.
- Gegner eingefroren: Marke über dem Eisblock.
- Läuft aus: letzte 0,2 s Deckkraft → 0.
- reduced motion: Marke steht, Zielstrahl ohne Flackern.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/tower-fx.js` | Zielstrahl vor dem Schuss, Leuchtspur |
| `src/enemy-fx.js` | Fadenkreuz am Gegner, solange `e.markedUntil` (Name aus B-176) läuft |
| `src/config.js` | `MASTER_FX`-Eintrag oben |
Logik (Ereignisse, Zustände am Gegner) kommt aus der Logik-Spur; hier nur Zeichnen. Keine IDs betroffen.

## Tests
- Bestehend: `tests/fx.test.js` bleibt unverändert grün.
- Neu (`tests/fx.test.js`): Marke nur solange markiert, ausgewogen, reduced motion ohne Drehung; Zielstrahl nur bei Stufe 3.

## Messbare Abnahme
- Zeichenfläche und Screenshot `#game` 1280x800 im PR nebeneinander; Effekt auf Wiese, Eiswelt und Vulkan gut sichtbar.
- Mit 20 Türmen Stufe 3 und voller Welle bleibt die Bildrate im Handy-Testprofil stabil; nie mehr als `MASTER_FX.maxParticles` Teilchen.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
