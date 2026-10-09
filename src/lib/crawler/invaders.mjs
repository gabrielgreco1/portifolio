import {drawPetTension} from './pet-render.mjs';
const random=s=>{s.seed=(s.seed*1664525+1013904223)>>>0;return s.seed/4294967296;};
export function createInvaders(width=760,height=430,seed=Date.now()){
  const s={width,height,status:'ready',playerX:width/2,playerY:height-24,lives:3,immune:0,time:0,score:0,wave:1,direction:1,seed:seed>>>0,enemies:[],shots:[],threats:[],particles:[],shootCooldown:0,enemyCooldown:1.3,waveDelay:null,overTime:0};
  spawnWave(s);return s;
}
function spawnWave(s){
  const columns=s.width<500?5:8,rows=Math.min(4,2+s.wave),gap=s.width<500?49:62,left=(s.width-(columns-1)*gap)/2;
  s.enemies=[];for(let row=0;row<rows;row++)for(let col=0;col<columns;col++)s.enemies.push({id:`${s.wave}:${row}:${col}`,col,x:left+col*gap,y:52+row*42,width:30,height:24,hp:row===0&&s.wave>1?2:1,kind:row%3,alive:true});
  s.direction=1;s.enemyCooldown=1.3;s.waveDelay=null;s.shots=[];s.threats=[];
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
function step(s,dt,input){
  s.time+=dt;s.immune=Math.max(0,s.immune-dt);s.shootCooldown-=dt;s.enemyCooldown-=dt;
  const axis=(input.right?1:0)-(input.left?1:0);
  const targetDelta=Number.isFinite(input.targetX)?Math.max(-440*dt,Math.min(440*dt,input.targetX-s.playerX)):axis*300*dt;
  s.playerX=Math.max(37,Math.min(s.width-37,s.playerX+targetDelta));
  if(input.fire&&s.shootCooldown<=0){s.shots.push({x:s.playerX,y:s.playerY-53});s.shootCooldown=.19;}
  const live=s.enemies.filter(e=>e.alive);
  if(!live.length){
    if(s.waveDelay===null){s.waveDelay=1;s.score+=100;}
    s.waveDelay-=dt;if(s.waveDelay<=0){s.wave++;spawnWave(s);}
  }else{
    const speed=18+s.wave*7+(1-live.length/s.enemies.length)*42;
    for(const e of live)e.x+=s.direction*speed*dt;
    const left=Math.min(...live.map(e=>e.x-e.width/2)),right=Math.max(...live.map(e=>e.x+e.width/2));
    if(s.direction>0&&right>s.width-14||s.direction<0&&left<14){s.direction*=-1;for(const e of live)e.y+=14;}
    if(s.enemyCooldown<=0){
      const bottom=Object.values(live.reduce((cols,e)=>{if(!cols[e.col]||cols[e.col].y<e.y)cols[e.col]=e;return cols;},{}));
      const shooter=bottom[Math.floor(random(s)*bottom.length)];
      if(s.threats.length<(s.width<500?6:10))s.threats.push({x:shooter.x,y:shooter.y+15,vx:Math.max(-32,Math.min(32,(s.playerX-shooter.x)*.13))});
      s.enemyCooldown=Math.max(.48,1.05-s.wave*.045)+random(s)*.3;
    }
  }
  for(const shot of s.shots){
    shot.y-=490*dt;
    const hit=live.find(e=>e.alive&&Math.abs(shot.x-e.x)<e.width/2+2&&Math.abs(shot.y-e.y)<e.height/2+6);
    if(hit){shot.y=-100;hit.hp--;burst(s,hit.x,hit.y,hit.hp?'#b4d6ac':'#eac08c',8);if(hit.hp<=0){hit.alive=false;s.score+=(3-hit.kind)*10;}}
  }
  for(const bullet of s.threats){
    bullet.y+=(180+Math.min(100,s.wave*14))*dt;bullet.x+=bullet.vx*dt;
    if(!s.immune&&Math.abs(bullet.x-s.playerX)<20&&bullet.y>s.playerY-47&&bullet.y<s.playerY-5){bullet.y=s.height+100;s.lives--;s.immune=1.4;burst(s,s.playerX,s.playerY-28,'#edaa84',18);}
  }
  if(s.lives<=0||live.some(e=>e.alive&&e.y+e.height/2>=s.playerY-46)){s.status='over';s.lives=0;burst(s,s.playerX,s.playerY-28,'#edaa84',26);}
  s.shots=s.shots.filter(b=>b.y>-20);s.threats=s.threats.filter(b=>b.y<s.height+15);particles(s,dt);
}

export function drawInvaders(ctx,s,image,{reduced=false,input={}}={}){
  const {width:w,height:h,time}=s;
  const sky=ctx.createLinearGradient(0,0,w,h);sky.addColorStop(0,'#101d25');sky.addColorStop(.5,'#0a1e21');sky.addColorStop(1,'#122820');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const halo=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,h*.65);halo.addColorStop(0,'#7ea99313');halo.addColorStop(1,'#10252000');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
  for(let i=0;i<85;i++){const x=(i*137.17)%(w-12)+6,y=((i*61.71+(reduced?0:time*(2+i%3)))%(h+10));ctx.globalAlpha=.16+(i%4)*.1;ctx.fillStyle=i%6?'#c4d9c1':'#c6b992';ctx.fillRect(x,y,i%11?1:2,1);}ctx.globalAlpha=1;
  ctx.strokeStyle='#b3cf9220';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(w*.5,h+80,Math.max(250,w*.75)+i*22,128+i*17,0,Math.PI,Math.PI*2);ctx.stroke();}
  for(let i=0;i<5;i++){ctx.strokeStyle='#8fac9510';ctx.beginPath();ctx.moveTo(i*w/4,0);ctx.lineTo(w*.5+(i-2)*w*.08,h);ctx.stroke();}
  ctx.font='8px ui-monospace,monospace';ctx.textAlign='left';ctx.fillStyle='#7f9f9a77';ctx.fillText('SCHEMA ORBIT / DEFENSE GRID',15,h-12);
  for(const e of s.enemies.filter(e=>e.alive))drawEnemy(ctx,e,time,reduced);
  for(const shot of s.shots){ctx.shadowColor='#c1edab';ctx.shadowBlur=10;ctx.fillStyle='#e2f7bd';ctx.fillRect(shot.x-1.5,shot.y-8,3,14);ctx.shadowBlur=0;ctx.fillStyle='#d5edb228';ctx.fillRect(shot.x-3,shot.y+5,6,16);}
  for(const bullet of s.threats){ctx.shadowColor='#e1a37c';ctx.shadowBlur=9;ctx.fillStyle='#efb28e';ctx.fillRect(bullet.x-2,bullet.y-4,4,10);ctx.shadowBlur=0;ctx.fillStyle='#d9907135';ctx.fillRect(bullet.x-1,bullet.y-13,2,8);}
  if(image){
    const direction=(input.right?1:0)-(input.left?1:0);ctx.save();ctx.translate(s.playerX,s.playerY);
    if(s.immune){ctx.strokeStyle='#d8e6ac99';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-25,43,38,0,0,Math.PI*2);ctx.stroke();if(!reduced)ctx.globalAlpha=.65+.35*Math.abs(Math.sin(time*5));}
    ctx.rotate(direction*.06);ctx.scale(84/224,84/224);ctx.translate(-122,-197);drawPetTension(ctx,image,0,s.status==='running'&&!reduced?Math.sin(time*9)*2:0,0);ctx.restore();
    if(s.status==='running'){ctx.fillStyle='#b5d39744';ctx.beginPath();ctx.ellipse(s.playerX,s.playerY+4,20,2,0,0,Math.PI*2);ctx.fill();}
  }
  for(const p of s.particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,2.5,2.5);}ctx.globalAlpha=1;
  if(s.waveDelay!==null){ctx.textAlign='center';ctx.fillStyle='#d1e5b4';ctx.font='12px ui-monospace,monospace';ctx.fillText('BATCH CLEARED · +100',w/2,h*.5);}
}
function drawEnemy(ctx,e,time,reduced){
  const colors=[['#acaabc','#77768b','#ded5db'],['#b99878','#705445','#e5bf95'],['#869e93','#536d62','#b9ceac']][e.kind];
  const x=e.x-15,y=e.y-12,bob=reduced?0:Math.sin(time*2+e.col)*1.5;
  ctx.save();ctx.translate(0,bob);
  // Small beveled data cartridges with pins, vents and different corrupted payloads.
  ctx.fillStyle='#071517';ctx.fillRect(x-6,y+6,42,14);
  for(let i=0;i<3;i++){ctx.fillStyle=colors[1];ctx.fillRect(x-6,y+5+i*5,5,3);ctx.fillRect(x+31,y+5+i*5,5,3);}
  ctx.fillStyle=colors[0];ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5,y-4);ctx.lineTo(x+35,y-4);ctx.lineTo(x+30,y);ctx.closePath();ctx.fill();
  ctx.fillStyle=colors[1];ctx.beginPath();ctx.moveTo(x+30,y);ctx.lineTo(x+35,y-4);ctx.lineTo(x+35,y+19);ctx.lineTo(x+30,y+24);ctx.closePath();ctx.fill();
  ctx.fillStyle='#22302e';ctx.fillRect(x,y,30,24);ctx.strokeStyle=colors[0];ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,29,23);
  ctx.fillStyle='#101f20';ctx.fillRect(x+4,y+5,22,12);ctx.textAlign='center';ctx.font='bold 7px ui-monospace,monospace';ctx.fillStyle=colors[2];ctx.fillText(['NULL','DUP','404'][e.kind],e.x,y+14);
  ctx.fillStyle=e.hp>1?'#dbe9b5':colors[1];ctx.fillRect(x+5,y+20,8,2);ctx.fillRect(x+18,y+20,8,2);
  ctx.restore();
}
