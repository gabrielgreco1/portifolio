import {drawPetTension} from './pet-render.mjs';
import {drawAntiBot,ENEMY_TYPES} from './invaders-art.mjs';
const random=s=>{s.seed=(s.seed*1664525+1013904223)>>>0;return s.seed/4294967296;};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function invadersDifficulty(s){
 const pressure=clamp((s.wave-1)/9+s.time/360,0,1),live=s.enemies.filter(e=>e.alive).length;
 return {pressure,speed:Math.min(116,24+s.wave*6+s.waveTime*.24+(1-live/Math.max(1,s.initialCount))*48),interval:1.5-pressure*.92,bulletSpeed:(s.width<500?158:176)+pressure*85,limit:s.width<500?10:16};
}
export function createInvaders(width=760,height=430,seed=Date.now()){
 const s={width,height,status:'ready',playerX:width/2,playerY:height-24,lives:3,immune:0,time:0,waveTime:0,score:0,wave:1,direction:1,seed:seed>>>0,enemies:[],shots:[],threats:[],particles:[],shootCooldown:0,enemyCooldown:1.8,waveDelay:null,overTime:0,attackSerial:0,kills:0};
 spawnInvadersWave(s);return s;
}
export function spawnInvadersWave(s){
 s.enemies=[];s.waveTime=0;
 const add=(kind,x,y,col)=>{const spec=ENEMY_TYPES[kind],hp=kind==='guardian'?16+s.wave*2:spec.hp;s.enemies.push({...spec,id:`${s.wave}:${s.enemies.length}`,kind,col,x,y,hp,maxHp:hp,alive:true,hitFlash:0,charge:null});};
 if(s.wave%4===0){
  add('guardian',s.width/2,80,0);
  for(const side of [-1,1])for(let row=0;row<2;row++)add(row?'fingerprint':'waf',s.width/2+side*Math.min(110,s.width*.29),60+row*57,row+side*3);
 }else{
  const columns=s.width<500?5:8,rows=s.wave===1?2:3,gap=Math.min(s.width<500?51:64,(s.width-80)/(columns-1)),left=(s.width-(columns-1)*gap)/2;
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const kind=row===0?'waf':s.wave===1?'fingerprint':row===1?(col%2?'fingerprint':'rate'):(s.wave>=3&&col%3===1?'honey':'fingerprint');
   add(kind,left+col*gap,53+row*49,col);
  }
 }
 s.initialCount=s.enemies.length;s.direction=1;s.enemyCooldown=1.8;s.waveDelay=null;s.shots=[];s.threats=[];
}
export function startInvaders(s){s.status='running';}
export function pauseInvaders(s){if(s.status==='running')s.status='paused';else if(s.status==='paused')s.status='running';}
function burst(s,x,y,color,count=12){for(let i=0;i<count;i++)s.particles.push({x,y,vx:(random(s)-.5)*150,vy:(random(s)-.5)*150,life:.45+random(s)*.4,color});}
function particles(s,dt){for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}s.particles=s.particles.filter(p=>p.life>0);}
export function advanceInvaders(s,delta,input={}){
 if(s.status==='over'){const dt=Math.min(.1,delta);s.overTime+=dt;particles(s,dt);return;}
 if(s.status!=='running')return;
 let remaining=Math.min(.1,delta);while(remaining>0&&s.status==='running'){const dt=Math.min(1/120,remaining);remaining-=dt;step(s,dt,input);}
}
function beginAttack(s,enemy){
 const pattern=enemy.kind==='guardian'?((enemy.attacks||0)%2?'fan':'lock'):enemy.kind;
 const duration=pattern==='lock'||pattern==='fingerprint'?.7:pattern==='fan'?.8:pattern==='honey'?.65:.45;
 enemy.charge={pattern,duration,remaining:duration,targetX:s.playerX};enemy.attacks=(enemy.attacks||0)+1;s.attackSerial++;
}
function fireAttack(s,e,difficulty){
 const {pattern,targetX}=e.charge,y=e.y+e.height/2;
 // At least half a second of travel, in addition to the visible charge. This
 // remains true even if the formation has descended on a short phone screen.
 const vy=Math.min(difficulty.bulletSpeed,Math.max(1,(s.playerY-47-y)/.5));
 const aimed=clamp((targetX-e.x)/Math.max(.5,(s.playerY-30-y)/vy),-145,145);
 const shot=(dx,vx,kind,extra={})=>{if(s.threats.length<difficulty.limit)s.threats.push({x:e.x+dx,y,vx,vy,kind,color:e.color,...extra});};
 if(pattern==='fingerprint'||pattern==='lock')shot(0,aimed,'lock');
 else if(pattern==='rate'){for(const dx of [-10,0,10])shot(dx,dx*3.8,'rate');}
 else if(pattern==='fan'){for(const vx of [-115,-58,0,58,115])shot(0,vx,'rate');}
 else if(pattern==='honey')shot(0,aimed*.3,'honey',{splitY:Math.min(y+60,s.playerY-95)});
 else shot(0,0,'waf');
 e.charge=null;
}
function step(s,dt,input){
 s.time+=dt;s.waveTime+=dt;s.immune=Math.max(0,s.immune-dt);s.shootCooldown-=dt;s.enemyCooldown-=dt;
 const axis=(input.right?1:0)-(input.left?1:0),targetDelta=Number.isFinite(input.targetX)?clamp(input.targetX-s.playerX,-440*dt,440*dt):axis*300*dt;
 s.playerX=clamp(s.playerX+targetDelta,37,s.width-37);
 if(input.fire&&s.shootCooldown<=0){s.shots.push({x:s.playerX,y:s.playerY-53});s.shootCooldown=.17;}
 const live=s.enemies.filter(e=>e.alive),difficulty=invadersDifficulty(s);
 if(!live.length){
  if(s.waveDelay===null){s.waveDelay=1.5;s.score+=100+s.wave*20;s.threats=[];}
  s.waveDelay-=dt;if(s.waveDelay<=0){s.wave++;spawnInvadersWave(s);}
 }else{
  const boss=live.some(e=>e.kind==='guardian');
  for(const e of live){e.x+=s.direction*difficulty.speed*(boss?.75:1)*dt;e.hitFlash=Math.max(0,e.hitFlash-dt);}
  const left=Math.min(...live.map(e=>e.x-e.width/2)),right=Math.max(...live.map(e=>e.x+e.width/2));
  if(s.direction>0&&right>s.width-12||s.direction<0&&left<12){const correction=s.direction>0?s.width-12-right:12-left;s.direction*=-1;for(const e of live){e.x+=correction;e.y+=boss?4:9+Math.min(5,s.wave);}}
  if(s.enemyCooldown<=0){
   const bottom=Object.values(live.reduce((cols,e)=>{if(!cols[e.col]||cols[e.col].y<e.y)cols[e.col]=e;return cols;},{}));
   const candidates=bottom.filter(e=>!e.charge),guardian=live.find(e=>e.kind==='guardian'&&!e.charge);
   const shooter=guardian&&s.attackSerial%2===0?guardian:candidates[Math.floor(random(s)*candidates.length)];
   if(shooter&&s.threats.length<difficulty.limit-2)beginAttack(s,shooter);
   s.enemyCooldown=difficulty.interval+random(s)*.18;
  }
 }
 for(const shot of s.shots){
  shot.y-=520*dt;
  const hit=live.filter(e=>e.alive&&Math.abs(shot.x-e.x)<e.width/2+2&&Math.abs(shot.y-e.y)<e.height/2+6).sort((a,b)=>b.y-a.y)[0];
  if(hit){shot.y=-100;hit.hp--;hit.hitFlash=.15;burst(s,hit.x,hit.y,hit.color,hit.hp?4:12);if(hit.hp<=0){hit.alive=false;hit.charge=null;s.kills++;s.score+=hit.points;}}
 }
 for(const e of live){if(e.alive&&e.charge){e.charge.remaining-=dt;if(e.charge.remaining<=0)fireAttack(s,e,difficulty);}}
 const splits=[];
 for(const bullet of s.threats){
  bullet.y+=bullet.vy*dt;bullet.x+=bullet.vx*dt;
  if(bullet.kind==='honey'&&bullet.y>=bullet.splitY){bullet.y=s.height+100;for(const side of [-1,1])splits.push({x:bullet.x,y:bullet.splitY,vx:side*82,vy:bullet.vy,kind:'shard',color:bullet.color});continue;}
  if(!s.immune&&Math.abs(bullet.x-s.playerX)<18&&bullet.y>s.playerY-47&&bullet.y<s.playerY-5){bullet.y=s.height+100;s.lives--;s.immune=1.5;burst(s,s.playerX,s.playerY-28,'#edaa84',18);}
 }
 if(s.lives<=0||live.some(e=>e.alive&&e.y+e.height/2>=s.playerY-48)){s.status='over';s.lives=0;burst(s,s.playerX,s.playerY-28,'#edaa84',26);}
 s.shots=s.shots.filter(b=>b.y>-20);s.threats=s.threats.filter(b=>b.y<s.height+15&&b.x>-20&&b.x<s.width+20);s.threats.push(...splits.slice(0,Math.max(0,difficulty.limit-s.threats.length)));particles(s,dt);
}
export function drawInvaders(ctx,s,image,{reduced=false,input={},lang='pt'}={}){
  const {width:w,height:h,time}=s;
  const sky=ctx.createLinearGradient(0,0,w,h);sky.addColorStop(0,'#101d25');sky.addColorStop(.5,'#0a1e21');sky.addColorStop(1,'#122820');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const halo=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,h*.65);halo.addColorStop(0,'#7ea99313');halo.addColorStop(1,'#10252000');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
  for(let i=0;i<85;i++){const x=(i*137.17)%(w-12)+6,y=((i*61.71+(reduced?0:time*(2+i%3)))%(h+10));ctx.globalAlpha=.16+(i%4)*.1;ctx.fillStyle=i%6?'#c4d9c1':'#c6b992';ctx.fillRect(x,y,i%11?1:2,1);}ctx.globalAlpha=1;
  ctx.strokeStyle='#b3cf9220';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(w*.5,h+80,Math.max(250,w*.75)+i*22,128+i*17,0,Math.PI,Math.PI*2);ctx.stroke();}
  for(let i=0;i<5;i++){ctx.strokeStyle='#8fac9510';ctx.beginPath();ctx.moveTo(i*w/4,0);ctx.lineTo(w*.5+(i-2)*w*.08,h);ctx.stroke();}
  ctx.font='9px ui-monospace,monospace';ctx.textAlign='left';ctx.fillStyle='#93afa78c';ctx.fillText('ANTIBOT ORBIT / DEFENSE GRID',15,h-12);
  const live=s.enemies.filter(e=>e.alive),guardian=live.find(e=>e.kind==='guardian'),pressure=invadersDifficulty(s).pressure;
  ctx.fillStyle='#172e31';ctx.fillRect(0,0,w,3);ctx.fillStyle='#d99a7b';ctx.fillRect(0,0,w*pressure,3);
  for(const e of live){
    if(e.charge){
      const charge=e.charge,progress=1-charge.remaining/charge.duration;
      if(['fingerprint','lock'].includes(charge.pattern)){
        ctx.strokeStyle=`rgba(188,180,241,${.12+progress*.35})`;ctx.lineWidth=1;ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo(e.x,e.y+10);ctx.lineTo(charge.targetX,s.playerY-26);ctx.stroke();ctx.setLineDash([]);
        ctx.strokeStyle='#c8bdf0';ctx.beginPath();ctx.arc(charge.targetX,s.playerY-26,9-progress*3,0,Math.PI*2);ctx.moveTo(charge.targetX-12,s.playerY-26);ctx.lineTo(charge.targetX+12,s.playerY-26);ctx.stroke();
      }else{ctx.fillStyle=`rgba(229,171,126,${.04+progress*.08})`;ctx.beginPath();ctx.moveTo(e.x,e.y+15);ctx.lineTo(e.x-36,s.playerY);ctx.lineTo(e.x+36,s.playerY);ctx.closePath();ctx.fill();}
    }
    drawAntiBot(ctx,e,time,{reduced});
  }
  if(guardian){const barWidth=Math.min(180,w*.5),x=(w-barWidth)/2;ctx.fillStyle='#9c817544';ctx.fillRect(x,21,barWidth,3);ctx.fillStyle='#e6ae89';ctx.fillRect(x,21,barWidth*guardian.hp/guardian.maxHp,3);ctx.textAlign='center';ctx.font='8px ui-monospace,monospace';ctx.fillStyle='#e7bea1';ctx.fillText('403 / GATEKEEPER',w/2,15);}
  for(const shot of s.shots){ctx.shadowColor='#c1edab';ctx.shadowBlur=10;ctx.fillStyle='#e2f7bd';ctx.fillRect(shot.x-1.5,shot.y-8,3,14);ctx.shadowBlur=0;ctx.fillStyle='#d5edb228';ctx.fillRect(shot.x-3,shot.y+5,6,16);}
  for(const bullet of s.threats){ctx.save();ctx.translate(bullet.x,bullet.y);ctx.shadowColor=bullet.color;ctx.shadowBlur=8;ctx.fillStyle=bullet.color;
    if(bullet.kind==='honey'||bullet.kind==='shard'){ctx.rotate(reduced?Math.PI/4:time*2);ctx.fillRect(-3,-3,6,6);ctx.strokeStyle='#fff0c1';ctx.lineWidth=.5;ctx.strokeRect(-3,-3,6,6);}
    else{ctx.rotate(-Math.atan2(bullet.vx,bullet.vy));ctx.fillRect(-2,-5,4,10);ctx.shadowBlur=0;ctx.globalAlpha=.2;ctx.fillRect(-1,-16,2,11);}
    ctx.restore();}
  if(image){
    const direction=(input.right?1:0)-(input.left?1:0);ctx.save();ctx.translate(s.playerX,s.playerY);
    if(s.immune){ctx.strokeStyle='#d8e6ac99';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-25,43,38,0,0,Math.PI*2);ctx.stroke();if(!reduced)ctx.globalAlpha=.65+.35*Math.abs(Math.sin(time*5));}
    ctx.rotate(direction*.06);ctx.scale(84/224,84/224);ctx.translate(-122,-197);drawPetTension(ctx,image,0,s.status==='running'&&!reduced?Math.sin(time*9)*2:0,0);ctx.restore();
    if(s.status==='running'){ctx.fillStyle='#b5d39744';ctx.beginPath();ctx.ellipse(s.playerX,s.playerY+4,20,2,0,0,Math.PI*2);ctx.fill();}
  }
  for(const p of s.particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,2.5,2.5);}ctx.globalAlpha=1;
  if(s.waveDelay!==null){ctx.textAlign='center';ctx.fillStyle='#d1e5b4';ctx.font='13px ui-monospace,monospace';ctx.fillText(`${lang==='pt'?'CAMADA ROMPIDA':'LAYER BREACHED'} · +${100+s.wave*20}`,w/2,h*.5);ctx.fillStyle='#8da89a';ctx.font='10px ui-monospace,monospace';ctx.fillText((s.wave+1)%4===0?'403 / GATEKEEPER':`${lang==='pt'?'PRÓXIMA ONDA':'NEXT WAVE'} ${String(s.wave+1).padStart(2,'0')}`,w/2,h*.5+23);}
  else if(s.waveTime<2&&s.status==='running'){ctx.textAlign='center';ctx.globalAlpha=Math.min(1,(2-s.waveTime)*2);ctx.font='11px ui-monospace,monospace';ctx.fillStyle='#c9dec2';ctx.fillText(`${lang==='pt'?'ONDA':'WAVE'} ${String(s.wave).padStart(2,'0')} / ${s.wave%4===0?'GATEKEEPER':s.wave===1?'WAF + FINGERPRINT':s.wave===2?'RATE LIMIT':'HONEYPOTS'}`,w/2,h*.68);ctx.globalAlpha=1;}
}
