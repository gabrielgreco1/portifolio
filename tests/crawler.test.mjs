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
