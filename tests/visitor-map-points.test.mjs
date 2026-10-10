import test from 'node:test';
import assert from 'node:assert/strict';
import {mapPoints,pointText,recordedVisits} from '../src/lib/visitors/map-points.mjs';
const archive=[{id:'ga1',city:'Sao Paulo',name:'São Paulo',country:'BR',latitude:-23.5,longitude:-46.6,activeUsers:129,engagedSessions:39}];
test('one city ledger includes the opening balance once and current visits, preserving originals',()=>{
 const live=[{id:'live1',city:'São Paulo',country:'BR',latitude:-23.55,longitude:-46.63,visits:41,active:2}];
 const points=mapPoints(archive,live);assert.equal(points.length,1);assert.equal(points[0].visits,170);assert.equal(points[0].importedVisits,129);assert.equal(points[0].trackedVisits,41);assert.equal(points[0].active,2);assert.equal(archive[0].activeUsers,129);assert.equal(archive[0].visits,undefined);assert.equal(live[0].visits,41);assert.deepEqual(mapPoints(archive,live),points);
});
test('multiple current records for one city accumulate instead of overwriting each other',()=>{
 const live=[{city:'São Paulo',country:'BR',latitude:-23.55,longitude:-46.63,visits:10,active:1},{city:'São Paulo',country:'BR',latitude:-23.54,longitude:-46.62,visits:5,active:2}];
 const [point]=mapPoints(archive,live);assert.equal(point.visits,144);assert.equal(point.active,3);
});
test('different cities with the same name and missing locations remain distinct',()=>{
 const points=mapPoints(archive,[{id:'other',city:'Sao Paulo',country:'BR',latitude:0,longitude:0,visits:2},{id:'unknown',city:'Sao Paulo',country:'BR',visits:1}]);assert.equal(points.length,3);assert.equal(points.find(p=>p.id==='unknown').latitude,undefined);
});
test('one label across historical-only, mixed, and new cities; presence remains live-only',()=>{
 const p=mapPoints(archive,[])[0];assert.equal(pointText(p),'129 visitas registradas');assert.doesNotMatch(pointText(p),/ativo|online|histórico/i);assert.equal(pointText({...p,active:2,visits:170}),'2 online agora · 170 visitas registradas');
 assert.equal(pointText({visits:1}),'1 visita registrada');assert.equal(pointText({visits:1},'en'),'1 recorded visit');assert.equal(pointText({visits:2},'en'),'2 recorded visits');
});
test('authoritative imported total survives refresh, outages, and overlapping city aggregates',()=>{
 const history={reportedTotals:{activeUsers:869},points:[{activeUsers:876}]};
 assert.equal(recordedVisits(history,{total:58}),927);assert.equal(recordedVisits(history,{total:58}),927);assert.equal(recordedVisits(history,{total:59}),928);assert.equal(recordedVisits(history,null),869);assert.equal(history.reportedTotals.activeUsers,869);
});
