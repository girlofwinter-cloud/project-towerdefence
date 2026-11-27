// Tests für den Vollbild-Schalter (B-178) mit nachgebautem document/screen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fullscreenControl } from '../src/fullscreen.js';

function fakeDoc({ prefix = '', enabled = true, reject = false } = {}) {
  const calls = [];
  const listeners = [];
  const doc = { calls, listeners, addEventListener: (type) => listeners.push(type) };
  const el = {};
  const key = (s) => (prefix ? prefix + s[0].toUpperCase() + s.slice(1) : s);
  doc[key('fullscreenElement')] = null;
  doc[key('fullscreenEnabled')] = enabled;
  el[key('requestFullscreen')] = async (opts) => {
    calls.push(['request', opts]);
    if (reject) throw new Error('nicht erlaubt');
    doc[key('fullscreenElement')] = el;
  };
  doc[key('exitFullscreen')] = async () => { calls.push(['exit']); doc[key('fullscreenElement')] = null; };
  doc.documentElement = el;
  return { doc, el };
}

function fakeScreen() {
  const calls = [];
  return { calls, orientation: { lock: async (o) => { calls.push(['lock', o]); }, unlock: () => calls.push(['unlock']) } };
}

test('fullscreenControl: ohne Fullscreen-API (iPhone-Safari) nicht unterstützt, toggle tut nichts', async () => {
  const fc = fullscreenControl({ documentElement: {} }, undefined);
  assert.equal(fc.supported, false);
  assert.equal(await fc.toggle({}), false);
  assert.equal(fc.isOn(), false);
});

test('fullscreenControl: fullscreenEnabled false (z. B. in iframe) gilt als nicht unterstützt', () => {
  const { doc } = fakeDoc({ enabled: false });
  assert.equal(fullscreenControl(doc).supported, false);
});

test('fullscreenControl: an und wieder aus, Querformat nur auf Wunsch festhalten', async () => {
  const { doc, el } = fakeDoc();
  const scr = fakeScreen();
  const fc = fullscreenControl(doc, scr);
  assert.equal(fc.supported, true);
  assert.equal(await fc.toggle(el, true), true);
  assert.equal(fc.isOn(), true);
  assert.deepEqual(doc.calls[0], ['request', { navigationUI: 'hide' }]);
  assert.deepEqual(scr.calls, [['lock', 'landscape']]);
  assert.equal(await fc.toggle(el, true), false);
  assert.deepEqual(doc.calls.at(-1), ['exit']);
  assert.deepEqual(scr.calls.at(-1), ['unlock']);

  const scr2 = fakeScreen();
  const fc2 = fullscreenControl(fakeDoc().doc, scr2);
  await fc2.toggle(fakeDoc().el, false);
  assert.deepEqual(scr2.calls, [], 'Desktop: kein Festhalten des Querformats');
});

test('fullscreenControl: webkit-Präfix (ältere Safari, iPad) wird genutzt', async () => {
  const { doc, el } = fakeDoc({ prefix: 'webkit' });
  const fc = fullscreenControl(doc);
  assert.equal(fc.supported, true);
  assert.equal(await fc.toggle(el), true);
  assert.equal(fc.isOn(), true);
  fc.onChange(() => {});
  assert.deepEqual(doc.listeners, ['fullscreenchange', 'webkitfullscreenchange']);
});

test('fullscreenControl: Ablehnung durch den Browser und fehlendes orientation.lock werfen nicht', async () => {
  const { doc, el } = fakeDoc({ reject: true });
  assert.equal(await fullscreenControl(doc, {}).toggle(el, true), false);
  const ok = fakeDoc();
  const scr = { orientation: { lock: async () => { throw new Error('nur Handy'); } } };
  assert.equal(await fullscreenControl(ok.doc, scr).toggle(ok.el, true), true);
});
