"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
// This is a site viewport mode, never the browser's native Fullscreen API.
export function useArcadeFullscreen(open,onClose){
 const [mode,setMode]=useState('window'),current=useRef('window');
 const set=useCallback(value=>{current.current=value;setMode(value);},[]);
 useEffect(()=>()=>{current.current='window';setMode('window');},[open]);
 const toggle=useCallback(()=>set(current.current==='window'?'expanded':'window'),[set]);
 const close=useCallback(event=>{
  if(event?.key==='Escape'&&current.current==='expanded'){set('window');return;}
  set('window');onClose();
 },[onClose,set]);
 return{mode,expanded:mode==='expanded',toggle,close};
}
