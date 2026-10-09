"use client";
import {useEffect,useRef,useState} from 'react';
import {motion} from 'framer-motion';
import {advanceRunner,createRunner,drawRunner,duckRunner,jumpRunner,pauseRunner,startRunner} from '@/lib/crawler/runner.mjs';

const bestKey='tamagotchi-data-run-v2-best';
function readBest(){try{return Math.max(0,Number(localStorage.getItem(bestKey))||0);}catch{return 0;}}

export default function RunnerGame({lang,reduced}){
  const pt=lang==='pt',canvas=useRef(null),state=useRef(null),picture=useRef(null),bestRef=useRef(0),duckSources=useRef(new Set());
  const [best,setBest]=useState(readBest),[ready,setReady]=useState(false),[hud,setHud]=useState({phase:'ready',score:0,packets:0,cleared:0,ducking:false,distance:0});
  useEffect(()=>{
    const surface=canvas.current,ctx=surface.getContext('2d');let raf,last=0,lastHud=0,lastSignature='',disposed=false,saved=false;
    bestRef.current=readBest();
    const image=new Image();image.onload=()=>{if(!disposed){picture.current=image;setReady(true);lastSignature='';}};image.src='/crawler-character-v2.png';
    const resize=()=>{
      const cssWidth=Math.round(surface.clientWidth),cssHeight=Math.round(surface.clientHeight),scale=Math.min(1,cssHeight/320),width=Math.round(cssWidth/scale),height=Math.round(cssHeight/scale),dpr=Math.min(2,window.devicePixelRatio||1);
      if(!width||!height)return;surface.width=cssWidth*dpr;surface.height=cssHeight*dpr;ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);
      if(!state.current)state.current=createRunner(width,height);
      else{const s=state.current,ground=height-65,playerX=width<500?66:108,dx=playerX-s.playerX,dy=ground-s.ground;s.width=width;s.height=height;s.ground=ground;s.playerX=playerX;for(const o of s.obstacles)o.x+=dx;for(const t of [...s.tokens,...s.particles]){t.x+=dx;t.y+=dy;}if(s.status==='running')pauseRunner(s);}
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
          setHud({phase,score:s.score,packets:s.packets,cleared:s.cleared,ducking:s.duckHeld&&s.y>=-.5,distance:Math.floor(s.distance/10)});lastHud=now;
          if(phase==='over'&&!saved){saved=true;if(s.score>bestRef.current){bestRef.current=s.score;setBest(s.score);try{localStorage.setItem(bestKey,String(s.score));}catch{}}}
          if(phase==='running')saved=false;
        }
      }last=now;raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    const pause=()=>{duckSources.current.clear();if(state.current?.status==='running')pauseRunner(state.current);};
    const release=event=>{if(['ArrowDown','s','S'].includes(event.key)){duckSources.current.delete(`keyboard:${event.key.toLowerCase()}`);if(state.current)duckRunner(state.current,duckSources.current.size>0);}};
    window.addEventListener('keyup',release);
    window.addEventListener('blur',pause);document.addEventListener('visibilitychange',pause);
    return()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('keyup',release);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',pause);};
  },[reduced]);
  function start(){const previous=state.current;if(!previous||!ready)return;duckSources.current.clear();state.current=createRunner(previous.width,previous.height);startRunner(state.current);canvas.current?.focus({preventScroll:true});}
  function jump(){if(state.current?.status==='running')jumpRunner(state.current);canvas.current?.focus({preventScroll:true});}
  function duck(held,source='pointer'){if(held)duckSources.current.add(source);else duckSources.current.delete(source);if(state.current)duckRunner(state.current,duckSources.current.size>0);}
  function pause(){duckSources.current.clear();if(state.current)pauseRunner(state.current);canvas.current?.focus({preventScroll:true});}
  function key(event){
    if(event.target.closest('button')&&[' ','Enter'].includes(event.key))return;
    if([' ','ArrowUp','w','W'].includes(event.key)){event.preventDefault();if(!event.repeat){if(['ready','over'].includes(state.current?.status))start();else jump();}}
    if(['ArrowDown','s','S'].includes(event.key)){event.preventDefault();duck(true,`keyboard:${event.key.toLowerCase()}`);}
    if(['p','P'].includes(event.key)){event.preventDefault();if(!event.repeat)pause();}
  }
  const phase=hud.phase,playing=['running','crashed'].includes(phase);
  return <div className="runner-game" onKeyDown={key}>
    <div className="arcade-hud"><div><span>{pt?'PONTOS':'SCORE'}</span><strong>{String(hud.score).padStart(5,'0')}</strong></div><div><span>{pt?'DESVIOS':'DODGED'}</span><strong>{String(hud.cleared).padStart(2,'0')}</strong></div><div><span>{pt?'SEU RECORDE':'YOUR BEST'}</span><strong>{String(best).padStart(5,'0')}</strong></div><button onClick={pause} disabled={!['running','paused'].includes(phase)} aria-label={phase==='paused'?(pt?'Continuar jogo':'Resume game'):(pt?'Pausar jogo':'Pause game')}>{phase==='paused'?'▷':'Ⅱ'}</button></div>
    <div className={`runner-stage runner-stage--${phase}`}>
      <canvas ref={canvas} tabIndex="0" role="application" aria-label="Data Run" aria-describedby="runner-instructions" data-ducking={hud.ducking} onPointerDown={event=>{if(playing){event.preventDefault();jump();}}}/>
      {!playing&&<motion.div className="runner-overlay" key={phase} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:reduced?.05:.22}}>
        <span className="runner-kicker">{phase==='over'?'CONNECTION RESET':phase==='paused'?'PIPELINE PAUSED':'OUTRUN THE ANTI-BOT'}</span>
        <h3>{phase==='over'?(pt?'Bloqueado. Por enquanto.':'Blocked. For now.'):phase==='paused'?(pt?'Respira.':'Take a breath.'):'Data Run'}</h3>
        <p>{phase==='over'?`${hud.distance} m · ${hud.packets} ${pt?(hud.packets===1?'pacote recuperado':'pacotes recuperados'):(hud.packets===1?'packet recovered':'packets recovered')}`:phase==='paused'?(pt?'Seus dados estão esperando por você.':'Your data is waiting for you.'):(pt?'Pule firewalls e armadilhas. Passe por baixo dos scanners.':'Jump firewalls and traps. Duck under the scanners.')}</p>
        <button className="arcade-primary" data-modal-autofocus disabled={!ready} onClick={phase==='paused'?pause:start}>{!ready?(pt?'Acordando o Tamagotchi…':'Waking the Tamagotchi…'):phase==='over'?(pt?'Tentar de novo':'Try again'):phase==='paused'?(pt?'Continuar corrida':'Resume run'):(pt?'Começar corrida':'Start running')} <span>↗</span></button>
        {phase==='ready'&&<div className="runner-moves"><span><kbd>↑</kbd>{pt?'Pular bloqueios':'Jump barriers'}</span><span><kbd>↓</kbd>{pt?'Segurar para abaixar':'Hold to duck'}</span></div>}
      </motion.div>}
      {phase==='crashed'&&<span className="runner-hit-label" role="status">403 · {pt?'BLOQUEADO':'BLOCKED'}</span>}
    </div>
    <div className="arcade-bottom"><p id="runner-instructions"><span className="arcade-hint-group"><kbd>{pt?'ESPAÇO':'SPACE'}</kbd> / <kbd>↑</kbd> {pt?'pular':'jump'}</span><span className="arcade-hint-group"><kbd>↓</kbd> {pt?'abaixar':'duck'}</span><span className="arcade-hint-group"><kbd>P</kbd> {pt?'pausar':'pause'}</span></p><div className="runner-controls"><button className="runner-touch runner-duck" aria-pressed={hud.ducking} disabled={!playing||phase==='crashed'} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);duck(true);}} onPointerUp={()=>duck(false)} onPointerCancel={()=>duck(false)} onLostPointerCapture={()=>duck(false)} onKeyDown={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();duck(true,'button');}}} onKeyUp={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();duck(false,'button');}}} onBlur={()=>duck(false,'button')}>{pt?'Abaixar':'Duck'} <span>↓</span></button><button className="runner-touch" disabled={!playing||phase==='crashed'} onPointerDown={event=>{event.preventDefault();jump();}} onClick={event=>{if(event.detail===0)jump();}}>{pt?'Pular':'Jump'} <span>↑</span></button></div></div>
    <p className="arcade-live sr-only" role="status">{phase==='over'?`${pt?'Fim de jogo':'Game over'}. ${hud.score} ${pt?'pontos':'points'}.`:phase==='paused'?(pt?'Jogo pausado':'Game paused'):''}</p>
  </div>;
}
