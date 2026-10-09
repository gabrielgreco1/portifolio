// A reading document groups the captured fields by their professional meaning.
// The original collection is always preserved in the attached JSON.
export function collectionDocument(collection) {
 const pt=collection.page.language==='pt';
 const groups=type=>collection.records.filter(record=>record.type===type);
 const profile=groups('profile')[0]?.fields,contact=groups('contact')[0]?.fields;
 const experiences=groups('experience'),projects=groups('project'),skills=groups('skill_group'),services=groups('service');
 const scope=collection.coverage.scope;
 const title=scope==='resume'?(pt?'Perfil profissional':'Professional profile'):scope==='experiences'?(pt?'Experiência profissional':'Professional experience'):scope==='projects'?(pt?'Projetos selecionados':'Selected projects'):scope==='skills'?(pt?'Tecnologias & ferramentas':'Technologies & tools'):scope?.startsWith('company:')?experiences[0]?.fields.name:(pt?'Conteúdo selecionado':'Selected content');
 const blocks=[];
 const add=(kind,text,extra={})=>{if(text)blocks.push({kind,text,...extra});};
 if(profile?.description)add('lead',profile.description);
 if(contact?.email)add('contact',contact.email);
 for(const link of [...(profile?.links||[]),...(contact?.links||[])])if(/^https?:/.test(link.url)&&!link.url.includes(new URL(collection.page.url).host))add('link',link.url.replace(/^https?:\/\//,''),{url:link.url});
 if(experiences.length){
  if(!scope?.startsWith('company:'))add('section',pt?'Experiência':'Experience');
  for(const record of experiences){
   const f=record.fields;
   if(!scope?.startsWith('company:'))add('company',f.name,{id:record.id});
   add('role',f.role);
   add('meta',[f.period,f.location].filter(Boolean).join('  /  '));
   add('body',f.description);
   if(f.metrics?.length)add('metrics',f.metrics.join('   ·   '));
   for(const chapter of f.chapters||[]){
    add('chapter',[chapter.label,chapter.period].filter(Boolean).join(' / '));
    add('subtitle',chapter.title);
    add('body',chapter.description);
    for(const task of chapter.tasks||[])add('bullet',task);
   }
   // Scoped/manual captures can contain fields other than a full employment.
   if(!f.chapters?.length&&f.text)add('body',typeof f.text==='string'?f.text:JSON.stringify(f.text));
   if(!f.description&&!f.chapters?.length&&!f.role)for(const quote of f.quotes||[])add('quote',quote);
  }
 }
 if(projects.length){add('section',pt?'Projetos':'Projects');blocks.push({kind:'cards',cards:projects.map(({fields:f})=>({title:f.name,body:f.description,meta:f.technologies?.join(' · '),url:f.url}))});}
 if(skills.length){add('section',pt?'Tecnologias':'Technologies');blocks.push({kind:'cards',cards:skills.map(({fields:f})=>({title:f.category||f.name,body:f.items?.join(' · ')}))});}
 if(services.length){add('section',pt?'Áreas de atuação':'Areas of work');blocks.push({kind:'cards',cards:services.map(({fields:f})=>({title:f.name,body:f.description}))});}
 // A hand-picked fragment may be a slogan, image, or contextual heading. It
 // must still be visible when that is exactly what the visitor chose.
 if(scope==='selection'||!blocks.length){
  const rendered=new Set([...experiences,...projects,...skills,...services].flatMap(r=>r.evidence_ids));
  for(const item of collection.evidence){if(rendered.has(item.id))continue;
   add('chapter',item.label);
   if(item.kind==='image')add('image',item.raw.alt||'Image',{url:item.raw.source_url});
   else if(typeof item.raw==='string')add('body',item.raw);
   else add('body',JSON.stringify(item.raw));
  }
  for(const item of collection.evidence.filter(item=>item.kind==='image'&&rendered.has(item.id)))add('image',item.raw.alt||'Image',{url:item.raw.source_url});
 }
 return {title:title||'Gabriel Greco',name:'Gabriel Greco',pt,blocks,complete:collection.coverage.requested_complete,
  counts:{experiences:experiences.length,projects:projects.length,skills:skills.reduce((n,r)=>n+(r.fields.items?.length||0),0),services:services.length}};
}
