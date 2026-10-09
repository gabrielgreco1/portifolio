import{chromium}from'playwright';import assert from'node:assert/strict';import{mkdir}from'node:fs/promises';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4318',out='/tmp/tamagotchi-ranked-arcade';await mkdir(out,{recursive:true});
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('This test publishes explicitly labelled local test scores only');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const[game,width,height]of[['runner',1280,900],['invaders',390,844]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<600,isMobile:width<600});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(`${origin}/pt`);await page.locator('.crawler-pet').waitFor();await page.waitForTimeout(500);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Arcade do Tamagotchi/}).click();if(game==='invaders')await page.getByRole('tab',{name:/Data Invaders/}).click();
  const config=await(await context.request.get(`${origin}/api/arcade?game=${game}`)).json();assert.equal(config.mode,'test');
  await page.getByRole('button',{name:game==='runner'?/Começar corrida/:/Defender os dados/}).click();await page.getByRole('region',{name:'Humano por enquanto.'}).waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Entrar na partida')&&!b.disabled),{},{timeout:30000});
  await page.screenshot({path:`${out}/${game}-verified.png`});const grant=page.waitForResponse(r=>r.url().endsWith('/api/arcade')&&r.request().method()==='POST');await page.getByRole('button',{name:/Entrar na partida/}).click();const authorized=await grant;if(!authorized.ok())throw new Error(`Start failed: ${authorized.status()} ${JSON.stringify(await authorized.json())}`);await page.locator('.runner-stage--running').waitFor();
  if(game==='invaders'){await page.keyboard.down('Space');await page.waitForTimeout(2800);await page.keyboard.up('Space');}
  await page.getByRole('heading',{name:'Robô confirmado.'}).waitFor({timeout:90000});await page.screenshot({path:`${out}/${game}-over.png`});
  const score=Number(await page.locator('.arcade-hud>div strong').first().innerText());assert.ok(score>0);
  await page.getByRole('button',{name:'Publicar recorde',exact:true}).click();await page.getByLabel('Apelido público (opcional)').fill(`TEST LOCAL ${game}`);
  await page.getByRole('button',{name:/Publicar meu recorde/}).click();await page.getByRole('region',{name:'Os bots mais humanos.'}).waitFor();await page.getByText(`TEST LOCAL ${game}`,{exact:true}).first().waitFor();
  assert.ok((await page.locator('.arcade-saved').innerText()).includes(`${score} pts`));await page.screenshot({path:`${out}/${game}-ranking.png`});
  const independent=await browser.newContext(),response=await independent.request.get(`${origin}/api/arcade?game=${game}`),publicBoard=await response.json();assert.ok(publicBoard.entries.some(e=>e.score===score&&e.name===`TEST LOCAL ${game}`));await independent.close();assert.deepEqual(errors,[]);
  console.log(`${game}: official test widget → server verification → real game → server replay → persisted score visible from another visitor passed`);
 }catch(error){await page.screenshot({path:`${out}/${game}-failure.png`});console.log((await page.locator('.pet-arcade').innerText()).slice(0,2500));throw error;}finally{await context.close();}
}}finally{await browser.close();}
