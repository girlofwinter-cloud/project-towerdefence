// Tests für den gespeicherten Fortschritt (B-093): Sterne, Rekorde, Freischalten, Laden/Speichern.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START_LIVES, PROGRESS_KEY, STAR_LIVES_SHARE, MAX_WAVES } from '../src/config.js';
import {
  emptyProgress, loadProgress, saveProgress, recordResult, starsFor, isUnlocked, mapProgress, starText, resultLines, MAP_ORDER, startMap, sanitizeProgress, mapAfterResult,
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

test('B-030 Randfall (Tester): alter Spielstand ohne volcano lädt; Vulkan offen genau dann, wenn twin gewonnen', () => {
  const old = (twinStars) => fakeStorage({ [PROGRESS_KEY]: JSON.stringify({ maps: { meadow: { stars: 3, bestWave: MAX_WAVES }, ice: { stars: 2, bestWave: MAX_WAVES }, fork: { stars: 1, bestWave: MAX_WAVES }, twin: { stars: twinStars, bestWave: twinStars ? MAX_WAVES : 7 } }, lastMap: 'twin' }) });
  const won = loadProgress(old(1));
  assert.equal(mapProgress(won, 'volcano').stars, 0);
  assert.equal(isUnlocked(won, 'volcano'), true);
  assert.equal(startMap(won), 'twin', 'zuletzt gewählte Karte bleibt');
  const notYet = loadProgress(old(0));
  assert.equal(isUnlocked(notYet, 'volcano'), false);
  assert.equal(startMap(loadProgress(fakeStorage({ [PROGRESS_KEY]: JSON.stringify({ maps: {}, lastMap: 'volcano' }) }))), 'meadow', 'gesperrter Vulkan als lastMap fällt zurück');
});

test('mapAfterResult: Sieg → nächste Karte, sonst gleiche Karte', () => {
  const p = emptyProgress();
  // Niederlage: Karte bleibt
  recordResult(p, { mapId: M0, status: 'lost', wave: 3, lives: 0 });
  assert.equal(mapAfterResult(p, M0, 'lost'), M0);
  // Sieg schaltet frei und wählt die nächste Karte
  recordResult(p, { mapId: M0, status: 'won', wave: MAX_WAVES, lives: START_LIVES });
  assert.equal(mapAfterResult(p, M0, 'won'), M1);
  // Erneuter Sieg auf schon geschaffter Karte: ebenfalls weiter
  assert.equal(mapAfterResult(p, M0, 'won'), M1);
  // Nächste Karte noch gesperrt (kein Stern eingetragen): Karte bleibt
  assert.equal(mapAfterResult(emptyProgress(), M0, 'won'), M0);
  // Letzte Karte und unbekannte Karte: bleibt
  const last = MAP_ORDER.at(-1);
  assert.equal(mapAfterResult(won(...MAP_ORDER), last, 'won'), last);
  assert.equal(mapAfterResult(p, 'gibtsnicht', 'won'), 'gibtsnicht');
});

// ---------- B-182: Albtraum-Modus ----------
import { isNightmareUnlocked, nightmareProgress, nightmareResultLines } from '../src/progress.js';

test('B-182: Albtraum erst bei allen Sternen im Normalmodus', () => {
  const p = emptyProgress();
  assert.equal(isNightmareUnlocked(p, 'meadow'), false);
  recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 1 });
  assert.equal(isNightmareUnlocked(p, 'meadow'), false, 'weniger als alle Sterne');
  recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: START_LIVES });
  assert.equal(mapProgress(p, 'meadow').stars, STAR_LIVES_SHARE.length);
  assert.equal(isNightmareUnlocked(p, 'meadow'), true);
  assert.equal(isNightmareUnlocked(p, 'ice'), false);
  assert.equal(isNightmareUnlocked(p, 'mond'), false);
});

test('B-182: Albtraum-Ergebnisse überschreiben keine Normal-Rekorde oder -Sterne', () => {
  const p = emptyProgress();
  recordResult(p, { mapId: 'meadow', status: 'lost', wave: 4, lives: 0 });
  const normal = structuredClone(p.maps);
  const r = recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 5, mode: 'nightmare' });
  assert.deepEqual(p.maps, normal);
  assert.deepEqual(r, { newRecord: true, newStars: false, unlockedMap: null });
  assert.equal(isUnlocked(p, 'ice'), false, 'kein Freischalten über den Albtraum');
  assert.deepEqual(nightmareProgress(p, 'meadow'), { bestWave: MAX_WAVES });
  // Rekord wird nie schlechter
  assert.equal(recordResult(p, { mapId: 'meadow', status: 'lost', wave: 3, lives: 0, mode: 'nightmare' }).newRecord, false);
  assert.equal(nightmareProgress(p, 'meadow').bestWave, MAX_WAVES);
  assert.deepEqual(nightmareProgress(p, 'ice'), { bestWave: 0 });
});

test('B-182: alte Spielstände ohne Albtraum laden weiter, Albtraum-Bereich übersteht Speichern', () => {
  const old = fakeStorage({ [PROGRESS_KEY]: JSON.stringify({ maps: { meadow: { bestWave: 20, stars: 3 } } }) });
  const p = loadProgress(old);
  assert.deepEqual(p, { maps: { meadow: { bestWave: 20, stars: 3 } } });
  assert.equal(isNightmareUnlocked(p, 'meadow'), true);
  recordResult(p, { mapId: 'meadow', status: 'lost', wave: 7, lives: 0, mode: 'nightmare' });
  const s = fakeStorage();
  saveProgress(s, p);
  assert.deepEqual(loadProgress(s), p);
  // kaputte Albtraum-Daten fallen weg
  const bad = sanitizeProgress({ maps: {}, nightmare: { meadow: { bestWave: -1 }, mond: { bestWave: 3 }, ice: 'x', twin: { bestWave: 2.7 } } });
  assert.deepEqual(bad, { maps: {}, nightmare: { twin: { bestWave: 2 } } });
  assert.deepEqual(sanitizeProgress({ maps: {}, nightmare: [] }), emptyProgress());
});

test('B-182: Overlay-Texte nach einem Albtraum-Spiel', () => {
  const p = emptyProgress();
  const r1 = recordResult(p, { mapId: 'meadow', status: 'lost', wave: 5, lives: 0, mode: 'nightmare' });
  assert.deepEqual(nightmareResultLines(p, 'meadow', r1), ['Albtraum-Rekord: Welle 5']);
  const before = { ...nightmareProgress(p, 'meadow') };
  const r2 = recordResult(p, { mapId: 'meadow', status: 'lost', wave: 8, lives: 0, mode: 'nightmare' });
  assert.deepEqual(nightmareResultLines(p, 'meadow', r2, before), ['Albtraum-Rekord: Welle 8', 'Neuer Rekord!']);
});

// ---------- B-183: Albtraum-Abzeichen ----------
import { nightmareBadgeFor, badgeCount, BADGE_MAX } from '../src/progress.js';
import { BADGE_TIERS, NIGHTMARE, MAPS } from '../src/config.js';

test('B-183: nightmareBadgeFor je Stufe erfüllt und verletzt', () => {
  const max = NIGHTMARE.lives;
  assert.equal(nightmareBadgeFor('lost', max, max, true), 0, 'verloren: kein Abzeichen');
  assert.equal(nightmareBadgeFor('playing', max, max, true), 0);
  assert.equal(nightmareBadgeFor('won', max - 1, max, true), 1, 'Leben verloren: nur Bronze, auch mit Gold-Bedingung');
  assert.equal(nightmareBadgeFor('won', 1, max, false), 1);
  assert.equal(nightmareBadgeFor('won', max, max, false), 2, 'ohne Lebensverlust, Bedingung verletzt: Silber');
  assert.equal(nightmareBadgeFor('won', max, max, true), 3, 'Silber plus Bedingung: Gold');
  assert.equal(nightmareBadgeFor('won', NaN, max, true), 1, 'ungültige Leben zählen nicht als voll');
  assert.deepEqual(BADGE_TIERS, ['Bronze', 'Silber', 'Gold']);
});

test('B-183: Abzeichen wird gespeichert und nur verbessert', () => {
  const p = emptyProgress();
  const nm = (status, lives, goldOk) => recordResult(p, { mapId: 'meadow', status, wave: MAX_WAVES, lives, mode: 'nightmare', goldOk, maxLives: 5 });
  assert.equal(nm('lost', 0, true).newBadge, 0);
  assert.equal(nightmareProgress(p, 'meadow').badge, undefined);
  assert.equal(nm('won', 5, false).newBadge, 2);
  assert.equal(nightmareProgress(p, 'meadow').badge, 2);
  assert.equal(nm('won', 2, true).newBadge, 0, 'Bronze verschlechtert Silber nicht');
  assert.equal(nightmareProgress(p, 'meadow').badge, 2);
  assert.equal(nm('won', 5, true).newBadge, 3);
  assert.equal(nightmareProgress(p, 'meadow').badge, 3);
  assert.equal(nm('lost', 0, false).newBadge, 0);
  assert.equal(nightmareProgress(p, 'meadow').badge, 3);
  // Normalmodus und Albtraum ohne goldOk bewerten keine Abzeichen
  assert.equal('newBadge' in recordResult(p, { mapId: 'ice', status: 'won', wave: MAX_WAVES, lives: START_LIVES }), false);
  assert.equal(p.maps.ice.badge, undefined);
  // Standard-Höchstleben im Albtraum: NIGHTMARE.lives
  assert.equal(recordResult(p, { mapId: 'ice', status: 'won', wave: MAX_WAVES, lives: NIGHTMARE.lives, mode: 'nightmare', goldOk: false }).newBadge, 2);
});

test('B-183: Abzeichen überstehen Speichern, alte Stände ohne badge laden, ungültige Werte begrenzt', () => {
  const old = fakeStorage({ [PROGRESS_KEY]: JSON.stringify({ maps: { meadow: { bestWave: 20, stars: 3 } }, nightmare: { meadow: { bestWave: 12 } } }) });
  const p = loadProgress(old);
  assert.deepEqual(p.nightmare, { meadow: { bestWave: 12 } });
  assert.equal(badgeCount(p), 0);
  recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 5, mode: 'nightmare', goldOk: true, maxLives: 5 });
  const s = fakeStorage();
  saveProgress(s, p);
  assert.deepEqual(loadProgress(s).nightmare.meadow, { bestWave: MAX_WAVES, badge: 3 });
  const bad = sanitizeProgress({ maps: {}, nightmare: {
    meadow: { bestWave: 20, badge: 9 }, ice: { bestWave: 20, badge: -1 }, fork: { bestWave: 20, badge: 'x' }, twin: { bestWave: 20, badge: 1.8 },
  } });
  assert.deepEqual(bad.nightmare, { meadow: { bestWave: 20, badge: 3 }, ice: { bestWave: 20 }, fork: { bestWave: 20 }, twin: { bestWave: 20, badge: 1 } });
});

test('B-183: badgeCount zählt jede Stufe, Maximum Kartenzahl × 3', () => {
  assert.equal(BADGE_MAX, Object.keys(MAPS).length * 3);
  assert.equal(badgeCount(emptyProgress()), 0);
  const p = sanitizeProgress({ maps: {}, nightmare: { meadow: { bestWave: 20, badge: 3 }, ice: { bestWave: 20, badge: 1 }, fork: { bestWave: 9 } } });
  assert.equal(badgeCount(p), 4);
  const all = sanitizeProgress({ maps: {}, nightmare: Object.fromEntries(Object.keys(MAPS).map((id) => [id, { bestWave: 20, badge: 3 }])) });
  assert.equal(badgeCount(all), BADGE_MAX);
});

test('B-183: Ergebnistext nennt erreichtes und neues Abzeichen', () => {
  const p = emptyProgress();
  const r1 = recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 5, mode: 'nightmare', goldOk: false, maxLives: 5 });
  assert.deepEqual(nightmareResultLines(p, 'meadow', r1), [`Albtraum-Rekord: Welle ${MAX_WAVES} · Abzeichen: Silber`, 'Neues Abzeichen: Silber!']);
  const before = { ...nightmareProgress(p, 'meadow') };
  const r2 = recordResult(p, { mapId: 'meadow', status: 'won', wave: MAX_WAVES, lives: 3, mode: 'nightmare', goldOk: true, maxLives: 5 });
  assert.deepEqual(nightmareResultLines(p, 'meadow', r2, before), [`Albtraum-Rekord: Welle ${MAX_WAVES} · Abzeichen: Silber`]);
});

// ---------- B-185: Kosmetik-Belohnungen ----------
import { COSMETICS } from '../src/config.js';
import { isNightUnlocked, isGoldTowersUnlocked, goldMapsProgress, setNightLook, setGoldTowers, activeCosmetics } from '../src/cosmetics.js';
import { createGame, buildTower, startWave, stepGame } from '../src/game.js';
import { freeTileNearPath } from './helpers.js';

const GOLD_BADGE = BADGE_TIERS.length;
function withBadges(badges) {
  const p = emptyProgress();
  p.nightmare = {};
  for (const [id, badge] of Object.entries(badges)) p.nightmare[id] = { bestWave: MAX_WAVES, badge };
  return p;
}
const allGold = () => withBadges(Object.fromEntries(MAP_ORDER.map((id) => [id, GOLD_BADGE])));

test('B-185: Kosmetik-Definitionen mit deutschen Namen', () => {
  assert.equal(COSMETICS.night.name, 'Nacht-Look');
  assert.equal(COSMETICS.goldTowers.name, 'Goldene Türme');
});

test('B-185: ohne Gold keine Freischaltung', () => {
  for (const p of [emptyProgress(), withBadges({ meadow: 1, ice: 2 })]) {
    for (const id of MAP_ORDER) assert.equal(isNightUnlocked(p, id), false, id);
    assert.equal(isGoldTowersUnlocked(p), false);
  }
  assert.deepEqual(goldMapsProgress(emptyProgress()), { done: 0, total: 5 });
  assert.equal(isNightUnlocked(allGold(), 'forest'), false); // unbekannte Karte
});

test('B-185: Gold auf einer Karte schaltet nur deren Nacht-Look frei', () => {
  const p = withBadges({ ice: GOLD_BADGE, meadow: 2 });
  assert.deepEqual(MAP_ORDER.filter((id) => isNightUnlocked(p, id)), ['ice']);
  assert.equal(isGoldTowersUnlocked(p), false);
  assert.deepEqual(goldMapsProgress(p), { done: 1, total: 5 });
});

test('B-185: Gold auf allen Karten schaltet goldene Türme frei, vier reichen nicht', () => {
  const four = withBadges(Object.fromEntries(MAP_ORDER.slice(0, 4).map((id) => [id, GOLD_BADGE])));
  assert.deepEqual(goldMapsProgress(four), { done: 4, total: 5 });
  assert.equal(isGoldTowersUnlocked(four), false);
  assert.deepEqual(goldMapsProgress(allGold()), { done: 5, total: 5 });
  assert.equal(isGoldTowersUnlocked(allGold()), true);
});

test('B-185: an- und abschalten nur wenn freigeschaltet; abgeschaltet bleibt frei', () => {
  const p = withBadges({ ice: GOLD_BADGE });
  assert.equal(setNightLook(p, 'meadow', true), false);
  assert.equal(setGoldTowers(p, true), false);
  assert.equal(p.cosmetics, undefined); // unverändert
  assert.deepEqual(activeCosmetics(p, 'ice'), { night: true, goldTowers: false }); // B-185 Entscheidung: frei und nie abgeschaltet = an
  assert.equal(setNightLook(p, 'ice', true), true);
  assert.deepEqual(activeCosmetics(p, 'ice'), { night: true, goldTowers: false });
  assert.deepEqual(activeCosmetics(p, 'meadow'), { night: false, goldTowers: false });
  assert.equal(setNightLook(p, 'ice', false), true);
  assert.deepEqual(activeCosmetics(p, 'ice'), { night: false, goldTowers: false });
  assert.equal(isNightUnlocked(p, 'ice'), true);
  const g = allGold();
  assert.equal(setGoldTowers(g, true), true);
  assert.deepEqual(activeCosmetics(g, 'volcano'), { night: true, goldTowers: true }); // Nacht-Look nie abgeschaltet = an (B-185 Entscheidung)
  assert.equal(setGoldTowers(g, false), true);
  assert.equal(isGoldTowersUnlocked(g), true);
  assert.deepEqual(activeCosmetics(undefined, 'ice'), { night: false, goldTowers: false });
});

test('B-185: gewählt, aber nicht freigeschaltet (z. B. manipulierter Speicher) ist nicht aktiv', () => {
  const p = sanitizeProgress({ maps: {}, cosmetics: { night: { meadow: true }, goldTowers: true } });
  assert.deepEqual(activeCosmetics(p, 'meadow'), { night: false, goldTowers: false });
});

test('B-185: sanitizeProgress säubert den Kosmetik-Bereich, alte Stände ohne Bereich laden', () => {
  const old = loadProgress(fakeStorage({ [PROGRESS_KEY]: JSON.stringify({ maps: { meadow: { bestWave: 3, stars: 1 } } }) }));
  assert.equal(old.cosmetics, undefined);
  assert.deepEqual(activeCosmetics(old, 'meadow'), { night: false, goldTowers: false });
  const dirty = sanitizeProgress({ maps: {}, cosmetics: { night: { meadow: true, ice: 'ja', forest: true, __proto__: { twin: true } }, goldTowers: 1, extra: 5 } });
  assert.deepEqual(dirty.cosmetics, { night: { meadow: true } }); // ungültiges goldTowers fällt weg (= Default an)
  assert.equal(sanitizeProgress({ maps: {}, cosmetics: [] }).cosmetics, undefined);
  assert.deepEqual(sanitizeProgress({ maps: {}, cosmetics: { night: [true] } }).cosmetics, { night: {} });
  assert.deepEqual(sanitizeProgress({ maps: {}, cosmetics: { goldTowers: false } }).cosmetics, { night: {}, goldTowers: false }, 'bewusstes Aus bleibt');
});

test('B-185: Auswahl bleibt nach Speichern und Laden erhalten', () => {
  const p = allGold();
  setGoldTowers(p, true);
  setNightLook(p, 'fork', true);
  setNightLook(p, 'ice', false);
  const s = fakeStorage();
  assert.equal(saveProgress(s, p), true);
  const loaded = loadProgress(s);
  assert.deepEqual(loaded.cosmetics, { night: { fork: true, ice: false }, goldTowers: true });
  assert.deepEqual(activeCosmetics(loaded, 'fork'), { night: true, goldTowers: true });
  assert.deepEqual(activeCosmetics(loaded, 'ice'), { night: false, goldTowers: true });
});

test('B-185: Kosmetik ändert keine Spielwerte (createGame kennt sie nicht)', () => {
  const sim = () => {
    const state = createGame({ mapId: 'meadow', mode: 'nightmare' });
    const [c, r] = freeTileNearPath(state);
    buildTower(state, 'arrow', c, r);
    startWave(state);
    for (let i = 0; i < 600; i++) stepGame(state, 1 / 60);
    return state;
  };
  const plain = sim();
  const p = allGold();
  setGoldTowers(p, true);
  setNightLook(p, 'meadow', true);
  assert.deepEqual(activeCosmetics(p, 'meadow'), { night: true, goldTowers: true });
  const cosmetic = sim();
  assert.equal('cosmetics' in cosmetic, false);
  const snap = (s) => ({ gold: s.gold, lives: s.lives, wave: s.wave, enemies: s.enemies.length, towers: s.towers.map((t) => ({ ...t })) });
  assert.deepEqual(snap(cosmetic), snap(plain));
});

test('B-185: frisch freigeschaltete Belohnung ist sofort an, bewusstes Aus bleibt nach Neuladen aus', () => {
  // Nacht-Look: Gold auf einer Karte, noch nie etwas gewählt
  const p = withBadges({ ice: GOLD_BADGE });
  assert.equal(p.cosmetics, undefined);
  assert.deepEqual(activeCosmetics(p, 'ice'), { night: true, goldTowers: false });
  // fünfte Gold-Karte: goldene Türme sofort an, auf allen Karten auch der Nacht-Look
  const g = allGold();
  for (const id of MAP_ORDER) assert.deepEqual(activeCosmetics(g, id), { night: true, goldTowers: true }, id);
  // Freischaltung später als die (alte) Auswahl: nur gespeichertes false schaltet ab
  const s = fakeStorage();
  const q = withBadges({ meadow: GOLD_BADGE });
  setNightLook(q, 'meadow', false);
  saveProgress(s, q);
  const back = loadProgress(s);
  assert.deepEqual(activeCosmetics(back, 'meadow'), { night: false, goldTowers: false });
  back.nightmare.ice = { bestWave: MAX_WAVES, badge: GOLD_BADGE }; // neue Gold-Karte nach dem Laden
  assert.deepEqual(activeCosmetics(back, 'ice'), { night: true, goldTowers: false });
  // gespeichert wird nur die bewusste Wahl, kein goldTowers-Feld ohne Eingriff
  assert.equal('goldTowers' in back.cosmetics, false);
  setGoldTowers(g, false);
  saveProgress(s, g);
  assert.deepEqual(activeCosmetics(loadProgress(s), 'meadow'), { night: true, goldTowers: false });
});
