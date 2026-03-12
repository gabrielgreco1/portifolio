"use client";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const sectionAnim = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const cardAnim = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

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

        <motion.div
          className="exp-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={sectionAnim}
        >
          {exp.jobs.map((job, i) => (
            <motion.div
              className="exp-card"
              key={i}
              variants={cardAnim}
              whileHover={{ backgroundColor: "rgba(108, 99, 255, 0.05)" }}
            >
              <div>
                <div className="exp-role">{job.role}</div>
                <div className="exp-company">{job.company}</div>
                <ul className="exp-tasks">
                  {job.tasks.map((t, j) => <li key={j}>{t}</li>)}
                </ul>
              </div>
              <span className="exp-period">{job.period}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
