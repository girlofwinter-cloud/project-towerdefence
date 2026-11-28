# Tokens: Gemalt und warm

Erzeugt aus `tokens.json` mit `node scripts/design-tokens.mjs`. Nicht von Hand ändern.

## Farben (334)

| Token | Wert | Verwendung |
|---|---|---|
| `ink` | `#2b1a10` | Kontur überall: Ränder von Knöpfen, Plaketten, Figuren, Textumriss. Grund der Preisschilder und Tasten-Badges. style.css --ink, FIGURE_STYLE.outline. |
| `cream` | `#fff3d2` | Helle Schrift und Zahlen auf Holz und auf ink (15:1 auf ink). Icons auf Holzknöpfen. style.css --cream. |
| `muted` | `#e8d3a8` | Nebentext auf Holz (Turm-Panel p). style.css --muted. |
| `hl` | `#ffe266` | Auswahl und Fokus: Fokusrahmen 3 px, Ring um gewählten Turm, zielende Fähigkeit, Pause aktiv. style.css --hl. |
| `bad` | `#ff6b5a` | Warnung im Text: wenig Leben (pulsiert). Nur auf ink oder Holz dunkel. style.css --bad. |
| `frame-bg` | `#1d3a1f` | Seitenhintergrund hinter der Bühne (body). Nur Fläche, kein Text darauf außer cream. |
| `overlay-bg` | `rgba(16,28,14,0.7)` | Abdunklung hinter Spielende-Overlay (#overlay). |
| `overlay-bg-mobile` | `rgba(16,28,14,0.78)` | Abdunklung hinter dem Spielende auf dem Handy. |
| `start-bg` | `rgba(16,28,14,0.45)` | Abdunklung hinter dem Startbildschirm (#start-screen). |
| `side-shade` | `rgba(16,28,14,0.35)` | Handy hochkant: Schatten der seitlichen Ränder (#app::before/::after). |
| `ring-yard` | `rgba(43,26,16,0.38)` | Dunkler Hof hinter dem Ringmenü (radial bis 45 %, aus bei 70 %). |
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
| `gold-light` | `#ffe27a` | Preis auf ink (13:1), +Gold-Text beim Münzflug, Verbessern-Knopf im Ringmenü (Licht, nach gold-btn-b). SHOP_CARD.cost. |
| `gold-btn-a` | `#ffd45a` | Goldknopf oben (Wellenknopf, .wbtn-gold); Fortschritt der laufenden Welle. |
| `gold-btn-b` | `#e08a1c` | Goldknopf unten. |
| `wave-progress` | `{gold-btn-a} = #ffd45a` | Fortschrittsleiste im laufenden Wellenknopf (4 px, --wave-fill 0..1). |
| `sell-a` | `#e88a6a` | Verkaufen-Knopf im Ringmenü, Licht (.rbtn-red). |
| `sell-b` | `#a8412c` | Verkaufen-Knopf im Ringmenü, Schatten. |
| `price-poor` | `#ff9e8f` | Preis, wenn das Gold nicht reicht (auf ink 8:1), immer zusammen mit Durchstreichen. SHOP_CARD.costPoor. |
| `card-bg` | `#4e321d` | Turmknopf Fläche (SHOP_CARD.bg, bis zum Ringmenü). |
| `card-bg-active` | `#62402a` | Turmknopf gewählt, dazu Ring hl. |
| `card-icon-bg` | `#5fae48` | Fläche hinter dem Mini-Turm im Turmknopf. |
| `card-key-bg` | `#2e1d10` | Tasten-Badge am Turmknopf: Fläche. |
| `card-key-text` | `#fff4dc` | Tasten-Badge am Turmknopf: Schrift. |
| `flag-red` | `#c4452f` | Wellenfahne, Burgdach, Kanonier-Mütze. |
| `ribbon-win` | `{flag-red} = #c4452f` | Band der Spielende-Plakette: gewonnen. |
| `ribbon-loss` | `{stone-line} = #6b5a48` | Band der Spielende-Plakette: verloren. |
| `star-empty` | `#5a3a22` | Nicht erreichter Stern (Kartenkarte, Spielende). |
| `map-locked` | `#c9b89a` | Name einer gesperrten Kartenkarte. |
| `lock-shackle` | `#d9dde2` | Bügel des Schlosses auf gesperrten Karten, Klinge im Reparatur-Icon. |
| `heart` | `#e0393e` | Herz im HUD (Leben). |
| `message-bad` | `#b8432f` | Meldung Warnung (#message), Schrift cream. |
| `message-info` | `#4f8a34` | Meldung Info (#message.info), Schrift cream. |
| `hp-good` | `#74d048` | Lebensbalken voll (FIGURE_STYLE.hp.good). |
| `hp-mid` | `{gold} = #f2c14e` | Lebensbalken mittel. |
| `hp-low` | `#e5481f` | Lebensbalken niedrig. |
| `level-1` | `#d7dde0` | Stufenmarke Stufe 1 (FIGURE_STYLE.badge.colors[0]). |
| `level-2` | `{gold} = #f2c14e` | Stufenmarke Stufe 2, Goldband am Turm ab Stufe 2. |
| `level-3` | `#ff8a3d` | Stufenmarke Stufe 3. |
| `marble-a` | `#fbf7ef` | Adlerhorst (Pfeil Stufe 3): Marmor hell (B-173). |
| `marble-b` | `#e2d9c8` | Adlerhorst: Marmor mittel. |
| `marble-c` | `#b8ab95` | Adlerhorst: Marmor dunkel. |
| `ice-deep` | `#1f5d96` | Eiszitadelle (Frost Stufe 3): dunkelstes Eis, Tor (B-173). |
| `brick-a` | `#c0563c` | Falkenauge (Scharfschütze Stufe 3): Ziegel hell (B-174). |
| `brick-b` | `#8a3424` | Falkenauge: Ziegel dunkel. |
| `brick-line` | `#5a2016` | Falkenauge: Fugen. |
| `darkwood-a` | `#6b4a2e` | Falkenauge: dunkles Holz hell (Galerie, Kappe). |
| `darkwood-b` | `#3a2414` | Falkenauge: dunkles Holz dunkel, Tür. |
| `mark` | `#ff4f6e` | Markierung und Zielstrahl des Falkenauges, Linse (nur mit ink-Umriss auf dem Feld). |
| `iron-a` | `#5d5470` | Sturmspule (Blitz Stufe 3): Eisen hell (B-174). |
| `iron-b` | `#3a3346` | Sturmspule: Eisen dunkel, Füße. |
| `copper-a` | `#e8a070` | Sturmspule: Kupfer Licht. |
| `cloud` | `#4a4458` | Gewitterwolke der Sturmspule (Figur und Einschlag). |
| `bolt` | `#fff6a8` | Blitz, Bodenlicht und Druckring des Gewitters. |
| `electric` | `#8fb8ff` | Funken und Schein der Sturmspule. |
| `soot` | `rgba(43,26,16,0.45)` | Ruß: Brandfläche der Mörserfestung, Rußfleck des Gewitters (B-173/B-174). |
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
| `castle-gate` | `#33211a` | Tor und Fenster der Burg (Rand und Start-Titel). |
| `castle-flag` | `#3a7bd5` | Fahne auf dem Burgturm. |
| `castle-icon-a` | `#cfc8bb` | Burg im Start-Titel hell (Turm). |
| `castle-icon-b` | `#b9b2a6` | Burg im Start-Titel dunkel (Mauer). |
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
| `map-graveyard-1` | `#5a6a52` | Karte Nachtfriedhof (B-212): Bodenverlauf Stufe 1 von 3 (Moorboden Nacht, MAPS.graveyard.theme.painted.ground). |
| `map-graveyard-2` | `#3e4c40` | Karte Nachtfriedhof (B-212): Bodenverlauf Stufe 2 von 3. |
| `map-graveyard-3` | `#263028` | Karte Nachtfriedhof (B-212): Bodenverlauf Stufe 3 von 3. |
| `map-graveyard-path-groove` | `#1c2420` | Karte Nachtfriedhof (B-212): Weg-Rinne. |
| `map-graveyard-path-edge` | `#4a3a28` | Karte Nachtfriedhof (B-212): Weg-Rand und dunkler Weg-Tupfen. |
| `map-graveyard-path-earth` | `#b0a07e` | Karte Nachtfriedhof (B-212): Weg-Erde. |
| `map-graveyard-path-mid` | `#c8b890` | Karte Nachtfriedhof (B-212): Weg-Mitte. |
| `map-graveyard-path-dot` | `#e8dcb8` | Karte Nachtfriedhof (B-212): heller Weg-Tupfen, Mittelstrich der Nebenwege. |
| `map-graveyard-dot-1` | `#8aa68a` | Karte Nachtfriedhof (B-212): Boden-Tupfen Moos. |
| `map-graveyard-dot-3` | `#e6d27a` | Karte Nachtfriedhof (B-212): Boden-Tupfen Pilz. |
| `map-graveyard-pine-1` | `#1a2a24` | Karte Nachtfriedhof (B-212): Tanne Stufe 1 von 4. |
| `map-graveyard-pine-2` | `#22362c` | Karte Nachtfriedhof (B-212): Tanne Stufe 2 von 4. |
| `map-graveyard-pine-3` | `#2e4636` | Karte Nachtfriedhof (B-212): Tanne Stufe 3 von 4. |
| `map-graveyard-pine-4` | `#5a6a52` | Karte Nachtfriedhof (B-212): Tanne Stufe 4 von 4. |
| `map-graveyard-yard` | `#2c3a30` | Karte Nachtfriedhof (B-212): Friedhof-Boden (Friedhofkacheln). |
| `map-graveyard-yard-edge` | `#4a4038` | Karte Nachtfriedhof (B-212): Friedhof-Rand, Strich 6/5 gestrichelt. |
| `map-graveyard-lantern` | `#ffd27a` | Karte Nachtfriedhof (B-212): Laternenlicht, Aufleuchten beim Skelett-Trupp. |
| `map-graveyard-light` | `#c8d6ff` | Karte Nachtfriedhof (B-212): kühles Mondlicht (light.tint). |
| `figure-shadow` | `rgba(20,30,40,0.4)` | Bodenschatten unter Figuren (Gegner, Türme). |
| `enemy-bat-wing` | `#4a3560` | Fledermaus: Flügel (B-167). |
| `enemy-bat-body` | `#6b4a80` | Fledermaus: Körper und Ohren. |
| `enemy-bat-vein` | `#8a6aa8` | Fledermaus: Flügeladern. |
| `enemy-wisp-body` | `#c9fff0` | Irrlicht: Körper (B-168). |
| `enemy-wisp-core` | `#ffffff` | Irrlicht: heller Kern, Funken. |
| `enemy-wisp-glow` | `#9effd9` | Irrlicht: flackernder Lichthof. |
| `enemy-beetle-shell` | `#b0703a` | Panzerkäfer: Schale (B-169). |
| `enemy-beetle-ridge` | `#7a4a24` | Panzerkäfer: Rillen der Schale, Splitter dunkel. |
| `enemy-beetle-shine` | `#e8b27a` | Panzerkäfer: Glanz, Splitter hell. |
| `enemy-beetle-head` | `#3a2a3a` | Panzerkäfer: Kopf. |
| `enemy-beetle-soft` | `#e9a98c` | Panzerkäfer: weicher Leib ohne Schale. |
| `enemy-beetle-soft-line` | `#b8705a` | Panzerkäfer: Linien am weichen Leib. |
| `steam` | `#f4f1ea` | Dampfwölkchen, wenn Kälte den Glutling trifft (B-170). |
| `necro-cloak` | `#2a1c40` | Umhang der Nekromantin (ENEMY_SVG.necro). |
| `necro-robe` | `#5b3d8a` | Robe und Ärmel der Nekromantin. |
| `necro-robe-dark` | `#3d2a5c` | Kapuze, Kragen und Gürtel der Nekromantin. |
| `necro-face` | `#1a1226` | Gesicht unter der Kapuze der Nekromantin. |
| `necro-skin` | `#a8c8a0` | Hände der Nekromantin. |
| `necro-glow` | `#7dff9a` | Leuchten der Nekromantin in Phase 1: Stabkugel, Augen, Boden-Aura, Beschwörungs-Fleck (ENEMY_STYLE.necro.glow). |
| `necro-glow-2` | `#ff5fd0` | Leuchten in Phase 2 der Nekromantin, Druckwelle, Schrift „Zweite Phase!“, Füllung und Phase-Text der Boss-Leiste in Phase II (style.css --necro-glow-2). |
| `boss-shield` | `#bff6ff` | Schild-Kugel beim Phasenwechsel, Streifen der Boss-Leiste bei Schild, Elite-Schildbogen und -zeichen (style.css --boss-shield). |
| `boss-bar` | `#d0384a` | Füllung der Boss-Leiste (Verlauf #f0606e → #d0384a → #8a1f30), style.css --boss-bar. |
| `elite-ring` | `rgba(242,193,78,0.9)` | Gestrichelter Fußring der Elite-Gegner (ENEMY_STYLE.elite.ring). |
| `badge-bronze-a` | `#f0b47a` | Albtraum-Abzeichen Bronze: Licht des Medaillen-Verlaufs (radial 35 % / 30 %). Bauvorlage Albtraum-Abzeichen. |
| `badge-bronze-b` | `#8a4f24` | Albtraum-Abzeichen Bronze: Schatten des Medaillen-Verlaufs. |
| `badge-silver-a` | `#ffffff` | Albtraum-Abzeichen Silber: Licht des Medaillen-Verlaufs. Gold nutzt gold-light → gold-btn-b. |
| `badge-silver-b` | `#8f9aa6` | Albtraum-Abzeichen Silber: Schatten des Medaillen-Verlaufs. |
| `ogre-eye` | `#ffc22a` | Glut-Augen des Oger-Kopfs auf dem Albtraum-Abzeichen (Schein darunter: lava, α 0,4). |
| `night-a` | `#2a1f44` | Albtraum-Nachthimmel hell: Hintergrund Kartenauswahl im Albtraum, Siegbildschirm, Belohnungs-Zeile, Aussehen-Menü (radial nach night-b). |
| `night-b` | `#0e0b1a` | Albtraum-Nachthimmel dunkel: Ende der Nachtverläufe. |
| `night-card-a` | `#4a3550` | Kartenkarte im Albtraum-Modus oben (Holz bei Nacht), Verlauf nach night-card-b. |
| `night-card-b` | `#2a1d30` | Kartenkarte im Albtraum-Modus unten. |
| `nightmare-btn-a` | `#5b3f7a` | Albtraum-Knopf und aktiver Umschalter Albtraum oben (Verlauf nach nightmare-btn-b). Text cream. |
| `nightmare-btn-b` | `#2a1d40` | Albtraum-Knopf unten. |
| `night-tint` | `rgba(20,12,40,0.62)` | Nacht-Tönung nur über dem Spielfeld (multiply), Albtraum und Nacht-Look. Nie über Rand oder HUD. |
| `night-ember` | `#ff5a2a` | Rötliches Nachtlicht von unten über dem Spielfeld (α 0,35) und Glühen des aktiven Albtraum-Umschalters (α 0,6). |
| `night-vignette` | `rgba(8,4,16,0.85)` | VERALTET: Vignette entfällt mit B-194 (Regel: kein dunkler Rand). Nicht mehr verwenden. |
| `nm-shade-a` | `#2a3448` | Albtraum-Körperschatten Gegner Stil A (Wald) (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-shade-b` | `#30201c` | Gegner-Körperschatten Stil B (Verbrannte Erde) (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-shade-c` | `#252d4c` | Gegner-Körperschatten Stil C (Düstere Magie) (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-eye-moss` | `#d8ff5a` | Glühende Gegner-Augen Stil A (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-eye-ember` | `#ffb02a` | Glühende Gegner-Augen Stil B (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-eye-rune` | `#e6b8ff` | Glühende Gegner-Augen Stil C (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-rim-a` | `#e8f4ff` | Randlicht Gegner Stil A (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-rim-b` | `#ffd0a0` | Randlicht Gegner Stil B (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-rim-c` | `#c8d8ff` | Randlicht Gegner Stil C (Albtraum-Design Runde 2, B-190–B-193). |
| `bone` | `#e8dcc0` | Knochen/Skelett-Teile (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-wood-moss-a` | `#5e4e66` | HUD-Holz Wiese (Moos) oben (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-wood-moss-b` | `#30263a` | HUD-Holz Wiese unten (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-wood-ice-a` | `#4a5c8a` | HUD-Holz Eiswelt oben (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-wood-ice-b` | `#1c2648` | HUD-Holz Eiswelt unten (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-wood-rust-a` | `#7a4a22` | HUD-Holz Zangenangriff (Rost) oben (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-wood-rust-b` | `#3a1e0c` | HUD-Holz Zangenangriff unten (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-wood-iron-a` | `#4c3e6e` | HUD-Holz Zwei Fronten (Eisen) oben (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-wood-iron-b` | `#1e1836` | HUD-Holz Zwei Fronten unten (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-wood-ember-a` | `#6a3620` | HUD-Holz Vulkan (Glut) oben (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-wood-ember-b` | `#2a140a` | HUD-Holz Vulkan unten (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-moss` | `#8aa890` | Moos-Bart am HUD-Holz Stil A (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-moss-dark` | `#6a8a6a` | Moos Schatten (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-icicle` | `#dff4ff` | Eiszapfen am HUD Eiswelt (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-snow` | `#f2f8ff` | Schneehaube am HUD Eiswelt (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-char-edge` | `#1a0c06` | Brandkante am HUD Stil B (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-rust` | `#a0582e` | Rost-Akzent HUD Zangenangriff (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-iron` | `#8a92a8` | Eisenbänder HUD Stil C (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-iron-hi` | `#c8d0e0` | Eisen Glanzlicht (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-rune` | `#c58aff` | Leuchtende Runen Stil C (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-soulflame` | `#9fe8ff` | Seelenflamme/Irrlicht Stil C (Albtraum-Design Runde 2, B-190–B-193). |
| `sky-a` | `#8fd0e8` | Himmel Kartenvorschau normal oben (Albtraum-Design Runde 2, B-190–B-193). |
| `sky-b` | `#d8f0e8` | Himmel Kartenvorschau normal unten (Albtraum-Design Runde 2, B-190–B-193). |
| `night-a-2` | `#3a2a5c` | Zwischenton Nachthimmel Albtraum-Menüs (Albtraum-Design Runde 2, B-190–B-193). |
| `flag-red-dark` | `#8f2e20` | Fahne Schatten (Albtraum-Design Runde 2, B-190–B-193). |
| `bad-soft` | `#ff9a8a` | Weiche Warnung: Gold verpasst auf dunklem Holz (Albtraum-Design Runde 2, B-190–B-193). |
| `badge-silver-hi` | `#e6ecf2` | Glanzlicht Silber-Medaille (Albtraum-Design Runde 2, B-190–B-193). |
| `nm-warm-light` | `#ffe2a0` | 42 → 0) unter jedem Turm im Albtraum: „deine Türme sind die Lichter“. (Karte-Albtraum-Grundlage, B-194–B-199). |
| `nm-ice-1` | `#6a74aa` | Boden Dämmerblau (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-2` | `#454e86` | Boden Dämmerblau (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-3` | `#323a6e` | Boden Dämmerblau (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-path-groove` | `#1c2244` | heller Eisweg (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-path-edge` | `#3a4a7a` | heller Eisweg (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-path-earth` | `#a8c2e2` | heller Eisweg (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-path-mid` | `#d6e6f6` | heller Eisweg (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-path-dot` | `#ffffff` | heller Eisweg (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-shadow` | `#1c2050` | - neu: `nm-ice-shadow` = #1c2050, `nm-snow-ice` = #eef4ff, `nm-splinter` = #bff0ff, `nm-frost-light` = #bff0ff (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-snow-ice` | `#eef4ff` | - neu: `nm-ice-shadow` = #1c2050, `nm-snow-ice` = #eef4ff, `nm-splinter` = #bff0ff, `nm-frost-light` = #bff0ff (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-splinter` | `#bff0ff` | - neu: `nm-ice-shadow` = #1c2050, `nm-snow-ice` = #eef4ff, `nm-splinter` = #bff0ff, `nm-frost-light` = #bff0ff (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-frost-light` | `#bff0ff` | - neu: `nm-ice-shadow` = #1c2050, `nm-snow-ice` = #eef4ff, `nm-splinter` = #bff0ff, `nm-frost-light` = #bff0ff (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-fir-a` | `#1e2e4a` | - neu: `nm-fir-a` = #1e2e4a, `nm-fir-b` = #3a5a78, `nm-icicle-map` = #bfe8ff, `nm-grave-ice-a` = #b8c4dc, `nm-grave-ice-b` = #6a7494, `nm-ice-rock` = #6a7aa0, `nm-ice-rock-light` = #b8c8e6 (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-fir-b` | `#3a5a78` | - neu: `nm-fir-a` = #1e2e4a, `nm-fir-b` = #3a5a78, `nm-icicle-map` = #bfe8ff, `nm-grave-ice-a` = #b8c4dc, `nm-grave-ice-b` = #6a7494, `nm-ice-rock` = #6a7aa0, `nm-ice-rock-light` = #b8c8e6 (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-icicle-map` | `#bfe8ff` | - neu: `nm-fir-a` = #1e2e4a, `nm-fir-b` = #3a5a78, `nm-icicle-map` = #bfe8ff, `nm-grave-ice-a` = #b8c4dc, `nm-grave-ice-b` = #6a7494, `nm-ice-rock` = #6a7aa0, `nm-ice-rock-light` = #b8c8e6 (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-grave-ice-a` | `#b8c4dc` | - neu: `nm-fir-a` = #1e2e4a, `nm-fir-b` = #3a5a78, `nm-icicle-map` = #bfe8ff, `nm-grave-ice-a` = #b8c4dc, `nm-grave-ice-b` = #6a7494, `nm-ice-rock` = #6a7aa0, `nm-ice-rock-light` = #b8c8e6 (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-grave-ice-b` | `#6a7494` | - neu: `nm-fir-a` = #1e2e4a, `nm-fir-b` = #3a5a78, `nm-icicle-map` = #bfe8ff, `nm-grave-ice-a` = #b8c4dc, `nm-grave-ice-b` = #6a7494, `nm-ice-rock` = #6a7aa0, `nm-ice-rock-light` = #b8c8e6 (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-rock` | `#6a7aa0` | - neu: `nm-fir-a` = #1e2e4a, `nm-fir-b` = #3a5a78, `nm-icicle-map` = #bfe8ff, `nm-grave-ice-a` = #b8c4dc, `nm-grave-ice-b` = #6a7494, `nm-ice-rock` = #6a7aa0, `nm-ice-rock-light` = #b8c8e6 (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-rock-light` | `#b8c8e6` | - neu: `nm-fir-a` = #1e2e4a, `nm-fir-b` = #3a5a78, `nm-icicle-map` = #bfe8ff, `nm-grave-ice-a` = #b8c4dc, `nm-grave-ice-b` = #6a7494, `nm-ice-rock` = #6a7aa0, `nm-ice-rock-light` = #b8c8e6 (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-froz-a` | `#d8f0ff` | - neu: `nm-froz-a` = #d8f0ff, `nm-froz-b` = #9cc8ea, `nm-froz-c` = #6a98c8, `nm-froz-block` = #cfeaf8, `nm-ice-water` = #1e3a6a (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-froz-b` | `#9cc8ea` | - neu: `nm-froz-a` = #d8f0ff, `nm-froz-b` = #9cc8ea, `nm-froz-c` = #6a98c8, `nm-froz-block` = #cfeaf8, `nm-ice-water` = #1e3a6a (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-froz-c` | `#6a98c8` | - neu: `nm-froz-a` = #d8f0ff, `nm-froz-b` = #9cc8ea, `nm-froz-c` = #6a98c8, `nm-froz-block` = #cfeaf8, `nm-ice-water` = #1e3a6a (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-froz-block` | `#cfeaf8` | - neu: `nm-froz-a` = #d8f0ff, `nm-froz-b` = #9cc8ea, `nm-froz-c` = #6a98c8, `nm-froz-block` = #cfeaf8, `nm-ice-water` = #1e3a6a (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-ice-water` | `#1e3a6a` | - neu: `nm-froz-a` = #d8f0ff, `nm-froz-b` = #9cc8ea, `nm-froz-c` = #6a98c8, `nm-froz-block` = #cfeaf8, `nm-ice-water` = #1e3a6a (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-frost-rune` | `#7fe0ff` | - neu: `nm-frost-rune` = #7fe0ff, `nm-eye-frost` = #9fe8ff, `nm-rim-ice` = #e6f6ff, `nm-rune-deep` = #8a4aff (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-eye-frost` | `#9fe8ff` | - neu: `nm-frost-rune` = #7fe0ff, `nm-eye-frost` = #9fe8ff, `nm-rim-ice` = #e6f6ff, `nm-rune-deep` = #8a4aff (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-rim-ice` | `#e6f6ff` | - neu: `nm-frost-rune` = #7fe0ff, `nm-eye-frost` = #9fe8ff, `nm-rim-ice` = #e6f6ff, `nm-rune-deep` = #8a4aff (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-rune-deep` | `#8a4aff` | - neu: `nm-frost-rune` = #7fe0ff, `nm-eye-frost` = #9fe8ff, `nm-rim-ice` = #e6f6ff, `nm-rune-deep` = #8a4aff (Karte-Eiswelt-Albtraum, B-194–B-199). |
| `nm-volcano-1` | `#4a302c` | - neu: `nm-volcano-1` = #4a302c, `nm-volcano-2` = #33201e, `nm-volcano-3` = #2a1818, Kruste (deutlich dunkler als `map-volcano-*`) (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-volcano-2` | `#33201e` | - neu: `nm-volcano-1` = #4a302c, `nm-volcano-2` = #33201e, `nm-volcano-3` = #2a1818, Kruste (deutlich dunkler als `map-volcano-*`) (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-volcano-3` | `#2a1818` | - neu: `nm-volcano-1` = #4a302c, `nm-volcano-2` = #33201e, `nm-volcano-3` = #2a1818, Kruste (deutlich dunkler als `map-volcano-*`) (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-volcano-path-groove` | `#1c100e` | - neu: `nm-volcano-path-groove` = #1c100e, `-edge` = #3a2420, `-earth` = #9c8478, `-mid` = #b8a090, `-dot` = #ffd8b0 (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-volcano-path-edge` | `#3a2420` | - neu: `nm-volcano-path-groove` = #1c100e, `-edge` = #3a2420, `-earth` = #9c8478, `-mid` = #b8a090, `-dot` = #ffd8b0 (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-volcano-path-earth` | `#9c8478` | - neu: `nm-volcano-path-groove` = #1c100e, `-edge` = #3a2420, `-earth` = #9c8478, `-mid` = #b8a090, `-dot` = #ffd8b0 (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-volcano-path-mid` | `#b8a090` | - neu: `nm-volcano-path-groove` = #1c100e, `-edge` = #3a2420, `-earth` = #9c8478, `-mid` = #b8a090, `-dot` = #ffd8b0 (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-volcano-path-dot` | `#ffd8b0` | - neu: `nm-volcano-path-groove` = #1c100e, `-edge` = #3a2420, `-earth` = #9c8478, `-mid` = #b8a090, `-dot` = #ffd8b0 (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-lava-glow` | `#ff5a1a` | weiches Glühen um Rand-Lava und Risse (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-ash` | `#8a7c78` | - neu: `nm-ash` = #8a7c78, `nm-volcano-rock` = #5a4a48, `nm-volcano-rock-light` = #8a7a76 (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-volcano-rock` | `#5a4a48` | - neu: `nm-ash` = #8a7c78, `nm-volcano-rock` = #5a4a48, `nm-volcano-rock-light` = #8a7a76 (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-volcano-rock-light` | `#8a7a76` | - neu: `nm-ash` = #8a7c78, `nm-volcano-rock` = #5a4a48, `nm-volcano-rock-light` = #8a7a76 (Karte-Vulkan-Albtraum, B-194–B-199). |
| `nm-meadow-1` | `#6e927c` | Boden (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-meadow-2` | `#476a5e` | Boden (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-meadow-3` | `#34504e` | Boden (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-meadow-path-groove` | `#1f302c` | - neu: `nm-meadow-path-groove` = #1f302c, `-edge` = #5a4e4a, `-earth` = #b0a284, `-mid` = #d0c39e, `-dot` = #eef6e0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-meadow-path-edge` | `#5a4e4a` | - neu: `nm-meadow-path-groove` = #1f302c, `-edge` = #5a4e4a, `-earth` = #b0a284, `-mid` = #d0c39e, `-dot` = #eef6e0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-meadow-path-earth` | `#b0a284` | - neu: `nm-meadow-path-groove` = #1f302c, `-edge` = #5a4e4a, `-earth` = #b0a284, `-mid` = #d0c39e, `-dot` = #eef6e0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-meadow-path-mid` | `#d0c39e` | - neu: `nm-meadow-path-groove` = #1f302c, `-edge` = #5a4e4a, `-earth` = #b0a284, `-mid` = #d0c39e, `-dot` = #eef6e0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-meadow-path-dot` | `#eef6e0` | - neu: `nm-meadow-path-groove` = #1f302c, `-edge` = #5a4e4a, `-earth` = #b0a284, `-mid` = #d0c39e, `-dot` = #eef6e0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-moon` | `#d8f0ff` | Licht (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-glow-moss` | `#7dffb0` | Licht (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-moss-deep` | `#2e4a44` | - neu: `nm-moss-deep` = #2e4a44, `nm-moss-light` = #7f9e8a, `nm-moss-strand` = #8aa890, `nm-bark` = #4e4060, `nm-bark-a` = #6a5a80, `nm-bark-b` = #2e2538, `nm-bark-light` = #8a7aa0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-moss-light` | `#7f9e8a` | - neu: `nm-moss-deep` = #2e4a44, `nm-moss-light` = #7f9e8a, `nm-moss-strand` = #8aa890, `nm-bark` = #4e4060, `nm-bark-a` = #6a5a80, `nm-bark-b` = #2e2538, `nm-bark-light` = #8a7aa0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-moss-strand` | `#8aa890` | - neu: `nm-moss-deep` = #2e4a44, `nm-moss-light` = #7f9e8a, `nm-moss-strand` = #8aa890, `nm-bark` = #4e4060, `nm-bark-a` = #6a5a80, `nm-bark-b` = #2e2538, `nm-bark-light` = #8a7aa0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-bark` | `#4e4060` | - neu: `nm-moss-deep` = #2e4a44, `nm-moss-light` = #7f9e8a, `nm-moss-strand` = #8aa890, `nm-bark` = #4e4060, `nm-bark-a` = #6a5a80, `nm-bark-b` = #2e2538, `nm-bark-light` = #8a7aa0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-bark-a` | `#6a5a80` | - neu: `nm-moss-deep` = #2e4a44, `nm-moss-light` = #7f9e8a, `nm-moss-strand` = #8aa890, `nm-bark` = #4e4060, `nm-bark-a` = #6a5a80, `nm-bark-b` = #2e2538, `nm-bark-light` = #8a7aa0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-bark-b` | `#2e2538` | - neu: `nm-moss-deep` = #2e4a44, `nm-moss-light` = #7f9e8a, `nm-moss-strand` = #8aa890, `nm-bark` = #4e4060, `nm-bark-a` = #6a5a80, `nm-bark-b` = #2e2538, `nm-bark-light` = #8a7aa0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-bark-light` | `#8a7aa0` | - neu: `nm-moss-deep` = #2e4a44, `nm-moss-light` = #7f9e8a, `nm-moss-strand` = #8aa890, `nm-bark` = #4e4060, `nm-bark-a` = #6a5a80, `nm-bark-b` = #2e2538, `nm-bark-light` = #8a7aa0 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-bush` | `#1e1a2c` | - neu: `nm-bush` = #1e1a2c, `nm-bush-light` = #3c3254, `nm-shroom` = #9effd9, `nm-eye-moss` = #d8ff5a, `nm-meadow-rock` = #7a7488, `nm-meadow-rock-light` = #a8a2b8 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-bush-light` | `#3c3254` | - neu: `nm-bush` = #1e1a2c, `nm-bush-light` = #3c3254, `nm-shroom` = #9effd9, `nm-eye-moss` = #d8ff5a, `nm-meadow-rock` = #7a7488, `nm-meadow-rock-light` = #a8a2b8 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-shroom` | `#9effd9` | - neu: `nm-bush` = #1e1a2c, `nm-bush-light` = #3c3254, `nm-shroom` = #9effd9, `nm-eye-moss` = #d8ff5a, `nm-meadow-rock` = #7a7488, `nm-meadow-rock-light` = #a8a2b8 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-meadow-rock` | `#7a7488` | - neu: `nm-bush` = #1e1a2c, `nm-bush-light` = #3c3254, `nm-shroom` = #9effd9, `nm-eye-moss` = #d8ff5a, `nm-meadow-rock` = #7a7488, `nm-meadow-rock-light` = #a8a2b8 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-meadow-rock-light` | `#a8a2b8` | - neu: `nm-bush` = #1e1a2c, `nm-bush-light` = #3c3254, `nm-shroom` = #9effd9, `nm-eye-moss` = #d8ff5a, `nm-meadow-rock` = #7a7488, `nm-meadow-rock-light` = #a8a2b8 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-water-a` | `#5fd6b8` | - neu: `nm-water-a` = #5fd6b8, `nm-water-b` = #183e50, `nm-bank` = #7e8478, `nm-glint` = #d8fff0, `nm-fog` = #c8d4f0, `nm-meadow-bridge` = #7a6a72 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-water-b` | `#183e50` | - neu: `nm-water-a` = #5fd6b8, `nm-water-b` = #183e50, `nm-bank` = #7e8478, `nm-glint` = #d8fff0, `nm-fog` = #c8d4f0, `nm-meadow-bridge` = #7a6a72 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-bank` | `#7e8478` | - neu: `nm-water-a` = #5fd6b8, `nm-water-b` = #183e50, `nm-bank` = #7e8478, `nm-glint` = #d8fff0, `nm-fog` = #c8d4f0, `nm-meadow-bridge` = #7a6a72 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-glint` | `#d8fff0` | - neu: `nm-water-a` = #5fd6b8, `nm-water-b` = #183e50, `nm-bank` = #7e8478, `nm-glint` = #d8fff0, `nm-fog` = #c8d4f0, `nm-meadow-bridge` = #7a6a72 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-fog` | `#c8d4f0` | - neu: `nm-water-a` = #5fd6b8, `nm-water-b` = #183e50, `nm-bank` = #7e8478, `nm-glint` = #d8fff0, `nm-fog` = #c8d4f0, `nm-meadow-bridge` = #7a6a72 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-meadow-bridge` | `#7a6a72` | - neu: `nm-water-a` = #5fd6b8, `nm-water-b` = #183e50, `nm-bank` = #7e8478, `nm-glint` = #d8fff0, `nm-fog` = #c8d4f0, `nm-meadow-bridge` = #7a6a72 (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-rim` | `#e8f4ff` | - neu: `nm-rim` = #e8f4ff, `nm-wood-moss-a` = #5e4e66, `nm-wood-moss-b` = #30263a (Karte-Wiese-Albtraum, B-194–B-199). |
| `nm-fork-1` | `#b48e56` | Boden verbrannte Steppe (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-fork-2` | `#86603a` | Boden verbrannte Steppe (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-fork-3` | `#664630` | Boden verbrannte Steppe (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-fork-path-groove` | `#3a2414` | - neu: `nm-fork-path-groove` = #3a2414, `-edge` = #5a3a26, `-earth` = #c9a682, `-mid` = #e0c49e, `-dot` = #fff0d0 (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-fork-path-edge` | `#5a3a26` | - neu: `nm-fork-path-groove` = #3a2414, `-edge` = #5a3a26, `-earth` = #c9a682, `-mid` = #e0c49e, `-dot` = #fff0d0 (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-fork-path-earth` | `#c9a682` | - neu: `nm-fork-path-groove` = #3a2414, `-edge` = #5a3a26, `-earth` = #c9a682, `-mid` = #e0c49e, `-dot` = #fff0d0 (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-fork-path-mid` | `#e0c49e` | - neu: `nm-fork-path-groove` = #3a2414, `-edge` = #5a3a26, `-earth` = #c9a682, `-mid` = #e0c49e, `-dot` = #fff0d0 (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-fork-path-dot` | `#fff0d0` | - neu: `nm-fork-path-groove` = #3a2414, `-edge` = #5a3a26, `-earth` = #c9a682, `-mid` = #e0c49e, `-dot` = #fff0d0 (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-steppe-sun` | `#ffd890` | - neu: `nm-steppe-sun` = #ffd890, `nm-dry-grass` = #4a2e18, `nm-dry-grass-light` = #d8b070 (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-dry-grass` | `#4a2e18` | - neu: `nm-steppe-sun` = #ffd890, `nm-dry-grass` = #4a2e18, `nm-dry-grass-light` = #d8b070 (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-dry-grass-light` | `#d8b070` | - neu: `nm-steppe-sun` = #ffd890, `nm-dry-grass` = #4a2e18, `nm-dry-grass-light` = #d8b070 (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-char-a` | `#4a3430` | - neu: `nm-char-a` = #4a3430, `nm-char-b` = #1a1210, `nm-hay` = #6a4a26, `nm-hay-light` = #a07a40, `nm-ash-steppe` = #6a5040, `nm-ash-steppe-light` = #a08870, `nm-fork-rock` = #6a5446, `nm-fork-rock-light` = #9a826e (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-char-b` | `#1a1210` | - neu: `nm-char-a` = #4a3430, `nm-char-b` = #1a1210, `nm-hay` = #6a4a26, `nm-hay-light` = #a07a40, `nm-ash-steppe` = #6a5040, `nm-ash-steppe-light` = #a08870, `nm-fork-rock` = #6a5446, `nm-fork-rock-light` = #9a826e (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-hay` | `#6a4a26` | - neu: `nm-char-a` = #4a3430, `nm-char-b` = #1a1210, `nm-hay` = #6a4a26, `nm-hay-light` = #a07a40, `nm-ash-steppe` = #6a5040, `nm-ash-steppe-light` = #a08870, `nm-fork-rock` = #6a5446, `nm-fork-rock-light` = #9a826e (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-hay-light` | `#a07a40` | - neu: `nm-char-a` = #4a3430, `nm-char-b` = #1a1210, `nm-hay` = #6a4a26, `nm-hay-light` = #a07a40, `nm-ash-steppe` = #6a5040, `nm-ash-steppe-light` = #a08870, `nm-fork-rock` = #6a5446, `nm-fork-rock-light` = #9a826e (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-ash-steppe` | `#6a5040` | - neu: `nm-char-a` = #4a3430, `nm-char-b` = #1a1210, `nm-hay` = #6a4a26, `nm-hay-light` = #a07a40, `nm-ash-steppe` = #6a5040, `nm-ash-steppe-light` = #a08870, `nm-fork-rock` = #6a5446, `nm-fork-rock-light` = #9a826e (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-ash-steppe-light` | `#a08870` | - neu: `nm-char-a` = #4a3430, `nm-char-b` = #1a1210, `nm-hay` = #6a4a26, `nm-hay-light` = #a07a40, `nm-ash-steppe` = #6a5040, `nm-ash-steppe-light` = #a08870, `nm-fork-rock` = #6a5446, `nm-fork-rock-light` = #9a826e (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-fork-rock` | `#6a5446` | - neu: `nm-char-a` = #4a3430, `nm-char-b` = #1a1210, `nm-hay` = #6a4a26, `nm-hay-light` = #a07a40, `nm-ash-steppe` = #6a5040, `nm-ash-steppe-light` = #a08870, `nm-fork-rock` = #6a5446, `nm-fork-rock-light` = #9a826e (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-fork-rock-light` | `#9a826e` | - neu: `nm-char-a` = #4a3430, `nm-char-b` = #1a1210, `nm-hay` = #6a4a26, `nm-hay-light` = #a07a40, `nm-ash-steppe` = #6a5040, `nm-ash-steppe-light` = #a08870, `nm-fork-rock` = #6a5446, `nm-fork-rock-light` = #9a826e (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-rim-ember` | `#ffd0a0` | - neu: `nm-rim-ember` = #ffd0a0, `nm-eye-ember` = #ffb02a (auch Vulkan) (Karte-Zangenangriff-Albtraum, B-194–B-199). |
| `nm-twin-1` | `#66807c` | Friedhofsgras (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-twin-2` | `#4a6468` | Friedhofsgras (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-twin-3` | `#3a4a62` | Friedhofsgras (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-twin-path-groove` | `#161a32` | - neu: `nm-twin-path-groove` = #161a32, `-edge` = #3c3a5a, `-earth` = #a6acc6, `-mid` = #c8cde2, `-dot` = #f0f0ff (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-twin-path-edge` | `#3c3a5a` | - neu: `nm-twin-path-groove` = #161a32, `-edge` = #3c3a5a, `-earth` = #a6acc6, `-mid` = #c8cde2, `-dot` = #f0f0ff (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-twin-path-earth` | `#a6acc6` | - neu: `nm-twin-path-groove` = #161a32, `-edge` = #3c3a5a, `-earth` = #a6acc6, `-mid` = #c8cde2, `-dot` = #f0f0ff (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-twin-path-mid` | `#c8cde2` | - neu: `nm-twin-path-groove` = #161a32, `-edge` = #3c3a5a, `-earth` = #a6acc6, `-mid` = #c8cde2, `-dot` = #f0f0ff (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-twin-path-dot` | `#f0f0ff` | - neu: `nm-twin-path-groove` = #161a32, `-edge` = #3c3a5a, `-earth` = #a6acc6, `-mid` = #c8cde2, `-dot` = #f0f0ff (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-crypt-grass` | `#2e4448` | - neu: `nm-crypt-grass` = #2e4448, `nm-crypt-grass-light` = #8aa6a0 (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-crypt-grass-light` | `#8aa6a0` | - neu: `nm-crypt-grass` = #2e4448, `nm-crypt-grass-light` = #8aa6a0 (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-bark-grey-a` | `#5e5e7c` | - neu: `nm-bark-grey-a` = #5e5e7c, `nm-bark-grey-b` = #2a2a40, `nm-grave-a` = #aab0c8, `nm-grave-b` = #5a5f78, `nm-crypt-a` = #8a8ea8, `nm-crypt-b` = #4a4c66, `nm-iron-dark` = #4a4660, `nm-twin-rock` = #6a7090 (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-bark-grey-b` | `#2a2a40` | - neu: `nm-bark-grey-a` = #5e5e7c, `nm-bark-grey-b` = #2a2a40, `nm-grave-a` = #aab0c8, `nm-grave-b` = #5a5f78, `nm-crypt-a` = #8a8ea8, `nm-crypt-b` = #4a4c66, `nm-iron-dark` = #4a4660, `nm-twin-rock` = #6a7090 (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-grave-a` | `#aab0c8` | - neu: `nm-bark-grey-a` = #5e5e7c, `nm-bark-grey-b` = #2a2a40, `nm-grave-a` = #aab0c8, `nm-grave-b` = #5a5f78, `nm-crypt-a` = #8a8ea8, `nm-crypt-b` = #4a4c66, `nm-iron-dark` = #4a4660, `nm-twin-rock` = #6a7090 (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-grave-b` | `#5a5f78` | - neu: `nm-bark-grey-a` = #5e5e7c, `nm-bark-grey-b` = #2a2a40, `nm-grave-a` = #aab0c8, `nm-grave-b` = #5a5f78, `nm-crypt-a` = #8a8ea8, `nm-crypt-b` = #4a4c66, `nm-iron-dark` = #4a4660, `nm-twin-rock` = #6a7090 (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-crypt-a` | `#8a8ea8` | - neu: `nm-bark-grey-a` = #5e5e7c, `nm-bark-grey-b` = #2a2a40, `nm-grave-a` = #aab0c8, `nm-grave-b` = #5a5f78, `nm-crypt-a` = #8a8ea8, `nm-crypt-b` = #4a4c66, `nm-iron-dark` = #4a4660, `nm-twin-rock` = #6a7090 (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-crypt-b` | `#4a4c66` | - neu: `nm-bark-grey-a` = #5e5e7c, `nm-bark-grey-b` = #2a2a40, `nm-grave-a` = #aab0c8, `nm-grave-b` = #5a5f78, `nm-crypt-a` = #8a8ea8, `nm-crypt-b` = #4a4c66, `nm-iron-dark` = #4a4660, `nm-twin-rock` = #6a7090 (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-iron-dark` | `#4a4660` | - neu: `nm-bark-grey-a` = #5e5e7c, `nm-bark-grey-b` = #2a2a40, `nm-grave-a` = #aab0c8, `nm-grave-b` = #5a5f78, `nm-crypt-a` = #8a8ea8, `nm-crypt-b` = #4a4c66, `nm-iron-dark` = #4a4660, `nm-twin-rock` = #6a7090 (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-twin-rock` | `#6a7090` | - neu: `nm-bark-grey-a` = #5e5e7c, `nm-bark-grey-b` = #2a2a40, `nm-grave-a` = #aab0c8, `nm-grave-b` = #5a5f78, `nm-crypt-a` = #8a8ea8, `nm-crypt-b` = #4a4c66, `nm-iron-dark` = #4a4660, `nm-twin-rock` = #6a7090 (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-rune-violet` | `#c58aff` | - neu: `nm-rune-violet` = #c58aff, `nm-rune-core` = #f0dcff, `nm-soulflame` = #9fe8ff, `nm-soulflame-core` = #e6f6ff, `nm-eye-rune` = #e6b8ff, `nm-rim-crypt` = #c8d8ff (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-rune-core` | `#f0dcff` | - neu: `nm-rune-violet` = #c58aff, `nm-rune-core` = #f0dcff, `nm-soulflame` = #9fe8ff, `nm-soulflame-core` = #e6f6ff, `nm-eye-rune` = #e6b8ff, `nm-rim-crypt` = #c8d8ff (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-soulflame-core` | `#e6f6ff` | - neu: `nm-rune-violet` = #c58aff, `nm-rune-core` = #f0dcff, `nm-soulflame` = #9fe8ff, `nm-soulflame-core` = #e6f6ff, `nm-eye-rune` = #e6b8ff, `nm-rim-crypt` = #c8d8ff (Karte-ZweiFronten-Albtraum, B-194–B-199). |
| `nm-rim-crypt` | `#c8d8ff` | - neu: `nm-rune-violet` = #c58aff, `nm-rune-core` = #f0dcff, `nm-soulflame` = #9fe8ff, `nm-soulflame-core` = #e6f6ff, `nm-eye-rune` = #e6b8ff, `nm-rim-crypt` = #c8d8ff (Karte-ZweiFronten-Albtraum, B-194–B-199). |

## Schrift

- `font-display`: 'Lilita One', 'Trebuchet MS', sans-serif
- `font-body`: 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif
- Datei: Lilita One 400 (`assets/fonts/LilitaOne-Regular.ttf` im Spiel)

| Stil | Familie | Größe | Zeilenhöhe | Beispiel | Verwendung |
|---|---|---|---|---|---|
| `start-title` | display | 50px | 1 | Project TowerDefence | Titel des Startbildschirms, Umriss 3 px plus 0 5px 0 ink; Handy 32 px. |
| `overlay-title` | display | 56px | 1 | Sieg! | Spielende-Titel, Farbe gold, text-shadow 0 4px 0 ink. |
| `ribbon` | display | 44px | 1 | Gewonnen! | Text im Band der Spielende-Plakette (SVG text), cream mit Umriss 3 px; Handy 50. |
| `banner` | display | 34px | 1.1 | Pause | Pause-Banner auf Holz. |
| `num` | display | 28px | 30px | 1.240 | HUD-Zahlen (.num), cream mit 2-px-Umriss ink. |
| `round-glyph` | display | 26px | 1 | ? | Zeichen im runden Knopf (.rb-q). |
| `cooldown` | display | 24px | 1 | 12 | Sekunden im Fähigkeitsknopf (.ab-num). |
| `map-name` | display | 24px | 1.1 | Eiswelt | Name auf der Kartenkarte, cream mit Umriss. |
| `wave-button` | display | 22px | 1 | Welle 8 starten | Wellenknopf, ink auf Gold. |
| `num-compact` | display | 22px | 24px | 140 | HUD-Zahlen in der Plakette oben links im Handy-Querformat (B-137), Symbole 22 px, / 20 in 15 px. |
| `num-small` | display | 20px | 22px | / 20 | Kleine Zahl in der HUD-Leiste, +Gold beim Münzflug, Turmname im Panel. |
| `ring-title` | display | 19px | 1.1 | Kanone | Turmname in der Info-Plakette am Ringmenü. |
| `message` | display | 18px | 1.3 | Nicht genug Gold | Meldung (#message). |
| `button-text` | display | 17px | 1 | Verbessern | Holz-Textknopf (.wbtn). |
| `label` | display | 15px | 20px | Meteor | Beschriftung unter Fähigkeiten (.cap), Preisschild, Wellenvorschau, Kartenwahl. |
| `badge` | display | 14px | 17px | ×2 | Abzeichen am Knopf (.rb-badge), Stufenmarke (Canvas), Tasten-Badge. |
| `hint` | body | 16px | 1.3 | Klicke eine Karte zum Starten | Hinweis unter den Kartenkarten, cream mit 0 2px 0 ink. |
| `body` | body | 15px | 1.35 | Leertaste startet die nächste Welle. | Hilfe-Plakette, Fließtext. |
| `body-small` | body | 14px | 1.3 | Schaden 12 · Reichweite 3,0 | Werte im Turm-Panel, Farbe muted. |
| `ring-text` | body | 13px | 1.3 | Schaden 30 · Reichweite 3,0 | Werte in der Info-Plakette am Ringmenü, muted. |
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
| `radius-thumb` | `10px` | Vorschaubild auf der Kartenkarte. |
| `radius-badge` | `11px` | Abzeichen 22 px hoch (.rb-badge, Tasten-Badge der Fähigkeit), Stufenmarke r = 11. |
| `radius-select` | `12px` | Auswahlfeld Karte. |
| `radius-ab-badge` | `13px` | Ladungs-Badge der Fähigkeit (26 px). |
| `radius-plaque` | `14px` | Holzleiste und Plaketten. |
| `radius-pill-s` | `17px` | Wellenvorschau (34 px hoch). |
| `radius-banner` | `18px` | Pause-Banner, Kartenkarte. |
| `radius-card` | `22px` | Spielende-Plakette, Start-Titel, Fähigkeiten-Leiste auf dem Handy. |
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
| `shadow-disabled` | `inset 0 2px 0 rgba(255,235,190,0.4), 0 4px 0 rgba(30,15,5,0.45)` | Wellenknopf gesperrt bzw. Welle läuft (Holz, C-Abnahme 4). |
| `shadow-paused` | `0 0 0 3px #ffe266, inset 0 2px 0 rgba(255,235,190,0.6), 0 3px 0 rgba(30,15,5,0.5)` | Pause-Knopf, solange pausiert. |
| `shadow-selected` | `0 0 0 4px #ffe266, 0 0 16px 4px rgba(255,226,102,0.6), 0 4px 0 rgba(30,15,5,0.55)` | Turmknopf im Bau-Ring bei Hover/Fokus, Turmknopf gewählt. |
| `shadow-ring-focus` | `0 0 0 4px #ffe266, 0 4px 0 rgba(30,15,5,0.55)` | Aktionsknopf im Turm-Ring (Verbessern, Ziel, Verkaufen) bei Hover/Fokus. |
| `shadow-card-current` | `0 0 0 4px #ffe266, 0 10px 0 rgba(30,15,5,0.45)` | Kartenkarte gewählt oder fokussiert (dazu 6 px nach oben). |

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
| `size-wave-h-mobile` | `52px` | Wellenknopf Handy hochkant (volle Breite). |
| `size-wave-h-compact` | `56px` | Wellenknopf Handy quer bis B-137 (zweizeilig, 18 px Schrift); seit B-137 rund, siehe size-wave-round. |
| `size-wave-round` | `104px` | Runder Wellenknopf unten rechts im Handy-Querformat (B-137), Schrift 18 px zweizeilig, Fortschritt 18 px vom Rand; schmaler, wenn die Seite neben dem Feld knapp ist. |
| `size-round` | `48px` | Runder Knopf (Hilfe, Ton, Tempo, Pause). |
| `size-hud-h` | `56px` | Holzleiste Höhe. |
| `size-side-col-mobile` | `104px` | Handy quer: Breite der Bedienspalte je Seite neben dem Feld (Knöpfe 48 + 8 + 48, HUD höchstens so breit); --col in style.css. |
| `size-ability-mobile` | `56px` | Fähigkeitsknopf auf dem Handy. |
| `size-tower` | `60px` | Turmknopf (Übergang bis Ringmenü). |
| `size-ability` | `64px` | Fähigkeitsknopf. |
| `size-badge` | `22px` | Abzeichen und Stufenmarke (Durchmesser). |
| `size-ab-badge` | `26px` | Ladungs-Badge der Fähigkeit. |
| `size-ring-btn` | `60px` | Knopf im Ringmenü (Turm im Bau-Ring, Aktion im Turm-Ring); Handy 48 (size-round). |
| `size-ring-close` | `44px` | Schließen-Knopf im Turm-Ring (ink, ×). |
| `ring-radius` | `68px` | Mindestradius des Ringmenüs (RING_MENU.minRadius; sonst 1,55 Kacheln, kompakt 62). |
| `size-map-card` | `196px` | Kartenkarte Breite (Höhe 290); unter 1100 px 172, Handy 168 × 250. |
| `size-map-thumb` | `172px` | Vorschaubild der Kartenkarte Breite (Höhe 120, Seitenverhältnis 900:660 gestaucht). |
| `size-end-card` | `520px` | Spielende-Plakette Breite (höchstens 100vw − 56). |
| `size-tile` | `40px` | Kachel in Spiel-px (TILE). Feld 20 x 14 Kacheln = 800 x 560. |
| `size-tile-design` | `57px` | Kachel im Entwurf (FIGURE_STYLE.unit). Formen skalieren mit TILE/57. |
| `size-frame` | `50px` | Rand um das Feld in Spiel-px (FRAME_MARGIN), Canvas 900 x 660. |
