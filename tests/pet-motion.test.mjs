import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clickGesture,petPose,PET_DURATION} from '../src/lib/crawler/pet-motion.mjs';

test('a rapid five-click sequence resolves to overload, not an intermediate spin',()=>{
  assert.equal(clickGesture(1),'menu');assert.equal(clickGesture(2),'menu');
  assert.equal(clickGesture(3),'spin');assert.equal(clickGesture(5),'overload');
});
test('the spin visits all eight views and lands on the exact resting art',()=>{
  const frames=new Set();
  for(let t=0;t<=PET_DURATION.spin;t+=16)frames.add(petPose('spin',t).frame);
  for(let i=0;i<8;i++)assert.ok(frames.has(i));
  for(const kind of Object.keys(PET_DURATION)){
    const final=petPose(kind,PET_DURATION[kind]);
    assert.equal(final.frame,-1);assert.ok(Math.abs(final.y)<.01);assert.ok(Math.abs(final.sx-1)<.01);assert.equal(final.heat,0);
  }
});
test('reduced motion removes turns, shakes, jumping and bursting',()=>{
  for(const kind of Object.keys(PET_DURATION))for(let t=0;t<700;t+=16){
    const pose=petPose(kind,t,true);
    assert.equal(pose.frame,-1);assert.equal(pose.x,0);assert.equal(pose.y,0);assert.equal(pose.burst,-1);
  }
});
