# Umsetzungsplan "Gemalt und warm" (Stil 1) nach dem Zielbild

Entschieden vom Menschen am 2026-11-26: Das Design aus `stil1-ziel.png` wird komplett übernommen. Zielbild: `docs/design/stil1-ziel.png` (Screenshot aus Claude Design). Entwurfscode: `docs/design/stil1-entwurf.dc.html` (SVG, Zeilennummern unten beziehen sich darauf). Plan vom `designer`.

## Maßstab
- Der Entwurf nutzt genau den Wiesen-Weg (Z.179). Kachel T = 57 px, Feld ab X0 = 71. Bei 1280x800 im Vollbild ist das Feld 798 px hoch, also wieder 57 px je Kachel: Entwurf = späteres Vollbild 1:1.
- Positionen: Spiel = (EntwurfX − 71)·40/57 bzw. EntwurfY·40/57. Formen: `ctx.translate(x,y); ctx.scale(TILE/57)`, SVG-Pfade per `new Path2D('…')` unverändert.
- Türme (Kacheln B × H): Pfeil 1,05 × 1,75; Kanone 1,26 × 1,45; Frost 1,05 × 1,6; Scharfschütze 1,3 × 2,1 (auf 0,9 skalieren, 1,9 hoch); Blitz 1,05 × 1,8. Fußpunkt 0,39 Kachel unter der Kachelmitte (Z.197).
- Gegner: Goblin 0,7 × 0,9; Flitzer 0,9 × 0,75; Troll 1,45 × 1,9. Explosion 1,4 Kacheln.
- Weg: Fuge 1,5 Kacheln, Kontur 1,26, Erde 0,95.
- Türme überlappen nebeneinander bis 0,3 Kachel (y-Sortierung). Stufenmarken in eigenem Durchgang nach allen Figuren.

## Grafik (nur Zeichnen)
- **G1 Boden kräftiger:** Z.34–38. darkAlpha ≈ 0,6, lightAlpha ≈ 0,4, sunAlpha ≈ 0,5, Körnung im Cache, `PAINT_STYLE.scale` ≈ 90. Vignette im Feld bleibt ≤ 0,15 (Test, vom Menschen bestätigt), starke Vignette nur im Rand (C1).
- **G2 Weg breit:** Z.80–87 ×0,70: Fuge 60, Kontur 48 (Test `overhangMax` 24 px), Braunrand 45, Erde 38 (Versatz −2), Mitte 21 (−1/−3), helle Punkte 2/22 bei −5,6, dunkle 2/30 bei +7. Welliger Rand: Amplitude ≈ 3 px, Wellenlänge ≈ 32 px. Saum je Karte bleibt.
- **G3 Wasser:** Fluss Z.66–70 (Sand, Kontur, Verlauf Z.40 #6fcbe0 → #2e86a8, Strichel), See Z.73–77. Ersetzt Schichten in `render-water.js`; Wasserkacheln bleiben; Seerosen bleiben; reduced-motion ohne Bewegung.
- **G4 Plateaus, Felsen, Brücke:** Klippe Z.54–64, Fels Z.102 (ersetzt `rockShape`/`drawRock`/graue Platte in `drawObstacleFlat`), Brücke Z.89–94. Plateaus nur Bodenmalerei, Klippenwände nur auf gesperrten oder Randkacheln. Burgmauer oben entfällt.
- **G5 Bäume, Rahmenwald, Burg, Fahne:** Tanne Z.103, Laubbaum Z.104 (ersetzt `drawFir`/`drawCrown`/`drawTree`), Verteilung wie `geo()` Z.219–235. Burg Z.116 + Rauch Z.120f, Wellenfahne Z.117 (Zahl in Lilita), beide im Rand. Streudeko (Fässer, Pfähle, Stamm) entfällt, Blumen als Tupfen Z.232. Bäume nur im Rand (nach C1), Kronen-Überhang ≤ 0,4 Kachel, Randkacheln bleiben bebaubar (Mensch, 2026-11-26).
- **G6 Türme neu:** Z.105–109, Kontur #2b1a10, Verläufe Z.42–48. Drehende Teile: Kanonenrohr um (36,40), Gewehr um (30,22); Rest als Sprite je Typ×Stufe (DPR-genau). Stufenmarke `.bd1` Z.15, Farben #d7dde0 / #f2c14e / #ff8a3d, Ziffer in Lilita.
- **G7 Gegner:** Goblin Z.110, Flitzer Z.112, Troll Z.113, eingefroren Z.111. Andere Typen auf Goblin-Basis: Heiler weiße Robe + Stab, Schild Rundschild #8a5326, Magier lila Kapuze, Skelett #f2e9d8, Boss Troll ×1,3 mit Krone, Nekromantin lila Robe + Totenkopfstab. Lebensbalken Z.113 nur bei Schaden.
- **G8 Effekte:** `star()`/`zig()` Z.237f nach `draw-utils.js`. Explosion Z.131–135, Rauch Z.132, Pfeil Z.123, Kugel Z.130, Mündungsfeuer Z.126/129, Scharfschuss Z.125, Frost Z.137–141, Blitz Z.143–145, Leuchtkugel Z.45/47/109. Meteor in derselben Sternsprache.
- **G9 Andere Karten:** Eis #eef6fb → #a9c6dc (Flecken #5d7e9c, Schneekappen), Herbst #c9b25a → #7d7a34 (Laub #e0803a/#c9562f), Zwei Fronten #a6cf5a → #4a6e2c, Vulkan #6b5a55 → #2d1f20 (Glutflecken #ffb04a schwach, kahle Bäume).

## Layout (Vollbild)
- **C1 Vollbild mit Rand:** Seitenpanel und Titel weg, Canvas füllt die Höhe (20:14), Rand je ≈ 71 px mit Wald und Burg, starke Vignette Z.39 nur im Rand, DPR ≤ 2.
- **C2 HUD:** Holzleiste `.plq`/`.num` Z.16f, Position Z.151–160, runde Knöpfe `.rb` 48 px Z.161–163. IDs `#gold`, `#wave`, `#lives`, `#pause`, `#speed`, `#sound` bleiben.
- **C3 Fähigkeiten und Wellenstart:** Leiste Z.164–167 (Knöpfe 64 px, conic-gradient, Badge), Knopf Z.168 (`#start-wave`), Fahne klickbar, `#wave-preview` als kleine Plakette.
- **C4 Ringmenü:** Bauen (5 Turm-Sprites, Preis, grau wenn zu teuer, Reichweite) und Verbessern/Verkaufen/Zielwahl. `#shop`, `.tower-btn`, `#tower-info` entfallen, Tasten bleiben. Klick auf Turm-Silhouette wählt den Turm.
- **C5 Startbildschirm** mit Kartenkarten, Overlays als Plakette.
- **C6 Handy:** Querformat Feld 557x390, Spalten je 143 px; Hochformat 2x-Zoom mit Verschieben; Fähigkeiten 56 px.
- e2e-Tests (`panel*`, `smoke`, `buttons`, `progress`, `testpage`) werden angepasst: vom Menschen freigegeben am 2026-11-26.

## Blöcke
- **A (Branch `agent/gemalt-warm`):** G1, G2 (Nacharbeit B-142/B-143), G3, G4, B-147.
- **B Figuren:** G6, G7, G8 (ersetzt B-144, B-138).
- **C Vollbild:** C1, C2, C3, G5 (ersetzt B-145).
- **D Bedienung:** C4, C5.
- **E:** G9, C6.
