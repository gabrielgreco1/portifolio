"use client";
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGlassDialog } from './useGlassDialog';

export default function ScopePicker({isOpen,options,companies,words,onPick,onManual,onClose,reduced}) {
  const panel = useRef(null), [preview,setPreview] = useState('resume');
  useGlassDialog(isOpen,panel,onClose,reduced);
  const current = options.find(item => item.id === preview) || options[0];
  return <AnimatePresence>
    {isOpen && <>
      <motion.div key="scope-backdrop" className="glass-backdrop scope-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} />
      <motion.section key="scope-picker" ref={panel} role="dialog" aria-modal="true" aria-labelledby="scope-title" className="glass-inspector scope-picker" initial={{opacity:0,scale:reduced?1:.9,y:15}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.97,y:8}} transition={{duration:reduced?.1:.45,ease:[.22,1,.36,1]}}>
        <header className="glass-header"><div><span className="glass-eyebrow">GABRIEL GRECO / {words.extractLabel}</span><h2 id="scope-title">{words.scopeTitle}</h2><p>{words.scopeHint}</p></div><button data-modal-close className="glass-close" aria-label={words.close} onClick={onClose}>×</button></header>
        <div className="scope-body">
          <div className="scope-tabs" role="group" aria-label={words.scopeTitle}>
            {options.map(item => <button key={item.id} aria-label={item.title} className={preview===item.id?'featured':''} onMouseEnter={()=>setPreview(item.id)} onFocus={()=>setPreview(item.id)} onClick={()=>onPick(item.id)}>
              {preview===item.id && <motion.span className="scope-pill" layoutId="scope-pill" transition={{duration:reduced?0:.22}} aria-hidden="true" />}
              <span className="scope-option-label">{item.title}</span><span className="scope-option-count">{item.count}</span>
            </button>)}
          </div>
          <div className="scope-preview"><p>{current?.description}</p><span>{current?.count} {words.fragments} <i>·</i> {words.autoPace}</span></div>
          <div className="scope-specific"><h3>{words.companyChoice}</h3><div className="scope-companies">{companies.map(item=><button key={item.id} aria-label={item.title} onClick={()=>onPick(item.id)}><span>{item.title}</span><small>{item.count} {words.fragments}</small><span aria-hidden="true">↗</span></button>)}</div></div>
        </div>
        <footer className="scope-footer"><button onClick={onManual}>{words.pointFragment} ↗</button><span>{words.scopeStartHint}</span></footer>
      </motion.section>
    </>}
  </AnimatePresence>;
}
