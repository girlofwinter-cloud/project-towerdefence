# Handy-Hoch (B-137): nur Drehhinweis
Media Query: `@media (max-width: 759.98px) and (orientation: portrait) and (pointer: coarse)`. Dateien: index.html (`#rotate-hint`), style.css, main.js, input.js (`rotatePauseStep`).

Im Hochformat gibt es kein Spiel-Layout mehr (seitliches Wischen, Zoom-Knopf und Wisch-Hinweis sind entfallen). Vollbild über allem (z-index 60, auch über Startbild und Spielende): Fläche `frame-bg`, Symbol (Handy quer mit Drehpfeil in `gold`, 120 px), darunter Plakette `.plq` "Bitte Handy drehen" (Lilita 28).
Solange der Hinweis sichtbar ist, pausiert das Spiel; nach dem Drehen läuft es weiter, wenn die Pause vom Hinweis kam (eigene Pause bleibt).
Schmale Fenster ohne Touch (z. B. Desktop-Fenster unter 760 px) behalten die Kompakt-Ansicht (untereinander, Turm-Leiste unten).
