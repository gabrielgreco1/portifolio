import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const ink = rgb(0.14, 0.14, 0.125), green = rgb(0.184, 0.435, 0.306), muted = rgb(0.443, 0.435, 0.408), paper = rgb(0.969, 0.965, 0.949);

export async function buildCollectionPdf(collection, fetchImage = globalThis.fetch) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Gabriel Greco - Page extraction"); pdf.setAuthor("Gabriel Greco"); pdf.setLanguage(collection.page.language);
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const pt = collection.page.language === "pt";
  let page, y; const width = 595.28, height = 841.89, margin = 48;
  // Typography substitutions are only for the PDF standard font. Raw values in
  // the attached JSON remain intact, including every Unicode character.
  const printable = (text) => String(text).replace(/→/g, "->").replace(/↳/g, "-").replace(/−/g, "-").replace(/↗/g, "->").replace(/↓/g, "v").replace(/↑/g, "^").replace(/[\u2010-\u2015]/g, "-").replace(/\u00a0/g, " ").split("").map((char) => {
    try { body.encodeText(char); return char; } catch { return "?"; }
  }).join("");
  function newPage() {
    page = pdf.addPage([width, height]); y = height - 78;
    page.drawRectangle({ x: 0, y: 0, width, height, color: paper });
    page.drawText("GABRIEL GRECO / CRAWLER", { x: margin, y: height - 35, size: 8, font: bold, color: green });
    page.drawText(String(pdf.getPageCount()).padStart(2, "0"), { x: width - margin - 12, y: 25, size: 9, font: body, color: muted });
    page.drawLine({ start: { x: margin, y: 45 }, end: { x: width - margin, y: 45 }, thickness: 0.5, color: rgb(.82, .81, .78) });
  }
  function ensure(space) { if (y - space < 65) newPage(); }
  function text(value, { font = body, size = 10.5, color = ink, gap = 7 } = {}) {
    const safe = printable(value);
    const words = safe.split(/\s+/); let line = "";
    for (let word of words) {
      while (font.widthOfTextAtSize(word, size) > width - 2 * margin) {
        if (line) { ensure(size * 1.6); page.drawText(line, { x: margin, y, font, size, color }); y -= size * 1.5; line = ""; }
        let split = word.length;
        while (font.widthOfTextAtSize(word.slice(0, split), size) > width - 2 * margin) split--;
        ensure(size * 1.6); page.drawText(word.slice(0, split), { x: margin, y, font, size, color }); y -= size * 1.5; word = word.slice(split);
      }
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > width - 2 * margin && line) {
        ensure(size * 1.6); page.drawText(line, { x: margin, y, font, size, color }); y -= size * 1.5; line = word;
      } else line = candidate;
    }
    if (line) { ensure(size * 1.6); page.drawText(line, { x: margin, y, font, size, color }); y -= size * 1.5; }
    y -= gap;
  }
  newPage();
  text(pt ? "A página, em dados." : "The page, as data.", { font: serif, size: 30, gap: 17 });
  const coverage = collection.coverage.complete ? (pt ? "currículo completo" : "complete résumé") : collection.coverage.requested_complete ? (pt ? "seleção completa" : "complete selection") : (pt ? "coleta parcial" : "partial collection");
  text(pt ? `${collection.evidence.length} fragmentos coletados / ${collection.records.length} registros / ${coverage}` : `${collection.evidence.length} collected fragments / ${collection.records.length} records / ${coverage}`, { size: 10, color: green });
  text(collection.page.url, { size: 9, color: muted });
  text(new Date(collection.session.started_at).toLocaleString(pt ? "pt-BR" : "en-US"), { size: 9, color: muted, gap: 16 });
  for (const record of collection.records) {
    ensure(110); text(record.fields.name, { font: serif, size: 22, gap: 10 });
    for (const id of record.evidence_ids) {
      const item = collection.evidence.find((e) => e.id === id);
      ensure(70);
      text(`${item.kind.toUpperCase()} / ${item.source.crawl_id}`, { font: bold, size: 8, color: green });
      if (item.kind === "image") {
        try {
          const response = await fetchImage(item.raw.source_url, { signal: AbortSignal.timeout(8000) });
          if (!response.ok) throw new Error("Image unavailable");
          const bytes = new Uint8Array(await response.arrayBuffer());
          const image = bytes[0] === 137 ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const size = image.scale(Math.min(80 / image.width, 60 / image.height));
          ensure(size.height + 26); page.drawImage(image, { x: margin, y: y - size.height, width: size.width, height: size.height }); y -= size.height + 12;
        } catch { text(item.raw.alt || (pt ? "Imagem referenciada" : "Referenced image")); }
        text(item.raw.source_url, { size: 8, color: muted });
      } else if (item.kind === "project") {
        text(item.raw.description); text(item.raw.technologies.join(" / "), { size: 9, color: muted }); text(item.raw.url || "", { size: 9, color: green });
      } else if (item.kind === "employment") {
        text(item.raw.role, {font:bold}); text(`${item.raw.period} / ${item.raw.location}`); text(item.raw.company_url || "", {size:9,color:green});
      } else if (item.kind === "chapter") {
        text(item.raw.title, {font:bold}); text([item.raw.label,item.raw.period].filter(Boolean).join(" / "), {size:9,color:green});
        if (item.raw.description) text(item.raw.description);
        for (const task of item.raw.tasks) text(`- ${task}`);
      } else if (item.kind === "links") {
        for (const link of item.raw) text(`${link.label} / ${link.url}`, {size:9,color:green});
      } else if (item.kind === "list") {
        for (const value of item.raw) text(value);
      } else if (item.kind === "statistics") {
        for (const stat of item.raw) { text(`${stat.value} / ${stat.description}`); text(`${stat.context} / ${stat.source_url}`, {size:8,color:muted}); }
      } else if (item.kind === "technology_group") {
        text(item.raw.category,{font:bold}); text(item.raw.items.join(" / "));
      } else if (item.kind === "service") {
        text(item.raw.description); text(`${item.raw.evidence_label} / ${item.raw.evidence_url}`,{size:9,color:green});
      } else if (item.kind === "contact") {
        text(item.raw.title,{font:bold}); text(item.raw.description); text(item.raw.email);
        for (const link of item.raw.links) text(`${link.label} / ${link.url}`,{size:9,color:green});
      } else text(item.raw);
      text(`${pt ? "Origem" : "Source"}: ${item.source.page_url}${item.source.anchor}`, { size: 8, color: muted, gap: 10 });
    }
  }
  ensure(75); text(pt ? "Coleta com origem" : "Collection with provenance", { font: bold, size: 11, color: green });
  text(pt ? "Este relatório contém somente os conteúdos capturados nesta sessão. As imagens são referências no JSON. O documento JSON completo está anexado a este PDF." : "This report contains only the content captured in this session. Images are references in JSON. The complete JSON document is attached to this PDF.", { size: 9, color: muted });
  await pdf.attach(new TextEncoder().encode(JSON.stringify(collection, null, 2)), "collection.json", { mimeType: "application/json", description: "The exact collection shown in the inspector" });
  return pdf.save();
}
