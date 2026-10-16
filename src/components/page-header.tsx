import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-accent-700">
            <span className="inline-block h-px w-6 bg-accent-400" />
            <span>{eyebrow}</span>
          </div>
        )}
        <h1
          className="text-page-title font-display font-semibold text-cream-50 [&_em]:editorial-em"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-400 md:text-base">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
      )}
    </header>
  );
}

export function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-display text-xl font-semibold tracking-[-0.02em] md:text-2xl",
        className,
      )}
    >
      <span className="mr-3 inline-block h-4 w-1 -translate-y-0.5 rounded-full bg-accent-400 align-middle" />
      {children}
    </h2>
  );
}