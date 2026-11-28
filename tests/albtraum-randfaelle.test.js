// Randfälle zum Albtraum-Paket (B-182 bis B-187), ergänzt vom Tester: alte/kaputte Spielstände,
// Abzeichen nie schlechter, Gold-Bedingungen über Verkauf hinweg, Kosmetik nur wenn frei, Musik-Rückfall.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, buildTower, sellTower, useAbility, checkGoldCondition, maxLives } from '../src/game.js';
import { NIGHTMARE, PROGRESS_KEY, MAX_WAVES, SOUND } from '../src/config.js';
import {
  loadProgress, sanitizeProgress, recordResult, isNightmareUnlocked, nightmareProgress, mapProgress, badgeCount, BADGE_MAX, MAP_ORDER,
} from '../src/progress.js';
import { activeCosmetics, isGoldTowersUnlocked, setNightLook } from '../src/cosmetics.js';
import { pickMusicUrl, musicUrl, nightmareMusicUrl } from '../src/sound-events.js';
import { freeTileNearPath } from './helpers.js';

const storage = (raw) => ({ getItem: (k) => (k === PROGRESS_KEY ? raw : null), setItem() {} });
const allStars = () => ({ maps: Object.fromEntries(MAP_ORDER.map((id) => [id, { bestWave: MAX_WAVES, stars: 3 }])) });

test('Randfall: alte und kaputte Spielstände laden ohne Fehler', () => {
  const raws = [
    JSON.stringify({ maps: { meadow: { bestWave: 20, stars: 3 } } }), // alt, ohne nightmare/cosmetics
    JSON.stringify({ maps: {}, nightmare: 'x', cosmetics: [1, 2] }),
    JSON.stringify({ maps: {}, nightmare: [1], cosmetics: { night: 'ja', goldTowers: 'ja' } }),
    JSON.stringify({ maps: {}, nightmare: { meadow: null, ice: 5, fork: { badge: 3 }, mars: { bestWave: 20, badge: 3 } } }),
    JSON.stringify({ maps: {}, nightmare: { meadow: { bestWave: 20, badge: 99 }, ice: { bestWave: 20, badge: -2 }, fork: { bestWave: 'x', badge: 3 } } }),
    '{"maps":{},"nightmare":{"__proto__":{"bestWave":20,"badge":3}},"cosmetics":{"night":{"__proto__":true,"mars":true}}}',
    JSON.stringify({ maps: {}, nightmare: { meadow: { bestWave: Infinity, badge: NaN } } }),
    'null', '42', '{kaputt',
  ];
  for (const raw of raws) {
    const p = loadProgress(storage(raw));
    assert.equal(typeof p, 'object', raw);
    assert.doesNotThrow(() => { badgeCount(p); for (const id of MAP_ORDER) activeCosmetics(p, id); }, raw);
    assert.ok(badgeCount(p) >= 0 && badgeCount(p) <= BADGE_MAX, raw);
  }
  const clamped = sanitizeProgress({ maps: {}, nightmare: { meadow: { bestWave: 20, badge: 99 }, ice: { bestWave: 20, badge: -2 }, fork: { badge: 3 } } });
  assert.equal(nightmareProgress(clamped, 'meadow').badge, 3, 'Abzeichen auf Gold begrenzt');
  assert.equal(nightmareProgress(clamped, 'ice').badge, undefined, 'negatives Abzeichen zählt als keins');
  assert.equal(nightmareProgress(clamped, 'fork').bestWave, 0, 'ohne gültigen Rekord kein Eintrag');
  assert.equal(Object.prototype.bestWave, undefined, 'kein Prototyp-Verschmutzen');
});

test('Randfall: Albtraum-Freischaltung genau bei allen Sternen, unbekannte Karte nie', () => {
  const p = { maps: { meadow: { bestWave: 20, stars: 2 } } };
  assert.equal(isNightmareUnlocked(p, 'meadow'), false);
  p.maps.meadow.stars = 3;
  assert.equal(isNightmareUnlocked(p, 'meadow'), true);
  assert.equal(isNightmareUnlocked(p, 'mars'), false);
  assert.equal(isNightmareUnlocked(p, '__proto__'), false);
});

test('Randfall: Albtraum-Ergebnis lässt Normal-Stand unberührt, Abzeichen wird nie schlechter', () => {
  const p = allStars();
  const before = JSON.stringify(p.maps);
  recordResult(p, { mapId: 'ice', status: 'won', wave: MAX_WAVES, lives: NIGHTMARE.lives, mode: 'nightmare', goldOk: true, maxLives: NIGHTMARE.lives });
  assert.equal(nightmareProgress(p, 'ice').badge, 3);
  // Danach schlechter: verloren und Bronze-Sieg -> bleibt Gold, kein neues Abzeichen
  const lost = recordResult(p, { mapId: 'ice', status: 'lost', wave: 7, lives: 0, mode: 'nightmare', goldOk: true, maxLives: NIGHTMARE.lives });
  assert.equal(lost.newBadge, 0);
  const bronze = recordResult(p, { mapId: 'ice', status: 'won', wave: MAX_WAVES, lives: 1, mode: 'nightmare', goldOk: false, maxLives: NIGHTMARE.lives });
  assert.equal(bronze.newBadge, 0);
  assert.equal(nightmareProgress(p, 'ice').badge, 3);
  assert.equal(nightmareProgress(p, 'ice').bestWave, MAX_WAVES);
  assert.equal(JSON.stringify(p.maps), before, 'Normal-Rekorde und Sterne unverändert');
  assert.equal(mapProgress(p, 'ice').stars, 3);
  // Silber ohne Gold-Bedingung, danach Gold = Verbesserung
  const q = allStars();
  assert.equal(recordResult(q, { mapId: 'fork', status: 'won', wave: MAX_WAVES, lives: NIGHTMARE.lives, mode: 'nightmare', goldOk: false }).newBadge, 2);
  assert.equal(recordResult(q, { mapId: 'fork', status: 'won', wave: MAX_WAVES, lives: NIGHTMARE.lives, mode: 'nightmare', goldOk: true }).newBadge, 3);
  assert.equal(badgeCount(q), 3);
});

test('Randfall: Gold-Bedingung bleibt verletzt, auch wenn der Turm wieder verkauft wird', () => {
  const s = createGame({ mapId: 'ice', mode: 'nightmare' });
  s.gold = 100000;
  const [c, r] = freeTileNearPath(s);
  const t = buildTower(s, 'frost', c, r);
  assert.equal(t.ok, true);
  assert.equal(checkGoldCondition(s, 'ice').ok, false);
  sellTower(s, t.tower.id);
  assert.equal(checkGoldCondition(s, 'ice').ok, false, 'Frostturm gebaut zählt auch nach dem Verkauf');
  // Gold-Bedingung "höchstens 3 Turmtypen": vierten Typ bauen und verkaufen -> verletzt
  const f = createGame({ mapId: 'fork', mode: 'nightmare' });
  f.gold = 100000;
  const types = ['arrow', 'cannon', 'frost', 'lightning'];
  for (const type of types) {
    const [cc, rr] = freeTileNearPath(f);
    const b = buildTower(f, type, cc, rr);
    assert.equal(b.ok, true, type);
    if (type === 'lightning') sellTower(f, b.tower.id);
  }
  assert.equal(checkGoldCondition(f, 'fork').ok, false);
});

test('Randfall: abgelehnte Fähigkeit (Leben voll) verletzt "ohne Fähigkeiten" nicht', () => {
  const s = createGame({ mapId: 'meadow', mode: 'nightmare' });
  assert.equal(useAbility(s, 'repair').ok, false);
  assert.equal(checkGoldCondition(s, 'meadow').ok, true);
});

// Silber heißt laut B-183 „ohne Lebensverlust“. Mit der Reparatur kann man verlorene Leben zurückholen und
// endet trotzdem mit vollen Leben: dann darf es kein Silber geben (main.js bewertet nur state.lives am Ende).
test('Randfall: Silber nach Lebensverlust plus Reparatur darf nicht vergeben werden', () => {
  const s = createGame({ mapId: 'fork', mode: 'nightmare' });
  s.lives -= 1; // ein Gegner ist durchgekommen
  assert.equal(useAbility(s, 'repair').ok, true);
  assert.equal(s.lives, maxLives(s));
  s.status = 'won';
  s.wave = MAX_WAVES;
  // wie saveResult in main.js
  const p = allStars();
  const res = recordResult(p, { mapId: s.mapId, status: s.status, wave: s.wave, lives: s.lives, mode: s.mode, goldOk: checkGoldCondition(s, s.mapId).ok, maxLives: maxLives(s) });
  assert.equal(res.newBadge, 1, 'Leben verloren -> nur Bronze');
});

test('Randfall: Kosmetik nur wenn frei, auch bei manipuliertem Speicher', () => {
  const p = sanitizeProgress({ ...allStars(), cosmetics: { night: { meadow: true }, goldTowers: true } });
  assert.deepEqual(activeCosmetics(p, 'meadow'), { night: false, goldTowers: false });
  assert.equal(setNightLook(p, 'meadow', true), false);
  // Gold auf allen außer einer Karte: goldene Türme noch gesperrt
  p.nightmare = Object.fromEntries(MAP_ORDER.slice(1).map((id) => [id, { bestWave: MAX_WAVES, badge: 3 }]));
  assert.equal(isGoldTowersUnlocked(p), false);
  assert.equal(activeCosmetics(p, MAP_ORDER[1]).night, true, 'frisch frei = sofort an');
  assert.equal(activeCosmetics(p, MAP_ORDER[0]).night, false);
  assert.equal(activeCosmetics(undefined, 'meadow').night, false);
});

test('Randfall: Albtraum-Musik, Eiswelt nutzt Kartentitel, Ladefehler fällt zurück', () => {
  assert.equal(nightmareMusicUrl(SOUND.music, 'ice'), null);
  assert.equal(pickMusicUrl('ice', [], SOUND.music, 'nightmare'), musicUrl(SOUND.music, 'ice'));
  for (const id of MAP_ORDER) {
    const nm = nightmareMusicUrl(SOUND.music, id);
    if (!nm) continue;
    assert.equal(pickMusicUrl(id, [], SOUND.music, 'nightmare'), nm, id);
    assert.equal(pickMusicUrl(id, [nm], SOUND.music, 'nightmare'), musicUrl(SOUND.music, id), `${id}: Rückfall`);
    assert.equal(pickMusicUrl(id, [], SOUND.music, 'normal'), musicUrl(SOUND.music, id), `${id}: normal unverändert`);
  }
  assert.equal(pickMusicUrl('mars', [], SOUND.music, 'nightmare'), musicUrl(SOUND.music, 'mars'));
});
