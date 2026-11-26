

### B-005: Vorzeitiger Wellenstart mit Gold-Bonus
- Status: fertig (Mensch hat am 2026-11-26 freigegeben: "früher auf nächste Welle klicken für etwas mehr Gold")
- Aufwand: M
- Idee: Wer die nächste Welle startet, während die aktuelle noch läuft, bekommt einen Bonus (Prozentsatz von `waveBonus`). Erfordert mehrere parallele Spawn-Queues. Risiko: Balancing (Gold-Exploit).
- Akzeptanzkriterien:
  - `EARLY_START_BONUS = 0.5` steht in `src/config.js`.
  - `startWave` ist bei laufender Welle erlaubt, solange `state.wave < MAX_WAVES` und alle Gegner der laufenden Welle gespawnt sind (Entscheidung des Menschen 2026-11-26 gegen Gold-Stapeln).
  - Bonus ist `floor(waveBonus(wave) * EARLY_START_BONUS)` der neu gestarteten Welle, sofort gutgeschrieben (mit Münz-/Text-Effekt); gilt nicht, wenn keine Welle aktiv ist.
  - Der normale Wellenbonus geht nicht verloren: jede Welle zahlt ihren `waveBonus` genau einmal, wenn alle ihre Gegner gespawnt und besiegt/durchgelaufen sind (oder einfacher: die laufende Welle bekommt ihn beim frühen Start sofort). Test dafür.
  - Gegner behalten die HP-Skalierung ihrer eigenen Welle (Spawn-Einträge tragen ihre Wellennummer), auch wenn inzwischen eine spätere Welle gestartet wurde. Test dafür.
  - Test: Zwei Wellen laufen parallel, alle Gegner spawnen zum korrekten Zeitpunkt (relativ zum Start ihrer Welle).
  - Test: `status` wird erst 'won', wenn alle Wellen gespawnt und alle Gegner tot sind.
  - HUD: Der Knopf „Welle starten“ bleibt während einer Welle bedienbar (bis Welle 20) und zeigt dann den Bonus an (z. B. „Nächste Welle +7“); Leertaste wie bisher. Desktop und Handy prüfen.
  - Balancing per Strategie-Simulation messen (Karten Wiese, Eis, Zangenangriff, Zwei Fronten, Vulkan; dt 1/30 und 1/60): bestehende Strategien unverändert (sie rufen nicht früh), plus eine Strategie, die früh ruft. Ergebnis im Bericht; das Spiel soll nicht deutlich leichter werden.
