import {chromium} from 'playwright';
import {authorizeTestArcade} from './arcade-test-access.mjs';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://localhost:4323',output='/tmp/tamagotchi-invaders-v3';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
for(const [width,height] of [[1280,900],[390,844],[844,390],[320,568]].filter(([w])=>!process.env.TEST_WIDTH||w===Number(process.env.TEST_WIDTH))){
 const mobile=width!==1280,context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date()});
 await page.goto(`${origin}/pt`);await page.waitForTimeout(750);
 await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Arcade do Tamagotchi/}).click();
 await page.getByRole('tab',{name:/Data Invaders/}).click();await page.getByRole('button',{name:/Assumir o controle/}).waitFor();await page.waitForTimeout(500);
 await page.screenshot({animations:'disabled',path:`${output}/${width}-intro.png`});
 await authorizeTestArcade(page,'invaders',{start:/Assumir o controle/,freezeAt:()=>new Date(Date.now()+1000)});await page.clock.runFor(120);
 assert.equal(await page.locator('.runner-overlay').count(),0);assert.equal(await page.locator('#invaders-instructions').evaluate(e=>getComputedStyle(e).position),'absolute');if(!mobile)assert.equal(await page.locator('.invaders-bottom').isVisible(),false);
 if(mobile){
  const cdp=await context.newCDPSession(page),fire=await page.getByRole('button',{name:'Atirar ↑',exact:true}).boundingBox(),left=await page.getByRole('button',{name:'Mover para esquerda',exact:true}).boundingBox();
  assert.ok(fire.y+fire.height<=height,'Touch controls must fit without scrolling');
  const finger={x:fire.x+fire.width/2,y:fire.y+fire.height/2,id:0},second={x:left.x+left.width/2,y:left.y+left.height/2,id:1};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger]});await page.clock.runFor(1700);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger,second]});await page.clock.runFor(240);
  await page.screenshot({animations:'disabled',path:`${output}/${width}-multitouch.png`});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[finger]});await page.clock.runFor(300);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else{
  await page.keyboard.down('Space');await page.clock.runFor(1700);await page.keyboard.down('ArrowLeft');await page.clock.runFor(240);await page.keyboard.up('ArrowLeft');await page.clock.runFor(300);await page.keyboard.up('Space');
  await page.screenshot({animations:'disabled',path:`${output}/${width}-keyboard.png`});
 }
 const score=Number(await page.locator('.invaders-wave-score strong').innerText());assert.ok(score>0,'Holding fire must score real hits');
 await page.getByRole('application',{name:'Data Invaders'}).press('p');await page.clock.runFor(100);
 const paused=await page.locator('.arcade-hud').innerText();await page.clock.runFor(1000);assert.equal(await page.locator('.arcade-hud').innerText(),paused);assert.match(await page.locator('.runner-stage').getAttribute('class'),/paused/);
 await page.screenshot({animations:'disabled',path:`${output}/${width}-paused.png`});
 await page.getByRole('button',{name:'Continuar jogo',exact:true}).click({force:true});await page.clock.runFor(200);assert.match(await page.locator('.runner-stage').getAttribute('class'),/running/);
 if(width===390){await page.setViewportSize({width:844,height:390});await page.clock.runFor(150);assert.match(await page.locator('.runner-stage').getAttribute('class'),/paused/);await page.getByRole('button',{name:'Continuar jogo',exact:true}).click();await page.clock.runFor(150);assert.match(await page.locator('.runner-stage').getAttribute('class'),/running/);await page.screenshot({path:`${output}/rotation.png`});}
 await page.keyboard.press('Escape');await page.clock.runFor(500);assert.equal(await page.getByRole('dialog').count(),0);
 assert.deepEqual(errors,[]);await context.close();
}
await browser.close();console.log(`Invaders keyboard, held fire, simultaneous touch, score, pause, landscape and close passed: ${output}`);
