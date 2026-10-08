"use client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Skills() {
  const { t } = useLanguage();
  const skills = t.skills;

  return (
    <section id="skills" className="document-section">
      <div className="wrap">
        <header className="section-header" id="crawl-skills-context" data-crawl-id="skills-context" data-crawl-kind="text" data-crawl-record="context:skills" data-crawl-name={skills.title} data-crawl-field="introduction">
          <p className="mono">{skills.tag}</p>
          <h2>{skills.title}</h2>
          <p>{skills.intro}</p>
        </header>
        <div className="skills-index">
          {skills.groups.map((group, groupIndex) => (
            <div className="skill-line" id={`crawl-skill-group-${groupIndex}`} data-crawl-id={`skill-group-${groupIndex}`} data-crawl-kind="technology_group" data-crawl-record={`skill_group:${groupIndex}`} key={group.title}>
              <h3>{group.title}</h3>
              <div className="skill-tags">
                {group.items.map((item, itemIndex) => <span id={`crawl-skill-${groupIndex}-${itemIndex}`} data-crawl-id={`skill-${groupIndex}-${itemIndex}`} data-crawl-kind="technology" data-crawl-full="false" data-crawl-owner={`technology:${item}`} key={item}>{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
