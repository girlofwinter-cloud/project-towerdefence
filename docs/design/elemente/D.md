# Block D: Inhaltsverzeichnis (Ringmenü C4, Startbildschirm und Plaketten C5)
| Element | Vorlage | Fläche |
|---|---|---|
| Ring Bauen (freie Kachel) | `Menue-Ring-Bauen.md` | `Menue-Ring-Bauen.dc.html` |
| Ring Turm (Verbessern/Verkaufen/Zielwahl) | `Menue-Ring-Turm.md` | `Menue-Ring-Turm.dc.html` |
| Startbildschirm mit Kartenkarten | `Start-Kartenwahl.md` | `Start-Kartenwahl.dc.html` |
| Spielende-Plakette | `Overlay-Spielende.md` | `Overlay-Spielende.dc.html` |
Reihenfolge: Ring Bauen → Ring Turm → Spielende → Startbild (Startbild ändert fast alle e2e-Tests, darum zuletzt und mit gemeinsamem Helfer `enterGame`).
IDs bleiben, wo Tests und Tastatur sie brauchen: `#shop` + `.tower-btn[data-type]` (jetzt Ring Bauen), `#tower-info`, `#upgrade`, `#sell`, `#target-mode`, `#ti-name`, `#ti-close`, `#restart`, `#overlay*`. Entfällt: `#map-select`, `.map-pick`.
