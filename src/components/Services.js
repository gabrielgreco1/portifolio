"use client";
import { useLanguage } from "@/i18n/LanguageContext";
import { serviceContent } from "@/data/services";

export default function Services() {
  const { lang } = useLanguage();
  const content = serviceContent[lang];
  return (
    <section id="services" className="document-section" aria-labelledby="services-heading">
      <div className="wrap">
        <header className="section-header" id="crawl-services-context" data-crawl-id="services-context" data-crawl-kind="text" data-crawl-record="context:services" data-crawl-name={content.title} data-crawl-field="introduction">
          <p className="mono">{content.tag}</p>
          <h2 id="services-heading">{content.title}</h2>
          <p>{content.intro}</p>
        </header>
        <div className="services-list">
          {content.items.map((service) => (
            <article className="service-entry" id={service.id} data-crawl-id={`service-${service.id}`} data-crawl-kind="service" data-crawl-record={`service:${service.id}`} key={service.id}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <a className="service-evidence text-link" href={service.evidenceHref}>{service.evidenceLabel} ↗</a>
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
