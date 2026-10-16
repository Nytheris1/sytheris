import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FavoriteEmptyIllustration,
  HistoryEmptyIllustration,
  SearchEmptyIllustration,
  GenericEmptyIllustration,
} from "@/components/empty-illustrations";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string } | { onClick: () => void; label: string };
  className?: string;
}

function pickIllustration(icon?: string) {
  switch (icon) {
    case "favorite":
    case "star":
    case "★":
      return FavoriteEmptyIllustration;
    case "history":
    case "check":
    case "✓":
      return HistoryEmptyIllustration;
    case "search":
    case "help":
    case "?":
      return SearchEmptyIllustration;
    case "alert":
    case "!":
      return GenericEmptyIllustration;
    default:
      return GenericEmptyIllustration;
  }
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Illustration = pickIllustration(icon);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-ink-800 bg-ink-900/30 px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      <div className="mb-6 h-28 w-28 text-muted-400/50 sm:h-32 sm:w-32">
        <Illustration className="h-full w-full" />
      </div>
      <p className="font-display text-xl font-semibold tracking-[-0.02em] text-cream-50 sm:text-2xl">
        {title}
      </p>
      {description && (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-400">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-7">
          {"href" in action ? (
            <Link
              href={action.href}
              className="inline-block rounded-full bg-accent-400 px-6 py-2.5 text-sm font-semibold text-night-950 transition-colors hover:bg-accent-500"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="rounded-full bg-accent-400 px-6 py-2.5 text-sm font-semibold text-night-950 transition-colors hover:bg-accent-500"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}