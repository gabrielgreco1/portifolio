"use client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
  const contact = t.contact;

  return (
    <section id="contact" className="contact document-section">
      <div className="wrap">
        <p className="mono">{contact.tag}</p>
        <h2>{contact.title}</h2>
        <p className="contact-desc">{contact.desc}</p>
        <div className="contact-links">
          <a href="mailto:gabrielargreco@gmail.com" className="contact-primary">{contact.email} ↗</a>
          <a href="https://linkedin.com/in/gabriel-greco-365b541a3" target="_blank" rel="noopener noreferrer">{contact.linkedin} ↗</a>
        </div>
        <p className="contact-email">gabrielargreco@gmail.com</p>
      </div>
    </section>
  );
}
