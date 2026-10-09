import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage(),out='/tmp/tamagotchi-arcade-media';
try{
 await page.setContent('<title>Arcade sound verification</title>');
 await page.addScriptTag({content:(await readFile('src/lib/arcade/sound.mjs','utf8')).replaceAll('export ','')+';window.renderCues=async()=>{const names=Object.keys(ARCADE_CUES),rate=44100,context=new OfflineAudioContext(1,Math.ceil((names.length*.8+1)*rate),rate),master=context.createGain();master.gain.value=.55;master.connect(context.destination);names.forEach((name,i)=>scheduleArcadeCue(context,master,name,i*.8));const rendered=await context.startRendering();return {samples:Array.from(rendered.getChannelData(0)),rate,names};};'});
 const {samples,rate,names}=await page.evaluate(()=>window.renderCues());
 for(let i=0;i<names.length;i++){const section=samples.slice(Math.floor(i*.8*rate),Math.floor((i*.8+.7)*rate)),peak=Math.max(...section.map(Math.abs)),rms=Math.sqrt(section.reduce((n,v)=>n+v*v,0)/section.length);assert.ok(peak>.01&&peak<.8,`${names[i]} should be audible without clipping`);assert.ok(rms>.001);console.log(`${names[i]} peak=${peak.toFixed(3)} RMS=${rms.toFixed(3)}`);}
 const data=Buffer.alloc(44+samples.length*2);data.write('RIFF');data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(samples.length*2,40);samples.forEach((v,i)=>data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));
 await mkdir(out,{recursive:true});await writeFile(`${out}/effects.wav`,data);
}finally{await browser.close();}
