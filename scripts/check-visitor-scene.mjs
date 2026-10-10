import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const origin=process.env.TEST_ORIGIN||'http://localhost:4323';
await mkdir('/tmp/visitor-scene',{recursive:true});
for(const [name,engine] of [['chrome',chromium],['webkit',webkit]]){
 const browser=await engine.launch(name==='chrome'?{channel:'chrome'}:{});
 try{for(const [width,height,lang] of [[1440,1000,'pt'],[390,844,'pt'],[320,568,'pt'],[844,390,'en']]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(`${origin}/${lang==='pt'?'pt':''}`);
   await page.locator('.crawler-pet').press('Enter');
   await page.getByRole('button',{name:/Quem está por aqui|Who.*here/i}).click();
   await page.locator('.visitor-map').waitFor();
   assert.equal(await page.locator('#visitor-explorer').isVisible(),false);
   await page.getByRole('button',{name:'Google Analytics',exact:true}).click();
   await page.waitForTimeout(400);
   assert.equal(await page.locator('.visitor-numbers strong').first().textContent(),'869');
   await page.screenshot({path:`/tmp/visitor-scene/${name}-${width}.png`});
   const globe=page.locator('.visitor-globe>svg'),before=await page.locator('.visitor-globe-coordinate').textContent();
   await globe.press('ArrowRight');assert.notEqual(await page.locator('.visitor-globe-coordinate').textContent(),before);
   await page.locator('.visitor-explore').click();
   await page.getByRole('searchbox').fill('sao paulo');
   assert.ok(await page.locator('.visitor-city-list button').count()>0);
   await page.locator('.visitor-city-list button').first().click();
   assert.match(await page.locator('.visitor-city-detail').innerText(),/Sao Paulo|São Paulo/);
   await page.locator('.visitor-city-detail').scrollIntoViewIfNeeded();
   await page.screenshot({path:`/tmp/visitor-scene/${name}-${width}-selected.png`});
   await page.locator('.visitor-explorer-heading button').click();
   assert.equal(await page.locator('.visitor-explore').evaluate(el=>el===document.activeElement),true);
   await page.locator('.visitor-explore').click();
   await page.getByRole('button',{name:lang==='pt'?'Agora':'Now',exact:true}).click();
   assert.equal(await page.getByRole('searchbox').inputValue(),'');
   const bounds=await page.locator('.visitor-map').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1);
   assert.equal(await page.locator('.visitor-scroll').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
   await page.keyboard.press('Escape');await page.locator('.visitor-map').waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);console.log(`${name} ${width}x${height}: scene, real history, search, detail, keyboard, source switch and bounds passed`);
  }finally{await page.close();}
 }}finally{await browser.close();}
}
