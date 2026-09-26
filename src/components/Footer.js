"use client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="wrap">
        <p>{t.footer}</p>
        <span>gabriel greco · {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
