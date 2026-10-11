import {captchaConfig,leadStore,normalizeEmail,verifyCaptcha} from '@/lib/skill-leads.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request){
  const origin=request.headers.get('origin');
  let sameOrigin=false;
  try{const source=new URL(origin);sameOrigin=['http:','https:'].includes(source.protocol)&&source.host===request.headers.get('host')&&source.protocol===new URL(request.url).protocol;}catch{}
  if(!sameOrigin||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'invalid_origin'},{status:403});
  let body={};try{body=await request.json();}catch{}
  const email=normalizeEmail(body.email);
  if(!email)return Response.json({error:'invalid_email'},{status:400,headers:{'Cache-Control':'no-store'}});
  if(body.website)return Response.json({ok:true});  // honeypot: bots fill every field
  try{
    await verifyCaptcha(body.captcha,captchaConfig());
    const store=leadStore();
    const ip=process.env.VERCEL==='1'?(request.headers.get('x-vercel-forwarded-for')||'unknown').split(',')[0].trim():'local';
    await store.limit(`ip:${ip}`,8,3600);
    await store.add(email,{lang:body.lang==='pt'?'pt':'en',country:request.headers.get('x-vercel-ip-country')||null});
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    const limited=error.status===429;
    if(error.status===403)return Response.json({error:'captcha_failed'},{status:403,headers:{'Cache-Control':'no-store'}});
    return Response.json({error:limited?'rate_limited':'unavailable'},{status:limited?429:503,headers:{'Cache-Control':'no-store',...(limited?{'Retry-After':'3600'}:{})}});
  }
}
