// Original arcade props. Geometry is drawn at gameplay scale, so the silhouette
// and material hierarchy survive phone rendering without image downloads.
export const ENEMY_TYPES={
 waf:{label:'WAF',color:'#c6d9c4',width:40,height:32,hp:2,points:40},
 fingerprint:{label:'FP',color:'#b8b4f1',width:34,height:32,hp:1,points:30},
 rate:{label:'429',color:'#efa18b',width:42,height:30,hp:2,points:50},
 honey:{label:'TRAP',color:'#edc97d',width:32,height:34,hp:1,points:60},
 guardian:{label:'403',color:'#dda27c',width:112,height:65,hp:20,points:400},
};
const polygon=(c,points)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();};
function metal(c,x,y,w,h,light,dark,r=3){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,light);g.addColorStop(.42,dark);g.addColorStop(1,'#142a2c');c.fillStyle=g;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.strokeStyle=light;c.lineWidth=.7;c.stroke();}
function lens(c,x,y,r,color){const g=c.createRadialGradient(x-r*.25,y-r*.3,0,x,y,r);g.addColorStop(0,'#f1ffed');g.addColorStop(.22,color);g.addColorStop(.7,'#324951');g.addColorStop(1,'#081619');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle=color;c.lineWidth=.7;c.stroke();}
function hex(c,x,y,r){polygon(c,Array.from({length:6},(_,i)=>[x+Math.cos(i*Math.PI/3)*r,y+Math.sin(i*Math.PI/3)*r]));}
function bolt(c,x,y){c.fillStyle='#bdc5ab';c.fillRect(x-.8,y-.8,1.6,1.6);}
export function drawAntiBot(c,e,time=0,{reduced=false}={}){
 const spec=ENEMY_TYPES[e.kind]||ENEMY_TYPES.waf,charge=e.charge?Math.max(0,1-e.charge.remaining/e.charge.duration):0;
 c.save();c.translate(e.x,e.y);c.globalAlpha=1;
 c.shadowColor=spec.color;c.shadowBlur=charge?6+charge*12:0;
 c.fillStyle='#020d12aa';c.beginPath();c.ellipse(2,e.kind==='guardian'?38:21,e.width*.55,4,0,0,Math.PI*2);c.fill();c.shadowBlur=0;
 if(e.kind==='waf'){
  metal(c,-20,-13,40,28,'#bfccc2','#526a65',4);
  polygon(c,[[-15,-17],[13,-17],[20,-12],[-20,-12]]);c.fillStyle='#a6b9ad';c.fill();
  c.fillStyle='#172d30';c.fillRect(-15,-8,30,17);
  c.strokeStyle='#61786c';c.lineWidth=1;for(let row=0;row<3;row++){c.beginPath();c.moveTo(-14,-7+row*6);c.lineTo(14,-7+row*6);c.stroke();for(let col=0;col<3;col++){const x=-13+col*11+(row%2)*5;c.beginPath();c.moveTo(x,-7+row*6);c.lineTo(x,-1+row*6);c.stroke();}}
  polygon(c,[[0,-8],[8,-5],[6,4],[0,9],[-6,4],[-8,-5]]);c.fillStyle=e.hp>1?'#d8e5c8':'#354d42';c.fill();c.strokeStyle='#ebf4d4';c.stroke();
  c.fillStyle='#253a35';c.fillRect(-1,-3,2,7);c.fillRect(-3,-1,6,2);
  c.fillStyle=e.hp>1?'#d8e5c8':'#668375';c.fillRect(-9,12,7,2);c.fillRect(2,12,7,2);bolt(c,-17,-10);bolt(c,17,-10);
 }else if(e.kind==='fingerprint'){
  c.strokeStyle='#7e82a7';c.lineWidth=2;c.beginPath();c.ellipse(0,0,20,10,-.3,0,Math.PI*2);c.stroke();
  metal(c,-13,-15,26,30,'#b9bdd3','#48556f',10);lens(c,0,-1,10,'#bcb4ee');
  c.strokeStyle='#d6c8ff';c.lineWidth=.7;
  for(let i=0;i<4;i++){c.beginPath();c.ellipse(0,0,3+i*1.7,5+i*1.1,.2,.1+i*.13,Math.PI*1.65);c.stroke();}
  c.fillStyle='#d6c8ff';c.fillRect(-1,-20,2,5);c.beginPath();c.arc(0,-21,1.7,0,Math.PI*2);c.fill();
  if(!reduced){c.strokeStyle='#c1b3ff99';c.lineWidth=1;c.beginPath();c.arc(0,-1,15,time*1.5,time*1.5+1.4);c.stroke();}
 }else if(e.kind==='rate'){
  metal(c,-20,-10,40,22,'#cb9c8b','#6b4946',4);
  for(let i=0;i<3;i++){const x=-13+i*13;metal(c,x-5,-15,10,27,'#e2b098','#7d4d47',3);lens(c,x,10,3.2,'#efa18b');c.strokeStyle='#e7ba9b';c.beginPath();c.moveTo(x-3,-11);c.lineTo(x+3,-11);c.stroke();}
  c.fillStyle='#16292a';c.fillRect(-11,-5,22,10);c.font='bold 8px ui-monospace,monospace';c.textAlign='center';c.fillStyle='#f8c6a5';c.fillText('429',0,3);
  c.fillStyle='#efb892';c.fillRect(-23,-4,3,10);c.fillRect(20,-4,3,10);
 }else if(e.kind==='honey'){
  c.strokeStyle='#c89d61';c.lineWidth=1.7;c.beginPath();c.moveTo(-6,-12);c.lineTo(-14,-18);c.moveTo(6,-12);c.lineTo(14,-18);c.stroke();
  metal(c,-8,-17,16,7,'#d7b987','#725d47',2);
  polygon(c,[[-10,-10],[10,-10],[15,1],[11,15],[-11,15],[-15,1]]);const amber=c.createLinearGradient(-14,-10,14,16);amber.addColorStop(0,'#d4b67e');amber.addColorStop(.5,'#624a32');amber.addColorStop(1,'#bd823d');c.fillStyle=amber;c.fill();c.strokeStyle='#f0d08c';c.lineWidth=1;c.stroke();
  c.fillStyle='#e7aa4666';c.beginPath();c.ellipse(0,6,10,6,0,0,Math.PI*2);c.fill();
  hex(c,0,1,7);c.fillStyle='#172d2c';c.fill();c.strokeStyle='#f7d58a';c.stroke();
  c.fillStyle='#f8d995';c.font='bold 9px ui-monospace,monospace';c.textAlign='center';c.fillText('?',0,4);
  c.strokeStyle='#fff1b877';c.beginPath();c.moveTo(-10,-5);c.lineTo(-11,7);c.stroke();
 }else{
  for(const side of [-1,1]){c.save();c.scale(side,1);metal(c,29,-18,25,40,'#b59783','#554e49',6);c.fillStyle='#101e24';for(let i=0;i<4;i++)c.fillRect(34,-10+i*7,16,3);lens(c,40,25,5,'#f0ad7d');c.restore();}
  hex(c,0,0,36);const armor=c.createLinearGradient(-35,-35,35,35);armor.addColorStop(0,'#d9b896');armor.addColorStop(.4,'#665653');armor.addColorStop(1,'#253742');c.fillStyle=armor;c.fill();c.strokeStyle='#e6c399';c.lineWidth=1.5;c.stroke();
  c.save();if(!reduced)c.rotate(time*.22);for(let i=0;i<6;i++){c.save();c.rotate(i*Math.PI/3);polygon(c,[[10,-8],[28,-14],[30,8],[16,13]]);c.fillStyle=i%2?'#a28575':'#6c6865';c.fill();c.strokeStyle='#d1b294';c.lineWidth=.6;c.stroke();c.restore();}c.restore();
  lens(c,0,0,14,charge?'#f6b988':'#b7dace');c.fillStyle='#122b2d';c.fillRect(-7,-3,14,6);c.fillStyle='#e6f9c8';c.fillRect(-5,-1,10,2);
 }
 if(charge){c.strokeStyle=spec.color;c.lineWidth=1.5;c.beginPath();c.arc(0,0,e.kind==='guardian'?42:25,-Math.PI/2,-Math.PI/2+Math.PI*2*charge);c.stroke();}
 if(e.hitFlash>0){c.globalAlpha=Math.min(.6,e.hitFlash*4);c.fillStyle='#fff9da';c.beginPath();c.ellipse(0,0,e.width*.45,e.height*.42,0,0,Math.PI*2);c.fill();}
 c.restore();
}
