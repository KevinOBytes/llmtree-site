import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology & Curation Guidelines — LLM Tree of Life",
  description:
    "Learn about our data collection processes, parameter classifications, benchmark metrics (MMLU, GPQA, HumanEval), and instructions on how to contribute to the LLM Tree of Life database.",
};

export default function MethodologyPage() {
  return (
    <div className="flex flex-col min-h-dvh relative overflow-hidden">
      {/* ── Background Glow ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent-cyan/5 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-violet/5 blur-[150px] animate-pulse-glow [animation-delay:2s]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="text-center mb-16 stagger">
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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Curation Standards & Data Integrity
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary">
            Methodology &amp; Standards
          </h1>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            The LLM Tree of Life is a curated taxonomy mapping the structural evolution
            and lineage of large language models. Here is how we verify, structure, and benchmark this data.
          </p>
        </section>

        <div className="glow-line mb-12" />

        {/* ── Core Sections ───────────────────────────────────────────────── */}
        <div className="space-y-12">
          {/* Section 1: Data Collection & Lineage */}
          <section className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-accent-violet/10 text-accent-violet flex items-center justify-center font-bold text-base">
                1
              </span>
              Data Collection &amp; Lineage Mapping
            </h2>
            <div className="text-text-secondary space-y-4 text-sm sm:text-base leading-relaxed">
              <p>
                Our database is populated from primary academic literature, official corporate
                announcements, and verified repository releases. We compile new models
                weekly to keep the timeline and lineage trees up to date.
              </p>
              <p>
                <strong>Lineage connections (parents)</strong> are established based on:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <li className="p-4 rounded-xl bg-white/[0.02] border border-border-default">
                  <span className="font-semibold text-text-primary block mb-1">Direct Descendants</span>
                  Model initialized directly from the weights of another model (e.g., fine-tuning, instruction alignment, or model merges).
                </li>
                <li className="p-4 rounded-xl bg-white/[0.02] border border-border-default">
                  <span className="font-semibold text-text-primary block mb-1">Architectural Continuity</span>
                  Successive iterations within a model family using the same design principles but updated datasets or training runs (e.g., Llama 2 to Llama 3).
                </li>
                <li className="p-4 rounded-xl bg-white/[0.02] border border-border-default">
                  <span className="font-semibold text-text-primary block mb-1">Conceptual Influence</span>
                  Cross-family links (using <code>influenceIds</code>) to signify major conceptual breakthroughs, such as adopting a new attention type or alignment method first published elsewhere.
                </li>
                <li className="p-4 rounded-xl bg-white/[0.02] border border-border-default">
                  <span className="font-semibold text-text-primary block mb-1">Distillation</span>
                  Large models generating training data to supervise smaller target student models (e.g., Phi, Gemma, or Qwen distilled variants).
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: Parameter Definitions */}
          <section className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center font-bold text-base">
                2
              </span>
              Parameter Definitions
            </h2>
            <div className="space-y-6 text-sm sm:text-base leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary text-base">Parameter Count</h3>
                  <p className="text-text-secondary text-sm">
                    The total number of floating-point weights configured inside the network. For Mixture-of-Experts (MoE) models, we attempt to specify both active parameters per token and total parameters (e.g., <code>Mixture of Experts (~45B total / 12B active)</code>).
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary text-base">Context Window</h3>
                  <p className="text-text-secondary text-sm">
                    The absolute limit of input + output tokens that the model can process in a single execution step. Evaluated under native training parameters without context-extension modifications.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary text-base">Openness Classification</h3>
                  <p className="text-text-secondary text-sm">
                    We group models into three distinct licensing and structural categories:
                  </p>
                </div>
              </div>

              <div className="border-t border-border-default pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-accent-emerald/5 border border-accent-emerald/15">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-emerald/10 text-accent-emerald mb-2">
                      Open Source
                    </span>
                    <p className="text-xs text-text-secondary">
                      Weights, training code, and complete dataset disclosures are released publicly under open licenses (e.g., Pythia, OLMo).
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent-cyan/5 border border-accent-cyan/15">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-cyan/10 text-accent-cyan mb-2">
                      Open Weight
                    </span>
                    <p className="text-xs text-text-secondary">
                      Model weights are downloadable for local hosting/use, but exact dataset receipts and training recipes remain proprietary (e.g., Llama, Mistral).
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-tertiary border border-border-default">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/[0.07] text-text-muted mb-2">
                      Closed
                    </span>
                    <p className="text-xs text-text-secondary">
                      The weights and design are entirely proprietary, accessed exclusively through APIs or conversational interfaces (e.g., GPT-4o, Claude 3.5 Sonnet).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Benchmark Suite */}
          <section className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-accent-amber/10 text-accent-amber flex items-center justify-center font-bold text-base">
                3
              </span>
              Standardized Benchmark Suite
            </h2>
            <div className="text-text-secondary space-y-6 text-sm sm:text-base leading-relaxed">
              <p>
                To compare model performance objectively across timelines, we track the following
                academic and crowdsourced evaluation metrics. Where multiple evaluations exist, we favor
                officially disclosed scores from peer-reviewed papers or standardized eval harnesses.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-text-primary">MMLU</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-tertiary text-text-muted">
                      Knowledge
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    <strong>Massive Multitask Language Understanding:</strong> Tests world knowledge, humanities, sciences, and professional tasks across 57 distinct subjects. Expressed as 5-shot or 0-shot accuracy (0-100%).
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-text-primary">GPQA</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-tertiary text-text-muted">
                      Frontier Reasoning
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    <strong>Graduate-Level Google-Proof Q&amp;A:</strong> A highly challenging benchmark of graduate-level chemistry, physics, and biology questions designed by experts. Highly resistant to search engines and simple memorization.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-text-primary">HumanEval</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-tertiary text-text-muted">
                      Coding
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    <strong>Python Coding Proficiency:</strong> Measures programming capability using 164 hand-written coding problems. Evaluated using the <code>pass@1</code> metric, testing if generated code executes successfully.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-text-primary">MATH</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-tertiary text-text-muted">
                      Mathematics
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    <strong>Multi-Step Math:</strong> 12,500 challenging high-school competition math problems. Evaluated using exact answer matching, assessing logical chain-of-thought and numeric execution.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-text-primary">MT-Bench</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-tertiary text-text-muted">
                      Conversational
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    <strong>Multi-Turn Benchmark:</strong> A set of 80 multi-turn conversational questions evaluated by GPT-4 acting as a judge. Assesses dialog flow, instruction-following, and safety limits (0 to 10 scale).
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-text-primary">Arena ELO</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-tertiary text-text-muted">
                      Human Preference
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    <strong>LMSYS Chatbot Arena:</strong> A crowd-sourced benchmark of human side-by-side preference ratings. Thousands of blind battles are converted using Bradley-Terry algorithms into an active ELO rating.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Contribution Guidelines */}
          <section className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-accent-emerald/10 text-accent-emerald flex items-center justify-center font-bold text-base">
                4
              </span>
              Open-Source Contribution Guidelines
            </h2>
            <div className="text-text-secondary space-y-4 text-sm sm:text-base leading-relaxed">
              <p>
                We welcome community contributions to expand and refine our dataset! To propose a
                change (e.g., correcting a parameter count, linking a new paper, or adding a model):
              </p>
              <div className="p-5 rounded-xl bg-white/[0.02] border border-border-default font-mono text-xs text-text-muted space-y-2">
                <p className="text-text-primary font-semibold font-sans text-sm mb-2">How to update the database:</p>
                <p>1. Fork our GitHub repository.</p>
                <p>2. Locate the static data configuration files under <code className="text-accent-cyan">lib/data/</code>:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li><code className="text-accent-violet">models.ts</code> — Primary database containing model nodes.</li>
                  <li><code className="text-accent-emerald">papers.ts</code> — Foundational academic research papers.</li>
                  <li><code className="text-accent-amber">hardware.ts</code> — Hardware accelerator hardware components.</li>
                </ul>
                <p className="mt-3">3. Append your new model or modify existing fields using the strict TypeScript interfaces in <code className="text-accent-cyan">lib/types.ts</code>.</p>
                <p>4. Verify compile safety by running: <code className="text-accent-emerald">npx tsc --noEmit</code></p>
                <p>5. Open a Pull Request referencing official citations for any numerical claims.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-3 rounded-xl bg-accent-violet/10 hover:bg-accent-violet/15 text-accent-violet border border-accent-violet/25 font-semibold text-sm transition-all"
                >
                  GitHub Repository
                </a>
                <Link
                  href="/models"
                  className="flex-1 text-center py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-text-primary border border-border-default font-semibold text-sm transition-all"
                >
                  Browse Current Models
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
