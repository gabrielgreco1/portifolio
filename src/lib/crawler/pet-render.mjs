// Deform the approved texture, keeping four original feet planted. The housing
// moves rigidly; only the leg strips flex between their joints and their toes.
export function drawPetTension(ctx,image,strain,step,grip){
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
