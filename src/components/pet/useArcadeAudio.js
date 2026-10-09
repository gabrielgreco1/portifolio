"use client";
import {useCallback,useEffect,useState} from 'react';
import {ArcadeSound} from '@/lib/arcade/sound.mjs';
const key='tamagotchi-arcade-muted';
export function useArcadeAudio(open){
 const [sound]=useState(()=>new ArcadeSound());
 const [muted,setMuted]=useState(()=>{try{return localStorage.getItem(key)==='1';}catch{return false;}}),[available,setAvailable]=useState(true);
 useEffect(()=>{sound.setMuted(muted);},[sound,muted]);
 useEffect(()=>{if(!open)return;const quiet=()=>sound.silence();window.addEventListener('blur',quiet);document.addEventListener('visibilitychange',quiet);return()=>{window.removeEventListener('blur',quiet);document.removeEventListener('visibilitychange',quiet);sound.close();};},[open,sound]);
 const unlock=useCallback(()=>{sound.unlock().then(setAvailable);},[sound]);
 function toggle(){const next=!muted;sound.setMuted(next);setMuted(next);try{localStorage.setItem(key,next?'1':'0');}catch{}if(!next)sound.unlock().then(ok=>{setAvailable(ok);if(ok)sound.play('toggle');});}
 return{sound,muted,available,unlock,toggle};
}
