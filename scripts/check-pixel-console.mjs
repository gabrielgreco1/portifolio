import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://localhost:4323';
for(const [engine,name]of [[chromium,'chrome'],[webkit,'webkit']]){
 const browser=await engine.launch(name==='chrome'?{channel:'chrome'}:{});
 try{for(const [width,height]of [[1280,900],[390,844],[320,568],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<600,isMobile:width<600,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.nativeFullscreenCalls=0;Element.prototype.requestFullscreen=function(){window.nativeFullscreenCalls++;throw Error('Native fullscreen must never be requested');};});
  await page.goto(`${origin}/pt`);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Arcade do Tamagotchi/}).click();const dialog=page.getByRole('dialog',{name:'Videogame do Tamagotchi'});await dialog.waitFor();await page.locator('.console-menu button').first().waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(150);
  assert.equal(await dialog.getByRole('heading',{name:'Arcade',exact:true}).count(),0);
  for(const game of ['Data Run','Data Invaders']){
   await page.getByRole('tab',{name:new RegExp(game)}).click();const menu=page.getByRole('navigation',{name:'Menu do jogo'});await menu.getByRole('button',{name:'Jogar',exact:true}).focus();await page.keyboard.press('ArrowDown');assert.equal(await menu.getByRole('button',{name:'Ranking',exact:true}).evaluate(e=>document.activeElement===e),true);await page.keyboard.press('Enter');await page.getByRole('region',{name:'Ranking',exact:true}).waitFor();await page.getByRole('button',{name:'Voltar ao jogo'}).click();
   await menu.getByRole('button',{name:'Configurações',exact:true}).click();await page.getByRole('region',{name:'Configurações do videogame'}).waitFor();const sound=page.locator('.console-settings button').first(),before=await sound.getAttribute('aria-pressed');await sound.click();assert.notEqual(await sound.getAttribute('aria-pressed'),before);await page.keyboard.press('Escape');await page.locator('.console-settings').waitFor({state:'hidden'});
   for(let i=0;i<2;i++){await page.getByRole('button',{name:'Maximizar',exact:true}).click();assert.equal(await dialog.getAttribute('data-screen-mode'),'expanded');const full=await dialog.boundingBox();assert.ok(full.width>=width-1&&full.height>=height-1);assert.equal(await page.evaluate(()=>document.fullscreenElement),null);await page.getByRole('button',{name:'Minimizar',exact:true}).click();assert.equal(await dialog.getAttribute('data-screen-mode'),'window');}
   const box=await dialog.boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
   for(const button of await menu.getByRole('button').all()){const r=await button.boundingBox();assert.ok(r.y>=box.y&&r.y+r.height<=box.y+box.height,'Menu buttons fit without scrolling');}
   await page.screenshot({path:`/tmp/pixel-console-${name}-${width}-${game.replaceAll(' ','-')}.png`});
  }
  assert.equal(await page.evaluate(()=>window.nativeFullscreenCalls),0);assert.deepEqual(errors,[]);await page.close();console.log(name,width,'pixel menu, keyboard navigation, ranking, settings, repeated site-only expand/restore passed');
 }}finally{await browser.close();}
}
