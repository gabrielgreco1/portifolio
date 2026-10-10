import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome'});
for(const origin of [process.env.TEST_ORIGIN||'http://localhost:4324']){
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});await page.goto(`${origin}/pt`);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Quem está por aqui/}).click();await page.waitForTimeout(600);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.TEST_CPU_RATE||1)});
 const box=await page.locator('.visitor-globe canvas,.visitor-globe>svg').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 const result=await page.evaluate(async()=>{
  const el=document.querySelector('.visitor-globe canvas,.visitor-globe>svg'),b=el.getBoundingClientRect(),frames=[],cost=[];let previous=performance.now();

  // A real pointer is held down; movement dispatch is frame paced for repeatability.
  for(let i=0;i<60;i++)await new Promise(resolve=>requestAnimationFrame(now=>{frames.push(now-previous);previous=now;const start=performance.now();el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:1,clientX:b.x+b.width/2+Math.sin(i/15)*150,clientY:b.y+b.height/2,button:0}));cost.push(performance.now()-start);resolve();}));
frames.shift();frames.sort((a,b)=>a-b);return{median:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],mean:frames.reduce((a,b)=>a+b)/frames.length,eventMs:cost.reduce((a,b)=>a+b)/cost.length};
 });await page.mouse.up();await page.evaluate(()=>{document.querySelector('.visitor-close').addEventListener('click',()=>{const start=performance.now(),observer=new MutationObserver(()=>{if(!document.querySelector('.visitor-map')){window.__globeCloseMs=performance.now()-start;observer.disconnect();}});observer.observe(document.body,{childList:true,subtree:true});},{once:true});});const closeStart=Date.now();await page.getByRole('button',{name:'Fechar mapa',exact:true}).click();await page.locator('.visitor-map').waitFor({state:'hidden'});console.log(origin,{...result,closeClickToRemovalMs:await page.evaluate(()=>window.__globeCloseMs),closeHarnessMs:Date.now()-closeStart});await page.close();
}
await browser.close();
