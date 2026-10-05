import { languages } from "@/lib/seo";

export default function sitemap() {
  return [languages.en, languages["pt-BR"]].map((url) => ({
    url,
    alternates: { languages },
  }));
}
