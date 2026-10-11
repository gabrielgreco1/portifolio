"use client";
// Cloudflare Turnstile widget shared by the arcade and the agent skills email gate.
import {useEffect,useRef} from 'react';
let loading;
function loadTurnstile(){
 if(window.turnstile)return Promise.resolve(window.turnstile);
 if(!loading)loading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
  script.onload=()=>window.turnstile?resolve(window.turnstile):reject(new Error('captcha_unavailable'));script.onerror=()=>{script.remove();loading=null;reject(new Error('captcha_unavailable'));};document.head.append(script);
 });return loading;
}
export default function Turnstile({sitekey,action,cData,theme='dark',lang,onToken,onError,reset,className}){
 const container=useRef(null),tokenCallback=useRef(onToken),errorCallback=useRef(onError);useEffect(()=>{tokenCallback.current=onToken;errorCallback.current=onError;},[onToken,onError]);
 useEffect(()=>{
  let cancelled=false,id,api,observer,size;
  loadTurnstile().then(turnstile=>{
   if(cancelled)return;api=turnstile;
   const render=()=>{
    if(cancelled||!container.current)return;
    const nextSize=container.current.clientWidth<300?'compact':'flexible';
    if(size===nextSize)return;
    if(id!==undefined){api.remove(id);tokenCallback.current('');}
    size=nextSize;
    id=api.render(container.current,{sitekey,action,...(cData?{cData}:{}),theme,language:lang==='pt'?'pt-br':'en',size,callback:token=>tokenCallback.current(token),'error-callback':()=>{tokenCallback.current('');errorCallback.current?.();},'expired-callback':()=>tokenCallback.current(''),'timeout-callback':()=>tokenCallback.current('')});
   };
   render();observer=new ResizeObserver(render);observer.observe(container.current);
  }).catch(()=>{if(!cancelled)errorCallback.current?.();});
  return()=>{cancelled=true;observer?.disconnect();if(id!==undefined)api?.remove(id);};
 },[sitekey,action,cData,theme,lang,reset]);
 return <div className={className} ref={container}/>;
}
