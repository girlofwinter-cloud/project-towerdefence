# Spielende-Plakette

Die Spielende-Plakette meldet Sieg oder Niederlage mit einem Band über der Holzfläche, Sternen, Zahlen und zwei Knöpfen.

**Wann:** genau einmal am Ende einer Partie im `#overlay` (Abdunklung `overlay-bg`, Handy `overlay-bg-mobile`).

**Maße:** `.end-card.plq` `size-end-card` breit (höchstens 100vw − 56), Innenrand 64 / 24 / 22 (Handy 48 / 16 / 18), Ecken `radius-card`. Band: SVG 560 × 70, 34 px über die Oberkante, 20 px über die Seiten, Pfad `M20 10 H540 L524 35 L540 60 H20 L36 35 Z`, Rand `stroke-scene` `ink`, Text `ribbon` (44, Handy 50) in `cream` mit 6 px `ink`-Kontur (paint-order stroke). Sterne 52 px (Handy 44), Abstand 10. Zahlen `body` 18 `cream`. Knöpfe `.wbtn` 46 hoch, Lilita 22, Abstand 12: "Weiter"/"Neues Spiel" in Gold (`.wbtn-gold`), "Karten" in Holz.

**Zustände:** gewonnen (Band `ribbon-win`, erreichte Sterne `gold`, übrige `star-empty`, Sterne ploppen 0,15 s versetzt; reduced motion: ohne) · verloren (Band `ribbon-loss`, keine Sterne) · Pause-Banner ist eine eigene Plakette (siehe Plakette).

**Kontrast:** cream mit ink-Kontur auf ribbon-win 4,5:1 bzw. ribbon-loss 6,0:1; ink auf gold-btn-b 6,2:1.

Bauvorlage: `docs/design/elemente/Overlay-Spielende.md`.
