import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arcadeViewport,arcadePointerX} from '../src/lib/arcade/viewport.mjs';
import {validSize} from '../src/lib/arcade/protocol.mjs';
import {ArcadeSound} from '../src/lib/arcade/sound.mjs';
test('fullscreen and extreme displays preserve aspect, legal replay sizes and pointer coordinates',()=>{
 for(const [w,h]of[[286,200],[356,340],[812,220],[1920,850],[390,640],[7680,900],[280,1000]]){
  const v=arcadeViewport(w,h);assert.ok(validSize(v.width,v.height));assert.ok(v.x>=0&&v.y>=0);assert.ok(v.width*v.scale<=w+.001&&v.height*v.scale<=h+.001);
  assert.equal(arcadePointerX(10+v.x+v.width*v.scale/2,{left:10},v),v.width/2);
  assert.equal(arcadePointerX(-100,{left:10},v),0);assert.equal(arcadePointerX(w+100,{left:10},v),v.width);
 }
});
test('sound follows transitions, does not repeat on idle frames and stops at pause',()=>{
 const audio=new ArcadeSound(),cues=[];audio.play=name=>cues.push(name);audio.silence=()=>cues.push('silence');
 const s={status:'ready',time:0,y:0,packets:0,cleared:0,duckHeld:false};audio.observe('runner',s);assert.deepEqual(cues,[]);
 s.status='running';audio.observe('runner',s);s.y=-3;audio.observe('runner',s);audio.observe('runner',s);s.y=0;s.packets=1;audio.observe('runner',s);s.status='paused';audio.observe('runner',s);audio.observe('runner',s);
 assert.deepEqual(cues,['start','jump','land','collect','silence']);s.status='running';audio.observe('runner',s);s.status='over';audio.observe('runner',s);audio.observe('runner',s);assert.deepEqual(cues.slice(-2),['silence','over']);
});
test('invaders sound distinguishes firing, armor damage, destruction, waves and player damage',()=>{
 const audio=new ArcadeSound(),cues=[];audio.play=name=>cues.push(name);audio.silence=()=>{};
 const s={status:'running',time:1,shootCooldown:0,kills:0,lives:3,wave:1,attackSerial:0,enemies:[{alive:true,hp:2}]};audio.observe('invaders',s);cues.length=0;
 s.shootCooldown=.17;audio.observe('invaders',s);s.enemies[0].hp=1;audio.observe('invaders',s);s.enemies[0].alive=false;s.kills=1;audio.observe('invaders',s);s.lives=2;audio.observe('invaders',s);s.wave=2;audio.observe('invaders',s);s.attackSerial=1;audio.observe('invaders',s);
 assert.deepEqual(cues,['shot','hit','destroy','damage','wave','lock']);
});
