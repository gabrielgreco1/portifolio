import{chromium}from'playwright';import assert from'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`${process.env.TEST_ORIGIN||'http://127.0.0.1:4322'}/pt`);await page.waitForTimeout(500);
await page.getByRole('button',{name:'Solta o crawler.',exact:true}).click();await page.getByRole('button',{name:/Quero apontar um trecho/}).click();
await page.getByRole('dialog').waitFor({state:'hidden'});
const target=page.locator('[data-crawl-id="zyte-quote"]'),original=await target.innerText();await target.tap();
await page.getByRole('dialog',{name:'Pronto para levar.'}).waitFor();await page.waitForFunction(()=>document.querySelector('.document-page'));
assert.ok((await page.locator('.document-page').textContent()).includes(original));assert.match(await page.locator('.glass-header').innerText(),/1 trecho coletado/);
await page.getByRole('tab',{name:/JSON/}).click();await page.getByRole('checkbox',{name:'Mostrar origens'}).check();
const json=JSON.parse((await page.locator('.json-text').allTextContents()).join('\n'));assert.equal(json.evidence.length,1);assert.equal(json.evidence[0].raw,original);
await page.locator('.delivery-provenance summary').click();await page.locator('.delivery-provenance button').click();await page.getByRole('button',{name:/Voltar à coleta/}).click();await page.getByRole('dialog',{name:'Pronto para levar.'}).waitFor();assert.deepEqual(errors,[]);console.log('Hand-picked quote preserved in PDF/JSON; source and return navigation passed');
}finally{await browser.close();}
