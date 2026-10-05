"use client";
import { useLanguage } from "@/i18n/LanguageContext";
import { serviceContent } from "@/data/services";

export default function Services() {
  const { lang } = useLanguage();
  const content = serviceContent[lang];
  return (
    <section id="services" className="document-section" aria-labelledby="services-heading">
      <div className="wrap">
        <header className="section-header">
          <p className="mono">{content.tag}</p>
          <h2 id="services-heading">{content.title}</h2>
          <p>{content.intro}</p>
        </header>
        <div className="services-list">
          {content.items.map((service) => (
            <article className="service-entry" id={service.id} key={service.id}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
        <div className="hero-ctas">
          <a className="text-link" href="#contact">{content.cta} ↓</a>
          <a className="text-link secondary" href="#experience">{content.evidence} ↑</a>
        </div>
      </div>
    </section>
  );
}
