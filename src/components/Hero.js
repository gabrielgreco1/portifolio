"use client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();
  const h = t.hero;

  return (
    <section className="hero" id="hero">
      <div className="wrap">
        <div className="hero-kicker mono">{h.greeting}</div>
        <h1>{h.heading}</h1>
        <p className="hero-aside">{h.aside}</p>
        <p className="hero-desc">{h.desc}</p>
        <div className="hero-ctas">
          <a href="#experience" className="text-link">{h.cta} ↓</a>
          <a href="https://github.com/gabrielgreco1" target="_blank" rel="noopener noreferrer" className="text-link secondary">{h.secondaryCta} ↗</a>
        </div>

        <div className="hero-stats" aria-label="Números em contexto">
          {h.stats.map((stat) => (
            <div className="hero-stat" key={stat.label}>
              <strong>{stat.n}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
        <p className="hero-note">↳ {h.note}</p>
      </div>
    </section>
  );
}
