# Plakette

Die Plakette ist die Holzfläche für alles, was über dem Spiel schwebt: Hilfe, Pause, Wellenvorschau, Turm-Panel, Spielende.

**Wann:** jede schwebende Fläche mit Text. Holzleiste und Wellenvorschau sind Plaketten mit festen Maßen; Meldungen (`#message`) sind die farbige Variante.

**Maße:** `.plq`: Verlauf `wood-a` → `wood-b`, Rand `stroke-ui` `ink`, Ecken `radius-plaque` (groß: `radius-banner`), Schatten `shadow-plaque` (groß: `shadow-banner`). Titel in Lilita (`banner` 34, `num-small` 20) mit `text-shadow 0 2-3px 0 ink`; Fließtext in `body` 15/1.35 `cream`, Nebentext `muted`.

**Varianten:** Pause-Banner · Hilfe (300–360 px breit) · Turm-Panel · Overlay (Titel `overlay-title` 56 in `gold`) · Meldung (`message-bad` bzw. `message-info`, Ecken 16, Lilita 18 `cream`).

**Kontrast:** cream auf wood-b 7,0:1; muted auf wood-b 5,3:1; cream auf message-bad 4,9:1; cream auf message-info 3,8:1 (unter 4,5: Lücke aus dem Code übernommen, Vorschlag B-163).

Bauvorlagen: `Overlay-Spielende.md`, `HUD-Knoepfe.md` (Hilfe).
