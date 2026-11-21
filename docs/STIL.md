# Stilleitfaden: Flat-Pop (Kingdom-Rush-artig)

Gewählt vom Menschen am 2026-11-21 (Stil B des Referenzbogens). Eigene Formen, keine Kopien von Kingdom-Rush-Grafiken. Alles aus Canvas-Formen (Polygon, Ellipse, abgerundetes Rechteck, Bézier), keine Bilddateien, keine Schriftdateien. Zeichnen bleibt in `src/render*.js` und `src/decor.js`; Farben und Maße gehören nach `src/config.js` bzw. in Konstanten von `src/draw-utils.js`. Alle Maße gelten bei 1x (`TILE` = 40 px).

## 1. Grundidee
Freundlich, kräftig, saubere Flächen. Große Köpfe und Hände, klare Silhouetten. Drei Flächentöne statt Verläufen: das ist leicht nachzubauen und billig zu zeichnen.

## 2. Farbpalette
Gemeinsam:
- Kontur: nie reines Schwarz, sondern die abgedunkelte Eigenfarbe des Teils (siehe 3). Schattenton `#2b1b3d` (kühles Violett), Lichtton `#fff3c9` (warmes Creme).
- Gold `#f4c542` / dunkel `#b07a14`. Rot (Leben, Gefahr, Dächer) `#d4503f`, Herz `#e8455a`. Blau (Schild, Frost-Basis) `#4f7fc8`. Eis `#7fd8f4` / hell `#bff0ff`. Holz `#c58f55` / dunkel `#8a5a34`. Stein `#b3adaa`.
- UI (wie `style.css`): Panel `#5a3a22`, dunkel `#3b2415`, Rand `#2a170c`, Text `#fff4dc`, Akzent `#7fd24a`.
- Gegner: Goblin `#7bcb4f`, Flitzer `#f2c14e`, Troll `#b5523b`, Oger `#7a2e8e`, Schamane `#3fbf8f`, Schildträger `#6f86a8` (nah an `ENEMY_TYPES.color`).

Welten (Boden A / Boden B / Halm / Weg / Wegrand / Akzente):
- **Wiese:** `#5fae48` `#58a542` `#46893a` / `#e2c88f` `#8f6a3b` / Blume gelb `#f6d64a`, rosa `#ff8fb1`, Baum `#3f8f3f`.
- **Wald:** `#4b9448` `#438a42` `#2f6e33` / `#c9a56a` `#6e4d2a` / Pilz `#d9453a`, Moos `#8fd14f`, Tanne `#2a6b3a`.
- **Eis:** `#e3f1fa` `#d4e8f5` `#9cc3d8` / Weg `#9db3c9`, Rand `#4f6682` / Kristall `#7fe0ff`, Schnee `#ffffff`, Tanne `#2f6f5f`.
- **Zangenangriff (Hochland, Herbst):** `#b3b45a` `#a8a950` `#868838` / `#d6ab70` `#7d5632` / Laub `#e0803a`, Fels `#8b8c94`, Stamm `#6e4d2a`.
- **Vulkan (geplant):** `#4d3c3e` `#443538` `#2e2325` / `#8b7468` `#2d1f20` / Lava `#ff7a1f`, Glut `#ffc23a`, Fels `#2a2224`.
- **Wüste (geplant):** `#eac27a` `#e0b66b` `#c4953e` / `#c98f55` `#7a4e26` / Kaktus `#5fa05a`, Knochen `#f1ead8`, Ruine `#b48a5e`.

Regel: Weg und Boden unterscheiden sich im Helligkeitswert deutlich, nicht nur im Farbton.

## 3. Kontur, Flächen, Licht
- **Flächen:** Drei Töne je Teil: Licht (oben, `lit(farbe, 0.28)`), Basis, Schatten (rechts/unten, `shd(farbe, 0.4)`, zum Violett `#2b1b3d` gemischt). Keine Verläufe.
- **Kontur:** 1,3 px bei 1x, außen an jedem Teil, `lineJoin 'round'`. Farbe = Eigenfarbe um ca. 55 % abgedunkelt. Innendetails 0,8 px.
- **Kontrastregel (Schwäche von Stil B):** Die farbige Kontur verschwindet auf hellem Boden (Eis, Wüste). Darum: Kontur nie heller als 35 % Helligkeit, auf Eis und Wüste zusätzlich Bodenschatten kräftiger (`rgba(43,27,61,0.5)`). Gegner brauchen auf jedem Boden mindestens 25 % Helligkeitsabstand zum Weg.
- **Lichtrichtung:** oben links. **Bodenschatten:** Ellipse `rgba(43,27,61,0.38)`, 1,0 bis 1,3 Radien breit, 30 bis 35 % hoch, leicht nach rechts unten versetzt.
- **Glanzpunkte:** maximal 1 pro Teil (Auge, Herz, Münze).

## 4. Proportionen
- **Türme:** Breite ca. 30 px, Höhe bis 58 px, 3/4-Frontansicht. Von unten: Sockel, Körper (unten breit), Plattform, Bewohner, Dach. Eigene Silhouette je Typ: Pfeil = spitzes rotes Dach, Kanone = breit und niedrig mit Rohr, Frost = schlank mit Kristall, Scharfschütze = hoch und schmal, Blitz = Spule. Der Oberteil dreht sich zum Ziel bzw. zeigt Rückstoß.
- **Stufen:** Stufe 1 schlicht, 2 Banner/Zusatzteil, 3 goldene Zierde und größeres Dach. Stufe über die Form zeigen, nicht nur über Punkte.
- **Gegner:** Kopf 45 bis 55 % der Höhe, Beine als Stummel, große Augen mit Rand und Glanzpunkt, Blick nach +x. Passt in den Kreis `radius` (Krone/Waffe bis 1,3x). Boss 1,6x mit Krone und Aura.
- **Erkennbarkeit:** Silhouette zuerst (Flitzer schlank, Troll breit, Schildträger mit Schild vorn, Schamane mit Kapuze und Stab), Farbe zweitens.

## 5. Icons
- Raster 32x32, Mitte im Ursprung, Motiv 24 bis 26 px, 3 px Rand. Eine Kontur wie bei den Figuren. Ein Hauptmotiv, ein Akzent, kein Text.
- Farben: Gold = Münze, Rot = Herz, Blau = Schild, Eisblau = Frost, Silber/Gold = Schaden, Rote Flagge = Welle.
- Lesbar bis 16 px, keine Details unter 2 px. Form und Farbe zusammen (Barrierefreiheit); Icon steht immer neben Zahl oder Name. Emoji nur als Rückfall, nicht gemischt.

## 6. Animation
- **Lauf:** Wippen 1,1 px je Schritt, Beine ±2,6 px, Phase aus `walkPhase`. Flitzer schneller, Troll stampfend.
- **Schuss:** Rückstoß 2 bis 3 px in 0,12 s (Ease-out), Projektil mit Schweif von 3 bis 5 Punkten.
- **Treffer:** weißer Blitz 0,08 s, max. 6 Funken. **Tod:** 0,25 s Aufploppen, Münzen-Hopser; Boss größer, Wackeln unter 3 px.
- **Bau/Upgrade:** 0,2 s von 0,8x auf 1x mit Überschwingen, Staub am Fuß. **Idle:** Wimpel weht, sparsam.
- Zeiten aus dem Spielzustand, keine Allokationen pro Frame. `prefers-reduced-motion`: Wackeln und Partikel aus.

## 7. Handy
- Spielfeld 0,55x bis 0,9x: Kontur nie unter 1 px, Details unter 2 px weglassen.
- HP-Balken mindestens 4 px hoch, Zahlen im Feld mindestens 11 px, Tippziele mindestens 44 px. Zustände (Stufe, Eingefroren, Schild) nie nur über Farbe. Keine großen Effekte, die das Feld verdecken.

## 8. Performance
- Statisches (Boden, Deko, Wege) einmal in ein Hintergrund-Canvas (`bgCanvas` in `render.js`). Türme je Typ/Stufe und Gegner-Laufphasen (8) in Sprite-Canvases vorrendern.
- Keine Gradient-Objekte pro Frame, kein `shadowBlur` im Spielloop.

## Referenz
Entwurfsbogen und Zeichenskript (Helfer `part`, `poly`, `rr`, `ell`, `mix`, `lit`, `shd`) liegen im Scratchpad der Design-Sitzung 2026-11-21 unter `stil/` (`sheet.png`, `sheet.html`), nicht im Repo.
