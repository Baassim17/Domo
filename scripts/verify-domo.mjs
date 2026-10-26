import fs from 'node:fs/promises';
const base = process.env.SITE_URL || 'http://localhost:3000';
const pages=JSON.parse(await fs.readFile('src/data/pages.json','utf8'));
const missing=new Set();
const traces=[];
for(const [route,html] of Object.entries(pages)){
 if(/\bDwellin\b|\bDwelle\b|\bDwell\b|\bDWELL\b|ask-nat|formspree|letsdwell|uncommondesign|dwell\.au|dwell\.com/i.test(html))traces.push(route);
 for(const match of html.matchAll(/(?:src|href|data-video|data-poster|data-captions)="(\/(?:assets|videos|media|favicon)\/[^"?#]+)(?:[?#][^"]*)?"/g)){
  if(!await fs.stat(`public${match[1]}`).catch(()=>null))missing.add(match[1]);
 }
 const response=await fetch(`${base}${route}`);
 const expected=route==='/404'?404:200;
 if(response.status!==expected)throw Error(`${route}: HTTP ${response.status}`);
 console.log('Route OK',route);
}
const invalid=await fetch(`${base}/api/enquiries`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'invalid'})});
if(invalid.status!==422)throw Error('Invalid emails must be rejected');
const config=JSON.parse(await fs.readFile('public/assets/c9f5e8f04cd3a9adb.json','utf8'));
for(const state of config.footerAnimation.states)for(const key of ['video','mobileVideo','transition','mobileTransition'])if(state[key]&&!await fs.stat(`public${state[key]}`).catch(()=>null))missing.add(state[key]);
const report={routes:Object.keys(pages).length,missingAssets:[...missing],originalTraces:traces,invalidEmailRejected:true};
await fs.writeFile('docs/research/dwell.au/verification.json',JSON.stringify(report,null,2));
console.log(report);
if(missing.size||traces.length)process.exitCode=1;
