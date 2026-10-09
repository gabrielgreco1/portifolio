"use client";
import CrawlerArtwork from "./CrawlerArtwork";
import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCrawler } from "@/components/crawler/CrawlerExperience";

const SECTIONS = ["hero", "experience", "projects", "skills", "contact"];

export default function CrawlerPet() {
  const { t } = useLanguage();
  const { active, petClick, petDrag, menuOpen } = useCrawler();
  const [stage, setStage] = useState(0);
  const [clicked, setClicked] = useState(0);

  useEffect(() => {
    let frame;
    function updateStage() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const marker = window.scrollY + window.innerHeight * 0.5;
        let current = 0;
        SECTIONS.forEach((id, index) => {
          const element = document.getElementById(id);
          if (element && element.offsetTop <= marker) current = index;
        });
        setStage(current);
      });
    }

    updateStage();
    window.addEventListener("scroll", updateStage, { passive: true });
    window.addEventListener("resize", updateStage);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateStage);
      window.removeEventListener("resize", updateStage);
    };
  }, []);

  function diagnose(event) {
    setClicked((value) => value + 1);
    petClick(event);
  }

  const messageIndex = (stage + clicked) % t.pet.messages.length;

  if (active) return null;
  return (
    <button {...petDrag} aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown" className={`crawler-pet crawler-pet--${stage}`} onClick={diagnose} aria-label={t.pet.label} aria-haspopup="dialog" aria-expanded={menuOpen}>
      <CrawlerArtwork />
      <span className="pet-message" aria-live="polite">{t.pet.messages[messageIndex]}</span>
    </button>
  );
}
