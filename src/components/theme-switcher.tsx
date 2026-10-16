"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { THEMES, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/60 px-3 py-1.5 text-xs transition-colors hover:border-ink-600"
        aria-expanded={open}
        aria-label="Tema seç"
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-cream-200 lg:inline">
          {theme.tagline}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-ink-700 bg-ink-950 shadow-2xl"
            >
              <div className="border-b border-ink-800 px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400">
                  Renk modu
                </p>
              </div>
              <div className="p-1.5">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      theme.id === t.id
                        ? "bg-ink-800 text-cream-50"
                        : "text-cream-200 hover:bg-ink-900",
                    )}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-1 ring-inset ring-white/10"
                      style={{ backgroundColor: t.accent }}
                    />
                    <span className="flex-1">{t.tagline}</span>
                    {theme.id === t.id && (
                      <span className="text-accent-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}