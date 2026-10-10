"use client";
import {RankingRows} from './ArcadePanels';
export default function ArcadeResult({session,hud,pt,game,onRestart}){
 const board=session.config,personal=board?.personal,rank=session.result?(personal?.rank??session.result.rank):null;
 return <section className="arcade-result-panel" aria-label={pt?'Resultado da partida':'Game result'}>
   <div className="arcade-result-summary">
    <div className="arcade-verdict"><h3>{pt?'BLOQUEADO.':'BLOCKED.'}</h3><p>{pt?'O anti-bot venceu esta.':'The anti-bot won this one.'}</p></div>
    <div className="arcade-final-stats"><div><span>{pt?'Pontos nesta partida':'Score this run'}</span><strong>{hud.score.toLocaleString(pt?'pt-BR':'en-US')}</strong></div><div><span>{pt?'Sua posição':'Your position'}</span><strong>{rank?`#${rank}`:'—'}</strong></div></div>
    <p className="arcade-result-detail">{game==='runner'?`${hud.packets} ${pt?'pacotes':'packets'} (+${hud.packets*50} pts) · ${hud.cleared} ${pt?'desvios':'dodged'}`:`${pt?'Onda':'Wave'} ${hud.wave}`}</p>
    <div className="arcade-result-pet" aria-hidden="true"/>
    <p className="arcade-result-status" role="status">{session.error?(pt?'Não salvou ainda. Tente reenviar.':'Not saved yet. Please retry.'):session.result?(session.result.improved?(pt?'Recorde salvo. Você está no ranking.':'Best saved. You’re on the leaderboard.'):(pt?`Seu recorde de ${personal?.score??hud.score} pontos continua valendo.`:`Your best of ${personal?.score??hud.score} points still stands.`)):(pt?'Salvando sua partida…':'Saving your run…')}</p>
   </div>
   <div className="arcade-result-leaderboard"><div className="arcade-result-board-title"><h4>Top 10</h4><span>{pt?'Melhor partida por pessoa':'Best run per player'}</span></div>
    {session.result?<RankingRows entries={board?.entries} personal={personal} self={board?.self} pt={pt}/>:<div className="arcade-result-loading" role="status">{session.error?(pt?'Seu resultado está aqui. Falta sincronizar o ranking.':'Your result is here. The leaderboard still needs to sync.'):(pt?'Validando a pontuação e buscando sua posição.':'Verifying your score and finding your position.')}</div>}
   </div>
   <div className="arcade-result-footer">{session.error&&<button className="arcade-secondary" onClick={session.finish} disabled={session.busy}>{pt?'Reenviar resultado':'Retry saving'}</button>}<button className="arcade-primary" data-modal-autofocus disabled={session.busy} onClick={onRestart}>{pt?'Jogar de novo':'Play again'} <span>↗</span></button></div>
 </section>;
}
