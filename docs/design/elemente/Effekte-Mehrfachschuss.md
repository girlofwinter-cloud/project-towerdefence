# Effekte-Mehrfachschuss (B-175): Optik des Mehrfachschusses (Pfeil Stufe 3): drei Spuren gleichzeitig
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Effekte-Mehrfachschuss. Backlog: B-175 (Logik), B-173 (Optik). Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
Spiel-px (Kachel 40), Ablauf siehe Zeichenfläche (Kasten „Ablauf“).
- Spur vom Mündungspunkt (Balkon-Armbrust, 40/48 in der l3-Box) zum Treffpunkt (Gegnermitte), gleichzeitige Abschüsse.
- Spurlänge 14 % der Strecke, mindestens 18 Spiel-px; wandert mit dem Geschoss.
- Treffer: 4-Spitzen-Stern r 11 (Hauptziel) / 8 (Nebenziel) Spiel-px, 0,25 s, scale 0,3 → 1 → 1,5.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Spur Hauptziel | `gold-light` | #ffe27a, 4 px |
| Schein Hauptziel | cream α 0,35 | #fff3d2, 9 px |
| Spur Nebenziele | `cream` | #fff3d2, 2,5 px |
| Stern | gold-light / cream |  |


## Formen/SVG
Werte in `src/config.js`, neuer Block `MASTER_FX` (nur Optik, keine Spielzahlen):
~~~js
  multishot: { main: '#ffe27a', glow: 'rgba(255,243,210,0.35)', side: '#fff3d2', w: [4, 9, 2.5], trailShare: 0.14, trailMin: 18, star: [11, 8], starLife: 0.25 },
  maxParticles: 120, // Obergrenze aller Stufe-3-Effekte zusammen (B-173)
~~~
Formen: Kreise, Ellipsen und Polylinien direkt per Canvas, Stern wie `star(x, y, r)`: Punkte (0,−r) (0,25r,−0,25r) (r,0) (0,25r,0,25r) (0,r) (−0,25r,0,25r) (−r,0) (−0,25r,−0,25r).

## Zustände
- Hauptziel vs. Nebenziel: Breite und Stern-Größe, nicht nur Farbe.
- Flieger getroffen: gleicher Stern.
- reduced motion: Spur ohne Schein, kein Stern.
- Viele Adlerhorste: höchstens 24 Spuren gleichzeitig (`MASTER_FX.maxTrails`), älteste fallen weg.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/tower-fx.js` | Spuren aus den Geschossen des Turms (`state.projectiles` mit `master: true` o. Ä. aus B-175) |
| `src/render-fx.js` | Treffer-Stern als Effekt-Typ `multiHit` |
| `src/config.js` | `MASTER_FX`-Eintrag oben |
Logik (Ereignisse, Zustände am Gegner) kommt aus der Logik-Spur; hier nur Zeichnen. Keine IDs betroffen.

## Tests
- Bestehend: `tests/fx.test.js` bleibt unverändert grün.
- Neu (`tests/fx.test.js`): Spuren für 3 Ziele werden gezeichnet, ausgewogen, Obergrenze greift, reduced motion ohne Schein.

## Messbare Abnahme
- Zeichenfläche und Screenshot `#game` 1280x800 im PR nebeneinander; Effekt auf Wiese, Eiswelt und Vulkan gut sichtbar.
- Mit 20 Türmen Stufe 3 und voller Welle bleibt die Bildrate im Handy-Testprofil stabil; nie mehr als `MASTER_FX.maxParticles` Teilchen.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
