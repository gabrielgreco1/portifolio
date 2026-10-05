"use client";
import { createContext, useContext } from "react";
import { translations } from "./translations";

const LanguageContext = createContext();

export function LanguageProvider({ children, lang = "en" }) {
  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
