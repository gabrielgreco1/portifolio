"use client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="wrap" id="crawl-footer" data-crawl-id="footer" data-crawl-kind="text" data-crawl-field="site_note" data-crawl-record="context:footer" data-crawl-name="Gabriel Greco">
        <p>{t.footer}</p>
        <span>gabriel greco · {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
