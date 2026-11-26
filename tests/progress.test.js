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
  assert.deepEqual(MAP_ORDER, ['meadow', 'ice', 'fork', 'twin', 'volcano']); // B-098: Wald entfernt, B-099: Zwei Fronten neu, B-030: Vulkan
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

test('Freischalten: Reihenfolge meadow, ice, fork, twin, volcano', () => {
  const p = emptyProgress();
  assert.equal(isUnlocked(p, 'meadow'), true);
  assert.equal(isUnlocked(p, 'ice'), false);
  assert.equal(isUnlocked(p, 'unbekannt'), false);
  // Niederlage schaltet nichts frei
  assert.equal(recordResult(p, { mapId: 'meadow', status: 'lost', wave: 19, lives: 0 }).unlockedMap, null);
  assert.equal(isUnlocked(p, 'ice'), false);
  // Sieg schaltet genau die nächste Karte frei, nur beim ersten Mal gemeldet
  assert.equal(recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 3 }).unlockedMap, 'ice');
  assert.equal(recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 10 }).unlockedMap, null);
  assert.equal(isUnlocked(p, 'ice'), true);
  assert.equal(isUnlocked(p, 'fork'), false);
  assert.equal(recordResult(p, { mapId: 'ice', status: 'won', wave: MAX_WAVES, lives: 1 }).unlockedMap, 'fork');
  assert.equal(recordResult(p, { mapId: 'fork', status: 'won', wave: MAX_WAVES, lives: 1 }).unlockedMap, 'twin');
  assert.equal(isUnlocked(p, 'volcano'), false);
  assert.equal(recordResult(p, { mapId: 'twin', status: 'won', wave: MAX_WAVES, lives: 1 }).unlockedMap, 'volcano'); // B-030
  assert.equal(isUnlocked(p, 'volcano'), true);
  // Letzte Karte schaltet nichts mehr frei
  assert.equal(recordResult(p, { mapId: 'volcano', status: 'won', wave: MAX_WAVES, lives: 1 }).unlockedMap, null);
  // Unbekannte Karte wird ignoriert, auch der entfernte Wald (B-098)
  assert.deepEqual(recordResult(p, { mapId: 'mond', status: 'won', wave: 20, lives: 10 }), { newRecord: false, newStars: false, unlockedMap: null });
  assert.equal('mond' in p.maps, false);
  assert.equal(recordResult(p, { mapId: 'forest', status: 'won', wave: 20, lives: 10 }).unlockedMap, null);
  assert.equal('forest' in p.maps, false);
});

test('Freischalten: alter Spielstand mit Wald-Sieg bleibt gültig, Wald fällt weg (B-098)', () => {
  const s = fakeStorage({ [PROGRESS_KEY]: JSON.stringify({ maps: { meadow: { bestWave: 20, stars: 2 }, forest: { bestWave: 20, stars: 3 } } }) });
  const p = loadProgress(s);
  assert.equal('forest' in p.maps, false);
  assert.equal(isUnlocked(p, 'ice'), true);
  assert.equal(isUnlocked(p, 'fork'), false);
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
  assert.equal(isUnlocked(back, 'ice'), true);
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
    `Rekord: Welle ${MAX_WAVES} · ★☆☆`, 'Neue Sterne!', 'Neue Karte freigeschaltet: Eiswelt',
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
  play(p, { mapId: 'ice', status: 'lost', wave: 3, lives: 0 });
  const res = recordResult(p, { mapId: 'ice', status: 'lost', wave: 9, lives: 0 });
  assert.deepEqual(resultLines(p, 'ice', res), ['Rekord: Welle 9 · ☆☆☆']);
});

// ---------- B-101: Startkarte merken ----------
// Karten über MAP_ORDER-Indizes, damit Änderungen an der Kartenliste die Tests nicht brechen.
const [M0, M1, M2] = MAP_ORDER;
const won = (...ids) => ({ maps: Object.fromEntries(ids.map((id) => [id, { bestWave: MAX_WAVES, stars: 1 }])) });

test('startMap: leer und erste Karte nur gespielt → erste Karte', () => {
  assert.equal(startMap(emptyProgress()), M0);
  assert.equal(startMap({ maps: { [M0]: { bestWave: 5, stars: 0 } } }), M0);
  assert.equal(startMap(null), M0);
});

test('startMap: erste und zweite Karte geschafft → neueste freigeschaltete Karte', () => {
  assert.equal(startMap(won(M0)), M1);
  assert.equal(startMap(won(M0, M1)), M2);
  assert.equal(startMap(won(...MAP_ORDER)), MAP_ORDER.at(-1));
});

test('startMap: freigeschaltete lastMap wird genommen', () => {
  assert.equal(startMap({ ...won(M0, M1), lastMap: M0 }), M0);
  assert.equal(startMap({ ...won(M0, M1), lastMap: M1 }), M1);
});

test('startMap: gesperrte, unbekannte oder kaputte lastMap → Rückfall', () => {
  assert.equal(startMap({ ...won(M0), lastMap: M2 }), M1);
  assert.equal(startMap({ ...emptyProgress(), lastMap: M1 }), M0);
  for (const bad of ['mars', 'forest', '', 42, null, {}, [M1], '__proto__']) {
    assert.equal(startMap({ ...won(M0), lastMap: bad }), M1, String(bad));
  }
});

test('sanitizeProgress/Laden: lastMap bleibt nur bei bekannter Karte, alte Stände laden weiter', () => {
  assert.equal(sanitizeProgress({ maps: {}, lastMap: M1 }).lastMap, M1);
  for (const bad of ['mars', 7, null, [M1], 'toString']) {
    assert.equal('lastMap' in sanitizeProgress({ maps: {}, lastMap: bad }), false, String(bad));
  }
  // Alter Stand ohne lastMap (B-093): unverändert, Start auf der neuesten freigeschalteten Karte
  const old = fakeStorage({ [PROGRESS_KEY]: JSON.stringify({ maps: { [M0]: { bestWave: MAX_WAVES, stars: 2 } } }) });
  const p = loadProgress(old);
  assert.deepEqual(p, { maps: { [M0]: { bestWave: MAX_WAVES, stars: 2 } } });
  assert.equal(startMap(p), M1);
  // Rundreise mit lastMap
  const s = fakeStorage();
  assert.equal(saveProgress(s, { ...p, lastMap: M0 }), true);
  assert.equal(loadProgress(s).lastMap, M0);
  assert.equal(startMap(loadProgress(s)), M0);
});

test('recordResult (B-101): Freischalten löscht lastMap, nächster Start auf der neuen Karte', () => {
  const p = { ...emptyProgress(), lastMap: M0 };
  assert.equal(startMap(p), M0);
  // Niederlage schaltet nichts frei: lastMap bleibt
  recordResult(p, { mapId: M0, status: 'lost', wave: 3, lives: 0 });
  assert.equal(p.lastMap, M0);
  const r = recordResult(p, { mapId: M0, status: 'won', wave: MAX_WAVES, lives: START_LIVES });
  assert.equal(r.unlockedMap, M1);
  assert.equal('lastMap' in p, false);
  assert.equal(startMap(p), M1);
});

// ---------- Tester Block D: Randfälle B-101 ----------
test('sanitizeProgress (B-101 Randfall): __proto__, Objekt-lastMap und Arrays als raw', () => {
  const evil = JSON.parse(`{"maps":{},"lastMap":"__proto__","__proto__":{"lastMap":"${M1}"}}`);
  const p = sanitizeProgress(evil);
  assert.equal('lastMap' in p, false);
  assert.equal({}.lastMap, undefined, 'kein Prototyp verschmutzt');
  assert.equal('lastMap' in sanitizeProgress({ maps: {}, lastMap: { toString: () => M1 } }), false);
  assert.equal('lastMap' in sanitizeProgress([{ lastMap: M1 }]), false);
  assert.equal('lastMap' in sanitizeProgress(M1), false);
  // gesperrte Karte bleibt gespeichert, startMap fällt aber zurück
  const locked = sanitizeProgress({ maps: {}, lastMap: MAP_ORDER.at(-1) });
  assert.equal(locked.lastMap, MAP_ORDER.at(-1));
  assert.equal(startMap(locked), MAP_ORDER[0]);
});

test('startMap (B-101 Randfall): Ergebnis ist immer freigeschaltet, auch wenn Sterne Lücken haben', () => {
  // Dritte Karte geschafft, zweite nicht: Lücke in der Kette
  const p = { maps: { [M0]: { bestWave: MAX_WAVES, stars: 1 }, [M2]: { bestWave: MAX_WAVES, stars: 3 } }, lastMap: M2 };
  const m = startMap(p);
  assert.ok(isUnlocked(p, m), m);
  assert.equal(isUnlocked(p, M2), false, 'gemerkte Karte ist gesperrt');
  assert.notEqual(m, M2);
});
