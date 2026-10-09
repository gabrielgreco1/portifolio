"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AnimatePresence,animate,motion,useReducedMotion} from 'framer-motion';
import {geoDistance,geoGraticule10,geoOrthographic,geoPath} from 'd3-geo';
import {feature,mesh} from 'topojson-client';
import atlas from 'world-atlas/countries-110m.json';
import {useGlassDialog} from '../crawler/useGlassDialog';
import {VisitorActivity,VisitorCityDetail,GoogleCityDetail,GoogleHistoryNote} from './VisitorInsights';
import googleHistory from '../../data/visitor-history.json';
import CrawlerArtwork from '../CrawlerArtwork';
import './visitor-map.css';

const land=feature(atlas,atlas.objects.land),borders=mesh(atlas,atlas.objects.countries,(a,b)=>a!==b),graticule=geoGraticule10();
const copy={pt:{title:'Pequeno mundo. Conexões reais.',eyebrow:'TAMAGOTCHI / SINAIS DO MUNDO',live:'Agora',history:'Desde o início',active:'por aqui agora',visits:'visitas registradas',places:'cidades',close:'Fechar mapa',drag:'Arraste o planeta para explorar',unknown:'sem localização',none:'Nenhum sinal localizado neste momento.',noHistory:'Ainda não há visitas com cidade identificada.',offline:'Não consegui alcançar o mapa.',retry:'Tentar novamente',loading:'Buscando os sinais reais…',since:'Histórico desde',privacy:'Localização aproximada por IP. Pontos agrupados por cidade.',window:'Presença nos últimos 90 segundos.',local:'Ambiente local · somente acessos deste preview',details:'Sobre os sinais',detailText:'Cada sessão conta uma visita. Uma nova visita é contada após 30 minutos sem atividade. A presença é atualizada enquanto a aba está visível. Não armazenamos IPs nem localização GPS. Os sinais individuais usam identificadores temporários, sem nomes. Visitas anteriores à ativação deste registro não estão incluídas.',center:'Voltar ao Brasil',zoomIn:'Aproximar',zoomOut:'Afastar',locationList:'Cidades com visitas',unavailable:'A conexão está indisponível. Os números anteriores foram preservados.',liveTag:'AO VIVO',localTag:'LOCAL',waiting:'AGUARDANDO',updated:'Atualizado'},en:{title:'Small world. Real connections.',eyebrow:'TAMAGOTCHI / SIGNALS FROM THE WORLD',live:'Now',history:'Since the beginning',active:'here right now',visits:'recorded visits',places:'cities',close:'Close map',drag:'Drag the planet to explore',unknown:'without location',none:'No located signals right now.',noHistory:'No visits with an identified city yet.',offline:'Could not reach the map.',retry:'Try again',loading:'Fetching real signals…',since:'History since',privacy:'Approximate IP location. Points grouped by city.',window:'Presence within the last 90 seconds.',local:'Local environment · visits to this preview only',details:'About the signals',detailText:'Each session counts as one visit. Another visit is counted after 30 minutes of inactivity. Presence updates while the tab is visible. We store neither IP addresses nor GPS locations. Individual signals use temporary identifiers without names. Visits before this record was activated are not included.',center:'Return to Brazil',zoomIn:'Zoom in',zoomOut:'Zoom out',locationList:'Cities with visits',unavailable:'The connection is unavailable. Previous numbers have been preserved.',liveTag:'LIVE',localTag:'LOCAL',waiting:'WAITING',updated:'Updated'}};

export default function VisitorMap({open,onClose,lang}){
  const ref=useRef(null),reduced=useReducedMotion(),w=copy[lang],pt=lang==='pt';
  const [liveData,setData]=useState(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0),[mode,setMode]=useState('live');
  const [listMode,setListMode]=useState('cities'),[query,setQuery]=useState(''),[selectedSignal,setSelectedSignal]=useState(null);
  const google=mode==='google',data=google?googleHistory:liveData;
  const historyLabel='Google Analytics';
  const countLabel=google?(pt?'usuários ativos':'active users'):w.visits;
  const cityLabel=point=>point.city==='(not set)'?(pt?'Cidade não informada':'City not reported'):point.city;
  const hasLocation=point=>Number.isFinite(point.latitude)&&Number.isFinite(point.longitude);
  const count=point=>google?point.activeUsers:mode==='live'?point.active:point.visits;
  const pointers=useRef(new Map());
  const [rotation,setRotation]=useState([48,15,0]),[zoom,setZoom]=useState(1),[selected,setSelected]=useState(null);
  const drag=useRef(null),turn=useRef(null);
  useGlassDialog(open,ref,onClose,reduced);
  useEffect(()=>{
    if(!open)return;
    const controller=new AbortController();let busy=false;
    const refresh=async()=>{
      if(document.hidden||busy)return;busy=true;
      try{const response=await fetch('/api/visitors',{signal:controller.signal});if(!response.ok)throw new Error('offline');const next=await response.json();if(!next.available)throw new Error('unavailable');setData(next);setFailed(false);}
      catch{if(!controller.signal.aborted)setFailed(true);}finally{busy=false;}
    };
    void refresh();const interval=setInterval(refresh,15000);document.addEventListener('visibilitychange',refresh);
    return()=>{controller.abort();clearInterval(interval);document.removeEventListener('visibilitychange',refresh);};
  },[open,retry]);
  useEffect(()=>()=>turn.current?.stop(),[]);
  const projection=useMemo(()=>geoOrthographic().translate([360,296]).scale(234*zoom).rotate(rotation).clipAngle(90),[rotation,zoom]);
  const center=projection.invert([360,296]);
  const path=geoPath(projection),points=(data?.points||[]).filter(p=>mode!=='live'||p.active>0);
  const locale=pt?'pt-BR':'en-US',format=n=>new Intl.NumberFormat(locale).format(n);
  const countries=useMemo(()=>new Intl.DisplayNames([lang],{type:'region'}),[lang]);
  const selectedPoint=(data?.points||[]).find(p=>p.id===selected),signal=(data?.signals||[]).find(s=>s.id===selectedSignal);
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const countryName=code=>{if(!code)return pt?'País não informado':'Country not reported';try{return countries.of(code);}catch{return code;}};
  const filteredPoints=points.filter(p=>normalize(`${cityLabel(p)} ${p.country||''} ${countryName(p.country)}`).includes(normalize(query)));
  const countryCount=new Set(points.map(p=>p.country).filter(Boolean)).size;
  const rotateTo=useCallback(next=>{
    turn.current?.stop();const from=rotation;
    const target=[next[0]+Math.round((from[0]-next[0])/360)*360,next[1],0];
    turn.current=animate(0,1,{duration:reduced?.01:.8,ease:[.22,1,.36,1],onUpdate:t=>setRotation(from.map((value,i)=>value+(target[i]-value)*t))});
  },[rotation,reduced]);
  function focusPoint(point){setSelectedSignal(null);setSelected(point.id);if(hasLocation(point))rotateTo([-point.longitude,-point.latitude,0]);}
  function focusSignal(signal){const point=data.points.find(p=>p.id===signal.cityId);setSelected(point?.id||null);setSelectedSignal(signal.id);if(point)rotateTo([-point.longitude,-point.latitude,0]);}
  function startDrag(event){
    if(event.button!==0)return;turn.current?.stop();pointers.current.set(event.pointerId,[event.clientX,event.clientY]);
    const contacts=[...pointers.current.values()];
    if(contacts.length===2){drag.current={pinch:true,distance:Math.hypot(contacts[1][0]-contacts[0][0],contacts[1][1]-contacts[0][1]),zoom,moved:true,active:true};for(const id of pointers.current.keys())event.currentTarget.setPointerCapture(id);}
    else if(contacts.length===1)drag.current={x:event.clientX,y:event.clientY,rotation,moved:false,active:true};
  }
  function moveDrag(event){
    if(!drag.current?.active||!pointers.current.has(event.pointerId))return;pointers.current.set(event.pointerId,[event.clientX,event.clientY]);
    if(drag.current.pinch){const contacts=[...pointers.current.values()];if(contacts.length===2&&drag.current.distance>0)setZoom(Math.max(.8,Math.min(1.8,drag.current.zoom*Math.hypot(contacts[1][0]-contacts[0][0],contacts[1][1]-contacts[0][1])/drag.current.distance)));return;}
    const dx=event.clientX-drag.current.x,dy=event.clientY-drag.current.y;if(Math.hypot(dx,dy)>4){drag.current.moved=true;event.currentTarget.setPointerCapture(event.pointerId);}setRotation([drag.current.rotation[0]+dx*.3/zoom,Math.max(-80,Math.min(80,drag.current.rotation[1]-dy*.3/zoom)),0]);
  }
  function endDrag(event){pointers.current.delete(event.pointerId);if(drag.current)drag.current.active=false;}

  function changeMode(next){setMode(next);setSelected(null);setSelectedSignal(null);setQuery('');setListMode('cities');}
  const status=google?'GA4':data?(data.mode==='local'?w.localTag:w.liveTag):w.waiting;
  return <AnimatePresence>{open&&<>
    <motion.div className="pet-panel-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
    <motion.section ref={ref} role="dialog" aria-modal="true" aria-labelledby="visitor-map-title" className="visitor-map" initial={{opacity:0,scale:reduced?1:.86,y:24,filter:'blur(8px)'}} animate={{opacity:1,scale:1,y:0,filter:'blur(0px)'}} exit={{opacity:0,scale:.94,y:12}} transition={{duration:.38,ease:[.2,.8,.2,1]}}>
      <header className="visitor-header"><div><span className="visitor-eyebrow">{w.eyebrow}</span><h2 id="visitor-map-title">{w.title}</h2></div><button className="visitor-close" data-modal-close onClick={onClose} aria-label={w.close}>×</button></header>
      <div className="visitor-scroll">
        <div className="visitor-numbers">{google?<><div><strong>{format(data.reportedTotals.activeUsers)}</strong><span>{countLabel}</span></div><div><strong>{format(countryCount)}</strong><span>{pt?'países':'countries'}</span></div><div><strong>{format(points.filter(p=>p.city!=='(not set)').length)}</strong><span>{w.places}</span></div></>:<><div><strong>{data?format(data.active):'—'}</strong><span><i className={data&&!failed?'signal-live':''}/>{w.active}</span></div><div><strong>{data?format(data.total):'—'}</strong><span>{w.visits}</span></div><div><strong>{data?format(data.points.length):'—'}</strong><span>{w.places}</span></div></>}<span className={`visitor-status ${failed&&!google?'visitor-status--offline':''}`}>{failed&&!google?'OFFLINE':status}</span></div>
        <div className="visitor-toolbar"><div className="visitor-segment" role="group" aria-label={pt?'Período do mapa':'Map period'}><button aria-pressed={mode==='live'} onClick={()=>changeMode('live')}>{w.live}</button><button aria-pressed={mode==='history'} onClick={()=>changeMode('history')}>{w.history}</button><button aria-pressed={google} onClick={()=>changeMode('google')}>{historyLabel}</button></div><span>{w.drag}</span></div>
        {google&&<GoogleHistoryNote data={data} lang={lang}/>}
        <div className="visitor-observatory">
          <div className="visitor-globe">
            <div className="visitor-globe-coordinate" aria-hidden="true">{Math.abs(center[1]).toFixed(1)}° {center[1]>=0?'N':'S'} &nbsp; / &nbsp; {Math.abs(center[0]).toFixed(1)}° {center[0]>=0?'E':'W'}</div>
            <svg viewBox="0 0 720 600" tabIndex="0" onKeyDown={event=>{const direction={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,12],ArrowDown:[0,-12]}[event.key];if(direction){event.preventDefault();setRotation(r=>[r[0]+direction[0],Math.max(-80,Math.min(80,r[1]+direction[1])),0]);}}} aria-label={pt?'Globo interativo de visitas':'Interactive visitor globe'} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
              <defs><radialGradient id="planet-ocean" cx="35%" cy="27%" r="75%"><stop stopColor="#203f38"/><stop offset=".65" stopColor="#112721"/><stop offset="1" stopColor="#071411"/></radialGradient><radialGradient id="planet-light" cx="30%" cy="25%" r="78%"><stop stopColor="#c6eaa0" stopOpacity=".14"/><stop offset=".6" stopColor="#bbddb1" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".55"/></radialGradient><pattern id="planet-dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".7" fill="#afd6a6" opacity=".46"/></pattern><clipPath id="planet-clip"><path d={path({type:'Sphere'})}/></clipPath><clipPath id="land-clip"><path d={path(land)}/></clipPath><filter id="signal-glow"><feGaussianBlur stdDeviation="4"/></filter></defs>
              <circle className="planet-halo" cx="360" cy="296" r={246*zoom} fill="none" stroke="#c4efb7" strokeOpacity=".05" strokeWidth="12"/>
              <path d={path({type:'Sphere'})} fill="url(#planet-ocean)" stroke="#9ac597" strokeOpacity=".28"/>
              <g clipPath="url(#planet-clip)" pointerEvents="none"><path d={path(graticule)} fill="none" stroke="#8ebcaa" strokeWidth=".6" opacity=".16"/><path d={path(land)} fill="#4c7051" fillOpacity=".43" stroke="#91b78a" strokeWidth=".5" strokeOpacity=".4"/><rect width="720" height="600" fill="url(#planet-dots)" clipPath="url(#land-clip)"/><path d={path(borders)} fill="none" stroke="#b5d3a2" strokeOpacity=".17" strokeWidth=".5"/><path d={path({type:'Sphere'})} fill="url(#planet-light)"/></g>
              {points.filter(p=>hasLocation(p)&&geoDistance([p.longitude,p.latitude],projection.invert([360,296]))<Math.PI/2).map(p=>{const [x,y]=projection([p.longitude,p.latitude]),value=count(p),r=google?1.8+Math.min(4,Math.log2(value+1)*.8):3+Math.min(5,Math.log2(value+1));return <g key={p.id} transform={`translate(${x},${y})`} className={`visitor-point ${selected===p.id?'visitor-point--selected':''}`} role="button" tabIndex="0" aria-label={`${cityLabel(p)}, ${countryName(p.country)}: ${format(value)} ${mode==='live'?w.active:countLabel}`} onClick={e=>{e.stopPropagation();if(!drag.current?.moved)focusPoint(p);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();focusPoint(p);}}}><circle r="20" fill="transparent"/><circle r={r*2} fill="#cafaad" opacity={google?.2:.36} filter="url(#signal-glow)"/><circle className={p.active?'signal-ring':''} r={r+5} fill="none" stroke="#c9f8ae" strokeOpacity={google?(selected===p.id?.8:0):.45}/><circle r={r} fill={selected===p.id?'#fff':'#c9f8ae'} stroke="#132d22" strokeWidth="1.5"/></g>;})}
            </svg>
            <div className="visitor-map-controls"><button onClick={()=>setZoom(z=>Math.min(1.8,z+.2))} disabled={zoom>=1.8} aria-label={w.zoomIn}>+</button><button onClick={()=>setZoom(z=>Math.max(.8,z-.2))} disabled={zoom<=.8} aria-label={w.zoomOut}>−</button><button onClick={()=>{rotateTo([48,15,0]);setZoom(1);}} aria-label={w.center}>⌖</button></div>
            <div className="visitor-guide"><CrawlerArtwork/><span>{selectedPoint?<><strong>{cityLabel(selectedPoint)}</strong><small>{countryName(selectedPoint.country)} · {format(google?selectedPoint.activeUsers:selectedPoint.visits)} {countLabel}</small></>:<><strong>{pt?'Rastreando conexões.':'Tracing connections.'}</strong><small>{google?(pt?'Histórico do Google · centros aproximados das cidades':'Google history · approximate city centers'):w.privacy}</small></>}</span></div>
          </div>
          <aside className="visitor-locations" aria-label={w.locationList}>
            <div className="visitor-list-tabs" role="group" aria-label={pt?'Explorar conexões':'Explore connections'}><button aria-pressed={listMode==='cities'||mode!=='live'} onClick={()=>setListMode('cities')}>{pt?'Cidades':'Cities'}</button>{!google&&<button disabled={mode!=='live'} aria-pressed={listMode==='signals'&&mode==='live'} onClick={()=>setListMode('signals')}>{pt?'Sinais agora':'Signals now'} <b>{data?format(data.active):'—'}</b></button>}</div>
            {google?<GoogleCityDetail point={selectedPoint} lang={lang} countryName={countryName} onClear={()=>setSelected(null)}/>:<VisitorCityDetail point={selectedPoint} signal={signal} data={data} lang={lang} countryName={countryName} onClear={()=>{setSelected(null);setSelectedSignal(null);}}/>}
            {(listMode==='cities'||mode!=='live')&&<label className="visitor-city-search"><span className="sr-only">{pt?'Buscar cidade ou país':'Search city or country'}</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={pt?'Buscar cidade ou país…':'Find a city or country…'}/></label>}
            <header><span>{google?countLabel:mode==='live'?w.live:w.history}</span><span>{format(countryCount)} {pt?'países':'countries'}</span></header>
            {data&&points.length===0&&(listMode==='cities'||mode!=='live')&&<div className="visitor-empty"><span className="visitor-empty-orbit" aria-hidden="true">◎</span><p>{mode==='live'?w.none:w.noHistory}</p>{(mode==='live'?data.unlocatedActive:data.unlocated)>0&&<small>{format(mode==='live'?data.unlocatedActive:data.unlocated)} {w.unknown}</small>}</div>}
            {!data&&<div className="visitor-empty" role="status"><span className="visitor-empty-orbit" aria-hidden="true">◎</span><p>{failed?w.offline:w.loading}</p>{failed&&<button onClick={()=>{setFailed(false);setRetry(n=>n+1);}}>{w.retry} ↗</button>}</div>}
            {listMode==='signals'&&mode==='live'?<div className="visitor-signal-list">
              {(data?.signals||[]).map(item=>{const place=data.points.find(p=>p.id===item.cityId);return <button key={item.id} aria-pressed={selectedSignal===item.id} onClick={()=>focusSignal(item)}><i/><span><strong>{pt?'Sinal':'Signal'} {item.id.slice(0,6).toUpperCase()}</strong><small>{place?`${place.city} · ${place.country}`:w.unknown}</small></span><b>↗</b></button>;})}
              {data&&!data.signals?.length&&<p>{pt?'Nenhuma sessão ativa agora.':'No active sessions right now.'}</p>}
              {data?.active>100&&<p>{pt?'Mostrando os 100 sinais mais recentes.':'Showing the latest 100 signals.'}</p>}
            </div>:<>
            <div className="visitor-city-list">{filteredPoints.map(p=><button key={p.id} aria-pressed={selected===p.id} onClick={()=>focusPoint(p)}><span className="visitor-country">{p.country||'—'}</span><span><strong>{cityLabel(p)}</strong><small>{countryName(p.country)}{google&&!hasLocation(p)?(pt?' · sem ponto':' · no pin'):''}</small></span><b>{format(count(p))}</b></button>)}</div>
              {data&&query&&filteredPoints.length===0&&<p className="visitor-search-empty">{pt?'Nenhuma cidade corresponde à busca.':'No city matches your search.'}</p>}
            </>}

            {data&&points.length>0&&(mode==='live'?data.unlocatedActive:data.unlocated)>0&&<p className="visitor-unlocated">+ {format(mode==='live'?data.unlocatedActive:data.unlocated)} {w.unknown}</p>}
          </aside>
        </div>
        {!google&&<VisitorActivity data={data} lang={lang}/>}
        {google?<footer className="visitor-footer"><div><span>{pt?'Fonte: Google Analytics 4 · gabrielgreco.com':'Source: Google Analytics 4 · gabrielgreco.com'}</span><small>{pt?'Retrato histórico consultado em 09/10/2026. Sem atualização automática.':'Historical snapshot retrieved on Oct 9, 2026. No automatic refresh.'}</small></div><a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames · CC BY 4.0 ↗</a></footer>:<footer className="visitor-footer"><div><span>{data?.startedAt?`${w.since} ${new Date(data.startedAt).toLocaleDateString(locale)}`:w.loading}</span><small>{data?.mode==='local'?w.local:w.window}</small><small>{data?.updatedAt?`${w.updated} ${new Date(data.updatedAt).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`:''}</small></div><details><summary>{w.details}</summary><p>{w.detailText}</p><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth · {pt?'cartografia':'cartography'} ↗</a></details></footer>}
        {failed&&data&&!google&&<p className="visitor-connection-notice" role="status">{w.unavailable} <button onClick={()=>setRetry(n=>n+1)}>{w.retry}</button></p>}
      </div>
    </motion.section>
  </>}</AnimatePresence>;
}
