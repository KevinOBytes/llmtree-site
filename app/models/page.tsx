import type { Metadata } from "next";
import { ModelsTable } from "@/components/models/ModelsTable";

export const metadata: Metadata = {
  title: "All AI Models — Complete Database | LLM Tree of Life",
  description:
    "Browse, search, filter, and compare every major AI model across all families. Sortable by parameters, context window, release date, and more.",
  openGraph: {
    title: "All AI Models — Complete Database | LLM Tree of Life",
    description:
      "The most comprehensive database of large language models, vision models, and AI tools — filterable, sortable, and packed with details.",
  },
};

export default function ModelsPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-accent-emerald/8 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-accent-violet/6 blur-[100px] animate-pulse-glow [animation-delay:1.5s]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="flex flex-col items-center text-center stagger">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-accent-emerald mb-5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              Complete AI Model Database
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary">
              All Models
            </h1>
            <p className="mt-3 text-sm sm:text-base text-text-secondary max-w-xl">
              Browse, search, and filter every AI model in the tree.
              Click any row for full details, significance, and lineage.
            </p>
          </div>
        </div>

        {/* Glow line separator */}
        <div className="glow-line" />
      </section>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <section className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
        <ModelsTable />
      </section>
    </div>
  );
}
