"use client";
import {memo,useEffect,useRef,useState} from 'react';
import {geoDistance,geoGraticule10,geoOrthographic,geoPath} from 'd3-geo';
import {feature,mesh} from 'topojson-client';
import atlas from 'world-atlas/countries-110m.json';
const land=feature(atlas,atlas.objects.land),borders=mesh(atlas,atlas.objects.countries,(a,b)=>a!==b),grid=geoGraticule10();
const located=p=>Number.isFinite(p.longitude)&&Number.isFinite(p.latitude);

// Rotation never reconciles the dialog, city list or hundreds of SVG filters.
export default memo(function VisitorGlobe({points,selected,onSelect,lang,reduced}){
 const canvas=useRef(null),draw=useRef(()=>{}),rotation=useRef([48,15,0]),zoom=useRef(1),contacts=useRef(new Map()),drag=useRef(null),hits=useRef([]),animation=useRef(0),[hover,setHover]=useState(null);
 const pt=lang==='pt',selectedId=selected?.id,longitude=selected?.longitude,latitude=selected?.latitude;
 useEffect(()=>{
  const el=canvas.current,ctx=el.getContext('2d',{alpha:false});let frame=0;const tile=document.createElement('canvas');tile.width=tile.height=6;const ink=tile.getContext('2d');ink.fillStyle='#dce5d944';ink.beginPath();ink.arc(3,3,.65,0,Math.PI*2);ink.fill();const texture=ctx.createPattern(tile,'repeat');
  function render(){
   frame=0;const rect=el.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5),size=Math.max(1,Math.round(rect.width*dpr));
   if(el.width!==size||el.height!==Math.round(rect.height*dpr)){el.width=size;el.height=Math.round(rect.height*dpr);}
   ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0c141e';ctx.fillRect(0,0,el.width,el.height);const scale=Math.min(el.width/720,el.height/600);ctx.setTransform(scale,0,0,scale,(el.width-720*scale)/2,(el.height-600*scale)/2);
   const projection=geoOrthographic().translate([360,296]).scale(234*zoom.current).rotate(rotation.current).precision(.7),path=geoPath(projection,ctx),r=234*zoom.current,center=projection.invert([360,296]);
   ctx.strokeStyle='#b1c8d024';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(360,296,320,110,-.48,0,Math.PI*2);ctx.stroke();
   const ocean=ctx.createRadialGradient(280,210,20,360,296,r);ocean.addColorStop(0,'#294557');ocean.addColorStop(1,'#111f2b');
   ctx.beginPath();ctx.arc(360,296,r,0,Math.PI*2);ctx.fillStyle=ocean;ctx.fill();ctx.strokeStyle='#a7c5d24a';ctx.stroke();
   ctx.beginPath();path(grid);ctx.strokeStyle='#adc6ce24';ctx.lineWidth=.65;ctx.stroke();
   ctx.beginPath();path(land);ctx.fillStyle='#849d9e';ctx.fill();ctx.fillStyle=texture;ctx.fill();ctx.strokeStyle='#d1ded34d';ctx.lineWidth=.5;ctx.stroke();
   ctx.beginPath();path(borders);ctx.strokeStyle='#e4ebdd38';ctx.lineWidth=.55;ctx.stroke();
   const shade=ctx.createRadialGradient(285,200,40,360,296,r);shade.addColorStop(0,'#e7f0dc12');shade.addColorStop(.6,'#00000000');shade.addColorStop(1,'#00000070');ctx.beginPath();ctx.arc(360,296,r,0,Math.PI*2);ctx.fillStyle=shade;ctx.fill();
   hits.current=[];
   for(const p of [...points].reverse()){if(!located(p)||geoDistance([p.longitude,p.latitude],center)>=Math.PI/2)continue;
    const [x,y]=projection([p.longitude,p.latitude]),radius=p.active?5:2.2+Math.min(2,Math.log2((p.visits||p.activeUsers||0)+1)*.3);
    ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fillStyle=p.active?'#92edbb':p.id===selected?.id?'#ffffff':'#e3c489';ctx.fill();
    if(p.active||p.id===selected?.id){ctx.beginPath();ctx.arc(x,y,radius+5,0,Math.PI*2);ctx.strokeStyle=p.active?'#92edbb80':'#ffffff99';ctx.lineWidth=1;ctx.stroke();}
    hits.current.push({point:p,x,y});
   }
  }
  draw.current=()=>{if(!frame)frame=requestAnimationFrame(render);};
  const observer=new ResizeObserver(draw.current);observer.observe(el);draw.current();
  return()=>{observer.disconnect();cancelAnimationFrame(frame);draw.current=()=>{};};
 },[points,selected]);
 useEffect(()=>{
  if(!Number.isFinite(longitude)||!Number.isFinite(latitude))return;
  const from=[...rotation.current],target=[-longitude,-latitude,0],start=performance.now();target[0]+=Math.round((from[0]-target[0])/360)*360;
  function tick(now){const t=reduced?1:Math.min(1,(now-start)/550),ease=1-(1-t)**3;rotation.current=from.map((v,i)=>v+(target[i]-v)*ease);draw.current();if(t<1)animation.current=requestAnimationFrame(tick);}
  animation.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(animation.current);
 },[selectedId,longitude,latitude,reduced]);
 useEffect(()=>()=>cancelAnimationFrame(animation.current),[]);
 function local(e){const b=canvas.current.getBoundingClientRect();const scale=Math.min(b.width/720,b.height/600);return[(e.clientX-b.left-(b.width-720*scale)/2)/scale,(e.clientY-b.top-(b.height-600*scale)/2)/scale];}
 function nearest(e){const [x,y]=local(e);return hits.current.reduce((best,p)=>{const d=Math.hypot(x-p.x,y-p.y);return d<14&&(!best||d<best.distance)?{...p,distance:d}:best;},null);}
 function down(e){if(e.button!==0)return;cancelAnimationFrame(animation.current);setHover(null);contacts.current.set(e.pointerId,[e.clientX,e.clientY]);e.currentTarget.setPointerCapture(e.pointerId);const values=[...contacts.current.values()];drag.current={x:e.clientX,y:e.clientY,rotation:[...rotation.current],moved:false,zoom:zoom.current,distance:values.length===2?Math.hypot(values[0][0]-values[1][0],values[0][1]-values[1][1]):0};}
 function move(e){if(!contacts.current.has(e.pointerId)){if(e.pointerType==='mouse'){const hit=nearest(e);setHover(prev=>prev?.id===hit?.point.id?prev:hit?{id:hit.point.id,title:hit.point.label}:null);}return;}
  contacts.current.set(e.pointerId,[e.clientX,e.clientY]);const values=[...contacts.current.values()],d=drag.current;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>4)d.moved=true;
  if(values.length===2&&d.distance){zoom.current=Math.max(.8,Math.min(1.8,d.zoom*Math.hypot(values[0][0]-values[1][0],values[0][1]-values[1][1])/d.distance));d.moved=true;}
  else rotation.current=[d.rotation[0]+dx*.3/zoom.current,Math.max(-80,Math.min(80,d.rotation[1]-dy*.3/zoom.current)),0];draw.current();
 }
 function up(e){const click=contacts.current.size===1&&!drag.current?.moved;contacts.current.delete(e.pointerId);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(click){const hit=nearest(e);if(hit)onSelect(hit.point);}if(contacts.current.size){const [[x,y]]=[...contacts.current.values()];drag.current={x,y,rotation:[...rotation.current],zoom:zoom.current,distance:0,moved:true};}}
 return <div className="visitor-globe"><canvas ref={canvas} tabIndex={0} role="img" aria-label={pt?'Globo de visitas. Use as setas para girar; consulte as cidades no botão Explorar cidades.':'Visitor globe. Use arrow keys to rotate; open Explore cities for accessible city details.'} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={e=>{contacts.current.delete(e.pointerId);if(drag.current)drag.current.moved=true;}} onPointerLeave={()=>setHover(null)} onKeyDown={e=>{const directions={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,12],ArrowDown:[0,-12]};if(directions[e.key]){e.preventDefault();cancelAnimationFrame(animation.current);const [x,y]=directions[e.key];rotation.current=[rotation.current[0]+x,Math.max(-80,Math.min(80,rotation.current[1]+y)),0];draw.current();}}}/>
 {hover&&<div className="visitor-canvas-tooltip" role="status">{hover.title}</div>}
 <div className="visitor-map-controls"><button aria-label={pt?'Aproximar':'Zoom in'} onClick={()=>{zoom.current=Math.min(1.8,zoom.current+.2);draw.current();}}>+</button><button aria-label={pt?'Afastar':'Zoom out'} onClick={()=>{zoom.current=Math.max(.8,zoom.current-.2);draw.current();}}>−</button><button aria-label={pt?'Voltar ao Brasil':'Return to Brazil'} onClick={()=>{cancelAnimationFrame(animation.current);rotation.current=[48,15,0];zoom.current=1;draw.current();}}>⌖</button></div></div>;
});
