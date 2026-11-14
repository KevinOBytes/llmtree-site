"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { models } from "@/lib/data/models";
import { FAMILY_COLORS, type ModelFamily, type ModelNode } from "@/lib/types";
import { FAMILY_LABELS, parseContextWindow } from "@/lib/chartUtils";
import { ModelDetailPanel } from "./ModelDetailPanel";
import { ViewControls } from "./ViewControls";
import { VisualizationLegend } from "./VisualizationLegend";

// Dynamic import with SSR disabled — D3 requires browser APIs and is heavy
const ForceGraph2D = dynamic(
  () =>
    import("./ForceGraph").then((mod) => ({
      default: mod.ForceGraph2D,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-emerald/30 border-t-accent-emerald rounded-full animate-spin" />
          <span className="text-sm">Loading 2D engine...</span>
        </div>
      </div>
    ),
  }
);

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

// ── Constants & Definitions ──────────────────────────────────────────────────

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
  "mistral",
]);

type ViewMode = "graph" | "list";
type TierFilter = "all" | "frontier" | "non-frontier";
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

interface ProviderOption {
  id: string;
  label: string;
  color: string;
  match: (m: ModelNode) => boolean;
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    id: "openai",
    label: "OpenAI",
    color: "#10A37F",
    match: (m) => m.company === "OpenAI" || m.family === "openai-gpt" || m.family === "openai-o",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    color: "#D97757",
    match: (m) => m.company === "Anthropic" || m.family === "anthropic-claude",
  },
  {
    id: "google",
    label: "Google",
    color: "#4285F4",
    match: (m) =>
      m.company.includes("Google") ||
      m.family === "google-gemini" ||
      m.family === "google-palm" ||
      m.family === "google-gemma",
  },
  {
    id: "meta",
    label: "Meta",
    color: "#0668E1",
    match: (m) => m.company === "Meta" || m.family === "meta-llama",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    color: "#4D6BFE",
    match: (m) => m.company === "DeepSeek" || m.family === "deepseek",
  },
  {
    id: "xai",
    label: "xAI",
    color: "#1DA1F2",
    match: (m) => m.company === "xAI" || m.family === "xai-grok",
  },
  {
    id: "mistral",
    label: "Mistral",
    color: "#FF7000",
    match: (m) => m.company.includes("Mistral") || m.family === "mistral",
  },
  {
    id: "alibaba",
    label: "Alibaba (Qwen)",
    color: "#FF6A00",
    match: (m) => m.company === "Alibaba" || m.family === "alibaba-qwen",
  },
  {
    id: "microsoft",
    label: "Microsoft",
    color: "#00A4EF",
    match: (m) => m.company === "Microsoft" || m.family === "microsoft-phi",
  },
  {
    id: "chinese-labs",
    label: "Chinese Labs",
    color: "#F43F5E",
    match: (m) =>
      m.family === "chinese-llm" ||
      m.family === "01ai-yi" ||
      ["Moonshot AI", "Zhipu AI", "ByteDance", "Xiaomi", "01.AI", "Baidu"].includes(m.company),
  },
  {
    id: "specialized",
    label: "Specialized / Other",
    color: "#8B5CF6",
    match: (m) =>
      [
        "coding-tool",
        "search-tool",
        "music-gen",
        "speech-ai",
        "embedding",
        "safety",
        "robotics",
        "community",
        "foundational",
        "apple",
        "ibm",
        "tii-falcon",
        "cohere-command",
        "ai21-jamba",
        "allen-ai",
        "inflection",
        "stability-ai",
        "midjourney",
        "image-gen",
      ].includes(m.family),
  },
];

interface FeatureOption {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  match: (m: ModelNode) => boolean;
}

const FEATURE_OPTIONS: FeatureOption[] = [
  {
    id: "reasoning",
    label: "Reasoning",
    icon: "🧠",
    color: "#F97316",
    description: "Step-by-step thinking, test-time compute, reflection",
    match: (m) =>
      m.innovations.includes("reasoning") ||
      m.innovations.includes("chain-of-thought") ||
      m.innovations.includes("test-time-compute"),
  },
  {
    id: "agentic",
    label: "Agents",
    icon: "🤖",
    color: "#10B981",
    description: "Autonomous planning, tool calling, execution loops",
    match: (m) =>
      m.innovations.includes("agentic") ||
      m.innovations.includes("tool-use") ||
      m.innovations.includes("autonomous-agent"),
  },
  {
    id: "multimodal",
    label: "Multimodal",
    icon: "👁️",
    color: "#EC4899",
    description: "Vision, audio, image and cross-modal understanding",
    match: (m) =>
      m.modality === "multimodal" ||
      m.modality === "vision" ||
      m.modality === "image" ||
      m.innovations.includes("multimodal"),
  },
  {
    id: "moe",
    label: "MoE",
    icon: "⚡",
    color: "#EAB308",
    description: "Sparse mixture-of-experts architectures",
    match: (m) =>
      m.architecture === "mixture-of-experts" ||
      m.architecture === "sparse-moe" ||
      m.innovations.includes("mixture-of-experts"),
  },
  {
    id: "coding",
    label: "Coding",
    icon: "💻",
    color: "#06B6D4",
    description: "Code generation and terminal workflows",
    match: (m) =>
      m.innovations.includes("code-generation") ||
      m.modality === "code" ||
      m.family === "coding-tool",
  },
  {
    id: "long-context",
    label: "Long Context",
    icon: "📚",
    color: "#3B82F6",
    description: "100K+ token context windows",
    match: (m) =>
      m.innovations.includes("long-context") ||
      (parseContextWindow(m.contextWindow) ?? 0) >= 100000,
  },
  {
    id: "open",
    label: "Open Weights",
    icon: "🔓",
    color: "#10B981",
    description: "Open weight and open source releases",
    match: (m) =>
      m.openness === "open-weight" || m.openness === "open-source",
  },
  {
    id: "safety",
    label: "Safety",
    icon: "🛡️",
    color: "#EF4444",
    description: "Constitutional AI, guardrails, and cyber defenses",
    match: (m) =>
      m.innovations.includes("constitutional-ai") ||
      m.innovations.includes("rlhf") ||
      m.innovations.includes("safety-classifier") ||
      m.family === "safety",
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

function TreeViewInner() {
  const searchParams = useSearchParams();
  const initialFamily = searchParams.get("family") as ModelFamily | null;

  // ── Filters State ──────────────────────────────────────────────────────
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(() => {
    if (initialFamily) return new Set([initialFamily]);
    return new Set<string>(); // empty = all
  });
  const [opennessFilter, setOpennessFilter] = useState<OpennessFilter>("all");
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>("all");
  const [providerSectionOpen, setProviderSectionOpen] = useState(true);
  const [featureSectionOpen, setFeatureSectionOpen] = useState(true);
  const [familySectionOpen, setFamilySectionOpen] = useState(false);

  // ── View State ────────────────────────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState<ModelNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [viewDimension, setViewDimension] = useState<"2d" | "3d">("2d");
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"timeline" | "ancestry" | "network">("timeline");

  // ── Counts ─────────────────────────────────────────────────────────────
  const frontierCount = useMemo(
    () => models.filter((m) => FRONTIER_FAMILIES.has(m.family)).length,
    []
  );
  const nonFrontierCount = useMemo(
    () => models.filter((m) => !FRONTIER_FAMILIES.has(m.family)).length,
    []
  );

  // ── Toggle helpers ─────────────────────────────────────────────────────
  const toggleProvider = useCallback((id: string) => {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleFeature = useCallback((id: string) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllFamilies = useCallback(() => setSelectedFamilies(new Set<string>()), []);
  const selectNoFamilies = useCallback(() => setSelectedFamilies(new Set(["__none__"])), []);

  const toggleFamily = useCallback((family: string) => {
    setSelectedFamilies((prev) => {
      const next = new Set(prev);
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

  const resetAllFilters = useCallback(() => {
    setTierFilter("all");
    setSelectedProviders(new Set());
    setSelectedFeatures(new Set());
    setSelectedFamilies(new Set());
    setOpennessFilter("all");
    setModalityFilter("all");
    setSearchQuery("");
  }, []);

  const isAnyFilterActive = useMemo(() => {
    return (
      tierFilter !== "all" ||
      selectedProviders.size > 0 ||
      selectedFeatures.size > 0 ||
      selectedFamilies.size > 0 ||
      opennessFilter !== "all" ||
      modalityFilter !== "all" ||
      searchQuery.length > 0
    );
  }, [
    tierFilter,
    selectedProviders,
    selectedFeatures,
    selectedFamilies,
    opennessFilter,
    modalityFilter,
    searchQuery,
  ]);

  // ── Filtered Models (Unified single source of truth) ───────────────────
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      // 1. Tier filter
      if (tierFilter === "frontier" && !FRONTIER_FAMILIES.has(m.family)) {
        return false;
      }
      if (tierFilter === "non-frontier" && FRONTIER_FAMILIES.has(m.family)) {
        return false;
      }

      // 2. Provider filter
      if (selectedProviders.size > 0) {
        const matchesAnyProvider = [...selectedProviders].some((pId) => {
          const opt = PROVIDER_OPTIONS.find((p) => p.id === pId);
          return opt ? opt.match(m) : false;
        });
        if (!matchesAnyProvider) return false;
      }

      // 3. Family filter (if fine-grained checklist is actively manipulated)
      if (selectedFamilies.size > 0 && !selectedFamilies.has("__none__")) {
        if (!selectedFamilies.has(m.family)) return false;
      } else if (selectedFamilies.has("__none__")) {
        return false;
      }

      // 4. Feature filter (matching any of the selected features)
      if (selectedFeatures.size > 0) {
        const matchesAnyFeature = [...selectedFeatures].some((fId) => {
          const opt = FEATURE_OPTIONS.find((f) => f.id === fId);
          return opt ? opt.match(m) : false;
        });
        if (!matchesAnyFeature) return false;
      }

      // 5. Openness filter
      if (
        opennessFilter === "open" &&
        m.openness !== "open-weight" &&
        m.openness !== "open-source"
      ) {
        return false;
      }
      if (opennessFilter === "closed" && m.openness !== "closed") {
        return false;
      }

      // 6. Modality filter
      if (modalityFilter !== "all" && (m.modality ?? "text") !== modalityFilter) {
        return false;
      }

      // 7. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !m.name.toLowerCase().includes(q) &&
          !m.company.toLowerCase().includes(q) &&
          !m.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    tierFilter,
    selectedProviders,
    selectedFamilies,
    selectedFeatures,
    opennessFilter,
    modalityFilter,
    searchQuery,
  ]);

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
    if (tierFilter === "frontier") return "Frontier Models";
    if (tierFilter === "non-frontier") return "Non-Frontier Models";
    if (selectedProviders.size === 1) {
      const p = PROVIDER_OPTIONS.find((opt) => selectedProviders.has(opt.id));
      if (p) return `${p.label} Models`;
    }
    if (selectedProviders.size > 1) {
      return `${selectedProviders.size} Providers Selected`;
    }
    if (selectedFeatures.size === 1) {
      const f = FEATURE_OPTIONS.find((opt) => selectedFeatures.has(opt.id));
      if (f) return `${f.label} Models`;
    }
    if (selectedFeatures.size > 1) {
      return `${selectedFeatures.size} Features Active`;
    }
    if (selectedFamilies.size === 1) {
      const f = [...selectedFamilies][0];
      return FAMILY_LABELS[f] ?? f;
    }
    return "Model Family Trees";
  }, [tierFilter, selectedProviders, selectedFeatures, selectedFamilies]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border-default flex flex-col overflow-y-auto flex-shrink-0 bg-surface-primary/30">
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
              placeholder="Search models, labs, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-surface-tertiary border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/25 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-surface-elevated"
              >
                ✕
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-surface-tertiary">
            <button
              onClick={() => setViewMode("graph")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "graph"
                  ? "bg-accent-violet/20 text-accent-violet shadow-sm"
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
              Graph View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "list"
                  ? "bg-accent-violet/20 text-accent-violet shadow-sm"
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
              List View
            </button>
          </div>
        </div>

        {/* ── Active Filter Bar (when any active) ────────────────────────── */}
        {isAnyFilterActive && (
          <div className="mx-4 mb-2 p-2.5 rounded-xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-between gap-2">
            <div className="text-[11px] text-text-secondary font-medium">
              Showing <span className="text-text-primary font-bold">{filteredModels.length}</span> of {models.length}
            </div>
            <button
              onClick={resetAllFilters}
              className="text-[11px] text-accent-rose hover:underline font-semibold flex items-center gap-1"
            >
              <span>✕</span> Reset
            </button>
          </div>
        )}

        {/* ── 1. Model Tier Toggle Switch (Frontier vs Non-Frontier) ───── */}
        <div className="px-4 pb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 px-1 flex items-center justify-between">
            <span>Model Tier</span>
            <span className="text-text-secondary text-[9px] lowercase font-normal">
              {tierFilter === "all" ? "full dataset" : tierFilter}
            </span>
          </div>
          <div className="flex p-0.5 rounded-xl bg-surface-tertiary border border-border-default/60 text-xs">
            <button
              onClick={() => setTierFilter("all")}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                tierFilter === "all"
                  ? "bg-accent-violet text-white shadow-sm font-semibold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTierFilter("frontier")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                tierFilter === "frontier"
                  ? "bg-accent-amber text-slate-950 font-bold shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span>⭐</span>
              <span>Frontier</span>
              <span className="text-[9px] opacity-75">({frontierCount})</span>
            </button>
            <button
              onClick={() => setTierFilter("non-frontier")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                tierFilter === "non-frontier"
                  ? "bg-accent-cyan text-slate-950 font-bold shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span>🌐</span>
              <span>Non-Frontier</span>
              <span className="text-[9px] opacity-75">({nonFrontierCount})</span>
            </button>
          </div>
        </div>

        {/* ── 2. Provider / Lab Filter ─────────────────────────────────── */}
        <div className="border-t border-border-default/80">
          <button
            onClick={() => setProviderSectionOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span>Providers & Labs</span>
              {selectedProviders.size > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-accent-violet/20 text-accent-violet font-bold">
                  {selectedProviders.size}
                </span>
              )}
            </div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform duration-200 ${
                providerSectionOpen ? "rotate-180" : "rotate-0"
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

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              providerSectionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden px-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-text-muted">Isolate specific providers:</span>
                {selectedProviders.size > 0 && (
                  <button
                    onClick={() => setSelectedProviders(new Set())}
                    className="text-[10px] text-accent-rose hover:underline font-medium"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PROVIDER_OPTIONS.map((p) => {
                  const isSelected = selectedProviders.has(p.id);
                  const count = models.filter((m) => p.match(m)).length;
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProvider(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-surface-elevated text-text-primary shadow-sm"
                          : "bg-surface-tertiary/40 border-border-default/50 text-text-muted hover:text-text-secondary hover:bg-surface-tertiary"
                      }`}
                      style={{
                        borderColor: isSelected ? p.color : undefined,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: p.color }}
                      />
                      <span>{p.label}</span>
                      <span className="text-[10px] opacity-60 tabular-nums">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Features & Capabilities Filter ────────────────────────── */}
        <div className="border-t border-border-default/80">
          <button
            onClick={() => setFeatureSectionOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span>Features & Architecture</span>
              {selectedFeatures.size > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-accent-emerald/20 text-accent-emerald font-bold">
                  {selectedFeatures.size}
                </span>
              )}
            </div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform duration-200 ${
                featureSectionOpen ? "rotate-180" : "rotate-0"
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

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              featureSectionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden px-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-text-muted">Filter by capabilities:</span>
                {selectedFeatures.size > 0 && (
                  <button
                    onClick={() => setSelectedFeatures(new Set())}
                    className="text-[10px] text-accent-rose hover:underline font-medium"
                  >
                    Clear features
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FEATURE_OPTIONS.map((f) => {
                  const isSelected = selectedFeatures.has(f.id);
                  const count = models.filter((m) => f.match(m)).length;
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFeature(f.id)}
                      title={f.description}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-surface-elevated text-text-primary shadow-sm"
                          : "bg-surface-tertiary/40 border-border-default/50 text-text-muted hover:text-text-secondary hover:bg-surface-tertiary"
                      }`}
                      style={{
                        borderColor: isSelected ? f.color : undefined,
                        color: isSelected ? f.color : undefined,
                      }}
                    >
                      <span className="text-sm">{f.icon}</span>
                      <span>{f.label}</span>
                      <span className="text-[10px] opacity-60 tabular-nums">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Openness & Modality Filters ───────────────────────────── */}
        <div className="border-t border-border-default/80 px-4 py-3 flex flex-col gap-3">
          {/* Openness */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1 px-1">
              Openness
            </div>
            <div className="flex gap-1 p-0.5 rounded-lg bg-surface-tertiary/60">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "open", label: "Open Weight" },
                  { key: "closed", label: "Closed" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setOpennessFilter(key)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                    opennessFilter === key
                      ? key === "open"
                        ? "bg-accent-emerald/20 text-accent-emerald font-semibold"
                        : key === "closed"
                          ? "bg-accent-rose/20 text-accent-rose font-semibold"
                          : "bg-accent-violet/20 text-accent-violet font-semibold"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Modality */}
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
                      ? "bg-accent-cyan/20 text-accent-cyan font-semibold"
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

        {/* ── 5. Detailed Family Checklist (Collapsible) ───────────────── */}
        <div className="border-t border-border-default/80">
          <button
            onClick={() => setFamilySectionOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
          >
            <span>Specific Lineage Families</span>
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

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              familySectionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex gap-1 px-4 pb-2">
                <button
                  onClick={selectAllFamilies}
                  className="px-2 py-1 rounded text-[10px] font-medium text-text-muted hover:text-text-secondary hover:bg-surface-tertiary"
                >
                  Select All
                </button>
                <button
                  onClick={selectNoFamilies}
                  className="px-2 py-1 rounded text-[10px] font-medium text-text-muted hover:text-text-secondary hover:bg-surface-tertiary"
                >
                  Clear All
                </button>
              </div>

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
                        <span className="text-[8px] px-1 py-0.5 rounded bg-accent-amber/15 text-accent-amber font-semibold flex-shrink-0">
                          Frontier
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
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-default flex-shrink-0 bg-surface-primary/20 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              {headerTitle}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-text-primary">{filteredModels.length}</span> models shown
              {tierFilter !== "all" && (
                <span className="px-1.5 py-0.5 rounded-md bg-accent-amber/10 text-accent-amber font-medium">
                  {tierFilter}
                </span>
              )}
              {selectedProviders.size > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-accent-violet/10 text-accent-violet font-medium">
                  {selectedProviders.size} providers
                </span>
              )}
              {selectedFeatures.size > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-accent-emerald/10 text-accent-emerald font-medium">
                  {selectedFeatures.size} features
                </span>
              )}
              {opennessFilter !== "all" ? ` · ${opennessFilter}` : ""}
              {searchQuery ? ` · "${searchQuery}"` : ""}
              <span className="opacity-60">· {viewDimension.toUpperCase()} mode</span>
            </p>
          </div>

          {viewMode === "graph" && (
            <ViewControls
              viewDimension={viewDimension}
              onViewDimensionChange={setViewDimension}
              motionEnabled={motionEnabled}
              onMotionEnabledChange={setMotionEnabled}
              layoutMode={layoutMode}
              onLayoutModeChange={setLayoutMode}
            />
          )}
        </div>

        {/* Content area */}
        {viewMode === "graph" ? (
          <div className="flex-1 overflow-hidden relative">
            {/* Quick Floating Bar on Graph Canvas for Instant Filtering */}
            <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex items-center justify-between gap-2 flex-wrap">
              <div className="pointer-events-auto flex items-center gap-2 bg-surface-primary/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-border-default/70 shadow-lg overflow-x-auto max-w-full">
                {/* Tier Switch */}
                <div className="flex rounded-xl bg-surface-tertiary p-0.5 border border-border-default/50 text-xs shrink-0">
                  <button
                    onClick={() => setTierFilter("all")}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      tierFilter === "all"
                        ? "bg-accent-violet text-white shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    All ({models.length})
                  </button>
                  <button
                    onClick={() => setTierFilter("frontier")}
                    className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                      tierFilter === "frontier"
                        ? "bg-accent-amber text-slate-950 font-bold shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span>⭐</span> Frontier ({frontierCount})
                  </button>
                  <button
                    onClick={() => setTierFilter("non-frontier")}
                    className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                      tierFilter === "non-frontier"
                        ? "bg-accent-cyan text-slate-950 font-bold shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span>🌐</span> Non-Frontier ({nonFrontierCount})
                  </button>
                </div>

                <div className="w-px h-4 bg-border-default shrink-0" />

                {/* Quick Feature Chips */}
                <div className="flex items-center gap-1 shrink-0">
                  {FEATURE_OPTIONS.slice(0, 5).map((f) => {
                    const isActive = selectedFeatures.has(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() => toggleFeature(f.id)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 shrink-0 ${
                          isActive
                            ? "bg-surface-elevated border border-border-hover shadow-sm"
                            : "text-text-muted hover:text-text-secondary hover:bg-surface-tertiary/60"
                        }`}
                        style={{
                          borderColor: isActive ? f.color : undefined,
                          color: isActive ? f.color : undefined,
                        }}
                      >
                        <span>{f.icon}</span>
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>

                {isAnyFilterActive && (
                  <>
                    <div className="w-px h-4 bg-border-default shrink-0" />
                    <button
                      onClick={resetAllFilters}
                      className="text-xs text-accent-rose hover:underline font-semibold shrink-0 flex items-center gap-1 px-1 py-0.5"
                    >
                      <span>✕</span> Reset ({filteredModels.length})
                    </button>
                  </>
                )}
              </div>
            </div>

            {viewDimension === "2d" ? (
              <ForceGraph2D
                selectedFamilies={selectedFamilies}
                searchQuery={searchQuery}
                onSelectModel={setSelectedModel}
                selectedModelId={selectedModel?.id ?? null}
                motionEnabled={motionEnabled}
                opennessFilter={opennessFilter}
                modalityFilter={modalityFilter}
                layoutMode={layoutMode}
                modelsOverride={filteredModels}
              />
            ) : (
              <ForceGraph3D
                selectedFamilies={selectedFamilies}
                searchQuery={searchQuery}
                onSelectModel={setSelectedModel}
                selectedModelId={selectedModel?.id ?? null}
                motionEnabled={motionEnabled}
                opennessFilter={opennessFilter}
                modalityFilter={modalityFilter}
                modelsOverride={filteredModels}
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
                        <span className="text-xs text-text-muted">
                          ({familyModels.length})
                        </span>
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
                  <p className="text-sm font-semibold">No models match the active filters</p>
                  <p className="text-xs mt-1">Try resetting or broadening your filters</p>
                  <button
                    onClick={resetAllFilters}
                    className="mt-4 px-4 py-2 rounded-xl bg-accent-violet/20 text-accent-violet hover:bg-accent-violet/30 font-semibold text-xs transition-all"
                  >
                    Reset all filters
                  </button>
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
          Loading Tree View...
        </div>
      }
    >
      <TreeViewInner />
    </Suspense>
  );
}
