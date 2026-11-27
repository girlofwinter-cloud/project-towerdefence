# Holzleiste

Die Holzleiste zeigt Gold, Welle und Leben über dem Feld, als Holzplakette mit großen Zahlen in Lilita One.

**Wann:** genau einmal, oben links über dem Feld (`#hud-bar`). Andere Plaketten nutzen dieselbe Fläche `.plq` (siehe Plakette).

**Aufbau:** `.hud.plq` mit drei `.hud-item` (Icon 36–40 px + `.num`), dazwischen `.sep` (3 × 36 px, ink mit 50 %).
- Höhe `size-hud-h` (56 px), Innenrand links `space-buttons`, rechts `space-plaque-x`, Abstand `space-hud`.
- Fläche: Verlauf `wood-a` → `wood-b`, Rand `stroke-ui` in `ink`, Ecken `radius-plaque`, Schatten `shadow-plaque`.
- Zahl `.num`: Lilita 28/30, `cream`, Umriss `text-outline` in `ink` plus 0 3px 0. Welle als `8<small> / 20</small>`.

**Zustände:** normal · Gold mit Tausenderpunkt (`toLocaleString('de-DE')`) · wenig Leben (`.low`, Zahl `bad`, Puls 1 s; ohne Puls bei reduced motion) · `.dim` (Deckkraft .35, wenn die Maus darunter steht; `pointer-events: none`).

**Kontrast:** cream auf wood-b 7,0:1, mit Umriss lesbar auf jedem Boden.

Bauvorlage: `docs/design/elemente/HUD-Leiste.md`. Icons: Gruppe Icons (`hud-gold`, `hud-welle`, `hud-leben`).
