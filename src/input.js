// Reine Eingabe-Logik (kein DOM): Bauen per Touch geht in zwei Schritten.
// Erster Tipp auf eine Kachel zeigt nur die Vorschau (Reichweite, grün/rot), zweiter Tipp auf dieselbe Kachel baut.
// Mit der Maus gibt es den Hover schon, dort wird sofort gebaut.
// pending = zuletzt angetippte Kachel { col, row } oder null.
export function buildTapStep(pending, col, row, touch) {
  if (!touch) return { action: 'build', pending: null };
  if (pending && pending.col === col && pending.row === row) return { action: 'build', pending: null };
  return { action: 'preview', pending: { col, row } };
}

// Zielmodus der Fähigkeit Meteor (kein DOM). aiming = true, wenn der nächste Klick/Tipp aufs Feld auslöst.
// event: 'key' (Taste oder Button) | 'click' (Klick aufs Feld) | 'cancel' (Esc/Rechtsklick).
// Liefert { aiming, fire }: fire = true heißt, der Meteor soll jetzt an der Klickposition auslösen.
export function aimStep(aiming, event) {
  if (event === 'key') return { aiming: !aiming, fire: false };
  if (event === 'click' && aiming) return { aiming: false, fire: true };
  if (event === 'cancel') return { aiming: false, fire: false };
  return { aiming, fire: false };
}
