// B-186: Albtraum-Balancing (grob). Misst je Karte den Kanonen-Mix und das perfekte Spiel im Albtraum-Modus (dt 1/30).
// Die Feinabstimmung der NIGHTMARE-Werte macht der Mensch beim eigenen Testen; die Grenzen hier sind bewusst grob.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NIGHTMARE } from '../../src/config.js';
import { strategyRun, perfectRun, MIX_CANNON } from './sim.js';

const MAPS_NIGHTMARE = ['meadow', 'ice', 'fork', 'twin', 'volcano'];
const DT = 1 / 30;
const line = (name, s) => `${name} Welle ${s.wave}, ${s.lives} Leben (${s.status === 'won' ? 'gewonnen' : 'verloren'})`;

for (const mapId of MAPS_NIGHTMARE) {
  test(`Albtraum ${mapId}: Kanonen-Mix verliert Leben, perfektes Spiel kommt weit (dt 1/30)`, (t) => {
    const cannon = strategyRun(MIX_CANNON, DT, mapId, mapId === 'volcano', 'nightmare').state;
    const best = perfectRun(mapId, DT, undefined, 'nightmare').state;
    t.diagnostic(`${line('Kanonen-Mix', cannon)}; ${line('perfektes Spiel', best)}`);
    assert.equal(cannon.mode, 'nightmare');
    // Messlatte des Menschen: die stärkste einfache Strategie verliert im Albtraum Leben oder scheitert
    assert.ok(cannon.status === 'lost' || cannon.lives < NIGHTMARE.lives, line('Kanonen-Mix', cannon));
    // Angepasstes Spiel mit Aufrüsten und Fähigkeiten kommt bis in die letzten Wellen (gemessen 28.11.: Welle 19-20)
    assert.ok(best.status === 'won' || best.wave >= 18, line('perfektes Spiel', best));
  });
}
