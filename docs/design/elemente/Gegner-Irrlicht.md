# Gegner-Irrlicht (G7-Erweiterung): schwebendes Licht `wisp`, Radius 10, weicht langsamen Geschossen aus („Verfehlt“).
Fläche: https://claude.ai/artifact/Sh1JhJ3E4h97wTMLVNEkDs#Gegner-Irrlicht. Backlog: B-168 (Logik läuft parallel). Stand: main@3908fdd. Skizze, keine Feinarbeit.

## Maße
- SVG-Box 40 × 50 Entwurfs-px = 0,70 × 0,88 Kachel, TILE/57, kein `big`.
- Fußpunkt unten mittig (20, 50). Tropfenkörper y 8–41, Schweif-Spitze links unten; kleiner Schatten bei y 47 (schwebt knapp).
- Lichthof r 18 um (20, 20) liegt hinter dem Körper und ragt seitlich 2 px über die Box (Box via `boxOf` wächst mit).
- Handy (Kachel ≈ 28 px): Figur ≈ 20 × 25 px; runder Kopf + Schweif nach unten + heller Hof = keine Beine, kein Kopf-auf-Körper wie Goblin.

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Kontur | `ink`, `stroke-figure-fine` | #2b1a10, 2,5 |
| Schrift „Verfehlt“ | `cream` mit `text-outline` in `ink` | #fff3d2, 2 px (Canvas: lineWidth 3) |
| Schatten | `figure-shadow` (neu, s. Fledermaus) Alpha 0,25 | rgba(20,30,40,0.25) |
- neu: `enemy-wisp-body` = #c9fff0, Körper (Minzweiß, bewusst nicht Eisblau, damit nicht wie „eingefroren“)
- neu: `enemy-wisp-core` = #ffffff, Kern und Funken
- neu: `enemy-wisp-glow` = #9effd9, Lichthof (mit Alpha 0,22 / 0,3)

## Formen/SVG
`src/figures.js`, in `ENEMY_SVG`:
```js
  // Irrlicht: Lichttropfen mit Schweif, schwebt; Flackern und Ausweichen in render-enemies.js
  wisp: {
    w: 40, h: 50,
    svg: `<ellipse cx="20" cy="47" rx="8" ry="2.2" fill="rgba(20,30,40,.25)"/><circle cx="20" cy="20" r="18" fill="#9effd9" opacity=".22"/><circle cx="20" cy="20" r="13" fill="#9effd9" opacity=".3"/><path d="M20 8 Q31 8 31 19 Q31 29 23 32 Q21 37 15 41 Q17 35 14 32 Q9 28 9 19 Q9 8 20 8 Z" fill="#c9fff0" stroke="#2b1a10" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="20" cy="18" rx="6" ry="6.5" fill="#ffffff"/><ellipse cx="17.5" cy="19" rx="1.6" ry="2.4" fill="#2b1a10"/><ellipse cx="22.5" cy="19" rx="1.6" ry="2.4" fill="#2b1a10"/><circle cx="7" cy="30" r="1.8" fill="#ffffff" stroke="#2b1a10" stroke-width="1"/><circle cx="33" cy="35" r="1.4" fill="#ffffff" stroke="#2b1a10" stroke-width="1"/>`,
  },
```
Canvas (`src/config.js` → `ENEMY_STYLE.wisp`, gezeichnet in `src/render-enemies.js`):
```js
wisp: {
  flicker: [0.72, 1], flickerHz: 9,   // globalAlpha der Figur springt (Hash aus id + floor(t*Hz)) im Bereich
  hover: 2, hoverHz: 1.6,             // ersetzt Geh-Wippen, Entwurfs-px
  // Ausweichen (Logik meldet ein "dodge"-Ereignis mit Richtung ±1)
  dodgeDx: 9, dodgeTime: 0.16,        // Seitwärtszucken quer zur Laufrichtung, Entwurfs-px; ease-out, zurück in 0,16 s
  ghostAlpha: 0.35, ghostLife: 0.25,  // Nachbild an der alten Stelle, verblasst
  flash: '#ffffff', flashR: 16, flashLife: 0.1, // kurzes Aufflackern (Kreis, Alpha 0,6 → 0)
  missText: 'Verfehlt', missFont: '13px "Lilita One", "Trebuchet MS", sans-serif',
  missColor: '#fff3d2', missOutline: '#2b1a10', missOutlineWidth: 3, missRise: 12, missLife: 0.6, missLift: 18, // lift: Start über der Box in px
},
```
Text und Nachbild über den FX-Pool (`src/fx-system.js`), nicht im Gegner-Objekt; höchstens 1 „Verfehlt“ je Irrlicht gleichzeitig (Spam-Schutz bei Pfeilsalven).

## Zustände
| Zustand | Auslöser | Sichtbar |
|---|---|---|
| normal | schwebt | Flackern 0,72–1, Wippen ±2 |
| ausgewichen | langsames Geschoss verfehlt | Zucken 9 px seitlich, Nachbild, weißer Blitz r 16, Text „Verfehlt“ steigt 12 px in 0,6 s |
| getroffen | schnelles Geschoss | Standard-Treffer (`FX_STYLE.hit`) |
| beschädigt | hp < max | Standard-Lebensbalken |
| eingefroren | Frost | Standard-Eisüberzug `withIce`; Flackern und Wippen aus |
| Handy | Kachel 28 | Text „Verfehlt“ bleibt 13 px (lesbar), Zucken 9·k |
| reduced motion | Einstellung | kein Flackern (Alpha 0,9 fest), kein Zucken, kein Nachbild; nur Text „Verfehlt“ ohne Steigen (0,6 s) |
Information „ausgewichen“ steht als Text da, nicht nur als Blitz/Farbe.

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/figures.js` | `ENEMY_SVG.wisp` |
| `src/render-enemies.js` | Flackern/Wippen-Zweig für `wisp` |
| `src/enemy-fx.js` / `src/fx-system.js` | Effekt „dodge“: Nachbild, Blitz, Text |
| `src/config.js` | `ENEMY_STYLE.wisp` |
| `src/main.js` | Logik-Ereignis „dodge“ an die FX weiterreichen (wie andere Ereignisse) |

## Tests
- `tests/fx.test.js` „Stil 1 Gegner: Größe …“: grün; `ALL_ENEMIES` um `wisp` ergänzen.
- Neu `tests/fx.test.js`: dodge legt genau 1 Text „Verfehlt“ an, ein zweiter dodge innerhalb `missLife` keinen weiteren; mit reduced motion kein Nachbild.
- Neu: sichtbare Kontur-Box 0,35–0,45 × 0,55–0,65 Kachel.

## Messbare Abnahme
- Screenshot bei 1280x800 während einer Pfeilsalve: Text „Verfehlt“ über dem Irrlicht, Schrift 13 px, Umriss sichtbar.
- Irrlicht bei 844x390 in Graustufen von Skelett und Flitzer unterscheidbar (rund + Schweif, keine Beine).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
