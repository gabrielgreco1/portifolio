const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const located=p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude);
// Imported user counts are the preserved opening balance of the public visit ledger.
// Keep original GA metrics intact; this is not a retroactive session reconstruction.
export function mapPoints(archive,live){
 const points=archive.map(p=>({...p,city:p.name||p.city,active:0,visits:Number(p.activeUsers)||0,importedVisits:Number(p.activeUsers)||0,trackedVisits:0}));
 for(const p of live){
  const match=points.find(a=>a.country===p.country&&located(a)&&located(p)&&Math.abs(a.latitude-p.latitude)<.5&&Math.abs(a.longitude-p.longitude)<.5&&(normalize(a.city)===normalize(p.city)||normalize(a.name)===normalize(p.city)));
  if(match)Object.assign(match,{visits:match.visits+Number(p.visits||0),trackedVisits:match.trackedVisits+Number(p.visits||0),active:match.active+(p.active||0),firstSeen:p.firstSeen,lastSeen:p.lastSeen,liveId:p.id,regionDisplay:match.regionDisplay||p.region});
  else points.push({...p,active:p.active||0,importedVisits:0,trackedVisits:Number(p.visits)||0});
 }
 return points.sort((a,b)=>(b.active||0)-(a.active||0)||(b.visits||0)-(a.visits||0));
}
// Use the authoritative report total, never the sum of overlapping city rows.
export function recordedVisits(history,live){
 return Number(history?.reportedTotals?.activeUsers||0)+Number(live?.total||0);
}
export function pointText(point,lang='pt'){
 const pt=lang==='pt',format=n=>Number(n||0).toLocaleString(pt?'pt-BR':'en-US');
 return [point.active?`${format(point.active)} ${pt?'online agora':'online now'}`:null,point.visits?`${format(point.visits)} ${pt?(Number(point.visits)===1?'visita registrada':'visitas registradas'):(Number(point.visits)===1?'recorded visit':'recorded visits')}`:null].filter(Boolean).join(' · ');
}
