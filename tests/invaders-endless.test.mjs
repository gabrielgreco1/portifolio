import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createInvaders,startInvaders,advanceInvaders,spawnInvadersWave,invadersDifficulty} from '../src/lib/crawler/invaders.mjs';
import {ArcadeRecording,replayArcade,replaySegment,MAX_SEGMENT_TICKS,MAX_TICKS} from '../src/lib/arcade/protocol.mjs';
import {LocalArcade} from '../src/lib/arcade/storage.mjs';
import {handleArcade} from '../src/lib/arcade/service.mjs';
import {invadersTestPilot} from '../scripts/invaders-test-pilot.mjs';
const spec={id:'fixture',owner:'fixture',game:'invaders',version:'invaders-3',width:760,height:390,seed:2,sequence:0};
test('waves 1/4/12/40 progressively increase pressure and never select a final wave',()=>{
 for(const width of [320,390,760]){const s=createInvaders(width,340,2);let previous=null;
  for(const wave of [1,4,12,40]){s.wave=wave;s.waveTime=999;spawnInvadersWave(s);assert.equal(s.waveTime,0);assert.equal(s.waveScore,0);assert.ok(s.enemies.length>0);const difficulty=invadersDifficulty(s);
   if(previous){assert.ok(difficulty.interval<previous.interval);assert.ok(difficulty.speed>previous.speed);assert.ok(difficulty.bulletSpeed>=previous.bulletSpeed);}previous=difficulty;
   startInvaders(s);s.enemies.forEach(e=>{e.alive=false;});for(let i=0;i<200;i++)advanceInvaders(s,1/120);assert.equal(s.wave,wave+1);assert.equal(s.status,'running');assert.equal(s.lastClear.wave,wave);
  }
 }
});
test('earlier kills award more, best horde is not cumulative total, and next horde resets its clock',()=>{
 const killAt=seconds=>{const s=createInvaders(760,390,2);startInvaders(s);s.waveTime=seconds;s.enemyCooldown=100;const e=s.enemies[0];e.hp=1;s.shots=[{x:e.x,y:e.y}];advanceInvaders(s,1/120);return s;};
 const early=killAt(1),late=killAt(25);assert.ok(early.waveScore>late.waveScore);assert.equal(early.score,early.bestWaveScore);assert.equal(early.bestWave,1);
 const first=early.score;early.wave=4;spawnInvadersWave(early);assert.equal(early.waveScore,0);assert.equal(early.score,first);const boss=early.enemies[0];boss.hp=1;early.shots=[{x:boss.x,y:boss.y}];early.enemyCooldown=100;advanceInvaders(early,1/120);assert.equal(early.score,early.waveScore);assert.ok(early.totalScore>early.bestWaveScore);assert.equal(early.bestWave,4);
});
test('segmented replay is exact while controls, viewport and game state continue during checkpoint flight',()=>{
 let run={...spec};const r=new ArcadeRecording(run);let checkpoints=0;
 for(let frame=0;frame<MAX_TICKS&&r.state.status==='running';frame++){
  r.advance(1/60,invadersTestPilot(r.state));
  if(r.tick>=180&&r.state.status==='running'){
   const proof=r.captureCheckpoint(),frozen=JSON.stringify(proof),verified=replaySegment(run,proof,{checkpoint:true}),oldTick=r.tick;
   for(let i=0;i<7&&r.state.status==='running';i++){if(checkpoints===0&&i===0)r.resize(390,340);r.advance(1/60,invadersTestPilot(r.state));}
   assert.ok(r.tick>oldTick);assert.equal(JSON.stringify(proof),frozen);assert.equal(r.captureCheckpoint(),proof);
   const response={sequence:r.sequence+1,totalTicks:verified.snapshot.totalTicks};run={...run,sequence:response.sequence,checkpointJson:JSON.stringify(verified.snapshot)};r.acceptCheckpoint(response);assert.equal(r.acceptCheckpoint(response),false);checkpoints++;
  }
 }
 assert.ok(checkpoints>=2);assert.equal(r.state.status,'over');const result=replayArcade(run,r.proof());assert.equal(result.score,r.state.score);assert.equal(result.bestWave,r.state.bestWave);assert.equal(result.totalScore,r.state.totalScore);assert.equal(result.ticks,r.totalTicks+r.tick);
 assert.throws(()=>replayArcade(run,{...r.proof(),sequence:r.sequence-1}),/sequence/);
});
test('new runs do not force death at ten minutes; an unacknowledged segment only blocks at its safe bound',()=>{
 const r=new ArcadeRecording(spec);r.totalTicks=MAX_TICKS+100;r.tick=MAX_SEGMENT_TICKS-1;r.advance(1/60);assert.equal(r.state.status,'running');assert.equal(r.state.timedOut,undefined);assert.equal(r.checkpointBlocked,true);const state=JSON.stringify(r.state);r.advance(.05,{fire:true});assert.equal(JSON.stringify(r.state),state);assert.equal(r.checkpointDue,true);r.state.status='paused';assert.equal(r.checkpointDue,false);r.state.status='over';assert.equal(r.checkpointDue,false);
});
test('server checkpoints reject forged, out-of-order and cross-owner requests, retry atomically, extend TTL and preserve old boards',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'endless-api-'));let clock=Date.now();const store=new LocalArcade(join(dir,'data.json')),config={mode:'test',sitekey:'test',signingSecret:'testing-key',hosts:['localhost'],store};
 const call=(body,cookie='',query='')=>handleArcade(new Request(`http://localhost/api/arcade?game=invaders${query}`,{method:body?'POST':'GET',headers:{origin:'http://localhost','content-type':'application/json',cookie},...(body?{body:JSON.stringify(body)}:{})}),{config,now:()=>clock,verify:async()=>{}});
 try{
  assert.equal((await call({operation:'start',game:'invaders',version:'invaders-99',width:760,height:390,captcha:'test'})).status,400);
  const oldClient=await(await call({operation:'start',game:'invaders',width:760,height:390,captcha:'test'})).json();assert.equal(oldClient.version,'invaders-2');
  const started=await call({operation:'start',game:'invaders',version:'invaders-3',width:760,height:390,captcha:'test',name:'Player'}),cookie=started.headers.get('set-cookie').split(';')[0],run=await started.json(),r=new ArcadeRecording(run);for(let i=0;i<120;i++)r.advance(1/60,{fire:true});const proof=r.captureCheckpoint(),request={operation:'checkpoint',token:run.token,proof};
  assert.equal((await call(request,'')).status,403);assert.equal((await call({...request,proof:{...proof,sequence:99}},cookie)).status,409);assert.equal((await call({...request,proof:{...proof,score:999999}},cookie)).status,422);assert.equal((await call(request,cookie)).status,422,'real elapsed time is required');clock+=proof.ticks/60*1000;
  const responses=await Promise.all(Array.from({length:8},()=>call(request,cookie))),answers=await Promise.all(responses.map(async res=>{assert.equal(res.status,200);return res.json();}));assert.ok(answers.every(answer=>answer.sequence===1));assert.ok(answers[0].expiresAt>run.expiresAt);r.acceptCheckpoint(answers[0]);assert.equal(r.tick,0);
  assert.equal((await call({...request,proof:{...proof,score:1}},cookie)).status,409);assert.equal((await call({...request,proof:{...proof,sequence:1,ticks:MAX_SEGMENT_TICKS+1}},cookie)).status,422);
  // Continue from the accepted server snapshot until a natural defeat.
  while(r.state.status==='running'&&r.tick<MAX_SEGMENT_TICKS)r.advance(1/60,{});assert.equal(r.state.status,'over');clock+=(r.tick/60)*1000;const finish=await call({operation:'finish',token:run.token,proof:r.proof()},cookie);assert.equal(finish.status,200);const result=await finish.json();assert.equal(result.personal.score,r.state.bestWaveScore);assert.equal(result.personal.bestWave,r.state.bestWave);assert.equal((await call(request,cookie)).status,409);
  const old={id:'old-record',owner:'old-player',version:'invaders-2',expiresAt:clock+60000};await store.create(old);await store.finish(old,'old-proof',{id:'old-player',name:'Legacy',score:99999});const legacy=await(await call(null,cookie,'&legacy=1')).json(),current=await(await call(null,cookie)).json();assert.equal(legacy.version,'invaders-2');assert.equal(legacy.scoring,'legacy-total');assert.equal(legacy.entries[0].score,99999);assert.equal(current.scoring,'best-wave');assert.equal(current.entries.length,1);assert.notEqual(current.entries[0].score,99999);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('server-owned safe fixture replays a 630-second chain without a terminal timer',()=>{
 // This deliberately isolated engine fixture tests duration, not player skill.
 // Only a server-owned snapshot can provide this setup; the API accepts inputs, never client state.
 const r=new ArcadeRecording(spec);r.state.direction=0;r.state.enemyCooldown=1e9;let run={...spec,checkpointJson:JSON.stringify({state:r.state,mask:0,target:null,totalTicks:0})};
 for(let segment=0;segment<21;segment++){
  for(let tick=0;tick<1800;tick++)r.advance(1/60,{});
  assert.equal(r.state.status,'running');const proof=r.captureCheckpoint(),verified=replaySegment(run,proof,{checkpoint:true}),response={sequence:r.sequence+1,totalTicks:verified.snapshot.totalTicks};run={...run,sequence:response.sequence,checkpointJson:JSON.stringify(verified.snapshot)};r.acceptCheckpoint(response);
 }
 assert.equal(r.totalTicks,630*60);assert.ok(r.totalTicks>MAX_TICKS);assert.equal(r.state.timedOut,undefined);assert.equal(r.state.status,'running');
});
test('wave40 mobile bullets retain a charge and half-second minimum travel',()=>{
 for(const width of [320,390]){const s=createInvaders(width,340,2);s.wave=40;spawnInvadersWave(s);const e=s.enemies.find(e=>e.kind==='waf');s.enemies=[e];s.initialCount=1;s.direction=0;e.x=100;e.y=s.playerY-48-e.height/2-2;startInvaders(s);s.enemyCooldown=0;
  advanceInvaders(s,1/120);assert.ok(e.charge.duration>=.45);while(!s.threats.length&&s.status==='running')advanceInvaders(s,1/120);assert.ok(s.threats.length);const bullet=s.threats[0];assert.ok((s.playerY-47-bullet.y)/bullet.vy>=.48);
 }
});
