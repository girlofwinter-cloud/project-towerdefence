# Albtraum-Abzeichen (Runde 2): Medaille mit Oger-Kopf in Bronze, Silber, Gold, dazu offen und gesperrt, in den Größen 200, 120, 64, 44, 40, 36, 24
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Belohnungen (Abschnitt „Medaille Oger-Kopf“), im Einsatz auf #artboard-Kartenauswahl und #artboard-Sieg. Backlog: B-193. Stand: agent/albtraum-design@b13c4d4.

Form und Farben entsprechen der heutigen Umsetzung `badgeSvg` (`src/badge-art.js`, `BADGE_STYLE` `src/config.js` Z. 1879); neu sind nur der Zustand „gesperrt“, das Funkeln bei Gold groß und die Größen 64/24.

## Maße
- Bezugsbox 100 × 100. Scheibe: Kreis (50, 42) r 38. Band: zwei Zipfel bis y 100. Kopf im Scheibenraster `translate(12,4) scale(0.76)`.
- Größen im Einsatz: 200 (Sieg), 132 (Sieg Handy quer), 120 (Übersicht), 66 (Aussehen: Freischalt-Kasten), 64 (Lernzeile Kartenauswahl), 62 (Lockplakette), 60 (Kopfzeile Kartenauswahl), 46 (HUD-Plakette), 44 (Slot Kartenkarte), 40 (Sieg-Reihe), 38/36 (Zähler, Sieg-Reihe Niederlage, Handy-Slots), 24 (Medaillenreihe im Aussehen-Menü).
- Linien in Ziel-px unabhängig von der Größe (wie heute): Scheibenrand 4 (≥ 100), 3 (44–99), 2 (< 44); ≤ 44 dicke Kopf-Linien ohne Augenschein, Nase, Mund, Hauer.
- Glanz oben innen (wie heute): Bogen `M24 30 A30 30 0 0 1 50 12`, weiß α 0,45, 3 Ziel-px.
- Gesperrt: offener Ring + Schloss 22 × 22 mittig auf (50, 42) bei S 44 (left 19, top 9 in px).

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink` | #2b1a10 |
| Band | `flag-red` | #c4452f |
| Bronze | `badge-bronze-a` → `badge-bronze-b` | #f0b47a → #8a4f24 |
| Silber | `badge-silver-a` → `badge-silver-b` | #ffffff → #8f9aa6 |
| Gold | `gold-light` → `gold-btn-b` | #ffe27a → #e08a1c |
| Kopf, Hörner, Hauer | `cream` | #fff3d2 |
| Augen / Augenschein | `ogre-eye` / `lava` α 0,4 | #ffc22a / #ff7a1f |
| Offen | `cream` α 0,05, Rand `muted` gestrichelt 6/5 | #e8d3a8 |
| Schatten | 0 4 0 rgba(30,15,5,0.5) ab S 44 (`.badge-shadow`) | |
| Gold-Schein | `gold-btn-a` α 0,55, 24 px; Sieg α 0,7, 40 px (`.badge-glow`) | #ffd45a |
| Funkeln (Gold ≥ 120) | `bolt`, Rand `ink` 1,5 | #fff6a8 |
| Schloss | `gold` + Bügel `lock-shackle` | #f2c14e / #d9dde2 |
| Stufenname Bronze / Silber / Gold (Text) | `badge-bronze-a` / `badge-silver-hi` / `gold-light` | #f0b47a / #e6ecf2 / #ffe27a |
- neu: `badge-silver-hi` = #e6ecf2 (auch Kartenauswahl-Lernzeile)

## Formen/SVG
Pfade (Box 100), heute in `src/badge-art.js`, unverändert:
~~~js
const RIBBON = 'M28 55 L18 98 L32 90 L42 100 L48 60 Z M72 55 L82 98 L68 90 L58 100 L52 60 Z';
const HORN_L = 'M33 36 C22 32 15 22 17 9 C24 17 32 21 42 27 Z', HORN_R = 'M67 36 C78 32 85 22 83 9 C76 17 68 21 58 27 Z';
const FACE = 'M50 24 C64 24 72 32 72 44 L72 58 C72 72 62 82 50 82 C38 82 28 72 28 58 L28 44 C28 32 36 24 50 24 Z';
const EYE_L = 'M34 47 L47 52 L45 58 L36 56 Z', EYE_R = 'M66 47 L53 52 L55 58 L64 56 Z';
const OGRE_MOUTH = 'M37 70 Q50 77 63 70', TUSK_L = 'M41 72 L42 63 L46 73 Z', TUSK_R = 'M59 72 L58 63 L54 73 Z';
~~~
Neu, Funkeln (Box 22, nur Gold ≥ 120, 4 Stück an den Ecken der Scheibe, Pulsieren 2,6 s versetzt):
~~~js
const SPARK = 'M11 1 L13 9 L21 11 L13 13 L11 21 L9 13 L1 11 L9 9 Z';
~~~
Neu, gesperrt: `badgeSvg(size, 0, label, { locked: true })` hängt nach dem offenen Ring das Schloss (`SMALL_LOCK`, 24er Box) skaliert auf 0,5 × Scheibendurchmesser an, zentriert auf (50, 42).

## Zustände
- Bronze, Silber, Gold, offen (gestrichelter Ring, ab S 56 gestrichelter Kopf α 0,28), gesperrt (offen + Schloss, nur Kartenauswahl-Slots einer Albtraum-gesperrten Karte und Aussehen-Reihe).
- Einflug (Sieg): Bauvorlage Albtraum-Sieg. reduced motion: kein Funkeln, kein Einflug.
- Zugänglich: `label` → `role="img"` + `aria-label` („Gold-Abzeichen“, „Silber, offen“ …); Stufe nie nur über Farbe (Name im Label, Reihe Bronze–Silber–Gold fest von links).

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/badge-art.js` | Option `{ locked }`; Funkeln-Gruppe bei Gold und `size >= 120` (Klasse `badge-spark`) |
| `src/config.js` | `BADGE_STYLE.spark` (`bolt`), `BADGE_STYLE.sparkFrom` = 120 |
| `style.css` | `.badge-spark { animation: pulse 2.6s ease-in-out infinite }` + reduced motion aus |
Klassen bleiben: `.badge`, `.t1`–`.t3`, `.open`, `.badge-shadow`, `.badge-glow`.

## Tests
- `tests/screens.test.js` / `tests/render.test.js` zu `badgeSvg` (falls vorhanden): bleiben grün; Standardaufruf ändert sich nicht.
- e2e `albtraum.test.mjs`: Slot 44 × 44, `#end-badge` 200 × 200 – bleiben grün.
- Neu `tests/screens.test.js`: `badgeSvg(44, 0, '', { locked: true })` enthält das Schloss; `badgeSvg(200, 3)` enthält `badge-spark`, `badgeSvg(44, 3)` nicht.

## Messbare Abnahme
- Medaille S 44 misst 44 × 44, S 200 misst 200 × 200 (`getBoundingClientRect`).
- Gold S 200 im Sieg zeigt 4 Funkeln, Silber keins (Elementzahl `.badge-spark path`).
- Screenshot Kartenauswahl/Sieg neben Fläche „Belohnungen“ (Medaillen-Abschnitt).
- `npm test` und `npm run test:e2e` grün.
