"use client";
import {useEffect,useRef,useState} from 'react';
import {clickGesture} from '@/lib/crawler/pet-motion.mjs';

export function usePetInteraction({onMenu,onBeforeAction}) {
  const [performance,setPerformance]=useState(null);
  const pending=useRef({count:0,timer:null,last:0});
  const dragging=useRef(null),suppressClick=useRef(0);
  const callbacks=useRef({onMenu,onBeforeAction});
  useEffect(()=>{callbacks.current={onMenu,onBeforeAction};});
  useEffect(()=>()=>clearTimeout(pending.current.timer),[]);
  useEffect(()=>{
    const cancel=()=>{const drag=dragging.current;if(drag?.active)drag.released=performanceNow();dragging.current=null;};
    window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);
    return()=>{window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',cancel);};
  },[]);
  function perform(kind,element) {
    if(!element?.isConnected)return;
    clearTimeout(pending.current.timer);pending.current.count=0;
    callbacks.current.onBeforeAction();
    const anchor=element.getBoundingClientRect();
    const labels=[...document.querySelectorAll('main [data-crawl-id]')].map(node=>node.querySelector('h3,h4')?.textContent||node.textContent).map(text=>text.trim().replace(/\s+/g,' ').slice(0,24)).filter(Boolean);
    setPerformance({kind,element,anchor,labels:labels.slice(0,8),id:performanceNow()});
  }
  function click(event) {
    if(performanceNow()<suppressClick.current)return;
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
  function beginDrag(element,clientX,clientY,pointerId) {
    dragging.current={element,anchor:element.getBoundingClientRect(),clientX,clientY,pointerId,dx:0,dy:0,started:performanceNow(),released:null,active:false};
  }
  function activateDrag() {
    const drag=dragging.current;
    if(drag.active)return;
    drag.active=true;clearTimeout(pending.current.timer);pending.current.count=0;
    callbacks.current.onBeforeAction();
    setPerformance({kind:'drag',element:drag.element,anchor:drag.anchor,movement:drag,id:performanceNow()});
  }
  const pointerDown=event=>{
    if(!event.isPrimary||event.button!==0)return;
    beginDrag(event.currentTarget,event.clientX,event.clientY,event.pointerId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove=event=>{
    const drag=dragging.current;if(!drag||drag.pointerId!==event.pointerId)return;
    drag.dx=event.clientX-drag.clientX;drag.dy=event.clientY-drag.clientY;
    if(Math.hypot(drag.dx,drag.dy)>7)activateDrag();
  };
  function release() {
    const drag=dragging.current;if(!drag)return;
    if(drag.active){drag.released=performanceNow();suppressClick.current=performanceNow()+800;}
    dragging.current=null;
  }
  const keyDown=event=>{
    const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(!direction)return;
    event.preventDefault();
    if(!dragging.current)beginDrag(event.currentTarget,0,0,null);
    dragging.current.dx+=direction[0]*24;dragging.current.dy+=direction[1]*24;activateDrag();
  };
  function cancel(){clearTimeout(pending.current.timer);pending.current.count=0;dragging.current=null;setPerformance(null);}
  return {performance,click,perform,cancel,finish:()=>setPerformance(null),dragHandlers:{onPointerDown:pointerDown,onPointerMove:pointerMove,onPointerUp:release,onPointerCancel:release,onLostPointerCapture:release,onKeyDown:keyDown,onKeyUp:event=>{if(event.key.startsWith('Arrow'))release();},onBlur:release}};
}
function performanceNow(){return window.performance.now();}
