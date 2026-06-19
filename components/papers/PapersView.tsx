"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { papers, papersById } from "@/lib/data/papers";
import { modelsById } from "@/lib/data/models";
import type { PaperNode, InnovationTag } from "@/lib/types";

// ── Era metadata ────────────────────────────────────────────────────────────

type Era = PaperNode["era"];

interface EraInfo {
  label: string;
  years: string;
  description: string;
  color: string;
}

const ERA_CONFIG: Record<Era, EraInfo> = {
  "pre-transformer": {
    label: "Pre-Transformer",
    years: "1986 – 2016",
    description:
      "The foundations — neural networks, memory, and representation",
    color: "#94a3b8",
  },
  transformer: {
    label: "Transformer",
    years: "2017 – 2020",
    description: "The architecture that changed everything",
    color: "#3b82f6",
  },
  scaling: {
    label: "Scaling",
    years: "2020 – 2023",
    description: "How big should models be? The laws of scale",
    color: "#22c55e",
  },
  architecture: {
    label: "Architecture",
    years: "2020 – 2024",
    description: "New ways to build: efficiency and alternatives",
    color: "#f59e0b",
  },
  diffusion: {
    label: "Diffusion",
    years: "2020 – 2023",
    description: "From noise to art: the generative revolution",
    color: "#ec4899",
  },
  alignment: {
    label: "Alignment",
    years: "2017 – 2023",
    description: "Teaching AI to be helpful, harmless, and honest",
    color: "#8b5cf6",
  },
  reasoning: {
    label: "Reasoning",
    years: "2022 – 2024",
    description: "Making AI think step by step",
    color: "#f97316",
  },
};

const ERA_ORDER: Era[] = [
  "pre-transformer",
  "transformer",
  "scaling",
  "architecture",
  "diffusion",
  "alignment",
  "reasoning",
];

// ── Innovation labels (matching ModelDetailPanel) ───────────────────────────

const INNOVATION_LABELS: Record<string, string> = {
  transformer: "Transformer",
  autoregressive: "Autoregressive",
  "masked-lm": "Masked LM",
  rlhf: "RLHF",
  "constitutional-ai": "Constitutional AI",
  "chain-of-thought": "Chain-of-Thought",
  "mixture-of-experts": "MoE",
  multimodal: "Multimodal",
  "long-context": "Long Context",
  "instruction-tuning": "Instruction Tuning",
  "few-shot": "Few-Shot",
  "zero-shot": "Zero-Shot",
  "tool-use": "Tool Use",
  agentic: "Agentic",
  reasoning: "Reasoning",
  "code-generation": "Code Gen",
  "open-weight": "Open Weight",
  distillation: "Distillation",
  "scaling-laws": "Scaling Laws",
  "attention-mechanism": "Attention",
  "test-time-compute": "Test-Time Compute",
  abliteration: "Abliteration",
  diffusion: "Diffusion",
  "text-to-image": "Text-to-Image",
  "text-to-audio": "Text-to-Audio",
  "text-to-video": "Text-to-Video",
  "speech-recognition": "Speech Recognition",
};

const INNOVATION_DEFINITIONS: Record<string, string> = {
  autoregressive:
    "Generates text one token at a time, each prediction based on all previous tokens.",
  transformer:
    "Neural network architecture using self-attention to process entire sequences in parallel.",
  "zero-shot":
    "Performing tasks without any examples — the model generalizes from its training alone.",
  "few-shot":
    "Learning from just a handful of examples provided in the prompt, without retraining.",
  "scaling-laws":
    "Mathematical relationships showing how model performance improves predictably with more data, compute, and parameters.",
  "code-generation":
    "Ability to write, debug, and understand programming code across multiple languages.",
  rlhf: "Reinforcement Learning from Human Feedback — training models to align with human preferences.",
  "instruction-tuning":
    "Fine-tuning a model on instruction-response pairs so it follows user commands more reliably.",
  multimodal:
    "Processing multiple types of input (text, images, audio, video) in a single model.",
  "mixture-of-experts":
    "Architecture where only a fraction of the model's parameters are active for each input.",
  "long-context":
    "Ability to process very long inputs (100K+ tokens), enabling analysis of entire codebases or books.",
  "tool-use":
    "Ability to call external tools, APIs, and functions — enabling web browsing and code execution.",
  distillation:
    "Training a smaller 'student' model to mimic a larger 'teacher' model.",
  reasoning:
    "Structured step-by-step problem solving, often using chain-of-thought approaches.",
  "chain-of-thought":
    "Prompting technique where the model 'thinks out loud' step by step before answering.",
  "test-time-compute":
    "Using extra computation during inference to improve answer quality.",
  agentic:
    "Models that can autonomously plan, execute multi-step tasks, and self-correct.",
  "constitutional-ai":
    "Anthropic's approach where the model critiques and revises its own outputs against principles.",
  "open-weight":
    "Model weights are publicly released but training data/code may not be.",
  "attention-mechanism":
    "The core innovation of Transformers — allowing each token to 'attend to' every other token.",
  abliteration:
    "Removing safety guardrails through targeted fine-tuning or weight manipulation.",
  diffusion:
    "Generates outputs by gradually denoising random noise into coherent images/audio.",
  "text-to-image":
    "Generating images from text descriptions — the technology behind DALL·E and Stable Diffusion.",
  "text-to-audio":
    "Generating speech, music, or sound effects from text descriptions.",
  "text-to-video":
    "Generating video clips from text descriptions.",
  "speech-recognition":
    "Converting spoken audio into text (automatic speech recognition / ASR).",
  "masked-lm":
    "Training by randomly hiding words and having the model predict them — BERT's key innovation.",
};

// ── Component ───────────────────────────────────────────────────────────────

export function PapersView() {
  const [search, setSearch] = useState("");
  const [selectedEra, setSelectedEra] = useState<Era | "all">("all");
  const [selectedTag, setSelectedTag] = useState<InnovationTag | "all">("all");
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  const paperRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // All unique innovation tags across papers
  const allTags = useMemo(() => {
    const tags = new Set<InnovationTag>();
    papers.forEach((p) => p.innovations.forEach((t) => tags.add(t)));
    return [...tags].sort();
  }, []);

  // Filtered papers
  const filtered = useMemo(() => {
    let result = papers;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.contribution.toLowerCase().includes(q) ||
          p.institution.toLowerCase().includes(q) ||
          (p.shortTitle && p.shortTitle.toLowerCase().includes(q))
      );
    }

    if (selectedEra !== "all") {
      result = result.filter((p) => p.era === selectedEra);
    }

    if (selectedTag !== "all") {
      result = result.filter((p) => p.innovations.includes(selectedTag));
    }

    return result;
  }, [search, selectedEra, selectedTag]);

  // Group filtered papers by era, maintaining era order
  const groupedByEra = useMemo(() => {
    const groups: { era: Era; papers: PaperNode[] }[] = [];
    for (const era of ERA_ORDER) {
      const eraPapers = filtered.filter((p) => p.era === era);
      if (eraPapers.length > 0) {
        // Sort papers within era by year, then month
        const sorted = [...eraPapers].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return (a.month ?? 0) - (b.month ?? 0);
        });
        groups.push({ era, papers: sorted });
      }
    }
    return groups;
  }, [filtered]);

  const scrollToPaper = useCallback((paperId: string) => {
    const el = paperRefs.current[paperId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Flash highlight
      el.classList.add("ring-2", "ring-accent-amber/60");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-accent-amber/60");
      }, 2000);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search papers by title, authors, contribution, institution…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-amber/40 border border-border-default"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Era filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedEra("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              selectedEra === "all"
                ? "bg-white/10 text-text-primary border border-white/20"
                : "glass text-text-muted hover:text-text-secondary border border-border-default"
            }`}
          >
            All Eras
          </button>
          {ERA_ORDER.map((era) => {
            const info = ERA_CONFIG[era];
            const isActive = selectedEra === era;
            return (
              <button
                key={era}
                onClick={() =>
                  setSelectedEra(isActive ? "all" : era)
                }
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border"
                style={{
                  backgroundColor: isActive
                    ? info.color + "20"
                    : "transparent",
                  borderColor: isActive
                    ? info.color + "50"
                    : "rgba(255,255,255,0.08)",
                  color: isActive ? info.color : undefined,
                }}
              >
                {info.label}
              </button>
            );
          })}
        </div>

        {/* Innovation tag filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold self-center mr-1">
              Tags:
            </span>
            {allTags.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTag(isActive ? "all" : tag)
                  }
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer border ${
                    isActive
                      ? "bg-accent-violet/15 text-accent-violet border-accent-violet/30"
                      : "bg-white/[0.03] text-text-muted border-border-default hover:text-text-secondary hover:border-white/15"
                  }`}
                >
                  {INNOVATION_LABELS[tag] ?? tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Count */}
        <div className="text-xs text-text-muted">
          Showing {filtered.length} of {papers.length} papers
        </div>
      </div>

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      {groupedByEra.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <span className="text-3xl mb-3">🔍</span>
          <p className="text-sm">No papers match your filters.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedByEra.map(({ era, papers: eraPapers }) => {
            const info = ERA_CONFIG[era];
            return (
              <div key={era}>
                {/* Era Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: info.color }}
                    />
                    <h2
                      className="text-lg sm:text-xl font-bold"
                      style={{ color: info.color }}
                    >
                      {info.label}
                    </h2>
                    <span className="text-xs text-text-muted font-mono">
                      {info.years}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary ml-6 italic">
                    {info.description}
                  </p>
                </div>

                {/* Papers timeline */}
                <div className="relative ml-4 sm:ml-6">
                  {/* Timeline connector line */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-px"
                    style={{
                      background: `linear-gradient(to bottom, ${info.color}40, ${info.color}10)`,
                    }}
                  />

                  <div className="space-y-4">
                    {eraPapers.map((paper, idx) => (
                      <PaperCard
                        key={paper.id}
                        paper={paper}
                        eraColor={info.color}
                        index={idx}
                        onScrollToPaper={scrollToPaper}
                        hoveredTag={hoveredTag}
                        onHoverTag={setHoveredTag}
                        ref={(el) => {
                          paperRefs.current[paper.id] = el;
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Paper Card ──────────────────────────────────────────────────────────────

import { forwardRef } from "react";

const PaperCard = forwardRef<
  HTMLDivElement,
  {
    paper: PaperNode;
    eraColor: string;
    index: number;
    onScrollToPaper: (id: string) => void;
    hoveredTag: string | null;
    onHoverTag: (tag: string | null) => void;
  }
>(function PaperCard(
  { paper, eraColor, index, onScrollToPaper, hoveredTag, onHoverTag },
  ref
) {
  const parentPapers = paper.parentIds
    .map((id) => papersById[id])
    .filter(Boolean);

  const relatedModels = (paper.relatedModelIds ?? [])
    .map((id) => modelsById[id])
    .filter(Boolean);

  return (
    <div
      ref={ref}
      className="relative pl-6 sm:pl-8 transition-all duration-300"
      style={{
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Timeline dot */}
      <div
        className="absolute left-0 top-6 w-2.5 h-2.5 rounded-full -translate-x-1/2 ring-2 ring-surface-primary"
        style={{ backgroundColor: eraColor }}
      />

      {/* Card */}
      <div className="glass rounded-2xl border border-border-default p-5 sm:p-6 hover:border-white/15 transition-colors group">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            {paper.arxivUrl ? (
              <a
                href={paper.arxivUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base sm:text-lg font-semibold text-text-primary hover:text-accent-cyan transition-colors leading-snug inline-flex items-start gap-2"
              >
                <span className="text-base flex-shrink-0 mt-0.5">📄</span>
                <span className="underline decoration-accent-cyan/20 underline-offset-2">
                  {paper.shortTitle ?? paper.title}
                </span>
                <svg
                  className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ) : (
              <div className="text-base sm:text-lg font-semibold text-text-primary leading-snug flex items-start gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">📄</span>
                <span>{paper.shortTitle ?? paper.title}</span>
              </div>
            )}

            {/* Full title if shortTitle shown */}
            {paper.shortTitle && paper.shortTitle !== paper.title && (
              <p className="text-xs text-text-muted mt-1 ml-7 leading-snug">
                {paper.title}
              </p>
            )}
          </div>

          {/* Era badge */}
          <span
            className="text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 mt-1"
            style={{
              borderColor: eraColor + "40",
              color: eraColor,
              backgroundColor: eraColor + "10",
            }}
          >
            {ERA_CONFIG[paper.era].label}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary ml-7 mb-3">
          <span className="font-medium">{paper.authors}</span>
          <span className="text-text-muted">·</span>
          <span>{paper.institution}</span>
          <span className="text-text-muted">·</span>
          <span className="font-mono text-text-muted">
            {paper.month
              ? `${paper.year}-${String(paper.month).padStart(2, "0")}`
              : paper.year}
          </span>
        </div>

        {/* Contribution */}
        <p className="text-sm text-text-secondary leading-relaxed ml-7 mb-3">
          {paper.contribution}
        </p>

        {/* Significance (highlighted) */}
        {paper.significance && (
          <div className="ml-7 mb-3 p-3 rounded-xl bg-accent-amber/[0.06] border border-accent-amber/15">
            <div className="text-[10px] font-semibold text-accent-amber uppercase tracking-wider mb-1">
              Why It Matters
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {paper.significance}
            </p>
          </div>
        )}

        {/* Innovation tags */}
        {paper.innovations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-7 mb-3">
            {paper.innovations.map((tag) => (
              <span
                key={tag}
                className="relative text-[10px] px-2 py-0.5 rounded-full bg-accent-violet/10 text-accent-violet border border-accent-violet/20 cursor-help"
                onMouseEnter={() => onHoverTag(tag)}
                onMouseLeave={() => onHoverTag(null)}
              >
                {INNOVATION_LABELS[tag] ?? tag}
                {/* Tooltip */}
                {hoveredTag === tag && INNOVATION_DEFINITIONS[tag] && (
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-surface-elevated text-text-secondary text-[11px] leading-relaxed w-56 text-left shadow-xl border border-border-default z-50 pointer-events-none">
                    {INNOVATION_DEFINITIONS[tag]}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Related models */}
        {relatedModels.length > 0 && (
          <div className="ml-7 mb-3">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mr-2">
              Related Models:
            </span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1">
              {relatedModels.map((model) => (
                <Link
                  key={model.id}
                  href="/models"
                  className="text-[10px] px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/20 transition-colors"
                >
                  {model.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Builds on (parent papers) */}
        {parentPapers.length > 0 && (
          <div className="ml-7">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mr-2">
              Builds on:
            </span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1">
              {parentPapers.map((parent) => (
                <button
                  key={parent.id}
                  onClick={() => onScrollToPaper(parent.id)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-text-secondary border border-border-default hover:text-accent-amber hover:border-accent-amber/30 transition-colors cursor-pointer"
                >
                  {parent.shortTitle ?? parent.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
