"use client";
import {useRef,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {useGlassDialog} from '../crawler/useGlassDialog';
import RunnerGame from './RunnerGame';
import InvadersGame from './InvadersGame';
import {useArcadeAudio} from './useArcadeAudio';
import {useArcadeFullscreen} from './useArcadeFullscreen';
import './arcade.css';

export default function PetArcade({open,onClose,lang}){
  const panel=useRef(null),reduced=useReducedMotion(),pt=lang==='pt';
  const [game,setGame]=useState('runner');
  const audio=useArcadeAudio(open),screen=useArcadeFullscreen(open,panel,onClose);
  useGlassDialog(open,panel,screen.close,reduced);
  function chooseGame(id){audio.sound.silence();setGame(id);}
  function shortcuts(event){
    if(event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.target.closest('input,textarea,[contenteditable],iframe'))return;
    audio.unlock();
    if(event.repeat)return;
    if(event.key.toLowerCase()==='m'){event.preventDefault();audio.toggle();}
    if(event.key.toLowerCase()==='f'){event.preventDefault();screen.toggle();}
  }
  return <AnimatePresence>{open&&<>
    <motion.div className="arcade-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={screen.close}/>
    <motion.section ref={panel} className={`pet-arcade${screen.expanded?' pet-arcade--expanded':''}`} data-screen-mode={screen.mode} role="dialog" aria-modal="true" aria-labelledby="arcade-title" onPointerDownCapture={audio.unlock} onKeyDownCapture={shortcuts} initial={{opacity:0,scale:reduced?1:.86,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.94,y:10}} transition={{duration:.35,ease:[.2,.8,.2,1]}}>
      <header className="arcade-header"><div><span>TAMAGOTCHI / AFTER HOURS</span><h2 id="arcade-title">{pt?'Até um crawler precisa brincar.':'Even a crawler needs to play.'}</h2></div><button data-modal-close onClick={screen.close} aria-label={pt?'Fechar jogos':'Close games'}>×</button></header>
      <div className="arcade-toolbar"><div className="arcade-games" role="tablist" aria-label={pt?'Escolher jogo':'Choose a game'}>{[['runner','Data Run'],['invaders','Data Invaders']].map(([id,title],index)=><button key={id} role="tab" id={`game-tab-${id}`} aria-selected={game===id} aria-controls="arcade-game-panel" onClick={()=>chooseGame(id)} onKeyDown={event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const next=game==='runner'?'invaders':'runner';chooseGame(next);event.currentTarget.parentElement.querySelector(`#game-tab-${next}`)?.focus();}}}><span>0{index+1}</span>{title}</button>)}</div>
       <div className="arcade-tools">
        <button type="button" onClick={audio.toggle} disabled={!audio.available} aria-pressed={!audio.muted} aria-label={!audio.available?(pt?'Som indisponível':'Sound unavailable'):audio.muted?(pt?'Ativar som':'Enable sound'):(pt?'Silenciar som':'Mute sound')} title={audio.muted?(pt?'Ativar som · M':'Enable sound · M'):(pt?'Silenciar som · M':'Mute sound · M')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z"/>{audio.muted?<path d="m17 9 5 6m0-6-5 6"/>:<><path d="M16 8c3 2 3 6 0 8"/><path d="M19 5c5 4 5 10 0 14"/></>}</svg><span>{pt?'Som':'Sound'}</span></button>
        <button type="button" onClick={screen.toggle} aria-pressed={screen.expanded} aria-label={screen.expanded?(pt?'Restaurar janela':'Restore window'):(pt?'Tela cheia':'Fullscreen')} title={screen.expanded?(pt?'Restaurar janela · F':'Restore window · F'):(pt?'Tela cheia · F':'Fullscreen · F')}><svg viewBox="0 0 24 24" aria-hidden="true">{screen.expanded?<path d="M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5"/>:<path d="M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5"/>}</svg><span>{pt?'Tela':'Screen'}</span></button>
       </div>
      </div>
      <div className="arcade-scroll" role="tabpanel" id="arcade-game-panel" aria-labelledby={`game-tab-${game}`}>{game==='runner'?<RunnerGame lang={lang} reduced={reduced} sound={audio.sound}/>:<InvadersGame lang={lang} reduced={reduced} sound={audio.sound}/>}</div>
      <footer className="arcade-footer"><span>{game==='runner'?'DATA RUN':'DATA INVADERS'} <i/> {pt?'TROCAR DE JOGO REINICIA A PARTIDA':'SWITCHING GAMES STARTS A NEW RUN'}</span><span>{pt?'Publique seu recorde para entrar no ranking.':'Publish your score to join the leaderboard.'}</span></footer>
      <span className="sr-only" role="status">{screen.mode==='expanded'?(pt?'Modo ampliado. O navegador mantém seus controles.':'Expanded view. Browser controls remain available.'):''}</span>
    </motion.section>
  </>}</AnimatePresence>;
}
