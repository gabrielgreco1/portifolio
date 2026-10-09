import {drawPetTension} from './pet-render.mjs';
const GRAVITY=1750,JUMP=-650;
const random=s=>{s.seed=(s.seed*1664525+1013904223)>>>0;return s.seed/4294967296;};
export function createRunner(width=760,height=390,seed=Date.now()){
  return {width,height,ground:height-65,playerX:width<500?66:108,y:0,velocity:0,status:'ready',time:0,distance:0,speed:245,score:0,packets:0,seed:seed>>>0,spawn:.7,obstacles:[],tokens:[],particles:[],flash:0,overTime:0,serial:0};
}
export function startRunner(s){s.status='running';}
export function jumpRunner(s){
  if(s.status!=='running'||s.y<-.5)return false;
  s.velocity=JUMP;return true;
}
export function pauseRunner(s){if(s.status==='running')s.status='paused';else if(s.status==='paused')s.status='running';}
function burst(s,x,y,color,count){for(let i=0;i<count;i++)s.particles.push({x,y,vx:(random(s)-.5)*190,vy:-random(s)*170-20,life:.7+random(s)*.4,color});}
export function advanceRunner(s,delta){
  if(s.status==='over'){s.overTime+=Math.min(delta,.1);for(const p of s.particles){p.x+=p.vx*delta;p.y+=p.vy*delta;p.vy+=250*delta;p.life-=delta;}s.particles=s.particles.filter(p=>p.life>0);return;}
  if(s.status!=='running')return;
  let remaining=Math.min(delta,.1);
  while(remaining>0&&s.status==='running'){const dt=Math.min(remaining,1/120);remaining-=dt;step(s,dt);}
}
function step(s,dt){
  s.time+=dt;s.speed=245+Math.min(125,s.time*2);s.distance+=s.speed*dt;s.score=Math.floor(s.distance/12)+s.packets*50;
  s.velocity+=GRAVITY*dt;s.y=Math.min(0,s.y+s.velocity*dt);if(s.y===0)s.velocity=0;
  s.spawn-=dt;
  if(s.spawn<=0){
    const first=s.serial===0,kind=random(s)>.55?'rate':'wall';
    s.obstacles.push({id:s.serial++,x:s.width+42,width:kind==='wall'?34:42,height:kind==='wall'?48:35,kind});
    if(first||random(s)>.25)s.tokens.push({id:s.serial++,x:s.width+84,y:s.ground-100,collected:false});
    s.spawn=1.45+random(s)*.6;
  }
  for(const o of s.obstacles){
    o.x-=s.speed*dt;
    const horizontal=s.playerX+17>o.x+5&&s.playerX-17<o.x+o.width-4;
    const feet=s.ground+s.y-5,head=feet-40;
    if(horizontal&&feet>s.ground-o.height+6&&head<s.ground-3){s.status='over';s.flash=1;burst(s,s.playerX,s.ground+s.y-28,'#efa777',24);break;}
  }
  for(const token of s.tokens){
    token.x-=s.speed*dt;
    if(!token.collected&&Math.abs(token.x-s.playerX)<34&&Math.abs(token.y-(s.ground+s.y-28))<40){token.collected=true;s.packets++;burst(s,token.x,token.y,'#b7e99b',9);}
  }
  s.score=Math.floor(s.distance/12)+s.packets*50;
  s.obstacles=s.obstacles.filter(o=>o.x>-80);s.tokens=s.tokens.filter(t=>t.x>-40&&!t.collected);
  for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=250*dt;p.life-=dt;}s.particles=s.particles.filter(p=>p.life>0);
}

export function drawRunner(ctx,s,image,{reduced=false}={}){
  const {width:w,height:h,ground:g,distance,time}=s;
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#091918');sky.addColorStop(.8,'#182e25');sky.addColorStop(1,'#081815');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const haze=ctx.createRadialGradient(w*.68,g-80,5,w*.68,g-80,w*.65);haze.addColorStop(0,'#9acb6e1c');haze.addColorStop(1,'#9acb6e00');ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
  // Slow server skyline and moving foreground give the runner a world, not a flat strip.
  for(let i=0;i<40;i++){
    const x=((i*73-distance*.05)%(w+90)+w+90)%(w+90),y=25+(i*47)%Math.max(30,g-140);
    ctx.globalAlpha=.2+(i%3)*.09;ctx.fillStyle=i%4?'#acc3a1':'#e2c494';ctx.fillRect(x,y,i%5?1:2,1);
  }ctx.globalAlpha=1;
  // A distant relay and packets flowing between it and the server district.
  const relayX=w*.76,relayY=Math.max(62,g*.31),relayR=w<500?26:39;
  ctx.strokeStyle='#a5ca7940';ctx.lineWidth=1;ctx.beginPath();ctx.arc(relayX,relayY,relayR,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#a5ca7918';ctx.beginPath();ctx.ellipse(relayX,relayY,relayR*1.55,relayR*.55,-.35,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<3;i++){
    const angle=i*2.094+(reduced?0:time*.17),nx=relayX+Math.cos(angle)*relayR,ny=relayY+Math.sin(angle)*relayR;
    ctx.fillStyle='#c8db9680';ctx.fillRect(nx-1,ny-1,3,3);
  }
  ctx.font='7px ui-monospace,monospace';ctx.textAlign='center';ctx.fillStyle='#94b17575';ctx.fillText('UPLINK',relayX,relayY+3);
  for(let i=0;i<3;i++){
    const y=g-158-i*18,start=w*.12+i*29,end=w*.67+i*28;
    ctx.strokeStyle='#9fc88110';ctx.beginPath();ctx.moveTo(start,y+18);ctx.lineTo(start+24,y);ctx.lineTo(end,y);ctx.lineTo(end+18,y-18);ctx.stroke();
    const progress=((reduced?0:time*.12)+i*.3)%1;ctx.fillStyle='#b9d28d70';ctx.fillRect(start+24+(end-start-24)*progress,y-1,5,2);
  }
  for(let i=-1;i<Math.ceil(w/65)+2;i++){
    const world=i+Math.floor(distance*.16/65),x=i*65-(distance*.16%65),height=55+((world*53+389)%94+94)%94;
    ctx.fillStyle='#0b1e1c';ctx.fillRect(x,g-height,40,height);ctx.fillStyle='#284237';ctx.fillRect(x,g-height,40,2);ctx.fillStyle='#314c3d';ctx.fillRect(x+36,g-height+2,4,height-2);
    for(let row=0;row<height/12-1;row++){ctx.fillStyle='#385240';ctx.fillRect(x+5,g-height+8+row*12,25,2);ctx.fillStyle=(row+world)%4?'#6c965457':'#adc586ad';ctx.fillRect(x+29,g-height+7+row*12,2,3);}
  }
  ctx.fillStyle='#0a1d17';ctx.fillRect(0,g,w,h-g);ctx.strokeStyle='#a6cc8159';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,g+.5);ctx.lineTo(w,g+.5);ctx.stroke();
  ctx.strokeStyle='#77976312';for(let i=-4;i<12;i++){const x=(i*110-distance*.38%110);ctx.beginPath();ctx.moveTo(w/2+(x-w/2)*.35,g+2);ctx.lineTo(x,h);ctx.stroke();}
  for(let row=0;row<4;row++){ctx.fillStyle='#92b47c10';ctx.fillRect(0,g+8+row*row*5,w,1);}
  for(let i=0;i<Math.ceil(w/45)+1;i++){ctx.fillStyle=i%3?'#61845444':'#b7d89180';ctx.fillRect(i*45-distance%45,g+4,15,2);}
  for(const token of s.tokens){
    const bob=reduced?0:Math.sin(time*3+token.id)*4;ctx.save();ctx.translate(token.x,token.y+bob);ctx.shadowColor='#b9ea91';ctx.shadowBlur=12;ctx.fillStyle='#99be7070';ctx.fillRect(-10,-11,20,22);ctx.shadowBlur=0;ctx.strokeStyle='#c2e39f';ctx.lineWidth=1;ctx.strokeRect(-10.5,-11.5,21,23);ctx.fillStyle='#cee9af';ctx.font='bold 12px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('{}',0,4);ctx.restore();
  }
  if(s.status==='ready'){drawObstacle(ctx,{x:w*.68,width:34,height:48,kind:'wall',id:1},g,time,true);drawObstacle(ctx,{x:w*.87,width:42,height:35,kind:'rate',id:2},g,time,true);}
  for(const obstacle of s.obstacles)drawObstacle(ctx,obstacle,g,time,reduced);
  const bob=s.y===0&&s.status==='running'&&!reduced?Math.sin(time*24)*1.7:0;
  ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(s.playerX,g+3,28+Math.max(-18,s.y*.07),4,0,0,Math.PI*2);ctx.fill();
  if(image){
    ctx.save();ctx.translate(s.playerX,g+s.y+bob);if(s.y<0)ctx.rotate(-.045);ctx.imageSmoothingEnabled=true;
    ctx.scale(96/224,96/224);ctx.translate(-122,-197);
    drawPetTension(ctx,image,0,s.y===0&&s.status==='running'&&!reduced?Math.sin(time*22)*5:0,0);ctx.restore();
  }
  for(const p of s.particles){ctx.globalAlpha=Math.min(1,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
  if(s.status==='running'&&!reduced&&s.y===0)for(let i=0;i<4;i++){const life=(time*4+i*.23)%1;ctx.globalAlpha=(1-life)*.35;ctx.fillStyle='#c4dc9e';ctx.fillRect(s.playerX-30-life*36,g-3-life*4,3,2);}ctx.globalAlpha=1;
  ctx.textAlign='left';ctx.font='9px ui-monospace,monospace';ctx.fillStyle='#88a58a88';ctx.fillText('DATA DISTRICT / 01',18,25);
  ctx.textAlign='right';ctx.fillText(`${Math.floor(s.distance/10).toString().padStart(5,'0')} m`,w-18,25);
}
function drawObstacle(ctx,o,ground,time,reduced){
  const {x,width:w,height:h,kind}=o,y=ground-h,edge=7;
  ctx.save();ctx.shadowColor='#0008';ctx.shadowBlur=10;ctx.fillStyle='#080e0e';ctx.fillRect(x+3,ground-4,w+8,6);ctx.shadowBlur=0;
  ctx.fillStyle=kind==='wall'?'#a27458':'#ad9d69';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+edge,y-edge);ctx.lineTo(x+w+edge,y-edge);ctx.lineTo(x+w,y);ctx.closePath();ctx.fill();
  ctx.fillStyle=kind==='wall'?'#493128':'#4c4830';ctx.beginPath();ctx.moveTo(x+w,y);ctx.lineTo(x+w+edge,y-edge);ctx.lineTo(x+w+edge,ground-edge);ctx.lineTo(x+w,ground);ctx.closePath();ctx.fill();
  const face=ctx.createLinearGradient(x,y,x+w,ground);face.addColorStop(0,kind==='wall'?'#704c3c':'#746b45');face.addColorStop(1,kind==='wall'?'#392d27':'#373a29');ctx.fillStyle=face;ctx.fillRect(x,y,w,h);
  ctx.strokeStyle=kind==='wall'?'#d5a078':'#d4c181';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  ctx.fillStyle='#15241d';ctx.fillRect(x+5,y+7,w-10,17);ctx.fillStyle=kind==='wall'?'#eeb895':'#e3d599';ctx.font='bold 10px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(kind==='wall'?'403':'429',x+w/2,y+19);
  for(let i=0;i<3;i++){ctx.fillStyle=i%2?'#d1af71':'#302d20';ctx.fillRect(x+5+i*(w-10)/3,ground-7,(w-10)/3-1,4);}
  if(h>40){ctx.strokeStyle='#b58c6166';ctx.beginPath();ctx.moveTo(x+6,y+30);ctx.lineTo(x+w-6,y+30);ctx.stroke();ctx.fillStyle='#b89463';ctx.fillRect(x+7,y+34,2,2);ctx.fillRect(x+w-9,y+34,2,2);}
  ctx.fillStyle=reduced||Math.sin(time*3+o.id)>.1?'#dfbc70':'#6d5340';ctx.fillRect(x+w-5,y+3,2,2);ctx.restore();
}
