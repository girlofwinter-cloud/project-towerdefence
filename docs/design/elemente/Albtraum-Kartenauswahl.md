# Albtraum-Kartenauswahl (B-184): Umschalter Normal/Albtraum, Albtraum-Knopf, Abzeichen-Slots je Karte, Zähler, Sperre
Fläche: Albtraum-Skizzen (Claude Design, Link setzt der Orchestrator)#Main. Backlog: B-184 (ersetzt die schlichte `.map-nightmare`-Optik aus B-182). Stand: agent/albtraum@f8d5826. Skizze, keine Feinarbeit.

## Maße
- Kopfleiste (`.plq`, links/rechts 40, oben 28, Höhe 72): Titel links, Umschalter Mitte, Zähler rechts.
- Umschalter: Schiene `ink`, Innenabstand 3, Lücke 3, Radius 24; zwei Knöpfe je ≥ 130 × 44, Radius `radius-pill-m` (20px).
- Zähler „Abzeichen x / 15“: Pille `ink`, Radius 22, Innenabstand 6/16/6/8, Gold-Abzeichen S 36 + Text 22 px `font-display`.
- Kartenkarte (heute `.map-card` 196 × 290): im Albtraum-Modus unter den Sternen Slot-Reihe 3 × 44, Lücke 8 (152 breit, 44 hoch), darunter Knopf „Albtraum spielen“ 160 × 44 statt `.map-best`; Karte wächst auf 360 hoch (Desktop), Reihe oben 150.
- 1366x768: wie Desktop. Handy quer 844x390 (Karte ≈ 159 breit): Slots 3 × 36 (Lücke 6), Zeile trotzdem 44 hoch als ein Tippziel; Knopf Breite = Karte − 16, 44 hoch; Vorschaubild darf schrumpfen (aspect-ratio bleibt), damit Unterkante ≤ 390. Umschalter-Knöpfe 44 hoch, min 110 breit.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Hintergrund Albtraum | `night-ember` α 0,45 unten + `night-a` → `night-b` radial | #ff5a2a / #2a1f44 → #0e0b1a |
| Umschalter aktiv Normal | `gold-btn-a` → `gold-btn-b`, Text `ink` | #ffd45a → #e08a1c |
| Umschalter aktiv Albtraum | `nightmare-btn-a` → `nightmare-btn-b`, Text `cream`, Glühen 0 0 12 `night-ember` α 0,6 | #5b3f7a → #2a1d40 |
| Umschalter inaktiv | transparent, Text `muted` | #e8d3a8 |
| Kartenkarte im Albtraum | `night-card-a` → `night-card-b` | #4a3550 → #2a1d30 |
| Vorschaubild abdunkeln | `night-tint` Deckkraft 0,35 (frei) / 0,7 (gesperrt) | rgba(20,12,40,0.62) |
| Albtraum-Knopf | `nightmare-btn-a` → `nightmare-btn-b`, Rand `ink` 3, Radius `radius-card` (22px), Text `cream` 17 px | |
| Sperre Text | `map-locked` 15 px, Schloss `gold` + `lock-shackle` | #c9b89a |
| Sterne leer | `star-empty` | #5a3a22 |
- Kontrast: `cream` auf `nightmare-btn-a` 7,8:1; `map-locked` auf `night-card-a` 5,6:1; `muted` auf `ink` > 10:1.

## Formen/SVG
Abzeichen aus Albtraum-Abzeichen.md (S 44 bzw. 36). Schloss klein (24er Box):
~~~html
<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 11 V8 a5 5 0 0 1 10 0 V11" fill="none" stroke="var(--lock-shackle)" stroke-width="2.5"/><rect x="4" y="10" width="16" height="12" rx="3" fill="var(--gold)" stroke="var(--ink)" stroke-width="2"/></svg>
~~~
Umschalter als `<div role="radiogroup">` mit zwei `button[role=radio][aria-checked]`.

## Zustände
- Normal-Modus: Karten wie heute; Knopf „Albtraum“ (klein, ohne Slots) nur auf Karten mit 3 Sternen, sonst Zeile „Albtraum: 3 Sterne nötig“ mit Schloss.
- Albtraum-Modus: Hintergrund, Karten nachtfarben, Slots sichtbar, Knopf „Albtraum spielen“; gesperrte Karte: großes Schloss (52) mittig auf dem Vorschaubild, Vorschaubild 0,7 abgedunkelt, Text „Albtraum: 3 Sterne nötig“, Karte nicht wählbar.
- Slot: offen / Bronze / Silber / Gold; `aria-label` z. B. „Gold: ohne Fähigkeiten, offen“. Tipp/Klick auf die Slot-Zeile schreibt die drei Bedingungen in `.start-hint` (kein Hover nötig).
- Hover: `brightness(1.08)`; Fokus: `hl` 4 px Ring (wie `.map-card`); gedrückt: 2 px tiefer, Schatten 2 px.
- Wechsel Normal ↔ Albtraum: Hintergrund und Karten 0,4–0,5 s Überblendung; reduced motion: sofort.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/screens.js` | Umschalter, Slots, Zähler in `mountStartScreen`/`mapCards`; Klasse `.map-nightmare` und `data-map` bleiben |
| `style.css` | `.start-mode`, `.map-badges`, `.badge-count`, Albtraum-Varianten (`#start-screen.nightmare`) |
| `index.html` | Platz für Umschalter und Zähler in `#start-screen` |
IDs/Klassen, die bleiben: `#start-screen`, `.map-cards`, `.map-card`, `.map-slot`, `.map-nightmare`.

## Tests
- Bestehend: `tests/screens.test.js`, `tests/e2e/screens.test.mjs`, `tests/e2e/progress.test.mjs` bleiben grün (Knopf `.map-nightmare` startet weiter den Albtraum).
- Neu `tests/screens.test.js`: Zähler zählt Abzeichen über alle Karten (0..15); Slot-Labels je Stufe. Neu e2e: alle Knöpfe im Startbildschirm ≥ 44 px hoch bei 844x390.

## Messbare Abnahme
- 1280x800: Umschalter-Knöpfe ≥ 130 × 44, Albtraum-Knopf 160 × 44, Slots 44 × 44 (`getBoundingClientRect`).
- 844x390: kein Scrollen, Unterkante aller Karten ≤ 390, jedes Tippziel ≥ 44 hoch.
- `npm test` und `npm run test:e2e` grün.
