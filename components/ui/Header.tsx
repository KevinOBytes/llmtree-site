"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/tree", label: "Model Trees" },
  { href: "/timeline", label: "Timeline" },
  { href: "/models", label: "All Models" },
  { href: "/papers", label: "Papers" },
  { href: "/compare", label: "Compare" },
  { href: "/wizard", label: "Wizard" },
  { href: "/learn", label: "Learn AI" },
  { href: "/insights", label: "Insights" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border-default">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Group */}
          <div className="flex items-center gap-3.5">
            {/* kevinbytes.com brand link */}
            <a
              href="https://kevinbytes.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 group/kb"
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden border border-accent-emerald/20 bg-accent-emerald/5 group-hover/kb:bg-accent-emerald/10 group-hover/kb:border-accent-emerald/40 transition-all duration-200">
                <Image
                  src="/images/KevinBytes-169d53-Transparent.png"
                  alt="KevinBytes Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain p-0.5"
                />
                <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-emerald"></span>
                </span>
              </div>
              <span className="hidden sm:inline text-xs font-medium text-text-secondary group-hover/kb:text-text-primary transition-colors">
                kevinbytes.com
              </span>
            </a>

            <div className="w-px h-5 bg-border-default" />

            {/* LLM Tree of Life Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
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
                <span className="text-sm font-semibold tracking-tight text-text-primary leading-tight">
                  LLM Tree
                </span>
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-medium leading-none">
                  of Life
                </span>
              </div>
            </Link>
          </div>


          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
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

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-text-primary transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-border-default bg-surface-secondary/95 backdrop-blur-md px-4 py-3 space-y-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`
                  block px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "text-text-primary bg-surface-elevated font-semibold border-l-2 border-accent-violet rounded-l-none"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
                  }
                `}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
