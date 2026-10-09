"use client";
import {useEffect,useRef,useState} from 'react';
import {ArcadeRecording} from '@/lib/arcade/protocol.mjs';

export function useArcadeSession(game){
 const [config,setConfig]=useState(null),[panel,setPanel]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState(null);
 const pending=useRef(null),recording=useRef(null),mounted=useRef(true),dimensions=useRef(null),busyRef=useRef(false);
 async function refresh(){
  try{const response=await fetch(`/api/arcade?game=${game}`,{cache:'no-store'}),data=await response.json();if(mounted.current)setConfig(data);return data;}catch{if(mounted.current)setConfig({available:false,error:'temporarily_unavailable'});return null;}
 }
 useEffect(()=>{mounted.current=true;let alive=true;fetch(`/api/arcade?game=${game}`,{cache:'no-store'}).then(r=>r.json()).then(data=>{if(alive)setConfig(data);}).catch(()=>{if(alive)setConfig({available:false});});return()=>{alive=false;mounted.current=false;pending.current?.(null);pending.current=null;};},[game]);
 function requestStart(width,height){if(pending.current)return Promise.resolve(null);dimensions.current={width,height};setError('');setResult(null);setPanel('verify');return new Promise(resolve=>{pending.current=resolve;});}
 async function authorize(captcha){
  if(busyRef.current)return;busyRef.current=true;setBusy(true);setError('');
  try{
   const response=await fetch('/api/arcade',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'start',game,...dimensions.current,captcha})}),run=await response.json();
   if(!response.ok)throw new Error(run.error);if(!mounted.current||!pending.current)return;
   recording.current=new ArcadeRecording(run);setPanel(null);pending.current(recording.current);pending.current=null;
  }catch(e){if(mounted.current)setError(e.message||'temporarily_unavailable');}
  finally{busyRef.current=false;if(mounted.current)setBusy(false);}
 }
 function close(){if(busyRef.current)return;pending.current?.(null);pending.current=null;setPanel(null);setError('');}
 async function publish(name){
  if(busyRef.current||!recording.current)return;busyRef.current=true;setBusy(true);setError('');
  try{const r=recording.current,response=await fetch('/api/arcade',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'finish',token:r.run.token,name,proof:r.proof()})}),data=await response.json();if(!response.ok)throw new Error(data.error);if(mounted.current){setResult(data);setPanel('ranking');await refresh();}}
  catch(e){if(mounted.current)setError(e.message||'temporarily_unavailable');}
  finally{busyRef.current=false;if(mounted.current)setBusy(false);}
 }
 function showRanking(){setError('');setPanel('ranking');refresh();}
 function showPublish(){setResult(null);setError('');setPanel('publish');}
 return {config,panel,busy,error,result,recording,requestStart,authorize,close,publish,showRanking,showPublish,refresh};
}
