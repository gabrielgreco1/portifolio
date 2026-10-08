"use client";
import { LanguageProvider } from "@/i18n/LanguageContext";
import CrawlerPet from "@/components/CrawlerPet";
import LanguageToggle from "@/components/LanguageToggle";
import CrawlerExperienceProvider from "@/components/crawler/CrawlerExperience";

export default function Providers({ children, lang }) {
  return (
    <LanguageProvider lang={lang}>
      <CrawlerExperienceProvider>
        {children}
        <LanguageToggle />
        <CrawlerPet />
      </CrawlerExperienceProvider>
    </LanguageProvider>
  );
}
