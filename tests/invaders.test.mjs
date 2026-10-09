import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceInvaders,createInvaders,pauseInvaders,startInvaders} from '../src/lib/crawler/invaders.mjs';
const run=(s,seconds,input={})=>{for(let t=0;t<seconds;t+=1/120)advanceInvaders(s,1/120,input);};
test('left and right movement are responsive, bounded and independent of firing',()=>{
  const s=createInvaders(390,340,4);startInvaders(s);run(s,.2,{left:true,fire:true});assert.ok(s.playerX<140);assert.ok(s.shots.length>0);
  run(s,1,{left:true});assert.equal(s.playerX,37);run(s,2,{right:true});assert.equal(s.playerX,353);
});
test('a hit removes a corrupt packet and scores only once',()=>{
  const s=createInvaders(390,340,4);startInvaders(s);s.enemies=[{id:'one',x:s.playerX,y:100,width:30,height:24,hp:1,kind:0,alive:true}];s.shots=[{x:s.playerX,y:115}];run(s,.04);
  assert.equal(s.enemies[0].alive,false);assert.equal(s.score,130);assert.equal(s.shots.length,0);
});
test('player damage has a grace period and three distinct hits end the run',()=>{
  const s=createInvaders(390,340,4);startInvaders(s);s.enemyCooldown=100;
  const hit=()=>s.threats.push({x:s.playerX,y:s.playerY-30,vx:0});
  hit();hit();run(s,.05);assert.equal(s.lives,2);assert.equal(s.status,'running');
  s.threats=[];run(s,1.5);hit();run(s,.05);assert.equal(s.lives,1);
  s.threats=[];run(s,1.5);hit();run(s,.05);assert.equal(s.status,'over');assert.equal(s.lives,0);
});
test('cleared waves advance and pausing freezes the same formation',()=>{
  const s=createInvaders(760,405,4);startInvaders(s);s.enemies.forEach(e=>{e.alive=false;});run(s,1.1);assert.equal(s.wave,2);assert.equal(s.score,100);assert.equal(s.enemies.length,32);
  pauseInvaders(s);const snapshot=JSON.stringify(s);run(s,2,{fire:true,right:true});assert.equal(JSON.stringify(s),snapshot);pauseInvaders(s);run(s,.2,{right:true});assert.ok(s.playerX>380);
});
