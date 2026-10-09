"use client";
import {useRef,useState} from 'react';
import {AnimatePresence,motion,useIsPresent} from 'framer-motion';
import {useLanguage} from '@/i18n/LanguageContext';
import {useGlassDialog} from './useGlassDialog';
import './delivery.css';

function ScopeComposer({options,companies,onPick,onManual,onClose,reduced}){
 const {lang}=useLanguage(),pt=lang==='pt',panel=useRef(null),present=useIsPresent();
 const [selected,setSelected]=useState('resume');
 useGlassDialog(present,panel,onClose,reduced);
 const choices=pt?[
  ['resume','Currículo completo','Todas as seções do site'],['experiences','Experiências','Todas as empresas e atividades'],['projects','Projetos','Descrições, tecnologias e links'],['skills','Tecnologias','Ferramentas organizadas por área'],
 ]:[['resume','Full résumé','Every section of this site'],['experiences','Experience','Every company and activity'],['projects','Projects','Descriptions, technologies and links'],['skills','Technologies','Tools organized by area']];
 const company=companies.find(item=>item.id===selected),label=company?.title||choices.find(item=>item[0]===selected)?.[1];
 const previews=company?[pt?'Cargo, período e contexto':'Role, period and context',pt?'Atividades e resultados completos':'Complete activities and results']:selected==='resume'?[pt?'Apresentação e contato':'Profile and contact',pt?'Todas as experiências e atividades':'All experience and activities',pt?'Projetos, tecnologias e serviços':'Projects, technologies and services']:selected==='experiences'?companies.map(item=>item.title):selected==='projects'?[pt?'Todos os projetos publicados':'Every published project',pt?'Descrição, ferramentas e links':'Descriptions, tools and links']:[pt?'Extrair · mover · modelar · entregar':'Extract · move · model · deliver',pt?'Todas as ferramentas publicadas':'Every published tool'];
 return <>
  <motion.div className="glass-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
  <motion.section ref={panel} className="glass-inspector scope-composer" role="dialog" aria-modal="true" aria-labelledby="scope-title" aria-describedby="scope-hint" initial={{opacity:0,scale:reduced?1:.93,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.97}} transition={{duration:reduced?.1:.4}}>
   <header className="delivery-header"><div><span className="delivery-eyebrow">01 {pt?'ESCOLHER':'CHOOSE'} <i/> 02 {pt?'ASSISTIR':'WATCH'} <i/> 03 {pt?'LEVAR':'TAKE AWAY'}</span><h2 id="scope-title">{pt?'Dê uma missão a ele.':'Give it a mission.'}</h2><p id="scope-hint">{pt?'Escolha o conteúdo. O Tamagotchi busca e prepara seus arquivos.':'Pick the content. Tamagotchi collects it and prepares your files.'}</p></div><button className="delivery-close" data-modal-close onClick={onClose} aria-label={pt?'Fechar':'Close'}>×</button></header>
   <div className="scope-workbench">
    <div className="scope-selections" role="radiogroup" aria-label={pt?'Conteúdo para extrair':'Content to extract'}>
     <div className="scope-choice-grid">{choices.map(([id,title,description])=><label className={`scope-choice ${selected===id?'is-selected':''}`} key={id}><input type="radio" name="crawl-scope" value={id} checked={selected===id} onChange={()=>setSelected(id)}/><span className="scope-radio" aria-hidden="true"/><span><strong>{title}</strong><small>{description}</small></span></label>)}</div>
     <p className="scope-group-label">{pt?'Ou apenas uma empresa':'Or just one company'}</p>
     <div className="scope-company-grid">{companies.map(item=><label className={`scope-company ${selected===item.id?'is-selected':''}`} key={item.id}><input type="radio" name="crawl-scope" value={item.id} checked={selected===item.id} onChange={()=>setSelected(item.id)}/><span>{item.title}</span><span aria-hidden="true">{selected===item.id?'✓':'+'}</span></label>)}</div>
     <button className="scope-point" onClick={onManual}>{pt?'Quero apontar um trecho no site':'I want to point to a fragment'} <span>↗</span></button>
    </div>
    <aside className="scope-manifest" aria-live="polite"><span className="scope-manifest-kicker">{pt?'SUA SELEÇÃO':'YOUR SELECTION'}</span><h3>{label}</h3><ul>{previews.map(line=><li key={line}>{line}</li>)}</ul><div className="scope-output-formats"><span><b>PDF</b>{pt?'Documento para ler e compartilhar':'A document to read and share'}</span><span><b>JSON</b>{pt?'Dados completos para reutilizar':'Complete data to reuse'}</span></div><p>{pt?'Você confere o resultado antes de baixar.':'Review the result before downloading.'}</p></aside>
   </div>
   <footer className="scope-command"><span>{pt?'Os originais continuam no site.':'The originals stay on the site.'}</span><button data-modal-autofocus className="delivery-primary" disabled={!options.length} onClick={()=>onPick(selected)}>{pt?'Começar coleta':'Start collecting'} <span>↗</span></button></footer>
  </motion.section>
 </>;
}
export default function ScopePicker(props){return <AnimatePresence>{props.isOpen&&<ScopeComposer key="scope-composer" {...props}/>}</AnimatePresence>;}
