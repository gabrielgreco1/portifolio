import {createRunner,startRunner,advanceRunner,jumpRunner,duckRunner} from '../crawler/runner.mjs';
import {createInvaders,startInvaders,advanceInvaders} from '../crawler/invaders.mjs';
export const GAME_VERSIONS={runner:'runner-3',invaders:'invaders-2'};
export const TICK_RATE=60,MAX_TICKS=60*60*10,MAX_EVENTS=MAX_TICKS;
export const validGame=game=>Object.hasOwn(GAME_VERSIONS,game);
export function validSize(width,height){return Number.isInteger(width)&&Number.isInteger(height)&&width>=280&&width<=1500&&height>=320&&height<=430;}
export function createArcadeEngine(run){
 const s=run.game==='runner'?createRunner(run.width,run.height,run.seed):createInvaders(run.width,run.height,run.seed);
 (run.game==='runner'?startRunner:startInvaders)(s);return s;
}
export function resizeArcade(game,s,width,height){
 if(game==='runner'){
  const ground=height-65,playerX=width<500?66:108,dx=playerX-s.playerX,dy=ground-s.ground;
  s.ground=ground;s.playerX=playerX;for(const o of s.obstacles)o.x+=dx;for(const t of [...s.tokens,...s.particles]){t.x+=dx;t.y+=dy;}
 }else{
  const rx=width/s.width,ry=height/s.height;s.playerX*=rx;for(const item of [...s.enemies,...s.shots,...s.threats]){item.x*=rx;item.y*=ry;if(item.charge)item.charge.targetX*=rx;if(item.splitY!==undefined)item.splitY*=ry;}s.playerY=height-24;
 }
 s.width=width;s.height=height;
}
// One fixed step on both client and server. A runner jump is an edge, duck is
// held; Invaders uses held direction/fire plus an optional integer touch target.
export function stepArcade(game,s,mask,target=null,previousMask=0){
 if(game==='runner'){s.duckGrace=false;duckRunner(s,!!(mask&2));if(mask&1&&!(previousMask&1))jumpRunner(s);advanceRunner(s,1/TICK_RATE);}
 else advanceInvaders(s,1/TICK_RATE,{left:!!(mask&1),right:!!(mask&2),fire:!!(mask&4),targetX:target});
}
export function normalizeInput(game,input){
 if(game==='runner')return [Number(!!input.jump)|(Number(!!input.duck)<<1),null];
 return [Number(!!input.left)|(Number(!!input.right)<<1)|(Number(!!input.fire)<<2),Number.isFinite(input.targetX)?Math.round(input.targetX):null];
}
export class ArcadeRecording{
 constructor(run){this.run=run;this.state=createArcadeEngine(run);this.tick=0;this.events=[];this.mask=0;this.target=null;this.width=run.width;this.height=run.height;this.accumulator=0;}
 advance(delta,input={}){
  if(this.state.status!=='running')return;
  this.accumulator+=Math.min(.05,Math.max(0,delta));let pulse=!!input.jump;
  while(this.accumulator>=1/TICK_RATE&&this.state.status==='running'){
   const safeDuck=this.run.game==='runner'&&this.state.duckGrace&&this.state.obstacles.some(o=>o.kind==='scanner'&&o.x+o.width>this.state.playerX-22&&o.x<this.state.playerX+50);
   const [mask,rawTarget]=normalizeInput(this.run.game,{...input,jump:pulse,duck:input.duck||safeDuck});pulse=false;const target=rawTarget===null?null:Math.max(0,Math.min(this.state.width,rawTarget));
   if(mask!==this.mask||target!==this.target||this.width!==this.state.width||this.height!==this.state.height){
    this.events.push([this.tick,mask,target,this.state.width,this.state.height]);this.width=this.state.width;this.height=this.state.height;
   }
   stepArcade(this.run.game,this.state,mask,target,this.mask);this.mask=mask;this.target=target;this.tick++;this.accumulator-=1/TICK_RATE;
   if(this.tick>=MAX_TICKS){this.state.status='over';this.state.overTime=0;this.state.timedOut=true;}
  }
  return pulse; // Keep a jump queued if a high-refresh frame did not step yet.
 }
 resize(width,height){resizeArcade(this.run.game,this.state,width,height);}
 proof(){return{ticks:this.tick,events:this.events,score:this.state.score};}
}
export function replayArcade(run,proof){
 if(!validGame(run.game)||run.version!==GAME_VERSIONS[run.game]||!validSize(run.width,run.height))throw new Error('Invalid run');
 if(!proof||!Number.isInteger(proof.ticks)||proof.ticks<1||proof.ticks>MAX_TICKS||!Number.isSafeInteger(proof.score)||proof.score<0||!Array.isArray(proof.events)||proof.events.length>MAX_EVENTS)throw new Error('Invalid recording');
 let prior=-1;
 for(const event of proof.events){
  if(!Array.isArray(event)||event.length!==5)throw new Error('Invalid input');
  const [tick,mask,target,width,height]=event;
  if(!Number.isInteger(tick)||tick<=prior||tick<0||tick>=proof.ticks||!Number.isInteger(mask)||mask<0||mask>(run.game==='runner'?3:7)||!validSize(width,height)||!(target===null||run.game==='invaders'&&Number.isInteger(target)&&target>=0&&target<=width))throw new Error('Invalid input');
  prior=tick;
 }
 const s=createArcadeEngine(run);let index=0,mask=0,target=null,previous=0;
 for(let tick=0;tick<proof.ticks;tick++){
  if(s.status!=='running')throw new Error('Recording continues after game over');
  const event=proof.events[index];if(event&&event[0]===tick){[,mask,target]=event;if(event[3]!==s.width||event[4]!==s.height)resizeArcade(run.game,s,event[3],event[4]);index++;}
  stepArcade(run.game,s,mask,target,previous);previous=mask;
 }
 if(s.status!=='over'&&proof.ticks!==MAX_TICKS)throw new Error('Game has not ended');
 if(s.score!==proof.score)throw new Error('Score does not match the recording');
 return {score:s.score,ticks:proof.ticks,seconds:Math.round(proof.ticks/TICK_RATE),...(run.game==='runner'?{dodged:s.cleared}:{wave:s.wave})};
}
