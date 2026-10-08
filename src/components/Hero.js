"use client";
import { useLanguage } from "@/i18n/LanguageContext";
import { ExtractionInvite } from "@/components/crawler/CrawlerExperience";

export default function Hero() {
  const { t, lang } = useLanguage();
  const h = t.hero;

  return (
    <section className="hero" id="hero">
      <div className="wrap" data-crawl-record="profile:gabriel" data-crawl-name="Gabriel Greco">
        <div className="hero-kicker mono" id="crawl-profile-intro" data-crawl-id="profile-intro" data-crawl-kind="text" data-crawl-field="introduction">{h.greeting}</div>
        <h1 id="crawl-profile-headline" data-crawl-id="profile-headline" data-crawl-kind="text" data-crawl-field="headline">{h.heading}</h1>
        <p className="hero-aside" id="crawl-profile-disclosure" data-crawl-id="profile-disclosure" data-crawl-kind="text" data-crawl-field="site_disclosure">{h.aside}</p>
        <p className="hero-desc" id="crawl-profile-description" data-crawl-id="profile-description" data-crawl-kind="text" data-crawl-field="description">{h.desc}</p>
        <ExtractionInvite />
        <div className="hero-ctas" id="crawl-profile-links" data-crawl-id="profile-links" data-crawl-kind="links" data-crawl-field="links">
          <a href="#experience" className="text-link">{h.cta} ↓</a>
          <a href="https://github.com/gabrielgreco1" target="_blank" rel="noopener noreferrer" className="text-link secondary">{h.secondaryCta} ↗</a>
        </div>

        <div className="hero-stats" id="crawl-profile-statistics" data-crawl-id="profile-statistics" data-crawl-kind="statistics" aria-label={lang === "pt" ? "Números em contexto" : "Numbers in context"}>
          {h.stats.map((stat) => (
            <div className="hero-stat" key={stat.label}>
              <strong>{stat.n}</strong>
              <span>{stat.label}</span>
              <a className="stat-context" href={stat.href}>{stat.context} ↗</a>
            </div>
          ))}
        </div>
        <p className="hero-note" id="crawl-profile-note" data-crawl-id="profile-note" data-crawl-kind="text" data-crawl-field="statistics_note">↳ {h.note}</p>
      </div>
    </section>
  );
}
