"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {useGlassDialog} from '../crawler/useGlassDialog';
import RunnerGame from './RunnerGame';
import InvadersGame from './InvadersGame';
import {useArcadeAudio} from './useArcadeAudio';
import {useArcadeFullscreen} from './useArcadeFullscreen';
import './arcade.css';
import './pixel-console.css';

export default function PetArcade({open,onClose,lang}){
 const panel=useRef(null),settingsPanel=useRef(null),settingsTrigger=useRef(null),wasSettings=useRef(false),reduced=useReducedMotion(),pt=lang==='pt';
 const [game,setGame]=useState('runner'),[settings,setSettings]=useState(false),[restart,setRestart]=useState(0);
 const close=useCallback(()=>{setSettings(false);onClose();},[onClose]);
 const audio=useArcadeAudio(open),screen=useArcadeFullscreen(open,close);
 useGlassDialog(open,panel,screen.close,reduced);
 useEffect(()=>{if(settings)settingsPanel.current?.querySelector('button')?.focus();else if(wasSettings.current)settingsTrigger.current?.focus();wasSettings.current=settings;},[settings]);
 useEffect(()=>{
  if(!open||!settings)return;
  function escape(event){if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setSettings(false);}}
  window.addEventListener('keydown',escape,true);return()=>window.removeEventListener('keydown',escape,true);
 },[open,settings]);
 function chooseGame(id){audio.sound.silence();setGame(id);setSettings(false);}
 function shortcuts(event){
  if(event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,[contenteditable],iframe'))return;
  if(event.key==='Escape'&&settings){event.preventDefault();event.stopPropagation();setSettings(false);return;}
  audio.unlock();if(event.repeat)return;
  if(event.key.toLowerCase()==='m'){event.preventDefault();audio.toggle();}
  if(event.key.toLowerCase()==='f'){event.preventDefault();screen.toggle();}
 }
 const sizeLabel=screen.expanded?(pt?'Minimizar':'Minimize'):(pt?'Maximizar':'Maximize');
 return <AnimatePresence>{open&&<>
  <motion.div className="arcade-backdrop console-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={screen.close}/>
  <motion.section ref={panel} className={`pet-arcade pixel-console${screen.expanded?' pet-arcade--expanded':''}`} data-screen-mode={screen.mode} role="dialog" aria-modal="true" aria-label={pt?'Videogame do Tamagotchi':'Tamagotchi videogame'} onPointerDownCapture={audio.unlock} onKeyDownCapture={shortcuts} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}} transition={{duration:reduced?0:.2}}>
   <header className="console-chrome"><button className="console-home" onClick={()=>{audio.sound.silence();setSettings(false);setRestart(v=>v+1);}} aria-label={pt?'Voltar ao menu do jogo':'Return to game menu'}>◀ <span>MENU</span></button><div><button ref={settingsTrigger} onClick={()=>setSettings(v=>!v)} aria-label={pt?'Configurações':'Settings'} title={pt?'Configurações':'Settings'}>⚙</button><button onClick={screen.toggle} aria-label={sizeLabel} title={`${sizeLabel} · F`} aria-pressed={screen.expanded}>{screen.expanded?'▣':'□'}</button><button data-modal-close onClick={screen.close} aria-label={pt?'Fechar jogos':'Close games'}>×</button></div></header>
   <div className="arcade-games console-cartridges" role="tablist" aria-label={pt?'Escolher jogo':'Choose a game'}>{[['runner','Data Run'],['invaders','Data Invaders']].map(([id,title],index)=><button key={id} role="tab" id={`game-tab-${id}`} aria-selected={game===id} aria-controls="arcade-game-panel" onClick={()=>chooseGame(id)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=game==='runner'?'invaders':'runner';chooseGame(next);e.currentTarget.parentElement.querySelector(`#game-tab-${next}`)?.focus();}}}><span>0{index+1}</span>{title}</button>)}</div>
   <div className="arcade-scroll" role="tabpanel" id="arcade-game-panel" aria-labelledby={`game-tab-${game}`} inert={settings?true:undefined}>{game==='runner'?<RunnerGame key={`runner-${restart}`} lang={lang} reduced={reduced} sound={audio.sound} onSettings={()=>setSettings(true)} suspended={settings} viewportMode={screen.mode}/>:<InvadersGame key={`invaders-${restart}`} lang={lang} reduced={reduced} sound={audio.sound} onSettings={()=>setSettings(true)} suspended={settings} viewportMode={screen.mode}/>}</div>
   {settings&&<section ref={settingsPanel} className="console-settings" data-glass-inner role="region" aria-label={pt?'Configurações do videogame':'Videogame settings'} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setSettings(false);}}}><h2>{pt?'Configurações':'Settings'}</h2><button onClick={audio.toggle} disabled={!audio.available} aria-pressed={!audio.muted}><span>{pt?'Som':'Sound'}</span><strong>{!audio.available?'—':audio.muted?'OFF':'ON'}</strong></button><button onClick={screen.toggle}><span>{pt?'Tela':'Screen'}</span><strong>{sizeLabel} ↗</strong></button><p>{pt?'Expande dentro do site. Seus controles do navegador continuam disponíveis.':'Expands within the site. Your browser controls stay available.'}</p><button className="console-settings-back" data-modal-autofocus onClick={()=>setSettings(false)}>◀ {pt?'Voltar':'Back'}</button></section>}
   <span className="sr-only" role="status">{screen.expanded?(pt?'Janela maximizada dentro do site.':'Window maximized within the site.'):(pt?'Janela reduzida no canto da tela.':'Window docked in the corner.')}</span>
  </motion.section>
 </>}</AnimatePresence>;
}
