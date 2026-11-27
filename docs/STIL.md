# Stilleitfaden: Flat-Pop (Kingdom-Rush-artig)

Gewählt vom Menschen am 2026-11-21 (Stil B des Referenzbogens). Eigene Formen, keine Kopien von Kingdom-Rush-Grafiken. Alles aus Canvas-Formen (Polygon, Ellipse, abgerundetes Rechteck, Bézier), keine Bilddateien, keine Schriftdateien. Zeichnen bleibt in `src/render*.js` und `src/decor.js`; Farben und Maße gehören nach `src/config.js` bzw. in Konstanten von `src/draw-utils.js`. Alle Maße gelten bei 1x (`TILE` = 40 px).

## 0. Richtung "Gemalt und warm" (gewählt 2026-11-26)
Der Mensch hat aus der Stil-Exploration (Claude Design, https://claude.ai/artifact/DDKsUvgQVD4SJu2VnSqE3W, Stil 1) die Richtung **"Gemalt und warm"** gewählt. Sie baut auf Flat-Pop auf und geht an folgenden Stellen darüber hinaus; bei Widerspruch gilt dieser Abschnitt:
- **Boden gemalt:** große, weiche Hell-Dunkel-Flecken statt gleichmäßig gestreuter Kleinteile, warmes Licht von oben links, dunkle Vignette am Rand. Verläufe (`createLinearGradient`/`createRadialGradient`) und eigene Rauschfunktionen sind **im Hintergrund-Cache erlaubt** (einmal je Karte gezeichnet), nicht pro Frame.
- **Weg eingesunken:** dunkle Grasfuge am Rand, Kontur, Erde, heller Mittelstreifen leicht nach oben versetzt, Kiesel-Strichel.
- **Figuren kräftig:** Türme und Gegner tragen eine **dunkle Kontur von 2,5 bis 3 px** (Braunschwarz, z. B. `#2a1a12`), klare Silhouetten; Boden- und Deko-Teile behalten die feine farbige Kontur aus 3.
- **Rahmen und Landmarken:** Bäume dicht am Kartenrand, im Inneren wenige große Objekte statt Streudeko. Rein optisch, das Bauraster ändert sich nicht.
- **Zahlen:** fette Systemschrift mit dunklem Umriss. Eine Webschrift (Vorschlag Lilita One, SIL OFL) nur, wenn der Mensch die Datei liefert; dann selbst gehostet mit `OFL.txt`, nie von einem fremden Server.

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
- **Zwei Fronten (Spätsommer):** `#7cb24f` `#74a94a` `#5a8f36` / `#dcc08a` `#86603a` / Pilz `#c9542f`, Tanne `#336f3c`. (Der Wald wurde mit B-098 entfernt.)
- **Eis:** `#e3f1fa` `#d4e8f5` `#9cc3d8` / Weg `#9db3c9`, Rand `#4f6682` / Kristall `#7fe0ff`, Schnee `#ffffff`, Tanne `#2f6f5f`.
- **Zangenangriff (Hochland, Herbst):** `#b3b45a` `#a8a950` `#868838` / `#d6ab70` `#7d5632` / Laub `#e0803a`, Fels `#8b8c94`, Stamm `#6e4d2a`.
- **Vulkan (B-030):** `#4d3c3e` `#524244` `#2e2325` / `#8b7468` `#2d1f20` / Lava `#ff7a1f`, Glut `#ffc23a`, heller Kern `#ffe58a`, Kruste `#2a1a17`, Fels `#5a4a48`, Asche `#8a7c78`, verkohlte Bäume `#2e2422` `#3b302f`, Steinbrücke `#9a8a80`. Lava statisch im Hintergrund-Cache (Glühen als zwei halbtransparente Lagen, keine Verläufe, kein Pulsieren).
- **Wüste (geplant):** `#eac27a` `#e0b66b` `#c4953e` / `#c98f55` `#7a4e26` / Kaktus `#5fa05a`, Knochen `#f1ead8`, Ruine `#b48a5e`.

Regel: Weg und Boden unterscheiden sich im Helligkeitswert deutlich, nicht nur im Farbton.

## 3. Kontur, Flächen, Licht
- **Flächen:** Drei Töne je Teil: Licht (oben, `lit(farbe, 0.28)`), Basis, Schatten (rechts/unten, `shd(farbe, 0.4)`, zum Violett `#2b1b3d` gemischt). Keine Verläufe an Figuren; im Boden-Cache erlaubt (siehe 0).
- **Kontur:** Boden und Deko 1,3 px bei 1x (Türme und Gegner: siehe 0), außen an jedem Teil, `lineJoin 'round'`. Farbe = Eigenfarbe um ca. 55 % abgedunkelt. Innendetails 0,8 px.
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
- Keine Gradient-Objekte pro Frame, kein `shadowBlur` im Spielloop. Verläufe nur beim Aufbau des Hintergrund-Caches.

## Referenz
Entwurfsbogen und Zeichenskript (Helfer `part`, `poly`, `rr`, `ell`, `mix`, `lit`, `shd`) liegen im Scratchpad der Design-Sitzung 2026-11-21 unter `stil/` (`sheet.png`, `sheet.html`), nicht im Repo.
