const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const located=p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude);
// The archive counts users over a period; the live store counts visits. Never add them.
export function mapPoints(archive,live){
 const points=archive.map(p=>({...p,city:p.name||p.city,active:0,visits:0,archiveUsers:p.activeUsers,archiveSessions:p.engagedSessions}));
 for(const p of live){
  const match=points.find(a=>a.country===p.country&&located(a)&&located(p)&&Math.abs(a.latitude-p.latitude)<.5&&Math.abs(a.longitude-p.longitude)<.5&&(normalize(a.city)===normalize(p.city)||normalize(a.name)===normalize(p.city)));
  if(match)Object.assign(match,{visits:p.visits,active:p.active||0,firstSeen:p.firstSeen,lastSeen:p.lastSeen,liveId:p.id,regionDisplay:match.regionDisplay||p.region});
  else points.push({...p,active:p.active||0,archiveUsers:0});
 }
 return points.sort((a,b)=>(b.active||0)-(a.active||0)||(b.visits||0)-(a.visits||0)||(b.archiveUsers||0)-(a.archiveUsers||0));
}
export function pointText(point,lang='pt'){
 const pt=lang==='pt',format=n=>Number(n||0).toLocaleString(pt?'pt-BR':'en-US');
 return [point.active?`${format(point.active)} ${pt?'online agora':'online now'}`:null,point.visits?`${format(point.visits)} ${pt?'visitas registradas':'recorded visits'}`:null,point.archiveUsers?`${format(point.archiveUsers)} ${pt?'usuários no histórico':'users in the archive'}`:null].filter(Boolean).join(' · ');
}
