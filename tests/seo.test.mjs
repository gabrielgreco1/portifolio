import assert from "node:assert/strict";
import test from "node:test";

// Run against a production build: npm run build && npm run start
const origin = process.env.SEO_TEST_ORIGIN || "http://localhost:3000";
const site = "https://gabrielgreco.com";
const alternatives = { en: `${site}/`, "pt-BR": `${site}/pt`, "x-default": `${site}/` };
function tags(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g"))].map(([value]) =>
    Object.fromEntries([...value.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, val]) => [key, val])));
}
for (const [path, lang, phrase] of [["/", "en", "Data engineering, from source to product."], ["/pt", "pt-BR", "Engenharia de dados, da fonte ao produto."]]) {
  test(`${path}: localized, crawlable HTML and matching structured data`, async () => {
    const res = await fetch(`${origin}${path}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
    assert.match(html, new RegExp(`<html lang="${lang}"`));
    assert.ok(visible.includes(phrase), "Service text is available without JavaScript");
    assert.equal((visible.match(/<h1\b/g) || []).length, 1);
    const links = tags(html, "link");
    assert.deepEqual(links.filter(x => x.rel === "canonical").map(x => new URL(x.href).href), [`${site}${path}`]);
    for (const [language, url] of Object.entries(alternatives)) {
      assert.ok(links.some(x => x.rel === "alternate" && x.hrefLang === language && new URL(x.href).href === url));
    }
    const meta = tags(html, "meta");
    assert.ok(!meta.some(x => x.name === "robots" && /noindex/.test(x.content)));
    assert.equal(new URL(meta.find(x => x.property === "og:url")?.content).href, `${site}${path}`);
    assert.ok(meta.find(x => x.name === "description")?.content.length > 80);
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const profile = ld["@graph"].find(x => x["@type"] === "ProfilePage");
    assert.equal(profile.url, `${site}${path}`);
    assert.equal(profile.inLanguage, lang);
    const services = ld["@graph"].filter(x => x["@type"] === "Service");
    assert.equal(services.length, 4);
    for (const service of services) {
      assert.ok(visible.includes(service.description));
      assert.ok(visible.includes(`id="${service.url.split("#")[1]}"`));
      assert.ok(ld["@graph"].some(x => x["@id"] === service.provider["@id"]));
    }
    const ids = new Set([...visible.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]));
    for (const anchor of tags(visible, "a").filter(x => x.href?.startsWith("#"))) assert.ok(ids.has(anchor.href.slice(1)), anchor.href);
    const alternatePath = path === "/" ? "/pt" : "/";
    assert.ok(tags(visible, "a").some(x => x.href === alternatePath));
  });
}
test("Discovery files include both canonical languages and no synthetic lastmod", async () => {
  const response = await fetch(`${origin}/sitemap.xml`);
  assert.equal(response.status, 200);
  const xml = await response.text();
  assert.equal((xml.match(/<loc>/g) || []).length, 2);
  assert.ok(xml.includes(`<loc>${site}/</loc>`));
  assert.ok(xml.includes(`<loc>${site}/pt</loc>`));
  assert.ok(!xml.includes("<lastmod>"));
  assert.ok(!xml.includes("data-engineer"));
  const robots = await fetch(`${origin}/robots.txt`);
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Allow: \/[\s\S]*Sitemap: https:\/\/gabrielgreco.com\/sitemap.xml/);
});
test("Legacy route permanently redirects; unknown paths return 404", async () => {
  const redirect = await fetch(`${origin}/data-engineer?ref=test`, { redirect: "manual" });
  assert.equal(redirect.status, 308);
  assert.equal(new URL(redirect.headers.get("location"), origin).pathname, "/");
  assert.equal((await fetch(`${origin}/this-page-does-not-exist`)).status, 404);
});
test("Search verification and sharing assets still resolve", async () => {
  for (const path of ["/google217f7d3f0bd53fc2.html", "/og-gabriel-card-v3.jpg", "/favicon.ico", "/icon.svg"]) {
    assert.equal((await fetch(`${origin}${path}`)).status, 200, path);
  }
});
