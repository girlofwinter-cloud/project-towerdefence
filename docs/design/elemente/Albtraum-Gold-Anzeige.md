# Albtraum-Gold-Anzeige (Runde 2): HUD-Chip mit der Gold-Bedingung der Karte, erfüllt oder verpasst, mit Aufblitzen, Meldung und Handy-Zeichen
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Belohnungen (Abschnitt „Gold-Bedingung“, Knopf „Fähigkeit benutzen“ zeigt den Wechsel). Backlog: B-193. Stand: agent/albtraum-design@b13c4d4.

Ersetzt die Skizze aus B-184/B-189. Logik (`checkGoldCondition`, `goldGoalView` in `src/hud.js`) bleibt; nur Anzeige in `style.css`/`src/main.js`.

## Maße
- Desktop 1280x800 und 1366x768: `#gold-goal` in `.hud` direkt rechts von `#lives-box` (wie heute), Höhe **36** (Test), Radius 18, Rand `ink` 3, Innenabstand 0/14/0/4, Lücke 8, max. 320 breit; Zeichen `.gg-mark` 28 × 28 links.
  - Erfüllt: eine Textzeile `.gg-text` 15 px `font-display` `cream` mit `ink`-Umriss 2: „Gold: <Bedingung>“.
  - Verpasst: zwei Teile in einer Zeile: `.gg-state` „Gold verpasst“ 15 px `font-display` `bad-soft` mit `ink`-Umriss 1,5 · `.gg-text` „<Bedingung>“ 13 px `font-body` `muted` ohne Umriss. Kein Durchstreichen mehr.
- Meldung beim Verpassen (alle Geräte, einmal): `#message` mit `message-bad`, Text „Gold verpasst – Silber ist noch möglich“ (bei schon verlorenem Leben: „Gold verpasst“), 2,5 s.
- Handy quer 844x390: nur das Zeichen **24 × 24** (Test) an der oberen rechten Ecke der HUD-Plakette (top −8, right −8) wie heute; Text erscheint nur über `#message` (beim Start als Info „Gold: <Bedingung>“, beim Verpassen wie oben).

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Chip erfüllt | `wood-a` → `wood-b`, Rand `ink` 3 | #a4672f → #7a4520 |
| Chip verpasst | `darkwood-a` → `darkwood-b`, Rand `ink` 3 | #6b4a2e → #3a2414 |
| Text erfüllt | `cream` + `ink`-Umriss | 7,0:1 auf `wood-b` |
| „Gold verpasst“ | neu `bad-soft` + `ink`-Umriss | 7,1:1 auf `darkwood-b` |
| Bedingung bei verpasst | `muted` | 9,9:1 auf `darkwood-b` |
| Zeichen erfüllt | Kreis `message-info`, Rand `ink` 3, Haken `cream` 3,5 | #4f8a34 |
| Zeichen verpasst | Kreis `message-bad`, Rand `ink` 3, Kreuz `cream` 3,5 | #b8432f |
| Aufblitzen | Rand `bad`, scale 1,1 → 1, 0,4 s | #ff6b5a |
| Schatten | 0 3 0 rgba(30,15,5,0.45) | |
| Meldung | `message-bad`, Text `cream` | #b8432f |
- neu: `bad-soft` = #ff9a8a, Wort „Gold verpasst“ im HUD-Chip (heller als `bad`, lesbar auf dunklem Holz)

## Formen/SVG
Zeichen (32er Box, heute `GG_MARK` in `src/main.js`, unverändert):
~~~html
<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="var(--message-info)" stroke="var(--ink)" stroke-width="3"/><path d="M9 16.5 L14 21 L23 11" fill="none" stroke="var(--cream)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="var(--message-bad)" stroke="var(--ink)" stroke-width="3"/><path d="M11 11 L21 21 M21 11 L11 21" fill="none" stroke="var(--cream)" stroke-width="3.5" stroke-linecap="round"/></svg>
~~~
Markup:
~~~html
<span class="gold-goal" id="gold-goal" hidden><span class="gg-text"></span><span class="gg-state" aria-hidden="true">Gold verpasst</span><b class="gg-mark" aria-hidden="true"></b></span>
~~~
CSS (Ersatz für die `::after`-Linie aus B-189):
~~~css
.gold-goal .gg-state { display: none; font: 15px/1 var(--display); color: var(--bad-soft);
  text-shadow: -1.5px 0 var(--ink), 1.5px 0 var(--ink), 0 -1.5px var(--ink), 0 1.5px var(--ink); }
.gold-goal.broken .gg-state { display: inline; }
.gold-goal.broken .gg-text { font: 13px/1 var(--font-body); color: var(--muted); text-shadow: none; }
~~~
`main.js`: bei `!gg.ok` steht in `.gg-text` nur die Bedingung (`gg.text.replace(/^Gold: /, '')`); `title`/`aria-label` = `gg.title` wie heute.

## Zustände
- Ausgeblendet: Normalmodus oder keine Bedingung (`hidden`, wie heute).
- Erfüllt: Holz, Haken, „Gold: …“.
- Verpasst: dunkles Holz, Kreuz, Wort „Gold verpasst“ + Bedingung (drei Merkmale, nicht nur Farbe); beim Wechsel einmal Aufblitzen (`.flash`), Meldung einmal.
- Handy quer: nur Zeichen 24.
- reduced motion: kein Aufblitzen (wie heute).

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `index.html` | `.gg-state` im `#gold-goal` ergänzen |
| `style.css` | Regeln oben; `::after`-Strich entfernen; max-width 320, Innenabstand 0/14/0/4, Lücke 8 |
| `src/main.js` | `.gg-text` je Zustand füllen; Meldung beim Verpassen auch auf Desktop, Text „Gold verpasst – Silber ist noch möglich“ (Silber noch möglich, wenn `state` noch kein Leben verloren hat, vorhandener Zähler der Durchbrüche) |
| `src/hud.js` | unverändert (Test prüft `goldGoalView` per `deepEqual`) |
Bleiben müssen: `#gold-goal`, `.gold-goal`, `.gg-text`, `.gg-mark`, Klassen `.broken`, `.flash`, `#lives-box`.

## Tests
- `tests/game.test.js` „B-183 HUD: goldGoalView …“: bleibt grün (hud.js unverändert).
- `tests/e2e/albtraum.test.mjs`: Chip 36 hoch rechts von `#lives-box`, ohne Überlappung mit `#start-wave`; 844x390 Zeichen 24 × 24 im Fenster – bleiben grün.
- `tests/e2e/kosmetik.test.mjs` „Testseite: … Gold-Anzeige nicht überdeckt“: bleibt grün.
- Neu e2e (`albtraum.test.mjs`): Fähigkeit benutzen auf der Wiese im Albtraum → `#gold-goal.broken`, `.gg-state` sichtbar mit „Gold verpasst“, `.gg-text` = „ohne Fähigkeiten“, Höhe weiter 36, `#message` enthält „Gold verpasst“.

## Messbare Abnahme
- 1280x800: `#gold-goal` 36 ± 1 hoch, Breite ≤ 320, `x ≥ #lives-box.right`.
- Verpasst: Farbe von `.gg-state` = rgb(255,154,138); kein Pseudo-Element `::after` mit Hintergrund.
- 844x390: `#gold-goal` 24 × 24.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
