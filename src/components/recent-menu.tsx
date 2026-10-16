"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useLibrary, STATUS_ICONS, STATUS_LABELS } from "@/lib/user-data";
import { cn } from "@/lib/utils";

const MAX_ITEMS = 5;

export function RecentMenu() {
  const library = useLibrary();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const recent = [...library]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_ITEMS);

  /* Dış tıklama */
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (recent.length === 0) return null;

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
          open
            ? "border-accent-400 bg-accent-400/10 text-accent-700"
            : "border-ink-700 bg-ink-900/60 text-cream-200 hover:border-ink-600",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Son izlenenler"
      >
        <span aria-hidden className="text-sm">
          ◐
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em]">
          Son
        </span>
        <span className="rounded-full bg-accent-400/15 px-1.5 py-0.5 font-mono text-[9px] tabular-nums text-accent-700">
          {recent.length}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-ink-700 bg-ink-950 shadow-2xl"
            role="menu"
          >
            <div className="flex items-center justify-between border-b border-ink-800 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400">
                Son aktivite
              </p>
              <span className="font-mono text-[10px] text-muted-400">
                {library.length} kayıt
              </span>
            </div>

            <div className="p-1.5">
              {recent.map((item) => {
                const cover = item.cover;
                return (
                  <Link
                    key={item.id}
                    href={`/anime/${item.id}`}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-ink-900"
                    role="menuitem"
                  >
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-ink-800 ring-1 ring-ink-800">
                      {cover && (
                        <Image
                          src={cover}
                          alt={item.title}
                          fill
                          quality={85}
                          sizes="36px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-medium text-cream-50 transition-colors group-hover:text-accent-700">
                        {item.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-400">
                        <span aria-hidden className="text-accent-700">
                          {STATUS_ICONS[item.status]}
                        </span>
                        <span>{STATUS_LABELS[item.status]}</span>
                        <span>·</span>
                        <span>{formatRelative(item.updatedAt)}</span>
                      </p>
                    </div>

                    {item.rating != null && (
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-accent-700">
                        ★ {item.rating}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-t border-ink-800 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400 transition-colors hover:bg-ink-900/60 hover:text-cream-50"
            >
              <span>Kitaplığı gör</span>
              <span aria-hidden>→</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün`;
  return new Date(ts).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}