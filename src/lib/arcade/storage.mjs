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
if tonumber(run.sequence or 0)~=tonumber(ARGV[4] or 0) then return {'checkpoint_conflict'} end
local entry=cjson.decode(ARGV[3]);local previous=redis.call('ZSCORE',KEYS[2],entry.id)
local improved=not previous or tonumber(previous)<entry.score
if improved then
 redis.call('ZADD',KEYS[2],entry.score,entry.id);redis.call('HSET',KEYS[3],entry.id,ARGV[3])
else
 local rawEntry=redis.call('HGET',KEYS[3],entry.id)
 if rawEntry then local best=cjson.decode(rawEntry);best.name=entry.name;redis.call('HSET',KEYS[3],entry.id,cjson.encode(best)) end
end
local rank=redis.call('ZREVRANK',KEYS[2],entry.id)
run.finished=true;run.payloadHash=ARGV[2];run.result={score=entry.score,improved=improved,rank=rank and rank+1 or cjson.null}
redis.call('SET',KEYS[1],cjson.encode(run),'KEEPTTL')
return {'ok',cjson.encode(run.result)}`;
const CHECKPOINT=`
local raw=redis.call('GET',KEYS[1]);if not raw then return {'expired'} end
local run=cjson.decode(raw)
if run.owner~=ARGV[1] or run.expiresAt<tonumber(ARGV[7]) then return {'expired'} end
if run.finished then return {'used'} end
local sequence=tonumber(run.sequence or 0);local expected=tonumber(ARGV[2])
if sequence==expected+1 and run.lastCheckpointHash==ARGV[3] then return {'ok',run.lastCheckpointResult} end
if sequence~=expected then return {'checkpoint_conflict'} end
run.sequence=expected+1;run.checkpointJson=ARGV[4];run.lastCheckpointHash=ARGV[3];run.lastCheckpointResult=ARGV[5];run.expiresAt=tonumber(ARGV[6])
redis.call('SET',KEYS[1],cjson.encode(run),'PX',math.max(1,tonumber(ARGV[6])-tonumber(ARGV[7])))
return {'ok',ARGV[5]}`;
const BOARD=`local ids=redis.call('ZREVRANGE',KEYS[1],0,9);local rows={};for _,id in ipairs(ids) do local row=redis.call('HGET',KEYS[2],id);if row then table.insert(rows,row) end end;return rows`;
// A read-only, atomic comparison. Never inserts an unpublished score.
const COMPARE=`
local candidate=cjson.decode(ARGV[1]);local rank=1
local higher=redis.call('ZCOUNT',KEYS[1],'('..candidate.score,'+inf');rank=rank+higher
local old=redis.call('ZSCORE',KEYS[1],candidate.id)
if old and tonumber(old)>candidate.score then rank=rank-1 end
local ties=redis.call('ZRANGEBYSCORE',KEYS[1],candidate.score,candidate.score)
for _,id in ipairs(ties) do if id>candidate.id then rank=rank+1 end end
local ids=redis.call('ZREVRANGE',KEYS[1],0,10);local rows={}
for _,id in ipairs(ids) do if id~=candidate.id then local raw=redis.call('HGET',KEYS[2],id);if raw then table.insert(rows,cjson.decode(raw)) end end end
if rank<=10 then table.insert(rows,rank,candidate) end
while #rows>10 do table.remove(rows) end
for i,row in ipairs(rows) do row.rank=i end
candidate.rank=rank
return cjson.encode({rank=rank,entries=rows,personal=candidate})`;
const PERSONAL=`local rank=redis.call('ZREVRANK',KEYS[1],ARGV[1]);local raw=redis.call('HGET',KEYS[2],ARGV[1]);if not rank or not raw then return false end;local row=cjson.decode(raw);row.rank=rank+1;return cjson.encode(row)`;
export class RedisArcade{
 constructor(url,token,prefix){this.url=url;this.token=token;this.prefix=prefix;this.mode='live';}
 async command(args){const r=await fetch(this.url,{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store',signal:AbortSignal.timeout(6000)});if(!r.ok)throw new ArcadeError('storage_unavailable',503);const data=await r.json();if(data.error)throw new ArcadeError('storage_unavailable',503);return data.result;}
 async limit(key,max,seconds){const n=await this.command(['EVAL',RATE,1,`${this.prefix}:limit:${key}`,seconds]);if(n>max)throw new ArcadeError('rate_limited',429);}
 async create(run){const ttl=Math.max(1,Math.ceil((run.expiresAt-Date.now())/1000));await this.command(['SET',`${this.prefix}:run:${run.id}`,JSON.stringify(run),'EX',ttl,'NX']);}
 async get(id){const raw=await this.command(['GET',`${this.prefix}:run:${id}`]);return raw?JSON.parse(raw):null;}
 async finish(run,hash,entry){const result=await this.command(['EVAL',FINISH,3,`${this.prefix}:run:${run.id}`,`${this.prefix}:board:${run.version}`,`${this.prefix}:names:${run.version}`,run.owner,hash,JSON.stringify(entry),run.sequence||0]);if(result[0]!=='ok')throw new ArcadeError(result[0]==='expired'?'run_expired':result[0]==='checkpoint_conflict'?'checkpoint_conflict':'run_used',409);return JSON.parse(result[1]);}
 async checkpoint(run,hash,snapshot,response,now){
  const result=await this.command(['EVAL',CHECKPOINT,1,`${this.prefix}:run:${run.id}`,run.owner,run.sequence||0,hash,JSON.stringify(snapshot),JSON.stringify(response),response.expiresAt,now]);
  if(result[0]!=='ok')throw new ArcadeError(result[0]==='expired'?'run_expired':result[0]==='used'?'run_used':'checkpoint_conflict',409);return JSON.parse(result[1]);
 }
 async compare(version,entry){return JSON.parse(await this.command(['EVAL',COMPARE,2,`${this.prefix}:board:${version}`,`${this.prefix}:names:${version}`,JSON.stringify(entry)]));}
 async personal(version,id){const raw=await this.command(['EVAL',PERSONAL,2,`${this.prefix}:board:${version}`,`${this.prefix}:names:${version}`,id]);return raw?JSON.parse(raw):null;}
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
 async checkpoint(run,hash,snapshot,response,now){return this.transact(data=>{
  const stored=data.runs[run.id];if(!stored||stored.owner!==run.owner||stored.expiresAt<now)throw new ArcadeError('run_expired',409);
  if(stored.finished)throw new ArcadeError('run_used',409);
  const sequence=stored.sequence||0,expected=run.sequence||0;
  if(sequence===expected+1&&stored.lastCheckpointHash===hash)return JSON.parse(stored.lastCheckpointResult);
  if(sequence!==expected)throw new ArcadeError('checkpoint_conflict',409);
  Object.assign(stored,{sequence:expected+1,checkpointJson:JSON.stringify(snapshot),lastCheckpointHash:hash,lastCheckpointResult:JSON.stringify(response),expiresAt:response.expiresAt});return response;
 });}
 async compare(version,entry){return this.transact(data=>{const rows=[...Object.values(data.boards[version]||{}).filter(row=>row.id!==entry.id),entry].sort(order).map((row,i)=>({...row,rank:i+1}));const personal=rows.find(row=>row.id===entry.id);return {rank:personal.rank,entries:rows.slice(0,10),personal};});}
 async personal(version,id){return this.transact(data=>{const rows=Object.values(data.boards[version]||{}).sort(order),index=rows.findIndex(row=>row.id===id);return index<0?null:{...rows[index],rank:index+1};});}
 async board(version){return this.transact(data=>Object.values(data.boards[version]||{}).sort(order).slice(0,10));}
 async finish(run,hash,entry){return this.transact(data=>{
  const stored=data.runs[run.id];if(!stored||stored.owner!==run.owner)throw new ArcadeError('run_expired',409);
  if(stored.finished){if(stored.payloadHash!==hash)throw new ArcadeError('run_used',409);return stored.result;}
  if((stored.sequence||0)!==(run.sequence||0))throw new ArcadeError('checkpoint_conflict',409);
  const board=data.boards[run.version]||={},improved=!board[entry.id]||board[entry.id].score<entry.score;if(improved)board[entry.id]=entry;else board[entry.id].name=entry.name;
  const ordered=Object.values(board).sort(order);
  const at=ordered.findIndex(row=>row.id===entry.id);stored.finished=true;stored.payloadHash=hash;stored.result={score:entry.score,improved,rank:at<0?null:at+1};return stored.result;
 });}
}
// Redis breaks score ties in reverse lexicographical member order.
const order=(a,b)=>b.score-a.score||(a.id<b.id?1:a.id>b.id?-1:0);
