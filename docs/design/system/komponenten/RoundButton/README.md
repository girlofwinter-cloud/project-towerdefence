# Runder Knopf

Der runde Holzknopf schaltet Hilfe, Ton, Tempo und Pause; 48 px, Icon in cream mit ink-Kontur.

**Wann:** Schalter ohne Text in der Knopfreihe oben rechts (`.top-buttons`, Abstand `space-buttons`). Für Text-Aktionen den Holz-Textknopf `.wbtn` nehmen.

**Maße:** `size-round` (48 px, über `size-touch-min`), Rand `stroke-ui` `ink`, rund, Fläche radial bei 35 % 30 % von `btn-a` nach `btn-b`, Schatten `shadow-round`. Icon 40 × 40, Füllung `cream`, Kontur `ink` 2,5.

**Zustände:** Hover heller (brightness 1.1) · gedrückt (`translateY(2px)`, `shadow-round-pressed`) · Abzeichen `.rb-badge` unten rechts (22 px, `gold`, Lilita 14) · Schalter aus (`aria-pressed="false"`, anderes Icon) · pausiert (`data-paused="true"`, `shadow-paused`) · Fokus (Rahmen `hl` 3 px, Abstand 3 px).

Bauvorlage: `docs/design/elemente/HUD-Knoepfe.md`.
