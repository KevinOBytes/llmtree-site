import type { Metadata } from "next";
import Link from "next/link";
import { ComparePageClient } from "@/components/compare/ComparePageClient";

export const metadata: Metadata = {
  title: "AI Model Landscape — Comparisons & Trends",
  description:
    "Interactive charts comparing AI model parameter counts, context windows, release cadence, architecture distribution, and innovation trends across all major model families.",
  openGraph: {
    title: "AI Model Landscape — Comparisons & Trends | LLM Tree of Life",
    description:
      "Explore parameter scaling, context window explosions, open vs. closed trends, and more across 175+ AI models.",
  },
};

export default function ComparePage() {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-accent-violet/8 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent-cyan/6 blur-[100px] animate-pulse-glow [animation-delay:1.5s]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="flex flex-col items-center text-center stagger">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-accent-cyan mb-5">
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
                <path d="M3 3v18h18" />
                <path d="M7 16l4-8 4 4 4-12" />
              </svg>
              Interactive Charts
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="text-text-primary">AI Model Landscape</span>
              <br />
              <span className="bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-emerald bg-clip-text text-transparent">
                Comparisons & Trends
              </span>
            </h1>
            <p className="mt-4 text-text-secondary text-lg max-w-2xl leading-relaxed">
              Explore how AI models have scaled in size, expanded context
              windows, diversified architectures, and accelerated their release
              cadence — all visualized from our dataset of frontier models.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              <Link
                href="/compare/models"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-violet hover:bg-accent-violet/90 text-white text-xs font-semibold transition-all hover:-translate-y-0.5 cursor-pointer shadow-lg shadow-accent-violet/10 hover:shadow-accent-violet/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Model-to-Model Comparison Workbench
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="glow-line mx-auto w-full max-w-5xl" />

      {/* ── Charts Grid ──────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ComparePageClient />
        </div>
      </section>
    </div>
  );
}
