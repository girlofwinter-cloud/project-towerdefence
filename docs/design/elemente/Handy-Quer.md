# Handy-Quer (B-137): Querformat ist das Handy-Layout
Skizze: `canvas/project/Quer-Vollbild.dc.html`, Variante "Ecken". Media Query: `@media (max-height: 519.98px) and (orientation: landscape)`. Dateien: style.css (Block B-137 am Ende), main.js (Seitenzonen, Ring-Klemmung), tests/e2e/handy.test.mjs.
Ersetzt das alte Querformat mit Holzspalten und das Hochformat mit seitlichem Wischen (siehe Handy-Hoch.md).

## Aufteilung (844x390, 932x430)
- Feld 20 x 14 in voller Höhe mittig, keine Drehung, kein Scrollen, kein Zoom: `--u: min(100vh / 560, (100vw - 224px) / 800)` → 844x390: Feld 557x390, Kachel 27,9 px; 932x430: 614x430, Kachel 30,7 px. Lage wie im Vollbild (--cx/--cy aus --u), Rand oben/unten außerhalb des Fensters.
- Links und rechts: gemalte Landschaft bis an den Bildschirmrand. `#backdrop` wie die Seitenzonen im Vollbild (render.js rastert Canvas plus Seiten in einem Bild, deckungsgleich, keine Naht); keine Holzspalten, keine Abdunklung.
- Safe-Area: `viewport-fit=cover`; Abstände `--safe-l/-r/-t/-b: max(8px, env(safe-area-inset-*))`, dort keine Bedienung.

| Ecke | Inhalt |
|---|---|
| oben links | HUD-Plakette senkrecht (Gold, Welle, Leben), mind. 92 x 124, Zahl `num-compact` 22/24, Icons 22 |
| links unten | drei Fähigkeiten 56 px untereinander, Abstand 16, 18 px eingerückt, ohne Beschriftung (Name im `aria-label`) |
| oben rechts | Tempo und Pause 48 px nebeneinander (Abstand 8), Ton 44 px darunter rechts; Hilfe "?" aus |
| unten rechts | runder Wellenknopf `size-wave-round` (104 px, höchstens Seitenbreite − Safe-Area − 4), Lilita 18 zweizeilig, Fortschritt 18 px vom Rand, 14 px über dem Boden |
| rechts Mitte | Info-Plakette des Turm-Rings nur bei Bedarf: fest 112 px unter dem oberen Rand, Breite höchstens 130, Name Lilita 15, Werte 12 (Sonderwirkung aus) |

Bauen: Tipp auf Kachel → Auswahl + Bau-Ring (Radius `RING_MENU.compactRadius`, Knöpfe 48); am Rand wird der Ring ins Feld geschoben (main.js `placeRing`: Grenzen = Feld ohne Baumrand). Turm-Ring bleibt ein Ring (Knöpfe 48, × 44).
Wartende Vorschau und Kartenwahl sind aus. Spielende: Abdunklung `overlay-bg-mobile` über dem ganzen Fenster.

## Tests (e2e, handy.test.mjs)
844x390, 932x430 (und 740x360) mit `isMobile, hasTouch`: ganzes Feld im Fenster und in voller Höhe, kein Scrollen, kein Zoom-Knopf; Bedienung im Fenster, neben dem Feld, Tippziele ≥ 44; mit gesetzten Safe-Area-Werten bleibt die Bedienung außerhalb; Bau-Ring an allen 4 Feldecken im Bild und im Feld; Bauen, Turm antippen, Verbessern, Schließen.
