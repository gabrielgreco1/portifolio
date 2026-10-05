"use client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function LanguageToggle() {
  const { lang } = useLanguage();
  return (
    <a className="language-switcher" href={lang === "en" ? "/pt" : "/"} hrefLang={lang === "en" ? "pt-BR" : "en"} aria-label={lang === "en" ? "Ler em português" : "Read in English"}>
      <span className={lang === "en" ? "active" : ""}>EN</span>
      <i aria-hidden="true">/</i>
      <span className={lang === "pt" ? "active" : ""}>PT</span>
    </a>
  );
}
