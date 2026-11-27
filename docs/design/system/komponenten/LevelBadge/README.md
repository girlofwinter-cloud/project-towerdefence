# Stufenmarke

Die Stufenmarke zeigt die Stufe eines Turms als Kreis mit Ziffer unten rechts am Turm; ab Stufe 2 kommen Goldbänder am Turm dazu.

**Wann:** auf jedem gebauten Turm im Canvas (nicht im HTML). In einem eigenen Durchgang nach allen Figuren gezeichnet, damit kein Nachbar sie verdeckt.

**Maße (FIGURE_STYLE.badge):** Radius 11 (`size-badge` 22), Kontur `stroke-badge` (2,5) `ink`, Mitte bei (Breite − 9, Höhe − 15) der Turm-Box in Entwurfs-px, Ziffer Lilita 14 `ink`, `textDy` 0,5.
- Farben: Stufe 1 `level-1`, Stufe 2 `level-2` (= gold), Stufe 3 `level-3`. Ziffer immer dabei, damit die Stufe nicht nur über Farbe lesbar ist.
- Goldband (FIGURE_STYLE.trim): `gold` 3 auf `ink` 5, Pfade je Turm in `src/figures.js` (`trim`).

**Kontrast:** ink auf level-1 12,2:1, auf level-2 9,9:1, auf level-3 7,1:1.

Bauvorlage: Plan G6 in `docs/design/stil1-plan.md`.
