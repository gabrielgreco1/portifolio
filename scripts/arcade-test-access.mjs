import assert from 'node:assert/strict';
// Exercise the actual widget and Siteverify using Cloudflare's official dummy
// keys. Refuse to automate a real CAPTCHA or publish to a live leaderboard.
export async function authorizeTestArcade(page,game,{start,freezeAt}={}){
 const config=await(await page.context().request.get(new URL(`/api/arcade?game=${game}`,page.url()).href)).json();assert.equal(config.mode,'test','Only explicit local CAPTCHA test mode is allowed');
 if(start)await page.getByRole('button',{name:start}).click({force:true});
 await page.getByRole('region',{name:'Humano por enquanto.'}).waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Entrar na partida')&&!b.disabled),{},{timeout:30000});
 if(freezeAt)await page.clock.pauseAt(freezeAt);
 const response=page.waitForResponse(r=>r.url().endsWith('/api/arcade')&&r.request().method()==='POST');await page.getByRole('button',{name:/Entrar na partida/}).click({force:true});const result=await response;assert.equal(result.status(),200);return result.json();
}
