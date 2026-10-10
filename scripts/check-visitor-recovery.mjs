// Test-only intercepted feed. No production write or reset.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
let unavailable=false;
const fixture={available:true,mode:'production',total:45,active:3,startedAt:'2026-10-09T19:42:43.217Z',points:[{id:'sp',city:'São Paulo',country:'BR',latitude:-23.5,longitude:-46.6,visits:45,active:3}]};
try{
 await page.route('**/api/visitors',route=>route.request().method()==='GET'?route.fulfill(unavailable?{status:503,json:{available:false}}:{json:fixture}):route.continue());
 await page.goto(`${process.env.TEST_ORIGIN||'http://localhost:4324'}/pt`);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Quem está por aqui/}).click();
 await page.waitForFunction(()=>document.querySelector('.visitor-online strong')?.textContent==='3');
 const greenPixels=()=>page.locator('.visitor-globe canvas').evaluate(el=>{const data=el.getContext('2d').getImageData(0,0,el.width,el.height).data;let count=0;for(let i=0;i<data.length;i+=4)if(data[i]===146&&data[i+1]===237&&data[i+2]===187)count++;return count;});
 await page.waitForTimeout(100);assert.ok(await greenPixels()>0,'Confirmed live points are green');
 await page.locator('.visitor-explore').click();await page.getByRole('searchbox').fill('sao paulo');await page.locator('.visitor-city-list button').first().click();assert.match(await page.locator('.visitor-city-detail').innerText(),/3 online agora/);
 unavailable=true;await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.waitForFunction(()=>document.querySelector('.visitor-online strong')?.textContent==='—');await page.waitForTimeout(100);
 assert.equal(await greenPixels(),0,'Failed refresh removes stale live pin colors');assert.doesNotMatch(await page.locator('.visitor-city-detail').innerText(),/online agora/);assert.match(await page.locator('.visitor-city-detail').innerText(),/45 visitas registradas/);assert.match(await page.locator('.visitor-city-detail').innerText(),/129 usuários no histórico/);assert.deepEqual(await page.locator('.visitor-total strong').allTextContents(),['45','869']);
 unavailable=false;await page.getByRole('button',{name:'Reconectar',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.visitor-online strong')?.textContent==='3');await page.waitForTimeout(100);
 assert.ok(await greenPixels()>0,'Successful recovery restores confirmed live pins');assert.match(await page.locator('.visitor-city-detail').innerText(),/3 online agora/);assert.deepEqual(await page.locator('.visitor-total strong').allTextContents(),['45','869']);console.log('Success → failure → recovery: live count/pins honest, historical counts preserved.');
}finally{await browser.close();}
