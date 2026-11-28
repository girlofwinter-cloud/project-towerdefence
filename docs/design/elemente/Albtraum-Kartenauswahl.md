# Albtraum-Kartenauswahl (Runde 2): Startbildschirm mit Umschalter Normal/Albtraum, Kartenkarten mit Vorschau im Kartenstil, Abzeichen-Slots, Gold-Bedingung, Sperre und Lernzeile
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Kartenauswahl (Tweaks `start`, `geraet`). Backlog: B-191. Stand: agent/albtraum-design@b13c4d4.

Ersetzt die Optik aus B-184. Ablauf bleibt: Klick auf Karte bzw. „Albtraum spielen“ startet sofort (der große Startknopf der Fläche ist nur Prototyp und entfällt). Kein dunkler Rand.

## Maße
Desktop 1280x800 (1366x768 gleich, Lernzeile siehe unten):
- Kopfzeile `.start-head`: Plakette 1200 × 80, oben 24, Radius `radius-card` (22px), Rand `ink` 4. Links Symbol 60 × 60 (Normal: Fahne, Albtraum: Gold-Medaille S 60), Titel 32 px `font-display` („Wähle deine Karte“ / „Albtraum“), darunter Untertitel 13 px („Hol 3 Sterne, um den Albtraum zu öffnen“ / „Für Profis: jede Karte mit 3 Sternen“).
- Umschalter `.start-mode`: Schiene `ink`, 328 × 56, Innenabstand 3, Lücke 4, Radius 28; Knöpfe je 160 × 50, Radius 25, Text 20 px; „Albtraum“ mit Mond-Symbol 20 links.
- Zähler `.badge-count`: Pille `ink` 220 × 48, Radius 24, links Medaille S 38 (Albtraum) bzw. Stern 36 (Normal), Wort 14 px `muted`, Zahl 24 px `cream`. Normal: „Sterne x / 15“, Albtraum: „Abzeichen x / 15“.
- Kartenkarten `.map-card`: 224 breit, Lücke 20 (5 × 224 + 4 × 20 = 1200), oben 124 (gewählt 116). Normal 300 hoch, Albtraum 420 hoch (Hülle `.map-slot`). Unter 1100 px Breite: wie heute 172 (Media-Query bleibt).
  - Vorschau 200 × 140 in schwarzem Rahmen 206 × 146 (Radius 12 / 10), oben 9.
  - Albtraum: Stil-Schild oben links in der Vorschau (left 14, top 14): Pille `ink`, 12 px `cream`, Punkt 12 in Augenfarbe des Stils + Stilname.
  - Name 24 px bei y 160, Sterne 3 × 28 (Lücke 6) bei y 194.
  - Normal: „Beste Welle 20 / 20“ 15 px bei y 236; darunter Pille `ink` 164 × 24 „Albtraum offen“ (Mond 16) bzw. Text 13 px „Albtraum ab 3 Sternen“.
  - Albtraum: Slots `.map-badges` 3 × 44, Lücke 8 (148 breit) bei y 232; Bedingungskasten 204 × 40 bei y 290 (Radius 12, Grund `night-b` α 0,55, 12 px): Zeile 1 „Gold: <Bedingung>“, Zeile 2 „nächstes: Silber“ bzw. „alle Abzeichen geholt“; Knopf `.map-nightmare` **160 × 44** (Test) bei y 346, mittig.
  - Gesperrt (Albtraum ohne 3 Sterne): Vorschau mit `night-tint` 0,62, Schloss 48 mittig; Name `map-locked`; „3 Sterne nötig“ 16 px `font-display` `map-locked`, darunter 13 px „Hol den 3. Stern im Normalmodus“; Knopf „Gesperrt“ mit Schloss, `darkwood-b`, `aria-disabled`.
- Lernzeile (nur Albtraum, nur wenn `innerHeight ≥ 790`): Plakette 1200 × 132 bei y 560, `night-card-a` → `night-card-b`, Rand `ink` 3; Titel „So holst du Abzeichen“ 20 px; Text 13 px; drei Medaillen S 64 mit „Bronze/Silber/Gold“ 19 px (`badge-bronze-a`, `badge-silver-hi`, `gold-light`) und Satz 13 px; rechts 176 breit: Hinweis Nacht-Look/goldene Türme.
- Normal: Lockplakette 680 × 84 bei (300, 470), `nightmare-btn-a` → `nightmare-btn-b`, Glühen 0 0 22 `night-ember` α 0,35; Medaille S 62, „Albtraum offen auf x Karten“ 22 px, Satz 14 px, Knopf „Umschalten“ (`btn-night`, 172 × 46). Nur wenn mindestens eine Karte 3 Sterne hat.
- Unten: „Aussehen“ `.cos-open` 196 × 52 (Holz, Pinsel-Symbol 26) bei (40, 718); `.start-hint` daneben (15 px, Albtraum `muted`, Normal `ink`).
- Handy quer 844x390: Kopf 828 × 56 (Titel 22, Umschalter 240 × 46 mit Knöpfen je 119 × 44, Zähler 172 × 42 mit Medaille 32); Karten 158 breit, Lücke 8, oben 70, 240 hoch; Vorschau 142 × 99; Slots 3 × 36 in einer 44 hohen Zeile; Knopf Breite 140 × 44 (Text „Spielen“); kein Bedingungskasten, keine Lernzeile; „Aussehen“ 170 × 48 bei (12, 328). Unterkante Karten 310.
- Hintergrund Normal: Himmel `sky-a` → `sky-b` → Wiese, Hügel `map-meadow-2`/`map-meadow-3` mit Kontur `ink` 4, runde Bäume am Rand. Albtraum: `night-a` → `night-b` radial (50 % / 10 %), `night-ember` α 0,42 radial von unten (300 hoch), kahle Bäume mit Augen (`nm-eye-moss`) im Rand, Sterne und Seelenlichter (`nm-soulflame`). Keine Vignette.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kopf Normal / Albtraum | `wood-a` → `wood-b` / `night-card-a` → `night-card-b` | #a4672f → #7a4520 / #4a3550 → #2a1d30 |
| Umschalter aktiv Normal | `gold-btn-a` → `gold-btn-b`, Text `ink` | #ffd45a → #e08a1c |
| Umschalter aktiv Albtraum | `nightmare-btn-a` → `nightmare-btn-b`, Text `cream`, Glühen 0 0 12 `night-ember` α 0,6 | #5b3f7a → #2a1d40 |
| Umschalter inaktiv | transparent, Text `muted` | #e8d3a8 |
| Karte Normal / Albtraum | Holz `wood-fig-a` → `wood-fig-b` / `night-card-a` → `night-card-b` | #c88a4c → #8a5326 / #4a3550 → #2a1d30 |
| Gewählt | `shadow-card-current` mit Ring 5 statt 4, Albtraum + 0 0 30 `night-ember` α 0,5 | #ffe266 (`hl`) |
| Albtraum-Knopf | `nightmare-btn-a` → `nightmare-btn-b`, Rand `ink` 3, Radius 22, Text `cream` 18 | |
| Gesperrt-Knopf | `darkwood-b`, Text `map-locked` | #3a2414 / #c9b89a |
| Bedingungskasten | `night-b` α 0,55, Text `muted`/`cream` 12 | #0e0b1a |
| Sterne | `gold` / `star-empty` | #f2c14e / #5a3a22 |
| Augenpunkt im Stil-Schild | `nm-eye-moss` / `nm-eye-ember` / `nm-eye-rune` | #d8ff5a / #ffb02a / #e6b8ff |
| Himmel Normal | neu `sky-a` → `sky-b` | #8fd0e8 → #d8f0e8 |
- neu: `sky-a` = #8fd0e8, `sky-b` = #d8f0e8: Himmel des Startbildschirms im Normalmodus
- neu: `badge-silver-hi` = #e6ecf2, Schrift „Silber“ in der Lernzeile
- neu: `nm-soulflame` = #9fe8ff (aus Runde 1, falls noch nicht im System), Seelenlichter im Albtraum-Hintergrund
- Kontrast: `cream` auf `night-card-b` 14,4:1; `muted` auf `night-card-a` 7,5:1; `map-locked` auf `night-card-a` 5,6:1; `ink` auf `gold-btn-b` 6,2:1.

## Formen/SVG
- Medaille: `badgeSvg(size, tier)` aus `src/badge-art.js` (Bauvorlage Albtraum-Abzeichen).
- Mond (24er Box): `M14 3 A9 9 0 1 0 21 14 A7 7 0 1 1 14 3 Z`, `cream`, Rand `ink` 2.
- Pinsel (28er Box): Kopf `M6 22 Q4 16 10 15 L14 19 Q13 25 6 22 Z` (`flag-red`, Rand `ink` 2.4), Stiel `M12 17 L23 5` (`ink` 6, darüber `path-mid` #e8c185 3).
- Vorschau im Albtraum: `paintThumb(cv, mapId, { night: true })` malt die Karte mit dem Albtraum-Look ihres Stils (Karten-Bauvorlagen `Karte-*-Albtraum`); Normal wie heute. Cache-Schlüssel um `night` erweitern.

## Zustände
- Modus Normal / Albtraum (Umschalter, `aria-checked`), Wechsel blendet Hintergrund 0,45 s (wie heute, `#start-screen::before`).
- Karte: normal, Hover (Helligkeit 1,08), gewählt/Fokus (−8 px, Ring), gesperrt.
- Slots: je Stufe Medaille oder offener Ring (gestrichelt `muted`); Tipp auf die Slot-Reihe schreibt die Bedingungen in `.start-hint .badge-hint` (wie heute).
- Albtraum-Knopf: normal, Hover, gedrückt (+2 px), Fokus (Ring 4 `hl`), gesperrt.
- Handy quer: siehe Maße. reduced motion: keine Übergänge, keine pulsierenden Lichter.
- Information nie nur über Farbe: Sperre mit Schloss + Text, Stil mit Name, Stufe mit Medaille + Tooltip/aria.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `index.html` | `.start-head`: Symbol-Platz vor dem Titel, Untertitel; Lernzeile `<div class="nm-learn" hidden>`; Lockplakette `<div class="nm-teaser" hidden>` mit Knopf |
| `style.css` | Maße oben: `.start-head`, `.start-mode`, `.badge-count`, `.map-card` (224/300/420), Stil-Schild `.map-style`, `.map-cond`, `.map-nightmare` (Lage), `.nm-learn`, `.nm-teaser`, Hintergründe, Media-Queries 844x390 |
| `src/screens.js` | `mountStartScreen`: Stil-Schild, Bedingungskasten, Gesperrt-Knopf, Untertitel, Zählerwort, Lernzeile/Lockplakette ein-/ausblenden; `paintThumb` mit `night` |
| `src/config.js` | Stilname/Augenfarbe je Karte (aus Karten-Bauvorlagen), Texte bleiben in `screens.js` |
Bleiben müssen: `#start-screen` (Klasse `nightmare`), `.start-mode button[data-mode]` + `aria-checked`, `.badge-count` (`aria-label` „Abzeichen x / 15“), `.map-card`, `.map-slot`, `.map-badges[data-map]`, `.map-badges .badge`, `.map-nightmare[data-map]`, `.start-hint .badge-hint`, `.cos-open`.

## Tests
- `tests/e2e/albtraum.test.mjs` „B-184 1280x800 …“: bleibt grün (Umschalter ≥ 130 × 44, `.map-nightmare` 160 × 44, Slot 44 × 44, kein Scrollen – Lernzeile nur bei Höhe ≥ 790 und innerhalb 800).
- „B-184 844x390 …“ und „B-184 667x375 …“: bleiben grün (kein Scrollen, Tippziele ≥ 44, `.map-slot` Unterkante ≤ 390).
- `tests/e2e/kosmetik.test.mjs` „Aussehen Handy quer …“: `.cos-open` ≥ 44, ohne Überlappung – bleibt grün.
- `tests/screens.test.js`: bestehende Tests zu `mapCards`, `badgeSlots`, `badgeCounterText` unverändert.
- Neu `tests/screens.test.js`: Karten-HTML im Albtraum enthält Stil-Schild mit Stilname je Karte, Bedingungskasten mit `GOLD_CONDITIONS[id].label`; gesperrte Karte enthält „3 Sterne nötig“ und Knopf mit `aria-disabled`.
- Neu e2e (in `albtraum.test.mjs`): 1280x800 Albtraum: `.map-card` 224 × 420 ± 1; Lernzeile sichtbar und Unterkante ≤ 800; 1366x768: Lernzeile versteckt, kein Scrollen.

## Messbare Abnahme
- 1280x800 Albtraum: 5 Karten in einer Reihe, `.map-card` 224 breit, Lücke 20, `.map-nightmare` 160 × 44, Slot 44 × 44 (`getBoundingClientRect`).
- 1280x800 und 1366x768: `document.scrollingElement.scrollHeight ≤ innerHeight`.
- 844x390: Karten 158 ± 2 breit, Unterkante `.map-slot` ≤ 390, alle Knöpfe ≥ 44 hoch.
- Vorschau im Albtraum zeigt die Karte im Stil (Wiese grünblau mit kahlen Bäumen, Zangenangriff braun, Eiswelt blau-weiß), Screenshot neben Fläche „Kartenauswahl“.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
