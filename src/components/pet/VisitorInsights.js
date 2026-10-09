"use client";
import {useEffect,useRef,useState} from 'react';

export function VisitorActivity({data,lang}){
  const pt=lang==='pt',locale=pt?'pt-BR':'en-US',hours=data?.activity||[],[selected,setSelected]=useState(null);
  const bars=useRef(null);
  useEffect(()=>{if(bars.current)bars.current.scrollLeft=bars.current.scrollWidth;},[hours.length]);
  const hour=hours.find(h=>h.at===selected),known=hours.filter(h=>h.visits!==null),max=Math.max(1,...known.map(h=>h.visits));
  const time=value=>new Date(value).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'});
  return <section className="visitor-activity" aria-label={pt?'Chegadas nas últimas 24 horas':'Arrivals over the last 24 hours'}>
    <header><div><span>{pt?'O RITMO DAS CHEGADAS':'THE RHYTHM OF ARRIVALS'}</span><strong>{hour?`${time(hour.at)} · ${hour.visits===null?(pt?'sem cobertura':'no coverage'):`${hour.visits} ${pt?'visitas':'visits'}`}${hour.partial?(pt?' · hora parcial':' · partial hour'):''}`:pt?'Cada barra, uma hora.':'Each bar, one hour.'}</strong></div><small>{pt?'24 HORAS':'24 HOURS'}</small></header>
    <div ref={bars} className="visitor-hour-bars">{hours.map(h=><button key={h.at} type="button" className={`${h.visits===null?'is-unobserved':''}${selected===h.at?' is-selected':''}`} style={{'--bar':`${Math.max(3,(h.visits||0)/max*100)}%`}} aria-pressed={selected===h.at} aria-label={`${time(h.at)}: ${h.visits===null?(pt?'sem cobertura':'no coverage'):`${h.visits} ${pt?'visitas':'visits'}`}${h.partial?(pt?', hora parcial':', partial hour'):''}`} onFocus={()=>setSelected(h.at)} onClick={()=>setSelected(h.at)}><i/></button>)}</div>
    <footer><span>{hours[0]?time(hours[0].at):'—'}</span><span>{data?.activityStartedAt?(pt?'Novas sessões · horas sem cobertura ficam vazias':'New sessions · hours without coverage stay empty'):(pt?'Aguardando o primeiro registro real':'Waiting for the first real record')}</span><span>{pt?'agora':'now'}</span></footer>
  </section>;
}

export function VisitorCityDetail({point,signal,data,lang,countryName,onClear}){
  const pt=lang==='pt',locale=pt?'pt-BR':'en-US';
  if(!point&&!signal)return null;
  const date=value=>value?new Date(value).toLocaleString(locale,{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—';
  const percent=point&&data.total?new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:1}).format(point.visits/data.total):null;
  return <section className="visitor-city-detail" aria-label={pt?'Detalhes do sinal':'Signal details'}>
    <header><span>{signal?`${pt?'SINAL':'SIGNAL'} / ${signal.id.slice(0,6).toUpperCase()}`:pt?'CONEXÃO SELECIONADA':'SELECTED CONNECTION'}</span><button onClick={onClear} aria-label={pt?'Limpar seleção':'Clear selection'}>×</button></header>
    <h3>{point?.city||(pt?'Localização indisponível':'Location unavailable')}</h3><p>{point?countryName(point.country):(pt?'A visita existe. A cidade não foi identificada.':'The visit exists. Its city was not identified.')}</p>
    {point&&<dl className="visitor-detail-metrics"><div><dt>{pt?'visitas':'visits'}</dt><dd>{point.visits.toLocaleString(locale)}</dd></div><div><dt>{pt?'agora':'now'}</dt><dd>{point.active}</dd></div><div><dt>{pt?'do total':'of total'}</dt><dd>{percent}</dd></div></dl>}
    <dl className="visitor-detail-times"><div><dt>{signal?(pt?'Observado desde':'Observed since'):(pt?'Primeiro sinal monitorado':'First monitored signal')}</dt><dd>{date(signal?.observedSince||point?.firstSeen)}</dd></div><div><dt>{pt?'Último sinal':'Last signal'}</dt><dd>{date(signal?.lastSeen||point?.lastSeen)}</dd></div></dl>
    <small>{signal?(pt?'Identificador temporário de uma sessão, sem nome ou IP.':'Temporary session identifier, without name or IP.'):(pt?'O ponto representa uma cidade. Visitas não equivalem a pessoas únicas.':'The point represents a city. Visits are not unique people.')}</small>
  </section>;
}
