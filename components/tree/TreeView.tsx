"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { models } from "@/lib/data/models";
import { FAMILY_COLORS, type ModelFamily, type ModelNode } from "@/lib/types";
import { ModelDetailPanel } from "./ModelDetailPanel";
import { ForceGraph } from "./ForceGraph";

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
  community: "Community / Uncensored",
};

const ALL_FAMILIES = Object.keys(FAMILY_LABELS) as ModelFamily[];

type ViewMode = "graph" | "list";

function TreeViewInner() {
  const searchParams = useSearchParams();
  const initialFamily = searchParams.get("family") as ModelFamily | null;

  const [activeFamily, setActiveFamily] = useState<ModelFamily | "all">(
    initialFamily ?? "all"
  );
  const [selectedModel, setSelectedModel] = useState<ModelNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

  // Filter models by family
  const filteredModels = useMemo(() => {
    let result = models;
    if (activeFamily !== "all") {
      result = result.filter((m) => m.family === activeFamily);
    }
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
  }, [activeFamily, searchQuery]);

  // Group by family for list view
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

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border-default p-4 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
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
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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

        {/* Family filters */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setActiveFamily("all")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
              activeFamily === "all"
                ? "bg-surface-elevated text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-accent-violet to-accent-cyan" />
            All Families
            <span className="ml-auto text-xs text-text-muted">
              {models.length}
            </span>
          </button>

          {ALL_FAMILIES.map((family) => {
            const count = models.filter((m) => m.family === family).length;
            if (count === 0) return null;
            return (
              <button
                key={family}
                onClick={() => setActiveFamily(family)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  activeFamily === family
                    ? "bg-surface-elevated text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: FAMILY_COLORS[family] }}
                />
                {FAMILY_LABELS[family]}
                <span className="ml-auto text-xs text-text-muted">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Main Area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {activeFamily === "all"
                ? "All Model Families"
                : FAMILY_LABELS[activeFamily]}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              {filteredModels.length} models
              {searchQuery ? ` matching "${searchQuery}"` : ""}
              {viewMode === "graph" ? " · Interactive Graph" : " · List View"}
            </p>
          </div>
        </div>

        {/* Content area */}
        {viewMode === "graph" ? (
          <div className="flex-1 overflow-hidden">
            <ForceGraph
              familyFilter={activeFamily}
              searchQuery={searchQuery}
              onSelectModel={setSelectedModel}
              selectedModelId={selectedModel?.id ?? null}
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
                      {activeFamily === "all" && (
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
                      )}

                      <div className="relative flex flex-wrap gap-3 items-start">
                        {familyModels.map((model, idx) => {
                          const isSelected =
                            selectedModel?.id === model.id;
                          const color = FAMILY_COLORS[model.family];

                          return (
                            <div
                              key={model.id}
                              className="flex items-center gap-0"
                            >
                              <button
                                onClick={() =>
                                  setSelectedModel(
                                    isSelected ? null : model
                                  )
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
