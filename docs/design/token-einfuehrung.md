# Tokens im Code einführen (Konzept)

Ziel: Jede Farbe und jedes Maß der Optik steht **einmal** im Code, unter demselben Namen wie im Design-System "Gemalt und warm" (Link in `docs/design/README.md`). Bauvorlagen, Zeichenflächen und Code sprechen dann dieselbe Sprache, und ein Farbwechsel ist eine Zeile statt einer Suche über zehn Dateien.

Umsetzung erst **nach dem Merge des Stil-1-Umbaus** (`agent/gemalt-warm`, `agent/gemalt-karten`), weil dieser fast alle betroffenen Zeilen gerade neu schreibt. Backlog: B-160 bis B-163 (Status `vorschlag`).

## Bestand (gezählt auf agent/gemalt-karten @ a3d15b4)

Farbliterale (`#rgb`, `#rrggbb`, `rgb()`, `rgba()`) je Datei, in Klammern davon verschiedene Hexwerte:

| Datei | Literale | Was dort steht |
|---|---|---|
| `src/config.js` | 639 (319) | `MAPS.*.theme` 346, `FX_STYLE` 56, `PAINTED_PALETTE` 40, `DECOR_STYLE` 34, `ICON` 19, `STYLE` 18, `WATER_STYLE` 18, `ACCENT_STYLE` 16, `FIGURE_STYLE` 14, `PATH_STYLE` 14, `TREE_FRAME`/`GROUND_STYLE`/`LAVA_STYLE` je 12, `SHOP_CARD` 10, Gegner- und Turmfarben 14 |
| `src/figures.js` | 187 (60) | SVG-Strings der Türme und Gegner; `#2b1a10` allein 84-mal |
| `style.css` | 78 (29) | `:root` hat schon 10 Variablen (`--ink`, `--cream`, `--wood-a/-b`, `--btn-a/-b`, `--gold`, `--hl`, `--muted`, `--bad`); daneben Literale in Fähigkeiten, Wellenknopf, Meldung, Overlay, Testpanel |
| `src/render-painted.js` | 50 (15) | SVG-Hintergrund: Wasser-Verlauf, Sandufer, Burg, Fahne, Kontur `OL` |
| `src/render.js` | 40 (26) | alte Konstanten (`GRASS_COLORS`, `GATE_WOOD`, `EXIT_STONE` …) und Kontur/Text im Canvas |
| `index.html` | 25 (8) | Inline-SVG der HUD-Icons (`#2b1a10` 8-mal) |
| `src/svg-figure.js` | 24 (14) | Verläufe `s1-stone`, `s1-wood`, `s1-ice`, `s1-orb`, `s1-glow`, `s1-iceglow` |
| `src/main.js` | 11 (7) | SVG der Fähigkeitsknöpfe (`ABILITY_SVG`) |
| `src/render-light.js`, `render-accents.js`, übrige | 26 | meist `rgba()` für Licht und Schatten |

Drei Befunde:
1. **Die Kontur `#2b1a10` steht an rund 130 Stellen** in sechs Dateien (figures 84, render-painted 19, config 13, index.html 12, main 4, style.css, render.js). Das ist der wichtigste Token.
2. **Zwei Welten in `config.js`:** Die Stil-1-Werte (`PAINTED_PALETTE`, `FIGURE_STYLE`, `MAPS.*.theme.painted`) und die alten Stile davor (`STYLE`, `ICON`, `PATH_STYLE`, `GROUND_STYLE`, `DECOR_STYLE`, `TREE_FRAME`, `ACCENT_STYLE`, `WATER_STYLE`, `SHOP_CARD`, `MAPS.*.theme.decor/path/grass`). Nach dem Umbau ist zu prüfen, welche alten Blöcke noch gelesen werden; der Rest fällt weg (B-162).
3. **Gleiche Farbe, mehrere Schreibweisen:** Gold als `#f2c14e` (Stil 1) und `#f4c542` (alt, `STYLE.gold`, Münzflug); Holz als `#c88a4c`, `#c58f55`, `#b97a3e`. Die Token-Einführung legt je Rolle einen Wert fest (siehe Design-System), Abweichungen sind dann sichtbar und entscheidbar.

## Zielbild

```
src/theme.js          THEME = { ink: '#2b1a10', cream: '#fff3d2', … }   einzige Quelle, Namen = Design-System
                      THEME_SIZE = { strokeUi: 3, round: 48, … }        Maße, die auch Canvas braucht
style.css :root       --ink: #2b1a10; …                                 Block "generiert aus src/theme.js", nicht von Hand ändern
scripts/theme-css.mjs schreibt den :root-Block aus theme.js neu          ohne Abhängigkeiten
tests/render.test.js  :root-Block == theme.js                           schlägt fehl, wenn jemand nur eine Seite ändert
src/config.js         importiert THEME; FIGURE_STYLE.outline = THEME.ink usw.
src/figures.js        SVG-Strings mit ${THEME.ink} statt Literal (eine Konstante K gibt es schon)
index.html, main.js   Inline-SVG mit class="ink-stroke" bzw. style="fill:var(--cream)" statt Attribut-Hex
```

Warum `theme.js` die Quelle ist und nicht CSS: Canvas und die SVG-Strings für Sprites brauchen die Werte in JavaScript und in Node (Tests); CSS-Variablen sind dort nicht lesbar. Umgekehrt lädt CSS ohne JavaScript sofort richtig, darum steht der Block zusätzlich in `style.css` statt zur Laufzeit gesetzt zu werden.

Namen: Design-System `kebab-case` (`wood-a`, `map-meadow-1`), in `theme.js` `camelCase` (`woodA`, `mapMeadow1`), in CSS `--wood-a`. Die Umrechnung ist mechanisch und wird im Test geprüft.

Architektur (CLAUDE.md): `config.js` bleibt für Balancing und Lage zuständig; `theme.js` nur für Farben und Optik-Maße, ohne DOM, in Node importierbar. Die Zeile in CLAUDE.md "ALLE Balancing-Zahlen in config.js" ergänzt der Mensch um "Farben und Optik-Tokens in src/theme.js".

## Reihenfolge
1. **B-160** `src/theme.js` + `:root`-Block + Abgleich-Test. Nur Anlage, noch kein Umbau der Nutzer (klein, risikolos).
2. **B-161** Nutzer umstellen: `style.css` (alle Literale → `var(--…)`), `config.js`-Stil-1-Blöcke, `figures.js`, `svg-figure.js`, `render-painted.js`, `index.html`, `main.js`. Pixelgleich: Screenshots vorher/nachher identisch.
3. **B-162** Alte Stile entfernen, die nach Stil 1 nicht mehr gelesen werden, und doppelte Schreibweisen auf einen Token bringen (Liste dem Menschen vorlegen, wo sich dadurch eine Farbe sichtbar ändert).
4. **B-163** Kontrastlücke Meldung Info (cream auf `message-info` 3,8:1).
5. Danach: Design-System bei jeder Token-Änderung nachziehen (Orchestrator, im selben PR).
