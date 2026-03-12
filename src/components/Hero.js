"use client";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.3 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const letterPull = {
  hidden: { opacity: 0, y: 80 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

function AnimatedHeading({ text, accentWords }) {
  const words = text.split(" ");
  return (
    <motion.h1
      className="hero-h1"
      style={{ overflow: "hidden" }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => {
        const isAccent = accentWords.includes(word);
        return (
          <span key={i} style={{ display: "inline-block", marginRight: "0.2em", overflow: "hidden" }}>
            <motion.span
              variants={letterPull}
              style={{
                display: "inline-block",
                color: isAccent ? "var(--accent)" : "inherit",
                fontStyle: "normal"
              }}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </motion.h1>
  );
}

export default function Hero() {
  const { lang, t } = useLanguage();
  const h = t.hero;

  return (
    <section className="hero" id="hero">
      <div className="wrap">
        <motion.div
          key={lang}
          className="hero-content"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.p className="mono hero-greeting" variants={fadeUp}>
            {h.greeting}
          </motion.p>

          <AnimatedHeading text={h.heading} accentWords={h.accentWords} />

          <motion.p className="hero-desc" variants={fadeUp}>
            {h.desc}
          </motion.p>

          <motion.div className="hero-ctas" variants={fadeUp}>
            <motion.a
              href="#projects"
              className="btn-fill"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              {h.cta}
            </motion.a>
            <motion.a
              href="https://github.com/gabrielgreco1"
              target="_blank"
              rel="noopener"
              className="btn-ghost"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              GitHub →
            </motion.a>
          </motion.div>

          <motion.div className="hero-stats" variants={fadeUp}>
            {h.stats.map((s, i) => (
              <div className="hero-stat" key={i}>
                <h3 className="float" style={{ animationDelay: `${i * 0.8}s` }}>
                  {s.n}
                </h3>
                <p>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
