"use client";
import { LanguageProvider } from "@/i18n/LanguageContext";
import CrawlerPet from "@/components/CrawlerPet";
import LanguageToggle from "@/components/LanguageToggle";

export default function Providers({ children }) {
  return (
    <LanguageProvider>
      {children}
      <LanguageToggle />
      <CrawlerPet />
    </LanguageProvider>
  );
}
