"use client";
import {useRef,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {useGlassDialog} from '../crawler/useGlassDialog';
import RunnerGame from './RunnerGame';
import InvadersGame from './InvadersGame';
import './arcade.css';

export default function PetArcade({open,onClose,lang}){
  const panel=useRef(null),reduced=useReducedMotion(),pt=lang==='pt';
  const [game,setGame]=useState('runner');
  useGlassDialog(open,panel,onClose,reduced);
  return <AnimatePresence>{open&&<>
    <motion.div className="arcade-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
    <motion.section ref={panel} className="pet-arcade" role="dialog" aria-modal="true" aria-labelledby="arcade-title" initial={{opacity:0,scale:reduced?1:.86,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.94,y:10}} transition={{duration:.35,ease:[.2,.8,.2,1]}}>
      <header className="arcade-header"><div><span>TAMAGOTCHI / AFTER HOURS</span><h2 id="arcade-title">{pt?'Até um crawler precisa brincar.':'Even a crawler needs to play.'}</h2></div><button data-modal-close onClick={onClose} aria-label={pt?'Fechar jogos':'Close games'}>×</button></header>
      <div className="arcade-games" role="tablist" aria-label={pt?'Escolher jogo':'Choose a game'}>{[['runner','Data Run'],['invaders','Data Invaders']].map(([id,title],index)=><button key={id} role="tab" id={`game-tab-${id}`} aria-selected={game===id} aria-controls="arcade-game-panel" onClick={()=>setGame(id)} onKeyDown={event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const next=game==='runner'?'invaders':'runner';setGame(next);event.currentTarget.parentElement.querySelector(`#game-tab-${next}`)?.focus();}}}><span>0{index+1}</span>{title}</button>)}</div>
      <div className="arcade-scroll" role="tabpanel" id="arcade-game-panel" aria-labelledby={`game-tab-${game}`}>{game==='runner'?<RunnerGame lang={lang} reduced={reduced}/>:<InvadersGame lang={lang} reduced={reduced}/>}</div>
      <footer className="arcade-footer"><span>{game==='runner'?'DATA RUN':'DATA INVADERS'} <i/> {pt?'TROCAR DE JOGO REINICIA A PARTIDA':'SWITCHING GAMES STARTS A NEW RUN'}</span><span>{pt?'Publique seu recorde para entrar no ranking.':'Publish your score to join the leaderboard.'}</span></footer>
    </motion.section>
  </>}</AnimatePresence>;
}
