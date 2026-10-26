import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
import * as fontkit from 'fontkit';
import wawoff2 from 'wawoff2';
const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');
await fs.mkdir('public/media',{recursive:true});
await fs.mkdir('public/videos/faq',{recursive:true});
const decoded=await wawoff2.decompress(await fs.readFile('public/assets/bogart-alt-latin-08548c5b52877c5a.woff2'));
const baseFont = fontkit.create(Buffer.from(decoded));
const font=baseFont.getVariation({wght:560,wdth:100});
const run = font.layout('domo');
let x=0;
let top=0;
let bottom=0;
let left=Infinity;
let right=0;
const paths=run.glyphs.map((glyph,i)=>{
 const offset=x+run.positions[i].xOffset;
 top=Math.max(top,glyph.bbox.maxY);
 bottom=Math.min(bottom,glyph.bbox.minY);
 left=Math.min(left,offset+glyph.bbox.minX);
 right=Math.max(right,offset+glyph.bbox.maxX);
 const p=`<path d="${glyph.path.toSVG()}" transform="translate(${offset} ${run.positions[i].yOffset})"/>`;
 x+=run.positions[i].xAdvance-24;
 return p;
}).join('');
const scale=Math.min(420/(right-left),144/(top-bottom));
const baseline=(203-(top-bottom)*scale)/2+top*scale;
const inset=(450-(right-left)*scale)/2-left*scale;
const logo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 203"><g fill="white" transform="translate(${inset} ${baseline}) scale(${scale} ${-scale})">${paths}</g></svg>`;
await fs.writeFile('public/media/wordmark.svg',logo);
await sharp(Buffer.from(logo)).resize(920,415).png().toFile('public/media/footer-wordmark.png');
await sharp(Buffer.from(logo.replaceAll('white','#aad1ee'))).resize(512,231).extend({top:140,bottom:141,left:0,right:0,background:'#161605'}).png().toFile('public/favicon/domo.png');
for(const [filename,size] of [['favicon-96x96.png',96],['apple-touch-icon.png',180],['web-app-manifest-192x192.png',192],['web-app-manifest-512x512.png',512]])await sharp('public/favicon/domo.png').resize(size,size).toFile(`public/favicon/${filename}`);
await fs.writeFile('public/favicon/favicon.svg',logo);
function ff(args) {const p=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});if(p.status)throw Error(p.stderr);}
ff(['-loop','1','-i','public/media/footer-wordmark.png','-vf','scale=920:416,format=yuv420p','-t','3','-r','24','-c:v','libx264','-preset','ultrafast','-movflags','+faststart','public/media/footer-wordmark.mp4']);
if(process.argv.includes('--logo-only'))process.exit(0);
if(!process.argv.includes('--faq-only')){
 ff(['-ss','8','-i','public/videos/domo-story.webm','-frames:v','1','public/media/story-poster.jpg']);
 ff(['-i','public/videos/domo-story.webm','-vf','scale=960:-2','-an','-c:v','libvpx-vp9','-crf','37','-b:v','0','-cpu-used','5','-row-mt','1','public/videos/domo-hero-mobile.webm']);
}
const pages=JSON.parse(await fs.readFile('docs/research/dwell.au/pages.json','utf8'));
const questions=[...pages['/'].matchAll(/<button[^>]*data-ask-question="([^"]+)"[^>]*>[\s\S]*?<\/button>/g)];
const answers={
 'popular-1':'Domo is designed around flexibility. You build a stake while living in your home, and the value you build can move with you to another Domo home. You are not tied to buying one property.',
 'popular-2':'Domo brings together a stable home, a way to build value over time, and the freedom to move. There is no traditional mortgage or large deposit. Your agreement explains the payments, costs and conditions.',
 'popular-3':'There are ongoing payments, fees and conditions, and investment values can change. Read the full agreement, understand how your stake is valued, and ask questions before deciding whether the model fits your circumstances.',
 'popular-5':'Part of your agreed monthly payment contributes to your stake. Its value is linked to the housing model and may rise or fall. Your personal illustration explains the split between housing costs and building your stake.',
 'popular-6':'Domo is for people looking for a stable place to live with more flexibility than a traditional purchase. Eligibility, affordability and available homes matter. Register your interest to discuss your circumstances.',
 'popular-7':'You do not need a traditional home deposit. The starting contribution and monthly payments depend on the home and agreement. Use the home builder to explore a configuration, then request a personalised breakdown.',
 'popular-8':'The model is designed for long term living, subject to your agreement and meeting ongoing obligations. Your contract explains occupancy, renewals and any circumstances in which a home could change.',
 'popular-9':'Your home should feel like your own. Decoration and approved changes are possible within the agreement. Larger renovations or structural work need approval so safety, quality and responsibilities stay clear.',
 'popular-10':'When life changes, you can discuss moving to another available Domo home. The value of your stake can transfer under the agreement. Availability, notice periods, valuation and any fees apply.',
 'popular-11':'Access to your stake follows the exit terms in your agreement. It is not an instant access bank account. Check notice periods, valuation timing, fees and any conditions before committing.',
 'popular-12':'Housing and investment values can fall as well as rise. A falling property market can affect the value of your stake. Understand the valuation method and the risks set out in your agreement.',
 'popular-13':'Buying can suit people who want direct ownership and can manage the deposit, mortgage and costs. Domo offers another approach for people who value flexibility. Compare the full costs and terms of both options.',
 'popular-14':'Traditional property investing usually means buying and managing an asset. Domo combines the home you live in with a stake under a specific agreement. The ownership structure, liquidity, costs and risks are different.'
};
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function wrap(s,n){const lines=[];let line='';for(const word of s.split(/\s+/)){if((line+' '+word).length>n){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;}
const faq=[];
for(const match of questions){
 const id=match[1],question=match[0].replace(/<[^>]+>/g,'').replaceAll('&#x27;',"'").replaceAll('Dwell','Domo'),answer=answers[id];
 const questionLines=wrap(question,25),answerLines=wrap(answer,40);
 const q=questionLines.map((l,i)=>`<text x="70" y="${240+i*78}" font-size="64">${escape(l)}</text>`).join('');
 const y=320+questionLines.length*78;
 const a=answerLines.map((l,i)=>`<text x="70" y="${y+i*58}" font-size="40" fill="#f5f4ed">${escape(l)}</text>`).join('');
 const card=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2160"><defs><radialGradient id="g"><stop stop-color="#373710"/><stop offset="1" stop-color="#161605"/></radialGradient></defs><rect width="1080" height="2160" fill="url(#g)"/><circle cx="1000" cy="1910" r="300" fill="none" stroke="#5d5d49" stroke-width="2"/><circle cx="1000" cy="1910" r="260" fill="none" stroke="#5d5d49" stroke-width="2"/><g fill="#aad1ee" font-family="Georgia,serif"><text x="70" y="120" font-size="32" letter-spacing="3">DOMO / ASK NELL</text>${q}${a}<text x="70" y="1940" font-size="36">A new way home.</text></g></svg>`;
 await sharp(Buffer.from(card)).png().toFile(`public/videos/faq/${id}.png`);
 const duration=Math.ceil(answer.split(' ').length/2.4)+2;
 ff(['-loop','1','-i',`public/videos/faq/${id}.png`,'-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-vf','scale=720:1440,fade=t=in:d=0.5','-t',String(duration),'-r','12','-c:v','libvpx-vp9','-crf','38','-b:v','0','-cpu-used','6','-c:a','libopus','-shortest',`public/videos/faq/${id}.webm`]);
 await fs.writeFile(`public/videos/faq/${id}.vtt`,`WEBVTT\n\n00:00:00.000 --> 00:00:${String(duration).padStart(2,'0')}.000\n${answer}\n`);
 faq.push({id,question,answer,duration});
 console.log('FAQ',id,duration);
}
await fs.writeFile('docs/research/dwell.au/faq.json',JSON.stringify(faq,null,2));
