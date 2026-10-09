"use client";

import {useCallback,useEffect,useRef,useState} from 'react';
import {motion,useAnimation} from 'framer-motion';
import CrawlerArtwork from '../CrawlerArtwork';
import {useGlassDialog} from './useGlassDialog';
import './protest.css';

const COPY={
  pt:[
    ['Ô… você não vai deixar eu fazer meu trabalho, não?', 'Eu tava no meio de um dado. Um dado importante.', 'Tá bom, pode trabalhar.'],
    ['De novo? Aí você tá testando a minha RAM.', 'Mais uma e eu largo tudo. Até robô tem limite.', 'Foi mal. Continua aí.'],
    ['Pronto. Entrei em greve.', 'Vou pro meu canto. Só volto a trabalhar depois de um refresh.', 'Tá, eu mereci.'],
  ],
  en:[
    ["Hey… are you going to let me do my job?", 'I was in the middle of a very important piece of data.', 'Okay, back to work.'],
    ['Again? You’re testing my RAM.', 'One more interruption and I quit. Even robots have limits.', 'My bad. Carry on.'],
    ['That’s it. I’m on strike.', 'I’m going to my corner. Refresh the page if you want me back.', 'Fair. I deserved that.'],
  ],
};

// The same artwork travels from the interrupted collection position into the
// foreground, then returns to its exact anchor (or retreats to the strike dock).
export default function PauseProtest({incident,lang,reduced,onResolve}){
  const panel=useRef(null),anchor=useRef(null),actor=useAnimation();
  const alive=useRef(true),resolving=useRef(false),resolve=useRef(onResolve),destination=useRef(incident.destination);
  const [leaving,setLeaving]=useState(false);
  const text=COPY[lang][incident.level-1];
  useEffect(()=>{resolve.current=onResolve;destination.current=incident.destination;});
  const leave=useCallback(async(continueWork=false)=>{
    if(resolving.current)return;
    resolving.current=true;setLeaving(true);
    const rect=anchor.current?.getBoundingClientRect(),to=destination.current;
    if(rect)await actor.start({x:reduced?0:to.x-rect.left,y:reduced?0:to.y-rect.top,scale:reduced?1:to.size/rect.width,rotate:incident.level===3?-7:0,opacity:reduced?0:1,transition:{duration:reduced?.12:.7,ease:[.45,0,.2,1]}});
    if(alive.current)resolve.current(continueWork);
  },[actor,incident.level,reduced]);
  const dismiss=useCallback(()=>{void leave(false);},[leave]);
  useGlassDialog(true,panel,dismiss,reduced);
  useEffect(()=>{
    alive.current=true;
    const rect=anchor.current.getBoundingClientRect(),from=incident.origin;
    actor.set({x:reduced?0:from.x-rect.left,y:reduced?0:from.y-rect.top,scale:reduced?1:from.size/rect.width,opacity:reduced?0:1,rotate:0});
    void actor.start({x:0,y:0,scale:1,opacity:1,rotate:reduced?0:[0,-5,2,0],transition:{duration:reduced?.15:.85,ease:[.22,.8,.22,1]}});
    return()=>{alive.current=false;actor.stop();};
  },[actor,incident.origin,reduced]);
  useEffect(()=>{
    if(incident.level!==3)return;
    const timer=setTimeout(()=>void leave(false),6500);
    return()=>clearTimeout(timer);
  },[incident.level,leave]);
  return <div className="crawl-protest" data-level={incident.level} data-leaving={leaving}>
    <motion.div className="crawl-protest-backdrop" initial={{opacity:0,backdropFilter:'blur(0px)',WebkitBackdropFilter:'blur(0px)'}} animate={{opacity:leaving?0:1,backdropFilter:`blur(${leaving||reduced?0:incident.level===1?9:15}px)`,WebkitBackdropFilter:`blur(${leaving||reduced?0:incident.level===1?9:15}px)`}} transition={{duration:reduced?.12:.75}}/>
    <section ref={panel} className="crawl-protest-stage" role="dialog" aria-modal="true" aria-labelledby="protest-title" aria-describedby="protest-description">
      <div ref={anchor} className="crawl-protest-anchor" aria-hidden="true">
        <motion.div className="crawl-protest-character" animate={actor} initial={{opacity:0}}>
          <CrawlerArtwork mood={incident.level}/>
          {incident.level>1&&<div className="crawl-protest-steam"><i/><i/><i/></div>}
          <span className="crawl-protest-shadow"/>
        </motion.div>
      </div>
      <motion.div className="crawl-protest-dialogue" initial={{opacity:0,y:reduced?0:16}} animate={{opacity:leaving?0:1,y:0}} transition={{duration:.28,delay:leaving||reduced?0:.42}}>
        <span className="crawl-protest-eyebrow">{lang==='pt'?['PACIÊNCIA: QUASE INTACTA','PACIÊNCIA: POR UM FIO','503 · BOA VONTADE INDISPONÍVEL'][incident.level-1]:['PATIENCE: MOSTLY INTACT','PATIENCE: RUNNING LOW','503 · GOODWILL UNAVAILABLE'][incident.level-1]}</span>
        <h2 id="protest-title">{text[0]}</h2>
        <p id="protest-description">{text[1]}</p>
        <div className="crawl-protest-actions">
          <button data-modal-autofocus disabled={leaving} onClick={()=>void leave(incident.level<3)}>{text[2]} <span aria-hidden="true">{incident.level===3?'↘':'↗'}</span></button>
          {incident.level<3&&<button className="crawl-protest-secondary" disabled={leaving} onClick={dismiss}>{lang==='pt'?'Quero olhar a página.':'Let me look around.'}</button>}
        </div>
      </motion.div>
    </section>
  </div>;
}
