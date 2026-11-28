# Kosmetik-Aussehen (B-185): Menü „Aussehen“ mit Schaltern für Nacht-Look je Karte und goldene Türme, dazu die goldene Turm-Variante
Fläche: Albtraum-Skizzen (Claude Design, Link setzt der Orchestrator)#Kosmetik. Backlog: B-185 (Logik in `src/cosmetics.js` fertig). Stand: agent/albtraum@f8d5826. Skizze, keine Feinarbeit.

## Maße
- Menü-Plakette 560 × ≤ 680 (Desktop), Innenabstand 24/28, `radius-card`; Zugang über Knopf „Aussehen“ im Startbildschirm (Holz-Textknopf, ≥ 44 hoch).
- Überschrift 34 px, Abschnitts-Titel 20 px.
- Zeile 56 hoch, Trennlinie unten 2 px `ink` α 0,35: Name (20 px, flex 1) · ggf. Schloss 22 + Grund 14 px · Schalter rechts.
- Schalter: 64 × 44, Radius 22, Rand `ink` 3; Knopf 30 × 30 rund, Rand `ink` 3, links 4 (aus) / 26 (an), Übergang 0,2 s.
- Fortschritt „Gold auf x / 5 Karten“: Leiste volle Breite × 16, Radius 8, Rand `ink` 2.
- Handy quer 844x390: Plakette volle Höhe minus Ränder, Inhalt scrollt in der Plakette (einziger Scrollbereich), Zeilen und Schalter bleiben 44 hoch; Vorschau entfällt.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Hintergrund | `night-a` → `night-b` | #2a1f44 → #0e0b1a |
| Plakette | `wood-a` → `wood-b` | #a4672f → #7a4520 |
| Schalter aus / an / gesperrt (Schiene) | `ink` / `message-info` / `darkwood-b` | #2b1a10 / #4f8a34 / #3a2414 |
| Schalter-Knopf / gesperrt | `btn-a` → `btn-b` / `stone-line` | #d79a52 → #8a5224 / #6b5a48 |
| Schloss | `gold` + Bügel `lock-shackle` | #f2c14e / #d9dde2 |
| Grund-Text | `muted` 14 px | 5,3:1 auf `wood-b` |
| Fortschritt | Grund `ink`, Füllung `gold-btn-a` → `gold-btn-b` | |
| **Goldene Türme** | | |
| Stein (`s1-stone`) | `cream` → `stone-a` (0,6) → `stone-b` | #fff3d2 → #e3d2b0 → #b9a283 |
| Holz (`s1-wood`) | `gold-light` → `gold-dark` | #ffe27a → #b9851d |
| Holz flach (`wood-fig-c`, Zinnen/Dach) | `gold-btn-b` | #e08a1c |
| Steinfugen (`stone-line`) | `gold-dark` | #b9851d |
| Glanzkante (neu, oben auf Holzteil) | `gold-light` 5, round, α 0,9 | #ffe27a |
| Funkel | `bolt`, Rand `ink` 1 | #fff6a8 |

## Formen/SVG
Goldene Türme tauschen nur Farben/Verläufe in den Turm-SVGs (`src/figures.js`, Verläufe in `src/svg-figure.js` Z. 9–10), Silhouette, Figuren (Schützen, Mützen), Turmspitzen und Stufenmarke bleiben:
~~~js
// svg-figure.js: zusätzliche Verläufe, per Ersetzen von url(#s1-stone)/url(#s1-wood) und Hex-Werten aktiv
's1-stone-gold': { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#fff3d2'], [0.6, '#e3d2b0'], [1, '#b9a283']] }, // cream, stone-a, stone-b
's1-wood-gold':  { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#ffe27a'], [1, '#b9851d']] },                  // gold-light, gold-dark
// Farbtausch im SVG-Text: '#a9703d' (wood-fig-c) -> '#e08a1c' (gold-btn-b); '#6b5a48' (stone-line) -> '#b9851d' (gold-dark)
~~~
Funkel (14er Box, Mitte 7/7): `M7 0 L8.5 5.5 L14 7 L8.5 8.5 L7 14 L5.5 8.5 L0 7 L5.5 5.5 Z`, je Turm 2 Stück an festen Stellen (oben links am Holz, rechts am Stein), Größe 0,25 Kachel; Takt 1,4 s (α 0,2 ↔ 1, scale 0,6 ↔ 1,1), zweites um 0,6 s versetzt.
Schalter (HTML): `<button class="sw" role="switch" aria-checked="true|false" aria-label="Nacht-Look Wiese, an"><span class="knob"></span></button>`.

## Zustände
- Schalter aus / an: Schiene `ink` / `message-info`, Knopf links / rechts; `aria-checked`. Fokus: `hl` 3 px Ring.
- Gesperrt: `disabled`, Schiene `darkwood-b`, Knopf `stone-line`, Schloss + Grund „Gold im Albtraum nötig“ (bzw. „Gold auf allen Karten nötig“); `aria-label` endet mit „, gesperrt“.
- Goldene Türme: Fortschritt „Gold auf x / 5 Karten“ (Text + Leiste, x aus `cosmetics.js`), bei 5 / 5 Schloss weg, Schalter frei.
- Goldener Turm im Spiel: alle Stufen 1–3 golden, Stufenmarke unverändert; eingefroren/Effekte wie normal. Vorschau-Turm im Menü (Desktop): normal und golden nebeneinander.
- reduced motion: Funkel stehen (α 0,8), Schalter ohne Übergang.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `index.html` | Knopf „Aussehen“ in `#start-screen`, Dialog `#cosmetics` |
| `style.css` | `.sw`, `.cos-row`, `.cos-prog`, Plakette |
| `src/screens.js` | Menü aufbauen aus `COSMETICS` und `cosmetics.js` (frei/gesperrt/an) |
| `src/svg-figure.js`, `src/figures.js` | goldene Verläufe und Farbtausch, wenn `goldTowers` aktiv |
| `src/tower-fx.js` | Funkel je goldenem Turm |
| `src/config.js` | `COSMETIC_STYLE` (Farben, Funkel-Takt), keine Spielwerte |

## Tests
- Bestehend: `tests/progress.test.js` (Kosmetik-Logik B-185) grün.
- Neu `tests/render.test.js`: mit `goldTowers` enthält das Turm-SVG `#ffe27a` und nicht `#c88a4c`; ohne bleibt es unverändert. Neu `tests/screens.test.js`: gesperrter Schalter ist `disabled` und hat „gesperrt“ im Label.
- Neu e2e: Schalter ≥ 44 hoch bei 1280x800 und 844x390; Auswahl bleibt nach Neuladen.

## Messbare Abnahme
- 1280x800: Schalter 64 × 44, Zeilen 56 hoch; 844x390: jedes Tippziel ≥ 44 hoch, Seite selbst scrollt nicht.
- Screenshot goldener Turm aller Typen: Typ und Stufe so erkennbar wie normal (Silhouette gleich).
- `npm test` und `npm run test:e2e` grün.
