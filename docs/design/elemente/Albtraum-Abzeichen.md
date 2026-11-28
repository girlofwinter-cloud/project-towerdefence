# Albtraum-Abzeichen (B-184): Medaille Bronze/Silber/Gold mit Oger-Kopf (Motiv A), dazu offen-Zustand und kleine Variante
Fläche: Albtraum-Skizzen (Claude Design, Link setzt der Orchestrator)#Abzeichen. Backlog: B-184 (Optik), Logik B-183. Stand: agent/albtraum@f8d5826. Skizze, keine Feinarbeit.

## Maße
- Bezugsbox 100 × 100 (Entwurfs-Einheiten), skaliert auf die Zielgröße S: 200 (Siegbildschirm), 120 (Abzeichen-Wand/Übersicht), 44 (Slot auf der Kartenkarte), 36 (Zähler, HUD, Mini-Reihe Sieg).
- Scheibe: Kreis Mitte (50, 42), r 38 (= Box x 12..88, y 4..80). Band: zwei Zipfel unter der Scheibe, ragen bis y 100.
- Kopf-Motiv liegt in der Scheibenbox (12, 4, 76 × 76) mit eigenem 100er-Raster: `translate(12,4) scale(0.76)`.
- Rand der Scheibe: 4 (S ≥ 100), 3 (S 44–99), 2 (S < 44) Ziel-px, unabhängig vom Maßstab.
- Schlagschatten unter der Scheibe: 0 / 4 px / 0, rgba(30,15,5,0.5) (wie `shadow-gold` Außenteil); bei S < 44 entfällt er.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur überall | `ink` | #2b1a10 |
| Band | `flag-red` | #c4452f |
| Bronze (radial, Licht bei 35 % / 30 %) | `badge-bronze-a` → `badge-bronze-b` | #f0b47a → #8a4f24 |
| Silber | `badge-silver-a` → `badge-silver-b` | #ffffff → #8f9aa6 |
| Gold | `gold-light` → `gold-btn-b` | #ffe27a → #e08a1c |
| Gold-Schein (nur Gold, S ≥ 100) | `gold-btn-a` α 0,55, Weichzeichnung 24 px (Sieg: α 0,7, 40 px) | #ffd45a |
| Glanz oben innen | weiß α 0,45, 3 px | – |
| Kopf, Hörner, Hauer | `cream` | #fff3d2 |
| Augen | `ogre-eye` | #ffc22a |
| Augenschein | `lava` α 0,4 | #ff7a1f |
| offen: Fläche / Linie | `cream` α 0,05 / `muted` gestrichelt | #e8d3a8 |
- neu (in diesem Commit eingetragen): `badge-bronze-a/-b`, `badge-silver-a/-b`, `ogre-eye`.

## Formen/SVG
Band (Box 100), zuerst zeichnen, Rand `ink` 3 (S < 100: 6):
~~~js
const BADGE_RIBBON = new Path2D('M28 55 L18 98 L32 90 L42 100 L48 60 Z M72 55 L82 98 L68 90 L58 100 L52 60 Z');
~~~
Dann Scheibe (Kreis 50/42 r 38, Verlauf je Stufe, Rand `ink`). Danach Kopf im Scheibenraster (`translate(12,4) scale(0.76)`), Reihenfolge wie Liste, Linien in Scheibeneinheiten:
~~~js
const OGRE = {
  hornL: new Path2D('M33 36 C22 32 15 22 17 9 C24 17 32 21 42 27 Z'),           // cream, ink 3.5
  hornR: new Path2D('M67 36 C78 32 85 22 83 9 C76 17 68 21 58 27 Z'),           // cream, ink 3.5
  face:  new Path2D('M50 24 C64 24 72 32 72 44 L72 58 C72 72 62 82 50 82 C38 82 28 72 28 58 L28 44 C28 32 36 24 50 24 Z'), // cream, ink 3.5
  // Augenschein: Kreise (41,53) und (59,53) r 9, lava α 0.4 (nur S ≥ 100)
  eyeL:  new Path2D('M34 47 L47 52 L45 58 L36 56 Z'),                          // ogre-eye, ink 2.45
  eyeR:  new Path2D('M66 47 L53 52 L55 58 L64 56 Z'),                          // ogre-eye, ink 2.45
  nose:  new Path2D('M46 63 L47 66 M54 63 L53 66'),                            // nur Linie ink 2.5, round (S ≥ 100)
  mouth: new Path2D('M37 70 Q50 77 63 70'),                                    // nur Linie ink 3, round (S ≥ 100)
  tuskL: new Path2D('M41 72 L42 63 L46 73 Z'),                                 // cream, ink 2 (S ≥ 100)
  tuskR: new Path2D('M59 72 L58 63 L54 73 Z'),                                 // cream, ink 2 (S ≥ 100)
};
~~~
Als HTML/CSS (Kartenauswahl, Sieg) dasselbe als Inline-SVG `viewBox="0 0 100 100"`; Scheibe als `div` mit `border-radius:50%` und `radial-gradient(circle at 35% 30%, var(--badge-gold-a…))` ist gleichwertig.

## Zustände
- Bronze / Silber / Gold: nur Scheibenverlauf ändert sich; Gold zusätzlich Schein. Stufe immer auch als Text bzw. `aria-label` („Bronze: Welle 20 im Albtraum“), nie nur Farbe.
- Offen (nicht erreicht): kein Band, Scheibe `cream` α 0,05 mit Rand `muted` gestrichelt (3 px, 6/5), S ≥ 56: Hörner und Gesicht als gestrichelte `muted`-Linie (4, Strich 6/5) ohne Füllung, α 0,28; S < 56: nur leerer gestrichelter Kreis.
- Klein (S ≤ 44): Linien in Scheibeneinheiten 6 (Augen 4,2), ohne Augenschein, Nase, Mund, Hauer; kein Gold-Schein, kein Schatten bei S < 44.
- Neu erhalten: siehe Albtraum-Sieg (Einflug). reduced motion: kein Schein-Pulsieren.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/badge-art.js` (neu, nur Zeichnen) | `drawBadge(ctx, x, y, size, tier)` (tier 0 offen, 1–3) und `badgeSvg(size, tier)` für DOM |
| `src/config.js` | `BADGE_STYLE` (Größen, Linien, Farben als Hex mit Token-Kommentar), keine Spielwerte |
| `style.css` | `.badge`, `.badge.t1/.t2/.t3/.open` falls DOM-Variante |

## Tests
- Neu `tests/render.test.js`: `badgeSvg(44, t)` für t = 0..3 liefert gültiges SVG; t 1–3 enthalten `#c4452f`, t 3 enthält `#ffe27a`, t 0 enthält kein Band; S ≤ 44 ohne Mund-Pfad.
- Bestehende Tests unverändert grün.

## Messbare Abnahme
- Screenshot bei 1280x800: drei Stufen nebeneinander ohne Text unterscheidbar (Helligkeit Bronze < Silber, Gold mit Schein); Kopf mit Hörnern bei S 36 noch erkennbar.
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
