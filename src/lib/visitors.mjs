import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';

export const ACTIVE_WINDOW=90_000,SESSION_WINDOW=30*60_000;
const COOKIE='pet_visit';
const credentials=()=>({url:process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL,token:process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN});
const secret=()=>process.env.VISITOR_SESSION_SECRET||credentials().token||(process.env.NODE_ENV==='development'?'local-visitor-session-only':null);
const sign=(value,key)=>createHmac('sha256',key).update(value).digest('hex');

export function visitorSession(cookieHeader,key=secret()){
  if(!key)throw new Error('Visitor storage is not configured');
  const cookie=cookieHeader?.split(';').map(v=>v.trim()).find(v=>v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1);
  if(cookie&&/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(cookie)){
    const [id,signature]=cookie.split('.'),expected=sign(id,key);
    if(timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return{id,value:cookie};
  }
  const id=randomUUID();return{id,value:`${id}.${sign(id,key)}`};
}
export function visitorCookie(session,secure){return `${COOKIE}=${session.value}; Path=/; Max-Age=1800; HttpOnly; SameSite=Lax${secure?'; Secure':''}`;}
export function visitorRateKey(headers){
  const ip=process.env.VERCEL==='1'?headers.get('x-vercel-forwarded-for'):null;
  return ip?sign(`${Math.floor(Date.now()/60000)}:${ip}`,secret()).slice(0,32):'';
}

export function visitorLocation(headers,trusted=process.env.VERCEL==='1'){
  const unknown={id:'unknown',city:null,country:null,latitude:null,longitude:null};
  if(!trusted)return unknown;
  const country=headers.get('x-vercel-ip-country'),cityEncoded=headers.get('x-vercel-ip-city');
  const latitude=headers.get('x-vercel-ip-latitude'),longitude=headers.get('x-vercel-ip-longitude');
  if(!country||!cityEncoded||!latitude?.trim()||!longitude?.trim())return unknown;
  let city;try{city=decodeURIComponent(cityEncoded).trim().slice(0,90);}catch{return unknown;}
  const lat=Number(latitude),lon=Number(longitude);
  if(!city||!/^[A-Z]{2}$/.test(country)||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return unknown;
  const region=(headers.get('x-vercel-ip-country-region')||'').slice(0,6);
  const id=Buffer.from(`${country}:${region}:${city.toLowerCase()}`).toString('base64url');
  // Only city-scale coordinates leave the server; never store an IP or GPS fix.
  return{id,city,country,latitude:Math.round(lat*10)/10,longitude:Math.round(lon*10)/10};
}

function publicSnapshot({started,total,locations,counts,active},now,mode){
  const online=new Map();for(const city of active)online.set(city,(online.get(city)||0)+1);
  const points=Object.entries(counts).filter(([id])=>id!=='unknown'&&locations[id]).map(([id,visits])=>({...locations[id],visits:Number(visits),active:online.get(id)||0})).sort((a,b)=>b.visits-a.visits);
  return {available:true,mode,startedAt:started?new Date(Number(started)).toISOString():null,updatedAt:new Date(now).toISOString(),activeWindowSeconds:ACTIVE_WINDOW/1000,total:Number(total),active:active.length,unlocated:Number(counts.unknown||0),unlocatedActive:online.get('unknown')||0,points};
}

const RECORD=`
local prefix, sid, now, city, location = ARGV[1], ARGV[2], tonumber(ARGV[3]), ARGV[4], ARGV[5]
local session = prefix .. ':s:' .. sid
local previous = redis.call('GET',session)
if not previous then
  if ARGV[6] ~= '' then
    local key=prefix .. ':rate:' .. ARGV[6]
    local count=redis.call('INCR',key)
    if count == 1 then redis.call('EXPIRE',key,90) end
    if count > 60 then return -1 end
  end
  redis.call('INCR',prefix .. ':total')
  redis.call('HINCRBY',prefix .. ':counts',city,1)
  redis.call('SET',prefix .. ':started',now,'NX')
  redis.call('HSET',prefix .. ':locations',city,location)
else
  city = previous
end
redis.call('SET',session,city,'EX',1800)
redis.call('ZADD',prefix .. ':active',now,sid .. '|' .. city)
redis.call('ZREMRANGEBYSCORE',prefix .. ':active','-inf',now-90000)
return 1`;
const SNAPSHOT=`
local p, now=ARGV[1],tonumber(ARGV[2])
return {redis.call('GET',p..':started') or '',redis.call('GET',p..':total') or '0',redis.call('HGETALL',p..':locations'),redis.call('HGETALL',p..':counts'),redis.call('ZRANGEBYSCORE',p..':active',now-90000,'+inf')}`;
const pairs=values=>Object.fromEntries(Array.from({length:values.length/2},(_,i)=>[values[i*2],values[i*2+1]]));

export class RedisVisitors{
  constructor(url,token,prefix){this.url=url;this.token=token;this.prefix=prefix;}
  async command(args){
    const response=await fetch(this.url,{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!response.ok)throw new Error('Visitor database is unavailable');
    const json=await response.json();if(json.error)throw new Error('Visitor database rejected the operation');return json.result;
  }
  async record(id,location,now=Date.now(),rateKey=''){
    const result=await this.command(['EVAL',RECORD,0,this.prefix,id,now,location.id,JSON.stringify(location),rateKey]);
    if(result===-1){const error=new Error('Visit rate limit');error.status=429;throw error;}
  }
  async snapshot(now=Date.now()){
    const [started,total,places,counts,active]=await this.command(['EVAL',SNAPSHOT,0,this.prefix,now]);
    const locations=Object.fromEntries(Object.entries(pairs(places)).map(([id,value])=>[id,JSON.parse(value)]));
    return publicSnapshot({started,total,locations,counts:pairs(counts),active:active.map(id=>id.slice(id.indexOf('|')+1))},now,'live');
  }
}

// Local development records only actual local requests, with unknown location.
// This adapter is never selected for a deployed or production server.
let localQueue=Promise.resolve();
export class LocalVisitors{
  constructor(path){this.path=path;}
  async read(){try{return JSON.parse(await readFile(this.path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;return{started:null,total:0,locations:{},counts:{},sessions:{}};}}
  async record(id,location,now=Date.now()){
    const work=localQueue.then(async()=>{
      const data=await this.read();const existing=data.sessions[id];
      if(!existing||now-existing.last>=SESSION_WINDOW){
        data.started||=now;data.total++;data.counts[location.id]=(data.counts[location.id]||0)+1;data.locations[location.id]=location;
        data.sessions[id]={city:location.id,last:now};
      }else existing.last=now;
      for(const [key,value]of Object.entries(data.sessions))if(now-value.last>=SESSION_WINDOW)delete data.sessions[key];
      await mkdir(dirname(this.path),{recursive:true});const temporary=`${this.path}.${randomUUID()}`;
      await writeFile(temporary,JSON.stringify(data),{mode:0o600});await rename(temporary,this.path);
    });localQueue=work.catch(()=>{});return work;
  }
  async snapshot(now=Date.now()){await localQueue;const data=await this.read();return publicSnapshot({...data,active:Object.values(data.sessions).filter(v=>now-v.last<ACTIVE_WINDOW).map(v=>v.city)},now,'local');}
}
export function visitorStore(){
  const {url,token}=credentials();
  if(url&&token)return new RedisVisitors(url,token,`portfolio:visitors:${process.env.VERCEL_ENV==='production'?'production':'preview'}:v1`);
  if(process.env.NODE_ENV==='development'&&!process.env.VERCEL)return new LocalVisitors(`${process.cwd()}/.local/visits.json`);
  throw new Error('Visitor storage is not configured');
}
