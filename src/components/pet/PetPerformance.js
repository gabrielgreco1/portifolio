"use client";
import {useEffect,useRef} from 'react';
import {PET_DURATION,petPose,dragPose} from '@/lib/crawler/pet-motion.mjs';

const VIEWS=[[17,69,426,333],[480,69,367,341],[914,69,391,337],[1353,69,393,325],[22,511,394,330],[491,510,355,341],[903,507,412,336],[1349,507,405,333]];
let assets;
function images(){
  if(!assets)assets=Promise.all(['/crawler-character-v2.png','/crawler-turnaround.png'].map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;}))).catch(error=>{assets=null;throw error;});
  return assets;
}

export default function PetPerformance({action,onFinish,reduced,lang}) {
  const canvas=useRef(null),finish=useRef(onFinish);
  useEffect(()=>{finish.current=onFinish;});
  useEffect(()=>{
    if(!action)return;
    let raf,disposed=false;
    const {element,anchor,kind,labels,movement}=action;
    const paint=async()=>{
      let artwork;try{artwork=await images();}catch{finish.current();return;}
      if(disposed)return;
      const surface=canvas.current,ctx=surface.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1);
      surface.width=window.innerWidth*dpr;surface.height=window.innerHeight*dpr;
      const start=performance.now(),duration=kind==='drag'?Infinity:reduced?700:PET_DURATION[kind];
      element.setAttribute('data-pet-acting',kind);
      const draw=now=>{
        const ms=Math.min(duration,now-start),p=petPose(kind,ms,reduced),scale=anchor.width/244;
        const drag=movement?dragPose(movement.dx,movement.dy,now-movement.started,movement.released===null?null:now-movement.released,reduced):null;
        ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,surface.width,surface.height);
        ctx.save();ctx.translate(anchor.left,anchor.top);ctx.scale(scale,scale);
        if(drag){
          const x=Math.max(8-anchor.left,Math.min(drag.x,window.innerWidth-anchor.right-8));
          const y=Math.max(60-anchor.top,Math.min(drag.y,window.innerHeight-anchor.bottom-8));
          ctx.translate(x/scale,y/scale);
          surface.dataset.grip=drag.grip.toFixed(2);
          surface.dataset.offset=`${x.toFixed(1)},${y.toFixed(1)}`;
        }
        // Feet stay on one floor; the shadow separates the jump from a flat spin.
        ctx.fillStyle=`rgba(28,40,29,${.13*(1+p.y/100)})`;ctx.beginPath();ctx.ellipse(122,202,61+p.y*.45,8,0,0,Math.PI*2);ctx.fill();
        ctx.save();ctx.translate(122+p.x,197+p.y);ctx.rotate(p.angle);ctx.scale(p.sx,p.sy);ctx.translate(-122,-197);
        if(p.heat)ctx.filter=`sepia(${p.heat*.85}) saturate(${1+p.heat*5}) hue-rotate(${-65*p.heat}deg)`;
        if(drag)drawTension(ctx,artwork[0],drag.strain/scale,drag.step/scale,drag.grip);
        else if(p.frame<0)ctx.drawImage(artwork[0],10,16,224,224);
        else {const [x,y,w,h]=VIEWS[p.frame],height=133,width=w/h*height;ctx.drawImage(artwork[1],x,y,w,h,122-width/2,197-height,width,height);}
        ctx.filter='none';
        if(p.heat>.15){
          ctx.globalAlpha=p.heat*.85;ctx.fillStyle='#df542b';ctx.fillRect(93,107,20,4);ctx.fillRect(128,107,20,4);
          ctx.globalAlpha=1;
        }
        ctx.restore();
        if(p.steam>0)for(let i=0;i<6;i++){
          const life=((ms/750+i*.173)%1);ctx.globalAlpha=p.steam*(1-life)*.52;ctx.fillStyle=i%2?'#a5aaa1':'#e3e7dd';
          const x=100+i*9+Math.sin(life*6+i)*8,y=72-life*57,size=4+life*8;ctx.fillRect(x,y,size,size*1.3);
        }
        ctx.globalAlpha=1;
        if(p.burst>=0&&p.burst<1)for(let i=0;i<8;i++){
          const t=p.burst,ease=1-(1-t)**3,angle=i/8*Math.PI*2-1.7,radius=34+ease*114;
          ctx.save();ctx.translate(122+Math.cos(angle)*radius,115+Math.sin(angle)*radius*.68+t*t*45);ctx.rotate(Math.cos(i)*t*.18);ctx.globalAlpha=Math.min(1,t*10)*(1-smoothFade(t));
          const label=labels[i]||['{ }','[ ]','200 OK'][i%3];ctx.font='8px ui-monospace, monospace';const width=Math.min(132,ctx.measureText(label).width+16);
          ctx.shadowColor='#253e2630';ctx.shadowBlur=10;ctx.fillStyle='#f7fff2';ctx.strokeStyle='#9eb895';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(-width/2,-10,width,20,5);ctx.fill();ctx.shadowBlur=0;ctx.stroke();ctx.fillStyle='#355036';ctx.fillText(label,-width/2+8,3,width-16);ctx.restore();
        }
        ctx.restore();
        surface.dataset.elapsed=String(Math.round(ms));surface.dataset.pose=String(p.frame);
        if(ms<duration&&!drag?.done)raf=requestAnimationFrame(draw);else finish.current();
      };
      draw(start);
    };
    void paint();
    const cancel=()=>finish.current();
    window.addEventListener('resize',cancel);window.addEventListener('scroll',cancel,{passive:true});
    return()=>{disposed=true;cancelAnimationFrame(raf);element.removeAttribute('data-pet-acting');window.removeEventListener('resize',cancel);window.removeEventListener('scroll',cancel);};
  },[action,reduced]);
  if(!action)return null;
  return <div className="pet-performance" data-pet-performance={action.kind}>
    <canvas ref={canvas} aria-hidden="true"/>
    <span role="status" className="pet-performance-caption" style={{left:Math.max(12,Math.min(action.anchor.left+action.anchor.width/2-100,window.innerWidth-212)),top:Math.max(20,action.anchor.top-28)}}>{action.kind==='drag'?(lang==='pt'?'Ei! Minhas pernas não são decorativas.':'Hey! These legs are not decorative.'):action.kind==='spin'?(lang==='pt'?'360°. Nenhum dado perdido.':'360°. No data lost.'):(lang==='pt'?'Calma! Um clique por vez…':'Easy! One click at a time…')}</span>
  </div>;
}
function smoothFade(t){return Math.max(0,(t-.65)/.35);}

// Deform the approved texture, keeping four original feet planted. The housing
// moves rigidly; only the leg strips flex between their joints and their toes.
function drawTension(ctx,image,strain,step,grip){
  const ratio=image.width/224;
  ctx.drawImage(image,0,0,image.width,139*ratio,10+strain,16,224,139);
  const columns=[10,60,122,184,234];
  for(let y=155;y<240;y+=1.5){
    const height=Math.min(1.5,240-y),t=Math.max(0,Math.min(1,(y-155)/42)),flex=1-t*t*(3-2*t);
    for(let i=0;i<4;i++){
      const left=columns[i],width=columns[i+1]-left,footLift=(i%2?1:-1)*step*t;
      ctx.drawImage(image,(left-10)*ratio,(y-16)*ratio,width*ratio,height*ratio,left+strain*flex,y+footLift,width,height+.35);
    }
  }
  if(grip>.4){
    ctx.globalAlpha=(grip-.4)*.42;ctx.strokeStyle='#526046';ctx.lineWidth=1.5;
    for(const foot of [38,68,164,204]){ctx.beginPath();ctx.moveTo(foot-Math.sign(strain)*7,201);ctx.lineTo(foot-Math.sign(strain)*15,201);ctx.stroke();}
    ctx.globalAlpha=1;
  }
}
