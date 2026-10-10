'use client';

import {useEffect,useRef,useState} from 'react';
import './arcade-intro.css';

/** A tiny playable invitation. Its rehearsal never starts or scores a real run. */
export default function ArcadeIntro({game,pt,onStart,onRanking,ready,reduced}){
  const runner=game==='runner';
  const [attempt,setAttempt]=useState(0),[active,setActive]=useState(false);
  const timer=useRef(null);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function rehearse(){
    if(active)return;
    setAttempt(value=>value+1);setActive(true);
    timer.current=setTimeout(()=>setActive(false),reduced?160:850);
  }
  const speech=attempt===0
    ?(runner?(pt?'Aposto que você me salva.':'Bet you can save me.'):(pt?'Eu piloto. Você atira.':'I pilot. You shoot.'))
    :runner?(pt?['Boa. Agora valendo?','Isso! Sem deixar rastros.','Já pode fugir comigo.'][(attempt-1)%3]:['Nice. Ready for the real thing?','Yes! Leave no trace.','Come escape with me.'][(attempt-1)%3])
    :(pt?['Alvo limpo. Próximo?','Esse firewall já era.','Dupla de respeito.'][(attempt-1)%3]:['Target clear. Next?','That firewall is history.','We make a good team.'][(attempt-1)%3]);
  return <div className={`arcade-intro arcade-intro--${game}${active?' arcade-intro--active':''}${reduced?' arcade-intro--reduced':''}`} onKeyDown={event=>{if(!['Tab','Escape'].includes(event.key))event.stopPropagation();}} onKeyUp={event=>{if(!['Tab','Escape'].includes(event.key))event.stopPropagation();}}>
    <div className="arcade-intro-copy">
      <h3>{runner?'Data Run':'Data Invaders'}</h3>
      <p>{runner?(pt?'Você e um crawler. O resto da internet contra.':'You and a crawler. Against the rest of the internet.'):(pt?'Uma última linha de defesa. E quatro perninhas.':'One last line of defense. And four little legs.')}</p>
      {!runner&&<div className="invaders-briefing"><div className="invaders-keyboard-guide"><span><kbd>←</kbd><kbd>→</kbd> {pt?'mover':'move'}</span><span><kbd>{pt?'Espaço':'Space'}</kbd> {pt?'segure para atirar':'hold to fire'}</span><span><kbd>P</kbd> {pt?'pausar':'pause'}</span></div><p className="invaders-touch-guide">{pt?'Arraste para mover e atirar. Ou use os três controles.':'Drag to move and fire. Or use the three controls.'}</p><p className="invaders-ranking-rule">{pt?'Sua melhor horda vale no ranking. Elimine rápido para pontuar mais.':'Your best wave makes the leaderboard. Eliminate faster to score more.'}</p></div>}
      <button type="button" className="arcade-intro-start" onClick={onStart} disabled={!ready} data-modal-autofocus>{!ready?(pt?'Preparando…':'Getting ready…'):runner?(pt?'Bora fugir':'Let’s escape'):(pt?'Assumir o controle':'Take control')}<span aria-hidden="true">→</span></button>
      <button type="button" className="arcade-intro-ranking" onClick={onRanking}>{pt?'Ver ranking':'Leaderboard'}<span aria-hidden="true">↗</span></button>
    </div>
    <div className="arcade-intro-scene">
      <div className="arcade-intro-speech" aria-live="polite">{speech}</div>
      <div className="arcade-intro-world" aria-hidden="true">
        {runner?<><div className="arcade-intro-track"/><div className="arcade-intro-barrier"><i/><i/><i/></div><div className="arcade-intro-packet">{'{ }'}</div><div className="arcade-intro-roadmarks"><i/><i/><i/><i/></div></>:<><div className="arcade-intro-orbit"/><svg className="arcade-intro-enemy" viewBox="0 0 80 50"><path d="M15 8h50v22H52l-5 11H33l-5-11H15Z"/><path className="enemy-shell" d="M4 16h11v14H4ZM65 16h11v14H65Z"/><path className="enemy-eyes" d="M26 17h8v7h-8ZM46 17h8v7h-8Z"/></svg><div className="arcade-intro-shot"/><div className="arcade-intro-impact">×</div></>}
      </div>
      <button type="button" className="arcade-intro-pet" onClick={rehearse} aria-label={runner?(pt?'Experimentar um salto com o Tamagotchi':'Try a jump with the Tamagotchi'):(pt?'Experimentar um disparo com o Tamagotchi':'Try a shot with the Tamagotchi')} aria-describedby={`arcade-intro-hint-${game}`}>
        {/* The approved full-resolution character stays crisp at every stage size. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/crawler-character-v2.png" alt="Tamagotchi" width="1280" height="1280" draggable="false"/>
      </button>
      <span className="arcade-intro-hint" id={`arcade-intro-hint-${game}`}>{runner?(pt?'Toque nele. Teste um salto.':'Tap him. Try a jump.'):(pt?'Toque nele. Acerte o alvo.':'Tap him. Hit the target.')}</span>
    </div>
  </div>;
}
