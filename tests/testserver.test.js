// Tests für den Testserver (scripts/testserver.mjs) und die Lesefunktion von serve.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { parseArgs, isValidRef, refCandidates, fetchBranch } from '../scripts/testserver.mjs';
import { createServer, safePath, contentType } from '../scripts/serve.mjs';

test('Testserver: Argumente parsen', () => {
  assert.deepEqual(parseArgs([]), { ref: 'main', dir: null, open: true });
  assert.deepEqual(parseArgs(['agent/xyz', '--no-open']), { ref: 'agent/xyz', dir: null, open: false });
  assert.deepEqual(parseArgs(['--dir', '/tmp/wt']), { ref: 'main', dir: '/tmp/wt', open: true });
  assert.throws(() => parseArgs(['--dir']));
  assert.throws(() => parseArgs(['--foo']));
  assert.throws(() => parseArgs(['a;rm -rf']));
});

test('Testserver: Ref-Namen prüfen', () => {
  for (const ok of ['main', 'agent/xyz', 'origin/agent/a-b_c.1', 'e34d76b']) assert.ok(isValidRef(ok), ok);
  for (const bad of ['-x', '--upload-pack=x', 'a b', 'a;b', '../x', 'a..b', '', 'x$(y)', 'a~1']) assert.ok(!isValidRef(bad), bad);
});

test('Testserver: Ref-Kandidaten und Fetch-Branch', () => {
  assert.deepEqual(refCandidates('main'), ['origin/main', 'main']);
  assert.deepEqual(refCandidates('agent/xyz'), ['origin/agent/xyz', 'agent/xyz']);
  assert.deepEqual(refCandidates('origin/main'), ['origin/main']);
  assert.equal(fetchBranch('origin/agent/xyz'), 'agent/xyz');
  assert.equal(fetchBranch('main'), 'main');
  assert.equal(fetchBranch('e34d76b'), null);
});

test('Testserver: Pfade normalisieren und Ausbruch ablehnen', () => {
  assert.equal(safePath('/'), 'index.html');
  assert.equal(safePath('/test.html'), 'test.html');
  assert.equal(safePath('/src/./game.js'), 'src/game.js');
  assert.equal(safePath('/../etc/passwd'), null);
  assert.equal(safePath('/src/../../x'), null);
  assert.equal(safePath('//etc/passwd'), null);
  assert.equal(safePath('/a\\..\\b'), null);
  assert.equal(safePath('/a\0b'), null);
  assert.equal(contentType('assets/sounds/a.m4a'), 'audio/mp4');
});

test('Testserver: createServer mit Fake-Lesefunktion', async () => {
  const files = { 'test.html': Buffer.from('<p>hi</p>'), 'a/b.m4a': Buffer.from([0, 1, 2, 255]) };
  const seen = [];
  const read = async (rel) => {
    seen.push(rel);
    if (!(rel in files)) throw new Error('fehlt');
    return files[rel];
  };
  const server = createServer({ read, headers: { 'Cache-Control': 'no-store' } }).listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    let res = await fetch(`${base}/test.html`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(res.headers.get('cache-control'), 'no-store');
    res = await fetch(`${base}/a/b.m4a`);
    assert.equal(res.headers.get('content-type'), 'audio/mp4');
    assert.deepEqual([...new Uint8Array(await res.arrayBuffer())], [0, 1, 2, 255]);
    res = await fetch(`${base}/fehlt.js`);
    assert.equal(res.status, 404);
    // Rohe Pfade ohne Normalisierung durch den Client senden
    const raw = (p) => new Promise((resolve, reject) => {
      http.get({ host: '127.0.0.1', port: server.address().port, path: p }, (r) => { r.resume(); resolve(r.statusCode); }).on('error', reject);
    });
    // URL-Normalisierung oder safePath verhindern den Ausbruch (404 bzw. 403)
    assert.notEqual(await raw('/../../etc/passwd'), 200);
    assert.notEqual(await raw('/%2e%2e/%2e%2e/etc/passwd'), 200);
    assert.equal(await raw('/src/..%2f..%2fx'), 403);
    assert.equal(await raw('/%2fetc%2fpasswd'), 403);
    assert.ok(seen.every((rel) => !rel.startsWith('/') && !rel.split('/').includes('..')), seen.join());
  } finally {
    server.close();
  }
});
