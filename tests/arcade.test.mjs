import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {ArcadeRecording,GAME_VERSIONS,replayArcade,MAX_TICKS} from '../src/lib/arcade/protocol.mjs';
import {arcadeConfig,arcadeIdentity,handleArcade,verifyTurnstile} from '../src/lib/arcade/service.mjs';
import {LocalArcade} from '../src/lib/arcade/storage.mjs';
import {invadersTestPilot} from '../scripts/invaders-test-pilot.mjs';
const spec=game=>({id:'test',owner:'test',game,version:GAME_VERSIONS[game],width:760,height:390,seed:3854});
function play(run,control=()=>({})){const recording=new ArcadeRecording(run);for(let i=0;i<MAX_TICKS*2&&recording.state.status==='running';i++)recording.advance([1/120,1/60,1/40][i%3],control(recording));return recording;}
const runnerControl=r=>{const s=r.state,next=s.obstacles.find(o=>o.x+o.width>s.playerX-17),ahead=next?next.x-s.playerX:Infinity;return {duck:next?.kind==='scanner'&&ahead<s.speed*.3,jump:!!next&&next.kind!=='scanner'&&ahead<s.speed*.3&&ahead>0&&s.y===0};};
test('server reproduces both real game engines from compressed inputs across render frame rates',()=>{
 for(const game of ['runner','invaders']){
  const run=spec(game),recording=play(run,r=>game==='runner'&&r.tick<1800?runnerControl(r):game==='invaders'?{fire:true,right:Math.floor(r.tick/110)%2===0,left:Math.floor(r.tick/110)%2!==0}:{});
  const proof=recording.proof(),result=replayArcade(run,proof);assert.equal(result.score,recording.state.score);assert.ok(proof.events.length<proof.ticks);assert.ok(result.score>0);
  assert.throws(()=>replayArcade(run,{...proof,score:proof.score+10000}),/Score/);
  assert.throws(()=>replayArcade(run,{...proof,ticks:proof.ticks+20}),/continues/);
 }
});
test('unfinished, out-of-order, oversized and invalid input recordings are rejected',()=>{
 const run=spec('runner'),r=new ArcadeRecording(run);r.advance(.02);const proof=r.proof();assert.throws(()=>replayArcade(run,proof),/not ended/);
 const complete=play(run).proof();for(const changes of [{ticks:MAX_TICKS+1},{events:[[0,16,null,760,390]]},{events:[[0,0,null,760,390],[0,1,null,760,390]]},{events:[[0,0,null,20000,390]]}])assert.throws(()=>replayArcade(run,{...complete,...changes}));
});
test('explicit local test mode cannot enable test keys on Vercel or a production server',()=>{
 const test=arcadeConfig({NODE_ENV:'development',ARCADE_TEST_MODE:'1'});assert.equal(test.mode,'test');
 for(const env of [{NODE_ENV:'production',ARCADE_TEST_MODE:'1'},{NODE_ENV:'development',VERCEL:'1',ARCADE_TEST_MODE:'1'},{UPSTASH_REDIS_REST_URL:'https://example.com',UPSTASH_REDIS_REST_TOKEN:'test',TURNSTILE_SITEKEY:test.sitekey,TURNSTILE_SECRET_KEY:test.captchaSecret,ARCADE_SIGNING_SECRET:'x'.repeat(32)}])assert.throws(()=>arcadeConfig(env));
});
test('CAPTCHA requires server success, matching host, action and game',async()=>{
 const config={mode:'live',captchaSecret:'test-only'},valid={success:true,hostname:'gabrielgreco.com',action:'arcade_start',cdata:'runner'};
 const verify=data=>verifyTurnstile('client-token',{config,hostname:'gabrielgreco.com',game:'runner',fetcher:async(url,options)=>{assert.equal(new URL(url).hostname,'challenges.cloudflare.com');assert.equal(JSON.parse(options.body).response,'client-token');return Response.json(data);}});
 await verify(valid);for(const override of [{success:false},{hostname:'attacker.example'},{action:'other'},{cdata:'invaders'}])await assert.rejects(verify({...valid,...override}),/captcha_failed/);
 await assert.rejects(verifyTurnstile('',{config}),/captcha_required/);
});
test('signed anonymous cookies cannot be forged by changing the identity',()=>{
 const a=arcadeIdentity('', 'test-key'),b=arcadeIdentity(`pet_arcade=${a.value}`,'test-key');assert.equal(a.id,b.id);
 const altered=`pet_arcade=${a.value.replace(/^[a-f0-9]/,a.value[0]==='a'?'b':'a')}`;assert.notEqual(arcadeIdentity(altered,'test-key').id,a.id);
});
test('Next normalized request URLs preserve the actual host and reject cross-origin starts',async()=>{
 const config={mode:'test',sitekey:'test',signingSecret:'test-only',hosts:['127.0.0.1'],store:{limit:async()=>{},create:async()=>{}}};
 const request=origin=>new Request('http://localhost:4318/api/arcade',{method:'POST',headers:{host:'127.0.0.1:4318',origin,'content-type':'application/json'},body:JSON.stringify({operation:'start',game:'runner',width:760,height:390,captcha:'test'})});
 const options={config,verify:async()=>{}};
 assert.equal((await handleArcade(request('http://127.0.0.1:4318'),options)).status,200);
 for(const origin of ['http://localhost:4318','https://127.0.0.1:4318','http://127.0.0.1:9999','https://attacker.example'])assert.equal((await handleArcade(request(origin),options)).status,403);
});
test('API verifies runs, rejects forged/reused proofs, and persists a public best across sessions',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcade-api-'));let clock=Date.now(),verifications=0;
 const store=new LocalArcade(join(dir,'records.json')),config={mode:'live',sitekey:'public-sitekey',captchaSecret:'test-only',signingSecret:'s'.repeat(32),hosts:['gabrielgreco.com'],store};
 const call=(method,body,cookie='',origin='https://gabrielgreco.com')=>handleArcade(new Request('https://gabrielgreco.com/api/arcade?game=runner',{method,headers:{origin,'Content-Type':'application/json',cookie},...(method==='POST'?{body:JSON.stringify(body)}:{})}),{config,now:()=>clock,verify:async token=>{verifications++;if(token!=='accepted-by-test-provider')throw new Error('failure');}});
 try{
  let res=await call('GET');const cookie=res.headers.get('set-cookie').split(';')[0];assert.match(res.headers.get('set-cookie'),/HttpOnly; SameSite=Strict; Secure/);assert.equal((await res.json()).entries.length,0);
  res=await call('POST',{operation:'start',game:'runner',width:760,height:390,captcha:'accepted-by-test-provider'},cookie);assert.equal(res.status,200);const run=await res.json();assert.equal(verifications,1);assert.equal(run.owner,undefined);
  const recording=play(run),proof=recording.proof(),finish={operation:'finish',token:run.token,name:'Crawler teste',proof};
  assert.equal((await call('POST',finish,cookie)).status,422,'cannot submit a run faster than elapsed time');clock+=proof.ticks/60*1000;
  assert.equal((await call('POST',{...finish,proof:{...proof,score:999999}},cookie)).status,422);
  assert.equal((await call('POST',finish,'')).status,403,'a different visitor cannot submit this run');
  assert.equal((await call('POST',finish,cookie,'https://attacker.example')).status,403);
  const assessment={operation:'assess',token:run.token,proof};
  assert.equal((await call('POST',{...assessment,proof:{...proof,score:999999}},cookie)).status,422);
  assert.equal((await call('POST',assessment,'')).status,403);
  const compared=await(await call('POST',assessment,cookie)).json();assert.equal(compared.rank,1);assert.equal(compared.published,false);
  assert.equal((await(await call('GET')).json()).entries.length,0,'comparison must never publish');
  const simultaneous=await Promise.all(Array.from({length:8},()=>call('POST',finish,cookie)));const answers=await Promise.all(simultaneous.map(async r=>{assert.equal(r.status,200);return r.json();}));assert.ok(answers.every(r=>r.score===proof.score&&r.rank===1));
  assert.equal((await call('POST',{...finish,name:'Outro nome'},cookie)).status,409);
  const board=await(await call('GET')).json();assert.equal(board.entries.length,1);assert.equal(board.entries[0].name,'Crawler teste');assert.equal(board.entries[0].score,proof.score);assert.ok(!JSON.stringify(board).includes(run.token));assert.ok(!JSON.stringify(board).includes(cookie.split('=')[1]));
  const reopened=new LocalArcade(join(dir,'records.json'));assert.deepEqual(await reopened.board(run.version),(await store.board(run.version)));
  clock=run.expiresAt+1;assert.equal((await call('POST',finish,cookie)).status,409);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('resize and out-of-bounds touch gestures replay consistently',()=>{
 for(const game of ['runner','invaders']){
  const run=spec(game),r=new ArcadeRecording(run);let resized=false;
  while(r.state.status==='running'&&r.tick<MAX_TICKS){if(r.tick>30&&!resized){r.resize(390,320);resized=true;}r.advance(1/60,game==='invaders'?{fire:true,targetX:r.tick%100<50?-200:1000}:{});}
  assert.equal(replayArcade(run,r.proof()).score,r.state.score);
 }
});
test('a complete multi-wave Invaders run replays through the guardian with exactly the same score',()=>{
 for(const width of [390,760]){
  const run={...spec('invaders'),width,height:340,seed:2},r=play(run,recording=>invadersTestPilot(recording.state));
  assert.ok(r.state.wave>=4,'The replay fixture must actually reach the boss encounter');
  const replay=replayArcade(run,r.proof());assert.equal(replay.wave,r.state.wave);assert.equal(replay.score,r.state.score);
 }
});
test('rotation during a fingerprint lock preserves server replay and the target position',()=>{
 const run={...spec('invaders'),width:390,height:340,seed:2},r=new ArcadeRecording(run);let rotated=false;
 while(r.state.status==='running'&&r.tick<MAX_TICKS){
  if(!rotated&&r.state.enemies.some(e=>e.charge)){
   const target=r.state.enemies.find(e=>e.charge).charge.targetX;r.resize(760,405);
   assert.equal(r.state.enemies.find(e=>e.charge).charge.targetX,target*760/390);rotated=true;
  }
  r.advance(1/60,invadersTestPilot(r.state));
 }
 assert.ok(rotated);assert.equal(replayArcade(run,r.proof()).score,r.state.score);
});

 test('host, body and origin attacks are rejected before database writes',async()=>{
 let writes=0;const config={mode:'live',sitekey:'public',signingSecret:'s'.repeat(32),hosts:['gabrielgreco.com'],store:{limit:async()=>{writes++;},create:async()=>{writes++;}}};
 const call=(body,headers={},method='POST',url='https://gabrielgreco.com/api/arcade')=>handleArcade(new Request(url,{method,headers:{origin:'https://gabrielgreco.com','content-type':'application/json',...headers},...(method==='POST'?{body}:{})}),{config});
 assert.equal((await call('{}',{},'DELETE')).status,405);
 assert.equal((await call('{}',{'sec-fetch-site':'cross-site'})).status,403);
 assert.equal((await call('{}',{origin:'null'})).status,403);
 assert.equal((await call('{}',{origin:'https://attacker.example'},'POST','https://attacker.example/api/arcade')).status,503);
 assert.equal((await call('{}',{'content-type':'text/plain'})).status,415);
 assert.equal((await call('[]')).status,400);assert.equal((await call('{')).status,400);
 assert.equal((await call('{}',{'content-length':'1000001'})).status,413);
 assert.equal((await call('x'.repeat(1000001))).status,413);
 assert.equal(writes,0);
 });

test('plain-text firewall denials remain readable and never masquerade as CAPTCHA failures',async()=>{
 const {arcadeResponse}=await import('../src/lib/arcade/response.mjs');
 assert.deepEqual(await arcadeResponse(new Response('Too many requests',{status:429})),{available:false,error:'rate_limited'});
 assert.deepEqual(await arcadeResponse(new Response('<html>Unavailable</html>',{status:503})),{available:false,error:'temporarily_unavailable'});
 assert.deepEqual(await arcadeResponse(Response.json({available:true})),{available:true});
});

test('new pace accelerates earlier while legacy recordings still replay exactly',()=>{
 for(const pace of [1,2]){const run={...spec('runner'),pace},recording=play(run,r=>r.tick<1200?runnerControl(r):{});assert.equal(replayArcade(run,recording.proof()).score,recording.state.score);}
 const legacy=new ArcadeRecording(spec('runner')),modern=new ArcadeRecording({...spec('runner'),pace:2});
 for(let i=0;i<1200;i++){legacy.advance(1/60,runnerControl(legacy));modern.advance(1/60,runnerControl(modern));}
 assert.ok(modern.state.speed>legacy.state.speed+70);assert.equal(modern.state.status,'running');
});

test('rank beyond 100 persists, comparison is private, and ties match Redis ordering',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcade-ranks-'));try{const store=new LocalArcade(join(dir,'records.json'));
 for(let i=0;i<115;i++){const run={id:`run-${i}`,owner:`owner-${i}`,version:'runner-3',expiresAt:Date.now()+60000};await store.create(run);await store.finish(run,`hash-${i}`,{id:`player-${i}`,name:`TEST ${i}`,score:i+100});}
 const result=await store.compare('runner-3',{id:'private',name:'private',score:1});assert.equal(result.rank,116);assert.equal(result.entries.length,10);assert.equal(result.personal.rank,116);assert.equal(await store.personal('runner-3','private'),null);assert.equal((await store.personal('runner-3','player-0')).rank,115);
 const tie=await store.compare('runner-3',{id:'zzz',score:214});assert.equal(tie.rank,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('name chosen before playing is bound to the run and finish returns the persisted personal rank',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcade-named-'));let clock=Date.now();try{
 const store=new LocalArcade(join(dir,'records.json')),config={mode:'test',sitekey:'test',signingSecret:'test',hosts:['localhost'],store};
 const call=(body,cookie='')=>handleArcade(new Request('http://localhost/api/arcade',{method:'POST',headers:{origin:'http://localhost','Content-Type':'application/json',cookie},body:JSON.stringify(body)}),{config,now:()=>clock,verify:async()=>{}});
 const res=await call({operation:'start',game:'runner',pace:2,width:760,height:390,name:'Gabriel',captcha:'test'}),cookie=res.headers.get('set-cookie').split(';')[0],run=await res.json();assert.equal(run.name,'Gabriel');assert.equal(run.pace,2);
 const proof=play(run).proof();clock+=proof.ticks/60*1000;const response=await call({operation:'finish',token:run.token,name:'Different name',proof},cookie);assert.equal(response.status,200);const result=await response.json();assert.equal(result.personal.name,'Gabriel');assert.equal(result.personal.rank,1);assert.equal(result.entries[0].name,'Gabriel');
 const retry=await(await call({operation:'finish',token:run.token,name:'Different name',proof},cookie)).json();assert.equal(retry.personal.id,result.personal.id);assert.equal(retry.entries.length,1);
 const zeroRun=await(await call({operation:'start',game:'invaders',width:760,height:390,name:'Gabriel',captcha:'test'},cookie)).json(),zeroProof=play(zeroRun).proof();assert.equal(zeroProof.score,0);clock+=zeroProof.ticks/60*1000;const zero=await call({operation:'finish',token:zeroRun.token,proof:zeroProof},cookie);assert.equal(zero.status,200);assert.equal((await zero.json()).personal.score,0);
 const oldClient=await(await call({operation:'start',game:'runner',width:760,height:390,captcha:'test'},cookie)).json();assert.equal(oldClient.pace,1,'already open old clients retain their matching rules');
 }finally{await rm(dir,{recursive:true,force:true});}
});
