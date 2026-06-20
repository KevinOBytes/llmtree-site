import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { models, modelsById, modelsByFamily } from "@/lib/data/models";
import { papers } from "@/lib/data/papers";
import { hardware } from "@/lib/data/hardware";
import { FAMILY_COLORS, type ModelNode } from "@/lib/types";
import { FAMILY_LABELS } from "@/lib/chartUtils";
import {
  BenchmarkChart,
  InnovationTags,
  RevealSection,
  LineageChain,
  RelatedPapersSection,
  FamilySiblings,
  FamilyNavigation,
} from "@/components/models/ModelPage";

// ============================================================================
// Static Generation
// ============================================================================

export async function generateStaticParams() {
  return models.map((m) => ({ id: m.id }));
}

export const dynamicParams = false;

// ============================================================================
// SEO Metadata
// ============================================================================

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const model = modelsById[id];
  if (!model) return {};

  const description =
    model.description.length > 160
      ? model.description.slice(0, 157) + "…"
      : model.description;

  return {
    title: `${model.name} — LLM Tree of Life`,
    description,
    openGraph: {
      title: `${model.name} — LLM Tree of Life`,
      description,
      type: "article",
      siteName: "LLM Tree of Life",
    },
    twitter: {
      card: "summary_large_image",
      title: `${model.name} — LLM Tree of Life`,
      description,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateStr: string) {
  const parts = dateStr.split("-");
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  if (parts.length >= 2) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (parts.length === 3) {
      return `${months[monthIdx]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
    }
    return `${months[monthIdx]} ${parts[0]}`;
  }
  return parts[0];
}

function buildAncestryChain(model: ModelNode): ModelNode[] {
  const chain: ModelNode[] = [];
  let current: ModelNode | undefined = model;
  const visited = new Set<string>();
  while (current && current.parentIds.length > 0 && !visited.has(current.id)) {
    visited.add(current.id);
    const parent: ModelNode | undefined = modelsById[current.parentIds[0]];
    if (parent) {
      chain.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }
  return chain;
}

// ============================================================================
// Page Component
// ============================================================================

export default async function ModelDetailPage({ params }: PageProps) {
  const { id } = await params;
  const model = modelsById[id];

  if (!model) notFound();

  const familyColor = FAMILY_COLORS[model.family];
  const familyLabel = FAMILY_LABELS[model.family] ?? model.family;

  // Resolve relationships
  const parentModels = model.parentIds
    .map((pid) => modelsById[pid])
    .filter(Boolean);
  const childModels = models.filter((m) => m.parentIds.includes(model.id));
  const relatedPapers = papers.filter((p) =>
    p.relatedModelIds?.includes(model.id)
  );
  const relatedHardware = hardware.filter((h) =>
    h.enabledModels?.includes(model.id)
  );
  const ancestryChain = buildAncestryChain(model);
  const familySiblings = modelsByFamily[model.family] ?? [];

  // Prev/Next in family (chronologically sorted)
  const sortedFamily = [...familySiblings].sort((a, b) =>
    a.releaseDate.localeCompare(b.releaseDate)
  );
  const familyIdx = sortedFamily.findIndex((m) => m.id === model.id);
  const prevModel = familyIdx > 0 ? sortedFamily[familyIdx - 1] : null;
  const nextModel =
    familyIdx < sortedFamily.length - 1 ? sortedFamily[familyIdx + 1] : null;

  const status = model.status ?? "active";

  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Background Glow ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[150px] animate-pulse-glow"
          style={{ background: familyColor }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-violet/5 blur-[120px] animate-pulse-glow [animation-delay:2s]" />
      </div>

      <div className="relative z-10">
        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <nav className="flex items-center gap-2 text-xs text-text-muted">
            <Link
              href="/models"
              className="hover:text-text-primary transition-colors flex items-center gap-1"
            >
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
                <path d="m15 18-6-6 6-6" />
              </svg>
              All Models
            </Link>
            <span className="text-text-muted/50">·</span>
            <span style={{ color: familyColor }}>{familyLabel}</span>
            <span className="text-text-muted/50">·</span>
            <span className="text-text-secondary">{model.name}</span>
          </nav>
        </div>

        {/* ── Hero Section ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          <div className="stagger">
            {/* Model Name */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary mb-4">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${familyColor}, ${familyColor}cc, var(--color-text-primary))`,
                }}
              >
                {model.name}
              </span>
            </h1>

            {/* Company + Date */}
            <p className="text-base sm:text-lg text-text-secondary mb-5">
              {model.company} · {formatDate(model.releaseDate)}
            </p>

            {/* Badge Row */}
            <div className="flex flex-wrap gap-2 mb-6">
              {/* Status badge */}
              <StatusBadge status={status} />

              {/* Openness badge */}
              <OpennessBadge openness={model.openness} />

              {/* Architecture badge */}
              {model.architecture && (
                <span className="text-[11px] px-3 py-1 rounded-full bg-surface-tertiary text-text-secondary border border-border-default font-medium">
                  {model.architecture.replace(/-/g, " ")}
                </span>
              )}

              {/* Modality badge */}
              {model.modality && (
                <span className="text-[11px] px-3 py-1 rounded-full bg-surface-tertiary text-text-secondary border border-border-default font-medium capitalize">
                  {model.modality}
                </span>
              )}

              {/* API badge */}
              {model.apiAvailable && (
                <span className="text-[11px] px-3 py-1 rounded-full bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 font-medium">
                  API Available
                </span>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {model.parameterCount && (
                <StatCard label="Parameters" value={model.parameterCount} />
              )}
              {model.contextWindow && (
                <StatCard
                  label="Context Window"
                  value={model.contextWindow + " tokens"}
                />
              )}
              {model.variants && model.variants.length > 0 && (
                <StatCard
                  label="Variants"
                  value={model.variants.join(", ")}
                />
              )}
              {model.discontinuedDate && (
                <StatCard
                  label="Sunset Date"
                  value={formatDate(model.discontinuedDate)}
                />
              )}
            </div>
          </div>
        </section>

        <div className="glow-line" />

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {/* Significance */}
          {model.significance && (
            <RevealSection>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-accent-violet/8 to-accent-cyan/5 border border-accent-violet/15">
                <h2 className="text-[11px] uppercase tracking-wider text-accent-violet font-semibold mb-2 flex items-center gap-2">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Why It Matters
                </h2>
                <p className="text-sm sm:text-base text-text-primary leading-relaxed">
                  {model.significance}
                </p>
              </div>
            </RevealSection>
          )}

          {/* Description */}
          <RevealSection delay={80}>
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
                Description
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                {model.description}
              </p>
            </div>
          </RevealSection>

          {/* Notable Uses */}
          {model.notableUses && model.notableUses.length > 0 && (
            <RevealSection delay={160}>
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
                  Notable Milestones
                </h2>
                <ul className="space-y-2">
                  {model.notableUses.map((use, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-text-secondary"
                    >
                      <span className="text-accent-amber flex-shrink-0 mt-0.5">
                        ▸
                      </span>
                      <span className="leading-relaxed">{use}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
          )}

          {/* Two-column: Benchmarks + Innovations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Benchmarks */}
            {model.benchmarks && (
              <RevealSection delay={200}>
                <div className="glass rounded-2xl p-6 h-full">
                  <h2 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-4 flex items-center gap-2">
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
                      <path d="m19 9-5 5-4-4-3 3" />
                    </svg>
                    Benchmark Scores
                  </h2>
                  <BenchmarkChart
                    benchmarks={model.benchmarks}
                    familyColor={familyColor}
                  />
                </div>
              </RevealSection>
            )}

            {/* Innovations */}
            {model.innovations.length > 0 && (
              <RevealSection delay={280}>
                <div className="glass rounded-2xl p-6 h-full">
                  <h2 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-4">
                    Key Innovations
                  </h2>
                  <InnovationTags innovations={model.innovations} />
                </div>
              </RevealSection>
            )}
          </div>

          {/* Family Tree (Lineage + Children) */}
          {(ancestryChain.length > 0 ||
            parentModels.length > 0 ||
            childModels.length > 0) && (
            <RevealSection delay={320}>
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-4 flex items-center gap-2">
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
                    <path d="M12 20v-6M6 20v-2M18 20v-4M2 20h20" />
                    <path d="M12 14V4" />
                    <path d="m7 9 5-5 5 5" />
                  </svg>
                  Family Tree
                </h2>

                {/* Parents */}
                {parentModels.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-2">
                      Built On
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {parentModels.map((parent) => (
                        <Link
                          key={parent.id}
                          href={`/models/${parent.id}`}
                          className="text-xs px-3 py-1.5 rounded-full bg-surface-elevated text-text-secondary font-medium border border-border-default hover:bg-surface-tertiary hover:text-text-primary transition-all duration-200 hover:scale-105 flex items-center gap-1.5"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              background: FAMILY_COLORS[parent.family],
                            }}
                          />
                          {parent.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <LineageChain
                  ancestors={ancestryChain}
                  current={model}
                >
                  {childModels}
                </LineageChain>
              </div>
            </RevealSection>
          )}

          {/* Related Papers */}
          {relatedPapers.length > 0 && (
            <RevealSection delay={360}>
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xs uppercase tracking-wider text-accent-amber font-medium mb-4 flex items-center gap-2">
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
                  Related Research ({relatedPapers.length})
                </h2>
                <RelatedPapersSection papers={relatedPapers} />
              </div>
            </RevealSection>
          )}

          {/* Related Hardware */}
          {relatedHardware.length > 0 && (
            <RevealSection delay={400}>
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xs uppercase tracking-wider text-accent-emerald font-medium mb-4 flex items-center gap-2">
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
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <rect x="9" y="9" width="6" height="6" />
                    <path d="M15 2v2" />
                    <path d="M15 20v2" />
                    <path d="M2 15h2" />
                    <path d="M2 9h2" />
                    <path d="M20 15h2" />
                    <path d="M20 9h2" />
                    <path d="M9 2v2" />
                    <path d="M9 20v2" />
                  </svg>
                  Enabled By
                </h2>
                <div className="space-y-3">
                  {relatedHardware.map((hw) => (
                    <div
                      key={hw.id}
                      className="p-4 rounded-xl bg-white/[0.02] border border-border-default"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-text-primary">
                          {hw.name}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {hw.manufacturer.toUpperCase()} ·{" "}
                          {formatDate(hw.releaseDate)}
                        </span>
                      </div>
                      {hw.specs.compute && (
                        <span className="text-xs text-text-muted">
                          {hw.specs.compute}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          )}

          {/* External Links */}
          {(model.paperUrl || model.announcementUrl) && (
            <RevealSection delay={440}>
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
                  External Links
                </h2>
                <div className="flex flex-wrap gap-3">
                  {model.paperUrl && (
                    <a
                      href={model.paperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-accent-violet/10 text-accent-violet border border-accent-violet/20 hover:bg-accent-violet/15 transition-colors"
                    >
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
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Research Paper
                    </a>
                  )}
                  {model.announcementUrl && (
                    <a
                      href={model.announcementUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/15 transition-colors"
                    >
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
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      Announcement
                    </a>
                  )}
                </div>
              </div>
            </RevealSection>
          )}

          {/* Family Siblings */}
          {familySiblings.some((m) => m.id !== model.id) && (
            <RevealSection delay={480}>
              <div className="glass rounded-2xl p-6">
                <FamilySiblings
                  currentId={model.id}
                  family={model.family}
                  siblings={familySiblings}
                />
              </div>
            </RevealSection>
          )}

          {/* Prev/Next Navigation */}
          <FamilyNavigation
            prev={prevModel}
            next={nextModel}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-Components (Server)
// ============================================================================

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3.5">
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium block mb-1">
        {label}
      </span>
      <span className="text-sm font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20",
    deprecated: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    discontinued: "bg-red-500/10 text-red-400 border-red-500/20",
    legacy: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };
  const icons: Record<string, string> = {
    active: "●",
    deprecated: "⚠",
    discontinued: "☠",
    legacy: "◌",
  };

  return (
    <span
      className={`text-[11px] px-3 py-1 rounded-full border font-medium capitalize ${
        styles[status] ?? styles.active
      }`}
    >
      {icons[status] ?? "●"} {status}
    </span>
  );
}

function OpennessBadge({ openness }: { openness: string }) {
  const styles: Record<string, string> = {
    "open-source":
      "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20",
    "open-weight":
      "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20",
    closed: "bg-surface-tertiary text-text-muted border-border-default",
  };

  const labels: Record<string, string> = {
    "open-source": "Open Source",
    "open-weight": "Open Weight",
    closed: "Closed",
  };

  return (
    <span
      className={`text-[11px] px-3 py-1 rounded-full border font-medium ${
        styles[openness] ?? styles.closed
      }`}
    >
      {labels[openness] ?? openness}
    </span>
  );
}
