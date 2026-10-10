import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceInvaders,createInvaders,invadersDifficulty,pauseInvaders,spawnInvadersWave,startInvaders} from '../src/lib/crawler/invaders.mjs';
import {ENEMY_TYPES} from '../src/lib/crawler/invaders-art.mjs';
const run=(s,seconds,input={})=>{for(let t=0;t<seconds;t+=1/120)advanceInvaders(s,1/120,input);};
const enemy=(kind,x,y=60)=>({...ENEMY_TYPES[kind],id:'one',kind,col:0,x,y,maxHp:ENEMY_TYPES[kind].hp,alive:true,hitFlash:0,charge:null});
function isolated(kind){const s=createInvaders(390,340,4);startInvaders(s);s.enemies=[enemy(kind,100)];s.initialCount=1;s.enemyCooldown=0;return s;}
test('left and right movement are responsive, bounded and independent of firing',()=>{
 const s=createInvaders(390,340,4);startInvaders(s);run(s,.2,{left:true,fire:true});assert.ok(s.playerX<140);assert.ok(s.shots.length>0);
 run(s,1,{left:true});assert.equal(s.playerX,37);run(s,2,{right:true});assert.equal(s.playerX,353);
});
test('WAF armor needs two hits and awards points only when destroyed',()=>{
 const s=isolated('waf');s.enemyCooldown=100;s.enemies.push({...enemy('fingerprint',300),id:'other',col:1});
 const hit=()=>{const e=s.enemies[0];s.shots.push({x:e.x,y:e.y+20});run(s,.025);};
 hit();assert.equal(s.enemies[0].hp,1);assert.equal(s.score,0);hit();assert.equal(s.enemies[0].alive,false);assert.equal(s.score,80);run(s,.05);assert.equal(s.score,80);
});
test('player damage has a grace period and three distinct hits end the run',()=>{
 const s=createInvaders(390,340,4);startInvaders(s);s.enemyCooldown=100;
 const hit=()=>s.threats.push({x:s.playerX,y:s.playerY-30,vx:0,vy:180,kind:'waf'});
 hit();hit();run(s,.05);assert.equal(s.lives,2);assert.equal(s.status,'running');
 s.threats=[];run(s,1.6);hit();run(s,.05);assert.equal(s.lives,1);
 s.threats=[];run(s,1.6);hit();run(s,.05);assert.equal(s.status,'over');assert.equal(s.lives,0);
});
test('cleared waves advance, remove old projectiles and pause freezes the complete formation',()=>{
 const s=createInvaders(760,405,4);startInvaders(s);s.enemies.forEach(e=>{e.alive=false;});s.threats.push({x:100,y:200,vx:0,vy:180});run(s,.1);assert.equal(s.threats.length,0);run(s,1.5);assert.equal(s.wave,2);assert.equal(s.score,100);assert.equal(s.enemies.length,24);
 pauseInvaders(s);const snapshot=JSON.stringify(s);run(s,2,{fire:true,right:true});assert.equal(JSON.stringify(s),snapshot);pauseInvaders(s);run(s,.2,{right:true});assert.ok(s.playerX>380);
});
test('waves introduce rate limits, honeypots and an armored guardian every fourth wave',()=>{
 const s=createInvaders(390,340,4),kinds=()=>new Set(s.enemies.map(e=>e.kind));assert.deepEqual(kinds(),new Set(['waf','fingerprint']));
 s.wave=2;spawnInvadersWave(s);assert.ok(kinds().has('rate'));
 s.wave=3;spawnInvadersWave(s);assert.ok(kinds().has('honey'));
 for(const wave of [4,8,12]){s.wave=wave;spawnInvadersWave(s);const boss=s.enemies.find(e=>e.kind==='guardian');assert.ok(boss.hp>=24);assert.equal(s.enemies.length,5);assert.ok(s.enemies.every(e=>e.y+e.height/2<s.playerY-100));}
});
test('all attacks announce their charge and fingerprint locks onto the original position',()=>{
 const s=isolated('fingerprint');run(s,.02);const e=s.enemies[0];assert.ok(e.charge);assert.equal(s.threats.length,0);assert.equal(e.charge.targetX,195);
 run(s,.4,{left:true});assert.equal(s.threats.length,0);run(s,.32,{left:true});assert.equal(s.threats.length,1);assert.ok(s.threats[0].vx>0,'aim retains the original rightward lock after the player dodges left');
 for(const kind of ['waf','rate','honey','guardian']){const a=isolated(kind);run(a,.1);assert.equal(a.threats.length,0);assert.ok(a.enemies[0].charge.duration>=.45);}
});
test('rate limits fire a spread, honeypots split, and guardians alternate target lock with a fan',()=>{
 const rate=isolated('rate');run(rate,.5);assert.equal(rate.threats.length,3);assert.deepEqual(rate.threats.map(b=>b.vx),[-38,0,38]);
 const honey=isolated('honey');run(honey,1.15);assert.equal(honey.threats.length,2);assert.ok(honey.threats.every(b=>b.kind==='shard'));assert.ok(honey.threats[0].vx<0&&honey.threats[1].vx>0);
 const boss=isolated('guardian');run(boss,.75);assert.equal(boss.threats[0].kind,'lock');boss.threats=[];boss.enemyCooldown=0;run(boss,.85);assert.equal(boss.threats.length,5);assert.ok(boss.threats.every(b=>b.kind==='rate'));
});
test('destroying a charging enemy cancels its attack',()=>{
 const s=isolated('fingerprint');run(s,.1);const e=s.enemies[0];s.shots.push({x:e.x,y:e.y+20});run(s,.05);assert.equal(e.alive,false);run(s,1);assert.equal(s.threats.length,0);
});
test('a low formation still gives at least half a second before a projectile reaches the hitbox',()=>{
 const s=isolated('waf');s.enemies[0].y=s.playerY-48-s.enemies[0].height/2-2;run(s,.46);
 assert.ok(s.threats.length);const bullet=s.threats[0];assert.ok((s.playerY-47-bullet.y)/bullet.vy>=.47);
});
test('pressure rises within and across waves, while bullet speed and count remain bounded',()=>{
 for(const width of [320,390,760,1100]){const s=createInvaders(width,340,4),initial=invadersDifficulty(s);s.time=50;s.waveTime=50;const later=invadersDifficulty(s);s.wave=7;const harder=invadersDifficulty(s);assert.ok(later.speed>initial.speed&&later.interval<initial.interval);assert.ok(harder.bulletSpeed>later.bulletSpeed&&harder.interval<later.interval);s.time=3600;s.wave=100;const maximum=invadersDifficulty(s);assert.ok(maximum.speed<=180&&maximum.interval>=.28&&maximum.bulletSpeed<=316);}
});
