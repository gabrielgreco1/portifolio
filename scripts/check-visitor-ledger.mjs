import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://localhost:4323';
for(const [engine,name] of [[chromium,'chrome'],[webkit,'webkit']]){
 const browser=await engine.launch(name==='chrome'?{channel:'chrome'}:{});
 try{for(const [width,height]of [[1440,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});let additional=0,offline=false;
 await page.route('**/api/visitors',route=>route.request().method()==='GET'?route.fulfill({status:offline?503:200,json:offline?{available:false}:{available:true,mode:'local',total:58+additional,active:2,startedAt:'2026-10-09T19:42:43.217Z',points:[{id:'test-sp',city:'São Paulo',country:'BR',latitude:-23.5,longitude:-46.6,visits:41+additional,active:2}]}}):route.continue());
 await page.goto(`${origin}/pt`);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Quem está por aqui/}).click();await page.waitForFunction(()=>document.querySelector('.visitor-total strong')?.textContent==='927');
 assert.equal(await page.locator('.visitor-total').count(),1);assert.doesNotMatch(await page.locator('.visitor-summary').innerText(),/usuários no histórico/);
 await page.getByRole('button',{name:/Ver todas as cidades/}).click();await page.getByRole('searchbox').fill('São Paulo');await page.locator('.visitor-city-list button').first().click();assert.match(await page.locator('.visitor-city-counts').first().innerText(),/2 online agora · 170 visitas registradas/);
 additional=1;await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.waitForFunction(()=>document.querySelector('.visitor-total strong')?.textContent==='928');assert.match(await page.locator('.visitor-city-counts').first().innerText(),/171 visitas registradas/);
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.waitForTimeout(200);assert.equal(await page.locator('.visitor-total strong').textContent(),'928');
 offline=true;await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.locator('.visitor-connection-notice').waitFor({state:'attached'});assert.equal(await page.locator('.visitor-total strong').textContent(),'928');assert.doesNotMatch(await page.locator('.visitor-city-counts').first().innerText(),/online/);
 await page.screenshot({path:`/tmp/visitor-ledger-${name}-${width}.png`});await page.close();console.log(name,width,'one total, city balance, refreshed visits, no double import, outage preservation passed');
 }}finally{await browser.close();}
}
