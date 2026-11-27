#!/usr/bin/env node
// QUALITÄTS-GATE (Stop): läuft, wenn Claude "fertig" sagen will.
// Sind die Tests rot, wird das Beenden blockiert (Exit 2) und Claude muss weiterarbeiten.
// Nur wenn src/, tests/, index.html oder style.css geändert sind, sonst kostet jede Antwort Wartezeit.
// Läuft den schnellen Teil (npm test); Balancing-Simulationen laufen über npm run test:balance und in der CI.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');

// Schutz vor Endlosschleife: Wurde Claude schon einmal durch diesen Hook zurückgeschickt, lassen wir durch.
if (input.stop_hook_active) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const status = spawnSync('git', ['status', '--porcelain', '--', 'src', 'tests', 'index.html', 'style.css'], { cwd: root, encoding: 'utf8' });
// Ohne Antwort von git sicherheitshalber testen; ohne Änderungen nichts tun.
if (status.status === 0 && !status.stdout.trim()) process.exit(0);

const res = spawnSync('npm', ['test', '--silent'], { cwd: root, encoding: 'utf8' });

if (res.status !== 0) {
  console.error('TEST-GATE: npm test schlägt fehl. Behebe das, bevor du abschließt.\n' + (res.stdout || '').slice(-1500));
  process.exit(2);
}
process.exit(0);
