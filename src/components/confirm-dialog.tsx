"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const Ctx = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve });
      }),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      if (pending) {
        pending.resolve(ok);
        setPending(null);
      }
    },
    [pending],
  );

  /* Klavye kısayolları — modal açıkken */
  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        close(true);
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [pending, close]);

  return (
    <Ctx.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {pending && (
          <ConfirmModal
            options={pending}
            onCancel={() => close(false)}
            onConfirm={() => close(true)}
          />
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    /* Provider yoksa tarayıcı confirm'ine düş */
    return {
      confirm: async (options: ConfirmOptions) => {
        if (typeof window === "undefined") return false;
        return window.confirm(
          options.description
            ? `${options.title}\n\n${options.description}`
            : options.title,
        );
      },
    };
  }
  return ctx;
}

function ConfirmModal({
  options,
  onCancel,
  onConfirm,
}: {
  options: ConfirmOptions;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const variant = options.variant ?? "default";
  const danger = variant === "danger";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[85] flex items-center justify-center bg-night-950/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={options.title}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border bg-ink-950 shadow-2xl",
          danger ? "border-crimson-500/40" : "border-ink-700",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst şerit */}
        <div
          className={cn(
            "h-1 w-full",
            danger ? "bg-crimson-500" : "bg-accent-400",
          )}
          aria-hidden
        />

        <div className="p-6">
          {/* İkon + başlık */}
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                danger
                  ? "bg-crimson-500/15 text-crimson-500"
                  : "bg-accent-400/15 text-accent-700",
              )}
              aria-hidden
            >
              {danger ? "!" : "?"}
            </span>

            <div className="min-w-0 flex-1">
              <h2
                className={cn(
                  "font-display text-lg font-semibold tracking-tight",
                  danger ? "text-cream-50" : "text-cream-50",
                )}
              >
                {options.title}
              </h2>
              {options.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-400">
                  {options.description}
                </p>
              )}
            </div>
          </div>

          {/* Aksiyonlar */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-full border border-ink-700 px-5 py-2.5 text-sm font-medium text-cream-200 transition-colors hover:border-ink-600 hover:bg-ink-900/60"
            >
              {options.cancelLabel ?? "İptal"}
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                danger
                  ? "bg-crimson-500 text-white hover:bg-crimson-600"
                  : "bg-accent-400 text-night-950 hover:bg-accent-500",
              )}
            >
              {options.confirmLabel ?? "Onayla"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}