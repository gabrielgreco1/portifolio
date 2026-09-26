"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.24c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.06.79 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M5.27 3.1A2.18 2.18 0 1 1 .9 3.1a2.18 2.18 0 0 1 4.37 0ZM1.28 7.1h3.98V23H1.28V7.1Zm6.55 0h3.82v2.17h.05c.53-1.01 1.83-2.08 3.77-2.08 4.03 0 4.78 2.65 4.78 6.1V23h-3.98v-8.61c0-2.05-.04-4.7-2.86-4.7-2.87 0-3.31 2.24-3.31 4.55V23H7.83V7.1Z" />
    </svg>
  );
}

export default function Navbar() {
  const { t } = useLanguage();
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const ids = ["hero", ...t.nav.items.map((item) => item.href)];

    function updateActive() {
      const marker = window.scrollY + window.innerHeight * 0.34;
      let current = "hero";
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.offsetTop <= marker) current = id;
      }
      setActive(current);
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [t]);

  return (
    <aside className="site-sidebar">
      <div className="sidebar-top">
        <a href="#hero" className={`sidebar-identity ${active === "hero" ? "active" : ""}`}>
          <span className="identity-mark">G</span>
          <span className="identity-copy">
            <strong>Gabriel Greco</strong>
            <small>data engineer</small>
          </span>
        </a>

        <div className="sidebar-status">
          <span className="status-dot" aria-hidden="true" />
          {t.nav.status}
        </div>
      </div>

      <nav aria-label="Primary navigation">
        <ol className="sidebar-links">
          {t.nav.items.map((item, i) => (
            <li key={item.href}>
              <a href={`#${item.href}`} className={active === item.href ? "active" : ""}>
                <span className="nav-number">0{i + 1}</span>
                <strong>{item.label}</strong>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="sidebar-bottom">
        <span className="sidebar-availability">open to difficult data</span>
        <div className="social-icons">
          <a href="https://github.com/gabrielgreco1" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
            <GitHubIcon />
          </a>
          <a href="https://linkedin.com/in/gabriel-greco-365b541a3" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
            <LinkedInIcon />
          </a>
        </div>
      </div>
    </aside>
  );
}
