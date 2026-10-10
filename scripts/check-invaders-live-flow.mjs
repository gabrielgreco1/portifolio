import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {authorizeTestArcade} from './arcade-test-access.mjs';
import {createInvaders,startInvaders,advanceInvaders} from '../src/lib/crawler/invaders.mjs';
import {invadersTestPilot} from './invaders-test-pilot.mjs';
const origin=process.env.TEST_ORIGIN||'http://localhost:4323';
assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
await mkdir('/tmp/invaders-live-flow',{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[],checkpoints=[];
 page.on('pageerror',e=>errors.push(e.message));
 let finishResult,flightTicks=false;
 // Delay only the response to one genuine local checkpoint. The actual server
 // still validates every segment and the final score; no game state is patched.
 await page.route('**/api/arcade',async route=>{
  const req=route.request(),body=req.method()==='POST'?req.postDataJSON():null;
  if(body?.operation==='checkpoint'){
   const response=await route.fetch();checkpoints.push({status:response.status(),body:await response.json()});
   if(checkpoints.length===1){const before=await page.locator('.invaders-wave-score').innerText();await new Promise(r=>setTimeout(r,1200));const after=await page.locator('.invaders-wave-score').innerText();flightTicks=before!==after;}
   await route.fulfill({response});
  }else if(body?.operation==='finish'){
   const response=await route.fetch();finishResult={status:response.status(),body:await response.json()};await route.fulfill({response});
  }else await route.continue();
 });
 await page.goto(`${origin}/pt`);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Arcade do Tamagotchi/}).click();await page.getByRole('tab',{name:/Data Invaders/}).click();
 const run=await authorizeTestArcade(page,'invaders',{start:/^▶?\s*Jogar$/});assert.equal(run.version,'invaders-3');
 const mirror=createInvaders(run.width,run.height,run.seed);startInvaders(mirror);
 const canvas=page.locator('canvas[aria-label="Data Invaders"]');await page.locator('.runner-stage--running').waitFor();
 assert.equal(await page.locator('.invaders-bottom').isVisible(),false);
 const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height-25);await page.mouse.down();
 let last=performance.now(),highestWave=1;
 for(let step=0;step<950;step++){
  const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;
  const input=invadersTestPilot(mirror);advanceInvaders(mirror,dt,input);
  await page.mouse.move(box.x+input.targetX/run.width*box.width,box.y+box.height-25);
  if(step%10===0){if(await page.locator('.invaders-result').count())break;highestWave=Math.max(highestWave,Number(await canvas.getAttribute('data-wave')));}
  if(highestWave>=3&&checkpoints.length){await page.mouse.up();break;}
  await page.waitForTimeout(80);
 }
 await page.mouse.up();
 await page.locator('.invaders-result').waitFor({timeout:120000});
 await page.waitForFunction(()=>!document.querySelector('.invaders-result-footer .arcade-primary')?.disabled,{},{timeout:20000});
 assert.equal(finishResult?.status,200,JSON.stringify(finishResult));assert.ok(finishResult.body.personal);assert.equal(finishResult.body.personal.name,'TEST LOCAL invaders');
 assert.ok(checkpoints.length>0,'Actual gameplay must reach a verified checkpoint');assert.ok(checkpoints.every(c=>c.status===200),JSON.stringify(checkpoints));
 assert.equal(await page.locator('.invaders-result').evaluate(e=>e.scrollHeight>e.clientHeight+1),false);
 await page.screenshot({path:'/tmp/invaders-live-flow/result.png'});assert.deepEqual(errors,[]);
 console.log(JSON.stringify({highestWave,checkpoints:checkpoints.length,score:finishResult.body.personal.score,rank:finishResult.body.personal.rank,scoreChangedWhileResponseDelayed:flightTicks,autoSaved:true}));
 await context.close();
}finally{await browser.close();}
