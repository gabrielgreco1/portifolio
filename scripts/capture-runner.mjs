import {chromium,webkit} from 'playwright';
import {authorizeTestArcade} from './arcade-test-access.mjs';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {advanceRunner,createRunner,duckRunner,jumpRunner,startRunner} from '../src/lib/crawler/runner.mjs';
const safari=process.env.TEST_BROWSER==='webkit',output=`/tmp/tamagotchi-runner-v2-${safari?'webkit':'chrome'}`;await mkdir(output,{recursive:true});
const browser=await(safari?webkit:chromium).launch(safari?{headless:true}:{channel:'chrome',headless:true});
try{for(const [width,height]of(safari?[[390,844]]:[[1280,900],[390,844],[844,390],[320,568]])){
 if(process.env.TEST_WIDTH&&width!==Number(process.env.TEST_WIDTH))continue;
 const mobile=width!==1280,context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-09T12:00:00Z')});
 await page.goto(`${process.env.TEST_ORIGIN||'http://127.0.0.1:4318'}/pt`);await page.waitForTimeout(800);
 await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Arcade do Tamagotchi/}).click();
 await page.getByRole('button',{name:/Começar corrida/}).waitFor();await page.waitForTimeout(500);
 await page.screenshot({animations:'disabled',path:`${output}/${width}-intro.png`});
 const timestamp=new Date('2026-10-09T12:01:00Z');const grant=await authorizeTestArcade(page,'runner',{start:/Começar corrida/,freezeAt:timestamp});
 const surface=page.getByRole('application',{name:'Data Run'});
 const s=createRunner(grant.width,grant.height,grant.seed);startRunner(s);
 const duckButton=page.getByRole('button',{name:'Abaixar ↓',exact:true}),jumpButton=page.getByRole('button',{name:'Pular ↑',exact:true}),duckBox=await duckButton.boundingBox();assert.ok(duckBox.y+duckBox.height<=height,'duck control must fit');
 const cdp=mobile&&!safari?await context.newCDPSession(page):null;let held=false,jumpCaptured=false,duckCaptured=false;
 const setDuck=async value=>{if(value===held)return;held=value;
  if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:value?'touchStart':'touchEnd',touchPoints:value?[{x:duckBox.x+duckBox.width/2,y:duckBox.y+duckBox.height/2,id:0}]:[]});
  else if(mobile){if(value){await page.mouse.move(duckBox.x+duckBox.width/2,duckBox.y+duckBox.height/2);await page.mouse.down();}else await page.mouse.up();}
  else if(value)await page.keyboard.down('ArrowDown');else await page.keyboard.up('ArrowDown');
 };
 for(let ms=0;ms<15500;ms+=50){
  const next=s.obstacles.find(o=>o.x+o.width>s.playerX-17),ahead=next?next.x-s.playerX:Infinity;
  const shouldDuck=next?.kind==='scanner'&&ahead<s.speed*.3;await setDuck(shouldDuck);duckRunner(s,shouldDuck);
  if(next&&next.kind!=='scanner'&&ahead<s.speed*.3&&ahead>0&&s.y===0){jumpRunner(s);if(mobile)await jumpButton.tap({force:true});else await page.keyboard.press('Space');}
  advanceRunner(s,.05);await page.clock.runFor(50);
  if(!jumpCaptured&&s.y<-75&&next?.kind==='wall'){await page.screenshot({path:`${output}/${width}-jump.png`});jumpCaptured=true;}
  if(!duckCaptured&&shouldDuck&&ahead<5){assert.equal(await surface.getAttribute('data-ducking'),'true');await page.screenshot({path:`${output}/${width}-duck.png`});duckCaptured=true;}
  if(ms>0&&ms%1000===0)assert.match(await page.locator('.runner-stage').getAttribute('class'),/running/,`survival at ${ms}ms/${width}`);
 }
 await setDuck(false);await page.clock.runFor(100);assert.equal(await surface.getAttribute('data-ducking'),'false');
 assert.ok(jumpCaptured&&duckCaptured);assert.ok(Number(await page.locator('.arcade-hud>div strong').nth(1).innerText())>=4,'must survive each hazard type');
 await surface.press('p');await page.clock.runFor(100);const paused=await page.locator('.arcade-hud').innerText();await page.clock.runFor(1000);assert.equal(await page.locator('.arcade-hud').innerText(),paused);
 if(width===390){await page.setViewportSize({width:844,height:390});await page.clock.runFor(200);assert.match(await page.locator('.runner-stage').getAttribute('class'),/paused/);assert.equal(await page.locator('.arcade-hud').innerText(),paused);await page.screenshot({path:`${output}/${width}-rotated.png`});await page.setViewportSize({width,height});await page.clock.runFor(200);}
 await page.getByRole('button',{name:/Continuar corrida/}).click({force:true});await page.clock.runFor(7000);assert.match(await page.locator('.runner-stage').getAttribute('class'),/over/);
 await page.screenshot({path:`${output}/${width}-over.png`});await surface.press('Space');await page.clock.resume();await authorizeTestArcade(page,'runner',{freezeAt:new Date('2026-10-09T12:03:00Z')});await page.clock.runFor(150);assert.match(await page.locator('.runner-stage').getAttribute('class'),/running/);
 // Losing focus must release duck, then pause rather than run unattended.
 await setDuck(true);await page.clock.runFor(150);assert.equal(await surface.getAttribute('data-ducking'),'true');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await setDuck(false);await page.clock.runFor(150);assert.equal(await surface.getAttribute('data-ducking'),'false');assert.match(await page.locator('.runner-stage').getAttribute('class'),/paused/);
 await page.keyboard.press('Escape');await page.clock.runFor(500);assert.equal(await page.getByRole('dialog').count(),0);assert.deepEqual(errors,[]);await context.close();console.log(`${width}×${height}: jump/held duck, all four hazards, pause, retry and input cleanup passed`);
}}finally{await browser.close();}
console.log(output);
