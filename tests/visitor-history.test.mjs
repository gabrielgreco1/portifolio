import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=readFileSync(new URL('../data/analytics/ga4-cities-2026-10-08.psv',import.meta.url),'utf8');
const history=JSON.parse(readFileSync(new URL('../src/data/visitor-history.json',import.meta.url),'utf8'));
test('historical dataset preserves all captured Google rows, provenance and reported totals',()=>{
 assert.equal(createHash('sha256').update(raw).digest('hex'),history.sourceSha256);
 let hash=2166136261;for(const ch of raw)hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;assert.equal(hash.toString(16),'3c6372e5','Matches the complete 320-row browser capture');
 const rows=raw.trimEnd().split('\n').slice(1).map(row=>row.split('|'));
 assert.equal(rows.length,320);assert.equal(history.points.length,rows.length);assert.equal(new Set(history.points.map(p=>p.id)).size,320);
 for(const [i,row]of rows.entries()){assert.equal(history.points[i].city,row[0]);assert.equal(history.points[i].activeUsers,+row[2]);assert.equal(history.points[i].engagedSessions,+row[3]);}
 assert.deepEqual(history.reportedTotals,{activeUsers:869,engagedSessions:278});
 assert.equal(history.points.reduce((sum,p)=>sum+p.activeUsers,0),876,'Row sum differs from report total and must not replace it');
 assert.equal(history.points.reduce((sum,p)=>sum+p.engagedSessions,0),282);
 assert.equal(history.filters.hostnameRegex,'^(www\\.)?gabrielgreco\\.com$');assert.equal(history.filters.streamId,'16056749338');
 assert.deepEqual(history.period,{start:'2020-01-01',end:'2026-10-08'});
});
test('historical cities never manufacture individual sessions or place ambiguous cities',()=>{
 assert.equal(history.signals,undefined);assert.equal(history.active,undefined);assert.equal(history.activity,undefined);
 for(const point of history.points){
  assert.equal(point.firstSeen,undefined);assert.equal(point.lastSeen,undefined);assert.equal(point.active,undefined);assert.equal(point.visits,undefined);
  if(point.locationStatus==='matched'){assert.ok(point.geonameId);assert.ok(Number.isFinite(point.latitude)&&Math.abs(point.latitude)<=90);assert.ok(Number.isFinite(point.longitude)&&Math.abs(point.longitude)<=180);}
  else{assert.equal(point.latitude,null);assert.equal(point.longitude,null);}
 }
 const sp=history.points.find(p=>p.city==='Sao Paulo');assert.equal(sp.geonameId,'3448439');assert.deepEqual([sp.latitude,sp.longitude],[-23.5,-46.6]);
 const ambiguous=history.points.find(p=>p.city==='Glenview');assert.equal(ambiguous.locationStatus,'ambiguous');assert.equal(ambiguous.activeUsers,5);
 assert.equal(history.points.filter(p=>p.city==='(not set)').length,9);
 assert.equal(history.coordinateSource.license,'CC BY 4.0');
});
