#!/usr/bin/env node
// GUARDRAIL (PreToolUse): läuft VOR jedem Tool-Aufruf und kann ihn blockieren.
// Claude Code übergibt den geplanten Aufruf als JSON auf stdin.
// Exit-Code 0 = erlaubt. Exit-Code 2 = blockiert; stderr geht als Begründung an Claude zurück.
import fs from 'node:fs';

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const tool = input.tool_name;
const args = input.tool_input || {};

// Dateien, die nur Menschen ändern dürfen (die Regeln der Agents selbst!).
const PROTECTED = [/^\.claude\/settings/, /^\.claude\/hooks\//, /^\.github\/workflows\//];

// Gefährliche Shell-Muster: [Regex, Erklärung]
const BAD_COMMANDS = [
  [/git\s+push\b[^|;&]*(--force|-f\b|--force-with-lease)/, 'Force-Push ist verboten'],
  [/git\s+push\b[^|;&]*\b(origin\s+)?(HEAD:)?(main|master)\b/, 'Direkt auf main pushen ist verboten - nutze einen Branch agent/<name>'],
  [/git\s+reset\s+--hard/, 'git reset --hard vernichtet Arbeit'],
  [/rm\s+-[a-z]*r[a-z]*f?\s+(\/|~|\$HOME|\.\.?\s|\.\.?$|\*)/, 'Gefährliches rekursives Löschen'],
  [/(curl|wget)[^|]*\|\s*(ba)?sh/, 'Skripte aus dem Netz direkt ausführen ist verboten'],
  [/npm\s+(install|i|add)\s+(?!--no-save\s+playwright)\S/, 'Neue Abhängigkeiten nur nach Rückfrage'],
  [/(sed|tee|cp|mv|rm)\b[^|;&]*(\.claude\/(settings|hooks)|\.github\/workflows)/, 'Geschützte Dateien dürfen nicht per Shell geändert werden'],
];

function deny(reason) {
  console.error(`GUARDRAIL: ${reason}`);
  process.exit(2);
}

if (tool === 'Bash') {
  const cmd = args.command || '';
  for (const [re, why] of BAD_COMMANDS) if (re.test(cmd)) deny(why);
}

if (tool === 'Write' || tool === 'Edit') {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const rel = String(args.file_path || '').replace(root + '/', '');
  if (PROTECTED.some((re) => re.test(rel))) deny(`${rel} ist geschützt. Das darf nur ein Mensch ändern.`);
  if (/(^|\/)\.env/.test(rel)) deny('.env-Dateien dürfen nicht angefasst werden.');
}

process.exit(0);
