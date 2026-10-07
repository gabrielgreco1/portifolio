import "@/app/globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Providers from "@/components/Providers";
import { Analytics } from "@vercel/analytics/react";
import { portfolioJsonLd } from "@/lib/seo";

export default function PortfolioDocument({ children, lang }) {
  return (
    <html lang={lang === "pt" ? "pt-BR" : "en"}>
      <body>
        <Providers lang={lang}>{children}</Providers>
        <Analytics />
        <GoogleAnalytics />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioJsonLd(lang)).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
