import "./globals.css";
import Providers from "@/components/Providers";
import { Analytics } from "@vercel/analytics/react";

export const viewport = {
  themeColor: "#f7f6f2",
};

export const metadata = {
  metadataBase: new URL("https://gabrielgreco.com"),
  applicationName: "Gabriel Greco",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  title: "Gabriel Greco — Data Engineer",
  description:
    "Data engineer building large-scale crawlers, data platforms, regulatory indices, and automation systems.",
  keywords: [
    "Gabriel Greco",
    "Data Engineer",
    "Software Engineer",
    "Web Crawling",
    "Scrapy Cloud",
    "Zyte API",
    "Prefect",
    "Data Pipelines",
    "AWS",
    "ECS Fargate",
    "Terraform",
    "Amazon S3",
    "PostgreSQL",
    "Neo4j",
    "RAG",
    "GraphRAG",
    "LLM",
    "Python",
    "data extraction",
    "data visualization",
    "statistical normalization",
    "automation specialist",
    "portfolio",
  ],
  authors: [{ name: "Gabriel Greco", url: "https://gabrielgreco.com" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Gabriel Greco — Data Engineer",
    description:
      "Large-scale crawling, data platforms, regulatory indices, and automation systems.",
    url: "https://gabrielgreco.com",
    siteName: "Gabriel Greco",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gabriel Greco — Data Engineer",
    description:
      "Large-scale crawling, data platforms, regulatory indices, and automation systems.",
    images: ["/og-image.jpg"],
  },
};

const jsonLd = {
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
        "https://gabrielgreco.com",
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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
