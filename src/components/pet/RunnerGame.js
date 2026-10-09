"use client";
import {useEffect,useRef,useState} from 'react';
import {motion} from 'framer-motion';
import {advanceRunner,createRunner,drawRunner,jumpRunner,pauseRunner,startRunner} from '@/lib/crawler/runner.mjs';

const bestKey='tamagotchi-data-run-best';
function readBest(){try{return Math.max(0,Number(localStorage.getItem(bestKey))||0);}catch{return 0;}}

export default function RunnerGame({lang,reduced}){
  const pt=lang==='pt',canvas=useRef(null),state=useRef(null),picture=useRef(null),bestRef=useRef(0);
  const [best,setBest]=useState(readBest),[ready,setReady]=useState(false),[hud,setHud]=useState({phase:'ready',score:0,packets:0,distance:0});
  useEffect(()=>{
    const surface=canvas.current,ctx=surface.getContext('2d');let raf,last=0,lastHud=0,lastSignature='',disposed=false,saved=false;
    bestRef.current=readBest();
    const image=new Image();image.onload=()=>{if(!disposed){picture.current=image;setReady(true);lastSignature='';}};image.src='/crawler-character-v2.png';
    const resize=()=>{
      const cssWidth=Math.round(surface.clientWidth),cssHeight=Math.round(surface.clientHeight),scale=Math.min(1,cssHeight/320),width=Math.round(cssWidth/scale),height=Math.round(cssHeight/scale),dpr=Math.min(2,window.devicePixelRatio||1);
      if(!width||!height)return;surface.width=cssWidth*dpr;surface.height=cssHeight*dpr;ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);
      if(!state.current)state.current=createRunner(width,height);
      else{const s=state.current;s.width=width;s.height=height;s.ground=height-65;s.playerX=width<500?66:108;if(s.status==='running')pauseRunner(s);}
      lastSignature='';
    };
    resize();const observer=new ResizeObserver(resize);observer.observe(surface);
    const frame=now=>{
      const s=state.current;if(s){
        const dt=last?Math.min(.05,(now-last)/1000):0;advanceRunner(s,dt);
        const signature=`${s.status}:${s.width}:${s.height}`;
        if(s.status==='running'||s.status==='over'&&s.overTime<1.5||signature!==lastSignature){drawRunner(ctx,s,picture.current,{reduced});lastSignature=signature;}
        if(now-lastHud>80){
          const phase=s.status==='over'&&s.overTime<.55?'crashed':s.status;
          setHud({phase,score:s.score,packets:s.packets,distance:Math.floor(s.distance/10)});lastHud=now;
          if(phase==='over'&&!saved){saved=true;if(s.score>bestRef.current){bestRef.current=s.score;setBest(s.score);try{localStorage.setItem(bestKey,String(s.score));}catch{}}}
          if(phase==='running')saved=false;
        }
      }last=now;raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    const pause=()=>{if(state.current?.status==='running')pauseRunner(state.current);};
    window.addEventListener('blur',pause);document.addEventListener('visibilitychange',pause);
    return()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',pause);};
  },[reduced]);
  function start(){const previous=state.current;if(!previous||!ready)return;state.current=createRunner(previous.width,previous.height);startRunner(state.current);canvas.current?.focus({preventScroll:true});}
  function jump(){if(state.current?.status==='running')jumpRunner(state.current);canvas.current?.focus({preventScroll:true});}
  function pause(){if(state.current)pauseRunner(state.current);canvas.current?.focus({preventScroll:true});}
  function key(event){
    if(event.target.closest('button')&&[' ','Enter'].includes(event.key))return;
    if([' ','ArrowUp','w','W'].includes(event.key)){event.preventDefault();if(!event.repeat){if(['ready','over'].includes(state.current?.status))start();else jump();}}
    if(['p','P'].includes(event.key)){event.preventDefault();if(!event.repeat)pause();}
  }
  const phase=hud.phase,playing=['running','crashed'].includes(phase);
  return <div className="runner-game" onKeyDown={key}>
    <div className="arcade-hud"><div><span>{pt?'PONTOS':'SCORE'}</span><strong>{String(hud.score).padStart(5,'0')}</strong></div><div><span>{pt?'PACOTES':'PACKETS'}</span><strong><i>{'{ }'}</i> {hud.packets}</strong></div><div><span>{pt?'SEU RECORDE':'YOUR BEST'}</span><strong>{String(best).padStart(5,'0')}</strong></div><button onClick={pause} disabled={!['running','paused'].includes(phase)} aria-label={phase==='paused'?(pt?'Continuar jogo':'Resume game'):(pt?'Pausar jogo':'Pause game')}>{phase==='paused'?'▷':'Ⅱ'}</button></div>
    <div className={`runner-stage runner-stage--${phase}`}>
      <canvas ref={canvas} tabIndex="0" role="application" aria-label="Data Run" aria-describedby="runner-instructions" onPointerDown={event=>{if(playing){event.preventDefault();jump();}}}/>
      {!playing&&<motion.div className="runner-overlay" key={phase} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:reduced?.05:.22}}>
        <span className="runner-kicker">{phase==='over'?'CONNECTION RESET':phase==='paused'?'PIPELINE PAUSED':'RUN / COLLECT / REPEAT'}</span>
        <h3>{phase==='over'?(pt?'Bloqueado. Por enquanto.':'Blocked. For now.'):phase==='paused'?(pt?'Respira.':'Take a breath.'):'Data Run'}</h3>
        <p>{phase==='over'?`${hud.distance} m · ${hud.packets} ${pt?(hud.packets===1?'pacote recuperado':'pacotes recuperados'):(hud.packets===1?'packet recovered':'packets recovered')}`:phase==='paused'?(pt?'Seus dados estão esperando por você.':'Your data is waiting for you.'):(pt?'Pule os bloqueios. Recupere os pacotes.':'Jump the blocks. Recover the packets.')}</p>
        <button className="arcade-primary" data-modal-autofocus disabled={!ready} onClick={phase==='paused'?pause:start}>{!ready?(pt?'Acordando o Tamagotchi…':'Waking the Tamagotchi…'):phase==='over'?(pt?'Tentar de novo':'Try again'):phase==='paused'?(pt?'Continuar corrida':'Resume run'):(pt?'Começar corrida':'Start running')} <span>↗</span></button>
        {phase==='ready'&&<small>{pt?'Espaço ou ↑ para pular. No celular, toque.':'Space or ↑ to jump. On mobile, tap.'}</small>}
      </motion.div>}
      {phase==='crashed'&&<span className="runner-hit-label" role="status">403 · {pt?'BLOQUEADO':'BLOCKED'}</span>}
    </div>
    <div className="arcade-bottom"><p id="runner-instructions"><span className="arcade-hint-group"><kbd>{pt?'ESPAÇO':'SPACE'}</kbd> / <kbd>↑</kbd> {pt?'pular':'jump'}</span><span className="arcade-hint-group"><kbd>P</kbd> {pt?'pausar':'pause'}</span></p><button className="runner-touch" disabled={!playing||phase==='crashed'} onPointerDown={event=>{event.preventDefault();jump();}} onClick={event=>{if(event.detail===0)jump();}}>{pt?'Pular':'Jump'} <span>↑</span></button></div>
    <p className="arcade-live sr-only" role="status">{phase==='over'?`${pt?'Fim de jogo':'Game over'}. ${hud.score} ${pt?'pontos':'points'}.`:phase==='paused'?(pt?'Jogo pausado':'Game paused'):''}</p>
  </div>;
}
