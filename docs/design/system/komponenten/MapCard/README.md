# Kartenkarte

Die Kartenkarte zeigt eine Karte auf dem Startbildschirm: Vorschaubild, Name, Sterne und beste Welle; ein Klick startet sie.

**Wann:** nur auf dem Startbildschirm (`#start-screen`, `.map-cards`, Abstand 20 px), eine Karte je Eintrag in `MAPS`, Reihenfolge `MAP_ORDER`. Der Startbildschirm erscheint bei jedem Laden.

**Maße:** `.map-card.plq` `size-map-card` × 290 (unter 1100 px Breite 172; Handy 168 × 250, umbrechend), Innenrand 12, Ecken `radius-banner`. Vorschaubild `size-map-thumb` × 120, Ecken `radius-thumb`, Rand `stroke-ui` `ink`: im Spiel der gemalte Hintergrund der Karte (`src/screens.js`), in dieser Vorschau nur der Bodenverlauf `map-<id>-1..3`. Name `map-name` 24 in `cream` mit Umriss, Sterne 24 px (`gold` bzw. `star-empty`), Zeile `body-small` in `muted`.

**Zustände:** normal · Hover (brightness 1.08) · gewählt/fokussiert (`.current`, 6 px nach oben, `shadow-card-current`; Pfeiltasten wechseln, Enter startet) · gesperrt (`disabled`, Bild grau und dunkel, Name `map-locked`, Schloss 44 px, Zeile "Gewinne erst …") · reduced motion: ohne Anheben-Übergang.

**Kontrast:** cream mit Umriss auf wood-b 7,0:1; map-locked auf wood-b 4,0:1 (gesperrt, zusätzlich Schloss und Text).

Bauvorlage: `docs/design/elemente/Start-Kartenwahl.md`.
