"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AudioToggle } from "@/components/audio-toggle";
import { RecentMenu } from "@/components/recent-menu";
import { NewEpisodesMenu } from "@/components/new-episodes-menu";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

interface NavItem {
  href: string;
  label: string;
  short: string;
  hideOnMobile?: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "Ana Sayfa", short: "Ana" },
  { href: "/calendar", label: "Takvim", short: "Takvim" },
  { href: "/compare", label: "Karşılaştır", short: "Karş.", hideOnMobile: true },
  { href: "/random", label: "Rastgele", short: "Rastgele", hideOnMobile: true },
  { href: "/search", label: "Ara", short: "Ara" },
  { href: "/settings", label: "Ayarlar", short: "Ayarlar" },
];

const MOBILE_NAV = NAV.filter((n) => !n.hideOnMobile);

export function SiteHeader() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setTime(`${hh}:${mm}`);
    };
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="group flex shrink-0 flex-col leading-none"
            aria-label="SYTHERIS — Ana sayfa"
          >
            <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-cream-50">
              SYTHERIS
            </span>
            <span className="mt-1 flex items-center gap-1.5">
              <span
                className="h-[2px] w-5 rounded-full transition-colors"
                style={{ backgroundColor: theme.accent }}
              />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-700 transition-colors">
                {theme.tagline}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3 py-2 text-sm transition-colors lg:px-3.5",
                    active ? "text-cream-50" : "text-muted-400 hover:text-cream-50",
                  )}
                >
                  {active && (
                    <span className="absolute inset-x-2.5 -bottom-px h-[2px] rounded-full bg-accent-400" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <NewEpisodesMenu />
            <RecentMenu />
            <AudioToggle />
            <ThemeSwitcher />
            <KeyboardShortcuts />
            <span className="hidden h-3 w-px bg-ink-700 lg:block" />
            <span className="hidden font-mono text-[10px] tabular-nums tracking-wider text-muted-400 lg:inline">
              {time || "--:--"}
            </span>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-700/80 bg-ink-950/90 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4">
          {MOBILE_NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-3 text-center text-[11px] transition-colors",
                  active ? "text-accent-700" : "text-muted-400",
                )}
              >
                {active && (
                  <span className="absolute inset-x-8 top-0 h-[2px] rounded-full bg-accent-400" />
                )}
                {item.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}