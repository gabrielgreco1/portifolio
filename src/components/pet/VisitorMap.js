"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {useGlassDialog} from '../crawler/useGlassDialog';
import {VisitorActivity,GoogleHistoryNote} from './VisitorInsights';
import googleHistory from '../../data/visitor-history.json';
import {mapPoints,pointText,recordedVisits} from '../../lib/visitors/map-points.mjs';
import CrawlerArtwork from '../CrawlerArtwork';
import VisitorGlobe from './VisitorGlobe';
import './visitor-map.css';

export default function VisitorMap({open,onClose,lang}){
 const ref=useRef(null),trigger=useRef(null),reduced=useReducedMotion(),pt=lang==='pt',locale=pt?'pt-BR':'en-US';
 const [data,setData]=useState(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0),[exploring,setExploring]=useState(false),[query,setQuery]=useState(''),[selectedId,setSelectedId]=useState(null),[limit,setLimit]=useState(60);
 const display=useMemo(()=>new Intl.DisplayNames([lang],{type:'region'}),[lang]);
 const countryName=useCallback(code=>{try{return code?display.of(code):pt?'País não informado':'Country not reported';}catch{return code;}},[display,pt]);
 const format=n=>Number(n||0).toLocaleString(locale);
 useGlassDialog(open,ref,onClose,reduced);
 useEffect(()=>{
  if(!open)return;const controller=new AbortController();let busy=false;
  async function refresh(){if(document.hidden||busy)return;busy=true;try{const response=await fetch('/api/visitors',{signal:controller.signal});if(!response.ok)throw Error('offline');const next=await response.json();if(!next.available)throw Error('unavailable');setData(next);setFailed(false);}catch{if(!controller.signal.aborted)setFailed(true);}finally{busy=false;}}
  void refresh();const interval=setInterval(refresh,15000);document.addEventListener('visibilitychange',refresh);return()=>{controller.abort();clearInterval(interval);document.removeEventListener('visibilitychange',refresh);};
 },[open,retry]);
 const points=useMemo(()=>mapPoints(googleHistory.points,(data?.points||[]).map(point=>failed?{...point,active:0}:point)).map(p=>({...p,label:`${pt?'Cidade':'City'}: ${p.city==='(not set)'?(pt?'Cidade não informada':'City not reported'):p.city} · ${pt?'Estado/região':'State/region'}: ${p.regionDisplay||p.region|| (pt?'Estado/região não informado':'State/region not reported')} · ${pt?'País':'Country'}: ${countryName(p.country)} — ${pointText(p,lang)}`})),[data,failed,lang,pt,countryName]);
 const selected=points.find(p=>p.id===selectedId);
 const select=useCallback(point=>{setSelectedId(point.id);setExploring(true);},[]);
 const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const filtered=points.filter(p=>normalize(p.label).includes(normalize(query)));
 const cities=points.filter(p=>p.city!=='(not set)').length;
 function closeExplorer(){setExploring(false);requestAnimationFrame(()=>trigger.current?.focus());}
 return <AnimatePresence>{open&&<><motion.div className="pet-panel-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
 <motion.section ref={ref} role="dialog" aria-modal="true" aria-labelledby="visitor-map-title" className={`visitor-map visitor-map--unified ${exploring?'is-exploring':''}`} initial={{opacity:0,y:16,scale:reduced?1:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8}} transition={{duration:.25}}>
  <header className="visitor-header"><div><h2 id="visitor-map-title">{pt?'O mundo por aqui.':'The world, right here.'}</h2><p>{pt?'Quem chegou. Quem está agora.':'Who has visited. Who is here now.'}</p></div><button className="visitor-close" data-modal-close onClick={onClose} aria-label={pt?'Fechar mapa':'Close map'}>×</button></header>
  <div className="visitor-observatory">
   <VisitorGlobe points={points} selected={selected} onSelect={point=>setSelectedId(point?.id||null)} countryName={countryName} lang={lang} reduced={reduced}/>
   <div className="visitor-summary">
    <div className={`visitor-online ${failed||!data?'is-unavailable':''}`}><i/><strong>{data&&!failed?format(data.active):'—'}</strong><span>{failed?(pt?'ao vivo indisponível':'live unavailable'):(pt?'online agora':'online now')}<small>{data?.mode==='local'?(pt?'Ambiente local':'Local environment'):pt?'Atualiza a cada 15 segundos':'Updates every 15 seconds'}</small></span></div>
    <div className="visitor-total"><strong>{format(recordedVisits(googleHistory,data))}</strong><span>{pt?'visitas registradas':'recorded visits'}<small>{pt?'Histórico completo + novas visitas':'Full history + new visits'}</small></span></div>
    <p className="visitor-coverage">{format(cities)} {pt?'localidades no mapa':'locations on the map'}</p>
    <div className="visitor-legend"><span><i className="is-live"/>{pt?'Online agora':'Online now'}</span><span><i/>{pt?'Já passou por aqui':'Visited before'}</span></div>
    <button ref={trigger} className="visitor-explore" aria-expanded={exploring} aria-controls="visitor-explorer" onClick={()=>setExploring(v=>!v)}>{pt?'Ver todas as cidades':'Browse all cities'} <span aria-hidden="true">↗</span></button>
    {failed&&<p className="visitor-connection-notice" role="status">{pt?'Ao vivo indisponível. Histórico preservado.':'Live connection unavailable. History preserved.'} <button onClick={()=>setRetry(v=>v+1)}>{pt?'Reconectar':'Reconnect'}</button></p>}
   </div>
   <div className="visitor-guide"><CrawlerArtwork/><span><strong>{pt?'Arraste para explorar.':'Drag to explore.'}</strong><small>{pt?'Passe o mouse para identificar. Clique para manter a ficha aberta.':'Tap a pin to discover its city. Approximate location, never GPS.'}</small></span></div>
   {exploring&&<aside id="visitor-explorer" className="visitor-locations" aria-label={pt?'Cidades e visitas':'Cities and visits'}>
    <div className="visitor-explorer-heading"><h3>{pt?'Conexões pelo mundo':'Connections around the world'}</h3><button onClick={closeExplorer} aria-label={pt?'Fechar explorador':'Close explorer'}>×</button></div>
    <label className="visitor-city-search"><span className="sr-only">{pt?'Buscar cidade, estado ou país':'Find city, state or country'}</span><input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(60);}} placeholder={pt?'Cidade, estado ou país':'City, state or country'}/></label>
    {selected&&<section className="visitor-city-detail" aria-label={pt?'Detalhes da cidade':'City details'}><header><span>{pt?'Cidade selecionada':'Selected city'}</span><button onClick={()=>setSelectedId(null)} aria-label={pt?'Limpar seleção':'Clear selection'}>×</button></header><h3>{selected.city==='(not set)'?(pt?'Cidade não informada':'City not reported'):selected.city}</h3><dl className="visitor-place-fields"><div><dt>{pt?'Estado / região':'State / region'}</dt><dd>{selected.regionDisplay||selected.region||(pt?'Não informado':'Not reported')}</dd></div><div><dt>{pt?'País':'Country'}</dt><dd>{countryName(selected.country)}</dd></div></dl><p className="visitor-city-counts">{pointText(selected,lang)}</p>{(!Number.isFinite(selected.latitude)||!Number.isFinite(selected.longitude))&&<p className="visitor-city-counts">{pt?'Coordenadas não confirmadas. Registro preservado, sem ponto no globo.':'Coordinates not confirmed. Record preserved, without a map pin.'}</p>}<small>{pt?'O total inclui o saldo histórico e as novas visitas. Online mostra apenas a presença atual.':'The total includes the historical opening balance and new visits. Online shows current presence only.'}</small></section>}
    <div className="visitor-city-list">{filtered.slice(0,limit).map(p=><button key={p.id} aria-pressed={selectedId===p.id} onClick={()=>select(p)}><span className={`visitor-city-dot ${p.active?'is-live':''}`}/><span><strong>{p.city==='(not set)'?(pt?'Cidade não informada':'City not reported'):p.city}</strong><small>{p.regionDisplay||p.region?`${p.regionDisplay||p.region} · `:''}{countryName(p.country)}</small><span className="visitor-row-count">{pointText(p,lang)}</span></span><b aria-hidden="true">↗</b></button>)}</div>
    {filtered.length>limit&&<button className="visitor-more" onClick={()=>setLimit(v=>v+60)}>{pt?'Mostrar mais cidades':'Show more cities'} ({format(filtered.length-limit)})</button>}
    {!filtered.length&&<p className="visitor-search-empty">{pt?'Nenhuma cidade corresponde à busca.':'No city matches your search.'}</p>}
    <details className="visitor-provenance"><summary>{pt?'Sobre os registros':'About the records'}</summary><p>{pt?'Um único registro reúne o saldo importado do Google até 08/10/2026 e as visitas da coleta própria a partir de 09/10/2026. O saldo é incorporado uma vez; atualizar o mapa não o soma novamente. Verde indica presença nos últimos 90 segundos.':'One ledger combines the Google opening balance through Oct 8, 2026 and our own collection from Oct 9, 2026. The balance is included once; refreshing the map never adds it again. Green indicates presence within the last 90 seconds.'}</p><GoogleHistoryNote data={googleHistory} lang={lang}/><VisitorActivity data={data} lang={lang}/><a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames · CC BY 4.0</a></details>
   </aside>}
  </div>
 </motion.section></>}</AnimatePresence>;
}
