# HUD-Bossleiste (C-Erweiterung): Lebensleiste für Bosse oben im freien Stück der Kopfleiste
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#HUD-Bossleiste. Backlog: B-180 (Optik). Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
- Desktop 1280x800: 272 × 44 CSS-px, links 566, oben 6 (zwischen HUD-Leiste, Ende x 548, und runden Knöpfen, ab x 853, gemessen per `getBoundingClientRect` auf main@6bd3237). Mittig in der Lücke berechnen: `left = (hudRight + buttonsLeft − 272) / 2`.
- 1366x768: gleiche Regel; ist die Lücke < 280 px, Breite = Lücke − 8.
- Handy quer 844x390: 240 × 32, oben mittig über dem Feld (x 302, y 6), `pointer-events: none`, Deckkraft 0,9; nur Schädel + Balken (kein Name).
- Handy hoch: unter der HUD-Leiste volle Breite − 24, 32 hoch.
- Innen: Schädel-Plakette 34 (Handy 24) links 5; Name oben links 46; „Phase I/II“ oben rechts 8; Balken 208 × 12 (Handy 196 × 10) unten 6, Kerbe bei 50 %.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Rahmen | `wood-a` → `wood-b`, `stroke-ui`, `radius-plaque`, `shadow-plaque` | #a4672f → #7a4520, 3, 14 |
| Name | `label` 15 px, `cream`, `text-outline` | #fff3d2 (15:1 auf ink) |
| Phase-Text | `label` 13 px, Phase I `muted`, Phase II `necro-glow-2` | #e8d3a8 / #ff5fd0 |
| Balken-Grund | `ink` | #2b1a10 |
| Füllung Phase 1 | neu `boss-bar` (Verlauf #f0606e → #d0384a → #8a1f30) | #d0384a |
| Füllung Phase 2 | `necro-glow-2` (Verlauf #ff8ae0 → #ff5fd0 → #a02a8a) | #ff5fd0 |
| Kerbe 50 % | `cream` α 0,85 | 2 px |
| Schild | `boss-shield` / `ice-b` Streifen 45°, 5 px | #bff6ff / #8fd8f2 |
- neu: `boss-bar` = #d0384a, Füllung der Bossleiste; `boss-shield` = #bff6ff (siehe Gegner-Nekromantin)

## Formen/SVG
~~~html
<div id="boss-bar" class="plq boss-bar" hidden aria-live="polite">
  <svg class="bb-skull" viewBox="0 0 34 34" aria-hidden="true">…Schädel wie Zeichenfläche…</svg>
  <span class="bb-name">Nekromantin</span><span class="bb-phase">Phase I</span>
  <div class="bb-track" role="progressbar" aria-label="Leben des Bosses" aria-valuemin="0" aria-valuemax="100"><div class="bb-fill"></div><div class="bb-shield"></div><i class="bb-notch"></i></div>
</div>
~~~
~~~css
.boss-bar{position:absolute;top:6px;width:272px;height:44px;box-sizing:border-box}
.bb-track{position:absolute;left:46px;bottom:6px;width:208px;height:12px;border-radius:6px;background:var(--ink);overflow:hidden}
.bb-fill{position:absolute;inset:2px auto 2px 2px;border-radius:4px;background:linear-gradient(#f0606e,#d0384a 50%,#8a1f30);transition:width .25s}
.boss-bar.p2 .bb-fill{background:linear-gradient(#ff8ae0,#ff5fd0 50%,#a02a8a)}
.bb-shield{position:absolute;inset:2px;border-radius:4px;background:repeating-linear-gradient(45deg,#bff6ff 0 5px,#8fd8f2 5px 10px);display:none}
.boss-bar.shielded .bb-shield{display:block}
.bb-notch{position:absolute;left:calc(50% - 1px);top:0;bottom:0;width:2px;background:rgba(255,243,210,.85)}
~~~

## Zustände
- Versteckt: kein Boss auf dem Feld (`hidden`).
- Erscheint: mit dem Boss-Auftritt, von oben (translateY −60 → 0, 0,3 s).
- Treffer: weißer Nachlauf-Balken 0,4 s (wie Lebensbalken der Figuren).
- Phase 1 / 2: Klasse `p2`, Text „Phase I/II“ (Text + Farbe, nicht nur Farbe).
- Schild: Klasse `shielded` + Schildzeichen rechts oben 26 × 28, Streifen pulsieren α 1 ↔ 0,55 (1 s).
- Mehrere Bosse (Welle 20): eine Leiste je Boss untereinander, Abstand `space-item` 6; höchstens 2, sonst Summe.
- Tod: Füllung 0, nach 1 s ausblenden.
- reduced motion: kein Einfliegen, kein Pulsieren.
- Frage an den Menschen: Leiste auch für den Oger-König (Name tauscht, ohne Phase)?

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `index.html` | `#boss-bar` in der Kopfleiste |
| `style.css` | Regeln oben, Handy-Regeln in den bestehenden Media-Queries |
| `src/hud.js` | Breite/Phase/Schild aus dem Spielzustand setzen (nur lesen) |
| `src/render-enemies.js` | kleinen Lebensbalken über Bossen weglassen, solange die Leiste sichtbar ist |
IDs `#hud`, `#gold`, `#wave`, `#lives` und Knopf-IDs bleiben.

## Tests
- Bestehend: e2e „Tippziele ≥ 44 px“ bleibt grün (Leiste ist kein Bedienelement, `pointer-events: none`).
- Neu: `tests/e2e/` Boss per Test-Werkzeug erzeugen → `#boss-bar` sichtbar, Breite 272 ± 8 bei 1280x800, überlappt weder HUD-Leiste noch runde Knöpfe; `tests/render.test.js` kein kleiner Balken über Bossen bei sichtbarer Leiste.

## Messbare Abnahme
- 1280x800: `#boss-bar` Rechteck schneidet `.plq` (HUD) und die runden Knöpfe nicht; Oberkante 6 ± 2.
- 844x390: Leiste liegt innerhalb `#game`, Höhe 32, verdeckt keinen Knopf.
- Kontrast Name `cream` auf Holz mit Umriss ink: wie HUD-Zahlen (15:1 zur Kontur).
- `npm test`, `npm run test:e2e` grün.
