"use client";
import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorOrb() {
  const rawX = useMotionValue(-400);
  const rawY = useMotionValue(-400);

  const x = useSpring(rawX, { stiffness: 380, damping: 38 });
  const y = useSpring(rawY, { stiffness: 380, damping: 38 });

  useEffect(() => {
    function move(e) {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    }
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [rawX, rawY]);

  return (
    <motion.div
      className="cursor-orb"
      style={{ x, y }}
      aria-hidden="true"
    />
  );
}
