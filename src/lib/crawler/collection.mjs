export function fingerprint(value) {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}

// Choose actual published nodes, in reading order. Individual technologies remain
// selectable but full scopes collect their containing group without duplication.
export function scopeTargets(root, scope = 'resume') {
  const nodes = [...root.querySelectorAll('main [data-crawl-id]')].filter(node => node.dataset.crawlFull !== 'false');
  return nodes.filter(node => {
    if (scope === 'resume') return true;
    if (scope.startsWith('company:')) return node.closest('[data-crawl-record]')?.dataset.crawlRecord === `experience:${scope.slice(8)}`;
    return !!node.closest({experiences:'#experience',projects:'#projects',skills:'#skills'}[scope] || '[data-no-such-scope]');
  }).map(node => node.dataset.crawlId);
}

export function createCollection(page, ids = [], scope = 'selection', availableIds = []) {
  return {
    schema_version: '1.1.0',
    session: { id: globalThis.crypto.randomUUID(), started_at: new Date().toISOString(), completed_at: null, status: 'collecting', language: page.language },
    page,
    coverage: { scope, definition: 'published_resume_content', complete: false, requested_complete: false, target_ids: [...ids], available_ids: [...availableIds], captured_ids: [], failed_ids: [] },
    records: [], evidence: [], field_origins: {}, warnings: [],
  };
}

export function finalizeCollection(collection) {
  const has = id => collection.coverage.captured_ids.includes(id);
  const requested = collection.coverage.target_ids.length > 0 && collection.coverage.target_ids.every(has);
  const complete = collection.coverage.available_ids.length > 0 && collection.coverage.available_ids.every(has);
  return {...collection, session: {...collection.session, status: requested ? 'completed' : 'partial', completed_at: new Date().toISOString()}, coverage: {...collection.coverage, requested_complete: requested, complete}};
}

export function readTarget(element) {
  if (!element?.isConnected) throw new Error('Target unavailable');
  const id = element.dataset.crawlId, kind = element.dataset.crawlKind;
  const parent = element.closest('[data-crawl-record]');
  const owner = element.dataset.crawlOwner || parent?.dataset.crawlRecord || `content:${id}`;
  const text = selector => element.querySelector(selector)?.textContent.replace(/\s+/g, ' ').trim() || null;
  const href = selector => element.querySelector(selector)?.href || null;
  const name = parent?.dataset.crawlName || parent?.querySelector('h3, h2')?.textContent.trim() || element.textContent.trim();
  let raw;
  if (kind === 'image') {
    const resolve = path => path ? new URL(path, document.baseURI).href : null;
    raw = { source_url: resolve(element.dataset.crawlSource || element.getAttribute('src')), displayed_url: resolve(element.currentSrc || element.getAttribute('src')), alt: element.getAttribute('alt') || '', width: element.naturalWidth, height: element.naturalHeight, binary_included: false };
  } else if (kind === 'employment') {
    raw = {name: text('[data-crawl-value="name"]'), role: text('[data-crawl-value="role"]'), period: text('[data-crawl-value="period"]'), location: text('[data-crawl-value="location"]'), company_url: href('[data-crawl-value="company_url"]')};
  } else if (kind === 'chapter') {
    raw = {label: text('.chapter-label-row p'), title: text('h4'), period: text('.chapter-period'), description: text('.chapter-text'), tasks: [...element.querySelectorAll('.entry-tasks li')].map(node => node.textContent.trim())};
  } else if (kind === 'list') {
    raw = [...element.querySelectorAll('span')].map(node => node.textContent.trim());
  } else if (kind === 'statistics') {
    raw = [...element.querySelectorAll('.hero-stat')].map(node => ({value:node.querySelector('strong').textContent.trim(),description:node.querySelector('span').textContent.trim(),context:node.querySelector('a').textContent.trim(),source_url:node.querySelector('a').href}));
  } else if (kind === 'technology_group') {
    raw = {category:text('h3'),items:[...element.querySelectorAll('.skill-tags span')].map(node => node.textContent.trim())};
  } else if (kind === 'project') {
    raw = { name, category:text('.project-type'), description: text('p') || '', url: element.closest('a')?.href || null, technologies: (text('.project-tags') || '').split('·').map(s => s.trim()).filter(Boolean) };
  } else if (kind === 'service') {
    raw = {name:text('h3'),description:text('p'),evidence_label:text('.service-evidence'),evidence_url:href('.service-evidence')};
  } else if (kind === 'contact') {
    raw = {title:text('h2'),description:text('.contact-desc'),email:text('.contact-email'),links:[...element.querySelectorAll('.contact-links a')].map(node => ({label:node.textContent.trim(),url:node.href}))};
  } else if (kind === 'links') {
    raw = [...element.querySelectorAll('a')].map(node => ({label:node.textContent.trim(),url:node.href}));
  } else raw = (element.innerText || element.textContent).replace(/\s+/g, ' ').trim();
  const field = element.dataset.crawlField || ({image:'images',quote:'quotes',technology:'name',chapter:'chapters',statistics:'statistics'}[kind] || 'text');
  const valid = kind === 'image' ? !!(raw.source_url && raw.width && raw.height) : kind === 'project' ? !!(raw.name && raw.description) : kind === 'chapter' ? !!(raw.title && raw.tasks.length) : !!raw;
  return {
    id:`ev-${id}`,target_id:id,kind,owner_id:owner,record_name:name,label:kind === 'chapter' ? `${name} · ${raw.label}` : name,field,raw,normalized:raw,
    source:{page_url:`${window.location.origin}${window.location.pathname}`,anchor:`#${element.id || element.closest('[id]')?.id}`,crawl_id:id,snapshot_revision:fingerprint(raw)},
    captured_at:new Date().toISOString(),quality:{status:valid?'complete':'empty',warnings:[]},
  };
}

export function commitEvidence(collection, evidence) {
  if (evidence.quality.status !== 'complete') throw new Error('Cannot commit an unverified fragment');
  const old = collection.evidence.find(item => item.id === evidence.id);
  if (old?.source.snapshot_revision === evidence.source.snapshot_revision) return collection;
  const all = old ? collection.evidence.map(item => item.id === evidence.id ? evidence : item) : [...collection.evidence,evidence];
  const groups = new Map();
  for (const item of all) {
    if (!groups.has(item.owner_id)) groups.set(item.owner_id,{id:item.owner_id,type:item.owner_id.split(':')[0],fields:{name:item.record_name || item.label},evidence_ids:[],origins:{name:[item.id]}});
    const record = groups.get(item.owner_id); record.evidence_ids.push(item.id);
    if (['project','employment','technology_group','service','contact'].includes(item.kind)) {
      Object.assign(record.fields,item.normalized);
      for (const key of Object.keys(item.normalized)) record.origins[key] = [item.id];
    } else if (['images','quotes','chapters'].includes(item.field)) {
      const field = record.fields[item.field] ||= [], index = field.length;
      field.push(item.normalized); record.origins[`${item.field}/${index}`] = [item.id];
    } else { record.fields[item.field] = item.normalized; record.origins[item.field] = [item.id]; }
  }
  const records = [], origins = {};
  [...groups.values()].forEach(({origins:source,...record},index) => {
    records.push(record);
    for (const [field,ids] of Object.entries(source)) origins[`/records/${index}/fields/${field}`] = {evidence_ids:ids,rule:'verbatim'};
  });
  return {...collection,records,evidence:all,field_origins:origins,coverage:{...collection.coverage,captured_ids:all.map(item => item.target_id)}};
}

export function exportName(collection,extension) {
  const {language}=collection.page,scope=collection.coverage.scope;
  if(extension==='pdf'){
    const names=language==='pt'?{resume:'curriculo',experiences:'experiencias',projects:'projetos',skills:'tecnologias'}:{resume:'resume',experiences:'experience',projects:'projects',skills:'technologies'};
    const name=names[scope]||(scope?.startsWith('company:')?scope.slice(8):language==='pt'?'selecao':'selection');
    return `gabriel-greco-${name.replace(/[^a-z0-9-]/gi,'-')}-${language}.pdf`;
  }
  return `gabriel-greco-coleta-${collection.session.started_at.slice(0,10)}-${language}.${extension}`;
}
export function downloadFile(bytes,name,mime) {
  const url = URL.createObjectURL(new Blob([bytes],{type:mime}));
  const link = document.createElement('a'); link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),30000);
}
