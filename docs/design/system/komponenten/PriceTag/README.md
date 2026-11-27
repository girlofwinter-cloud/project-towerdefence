# Preisschild

Das Preisschild nennt Kosten in Gold: Zahl in Lilita auf einem dunklen Schild, mit Münze.

**Wann:** an jedem Kaufknopf (Turmknopf im Bau-Ring, Verbessern und Verkaufen im Turm-Ring). Immer unter oder neben dem Knopf, nie allein im Feld.

**Maße:** `t-cost`: Innenrand 0 6 px, Ecken `radius-tag`, Fläche `ink`, Schrift Lilita 15/20 (`label`) in `gold-light`, Münze 16 px. Am Turmknopf mittig 15 px unter dem Knopf.

**Zustände:** bezahlbar (`gold-light` auf `ink`, 13:1) · zu teuer (`price-poor` auf `ink`, 8:1, **und** durchgestrichen 2 px; am Turmknopf zusätzlich Vorschau grau und Rand `message-bad`). Nie nur über Farbe.

Turmknopf: `size-tower` 60 px, Rand `stroke-ui-bold`, Fläche `card-bg`, gewählt `card-bg-active` mit `shadow-selected`. Seit C4 steht er im Bau-Ring (siehe Ringmenü). Bauvorlagen: `HUD-Turmwahl-Uebergang.md`, `Menue-Ring-Bauen.md`.
