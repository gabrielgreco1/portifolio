import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const origin=process.env.TEST_ORIGIN||'http://localhost:4324';
await mkdir('/tmp/visitor-unified',{recursive:true});
for(const [name,engine] of [['chrome',chromium],['webkit',webkit]]){
 const browser=await engine.launch(name==='chrome'?{channel:'chrome'}:{});
 try{for(const [width,height,lang] of [[1440,900,'pt'],[1440,700,'pt'],[390,844,'pt'],[320,568,'pt'],[844,390,'en']]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   if(process.env.TEST_OFFLINE)await page.route('**/api/visitors',route=>route.request().method()==='GET'?route.fulfill({status:503,json:{available:false}}):route.continue());
   await page.goto(`${origin}/${lang==='pt'?'pt':''}`);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Quem está por aqui|Who.*here/i}).click();await page.locator('.visitor-map').waitFor();await page.waitForTimeout(350);
   assert.equal(await page.getByRole('button',{name:'Google Analytics',exact:true}).count(),0);
   assert.equal(await page.getByRole('button',{name:'Desde o início',exact:true}).count(),0);
   assert.match(await page.locator('.visitor-summary').innerText(),/869/);
   const canvas=page.locator('.visitor-globe canvas');
   // Pointer focus is quiet; keyboard focus remains visibly discoverable.
   const globeBox=await canvas.boundingBox();await page.mouse.click(globeBox.x+globeBox.width*.75,globeBox.y+globeBox.height*.5);assert.equal(await canvas.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
   const before=await canvas.evaluate(e=>e.toDataURL());await canvas.press('ArrowRight');let changed=false;for(let i=0;i<20&&!changed;i++){await page.waitForTimeout(100);changed=await canvas.evaluate((e,b)=>e.toDataURL()!==b,before);}assert.ok(changed,'Keyboard rotation draws a new frame');assert.equal(await canvas.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
   if(await page.locator('.visitor-explore').getAttribute('aria-expanded')==='false')await page.locator('.visitor-explore').click();await page.getByRole('searchbox').fill('sao paulo');await page.locator('.visitor-city-list button').first().click();
   const detail=await page.locator('.visitor-city-detail').innerText();assert.match(detail,/São Paulo/);assert.match(detail,/Estado \/ região|State \/ region/);assert.match(detail,/País|Country/);assert.match(detail,/129/);assert.match(detail,/39/);assert.doesNotMatch(detail,/usuários ativos|active users/);
   await page.screenshot({path:`/tmp/visitor-unified/${name}-${width}-${height}-detail.png`});
   await page.getByRole('searchbox').fill('Mountain View');await page.locator('.visitor-city-list button').first().click();assert.match(await page.locator('.visitor-city-detail').innerText(),/sem ponto no globo|without a map pin/);
   await page.locator('.visitor-explorer-heading button').click();await page.waitForTimeout(80);assert.equal(await page.locator('.visitor-explore').evaluate(e=>e===document.activeElement),true);
   if(name==='chrome'&&width===390){const box=await canvas.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2,cdp=await page.context().newCDPSession(page),beforePinch=await canvas.evaluate(e=>e.toDataURL());const touch=(id,x)=>({id,x,y,radiusX:4,radiusY:4});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,x-25),touch(2,x+25)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,x-55),touch(2,x+55)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(120);assert.ok(await canvas.evaluate((e,b)=>e.toDataURL()!==b,beforePinch),'Touch pinch redraws the globe');}
   const bounds=await page.locator('.visitor-map').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1);
   const button=await page.locator('.visitor-explore').boundingBox();assert.ok(button.y>=bounds.y&&button.y+button.height<=bounds.y+bounds.height+1,'Explore button stays inside dialog');
   assert.equal(await page.locator('.visitor-map').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
   await page.screenshot({path:`/tmp/visitor-unified/${name}-${width}-${height}.png`});
   await page.keyboard.press('Escape');await page.locator('.visitor-map').waitFor({state:'hidden'});assert.deepEqual(errors,[]);console.log(`${name} ${width}x${height}: unified data, location semantics, keyboard, bounds, close passed`);
  }finally{await page.close();}
 }}finally{await browser.close();}
}
