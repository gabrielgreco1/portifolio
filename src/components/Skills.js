"use client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Skills() {
  const { t } = useLanguage();
  const skills = t.skills;

  return (
    <section id="skills" className="document-section">
      <div className="wrap">
        <header className="section-header">
          <p className="mono">{skills.tag}</p>
          <h2>{skills.title}</h2>
          <p>{skills.intro}</p>
        </header>
        <div className="skills-index">
          {skills.groups.map((group) => (
            <div className="skill-line" key={group.title}>
              <h3>{group.title}</h3>
              <div className="skill-tags">
                {group.items.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
