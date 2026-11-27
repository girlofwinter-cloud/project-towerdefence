# Gegner-Nekromantin (G7-Erweiterung): Nekromantin als echter Endboss: neue große Figur mit Umhang, Leuchtstab, Boden-Aura und Phase 2
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Gegner-Nekromantin. Backlog: B-180 (Optik; Phase/Schild-Logik und Werte in B-180 Balancing). Stand: agent/stufe3-und-gegner@6bd3237. Skizze, keine Feinarbeit.

## Maße
- SVG-Box neu 76 × 92 Entwurfs-px (heute 46 × 50), `FIGURE_STYLE.necroScale` bleibt 1,5 → 114 × 138, höher als Oger-König (Troll 96 × 104 × 1,3 = 125 × 135).
- Desktop: 97 × 117 px (2 × 2,4 Kacheln); Handy quer: 63 × 76 px.
- Fußpunkt (38, 88), Schatten rx 22. Stab rechts (Kugel bei 64/9), freie Hand links (16/54) mit Leuchtfleck.
- Boden-Aura: Lichtfleck rx 1,6 Kacheln, ry × 0,3, darunter gezeichnet; Runenring r 84/64 Entwurfs-px × Maßstab, flach (scaleY 0,3), 5 Dreieck-Spitzen.
- Phase 2: 2 Schädel r 7 kreisen auf rx 62 um den Kopf (3 s/Umdrehung).
- Schild beim Wechsel: Kreis um Figurmitte, r = 0,8 × Figurhöhe.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure` | #2b1a10, 3 |
| Umhang | neu `necro-cloak` | #2a1c40 |
| Robe | neu `necro-robe` | #5b3d8a |
| Kapuze, Kragen, Gürtel | neu `necro-robe-dark` | #3d2a5c |
| Gesicht | neu `necro-face` | #1a1226 |
| Hände | neu `necro-skin` | #a8c8a0 |
| Stab | `wood-fig-b` | #8a5326 |
| Schädel am Stab | (Code Skelett) | #f2e9d8 |
| Leuchten Phase 1 | neu `necro-glow` | #7dff9a |
| Leuchten Phase 2 | neu `necro-glow-2` | #ff5fd0 |
| Schild | neu `boss-shield` | #bff6ff, α 0,18 Fläche, Rand 4 auf ink 7 |
- neu: `necro-cloak`, `necro-robe`, `necro-robe-dark`, `necro-face`, `necro-skin`, `necro-glow`, `necro-glow-2`, `boss-shield` (Werte oben).

## Formen/SVG
`src/figures.js`, `ENEMY_SVG.necro` ersetzen; Phase 2 als Variante (wie Fledermaus-Varianten, `variantDef`) mit `#ff5fd0` statt `#7dff9a`:
~~~js
  necro: {
    w: 76, h: 92, big: 'necroScale',
    svg: `<ellipse cx="38" cy="88" rx="22" ry="5" fill="rgba(20,30,40,.4)"/><g data-part="cloak"><path d="M16 40 Q8 64 5 86 Q15 80 22 88 Q30 80 38 88 Q46 80 54 88 Q62 80 71 86 Q68 64 60 40 Z" fill="#2a1c40" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/></g><path d="M25 42 Q23 64 25 86 H51 Q53 64 51 42 Z" fill="#5b3d8a" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M38 62 V86" stroke="#7dff9a" stroke-width="2" opacity=".8"/><path d="M25 56 H51 V62 H25 Z" fill="#3d2a5c" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="38" cy="59" r="3" fill="#7dff9a" stroke="#2b1a10" stroke-width="1.5"/><path d="M50 42 Q60 44 62 52 L56 55 Q52 50 50 50 Z" fill="#5b3d8a" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 42 Q16 44 14 52 L20 55 Q24 50 26 50 Z" fill="#5b3d8a" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="16" cy="54" r="4" fill="#a8c8a0" stroke="#2b1a10" stroke-width="2"/><circle cx="14" cy="47" r="4" fill="#7dff9a" opacity=".55"/><path d="M18 42 L23 28 L30 38 L38 32 L46 38 L53 28 L58 42 Z" fill="#3d2a5c" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 32 Q24 10 38 8 Q52 10 52 32 Q46 36 38 36 Q30 36 24 32 Z" fill="#3d2a5c" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/><path d="M38 8 Q46 2 52 7 Q45 7 43 11" fill="#3d2a5c" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="38" cy="25" rx="9" ry="8" fill="#1a1226"/><circle cx="33" cy="24.5" r="5" fill="#7dff9a" opacity=".3"/><circle cx="43" cy="24.5" r="5" fill="#7dff9a" opacity=".3"/><path d="M31 24 L35 25.5 M45 24 L41 25.5" stroke="#7dff9a" stroke-width="3" stroke-linecap="round"/><path d="M62 88 L64 14" stroke="#2b1a10" stroke-width="6" stroke-linecap="round"/><path d="M62 88 L64 14" stroke="#8a5326" stroke-width="3" stroke-linecap="round"/><circle cx="62" cy="52" r="4.5" fill="#a8c8a0" stroke="#2b1a10" stroke-width="2"/><circle cx="64" cy="10" r="12" fill="#7dff9a" opacity=".3"/><path d="M64 17 Q54 14 55 4 Q59 10 64 11 Q69 10 73 4 Q74 14 64 17 Z" fill="#8a5326" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="64" cy="9" r="5" fill="#7dff9a" stroke="#2b1a10" stroke-width="2"/><circle cx="62.5" cy="7.5" r="1.8" fill="#ffffff"/><circle cx="64" cy="22" r="4.5" fill="#f2e9d8" stroke="#2b1a10" stroke-width="2"/><circle cx="62.4" cy="21.6" r="1.2" fill="#2b1a10"/><circle cx="65.6" cy="21.6" r="1.2" fill="#2b1a10"/>`,
  },
~~~
Leuchtschein der Kugel (Kreis r 12, α 0,3) pulsiert live: scale 1 → 1,3, 1,4 s. Umhang (`data-part="cloak"`): skewX 0 → −4° um die Oberkante, 2 s (Phase 2: 1 s).

## Zustände
- Phase 1: grünes Leuchten, Aura dreht 8 s.
- Phasenwechsel (einmal, Ereignis aus der Logik): Schild-Kugel für die Schild-Dauer (Wert aus `config.js`, B-180), Druckwelle `necro-glow-2` 5 px, scale 0,3 → 1,3 in 0,6 s, Schrift „Zweite Phase!“ `font-display` 26, `necro-glow-2` mit Umriss ink 6, 1,2 s, Wackeln wie `BOSS_ENTRY`.
- Phase 2: Variante magenta, Aura 4 s, Umhang schneller, 2 kreisende Schädel (Zeichen zusätzlich zur Farbe).
- Beschwörung: je Skelett grüner (Phase 2 magenta) Bodenfleck rx 16, ry 6 + Schädel steigt 8 px, 0,7 s.
- Verlangsamt: Reif am Saum (wie Eisboden-Reif); nie Eisblock (Boss immun).
- Beschädigt: Bossleiste oben (HUD-Bossleiste), kein kleiner Balken über der Figur.
- reduced motion: Aura dreht nicht, keine kreisenden Schädel (stehen links/rechts), kein Wackeln.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/figures.js` | neue `necro`-Figur, Variante Phase 2 |
| `src/render-enemies.js` | Aura unter der Figur, Kugel-Puls, Umhang |
| `src/enemy-fx.js` | kreisende Schädel, Schild-Kugel, Reif |
| `src/render-fx.js` | Effekt-Typen `necroPhase` (Druckwelle + Schrift), `summon` |
| `src/config.js` | `ENEMY_STYLE.necro` (Aura, Takte), keine Spielwerte |

## Tests
- Bestehend (`tests/fx.test.js`): Hauptfarbe `#5b3d8a`, Schädel `#f2e9d8` (Test „Totenkopf am Stab“), „Nekromantin deutlich größer als der Goblin“ bleiben unverändert grün.
- Neu (`tests/fx.test.js`): Variante Phase 2 unterscheidet sich (enthält `#ff5fd0`, nicht `#7dff9a`); Figur höher als Oger-König; Aura und Schild ausgewogen (save/restore); reduced motion ohne Drehung.

## Messbare Abnahme
- Screenshot Welle 15 bei 1280x800 und 844x390: Nekromantin ist die höchste Figur auf dem Feld; Phase 2 auch ohne Farbe an den kreisenden Schädeln erkennbar.
- Phasenwechsel-Effekt erscheint genau einmal (Test mit Effekt-Liste).
- `npm test` und `npm run test:e2e` grün.
