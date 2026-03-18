"use client";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";
import { POSTS } from "@/data/posts";
import { useLanguage } from "@/i18n/LanguageContext";

// ── Per-card micro-signature animation ───────────────────────────────────────
function MicroAccent({ variant }) {
  if (variant === "calm")
    return (
      <motion.div
        className="micro-accent micro-accent--calm"
        animate={{ scale: [1, 1.45, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
    );

  if (variant === "pulse")
    return (
      <>
        <motion.div
          className="micro-accent micro-accent--pulse-ring"
          animate={{ scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          aria-hidden="true"
        />
        <div className="micro-accent micro-accent--pulse-dot" aria-hidden="true" />
      </>
    );

  if (variant === "float")
    return (
      <motion.div
        className="micro-accent micro-accent--float"
        animate={{ y: [0, -11, 0], rotate: [0, 9, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
    );

  return null;
}

// ── Single post card ──────────────────────────────────────────────────────────
function PostCard({ post, index }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Normalised mouse position [-0.5, 0.5]
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);

  const springCfg = { stiffness: 140, damping: 22 };

  // Card tilt
  const rotX = useSpring(useTransform(ny, [-0.5, 0.5], [4, -4]), springCfg);
  const rotY = useSpring(useTransform(nx, [-0.5, 0.5], [-4, 4]), springCfg);

  // Bg glow parallax at ~0.4× card speed
  const glowX = useSpring(useTransform(nx, [-0.5, 0.5], [-15, 15]), springCfg);
  const glowY = useSpring(useTransform(ny, [-0.5, 0.5], [-15, 15]), springCfg);

  function onMouseMove(e) {
    const r = ref.current.getBoundingClientRect();
    nx.set((e.clientX - r.left) / r.width - 0.5);
    ny.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onMouseLeave() {
    nx.set(0);
    ny.set(0);
    setHovered(false);
  }

  // Insight reveal speed varies by theme
  const insightDuration =
    post.variant === "calm" ? 0.65 : post.variant === "float" ? 0.5 : 0.35;

  return (
    <motion.article
      ref={ref}
      className={`post-card post-card--${post.variant}`}
      style={{
        rotateX: rotX,
        rotateY: rotY,
        transformPerspective: 1100,
        // CSS custom property used by .post-card-glow
        "--card-accent-rgb": hexToRgb(post.accentColor),
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={() => setHovered(true)}
      // Stagger handled by parent variants; these are fallback in-view
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.12,
      }}
    >
      {/* Parallax background glow */}
      <motion.div
        className="post-card-glow"
        style={{ x: glowX, y: glowY }}
        animate={{ opacity: hovered ? 1 : 0.35 }}
        transition={{ duration: 0.5 }}
        aria-hidden="true"
      />

      {/* Per-card micro-animation */}
      <MicroAccent variant={post.variant} />

      {/* Main content */}
      <div className="post-card-inner">
        <span className="mono post-card-category">{post.category}</span>

        <h3 className="post-card-title">{post.title}</h3>

        <p className="post-card-desc">{post.desc}</p>

        {/* Insight — clip-path wipe on hover */}
        <motion.div
          className="post-card-insight"
          animate={{
            clipPath: hovered
              ? "inset(0% 0 0% 0 round 8px)"
              : "inset(100% 0 0% 0 round 8px)",
          }}
          transition={{
            duration: insightDuration,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <span className="post-card-insight-label">// insight</span>
          <p>{post.insight}</p>
        </motion.div>

        <a
          href={post.href}
          className="post-card-link"
          target={post.href.startsWith("http") ? "_blank" : undefined}
          rel={
            post.href.startsWith("http") ? "noopener noreferrer" : undefined
          }
        >
          {post.cta ?? "Ver análise"}{" "}
          <span className="post-card-arrow">↗</span>
        </a>
      </div>
    </motion.article>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function DesignShowcase() {
  const { lang } = useLanguage();

  const label = "// design teardown";
  const title = lang === "pt" ? "Análise de Referências" : "Design References";
  const sub =
    lang === "pt"
      ? "Curadoria de landing pages que fazem bem — e o porquê de cada escolha."
      : "Curation of landing pages done right — and the why behind each choice.";

  return (
    <section id="showcase" className="showcase-section">
      <div className="wrap">
        <motion.div
          className="showcase-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mono">{label}</p>
          <h2>{title}</h2>
          <p className="showcase-sub">{sub}</p>
        </motion.div>

        <div className="showcase-grid">
          {POSTS.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
