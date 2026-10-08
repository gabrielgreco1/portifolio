"use client";
import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { useGlassDialog } from './useGlassDialog';

export default function ScopePicker({isOpen,options,companies,words,onPick,onManual,onClose,reduced}) {
  const panel = useRef(null);
  const {lang} = useLanguage();
  const copy = lang === 'pt' ? {
    title:'O que você quer levar?',hint:'Clique em “Extrair currículo inteiro” para levar tudo. Ou escolha só a parte que interessa.',
    complete:'COLETA COMPLETA',start:'Extrair currículo inteiro',parts:'Ou extraia apenas uma parte',
    experiences:{title:'Só experiências',description:'Todas as empresas, cargos e atividades.',action:'Extrair experiências'},
    projects:{title:'Só projetos',description:'Descrições, tecnologias e links.',action:'Extrair projetos'},
    skills:{title:'Só tecnologias',description:'Todas as ferramentas usadas no trabalho.',action:'Extrair tecnologias'},
    specific:'Prefere uma empresa ou um trecho?',company:'Escolha a empresa. O clique já começa a coleta.',companyAction:'Extrair só',manual:'Escolher um trecho no site',manualHint:'Você aponta o texto ou a imagem que quer coletar.',footer:'O tamagotchi coleta sua escolha e entrega JSON + PDF.'
  } : {
    title:'What do you want to take away?',hint:'Click “Extract full résumé” to collect everything. Or pick just the part you need.',
    complete:'COMPLETE COLLECTION',start:'Extract full résumé',parts:'Or extract just one part',
    experiences:{title:'Experience only',description:'Every company, role and activity.',action:'Extract experience'},
    projects:{title:'Projects only',description:'Descriptions, technologies and links.',action:'Extract projects'},
    skills:{title:'Technologies only',description:'Every tool used in the work.',action:'Extract technologies'},
    specific:'Prefer one company or a fragment?',company:'Choose a company. Clicking starts the collection.',companyAction:'Extract only',manual:'Choose a fragment on the site',manualHint:'Point to the text or image you want to collect.',footer:'The tamagotchi collects your selection and delivers JSON + PDF.'
  };
  useGlassDialog(isOpen,panel,onClose,reduced);
  const full = options.find(item => item.id === 'resume');
  return <AnimatePresence>
    {isOpen && <>
      <motion.div key="scope-backdrop" className="glass-backdrop scope-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} />
      <motion.section key="scope-picker" ref={panel} role="dialog" aria-modal="true" aria-labelledby="scope-title" aria-describedby="scope-instructions" className="glass-inspector scope-picker" initial={{opacity:0,scale:reduced?1:.9,y:15}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.97,y:8}} transition={{duration:reduced?.1:.45,ease:[.22,1,.36,1]}}>
        <header className="glass-header"><div><span className="glass-eyebrow">GABRIEL GRECO / {words.extractLabel}</span><h2 id="scope-title">{copy.title}</h2><p id="scope-instructions">{copy.hint}</p></div><button data-modal-close className="glass-close" aria-label={words.close} onClick={onClose}>×</button></header>
        <div className="scope-body">
          {full && <button data-modal-autofocus className="scope-full" aria-label={copy.start} onClick={()=>onPick('resume')}>
            <span className="scope-full-top"><span>{copy.complete}</span><small>{full.count} {words.fragments}</small></span>
            <strong>{full.title}</strong><span className="scope-full-description">{full.description}</span>
            <span className="scope-full-action">{copy.start}<span aria-hidden="true">↗</span></span>
          </button>}
          <h3 className="scope-parts-title">{copy.parts}</h3>
          <div className="scope-part-options" role="group" aria-label={copy.parts}>
            {options.filter(item=>item.id!=='resume').map(item => <button key={item.id} aria-label={copy[item.id].action} onClick={()=>onPick(item.id)}>
              <strong>{copy[item.id].title}</strong><span>{copy[item.id].description}</span><small>{copy[item.id].action}<span aria-hidden="true">↗</span></small>
            </button>)}
          </div>
          <details className="scope-specific"><summary>{copy.specific}<span aria-hidden="true">+</span></summary><p>{copy.company}</p><div className="scope-companies">{companies.map(item=><button key={item.id} aria-label={`${copy.companyAction} ${item.title}`} onClick={()=>onPick(item.id)}><span>{item.title}</span><small>{copy.companyAction} {item.title}</small><span aria-hidden="true">↗</span></button>)}</div>
            <button className="scope-manual" onClick={onManual}><strong>{copy.manual} ↗</strong><span>{copy.manualHint}</span></button>
          </details>
        </div>
        <footer className="scope-footer"><span>{copy.footer}</span></footer>
      </motion.section>
    </>}
  </AnimatePresence>;
}
