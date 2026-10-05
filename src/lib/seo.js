import { serviceContent } from "@/data/services";

export const siteUrl = "https://gabrielgreco.com";
export const languages = { en: `${siteUrl}/`, "pt-BR": `${siteUrl}/pt`, "x-default": `${siteUrl}/` };
const copy = {
  en: {
    title: "Gabriel Greco — Data Engineer | Web Scraping & Automation",
    description: "Gabriel Greco, data engineer based in São Paulo. Large-scale web scraping, data pipelines, cloud platforms and automation backed by production experience.",
    locale: "en_US", language: "en", path: "/",
  },
  pt: {
    title: "Gabriel Greco — Engenheiro de Dados | Web Scraping e Automação",
    description: "Gabriel Greco, engenheiro de dados em São Paulo. Web scraping em escala, pipelines de dados, plataformas cloud e automação com experiência em produção.",
    locale: "pt_BR", language: "pt-BR", path: "/pt",
  },
};

export function portfolioMetadata(lang) {
  const { title, description, locale, path } = copy[lang];
  return {
    metadataBase: new URL(siteUrl),
    applicationName: "Gabriel Greco",
    title, description,
    authors: [{ name: "Gabriel Greco", url: siteUrl }],
    alternates: { canonical: path, languages },
    icons: {
      icon: [{ url: "/favicon.ico?v=3", sizes: "64x64" }, { url: "/favicon-32x32.png?v=3", type: "image/png", sizes: "32x32" }, { url: "/icon.svg?v=3", type: "image/svg+xml", sizes: "any" }],
      shortcut: "/favicon.ico?v=3", apple: "/apple-touch-icon.png?v=3",
    },
    openGraph: {
      title, description, url: `${siteUrl}${path}`, siteName: "Gabriel Greco",
      type: "website", locale, alternateLocale: [lang === "en" ? "pt_BR" : "en_US"],
      images: [{ url: "/og-gabriel-card-v3.jpg", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og-gabriel-card-v3.jpg"] },
  };
}

const baseJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://gabrielgreco.com/#website",
      name: "Gabriel Greco",
      url: "https://gabrielgreco.com",
      description:
        "Portfolio of Gabriel Greco, a data engineer building large-scale crawlers, regulatory indices, and automation systems.",
    },
    {
      "@type": "ProfilePage",
      "@id": "https://gabrielgreco.com/#webpage",
      url: "https://gabrielgreco.com",
      name: "Gabriel Greco — Data Engineer",
      description:
        "Data engineer building large-scale crawlers, data platforms, regulatory indices, and automation systems.",
      isPartOf: { "@id": "https://gabrielgreco.com/#website" },
      about: { "@id": "https://gabrielgreco.com/#person" },
      mainEntity: { "@id": "https://gabrielgreco.com/#person" },
    },
    {
      "@type": "Person",
      "@id": "https://gabrielgreco.com/#person",
      name: "Gabriel Greco",
      url: "https://gabrielgreco.com",
      jobTitle: "Data Engineer",
      description:
        "Data engineer building large-scale crawlers, data platforms, regulatory indices, and automation systems.",
      email: "gabrielargreco@gmail.com",
      sameAs: [
        "https://www.linkedin.com/in/gabriel-greco-365b541a3",
        "https://github.com/gabrielgreco1",
      ],
      knowsAbout: [
        "Software Engineering",
        "Data Engineering",
        "Web Crawling",
        "Scrapy Cloud",
        "Zyte API",
        "Prefect",
        "AWS ECS Fargate",
        "Terraform",
        "Amazon S3",
        "PostgreSQL",
        "Neo4j",
        "RAG",
        "GraphRAG",
        "LLM Integrations",
        "Data Extraction",
        "Anti-bot Systems",
        "Data Visualization",
        "Statistical Normalization",
        "Python",
        "Web Scraping",
        "RPA",
        "FastAPI",
        "Django",
        "Next.js",
      ],
      worksFor: {
        "@type": "Organization",
        name: "Labrynth AI",
      },
    },
  ],
};


export function portfolioJsonLd(lang) {
  const { title, description, language, path } = copy[lang];
  const url = `${siteUrl}${path}`;
  const graph = structuredClone(baseJsonLd["@graph"]);
  graph[0].inLanguage = ["en", "pt-BR"];
  Object.assign(graph[1], { "@id": `${url}#webpage`, url, name: title, description, inLanguage: language });
  graph[2].homeLocation = { "@type": "City", name: "São Paulo" };
  const services = serviceContent[lang].items.map((service) => ({
    "@type": "Service",
    "@id": `${url}#${service.id}`,
    name: service.title,
    description: service.description,
    url: `${url}#${service.id}`,
    provider: { "@id": `${siteUrl}/#person` },
  }));
  graph[1].mentions = services.map((service) => ({ "@id": service["@id"] }));
  return { "@context": "https://schema.org", "@graph": [...graph, ...services] };
}
