import type { Metadata } from "next";
import { InsightsView } from "@/components/insights/InsightsView";
import { models } from "@/lib/data/models";
import { papers } from "@/lib/data/papers";
import { hardware } from "@/lib/data/hardware";

export const metadata: Metadata = {
  title: "AI Insights — Trends, Patterns & Analysis | LLM Tree of Life",
  description:
    "Deep analysis of trends in AI development: the open-source acceleration, the MoE revolution, context window explosions, and more.",
  openGraph: {
    title: "AI Insights — Trends, Patterns & Analysis | LLM Tree of Life",
    description:
      "Deep analysis of trends in AI development: the open-source acceleration, the MoE revolution, context window explosions, and more.",
  },
};

export default function InsightsPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-accent-violet/10 blur-[140px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#6366f1]/8 blur-[120px] animate-pulse-glow [animation-delay:1.5s]" />
          <div className="absolute top-1/2 left-2/3 w-64 h-64 rounded-full bg-accent-cyan/5 blur-[100px] animate-pulse-glow [animation-delay:3s]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="flex flex-col items-center text-center stagger">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-accent-violet mb-5">
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
                <path d="M2 20h.01" />
                <path d="M7 20v-4" />
                <path d="M12 20v-8" />
                <path d="M17 20V8" />
                <path d="M22 4v16" />
              </svg>
              Data-Driven Analysis
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary">
              AI Insights
            </h1>
            <p className="mt-3 text-sm sm:text-base text-text-secondary max-w-xl">
              Trends, patterns, and analysis derived from{" "}
              <span className="text-accent-violet font-medium">{models.length} models</span>,{" "}
              <span className="text-accent-cyan font-medium">{papers.length} papers</span>, and{" "}
              <span className="text-accent-emerald font-medium">{hardware.length} hardware milestones</span>.
            </p>
          </div>
        </div>

        {/* Glow line separator */}
        <div className="glow-line" />
      </section>

      {/* ── Insights ──────────────────────────────────────────────────────── */}
      <section className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <InsightsView />
      </section>
    </div>
  );
}
