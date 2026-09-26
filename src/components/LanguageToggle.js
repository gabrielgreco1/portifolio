"use client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function LanguageToggle() {
  const { lang, toggle } = useLanguage();

  return (
    <button className="language-switcher" onClick={toggle} aria-label="Toggle language">
      <span className={lang === "en" ? "active" : ""}>EN</span>
      <i aria-hidden="true">/</i>
      <span className={lang === "pt" ? "active" : ""}>PT</span>
    </button>
  );
}
