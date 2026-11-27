# Ringmenü

Das Ringmenü öffnet sich auf einer Kachel: auf freier Kachel der Bau-Ring mit den fünf Türmen, auf einem Turm der Turm-Ring mit Verbessern, Zielwahl, Verkaufen und Schließen.

**Wann:** einziger Weg zum Bauen und Verwalten von Türmen per Maus und Touch (C4, ersetzt Turmleiste und Turm-Panel). Tasten 1–5, U, S, T bleiben gleichwertig.

**Aufbau:** `.ring` (Mitte über `--rx/--ry`, Radius `--R`) mit `.ring-yard` (dunkler Hof `ring-yard`), beim Bauen `.ring-dot` (gewählte Kachel, 10 px `cream`, Rand `ink`).
- Bau-Ring: `.tower-btn.ring-btn` je Turm auf den Winkeln −90°, −18°, 54°, 126°, 198° (Reihenfolge = Tasten 1–5), mit Preisschild (siehe Preisschild) und Tasten-Badge. Hover/Fokus `shadow-selected`.
- Turm-Ring: `.rbtn` (`size-ring-btn` 60 px, Rand `stroke-ui-bold`, Schatten `shadow-ability`) auf −90° Verbessern (`.rbtn-gold`: `gold-light` → `gold-btn-b`), 0° Ziel (Holz `btn-a` → `btn-b`), 180° Verkaufen (`.rbtn-red`: `sell-a` → `sell-b`), 90° Schließen (`.rbtn-small`, `size-ring-close` 44 px, `ink`, ×). Beschriftung `.cap` mit Preis bzw. Zielmodus. Hover/Fokus `shadow-ring-focus`.
- Info: `.ring-info.plq` 240 px rechts neben dem Ring (links, wenn kein Platz: `.info-left`), Titel `ring-title`, Werte `ring-text` in `muted`.
- Radius: 1,55 Kacheln, mindestens `ring-radius` (68 px), kompakt 62 (RING_MENU in `src/config.js`).

**Zustände:** Öffnen (0,14 s von halbem Radius und 60 % Größe; reduced motion: ohne) · Hover/Fokus · zu teuer (Turm: `.poor`; Verbessern: `disabled`, grau, Preis `price-poor` durchgestrichen) · Max-Stufe (Stern statt Pfeil, Beschriftung "Max.") · Handy: Knöpfe 48 px, Turm-Ring wird zur festen Leiste unten.

**Kontrast:** cream auf ink 15,1:1 (Schließen, Beschriftung); gold-light auf ink 13:1.

Bauvorlagen: `docs/design/elemente/Menue-Ring-Bauen.md`, `Menue-Ring-Turm.md`. Icons: `RING_SVG` in `src/main.js`.
