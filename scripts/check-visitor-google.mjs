import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4318',out='/tmp/tamagotchi-map-google';await mkdir(out,{recursive:true});
for(const engine of process.env.TEST_BROWSER?[process.env.TEST_BROWSER]:['chrome','webkit']){
 const browser=await(engine==='chrome'?chromium.launch({channel:'chrome'}):webkit.launch());
 try{for(const [width,height,lang] of [[1280,1000,'pt'],[390,844,'pt'],[320,568,'pt'],[844,390,'en']]){
  if(process.env.TEST_WIDTH&&width!==+process.env.TEST_WIDTH)continue;
  const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   // Google history must work even when the live database is unavailable.
   await page.route('**/api/visitors',r=>r.request().method()==='GET'?r.fulfill({status:503,json:{available:false}}):r.continue());
   await page.goto(`${origin}${lang==='pt'?'/pt':'/'}`);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:lang==='pt'?/Quem está por aqui/:/Who is here/}).click();await page.getByRole('button',{name:'Google Analytics',exact:true}).click();
   await page.locator('.visitor-explore').click();await page.locator('.visitor-city-list button').first().waitFor();assert.equal(await page.locator('.visitor-city-list button').count(),320);assert.match(await page.locator('.visitor-numbers').textContent(),/869/);assert.equal(await page.locator('.visitor-status').textContent(),'GA4');assert.doesNotMatch(await page.locator('.visitor-map').innerText(),/NaN|undefined/);assert.equal(await page.locator('.visitor-hour-bars').count(),0);assert.equal(await page.locator('.visitor-signal-list').count(),0);
   const search=page.getByRole('searchbox');await search.fill('sao paulo');assert.equal(await page.locator('.visitor-city-list button').count(),74,'Search finds both city and its region');await page.locator('.visitor-city-list button').filter({has:page.getByText('Sao Paulo',{exact:true})}).click();await page.waitForTimeout(900);assert.equal(await page.locator('.visitor-point--selected').count(),1);assert.match(await page.locator('.visitor-city-detail').innerText(),/129/);assert.match(await page.locator('.visitor-city-detail').innerText(),/39/);
   await page.locator('.visitor-scroll').evaluate(e=>e.scrollTop=0);await page.screenshot({path:`${out}/${engine}-${width}-real-history.png`});
   await search.fill('Illinois');assert.equal(await page.locator('.visitor-city-list button').count(),1);await page.locator('.visitor-city-list button').click();await page.waitForTimeout(900);assert.equal(await page.locator('.visitor-point--selected').count(),1);assert.match(await page.locator('.visitor-city-detail').innerText(),/Glenview/);assert.match(await page.locator('.visitor-city-detail').innerText(),/Illinois/);
   await search.fill('Mountain View');await page.locator('.visitor-city-list button').click();assert.equal(await page.locator('.visitor-point--selected').count(),0);assert.match(await page.locator('.visitor-city-detail').innerText(),lang==='pt'?/sem marcador/:/without a map pin/);
   await search.fill(lang==='pt'?'não informada':'not reported');assert.equal(await page.locator('.visitor-city-list button').count(),9);await page.locator('.visitor-city-list button').first().click();assert.match(await page.locator('.visitor-city-detail').innerText(),/20/);
   await page.getByRole('button',{name:lang==='pt'?'Agora':'Now',exact:true}).click();assert.equal(await page.locator('.visitor-city-detail').count(),0);assert.equal(await page.locator('.visitor-city-list button').count(),0);assert.equal(await search.inputValue(),'');assert.match(await page.locator('.visitor-numbers').textContent(),/—/);assert.doesNotMatch(await page.locator('.visitor-footer').innerText(),/Fetching|Buscando/);assert.match(await page.locator('.visitor-locations>header').innerText(),/—/);await page.getByRole('button',{name:'Google Analytics',exact:true}).click();assert.equal(await page.locator('.visitor-city-list button').count(),320);
   const bounds=await page.locator('.visitor-map').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1);assert.equal(await page.locator('.visitor-scroll').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);assert.deepEqual(errors,[]);
   await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});console.log(`${engine} ${width} ${lang}: real GA rows, totals, pin/detail, unknown city, independent offline source, switching and bounds passed`);
  }catch(e){await page.screenshot({path:`${out}/${engine}-${width}-failure.png`});throw e;}finally{await context.close();}
 }}finally{await browser.close();}
}
