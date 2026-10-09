import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const engine=process.env.TEST_BROWSER==='webkit'?webkit:chromium;
const browser=await engine.launch(engine===chromium?{channel:'chrome',headless:true}:{headless:true});
const out='/tmp/tamagotchi-protest';await mkdir(out,{recursive:true});
const width=Number(process.env.TEST_WIDTH||1280),height=width===1280?900:width===844?390:width===320?568:844,pt=width!==844;
const context=await browser.newContext({viewport:{width,height},reducedMotion:process.env.TEST_REDUCED?'reduce':'no-preference',hasTouch:width!==1280});
const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
const name=engine===webkit?'webkit':'chrome';
try{
 await page.goto(`${process.env.TEST_ORIGIN||'http://127.0.0.1:4318'}/${pt?'pt':''}`);
 await page.getByRole('button',{name:pt?'Solta o crawler.':'Unleash the crawler.',exact:true}).click();
 await page.getByRole('button',{name:pt?'Começar coleta ↗':'Start collecting ↗',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.crawl-memory-count'));
 const counts=()=>page.locator('.crawl-control-status').innerText();
 const initial=await counts();let preserved=0;
 // A width change pauses safely without using up the visitor's patience.
 await page.setViewportSize({width:width-1,height});
 await page.getByRole('button',{name:pt?'Continuar':'Continue',exact:true}).waitFor();
 assert.equal(await page.locator('.crawl-protest').count(),0);
 await page.setViewportSize({width,height});
 await page.getByRole('button',{name:pt?'Continuar':'Continue',exact:true}).click();
 for(let level=1;level<=(process.env.TEST_COMPLETE?2:3);level++){
   await page.waitForTimeout(850);
   preserved=Number((await page.locator('.crawl-memory-count').innerText()).split(' ')[0]);
   if(level===1&&process.env.TEST_TOUCH){
     const touch=await context.newCDPSession(page);
     await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:30,y:300}]});
     await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:30,y:220}]});
     await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
     await touch.detach();
   }else if(level===1&&engine===webkit){await page.locator('body').press('PageDown');}
   else if(level===1){await page.mouse.move(30,200);await page.mouse.wheel(0,190);}
   else await page.getByRole('button',{name:pt?'Pausar':'Pause',exact:true}).click();
   const protest=page.locator('.crawl-protest');await protest.waitFor();
   assert.equal(await protest.getAttribute('data-level'),String(level));
   if(level===1&&process.env.TEST_FRAMES){
     await page.screenshot({path:`${out}/${name}-${width}-approach-start.png`});
     await page.waitForTimeout(230);await page.screenshot({path:`${out}/${name}-${width}-approach-mid.png`});
   }
   await page.waitForTimeout(1100);
   await page.screenshot({path:`${out}/${name}-${width}-${level}.png`});
   const heading=page.locator('#protest-title'),box=await heading.boundingBox();
   assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height,JSON.stringify(box));
   const buttons=page.locator('.crawl-protest-actions button');for(const button of await buttons.all()){const b=await button.boundingBox();assert.ok(b.y>=0&&b.y+b.height<=height,JSON.stringify(b));}
   assert.equal(await page.locator('main').evaluate(n=>n.inert),true);
   // Repeated wheel events during one protest are one interruption, not three.
   await page.mouse.wheel(0,100);assert.equal(await protest.getAttribute('data-level'),String(level));
   if(level===2&&process.env.TEST_ROTATE){
     await page.setViewportSize({width:height,height:width});await page.waitForTimeout(200);
     for(const button of await buttons.all()){const b=await button.boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=height&&b.y+b.height<=width);}
   }
   await buttons.first().focus();await page.keyboard.press('Shift+Tab');assert.ok(await page.locator('.crawl-protest').evaluate(n=>n.contains(document.activeElement)));
   if(level===1&&process.env.TEST_COMPLETE){
     await page.keyboard.press('Escape');await protest.waitFor({state:'hidden'});
     assert.equal(await page.locator('.crawl-protest').count(),0);
     await page.getByRole('button',{name:pt?'Continuar':'Continue',exact:true}).click();
   }else if(level<3)await buttons.first().click();
   else await protest.waitFor({state:'hidden',timeout:9000});
   await protest.waitFor({state:'hidden'});
   if(level===2&&process.env.TEST_ROTATE){
     const b=await page.locator('.crawl-actor').boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=height&&b.y+b.height<=width);
     await page.setViewportSize({width,height});
     await page.getByRole('button',{name:pt?'Continuar':'Continue',exact:true}).click();
   }
 }
 if(process.env.TEST_COMPLETE){
   await page.getByRole('dialog',{name:pt?'Pronto para levar.':'Ready to take away.'}).waitFor({timeout:90000});
   await page.getByRole('tab',{name:/JSON/}).click();
   await page.getByRole('checkbox',{name:pt?'Mostrar origens':'Show provenance'}).check();
   const completed=JSON.parse((await page.locator('.json-text').allTextContents()).join('\n'));
   assert.equal(completed.evidence.length,52);assert.equal(new Set(completed.evidence.map(x=>x.target_id)).size,52);assert.equal(completed.coverage.complete,true);assert.deepEqual(errors,[]);
   console.log(`${name} ${width}: Escape pauses without resuming, keyboard focus stays in dialogue, full extraction after two protests retains all 52 distinct fragments`);
   process.exitCode=0;
 }else{
 await page.waitForTimeout(150);
 assert.equal(await page.locator('.crawl-actor--sulking').count(),1);
 assert.match(await counts(),pt?/greve/:/strike/);
 assert.equal(await page.getByRole('button',{name:pt?'Continuar':'Continue',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:pt?'Escolher trecho':'Choose a fragment',exact:true}).count(),0);
 assert.equal(await page.locator('main').evaluate(n=>n.inert),false);
 await page.screenshot({path:`${out}/${name}-${width}-strike.png`});
 await page.getByRole('button',{name:pt?'Abrir menu do Tamagotchi':'Open Tamagotchi menu',exact:true}).click();
 const menu=page.getByRole('dialog',{name:pt?'Menu do Tamagotchi':'Tamagotchi menu'});await menu.waitFor();
 assert.equal(await menu.getByRole('button',{name:pt?/Só depois de um refresh/:/Only after a refresh/}).isEnabled(),false);
 await page.waitForTimeout(250);assert.ok(await menu.evaluate(n=>n.contains(document.activeElement)));
 await menu.getByRole('button',{name:pt?'Fechar menu':'Close menu',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:pt?'Solta o crawler.':'Unleash the crawler.',exact:true}).isEnabled(),false);
 // Partial evidence remains downloadable and closing it cannot reset the strike.
 await page.locator('.crawl-controls').getByRole('button',{name:pt?'Ver a coleta':'View collection',exact:true}).click();
 await page.getByRole('dialog',{name:pt?'Pronto para levar.':'Ready to take away.'}).waitFor();
 assert.equal(await page.getByRole('button',{name:pt?'Nova coleta só após refresh':'Refresh to collect again',exact:true}).isEnabled(),false);
 await page.getByRole('tab',{name:/JSON/}).click();
 await page.getByRole('checkbox',{name:pt?'Mostrar origens':'Show provenance'}).check();
 const data=JSON.parse((await page.locator('.json-text').allTextContents()).join('\n'));assert.ok(data.records.length>0);assert.ok(data.evidence.length>=preserved);
 await page.keyboard.press('Escape');
 await page.locator('.crawl-actor--sulking').waitFor();
 await page.getByRole('button',{name:pt?'Fazer as pazes ↻':'Make peace ↻',exact:true}).click();
 await page.getByRole('button',{name:pt?'Solta o crawler.':'Unleash the crawler.',exact:true}).waitFor();
 assert.equal(await page.locator('.crawl-actor--sulking').count(),0);
 assert.ok(await page.getByRole('button',{name:pt?'Solta o crawler.':'Unleash the crawler.',exact:true}).isEnabled());
 assert.deepEqual(errors,[]);
 console.log(`${name} ${width}: three distinct protests, no resize penalty, wheel deduplication, bounds, saved data, strike lock and refresh recovery passed (${initial})`);
}
}finally{await browser.close();}
