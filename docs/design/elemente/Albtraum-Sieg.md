# Albtraum-Sieg (B-184): Siegbildschirm im Albtraum mit einfliegendem Abzeichen, Stufenreihe, Werten und Hinweis auf neue Belohnung
Fläche: Albtraum-Skizzen (Claude Design, Link setzt der Orchestrator)#Sieg (Eigenschaft „stufe“, Knopf „Nochmal abspielen“). Backlog: B-184. Stand: agent/albtraum@f8d5826. Skizze, keine Feinarbeit.

## Maße
Bei 1280x800, mittig im `#overlay` (Aufbau wie Overlay-Spielende.md):
- Strahlen: Kreis 600 × 600, Mitte (640, 100), hinter allem.
- Medaille: Abzeichen S 200, oben links (540, 40), über Band und Plakette.
- Band „Albtraum besiegt!“: 620 × 60 bei (330, 228); vorhandenes `#end-ribbon-band` wiederverwenden (Text statt „Gewonnen“).
- Plakette: 520 × 460 bei (380, 250), Innenabstand oben 96 (Platz für die Medaille), Spalte mittig, Lücke 12:
  Titel „<Karte> – <Stufe>-Abzeichen“ 28 px · Mini-Reihe 3 Abzeichen S 40 (Lücke 6) · Bedingung 15 px · Werte-Pillen (Welle 20 / 20, Leben x / 5) 22 px · Belohnungs-Zeile · Knöpfe unten.
- Knöpfe: „Kartenauswahl“ (Holz) und „Weiter“ (Gold, min 168), je 46 hoch, Lücke 12.
- Handy quer 844x390: Medaille S 120 links neben der Plakette statt darüber; Plakette max. 360 hoch; Knöpfe ≥ 44 hoch; keine Überlappung.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Hintergrund | `night-a` → `night-b` radial (50 % / 15 %) | #2a1f44 → #0e0b1a |
| Strahlen | `gold-btn-a` α 0,16, 18 Strahlen à 10° | #ffd45a |
| Band | `flag-red`, Rand `ink` 4 | #c4452f |
| Plakette | `wood-a` → `wood-b`, Rand `ink` 4, `radius-card` | #a4672f → #7a4520 |
| Bedingungstext | `muted` 15 px | #e8d3a8 (5,3:1 auf `wood-b`) |
| Werte-Pillen | Grund `ink`, Text `cream` | |
| Belohnungs-Zeile | Grund `night-a`, Rand `ink` 3, Radius 14, Mond `cream` | 13,8:1 |
| Knöpfe | `wood-btn` → `wood-b` / `gold-btn-a` → `gold-btn-b`, `radius-pill-l` | |

## Formen/SVG
Medaille aus Albtraum-Abzeichen.md. Mond der Belohnungs-Zeile (24er Box): `M14 3 A9 9 0 1 0 21 14 A7 7 0 1 1 14 3 Z`, `cream`, Rand `ink` 2.
Einflug (CSS):
~~~css
@keyframes badge-fly { 0% { transform: translateY(-260px) scale(2.4) rotate(-30deg); opacity: 0 } 60% { opacity: 1 } 100% { transform: none; opacity: 1 } }
.end-badge.fly { animation: badge-fly .9s cubic-bezier(.2,1.5,.4,1) both; }
.end-rays { animation: spin 30s linear infinite; } @keyframes spin { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .end-badge.fly, .end-rays { animation: none; } }
~~~

## Zustände
- Neues Abzeichen (höchstes neu erreichtes Bronze/Silber/Gold): Einflug 0,9 s, Strahlen drehen, Mini-Reihe zeigt alle erreichten Stufen, offene als offen-Zustand.
- Gold neu und dadurch Belohnung frei: Belohnungs-Zeile „Neue Belohnung freigeschaltet: Nacht-Look <Karte>“ (bzw. „Goldene Türme“ beim fünften Gold); sonst entfällt die Zeile.
- Kein neues Abzeichen: gleiche Plakette mit vorhandener höchster Stufe, ohne Einflug, ohne Strahlen.
- Verloren im Albtraum: normaler Spielende-Bildschirm (Overlay-Spielende.md), kein Abzeichen.
- Fokus: „Weiter“ hat Startfokus, `hl`-Ring. reduced motion: Medaille steht sofort, Strahlen stehen.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `index.html` | in `#overlay`: `.end-rays`, `.end-badge`, `.end-badges` (Mini-Reihe), `.end-reward` |
| `style.css` | Albtraum-Variante `#overlay.nightmare`, Keyframes oben |
| `src/main.js` | Zustand setzen (Stufe, neu ja/nein, Belohnung) aus vorhandenen Werten (`nightmareResultLines`, B-183/185) |
IDs, die bleiben: `#overlay`, `#overlay-title`, `#end-ribbon-band`, `#overlay-stats`, `#overlay-progress`.

## Tests
- Bestehend: `tests/e2e/screens.test.mjs`, `tests/screens.test.js` grün.
- Neu `tests/screens.test.js`: Sieg-Ansicht liefert Stufe = höchste neue, `fly` nur bei neuem Abzeichen, Belohnungs-Zeile nur bei neu freigeschalteter Kosmetik.

## Messbare Abnahme
- 1280x800: Medaille 200 × 200, Knöpfe ≥ 46 hoch, nichts ragt aus dem Fenster.
- 844x390: alle Teile im Fenster, keine Überlappung von Medaille und Text, Knöpfe ≥ 44 hoch.
- reduced motion: nach 0 ms Endzustand (Screenshot sofort = Screenshot nach 1 s).
- `npm test` und `npm run test:e2e` grün.
