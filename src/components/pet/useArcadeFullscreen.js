"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
export function useArcadeFullscreen(open,panel,onClose){
 const [mode,setMode]=useState('window'),current=useRef('window'),lastExit=useRef(0),generation=useRef(0);
 const set=useCallback(value=>{current.current=value;setMode(value);},[]);
 const leave=useCallback(()=>{set('window');if(document.fullscreenElement===panel.current)document.exitFullscreen?.().catch(()=>{});},[panel,set]);
 useEffect(()=>{
  if(!open)return;
  const mountedGeneration=++generation.current;
  const element=panel.current;
  const changed=()=>{if(document.fullscreenElement===element)set('native');else if(current.current==='native'){lastExit.current=Date.now();set('window');}};
  document.addEventListener('fullscreenchange',changed);
  return()=>{generation.current=mountedGeneration+1;document.removeEventListener('fullscreenchange',changed);if(document.fullscreenElement===element)document.exitFullscreen?.().catch(()=>{});current.current='window';setMode('window');};
 },[open,panel,set]);
 async function toggle(){
  if(current.current!=='window'){leave();return;}
  const element=panel.current,requestGeneration=generation.current;
  if(element?.requestFullscreen&&document.fullscreenEnabled){try{await element.requestFullscreen();if(requestGeneration!==generation.current){if(document.fullscreenElement===element)await document.exitFullscreen();return;}if(document.fullscreenElement===element)set('native');return;}catch{/* Viewport expansion also works in browsers that deny native fullscreen. */}}
  if(requestGeneration===generation.current)set('expanded');
 }
 const close=useCallback(event=>{
  if(event?.key==='Escape'&&(current.current!=='window'||Date.now()-lastExit.current<250)){leave();return;}
  leave();onClose();
 },[leave,onClose]);
 return{mode,expanded:mode!=='window',toggle,close};
}
