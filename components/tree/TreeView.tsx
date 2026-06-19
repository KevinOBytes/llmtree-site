"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { models } from "@/lib/data/models";
import { FAMILY_COLORS, type ModelFamily, type ModelNode } from "@/lib/types";
import { ModelDetailPanel } from "./ModelDetailPanel";
import { ForceGraph2D } from "./ForceGraph";
import { ViewControls } from "./ViewControls";
import { VisualizationLegend } from "./VisualizationLegend";

// Dynamic import with SSR disabled — Three.js requires browser APIs
const ForceGraph3D = dynamic(
  () =>
    import("./ForceGraph3D").then((mod) => ({
      default: mod.ForceGraph3D,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" />
          <span className="text-sm">Loading 3D engine...</span>
        </div>
      </div>
    ),
  }
);

// ── Constants ──────────────────────────────────────────────────────────────────

const FAMILY_LABELS: Record<string, string> = {
  "openai-gpt": "OpenAI GPT",
  "openai-o": "OpenAI o-series",
  "anthropic-claude": "Anthropic Claude",
  "google-gemini": "Google Gemini",
  "google-palm": "Google PaLM",
  "google-gemma": "Google Gemma",
  "meta-llama": "Meta LLaMA",
  mistral: "Mistral AI",
  "xai-grok": "xAI Grok",
  "cohere-command": "Cohere Command",
  "microsoft-phi": "Microsoft Phi",
  deepseek: "DeepSeek",
  "alibaba-qwen": "Alibaba Qwen",
  "tii-falcon": "TII Falcon",
  "amazon-nova": "Amazon Nova",
  "nvidia-nemotron": "NVIDIA Nemotron",
  "ibm": "IBM",
  "01ai-yi": "01.AI Yi",
  "apple": "Apple",
  "ai21-jamba": "AI21 Labs",
  "allen-ai": "Allen AI",
  "inflection": "Inflection AI",
  "search-tool": "Search / RAG",
  "music-gen": "Music Generation",
  "speech-ai": "Speech / Voice",
  "stability-ai": "Stability AI",
  "midjourney": "Midjourney",
  "image-gen": "Image Generation",
  "coding-tool": "Coding Tools",
  community: "Community / Uncensored",
  foundational: "Foundational",
};

/** Families with models that have non-zero counts */
const ALL_FAMILIES = (Object.keys(FAMILY_LABELS) as ModelFamily[]).filter(
  (f) => models.some((m) => m.family === f)
);

/** Frontier / top-tier providers */
const FRONTIER_FAMILIES: Set<string> = new Set([
  "openai-gpt",
  "openai-o",
  "anthropic-claude",
  "google-gemini",
  "meta-llama",
  "xai-grok",
  "deepseek",
]);

type ViewMode = "graph" | "list";
type OpennessFilter = "all" | "open" | "closed";

const MODALITY_OPTIONS = [
  { key: "all", label: "All", icon: "◎" },
  { key: "text", label: "Text", icon: "T" },
  { key: "multimodal", label: "Multi", icon: "◆" },
  { key: "image", label: "Image", icon: "🖼" },
  { key: "code", label: "Code", icon: "⌨" },
  { key: "audio", label: "Audio", icon: "♪" },
  { key: "video", label: "Video", icon: "▶" },
] as const;

type ModalityFilter = (typeof MODALITY_OPTIONS)[number]["key"];

// ── Component ──────────────────────────────────────────────────────────────────

function TreeViewInner() {
  const searchParams = useSearchParams();
  const initialFamily = searchParams.get("family") as ModelFamily | null;

  // Filters
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(() => {
    if (initialFamily) return new Set([initialFamily]);
    return new Set<string>(); // empty = all
  });
  const [frontierOnly, setFrontierOnly] = useState(false);
  const [opennessFilter, setOpennessFilter] = useState<OpennessFilter>("all");
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>("all");
  const [familySectionOpen, setFamilySectionOpen] = useState(true);

  // View state
  const [selectedModel, setSelectedModel] = useState<ModelNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [viewDimension, setViewDimension] = useState<"2d" | "3d">("2d");
  const [motionEnabled, setMotionEnabled] = useState(false);

  // ── Derived: effective families set ────────────────────────────────────
  const effectiveFamilies = useMemo(() => {
    let families = selectedFamilies.size > 0 ? selectedFamilies : new Set(ALL_FAMILIES);
    if (frontierOnly) {
      families = new Set([...families].filter((f) => FRONTIER_FAMILIES.has(f)));
    }
    return families;
  }, [selectedFamilies, frontierOnly]);

  // ── Selection helpers ─────────────────────────────────────────────────
  const selectAll = useCallback(() => setSelectedFamilies(new Set<string>()), []);
  const selectNone = useCallback(() => setSelectedFamilies(new Set(["__none__"])), []);
  const selectFrontier = useCallback(() => {
    setSelectedFamilies(new Set(FRONTIER_FAMILIES));
    setFrontierOnly(true);
  }, []);

  const toggleFamily = useCallback((family: string) => {
    setSelectedFamilies((prev) => {
      const next = new Set(prev);
      // If was showing all (empty set), populate with all then remove
      if (next.size === 0) {
        ALL_FAMILIES.forEach((f) => next.add(f));
        next.delete(family);
      } else if (next.has("__none__")) {
        next.clear();
        next.add(family);
      } else if (next.has(family)) {
        next.delete(family);
        if (next.size === 0) next.add("__none__");
      } else {
        next.add(family);
        // If all are selected, go back to empty (= all)
        if (ALL_FAMILIES.every((f) => next.has(f))) {
          return new Set<string>();
        }
      }
      return next;
    });
  }, []);

  const isFamilySelected = useCallback(
    (family: string) => {
      if (selectedFamilies.has("__none__")) return false;
      if (selectedFamilies.size === 0) return true; // all
      return selectedFamilies.has(family);
    },
    [selectedFamilies]
  );

  const allSelected = selectedFamilies.size === 0;
  const noneSelected = selectedFamilies.has("__none__");

  // ── Filtered models ───────────────────────────────────────────────────
  const filteredModels = useMemo(() => {
    let result = models;

    // Family filter
    if (!allSelected) {
      result = result.filter((m) => effectiveFamilies.has(m.family));
    } else if (frontierOnly) {
      result = result.filter((m) => FRONTIER_FAMILIES.has(m.family));
    }

    // Openness filter
    if (opennessFilter === "open") {
      result = result.filter(
        (m) => m.openness === "open-weight" || m.openness === "open-source"
      );
    } else if (opennessFilter === "closed") {
      result = result.filter(
        (m) => m.openness === "closed"
      );
    }

    // Modality filter
    if (modalityFilter !== "all") {
      result = result.filter((m) => {
        const mod = m.modality ?? "text";
        return mod === modalityFilter;
      });
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.company.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allSelected, effectiveFamilies, frontierOnly, opennessFilter, modalityFilter, searchQuery]);

  // ── Grouped for list view ─────────────────────────────────────────────
  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelNode[]> = {};
    for (const model of filteredModels) {
      if (!groups[model.family]) groups[model.family] = [];
      groups[model.family].push(model);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
    }
    return groups;
  }, [filteredModels]);

  const familyKeys = Object.keys(groupedModels) as ModelFamily[];

  // ── Header text ───────────────────────────────────────────────────────
  const headerTitle = useMemo(() => {
    if (frontierOnly) return "Frontier Models";
    if (allSelected) return "All Model Families";
    if (noneSelected) return "No Families Selected";
    const selected = [...effectiveFamilies];
    if (selected.length === 1) return FAMILY_LABELS[selected[0]] ?? selected[0];
    return `${selected.length} Families`;
  }, [frontierOnly, allSelected, noneSelected, effectiveFamilies]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border-default flex flex-col overflow-y-auto flex-shrink-0">
        <div className="p-4 flex flex-col gap-3">
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
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/25 transition-all"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-surface-tertiary">
            <button
              onClick={() => setViewMode("graph")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "graph"
                  ? "bg-accent-violet/20 text-accent-violet"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5" cy="12" r="3" />
                <circle cx="19" cy="5" r="3" />
                <circle cx="19" cy="19" r="3" />
                <line x1="8" y1="12" x2="16" y2="5" />
                <line x1="8" y1="12" x2="16" y2="19" />
              </svg>
              Graph
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "list"
                  ? "bg-accent-violet/20 text-accent-violet"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              List
            </button>
          </div>
        </div>

        {/* ── Quick Filters ─────────────────────────────────────────────── */}
        <div className="px-4 pb-3 flex flex-col gap-2">
          {/* Frontier toggle */}
          <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-tertiary/50 cursor-pointer hover:bg-surface-tertiary transition-colors group">
            <input
              type="checkbox"
              checked={frontierOnly}
              onChange={(e) => setFrontierOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border-default bg-surface-tertiary text-accent-violet focus:ring-accent-violet/30 accent-[var(--color-accent-violet)]"
            />
            <div className="flex-1">
              <span className="text-xs font-semibold text-text-primary group-hover:text-accent-violet transition-colors">
                Frontier Only
              </span>
              <span className="text-[10px] text-text-muted ml-1.5">
                Top-tier providers
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-amber/15 text-accent-amber font-semibold">
              {models.filter((m) => FRONTIER_FAMILIES.has(m.family)).length}
            </span>
          </label>

          {/* Openness filter */}
          <div className="flex gap-1 p-0.5 rounded-lg bg-surface-tertiary/50">
            {(
              [
                { key: "all", label: "All" },
                { key: "open", label: "Open" },
                { key: "closed", label: "Closed" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setOpennessFilter(key)}
                className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  opennessFilter === key
                    ? key === "open"
                      ? "bg-accent-emerald/20 text-accent-emerald"
                      : key === "closed"
                        ? "bg-accent-rose/20 text-accent-rose"
                        : "bg-accent-violet/20 text-accent-violet"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Modality filter */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1 px-1">
              Modality
            </div>
            <div className="flex flex-wrap gap-1">
              {MODALITY_OPTIONS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setModalityFilter(key)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                    modalityFilter === key
                      ? "bg-accent-cyan/20 text-accent-cyan"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface-tertiary/50"
                  }`}
                >
                  <span className="text-[10px]">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Family Multi-Select ───────────────────────────────────────── */}
        <div className="border-t border-border-default">
          {/* Section header */}
          <button
            onClick={() => setFamilySectionOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
          >
            <span>Model Families</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform duration-200 ${
                familySectionOpen ? "rotate-180" : "rotate-0"
              }`}
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Collapsible body */}
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              familySectionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              {/* Select All / None / Frontier */}
              <div className="flex gap-1 px-4 pb-2">
                <button
                  onClick={selectAll}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    allSelected
                      ? "bg-accent-violet/20 text-accent-violet"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface-tertiary"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={selectNone}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    noneSelected
                      ? "bg-accent-violet/20 text-accent-violet"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface-tertiary"
                  }`}
                >
                  None
                </button>
                <button
                  onClick={selectFrontier}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    frontierOnly && (allSelected || selectedFamilies.size === FRONTIER_FAMILIES.size)
                      ? "bg-accent-amber/20 text-accent-amber"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface-tertiary"
                  }`}
                >
                  Frontier
                </button>
              </div>

              {/* Family checkboxes */}
              <div className="flex flex-col gap-0 px-2 pb-3">
                {ALL_FAMILIES.map((family) => {
                  const count = models.filter((m) => m.family === family).length;
                  const checked = isFamilySelected(family);
                  const isFrontier = FRONTIER_FAMILIES.has(family);

                  return (
                    <label
                      key={family}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-left ${
                        checked
                          ? "text-text-primary hover:bg-surface-tertiary"
                          : "text-text-muted hover:text-text-secondary hover:bg-surface-tertiary"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFamily(family)}
                        className="w-3 h-3 rounded border-border-default bg-surface-tertiary accent-[var(--color-accent-violet)] flex-shrink-0"
                      />
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: FAMILY_COLORS[family] }}
                      />
                      <span className="text-xs font-medium flex-1 truncate">
                        {FAMILY_LABELS[family]}
                      </span>
                      {isFrontier && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-accent-amber/10 text-accent-amber font-semibold flex-shrink-0">
                          F
                        </span>
                      )}
                      <span className="text-[10px] text-text-muted tabular-nums flex-shrink-0">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-default flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {headerTitle}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              {filteredModels.length} model{filteredModels.length !== 1 ? "s" : ""}
              {opennessFilter !== "all" ? ` · ${opennessFilter}` : ""}
              {searchQuery ? ` · "${searchQuery}"` : ""}
              {viewMode === "graph"
                ? viewDimension === "3d"
                  ? " · 3D"
                  : " · 2D"
                : " · List"}
            </p>
          </div>

          {viewMode === "graph" && (
            <ViewControls
              viewDimension={viewDimension}
              onViewDimensionChange={setViewDimension}
              motionEnabled={motionEnabled}
              onMotionEnabledChange={setMotionEnabled}
            />
          )}
        </div>

        {/* Content area */}
        {viewMode === "graph" ? (
          <div className="flex-1 overflow-hidden relative">
            {viewDimension === "2d" ? (
              <ForceGraph2D
                selectedFamilies={effectiveFamilies}
                searchQuery={searchQuery}
                onSelectModel={setSelectedModel}
                selectedModelId={selectedModel?.id ?? null}
                motionEnabled={motionEnabled}
                opennessFilter={opennessFilter}
                modalityFilter={modalityFilter}
              />
            ) : (
              <ForceGraph3D
                selectedFamilies={effectiveFamilies}
                searchQuery={searchQuery}
                onSelectModel={setSelectedModel}
                selectedModelId={selectedModel?.id ?? null}
                motionEnabled={motionEnabled}
                opennessFilter={opennessFilter}
                modalityFilter={modalityFilter}
              />
            )}

            {/* Legend overlay */}
            <VisualizationLegend
              viewDimension={viewDimension}
              motionEnabled={motionEnabled}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col gap-12">
                {familyKeys.map((family) => {
                  const familyModels = groupedModels[family];
                  return (
                    <div key={family}>
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            background: FAMILY_COLORS[family],
                          }}
                        />
                        <h2 className="text-lg font-semibold text-text-primary">
                          {FAMILY_LABELS[family]}
                        </h2>
                        <div className="flex-1 h-px bg-border-default" />
                      </div>

                      <div className="relative flex flex-wrap gap-3 items-start">
                        {familyModels.map((model, idx) => {
                          const isSelected = selectedModel?.id === model.id;
                          const color = FAMILY_COLORS[model.family];

                          return (
                            <div
                              key={model.id}
                              className="flex items-center gap-0"
                            >
                              <button
                                onClick={() =>
                                  setSelectedModel(isSelected ? null : model)
                                }
                                className={`
                                  relative flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 min-w-[100px] max-w-[140px] text-center
                                  ${
                                    isSelected
                                      ? "bg-surface-elevated border-accent-violet/50 shadow-lg shadow-accent-violet/10 -translate-y-1"
                                      : "bg-surface-secondary border-border-default hover:border-border-hover hover:bg-surface-tertiary hover:-translate-y-0.5"
                                  }
                                `}
                              >
                                <div
                                  className="w-3 h-3 rounded-full mb-1"
                                  style={{ background: color }}
                                />
                                <span className="text-xs font-semibold text-text-primary leading-tight">
                                  {model.name}
                                </span>
                                <span className="text-[10px] text-text-muted font-mono">
                                  {model.releaseDate}
                                </span>
                                {model.openness === "open-weight" ||
                                model.openness === "open-source" ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-emerald/15 text-accent-emerald font-medium mt-0.5">
                                    Open
                                  </span>
                                ) : null}
                              </button>

                              {idx < familyModels.length - 1 && (
                                <div
                                  className="w-6 h-[2px] flex-shrink-0"
                                  style={{
                                    background: `linear-gradient(90deg, ${color}40, ${color}20)`,
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredModels.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mb-4 opacity-40"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <p className="text-sm">No models found</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Panel ─────────────────────────────────────────────── */}
      {selectedModel && (
        <ModelDetailPanel
          model={selectedModel}
          onClose={() => setSelectedModel(null)}
          onSelectModel={setSelectedModel}
        />
      )}
    </div>
  );
}

export function TreeView() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-text-muted">
          Loading...
        </div>
      }
    >
      <TreeViewInner />
    </Suspense>
  );
}
