import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LocalVisitors,visitorSession,visitorCookie,visitorLocation,ACTIVE_WINDOW,SESSION_WINDOW} from '../src/lib/visitors.mjs';

test('sessions cannot be chosen or tampered with by a visitor',()=>{
  const session=visitorSession('', 'test-key');
  assert.equal(visitorSession(`pet_visit=${session.value}`,'test-key').id,session.id);
  assert.notEqual(visitorSession(`pet_visit=${session.value}`,'other-key').id,session.id);
  assert.notEqual(visitorSession(`pet_visit=${session.value.slice(0,-1)}z`,'test-key').id,session.id);
  const cookie=visitorCookie(session,true);assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Secure/);assert.match(cookie,/Max-Age=1800/);
});
test('only trusted complete city information can place a marker',()=>{
  const headers=new Headers({'x-vercel-ip-city':'S%C3%A3o%20Paulo','x-vercel-ip-country':'BR','x-vercel-ip-country-region':'SP','x-vercel-ip-latitude':'-23.5505','x-vercel-ip-longitude':'-46.6333'});
  assert.equal(visitorLocation(headers,false).id,'unknown');
  const city=visitorLocation(headers,true);assert.equal(city.city,'São Paulo');assert.equal(city.latitude,-23.6);assert.equal(city.longitude,-46.6);
  headers.delete('x-vercel-ip-longitude');assert.equal(visitorLocation(headers,true).id,'unknown');
  headers.set('x-vercel-ip-longitude','');assert.equal(visitorLocation(headers,true).id,'unknown');
  headers.set('x-vercel-ip-longitude','181');assert.equal(visitorLocation(headers,true).id,'unknown');
});
test('real sessions persist, deduplicate concurrent heartbeats and expire independently of history',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'portfolio-visitors-'));
  try{
    const store=new LocalVisitors(join(dir,'visits.json')),start=Date.UTC(2026,9,9,12);
    const city={id:'test-city',city:'Test fixture',country:'BR',latitude:-23.6,longitude:-46.6},unknown=visitorLocation(new Headers(),false);
    await Promise.all(Array.from({length:20},()=>store.record('same-session',city,start)));
    await store.record('unknown-session',unknown,start+1000);
    const reloaded=new LocalVisitors(join(dir,'visits.json'));
    const first=await reloaded.snapshot(start+2000);
    assert.equal(first.total,2);assert.equal(first.active,2);assert.equal(first.unlocated,1);assert.equal(first.points.length,1);assert.equal(first.points[0].visits,1);
    assert.ok(!JSON.stringify(first).includes('same-session'));assert.ok(!JSON.stringify(first).includes('unknown-session'));
    const expired=await reloaded.snapshot(start+ACTIVE_WINDOW+2000);
    assert.equal(expired.active,0);assert.equal(expired.total,2);assert.equal(expired.points[0].active,0);
    await reloaded.record('same-session',city,start+SESSION_WINDOW+2000);
    const next=await reloaded.snapshot(start+SESSION_WINDOW+3000);
    assert.equal(next.total,3);assert.equal(next.active,1);assert.equal(next.points[0].visits,2);assert.equal(next.startedAt,first.startedAt);
  }finally{await rm(dir,{recursive:true,force:true});}
});
