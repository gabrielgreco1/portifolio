"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

function ExpCard({ job, index }) {
  const ref = useRef(null);
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const springCfg = { stiffness: 150, damping: 25 };
  const rotX = useSpring(useTransform(ny, [-0.5, 0.5], [3, -3]), springCfg);
  const rotY = useSpring(useTransform(nx, [-0.5, 0.5], [-3, 3]), springCfg);

  function onMouseMove(e) {
    const r = ref.current.getBoundingClientRect();
    nx.set((e.clientX - r.left) / r.width - 0.5);
    ny.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onMouseLeave() { nx.set(0); ny.set(0); }

  return (
    <motion.div
      ref={ref}
      className="exp-card-glass"
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 900 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, y: 45, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
    >
      <div className="exp-card-top">
        <span className="mono exp-card-num">0{index + 1}</span>
        <span className="exp-card-period">{job.period}</span>
      </div>

      <div className="exp-card-role">{job.role}</div>
      <div className="exp-card-company">{job.company}</div>

      <ul className="exp-card-tasks">
        {job.tasks.map((task, j) => (
          <li key={j}>{task}</li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Experience() {
  const { t } = useLanguage();
  const exp = t.experience;

  return (
    <section id="experience">
      <div className="wrap">
        <motion.div
          className="exp-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
        >
          <p className="mono">{exp.tag}</p>
          <h2>{exp.title}</h2>
        </motion.div>

        <div className="exp-cards-grid">
          {exp.jobs.map((job, i) => (
            <ExpCard key={i} job={job} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
