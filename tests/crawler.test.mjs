import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import { createCollection, commitEvidence, fingerprint } from '../src/lib/crawler/collection.mjs';
import { jsonLines } from '../src/lib/crawler/json.mjs';
import { buildCollectionPdf } from '../src/lib/crawler/pdf.mjs';

const page = { url: 'https://example.test/pt', title: 'Portfolio', language: 'pt' };
function evidence(id, kind, raw, owner = 'experience:company', field = 'description') {
  return { id: `ev-${id}`, target_id: id, kind, owner_id: owner, label: owner.startsWith('project') ? 'Projeto' : 'Empresa', field, raw, normalized: raw, captured_at: '2026-10-07T00:00:00.000Z', source: {page_url: page.url, anchor: `#${id}`, crawl_id: id, snapshot_revision: fingerprint(raw)}, quality: {status:'complete', warnings:[]} };
}
const description = evidence('description','text','Descrição com acentos e dados reais.');
const quote = evidence('quote','quote','Uma frase inteira, não um ícone.','experience:company','quotes');
const image = evidence('image','image',{source_url:'https://example.test/logo.png',alt:'Logo',width:10,height:10,binary_included:false},'experience:company','images');
const project = evidence('project','project',{name:'Projeto',description:'Texto do projeto',url:'https://example.test/project',technologies:['Python','Next.js']},'project:one','project');

function collection() { return [description,image,quote,project].reduce(commitEvidence,createCollection(page,['description','image','quote','project'])); }

test('four fragments become two records with complete field provenance', () => {
  const result=collection();
  assert.equal(result.records.length,2);
  assert.equal(result.evidence.length,4);
  assert.equal(result.records[0].fields.description,description.raw);
  assert.deepEqual(result.records[0].fields.quotes,[quote.raw]);
  assert.deepEqual(result.records[0].fields.images,[image.raw]);
  assert.deepEqual(result.records[1].fields.technologies,project.raw.technologies);
  for (const origin of Object.values(result.field_origins)) for (const id of origin.evidence_ids) assert.ok(result.evidence.some(e=>e.id===id));
  assert.deepEqual(result.field_origins['/records/0/fields/quotes/0'].evidence_ids,['ev-quote']);
  assert.equal(result.coverage.complete,false);
});

test('pause/resume cannot duplicate a committed fragment; a changed revision replaces it', () => {
  const first=collection(); assert.equal(commitEvidence(first,description),first);
  const revised=evidence('description','text','Uma fonte revisada.'); const result=commitEvidence(first,revised);
  assert.equal(result.evidence.length,4); assert.equal(result.records[0].fields.description,revised.raw);
  assert.deepEqual(result.coverage.captured_ids,first.coverage.captured_ids);
  assert.equal(first.records[0].fields.description,description.raw);
});

test('empty or unverified sources cannot enter an export', () => {
  assert.throws(()=>commitEvidence(collection(),{...description,raw:'',quality:{status:'empty'}}),/unverified/);
});

test('annotated JSON preserves valid serialization and maps nested fields and escaped keys', () => {
  const doc={records:collection().records,...collection(),edge:{'a/b~c':['aspas "',null,false,0,{},[]]}};
  const lines=jsonLines(doc,{...doc.field_origins,'/edge/a~1b~0c':{evidence_ids:['edge']}});
  assert.equal(lines.map(l=>l.text).join('\n'),JSON.stringify(doc,null,2));
  assert.ok(lines.find(l=>l.text.includes('Uma frase inteira')).evidence_ids.includes('ev-quote'));
  assert.deepEqual(lines.find(l=>l.text.includes('aspas')).evidence_ids,['edge']);
});

test('PDF succeeds when an image is unavailable and embeds the identical JSON', async () => {
  const doc={records:collection().records,...collection()};
  const bytes=await buildCollectionPdf(doc,async()=>({ok:false}));
  const pdf=await PDFDocument.load(bytes); assert.ok(pdf.getPageCount()>=1);
  // The attachment is a PDF file specification, not an unrelated reconstructed schema.
  const names=pdf.catalog.lookup(PDFName.of('Names'),PDFDict);
  const embedded=names.lookup(PDFName.of('EmbeddedFiles'),PDFDict).lookup(PDFName.of('Names'),PDFArray);
  const spec=embedded.lookup(1,PDFDict);
  const stream=spec.lookup(PDFName.of('EF'),PDFDict).lookup(PDFName.of('F'),PDFRawStream);
  assert.equal(new TextDecoder().decode(decodePDFRawStream(stream).decode()),JSON.stringify(doc,null,2));
});

test('complete experience preserves employment, both chapters and every task', () => {
  const job=evidence('job','employment',{name:'Empresa',role:'Software Engineer',period:'2025 — 2026',location:'Irlanda',company_url:'https://example.test/company'});
  const chapters=[1,2].map(i=>evidence(`chapter-${i}`,'chapter',{label:`Área ${i}`,title:`Experiência ${i}`,period:null,description:`Descrição ${i}`,tasks:[`Atividade ${i}.1`,`Atividade ${i}.2`]},'experience:company','chapters'));
  const doc=[job,...chapters].reduce(commitEvidence,createCollection(page,['job','chapter-1','chapter-2']));
  assert.equal(doc.records[0].fields.role,'Software Engineer');
  assert.equal(doc.records[0].fields.chapters.length,2);
  assert.deepEqual(doc.records[0].fields.chapters.flatMap(chapter=>chapter.tasks),chapters.flatMap(chapter=>chapter.raw.tasks));
  assert.deepEqual(doc.field_origins['/records/0/fields/chapters/1'].evidence_ids,['ev-chapter-2']);
});

test('full coverage is certified only when every available résumé fragment was captured', async () => {
  const {finalizeCollection}=await import('../src/lib/crawler/collection.mjs');
  const partial=finalizeCollection(commitEvidence(createCollection(page,['description'],'experiences',['description','quote']),description));
  assert.equal(partial.coverage.requested_complete,true);assert.equal(partial.coverage.complete,false);
  const all=finalizeCollection([description,quote].reduce(commitEvidence,createCollection(page,['description','quote'],'resume',['description','quote'])));
  assert.equal(all.coverage.complete,true);assert.equal(all.session.status,'completed');
  const failed=finalizeCollection(commitEvidence(createCollection(page,['description','quote'],'resume',['description','quote']),description));
  assert.equal(failed.coverage.requested_complete,false);assert.equal(failed.coverage.complete,false);assert.equal(failed.session.status,'partial');
});

test('more content accelerates every capture without changing the source list', async () => {
  const {captureTiming}=await import('../src/lib/crawler/pace.mjs');
  for (const count of [4,7,29,52]) {
    const timing=captureTiming(count,1);
    assert.ok(timing.encode>=85);assert.ok(timing.frame>=34);
    if(count>4)assert.ok(timing.unit<=captureTiming(count-1,1).unit);
  }
  assert.ok(captureTiming(52,1).unit<captureTiming(29,1).unit);
  assert.ok(captureTiming(29,1).unit<captureTiming(7,1).unit);
  // A small selection must never expand to fill a long tour budget.
  assert.ok(captureTiming(1).unit<=1000);
  const captureBudget = count => Array.from({length:count},(_,i)=>captureTiming(count,i)).reduce((sum,t)=>sum+t.scan+t.lift+t.hold+t.encode+t.confirm+t.gap+t.frame+t.move*1000+t.camera,0);
  assert.ok(captureBudget(7)<7500);
  assert.ok(captureBudget(52)<30000);
});

test('phone layouts keep the dialog and the complete fragment stack on screen in both orientations', async () => {
  const {crawlerGeometry}=await import('../src/lib/crawler/geometry.mjs');
  for (const [width,height] of [[320,568],[360,640],[390,844],[430,932],[568,320],[667,375],[844,390]]) {
    const g=crawlerGeometry(width,height);
    assert.equal(g.mobile,true);
    assert.ok(g.left>=0 && g.top>=0);
    assert.ok(g.left+g.width<=width && g.top+g.height<=height);
    const stackBottom=g.dockY+g.pet*1.049+3*g.pileStep+g.pileTail+20;
    assert.ok(stackBottom<=height-84,`${width}×${height}: pile must clear the touch controls`);
  }
});

test('fragment animation keeps its final pose when commitStyles is unavailable', async () => {
  const {animateElement}=await import('../src/lib/crawler/motion.mjs');
  let cancelled=false;
  const element={style:{},animate:()=>({finished:Promise.resolve(),cancel:()=>{cancelled=true;}})};
  await animateElement(element,[{transform:'translateY(0)',opacity:1},{transform:'translateY(20px) scale(.1)',opacity:0}],{duration:100},new AbortController().signal);
  assert.equal(element.style.transform,'translateY(20px) scale(.1)');
  assert.equal(element.style.opacity,'0');assert.equal(cancelled,true);
});
