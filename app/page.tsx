import Link from "next/link";
import { models } from "@/lib/data/models";
import { papers } from "@/lib/data/papers";
import { hardware } from "@/lib/data/hardware";
import { FAMILY_COLORS } from "@/lib/types";
import type { ModelFamily } from "@/lib/types";
import { HeroTree } from "@/components/home/HeroTree";
import { FamilyCard } from "@/components/home/FamilyCard";

const FAMILY_LABELS: Record<string, string> = {
  "openai-gpt": "OpenAI GPT",
  "openai-o": "OpenAI o-series",
  "anthropic-claude": "Anthropic Claude",
  "google-gemini": "Google Gemini",
  "google-palm": "Google PaLM",
  "meta-llama": "Meta LLaMA",
  mistral: "Mistral AI",
  "xai-grok": "xAI Grok",
  "cohere-command": "Cohere Command",
  "microsoft-phi": "Microsoft Phi",
  deepseek: "DeepSeek",
};

// Build family stats
function getFamilyStats() {
  const stats: Record<
    string,
    { count: number; latest: string; latestDate: string }
  > = {};
  for (const model of models) {
    if (!stats[model.family]) {
      stats[model.family] = {
        count: 0,
        latest: model.name,
        latestDate: model.releaseDate,
      };
    }
    stats[model.family].count++;
    if (model.releaseDate > stats[model.family].latestDate) {
      stats[model.family].latest = model.name;
      stats[model.family].latestDate = model.releaseDate;
    }
  }
  return stats;
}

export default function Home() {
  const familyStats = getFamilyStats();
  const families = Object.keys(familyStats) as ModelFamily[];

  return (
    <div className="flex flex-col">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent-violet/8 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-cyan/6 blur-[100px] animate-pulse-glow [animation-delay:1.5s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-violet/3 blur-[200px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col lg:flex-row items-center gap-16">
          {/* Left — Text */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left stagger">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-accent-violet mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-violet animate-pulse" />
              {models.length} models tracked
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="text-text-primary">The </span>
              <span className="bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-emerald bg-clip-text text-transparent">
                Tree of Life
              </span>
              <br />
              <span className="text-text-primary">for AI Models</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-xl leading-relaxed">
              Explore the complete evolutionary lineage of every major large
              language model — from the 2017 Transformer paper to today&apos;s
              frontier models.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/tree"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-violet hover:bg-accent-violet/90 text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-accent-violet/25"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="6" cy="19" r="2" />
                  <circle cx="18" cy="19" r="2" />
                  <path d="M12 7v4m0 0l-4 6m4-6l4 6" />
                </svg>
                Explore Model Trees
              </Link>
              <Link
                href="/timeline"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass hover:bg-surface-tertiary text-text-primary font-medium text-sm transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <circle cx="7" cy="12" r="2" />
                  <circle cx="14" cy="12" r="2" />
                  <circle cx="20" cy="12" r="1" />
                </svg>
                View Timeline
              </Link>
            </div>
          </div>

          {/* Right — Animated tree preview */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <HeroTree />
          </div>
        </div>
      </section>

      {/* ── Divider glow ─────────────────────────────────────────────────── */}
      <div className="glow-line mx-auto w-full max-w-4xl" />

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-6 stagger">
          {[
            { label: "Frontier Models", value: models.length, icon: "🤖" },
            {
              label: "Model Families",
              value: families.length,
              icon: "🧬",
            },
            { label: "Research Papers", value: papers.length, icon: "📄" },
            {
              label: "Hardware Milestones",
              value: hardware.length,
              icon: "💎",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl glass hover:glass-elevated transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {stat.icon}
              </span>
              <span className="text-3xl font-bold text-text-primary">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Model Families Grid ──────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Model Family Trees
            </h2>
            <p className="mt-3 text-text-secondary max-w-lg">
              Explore the lineage of each frontier AI model family — from their
              first release through every major iteration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {families.map((family) => (
              <FamilyCard
                key={family}
                family={family}
                label={FAMILY_LABELS[family] ?? family}
                color={FAMILY_COLORS[family]}
                count={familyStats[family].count}
                latest={familyStats[family].latest}
                latestDate={familyStats[family].latestDate}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Trace the Full History
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            From backpropagation in 1986 through the Transformer revolution to
            today&apos;s agentic frontier models — see how every breakthrough
            connects.
          </p>
          <Link
            href="/timeline"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-accent-violet to-accent-cyan text-white font-medium transition-all hover:shadow-xl hover:shadow-accent-violet/20 hover:-translate-y-0.5"
          >
            Explore the Timeline
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border-default py-8 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-text-muted text-xs">
          <span>
            © {new Date().getFullYear()} LLM Tree of Life — MIT Licensed
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/llmtree-site"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary transition-colors"
            >
              GitHub
            </a>
            <span>·</span>
            <span>Data sourced from official announcements & ArXiv</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
