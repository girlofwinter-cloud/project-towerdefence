// Tests für Startbildschirm und Spielende-Plakette (C5): reine Funktionen aus screens.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, MAX_WAVES } from '../src/config.js';
import { emptyProgress, MAP_ORDER } from '../src/progress.js';
import { mapCards, moveFocus, endView, starsHtml, STAR_COUNT, mapSelectOptions, mapSelectValue, parseMapSelectValue } from '../src/screens.js';

const [M0, M1, M2] = MAP_ORDER;

test('mapCards: frisch nur die erste Karte offen, gesperrte nennen den Vorgänger', () => {
  const cards = mapCards(emptyProgress());
  assert.deepEqual(cards.map((c) => c.id), MAP_ORDER);
  assert.deepEqual(cards.map((c) => c.open), MAP_ORDER.map((_, i) => i === 0));
  assert.equal(cards[0].line, 'Noch nicht gespielt');
  assert.equal(cards[0].label, `${MAPS[M0].name}, 0 von ${STAR_COUNT} Sternen, noch nicht gespielt`);
  assert.equal(cards[1].line, `Gewinne erst ${MAPS[M0].name}`);
  assert.match(cards[1].label, /gesperrt/);
});

test('mapCards: Sterne und beste Welle aus dem Fortschritt, Sieg schaltet die nächste Karte frei', () => {
  const p = { maps: { [M0]: { bestWave: MAX_WAVES, stars: 2 }, [M1]: { bestWave: 14, stars: 0 } } };
  const [a, b, c] = mapCards(p);
  assert.deepEqual([a.stars, a.bestWave, a.open], [2, MAX_WAVES, true]);
  assert.equal(a.line, `Beste Welle ${MAX_WAVES} / ${MAX_WAVES}`);
  assert.equal(a.label, `${MAPS[M0].name}, 2 von ${STAR_COUNT} Sternen, beste Welle ${MAX_WAVES}`);
  assert.deepEqual([b.open, b.line], [true, `Beste Welle 14 / ${MAX_WAVES}`]);
  assert.deepEqual([c.id, c.open], [M2, false], 'ohne Sieg auf der zweiten Karte bleibt die dritte zu');
});

test('mapCards: Testseite (allOpen) öffnet alle Karten', () => {
  assert.ok(mapCards(emptyProgress(), { allOpen: true }).every((c) => c.open));
});

test('moveFocus: nur über offene Karten, am Rand bleibt der Fokus', () => {
  const cards = mapCards({ maps: { [M0]: { bestWave: MAX_WAVES, stars: 1 } } });
  assert.equal(moveFocus(cards, M0, 1), M1);
  assert.equal(moveFocus(cards, M1, 1), M1, 'gesperrte dritte Karte wird übersprungen');
  assert.equal(moveFocus(cards, M0, -1), M0);
  assert.equal(moveFocus(cards, 'gibtsnicht', 1), M0);
});

test('endView: Sieg rotes Band mit Sternen (begrenzt), Niederlage graues Band ohne Sterne', () => {
  assert.deepEqual(endView('won', 2), { title: 'Gewonnen!', ribbon: '#c4452f', stars: 2, showStars: true });
  assert.equal(endView('won', 9).stars, STAR_COUNT);
  assert.deepEqual(endView('lost', 3), { title: 'Verloren', ribbon: '#6b5a48', stars: 0, showStars: false });
});

test('starsHtml: immer STAR_COUNT Sterne, davon n voll', () => {
  const html = starsHtml(2, 24);
  assert.equal(html.match(/<svg/g).length, STAR_COUNT);
  assert.equal(html.match(/#f2c14e/g).length, 2);
  assert.equal(html.match(/#5a3a22/g).length, STAR_COUNT - 2);
});

// B-180: Boss-Leiste (src/boss-bar.js) mit einem kleinen Schein-DOM: zeigt, füllt, Phase II, blendet nach dem Tod aus
test('B-180 Boss-Leiste: erscheint mit dem Boss, Phase-Text und Schild, steht nach dem Tod noch fadeAfter s', async () => {
  const { createBossBars } = await import('../src/boss-bar.js');
  const { BOSS_BAR } = await import('../src/config.js');
  const el = () => {
    const cls = new Set();
    const vars = {};
    const attrs = {};
    return { hidden: true, textContent: '', classList: { toggle: (c, on) => (on ? cls.add(c) : cls.delete(c)), has: (c) => cls.has(c) }, style: { setProperty: (k, v) => { vars[k] = v; } }, vars, attrs, setAttribute: (k, v) => { attrs[k] = v; } };
  };
  const mkBar = () => { const b = el(); b.parts = { '.bb-name': el(), '.bb-phase': el(), '.bb-track': el() }; b.querySelector = (q) => b.parts[q]; return b; };
  const bars = [mkBar(), mkBar()];
  const box = { ...el(), querySelectorAll: () => bars };
  const rect = (left, right) => ({ getBoundingClientRect: () => ({ left, right }) });
  const doc = { getElementById: (id) => (id === 'boss-bars' ? box : id === 'hud-bar' ? rect(0, 548) : null), querySelector: () => rect(853, 900) };
  const update = createBossBars(doc);
  const ui = {};
  const necro = { type: 'necro', hp: 600, maxHp: 1000 };
  const state = { time: 0, enemies: [necro] };
  update(state, ui, 0);
  assert.equal(box.hidden, false);
  assert.equal(ui.bossBarShown, true);
  assert.equal(bars[0].hidden, false);
  assert.equal(bars[1].hidden, true, 'nur eine Leiste bei einem Boss');
  assert.equal(bars[0].parts['.bb-name'].textContent, 'Nekromantin');
  assert.equal(bars[0].parts['.bb-phase'].textContent, 'Phase I');
  assert.equal(bars[0].vars['--f'], '0.600');
  assert.equal(bars[0].parts['.bb-track'].attrs['aria-valuenow'], '60');
  assert.equal(box.vars['--bb-w'], '272px');
  Object.assign(necro, { hp: 400, phase: 2, shieldUntil: 2 });
  update(state, ui, 0.1);
  assert.equal(bars[0].parts['.bb-phase'].textContent, 'Phase II');
  assert.ok(bars[0].classList.has('p2') && bars[0].classList.has('shielded'));
  state.enemies = [];
  update(state, ui, 1);
  assert.equal(box.hidden, false, 'leere Leiste steht noch');
  assert.equal(bars[0].vars['--f'], '0.000');
  update(state, ui, 1 + BOSS_BAR.fadeAfter + 0.01);
  assert.equal(box.hidden, true, 'danach ausgeblendet');
  assert.equal(ui.bossBarShown, false);
  // ohne Element im DOM: nichts tun, nicht crashen
  createBossBars({ getElementById: () => null })(state, ui, 0);
});

// B-182: Knopf „Albtraum“ nur auf Karten mit allen Sternen (Testseite: auf allen)
test('B-182: mapCards zeigt den Albtraum nur bei allen Sternen', () => {
  const p = { maps: { [M0]: { bestWave: MAX_WAVES, stars: STAR_COUNT }, [M1]: { bestWave: MAX_WAVES, stars: STAR_COUNT - 1 } } };
  const cards = mapCards(p);
  assert.equal(cards[0].nightmare, true);
  assert.equal(cards[1].nightmare, false);
  assert.equal(cards[2].nightmare, false);
  assert.ok(mapCards(emptyProgress(), { allOpen: true }).every((c) => c.nightmare));
});

test('mapSelectOptions: normal nur Karten, Testmodus zusätzlich je Karte eine Albtraum-Variante', () => {
  const ids = Object.keys(MAPS);
  assert.deepEqual(mapSelectOptions().map((o) => o.value), ids);
  assert.ok(mapSelectOptions().every((o) => o.mode === 'normal'));
  const t = mapSelectOptions({ testMode: true });
  assert.equal(t.length, ids.length * 2);
  assert.deepEqual(t.slice(ids.length).map((o) => o.value), ids.map((id) => `${id}:nightmare`));
  assert.ok(t.slice(ids.length).every((o, i) => o.mode === 'nightmare' && o.mapId === ids[i]));
});

test('mapSelectValue/parseMapSelectValue: Karte und Modus hin und zurück', () => {
  assert.deepEqual(parseMapSelectValue('meadow:nightmare'), { mapId: 'meadow', mode: 'nightmare' });
  assert.deepEqual(parseMapSelectValue('meadow'), { mapId: 'meadow', mode: 'normal' });
  assert.equal(mapSelectValue('meadow'), 'meadow');
  assert.equal(mapSelectValue('meadow', 'nightmare'), 'meadow:nightmare');
  for (const o of mapSelectOptions({ testMode: true })) assert.deepEqual(parseMapSelectValue(o.value), { mapId: o.mapId, mode: o.mode });
});


// ---------- B-184: Abzeichen in Kartenauswahl und Siegbildschirm ----------
test('B-184: Zähler zählt Abzeichen über alle Karten (0..15), Slot-Labels je Stufe', async () => {
  const { badgeCounterText, badgeSlots } = await import('../src/screens.js');
  const { BADGE_MAX } = await import('../src/progress.js');
  assert.equal(BADGE_MAX, 15);
  assert.equal(badgeCounterText(emptyProgress()), 'Abzeichen 0 / 15');
  const p = { maps: {}, nightmare: { [M0]: { bestWave: 20, badge: 3 }, [M1]: { bestWave: 20, badge: 1 } } };
  assert.equal(badgeCounterText(p), 'Abzeichen 4 / 15');
  const all = { maps: {}, nightmare: Object.fromEntries(MAP_ORDER.map((id) => [id, { bestWave: 20, badge: 3 }])) };
  assert.equal(badgeCounterText(all), 'Abzeichen 15 / 15');
  const slots = badgeSlots(p, M1);
  assert.deepEqual(slots.map((x) => [x.tier, x.reached]), [[1, true], [2, false], [3, false]]);
  assert.equal(slots[0].label, `Bronze: Welle ${MAX_WAVES} im Albtraum`);
  assert.equal(slots[1].label, 'Silber: ohne Lebensverlust, offen');
  assert.match(slots[2].label, /^Gold: .+, offen$/);
  assert.equal(badgeSlots(p, M0)[2].label, 'Gold: ohne Fähigkeiten');
});

test('B-184: Siegbildschirm zeigt das höchste neue Abzeichen, Einflug nur bei neuem, Belohnung nur bei neuem Gold', async () => {
  const { nightmareWinView } = await import('../src/screens.js');
  const { recordResult } = await import('../src/progress.js');
  const p = emptyProgress();
  // erstes Spiel: Silber (volle Leben, Gold-Bedingung verfehlt) -> Bronze und Silber neu, gezeigt wird Silber
  let res = recordResult(p, { mapId: M0, status: 'won', wave: MAX_WAVES, lives: 5, mode: 'nightmare', goldOk: false, maxLives: 5 });
  let v = nightmareWinView(p, M0, res);
  assert.deepEqual([v.tier, v.fly, v.reward], [2, true, null]);
  assert.equal(v.title, `${MAPS[M0].name} – Silber-Abzeichen`);
  assert.deepEqual(v.slots.map((x) => x.reached), [true, true, false]);
  // schwächeres Ergebnis: kein neues Abzeichen, vorhandene höchste Stufe ohne Einflug
  res = recordResult(p, { mapId: M0, status: 'won', wave: MAX_WAVES, lives: 2, mode: 'nightmare', goldOk: false, maxLives: 5 });
  v = nightmareWinView(p, M0, res);
  assert.deepEqual([v.tier, v.fly, v.reward], [2, false, null]);
  // Gold neu: Belohnung Nacht-Look dieser Karte
  res = recordResult(p, { mapId: M0, status: 'won', wave: MAX_WAVES, lives: 5, mode: 'nightmare', goldOk: true, maxLives: 5 });
  v = nightmareWinView(p, M0, res);
  assert.deepEqual([v.tier, v.fly], [3, true]);
  assert.equal(v.reward, `Neue Belohnung freigeschaltet: Nacht-Look ${MAPS[M0].name}`);
  assert.equal(v.condition, 'Gold: ohne Fähigkeiten');
  // letztes fehlendes Gold: goldene Türme
  for (const id of MAP_ORDER.slice(1, -1)) p.nightmare[id] = { bestWave: 20, badge: 3 };
  const last = MAP_ORDER[MAP_ORDER.length - 1];
  res = recordResult(p, { mapId: last, status: 'won', wave: MAX_WAVES, lives: 5, mode: 'nightmare', goldOk: true, maxLives: 5 });
  assert.equal(nightmareWinView(p, last, res).reward, 'Neue Belohnung freigeschaltet: Goldene Türme');
  // kein Albtraum-Abzeichen (z. B. verloren): kein Albtraum-Siegbildschirm
  assert.equal(nightmareWinView(emptyProgress(), M1, { newBadge: 0 }), null);
});

// ---------- B-185: Menü „Aussehen“ ----------
import { cosmeticsView, cosmeticsHtml, toggleCosmetic, COS_LOCKED_NIGHT, COS_LOCKED_GOLD } from '../src/screens.js';
import { BADGE_TIERS } from '../src/config.js';
import { activeCosmetics } from '../src/cosmetics.js';
const goldOn = (ids) => ({ maps: {}, nightmare: Object.fromEntries(ids.map((id) => [id, { bestWave: MAX_WAVES, badge: BADGE_TIERS.length }])) });

test('B-185 cosmeticsView: je Karte ein Nacht-Look, frisch frei = an, gesperrt mit Grund und Fortschritt', () => {
  const v = cosmeticsView(goldOn([M1]));
  assert.deepEqual(v.night.map((r) => r.mapId), MAP_ORDER);
  const r1 = v.night.find((r) => r.mapId === M1);
  assert.deepEqual([r1.unlocked, r1.on, r1.reason], [true, true, '']);
  assert.equal(r1.label, `Nacht-Look ${MAPS[M1].name}, an`);
  const r0 = v.night.find((r) => r.mapId === M0);
  assert.deepEqual([r0.unlocked, r0.on, r0.reason], [false, false, COS_LOCKED_NIGHT]);
  assert.match(r0.label, /, gesperrt$/);
  assert.deepEqual([v.gold.unlocked, v.gold.on, v.gold.reason, v.gold.progressText], [false, false, COS_LOCKED_GOLD, 'Gold auf 1 / 5 Karten']);
});

test('B-185 cosmeticsHtml: gesperrter Schalter disabled mit „gesperrt“ im Label, Fortschritt nur bis 5 / 5', () => {
  const html = cosmeticsHtml(cosmeticsView(goldOn([M1])));
  assert.equal((html.match(/role="switch"/g) || []).length, MAP_ORDER.length + 1);
  assert.match(html, new RegExp(`data-key="night:${M0}" aria-checked="false" aria-label="Nacht-Look ${MAPS[M0].name}, gesperrt" disabled`));
  assert.match(html, new RegExp(`data-key="night:${M1}" aria-checked="true" aria-label="Nacht-Look ${MAPS[M1].name}, an">`));
  assert.match(html, /Gold auf 1 \/ 5 Karten/);
  assert.match(html, /aria-valuenow="1"/);
  const all = cosmeticsHtml(cosmeticsView(goldOn(MAP_ORDER)));
  assert.doesNotMatch(all, /disabled|cos-prog|gesperrt/);
});

test('B-185 toggleCosmetic: schaltet um, gesperrt/unbekannt bleibt unverändert', () => {
  const p = goldOn([M1]);
  assert.equal(toggleCosmetic(p, `night:${M0}`), false);
  assert.equal(toggleCosmetic(p, 'gold'), false);
  assert.equal(toggleCosmetic(p, 'quatsch'), false);
  assert.equal(p.cosmetics, undefined);
  assert.equal(toggleCosmetic(p, `night:${M1}`), true);
  assert.deepEqual(p.cosmetics, { night: { [M1]: false } }, 'nur das bewusste Aus wird gespeichert');
  assert.equal(activeCosmetics(p, M1).night, false);
  assert.equal(toggleCosmetic(p, `night:${M1}`), true);
  assert.equal(activeCosmetics(p, M1).night, true);
  const g = goldOn(MAP_ORDER);
  assert.equal(toggleCosmetic(g, 'gold'), true);
  assert.equal(activeCosmetics(g, M2).goldTowers, false);
});

// ---------- B-191: Kartenauswahl und Menü „Aussehen“ im Albtraum ----------
import { mapSlotHtml, starCounterText, nightmareCardInfo, nmStyleOf, startHeadView, cosPreviewView, NM_NEED } from '../src/screens.js';
import { GOLD_CONDITIONS, NM_STYLE_OF_MAP, NM_ENEMY_STYLE } from '../src/config.js';
import { nightmareWinView } from '../src/screens.js';
import { NM_STYLE_NAME } from '../src/nm-wood.js';
// alle Karten mit drei Sternen außer der letzten; erste Karte Bronze
const threeStars = () => ({
  maps: Object.fromEntries(MAP_ORDER.map((id, i) => [id, { bestWave: MAX_WAVES, stars: i < MAP_ORDER.length - 1 ? 3 : 2 }])),
  nightmare: { [M0]: { bestWave: MAX_WAVES, badge: 1 } },
});

test('B-191 mapSlotHtml Albtraum: Stil-Schild je Karte, Bedingungskasten mit Gold-Bedingung, gesperrt mit Hinweis und aria-disabled', () => {
  const p = threeStars();
  const cards = mapCards(p);
  for (const card of cards.filter((c) => c.nightmare)) {
    const html = mapSlotHtml(card, 'nightmare', p);
    assert.match(html, new RegExp(`class="map-style"><i style="background:${NM_ENEMY_STYLE[NM_STYLE_OF_MAP[card.id]].eye}"></i>${NM_STYLE_NAME[card.id]}<`));
    assert.match(html, new RegExp(`class="map-cond"><span>Gold: ${GOLD_CONDITIONS[card.id].label}</span>`));
    assert.match(html, new RegExp(`class="map-nightmare" data-map="${card.id}"`));
    assert.doesNotMatch(html, /aria-disabled/);
  }
  const locked = cards.find((c) => !c.nightmare);
  const html = mapSlotHtml(locked, 'nightmare', p);
  assert.match(html, new RegExp(NM_NEED));
  assert.match(html, /class="map-nightmare locked"[^>]*aria-disabled="true"/);
  assert.match(html, /Gesperrt<\/button>$/);
  assert.doesNotMatch(html, /map-badges|map-cond/);
  // Bedingungskasten: nächste Stufe bzw. alles geholt
  assert.deepEqual(nightmareCardInfo(p, M0), { cond: `Gold: ${GOLD_CONDITIONS[M0].label}`, next: 'nächstes: Silber' });
  assert.equal(nightmareCardInfo(p, M1).next, 'nächstes: Bronze');
  p.nightmare[M0].badge = 3;
  assert.equal(nightmareCardInfo(p, M0).next, 'alle Abzeichen geholt');
  assert.equal(nmStyleOf('unbekannt').name, NM_STYLE_NAME.meadow);
});

test('B-191 mapSlotHtml Normal: Bestwert, „Albtraum offen“ bzw. „ab 3 Sternen“, kein Albtraum-Knopf; Kopf und Zähler je Ansicht', () => {
  const p = threeStars();
  const cards = mapCards(p);
  const open = mapSlotHtml(cards[0], 'normal', p);
  assert.match(open, /class="map-best">Beste Welle 20 \/ 20</);
  assert.match(open, /Albtraum offen/);
  assert.doesNotMatch(open, /map-nightmare|map-style/);
  assert.match(mapSlotHtml(cards[cards.length - 1], 'normal', p), /Albtraum ab 3 Sternen/);
  assert.equal(starCounterText(p), `Sterne ${3 * (MAP_ORDER.length - 1) + 2} / ${MAP_ORDER.length * STAR_COUNT}`);
  assert.equal(starCounterText(emptyProgress()), `Sterne 0 / ${MAP_ORDER.length * STAR_COUNT}`);
  assert.equal(startHeadView('nightmare').title, 'Albtraum');
  assert.equal(startHeadView('normal').title, 'Wähle deine Karte');
});

test('B-191 cosmeticsHtml: Unterzeile mit Stilname (frei) bzw. eigener Stufe (gesperrt), Zustandswort; Vorschau-Daten je Zeile', () => {
  const p = goldOn([M1]);
  p.nightmare[M0] = { bestWave: MAX_WAVES, badge: 2 };
  const view = cosmeticsView(p);
  const html = cosmeticsHtml(view);
  assert.match(html, new RegExp(`Frei · Stil ${NM_STYLE_NAME[M1]}`));
  assert.match(html, new RegExp(`${COS_LOCKED_NIGHT} \\(du: Silber\\)`));
  assert.match(html, new RegExp(`${COS_LOCKED_NIGHT} \\(du: kein Abzeichen\\)`));
  assert.match(html, /class="cos-state">An</);
  assert.equal((html.match(/class="cos-state">Gesperrt</g) || []).length, MAP_ORDER.length, 'vier Karten und goldene Türme gesperrt');
  const r1 = view.night.find((r) => r.mapId === M1);
  assert.deepEqual([r1.state, r1.style, r1.tier], ['An', NM_STYLE_NAME[M1], 3]);
  // Vorschau: Karte bzw. goldene Türme, Freischalt-Kasten mit den Bedingungen und der eigenen Stufe
  const v0 = cosPreviewView(view, `night:${M0}`);
  assert.deepEqual([v0.kind, v0.title, v0.state, v0.unlocked], ['night', `Vorschau: ${MAPS[M0].name}`, 'Gesperrt', false]);
  assert.match(v0.unlockText, /Du hast: Silber\.$/);
  assert.equal(v0.nightLabel, `Nacht-Look · ${NM_STYLE_NAME[M0]}`);
  const vg = cosPreviewView(view, 'gold');
  assert.deepEqual([vg.kind, vg.state], ['gold', 'Gesperrt']);
  assert.match(vg.unlockText, /Gold auf 1 \/ 5 Karten/);
  assert.equal(cosPreviewView(view, 'quatsch').key, `night:${M0}`, 'unbekannt: erste Zeile');
});

// ---------- B-192: Sieg und Niederlage im Albtraum ----------
import { nightmareLoseView, NM_TIPS, loseRingSvg } from '../src/screens.js';
test('B-192 nightmareWinView: Bedingungsliste passend zur Stufe, nächstes Ziel bis Gold, Holz der Karte', async () => {
  const { recordResult } = await import('../src/progress.js');
  const p = emptyProgress();
  let res = recordResult(p, { mapId: M0, status: 'won', wave: MAX_WAVES, lives: 3, mode: 'nightmare', goldOk: true, maxLives: 5, noLoss: false });
  let v = nightmareWinView(p, M0, res);
  assert.equal(v.tier, 1);
  assert.deepEqual(v.conds.map((c) => [c.tier, c.ok]), [['Bronze', true], ['Silber', false], ['Gold', false]]);
  assert.equal(v.conds[2].text, GOLD_CONDITIONS[M0].label);
  assert.deepEqual(v.next, { name: 'Silber', text: `Welle ${MAX_WAVES} schaffen, ohne ein Leben zu verlieren.` });
  assert.equal(v.wood, 'moss');
  res = recordResult(p, { mapId: M0, status: 'won', wave: MAX_WAVES, lives: 5, mode: 'nightmare', goldOk: false, maxLives: 5 });
  v = nightmareWinView(p, M0, res);
  assert.deepEqual(v.conds.map((c) => c.ok), [true, true, false]);
  assert.deepEqual(v.next, { name: 'Gold', text: `Silber plus: ${GOLD_CONDITIONS[M0].label}.` });
  res = recordResult(p, { mapId: M0, status: 'won', wave: MAX_WAVES, lives: 5, mode: 'nightmare', goldOk: true, maxLives: 5 });
  v = nightmareWinView(p, M0, res);
  assert.deepEqual([v.conds.every((c) => c.ok), v.next], [true, null]);
});

test('B-192 nightmareLoseView: Titel mit Welle, Werte, Tipp aus NM_TIPS, Slots; Ring mit pulsierenden Augen', () => {
  const p = emptyProgress();
  p.nightmare = { [M1]: { bestWave: 15, badge: 1 } };
  const v = nightmareLoseView(p, M1, { wave: 12, lives: 0, maxLives: 5 });
  assert.equal(v.title, `${MAPS[M1].name} – Welle 12 von ${MAX_WAVES}`);
  assert.deepEqual(v.values, [['Welle', `12 / ${MAX_WAVES}`], ['Leben', '0 / 5'], ['Bester Lauf', 'Welle 15']]);
  assert.ok(NM_TIPS.includes(v.tip));
  assert.notEqual(nightmareLoseView(p, M1, { wave: 13, lives: 0, maxLives: 5 }).tip, v.tip, 'anderer Tipp bei anderer Welle');
  assert.deepEqual(v.slots.map((x) => x.reached), [true, false, false]);
  assert.equal(nightmareLoseView(p, M2, { wave: 3 }).values[2][1], 'Welle 3', 'ohne Bestwert: diese Welle');
  assert.equal(nightmareLoseView(p, 'quatsch', { wave: 3 }), null);
  const ring = loseRingSvg(160);
  assert.match(ring, /width="160"/);
  assert.match(ring, /class="nm-pulse"/);
});
