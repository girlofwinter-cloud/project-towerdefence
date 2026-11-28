# HUD-Albtraum-Holz (Runde 2): Holz der HUD-Plaketten je Karte im Albtraum (und Nacht-Look) mit Rand-Deko, dazu Albtraum-Plakette und Boss-Leiste im Kartenholz
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Belohnungen (Abschnitte „Holz je Stil“, „Albtraum-Plakette“, „Boss-Leiste“); Holz im Einsatz auf den Karten-Flächen #artboard-Karte-*. Backlog: B-193. Stand: agent/albtraum-design@b13c4d4.

Nur Optik. Kein dunkler Rand, keine Vignette: die Deko sitzt am Rand der Plakette, nicht über dem Spielfeld.

## Maße
- Gilt für alle Holz-Plaketten im Spiel (`.plq` innerhalb `#app`, nicht im Startbildschirm): HUD-Leiste `.hud`, Fähigkeiten-Leiste `.abilities`, Boss-Leisten `.boss-bar`, neue Albtraum-Plakette `#nm-plaque`, Sieg-Plakette `.end-card` (Bauvorlage Albtraum-Sieg). Größen bleiben wie heute; nur Verlauf, Schein und Deko wechseln.
- Aktiv, wenn `nightLook` (Albtraum oder Nacht-Look an); Holz nach Karte: Wiese `moss`, Eiswelt `ice`, Zangenangriff `rust`, Zwei Fronten `iron`, Vulkan `ember`.
- Deko als `<svg class="plq-deco" aria-hidden="true">` als erstes Kind der Plakette, `position:absolute; left:-3px; top:-3px; width:100%+6; overflow:visible; pointer-events:none`; Höhe = Plakettenhöhe + Überstand (Moos 30, Eis 22, Eisen 12, Brand 0). Neu gebaut bei Größenänderung (ResizeObserver), nicht pro Frame.
- Text, Zahlen und Symbole bleiben frei: Deko nur im oberen Rand (0–8 px) und unter der Unterkante; Eisenbänder (`iron`) liegen genau auf den Trennern `.sep`.
- Albtraum-Plakette `#nm-plaque`: Desktop 180 × 56 rechts neben `.hud` (Lücke 12), Radius 14, Rand `ink` 3: Medaille S 46 (beste Stufe der Karte, offen wenn keine) bei (4, 1), „Albtraum“ 20 px `font-display` bei (56, 5), Stilname 12 px `muted` bei (56, 28). Handy quer: entfällt (Platz), Stufe steht im Pause-Menü.
- Boss-Leiste: Größe wie heute (Desktop 272 × 44, Handy 32 hoch); neu Prozentzahl `.bb-pct` 13 px `font-display` `cream` rechts neben dem Balken (Balken `right: 52px`, Zahl `right: 8px; bottom: 3px`); Oger-König bekommt statt Schädel die Krone 34 × 30 mit Stein in Augenfarbe des Stils (`nm-eye-*`); Nekromantin Schädel mit Augen `necro-glow-2` in Phase 2.
- 1366x768, 844x390, 390x844: gleiche Regeln, Deko skaliert mit der Plakettenbreite (Abstände in px bleiben, Anzahl Elemente passt sich an).

## Tokens
| Holz (Karte) | Oben → unten | Schein außen | Deko |
|---|---|---|---|
| `moss` (Wiese, A) | `nm-wood-moss-a` → `nm-wood-moss-b` (#5e4e66 → #30263a) | keiner | Moosrand `nm-moss-dark` #6a8a6a 5, Tropfen `nm-moss` #8aa890 2,4 auf `ink` 5, zwei Augenpunkte `nm-eye-moss` |
| `ice` (Eiswelt, C) | `nm-wood-ice-a` → `nm-wood-ice-b` (#4a5c8a → #1c2648) | 0 0 16 4 rgba(160,100,255,.25) | Eiszapfen `nm-icicle` #dff4ff, Rand `ink` 2; Schneelinie `nm-snow` #f2f8ff 5 |
| `rust` (Zangenangriff, B) | `nm-wood-rust-a` → `nm-wood-rust-b` (#7a4a22 → #3a1e0c) | keiner | Brandkante `nm-char-edge` #1a0c06, Rostflecken `nm-rust` #a0582e α 0,6 |
| `iron` (Zwei Fronten, C) | `nm-wood-iron-a` → `nm-wood-iron-b` (#4c3e6e → #1e1836) | 0 0 16 4 rgba(160,100,255,.4) | Eisenbänder `nm-iron` #8a92a8 mit Licht `nm-iron-hi` #c8d0e0, Nieten #3a3e50; Runenleiste `nm-wood-iron-b`, Runen `nm-rune` #c58aff |
| `ember` (Vulkan, B) | `nm-wood-ember-a` → `nm-wood-ember-b` (#6a3620 → #2a140a) | 0 0 16 4 rgba(255,90,42,.4) (`night-ember`) | Brandkante `nm-char-edge`, Glutpunkte `lava` #ff7a1f / `lava-core` #ffc23a pulsierend |
| Text | `cream` mit `ink`-Umriss (wie heute) | | Kontrast ≥ 6,0:1 auf allen `-a`-Tönen (ice 6,0; moss 6,9; rust 6,7; ember 8,8; iron 8,6) |
| Albtraum-Plakette | Holz der Karte, Text `cream` / `muted` | | |
| Boss-Leiste Füllung | `boss-bar` (#d0384a), Phase 2 `necro-glow-2`, Schild `boss-shield` (wie heute) | | |
- neu: `nm-wood-moss-a` = #5e4e66, `nm-wood-moss-b` = #30263a (Wiese)
- neu: `nm-wood-ice-a` = #4a5c8a, `nm-wood-ice-b` = #1c2648 (Eiswelt)
- neu: `nm-wood-rust-a` = #7a4a22, `nm-wood-rust-b` = #3a1e0c (Zangenangriff)
- neu: `nm-wood-iron-a` = #4c3e6e, `nm-wood-iron-b` = #1e1836 (Zwei Fronten)
- neu: `nm-wood-ember-a` = #6a3620, `nm-wood-ember-b` = #2a140a (Vulkan)
- neu: `nm-moss` = #8aa890, `nm-moss-dark` = #6a8a6a, `nm-icicle` = #dff4ff, `nm-snow` = #f2f8ff, `nm-char-edge` = #1a0c06, `nm-rust` = #a0582e, `nm-iron` = #8a92a8, `nm-iron-hi` = #c8d0e0, `nm-rune` = #c58aff
- Namen der Holzpaare gleich wie in den Karten-Bauvorlagen (`nm-wood-<stil>`); weicht dort ein Name ab, gilt der Name aus der Karten-Bauvorlage, Werte wie oben.

## Formen/SVG
Neues Modul `src/nm-wood.js` (nur Zeichnen, rein, testbar): `nmWoodDeco(kind, w, h) → SVG-String`.
~~~js
// moss: Moosrand + Tropfen
function moss(w, h) {
  let d = ''; for (let x = 24; x < w - 16; x += 38 + (x % 4) * 8) d += `M${x} 0 q-3 ${8 + (x % 5) * 2} 1 ${14 + (x % 4) * 3} `;
  return `<path d="M6 1 Q${w * .3} 6 ${w * .55} 1 Q${w * .8} 6 ${w - 6} 1" stroke="#6a8a6a" stroke-width="5" fill="none" stroke-linecap="round"/>`
    + `<path d="${d}" stroke="#2b1a10" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#8aa890" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    + `<circle class="nm-pulse" cx="${w - 30}" cy="${h - 8}" r="2.4" fill="#d8ff5a"/><circle class="nm-pulse" cx="${w - 22}" cy="${h - 8}" r="2.4" fill="#d8ff5a"/>`;
}
// ice: Eiszapfen alle ~26 px (Länge 8 + (i*7)%13), Schneelinie
function ice(w) {
  let s = ''; for (let i = 0, x = 14; x < w - 8; i++, x += 22 + (i % 3) * 6) { const L = 8 + ((i * 7) % 13);
    s += `<path d="M${x - 5} -2 L${x} ${L} L${x + 5} -2 Z" fill="#dff4ff" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/>`; }
  return s + `<path d="M2 -3 Q${w * .15} 3 ${w * .3} -2 Q${w * .5} 4 ${w * .67} -2 Q${w * .83} 3 ${w - 2} -3" stroke="#f2f8ff" stroke-width="5" fill="none" stroke-linecap="round"/>`;
}
// rust/ember: gezackte Brandkante (Zacke 14 px, Tiefe 4/7/10), unten rechts Brandfleck; ember zusätzlich Glut
function char(w, h, glow) {
  let p = 'M2 2'; for (let x = 2; x <= w - 2; x += 14) p += ` L${x + 7} ${4 + ((x / 14) % 3) * 3} L${Math.min(x + 14, w - 2)} 2`;
  let s = `<path d="${p} L${w - 2} -2 L2 -2 Z" fill="#1a0c06" stroke="#2b1a10" stroke-width="2" stroke-linejoin="round"/>`
    + `<path d="M${w - 70} ${h - 2} Q${w - 40} ${h - 14} ${w - 2} ${h - 6} V${h} H${w - 70} Z" fill="#1a0c06" opacity=".7"/>`;
  if (glow) s += `<g class="nm-pulse"><circle cx="${w * .12}" cy="6" r="2.2" fill="#ff7a1f"/><circle cx="${w * .47}" cy="7" r="2.2" fill="#ffc23a"/><circle cx="${w * .74}" cy="5" r="2.2" fill="#ff7a1f"/></g>`;
  else s += `<ellipse cx="${w * .3}" cy="${h * .55}" rx="10" ry="4" fill="#a0582e" opacity=".6"/><ellipse cx="${w * .62}" cy="${h * .35}" rx="7" ry="3" fill="#a0582e" opacity=".6"/>`;
  return s;
}
// iron: Eisenband 14 breit auf jedem Trenner (xs = Mitten der .sep), Runenleiste unten (Breite 70 %), 7 Runen
function iron(w, h, xs) {
  const strap = (x) => `<rect x="${x - 7}" y="-2" width="14" height="${h}" rx="2" fill="#8a92a8" stroke="#2b1a10" stroke-width="2.5"/>`
    + `<path d="M${x - 4} 0 V${h - 4}" stroke="#c8d0e0" stroke-width="2" opacity=".7"/><circle cx="${x}" cy="6" r="2.2" fill="#3a3e50"/><circle cx="${x}" cy="${h - 10}" r="2.2" fill="#3a3e50"/>`;
  let r = ''; for (let i = 0; i < 7; i++) { const x = w * .18 + i * (w * .64 / 6);
    r += `<path class="nm-pulse" d="M${x - 3} ${h + 4} L${x} ${h - 1} L${x + 3} ${h + 4} M${x} ${h - 1} V${h + 7}" stroke="#c58aff" stroke-width="1.8" fill="none" stroke-linecap="round"/>`; }
  return xs.map(strap).join('') + `<path d="M${w * .15} ${h - 1} H${w * .85} L${w * .83} ${h + 9} H${w * .17} Z" fill="#1e1836" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/>` + r;
}
~~~
CSS:
~~~css
#app.nm-wood-moss  { --wood-a: var(--nm-wood-moss-a);  --wood-b: var(--nm-wood-moss-b); }
#app.nm-wood-ice   { --wood-a: var(--nm-wood-ice-a);   --wood-b: var(--nm-wood-ice-b);   --plq-glow: 0 0 16px 4px rgba(160,100,255,.25); }
#app.nm-wood-rust  { --wood-a: var(--nm-wood-rust-a);  --wood-b: var(--nm-wood-rust-b); }
#app.nm-wood-iron  { --wood-a: var(--nm-wood-iron-a);  --wood-b: var(--nm-wood-iron-b);  --plq-glow: 0 0 16px 4px rgba(160,100,255,.4); }
#app.nm-wood-ember { --wood-a: var(--nm-wood-ember-a); --wood-b: var(--nm-wood-ember-b); --plq-glow: 0 0 16px 4px rgba(255,90,42,.4); }
#app[class*="nm-wood-"] .plq { box-shadow: inset 0 2px 0 rgba(255,220,160,.3), inset 0 -3px 0 rgba(0,0,0,.3), 0 4px 0 rgba(10,5,15,.55), var(--plq-glow, 0 0 0 transparent); }
.plq-deco { position: absolute; left: -3px; top: -3px; overflow: visible; pointer-events: none; }
.nm-pulse { animation: pulse 2.6s ease-in-out infinite; } /* pulse: opacity .45 → 1 */
@media (prefers-reduced-motion: reduce) { .nm-pulse { animation: none; } }
~~~
Krone (34 × 30) für die Boss-Leiste: `M3 26 L1 6 L10 14 L17 2 L24 14 L33 6 L31 26 Z` (`gold`, `ink` 3), Stein Kreis (17, 19) r 3,5 in `nm-eye-*`, Rand `ink` 1,8.

## Zustände
- Normalmodus ohne Nacht-Look: heutiges Holz (`wood-a` → `wood-b`), keine Deko, keine Albtraum-Plakette.
- Albtraum oder Nacht-Look: Holz und Deko der Karte; Albtraum-Plakette nur im Albtraum (nicht beim Nacht-Look).
- Albtraum-Plakette: Medaille Bronze/Silber/Gold oder offen (beste Stufe der Karte), `role="img"`, `aria-label` „Albtraum-Modus, <Stilname>, bestes Abzeichen <Stufe>“.
- Boss-Leiste: normal, Phase 2, Schild (wie heute) + Prozentzahl immer sichtbar (Information nicht nur über Balkenlänge).
- reduced motion: Glut, Augenpunkte, Runen ruhig.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/nm-wood.js` (neu) | `nmWoodDeco(kind, w, h, sepXs)`, `NM_WOOD_OF_MAP = { meadow: 'moss', ice: 'ice', fork: 'rust', twin: 'iron', volcano: 'ember' }` (oder aus `MAPS`, falls die Karten-Bauvorlagen es dort festlegen) |
| `src/main.js` | Klasse `nm-wood-<kind>` an `#app` je nach `nightLook`/Karte; Deko-SVG in `.hud`, `.abilities`, `.boss-bar`, `#nm-plaque` einsetzen und bei Größenänderung neu bauen; `#nm-plaque` füllen (Medaille `badgeSvg(46, tier)`) |
| `src/boss-bar.js` | `.bb-pct` (gerundete Prozent), Krone statt Schädel beim Oger-König mit Steinfarbe des Stils |
| `index.html` | `<div id="nm-plaque" class="plq" role="img" hidden>` neben `#hud-bar`; in beiden `.boss-bar` ein `<span class="bb-pct">` und `<svg class="bb-crown">` |
| `style.css` | Regeln oben; `.bb-track { right: 52px }`, `.bb-pct`; `#nm-plaque` Maße; Handy quer `#nm-plaque { display: none }` |
Bleiben müssen: `#hud-bar`, `.hud`, `.plq`, `#gold-box`, `#wave-box`, `#lives-box`, `#gold-goal`, `#boss-bars`, `#boss-bar`, `#boss-bar-2`, `.bb-name`, `.bb-phase`, `.bb-track`, `.bb-fill`, `.bb-shield`.

## Tests
- `tests/e2e/boss-bar.test.mjs`, `tests/e2e/layout.test.mjs`, `tests/e2e/handy.test.mjs`, `tests/e2e/albtraum.test.mjs`: bleiben grün (Größen unverändert, `#gold-goal` weiter rechts von `#lives-box`, Deko `pointer-events: none`).
- `tests/screens-bossbar.test.js`: bleibt grün; neu: Prozentzahl gerundet (0–100), Krone nur beim Oger-König.
- Neu `tests/render.test.js` (oder `tests/screens.test.js`): `nmWoodDeco(kind, 420, 56)` liefert für alle 5 Arten SVG ohne `NaN`; `iron` enthält je Trenner ein Band; Zuordnung Karte → Holz für alle 5 Karten.
- Neu e2e (`albtraum.test.mjs`): Albtraum Wiese 1280x800: `getComputedStyle(.hud).backgroundImage` enthält rgb(94, 78, 102); `.plq-deco` vorhanden; `#nm-plaque` 180 × 56 und überlappt `#gold-goal` nicht; Normalmodus: kein `.plq-deco`.

## Messbare Abnahme
- Je Karte im Albtraum (Testseite) Screenshot der HUD-Leiste 1280x800 neben Fläche „Belohnungen“/„Karte-*“: Holzfarbe oben = `nm-wood-<kind>-a` (Pixelprobe Abstand ≤ 12).
- Keine Deko überdeckt Zahlen: Rechteck jedes `.num` schneidet kein Eisenband (`iron`) – Bänder liegen auf `.sep` (Mitte ± 2 px).
- Boss-Leiste zeigt „62%“ bei 62 % Leben (Textinhalt `.bb-pct`).
- Normalmodus ohne Nacht-Look: HUD-Screenshot pixelgleich zu vorher.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
