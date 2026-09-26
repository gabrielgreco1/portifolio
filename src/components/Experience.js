"use client";
import Image from "next/image";
import { useLanguage } from "@/i18n/LanguageContext";

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M5.27 3.1A2.18 2.18 0 1 1 .9 3.1a2.18 2.18 0 0 1 4.37 0ZM1.28 7.1h3.98V23H1.28V7.1Zm6.55 0h3.82v2.17h.05c.53-1.01 1.83-2.08 3.77-2.08 4.03 0 4.78 2.65 4.78 6.1V23h-3.98v-8.61c0-2.05-.04-4.7-2.86-4.7-2.87 0-3.31 2.24-3.31 4.55V23H7.83V7.1Z" />
    </svg>
  );
}

function CompanyLogo({ company }) {
  return (
    <a className={`company-logo company-logo--${company.logoClass}`} href={company.link} target="_blank" rel="noopener noreferrer" aria-label={`${company.company} on LinkedIn`}>
      <Image src={company.logo} alt={`${company.company} logo`} width={160} height={72} />
    </a>
  );
}

export default function Experience() {
  const { t } = useLanguage();
  const exp = t.experience;

  return (
    <section id="experience" className="document-section">
      <div className="wrap">
        <header className="section-header">
          <p className="mono">{exp.tag}</p>
          <h2>{exp.title}</h2>
          <p>{exp.intro}</p>
        </header>

        <div className="experience-list">
          {exp.companies.map((company, index) => (
            <article className="experience-entry" key={company.company}>
              <header className="company-header">
                <CompanyLogo company={company} />
                <div className="company-heading">
                  <span className="entry-index mono">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{company.company}</h3>
                  <p>{company.role}</p>
                </div>
                <div className="company-meta">
                  <p>{company.period}</p>
                  <span>{company.location}</span>
                  <a href={company.link} target="_blank" rel="noopener noreferrer" aria-label={`${company.company} on LinkedIn`}>
                    <LinkedInIcon />
                  </a>
                </div>
              </header>

              <div className="experience-body">
                <p className="entry-summary">{company.summary}</p>
                <div className="entry-metrics">
                  {company.metrics.map((metric) => <span key={metric}>{metric}</span>)}
                </div>

                <div className="experience-chapters">
                  {company.chapters.map((chapter, chapterIndex) => (
                    <section className={`experience-chapter ${chapter.logo ? "experience-chapter--branded" : ""}`} key={`${company.company}-${chapter.label}`}>
                      <div className="chapter-label-row">
                        <span className="chapter-number mono">{index + 1}.{chapterIndex + 1}</span>
                        <p className="mono">{chapter.label}</p>
                        {chapter.period && <span className="chapter-period">{chapter.period}</span>}
                      </div>
                      <div className="chapter-title-row">
                        <h4>{chapter.title}</h4>
                        {chapter.logo && (
                          <span className="chapter-logo-frame">
                            <Image src={chapter.logo} alt="Red Tape Index" width={170} height={45} className="chapter-logo" />
                          </span>
                        )}
                      </div>
                      {chapter.text && <p className="chapter-text">{chapter.text}</p>}
                      <ul className="entry-tasks">
                        {chapter.tasks.map((task) => <li key={task}>{task}</li>)}
                      </ul>
                    </section>
                  ))}
                </div>

                <p className="entry-footnote">{company.footnote}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
