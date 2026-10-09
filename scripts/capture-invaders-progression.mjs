import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {authorizeTestArcade} from './arcade-test-access.mjs';
import {invadersTestPilot} from './invaders-test-pilot.mjs';
import {ArcadeRecording} from '../src/lib/arcade/protocol.mjs';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4318',out='/tmp/tamagotchi-invaders-v2';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
try{for(const [width,height] of [[390,844],[1280,900]]){
 let reached=0;
 // The server chooses the seed. Retry up to three ordinary runs if the pilot
 // loses before wave four; never replace the seed or bypass the test gate.
 for(let attempt=0;attempt<3&&reached<4;attempt++){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<600,isMobile:width<600}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.clock.install({time:new Date('2026-10-09T12:00:00Z')});await page.goto(`${origin}/pt`);await page.waitForTimeout(700);
   await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Arcade do Tamagotchi/}).click();await page.getByRole('tab',{name:/Data Invaders/}).click();
   const grant=await authorizeTestArcade(page,'invaders',{start:/Defender os dados/,freezeAt:new Date('2026-10-09T12:01:00Z')}),mirror=new ArcadeRecording(grant);
   await page.clock.runFor(120);for(let i=0;i<7;i++)mirror.advance(.016);
   const canvas=page.getByRole('application',{name:'Data Invaders'}),box=await canvas.boundingBox();
   await page.mouse.move(box.x+box.width/2,box.y+box.height-25);await page.mouse.down();
   let wave=1;const entries=new Map(),captured=new Set();
   for(let step=0;step<950;step++){
    const input=invadersTestPilot(mirror.state);await page.mouse.move(box.x+input.targetX/grant.width*box.width,box.y+box.height-25);
    for(let n=0;n<6;n++)mirror.advance(.016,input);await page.clock.runFor(96);
    if(step%5===0){
     wave=Number(await canvas.getAttribute('data-wave'));reached=Math.max(reached,wave);
     if(!entries.has(wave))entries.set(wave,step);
     const phase=Math.floor((step-entries.get(wave))/20),frame=`${wave}-${phase}`;
     if(wave>=2&&wave<=4&&phase<3&&!captured.has(frame)){captured.add(frame);await page.screenshot({path:`${out}/${width}-wave-${frame}.png`});}
     if(await page.locator('.runner-stage--over').count())break;
     if(wave>=5)break;
    }
   }
   await page.mouse.up();await page.screenshot({path:`${out}/${width}-attempt-${attempt+1}.png`});assert.deepEqual(errors,[]);console.log(`${width}: run ${attempt+1}, actual browser reached wave ${wave}, mirror ${mirror.state.wave}`);
  }finally{await context.close();}
 }
 assert.ok(reached>=4,`${width}: play-through must reach the real guardian encounter`);
}}finally{await browser.close();}
