# Format für Bauvorlagen

Jede Bauvorlage beschreibt **ein** Design-Element so, dass der `developer` es ohne Rückfrage und ohne Blick in Entwurfsdateien einbauen kann. Ablage: `docs/design/elemente/<Bereich>-<Element>.md` (Bereiche: `HUD`, `Menue`, `Karte`, `Tuerme`, `Gegner`, `Effekte`, `Start`, `Overlay`, `Handy`, `Layout`, `Seite`). Dazu gehört immer eine Zeichenfläche `<Bereich>-<Element>.dc.html` in der Bauteil-Bibliothek.

Werte kommen aus dem Design-System **Gemalt und warm** (Link in `docs/design/README.md`). Farben, Konturen, Rundungen, Schatten, Abstände und Knopfgrößen stehen als **Token-Name** da, der Zahlenwert in Klammern dahinter, z. B. `ink` (#2b1a10), `stroke-ui` (3 px). Fehlt ein Token, steht unter **Tokens** eine Zeile `neu:` mit Name, Wert und Zweck; der Orchestrator trägt ihn ins Design-System ein, bevor gebaut wird. Keine Wunschprosa, nur Werte.

## Abschnitte (alle Pflicht, Reihenfolge fest)

Ein Abschnitt, der nicht zutrifft, bleibt mit `entfällt: <Grund>` stehen, damit klar ist, dass er geprüft wurde.

```markdown
# <Bereich>-<Element> (<Plan-Kürzel, z. B. C2>): <ein Satz, was es ist>
Fläche: <Link zur Bauteil-Bibliothek>#<Bereich>-<Element>. Backlog: B-<nr>. Stand: <Branch>@<sha>.

## Maße
- Größe, Lage und Ausrichtung in CSS-px bei 1280x800 bzw. in Kacheln/Spiel-px (Kachel 40, Entwurf 57; Formen mit TILE/57).
- Fußpunkt/Anker, Abstände zu Nachbarn, Verhalten bei 1366x768, 390x844 (hoch), 844x390 (quer).

## Tokens
| Teil | Token | Wert |
|---|---|---|
| Rand | `stroke-ui` | 3px |
| Fläche | `wood-a` → `wood-b` | #a4672f → #7a4520 |
- neu: `<name>` = <wert>, <Zweck> (nur wenn nötig)

## Formen/SVG
SVG-Pfade, HTML und CSS zum direkten Übernehmen (Codeblöcke). Canvas: `new Path2D('…')` mit Bezugsbox (w × h) und Drehpunkt.
Farben im Code als Token (`var(--ink)`, `THEME.ink`), solange es die Tokens im Code noch nicht gibt, als Hex mit Token-Name im Kommentar.

## Zustände
Liste aller Zustände mit Auslöser und sichtbarer Änderung: normal, Hover, gedrückt, Fokus, gesperrt, gewählt, zu teuer, lädt, Stufe 1–3, eingefroren, beschädigt, Handy, reduced motion. Jeder Zustand ist auf der Zeichenfläche zu sehen.
Barrierefreiheit: Information nie nur über Farbe; Tippziel ≥ `size-touch-min` (44 px); Kontrast Text ≥ 4,5:1 (gemessenes Verhältnis angeben).

## Betroffene Dateien
| Datei | Änderung |
|---|---|
| `index.html` | … |
| `style.css` | … |
| `src/…` | … (Architektur aus CLAUDE.md: Zeichnen nur in render*, Zahlen in config.js) |
IDs und Klassen, die bleiben müssen (e2e-Tests hängen daran).

## Tests
- Bestehende Tests, die das Element berühren (Datei und Testname), und ob sie unverändert grün bleiben. Muss ein Test geändert werden: hier begründen, das entscheidet der Mensch.
- Neue Tests: Datei (`tests/<modul>.test.js` oder `tests/e2e/…`) und was genau geprüft wird.

## Messbare Abnahme
Prüfbare Sätze mit Zahl, Messweg und Gerät, z. B.:
- `#start-wave` misst 168–240 × 46 px bei 1280x800 (`getBoundingClientRect`).
- Kein Teil liegt über einer Feldkachel (Rechteck gegen `--fx/--fy/--fw/--fh`).
- Screenshot `#game` bei 1280x800 weicht von der Zeichenfläche höchstens sichtbar in Kantenglättung ab (Vergleichsbild im PR).
- `npm test` und `npm run test:e2e` grün, Konsole ohne Fehler.
```

## Checklisten für wiederkehrende Elemente

Neue Karten und neue Gegner kommen oft. Ihre Bauvorlage (`Karte-<Name>.md`, `Gegner-<Name>.md`) enthält zusätzlich zu den Abschnitten oben diese Punkte, im Abschnitt **Tokens** bzw. **Zustände**:

**Neue Karte**
- Palette als vollständiger Satz wie die bestehenden Karten: Boden 3 Stufen (`map-<id>-1..3`), Weg (`map-<id>-path-groove/-edge/-earth/-mid`), Tupfen (`dotKind`, 3 Farben), Bäume (Tanne 4, Laubbaum 3 oder kahl), Fels, Klippe, Vignette, Licht; optional Wasser oder Lava. Werte als Tabelle, neue Tokens als `neu:`-Zeilen.
- Kontrast: Weg gegen Boden sichtbar (Mitte des Wegs zu `map-<id>-2` mindestens 1,5:1), Gegner und Türme auf dem hellsten Boden erkennbar (Screenshot).
- Kartenkarte im Startbildschirm (Vorschaubild, Name) und Musik/Welt-Zuordnung genannt.
- Abnahme: Karte auf der Styleguide-Seite (sobald es B-164 gibt), Screenshot `#game` bei 1280x800 und 390x844.

**Neuer Gegner**
- Basis-Figur (heute meist Goblin, Plan G7) und was sich ändert (Farbe, Kopf, Gegenstand), Größe in Kacheln, Fußpunkt.
- Zustände: normal, eingefroren, beschädigt (Lebensbalken), Sonderfähigkeit (Aura, Schild, Beschwörung), Boss-Variante falls vorgesehen.
- Unterscheidbarkeit: Silhouette oder Helligkeit unterscheidet ihn von allen bestehenden Gegnern, nicht nur der Farbton.
- Abnahme: alle Zustände auf der Styleguide-Seite (sobald es B-164 gibt), sonst Screenshot einer Welle mit dem Gegner.

## Regeln
- Ein Element je Datei; ändert sich das Element, wird die Datei geändert, keine zweite angelegt.
- Werte aus dem Code oder dem Design-System übernehmen, nicht schätzen. Quelle mit Datei und Zeile, wenn ein Wert neu gemessen wurde.
- Größere Elemente (ganze Seite, Layout) dürfen Unterabschnitte haben, die Abschnitte oben bleiben die Gliederung.
- Ein developer-Auftrag nennt die Bauvorlage und den Abschnitt **Messbare Abnahme** als Akzeptanzkriterien.
