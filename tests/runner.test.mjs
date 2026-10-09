import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceRunner,createRunner,jumpRunner,pauseRunner,startRunner} from '../src/lib/crawler/runner.mjs';
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
test('obstacle spacing leaves a safe recovery interval at every supported speed',()=>{
  const s=createRunner(760,390,32);startRunner(s);s.playerX=-5000;run(s,80);
  assert.equal(s.speed,370);assert.ok(s.spawn>0);assert.ok(s.obstacles.length<=3);
  for(let i=1;i<s.obstacles.length;i++)assert.ok(s.obstacles[i].x-s.obstacles[i-1].x>370*1.4);
});
