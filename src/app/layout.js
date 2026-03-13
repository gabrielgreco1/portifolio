import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Analytics } from "@vercel/analytics/react";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport = {
  themeColor: "#6c63ff",
};

export const metadata = {
  metadataBase: new URL("https://gabrielgreco.com"),
  applicationName: "Gabriel Greco",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  title: "Gabriel Greco — Software Engineer & AI Automation Specialist",
  description:
    "Software engineer specialized in intelligent automation, AI pipelines, data extraction, and LLM integrations — turning raw data into operational intelligence.",
  keywords: [
    "Gabriel Greco",
    "Software Engineer",
    "AI Automation",
    "RAG",
    "GraphRAG",
    "LLM",
    "Python",
    "data extraction",
    "automation specialist",
    "portfolio",
  ],
  authors: [{ name: "Gabriel Greco", url: "https://gabrielgreco.com" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Gabriel Greco — Software Engineer & AI Automation Specialist",
    description:
      "Software engineer specialized in intelligent automation, AI pipelines, data extraction, and LLM integrations — turning raw data into operational intelligence.",
    url: "https://gabrielgreco.com",
    siteName: "Gabriel Greco",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gabriel Greco — Software Engineer & AI Automation Specialist",
    description:
      "Software engineer specialized in intelligent automation, AI pipelines, data extraction, and LLM integrations — turning raw data into operational intelligence.",
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
        "Portfolio of Gabriel Greco, Software Engineer specialized in AI automation, RAG pipelines, and LLM integrations.",
    },
    {
      "@type": "ProfilePage",
      "@id": "https://gabrielgreco.com/#webpage",
      url: "https://gabrielgreco.com",
      name: "Gabriel Greco — Software Engineer & AI Automation Specialist",
      description:
        "Software engineer specialized in intelligent automation, AI pipelines, data extraction, and LLM integrations — turning raw data into operational intelligence.",
      isPartOf: { "@id": "https://gabrielgreco.com/#website" },
      about: { "@id": "https://gabrielgreco.com/#person" },
      mainEntity: { "@id": "https://gabrielgreco.com/#person" },
    },
    {
      "@type": "Person",
      "@id": "https://gabrielgreco.com/#person",
      name: "Gabriel Greco",
      url: "https://gabrielgreco.com",
      jobTitle: "Software Engineer",
      description:
        "Software engineer specialized in intelligent automation, AI pipelines, data extraction, and LLM integrations — turning raw data into operational intelligence.",
      email: "gabrielargreco@gmail.com",
      sameAs: [
        "https://www.linkedin.com/in/gabriel-greco-365b541a3",
        "https://github.com/gabrielgreco1",
        "https://gabrielgreco.com",
      ],
      knowsAbout: [
        "Software Engineering",
        "AI Automation",
        "RAG",
        "GraphRAG",
        "LLM Integrations",
        "Data Extraction",
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
    <html lang="pt-BR">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
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
