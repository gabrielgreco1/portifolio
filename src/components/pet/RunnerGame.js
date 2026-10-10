"use client";
import {useEffect,useRef,useState} from 'react';
import {motion} from 'framer-motion';
import {useArcadeSession} from './useArcadeSession';
import ArcadePanels from './ArcadePanels';
import ArcadeResult from './ArcadeResult';
import ArcadeIntro from './ArcadeIntro';
import {resizeArcade} from '@/lib/arcade/protocol.mjs';
import {arcadeViewport} from '@/lib/arcade/viewport.mjs';
import {advanceRunner,createRunner,drawRunner,pauseRunner,prepareRunnerSprites} from '@/lib/crawler/runner.mjs';

const bestKey='tamagotchi-data-run-v3-best';
function readBest(){try{return Math.max(0,Number(localStorage.getItem(bestKey))||0);}catch{return 0;}}

export default function RunnerGame({lang,reduced,sound}){
  const session=useArcadeSession('runner'),recording=session.recording,finish=session.finish;
  const pt=lang==='pt',canvas=useRef(null),display=useRef(null),state=useRef(null),picture=useRef(null),bestRef=useRef(0),duckSources=useRef(new Set()),jumpQueue=useRef(false);
  const restartLayout=useRef(false);
  const [best,setBest]=useState(readBest),[ready,setReady]=useState(false),[hud,setHud]=useState({phase:'ready',score:0,packets:0,cleared:0,ducking:false,distance:0,speed:245});
  useEffect(()=>{
    const surface=canvas.current,ctx=surface.getContext('2d');let raf,last=0,lastHud=0,lastSignature='',disposed=false,saved=false;
    bestRef.current=readBest();
    const image=new Image();image.onload=()=>{if(!disposed){prepareRunnerSprites(image);picture.current=image;setReady(true);lastSignature='';}};image.src='/crawler-character-v2.png';
    const resize=()=>{
      const cssWidth=Math.round(surface.clientWidth),cssHeight=Math.round(surface.clientHeight),dpr=Math.min(2,window.devicePixelRatio||1);
      if(!cssWidth||!cssHeight)return;const view=arcadeViewport(cssWidth,cssHeight),{width,height,scale}=view;display.current=view;
      if(!width||!height)return;surface.width=cssWidth*dpr;surface.height=cssHeight*dpr;ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*view.x,dpr*view.y);
      if(!state.current)state.current=createRunner(width,height);
      else{const s=state.current;resizeArcade('runner',s,width,height);if(s.status==='running'&&!restartLayout.current)pauseRunner(s);restartLayout.current=false;duckSources.current.clear();jumpQueue.current=false;}
      lastSignature='';
    };
    resize();const observer=new ResizeObserver(resize);observer.observe(surface);
    const frame=now=>{
      const s=state.current;if(s){
        const dt=last?Math.min(.05,(now-last)/1000):0;if(s.status==='running'&&recording.current){const tick=recording.current.tick;recording.current.advance(dt,{jump:jumpQueue.current,duck:duckSources.current.size>0});if(recording.current.tick!==tick)jumpQueue.current=false;}else advanceRunner(s,dt);
        sound?.observe('runner',s);
        const signature=`${s.status}:${s.width}:${s.height}`;
        if(s.status==='running'||s.status==='over'&&s.overTime<1.5||signature!==lastSignature){drawRunner(ctx,s,picture.current,{reduced});lastSignature=signature;}
        if(now-lastHud>80){
          const phase=s.status==='over'&&s.overTime<.55?'crashed':s.status;
          const nextHud={phase,score:s.score,packets:s.packets,cleared:s.cleared,ducking:s.duckHeld&&s.y>=-.5,distance:Math.floor(s.distance/10),speed:s.speed};setHud(previous=>Object.keys(nextHud).every(key=>previous[key]===nextHud[key])?previous:nextHud);lastHud=now;
          if(phase==='over'&&!saved){saved=true;if(s.score>bestRef.current){bestRef.current=s.score;setBest(s.score);try{localStorage.setItem(bestKey,String(s.score));}catch{}}}
          if(phase==='running')saved=false;
        }
      }last=now;raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    const pause=()=>{duckSources.current.clear();jumpQueue.current=false;if(state.current?.status==='running')pauseRunner(state.current);};
    const release=event=>{if(['ArrowDown','s','S'].includes(event.key)){duckSources.current.delete(`keyboard:${event.key.toLowerCase()}`);}};
    window.addEventListener('keyup',release);
    window.addEventListener('blur',pause);document.addEventListener('visibilitychange',pause);
    return()=>{disposed=true;sound?.silence();cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('keyup',release);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',pause);};
  },[reduced,recording,sound]);
  useEffect(()=>{if(hud.phase==='over')finish();},[hud.phase,finish]);
  async function start(){const previous=state.current;if(!previous||!ready)return;const run=await session.requestStart(previous.width,previous.height);if(!run)return;duckSources.current.clear();jumpQueue.current=false;if(display.current)run.resize(display.current.width,display.current.height);restartLayout.current=previous.status==='over';state.current=run.state;requestAnimationFrame(()=>requestAnimationFrame(()=>{const scroll=canvas.current?.closest('.arcade-scroll');if(scroll)scroll.scrollTop=0;canvas.current?.focus({preventScroll:true});}));}
  function jump(){if(state.current?.status==='running')jumpQueue.current=true;canvas.current?.focus({preventScroll:true});}
  function duck(held,source='pointer'){if(held)duckSources.current.add(source);else duckSources.current.delete(source);}
  function pause(){duckSources.current.clear();if(state.current)pauseRunner(state.current);canvas.current?.focus({preventScroll:true});}
  function key(event){
    if(event.target.closest('button')&&[' ','Enter'].includes(event.key))return;
    if([' ','ArrowUp','w','W'].includes(event.key)){event.preventDefault();if(!event.repeat){if(['ready','over'].includes(state.current?.status))start();else jump();}}
    if(['ArrowDown','s','S'].includes(event.key)){event.preventDefault();duck(true,`keyboard:${event.key.toLowerCase()}`);}
    if(['p','P'].includes(event.key)){event.preventDefault();if(!event.repeat)pause();}
  }
  const phase=hud.phase,playing=['running','crashed'].includes(phase);
  return <div className="runner-game" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)){duckSources.current.clear();jumpQueue.current=false;}}} onKeyDown={key}><ArcadePanels session={session} game="runner" lang={lang}/><div className={phase==='over'?'arcade-playfield arcade-playfield--finished':'arcade-playfield'} inert={session.panel?true:undefined}>
    <div className="arcade-hud"><div><span>{pt?'PONTOS':'SCORE'}</span><strong>{String(hud.score).padStart(5,'0')}</strong></div><div><span>{pt?'PACOTES':'PACKETS'}</span><strong key={hud.packets} className={hud.packets?'runner-packet-count':''}>{String(hud.packets).padStart(2,'0')}</strong></div><div className="runner-speed"><span>{pt?'VELOCIDADE':'SPEED'}</span><strong>{(hud.speed/245).toFixed(2)}<i>×</i></strong></div><div className="runner-best"><span>{pt?'RECORDE':'BEST'}</span><strong>{String(best).padStart(5,'0')}</strong></div><button onClick={pause} disabled={!['running','paused'].includes(phase)} aria-label={phase==='paused'?(pt?'Continuar jogo':'Resume game'):(pt?'Pausar jogo':'Pause game')}>{phase==='paused'?'▷':'Ⅱ'}</button></div>
    <div className={`runner-stage runner-stage--${phase}`}>
      <canvas ref={canvas} tabIndex="0" role="application" aria-label="Data Run" aria-describedby="runner-instructions" data-ducking={hud.ducking} onPointerDown={event=>{if(playing){event.preventDefault();jump();}}}/>
      {phase==='ready'&&<ArcadeIntro game="runner" pt={pt} onStart={start} onRanking={session.showRanking} ready={ready} reduced={reduced}/>}
      {phase==='paused'&&<motion.div className="runner-overlay" key={phase} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:reduced?.05:.22}}>
        <button className="arcade-ranking-access" onClick={session.showRanking}>{pt?'Ranking ↗':'Leaderboard ↗'}</button>
        <h3>{phase==='over'?(pt?'ACESSO NEGADO':'ACCESS DENIED'):phase==='paused'?(pt?'Respira.':'Take a breath.'):'Data Run'}</h3>
        <p>{phase==='over'?`${pt?'O anti-bot encerrou sua sessão.':'The anti-bot terminated your session.'} ${hud.distance} m · ${hud.packets} ${pt?(hud.packets===1?'pacote recuperado':'pacotes recuperados'):(hud.packets===1?'packet recovered':'packets recovered')}`:phase==='paused'?(pt?'Seus dados estão esperando por você.':'Your data is waiting for you.'):(pt?'Pule firewalls e armadilhas. Passe por baixo dos scanners.':'Jump firewalls and traps. Duck under the scanners.')}</p>
        <div className="arcade-result-actions"><button className="arcade-primary" data-modal-autofocus disabled={!ready} onClick={phase==='paused'?pause:start}>{!ready?(pt?'Acordando o Tamagotchi…':'Waking the Tamagotchi…'):phase==='over'?(pt?'Tentar de novo':'Try again'):phase==='paused'?(pt?'Continuar corrida':'Resume run'):(pt?'Começar corrida':'Start running')} <span>↗</span></button>{phase==='over'&&recording.current&&<button className="arcade-secondary" onClick={session.result?session.showRanking:session.showPublish}>{session.result?(pt?'Ver ranking':'View leaderboard'):(pt?'Publicar recorde':'Publish score')}</button>}</div>
        {phase==='ready'&&<div className="runner-moves"><span><kbd>↑</kbd>{pt?'Pular bloqueios':'Jump barriers'}</span><span><kbd>↓</kbd>{pt?'Segurar para abaixar':'Hold to duck'}</span></div>}
      </motion.div>}
      {phase==='running'&&hud.packets>0&&<span key={hud.packets} className="runner-packet-reward" aria-hidden="true">+50 <small>{pt?'pacote recuperado':'packet recovered'}</small></span>}
      {phase==='crashed'&&<span className="runner-hit-label" role="status">{pt?'DETECTADO':'DETECTED'}</span>}
    </div>
    {phase==='over'&&<ArcadeResult session={session} hud={hud} pt={pt} game="runner" onRestart={start}/>}
    <div className="arcade-bottom"><p id="runner-instructions"><span className="arcade-hint-group"><kbd>{pt?'ESPAÇO':'SPACE'}</kbd> / <kbd>↑</kbd> {pt?'pular':'jump'}</span><span className="arcade-hint-group"><kbd>↓</kbd> {pt?'abaixar':'duck'}</span><span className="arcade-hint-group"><kbd>P</kbd> {pt?'pausar':'pause'}</span></p><div className="runner-controls"><button className="runner-touch runner-duck" aria-pressed={hud.ducking} disabled={!playing||phase==='crashed'} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);duck(true);}} onPointerUp={()=>duck(false)} onPointerCancel={()=>duck(false)} onLostPointerCapture={()=>duck(false)} onKeyDown={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();duck(true,'button');}}} onKeyUp={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();duck(false,'button');}}} onBlur={()=>duck(false,'button')}>{pt?'Abaixar':'Duck'} <span>↓</span></button><button className="runner-touch" disabled={!playing||phase==='crashed'} onPointerDown={event=>{event.preventDefault();jump();}} onClick={event=>{if(event.detail===0)jump();}}>{pt?'Pular':'Jump'} <span>↑</span></button></div></div>
    <p className="arcade-live sr-only" role="status">{phase==='over'?`${pt?'Fim de jogo':'Game over'}. ${hud.score} ${pt?'pontos':'points'}.`:phase==='paused'?(pt?'Jogo pausado':'Game paused'):''}</p>
  </div></div>;
}
