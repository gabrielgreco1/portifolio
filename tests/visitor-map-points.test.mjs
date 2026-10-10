import test from 'node:test';
import assert from 'node:assert/strict';
import {mapPoints,pointText,archiveSessionsText} from '../src/lib/visitors/map-points.mjs';
const archive=[{id:'ga1',city:'Sao Paulo',name:'São Paulo',country:'BR',latitude:-23.5,longitude:-46.6,activeUsers:129,engagedSessions:39}];
test('merges same city without adding incompatible visit and user metrics',()=>{
 const live=[{id:'live1',city:'São Paulo',country:'BR',latitude:-23.55,longitude:-46.63,visits:41,active:2}];
 const points=mapPoints(archive,live);assert.equal(points.length,1);assert.equal(points[0].archiveUsers,129);assert.equal(points[0].visits,41);assert.equal(points[0].active,2);assert.equal(points[0].regionDisplay,undefined);assert.deepEqual(archive[0].activeUsers,129);assert.equal(archive[0].visits,undefined);
});
test('does not combine same name in geographically different cities or fabricate location',()=>{
 const points=mapPoints(archive,[{id:'other',city:'Sao Paulo',country:'BR',latitude:0,longitude:0,visits:2},{id:'unknown',city:'Sao Paulo',country:'BR',visits:1}]);assert.equal(points.length,3);assert.equal(points.find(p=>p.id==='unknown').latitude,undefined);
});
test('historical labels never imply presence online; live and historical counts coexist',()=>{
 const p=mapPoints(archive,[])[0];assert.equal(pointText(p),'129 usuários no histórico');assert.equal(pointText(p,'en'),'129 users in the archive');assert.doesNotMatch(pointText(p),/ativo|online/i);assert.match(pointText({...p,active:2,visits:41}),/^2 online agora · 41 visitas registradas · 129 usuários no histórico$/);
});

test('singular and plural labels follow the actual count in Portuguese and English',()=>{
 assert.equal(pointText({visits:1,archiveUsers:1}),'1 visita registrada · 1 usuário no histórico');
 assert.equal(pointText({visits:1,archiveUsers:1},'en'),'1 recorded visit · 1 user in the archive');
 assert.equal(pointText({visits:2,archiveUsers:2}),'2 visitas registradas · 2 usuários no histórico');
 assert.equal(pointText({visits:2,archiveUsers:2},'en'),'2 recorded visits · 2 users in the archive');
 assert.equal(archiveSessionsText(1),'1 sessão engajada no histórico');
 assert.equal(archiveSessionsText(2),'2 sessões engajadas no histórico');
 assert.equal(archiveSessionsText(1,'en'),'1 engaged session in the archive');
 assert.equal(archiveSessionsText(2,'en'),'2 engaged sessions in the archive');
});
