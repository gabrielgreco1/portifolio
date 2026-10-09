"use client";
import {useEffect} from 'react';
export default function VisitorPresence(){
  useEffect(()=>{
    let busy=false,last=0,disposed=false;
    const heartbeat=async()=>{
      if(disposed||busy||document.hidden||navigator.doNotTrack==='1'||Date.now()-last<30000)return;
      busy=true;last=Date.now();
      try{await fetch('/api/visitors',{method:'POST',credentials:'same-origin',keepalive:true});}catch{}finally{busy=false;}
    };
    const start=setTimeout(heartbeat,1800),interval=setInterval(heartbeat,45000);
    document.addEventListener('visibilitychange',heartbeat);
    return()=>{disposed=true;clearTimeout(start);clearInterval(interval);document.removeEventListener('visibilitychange',heartbeat);};
  },[]);
  return null;
}
