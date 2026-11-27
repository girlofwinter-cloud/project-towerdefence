# Tokens: Gemalt und warm

Erzeugt aus `tokens.json` mit `node scripts/design-tokens.mjs`. Nicht von Hand ändern.

## Farben (100)

| Token | Wert | Verwendung |
|---|---|---|
| `ink` | `#2b1a10` | Kontur überall: Ränder von Knöpfen, Plaketten, Figuren, Textumriss. Grund der Preisschilder und Tasten-Badges. style.css --ink, FIGURE_STYLE.outline. |
| `cream` | `#fff3d2` | Helle Schrift und Zahlen auf Holz und auf ink (15:1 auf ink). Icons auf Holzknöpfen. style.css --cream. |
| `muted` | `#e8d3a8` | Nebentext auf Holz (Turm-Panel p). style.css --muted. |
| `hl` | `#ffe266` | Auswahl und Fokus: Fokusrahmen 3 px, Ring um gewählten Turm, zielende Fähigkeit, Pause aktiv. style.css --hl. |
| `bad` | `#ff6b5a` | Warnung im Text: wenig Leben (pulsiert). Nur auf ink oder Holz dunkel. style.css --bad. |
| `frame-bg` | `#1d3a1f` | Seitenhintergrund hinter der Bühne (body). Nur Fläche, kein Text darauf außer cream. |
| `overlay-bg` | `rgba(16,28,14,0.7)` | Abdunklung hinter Spielende-Overlay (#overlay). |
| `wood-a` | `#a4672f` | Holzleiste oben (Verlauf .plq, Pause-Banner, Overlay-Plakette). style.css --wood-a. |
| `wood-b` | `#7a4520` | Holzleiste unten, Ende aller Holzverläufe. style.css --wood-b. |
| `wood-btn` | `#b97a3e` | Textknopf aus Holz oben (.wbtn), Verlauf nach wood-b. |
| `btn-a` | `#d79a52` | Runder Holzknopf, Licht (radial bei 35 % 30 %). style.css --btn-a. |
| `btn-b` | `#8a5224` | Runder Holzknopf, Schatten. style.css --btn-b. |
| `wood-fig-a` | `#c88a4c` | Holz an Türmen und Brücke hell (Verlauf s1-wood, PAINTED_PALETTE.bridge[0]). |
| `wood-fig-b` | `#8a5326` | Holz an Türmen und Brücke dunkel, Rundschild des Schildträgers. |
| `wood-fig-c` | `#a9703d` | Zinnen und Brüstung an Pfeil- und Scharfschützenturm, Fahnenmast innen. |
| `gold` | `#f2c14e` | Gold: Münze, Stufe 2, Badges auf Knöpfen (.rb-badge, .ab-badge), Lebensbalken mittel. style.css --gold. |
| `gold-dark` | `#b9851d` | Innenring der Münze im HUD. |
| `gold-light` | `#ffe27a` | Preis auf ink (12:1), +Gold-Text beim Münzflug. SHOP_CARD.cost. |
| `gold-btn-a` | `#ffd45a` | Goldknopf oben (Wellenknopf, .wbtn-gold). |
| `gold-btn-b` | `#e08a1c` | Goldknopf unten. |
| `price-poor` | `#ff9e8f` | Preis, wenn das Gold nicht reicht (auf ink 8:1), immer zusammen mit Durchstreichen. SHOP_CARD.costPoor. |
| `card-bg` | `#4e321d` | Turmknopf Fläche (SHOP_CARD.bg, bis zum Ringmenü). |
| `card-bg-active` | `#62402a` | Turmknopf gewählt, dazu Ring hl. |
| `card-icon-bg` | `#5fae48` | Fläche hinter dem Mini-Turm im Turmknopf. |
| `card-key-bg` | `#2e1d10` | Tasten-Badge am Turmknopf: Fläche. |
| `card-key-text` | `#fff4dc` | Tasten-Badge am Turmknopf: Schrift. |
| `disabled-a` | `#cdb48a` | Wellenknopf gesperrt oben. |
| `disabled-b` | `#9c8462` | Wellenknopf gesperrt unten. |
| `disabled-ink` | `#4a3a2a` | Schrift auf gesperrtem Wellenknopf. |
| `flag-red` | `#c4452f` | Wellenfahne, Burgdach, Kanonier-Mütze. |
| `heart` | `#e0393e` | Herz im HUD (Leben). |
| `message-bad` | `#b8432f` | Meldung Warnung (#message), Schrift cream. |
| `message-info` | `#4f8a34` | Meldung Info (#message.info), Schrift cream. |
| `hp-good` | `#74d048` | Lebensbalken voll (FIGURE_STYLE.hp.good). |
| `hp-mid` | `{gold} = #f2c14e` | Lebensbalken mittel. |
| `hp-low` | `#e5481f` | Lebensbalken niedrig. |
| `level-1` | `#d7dde0` | Stufenmarke Stufe 1 (FIGURE_STYLE.badge.colors[0]). |
| `level-2` | `{gold} = #f2c14e` | Stufenmarke Stufe 2, Goldband am Turm ab Stufe 2. |
| `level-3` | `#ff8a3d` | Stufenmarke Stufe 3. |
| `ab-meteor-a` | `#ffb04a` | Meteor-Knopf Licht. |
| `ab-meteor-b` | `#c4381f` | Meteor-Knopf Schatten. |
| `ab-freeze-a` | `#8fd8f2` | Kälte-Knopf Licht. |
| `ab-freeze-b` | `#2e6fb0` | Kälte-Knopf Schatten. |
| `ab-repair-a` | `#a8e070` | Reparatur-Knopf Licht. |
| `ab-repair-b` | `#3a8a3c` | Reparatur-Knopf Schatten. |
| `cooldown` | `rgba(20,30,50,0.72)` | Abklingkuchen über Fähigkeiten (conic-gradient). |
| `stone-a` | `#e3d2b0` | Turmsockel und Burg hell (s1-stone, PAINTED_PALETTE.stone[0]). |
| `stone-b` | `#b9a283` | Turmsockel Mitte. |
| `stone-c` | `#8a7560` | Turmsockel dunkel. |
| `stone-line` | `#6b5a48` | Fugen im Stein. |
| `skin` | `#f2c9a0` | Gesichter der Turmbesatzung. |
| `path-groove` | `#3a6a2c` | Weg: Grasschatten außen (86 Entwurfs-px). PAINTED_PALETTE.path[0]. |
| `path-outline` | `{ink} = #2b1a10` | Weg: Kontur (72). |
| `path-edge` | `#8f5f34` | Weg: Braunrand (64), dunkle Punkte. |
| `path-earth` | `#d5a566` | Weg: Erdfläche (54). |
| `path-mid` | `#e8c185` | Weg: helle Mitte (30). Auch Pfeilschaft. |
| `path-dot` | `#fff2c8` | Weg: helle Punkte. |
| `water-a` | `#6fcbe0` | Wasser oben (Verlauf p-wat). |
| `water-b` | `#2e86a8` | Wasser unten. |
| `water-sand` | `#e8d18a` | Sandufer an Fluss und See. |
| `water-glint` | `#e8fbff` | Strichel und Glanz auf dem Wasser. |
| `ice-a` | `#e8fbff` | Eis hell (s1-ice, Frostturm). |
| `ice-b` | `#8fd8f2` | Eis Mitte. |
| `ice-c` | `#3b8fcb` | Eis dunkel. |
| `lava` | `#ff7a1f` | Lava Fläche und Glühen (LAVA_STYLE.lava). |
| `lava-core` | `#ffc23a` | Lava Kern (Glut). |
| `lava-hot` | `#ffe58a` | Lava heißester Kern. |
| `lava-crust` | `#2a1a17` | Lava Kruste (Kontur). |
| `lava-plate` | `#4a2a22` | Krustenplatten auf der Lava. |
| `map-meadow-1` | `#9bd25a` | Karte Wiese: Bodenverlauf Stufe 1 von 3 (PAINTED_PALETTE.ground bzw. MAPS.meadow.theme.painted.ground). |
| `map-meadow-2` | `#6aa83f` | Karte Wiese: Bodenverlauf Stufe 2 von 3 (PAINTED_PALETTE.ground bzw. MAPS.meadow.theme.painted.ground). |
| `map-meadow-3` | `#3f7a35` | Karte Wiese: Bodenverlauf Stufe 3 von 3 (PAINTED_PALETTE.ground bzw. MAPS.meadow.theme.painted.ground). |
| `map-ice-1` | `#eef6fb` | Karte Eiswelt: Bodenverlauf Stufe 1 von 3 (PAINTED_PALETTE.ground bzw. MAPS.ice.theme.painted.ground). |
| `map-ice-2` | `#cfe1ee` | Karte Eiswelt: Bodenverlauf Stufe 2 von 3 (PAINTED_PALETTE.ground bzw. MAPS.ice.theme.painted.ground). |
| `map-ice-3` | `#a9c6dc` | Karte Eiswelt: Bodenverlauf Stufe 3 von 3 (PAINTED_PALETTE.ground bzw. MAPS.ice.theme.painted.ground). |
| `map-fork-1` | `#d9a94e` | Karte Zangenangriff (Herbst): Bodenverlauf Stufe 1 von 3 (PAINTED_PALETTE.ground bzw. MAPS.fork.theme.painted.ground). |
| `map-fork-2` | `#c08a3c` | Karte Zangenangriff (Herbst): Bodenverlauf Stufe 2 von 3 (PAINTED_PALETTE.ground bzw. MAPS.fork.theme.painted.ground). |
| `map-fork-3` | `#8a5a2b` | Karte Zangenangriff (Herbst): Bodenverlauf Stufe 3 von 3 (PAINTED_PALETTE.ground bzw. MAPS.fork.theme.painted.ground). |
| `map-twin-1` | `#a6cf5a` | Karte Zwei Fronten: Bodenverlauf Stufe 1 von 3 (PAINTED_PALETTE.ground bzw. MAPS.twin.theme.painted.ground). |
| `map-twin-2` | `#78a043` | Karte Zwei Fronten: Bodenverlauf Stufe 2 von 3 (PAINTED_PALETTE.ground bzw. MAPS.twin.theme.painted.ground). |
| `map-twin-3` | `#4a6e2c` | Karte Zwei Fronten: Bodenverlauf Stufe 3 von 3 (PAINTED_PALETTE.ground bzw. MAPS.twin.theme.painted.ground). |
| `map-volcano-1` | `#6b5a55` | Karte Vulkan: Bodenverlauf Stufe 1 von 3 (PAINTED_PALETTE.ground bzw. MAPS.volcano.theme.painted.ground). |
| `map-volcano-2` | `#4a3a38` | Karte Vulkan: Bodenverlauf Stufe 2 von 3 (PAINTED_PALETTE.ground bzw. MAPS.volcano.theme.painted.ground). |
| `map-volcano-3` | `#2d1f20` | Karte Vulkan: Bodenverlauf Stufe 3 von 3 (PAINTED_PALETTE.ground bzw. MAPS.volcano.theme.painted.ground). |
| `map-ice-path-groove` | `#8fb0c8` | Karte Eiswelt: Weg groove (theme.painted.path). |
| `map-ice-path-edge` | `#4f6682` | Karte Eiswelt: Weg edge (theme.painted.path). |
| `map-ice-path-earth` | `#9db3c9` | Karte Eiswelt: Weg earth (theme.painted.path). |
| `map-ice-path-mid` | `#b4c7d9` | Karte Eiswelt: Weg mid (theme.painted.path). |
| `map-fork-path-groove` | `#666529` | Karte Zangenangriff: Weg groove (theme.painted.path). |
| `map-fork-path-edge` | `#7d5632` | Karte Zangenangriff: Weg edge (theme.painted.path). |
| `map-fork-path-earth` | `#d6ab70` | Karte Zangenangriff: Weg earth (theme.painted.path). |
| `map-fork-path-mid` | `#e8c88e` | Karte Zangenangriff: Weg mid (theme.painted.path). |
| `map-twin-path-groove` | `#4a6e2c` | Karte Zwei Fronten: Weg groove (theme.painted.path). |
| `map-twin-path-edge` | `#86603a` | Karte Zwei Fronten: Weg edge (theme.painted.path). |
| `map-twin-path-earth` | `#dcc08a` | Karte Zwei Fronten: Weg earth (theme.painted.path). |
| `map-twin-path-mid` | `#e8d2a0` | Karte Zwei Fronten: Weg mid (theme.painted.path). |
| `map-volcano-path-groove` | `#211718` | Karte Vulkan: Weg groove (theme.painted.path). |
| `map-volcano-path-edge` | `#4a3836` | Karte Vulkan: Weg edge (theme.painted.path). |
| `map-volcano-path-earth` | `#8b7468` | Karte Vulkan: Weg earth (theme.painted.path). |
| `map-volcano-path-mid` | `#9c857a` | Karte Vulkan: Weg mid (theme.painted.path). |

## Schrift

- `font-display`: 'Lilita One', 'Trebuchet MS', sans-serif
- `font-body`: 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif
- Datei: Lilita One 400 (`assets/fonts/LilitaOne-Regular.ttf` im Spiel)

| Stil | Familie | Größe | Zeilenhöhe | Beispiel | Verwendung |
|---|---|---|---|---|---|
| `overlay-title` | display | 56px | 1 | Sieg! | Spielende-Titel, Farbe gold, text-shadow 0 4px 0 ink. |
| `banner` | display | 34px | 1.1 | Pause | Pause-Banner auf Holz. |
| `num` | display | 28px | 30px | 1.240 | HUD-Zahlen (.num), cream mit 2-px-Umriss ink. |
| `round-glyph` | display | 26px | 1 | ? | Zeichen im runden Knopf (.rb-q). |
| `cooldown` | display | 24px | 1 | 12 | Sekunden im Fähigkeitsknopf (.ab-num). |
| `wave-button` | display | 22px | 1 | Welle 8 starten | Wellenknopf, ink auf Gold. |
| `num-small` | display | 20px | 22px | / 20 | Kleine Zahl in der HUD-Leiste, +Gold beim Münzflug, Turmname im Panel. |
| `message` | display | 18px | 1.3 | Nicht genug Gold | Meldung (#message). |
| `button-text` | display | 17px | 1 | Verbessern | Holz-Textknopf (.wbtn). |
| `label` | display | 15px | 20px | Meteor | Beschriftung unter Fähigkeiten (.cap), Preisschild, Wellenvorschau, Kartenwahl. |
| `badge` | display | 14px | 17px | ×2 | Abzeichen am Knopf (.rb-badge), Stufenmarke (Canvas), Tasten-Badge. |
| `body` | body | 15px | 1.35 | Leertaste startet die nächste Welle. | Hilfe-Plakette, Fließtext. |
| `body-small` | body | 14px | 1.3 | Schaden 12 · Reichweite 3,0 | Werte im Turm-Panel, Farbe muted. |
| `kbd` | body | 12px | 1.4 | P | Tastenkürzel (kbd) auf rgba(0,0,0,.35). |

## Abstände

CSS-px bei 1280x800. Feldmaße in Spiel-px stehen in size.

| Token | Wert | Verwendung |
|---|---|---|
| `space-hairline` | `2px` | Innenabstand von Badges, Versatz Fokusrahmen 3 px. |
| `space-item` | `6px` | Icon zu Zahl in der HUD-Leiste, Knöpfe im Turm-Panel. |
| `space-buttons` | `8px` | Abstand der runden Knöpfe oben rechts, Innenrand links der Holzleiste. |
| `space-plaque-y` | `10px` | Innenabstand oben in Plaketten (Hilfe, Fähigkeiten-Leiste). |
| `space-hud` | `12px` | Abstand der Felder in der HUD-Leiste und im Wellenband. |
| `space-plaque-x` | `18px` | Innenrand rechts der Holzleiste; Abstand der Fähigkeitsknöpfe. |
| `space-wave-x` | `22px` | Innenrand links/rechts im Wellenknopf; Abstand Turmknöpfe. |
| `space-section` | `24px` | Abstand zwischen Zellen und Abschnitten der Styleguide-Seite (B-164). |
| `band-min` | `58px` | Mindesthöhe der Bänder über und unter dem Feld (HUD, Wellenknopf). |
| `side-min` | `100px` | Mindestbreite der Seitenzonen (Fähigkeiten links, Türme rechts). |

## Rundungen

| Token | Wert | Verwendung |
|---|---|---|
| `radius-kbd` | `4px` | Tastenkürzel kbd. |
| `radius-tag` | `9px` | Preisschild, Beschriftung .cap, Tasten-Badge am Turmknopf. |
| `radius-badge` | `11px` | Abzeichen 22 px hoch (.rb-badge, Tasten-Badge der Fähigkeit), Stufenmarke r = 11. |
| `radius-select` | `12px` | Auswahlfeld Karte. |
| `radius-ab-badge` | `13px` | Ladungs-Badge der Fähigkeit (26 px). |
| `radius-plaque` | `14px` | Holzleiste und Plaketten. |
| `radius-pill-s` | `17px` | Wellenvorschau (34 px hoch). |
| `radius-banner` | `18px` | Pause-Banner, große Plaketten. |
| `radius-pill-m` | `20px` | Holz-Textknopf (40 px hoch). |
| `radius-pill-l` | `23px` | Wellenknopf (46 px hoch). |
| `radius-round` | `50%` | Runde Knöpfe, Fähigkeiten, Turmknöpfe. |

## Schatten

Immer harter Schatten nach unten (0 Unschärfe) plus Lichtkante innen oben: gemalt, nicht weich.

| Token | Wert | Verwendung |
|---|---|---|
| `shadow-plaque` | `inset 0 2px 0 rgba(255,220,160,0.55), inset 0 -3px 0 rgba(0,0,0,0.25), 0 4px 0 rgba(30,15,5,0.45)` | Holzleiste .plq. |
| `shadow-banner` | `inset 0 2px 0 rgba(255,220,160,0.55), 0 6px 0 rgba(30,15,5,0.45)` | Pause-Banner, Overlay-Plakette. |
| `shadow-round` | `inset 0 2px 0 rgba(255,235,190,0.6), 0 3px 0 rgba(30,15,5,0.5)` | Runder Knopf .rb, Holz-Textknopf (Lichtkante .5). |
| `shadow-round-pressed` | `inset 0 2px 0 rgba(255,235,190,0.6), 0 1px 0 rgba(30,15,5,0.5)` | Runder Knopf gedrückt (dazu translateY 2px). |
| `shadow-ability` | `inset 0 3px 0 rgba(255,255,255,0.35), 0 4px 0 rgba(30,15,5,0.55)` | Fähigkeitsknopf .ab, Turmknopf (Lichtkante .3). |
| `shadow-ability-aiming` | `0 0 0 4px #ffe266, 0 0 18px 6px rgba(255,226,102,0.7), 0 4px 0 rgba(30,15,5,0.55)` | Fähigkeit zielt (.aiming), Turmknopf gewählt (16px 4px .6). |
| `shadow-gold` | `inset 0 2px 0 rgba(255,255,255,0.6), 0 4px 0 rgba(30,15,5,0.5)` | Wellenknopf. |
| `shadow-gold-pressed` | `inset 0 2px 0 rgba(255,255,255,0.6), 0 2px 0 rgba(30,15,5,0.5)` | Wellenknopf gedrückt. |
| `shadow-gold-ready` | `inset 0 2px 0 rgba(255,255,255,0.6), 0 4px 0 rgba(30,15,5,0.5), 0 0 0 6px rgba(255,212,90,0.45)` | Wellenknopf bereit, Spitze der Puls-Animation (1,6 s). |
| `shadow-disabled` | `inset 0 2px 0 rgba(255,255,255,0.3), 0 4px 0 rgba(30,15,5,0.4)` | Wellenknopf gesperrt. |
| `shadow-paused` | `0 0 0 3px #ffe266, inset 0 2px 0 rgba(255,235,190,0.6), 0 3px 0 rgba(30,15,5,0.5)` | Pause-Knopf, solange pausiert. |

## Konturen

Konturstärken in ink. UI in CSS-px; Figuren in Entwurfs-px (Kachel = 57) und mit TILE/57 skaliert.

| Token | Wert | Verwendung |
|---|---|---|
| `stroke-ui` | `3px` | Rand von Holzleiste, rundem Knopf, Wellenknopf, Plakette, Fokusrahmen. |
| `stroke-ui-bold` | `4px` | Rand von Fähigkeitsknopf und Turmknopf (größere Knöpfe). |
| `stroke-badge` | `2.5px` | Rand von Abzeichen und Stufenmarke. |
| `stroke-select` | `2px` | Auswahlfeld, Trennstrich-Details. |
| `stroke-figure` | `3px` | Figuren-Umriss (Entwurfs-px): Sockel, Dach, Rohr. |
| `stroke-figure-fine` | `2.5px` | Figuren-Details: Kopf, Mütze, Fahne. |
| `stroke-figure-line` | `2px` | Fugen im Stein (stone-line), Innenlinien. |
| `stroke-scene` | `4px` | Burg, Fahnentuch, Brücke, Seeufer. |
| `text-outline` | `2px` | Umriss heller Schrift: text-shadow -2px 0, 2px 0, 0 -2px, 0 2px in ink, dazu 0 3px 0 ink bei .num. |

## Größen

Knopf- und Feldgrößen. Tippziel nie unter 44 px.

| Token | Wert | Verwendung |
|---|---|---|
| `size-touch-min` | `44px` | Mindestgröße jedes Tippziels (e2e buttons). |
| `size-wbtn-h` | `40px` | Holz-Textknopf Höhe (min-height). |
| `size-wave-h` | `46px` | Wellenknopf Höhe. |
| `size-wave-min-w` | `168px` | Wellenknopf Mindestbreite. |
| `size-round` | `48px` | Runder Knopf (Hilfe, Ton, Tempo, Pause). |
| `size-hud-h` | `56px` | Holzleiste Höhe. |
| `size-ability-mobile` | `56px` | Fähigkeitsknopf auf dem Handy. |
| `size-tower` | `60px` | Turmknopf (Übergang bis Ringmenü). |
| `size-ability` | `64px` | Fähigkeitsknopf. |
| `size-badge` | `22px` | Abzeichen und Stufenmarke (Durchmesser). |
| `size-ab-badge` | `26px` | Ladungs-Badge der Fähigkeit. |
| `size-tile` | `40px` | Kachel in Spiel-px (TILE). Feld 20 x 14 Kacheln = 800 x 560. |
| `size-tile-design` | `57px` | Kachel im Entwurf (FIGURE_STYLE.unit). Formen skalieren mit TILE/57. |
| `size-frame` | `50px` | Rand um das Feld in Spiel-px (FRAME_MARGIN), Canvas 900 x 660. |
