// Reine Eingabe-Logik (kein DOM): Bauen per Touch geht in zwei Schritten.
// Erster Tipp auf eine Kachel zeigt nur die Vorschau (Reichweite, grün/rot), zweiter Tipp auf dieselbe Kachel baut.
// Mit der Maus gibt es den Hover schon, dort wird sofort gebaut.
// pending = zuletzt angetippte Kachel { col, row } oder null.
export function buildTapStep(pending, col, row, touch) {
  if (!touch) return { action: 'build', pending: null };
  if (pending && pending.col === col && pending.row === row) return { action: 'build', pending: null };
  return { action: 'preview', pending: { col, row } };
}
