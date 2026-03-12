"use client";
import { LanguageProvider } from "@/i18n/LanguageContext";

export default function Providers({ children }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
