# Block C: Inhaltsverzeichnis (Vollbild C1, HUD C2, Fähigkeiten/Wellenstart C3, Fahne G5-Rest)
Alles im Browser erprobt (Kopie von 3deaaac mit `C-index.html`, `C-style.css`, `C-layout.js`, `C-js.diff`; Konsole leer, Unit-Tests grün).
Zeichenflächen: `canvas/project/` (Main.dc.html = Gesamtbild). Mockup-PNGs: `C-start-1280x800.png`, `C-play-1280x800.png`, `C-start-1366x768.png`, `C-start-390x844.png`.

| Element | Vorlage | Fläche |
|---|---|---|
| Vollbild, Skalierung, Hintergrund, Schrift, DPR | `Layout-Vollbild.md` | `Main.dc.html` |
| Holzleiste Gold/Welle/Leben | `HUD-Leiste.md` | `HUD-Leiste.dc.html` |
| Runde Knöpfe Hilfe/Ton/Tempo/Pause | `HUD-Knoepfe.md` | `HUD-Knoepfe.dc.html` |
| Fähigkeiten | `HUD-Faehigkeiten.md` | `HUD-Faehigkeiten.dc.html` |
| Wellenknopf, Vorschau, Kartenwahl | `HUD-Wellenknopf.md` | `HUD-Wellenknopf.dc.html` |
| Wellenzahl auf der Fahne, Fahne klickbar | `Karte-Wellenfahne.md` | `Karte-Wellenfahne.dc.html` |
| Turmwahl + Turm-Panel (Übergang bis D) | `HUD-Turmwahl-Uebergang.md` | `HUD-Turmwahl-Uebergang.dc.html` |

Reihenfolge zum Einbauen: Layout-Vollbild → HUD-Leiste → HUD-Knoepfe → HUD-Faehigkeiten → HUD-Wellenknopf → Karte-Wellenfahne → Übergang.
Zusammenführen: Block B ändert parallel render.js/config.js; die C-Hunks in `C-js.diff` sind klein und getrennt, einzeln übernehmen.
Im Diff steht in main.js noch `TILE / 57`: beim Einbau `TILE / PAINTED_STYLE.unit` verwenden.

## e2e-Bilanz mit C (im Prototyp gemessen)
| Test | Ergebnis | Änderung |
|---|---|---|
| buttons: Desktop Fähigkeitsknöpfe 44–60 px | 64 px | 56–72; Kürzel `.key-badge` |
| buttons: B-096 Desktop keine Emoji | `header` fehlt | `#app` statt header+main |
| panel-polish: Handy ganz unten verdeckt (2×) | `aside` fehlt | `'#shop'` statt `'aside'` |
| smoke: Stil 1 gemalter Hintergrund | Puffer 1091x800 | Seitenverhältnis/≥ VIEW prüfen |
| alle übrigen 35 | grün | keine |
