"use client";
import Image from "next/image";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

function displayUrl(link) {
  return link
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/$/, "")
    .split("/").slice(0, 2).join("/");
}

export default function Projects() {
  const { t } = useLanguage();
  const proj = t.projects;

  return (
    <section id="projects">
      <div className="wrap">
        <motion.div
          className="projects-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
        >
          <p className="mono">{proj.tag}</p>
          <h2>{proj.title}</h2>
        </motion.div>
        {proj.items.map((p, i) => (
          <ProjectCard key={i} project={p} index={i} viewProject={proj.viewProject} />
        ))}
        <motion.div
          style={{ textAlign: "center", marginTop: "2rem" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <motion.a
            href="https://github.com/gabrielgreco1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {proj.seeAll}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

function ProjectCard({ project, index, viewProject }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [4, -4]);
  const rotateY = useTransform(x, [-100, 100], [-4, 4]);
  const springX = useSpring(rotateX, { stiffness: 180, damping: 28 });
  const springY = useSpring(rotateY, { stiffness: 180, damping: 28 });

  function handleMouse(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }

  function resetMouse() { x.set(0); y.set(0); }

  const url = displayUrl(project.link);

  return (
    <motion.div
      className="project-item"
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
    >
      {/* Browser window mockup */}
      <motion.div
        className="project-img-wrap"
        onMouseMove={handleMouse}
        onMouseLeave={resetMouse}
        style={{ rotateX: springX, rotateY: springY, transformPerspective: 900 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        {/* Chrome bar */}
        <div className="browser-chrome">
          <div className="browser-dots">
            <span className="browser-dot browser-dot--red" />
            <span className="browser-dot browser-dot--yellow" />
            <span className="browser-dot browser-dot--green" />
          </div>
          <div className="browser-url-bar">
            <span className="browser-url-text">{url}</span>
          </div>
        </div>

        {/* Screenshot */}
        <div className="browser-screen">
          <Image
            src={project.img}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={index === 0}
            className="project-img"
            style={{ objectFit: "cover", objectPosition: "top center" }}
          />
        </div>
      </motion.div>

      {/* Info */}
      <div className="project-info">
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
        >
          {project.title}
        </motion.h3>
        <p>{project.desc}</p>
        <div className="project-tags">
          {project.tags.map((tag, i) => (
            <motion.span
              className="project-tag"
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.05 }}
              whileHover={{ scale: 1.1, borderColor: "var(--accent)" }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
        <motion.a
          href={project.link}
          target={project.link.startsWith("http") ? "_blank" : undefined}
          rel={project.link.startsWith("http") ? "noopener noreferrer" : undefined}
          className="project-link"
          whileHover={{ x: 5 }}
        >
          {viewProject} <span>→</span>
        </motion.a>
      </div>
    </motion.div>
  );
}
