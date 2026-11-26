// Mini-Webserver ohne Abhängigkeiten: `npm start` -> http://localhost:8080
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.m4a': 'audio/mp4',
};

export function contentType(file) {
  return TYPES[path.extname(file)] || 'application/octet-stream';
}

// URL-Pfad -> relativer Pfad im Repo (POSIX), oder null bei Ausbruchsversuch.
export function safePath(urlPath) {
  if (typeof urlPath !== 'string' || urlPath.includes('\0') || urlPath.includes('\\')) return null;
  const rel = urlPath.replace(/^\//, '');
  if (rel === '') return 'index.html';
  if (rel.startsWith('/') || path.isAbsolute(rel)) return null;
  if (rel.split('/').some((seg) => seg === '..')) return null;
  const norm = path.posix.normalize(rel);
  if (norm.startsWith('..') || norm.startsWith('/')) return null;
  return norm;
}

// Standard-Lesefunktion: Dateien von der Platte unter `root`
export function diskReader(root = ROOT) {
  return (rel) => fs.readFile(path.join(root, rel));
}

// read: (relPfad, req) -> Promise<Buffer>; Fehler bedeutet 404
export function createServer({ read = diskReader(), headers = {} } = {}) {
  return http.createServer(async (req, res) => {
    let rel;
    try {
      rel = safePath(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    } catch {
      rel = null;
    }
    if (!rel) {
      res.writeHead(403, headers).end();
      return;
    }
    try {
      const body = await read(rel, req);
      res.writeHead(200, { ...headers, 'Content-Type': contentType(rel) });
      res.end(body);
    } catch {
      res.writeHead(404, headers).end('Not found');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8080;
  createServer().listen(port, () => console.log(`🏰 Spiel läuft auf http://localhost:${port}`));
}
