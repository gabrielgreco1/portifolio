import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceRunner,createRunner,duckRunner,jumpRunner,pauseRunner,startRunner} from '../src/lib/crawler/runner.mjs';
import {runnerHazard} from '../src/lib/crawler/runner-obstacles.mjs';
const run=(s,seconds)=>{for(let t=0;t<seconds;t+=1/120)advanceRunner(s,1/120);};
test('jump is immediate and cannot become unlimited flight by holding the button',()=>{
  const s=createRunner(760,390,10);startRunner(s);assert.equal(jumpRunner(s),true);run(s,.12);assert.ok(s.y<-55);assert.equal(jumpRunner(s),false);run(s,.7);assert.equal(s.y,0);assert.equal(jumpRunner(s),true);
});
test('the visible obstacles are lethal on the ground and clearable with one jump',()=>{
  for(const jump of [false,true]){
    const s=createRunner(760,390,10);startRunner(s);s.spawn=10;s.obstacles=[{x:s.playerX+85,width:34,height:48,kind:'wall'}];
    if(jump)jumpRunner(s);run(s,.65);
    assert.equal(s.status,jump?'running':'over');
  }
});
test('pausing freezes physics and score, resuming continues the same run',()=>{
  const s=createRunner(390,320,5);startRunner(s);run(s,.5);pauseRunner(s);const frozen=JSON.stringify(s);run(s,3);assert.equal(JSON.stringify(s),frozen);pauseRunner(s);run(s,.2);assert.ok(s.distance>JSON.parse(frozen).distance);
});
test('collecting a packet awards 50 points exactly once',()=>{
  const s=createRunner(390,320,5);startRunner(s);s.spawn=10;s.tokens=[{id:1,x:s.playerX+5,y:s.ground-28,collected:false}];run(s,.1);assert.equal(s.packets,1);assert.ok(s.score>=50);run(s,.5);assert.equal(s.packets,1);
});
test('fingerprint scanners require ducking and cannot be skipped with an ordinary jump',()=>{
  for(const action of ['stand','jump','duck']){
    const s=createRunner(760,390,10);startRunner(s);s.spawn=10;s.obstacles=[runnerHazard('scanner',s.playerX+85,0)];
    if(action==='jump')jumpRunner(s);if(action==='duck')duckRunner(s,true);run(s,.8);
    assert.equal(s.status,action==='duck'?'running':'over',action);if(action==='duck'){assert.equal(s.cleared,1);duckRunner(s,false);run(s,.1);assert.ok(s.duck<.1);}
  }
});
test('every grounded hazard can be jumped but cannot be bypassed by staying crouched',()=>{
  for(const kind of ['wall','honeypot','rate'])for(const action of ['jump','duck']){
    const s=createRunner(390,320,20);startRunner(s);s.spawn=10;s.obstacles=[runnerHazard(kind,s.playerX+85,0)];
    if(action==='jump')jumpRunner(s);else duckRunner(s,true);run(s,.8);assert.equal(s.status,action==='jump'?'running':'over',`${kind}/${action}`);
  }
});
test('duck in flight accelerates landing and pausing releases held input',()=>{
 const s=createRunner(390,320,5);startRunner(s);s.spawn=10;jumpRunner(s);run(s,.2);duckRunner(s,true);run(s,.2);assert.equal(s.y,0);assert.ok(s.duck>.8);pauseRunner(s);assert.equal(s.duckHeld,false);
});
test('five-minute mixed courses remain playable at phone and desktop sizes',()=>{
 for(const width of [350,390,760,1200])for(const seed of [1,72,481]){
  const s=createRunner(width,390,seed);startRunner(s);const seen=new Set();let spawnedCaches=0,previousSerial=-1,minReaction=Infinity;
  for(let t=0;t<300;t+=1/120){
   const next=s.obstacles.find(o=>o.x+o.width>s.playerX-17);
   if(next){seen.add(next.kind);const ahead=next.x-s.playerX;
    duckRunner(s,next.kind==='scanner'&&ahead<s.speed*.3);
    if(next.kind!=='scanner'&&ahead<s.speed*.3&&ahead>0)jumpRunner(s);
   }else duckRunner(s,false);
   for(const token of s.tokens)if(token.id>previousSerial){spawnedCaches++;previousSerial=token.id;}
   minReaction=Math.min(minReaction,(width+42-s.playerX)/s.speed);
   advanceRunner(s,1/120);assert.equal(s.status,'running',`width ${width}, seed ${seed}, t=${t}, ${s.lastHit}`);
  }
  assert.equal(seen.size,4);assert.ok(s.cleared>150);assert.ok(spawnedCaches<s.hazardCount*.45,'caches should be occasional');assert.ok(minReaction>=1,'at least a second to see an entering obstacle');
 }
});

test('pausing underneath a scanner does not force the character to stand into it on resume',()=>{
 const s=createRunner(390,320,3);startRunner(s);s.spawn=10;duckRunner(s,true);run(s,.15);s.obstacles=[runnerHazard('scanner',s.playerX-10,1)];pauseRunner(s);assert.equal(s.duckHeld,false);pauseRunner(s);run(s,.6);assert.equal(s.status,'running');assert.equal(s.cleared,1);assert.ok(s.duck<.1);
});
