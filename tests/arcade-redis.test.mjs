import{test}from'node:test';import assert from'node:assert/strict';import{spawn,execFile}from'node:child_process';import{promisify}from'node:util';import{createServer}from'node:http';import{mkdtemp,rm,access}from'node:fs/promises';import{join,dirname}from'node:path';import{tmpdir}from'node:os';import{once}from'node:events';import{setTimeout as delay}from'node:timers/promises';import{RedisArcade}from'../src/lib/arcade/storage.mjs';
const execute=promisify(execFile);
test('real Redis atomically publishes one best, makes retries idempotent, expires runs and isolates boards',{skip:!process.env.REDIS_SERVER_BIN,timeout:30000},async()=>{
 const directory=await mkdtemp(join(tmpdir(),'arcade-redis-test-')),socket=join(directory,'redis.sock');
 const child=spawn(process.env.REDIS_SERVER_BIN,['--port','0','--unixsocket',socket,'--save','','--appendonly','no','--dir',directory],{stdio:'ignore'});
 const command=async args=>JSON.parse((await execute(join(dirname(process.env.REDIS_SERVER_BIN),'redis-cli'),['-s',socket,'--json',...args.map(String)])).stdout);let server;
 try{
  let ready=false;for(let i=0;i<100;i++){try{await access(socket);if(await command(['PING'])==='PONG'){ready=true;break;}}catch{}await delay(20);}assert.ok(ready);
  server=createServer(async(req,res)=>{try{assert.equal(req.headers.authorization,'Bearer local-integration');const chunks=[];for await(const chunk of req)chunks.push(chunk);const result=await command(JSON.parse(Buffer.concat(chunks).toString()));res.end(JSON.stringify({result}));}catch{res.writeHead(500).end('{}');}});server.listen(0,'127.0.0.1');await once(server,'listening');
  const endpoint=`http://127.0.0.1:${server.address().port}`,store=new RedisArcade(endpoint,'local-integration','test:arcade:production');
  const run={id:'run-1',owner:'owner-1',game:'runner',version:'runner-3',expiresAt:Date.now()+1200000};await store.create(run);assert.ok(await command(['TTL','test:arcade:production:run:run-1'])>1195);
  const entry={id:'public-1',name:'TEST ONLY',score:100,seconds:5,at:new Date().toISOString()};
  const results=await Promise.all(Array.from({length:20},()=>store.finish(run,'identical-proof',entry)));assert.ok(results.every(r=>r.score===100&&r.rank===1));assert.equal((await store.board('runner-3')).length,1);
  await assert.rejects(store.finish(run,'other-proof',{...entry,score:10000}),/run_used/);
  const other={...run,id:'run-2'};await store.create(other);await store.finish(other,'second-proof',{...entry,name:'RENAMED PLAYER',score:90});assert.equal((await store.board('runner-3'))[0].score,100);assert.equal((await store.board('runner-3'))[0].name,'RENAMED PLAYER');
  const better={...run,id:'run-3'};await store.create(better);await store.finish(better,'third-proof',{...entry,score:200});assert.equal((await store.board('runner-3'))[0].score,200);
  for(let i=0;i<105;i++){const r={...run,id:`extra-${i}`,owner:`owner-${i}`};await store.create(r);await store.finish(r,`proof-${i}`,{...entry,id:`public-${i+2}`,score:i+10});}
  assert.equal(await command(['ZCARD','test:arcade:production:board:runner-3']),106);assert.equal(await command(['HLEN','test:arcade:production:names:runner-3']),106);assert.equal((await store.board('runner-3')).length,10);
  const comparison=await store.compare('runner-3',{...entry,id:'new-player',score:1});assert.equal(comparison.rank,107);assert.equal(comparison.entries.length,10);assert.equal(comparison.personal.rank,107);assert.equal(await store.personal('runner-3','new-player'),null);
  assert.equal((await store.personal('runner-3','public-2')).rank,106);
  const top=await store.compare('runner-3',{...entry,id:'public-2',score:500});assert.equal(top.rank,1);assert.equal(top.entries[0].id,'public-2');assert.equal(top.entries.filter(row=>row.id==='public-2').length,1);
  const tied=await store.compare('runner-3',{...entry,id:'zz-tie',score:200});assert.equal(tied.rank,1);
  const preview=new RedisArcade(endpoint,'local-integration','test:arcade:preview');assert.deepEqual(await preview.board('runner-3'),[]);assert.deepEqual(await store.board('invaders-1'),[]);
  for(let i=0;i<4;i++)await store.limit('one-actor',4,60);await assert.rejects(store.limit('one-actor',4,60),/rate_limited/);assert.ok(await command(['TTL','test:arcade:production:limit:one-actor'])>0);
  await command(['PEXPIRE','test:arcade:production:run:run-1',1]);await delay(5);assert.equal(await store.get(run.id),null);await assert.rejects(store.finish(run,'identical-proof',entry),/run_expired/);
 }finally{if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}await rm(directory,{recursive:true,force:true});}
});
