import {createRunner,startRunner,advanceRunner,jumpRunner,duckRunner} from '../crawler/runner.mjs';
import {createInvaders,startInvaders,advanceInvaders} from '../crawler/invaders.mjs';
import {createInvaders as createLegacyInvaders,startInvaders as startLegacyInvaders,advanceInvaders as advanceLegacyInvaders} from '../crawler/invaders-v2.mjs';
export const GAME_VERSIONS={runner:'runner-3',invaders:'invaders-3'};
export const CHECKPOINT_TICKS=60*30,MAX_SEGMENT_TICKS=60*120;
export const endlessRun=run=>run.game==='invaders'&&run.version==='invaders-3';
export const TICK_RATE=60,MAX_TICKS=60*60*10,MAX_EVENTS=MAX_TICKS;
export const validGame=game=>Object.hasOwn(GAME_VERSIONS,game);
export function validSize(width,height){return Number.isInteger(width)&&Number.isInteger(height)&&width>=280&&width<=1500&&height>=320&&height<=430;}
export function createArcadeEngine(run){
 const legacy=run.game==='invaders'&&run.version==='invaders-2';
 const s=run.game==='runner'?createRunner(run.width,run.height,run.seed,run.pace??1):(legacy?createLegacyInvaders:createInvaders)(run.width,run.height,run.seed);
 s.arcadeVersion=run.version;(run.game==='runner'?startRunner:legacy?startLegacyInvaders:startInvaders)(s);return s;
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
 else (s.arcadeVersion==='invaders-2'?advanceLegacyInvaders:advanceInvaders)(s,1/TICK_RATE,{left:!!(mask&1),right:!!(mask&2),fire:!!(mask&4),targetX:target});
}
export function normalizeInput(game,input){
 if(game==='runner')return [Number(!!input.jump)|(Number(!!input.duck)<<1),null];
 return [Number(!!input.left)|(Number(!!input.right)<<1)|(Number(!!input.fire)<<2),Number.isFinite(input.targetX)?Math.round(input.targetX):null];
}
export class ArcadeRecording{
 constructor(run){this.run=run;this.state=createArcadeEngine(run);this.tick=0;this.events=[];this.mask=0;this.target=null;this.width=run.width;this.height=run.height;this.accumulator=0;this.sequence=0;this.totalTicks=0;this.pendingCheckpoint=null;this.checkpointWave=0;}
 advance(delta,input={}){
  if(this.state.status!=='running'||this.checkpointBlocked)return;
  this.accumulator+=Math.min(.05,Math.max(0,delta));let pulse=!!input.jump;
  while(this.accumulator>=1/TICK_RATE&&this.state.status==='running'&&!this.checkpointBlocked){
   const safeDuck=this.run.game==='runner'&&this.state.duckGrace&&this.state.obstacles.some(o=>o.kind==='scanner'&&o.x+o.width>this.state.playerX-22&&o.x<this.state.playerX+50);
   const [mask,rawTarget]=normalizeInput(this.run.game,{...input,jump:pulse,duck:input.duck||safeDuck});pulse=false;const target=rawTarget===null?null:Math.max(0,Math.min(this.state.width,rawTarget));
   if(mask!==this.mask||target!==this.target||this.width!==this.state.width||this.height!==this.state.height){
    this.events.push([this.tick,mask,target,this.state.width,this.state.height]);this.width=this.state.width;this.height=this.state.height;
   }
   stepArcade(this.run.game,this.state,mask,target,this.mask);this.mask=mask;this.target=target;this.tick++;this.accumulator-=1/TICK_RATE;
   if(!endlessRun(this.run)&&this.tick>=MAX_TICKS){this.state.status='over';this.state.overTime=0;this.state.timedOut=true;}
  }
  return pulse; // Keep a jump queued if a high-refresh frame did not step yet.
 }
 resize(width,height){resizeArcade(this.run.game,this.state,width,height);}
 get checkpointDue(){return endlessRun(this.run)&&!this.pendingCheckpoint&&this.state.status==='running'&&(this.tick>=CHECKPOINT_TICKS||(this.state.lastClear?.wave||0)>this.checkpointWave);}
 get checkpointBlocked(){return endlessRun(this.run)&&this.tick>=MAX_SEGMENT_TICKS;}
 captureCheckpoint(){
  if(this.pendingCheckpoint)return this.pendingCheckpoint.proof;
  if(!endlessRun(this.run)||this.tick<1||this.state.status!=='running')throw new Error('Invalid checkpoint');
  const proof={...this.proof(),events:this.events.map(event=>[...event])};this.pendingCheckpoint={proof,cut:this.tick,wave:this.state.lastClear?.wave||0};return proof;
 }
 acceptCheckpoint(response){
  const pending=this.pendingCheckpoint;if(!pending){if(response.sequence===this.sequence)return false;throw new Error('Unexpected checkpoint');}
  if(response.sequence!==this.sequence+1||response.totalTicks!==this.totalTicks+pending.cut)throw new Error('Checkpoint sequence mismatch');
  this.events=this.events.filter(event=>event[0]>=pending.cut).map(event=>[event[0]-pending.cut,...event.slice(1)]);this.tick-=pending.cut;this.totalTicks+=pending.cut;this.sequence=response.sequence;if(response.expiresAt)this.run.expiresAt=response.expiresAt;this.checkpointWave=pending.wave;this.pendingCheckpoint=null;return true;
 }
 proof(){return{ticks:this.tick,events:this.events,score:this.state.score,...(endlessRun(this.run)?{sequence:this.sequence}:{})};}
}
export function replaySegment(run,proof,{checkpoint=false}={}){
 if(!validGame(run.game)||!(run.version===GAME_VERSIONS[run.game]||run.game==='invaders'&&run.version==='invaders-2')||!validSize(run.width,run.height))throw new Error('Invalid run');
 const endless=endlessRun(run);if(checkpoint&&!endless)throw new Error('Invalid checkpoint');
 if(endless&&proof?.sequence!==(run.sequence||0))throw new Error('Checkpoint sequence mismatch');
 if(!proof||!Number.isInteger(proof.ticks)||proof.ticks<1||proof.ticks>(endless?MAX_SEGMENT_TICKS:MAX_TICKS)||!Number.isSafeInteger(proof.score)||proof.score<0||!Array.isArray(proof.events)||proof.events.length>(endless?MAX_SEGMENT_TICKS:MAX_EVENTS))throw new Error('Invalid recording');
 let prior=-1;
 for(const event of proof.events){
  if(!Array.isArray(event)||event.length!==5)throw new Error('Invalid input');
  const [tick,mask,target,width,height]=event;
  if(!Number.isInteger(tick)||tick<=prior||tick<0||tick>=proof.ticks||!Number.isInteger(mask)||mask<0||mask>(run.game==='runner'?3:7)||!validSize(width,height)||!(target===null||run.game==='invaders'&&Number.isInteger(target)&&target>=0&&target<=width))throw new Error('Invalid input');
  prior=tick;
 }
 const saved=endless&&run.checkpointJson?JSON.parse(run.checkpointJson):null,s=saved?.state||createArcadeEngine(run);let index=0,mask=saved?.mask||0,target=saved?.target??null,previous=mask;
 for(let tick=0;tick<proof.ticks;tick++){
  if(s.status!=='running')throw new Error('Recording continues after game over');
  const event=proof.events[index];if(event&&event[0]===tick){[,mask,target]=event;if(event[3]!==s.width||event[4]!==s.height)resizeArcade(run.game,s,event[3],event[4]);index++;}
  stepArcade(run.game,s,mask,target,previous);previous=mask;
 }
 if(checkpoint?s.status!=='running':s.status!=='over'&&(endless||proof.ticks!==MAX_TICKS))throw new Error(checkpoint?'Checkpoint after game over':'Game has not ended');
 if(s.score!==proof.score)throw new Error('Score does not match the recording');
 const totalTicks=(saved?.totalTicks||0)+proof.ticks;
 const result={score:s.score,ticks:totalTicks,seconds:Math.round(totalTicks/TICK_RATE),...(run.game==='runner'?{dodged:s.cleared}:{wave:s.wave,...(endless?{bestWave:s.bestWave,bestWaveScore:s.bestWaveScore,totalScore:s.totalScore}:{})})};
 return {result,snapshot:{state:s,mask,target,totalTicks}};
}

export function replayArcade(run,proof){return replaySegment(run,proof).result;}
