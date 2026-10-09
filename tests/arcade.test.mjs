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
