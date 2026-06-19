"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  FAMILY_COLORS,
  type ModelNode,
  type ModelFamily,
  type BenchmarkScores,
} from "@/lib/types";
import { GLOSSARY, INNOVATION_LABELS } from "@/lib/glossary";
import { FAMILY_LABELS } from "@/lib/chartUtils";
import type { PaperNode } from "@/lib/types";

// ============================================================================
// Benchmark Bar Chart
// ============================================================================

/** Benchmark metadata: label, max value, description */
const BENCHMARK_META: {
  key: keyof BenchmarkScores;
  label: string;
  max: number;
  description: string;
}[] = [
  {
    key: "mmlu",
    label: "MMLU",
    max: 100,
    description: "Massive Multitask Language Understanding — 57 subjects",
  },
  {
    key: "humanEval",
    label: "HumanEval",
    max: 100,
    description: "Code generation pass@1 — Python problems",
  },
  {
    key: "math",
    label: "MATH",
    max: 100,
    description: "MATH benchmark — competition-level problems",
  },
  {
    key: "mtBench",
    label: "MT-Bench",
    max: 10,
    description: "Multi-turn chat quality rating",
  },
  {
    key: "arenaElo",
    label: "Arena ELO",
    max: 1400,
    description: "Chatbot Arena crowdsourced ranking",
  },
  {
    key: "gpqa",
    label: "GPQA",
    max: 100,
    description: "Graduate-level science QA",
  },
  {
    key: "aime",
    label: "AIME",
    max: 100,
    description: "AMC/AIME math competition",
  },
  {
    key: "swe",
    label: "SWE-bench",
    max: 100,
    description: "Real-world software engineering",
  },
];

export function BenchmarkChart({
  benchmarks,
  familyColor,
}: {
  benchmarks: BenchmarkScores;
  familyColor: string;
}) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const activeBenchmarks = BENCHMARK_META.filter(
    (b) => benchmarks[b.key] !== undefined
  );

  if (activeBenchmarks.length === 0) return null;

  return (
    <div ref={ref} className="space-y-3">
      {activeBenchmarks.map((b, i) => {
        const value = benchmarks[b.key]!;
        const pct = Math.min((value / b.max) * 100, 100);
        // Format display: ELO as integer, MT-Bench with 1 decimal, rest as percent
        const display =
          b.key === "arenaElo"
            ? value.toFixed(0)
            : b.key === "mtBench"
            ? value.toFixed(1)
            : `${value.toFixed(1)}%`;

        return (
          <div key={b.key} className="group/bench">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-primary">
                  {b.label}
                </span>
                <span className="text-[10px] text-text-muted opacity-0 group-hover/bench:opacity-100 transition-opacity">
                  {b.description}
                </span>
              </div>
              <span
                className="text-xs font-mono font-semibold"
                style={{ color: familyColor }}
              >
                {display}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: animated ? `${pct}%` : "0%",
                  background: `linear-gradient(90deg, ${familyColor}88, ${familyColor})`,
                  transitionDelay: `${i * 80}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Innovation Tags with Glossary Tooltips
// ============================================================================

export function InnovationTags({ innovations }: { innovations: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {innovations.map((tag) => {
        const label = INNOVATION_LABELS[tag] ?? tag;
        const definition = GLOSSARY[tag];
        return (
          <div key={tag} className="group/tip relative inline-block">
            <span className="text-xs px-3 py-1.5 rounded-full bg-accent-violet/10 text-accent-violet font-medium cursor-help inline-block transition-all duration-200 group-hover/tip:bg-accent-violet/20 group-hover/tip:scale-105 border border-accent-violet/10 group-hover/tip:border-accent-violet/30">
              {label}
            </span>
            {definition && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 rounded-xl bg-surface-primary/95 backdrop-blur-md border border-border-default text-xs text-text-secondary leading-relaxed max-w-[280px] w-max opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl shadow-black/40">
                <span className="font-semibold text-text-primary block mb-1">
                  {label}
                </span>
                {definition}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-border-default" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-surface-primary/95" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Animated Section Wrapper
// ============================================================================

export function RevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Lineage Chain
// ============================================================================

export function LineageChain({
  ancestors,
  current,
  children: childModels,
}: {
  ancestors: ModelNode[];
  current: ModelNode;
  children: ModelNode[];
}) {
  const currentColor = FAMILY_COLORS[current.family];

  return (
    <div className="space-y-4">
      {/* Ancestry trail */}
      {ancestors.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
            Lineage
          </h4>
          <div className="flex flex-wrap items-center gap-1.5">
            {ancestors.map((ancestor, i) => (
              <span key={ancestor.id} className="flex items-center gap-1.5">
                <Link
                  href={`/models/${ancestor.id}`}
                  className="text-xs px-2.5 py-1 rounded-lg bg-surface-tertiary text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                  style={{
                    borderLeft: `2px solid ${FAMILY_COLORS[ancestor.family]}`,
                  }}
                >
                  {ancestor.name}
                </Link>
                {i < ancestors.length - 1 && (
                  <span className="text-text-muted text-[10px]">→</span>
                )}
              </span>
            ))}
            <span className="text-text-muted text-[10px]">→</span>
            <span
              className="text-xs px-2.5 py-1 rounded-lg bg-accent-violet/15 text-accent-violet font-semibold"
              style={{ borderLeft: `2px solid ${currentColor}` }}
            >
              {current.name}
            </span>
          </div>
        </div>
      )}

      {/* Children */}
      {childModels.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
            Successors ({childModels.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {childModels.slice(0, 12).map((child) => (
              <Link
                key={child.id}
                href={`/models/${child.id}`}
                className="text-xs px-3 py-1.5 rounded-full bg-surface-elevated text-text-secondary font-medium border border-border-default hover:bg-surface-tertiary hover:text-text-primary transition-all duration-200 hover:scale-105 flex items-center gap-1.5"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: FAMILY_COLORS[child.family] }}
                />
                {child.name}
              </Link>
            ))}
            {childModels.length > 12 && (
              <span className="text-xs px-3 py-1.5 text-text-muted">
                +{childModels.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Related Papers Section
// ============================================================================

const ERA_STYLES: Record<string, { label: string; color: string }> = {
  "pre-transformer": {
    label: "Pre-Transformer",
    color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  },
  transformer: {
    label: "Transformer",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  scaling: {
    label: "Scaling",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  alignment: {
    label: "Alignment",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  reasoning: {
    label: "Reasoning",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  architecture: {
    label: "Architecture",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  diffusion: {
    label: "Diffusion",
    color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  },
};

export function RelatedPapersSection({ papers }: { papers: PaperNode[] }) {
  if (papers.length === 0) return null;

  return (
    <div className="space-y-3">
      {papers.map((paper) => {
        const eraStyle = ERA_STYLES[paper.era];
        return (
          <div
            key={paper.id}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-500/[0.04] to-amber-600/[0.02] border border-amber-500/10 hover:border-amber-500/25 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              {paper.arxivUrl ? (
                <a
                  href={paper.arxivUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent-amber hover:underline decoration-accent-amber/30 underline-offset-2 leading-snug"
                >
                  {paper.shortTitle ?? paper.title}
                </a>
              ) : (
                <span className="text-sm font-medium text-text-primary leading-snug">
                  {paper.shortTitle ?? paper.title}
                </span>
              )}
              {eraStyle && (
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${eraStyle.color}`}
                >
                  {eraStyle.label}
                </span>
              )}
            </div>
            <div className="text-[11px] text-text-muted mb-1.5">
              {paper.year} · {paper.institution}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {paper.contribution.length > 150
                ? paper.contribution.slice(0, 150) + "…"
                : paper.contribution}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Family Siblings Section
// ============================================================================

export function FamilySiblings({
  currentId,
  family,
  siblings,
}: {
  currentId: string;
  family: ModelFamily;
  siblings: ModelNode[];
}) {
  const familyColor = FAMILY_COLORS[family];
  const familyLabel = FAMILY_LABELS[family] ?? family;

  // Show up to 10 siblings (excluding current model)
  const otherSiblings = siblings
    .filter((m) => m.id !== currentId)
    .slice(0, 10);

  if (otherSiblings.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3 flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: familyColor }}
        />
        More from {familyLabel}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {otherSiblings.map((sibling) => (
          <Link
            key={sibling.id}
            href={`/models/${sibling.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-border-default hover:bg-white/[0.05] hover:border-border-hover transition-all duration-200 group/sib"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: familyColor }}
            />
            <div className="min-w-0">
              <span className="text-sm font-medium text-text-primary group-hover/sib:text-accent-violet transition-colors block truncate">
                {sibling.name}
              </span>
              <span className="text-[10px] text-text-muted">
                {sibling.releaseDate} · {sibling.parameterCount ?? "—"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Family Navigation (Prev/Next)
// ============================================================================

export function FamilyNavigation({
  prev,
  next,
  family,
}: {
  prev: ModelNode | null;
  next: ModelNode | null;
  family: ModelFamily;
}) {
  const familyColor = FAMILY_COLORS[family];

  if (!prev && !next) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t border-border-default">
      {prev ? (
        <Link
          href={`/models/${prev.id}`}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors group/nav"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover/nav:-translate-x-1 transition-transform"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <div className="text-left">
            <span className="text-[10px] text-text-muted block">Previous</span>
            <span className="font-medium">{prev.name}</span>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/models/${next.id}`}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors group/nav text-right"
        >
          <div>
            <span className="text-[10px] text-text-muted block">Next</span>
            <span className="font-medium">{next.name}</span>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover/nav:translate-x-1 transition-transform"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
