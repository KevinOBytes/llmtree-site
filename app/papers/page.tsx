import type { Metadata } from "next";
import { PapersView } from "@/components/papers/PapersView";

export const metadata: Metadata = {
  title: "Research Papers — The Science Behind AI | LLM Tree of Life",
  description:
    "Explore the foundational research papers that shaped modern AI — from backpropagation to transformers, RLHF to chain-of-thought reasoning. A complete academic timeline.",
  openGraph: {
    title: "Research Papers — The Science Behind AI | LLM Tree of Life",
    description:
      "Every breakthrough paper in AI history, traced from neural network foundations through the transformer revolution to modern reasoning and alignment research.",
  },
};

export default function PapersPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs — emerald/amber for academic feel */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-accent-emerald/8 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-accent-amber/6 blur-[100px] animate-pulse-glow [animation-delay:1.5s]" />
          <div className="absolute top-2/3 left-2/3 w-48 h-48 rounded-full bg-accent-violet/5 blur-[80px] animate-pulse-glow [animation-delay:3s]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="flex flex-col items-center text-center stagger">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-accent-amber mb-5">
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
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              Academic Paper Archive
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary">
              Research Papers
            </h1>
            <p className="mt-3 text-sm sm:text-base text-text-secondary max-w-2xl">
              The science behind AI — from backpropagation to transformers, scaling
              laws to reasoning. Every breakthrough paper that shaped the models
              we use today.
            </p>
          </div>
        </div>

        {/* Glow line separator */}
        <div className="glow-line" />
      </section>

      {/* ── Papers View ──────────────────────────────────────────────────── */}
      <section className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <PapersView />
      </section>
    </div>
  );
}
