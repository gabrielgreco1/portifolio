// Short, original synthesized cues. No autoplay, downloads, looping music or
// timers: every voice is scheduled against an actual game-state transition.
export const ARCADE_CUES={
 start:[[330,440,.13,0,.17,'sine'],[660,880,.16,.09,.1,'triangle']],
 jump:[[190,540,.14,0,.13,'triangle']],
 land:[[100,48,.075,0,.12,'sine']],
 duck:[[160,80,.09,0,.07,'triangle']],
 dodge:[[500,820,.08,0,.055,'sine']],
 collect:[[660,660,.12,0,.12,'sine'],[990,990,.18,.075,.09,'sine']],
 shot:[[820,240,.065,0,.065,'triangle']],
 hit:[[290,140,.085,0,.09,'triangle']],
 destroy:[[430,170,.12,0,.1,'triangle'],[870,450,.09,.025,.055,'sine']],
 lock:[[220,250,.17,0,.055,'sine']],
 damage:[[105,48,.22,0,.24,'triangle'],[73,38,.24,.04,.12,'sine']],
 wave:[[392,392,.15,0,.1,'sine'],[494,494,.15,.1,.09,'sine'],[587,587,.25,.2,.1,'triangle']],
 over:[[294,250,.16,0,.16,'triangle'],[220,180,.2,.13,.14,'triangle'],[147,65,.35,.3,.16,'sine']],
 toggle:[[660,740,.09,0,.08,'sine']],
};
export function scheduleArcadeCue(context,destination,name,when=context.currentTime,register=()=>{}){
 const voices=[];
 for(const [from,to,duration,delay,volume,type] of ARCADE_CUES[name]||[]){
  const oscillator=context.createOscillator(),gain=context.createGain(),start=when+delay;
  oscillator.type=type;oscillator.frequency.setValueAtTime(from,start);oscillator.frequency.exponentialRampToValueAtTime(to,start+duration);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.006);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(gain);gain.connect(destination);
  const voice={oscillator,gain};voices.push(voice);register(voice);
  oscillator.start(start);oscillator.stop(start+duration+.015);
 }
 return voices;
}
export class ArcadeSound{
 constructor(){this.context=null;this.master=null;this.voices=new Set();this.muted=false;this.previous=null;this.game=null;this.state=null;this.active=false;this.lastCue=new Map();}
 async unlock(){
  if(this.muted)return true;
  try{
   if(!this.context){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;this.context=new Context();this.master=this.context.createGain();this.master.gain.value=.55;this.master.connect(this.context.destination);}
   const context=this.context;if(context.state==='suspended')await context.resume();if(context!==this.context)return true;this.active=true;return context.state==='running';
  }catch{return false;}
 }
 setMuted(muted){this.muted=muted;if(muted){this.silence();this.context?.suspend().catch(()=>{});}}
 play(name){
  if(this.muted||!this.active||this.context?.state!=='running')return;
  const now=this.context.currentTime;if(now-(this.lastCue.get(name)??-Infinity)<.045)return;this.lastCue.set(name,now);
  scheduleArcadeCue(this.context,this.master,name,now,voice=>{this.voices.add(voice);voice.oscillator.onended=()=>{voice.oscillator.disconnect();voice.gain.disconnect();this.voices.delete(voice);};});
 }
 silence(){for(const voice of this.voices){try{voice.oscillator.stop();}catch{}voice.oscillator.disconnect();voice.gain.disconnect();}this.voices.clear();this.lastCue.clear();}
 observe(game,s){
  const next={status:s.status,time:s.time,y:s.y,duck:s.duckHeld,packets:s.packets,cleared:s.cleared,shot:s.shootCooldown,kills:s.kills,lives:s.lives,wave:s.wave,attack:s.attackSerial,hp:s.enemies?.reduce((total,e)=>total+(e.alive?e.hp:0),0)};
  const p=this.state===s&&this.game===game?this.previous:null;this.previous=next;this.state=s;this.game=game;
  if(next.status==='paused'&&p?.status!=='paused'){this.silence();return;}
  if(next.status==='over'){if(p?.status==='running'){this.silence();this.play('over');}return;}
  if(next.status!=='running')return;
  if(!p||p.status==='ready'){this.play('start');return;}
  if(p.status!=='running')return;
  if(game==='runner'){
   if(p.y>=-.5&&next.y<-.5)this.play('jump');
   if(p.y<-.5&&next.y>=-.5)this.play('land');
   if(!p.duck&&next.duck)this.play('duck');
   if(next.packets>p.packets)this.play('collect');else if(next.cleared>p.cleared)this.play('dodge');
  }else{
   if(next.shot>p.shot+.07)this.play('shot');
   if(next.lives<p.lives)this.play('damage');
   if(next.wave>p.wave)this.play('wave');
   else if(next.kills>p.kills)this.play('destroy');else if(next.hp<p.hp)this.play('hit');
   if(next.attack>p.attack)this.play('lock');
  }
 }
 close(){this.active=false;this.silence();this.previous=null;this.state=null;const context=this.context;this.context=null;this.master=null;if(context&&context.state!=='closed')context.close().catch(()=>{});}
}
