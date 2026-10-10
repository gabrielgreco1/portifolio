"use client";
import {useEffect,useRef,useState} from 'react';
import {motion} from 'framer-motion';
import {useArcadeSession} from './useArcadeSession';
import ArcadePanels from './ArcadePanels';
import InvadersResult from './InvadersResult';
import InvadersWaveTransition from './InvadersWaveTransition';
import './invaders-refinement.css';
import ArcadeIntro from './ArcadeIntro';
import {resizeArcade} from '@/lib/arcade/protocol.mjs';
import {arcadeViewport,arcadePointerX} from '@/lib/arcade/viewport.mjs';
import {advanceInvaders,createInvaders,drawInvaders,pauseInvaders} from '@/lib/crawler/invaders.mjs';
const bestKey='tamagotchi-data-invaders-v3-best';
function readBest(){try{return Math.max(0,Number(localStorage.getItem(bestKey))||0);}catch{return 0;}}
function mergedInput(s){return{left:s.leftKey||s.leftTouch,right:s.rightKey||s.rightTouch,fire:s.fireKey||s.fireTouch||s.canvasFire,targetX:s.targetX};}

export default function InvadersGame({lang,reduced,sound,onSettings,suspended,viewportMode}){
  const session=useArcadeSession('invaders'),recording=session.recording,finish=session.finish,checkpoint=session.checkpoint;
  const pt=lang==='pt',canvas=useRef(null),display=useRef(null),state=useRef(null),picture=useRef(null),inputs=useRef({}),timers=useRef([]),bestRef=useRef(0);
  const restartLayout=useRef(false);
  const [,setBest]=useState(readBest),[ready,setReady]=useState(false),[hud,setHud]=useState({phase:'ready',score:0,waveScore:0,bestWave:1,totalScore:0,kills:0,wave:1,lives:3,lastClear:null,transition:false,blocked:false});
  useEffect(()=>{
    const surface=canvas.current,ctx=surface.getContext('2d');let raf,last=0,lastHud=0,lastSignature='',disposed=false,saved=false;
    bestRef.current=readBest();const image=new Image();image.onload=()=>{if(!disposed){picture.current=image;setReady(true);lastSignature='';}};image.src='/crawler-character-v2.png';
    const resize=()=>{
      const cssWidth=Math.round(surface.clientWidth),cssHeight=Math.round(surface.clientHeight),dpr=Math.min(2,window.devicePixelRatio||1);
      if(!cssWidth||!cssHeight)return;const view=arcadeViewport(cssWidth,cssHeight),{width,height,scale}=view;display.current=view;
      if(!width||!height)return;surface.width=cssWidth*dpr;surface.height=cssHeight*dpr;ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*view.x,dpr*view.y);
      if(!state.current)state.current=createInvaders(width,height);
      else{const s=state.current;resizeArcade('invaders',s,width,height);if(s.status==='running'&&!restartLayout.current)pauseInvaders(s);restartLayout.current=false;}
      inputs.current={};lastSignature='';
    };
    resize();const observer=new ResizeObserver(resize);observer.observe(surface);
    const frame=now=>{
      const s=state.current;if(s){
        const dt=last?Math.min(.05,(now-last)/1000):0,input=mergedInput(inputs.current);if(s.status==='running'&&recording.current){if(!recording.current.connectionFatal)recording.current.advance(dt,input);}else advanceInvaders(s,dt,input);
        if(recording.current?.checkpointDue)void checkpoint();
        sound?.observe('invaders',s);
        const signature=`${s.status}:${s.width}:${s.height}`;
        if(s.status==='running'||s.status==='over'&&s.overTime<1.5||signature!==lastSignature){drawInvaders(ctx,s,picture.current,{reduced,input,lang});lastSignature=signature;}
        if(now-lastHud>80){const phase=s.status==='over'&&s.overTime<.55?'crashed':s.status;const next={phase,score:s.score,waveScore:s.waveScore||0,bestWave:s.bestWave||1,totalScore:s.totalScore||0,kills:s.kills,wave:s.wave,lives:s.lives,lastClear:s.lastClear,transition:s.waveDelay!==null,blocked:!!recording.current?.checkpointBlocked};setHud(previous=>Object.keys(next).every(k=>next[k]===previous[k])?previous:next);lastHud=now;
          if(phase==='over'&&!saved){saved=true;if(s.score>bestRef.current){bestRef.current=s.score;setBest(s.score);try{localStorage.setItem(bestKey,String(s.score));}catch{}}}if(phase==='running')saved=false;
        }
      }last=now;raf=requestAnimationFrame(frame);
    };raf=requestAnimationFrame(frame);
    const pause=()=>{inputs.current={};if(state.current?.status==='running')pauseInvaders(state.current);};
    const activeTimers=timers.current;
    window.addEventListener('blur',pause);document.addEventListener('visibilitychange',pause);
    return()=>{disposed=true;sound?.silence();cancelAnimationFrame(raf);observer.disconnect();activeTimers.forEach(clearTimeout);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',pause);};
  },[reduced,recording,lang,sound,checkpoint]);
  useEffect(()=>{if(hud.phase==='over')finish();},[hud.phase,finish]);
  useEffect(()=>{inputs.current={};if(state.current?.status==='running')pauseInvaders(state.current);},[viewportMode]);
  useEffect(()=>{if(suspended){inputs.current={};if(state.current?.status==='running')pauseInvaders(state.current);}},[suspended]);
  async function start(){const previous=state.current;if(!previous||!ready)return;const run=await session.requestStart(previous.width,previous.height);if(!run)return;inputs.current={};if(display.current)run.resize(display.current.width,display.current.height);restartLayout.current=true;timers.current.push(setTimeout(()=>{restartLayout.current=false;},300));state.current=run.state;requestAnimationFrame(()=>requestAnimationFrame(()=>{const scroll=canvas.current?.closest('.arcade-scroll');if(scroll)scroll.scrollTop=0;canvas.current?.focus({preventScroll:true});}));}
  function pause(){inputs.current={};if(state.current)pauseInvaders(state.current);canvas.current?.focus({preventScroll:true});}
  function key(event,down){
    const control=event.target.closest('button')?.dataset.control;
    if(event.target.closest('button')&&[' ','Enter'].includes(event.key)&&!control)return;
    const action=event.key===' '&&control?control:{ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',' ':'fire',ArrowUp:'fire'}[event.key];
    if(action){event.preventDefault();if(down&&['ready','over'].includes(state.current?.status)){if(action==='fire')start();return;}inputs.current[`${action}Key`]=down;if(action!=='fire')inputs.current.targetX=null;}
    if(down&&!event.repeat&&['p','P'].includes(event.key)){event.preventDefault();pause();}
  }
  function accessibleTap(event){
    const control=event.currentTarget.dataset.control;
    if(event.detail!==0||state.current?.status!=='running')return;
    inputs.current[`${control}Touch`]=true;
    const timer=setTimeout(()=>{inputs.current[`${control}Touch`]=false;},150);
    timers.current.push(timer);
  }
  function touch(control){return{
    onPointerDown:event=>{event.preventDefault();if(state.current?.status!=='running')return;event.currentTarget.setPointerCapture(event.pointerId);inputs.current[`${control}Touch`]=true;if(control!=='fire')inputs.current.targetX=null;},
    onPointerUp:()=>{inputs.current[`${control}Touch`]=false;},onPointerCancel:()=>{inputs.current[`${control}Touch`]=false;},onLostPointerCapture:()=>{inputs.current[`${control}Touch`]=false;},
  };}
  function steer(event){const rect=event.currentTarget.getBoundingClientRect();inputs.current.targetX=arcadePointerX(event.clientX,rect,display.current);}
  const phase=hud.phase,playing=['running','crashed'].includes(phase);
  return <div className="invaders-game" data-phase={phase} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))inputs.current={};}} onKeyDown={e=>key(e,true)} onKeyUp={e=>key(e,false)}><ArcadePanels session={session} game="invaders" lang={lang}/><div className={phase==='over'?'arcade-playfield arcade-playfield--finished':'arcade-playfield'} inert={session.panel?true:undefined}>
    <div className="arcade-hud invaders-hud"><div><span>{pt?'HORDA':'WAVE'}</span><strong>{String(hud.wave).padStart(2,'0')}</strong></div><div className="invaders-wave-score"><span>{pt?'NESTA HORDA':'THIS WAVE'}</span><strong>{hud.waveScore.toLocaleString(pt?'pt-BR':'en-US')}</strong></div><div className="invaders-best-score"><span>{pt?'MELHOR HORDA':'BEST WAVE'}</span><strong>{hud.score.toLocaleString(pt?'pt-BR':'en-US')}</strong></div><div className="invaders-lives"><span>{pt?'VIDAS':'LIVES'}</span><strong className="invaders-health" aria-label={`${hud.lives}/3`}>{[1,2,3].map(n=><i key={n} className={hud.lives>=n?'alive':''}/>)}</strong></div><button onClick={pause} disabled={!['running','paused'].includes(phase)} aria-label={phase==='paused'?(pt?'Continuar jogo':'Resume game'):(pt?'Pausar jogo':'Pause game')}>{phase==='paused'?'▷':'Ⅱ'}</button></div>
    <div className={`runner-stage invaders-stage runner-stage--${phase}`}>
      <canvas ref={canvas} tabIndex="0" role="application" aria-label="Data Invaders" aria-describedby="invaders-instructions" data-wave={hud.wave} onPointerDown={event=>{if(phase!=='running')return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);inputs.current.canvasFire=true;steer(event);canvas.current.focus({preventScroll:true});}} onPointerMove={event=>{if(inputs.current.canvasFire)steer(event);}} onPointerUp={()=>{inputs.current.canvasFire=false;inputs.current.targetX=null;}} onPointerCancel={()=>{inputs.current.canvasFire=false;inputs.current.targetX=null;}} onLostPointerCapture={()=>{inputs.current.canvasFire=false;inputs.current.targetX=null;}}/>
      {phase==='ready'&&<ArcadeIntro game="invaders" pt={pt} onStart={start} onRanking={session.showRanking} ready={ready} reduced={reduced} onSettings={onSettings}/>}
      {phase==='paused'&&<motion.div className="runner-overlay invaders-pause" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:reduced?0:.16}}>
        <h3>{pt?'Respira.':'Take a breath.'}</h3><p>{pt?`Horda ${hud.wave}. A defesa espera por você.`:`Wave ${hud.wave}. Your defense can wait.`}</p>
        <button className="arcade-primary" data-modal-autofocus onClick={pause}>{pt?'Continuar':'Continue'} <span>→</span></button>
        <small>{pt?'← → mover · espaço atirar · P retomar':'← → move · space fire · P resume'}</small>
      </motion.div>}
      {phase==='running'&&hud.transition&&hud.lastClear&&<InvadersWaveTransition key={hud.lastClear.wave} lastClear={hud.lastClear} nextWave={hud.wave+1} pt={pt} reduced={reduced}/>}
      {(hud.blocked||session.connectionError?.fatal)&&phase==='running'&&<div className="invaders-connection" role="status"><strong>{session.connectionError?.fatal?(pt?'Partida desconectada.':'Run disconnected.'):(pt?'Segura a posição.':'Hold your position.')}</strong><p>{session.connectionError?.fatal?(pt?'Não foi possível validar esta partida. A pontuação não entrou no ranking.':'This run could not be verified. The score was not added to the leaderboard.'):(pt?'A conexão caiu. Sua partida está guardada aqui.':'Connection lost. Your run is held here.')}</p><button className="arcade-primary" onClick={session.connectionError?.fatal?start:()=>checkpoint()}>{session.connectionError?.fatal?(pt?'Nova partida':'New run'):(pt?'Reconectar':'Reconnect')}</button></div>}
      {phase==='crashed'&&<span className="runner-hit-label" role="status">{pt?'SINAL PERDIDO':'SIGNAL LOST'}</span>}
    </div>
    {phase==='over'&&<InvadersResult session={session} hud={hud} pt={pt} onRestart={start} reduced={reduced}/>}
    <p id="invaders-instructions" hidden>{pt?'Setas para mover. Espaço para atirar. P para pausar.':'Arrow keys to move. Space to fire. P to pause.'}</p>
    <div className="invaders-bottom"><div className="invaders-touch"><button data-control="left" {...touch('left')} onClick={accessibleTap} disabled={!playing} aria-label={pt?'Mover para esquerda':'Move left'}>←</button><button data-control="fire" {...touch('fire')} onClick={accessibleTap} disabled={!playing}>{pt?'Atirar':'Fire'} <span>↑</span></button><button data-control="right" {...touch('right')} onClick={accessibleTap} disabled={!playing} aria-label={pt?'Mover para direita':'Move right'}>→</button></div></div>
    <p className="sr-only" role="status">{phase==='over'?`${pt?'Fim de jogo':'Game over'}. ${hud.score} ${pt?'pontos':'points'}.`:phase==='paused'?(pt?'Jogo pausado':'Game paused'):''}</p>
  </div></div>;
}
