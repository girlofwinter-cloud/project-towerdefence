

### B-177: Ungenutzte Wisch-Helfer entfernen (Aufräumen nach B-137)
- Status: fertig
- Aufwand: S
- Idee: Seit B-137 nutzt nur noch die Testdatei `clampScroll`, `scrollEdges`, `gestureKind`, `dragScroll` in `src/viewport.js` und `VIEWPORT.tapSlop` in `src/config.js`. Samt ihrer Unit-Tests entfernen (Testlöschung freigegeben vom Menschen 2026-11-27). Dazu Token für die Handy-Bedienspalte (104 px, `--col` in `style.css`) ins Design-System.
- Akzeptanzkriterien:
  - Keine Wisch-Funktionen mehr im Code, `npm test` und e2e grün, Spalte als Token in `docs/design/system/`.
