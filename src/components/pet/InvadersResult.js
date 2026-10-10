'use client';
/* eslint-disable @next/next/no-img-element -- Keep the approved game texture identical to the canvas character. */
import {RankingRows} from './ArcadePanels';
import './invaders-encounters.css';

export default function InvadersResult({session,hud,pt,onRestart,reduced}){
 const board=session.config,personal=board?.personal;
 const rank=session.result?(personal?.rank??session.result.rank):null;
 const bestWave=typeof hud.bestWave==='object'?hud.bestWave?.wave:hud.bestWave;
 const score=Number(hud.score||0).toLocaleString(pt?'pt-BR':'en-US');
 const status=session.error?(pt?'Não sincronizou. Seu resultado continua aqui.':'Not synced. Your result is still here.'):session.result?(session.result.improved?(pt?'Novo recorde salvo.':'New best saved.'):(pt?'Seu melhor resultado continua no ranking.':'Your personal best stays on the board.')):(pt?'Validando e salvando…':'Verifying and saving…');
 return <section className={`arcade-result-panel invaders-result${reduced?' is-reduced':''}`} aria-label={pt?'Resultado de Data Invaders':'Data Invaders result'}>
  <div className="invaders-result-summary">
   <div className="invaders-result-verdict"><div className="invaders-result-character" aria-hidden="true"><div className="invaders-result-signal"><i/><i/><i/></div><img src="/crawler-character-v2.png" alt="" width="1280" height="1280" draggable="false"/></div><h3>{pt?<>SINAL<br/>PERDIDO.</>:<>SIGNAL<br/>LOST.</>}</h3></div>
   <div className="invaders-result-score"><span>{pt?'Sua melhor horda':'Your best wave'}{bestWave?` · ${String(bestWave).padStart(2,'0')}`:''}</span><strong>{score}<small>pts</small></strong></div>
   <dl className="invaders-result-stats"><div><dt>{pt?'Horda atingida':'Wave reached'}</dt><dd>{String(hud.wave||1).padStart(2,'0')}</dd></div><div><dt>{pt?'Sua posição':'Your rank'}</dt><dd>{rank?`#${rank}`:'—'}</dd></div></dl>
   <p className="invaders-result-save" role="status">{status}</p>
  </div>
  <div className="arcade-result-leaderboard invaders-result-leaderboard"><div className="arcade-result-board-title"><h4>Top 10</h4><span>{pt?'Melhor horda por pessoa':'Best wave per player'}</span></div>
   {session.result?<RankingRows entries={board?.entries} personal={personal} self={board?.self} pt={pt}/>:<div className="invaders-result-pending" role="status">{session.error?(pt?'Reenvie para confirmar sua posição.':'Retry saving to confirm your rank.'):(pt?'Consultando sua posição no ranking.':'Finding your leaderboard position.')}</div>}
  </div>
  <div className="arcade-result-footer invaders-result-footer">{session.error&&<button className="arcade-secondary" onClick={session.finish} disabled={session.busy}>{pt?'Reenviar':'Retry save'}</button>}<button className="arcade-primary" data-modal-autofocus disabled={session.busy} onClick={onRestart}>{pt?'Reconectar e jogar':'Reconnect and play'}<span aria-hidden="true">↻</span></button></div>
 </section>;
}
