// Each silhouette teaches a different move: grounded barriers are jumped,
// the tall hovering fingerprint scanner leaves a crawl-height corridor.
export const RUNNER_HAZARDS={
 wall:{width:40,height:48,bottom:0,code:'403',label:'FIREWALL',action:'jump'},
 scanner:{width:76,height:106,bottom:46,code:'FP',label:'FINGERPRINT',action:'duck'},
 honeypot:{width:58,height:38,bottom:0,code:'TRAP',label:'HONEYPOT',action:'jump'},
 rate:{width:66,height:32,bottom:0,code:'429',label:'RATE LIMIT',action:'jump'},
};
export function runnerHazard(kind,x,id){return {...RUNNER_HAZARDS[kind],kind,x,id,cleared:false};}
function polygon(ctx,points,fill){ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
export function drawRunnerHazard(ctx,o,ground,time,reduced){
 const {x,width:w,height:h,kind}=o,y=ground-(o.bottom||0)-h;
 ctx.save();ctx.translate(x,y);ctx.lineWidth=1;
 if(kind==='scanner'){
  // A suspended lens with a full-height scanning curtain. Its lit lower rail
  // visibly marks the exact clearance; the empty space underneath is safe.
  const sweep=reduced?.5:(Math.sin(time*3)+1)/2;
  const beam=ctx.createLinearGradient(0,0,0,h);beam.addColorStop(0,'#75c9d208');beam.addColorStop(.6,'#7ecece18');beam.addColorStop(1,'#8ce5dc48');
  ctx.fillStyle=beam;ctx.fillRect(6,20,w-12,h-20);
  ctx.strokeStyle='#8ce5dc40';ctx.strokeRect(6.5,23.5,w-13,h-24);
  ctx.fillStyle='#a2e5d866';ctx.fillRect(7,25+sweep*(h-30),w-14,2);
  polygon(ctx,[[0,12],[10,0],[w-10,0],[w,12],[w-5,33],[5,33]],'#243e40');
  polygon(ctx,[[0,12],[10,0],[w-10,0],[w,12]],'#7caaa6');
  ctx.strokeStyle='#b3dcd1';ctx.strokeRect(10.5,12.5,w-21,17);
  ctx.fillStyle='#0a2228';ctx.fillRect(12,14,w-24,13);
  ctx.fillStyle='#a1eed9';ctx.beginPath();ctx.ellipse(w/2,20,8,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#163638';ctx.fillRect(w/2-2,16,4,8);
  for(const side of [4,w-10]){ctx.fillStyle='#c9e0be';ctx.fillRect(side,34,6,h-34);ctx.fillStyle='#507878';ctx.fillRect(side+2,39,2,h-45);}
  ctx.fillStyle='#a3ece0';ctx.fillRect(4,h-3,w-8,3);
  ctx.fillStyle='#b3ddd080';ctx.font='bold 10px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('↓',w/2,h+23);
 }else if(kind==='honeypot'){
  // A tempting data vessel enclosed in a barbed trap, never a collectible.
  polygon(ctx,[[-3,h],[5,h-10],[w-5,h-10],[w+3,h]],'#5a4530');
  const jar=ctx.createLinearGradient(6,0,w-6,h);jar.addColorStop(0,'#e6bd73');jar.addColorStop(.45,'#947038');jar.addColorStop(1,'#533a27');ctx.fillStyle=jar;
  ctx.beginPath();ctx.roundRect(9,8,w-18,h-9,7);ctx.fill();
  ctx.fillStyle='#e4c58a';ctx.fillRect(13,3,w-26,7);ctx.fillStyle='#765735';ctx.fillRect(17,0,w-34,4);
  ctx.strokeStyle='#f0d0a0';ctx.strokeRect(17.5,16.5,w-35,13);ctx.fillStyle='#f1d6a6';ctx.font='bold 10px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('{}',w/2,27);
  for(const side of [0,w-6]){polygon(ctx,[[side,h],[side,h-19],[side+6,h-10],[side+6,h]],'#d48972');}
 }else if(kind==='rate'){
  // A backed-up request queue: separate server modules and a timeout clock.
  for(let i=0;i<3;i++){const top=i===1?0:6,left=i*22;ctx.fillStyle=i===1?'#7b8162':'#485d49';ctx.fillRect(left,top,20,h-top);ctx.fillStyle='#b6bc8a';ctx.fillRect(left,top,20,3);ctx.strokeStyle='#94a477';ctx.strokeRect(left+.5,top+.5,19,h-top-1);for(let j=0;j<3;j++){ctx.fillStyle='#24362b';ctx.fillRect(left+4,top+8+j*5,12,2);}}
  ctx.fillStyle='#283c31';ctx.beginPath();ctx.arc(w/2,14,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e0dca3';ctx.stroke();ctx.beginPath();ctx.moveTo(w/2,7);ctx.lineTo(w/2,14);ctx.lineTo(w/2+5,17);ctx.stroke();
 }else{
  polygon(ctx,[[0,0],[7,-7],[w+7,-7],[w,0]],'#cf9275');polygon(ctx,[[w,0],[w+7,-7],[w+7,h-7],[w,h]],'#593e36');
  const face=ctx.createLinearGradient(0,0,w,h);face.addColorStop(0,'#986650');face.addColorStop(1,'#4a302d');ctx.fillStyle=face;ctx.fillRect(0,0,w,h);ctx.strokeStyle='#daa07d';ctx.strokeRect(.5,.5,w-1,h-1);
  polygon(ctx,[[w/2,7],[w-7,12],[w-9,27],[w/2,35],[9,27],[7,12]],'#302a28');ctx.strokeStyle='#d8aa87';ctx.beginPath();ctx.moveTo(w/2,11);ctx.lineTo(w/2,25);ctx.stroke();ctx.fillStyle='#e8ae87';ctx.fillRect(w/2-1,28,2,2);
  for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#e4b188':'#4a3830';ctx.fillRect(3+i*9,h-6,8,4);}
 }
 // Labels are part of the warning apparatus, anchored to the actual hazard.
 ctx.textAlign='center';ctx.font='bold 8px ui-monospace,monospace';ctx.fillStyle=kind==='scanner'?'#b9e4db':'#e0c0a2';ctx.fillText(o.label||RUNNER_HAZARDS[kind]?.label||'',w/2,-14);
 ctx.restore();
}
