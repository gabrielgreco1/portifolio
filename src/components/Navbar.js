"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { lang, toggle, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { delay: 0.5 + i * 0.1, duration: 0.4 }
    })
  };

  return (
    <motion.nav
      className={`navbar ${scrolled ? "scrolled" : ""}`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="wrap navbar-inner">
        <motion.a
          href="/"
          className="nav-logo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          gabriel<span>.</span>
        </motion.a>

        <div className="nav-right">
          <ul className="nav-links">
            {t.nav.links.map((link, i) => (
              <motion.li key={link} custom={i} initial="hidden" animate="visible" variants={linkVariants}>
                <a href={`#${t.nav.hrefs[i]}`}>
                  {link}
                </a>
              </motion.li>
            ))}
          </ul>

          <motion.button
            className="lang-toggle"
            onClick={toggle}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Toggle language"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={lang}
                className="lang-flag"
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {lang === "pt" ? (
                  <>🇧🇷 <span className="lang-label">PT</span></>
                ) : (
                  <>🇺🇸 <span className="lang-label">EN</span></>
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}
