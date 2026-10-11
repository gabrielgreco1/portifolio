// Emails left to unlock the agent skills list. Stored in the same Upstash Redis as the visitor map;
// in local development without Redis they go to .local/skill-leads.json.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

const credentials=()=>({url:process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL,token:process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN});
const EMAIL=/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

export function normalizeEmail(value){
  const email=String(value||'').trim().toLowerCase();
  return email.length<=254&&EMAIL.test(email)?email:null;
}

class RedisLeads{
  constructor(url,token,prefix){this.url=url;this.token=token;this.prefix=prefix;}
  async command(args){
    const r=await fetch(this.url,{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store',signal:AbortSignal.timeout(6000)});
    const data=await r.json().catch(()=>({error:'bad response'}));
    if(!r.ok||data.error)throw Object.assign(new Error('storage_unavailable'),{status:503});
    return data.result;
  }
  async limit(key,max,seconds){
    const k=`${this.prefix}:limit:${key}`;const n=await this.command(['INCR',k]);
    if(n===1)await this.command(['EXPIRE',k,seconds]);
    if(n>max)throw Object.assign(new Error('rate_limited'),{status:429});
  }
  async add(email,meta){
    const now=Date.now();
    const old=await this.command(['HGET',`${this.prefix}:emails`,email]);
    const row=old?{...JSON.parse(old),last:now,count:(JSON.parse(old).count||1)+1}:{email,first:now,last:now,count:1,...meta};
    await this.command(['HSET',`${this.prefix}:emails`,email,JSON.stringify(row)]);
    await this.command(['ZADD',`${this.prefix}:by_time`,now,email]);
  }
}

class LocalLeads{
  constructor(path){this.path=path;}
  async limit(){}
  async add(email,meta){
    let rows={};try{rows=JSON.parse(await readFile(this.path,'utf8'));}catch{}
    const now=Date.now();const old=rows[email];
    rows[email]=old?{...old,last:now,count:(old.count||1)+1}:{email,first:now,last:now,count:1,...meta};
    await mkdir(dirname(this.path),{recursive:true});await writeFile(this.path,JSON.stringify(rows,null,1));
  }
}

export function leadStore(){
  const {url,token}=credentials();
  if(url&&token)return new RedisLeads(url,token,`portfolio:skill-leads:${process.env.VERCEL_ENV==='production'?'production':'preview'}:v1`);
  if(process.env.NODE_ENV==='development'&&!process.env.VERCEL)return new LocalLeads(`${process.cwd()}/.local/skill-leads.json`);
  throw Object.assign(new Error('Lead storage is not configured'),{status:503});
}

// Same Cloudflare Turnstile keys as the arcade. Locally, without real keys, Cloudflare's
// always-pass test keys are used so the gate can be exercised on localhost.
const TEST_SITE='1x00000000000000000000AA',TEST_SECRET='1x0000000000000000000000000000000AA';
export const SKILLS_CAPTCHA_ACTION='skills_unlock';

export function captchaConfig(env=process.env){
  const local=env.NODE_ENV==='development'&&!env.VERCEL;
  if(local&&(!env.TURNSTILE_SITEKEY||!env.TURNSTILE_SECRET_KEY))return{mode:'test',sitekey:TEST_SITE,secret:TEST_SECRET,hosts:['localhost','127.0.0.1']};
  if(!env.TURNSTILE_SITEKEY||!env.TURNSTILE_SECRET_KEY)return null;
  const hosts=(env.ARCADE_ALLOWED_HOSTNAMES||'gabrielgreco.com,www.gabrielgreco.com').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  return{mode:'live',sitekey:env.TURNSTILE_SITEKEY,secret:env.TURNSTILE_SECRET_KEY,hosts:local?[...hosts,'localhost','127.0.0.1']:hosts};
}

export async function verifyCaptcha(token,config,fetcher=fetch){
  if(!config)throw Object.assign(new Error('captcha_unavailable'),{status:503});
  if(typeof token!=='string'||token.length<1||token.length>2048)throw Object.assign(new Error('captcha_required'),{status:403});
  const r=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:config.secret,response:token}),signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw Object.assign(new Error('captcha_unavailable'),{status:503});
  const data=await r.json();
  if(data.success!==true)throw Object.assign(new Error('captcha_failed'),{status:403});
  if(config.mode==='live'&&(!config.hosts.includes(String(data.hostname||'').toLowerCase())||data.action!==SKILLS_CAPTCHA_ACTION))throw Object.assign(new Error('captcha_failed'),{status:403});
}
