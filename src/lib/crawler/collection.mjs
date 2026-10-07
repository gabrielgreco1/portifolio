export const TOUR = ["zyte-summary", "zyte-logo", "zyte-quote", "project-0"];

export function fingerprint(value) {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}

export function createCollection(page, ids = TOUR, scope = "tour") {
  return {
    schema_version: "1.0.0",
    session: { id: globalThis.crypto.randomUUID(), started_at: new Date().toISOString(), completed_at: null, status: "collecting", language: page.language },
    page,
    coverage: { scope, complete: false, requested_complete: false, target_ids: [...ids], captured_ids: [], failed_ids: [] },
    records: [], evidence: [], field_origins: {}, warnings: [],
  };
}

export function readTarget(element) {
  if (!element?.isConnected) throw new Error("Target unavailable");
  const id = element.dataset.crawlId;
  const kind = element.dataset.crawlKind;
  const parent = element.closest("[data-crawl-record]");
  const owner = element.dataset.crawlOwner || parent?.dataset.crawlRecord || `content:${id}`;
  const name = parent?.querySelector("h3")?.textContent.trim() || element.textContent.trim();
  let raw;
  if (kind === "image") {
    const resolve = (path) => path ? new URL(path, document.baseURI).href : null;
    raw = { source_url: resolve(element.dataset.crawlSource || element.getAttribute("src")), displayed_url: resolve(element.currentSrc || element.getAttribute("src")), alt: element.getAttribute("alt") || "", width: element.naturalWidth, height: element.naturalHeight, binary_included: false };
  } else if (kind === "project") {
    raw = { name, description: element.querySelector("p")?.textContent.trim() || "", url: element.closest("a")?.href || null, technologies: (element.querySelector(".project-tags")?.textContent || "").split("·").map((s) => s.trim()).filter(Boolean) };
  } else raw = element.textContent.replace(/\s+/g, " ").trim();
  const field = element.dataset.crawlField || ({ image: "images", quote: "quotes", technology: "name", project: "project" }[kind] || "text");
  const valid = kind === "image" ? !!(raw.source_url && raw.width && raw.height) : kind === "project" ? !!(raw.name && raw.description) : !!raw;
  return {
    id: `ev-${id}`, target_id: id, kind, owner_id: owner, label: name, field, raw, normalized: raw,
    source: { page_url: `${window.location.origin}${window.location.pathname}`, anchor: `#${element.id || element.closest("[id]")?.id}`, crawl_id: id, snapshot_revision: fingerprint(raw) },
    captured_at: new Date().toISOString(), quality: { status: valid ? "complete" : "empty", warnings: [] },
  };
}

export function commitEvidence(collection, evidence) {
  if (evidence.quality.status !== "complete") throw new Error("Cannot commit an unverified fragment");
  const old = collection.evidence.find((item) => item.id === evidence.id);
  if (old?.source.snapshot_revision === evidence.source.snapshot_revision) return collection;
  const all = old ? collection.evidence.map((item) => item.id === evidence.id ? evidence : item) : [...collection.evidence, evidence];
  const groups = new Map();
  for (const item of all) {
    if (!groups.has(item.owner_id)) groups.set(item.owner_id, { id: item.owner_id, type: item.owner_id.split(":")[0], fields: { name: item.label }, evidence_ids: [], origins: { name: [item.id] } });
    const record = groups.get(item.owner_id);
    record.evidence_ids.push(item.id);
    if (item.kind === "project") {
      Object.assign(record.fields, item.normalized);
      for (const key of Object.keys(item.normalized)) record.origins[key] = [item.id];
    } else if (item.field === "images" || item.field === "quotes") {
      const field = record.fields[item.field] ||= [];
      const index = field.length;
      field.push(item.normalized);
      record.origins[`${item.field}/${index}`] = [item.id];
    } else {
      record.fields[item.field] = item.normalized;
      record.origins[item.field] = [item.id];
    }
  }
  const records = []; const origins = {};
  [...groups.values()].forEach(({ origins: source, ...record }, index) => {
    records.push(record);
    for (const [field, ids] of Object.entries(source)) origins[`/records/${index}/fields/${field}`] = { evidence_ids: ids, rule: "verbatim" };
  });
  return { ...collection, records, evidence: all, field_origins: origins, coverage: { ...collection.coverage, captured_ids: all.map((item) => item.target_id) } };
}

export function exportName(collection, extension) {
  return `gabriel-greco-coleta-${collection.session.started_at.slice(0, 10)}-${collection.page.language}.${extension}`;
}

export function downloadFile(bytes, name, mime) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const link = document.createElement("a"); link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
