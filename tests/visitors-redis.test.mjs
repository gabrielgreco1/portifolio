import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:http';
import {mkdtemp,rm,access} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {RedisVisitors,ACTIVE_WINDOW} from '../src/lib/visitors.mjs';
const execute=promisify(execFile);

// An actual, disposable Redis validates the production Lua scripts. The tiny
// local HTTP bridge uses Upstash's command envelope; it is never an app server.
test('Redis atomically counts, expires presence, limits new sessions and isolates environments',{
 skip:!process.env.REDIS_SERVER_BIN,timeout:30000,
},async()=>{
 const directory=await mkdtemp(join(tmpdir(),'portfolio-visitors-redis-'));
 const socket=join(directory,'redis.sock');
 const child=spawn(process.env.REDIS_SERVER_BIN,['--port','0','--unixsocket',socket,'--save','','--appendonly','no','--dir',directory],{stdio:'ignore'});
 const command=async args=>JSON.parse((await execute(join(dirname(process.env.REDIS_SERVER_BIN),'redis-cli'),['-s',socket,'--json',...args.map(String)])).stdout);
 let server;
 try{
  let ready=false;
  for(let attempt=0;attempt<100;attempt++){try{await access(socket);if(await command(['PING'])==='PONG'){ready=true;break;}}catch{}await delay(20);}
  assert.ok(ready,'Isolated Redis started');
  server=createServer(async(req,res)=>{
   if(req.headers.authorization!=='Bearer integration-only'){res.writeHead(401).end();return;}
   try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const result=await command(JSON.parse(Buffer.concat(chunks).toString()));res.setHeader('Content-Type','application/json');res.end(JSON.stringify({result}));}
   catch{res.writeHead(500).end(JSON.stringify({error:'test bridge failed'}));}
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const endpoint=`http://127.0.0.1:${server.address().port}`;
  const prefix='test:production',store=new RedisVisitors(endpoint,'integration-only',prefix);
  const start=Date.now(),city={id:'isolated-fixture',city:'TEST ONLY',country:'BR',latitude:-23.6,longitude:-46.6};
  await Promise.all(Array.from({length:20},()=>store.record('one-session',city,start,'one-ip')));
  let snapshot=await store.snapshot(start+1);
  assert.equal(snapshot.total,1);assert.equal(snapshot.active,1);assert.equal(snapshot.points[0].visits,1);
  assert.ok(!JSON.stringify(snapshot).includes('one-session'));
  const initialSignal=snapshot.signals[0];assert.match(initialSignal.id,/^[a-f0-9]{12}$/);assert.equal(initialSignal.observedSince,new Date(start).toISOString());assert.equal(snapshot.points[0].firstSeen,new Date(start).toISOString());assert.equal(snapshot.activity.reduce((sum,h)=>sum+(h.visits||0),0),1);
  await store.record('one-session',city,start+2,'one-ip');const heartbeat=await store.snapshot(start+3);assert.equal(heartbeat.signals[0].id,initialSignal.id);assert.equal(heartbeat.activity.reduce((sum,h)=>sum+(h.visits||0),0),1);assert.equal(heartbeat.points[0].lastSeen,new Date(start+2).toISOString());
  assert.ok(await command(['TTL',`${prefix}:arrived:one-session`])>1790);
  assert.equal(await command(['TTL',`${prefix}:s:one-session`]),1800);
  snapshot=await store.snapshot(start+ACTIVE_WINDOW+3);
  assert.equal(snapshot.active,0);assert.equal(snapshot.total,1);
  const unknown={id:'unknown',city:null,country:null,latitude:null,longitude:null};
  await store.record('unknown-session',unknown,start+ACTIVE_WINDOW+2,'one-ip');
  snapshot=await store.snapshot(start+ACTIVE_WINDOW+3);
  assert.equal(snapshot.total,2);assert.equal(snapshot.unlocated,1);assert.equal(snapshot.unlocatedActive,1);assert.equal(snapshot.points.length,1);
  assert.equal(await command(['ZCARD',`${prefix}:active`]),1);
  await command(['PEXPIRE',`${prefix}:s:one-session`,1]);await delay(5);
  await store.record('one-session',city,start+ACTIVE_WINDOW+4,'one-ip');
  const renewed=await store.snapshot(start+ACTIVE_WINDOW+5);assert.equal(renewed.total,3);assert.notEqual(renewed.signals.find(s=>s.cityId===city.id).id,initialSignal.id);assert.equal(renewed.activity.reduce((sum,h)=>sum+(h.visits||0),0),3);
  for(let index=0;index<60;index++)await store.record(`rate-${index}`,city,start+ACTIVE_WINDOW+6,'limited-ip');
  await assert.rejects(store.record('rate-61',city,start+ACTIVE_WINDOW+7,'limited-ip'),error=>error.status===429);
  assert.equal((await store.snapshot(start+ACTIVE_WINDOW+8)).total,63);
  // A heartbeat from an existing session still works after the new-session cap.
  await store.record('rate-0',city,start+ACTIVE_WINDOW+9,'limited-ip');
  const preview=new RedisVisitors(endpoint,'integration-only','test:preview');
  assert.equal((await preview.snapshot(start)).total,0);
  await preview.record('one-session',city,start);
  assert.equal((await preview.snapshot(start+1)).total,1);
  assert.equal((await store.snapshot(start+ACTIVE_WINDOW+10)).total,63);
  assert.equal(snapshot.mode,'live');
 }finally{
  if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}
  await rm(directory,{recursive:true,force:true});
 }
});
