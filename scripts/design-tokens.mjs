// Erzeugt aus docs/design/system/tokens.json die lesbare Tabelle TOKENS.md und tokens.css (CSS-Variablen).
// Aufruf: node scripts/design-tokens.mjs   (nach jeder Änderung an tokens.json, ohne Abhängigkeiten)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'design', 'system');
const t = JSON.parse(fs.readFileSync(path.join(dir, 'tokens.json'), 'utf8'));
const theme = t.color.themes[0].id;
const byName = Object.fromEntries(t.color.tokens.map((x) => [x.name, x]));
const raw = (x) => (typeof x.value === 'string' ? x.value : x.value[theme]);
// Alias "{gold}" auf den Endwert auflösen (für die Tabelle)
const resolve = (v, depth = 0) => {
  const m = /^\{(.+)\}$/.exec(v);
  return m && depth < 16 ? resolve(raw(byName[m[1]]), depth + 1) : v;
};
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|');
const FAMILIES = [['spacing', 'Abstände'], ['radius', 'Rundungen'], ['shadow', 'Schatten'], ['stroke', 'Konturen'], ['size', 'Größen']];

const md = [
  '# Tokens: Gemalt und warm',
  '',
  'Erzeugt aus `tokens.json` mit `node scripts/design-tokens.mjs`. Nicht von Hand ändern.',
  '',
  `## Farben (${t.color.tokens.length})`,
  '',
  '| Token | Wert | Verwendung |',
  '|---|---|---|',
  ...t.color.tokens.map((x) => {
    const v = raw(x);
    const shown = v.startsWith('{') ? `${v} = ${resolve(v)}` : v;
    return `| \`${x.name}\` | \`${shown}\` | ${cell(x.usage)} |`;
  }),
  '',
  '## Schrift',
  '',
  ...Object.entries(t.type.families).map(([k, v]) => `- \`font-${k}\`: ${v}`),
  ...t.type.fonts.map((f) => `- Datei: ${f.family} ${f.weight} (\`assets/fonts/${path.basename(f.file)}\` im Spiel)`),
  '',
  '| Stil | Familie | Größe | Zeilenhöhe | Beispiel | Verwendung |',
  '|---|---|---|---|---|---|',
  ...t.type.groups.flatMap((g) => g.styles.map((s) =>
    `| \`${s.name}\` | ${s.family ?? g.family} | ${s.fontSize} | ${s.lineHeight} | ${cell(s.sample)} | ${cell(s.usage)} |`)),
];
for (const [key, title] of FAMILIES) {
  const fam = t[key];
  if (!fam) continue;
  md.push('', `## ${title}`, '');
  if (fam.note) md.push(fam.note, '');
  md.push('| Token | Wert | Verwendung |', '|---|---|---|');
  for (const x of fam.tokens) md.push(`| \`${x.name}\` | \`${cell(x.value)}\` | ${cell(x.usage)} |`);
}
fs.writeFileSync(path.join(dir, 'TOKENS.md'), md.join('\n') + '\n');

const css = [
  '/* Gemalt und warm: erzeugt aus tokens.json mit node scripts/design-tokens.mjs. Nicht von Hand ändern. */',
  ':root {',
  ...t.color.tokens.map((x) => {
    const v = raw(x);
    const m = /^\{(.+)\}$/.exec(v);
    return `  --${x.name}: ${m ? `var(--${m[1]})` : v};`;
  }),
  ...Object.entries(t.type.families).map(([k, v]) => `  --font-${k}: ${v};`),
  ...FAMILIES.flatMap(([key]) => (t[key]?.tokens ?? []).map((x) => `  --${x.name}: ${x.value};`)),
  '}',
];
fs.writeFileSync(path.join(dir, 'tokens.css'), css.join('\n') + '\n');
console.log(`TOKENS.md und tokens.css geschrieben (${t.color.tokens.length} Farben).`);
