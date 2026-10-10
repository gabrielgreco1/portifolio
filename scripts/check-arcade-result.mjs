import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {LocalArcade} from '../src/lib/arcade/storage.mjs';
import {authorizeTestArcade} from './arcade-test-access.mjs';
const origin=process.env.TEST_ORIGIN||'http://localhost:4323';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Local fixtures only');
const store=new LocalArcade(`${process.cwd()}/.local/arcade.json`);
for(let i=0;i<15;i++){const run={id:`result-ui-fixture-${i}`,owner:'LOCAL TEST',version:'runner-3',expiresAt:Date.now()+60000};if(!(await store.get(run.id))){await store.create(run);await store.finish(run,'fixture',{id:`result-ui-${i}`,name:`TEST ONLY ${i+1}`,score:10000+i});}}
const out='/tmp/arcade-result-review';await mkdir(out,{recursive:true});
const engine=process.env.TEST_BROWSER==='webkit'?webkit:chromium,browser=await engine.launch(engine===webkit?{headless:true}:{headless:true,channel:'chrome'});
try{for(const [width,height] of [[1440,1000],[390,844],[320,568],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:width===320?'reduce':'no-preference'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${origin}/pt`);await page.waitForTimeout(1600);await page.locator('.crawler-pet').press('Enter');await page.getByRole('button',{name:/Arcade do Tamagotchi/}).click();
 await authorizeTestArcade(page,'runner',{start:/^▶?\s*Jogar$/});await page.getByRole('heading',{name:'BLOQUEADO.'}).waitFor({timeout:15000});await page.locator('.arcade-result-panel .is-you').waitFor({timeout:15000});
 const region=page.getByRole('region',{name:'Resultado da partida'});assert.ok(Number((await region.locator('.arcade-final-stats strong').nth(1).innerText()).slice(1))>10);
 assert.equal(await region.locator('.arcade-ranking:not(.arcade-ranking-personal)>li').count(),10);assert.equal(await region.locator('.arcade-ranking-personal .is-you').count(),1);
 assert.ok(await page.getByRole('button',{name:'Jogar de novo',exact:false}).isVisible());
 await page.screenshot({path:`${out}/${width}-death.png`});await page.screenshot({path:`${out}/${width}-rank.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const personal=await region.locator('.arcade-ranking-personal').boundingBox();assert.ok(personal.x>=0&&personal.x+personal.width<=width);
 const visibleRows=await region.locator('.arcade-ranking li').evaluateAll(rows=>rows.map(row=>{const r=row.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));assert.ok(visibleRows.every(Boolean),'Every row must fit without scrolling');
 assert.equal(await region.evaluate(el=>el.scrollHeight>el.clientHeight+1),false,'Result must not overflow');
 const cta=await page.getByRole('button',{name:/Jogar de novo/}).boundingBox();assert.ok(cta.y+cta.height<=height);
 assert.deepEqual(errors,[]);console.log(`${width}x${height}: automatically published rank, top ten + self, all rows visible without scrolling passed`);await context.close();
}}finally{await browser.close();}
