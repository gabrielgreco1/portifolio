// Deterministic browser proof for the interactive sprite, not a separate animation mock.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const output=process.env.PET_CAPTURE_DIR||'/tmp/tamagotchi-motion';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.clock.install();
await page.goto(process.env.PET_ORIGIN||'http://127.0.0.1:4318/pt');
await page.locator('.crawler-pet').waitFor();
await page.waitForTimeout(900);
// Preload the exact assets before freezing the animation clock.
await page.evaluate(async()=>{await Promise.all(['/crawler-character-v2.png','/crawler-turnaround.png'].map(src=>new Promise(resolve=>{const i=new Image();i.onload=resolve;i.src=src;})));});
await page.clock.pauseAt(new Date());
const frames=[];
for(const [kind,count,times] of [['spin',3,[0,180,340,470,580,690,810,940,1140,1500]],['overload',5,[0,480,950,1350,1550,1750,2000,2300,2650,3100]]]){
 await page.locator('.crawler-pet').click({clickCount:count});
 await page.clock.runFor(count===3?355:20);
 let elapsed=0;
 for(const time of times){
  await page.clock.runFor(time-elapsed);elapsed=time;
  const file=`${kind}-${time}.png`;await page.screenshot({path:`${output}/${file}`,clip:{x:880,y:550,width:400,height:350}});frames.push({kind,time,file});
 }
 await page.clock.runFor(500);
 if(await page.locator('[data-pet-performance]').count())throw new Error(`${kind} did not finish`);
 if(await page.locator('.crawler-pet[data-pet-acting]').count())throw new Error('Resting sprite did not return');
}
await writeFile(`${output}/index.html`,`<!doctype html><style>body{font:14px monospace;background:#dedfd9;margin:20px}main{display:grid;grid-template-columns:repeat(5,240px);gap:12px}figure{margin:0;background:#fff}img{width:240px;display:block}figcaption{padding:8px}</style><main>${frames.map(f=>`<figure><img src="${f.file}"><figcaption>${f.kind} · ${f.time}ms</figcaption></figure>`).join('')}</main>`);
await page.goto(`file://${output}/index.html`);await page.setViewportSize({width:1280,height:1040});await page.screenshot({path:`${output}/contact-sheet.png`,fullPage:true});
await browser.close();
if(errors.length)throw new Error(errors.join('\n'));
console.log(`Captured ${frames.length} frames: ${output}/contact-sheet.png`);
