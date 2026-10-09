"use client";
import {useRef} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {useGlassDialog} from '../crawler/useGlassDialog';
import RunnerGame from './RunnerGame';
import './arcade.css';

export default function PetArcade({open,onClose,lang}){
  const panel=useRef(null),reduced=useReducedMotion(),pt=lang==='pt';
  useGlassDialog(open,panel,onClose,reduced);
  return <AnimatePresence>{open&&<>
    <motion.div className="arcade-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
    <motion.section ref={panel} className="pet-arcade" role="dialog" aria-modal="true" aria-labelledby="arcade-title" initial={{opacity:0,scale:reduced?1:.86,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.94,y:10}} transition={{duration:.35,ease:[.2,.8,.2,1]}}>
      <header className="arcade-header"><div><span>TAMAGOTCHI / AFTER HOURS</span><h2 id="arcade-title">{pt?'Até um crawler precisa brincar.':'Even a crawler needs to play.'}</h2></div><button data-modal-close onClick={onClose} aria-label={pt?'Fechar jogos':'Close games'}>×</button></header>
      <div className="arcade-scroll"><RunnerGame lang={lang} reduced={reduced}/></div>
      <footer className="arcade-footer"><span>DATA RUN <i/> {pt?'SEM FIM · SEM CHECKPOINT':'ENDLESS · NO CHECKPOINT'}</span><span>{pt?'Seu recorde fica neste navegador.':'Your best stays in this browser.'}</span></footer>
    </motion.section>
  </>}</AnimatePresence>;
}
