# Wellenknopf

Der Wellenknopf startet die nächste Welle; die einzige goldene Fläche im HUD und damit die wichtigste Aktion.

**Wann:** genau einmal, mittig im Band unter dem Feld (`#start-wave` in `.wave-row`). Rechts davon die Wellenvorschau als kleine Plakette, links die Kartenwahl.

**Maße:** Höhe `size-wave-h` (46 px), mindestens `size-wave-min-w` (168 px), Innenrand `space-wave-x`, Ecken `radius-pill-l`, Rand `stroke-ui` `ink`, Verlauf `gold-btn-a` → `gold-btn-b`, Schatten `shadow-gold`, Schrift Lilita 22 `ink` (Stil `wave-button`).

**Zustände:** normal · Hover (brightness 1.08) · gedrückt (`translateY(2px)`, `shadow-gold-pressed`) · bereit und keine Welle läuft (`.ready`, pulsiert 1,6 s bis `shadow-gold-ready`; ohne Puls bei reduced motion) · Welle läuft (`disabled` + `.running`: Holz `wood-btn` → `wood-b`, Schrift `cream` mit `0 2px 0 ink`, `shadow-disabled`; Fortschrittsleiste 4 px in `wave-progress` unten, Breite = `--wave-fill` × (Breite − 28 px)).

**Handy (B-137):** nur quer; rund unten rechts, `size-wave-round` (104 px, schmaler bei knapper Seite), zweizeilig, Schrift 18 px, Fortschritt 18 px vom Rand und 14 px über dem Boden. Schmales Fenster ohne Touch: volle Breite `size-wave-h-mobile` (52 px). Vorschau und Kartenwahl sind dort ausgeblendet.

**Kontrast:** ink auf gold-btn-b 6,2:1; cream auf wood-b 7,0:1.

Bauvorlage: `docs/design/elemente/HUD-Wellenknopf.md`.
