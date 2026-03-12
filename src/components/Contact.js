"use client";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } }
};

export default function Contact() {
  const { t } = useLanguage();
  const c = t.contact;

  return (
    <section id="contact" className="contact">
      <div className="wrap">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={container}
        >
          <motion.p className="mono" variants={fadeUp}>{c.tag}</motion.p>
          <motion.h2 variants={fadeUp}>
            {c.title}
          </motion.h2>
          <motion.p variants={fadeUp}>
            {c.desc}
          </motion.p>
          <motion.div className="contact-links" variants={fadeUp}>
            <motion.a
              href="mailto:gabrielargreco@gmail.com"
              className="btn-fill"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              gabrielargreco@gmail.com
            </motion.a>
            <motion.a
              href="https://linkedin.com/in/gabriel-greco-365b541a3"
              target="_blank"
              rel="noopener"
              className="btn-ghost"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              LinkedIn
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
