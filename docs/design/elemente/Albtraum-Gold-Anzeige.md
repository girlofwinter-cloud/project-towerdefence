# Albtraum-Gold-Anzeige (B-184): HUD-Chip mit der Gold-Bedingung der Karte, erfüllt oder verletzt
Fläche: [Albtraum-Skizzen #Abzeichen](https://claude.ai/artifact/1AQYMEJUnDuR5VUhpkaWbG#artboard-Abzeichen) (rechte Spalte) und #Stimmung (HUD rechts). Backlog: B-184 (ersetzt die schlichte B-183-Optik von `#gold-goal`). Stand: agent/albtraum@f8d5826. Skizze, keine Feinarbeit.

## Maße
- Desktop 1280x800 und 1366x768: Chip in der HUD-Leiste (`.hud`, 56 hoch) direkt rechts von `#lives-box`; Höhe 36, Radius 18, Innenabstand 0/12/0/4, Lücke 6; Zeichen-Kreis 28 × 28; Text 15 px `font-display`, eine Zeile, max. 260 breit (Ellipse `…`, voller Text im `title`/`aria-label`).
- Handy quer 844x390 (HUD-Plakette oben links, 124 hoch): nur das Zeichen, Kreis 24 × 24 an der oberen rechten Ecke der Plakette (top −8, right −8); kein Text. Der Text erscheint stattdessen über `#message` (siehe Zustände). Kein Tippziel nötig (HUD ist `pointer-events: none`).

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Chip erfüllt | `wood-a` → `wood-b`, Rand `ink` 3 | #a4672f → #7a4520 |
| Chip verletzt | `darkwood-a` → `darkwood-b`, Rand `ink` 3 | #6b4a2e → #3a2414 |
| Text | `cream` mit `ink`-Umriss 2 (wie `.to`) | 7,2:1 auf `darkwood-a` |
| Zeichen erfüllt | Kreis `message-info`, Rand `ink` 3, Haken `cream` 3,5 | #4f8a34 |
| Zeichen verletzt | Kreis `message-bad`, Rand `ink` 3, Kreuz `cream` 3,5 | #b8432f |
| Aufblitzen | `bad` | #ff6b5a |
| Schatten | 0 3 0 rgba(30,15,5,0.45) | |

## Formen/SVG
32er Box, auf 28 bzw. 24 skaliert:
~~~html
<!-- erfüllt -->
<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="var(--message-info)" stroke="var(--ink)" stroke-width="3"/><path d="M9 16.5 L14 21 L23 11" fill="none" stroke="var(--cream)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
<!-- verletzt -->
<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="var(--message-bad)" stroke="var(--ink)" stroke-width="3"/><path d="M11 11 L21 21 M21 11 L11 21" fill="none" stroke="var(--cream)" stroke-width="3.5" stroke-linecap="round"/></svg>
~~~
Text: „Gold: <Bedingung>“ (aus `goldGoalView`, z. B. „Gold: ohne Fähigkeiten“).

## Zustände
- Ausgeblendet: Normalmodus oder keine Bedingung (`hidden`, wie heute).
- Erfüllt: Holz, Haken.
- Verletzt: dunkles Holz, Kreuz, Text durchgestrichen (2 px) – drei Merkmale, nicht nur Farbe. Beim Wechsel einmal 0,4 s aufblitzen (Rand `bad` 3 px + scale 1,1 → 1), danach ruhig.
- Handy quer: Kreis mit Haken/Kreuz; beim Spielstart einmal `#message` (Info) „Gold: <Bedingung>“, beim Verletzen einmal `#message` (Warnung) „Gold verfehlt: <Bedingung>“.
- reduced motion: kein Aufblitzen, nur Zustandswechsel.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `index.html` | `#gold-goal` behält `.gg-text` und `.gg-mark`; `.gg-mark` wird das SVG-Zeichen |
| `style.css` | Regeln `.gold-goal` (Z. 116–120) und Handy-Block (Z. 506–508) ersetzen |
| `src/hud.js` | `goldGoalView` liefert weiter `ok`, `text`, `mark`; `mark` = 'ok' / 'broken' für das Zeichen |
| `src/main.js` | Meldungen über `#message` beim Start und beim ersten Verletzen |
IDs/Klassen, die bleiben: `#gold-goal`, `.gg-text`, `.gg-mark`, `.broken`.

## Tests
- Bestehend: B-183-Tests zu `goldGoalView` in `tests/game.test.js` bleiben grün.
- Neu e2e (`tests/e2e/screens.test.mjs` oder Testseite): Albtraum bei 1280x800 zeigt `#gold-goal` 36 hoch, ohne Überlappung mit `#lives-box` und dem Wellenknopf; bei 844x390 Kreis 24 × 24 innerhalb des Fensters.

## Messbare Abnahme
- 1280x800 und 1366x768: Chip-Höhe 36 ± 1, rechts von `#lives-box`, kein Schnitt mit anderen HUD-Teilen (`getBoundingClientRect`).
- 844x390: Zeichen 24 × 24, vollständig sichtbar.
- Verletzt-Zustand im Screenshot ohne Farbe erkennbar (Kreuz + Durchstreichung).
- `npm test` und `npm run test:e2e` grün.
