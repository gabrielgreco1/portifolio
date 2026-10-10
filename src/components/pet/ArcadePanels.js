"use client";
import {useEffect,useRef,useState} from 'react';
let loading;
function loadTurnstile(){
 if(window.turnstile)return Promise.resolve(window.turnstile);
 if(!loading)loading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
  script.onload=()=>window.turnstile?resolve(window.turnstile):reject(new Error('captcha_unavailable'));script.onerror=()=>{script.remove();loading=null;reject(new Error('captcha_unavailable'));};document.head.append(script);
 });return loading;
}
function Turnstile({sitekey,game,lang,onToken,onError,reset}){
 const container=useRef(null),tokenCallback=useRef(onToken),errorCallback=useRef(onError);useEffect(()=>{tokenCallback.current=onToken;errorCallback.current=onError;},[onToken,onError]);
 useEffect(()=>{
  let cancelled=false,id,api,observer,size;
  loadTurnstile().then(turnstile=>{
   if(cancelled)return;api=turnstile;
   const render=()=>{
    if(cancelled||!container.current)return;
    const nextSize=container.current.clientWidth<300?'compact':'flexible';
    if(size===nextSize)return;
    if(id!==undefined){api.remove(id);tokenCallback.current('');}
    size=nextSize;
    id=api.render(container.current,{sitekey,action:'arcade_start',cData:game,theme:'dark',language:lang==='pt'?'pt-br':'en',size,callback:token=>tokenCallback.current(token),'error-callback':()=>{tokenCallback.current('');errorCallback.current();},'expired-callback':()=>tokenCallback.current(''),'timeout-callback':()=>tokenCallback.current('')});
   };
   render();observer=new ResizeObserver(render);observer.observe(container.current);
  }).catch(()=>{if(!cancelled)errorCallback.current();});
  return()=>{cancelled=true;observer?.disconnect();if(id!==undefined)api?.remove(id);};
 },[sitekey,game,lang,reset]);
 return <div className="arcade-captcha" ref={container}/>;
}
function friendlyError(code,pt){
 if(['captcha_required','captcha_failed','captcha_unavailable'].includes(code))return pt?'A verificação não foi concluída. Tente novamente.':'Verification did not finish. Please try again.';
 if(code==='invalid_name')return pt?'Use até 20 letras, números, espaços, pontos ou traços.':'Use up to 20 letters, numbers, spaces, dots or dashes.';
 if(code==='run_expired')return pt?'Esta partida expirou. Jogue outra para entrar no ranking.':'This run expired. Play again to enter the leaderboard.';
 if(code==='rate_limited')return pt?'Muitas tentativas seguidas. Aguarde um pouco e tente novamente.':'Too many attempts. Wait a little and try again.';
 if(code==='invalid_recording'||code==='run_too_fast')return pt?'Não conseguimos validar esta partida. O recorde não foi publicado.':'We could not validate this run. Your score was not published.';
 return pt?'Não foi possível conectar agora. Seu resultado continua nesta tela.':'Could not connect right now. Your result is still on this screen.';
}
export default function ArcadePanels(props){
 return props.session.panel?<ArcadePanelContent key={props.session.panel} {...props}/>:null;
}
function ArcadePanelContent({session,game,lang}){
 const pt=lang==='pt',panelRef=useRef(null),[token,setToken]=useState(''),[widgetError,setWidgetError]=useState(false),[reset,setReset]=useState(0),[name,setName]=useState(()=>{try{return localStorage.getItem('arcade-player-name')||'';}catch{return '';}});
 const {panel,config,busy,error,result}=session;
 useEffect(()=>{if(!panel)return;const previous=document.activeElement,focus=setTimeout(()=>panelRef.current?.querySelector('[data-panel-focus]')?.focus({preventScroll:true}),40);return()=>{clearTimeout(focus);if(previous?.isConnected)previous.focus?.({preventScroll:true});};},[panel]);
 if(!panel)return null;
 const title=panel==='verify'?(pt?'Quem está jogando?':'Who’s playing?'):panel==='publish'?(pt?'Assine seu recorde.':'Put your name on it.'):(pt?'Ranking':'Leaderboard');
 return <section ref={panelRef} data-glass-inner className="arcade-panel" role="region" aria-label={title} onKeyDown={event=>{if(event.key!=='Tab')event.stopPropagation();if(event.key==='Escape'){event.preventDefault();session.close();}}}>
  <header><div><h3>{title}</h3></div><button data-panel-focus onClick={session.close} disabled={busy} aria-label={pt?'Voltar ao jogo':'Back to game'}>×</button></header>
  {config?.mode==='test'&&<p className="arcade-test-label">{pt?'AMBIENTE LOCAL · CAPTCHA E RANKING DE TESTE':'LOCAL ENVIRONMENT · TEST CAPTCHA AND LEADERBOARD'}</p>}
  {panel==='verify'&&<div className="arcade-gate">
   <div className="arcade-player-name"><label htmlFor="arcade-start-name">{pt?'Seu nome no ranking':'Your leaderboard name'}</label><input id="arcade-start-name" value={name} onChange={event=>setName(event.target.value)} maxLength={20} placeholder={pt?'Como você quer aparecer?':'What should we call you?'} autoComplete="nickname" disabled={busy}/><p>{pt?'Seu melhor resultado entra no ranking automaticamente.':'Your best result joins the leaderboard automatically.'}</p></div>
   {!config?<p role="status">{pt?'Preparando a verificação…':'Preparing verification…'}</p>:!config.available?<><p className="arcade-service-note">{config.error==='rate_limited'?friendlyError('rate_limited',pt):(pt?'A verificação está indisponível. Tente novamente em instantes.':'Verification is unavailable. Please try again shortly.')}</p><button className="arcade-secondary" onClick={session.refresh}>{pt?'Tentar conectar':'Try connecting'}</button></>:<>
    <Turnstile key={panel} sitekey={config.sitekey} game={game} lang={lang} onToken={setToken} onError={()=>setWidgetError(true)} reset={reset}/>
    {widgetError&&<button className="arcade-secondary" onClick={()=>{setWidgetError(false);setToken('');setReset(n=>n+1);}}>{pt?'Recarregar verificação':'Reload verification'}</button>}
    <button className="arcade-primary" disabled={!token||!name.trim()||busy} onClick={async()=>{await session.authorize(token,name.trim());setToken('');setReset(n=>n+1);}}>{busy?(pt?'Verificando…':'Verifying…'):(pt?'Entrar na partida':'Enter the game')} <span>↗</span></button>
    <small>{pt?'Só seu apelido e recorde ficam públicos.':'Only your nickname and best score are public.'}</small>
   </>}
  </div>}
  {panel==='publish'&&<form className="arcade-publish" onSubmit={event=>{event.preventDefault();session.publish(name);}}>
   <div className="arcade-score-large"><strong>{session.recording.current?.state.score??0}</strong><span>{pt?'pontos':'points'}</span></div>
   <label htmlFor={`arcade-name-${game}`}>{pt?'Apelido público (opcional)':'Public nickname (optional)'}</label><input id={`arcade-name-${game}`} value={name} onChange={e=>setName(e.target.value)} maxLength={20} placeholder="Crawler" autoComplete="off" disabled={busy}/>
   <p>{pt?'Publicamos apenas seu apelido e recorde. Sem e-mail, cadastro ou localização.':'Only your nickname and score are published. No email, account or location.'}</p>
   <button className="arcade-primary" disabled={busy}>{busy?(pt?'Validando partida…':'Validating run…'):(pt?'Publicar meu recorde':'Publish my score')} <span>↗</span></button>
  </form>}
  {panel==='ranking'&&<>
   <p className="arcade-board-note">{pt?'Uma posição por visitante. Seu melhor resultado fica.':'One position per visitor. Your best run stays.'}</p>
   {result&&<p role="status" className="arcade-saved">{result.rank?`${pt?'Sua posição':'Your position'}: #${result.rank}`:(pt?'Partida validada.':'Run verified.')} · {result.score} pts</p>}
   {!config?.available?<p className="arcade-service-note">{config?.error==='rate_limited'?friendlyError('rate_limited',pt):(pt?'O ranking está indisponível agora.':'The leaderboard is currently unavailable.')}</p>:config.entries?.length?<RankingRows entries={config.entries} personal={config.personal} self={config.self} pt={pt}/>:<div className="arcade-empty"><span>01</span><h4>{pt?'O primeiro lugar está livre.':'First place is waiting.'}</h4><p>{pt?'Jogue e publique seu recorde para estrear o ranking.':'Play and publish your score to open the leaderboard.'}</p></div>}
   <button className="arcade-secondary" onClick={session.refresh}>{pt?'Atualizar ranking':'Refresh leaderboard'}</button>
  </>}
  {error&&<p className="arcade-error" role="alert">{friendlyError(error,pt)}</p>}
 </section>;
}

export function RankingRows({entries,personal,self,pt}){
 const rows=Array.isArray(entries)?entries.slice(0,10):[];
 const outside=personal&&personal.rank>10;
 function row(entry){return <li key={entry.id} className={entry.id===self?'is-you':''}><span>{String(entry.rank).padStart(2,'0')}</span><div><strong>{entry.name}</strong>{entry.id===self&&<small>{pt?'você':'you'}</small>}</div><b>{entry.score.toLocaleString(pt?'pt-BR':'en-US')}</b></li>;}
 return <div className="arcade-board"><ol className="arcade-ranking">{rows.map(row)}</ol>{outside&&<><div className="arcade-ranking-gap" aria-hidden="true">···</div><ol className="arcade-ranking arcade-ranking-personal" start={personal.rank}>{row(personal)}</ol></>}</div>;
}
