import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4318',out='/tmp/tamagotchi-arcade-layout';
await mkdir(out,{recursive:true});
for(const engine of ['chrome','webkit']){
 const browser=await(engine==='chrome'?chromium.launch({channel:'chrome'}):webkit.launch());
 try{for(const [width,height,lang] of [[320,568,'pt'],[844,390,'pt'],[390,844,'en']]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(`${origin}${lang==='pt'?'/pt':'/'}`);await page.locator('.crawler-pet').waitFor();await page.waitForTimeout(500);
   await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/arcade/i}).click();
   for(const game of ['runner','invaders']){
    if(game==='invaders')await page.getByRole('tab',{name:/Data Invaders/}).click();
    await page.locator('.arcade-ranking-access').click();await page.locator('.arcade-panel').waitFor();
    let box=await page.locator('.arcade-panel').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,`${engine} ${width} ranking outside viewport`);
    await page.screenshot({path:`${out}/${engine}-${width}-${game}-ranking.png`});
    await page.locator('[data-panel-focus]').click();
    await page.locator('.runner-overlay .arcade-primary').click();
    await page.locator('.arcade-gate .arcade-primary').waitFor();
    await page.waitForFunction(()=>!document.querySelector('.arcade-gate .arcade-primary').disabled);
    await page.locator('.arcade-gate .arcade-primary').focus();await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-panel-focus]').evaluate(el=>el===document.activeElement),true,'Tab remains inside the active panel');
    assert.equal(await page.locator('.arcade-panel').evaluate(el=>el.scrollWidth>el.clientWidth+1),false,`${engine} ${width} CAPTCHA overflows horizontally`);
    await page.screenshot({path:`${out}/${engine}-${width}-${game}-gate.png`});
    await page.locator('[data-panel-focus]').click();await page.locator('.runner-overlay .arcade-primary').click();
    assert.equal(await page.locator('.arcade-gate .arcade-primary').isDisabled(),true,'Reopening must not reuse the previous CAPTCHA token');
    await page.locator('[data-panel-focus]').press('Escape');assert.equal(await page.locator('.arcade-panel').count(),0);
    assert.equal(await page.getByRole('dialog').count(),1,'Escape closes the inner panel, not the entire arcade');
   }
   assert.deepEqual(errors,[]);console.log(`${engine} ${width}×${height} ${lang}: rankings, CAPTCHA layout, cancel/reopen, Escape passed`);
  }catch(error){await page.screenshot({path:`${out}/${engine}-${width}-failure.png`});throw error;}finally{await context.close();}
 }}finally{await browser.close();}
}
