# Karte-Albtraum-Grundlage (B-194): Albtraum-Look je Karte als eigene gemalte Palette und Rand-Deko statt Filter, ohne Vignette
Fläche: https://claude.ai/artifact/VqZn7kT4pfFTkE1mmTScE4#artboard-Karte-Wiese (Grundmuster), dazu je Karte `#artboard-Karte-<Name>`. Backlog: B-194 (danach B-195 bis B-199 je Karte). Stand: agent/albtraum-design@b13c4d4.

Diese Vorlage legt die Technik für alle fünf Karten fest. Farben, Formen und Lage stehen in den Kartenvorlagen `Karte-Wiese-Albtraum.md`, `Karte-Eiswelt-Albtraum.md`, `Karte-Zangenangriff-Albtraum.md`, `Karte-ZweiFronten-Albtraum.md` und `Karte-Vulkan-Albtraum.md`.

## Maße
- Skalierung Fläche → Spiel: Auf der Fläche ist eine Kachel 48 CSS-px groß, das Feld beginnt bei (160, 64) und misst 960 × 672. Im Spiel ist eine Kachel 40 Spiel-px (`TILE`), das Feld 800 × 560, der Rand `FRAME_MARGIN` 50, der Canvas 900 × 660 (`VIEW_WIDTH` × `VIEW_HEIGHT`). Der gemalte Hintergrund (`render-painted.js`) rechnet in Entwurfs-px (`PAINTED_STYLE.unit` 57 je Kachel, `K = TILE / 57`).
  - Fläche → Entwurfs-px: `e = (x − 160) · 57/48`, `e = (y − 64) · 57/48` (Faktor 1,1875; Feld-Nullpunkt oben links).
  - Fläche → Spiel-px (Canvas): `g = (x − 160) · 40/48 + 50` (Faktor 0,8333).
  - Die Deko-Formen der Kartenvorlagen sind in Entwurfs-px angegeben, Fußpunkt (0,0) unten Mitte, falls nicht anders genannt. Sie passen damit direkt in `place()` von `render-painted.js`, wie `PINE`/`ROUND`/`BARE`.
- Der Rand ist im Spiel schmaler als auf der Fläche: 50 Spiel-px, also 1,25 Kacheln statt 3,3 links und rechts. Deshalb gibt es zwei Deko-Reihen im Canvas-Rand und weitere Reihen in den Seitenzonen (`sideTrees`, `ext` aus `buildPaintedSvg`), die bei breitem Fenster sichtbar werden:
  - Reihe 1 (innen, Canvas-Rand): Fuß 8 bis 20 Spiel-px vor der Feldkante, kleine Deko (Büsche, Steine, Pilze, Grabsteine), höchstens 34 Spiel-px hoch, Überhang ins Feld höchstens `PAINTED_STYLE.maxOverhang` (0,3 Kacheln). Der Stamm steht immer im Rand.
  - Reihe 2 (Canvas-Rand außen): Fuß 30 bis 46 Spiel-px vor der Feldkante, große Deko (Bäume, Gruften) mit Maßstab `treeScale` [0.8, 1.15].
  - Reihe 3 und 4 (Seitenzonen, `ext`): wie Reihe 2. Reihe 4 sitzt so, dass sie an der Fensterkante angeschnitten ist (Fuß 0 bis 20 px vor der Fensterkante); so wirkt der Wald, als ginge er weiter.
  - Oben und unten (Canvas-Rand 50 px): nur niedrige Deko bis 40 Spiel-px Höhe; HUD-Plaketten dürfen sie verdecken.
- Freie Bahnen ohne Deko: Weg-Ein- und -Ausgänge (`PAINTED_STYLE.keepOut`, 46 Entwurfs-px halbe Breite), Burg und Fahne (wie heute in `buildPaintedScene`), Flüsse und Lava im Rand.
- Wege und Flüsse laufen über den Bildrand hinaus. `extendEnds()` (heute schon mit `ext`) gilt im Albtraum auch für Lavaströme im Rand. Kein Ausblenden am Ende.
- Geräte: 1366x768, 390x844 und 844x390 nutzen denselben Rasterweg. Der Albtraum ändert nur Palette und Formen, nicht das Layout.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur aller Deko | `ink` | #2b1a10 |
| Lichtinsel unter Türmen (bleibt) | neu `nm-warm-light` | #ffe2a0 |
| Gegner-Randlicht (bleibt aus B-184-Plan) | neu `nm-rim` | je Stil, siehe Kartenvorlage |
| Albtraum-Nachttönung | `night-tint` | rgba(20,12,40,0.62): **entfällt auf dem Feld** (ersetzt durch Palette) |
| Rand-Vignette | `night-vignette` | rgba(8,4,16,0.85): **entfällt** |
| Feld-/Rahmen-Vignette des gemalten Bilds | `PAINTED_STYLE.fieldVignette` / `.frameVignette` | 0,15 / 0,72: im Albtraum **0 / 0** |
| Seitenzonen-Abdunklung | `PAINTED_STYLE.sideZone.darken` | 0,35: im Albtraum **0** |
- neu: `nm-warm-light` = #ffe2a0, warme Lichtinsel (radial, α 0,42 → 0) unter jedem Turm im Albtraum: „deine Türme sind die Lichter“.
- Kartenpaletten und Holzpaare: `nm-<karte>-*` und `nm-wood-moss`/`-ice`/`-rust`/`-iron`/`-ember` stehen in den Kartenvorlagen.

## Formen/SVG
Andocken an den heutigen Renderer:

1. **Palette:** neuer Schlüssel `MAPS.<id>.nightmare.painted` in `config.js` mit denselben Schlüsseln wie `PAINTED_PALETTE`, flacher Merge über die normale Kartenpalette. In `render-painted.js`:
```js
// Albtraum-Palette: normale Kartenpalette, darüber MAPS.<id>.nightmare.painted (flach)
export const paletteFor = (mapId, mode = 'normal') => {
  const base = themed(mapId, 'painted', PAINTED_PALETTE);
  const nm = mode === 'nightmare' ? MAPS[mapId]?.nightmare?.painted : null;
  return nm ? { ...base, ...nm } : base;
};
```
   `buildPaintedScene(state)` und `buildPaintedSvg(state, opts)` reichen `look` durch (`opts.look ?? 'normal'`; Wert `'nightmare'`).
2. **Cache:** In `render.js` `paintedFor()` hängt der Schlüssel am Look: `` `${bgCacheKey(id, …)}+${look}` ``. Der Eintrag in `paintedCache` gilt je `id + look`; beim Moduswechsel wird neu gerastert. `look = nightOn(state, ui) ? 'nightmare' : 'normal'`, also gilt derselbe Look auch für den Nacht-Look (B-185) im Normalmodus.
3. **Vignette raus:** In `buildPaintedSvg` entfallen bei `look === 'nightmare'` `#vignette-field` und `#vignette-frame`; nur `p-sun` (Licht) und `p-grain` bleiben. `p-sun` bekommt die Lichtfarben der Kartenpalette (`sun`).
4. **Nacht-Ebene:** In `render.js` ersetzt `drawNightLayer` Tönung (`drawNightTint`), Vignette und rotes Glühen (`drawNightGlow`) durch `drawNightmareMotion` (Punkt 6). `drawEmbers` bleibt nur auf Vulkan und Zangenangriff, als Teil der Bewegung.
5. **Rand-Deko:** neue Formtabelle `NM_SHAPES` in `render-painted.js` (Formen aus den Kartenvorlagen, je Form `{ w, h, svg: (c) => '…' }` in Entwurfs-px). `buildPaintedScene` wählt im Albtraum Formen aus `MAPS.<id>.nightmare.frame = { big: [...], mid: [...], small: [...], edge: [...] }` statt `pine`/`round`/`bare`. `sideTrees()` nutzt `big`/`mid` für Reihe 3 und 4. Hindernisse (`obstacles`) zeichnen ihre Albtraum-Form aus `nightmare.obstacle[kind]` an der heutigen Stelle (`obstacleTree` 0,62, `obstacleRock` 1,2).
6. **Bewegung** (pro Frame auf dem Canvas, über dem Boden, unter den Figuren, nur aus Zustand und Zeit, keine Logik). Neu ist `src/render-nightmare.js` mit `drawNightmareMotion(ctx, state, t, reduced, compact)`. Vorbild ist `LAVA_STYLE.pulse` in `config.js`: Die Lage aller Teilchen wird **einmal je Karte und Look** berechnet (`WeakMap` je `state.path` wie `emberCache`, deterministisch aus `mapId` gesät). Je Frame kommen nur Zeit-Versätze dazu: keine Zufallszahlen, keine Gradienten. Weiche Flecken werden einmal je Farbe in ein kleines Sprite-Canvas gemalt (32 × 32) und per `drawImage` gesetzt.
   - Alle Zahlen stehen in `config.js` unter `NM_MOTION` (Grundwerte, siehe unten) und `MAPS.<id>.nightmare.motion` (Anzahl und Farben je Karte).
   - **Obergrenzen:** Desktop höchstens `NM_MOTION.maxDesktop` = 60 Teilchen je Karte (alle Arten zusammen). Handy (`compact`, also Layout `Handy-Quer`/`-Hoch` bzw. `matchMedia('(pointer: coarse)')`) höchstens `NM_MOTION.maxCompact` = 28. Die Liste je Karte ist nach Wichtigkeit sortiert; im kompakten Modus wird abgeschnitten. Nebelbänder zählen je 1, Augen je Paar 1.
   - `NM_MOTION` Grundwerte (Spiel-px, Sekunden): `fog: { bands: 3, sway: 50, period: 16, alpha: [0.08, 0.13] }`, `fall: { drop: 120, drift: 30, period: 7, r: [1.2, 2.6] }`, `rise: { lift: 110, period: 4.5, core: 1.6, halo: 4, haloAlpha: 0.25, shrink: 0.4 }`, `blink: { period: 5.5, closed: 0.2, rx: 2.2, ry: 1.7 }`, `glint: { speed: 40, dash: [16, 30], width: 2.4 }`, `ripple: { period: 6, dash: [26, 40], width: 2.4, alpha: 0.6 }`, `maxDesktop: 60`, `maxCompact: 28`.
   - Die Arten im Einzelnen:
   - `fog`: 3 Nebelbänder (Ellipse, Verlauf weiß → transparent, α 0,08–0,13), Pendel ±50 Spiel-px in 16 s, nur über dem Feld, nie am Rand.
   - `fall` (Schnee, Asche): Punkt r 1,2–2,6, fällt 120 Spiel-px in 7 s mit 30 px Seitendrift, Ein- und Ausblenden je 15 %.
   - `rise` (Glühwürmchen, Funken): Kern r 1,6 und Hof r 4 (α 0,25), steigt 110 px in 4,5 s und wird dabei kleiner (1 → 0,4).
   - `blink` (Augen in Rand-Deko): Augenpositionen kommen aus der Szene (`scene.eyes`, je Augenpaar x, y, Farbe); alle 5,5 s für 0,2 s geschlossen (Höhe × 0,08). Gezeichnet werden zwei Ellipsen 2,2 × 1,7 Spiel-px.
   - `glint` (Wasser und Lava): gestrichelte helle Linie (Dash [16, 30]) läuft entlang der Fluss- bzw. Lava-Polylinie, `lineDashOffset = −t · speed`. Je Fluss 1 bis 2 Linien, je See 1 Ellipse.
   - `ripple` (See): eine gestrichelte Ellipse im See, Dash-Versatz läuft in `period` einmal rund.
   - **reduced motion** (`ui.reducedMotion`): alle Teilchen stehen still an ihrer Startposition, Augen offen, Nebel ohne Pendel. Es wird nichts zusätzlich gezeichnet.
7. **Reichweite und Turmwahl:** Die Reichweiten- und Namensanzeige beim Turm-Klick auf den Flächen wird **nicht** übernommen. Im Spiel bleibt die heutige Reichweitenanzeige (`RANGE_STYLE`, Ring-Menü), auch im Albtraum.
8. **Normalmodus mit Nacht-Look (Kosmetik B-185):** `ui.night` schaltet denselben Look (Palette, Deko, Bewegung) wie der Albtraum. Spielwerte bleiben die des Normalmodus.

## Zustände
- Normal (Modus `normal`, ohne Nacht-Look): unverändert wie heute (Bild und Tests).
- Albtraum (`state.mode === 'nightmare'`) oder Nacht-Look (`ui.night`): Albtraum-Palette, Albtraum-Deko, Bewegung, keine Vignette, keine Tönung.
- Lädt (Raster noch nicht fertig): Rückfall wie heute (altes Zeichnen) ohne Tönung. Kein Aufblitzen von Schwarz.
- reduced motion: Bewegung steht (siehe oben).
- Handy quer und hoch: gleiche Raster, Seitenzonen wie heute über `ext`.
- Barrierefreiheit: Türme behalten ihre Originalfarben, die Stufe steht als Zahl im Abzeichen. Gegner erkennt man an der Silhouette, nicht nur an der Augenfarbe. Weg-Mitte gegen Boden-Mitte mindestens 1,5:1 (je Karte gemessen in der Kartenvorlage).

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/config.js` | `MAPS.<id>.nightmare = { painted, frame, obstacle, motion }` je Karte (Werte aus den Kartenvorlagen); `NIGHT_STYLE` behält nur die Glut-Werte. |
| `src/render-painted.js` | `paletteFor(mapId, look)`, `look` durch Szene und SVG; `NM_SHAPES`; im Albtraum ohne Vignette; Lava/Wasser im Rand aus `nightmare.extras` (Vulkan, Wiese). |
| `src/render.js` | Cache-Schlüssel mit Look; `drawNightLayer` → `drawNightmareMotion`; `nightOn` bleibt. |
| `src/render-light.js` | `drawNightTint`/`drawNightGlow` werden im Albtraum nicht mehr gerufen (Funktionen dürfen bleiben). |
| `src/render-nightmare.js` (neu) | Bewegungsschicht wie oben (Sprites, Lage einmal je Karte, `compact`-Obergrenze). |
| `src/config.js` | `NM_MOTION` (Grundwerte und Obergrenzen). |
| `src/main.js` | Seitenzonen-Abdunklung (`sideZone.darken`) im Albtraum 0. |
- IDs/Klassen: `#game`, `#backdrop`, `#vignette-field`/`#vignette-frame` (normal), `.castle`, `.bridge` bleiben.

## Tests
- `tests/render.test.js` „B-184 Render: Nacht-Tönung (multiply, night-tint) nur im Albtraum oder mit ui.night …“ erwartet genau eine Tönung im Albtraum. **Dieser Test muss geändert werden**, weil die Tönung entfällt. Das entscheidet der Mensch. Vorschlag: Statt der Tönung prüft er `look === 'nightmare'` im Cache-Schlüssel und das Fehlen von `#vignette-field` im Albtraum-SVG.
- `tests/painted.test.js` „Vignette im Feld höchstens 0,15 …“ bleibt grün (gilt für normal); dazu kommt ein neuer Fall für den Albtraum: keine Vignette-Rects.
- „B-184 Glut am Weg …“ bleibt grün, solange `emberPoints` bleibt.
- Neu `tests/painted.test.js`: Für jede Karte ist das Albtraum-SVG deterministisch; keine Rand-Deko-Box schneidet eine bebaubare Feldkachel um mehr als `maxOverhang`; Wege und Lava reichen mit `ext` bis zur Bildkante.
- Neu `tests/render.test.js`: `drawNightmareMotion` mit `reduced = true` zeichnet in zwei Frames (t = 0 und t = 3) dieselben Aufrufe. Teilchen je Karte ≤ `NM_MOTION.maxDesktop` (60), mit `compact` ≤ `maxCompact` (28). Je Frame kein `createRadialGradient`/`createLinearGradient` (Aufrufe zählen wie im Glut-Test).

## Messbare Abnahme
- Albtraum-SVG jeder Karte enthält weder `vignette-field` noch `vignette-frame` (Test). Pixelprobe bei 1280x800: die Mittelwerte der 20-px-Streifen am linken und rechten Canvas-Rand sind höchstens 10 % dunkler (Luminanz) als die Bodenmitte.
- Normalmodus unverändert: `tests/painted.test.js` grün; Screenshot `#game` Wiese normal pixelgleich zu main.
- Jede Bauplatz-Kachel ist frei: Rand-Deko ragt höchstens 0,3 Kacheln (12 Spiel-px) ins Feld (Test).
- reduced motion: zwei Screenshots im Abstand von 2 s sind im Feld pixelgleich (ohne Gegner, vor Wellenstart).
- Frame-Zeit im Albtraum höchstens 1 ms mehr als normal (300 Frames, Desktop); auf dem Handy-Profil (Playwright `isMobile`, CPU-Drossel 4×) höchstens 2 ms mehr.
- Beim Turm-Klick erscheint die heutige Reichweitenanzeige (`RANGE_STYLE`), keine Namensplakette (e2e: `#tower-info` wie bisher).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
