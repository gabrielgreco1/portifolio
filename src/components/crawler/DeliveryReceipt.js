"use client";
import {useState} from 'react';
import {motion} from 'framer-motion';

export default function DeliveryReceipt({delivery,lang,reduced,onClose}) {
  const [unsealed,setUnsealed]=useState(false);
  const pt=lang==='pt';
  return <motion.aside className="delivery-receipt" initial={{opacity:0,y:reduced?0:16,scale:reduced?1:.96}} animate={{opacity:1,y:0,scale:1}} transition={{duration:reduced?.12:.45,ease:[.16,1,.3,1]}} aria-label={pt?'Entrega do Tamagotchi':'Tamagotchi delivery'}>
    <div className="delivery-top">
      <motion.svg className="delivery-pet" viewBox="100 250 950 550" aria-hidden="true" initial={{rotate:0,y:0}} animate={reduced?{}:{rotate:[0,-7,4,0],y:[0,-7,0,0]}} transition={{duration:.75,delay:.12}}><image href="/crawler-character-v2.png" width="1254" height="1254"/></motion.svg>
      <div className="delivery-message" role="status"><span>{pt?'PREPARADO PELO TAMAGOTCHI':'PREPARED BY TAMAGOTCHI'}</span><strong>{delivery.format==='clipboard'?(pt?'Uma cópia, com carinho.':'A copy, with care.'):(pt?'Seu pacote está pronto.':'Your parcel is ready.')}</strong><p>{delivery.fragments} {pt?(delivery.fragments===1?'fragmento':'fragmentos'):(delivery.fragments===1?'fragment':'fragments')} · {delivery.records} {pt?(delivery.records===1?'registro':'registros'):(delivery.records===1?'record':'records')} · {new Intl.NumberFormat(lang,{maximumFractionDigits:1}).format(delivery.bytes/1024)} KB</p></div>
      <button className="delivery-dismiss" onClick={onClose} aria-label={pt?'Fechar recibo':'Close receipt'}>×</button>
    </div>
    <div className="delivery-seal"><code>{delivery.format==='clipboard'?'CLIPBOARD':delivery.filename}</code>{delivery.hash&&<button aria-expanded={unsealed} onClick={()=>setUnsealed(!unsealed)}>{unsealed?(pt?'Lacre aberto ↗':'Seal open ↗'):(pt?'Abrir lacre ↗':'Break the seal ↗')}</button>}</div>
    {unsealed&&<div className="delivery-secret"><p>{pt?'Você também gosta de olhar por dentro. Eu sabia.':'You like looking inside things too. I knew it.'}</p><small>{pt?'SHA-256 do JSON original':'SHA-256 of the original JSON'}</small><code>{delivery.hash}</code></div>}
  </motion.aside>;
}
