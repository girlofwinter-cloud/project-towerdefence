// B-186: Albtraum-Balancing (grob). Misst je Karte den Kanonen-Mix und das perfekte Spiel im Albtraum-Modus (dt 1/30).
// Die Feinabstimmung der NIGHTMARE-Werte macht der Mensch beim eigenen Testen; die Grenzen hier sind bewusst grob.
// B-189 (28.11.): Albtraum gewollt schwerer. Erster Versuch (hpFactor 1.4 ab Welle 1, rewardFactor 0.8) war im
// Spieltest des Menschen zu schwer; jetzt gestuft (hpSteps: Welle 8-11 mal 1.2, ab 12 mal 1.4, rewardFactor 1,
// Elite ab Welle 8 mit einem mehr). Die Skript-Strategien unterschätzen menschliches Spiel. Messung Welle/Leben
// vorher (B-186) -> erster Versuch -> jetzt:
//   Karte    Kanonen-Mix            perfektes Spiel
//   meadow   16/0 -> 3/0 -> 12/0    19/0 -> 3/0 -> 15/0
//   ice      15/0 -> 3/0 -> 12/0    20/0 -> 3/0 -> 15/0
//   fork     16/0 -> 3/0 -> 13/0    20/5 (gewonnen) -> 3/0 -> 15/0
//   twin     16/0 -> 5/0 -> 11/0    20/0 -> 3/0 -> 15/0
//   volcano  10/0 -> 5/0 -> 10/0    20/0 -> 5/0 -> 10/0
// Grenzen: Kanonen-Mix scheitert, perfektes Spiel übersteht mindestens die Wellen 1-7 (dort wie bisher).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strategyRun, perfectRun, MIX_CANNON } from './sim.js';

const MAPS_NIGHTMARE = ['meadow', 'ice', 'fork', 'twin', 'volcano'];
const DT = 1 / 30;
const line = (name, s) => `${name} Welle ${s.wave}, ${s.lives} Leben (${s.status === 'won' ? 'gewonnen' : 'verloren'})`;

for (const mapId of MAPS_NIGHTMARE) {
  test(`Albtraum ${mapId}: Kanonen-Mix scheitert, perfektes Spiel übersteht die Wellen 1-7 (dt 1/30)`, (t) => {
    const cannon = strategyRun(MIX_CANNON, DT, mapId, mapId === 'volcano', 'nightmare').state;
    const best = perfectRun(mapId, DT, undefined, 'nightmare').state;
    t.diagnostic(`${line('Kanonen-Mix', cannon)}; ${line('perfektes Spiel', best)}`);
    assert.equal(cannon.mode, 'nightmare');
    // B-189: die stärkste einfache Strategie scheitert im Albtraum (vorher: verliert Leben oder scheitert)
    assert.equal(cannon.status, 'lost', line('Kanonen-Mix', cannon));
    // Angepasstes Spiel mit Aufrüsten und Fähigkeiten übersteht mindestens Welle 7 (gemessen 28.11. nach B-189: Welle 10-15;
    // vorher Grenze Welle 18 bei gemessen 19-20)
    assert.ok(best.status === 'won' || best.wave >= 8, line('perfektes Spiel', best));
  });
}
