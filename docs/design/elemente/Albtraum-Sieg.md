# Albtraum-Sieg (Runde 2): Sieg- und Niederlagebildschirm im Albtraum mit einfliegender Medaille, Bedingungsliste, Werten, Belohnung bzw. nächstem Ziel und Tipp
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Sieg (Tweaks `stufe` Bronze/Silber/Gold, `ansicht` Sieg/Niederlage/Handy quer, Knopf „Einflug nochmal“). Backlog: B-192. Stand: agent/albtraum-design@b13c4d4.

Ersetzt die Skizze aus B-184. Aufbau im vorhandenen `#overlay` (`.end-card`), Logik (`recordResult`, `nightmareWinView`) bleibt; nur Anzeige. Normalmodus-Spielende unverändert.

## Maße
Desktop 1280x800 (Mitte x = 640; 1366x768 gleich, Abstand oben −16):
- Hintergrund: `night-a-2` → `night-b` radial (50 % / 15 %), `night-ember` α 0,35 radial von unten (260 hoch). Keine Vignette.
- Strahlen `.end-rays` (nur Sieg, nur bei neuem Abzeichen wie heute `.fresh`): Kreis 700 × 700, Mitte (640, 140), `repeating-conic-gradient(gold-btn-a α 0,18 0–9°, transparent 9–20°)`, Maske radial (schwarz bis 25 %, transparent ab 70 %), dreht 40 s.
- Medaille `#end-badge` **200 × 200** bei (540, 28); Funkeln (nur Gold): 6 Sterne 22 × 22 bei (480,70) (800,60) (455,170) (830,160) (590,20) (700,24), pulsieren 2,6 s versetzt um 0,4 s.
- Band `.end-ribbon` 620 × 60 (+ Zipfel je 40) bei (330, 220), Text 34 px; Sieg `flag-red` mit Zipfeln `flag-red-dark`, Niederlage `nightmare-btn-a` mit Zipfeln `nightmare-btn-b`, Text 32 px.
- Plakette `.end-card` 560 breit bei (360, 268), Sieg 456 hoch, Niederlage 372 hoch; Holz der Karte (`nm-wood-<karte>-a` → `-b`, Bauvorlage HUD-Albtraum-Holz) mit der Rand-Deko des Kartenstils oben; Niederlage immer `nm-wood-iron-a` → `-b` gedimmt (`#3e3450` → `#1e1830`).
- Sieg-Inhalt (Spalte, Mitte 640):
  - `#end-nm-title` 28 px bei y 304: „<Karte> – <Stufe>-Abzeichen“ (Text wie heute).
  - `#end-badges` 3 × S 40, Lücke 8, bei y 344.
  - Bedingungsliste `#end-conds` (ersetzt die eine Zeile `#end-cond`, die bleibt als `sr`-Text): links 420, Breite 460, oben 398, 3 Zeilen je 30, Lücke 4: Zeichen 26 (Haken/Kreuz) · Text 16 px `cream` · Stufe 13 px `muted`. Nicht erreicht: Kreuz, Text `muted` mit Strich 2 px.
  - `#end-values` bei y 506: Pillen `ink` 40 hoch, Radius 20, Wort 14 px `muted`, Zahl 22 px `cream`: „Welle 20 / 20“, „Leben x / 5“.
  - Belohnung `#end-reward` (nur neues Gold) 496 × 64 bei (392, 562): Radius 14, Rand `ink` 3, `night-a` → `night-a-2` (90°), Schein 0 0 18 `gold-btn-a` α 0,35; Mond 38 links; Zeile 1 19 px `gold-light` = `v.reward` (Text wie heute); Zeile 2 13 px `muted` „Im Menü Aussehen ein- und ausschalten.“
  - Nächstes Ziel `#end-next` (Stufe < 3, statt Belohnung) 496 × 64 gleiche Lage: Rand 3 gestrichelt `muted`, Grund `night-b` α 0,45; offene Medaille S 44; „Nächstes Ziel: Silber/Gold“ 19 px; Satz 13 px (Silber: „Welle 20 schaffen, ohne ein Leben zu verlieren.“, Gold: „Silber plus: <Bedingung>.“).
  - Knöpfe `.end-actions` bei y 650, Lücke 12, je 46 hoch: `#to-maps` „Kartenauswahl“ (Holz, 180), `#end-look` „Aussehen“ (nur mit Belohnung; `btn-night`, Pinsel 22, 150), `#restart` „Neues Spiel“ (Gold, ≥ 168).
- Niederlage-Inhalt: statt Medaille ein leerer Ring S 160 bei (560, 40): Kreis r 36 `night-card-b`, Rand `muted` 3 gestrichelt 7/6, Ogerkopf `#5a4a6a` α 0,55, Augen `nm-eye-moss` pulsieren. Titel „<Karte> – Welle x von 20“ 28 px bei y 306; Werte bei y 350: „Welle x / 20“, „Leben 0 / 5“, „Bester Lauf Welle y“; Tipp-Kasten 496 × 84 bei y 412 (Grund `night-b` α 0,55, Rand `ink` 3, Glühbirne 40, „Tipp:“ 17 px `gold-light` + Satz 15 px `cream`); Zeile „Deine Abzeichen hier bleiben:“ 14 px `muted` + 3 × S 36 bei y 512; Knöpfe bei y 566: `#to-maps` „Kartenauswahl“, `#restart` „Nochmal versuchen“ (Gold, ≥ 200).
- Handy quer 844x390 (und 667x375 skaliert): Medaille S 132 links (44, 56), darunter Band-Text „Albtraum besiegt!“ 22 px zweizeilig; Strahlen 340 × 340 hinter der Medaille; Plakette rechts bei x 224, 600 × 346 (max. `100vw − 244`), Titel 24 px, Slots S 36 oben rechts, Bedingungen 3 Zeilen, Werte 2 Pillen, Belohnung bzw. nächstes Ziel als eine Zeile 44 hoch, Knöpfe 46 hoch. Keine Überlappung Medaille/Plakette.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Hintergrund | `night-a-2` → `night-b` | #3a2a5c → #0e0b1a |
| Glut von unten | `night-ember` α 0,35 | #ff5a2a |
| Strahlen | `gold-btn-a` α 0,18 | #ffd45a |
| Funkeln | `bolt`, Rand `ink` 1,5 | #fff6a8 |
| Band Sieg / Zipfel | `flag-red` / `flag-red-dark` | #c4452f / #8f2e20 |
| Band Niederlage / Zipfel | `nightmare-btn-a` / `nightmare-btn-b` | #5b3f7a / #2a1d40 |
| Plakette | `nm-wood-<karte>-a` → `-b` | Bauvorlage HUD-Albtraum-Holz |
| Haken / Kreuz | `message-info` / `message-bad`, Zeichen `cream` | #4f8a34 / #b8432f |
| Werte-Pillen | `ink`, Text `cream`/`muted` | |
| Belohnung | `night-a` → `night-a-2`, Titel `gold-light` | #2a1f44 → #3a2a5c / #ffe27a |
| Knöpfe | `wood-btn` → `wood-b` / `nightmare-btn-a` → `-b` / `gold-btn-a` → `gold-btn-b`, Radius `radius-pill-l` | |
| Niederlage-Ring | `night-card-b`, Rand `muted`, Augen `nm-eye-moss` | #2a1d30 / #e8d3a8 / #d8ff5a |
- neu: `flag-red-dark` = #8f2e20, Zipfel des roten Bands
- neu: `night-a-2` = #3a2a5c (auch Kosmetik-Aussehen)
- Kontrast: `cream` auf `nm-wood-moss-b` 13,0:1; `muted` auf `nm-wood-moss-a` 5,2:1; `gold-light` auf `night-a` 11,9:1.

## Formen/SVG
Band (Box `w+80` × 76, w = 620):
~~~html
<path d="M0 20 H60 V72 H0 L18 46 Z" fill="var(--flag-red-dark)" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>
<path d="M700 20 H640 V72 H700 L682 46 Z" fill="var(--flag-red-dark)" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>
<path d="M40 8 H660 V64 H40 Z" fill="var(--flag-red)" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>
<path d="M48 16 H652" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/>
~~~
Funkeln (22er Box): `M11 1 L13 9 L21 11 L13 13 L11 21 L9 13 L1 11 L9 9 Z`.
Glühbirne (40er Box): Kreis (20,16) r 11 `gold-light`, Sockel `rect 14,26 12×8 rx 2` `stone-b`, Glanz `M16 12 Q18 9 21 9` weiß 2,5.
Einflug (ersetzt `badge-fly`):
~~~css
@keyframes badge-fly { 0% { transform: translateY(-260px) scale(2.4) rotate(-30deg); opacity: 0 } 55% { opacity: 1 }
  75% { transform: translateY(8px) scale(.94) rotate(4deg) } 100% { transform: none; opacity: 1 } }
.end-badge.fly { animation: badge-fly .9s cubic-bezier(.2,1.2,.4,1) both; }
.end-rays { animation: spin 40s linear infinite; }
~~~

## Zustände
- Sieg Bronze / Silber / Gold (aus `v.tier`): Funkeln nur Gold; Belohnung nur bei neuem Gold, sonst „Nächstes Ziel“ (bei Gold ohne neue Belohnung: keins von beiden).
- Neues Abzeichen (`v.fly`): Einflug + Strahlen; kein neues: Medaille ruht, keine Strahlen.
- Niederlage im Albtraum: neue Klasse `#overlay.nightmare-lose`; Normalmodus-Niederlage bleibt `endView('lost')`.
- Knöpfe: Hover 1,08, gedrückt +2 px, Fokus `hl` 3; `#restart` bekommt den Fokus (wie heute).
- reduced motion: kein Einflug, keine Strahlen-Drehung, kein Funkeln, Augen ruhig.
- Bedingungen dreifach: Zeichen, Farbe, Strich/Textfarbe.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `index.html` | in `.end-nm`: `<ul id="end-conds" class="end-conds">`, `<div id="end-next" class="end-next" hidden>`, Funkeln-Halter `.end-sparks`; `#end-reward` bekommt zweite Zeile; `.end-actions`: `<button id="end-look" class="wbtn wbtn-night" hidden>Aussehen</button>`; Niederlage-Ring `<div class="end-lose-ring" aria-hidden="true">`, Tipp `<p id="end-tip" class="end-tip" hidden>` |
| `style.css` | Maße oben für `#overlay.nightmare-win` / `.nightmare-lose`, Band-Zipfel, Plakette je Kartenstil (`.end-card[data-wood="moss\|ice\|rust\|iron\|ember"]`), Handy-quer-Regeln |
| `src/screens.js` | `nightmareWinView` zusätzlich `conds: [{ text, tier, ok }]` (aus `badgeConditions` und `slots`), `next: { name, text } \| null`; neu `nightmareLoseView(progress, mapId, state)` mit Titel, Werten, Tipp (Liste `NM_TIPS`), Slots |
| `src/main.js` | `renderNightmareWin` füllt `#end-conds`, `#end-next`, `#end-look` (öffnet `mountCosmeticsMenu().open()`), setzt `data-wood`; neu `renderNightmareLose`; Band-Text „Der Albtraum war stärker“ |
Bleiben müssen: `#overlay` (+ `.nightmare-win`, `.fresh`), `.end-card`, `#end-badge` (+ `.fly`), `#overlay-title`, `#end-ribbon-band`, `#end-nm-title`, `#end-badges`, `#end-cond`, `#end-values`, `#end-reward`, `#restart`, `#to-maps`.

## Tests
- `tests/e2e/albtraum.test.mjs` (alle drei B-184-Tests): bleiben grün (Medaille 200 × 200 im Fenster, Titel „Albtraum besiegt!“, `#end-nm-title` endet auf „Gold-Abzeichen“, `#end-reward` beginnt mit „Neue Belohnung freigeschaltet: Nacht-Look“, Knöpfe ≥ 46 bzw. ≥ 44, Medaille neben Plakette auf 844x390 und 667x375).
- `tests/screens.test.js` „B-184: Siegbildschirm …“ und `endView`: bleiben grün (neue Felder ändern geprüfte Werte nicht).
- Neu `tests/screens.test.js`: `conds` hat 3 Einträge mit `ok` passend zur Stufe; `next` bei Stufe 1 „Silber“, Stufe 2 „Gold“ mit Bedingung, Stufe 3 `null`; `nightmareLoseView` liefert Titel „<Karte> – Welle x von 20“ und einen Tipp aus `NM_TIPS`.
- Neu e2e (`albtraum.test.mjs`): Niederlage im Albtraum 1280x800: `#overlay.nightmare-lose`, Titel „Der Albtraum war stärker“, `#restart` und `#to-maps` ≥ 46 hoch, `.end-card` im Fenster; 844x390 ohne Überlappung.

## Messbare Abnahme
- 1280x800 Sieg Gold: `#end-badge` 200 × 200 bei x 540 ± 2; `.end-card` 560 ± 2 breit, Unterkante ≤ 724; `#end-conds li` 3 Stück; `#end-look` sichtbar.
- Silber: `#end-next` sichtbar mit „Nächstes Ziel: Gold“, `#end-reward` und `#end-look` versteckt.
- 844x390 und 667x375: Medaille und Plakette im Fenster, ohne Überlappung (Rechtecke).
- reduced motion: `getComputedStyle(#end-badge).animationName` = `none`.
- Screenshot 1280x800 neben Fläche „Sieg“ (Gold und Niederlage) im PR.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
