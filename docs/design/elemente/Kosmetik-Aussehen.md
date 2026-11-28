# Kosmetik-Aussehen (Runde 2): Menü „Aussehen“ mit Schaltern für Nacht-Look je Karte und goldene Türme, Vorschau rechts und Freischalt-Hinweis
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Aussehen (Tweak `freischaltung`). Backlog: B-191. Stand: agent/albtraum-design@b13c4d4.

Ersetzt die Skizze aus B-185. Logik (`src/cosmetics.js`, `toggleCosmetic`) bleibt. Goldene Türme: Optik wie heute im Code (`GOLD_TOWER_STYLE`, `src/config.js` Z. 1890), die Vorschau zeigt sie nur.

## Maße
Desktop 1280x800 (1366x768 gleich):
- `#cosmetics` zeigt zwei Plaketten nebeneinander, Lücke 28, zusammen 1200 × 728, mittig (bei 1280: links 40, oben 36).
- Links `.cos-card` 560 × 728, Innenabstand 20/24, Radius `radius-card`, Rand `ink` 4, `wood-a` → `wood-b`.
  - Kopf `.cos-head`: Titel „Aussehen“ 34 px; darunter Satz 14 px `cream` „Belohnungen aus dem Albtraum. Nur Optik, keine Spielwerte.“; „Fertig“ `.cos-close` rechts (≥ 44 hoch, wie heute).
  - Abschnitt `.cos-sec` 21 px `gold-light` mit Mond 22 („Nacht-Look je Karte“, „Goldene Türme“).
  - Zeile `.cos-row` **56 hoch** (Test), Radius 14, Grund `ink` α 0,28, Lücke 2: Mini-Vorschau 64 × 44 (Albtraum-Look der Karte, Radius 6, Rand `ink` 2,5; gesperrt mit `night-tint` 0,62 + Schloss 22 mittig) · Name 20 px (gesperrt `muted`, dazu Schloss) · Unterzeile 14 px `muted` (frei: „Frei · Stil <Stilname>“, gesperrt: „Gold im Albtraum nötig (du: Silber)“) · Zustandswort 16 px `font-display` („An“/„Aus“/„Gesperrt“) · Schalter `.sw` 64 × 44 rechts.
  - Goldene Türme: Mini-Vorschau = Pfeilturm golden 37 × 50 auf `ink`-Feld 60 × 44.
  - Fortschritt `.cos-prog`: Text „Gold auf x / 5 Karten“ 16 px, Leiste volle Breite × 18, darunter Medaillenreihe: je Karte Medaille S 24 (Gold oder offen) + Kartenname 11 px `muted`.
- Rechts `.cos-preview` 612 × 728, `night-card-a` → `night-card-b`, Radius `radius-card`, Rand `ink` 4 (nur ab `innerWidth ≥ 1200`):
  - Titel „Vorschau: <Name>“ 28 px, rechts Zustands-Pille 32 hoch (An `message-info`, Aus `ink`, Gesperrt `darkwood-b`).
  - Karte gewählt: zwei Vorschauen je 270 × 189 (Radius 12, Rand `ink` 4) bei y 112, links „Normal“, rechts „Nacht-Look · <Stil>“ (`gold-light`, Glühen 0 0 24 `night-ember` α 0,35); darunter Satz 15 px über den Look.
  - Goldene Türme gewählt: Wiese-Streifen 564 × 290, oben 5 Türme normal, unten 5 golden (Fußlinien y 130 / 276, Abstand 110), Beschriftung „Normal“/„Golden“; darunter Satz 14 px zur Farbregel.
  - Freischalt-Kasten 564 × 96 bei y 450: Medaille Gold S 66, Titel 19 px `gold-light` („Freigeschaltet mit Gold auf <Karte>“ / „Gold-Abzeichen auf <Karte> holen“), Satz 14 px mit den drei Bedingungen und „Du hast: <Stufe>“.
- Unter 1200 px Breite und Handy quer 844x390: nur `.cos-card` (wie heute: volle Höhe minus Ränder, nur `.cos-body` scrollt), Zeilen und Schalter 56/44; ein Tipp auf den Zeilennamen öffnet keine Vorschau (entfällt).

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Hintergrund | `night-a` → `night-b` radial | #2a1f44 → #0e0b1a |
| Menü-Plakette | `wood-a` → `wood-b` | #a4672f → #7a4520 |
| Vorschau-Plakette | `night-card-a` → `night-card-b` | #4a3550 → #2a1d30 |
| Zeile normal / gewählt | `ink` α 0,28 / `hl` α 0,18 + innen 3 `hl` | #2b1a10 / #ffe266 |
| Schalter aus / an / gesperrt | `ink` / `message-info` / `darkwood-b` | #2b1a10 / #4f8a34 / #3a2414 |
| Schalter-Knopf / gesperrt | `btn-a` → `btn-b` / `stone-line` + Schloss 22 | #d79a52 → #8a5224 / #6b5a48 |
| Zustandswort An / Aus / Gesperrt | `cream` / `muted` / `muted` | #fff3d2 / #e8d3a8 / #e8d3a8 |
| Abschnitt | `gold-light` | #ffe27a |
| Fortschritt | Grund `ink`, Füllung `gold-btn-a` → `gold-btn-b` | |
| Freischalt-Kasten | `night-a` → `night-a-2` (90°) | #2a1f44 → #3a2a5c |
- neu: `night-a-2` = #3a2a5c, heller Nachtton für Belohnungs- und Freischalt-Kästen (auch Sieg)
- Kontrast: `cream` auf `wood-b` 7,0:1; `muted` auf `wood-b` 5,3:1 (deshalb gesperrte Namen `muted`, nicht `map-locked` = 4,0:1); `cream` auf `night-card-b` 14,4:1.

## Formen/SVG
- Schloss im Schalter (gesperrt): `SMALL_LOCK` aus `src/screens.js` Z. 136 bei left 8, top 8 im `.sw`.
- Mond, Medaille: wie Albtraum-Kartenauswahl / Albtraum-Abzeichen.
- Mini- und große Vorschau: `paintThumb(cv, mapId, { night: true })` bzw. ohne `night` (Kartenauswahl-Bauvorlage).
- Turm-Vorschau: `towerFigure(type, 1)` normal und mit `GOLD_TOWER_STYLE` (heutiger Weg in `render-towers.js`), auf Canvas 564 × 290.

## Zustände
- Schalter: aus, an (Knopf rechts, Wort „An“), gesperrt (dunkles Holz, Schloss im Schalter, Wort „Gesperrt“, `disabled`), Fokus (`hl` 3), reduced motion: kein Gleiten.
- Zeile gewählt (Klick/Enter auf die Zeile, nicht auf den Schalter): `hl`-Rahmen, Vorschau rechts wechselt. Start: erste Zeile gewählt.
- Freischaltung: frisch freigeschaltet = an (wie heute); 5 / 5: Fortschritt entfällt (wie heute).
- Tastatur: Enter öffnet, Leertaste schaltet, Escape schließt (wie heute).
- Information nie nur über Farbe: Wort + Knopfposition + Schloss.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `index.html` | in `#cosmetics` neben `.cos-card` ein `<aside class="cos-preview" aria-live="polite">` mit Titel, Pille, Canvas-Plätzen, Freischalt-Kasten |
| `style.css` | `#cosmetics` Flex-Reihe, `.cos-row` (Mini-Vorschau, Unterzeile, Zustandswort, gewählt), `.sw` Schloss, `.cos-preview`, Media-Query < 1200 blendet `.cos-preview` aus |
| `src/screens.js` | `cosRowHtml`: Mini-Vorschau-Canvas, Unterzeile („Frei · Stil …“ bzw. Grund + „(du: Stufe)“), Zustandswort; `mountCosmeticsMenu`: Zeilenwahl, Vorschau füllen; Texte `COS_LOCKED_NIGHT` bleiben (Test) |
Bleiben müssen: `#cosmetics`, `.cos-card`, `.cos-close`, `.cos-body`, `.cos-row`, `.sw[data-key]` mit `role="switch"`, `aria-checked`, `aria-label` „…, an/aus/gesperrt“, `.cos-prog`, `.cos-open`.

## Tests
- `tests/e2e/kosmetik.test.mjs` alle fünf Tests bleiben grün (Schalter 64 × 44, Zeile 56, „Gold auf 2 / 5 Karten“, „Gold im Albtraum nötig“, Tastatur, Handy quer ohne Scrollen, „Fertig“ ≥ 44).
- `tests/screens.test.js` zu `cosmeticsView`/`cosmeticsHtml`/`toggleCosmetic`: bleiben grün; `cosmeticsHtml` darf zusätzliche Elemente enthalten.
- Neu `tests/screens.test.js`: `cosmeticsHtml` enthält je Kartenzeile Stilname (frei) bzw. „(du: Bronze/Silber/kein Abzeichen)“ (gesperrt) und das Zustandswort.
- Neu e2e (`kosmetik.test.mjs`): 1280x800 `.cos-preview` sichtbar, 612 ± 2 breit, Klick auf zweite Zeile ändert den Vorschau-Titel; 844x390 `.cos-preview` unsichtbar.

## Messbare Abnahme
- 1280x800: `.cos-card` 560 breit, `.cos-preview` 612 breit, beide Oberkante 36 ± 4, Unterkante ≤ 768.
- Jede `.cos-row` 56 hoch, jeder `.sw` 64 × 44 (`getBoundingClientRect`).
- Gesperrter Schalter zeigt das Schloss (Element im `.sw` sichtbar) und das Wort „Gesperrt“.
- 844x390: Seite scrollt nicht, `.cos-card` im Bild, kein `.cos-preview`.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
