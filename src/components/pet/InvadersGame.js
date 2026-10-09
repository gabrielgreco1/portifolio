"use client";
import {useEffect,useRef,useState} from 'react';
import {motion} from 'framer-motion';
import {useArcadeSession} from './useArcadeSession';
import ArcadePanels from './ArcadePanels';
import {resizeArcade} from '@/lib/arcade/protocol.mjs';
import {arcadeViewport,arcadePointerX} from '@/lib/arcade/viewport.mjs';
import {advanceInvaders,createInvaders,drawInvaders,pauseInvaders} from '@/lib/crawler/invaders.mjs';
const bestKey='tamagotchi-data-invaders-v2-best';
function readBest(){try{return Math.max(0,Number(localStorage.getItem(bestKey))||0);}catch{return 0;}}
function mergedInput(s){return{left:s.leftKey||s.leftTouch,right:s.rightKey||s.rightTouch,fire:s.fireKey||s.fireTouch||s.canvasFire,targetX:s.targetX};}

export default function InvadersGame({lang,reduced,sound}){
  const session=useArcadeSession('invaders'),recording=session.recording;
  const pt=lang==='pt',canvas=useRef(null),display=useRef(null),state=useRef(null),picture=useRef(null),inputs=useRef({}),timers=useRef([]),bestRef=useRef(0);
  const [best,setBest]=useState(readBest),[ready,setReady]=useState(false),[hud,setHud]=useState({phase:'ready',score:0,wave:1,lives:3});
  useEffect(()=>{
    const surface=canvas.current,ctx=surface.getContext('2d');let raf,last=0,lastHud=0,lastSignature='',disposed=false,saved=false;
    bestRef.current=readBest();const image=new Image();image.onload=()=>{if(!disposed){picture.current=image;setReady(true);lastSignature='';}};image.src='/crawler-character-v2.png';
    const resize=()=>{
      const cssWidth=Math.round(surface.clientWidth),cssHeight=Math.round(surface.clientHeight),dpr=Math.min(2,window.devicePixelRatio||1);
      if(!cssWidth||!cssHeight)return;const view=arcadeViewport(cssWidth,cssHeight),{width,height,scale}=view;display.current=view;
      if(!width||!height)return;surface.width=cssWidth*dpr;surface.height=cssHeight*dpr;ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*view.x,dpr*view.y);
      if(!state.current)state.current=createInvaders(width,height);
      else{const s=state.current;resizeArcade('invaders',s,width,height);if(s.status==='running')pauseInvaders(s);}
      inputs.current={};lastSignature='';
    };
    resize();const observer=new ResizeObserver(resize);observer.observe(surface);
    const frame=now=>{
      const s=state.current;if(s){
        const dt=last?Math.min(.05,(now-last)/1000):0,input=mergedInput(inputs.current);if(s.status==='running'&&recording.current)recording.current.advance(dt,input);else advanceInvaders(s,dt,input);
        sound?.observe('invaders',s);
        const signature=`${s.status}:${s.width}:${s.height}`;
        if(s.status==='running'||s.status==='over'&&s.overTime<1.5||signature!==lastSignature){drawInvaders(ctx,s,picture.current,{reduced,input,lang});lastSignature=signature;}
        if(now-lastHud>80){const phase=s.status==='over'&&s.overTime<.55?'crashed':s.status;setHud({phase,score:s.score,wave:s.wave,lives:s.lives});lastHud=now;
          if(phase==='over'&&!saved){saved=true;if(s.score>bestRef.current){bestRef.current=s.score;setBest(s.score);try{localStorage.setItem(bestKey,String(s.score));}catch{}}}if(phase==='running')saved=false;
        }
      }last=now;raf=requestAnimationFrame(frame);
    };raf=requestAnimationFrame(frame);
    const pause=()=>{inputs.current={};if(state.current?.status==='running')pauseInvaders(state.current);};
    const activeTimers=timers.current;
    window.addEventListener('blur',pause);document.addEventListener('visibilitychange',pause);
    return()=>{disposed=true;sound?.silence();cancelAnimationFrame(raf);observer.disconnect();activeTimers.forEach(clearTimeout);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',pause);};
  },[reduced,recording,lang,sound]);
  async function start(){const previous=state.current;if(!previous||!ready)return;const run=await session.requestStart(previous.width,previous.height);if(!run)return;inputs.current={};if(display.current)run.resize(display.current.width,display.current.height);state.current=run.state;requestAnimationFrame(()=>canvas.current?.focus({preventScroll:true}));}
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
  return <div className="invaders-game" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))inputs.current={};}} onKeyDown={e=>key(e,true)} onKeyUp={e=>key(e,false)}><ArcadePanels session={session} game="invaders" lang={lang}/><div inert={session.panel?true:undefined}>
    <div className="arcade-hud"><div><span>{pt?'PONTOS':'SCORE'}</span><strong>{String(hud.score).padStart(5,'0')}</strong></div><div><span>{pt?'ONDA':'WAVE'}</span><strong>{String(hud.wave).padStart(2,'0')}</strong></div><div><span>{pt?'INTEGRIDADE':'INTEGRITY'}</span><strong className="invaders-health" aria-label={`${hud.lives}/3`}>{[1,2,3].map(n=><i key={n} className={hud.lives>=n?'alive':''}/>)}</strong></div><button onClick={pause} disabled={!['running','paused'].includes(phase)} aria-label={phase==='paused'?(pt?'Continuar jogo':'Resume game'):(pt?'Pausar jogo':'Pause game')}>{phase==='paused'?'▷':'Ⅱ'}</button></div>
    <div className={`runner-stage invaders-stage runner-stage--${phase}`}>
      <canvas ref={canvas} tabIndex="0" role="application" aria-label="Data Invaders" aria-describedby="invaders-instructions" data-wave={hud.wave} onPointerDown={event=>{if(phase!=='running')return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);inputs.current.canvasFire=true;steer(event);canvas.current.focus({preventScroll:true});}} onPointerMove={event=>{if(inputs.current.canvasFire)steer(event);}} onPointerUp={()=>{inputs.current.canvasFire=false;inputs.current.targetX=null;}} onPointerCancel={()=>{inputs.current.canvasFire=false;inputs.current.targetX=null;}}/>
      {!playing&&<motion.div className="runner-overlay" key={phase} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:reduced?.05:.22}}>
        <button className="arcade-ranking-access" onClick={session.showRanking}>{pt?'Ranking ↗':'Leaderboard ↗'}</button><span className="runner-kicker">{phase==='over'?'HUMAN CHECK: FAILED':phase==='paused'?'ORBIT ON HOLD':'MOVE / VALIDATE / DEFEND'}</span>
        <h3>{phase==='over'?(pt?'Robô confirmado.':'Robot confirmed.'):phase==='paused'?(pt?'Órbita em pausa.':'Orbit paused.'):'Data Invaders'}</h3>
        <p>{phase==='over'?`${hud.score} ${pt?'pontos':'points'} · ${pt?'onda':'wave'} ${hud.wave}`:phase==='paused'?(pt?'A próxima validação pode esperar.':'The next validation can wait.'):(pt?'Derrube firewalls. Desvie de fingerprints e rajadas 429.':'Break through firewalls. Dodge fingerprints and 429 bursts.')}</p>
        <div className="arcade-result-actions"><button className="arcade-primary" data-modal-autofocus disabled={!ready} onClick={phase==='paused'?pause:start}>{!ready?(pt?'Acordando o Tamagotchi…':'Waking the Tamagotchi…'):phase==='over'?(pt?'Defender de novo':'Defend again'):phase==='paused'?(pt?'Retomar defesa':'Resume defense'):(pt?'Defender os dados':'Defend the data')} <span>↗</span></button>{phase==='over'&&recording.current&&<button className="arcade-secondary" onClick={session.result?session.showRanking:session.showPublish}>{session.result?(pt?'Ver ranking':'View leaderboard'):(pt?'Publicar recorde':'Publish score')}</button>}</div>
        <small>{phase==='over'?`${pt?'Seu recorde':'Your best'}: ${best}`:(pt?'← → para mover. Segure espaço para atirar.':'← → to move. Hold space to fire.')}</small>
      </motion.div>}
      {phase==='crashed'&&<span className="runner-hit-label" role="status">{pt?'INTEGRIDADE PERDIDA':'INTEGRITY LOST'}</span>}
    </div>
    <div className="invaders-bottom"><p id="invaders-instructions"><span><kbd>←</kbd><kbd>→</kbd> {pt?'mover':'move'}</span><span><kbd>{pt?'ESPAÇO':'SPACE'}</kbd> {pt?'atirar':'fire'}</span><span><kbd>P</kbd> {pt?'pausar':'pause'}</span></p><div className="invaders-touch"><button data-control="left" {...touch('left')} onClick={accessibleTap} disabled={!playing} aria-label={pt?'Mover para esquerda':'Move left'}>←</button><button data-control="fire" {...touch('fire')} onClick={accessibleTap} disabled={!playing}>{pt?'Atirar':'Fire'} <span>↑</span></button><button data-control="right" {...touch('right')} onClick={accessibleTap} disabled={!playing} aria-label={pt?'Mover para direita':'Move right'}>→</button></div></div>
    <p className="sr-only" role="status">{phase==='over'?`${pt?'Fim de jogo':'Game over'}. ${hud.score} ${pt?'pontos':'points'}.`:phase==='paused'?(pt?'Jogo pausado':'Game paused'):''}</p>
  </div></div>;
}
