"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {arcadeResponse} from '@/lib/arcade/response.mjs';
import {ArcadeRecording,GAME_VERSIONS} from '@/lib/arcade/protocol.mjs';

export function useArcadeSession(game){
 const [config,setConfig]=useState(null),[panel,setPanel]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState(null);
 const pending=useRef(null),recording=useRef(null),mounted=useRef(true),dimensions=useRef(null),busyRef=useRef(false);
 const readGeneration=useRef(0);
 const checkpointFlight=useRef(null),checkpointProof=useRef(null),checkpointRetry=useRef(null),retryDelay=useRef(5000);
 const [connectionError,setConnectionError]=useState(false);
 useEffect(()=>()=>clearTimeout(checkpointRetry.current),[]);
 const checkpoint=useCallback(async function synchronize(){
  const r=recording.current;if(!r?.captureCheckpoint)return true;
  if(checkpointFlight.current?.recording===r)return checkpointFlight.current.promise;
  if(checkpointProof.current?.recording!==r)checkpointProof.current=null;
  const proof=checkpointProof.current?.proof||r.captureCheckpoint();if(!proof)return true;
  checkpointProof.current={recording:r,proof};clearTimeout(checkpointRetry.current);
  const request=(async()=>{
   try{
    const response=await fetch('/api/arcade',{method:'POST',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'checkpoint',token:r.run.token,proof})}),data=await arcadeResponse(response);
    if(!response.ok){const failure=Error(data.error);failure.fatal=response.status>=400&&response.status<500&&response.status!==429;throw failure;}
    if(mounted.current&&recording.current===r){r.acceptCheckpoint(data);checkpointProof.current=null;setConnectionError(false);retryDelay.current=5000;}
    return true;
   }catch(failure){
    if(mounted.current&&recording.current===r){r.connectionFatal=!!failure.fatal;setConnectionError({code:failure.message,fatal:!!failure.fatal});if(!failure.fatal){checkpointRetry.current=setTimeout(()=>{if(mounted.current&&recording.current===r)void synchronize();},retryDelay.current);retryDelay.current=Math.min(30000,retryDelay.current*2);}}
    return false;
   }finally{if(checkpointFlight.current?.promise===request)checkpointFlight.current=null;}
  })();checkpointFlight.current={recording:r,promise:request};return request;
 },[]);
 async function refresh(){
  const generation=++readGeneration.current;try{const response=await fetch(`/api/arcade?game=${game}`,{cache:'no-store',signal:AbortSignal.timeout(12000)}),data=await arcadeResponse(response);if(mounted.current&&generation===readGeneration.current)setConfig(data);return data;}catch{if(mounted.current&&generation===readGeneration.current)setConfig({available:false,error:'temporarily_unavailable'});return null;}
 }
 useEffect(()=>{mounted.current=true;let alive=true;const generation=++readGeneration.current;fetch(`/api/arcade?game=${game}`,{cache:'no-store',signal:AbortSignal.timeout(12000)}).then(arcadeResponse).then(data=>{if(alive&&generation===readGeneration.current)setConfig(data);}).catch(()=>{if(alive&&generation===readGeneration.current)setConfig({available:false});});return()=>{alive=false;mounted.current=false;pending.current?.(null);pending.current=null;};},[game]);
 function requestStart(width,height){if(pending.current)return Promise.resolve(null);dimensions.current={width,height};setError('');setResult(null);setPanel('verify');return new Promise(resolve=>{pending.current=resolve;});}
 async function authorize(captcha,name){
  if(busyRef.current)return;busyRef.current=true;setBusy(true);setError('');
  try{
   const response=await fetch('/api/arcade',{method:'POST',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'start',game,version:GAME_VERSIONS[game],pace:2,...dimensions.current,captcha,name})}),run=await arcadeResponse(response);
   if(!response.ok)throw new Error(run.error);if(!mounted.current||!pending.current)return;
   try{localStorage.setItem('arcade-player-name',name);}catch{}clearTimeout(checkpointRetry.current);checkpointProof.current=null;setConnectionError(false);recording.current=new ArcadeRecording(run);setPanel(null);pending.current(recording.current);pending.current=null;
  }catch(e){if(mounted.current)setError(e.message||'temporarily_unavailable');}
  finally{busyRef.current=false;if(mounted.current)setBusy(false);}
 }
 function close(){if(busyRef.current)return;pending.current?.(null);pending.current=null;setPanel(null);setError('');}
 async function publish(name){
  if(busyRef.current||!recording.current)return;busyRef.current=true;setBusy(true);setError('');
  try{const r=recording.current,response=await fetch('/api/arcade',{method:'POST',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'finish',token:r.run.token,name,proof:r.proof()})}),data=await arcadeResponse(response);if(!response.ok)throw new Error(data.error);if(mounted.current){setResult(data);setPanel('ranking');await refresh();}}
  catch(e){if(mounted.current)setError(e.message||'temporarily_unavailable');}
  finally{busyRef.current=false;if(mounted.current)setBusy(false);}
 }
 const finish=useCallback(async()=>{
  const r=recording.current;if(!r||busyRef.current)return;
  busyRef.current=true;setBusy(true);setError('');
  try{if(checkpointFlight.current?.recording===r&&!(await checkpointFlight.current.promise))throw Error('temporarily_unavailable');if(checkpointProof.current?.recording===r&&!(await checkpoint()))throw Error('temporarily_unavailable');clearTimeout(checkpointRetry.current);const response=await fetch('/api/arcade',{method:'POST',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'finish',token:r.run.token,name:r.run.name,proof:r.proof()})}),data=await arcadeResponse(response);
   if(!response.ok)throw new Error(data.error);
   if(mounted.current&&recording.current===r){readGeneration.current++;setResult(data);setConfig(previous=>({...previous,available:true,entries:data.entries,personal:data.personal,self:data.personal?.id}));}
  }catch(e){if(mounted.current&&recording.current===r)setError(e.message||'temporarily_unavailable');}
  finally{busyRef.current=false;if(mounted.current)setBusy(false);}
 },[checkpoint]);
 function showRanking(){setError('');setPanel('ranking');refresh();}
 function showPublish(){setResult(null);setError('');setPanel('publish');}
 return {finish,checkpoint,connectionError,config,panel,busy,error,result,recording,requestStart,authorize,close,publish,showRanking,showPublish,refresh};
}
