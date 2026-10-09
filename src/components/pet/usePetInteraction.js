"use client";
import {useEffect,useRef,useState} from 'react';
import {clickGesture} from '@/lib/crawler/pet-motion.mjs';

export function usePetInteraction({onMenu,onBeforeAction}) {
  const [performance,setPerformance]=useState(null);
  const pending=useRef({count:0,timer:null,last:0});
  const callbacks=useRef({onMenu,onBeforeAction});
  useEffect(()=>{callbacks.current={onMenu,onBeforeAction};});
  useEffect(()=>()=>clearTimeout(pending.current.timer),[]);
  function perform(kind,element) {
    if(!element?.isConnected)return;
    clearTimeout(pending.current.timer);pending.current.count=0;
    callbacks.current.onBeforeAction();
    const anchor=element.getBoundingClientRect();
    const labels=[...document.querySelectorAll('main [data-crawl-id]')].map(node=>node.querySelector('h3,h4')?.textContent||node.textContent).map(text=>text.trim().replace(/\s+/g,' ').slice(0,24)).filter(Boolean);
    setPerformance({kind,element,anchor,labels:labels.slice(0,8),id:performanceNow()});
  }
  function click(event) {
    const element=event.currentTarget;
    if(event.detail===0){callbacks.current.onMenu(element);return;}
    const now=performanceNow(), sequence=pending.current;
    sequence.count=now-sequence.last<460?sequence.count+1:1;
    sequence.last=now;clearTimeout(sequence.timer);
    const resolve=()=>{
      const kind=clickGesture(sequence.count);sequence.count=0;
      if(kind==='menu')callbacks.current.onMenu(element);else perform(kind,element);
    };
    if(sequence.count>=5)resolve();else sequence.timer=setTimeout(resolve,340);
  }
  return {performance,click,perform,finish:()=>setPerformance(null)};
}
function performanceNow(){return window.performance.now();}
