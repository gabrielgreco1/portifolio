import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://localhost:4323';
for(const [engine,name] of [[chromium,'chrome'],[webkit,'webkit']]){
 const browser=await engine.launch(name==='chrome'?{channel:'chrome'}:{});
 try{for(const [width,height] of [[1280,900],[390,844],[320,568],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<600,isMobile:width<600,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${origin}/pt`);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Quem está por aqui/}).click();
  await page.getByRole('button',{name:/Ver todas as cidades/}).click();await page.getByRole('searchbox').fill('São Paulo');await page.locator('.visitor-city-list button').first().click();await page.locator('.visitor-explorer-heading button').click();
  const card=page.getByRole('region',{name:'Ficha da cidade'});await card.waitFor();assert.match(await card.innerText(),/São Paulo/);assert.match(await card.innerText(),/Brasil/);assert.match(await card.innerText(),/Estado \/ região/);assert.doesNotMatch(await card.innerText(),/usuários ativos/);
  await page.getByRole('button',{name:'Fechar ficha'}).click();await card.waitFor({state:'hidden'});
  const b=await page.locator('.visitor-globe canvas').boundingBox(),scale=Math.min(b.width/720,b.height/600),x=b.x+b.width/2,y=b.y+(b.height-600*scale)/2+296*scale;
  if(width<600)await page.touchscreen.tap(x,y);else await page.mouse.move(x,y);
  await card.waitFor();assert.match(await card.innerText(),/São Paulo/);
  if(width>=600){await page.getByRole('button',{name:'Manter aberta'}).click();await page.mouse.move(5,5);await page.waitForTimeout(350);assert.ok(await card.isVisible(),'Pinned card survives leaving the marker');}
  assert.equal(await page.locator('.visitor-locations').count(),0,'A marker does not launch the full city browser');
  const rect=await card.boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width&&rect.y+rect.height<=height,'Card must fit viewport');assert.equal(await card.evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
  assert.ok(await card.locator('h3').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'City name is not obscured by another layer');
  await page.screenshot({path:`/tmp/city-card-${name}-${width}.png`});if(await card.locator('.visitor-point-neighbors').count()){await card.locator('summary').click();const choice=card.locator('.visitor-point-neighbors button').nth(1),city=await choice.locator('strong').innerText();await choice.click();await page.waitForTimeout(80);assert.equal(await card.locator('h3').innerText(),city);}
  await page.getByRole('button',{name:'Fechar ficha'}).click();assert.equal(await card.count(),0);assert.deepEqual(errors,[]);await page.close();console.log(name,width,'city hierarchy, hover/tap, pin persistence, close and bounds passed');
 }}finally{await browser.close();}
}
