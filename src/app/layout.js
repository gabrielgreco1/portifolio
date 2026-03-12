import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Gabriel Greco — Software Engineer & AI Automation Specialist",
  description:
    "Software engineer specialized in intelligent automation, AI pipelines, data extraction, and LLM integrations — turning raw data into operational intelligence.",
  openGraph: {
    title: "Gabriel Greco — Software Engineer & AI Automation Specialist",
    description:
      "Software engineer specialized in intelligent automation, AI pipelines, data extraction, and LLM integrations — turning raw data into operational intelligence.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gabriel Greco — Software Engineer & AI Automation Specialist",
    description:
      "Software engineer specialized in intelligent automation, AI pipelines, data extraction, and LLM integrations — turning raw data into operational intelligence.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
