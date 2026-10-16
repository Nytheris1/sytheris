"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { SectionHeader } from "@/components/section-header";
import { cn } from "@/lib/utils";

interface RailProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  moreHref?: string;
  moreLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function Rail({
  eyebrow,
  title,
  subtitle,
  moreHref,
  moreLabel = "Tümünü gör",
  children,
  className,
}: RailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    check();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [check]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const canScroll = el.scrollWidth > el.clientWidth + 4;
      if (!canScroll) return;
      const atEnd =
        el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 && e.deltaY > 0;
      const atStart = el.scrollLeft <= 2 && e.deltaY < 0;
      if (atEnd || atStart) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function scrollByAmount(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 320);
    el.scrollBy({ left: amount * direction, behavior: "smooth" });
  }

  return (
    <section ref={sectionRef} className={className}>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        moreHref={moreHref}
        moreLabel={moreLabel}
      />

      <div className="relative">
        <button
          onClick={() => scrollByAmount(-1)}
          disabled={!canScrollLeft}
          aria-label="Sola kaydır"
          className={cn(
            "absolute left-0 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink-700 bg-ink-950/90 text-cream-200 shadow-md backdrop-blur-md transition-all md:flex",
            canScrollLeft
              ? "opacity-100 hover:border-accent-400 hover:text-accent-700"
              : "pointer-events-none opacity-0",
          )}
        >
          ‹
        </button>

        <button
          onClick={() => scrollByAmount(1)}
          disabled={!canScrollRight}
          aria-label="Sağa kaydır"
          className={cn(
            "absolute right-0 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink-700 bg-ink-950/90 text-cream-200 shadow-md backdrop-blur-md transition-all md:flex",
            canScrollRight
              ? "opacity-100 hover:border-accent-400 hover:text-accent-700"
              : "pointer-events-none opacity-0",
          )}
        >
          ›
        </button>

        <div
          ref={scrollRef}
          className={cn(
            "scrollbar-hide -mx-6 flex items-start gap-5 overflow-x-auto overflow-y-visible px-6 pb-6 pt-4",
            !reduced && "rail-scroll",
          )}
        >
          {reduced || inView ? (
            children
          ) : (
            <div className="flex gap-5 opacity-0">{children}</div>
          )}
        </div>
      </div>
    </section>
  );
}