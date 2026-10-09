"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import {AnimatePresence,motion,useIsPresent} from 'framer-motion';
import {downloadFile,exportName} from '@/lib/crawler/collection.mjs';
import {collectionDocument} from '@/lib/crawler/document.mjs';
import {useGlassDialog} from './useGlassDialog';
import DeliveryReceipt from './DeliveryReceipt';
import './delivery.css';

function PagePreview({page,width,height,index}){
 return <svg className="document-page" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`PDF / ${index+1}`}>
  <rect width={width} height={height} fill="white"/>
  {page.map((op,i)=>op.kind==='text'?<text key={i} x={op.x} y={op.y+op.size} fill={op.color} fontSize={op.size} fontFamily={op.font==='serif'?'Times New Roman, serif':'Arial, sans-serif'} fontWeight={op.font==='bold'?700:400} textLength={op.width||undefined} lengthAdjust="spacingAndGlyphs">{op.text}</text>:op.kind==='line'?<line key={i} x1={op.x} x2={op.x+op.width} y1={op.y} y2={op.y} stroke={op.color} strokeWidth=".5"/>:op.kind==='image'?<image key={i} href={op.url} x={op.x} y={op.y} width={op.width} height={op.height}/>:null)}
 </svg>;
}
function DeliveryPanel({collection,words,onClose,onNew,layout,origin,reduced,onSource,externalNotice}){
 const panel=useRef(null),[mode,setMode]=useState('document'),[report,setReport]=useState(null),[pdfError,setPdfError]=useState(false),[retry,setRetry]=useState(0),[zoom,setZoom]=useState(false),[pageIndex,setPageIndex]=useState(0),[receipt,setReceipt]=useState(null),[notice,setNotice]=useState(''),[trace,setTrace]=useState(false);
 const present=useIsPresent();
 const pt=collection.page.language==='pt';
 const doc=useMemo(()=>({records:collection.records,...collection}),[collection]);
 const json=useMemo(()=>JSON.stringify(doc,null,2),[doc]);
 const clean=useMemo(()=>JSON.stringify({records:doc.records.map(({id,type,fields})=>({id,type,...fields}))},null,2),[doc]);
 const model=useMemo(()=>collectionDocument(doc),[doc]);
 useGlassDialog(present,panel,onClose,reduced);
 useEffect(()=>{let active=true;import('@/lib/crawler/pdf.mjs').then(({prepareCollectionPdf})=>prepareCollectionPdf(doc)).then(result=>{if(active){setReport(result);setPdfError(false);}},()=>{if(active)setPdfError(true);});return()=>{active=false;};},[doc,retry]);
 async function showReceipt(format,bytes){
  const next={id:Date.now(),format,bytes,filename:exportName(doc,format),fragments:doc.evidence.length,records:doc.records.length};setReceipt(next);
  try{const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(json));setReceipt(current=>current?.id===next.id?{...next,hash:Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}:current);}catch{}
 }
 function download(){if(mode==='document'&&report){downloadFile(report.bytes,exportName(doc,'pdf'),'application/pdf');void showReceipt('pdf',report.bytes.length);}else if(mode==='json'){downloadFile(json,exportName(doc,'json'),'application/json');void showReceipt('json',new TextEncoder().encode(json).length);}}
 async function copy(){try{await navigator.clipboard.writeText(json);setNotice(pt?'JSON completo copiado.':'Complete JSON copied.');}catch{setNotice(words.copyFailure);}}
 const valid=collection.coverage.requested_complete;
 return <>
  <motion.div className="glass-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
  <motion.section ref={panel} className="glass-inspector glass-inspector--result collection-delivery" role="dialog" aria-modal="true" aria-labelledby="collection-title" style={{'--collection-left':`${layout.left}px`,'--collection-top':`${layout.top}px`,'--collection-width':`${layout.width}px`,'--collection-height':`${layout.height}px`,transformOrigin:`${origin.x-layout.left}px ${origin.y-layout.top}px`}} initial={{opacity:0,scale:reduced?1:.045,filter:reduced?'none':'blur(7px)'}} animate={{opacity:1,scale:1,filter:'blur(0px)'}} exit={{opacity:0,scale:reduced?1:.96}} transition={{duration:reduced?.1:.85,ease:[.22,1,.36,1]}}>
   <header className="delivery-header glass-header"><div><span className="delivery-eyebrow">{valid?(pt?'MISSÃO CUMPRIDA':'MISSION COMPLETE'):(pt?'COLETA PARCIAL':'PARTIAL COLLECTION')}</span><h2 id="collection-title">{pt?'Pronto para levar.':'Ready to take away.'}</h2><p>{model.title} <span>·</span> {doc.evidence.length} {pt?(doc.evidence.length===1?'trecho coletado':'trechos coletados'):(doc.evidence.length===1?'fragment collected':'fragments collected')}{!valid&&` / ${doc.coverage.target_ids.length}`}</p></div><button className="delivery-close" data-modal-close onClick={onClose} aria-label={words.close}>×</button></header>
   <div className="delivery-format-tabs" role="tablist" aria-label={pt?'Formato de saída':'Output format'}>{[['document','PDF',pt?'Para ler':'For reading'],['json','JSON',pt?'Para reutilizar':'For reuse']].map(([id,title,detail])=><button key={id} id={`delivery-tab-${id}`} role="tab" tabIndex={mode===id?0:-1} aria-selected={mode===id} aria-controls="delivery-panel" onClick={()=>{setMode(id);setReceipt(null);setNotice('');}} onKeyDown={event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const next=mode==='json'?'document':'json';setMode(next);panel.current.querySelector(`#delivery-tab-${next}`).focus();}}}><strong>{title}</strong><span>{detail}</span></button>)}</div>
   <div id="delivery-panel" role="tabpanel" aria-labelledby={`delivery-tab-${mode}`} className={`delivery-workspace delivery-workspace--${mode}`}>
    {mode==='document'?<>
     <div className="document-toolbar"><span>{report?`${pt?'Prévia do PDF':'PDF preview'} · ${report.pages.length} ${pt?(report.pages.length===1?'página':'páginas'):(report.pages.length===1?'page':'pages')}`:(pt?'Diagramando seu documento…':'Laying out your document…')}</span>{report&&<div><button aria-label={pt?'Página anterior':'Previous page'} disabled={pageIndex===0} onClick={()=>setPageIndex(i=>i-1)}>←</button><span>{pageIndex+1} / {report.pages.length}</span><button aria-label={pt?'Próxima página':'Next page'} disabled={pageIndex===report.pages.length-1} onClick={()=>setPageIndex(i=>i+1)}>→</button><button className="document-zoom" aria-pressed={zoom} onClick={()=>setZoom(!zoom)}>{zoom?(pt?'Ajustar':'Fit'):(pt?'Ampliar':'Zoom')}</button></div>}</div>
     <div className={`document-preview ${zoom?'is-zoomed':''}`} tabIndex="0" aria-label={pt?'Documento diagramado':'Formatted document'}>
      {report?<PagePreview page={report.pages[pageIndex]} width={report.width} height={report.height} index={pageIndex}/>:pdfError?<div className="document-loading"><strong>{pt?'Não consegui preparar o PDF.':'Could not prepare the PDF.'}</strong><button onClick={()=>{setPdfError(false);setRetry(n=>n+1);}}>{pt?'Tentar novamente':'Try again'}</button><p>{pt?'O JSON continua disponível na outra aba.':'JSON remains available in the other tab.'}</p></div>:<div className="document-loading"><span className="document-loading-paper">GG</span><p>{pt?'Organizando títulos, atividades e páginas.':'Arranging headings, activities and pages.'}</p></div>}
     </div>
    </>:<>
     <div className="document-toolbar json-toolbar"><span>{pt?'Todos os conteúdos capturados, em um arquivo.':'All captured content in one file.'}</span><label><input type="checkbox" checked={trace} onChange={event=>setTrace(event.target.checked)}/>{pt?'Mostrar origens':'Show provenance'}</label></div>
     <pre className="delivery-json" tabIndex="0" aria-label="collection.json">{(trace?json:clean).split('\n').map((line,i)=><span className="json-line" key={i}><span className="json-number" aria-hidden="true">{i+1}</span><span className="json-text">{line.split(/("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\btrue\b|\bfalse\b|\bnull\b|\b-?\d+(?:\.\d+)?\b)/g).map((part,index,parts)=><span key={index} className={part.startsWith('"')? /^\s*:/.test(parts[index+1]||'')?'json-key':'json-string':/^(true|false|null|-?\d)/.test(part)?'json-value':undefined}>{part}</span>)}</span></span>)}</pre>
     {trace&&<details className="delivery-provenance"><summary>{pt?'Conferir um trecho no site':'Check a fragment on the site'}</summary><div>{doc.evidence.map(item=><button key={item.id} onClick={()=>onSource(item)}>{item.label} <small>{item.kind}</small> ↗</button>)}</div></details>}
    </>}
   </div>
   <footer className="delivery-export"><div><strong>{mode==='document'?(pt?'Pronto para compartilhar.':'Ready to share.'):(pt?'Conteúdo + rastreabilidade.':'Content + provenance.')}</strong><p>{mode==='document'?(pt?'Conteúdo profissional diagramado. JSON original anexado.':'Professional content, laid out. Original JSON attached.'):(pt?'O download inclui todos os campos e suas origens.':'The download includes every field and its source.')}</p></div><button className="delivery-primary" onClick={download} disabled={mode==='document'&&!report}>{mode==='document'?(pt?'Baixar PDF':'Download PDF'):(pt?'Baixar JSON':'Download JSON')} <span>↓</span></button></footer>
   <div className="delivery-bottom"><button onClick={onNew}>{pt?'Fazer outra coleta':'Start another collection'}</button><span role="status">{notice||externalNotice}</span>{mode==='json'&&<button onClick={copy}>{pt?'Copiar JSON completo':'Copy complete JSON'}</button>}</div>
   {receipt&&<DeliveryReceipt key={receipt.id} delivery={receipt} lang={doc.page.language} reduced={reduced} onClose={()=>setReceipt(null)}/>}
  </motion.section>
 </>;
}
export default function CollectionDelivery(props){return <AnimatePresence>{props.isOpen&&props.collection&&props.layout&&<DeliveryPanel key={props.collection.session.id} {...props}/>}</AnimatePresence>;}
