import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  moreHref?: string;
  moreLabel?: string;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  moreHref,
  moreLabel = "Tümünü gör",
  className,
}: SectionHeaderProps) {
  return (
    <header className={cn("mb-5 flex items-end justify-between gap-6", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2.5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-accent-700">
            <span className="inline-block h-px w-6 bg-accent-400" />
            <span>{eyebrow}</span>
          </div>
        )}
        <h2
          className="text-section font-display font-semibold tracking-[-0.025em] text-cream-50 [&_em]:editorial-em"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {subtitle && (
          <p className="mt-2 text-sm text-muted-400">{subtitle}</p>
        )}
      </div>

      {moreHref && (
        <Link
          href={moreHref}
          className="group hidden shrink-0 items-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-muted-400 transition-colors hover:text-accent-700 md:inline-flex"
        >
          {moreLabel}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      )}
    </header>
  );
}