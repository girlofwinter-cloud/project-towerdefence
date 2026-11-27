# Seite-Styleguide (B-164): Testseite mit allen Bauteilen des Spiels auf einen Blick
Fläche: noch keine (wird mit der Freigabe als `Seite-Styleguide.dc.html` in der Bauteil-Bibliothek https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs angelegt). Backlog: B-164. Stand: main@0110569. Nach B-160 bauen.

Zweck: Eine Seite `styleguide.html`, die jedes gezeichnete und jedes HTML-Bauteil in allen Zuständen nebeneinander zeigt, mit dem echten Zeichencode des Spiels. Der designer macht davon einen Screenshot statt eine Partie nachzuspielen; der developer sieht nach einer Änderung sofort alle betroffenen Stellen; neue Türme, Gegner und Karten erscheinen ohne Zusatzarbeit, weil die Seite ihre Liste aus `src/config.js` bildet.

## Maße
- Eigene Seite `styleguide.html` (wie `test.html` im Wurzelordner), Hintergrund `frame-bg`, Breite fließend, Inhalt höchstens 1280 px, Raster mit `gap` 24 px. Kein Spiel-Loop, kein Spielzustand außer Attrappen.
- Abschnitte von oben nach unten, je mit Überschrift (Lilita 28, `cream`, Umriss `ink`):
  1. **Türme:** 5 Typen × 3 Stufen, je eine Zelle 120 × 150 Spiel-px (3 × 3,75 Kacheln) auf Wiesenboden `map-meadow-2`, Figur mit Stufenmarke und Goldbändern; darunter dieselben 15 in 0,5-facher Größe (Handy-Maßstab) und eine Zeile "Schuss" (Rückstoß bei `recoilOffset(1)`, Mündungsfeuer).
  2. **Gegner:** alle `ENEMY_TYPES` (heute 10) je in vier Zuständen: normal, eingefroren (`slowUntil > time`), beschädigt (Lebensbalken bei 60 % und 20 %), Sonderzustand (Schamane mit Heil-Aura, Schildträger, Magier-Schild `ward`, Boss-Krone). Zelle 80 × 100 Spiel-px.
  3. **Effekte:** je Effekt eine Zeile mit 5 eingefrorenen Zeitpunkten (t = 0; 0,25; 0,5; 0,75; 1 der Lebensdauer): Pfeil, Kugel mit Spur, Explosion, Frost-Strahl, Scharfschuss, Blitz, Meteor (Anflug, Einschlag, Krater), Münzflug, Beschwörung, Boss-Auftritt.
  4. **Knöpfe, HUD, Menüs, Bildschirme:** alle Bauteile des Design-Systems (heute 10: Holzleiste, runder Knopf, Fähigkeitsknopf, Wellenknopf, Preisschild, Stufenmarke, Plakette, Ringmenü, Kartenkarte, Spielende-Plakette) in allen Zuständen aus `docs/design/system/komponenten/<Name>/README.md`, mit den echten Klassen aus `style.css`. Ersetzt danach die nachgebauten Vorschauen (`preview.html`), die dann aus Screenshots dieser Seite entstehen.
  5. **Karten:** alle `MAPS` (heute 5) als gemalter Hintergrund mit Weg, Wasser/Lava, Rahmenwald, Burg und Fahne, je 450 × 330 CSS-px (halbe Canvas-Größe 900 × 660), darunter Name und die drei Bodenfarben als Farbfelder.
  6. **Tokens:** alle Farb-Tokens als Felder (aus `src/theme.js`, B-160).
- Jede Zelle hat eine Beschriftung (Trebuchet 12, `muted`): Typ, Stufe/Zustand, Zeitpunkt.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Seitengrund | `frame-bg` | #1d3a1f |
| Zellgrund Türme/Gegner | `map-meadow-2` | #6aa83f |
| Überschrift | `cream` + `text-outline` in `ink` | #fff3d2, 2 px #2b1a10 |
| Beschriftung | `muted` | #e8d3a8 |
| Zellrand | `stroke-select` in `ink`, Ecken `radius-plaque` | 2 px #2b1a10, 14 px |
| Abstand Zellen | `space-section` | 24px |
- neu: `space-section` = 24px, Abstand zwischen Zellen und Abschnitten der Styleguide-Seite

## Formen/SVG
Keine neuen Formen. Die Seite ruft nur bestehenden Zeichencode auf:
- Türme: `drawTowerFigure(ctx, t, shot)` und `drawTowerBadge(ctx, t)` aus `src/render-towers.js` mit Attrappe `t = { type, level, x, y, angle: -Math.PI/2, cooldown }`.
- Gegner: `drawEnemy(ctx, e, time, path)` aus `src/render-enemies.js`, `drawHealAura`, `drawWardBubble`; Attrappe `e = { id, type, x, y, hp, maxHp, radius, slowUntil, ward, dist }`, `path` = gerade Strecke von links nach rechts.
- Effekte: `drawProjectileFx`, `drawEffectUnder`, `drawEffectOver`, `drawParticles` aus `src/render-fx.js` mit einem eigenen `createFx()` je Zeile und fester Zeit (`syncTime(fx, t)`), Partikel mit fester Saat.
- Karten: `buildPaintedSvg(state)` und `rasterizePainted(svg, scale)` aus `src/render-painted.js` mit `state = { mapId }` wie im Spiel.
- HTML-Bauteile: dasselbe Markup wie `index.html` (IDs durch Klassen ersetzt, damit sie mehrfach vorkommen dürfen), Zustände per Klasse/Attribut (`.aiming`, `data-state="used"`, `disabled`, `data-paused="true"`, `.poor`).
- Liste der Zellen aus einer reinen Funktion `styleguideCatalog()` (kein DOM): liest `TOWER_TYPES`, `MAX_LEVEL`, `ENEMY_TYPES`, `MAPS`, `ABILITIES` und gibt `[{ section, kind, variant, label }]` zurück. Neue Einträge in `config.js` erscheinen dadurch automatisch.
- Zeit eingefroren: `?t=<0..1>` setzt den Zeitpunkt für alle animierten Teile (Wippen, Wasser, Puls); ohne Parameter steht alles bei t = 0,5. CSS-Animationen sind auf der Seite aus (`animation-play-state: paused`, Spitze per Klasse wie in der Design-System-Vorschau).

## Zustände
- Seite: geladen (alle Zellen gezeichnet) · Ausschnitt per Anker (`#tuerme`, `#gegner`, `#effekte`, `#knoepfe`, `#karten`, `#tokens`), damit Screenshots einzelner Abschnitte möglich sind · Handy 390 px breit: Zellen umbrechen, nichts scrollt seitlich.
- Zelle: normal · Figur fehlt (unbekannter Typ): rote Zelle mit Text "fehlt: <typ>", statt still leer zu bleiben.
- reduced motion: ohne Einfluss (alles steht ohnehin).
- Erreichbar nur über die Adresse `styleguide.html`; kein Link aus dem Spiel. Fortschritt (`localStorage`) wird nicht gelesen oder geschrieben.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `styleguide.html` | neu: Gerüst mit sechs Abschnitten, lädt `style.css` und `src/styleguide.js` als Modul |
| `src/styleguide.js` | neu: Verdrahtung (DOM, Canvas je Zelle), ruft nur Zeichenfunktionen auf; keine Spiel-Logik |
| `src/styleguide-catalog.js` | neu: `styleguideCatalog()` als reine Funktion (in Node testbar) |
| `style.css` | Abschnitt `/* Styleguide */` mit `.sg-*`-Klassen (Raster, Zelle, Beschriftung); bestehende Regeln unverändert |
| `src/config.js` | `STYLEGUIDE = { cell: { tower: [120,150], enemy: [80,100] }, times: [0,0.25,0.5,0.75,1], mapScale: 0.5 }` |
| `scripts/serve.mjs` | nichts (liefert statische Dateien schon aus) |
Keine Änderung an `src/game.js`, `src/path.js`, `src/main.js`, `index.html`.

## Tests
- Neu `tests/render.test.js`: `styleguideCatalog()` enthält jeden Schlüssel aus `TOWER_TYPES` × Stufen 1..`MAX_LEVEL`, jeden aus `ENEMY_TYPES` mit den Varianten normal/eingefroren/beschädigt, jede Karte aus `MAPS`; keine doppelten `label`.
- Neu `tests/e2e/styleguide.test.mjs`: Seite lädt ohne Konsolenfehler; Anzahl der Canvas-Zellen = Länge des Katalogs; keine Zelle mit Klasse `.sg-missing`; `document.body.scrollWidth ≤ innerWidth` bei 390x844; jede Karten-Zelle hat nicht nur eine Farbe (mindestens 50 verschiedene Pixelwerte im `getImageData`).
- Bestehende Tests: keine betroffen.

## Messbare Abnahme
- `http://localhost:8080/styleguide.html` zeigt bei 1280x800 die Abschnitte 1–6; 15 Turm-Zellen, ≥ 40 Gegner-Zellen, ≥ 50 Effekt-Zellen, 10 Bauteil-Gruppen, alle Karten aus `MAPS`.
- Zwei Aufrufe mit `?t=0.5` ergeben pixelgleiche Screenshots von `#tuerme` und `#gegner` (Playwright `toBuffer`-Vergleich), d. h. die Seite ist deterministisch.
- Ein neuer Eintrag in `ENEMY_TYPES` erscheint ohne Änderung an `src/styleguide*.js` (im Test mit einer Kopie des Katalogs geprüft).
- Seite lädt in unter 2 s auf dem Testrechner (Playwright `load` bis letzte Zelle gezeichnet).
- `npm test` und `npm run test:e2e` grün.
