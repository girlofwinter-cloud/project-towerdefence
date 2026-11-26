// Tests für den gespeicherten Fortschritt (B-093): Sterne, Rekorde, Freischalten, Laden/Speichern.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START_LIVES, PROGRESS_KEY, STAR_LIVES_SHARE, MAX_WAVES } from '../src/config.js';
import {
  emptyProgress, loadProgress, saveProgress, recordResult, starsFor, isUnlocked, mapProgress, starText, MAP_ORDER,
} from '../src/progress.js';

// Einfacher Fake-Speicher mit getItem/setItem wie localStorage.
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}
const throwingStorage = { getItem() { throw new Error('verboten'); }, setItem() { throw new Error('voll'); } };

test('Konfiguration: Schlüssel und Sterne-Grenzen', () => {
  assert.equal(PROGRESS_KEY, 'td-progress-v1');
  assert.deepEqual(STAR_LIVES_SHARE, [0, 0.5, 1]);
  assert.deepEqual(MAP_ORDER, ['meadow', 'forest', 'ice', 'fork']);
});

test('starsFor: Niederlage 0, Sieg 1 bis 3 nach übrigen Leben', () => {
  assert.equal(starsFor('lost', START_LIVES), 0);
  assert.equal(starsFor('playing', START_LIVES), 0);
  assert.equal(starsFor('won', 1), 1);
  assert.equal(starsFor('won', Math.ceil(START_LIVES / 2) - 1), 1);
  assert.equal(starsFor('won', START_LIVES / 2), 2);
  assert.equal(starsFor('won', START_LIVES - 1), 2);
  assert.equal(starsFor('won', START_LIVES), 3);
});

test('starText: volle und leere Sterne', () => {
  assert.equal(starText(0), '☆☆☆');
  assert.equal(starText(2), '★★☆');
  assert.equal(starText(3), '★★★');
});

test('recordResult: Rekord und Sterne werden nie schlechter', () => {
  const p = emptyProgress();
  let r = recordResult(p, { mapId: 'meadow', status: 'lost', wave: 7, lives: 0 });
  assert.equal(r.newRecord, true);
  assert.equal(r.newStars, false);
  assert.deepEqual(mapProgress(p, 'meadow'), { bestWave: 7, stars: 0 });
  r = recordResult(p, { mapId: 'meadow', status: 'lost', wave: 4, lives: 0 });
  assert.equal(r.newRecord, false);
  assert.equal(mapProgress(p, 'meadow').bestWave, 7);
  r = recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: START_LIVES });
  assert.equal(r.newRecord, true);
  assert.equal(r.newStars, true);
  r = recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 1 });
  assert.equal(r.newRecord, false);
  assert.equal(r.newStars, false);
  assert.deepEqual(mapProgress(p, 'meadow'), { bestWave: MAX_WAVES, stars: 3 });
});

test('Freischalten: Reihenfolge meadow, forest, ice, fork', () => {
  const p = emptyProgress();
  assert.equal(isUnlocked(p, 'meadow'), true);
  assert.equal(isUnlocked(p, 'forest'), false);
  assert.equal(isUnlocked(p, 'unbekannt'), false);
  // Niederlage schaltet nichts frei
  assert.equal(recordResult(p, { mapId: 'meadow', status: 'lost', wave: 19, lives: 0 }).unlockedMap, null);
  assert.equal(isUnlocked(p, 'forest'), false);
  // Sieg schaltet genau die nächste Karte frei, nur beim ersten Mal gemeldet
  assert.equal(recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 3 }).unlockedMap, 'forest');
  assert.equal(recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 10 }).unlockedMap, null);
  assert.equal(isUnlocked(p, 'forest'), true);
  assert.equal(isUnlocked(p, 'ice'), false);
  assert.equal(recordResult(p, { mapId: 'forest', status: 'won', wave: MAX_WAVES, lives: 1 }).unlockedMap, 'ice');
  assert.equal(recordResult(p, { mapId: 'ice', status: 'won', wave: MAX_WAVES, lives: 1 }).unlockedMap, 'fork');
  // Letzte Karte schaltet nichts mehr frei
  assert.equal(recordResult(p, { mapId: 'fork', status: 'won', wave: MAX_WAVES, lives: 1 }).unlockedMap, null);
  // Unbekannte Karte wird ignoriert
  assert.deepEqual(recordResult(p, { mapId: 'mond', status: 'won', wave: 20, lives: 10 }), { newRecord: false, newStars: false, unlockedMap: null });
  assert.equal('mond' in p.maps, false);
});

test('Laden/Speichern mit Fake-Speicher: Rundreise', () => {
  const s = fakeStorage();
  assert.deepEqual(loadProgress(s), emptyProgress());
  const p = emptyProgress();
  recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 6 });
  assert.equal(saveProgress(s, p), true);
  assert.ok(typeof s.data[PROGRESS_KEY] === 'string');
  const back = loadProgress(s);
  assert.deepEqual(back, p);
  assert.equal(isUnlocked(back, 'forest'), true);
});

test('Robustheit: kaputte, fremde und falsch typisierte Daten ergeben leeren bzw. bereinigten Fortschritt', () => {
  for (const raw of ['{kaputt', 'null', '42', '"text"', '[]', '{"maps":[]}', '{"maps":"x"}']) {
    assert.deepEqual(loadProgress(fakeStorage({ [PROGRESS_KEY]: raw })), emptyProgress(), raw);
  }
  const mixed = JSON.stringify({ maps: {
    meadow: { bestWave: 'viel', stars: 99 },
    forest: null,
    mond: { bestWave: 5, stars: 3 },
    ice: { bestWave: -3, stars: NaN },
  } });
  const p = loadProgress(fakeStorage({ [PROGRESS_KEY]: mixed }));
  assert.deepEqual(p, { maps: { meadow: { bestWave: 0, stars: 3 }, ice: { bestWave: 0, stars: 0 } } });
  // Prototyp-Schlüssel werden nicht als Karte gelesen
  const proto = loadProgress(fakeStorage({ [PROGRESS_KEY]: '{"maps":{"__proto__":{"bestWave":5}}}' }));
  assert.deepEqual(proto, emptyProgress());
});

test('Robustheit: werfender oder fehlender Speicher stürzt nicht ab', () => {
  assert.deepEqual(loadProgress(throwingStorage), emptyProgress());
  assert.deepEqual(loadProgress(null), emptyProgress());
  assert.equal(saveProgress(throwingStorage, emptyProgress()), false);
  assert.equal(saveProgress(null, emptyProgress()), false);
});
