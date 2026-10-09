import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
export class ArcadeError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;}}
const RATE=`local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end;return n`;
const FINISH=`
local raw=redis.call('GET',KEYS[1]);if not raw then return {'expired'} end
local run=cjson.decode(raw)
if run.owner~=ARGV[1] then return {'owner'} end
if run.finished then
 if run.payloadHash~=ARGV[2] then return {'used'} end
 return {'ok',cjson.encode(run.result)}
end
local entry=cjson.decode(ARGV[3]);local previous=redis.call('ZSCORE',KEYS[2],entry.id)
local improved=not previous or tonumber(previous)<entry.score
if improved then
 redis.call('ZADD',KEYS[2],entry.score,entry.id);redis.call('HSET',KEYS[3],entry.id,ARGV[3])
 local overflow=redis.call('ZCARD',KEYS[2])-100
 if overflow>0 then
  local removed=redis.call('ZRANGE',KEYS[2],0,overflow-1)
  for _,id in ipairs(removed) do redis.call('ZREM',KEYS[2],id);redis.call('HDEL',KEYS[3],id) end
 end
end
local rank=redis.call('ZREVRANK',KEYS[2],entry.id)
run.finished=true;run.payloadHash=ARGV[2];run.result={score=entry.score,improved=improved,rank=rank and rank+1 or cjson.null}
redis.call('SET',KEYS[1],cjson.encode(run),'KEEPTTL')
return {'ok',cjson.encode(run.result)}`;
const BOARD=`local ids=redis.call('ZREVRANGE',KEYS[1],0,19);local rows={};for _,id in ipairs(ids) do local row=redis.call('HGET',KEYS[2],id);if row then table.insert(rows,row) end end;return rows`;
export class RedisArcade{
 constructor(url,token,prefix){this.url=url;this.token=token;this.prefix=prefix;this.mode='live';}
 async command(args){const r=await fetch(this.url,{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store',signal:AbortSignal.timeout(6000)});if(!r.ok)throw new ArcadeError('storage_unavailable',503);const data=await r.json();if(data.error)throw new ArcadeError('storage_unavailable',503);return data.result;}
 async limit(key,max,seconds){const n=await this.command(['EVAL',RATE,1,`${this.prefix}:limit:${key}`,seconds]);if(n>max)throw new ArcadeError('rate_limited',429);}
 async create(run){const ttl=Math.max(1,Math.ceil((run.expiresAt-Date.now())/1000));await this.command(['SET',`${this.prefix}:run:${run.id}`,JSON.stringify(run),'EX',ttl,'NX']);}
 async get(id){const raw=await this.command(['GET',`${this.prefix}:run:${id}`]);return raw?JSON.parse(raw):null;}
 async finish(run,hash,entry){const result=await this.command(['EVAL',FINISH,3,`${this.prefix}:run:${run.id}`,`${this.prefix}:board:${run.version}`,`${this.prefix}:names:${run.version}`,run.owner,hash,JSON.stringify(entry)]);if(result[0]!=='ok')throw new ArcadeError(result[0]==='expired'?'run_expired':'run_used',409);return JSON.parse(result[1]);}
 async board(version){return(await this.command(['EVAL',BOARD,2,`${this.prefix}:board:${version}`,`${this.prefix}:names:${version}`])).map(value=>JSON.parse(value));}
}
let queue=Promise.resolve();
export class LocalArcade{
 constructor(path){this.path=path;this.mode='test';}
 async transact(fn){const work=queue.then(async()=>{let data;try{data=JSON.parse(await readFile(this.path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;data={runs:{},boards:{},limits:{}};}
  for(const [id,run]of Object.entries(data.runs))if(run.expiresAt<Date.now())delete data.runs[id];for(const [id,limit]of Object.entries(data.limits))if(limit.expiresAt<Date.now())delete data.limits[id];
  const result=await fn(data);await mkdir(dirname(this.path),{recursive:true});const temporary=`${this.path}.${randomUUID()}`;await writeFile(temporary,JSON.stringify(data),{mode:0o600});await rename(temporary,this.path);return result;
 });queue=work.catch(()=>{});return work;}
 async limit(key,max,seconds){const n=await this.transact(data=>{const item=data.limits[key]||={count:0,expiresAt:Date.now()+seconds*1000};return ++item.count;});if(n>max)throw new ArcadeError('rate_limited',429);}
 async create(run){return this.transact(data=>{if(data.runs[run.id])throw new ArcadeError('run_used',409);data.runs[run.id]=run;});}
 async get(id){return this.transact(data=>data.runs[id]||null);}
 async board(version){return this.transact(data=>Object.values(data.boards[version]||{}).sort(order).slice(0,20));}
 async finish(run,hash,entry){return this.transact(data=>{
  const stored=data.runs[run.id];if(!stored||stored.owner!==run.owner)throw new ArcadeError('run_expired',409);
  if(stored.finished){if(stored.payloadHash!==hash)throw new ArcadeError('run_used',409);return stored.result;}
  const board=data.boards[run.version]||={},improved=!board[entry.id]||board[entry.id].score<entry.score;if(improved)board[entry.id]=entry;
  const ordered=Object.values(board).sort(order);for(const row of ordered.slice(100))delete board[row.id];
  const at=ordered.slice(0,100).findIndex(row=>row.id===entry.id);stored.finished=true;stored.payloadHash=hash;stored.result={score:entry.score,improved,rank:at<0?null:at+1};return stored.result;
 });}
}
// Redis breaks score ties in reverse lexicographical member order.
const order=(a,b)=>b.score-a.score||(a.id<b.id?1:a.id>b.id?-1:0);
