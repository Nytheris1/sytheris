"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const SHOW_AFTER_PX = 800;

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{
            duration: reduced ? 0 : 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
          onClick={scrollToTop}
          aria-label="Sayfa başına dön"
          className={cn(
            "fixed bottom-36 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-colors md:bottom-24 md:right-6",
            "border-ink-700 bg-ink-950/90 text-cream-200",
            "hover:border-accent-400 hover:bg-ink-950 hover:text-accent-700",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}