// Dauerhafter Testserver: liefert Spiel und Testseite im neuesten Stand eines Git-Branches,
// ohne Checkout. Aufruf: npm run testserver [-- <branch|ref>] [--dir <ordner>] [--no-open]
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, diskReader } from './serve.mjs';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_PORT = 8091;
const FETCH_INTERVAL_MS = 10_000;
const NO_STORE = { 'Cache-Control': 'no-store' };

// Nur [A-Za-z0-9._/-], kein führendes '-', kein '..'
export function isValidRef(ref) {
  return typeof ref === 'string' && /^[A-Za-z0-9._/-]+$/.test(ref) && !ref.startsWith('-') && !ref.includes('..');
}

export function parseArgs(argv) {
  const opts = { ref: 'main', dir: null, open: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-open') opts.open = false;
    else if (a === '--dir') {
      if (i + 1 >= argv.length) throw new Error('--dir braucht einen Ordner');
      opts.dir = argv[++i];
    } else if (a.startsWith('-')) throw new Error(`Unbekannte Option: ${a}`);
    else {
      if (!isValidRef(a)) throw new Error(`Ungültige Ref: ${a}`);
      opts.ref = a;
    }
  }
  return opts;
}

// Reihenfolge der Auflösung: erst origin/<name>, dann lokal <name>
export function refCandidates(ref) {
  if (ref.startsWith('origin/')) return [ref];
  return [`origin/${ref}`, ref];
}

// Branch-Name für git fetch, oder null bei Commit-Hashes
export function fetchBranch(ref) {
  if (/^[0-9a-f]{7,40}$/.test(ref)) return null;
  return ref.startsWith('origin/') ? ref.slice('origin/'.length) : ref;
}

const git = (args, opts = {}) => run('git', args, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, ...opts });

async function resolveRef(ref) {
  for (const cand of refCandidates(ref)) {
    try {
      const { stdout } = await git(['rev-parse', '--verify', '--quiet', `${cand}^{commit}`]);
      return { name: cand, commit: stdout.trim() };
    } catch { /* nächster Kandidat */ }
  }
  return null;
}

async function describe(name, commit) {
  const { stdout } = await git(['log', '-1', '--format=%h %s', commit]);
  console.log(`[testserver] ${name} ${stdout.trim()}`);
}

function gitReader(ref) {
  const branch = fetchBranch(ref);
  let current = null;
  let lastCheck = 0;
  let pending = null;
  let lastError = '';

  async function refresh() {
    if (branch) {
      try {
        await git(['fetch', '--quiet', 'origin', branch]);
        lastError = '';
      } catch (err) {
        const msg = String(err.stderr || err.message).trim();
        if (msg !== lastError) console.error(`[testserver] git fetch fehlgeschlagen: ${msg}`);
        lastError = msg;
      }
    }
    const found = await resolveRef(ref);
    if (!found) {
      if (!current) throw new Error(`Ref nicht gefunden: ${ref}`);
      return;
    }
    if (!current || found.commit !== current.commit) {
      current = found;
      await describe(found.name, found.commit);
    }
  }

  async function ensureFresh() {
    if (Date.now() - lastCheck < FETCH_INTERVAL_MS && current) return;
    lastCheck = Date.now();
    pending ??= refresh().finally(() => { pending = null; });
    await pending;
  }

  // HTML-Abruf löst ggf. den neuen Stand aus; alle weiteren Dateien kommen vom gemerkten Commit
  async function read(rel) {
    if (rel.endsWith('.html') || !current) await ensureFresh();
    const { stdout } = await git(['cat-file', 'blob', `${current.commit}:${rel}`], { encoding: 'buffer' });
    return stdout;
  }
  return { read, init: ensureFresh };
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  let read;
  if (opts.dir) {
    const dir = path.resolve(opts.dir);
    if (!fs.existsSync(dir)) {
      console.error(`Ordner nicht gefunden: ${dir}`);
      process.exit(1);
    }
    read = diskReader(dir);
    console.log(`[testserver] Ordner ${dir}`);
  } else {
    const reader = gitReader(opts.ref);
    try {
      await reader.init();
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
    read = reader.read;
  }
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const url = `http://localhost:${port}/test.html`;
  createServer({ read, headers: NO_STORE }).listen(port, '127.0.0.1', () => {
    console.log(`[testserver] läuft auf ${url}`);
    if (opts.open && process.platform === 'darwin') execFile('open', [url], () => {});
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
