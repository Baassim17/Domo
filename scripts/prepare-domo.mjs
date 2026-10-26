import fs from 'node:fs/promises';
import zlib from 'node:zlib';
const original=JSON.parse(await fs.readFile('docs/research/dwell.au/pages.json','utf8'));
const videos=JSON.parse(await fs.readFile('docs/research/dwell.au/video-map.json','utf8'));
const questions=[...original['/'].matchAll(/<button[^>]*data-ask-question="([^"]+)"[^>]*>[\s\S]*?<\/button>/g)];
const faqSources=new Map();
const presenterPosters=new Set();
for(const match of questions){
 const src=match[0].match(/data-video="([^"]+)"/)?.[1];
 const poster=match[0].match(/data-poster="([^"]+)"/)?.[1];
 if(src)faqSources.set(src.replaceAll('&amp;','&'),match[1]);
 if(poster)presenterPosters.add(poster);
}
const brand=s=>s.replace(/Dwell/g,'Domo').replace(/DWELL/g,'DOMO').replace(/dwell/g,'domo').replaceAll('ask-nat','ask-nell').replace(/\bNat\b/g,'Nell').replace(/\bNAT\b/g,'NELL');
function localize(s){
 for(const [remote,local] of Object.entries(videos)){
  const faq=faqSources.get(remote);
  const replacement=faq?`/videos/faq/${faq}.webm`:local;
  s=s.replaceAll(remote.replaceAll('&','&amp;'),replacement).replaceAll(remote,replacement);
 }
 return s;
}
const pages={};
for(const [route,raw] of Object.entries(original)){
 let html=raw;
 html=html.replace(/<div id="foo-social"[\s\S]*?<\/div>/g,'').replace(/<div id="nav-socials"[\s\S]*?<\/div>/g,'');
 html=html.replace(/<a\b[^>]*href="https:\/\/uncommondesign\.group\/[\s\S]*?<\/a>/g,'');
 html=html.replace(/https:\/\/formspree.io\/f\/xvzvkeaw/g,'/api/enquiries');
 html=localize(html);
 html=html.replace(/\sdata-stream="[^"]*"/g,'');
 html=html.replace(/<button[^>]*data-ask-question="([^"]+)"[^>]*>/g,(tag,id)=>tag.replace(/data-video="[^"]*"/,`data-video="/videos/faq/${id}.webm"`).replace(/data-poster="[^"]*"/,`data-poster="/videos/faq/${id}.png"`).replace(/data-captions="[^"]*"/,`data-captions="/videos/faq/${id}.vtt"`));
 html=html.replace(/<video\b[^>]*id="story-video"[\s\S]*?<\/video>/g,tag=>tag.replace(/src="[^"]*"/, 'src="/videos/domo-story.webm"').replace(/poster="[^"]*"/,'poster="/media/story-poster.jpg"').replace(/<track\b[^>]*\/?\s*>/g,''));
 html=html.replace(/<img\b[^>]*>/g,tag=>{
  const src=tag.match(/src="([^"]*)"/)?.[1];
  if(presenterPosters.has(src))return tag.replace(/src="[^"]*"/,'src="/videos/faq/popular-2.png"').replace(/srcSet="[^"]*"/g,'');
  if(/illustration-(?:4d1d390fc89db533|a40cb6b5cc5a25ae|998884544026fe68|9827b57f39bd852c|b8c8a2c8f6fd0b10|d7a8b402767b0980|c9328ec438338b16)/.test(tag))return tag.replace(/src="[^"]*"/,'src="/media/story-poster.jpg"').replace(/srcSet="[^"]*"/g,'');
  return tag;
 });
 html=html.replace(/<div class="fab-questions-preview"[^>]*>[\s\S]*?<\/div>/g,'<div class="fab-questions-preview" aria-hidden="true" data-ask-background="image"><img src="/images/domo-faq-mobile.webp" width="768" height="1152" alt="" loading="lazy" decoding="async"/></div>');
 if(route==='/faqs'){
  html=html.replace(/<div class="faq-hero-media"[^>]*>[\s\S]*?<\/div>/,'<div class="faq-hero-media" aria-hidden="true" data-faq-background="image"><picture><source media="(max-width: 700px)" srcSet="/images/domo-faq-mobile.webp" width="768" height="1152"/><img src="/images/domo-faq-background.webp" srcSet="/images/domo-faq-background-1280.webp 1280w, /images/domo-faq-background.webp 1920w" sizes="100vw" width="1920" height="1080" alt="" fetchPriority="high" decoding="async"/></picture></div>');
 }
 html=html.replace(/<link[^>]*rel="preload"[^>]*as="image"[^>]*>/g,'');
 html=html.replace(/<meta[^>]*(?:og:image|twitter:image)[^>]*>/g,'');
 html=html.replace(/<link[^>]*(?:rel="icon"|rel="shortcut icon"|rel="apple-touch-icon")[^>]*>/g,'');
 html=html.replace(/https:\/\/(?:www\.)?dwell\.au\/?/g,'/').replace(/(?:privacy|legal)@dwell\.com\.au/g,'hello@domo.example');
 html=html.replace(/\bABN\s*[\d ]+/g,'');
 html=html.replace(/https:\/\/google\.com/g,'/');
 html=brand(html);
 html=html.replace(/<symbol id="s-wordmark"[\s\S]*?<\/symbol>/,'<symbol id="s-wordmark" viewBox="0 0 450 203"><mask id="s-wordmark-frame" maskUnits="userSpaceOnUse" style="mask-type:alpha" x="0" y="0" width="450" height="203"><image href="/media/footer-wordmark.png" preserveAspectRatio="xMidYMid meet" x="0" y="0" width="450" height="203"></image></mask><rect x="0" y="0" width="450" height="203" mask="url(#s-wordmark-frame)"></rect></symbol>');
 if(route==='/privacy-policy'||route==='/terms-of-service'){
  const privacy=route==='/privacy-policy';
  const sections=privacy?[
   ['About this website','Domo is a local demonstration of a housing website. This version is not connected to the business shown in the design reference.'],
   ['Information you submit','The registration, trade and enquiry forms collect the details you choose to provide, including your name, contact details, location and home preferences.'],
   ['How enquiries are stored','Submitted enquiries are saved by this installation. They are not emailed to a third party or sent to the reference business. The operator of this installation is responsible for access, retention and deletion.'],
   ['Cookies and preferences','Your cookie choices and home builder location preferences may be remembered in your browser. This installation does not include analytics, advertising trackers or email marketing integrations.'],
   ['Media and external services','Images, fonts and videos are served locally. The supplied story film and the branded FAQ clips play from this installation.'],
   ['Your choices','You can clear saved browser preferences using your browser settings. Contact the person operating this installation to request access to, correction of, or deletion of an enquiry.']
  ]:[
   ['About Domo','This website is a demonstration of a housing concept. It does not offer a tenancy, property, investment product or financial service.'],
   ['Illustrations and estimates','The home builder, comparison charts and example prices illustrate the interface. They are not a quote, valuation, forecast or guarantee.'],
   ['Registering interest','Submitting a form records an enquiry with this installation. It does not create a membership, reservation, purchase, contract or payment obligation.'],
   ['Website content','The content is provided for exploring the demonstration. A real service would need its own verified business information, agreements, pricing and operating arrangements.'],
   ['Availability','This local website and its stored enquiries are managed by the person operating this installation. No availability or response time is promised.'],
   ['Privacy','See the Privacy Policy for information about form submissions and browser preferences.']
  ];
  const content=sections.map(([heading,copy],i)=>`<section class="legal-section" aria-labelledby="legal-section-${i+1}"><h2 class="legal-section-heading legal-label txt-lm txt-blue" id="legal-section-${i+1}">${i+1}. ${heading}</h2><div class="legal-body txt-pm"><p>${copy}</p></div></section>`).join('');
  html=html.replace(/<div class="legal-content">[\s\S]*?<\/article>/,`<div class="legal-content">${content}</div></article>`).replaceAll('2026-10-28','2026-10-26').replaceAll('28 October 2026','26 October 2026');
 }
 // Keep the original loader geometry while replacing its illustration with our mark.
 html=html.replace(/<img class="load-image"[^>]*>/,'<img class="load-image" src="/media/wordmark.svg" width="800" height="932" alt="Domo" fetchpriority="high"/>');
 html=html.replace('</head>','<link rel="icon" href="/favicon/domo.png"/><link rel="stylesheet" href="/domo.css"/><meta property="og:image" content="/media/story-poster.jpg"/></head>');
 html=html.replace('</body>','<script defer src="/domo.js"></script></body>');
 pages[route]=html;
}
await fs.mkdir('src/data',{recursive:true});
await fs.writeFile('src/data/pages.json',JSON.stringify(pages));
let runtime=await fs.readFile('docs/research/dwell.au/runtime.js','utf8');
runtime=brand(runtime.replaceAll('https://formspree.io/f/xvzvkeaw','/api/enquiries'));
runtime=runtime.replace('function ys(t){if(!Be(t))return!1;', 'function ys(t){if(typeof t==="string"&&/^\\/videos\\/[a-z0-9-]+\\.mp4$/.test(t))return!0;if(!Be(t))return!1;');
await fs.writeFile('public/assets/_-jmbvb2r1.js',runtime);
await fs.writeFile('public/assets/_-8sd3zfg6.css',brand(await fs.readFile('docs/research/dwell.au/site.css','utf8')));
const config=brand(localize(await fs.readFile('docs/research/dwell.au/config.json','utf8')));
await fs.writeFile('public/assets/c9f5e8f04cd3a9adb.json',config);
await fs.writeFile('public/assets/c9f5e8f04cd3a9adb.bin',zlib.gzipSync(config));
await fs.writeFile('public/favicon/site.webmanifest',JSON.stringify({name:'Domo',short_name:'Domo',icons:[{src:'/favicon/domo.png',sizes:'512x512',type:'image/png'}],theme_color:'#161605',background_color:'#161605',display:'standalone'}));
for(const filename of await fs.readdir('public/assets')){
 if(filename.endsWith('.vtt')){
  const file=`public/assets/${filename}`;
  await fs.writeFile(file,brand(await fs.readFile(file,'utf8')));
 }
}
console.log('Prepared',Object.keys(pages).length,'branded routes');
