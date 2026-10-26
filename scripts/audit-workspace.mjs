import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
async function inventory(dir){
 let bytes=0,files=0;
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  if(entry.isSymbolicLink())continue;
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){const child=await inventory(file);bytes+=child.bytes;files+=child.files;}
  else {bytes+=(await fs.stat(file)).size;files++;}
 }
 return {bytes,files};
}
const sizes=[];
for(const entry of await fs.readdir(root,{withFileTypes:true})){
 const file=path.join(root,entry.name);
 sizes.push({name:entry.name,...(entry.isDirectory()?await inventory(file):{bytes:(await fs.stat(file)).size,files:1})});
}
sizes.sort((a,b)=>b.bytes-a.bytes);
console.log('TOP LEVEL',sizes.map(x=>({...x,MiB:Math.round(x.bytes/1048576*10)/10})));

const publicRoot=path.join(root,'public');
const known=new Map();
async function collect(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){
 const file=path.join(dir,entry.name);
 if(entry.isDirectory())await collect(file);
 else known.set('/'+path.relative(publicRoot,file).replaceAll('\\','/'),{file,bytes:(await fs.stat(file)).size});
}}
await collect(publicRoot);
const used=new Set();
const pending=[];
function scan(text){
 for(const match of text.matchAll(/\/(?:assets|images|videos|media|favicon)\/[a-zA-Z0-9_./-]+/g)){
  const url=match[0];
  if(known.has(url)&&!used.has(url)){used.add(url);pending.push(url);}
 }
 for(const url of ['/domo.js','/domo.css'])if(text.includes(url)&&known.has(url)&&!used.has(url)){used.add(url);pending.push(url);}
}
scan(await fs.readFile('src/data/pages.json','utf8'));
while(pending.length){
 const url=pending.shift();
 if(/\.(?:css|js|json|svg|webmanifest)$/.test(url))scan(await fs.readFile(known.get(url).file,'utf8'));
 if(url.endsWith('.bin')){const json=url.replace(/\.bin$/,'.json');if(known.has(json)&&!used.has(json)){used.add(json);pending.push(json);}}
}
// Browsers can request the conventional icon even with an explicit icon link.
for(const url of ['/favicon.ico'])if(known.has(url))used.add(url);
const unused=[...known].filter(([url])=>!used.has(url)).map(([url,item])=>({url,bytes:item.bytes})).sort((a,b)=>b.bytes-a.bytes);
console.log('UNUSED PUBLIC',unused);
console.log('UNUSED PUBLIC MiB',unused.reduce((s,f)=>s+f.bytes,0)/1048576);
await fs.mkdir('.cleanup',{recursive:true});
const phase=process.argv[2]==='after'?'after':'before';
await fs.writeFile(`.cleanup/audit-${phase}.json`,JSON.stringify({sizes,totalBytes:sizes.reduce((s,f)=>s+f.bytes,0),usedAssets:[...used].sort(),unusedAssets:unused},null,2));
