import {visitorCookie,visitorLocation,visitorSession,visitorStore,visitorRateKey} from '@/lib/visitors.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  try{return Response.json(await visitorStore().snapshot(),{headers:{'Cache-Control':'public, s-maxage=15, stale-while-revalidate=15'}});}
  catch{return Response.json({available:false},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export async function POST(request){
  const origin=request.headers.get('origin');
  let sameOrigin=false;
  try{const source=new URL(origin);sameOrigin=['http:','https:'].includes(source.protocol)&&source.host===request.headers.get('host')&&source.protocol===new URL(request.url).protocol;}catch{}
  if(!sameOrigin)return Response.json({error:'Invalid origin'},{status:403});
  if(request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Invalid origin'},{status:403});
  if(request.headers.get('dnt')==='1'||/bot|crawler|spider|headless/i.test(request.headers.get('user-agent')||''))return Response.json({skipped:true});
  try{
    const session=visitorSession(request.headers.get('cookie'));
    await visitorStore().record(session.id,visitorLocation(request.headers),Date.now(),visitorRateKey(request.headers));
    return Response.json({ok:true},{headers:{'Set-Cookie':visitorCookie(session,new URL(request.url).protocol==='https:'),'Cache-Control':'no-store'}});
  }catch(error){return Response.json({available:false},{status:error.status===429?429:503,headers:{'Cache-Control':'no-store',...(error.status===429?{'Retry-After':'60'}:{})}});}
}
