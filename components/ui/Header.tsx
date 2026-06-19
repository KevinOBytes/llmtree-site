"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/tree", label: "Model Trees" },
  { href: "/timeline", label: "Timeline" },
  { href: "/models", label: "All Models" },
  { href: "/papers", label: "Papers" },
  { href: "/compare", label: "Compare" },
  { href: "/insights", label: "Insights" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border-default">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-accent-violet/15 group-hover:bg-accent-violet/25 transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-accent-violet"
              >
                <path
                  d="M12 3v6m0 0l-3-3m3 3l3-3M12 9v6m0 6v-6m0 0l-3 3m3-3l3 3M5 12h6m-6 0l3-3m-3 3l3 3M11 12h2m5 0h-6m6 0l-3-3m3 3l-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-text-primary">
                LLM Tree
              </span>
              <span className="text-[10px] uppercase tracking-widest text-text-muted font-medium">
                of Life
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive =
                href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? "text-text-primary bg-surface-elevated"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
                    }
                  `}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-accent-violet" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
