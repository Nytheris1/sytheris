"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  push: (item: Omit<ToastItem, "id">) => number;
  dismiss: (id: number) => void;
  success: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
  warning: (title: string, description?: string) => number;
}

const Ctx = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3500;
const MAX_TOASTS = 4;

const TOAST_EVENT = "sytheris:toast";

export function emitToast(detail: Omit<ToastItem, "id">) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }));
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = ++counterRef.current;
      setToasts((prev) => {
        const next = [...prev, { ...item, id }];
        if (next.length > MAX_TOASTS) {
          return next.slice(next.length - MAX_TOASTS);
        }
        return next;
      });
      const duration = item.duration ?? DEFAULT_DURATION;
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const onEvent = (e: Event) => {
      const ce = e as CustomEvent<Omit<ToastItem, "id">>;
      if (ce.detail) push(ce.detail);
    };
    window.addEventListener(TOAST_EVENT, onEvent);
    return () => window.removeEventListener(TOAST_EVENT, onEvent);
  }, [push]);

  const success = useCallback(
    (title: string, description?: string) =>
      push({ kind: "success", title, description }),
    [push],
  );
  const error = useCallback(
    (title: string, description?: string) =>
      push({ kind: "error", title, description }),
    [push],
  );
  const info = useCallback(
    (title: string, description?: string) =>
      push({ kind: "info", title, description }),
    [push],
  );
  const warning = useCallback(
    (title: string, description?: string) =>
      push({ kind: "warning", title, description }),
    [push],
  );

  return (
    <Ctx.Provider value={{ push, dismiss, success, error, info, warning }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    const noop = () => 0;
    return {
      push: noop,
      dismiss: () => {},
      success: noop,
      error: noop,
      info: noop,
      warning: noop,
    };
  }
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex flex-col items-center gap-2 p-4 pb-20 sm:items-end sm:pb-4 md:bottom-0 md:right-0 md:left-auto md:max-w-md md:p-6"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            toast={t}
            onDismiss={() => onDismiss(t.id)}
            reduced={!!reduced}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

const KIND_STYLES: Record<
  ToastKind,
  { icon: string; accent: string; bg: string; border: string; text: string }
> = {
  success: {
    icon: "✓",
    accent: "bg-accent-400 text-night-950",
    bg: "bg-ink-950",
    border: "border-accent-400/40",
    text: "text-accent-700",
  },
  error: {
    icon: "✕",
    accent: "bg-crimson-500 text-white",
    bg: "bg-ink-950",
    border: "border-crimson-500/40",
    text: "text-crimson-500",
  },
  warning: {
    icon: "!",
    accent: "bg-amber-400 text-night-950",
    bg: "bg-ink-950",
    border: "border-amber-400/40",
    text: "text-amber-500",
  },
  info: {
    icon: "i",
    accent: "bg-ink-700 text-cream-50",
    bg: "bg-ink-950",
    border: "border-ink-700",
    text: "text-cream-200",
  },
};

function ToastCard({
  toast,
  onDismiss,
  reduced,
}: {
  toast: ToastItem;
  onDismiss: () => void;
  reduced: boolean;
}) {
  const styles = KIND_STYLES[toast.kind];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: reduced ? 1 : 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: reduced ? 1 : 0.96 }}
      transition={{
        duration: reduced ? 0 : 0.25,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border p-3 shadow-2xl backdrop-blur-md sm:p-3.5",
        styles.bg,
        styles.border,
      )}
      role="status"
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          styles.accent,
        )}
        aria-hidden
      >
        {styles.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight text-cream-50">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-1 text-xs leading-relaxed text-muted-400">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              onDismiss();
            }}
            className={cn(
              "mt-2 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors hover:opacity-80",
              styles.text,
            )}
          >
            {toast.action.label} →
          </button>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="shrink-0 rounded-full p-1 text-xs text-muted-400 transition-colors hover:text-cream-50"
        aria-label="Bildirimi kapat"
      >
        ✕
      </button>
    </motion.div>
  );
}