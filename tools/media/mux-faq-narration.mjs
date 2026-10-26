import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
const items=JSON.parse(await fs.readFile('docs/research/dwell.au/faq.json','utf8'));
for(const item of items){
 const base=`public/videos/faq/${item.id}`;
 const wav=await fs.readFile(`${base}.wav`);
 const seconds=Math.ceil(wav.length/44100)+1;
 const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-stream_loop','-1','-i',`${base}.webm`,'-i',`${base}.wav`,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','libopus','-b:a','64k','-t',String(seconds),`${base}-voiced.webm`],{encoding:'utf8',timeout:30000});
 if(result.status)throw Error(result.stderr);
 await fs.rename(`${base}-voiced.webm`,`${base}.webm`);
 // SAPI PCM is 22.05 kHz mono 16-bit. Captions remain available throughout the clip.
 await fs.writeFile(`${base}.vtt`,`WEBVTT\n\n00:00:00.000 --> 00:01:00.000\n${item.answer}\n`);
 console.log(item.id,'narration muxed',seconds);
}
