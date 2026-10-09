"use client";
import {useEffect,useRef,useState} from 'react';
import {AnimatePresence,motion,useIsPresent} from 'framer-motion';
import CrawlerArtwork from '../CrawlerArtwork';
import './pet.css';

function PetMenuPanel({anchor,lang,phase,count,onStrike,onClose,onExtract,onResume,onCollection,reduced,children}) {
  const panel=useRef(null),pt=lang==='pt',present=useIsPresent();
  const [height,setHeight]=useState(230);
  useEffect(()=>{const observer=new ResizeObserver(entries=>{if(panel.current)setHeight(entries[0]?.borderBoxSize?.[0]?.blockSize||panel.current.offsetHeight);});if(panel.current)observer.observe(panel.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    if(!anchor||!present)return;
    const focus=setTimeout(()=>panel.current?.querySelector('.pet-menu-options button:not([disabled])')?.focus({preventScroll:true}),180);
    const outside=e=>{if(!panel.current?.contains(e.target)&&!e.target.closest('.crawler-pet,.crawl-body'))onClose();};
    const key=e=>{
      if(e.key==='Escape'){e.preventDefault();onClose();}
      if(!['ArrowDown','ArrowUp','Home','End','Tab'].includes(e.key))return;
      const buttons=[...(panel.current?.querySelectorAll('button:not([disabled])')||[])];
      const index=buttons.indexOf(document.activeElement);
      if(index<0)return;
      e.preventDefault();
      const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowUp'||e.key==='Tab'&&e.shiftKey?-1:1)+buttons.length)%buttons.length;
      buttons[next]?.focus();
    };
    const dismiss=()=>onClose();
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);
    window.addEventListener('resize',dismiss);window.addEventListener('scroll',dismiss,{passive:true});
    return()=>{clearTimeout(focus);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);window.removeEventListener('resize',dismiss);window.removeEventListener('scroll',dismiss);};
  },[anchor,onClose,present]);
  if(!anchor)return null;
  const desktop=window.matchMedia("(min-width: 981px) and (min-height: 500px)").matches;
  const width=Math.min(desktop?324:292,window.innerWidth-24);
  const left=Math.max(12,Math.min(anchor.left+anchor.width/2-width/2,window.innerWidth-width-12));
  const top=Math.max(12,Math.min(anchor.top-height+20,window.innerHeight-height-12));
  const origin=`${anchor.left+anchor.width/2-left}px ${anchor.top+anchor.height/2-top}px`;
  return <motion.section ref={panel} key="pet-menu" className="pet-menu" role="dialog" aria-hidden={!present||undefined} inert={!present} aria-label={pt?'Menu do Tamagotchi':'Tamagotchi menu'} style={{left,top,width,transformOrigin:origin}} initial={{opacity:0,scale:reduced?1:.75,y:12,filter:reduced?'none':'blur(8px)'}} animate={{opacity:1,scale:1,y:0,filter:'blur(0px)'}} exit={{opacity:0,scale:.92,y:8}} transition={{duration:reduced?.05:.32,ease:[.2,.8,.2,1]}}>
    <header><span className="pet-menu-avatar"><CrawlerArtwork mood={onStrike?3:0}/></span><div><span className="pet-menu-status"><i/>{onStrike?(pt?'EM GREVE':'ON STRIKE'):(pt?'DE PLANTÃO':'ON DUTY')}</span><h2>{pt?'O que vamos fazer?':'What shall we do?'}</h2></div><button className="pet-menu-close" aria-label={pt?'Fechar menu':'Close menu'} onClick={onClose}>×</button></header>
    <div className="pet-menu-options">
      {phase==='paused'&&<button onClick={onResume}><span><strong>{pt?'Continuar coleta':'Resume collection'}</strong><small>{pt?'Voltar exatamente de onde paramos.':'Pick up exactly where we left off.'}</small></span><b>↗</b></button>}
      <button disabled={onStrike} onClick={onExtract}><span><strong>{onStrike?(pt?'Só depois de um refresh.':'Only after a refresh.'):(pt?'Extrair esta página':'Extract this page')}</strong><small>{onStrike?(pt?'A coleta que já fiz continua sua.':'The data I collected is still yours.'):(pt?'Você escolhe. Eu vou buscar.':'You choose. I fetch.')}</small></span><b>↗</b></button>
      {count>0&&<button onClick={onCollection}><span><strong>{pt?'Abrir minha coleta':'Open my collection'}</strong><small>{count} {pt?'fragmentos · JSON + PDF':'fragments · JSON + PDF'}</small></span><b>↗</b></button>}
      {children}
    </div>
    <p className="pet-menu-footnote">{pt?'Pequeno por fora. Curioso por dentro.':'Small on the outside. Curious on the inside.'}</p>
  </motion.section>;
}

export default function PetMenu(props){return <AnimatePresence>{props.anchor&&<PetMenuPanel key="pet-menu" {...props}/>}</AnimatePresence>;}
