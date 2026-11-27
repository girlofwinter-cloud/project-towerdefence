# Wellenknopf

Der Wellenknopf startet die nächste Welle; die einzige goldene Fläche im HUD und damit die wichtigste Aktion.

**Wann:** genau einmal, mittig im Band unter dem Feld (`#start-wave` in `.wave-row`). Rechts davon die Wellenvorschau als kleine Plakette, links die Kartenwahl.

**Maße:** Höhe `size-wave-h` (46 px), mindestens `size-wave-min-w` (168 px), Innenrand `space-wave-x`, Ecken `radius-pill-l`, Rand `stroke-ui` `ink`, Verlauf `gold-btn-a` → `gold-btn-b`, Schatten `shadow-gold`, Schrift Lilita 22 `ink` (Stil `wave-button`).

**Zustände:** normal · Hover (brightness 1.08) · gedrückt (`translateY(2px)`, `shadow-gold-pressed`) · bereit und keine Welle läuft (`.ready`, pulsiert 1,6 s bis `shadow-gold-ready`; ohne Puls bei reduced motion) · gesperrt (`disabled`, `disabled-a` → `disabled-b`, Schrift `disabled-ink`, `shadow-disabled`).

**Kontrast:** ink auf gold-btn-b 6,2:1; disabled-ink auf disabled-b 3,1:1 (nur Zustand, kein Lesetext nötig; markiert).

Bauvorlage: `docs/design/elemente/HUD-Wellenknopf.md`.
