"use client";
import { LanguageProvider } from "@/i18n/LanguageContext";
import CrawlerPet from "@/components/CrawlerPet";
import LanguageToggle from "@/components/LanguageToggle";

export default function Providers({ children, lang }) {
  return (
    <LanguageProvider lang={lang}>
      {children}
      <LanguageToggle />
      <CrawlerPet />
    </LanguageProvider>
  );
}
