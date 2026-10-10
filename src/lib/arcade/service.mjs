import {createHash,createHmac,randomInt,randomUUID,timingSafeEqual} from 'node:crypto';
import {ArcadeError,LocalArcade,RedisArcade} from './storage.mjs';
import {GAME_VERSIONS,validGame,validSize,replayArcade,MAX_TICKS,TICK_RATE} from './protocol.mjs';
const COOKIE='pet_arcade',RUN_TTL=20*60*1000;
const TEST_SITE='1x00000000000000000000AA',TEST_SECRET='1x0000000000000000000000000000000AA';
const hmac=(value,key)=>createHmac('sha256',key).update(value).digest('hex');
export function arcadeConfig(env=process.env){
 const test=env.NODE_ENV==='development'&&!env.VERCEL&&env.ARCADE_TEST_MODE==='1';
 if(test)return{mode:'test',sitekey:TEST_SITE,captchaSecret:TEST_SECRET,signingSecret:'explicit-local-arcade-testing-only',hosts:['localhost','127.0.0.1'],store:new LocalArcade(`${process.cwd()}/.local/arcade.json`)};
 const url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN,sitekey=env.TURNSTILE_SITEKEY,captchaSecret=env.TURNSTILE_SECRET_KEY,signingSecret=env.ARCADE_SIGNING_SECRET;
 const hosts=(env.ARCADE_ALLOWED_HOSTNAMES||'gabrielgreco.com,www.gabrielgreco.com').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 if(!url||!token||!sitekey||!captchaSecret||!signingSecret||signingSecret.length<32||/^[123]x0+/.test(sitekey)||/^[123]x0+/.test(captchaSecret))throw new ArcadeError('not_configured',503);
 return{mode:'live',sitekey,captchaSecret,signingSecret,hosts,vercel:env.VERCEL==='1',store:new RedisArcade(url,token,`portfolio:arcade:${env.VERCEL_ENV==='production'?'production':'preview'}:v1`)};
}
export function arcadeIdentity(header,key){
 const value=header?.split(';').map(v=>v.trim()).find(v=>v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1);
 if(value&&/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(value)){const[id,signature]=value.split('.');if(timingSafeEqual(Buffer.from(signature),Buffer.from(hmac(`player:${id}`,key))))return{id,value};}
 const id=randomUUID();return{id,value:`${id}.${hmac(`player:${id}`,key)}`};
}
const publicId=(owner,game,key)=>hmac(`public:${game}:${owner}`,key).slice(0,16);
const runSignature=(id,owner,key)=>hmac(`run:${id}:${owner}`,key);
export function validRunToken(token,owner,key){
 if(typeof token!=='string'||!/^[-a-f0-9]{36}\.[a-f0-9]{64}$/.test(token))return false;
 const[id,signature]=token.split('.');return timingSafeEqual(Buffer.from(signature),Buffer.from(runSignature(id,owner,key)))?id:false;
}
export async function verifyTurnstile(token,{config,hostname,game,fetcher=fetch}){
 if(typeof token!=='string'||token.length<1||token.length>2048)throw new ArcadeError('captcha_required',403);
 const result=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:config.captchaSecret,response:token,idempotency_key:randomUUID()}),signal:AbortSignal.timeout(8000)});
 if(!result.ok)throw new ArcadeError('captcha_unavailable',503);const data=await result.json();
 if(data.success!==true)throw new ArcadeError('captcha_failed',403);
 if(config.mode!=='test'&&(data.hostname?.toLowerCase()!==hostname||data.action!=='arcade_start'||data.cdata!==game))throw new ArcadeError('captcha_failed',403);
 // Dummy keys are exclusively allowed in the explicitly enabled local mode.
 if(config.mode==='test'&&token!=='XXXX.DUMMY.TOKEN.XXXX')throw new ArcadeError('captcha_failed',403);
}
export function playerName(value,fallback){
 if(value===undefined||value===null||String(value).trim()==='')return `Crawler ${fallback.slice(0,4).toUpperCase()}`;
 if(typeof value!=='string')throw new ArcadeError('invalid_name');
 const name=value.normalize('NFKC').trim().replace(/ +/g,' ');
 if([...name].length>20||!/^[\p{L}\p{N} ._-]+$/u.test(name))throw new ArcadeError('invalid_name');return name;
}
async function bodyJson(request){
 const limit=1_000_000;if(Number(request.headers.get('content-length'))>limit)throw new ArcadeError('payload_too_large',413);
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new ArcadeError('invalid_body',415);
 const reader=request.body?.getReader();if(!reader)throw new ArcadeError('invalid_body');const parts=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw new ArcadeError('payload_too_large',413);}parts.push(Buffer.from(value));}
 try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw new ArcadeError('invalid_body');}
}
export async function handleArcade(request,{config:provided,now=()=>Date.now(),verify=verifyTurnstile}={}){
 const headers={'Cache-Control':'no-store','Vary':'Cookie'};
 try{
  const url=new URL(request.url),host=request.headers.get('host')||url.host,hostname=new URL(`http://${host}`).hostname.toLowerCase();
  if(request.method!=='GET'&&request.method!=='POST')throw new ArcadeError('method_not_allowed',405);
  if(request.method==='POST'){
   let source;try{source=new URL(request.headers.get('origin'));}catch{throw new ArcadeError('invalid_origin',403);}
   if(!['http:','https:'].includes(source.protocol)||source.host!==host||source.protocol!==url.protocol||request.headers.get('sec-fetch-site')==='cross-site')throw new ArcadeError('invalid_origin',403);
  }
  const config=provided||arcadeConfig(),store=config.store;
  if(!config.hosts.includes(hostname))throw new ArcadeError('host_not_enabled',503);
  const player=arcadeIdentity(request.headers.get('cookie'),config.signingSecret);
  headers['Set-Cookie']=`${COOKIE}=${player.value}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Strict${config.mode==='live'||url.protocol==='https:'?'; Secure':''}`;
  if(request.method==='GET'){
   const game=url.searchParams.get('game');if(!validGame(game))throw new ArcadeError('invalid_game');
   const self=publicId(player.id,game,config.signingSecret),board=await store.board(GAME_VERSIONS[game]),personal=await store.personal(GAME_VERSIONS[game],self);return Response.json({available:true,mode:config.mode,sitekey:config.sitekey,game,version:GAME_VERSIONS[game],maxSeconds:MAX_TICKS/TICK_RATE,self,personal,entries:board.map((entry,i)=>({...entry,rank:i+1}))},{headers});
  }
  const body=await bodyJson(request);if(!body||typeof body!=='object'||Array.isArray(body))throw new ArcadeError('invalid_body');
  if(body.operation==='start'){
   const {game,width,height}=body;if(!validGame(game)||!validSize(width,height))throw new ArcadeError('invalid_game');
   await store.limit(`start:${player.id}`,120,600);
   const ip=config.vercel?request.headers.get('x-vercel-forwarded-for'):null;if(config.vercel)await store.limit(`ip:${hmac(ip||'unknown',config.signingSecret).slice(0,24)}`,600,600);
   const name=playerName(body.name,publicId(player.id,game,config.signingSecret));
   await verify(body.captcha,{config,hostname,game});
   const createdAt=now(),run={id:randomUUID(),owner:player.id,game,version:GAME_VERSIONS[game],width,height,seed:randomInt(0x100000000),pace:body.pace===2?2:1,...(body.name?{name}:{}),createdAt,expiresAt:createdAt+RUN_TTL};await store.create(run);
   const{owner,...publicRun}=run;return Response.json({...publicRun,token:`${run.id}.${runSignature(run.id,owner,config.signingSecret)}`,mode:config.mode},{headers});
  }
  if(body.operation==='finish'||body.operation==='assess'){
   const id=validRunToken(body.token,player.id,config.signingSecret);if(!id)throw new ArcadeError('invalid_run',403);
   await store.limit(`finish:${player.id}`,120,600);const run=await store.get(id);
   if(!run||run.owner!==player.id||run.expiresAt<now())throw new ArcadeError('run_expired',409);
   const name=playerName(run.name??body.name,publicId(player.id,run.game,config.signingSecret));
   const hash=createHash('sha256').update(JSON.stringify({name,proof:body.proof})).digest('hex');
   if(body.operation==='finish'&&run.finished){if(run.payloadHash!==hash)throw new ArcadeError('run_used',409);return Response.json({...run.result,entries:(await store.board(run.version)).map((row,i)=>({...row,rank:i+1})),personal:await store.personal(run.version,publicId(player.id,run.game,config.signingSecret))},{headers});}
   let result;try{result=replayArcade(run,body.proof);}catch{throw new ArcadeError('invalid_recording',422);}
   if((now()-run.createdAt)/1000+1<result.ticks/TICK_RATE*.95)throw new ArcadeError('run_too_fast',422);
   const entry={id:publicId(player.id,run.game,config.signingSecret),name,score:result.score,seconds:result.seconds,at:new Date(now()).toISOString()};
   if(body.operation==='assess')return Response.json({...await store.compare(run.version,entry),runScore:result.score,published:false},{headers});
   const saved=await store.finish(run,hash,entry);
   return Response.json({...saved,entries:(await store.board(run.version)).map((row,i)=>({...row,rank:i+1})),personal:await store.personal(run.version,entry.id)},{headers});
  }
  throw new ArcadeError('invalid_operation');
 }catch(error){const status=error instanceof ArcadeError?error.status:503;return Response.json({available:false,error:error instanceof ArcadeError?error.code:'temporarily_unavailable'},{status,headers:{...headers,...(status===429?{'Retry-After':'600'}:{})}});}
}
