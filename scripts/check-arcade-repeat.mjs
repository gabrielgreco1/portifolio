import{chromium}from'playwright';import assert from'node:assert/strict';import{authorizeTestArcade}from'./arcade-test-access.mjs';
const origin=process.env.TEST_ORIGIN||'http://localhost:4323';if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Local only');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();await page.goto(`${origin}/pt`);await page.waitForTimeout(1400);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Arcade do Tamagotchi/}).click();
let identity,best=0;
for(let round=0;round<3;round++){
 const finish=page.waitForResponse(r=>r.url().endsWith('/api/arcade')&&r.request().method()==='POST'&&r.request().postDataJSON()?.operation==='finish');
 await authorizeTestArcade(page,'runner',{start:round===0?/Bora fugir/:/Jogar de novo/});
 await page.locator('.runner-stage--running').waitFor();await page.waitForTimeout(250);assert.equal(await page.locator('.runner-stage--paused').count(),0,'restart must not pause on layout change');
 const surface=page.getByRole('application',{name:'Data Run'});await surface.focus();await page.keyboard.down('ArrowDown');await page.waitForTimeout(150);assert.equal(await surface.getAttribute('data-ducking'),'true');await page.keyboard.up('ArrowDown');
 const response=await finish;assert.equal(response.status(),200);const data=await response.json();assert.ok(data.rank>0);assert.equal(data.personal.name,'TEST LOCAL runner');best=Math.max(best,data.score);assert.equal(data.personal.score,best);if(identity)assert.equal(data.personal.id,identity);identity=data.personal.id;
 await page.getByRole('heading',{name:'BLOQUEADO.'}).waitFor();await page.locator('.arcade-result-panel .is-you').waitFor();
 const persisted=await(await context.request.get(`${origin}/api/arcade?game=runner`)).json();assert.equal(persisted.personal.id,identity);assert.equal(persisted.personal.score,best);console.log(`round ${round+1}: named player persisted automatically, rank #${data.rank}, best ${best}, restart/keyboard passed`);
}
await context.close();}finally{await browser.close();}
