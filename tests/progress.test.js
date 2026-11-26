// Tests für den gespeicherten Fortschritt (B-093): Sterne, Rekorde, Freischalten, Laden/Speichern.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START_LIVES, PROGRESS_KEY, STAR_LIVES_SHARE, MAX_WAVES } from '../src/config.js';
import {
  emptyProgress, loadProgress, saveProgress, recordResult, starsFor, isUnlocked, mapProgress, starText, resultLines, MAP_ORDER, startMap, sanitizeProgress,
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
  // Grenze für 2 Sterne aus der Konfiguration (gilt auch bei ungeradem START_LIVES)
  const twoStars = Math.ceil(STAR_LIVES_SHARE[1] * START_LIVES);
  assert.equal(starsFor('won', twoStars - 1), 1);
  assert.equal(starsFor('won', twoStars), 2);
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

// Tester B-093: gezielte Randfälle
test('Tester B-093: Leben über START_LIVES geben 3 Sterne, negative Leben bei Sieg 1 Stern', () => {
  assert.equal(starsFor('won', START_LIVES + 5), STAR_LIVES_SHARE.length);
  assert.equal(starsFor('won', -3), 1);
  assert.equal(starsFor('won', START_LIVES - 1), 2);
  assert.equal(starsFor('lost', START_LIVES), 0);
  assert.equal(starsFor('playing', START_LIVES), 0);
});

test('Tester B-093: Welle negativ/NaN/Infinity zählt als 0, Gleichstand ist kein neuer Rekord', () => {
  const p = emptyProgress();
  for (const wave of [-4, NaN, Infinity, undefined, '7']) {
    const r = recordResult(p, { mapId: MAP_ORDER[0], status: 'lost', wave, lives: 0 });
    assert.equal(r.newRecord, false);
    assert.equal(mapProgress(p, MAP_ORDER[0]).bestWave, 0);
  }
  recordResult(p, { mapId: MAP_ORDER[0], status: 'lost', wave: 5, lives: 0 });
  const tie = recordResult(p, { mapId: MAP_ORDER[0], status: 'lost', wave: 5, lives: 0 });
  assert.equal(tie.newRecord, false);
  assert.equal(recordResult(p, { mapId: MAP_ORDER[0], status: 'lost', wave: 6, lives: 0 }).newRecord, true);
});

test('Tester B-093: unbekannte mapId ändert nichts, Freischalten nur einmal gemeldet', () => {
  const p = emptyProgress();
  const r = recordResult(p, { mapId: 'gibtsnicht', status: 'won', wave: MAX_WAVES, lives: START_LIVES });
  assert.deepEqual(r, { newRecord: false, newStars: false, unlockedMap: null });
  assert.deepEqual(p, emptyProgress());
  assert.equal(isUnlocked(p, 'gibtsnicht'), false);
  const first = recordResult(p, { mapId: MAP_ORDER[0], status: 'won', wave: MAX_WAVES, lives: 1 });
  assert.equal(first.unlockedMap, MAP_ORDER[1]);
  const again = recordResult(p, { mapId: MAP_ORDER[0], status: 'won', wave: MAX_WAVES, lives: START_LIVES });
  assert.equal(again.unlockedMap, null);
  assert.equal(again.newStars, true);
  // Niederlage auf gesperrter Karte schaltet nichts frei; letzte Karte hat keine Nachfolgerin
  const last = MAP_ORDER[MAP_ORDER.length - 1];
  assert.equal(recordResult(p, { mapId: last, status: 'won', wave: MAX_WAVES, lives: START_LIVES }).unlockedMap, null);
});

test('Tester B-093: Speicherinhalt null/Array/Zahl/String und Eintrag mit Unsinn stürzen nicht ab', () => {
  for (const text of ['null', '[]', '[1,2]', '42', '"x"', 'true', '{"maps":null}', '{"maps":[]}', '{"maps":5}']) {
    const s = { getItem: () => text, setItem() {} };
    assert.deepEqual(loadProgress(s), emptyProgress(), text);
  }
  const s = { getItem: () => null, setItem() {} };
  assert.deepEqual(loadProgress(s), emptyProgress());
  const id = MAP_ORDER[0];
  const weird = JSON.stringify({ maps: { [id]: { bestWave: 3.9, stars: 99 }, [MAP_ORDER[1]]: [1, 2], __proto__x: {} } });
  const p = loadProgress({ getItem: () => weird, setItem() {} });
  assert.deepEqual(mapProgress(p, id), { bestWave: 3, stars: STAR_LIVES_SHARE.length });
  assert.equal(starText(99), starText(STAR_LIVES_SHARE.length));
  assert.equal(starText(-1), starText(0));
  // saveProgress mit kaputtem Fortschritt wirft nicht
  assert.equal(saveProgress({ setItem() {} }, null), true);
});

// ---------- B-094: Meldungen am Spielende ----------
// Spielt ein Ergebnis wie main.js: Vorher-Stand merken, eintragen, Zeilen bauen.
function play(p, result) {
  const before = { ...mapProgress(p, result.mapId) };
  return resultLines(p, result.mapId, recordResult(p, result), before);
}

test('resultLines: erstes Spiel mit früher Niederlage meldet keinen neuen Rekord', () => {
  const p = emptyProgress();
  assert.deepEqual(play(p, { mapId: 'meadow', status: 'lost', wave: 2, lives: 0 }), ['Rekord: Welle 2 · ☆☆☆']);
});

test('resultLines: späteres besseres Ergebnis meldet „Neuer Rekord!“, gleiches nicht', () => {
  const p = emptyProgress();
  play(p, { mapId: 'meadow', status: 'lost', wave: 4, lives: 0 });
  assert.deepEqual(play(p, { mapId: 'meadow', status: 'lost', wave: 6, lives: 0 }), ['Rekord: Welle 6 · ☆☆☆', 'Neuer Rekord!']);
  assert.deepEqual(play(p, { mapId: 'meadow', status: 'lost', wave: 6, lives: 0 }), ['Rekord: Welle 6 · ☆☆☆']);
});

test('resultLines: erster Sieg meldet Sterne und Freischaltung, ohne „Neuer Rekord!“', () => {
  const p = emptyProgress();
  assert.deepEqual(play(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 1 }), [
    `Rekord: Welle ${MAX_WAVES} · ★☆☆`, 'Neue Sterne!', 'Neue Karte freigeschaltet: Wald',
  ]);
});

test('resultLines: mehr Sterne bei gleichem Rekord melden nur „Neue Sterne“', () => {
  const p = emptyProgress();
  play(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 1 });
  assert.deepEqual(play(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: START_LIVES }), [
    `Rekord: Welle ${MAX_WAVES} · ★★★`, 'Neue Sterne!',
  ]);
  // Weniger Sterne als bisher: keine Meldung, Bestwert bleibt
  assert.deepEqual(play(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 1 }), [`Rekord: Welle ${MAX_WAVES} · ★★★`]);
});

test('resultLines: Niederlage nach Rekord aus früherem Spiel meldet Rekord, ohne Vorher-Stand keine Rekordmeldung', () => {
  const p = emptyProgress();
  play(p, { mapId: 'forest', status: 'lost', wave: 3, lives: 0 });
  const res = recordResult(p, { mapId: 'forest', status: 'lost', wave: 9, lives: 0 });
  assert.deepEqual(resultLines(p, 'forest', res), ['Rekord: Welle 9 · ☆☆☆']);
});

// ---------- B-098: Startkarte merken ----------
const won = (...ids) => ({ maps: Object.fromEntries(ids.map((id) => [id, { bestWave: MAX_WAVES, stars: 1 }])) });

test('startMap: leer und nur Wiese gespielt → erste Karte', () => {
  assert.equal(startMap(emptyProgress()), 'meadow');
  assert.equal(startMap({ maps: { meadow: { bestWave: 5, stars: 0 } } }), 'meadow');
  assert.equal(startMap(null), 'meadow');
});

test('startMap: Wiese und Wald geschafft → neueste freigeschaltete Karte', () => {
  assert.equal(startMap(won('meadow')), 'forest');
  assert.equal(startMap(won('meadow', 'forest')), 'ice');
  assert.equal(startMap(won(...MAP_ORDER)), MAP_ORDER.at(-1));
});

test('startMap: freigeschaltete lastMap wird genommen', () => {
  assert.equal(startMap({ ...won('meadow', 'forest'), lastMap: 'meadow' }), 'meadow');
  assert.equal(startMap({ ...won('meadow', 'forest'), lastMap: 'forest' }), 'forest');
});

test('startMap: gesperrte, unbekannte oder kaputte lastMap → Rückfall', () => {
  assert.equal(startMap({ ...won('meadow'), lastMap: 'fork' }), 'forest');
  assert.equal(startMap({ ...emptyProgress(), lastMap: 'ice' }), 'meadow');
  for (const bad of ['mars', '', 42, null, {}, ['forest'], '__proto__']) {
    assert.equal(startMap({ ...won('meadow'), lastMap: bad }), 'forest', String(bad));
  }
});

test('sanitizeProgress/Laden: lastMap bleibt nur bei bekannter Karte, alte Stände laden weiter', () => {
  assert.equal(sanitizeProgress({ maps: {}, lastMap: 'ice' }).lastMap, 'ice');
  for (const bad of ['mars', 7, null, ['ice'], 'toString']) {
    assert.equal('lastMap' in sanitizeProgress({ maps: {}, lastMap: bad }), false, String(bad));
  }
  // Alter Stand ohne lastMap (B-093): unverändert, Start auf der neuesten freigeschalteten Karte
  const old = fakeStorage({ [PROGRESS_KEY]: JSON.stringify({ maps: { meadow: { bestWave: MAX_WAVES, stars: 2 } } }) });
  const p = loadProgress(old);
  assert.deepEqual(p, { maps: { meadow: { bestWave: MAX_WAVES, stars: 2 } } });
  assert.equal(startMap(p), 'forest');
  // Rundreise mit lastMap
  const s = fakeStorage();
  assert.equal(saveProgress(s, { ...p, lastMap: 'meadow' }), true);
  assert.equal(loadProgress(s).lastMap, 'meadow');
  assert.equal(startMap(loadProgress(s)), 'meadow');
});

test('recordResult (B-098): Freischalten löscht lastMap, nächster Start auf der neuen Karte', () => {
  const p = { ...emptyProgress(), lastMap: 'meadow' };
  assert.equal(startMap(p), 'meadow');
  // Niederlage schaltet nichts frei: lastMap bleibt
  recordResult(p, { mapId: 'meadow', status: 'lost', wave: 3, lives: 0 });
  assert.equal(p.lastMap, 'meadow');
  const r = recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: START_LIVES });
  assert.equal(r.unlockedMap, 'forest');
  assert.equal('lastMap' in p, false);
  assert.equal(startMap(p), 'forest');
});
