"use client";
import { LanguageProvider } from "@/i18n/LanguageContext";
import CursorOrb from "@/components/CursorOrb";

export default function Providers({ children }) {
  return (
    <LanguageProvider>
      {children}
      <CursorOrb />
    </LanguageProvider>
  );
}
