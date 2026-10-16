"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface SectionNavItem {
  id: string;
  label: string;
}

interface SectionNavProps {
  sections: SectionNavItem[];
}

export function SectionNav({ sections }: SectionNavProps) {
  const [active, setActive] = useState<string>("");
  const [visible, setVisible] = useState(false);

  /* Sayfa belli bir noktaya kayınca göster */
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* IntersectionObserver — aktif bölümü bul */
  useEffect(() => {
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          );
        if (visibleEntries.length > 0) {
          setActive(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      },
    );

    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <nav
      className={cn(
        "sticky top-[68px] z-30 -mx-6 mb-2 border-b border-ink-800/60 bg-ink-950/90 px-6 backdrop-blur-md transition-opacity duration-300",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-label="Sayfa bölümleri"
    >
      <div className="scrollbar-hide -mb-px flex items-center gap-0.5 overflow-x-auto">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={cn(
                "relative shrink-0 border-b-2 px-3.5 py-3 text-xs font-medium transition-colors sm:text-sm",
                isActive
                  ? "border-accent-400 text-accent-700"
                  : "border-transparent text-muted-400 hover:text-cream-50",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}