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

function publicSnapshot({started,total,locations,counts,active,first={},last={},hours={},activityStarted},now,mode,key){
  const online=new Map();for(const signal of active)online.set(signal.city,(online.get(signal.city)||0)+1);
  const iso=value=>value?new Date(Number(value)).toISOString():null;
  const points=Object.entries(counts).filter(([id])=>id!=='unknown'&&locations[id]).map(([id,visits])=>({...locations[id],visits:Number(visits),active:online.get(id)||0,firstSeen:iso(first[id]),lastSeen:iso(last[id])})).sort((a,b)=>b.visits-a.visits);
  const currentHour=Math.floor(now/3600000),firstHour=activityStarted?Math.floor(Number(activityStarted)/3600000):Infinity;
  const activity=Array.from({length:24},(_,i)=>{const hour=currentHour-23+i;return{at:iso(hour*3600000),visits:hour<firstHour?null:Number(hours[hour]||0),partial:hour===firstHour||hour===currentHour};});
  const signals=[...active].sort((a,b)=>b.last-a.last).slice(0,100).map(signal=>({id:sign(`public-signal:${signal.id}:${signal.arrived}`,key).slice(0,12),cityId:signal.city,observedSince:iso(signal.arrived),lastSeen:iso(signal.last)}));
  return {available:true,mode,startedAt:iso(started),updatedAt:iso(now),activeWindowSeconds:ACTIVE_WINDOW/1000,total:Number(total),active:active.length,unlocated:Number(counts.unknown||0),unlocatedActive:online.get('unknown')||0,points,signals,activity,activityStartedAt:iso(activityStarted)};
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
  local hour=prefix .. ':hour:' .. math.floor(now/3600000)
  redis.call('INCR',hour)
  redis.call('EXPIRE',hour,93600)
  redis.call('SET',prefix .. ':arrived:' .. sid,now,'EX',1800)
  redis.call('INCR',prefix .. ':total')
  redis.call('HINCRBY',prefix .. ':counts',city,1)
  redis.call('SET',prefix .. ':started',now,'NX')
  redis.call('HSET',prefix .. ':locations',city,location)
else
  city = previous
end
redis.call('SET',prefix .. ':activity-started',now,'NX')
redis.call('HSETNX',prefix .. ':first',city,now)
redis.call('HSET',prefix .. ':last',city,now)
redis.call('SET',prefix .. ':arrived:' .. sid,now,'NX','EX',1800)
redis.call('EXPIRE',prefix .. ':arrived:' .. sid,1800)
redis.call('SET',session,city,'EX',1800)
redis.call('ZADD',prefix .. ':active',now,sid .. '|' .. city)
redis.call('ZREMRANGEBYSCORE',prefix .. ':active','-inf',now-90000)
return 1`;
const SNAPSHOT=`
local p, now=ARGV[1],tonumber(ARGV[2])
local members=redis.call('ZRANGEBYSCORE',p..':active','('..(now-90000),'+inf','WITHSCORES')
local active={}
for i=1,#members,2 do
  local sid=string.match(members[i],'^(.-)|')
  table.insert(active,{members[i],members[i+1],redis.call('GET',p..':arrived:'..sid) or members[i+1]})
end
local hours={}
for hour=math.floor(now/3600000)-23,math.floor(now/3600000) do
  table.insert(hours,tostring(hour));table.insert(hours,redis.call('GET',p..':hour:'..hour) or '0')
end
return {redis.call('GET',p..':started') or '',redis.call('GET',p..':total') or '0',redis.call('HGETALL',p..':locations'),redis.call('HGETALL',p..':counts'),active,redis.call('HGETALL',p..':first'),redis.call('HGETALL',p..':last'),hours,redis.call('GET',p..':activity-started') or ''}`;

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
    const [started,total,places,counts,active,first,last,hours,activityStarted]=await this.command(['EVAL',SNAPSHOT,0,this.prefix,now]);
    const locations=Object.fromEntries(Object.entries(pairs(places)).map(([id,value])=>[id,JSON.parse(value)]));
    return publicSnapshot({started,total,locations,counts:pairs(counts),first:pairs(first),last:pairs(last),hours:pairs(hours),activityStarted,active:active.map(([member,seen,arrived])=>({id:member.slice(0,member.indexOf('|')),city:member.slice(member.indexOf('|')+1),last:Number(seen),arrived:Number(arrived)}))},now,'live',this.token+this.prefix);
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
      data.hours||={};data.first||={};data.last||={};data.activityStarted||=now;
      if(!existing||now-existing.last>=SESSION_WINDOW){
        data.started||=now;data.total++;data.counts[location.id]=(data.counts[location.id]||0)+1;data.locations[location.id]=location;
        data.sessions[id]={city:location.id,last:now,arrived:now};
        const hour=Math.floor(now/3600000);data.hours[hour]=(data.hours[hour]||0)+1;
      }else{existing.last=now;existing.arrived||=now;}
      const city=data.sessions[id].city;data.first[city]||=now;data.last[city]=now;
      for(const hour of Object.keys(data.hours))if(Number(hour)<Math.floor(now/3600000)-25)delete data.hours[hour];
      for(const [key,value]of Object.entries(data.sessions))if(now-value.last>=SESSION_WINDOW)delete data.sessions[key];
      await mkdir(dirname(this.path),{recursive:true});const temporary=`${this.path}.${randomUUID()}`;
      await writeFile(temporary,JSON.stringify(data),{mode:0o600});await rename(temporary,this.path);
    });localQueue=work.catch(()=>{});return work;
  }
  async snapshot(now=Date.now()){await localQueue;const data=await this.read();return publicSnapshot({...data,active:Object.entries(data.sessions).filter(([,v])=>now-v.last<ACTIVE_WINDOW).map(([id,v])=>({id,...v,arrived:v.arrived||v.last}))},now,'local','local-public-signals');}
}
export function visitorStore(){
  const {url,token}=credentials();
  if(url&&token)return new RedisVisitors(url,token,`portfolio:visitors:${process.env.VERCEL_ENV==='production'?'production':'preview'}:v1`);
  if(process.env.NODE_ENV==='development'&&!process.env.VERCEL)return new LocalVisitors(`${process.cwd()}/.local/visits.json`);
  throw new Error('Visitor storage is not configured');
}
