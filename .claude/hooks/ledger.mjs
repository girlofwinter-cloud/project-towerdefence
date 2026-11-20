#!/usr/bin/env node
// AUDIT-LOG (PostToolUse / SubagentStop / Stop): schreibt jede Aktion automatisch als eine JSON-Zeile.
// Anders als das Entscheidungsbuch docs/LEDGER.md kann das hier nicht "vergessen" werden,
// weil nicht Claude es schreibt, sondern die Harness (der Hook läuft immer).
import fs from 'node:fs';
import path from 'node:path';

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const dir = path.join(root, '.claude', 'ledger');
fs.mkdirSync(dir, { recursive: true });

const args = input.tool_input || {};
const entry = {
  ts: new Date().toISOString(),
  event: input.hook_event_name,
  session: input.session_id,
  agent: input.agent_type || 'main',
  tool: input.tool_name,
  // Nur Kurzform speichern, damit das Log lesbar und klein bleibt (und keine Inhalte großer Dateien).
  target: args.file_path || (args.command ? String(args.command).slice(0, 200) : undefined),
};
fs.appendFileSync(path.join(dir, 'audit.jsonl'), JSON.stringify(entry) + '\n');
process.exit(0);
