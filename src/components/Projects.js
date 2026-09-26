"use client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Projects() {
  const { t } = useLanguage();
  const projects = t.projects;

  return (
    <section id="projects" className="document-section">
      <div className="wrap">
        <header className="section-header">
          <p className="mono">{projects.tag}</p>
          <h2>{projects.title}</h2>
          <p>{projects.intro}</p>
        </header>

        <div className="project-table">
          {projects.items.map((project, index) => (
            <a className="project-row" href={project.link} target="_blank" rel="noopener noreferrer" key={project.title}>
              <span className="project-number mono">0{index + 1}</span>
              <div className="project-copy">
                <div className="project-title-line">
                  <h3>{project.title}</h3>
                  <span className="project-type mono">{project.type}</span>
                </div>
                <p>{project.desc}</p>
                <div className="project-tags">{project.tags.join(" · ")}</div>
              </div>
              <span className="project-open">{projects.viewProject} ↗</span>
            </a>
          ))}
        </div>

        <a className="text-link projects-all" href="https://github.com/gabrielgreco1" target="_blank" rel="noopener noreferrer">{projects.seeAll} ↗</a>
      </div>
    </section>
  );
}
