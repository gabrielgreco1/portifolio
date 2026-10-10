import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://localhost:4323';
for(const [engine,name]of [[chromium,'chrome'],[webkit,'webkit']]){
 const browser=await engine.launch(name==='chrome'?{channel:'chrome'}:{});
 try{const page=await browser.newPage({viewport:{width:1280,height:900}});let spinRequests=0;const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Deliberately slow the unrelated sprite: it must never gate a drag.
 await page.route('**/crawler-turnaround.png',async route=>{spinRequests++;await new Promise(resolve=>setTimeout(resolve,900));await route.continue();});
 await page.goto(`${origin}/pt`);const pet=page.locator('.crawler-pet');await pet.waitFor();await page.waitForTimeout(300);
 const times=[];
 for(let attempt=0;attempt<2;attempt++){
  const rect=await pet.boundingBox(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
  await page.mouse.move(x,y);await page.mouse.down();const start=Date.now();await page.mouse.move(x-70,y);
  await page.locator('canvas[data-offset]').waitFor();times.push(Date.now()-start);
  assert.equal(spinRequests,0,'Dragging must not request the spin sheet');
  await page.mouse.move(x-260,y);await page.waitForTimeout(600);assert.equal(await page.locator('canvas[data-grip]').getAttribute('data-grip'),'1.00');
  await page.mouse.up();await page.locator('[data-pet-performance]').waitFor({state:'hidden'});assert.equal(await page.getByRole('dialog').count(),0);
 }
 assert.ok(times[0]<350,`First drag should not wait on image loading: ${times[0]}ms`);
 await pet.click({clickCount:3,delay:65});await page.locator('[data-pet-performance="spin"]').waitFor();await page.locator('canvas[data-pose]').waitFor();assert.equal(spinRequests,1,'Spin still loads its own sheet');await page.locator('[data-pet-performance]').waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);console.log(name,`first/second drag ${times.join('/')}ms; grip, release, click suppression and spin passed`);
 }finally{await browser.close();}
}
