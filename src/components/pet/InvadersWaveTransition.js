'use client';
import './invaders-encounters.css';

export default function InvadersWaveTransition({lastClear,nextWave,pt,reduced}){
 if(!lastClear)return null;
 const seconds=Number.isFinite(lastClear.seconds)?`${lastClear.seconds.toFixed(1)}s`:'—';
 return <div key={`${lastClear.wave}-${nextWave}`} className={`invaders-wave-transition${reduced?' is-reduced':''}`} role="status" aria-live="polite">
  <div className="invaders-wave-cut" aria-hidden="true"><i/><i/></div>
  <div className="invaders-wave-receipt"><span className="invaders-wave-check" aria-hidden="true">✓</span><span>{pt?'Horda':'Wave'} {lastClear.wave}</span><strong>+{Number(lastClear.score||0).toLocaleString(pt?'pt-BR':'en-US')}</strong><span>{seconds}</span></div>
  <div className="invaders-wave-next"><span>{pt?'Próxima horda':'Next wave'}</span><strong>{String(nextWave).padStart(2,'0')}</strong><span className="invaders-wave-progress" aria-hidden="true"><i/><i/><i/></span></div>
 </div>;
}
