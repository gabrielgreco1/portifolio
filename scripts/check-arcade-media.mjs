import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {authorizeTestArcade} from './arcade-test-access.mjs';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4318',out='/tmp/tamagotchi-arcade-media';await mkdir(out,{recursive:true});
for(const engine of (process.env.TEST_BROWSER?[process.env.TEST_BROWSER]:['chrome','webkit'])){
 const browser=await(engine==='chrome'?chromium.launch({channel:'chrome'}):webkit.launch());
 try{for(const [width,height,fallback]of[[1280,900,false],[390,844,true],[844,390,true],[320,568,true]]){
  if(process.env.TEST_WIDTH&&width!==Number(process.env.TEST_WIDTH))continue;
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({fallback})=>{
   window.__arcadeAudio={contexts:[],voices:[],starts:0};const Original=window.AudioContext||window.webkitAudioContext;
   if(Original)window.AudioContext=class extends Original{
    constructor(...args){super(...args);window.__arcadeAudio.contexts.push(this);}
    createOscillator(){const node=super.createOscillator(),voice={connected:false},start=node.start.bind(node),connect=node.connect.bind(node),disconnect=node.disconnect.bind(node);window.__arcadeAudio.voices.push(voice);const setFrequency=node.frequency.setValueAtTime.bind(node.frequency);node.frequency.setValueAtTime=(value,...a)=>{voice.startFrequency=value;return setFrequency(value,...a);};node.start=(...a)=>{window.__arcadeAudio.starts++;return start(...a);};node.connect=(...a)=>{voice.connected=true;return connect(...a);};node.disconnect=(...a)=>{voice.connected=false;return disconnect(...a);};return node;}
   };
   if(fallback)Object.defineProperty(document,'fullscreenEnabled',{get:()=>false});
  },{fallback});
  try{
   await page.goto(`${origin}/pt`);await page.locator('.crawler-pet').waitFor();await page.waitForTimeout(450);
   assert.equal(await page.evaluate(()=>window.__arcadeAudio.contexts.length),0,'No audio context before interaction');
   await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Arcade do Tamagotchi/}).click();
   await page.getByRole('button',{name:'Tela cheia',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.pet-arcade').dataset.screenMode!=='window');
   const mode=await page.locator('.pet-arcade').getAttribute('data-screen-mode');assert.equal(mode,fallback?'expanded':engine==='chrome'?'native':mode);
   for(const game of ['runner','invaders']){
    if(game==='invaders')await page.getByRole('tab',{name:/Data Invaders/}).click();
    const canvas=page.getByRole('application',{name:game==='runner'?'Data Run':'Data Invaders'});await authorizeTestArcade(page,game,{start:game==='runner'?/Começar corrida/:/Defender os dados/});
    await page.locator('.runner-stage--running').waitFor();await canvas.focus();
    let before=await page.evaluate(()=>window.__arcadeAudio.starts);await page.keyboard.down('Space');await page.waitForTimeout(210);await page.keyboard.up('Space');
    assert.ok(await page.evaluate(n=>window.__arcadeAudio.starts>n,before),'A real jump or shot schedules audio voices');
    if(game==='invaders'){await page.keyboard.down('Space');await page.waitForTimeout(100);await page.getByRole('button',{name:'Silenciar som',exact:true}).focus();await page.keyboard.up('Space');await page.waitForTimeout(100);const shots=await page.evaluate(()=>window.__arcadeAudio.voices.filter(v=>v.startFrequency===820).length);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__arcadeAudio.voices.filter(v=>v.startFrequency===820).length),shots,'Moving focus to the toolbar releases held fire');}
    await canvas.press('p');await page.locator('.runner-stage--paused').waitFor();await page.waitForTimeout(280);
    assert.equal(await page.evaluate(()=>window.__arcadeAudio.voices.filter(v=>v.connected).length),0,'Pause silences all voices');
    const size=await canvas.boundingBox();assert.ok(size.height>150);assert.ok(size.x>=-1&&size.x+size.width<=width+1);assert.ok(size.y>=0&&size.y+size.height<=height+1);
    await page.screenshot({path:`${out}/${engine}-${width}-${game}-fullscreen.png`});
    await page.getByRole('button',{name:'Silenciar som',exact:true}).click();
    await page.getByRole('button',{name:game==='runner'?/Continuar corrida/:/Retomar defesa/}).click();await canvas.focus();
    before=await page.evaluate(()=>window.__arcadeAudio.starts);await page.keyboard.down('Space');await page.waitForTimeout(220);await page.keyboard.up('Space');
    assert.equal(await page.evaluate(()=>window.__arcadeAudio.starts),before,'Muted gameplay creates no audio voices');
    await canvas.press('p');await page.getByRole('button',{name:'Ativar som',exact:true}).click();await page.waitForTimeout(150);
   }
   await page.getByRole('application',{name:'Data Invaders'}).press('Escape');await page.waitForFunction(()=>document.querySelector('.pet-arcade')?.dataset.screenMode==='window');assert.equal(await page.getByRole('dialog').count(),1,'First Escape restores the window without closing the arcade');
   await page.getByRole('application',{name:'Data Invaders'}).press('f');await page.waitForFunction(()=>document.querySelector('.pet-arcade').dataset.screenMode!=='window');
   await page.getByRole('button',{name:'Restaurar janela',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.pet-arcade').dataset.screenMode==='window');
   await page.getByRole('button',{name:'Silenciar som',exact:true}).click();await page.getByRole('button',{name:'Fechar jogos',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
   await page.waitForFunction(()=>window.__arcadeAudio.contexts.every(c=>c.state==='closed'));
   assert.equal(await page.evaluate(()=>window.__arcadeAudio.voices.filter(v=>v.connected).length),0);
   await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Arcade do Tamagotchi/}).click();assert.ok(await page.getByRole('button',{name:'Ativar som',exact:true}).isVisible(),'Mute preference survives reopening');
   await page.getByRole('button',{name:'Fechar jogos',exact:true}).click();assert.deepEqual(errors,[]);console.log(`${engine} ${width}×${height}: ${mode}, actual audio nodes, mute, pause, restore and close passed`);
  }catch(error){await page.screenshot({path:`${out}/${engine}-${width}-failure.png`});throw error;}finally{await context.close();}
 }}finally{await browser.close();}
}
