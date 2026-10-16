"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TrailerData {
  id: string;
  site: string;
}

interface TrailerPlayerProps {
  trailer: TrailerData;
  title: string;
  className?: string;
}

export function TrailerPlayer({ trailer, title, className }: TrailerPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    if (trailer.site === "dailymotion") {
      /* Dailymotion — temiz embed, arayüz gizli */
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.dailymotion.com/embed/video/${trailer.id}?autoplay=1&mute=1&controls=0&ui-start-screen-info=0&ui-logo=0&queue-enable=0&endscreen-enable=0&sharing-enable=0&playlist=0&info=0`;
      iframe.allow = "autoplay; fullscreen; encrypted-media";
      iframe.allowFullscreen = true;
      iframe.className = "absolute inset-0 h-full w-full pointer-events-none";
      iframe.setAttribute("tabindex", "-1");
      iframe.title = `${title} fragmanı`;
      container.appendChild(iframe);
    } else if (trailer.site === "youtube") {
      /* YouTube — büyük iframe ile arayüz kırpılır */
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${trailer.id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1&loop=1&playlist=${trailer.id}`;
      iframe.allow = "autoplay; encrypted-media";
      iframe.className =
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none";
      iframe.style.width = "280%";
      iframe.style.height = "180%";
      iframe.setAttribute("tabindex", "-1");
      iframe.title = `${title} fragmanı`;
      container.appendChild(iframe);
    }

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [trailer.id, trailer.site, title]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden bg-black",
        className,
      )}
      aria-label={`${title} fragmanı`}
    />
  );
}