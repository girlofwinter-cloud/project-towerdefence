// Exportiert Turm-, Gegner- und Icon-Grafiken des Spiels als PNG (2x) für Claude-Design-Prototypen.
// Aufruf: node .claude/skills/design/sprites.mjs <ausgabeordner>   (Ausgabe ins Scratchpad, nie ins Repo)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const ROOT = new URL("../../..", import.meta.url).pathname.replace(/\/$/, "");
const require = createRequire(ROOT + '/package.json');
const { chromium } = require('playwright');
const { createServer } = await import(ROOT + '/scripts/serve.mjs');
const OUT = process.argv[2];
const server = createServer(); await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch(); const page = await browser.newPage();
await page.goto(url); await page.waitForSelector('#game');
const out = await page.evaluate(async () => {
  const { drawIcon } = await import('/src/render-icons.js');
  const { drawTower } = await import('/src/render.js');
  const F = await import('/src/render-enemies-flat.js');
  const cv = (fn, size) => { const c = document.createElement('canvas'); c.width = size*2; c.height = size*2; const x = c.getContext('2d'); x.scale(2,2); fn(x, size); return c.toDataURL('image/png'); };
  const r = {};
  for (const n of ['gold','heart','wave','meteor','freeze','repair','pause','play','sound','castle','map','trophy']) r['icon-'+n] = cv((x,s)=>drawIcon(x,n,s/2,s/2,s),64);
  for (const t of ['arrow','cannon','frost','sniper','lightning']) for (const lv of [1,3]) r[`tower-${t}-${lv}`] = cv((x,s)=>{const k=s/40*0.62; x.translate(s/2,s*0.66); x.scale(k,k); drawTower(x,{type:t,x:0,y:0,level:lv,cooldown:0,angle:-0.7},false);},80);
  for (const [k,f] of [['grunt',F.drawGruntFlat],['runner',F.drawRunnerFlat],['tank',F.drawTankFlat]]) r['enemy-'+k] = cv((x,s)=>{x.translate(s/2,s*.5); const q=s*0.4*(k==='tank'?.85:1); x.scale(q,q); f(x,0);},64);
  return r;
});
for (const [k,v] of Object.entries(out)) fs.writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.split(',')[1],'base64'));
await browser.close(); server.close();
