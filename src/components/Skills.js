"use client";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const pillAnim = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
};

export default function Skills() {
  const { t } = useLanguage();
  const sk = t.skills;

  return (
    <section id="skills">
      <div className="wrap">
        <motion.div
          className="skills-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
        >
          <p className="mono">{sk.tag}</p>
          <h2>{sk.title}</h2>
        </motion.div>

        <div className="skills-grid">
          {sk.groups.map((g, i) => (
            <motion.div
              className="skill-group"
              key={i}
              initial={{ opacity: 0, y: 40, rotateX: 10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{
                borderColor: g.color,
                boxShadow: `0 0 30px ${g.color}15`,
                y: -4
              }}
              style={{ transformPerspective: 600 }}
            >
              <div className="skill-group-title">
                <motion.span
                  className="skill-group-icon"
                  style={{ background: g.color }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                />
                {g.title}
              </div>
              <motion.div
                className="skill-list"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
              >
                {g.items.map((s, j) => (
                  <motion.span
                    className="skill-pill"
                    key={j}
                    variants={pillAnim}
                    whileHover={{
                      scale: 1.1,
                      color: "#fff",
                      background: `${g.color}20`,
                    }}
                  >
                    {s}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
