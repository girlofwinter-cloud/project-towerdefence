# Gemalt und warm (Design-System, Kopie im Repo)

Diese Ordner ist die **Kopie des Design-Systems im Projekt**, lesbar für alle Rollen (designer, developer, tester, reviewer, ideator, Orchestrator). Das Original mit gerenderten Vorschauen liegt in Claude Design: https://claude.ai/artifact/5cJerN82BWQNMcMiZjMBpR. Beide müssen gleich sein.

## Was wo liegt
| Datei | Inhalt |
|---|---|
| `README.md` | diese Grundlagen: Kontur, Licht, Farbe, Schrift, Formen, Bewegung |
| `TOKENS.md` | alle Tokens als Tabelle (Name, Wert, Verwendung), zum Nachschlagen und für `grep` |
| `tokens.json` | dieselben Tokens maschinenlesbar (Quelle für `TOKENS.md` und `tokens.css`) |
| `tokens.css` | alle Tokens als CSS-Variablen `--<name>` |
| `komponenten/<Name>/README.md` | Richtlinien je Bauteil: wann, Maße, Tokens, Zustände, Kontrast, Bauvorlage |
| `komponenten/<Name>/preview.html` | Markup aller Zustände (dasselbe wie in Claude Design) |
| `komponenten/bauteile.css` | CSS der Bauteile, Regeln aus `style.css` auf Tokens umgestellt |
| `icons/*.svg` | Icons der Bedienung |
| `vorschau.html` | alle Bauteile auf einer Seite: `npm start`, dann http://localhost:8080/docs/design/system/vorschau.html |

Bauteile: HudBar (Holzleiste), RoundButton (runder Knopf), AbilityButton (Fähigkeitsknopf), WaveButton (Wellenknopf), PriceTag (Preisschild), LevelBadge (Stufenmarke), Plaque (Plakette), RingMenu (Ringmenü), MapCard (Kartenkarte), EndCard (Spielende-Plakette).

## Wer es wie nutzt
- **designer:** Zeichenflächen und Bauvorlagen nur aus diesen Tokens und Bauteilen; Prüfungen nennen Abweichungen vom System mit Token-Namen. Ein fehlender Token wird als Vorschlag gemeldet.
- **developer:** Farben und Maße aus Bauvorlagen über den Token-Namen nachschlagen (`TOKENS.md`); keine neuen Farbwerte erfinden. Nach B-160 heißen sie im Code genauso.
- **tester / reviewer:** Prüfen bei Optik-Änderungen, ob Werte zu den Tokens passen und Bauteile alle Zustände aus `komponenten/<Name>/README.md` haben (Kontrast, Tippziel ≥ 44 px, nicht nur über Farbe).
- **ideator:** Neue Ideen in dieser Formensprache beschreiben (Holz, Gold, dicke Kontur).

## Abgleich (Pflicht)
- Geändert wird zuerst `tokens.json` bzw. die Bauteil-Dateien hier, dann `node scripts/design-tokens.mjs` (schreibt `TOKENS.md` und `tokens.css`), dann dieselben Dateien nach Claude Design veröffentlichen (Orchestrator, Artifact-Tool). Beides im selben PR.
- Ändert ein PR Farben oder Maße im Spielcode, zieht er dieses System im selben PR nach.
- Rollen ohne Artifact-Tool lesen nur diese Kopie; der Link oben ist für Menschen.

---

## Stil

Das Design-System von Project TowerDefence: Stil 1 "Gemalt und warm". Dicke dunkelbraune Konturen, Holz und Gold, harte Schatten nach unten, runde Formen, Lilita One für alles, was gezählt oder gedrückt wird.

Quelle der Werte: Code auf `main` (Stand 884e430, 2026-11-27, nach dem Merge von Stil 1): `style.css`, `src/config.js` (`FIGURE_STYLE`, `PAINTED_STYLE`, `PAINTED_PALETTE`, `MAPS.*.theme.painted`, `LAVA_STYLE`, `SHOP_CARD`), `src/figures.js`, `src/svg-figure.js`, `src/render-painted.js`, `src/screens.js`, `src/main.js` (`RING_SVG`). Nichts ist neu erfunden.

## Grundlagen

### Kontur
Alles hat eine Kontur in `ink` (#2b1a10). Kein Element ohne Rand, keine graue Linie, kein Schwarz.
- UI: `stroke-ui` 3 px; große Knöpfe `stroke-ui-bold` 4 px; Abzeichen `stroke-badge` 2,5 px.
- Figuren (Entwurfs-px, Kachel 57): Umriss `stroke-figure` 3, Details `stroke-figure-fine` 2,5, Fugen `stroke-figure-line` 2; Szene (Burg, Brücke, Ufer) `stroke-scene` 4.
- Helle Schrift bekommt einen Umriss: `text-shadow` −2/2/0/0 px in `ink` (`text-outline`).

### Licht und Schatten
Licht kommt von oben links. Flächen sind Verläufe von hell oben nach dunkel unten (`wood-a` → `wood-b`, `gold-btn-a` → `gold-btn-b`) oder radial bei 35 % 30 % (runde Knöpfe). Schatten sind hart: 0 Unschärfe, 3–6 px nach unten in `rgba(30,15,5,.45–.55)`, dazu eine Lichtkante innen oben (`shadow-*`). Gedrückt heißt 2 px nach unten und kürzerer Schatten. Weiche Schatten nur als Leuchten (Auswahl, Bereit-Puls).

### Farbe
- **Holz** (`wood-*`, `btn-*`) für alle Bedienflächen. **Gold** (`gold*`) nur für Geld und die eine wichtigste Aktion (Wellenknopf, Badges). **hl** (#ffe266) nur für Auswahl und Fokus.
- **Signale:** `bad` (wenig Leben), `message-bad`, `message-info`, `hp-*`, Verkaufen `sell-a/-b`, Spielende-Band `ribbon-win`/`ribbon-loss`. Nie nur über Farbe: Preis zu teuer ist zusätzlich durchgestrichen, Stufen haben Ziffern.
- **Welt:** Weg (`path-*`), Wasser (`water-*`), Lava (`lava*`), Stein (`stone-*`), Eis (`ice-*`).
- **Karten-Paletten:** je Karte ein Bodenverlauf in drei Stufen `map-<id>-1..3` (Wiese = Basis aus `PAINTED_PALETTE`), dazu Wegfarben `map-<id>-path-*`. Ids: meadow (Wiese), ice (Eiswelt), fork (Zangenangriff, Herbst), twin (Zwei Fronten), volcano (Vulkan).

### Schrift
- **Lilita One** (`font-display`, Rückfall `'Trebuchet MS', sans-serif`) für Zahlen, Knöpfe, Titel, Beschriftungen. Immer Gewicht 400. Datei `assets/fonts/LilitaOne-Regular.ttf` (OFL).
- **Trebuchet MS** (`font-body`) nur für Fließtext: Hilfe, Werte im Turm-Panel.
- Größen: 56 Overlay-Titel, 34 Banner, 28 HUD-Zahl, 26 Knopfzeichen, 24 Abklingzahl, 22 Wellenknopf, 20 Nebenzahl, 18 Meldung, 17 Textknopf, 15 Beschriftung/Preis, 14 Abzeichen.

### Formen und Maße
- Runde Knöpfe: 48 (`size-round`), Turm 60, Fähigkeit 64 (Handy 56). Pillen: Textknopf 40 hoch, Wellenknopf 46 × mind. 168. Tippziel nie unter 44 (`size-touch-min`).
- Rundungen: Plakette 14, Banner und Kartenkarte 18, große Plakette 22, Schild 9, Abzeichen 11, Vorschaubild 10; Pillen = halbe Höhe.
- Ringmenü: Knöpfe 60 (Handy 48), Schließen 44, Radius mindestens 68. Kartenkarte 196 × 290, Spielende-Plakette 520 breit.
- Abstände: 6 (Icon zu Zahl), 8 (Knopfreihe), 12 (HUD), 18 (Fähigkeiten), 22 (Wellenknopf innen).
- Spielfeld: Kachel 40 Spiel-px (`size-tile`), Entwurf 57 (`size-tile-design`), Rand 50 (`size-frame`). Feld 20 × 14 bleibt.

### Bewegung
Kurz und federnd: Bereit-Puls 1,6 s, Fähigkeit bereit 0,5 s (Skalierung 1,12), wenig Leben 1 s Puls. Bei `prefers-reduced-motion` kein Puls und kein Wasserfluss.

## Bauteile
Holzleiste (HudBar), Runder Knopf (RoundButton), Fähigkeitsknopf (AbilityButton), Wellenknopf (WaveButton), Preisschild (PriceTag), Stufenmarke (LevelBadge), Plakette (Plaque), Ringmenü (RingMenu), Kartenkarte (MapCard), Spielende-Plakette (EndCard). Die CSS in `komponenten/bauteile.css` ist die Regel aus `style.css`, auf Tokens umgestellt. Vorschauen sind statisch (kein Skript), wie im Spiel.

## Icons
Gruppe Icons: HUD (Gold, Welle, Leben), Knöpfe (Ton an/aus, Tempo, Pause, Weiter), Fähigkeiten (Meteor, Kälte, Reparatur). SVG wörtlich aus den Bauvorlagen. Füllung `cream` bzw. Objektfarbe, Kontur `ink`.

## Nicht übernommen
- Türme und Gegner als Formen: stehen in `src/figures.js` (SVG je Typ) und als Zeichenflächen in der Bauteil-Bibliothek; hier nur ihre Farben (Stein, Holz, Haut, Stufen).
- Alte Stile vor Stil 1 (`STYLE`, `ICON`, `PATH_STYLE`, `GROUND_STYLE`, `DECOR_STYLE`, `TREE_FRAME`, `ACCENT_STYLE`, `WATER_STYLE`): laufen nach dem Umbau aus, siehe Backlog B-162.
- Effekt-Farben (`FX_STYLE`): folgen mit der Styleguide-Seite (B-164).
