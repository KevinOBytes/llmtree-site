"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { models, modelsById } from "@/lib/data/models";
import { FAMILY_COLORS, type ModelNode } from "@/lib/types";
import { FAMILY_LABELS } from "@/lib/chartUtils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  if (!dateStr) return "N/A";
  const parts = dateStr.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  if (parts.length >= 2) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${months[monthIdx]} ${parts[0]}`;
    }
  }
  return dateStr;
}

const OPENNESS_STYLES: Record<string, string> = {
  closed: "bg-red-500/10 text-red-400 border-red-500/20",
  "open-weight": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "open-source": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  deprecated: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  discontinued: "bg-red-500/10 text-red-400 border-red-500/20",
  legacy: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

interface BenchmarkDef {
  key: "mmlu" | "humanEval" | "math" | "gpqa" | "aime" | "swe" | "mtBench" | "arenaElo";
  label: string;
  desc: string;
  max: number;
  format: (val: number) => string;
}

const BENCHMARKS: BenchmarkDef[] = [
  {
    key: "mmlu",
    label: "MMLU",
    desc: "Language understanding across 57 academic subjects.",
    max: 100,
    format: (val) => `${val.toFixed(1)}%`,
  },
  {
    key: "gpqa",
    label: "GPQA",
    desc: "Graduate-level, google-proof science & math questions.",
    max: 100,
    format: (val) => `${val.toFixed(1)}%`,
  },
  {
    key: "humanEval",
    label: "HumanEval",
    desc: "Python coding tasks pass@1 rate.",
    max: 100,
    format: (val) => `${val.toFixed(1)}%`,
  },
  {
    key: "math",
    label: "MATH",
    desc: "Competition-level math word problems.",
    max: 100,
    format: (val) => `${val.toFixed(1)}%`,
  },
  {
    key: "aime",
    label: "AIME",
    desc: "American Invitational Mathematics Exam score (reasoning).",
    max: 100,
    format: (val) => `${val.toFixed(1)}%`,
  },
  {
    key: "swe",
    label: "SWE-bench",
    desc: "Resolving software bugs in real GitHub codebases.",
    max: 100,
    format: (val) => `${val.toFixed(1)}%`,
  },
  {
    key: "mtBench",
    label: "MT-Bench",
    desc: "Multi-turn conversational chatbot quality (0-10).",
    max: 10,
    format: (val) => `${val.toFixed(1)}/10`,
  },
  {
    key: "arenaElo",
    label: "Arena ELO",
    desc: "LMSYS Chatbot Arena human preference ranking score.",
    max: 1400,
    format: (val) => `${Math.round(val)}`,
  },
];

// ── Combobox Component ────────────────────────────────────────────────────────

interface ComboboxSelectProps {
  label: string;
  value: ModelNode | null;
  onChange: (model: ModelNode | null) => void;
  excludeIds: string[];
  placeholder?: string;
  color?: string;
}

function ComboboxSelect({
  label,
  value,
  onChange,
  excludeIds,
  placeholder = "Select a model...",
  color = "var(--color-accent-violet)",
}: ComboboxSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const activeExclude = excludeIds.filter((id) => id !== value?.id);
    let result = models.filter((m) => !activeExclude.includes(m.id));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.company.toLowerCase().includes(q) ||
          (m.family && FAMILY_LABELS[m.family]?.toLowerCase().includes(q))
      );
    }

    // Sort by name or release date (newest first)
    return [...result].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  }, [search, excludeIds, value]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full select-none text-left">
      <label className="block text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">
        {label}
      </label>
      <button
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl glass border text-sm transition-all text-left duration-200 cursor-pointer ${
          isOpen
            ? "border-accent-violet/60 ring-2 ring-accent-violet/20"
            : "border-border-default hover:border-border-hover"
        }`}
        style={{
          borderLeft: value ? `4px solid ${FAMILY_COLORS[value.family] || color}` : undefined,
        }}
      >
        {value ? (
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-text-muted font-medium uppercase leading-tight truncate">
              {value.company}
            </span>
            <span className="text-sm font-semibold text-text-primary leading-snug truncate">
              {value.name}
            </span>
          </div>
        ) : (
          <span className="text-text-muted text-sm italic">{placeholder}</span>
        )}
        <svg
          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m19 9-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 w-full mt-2 rounded-xl glass border border-border-default overflow-hidden shadow-2xl max-h-72 flex flex-col"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-border-default/50 bg-surface-secondary/40 flex items-center gap-2">
              <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-sm text-text-primary placeholder:text-text-muted focus:outline-none py-1"
                autoFocus
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-border-subtle max-h-56">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = value?.id === opt.id;
                  const itemColor = FAMILY_COLORS[opt.family] || "var(--color-text-secondary)";
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onChange(opt);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-white/5 cursor-pointer ${
                        isSelected ? "bg-accent-violet/10 hover:bg-accent-violet/15" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: itemColor }}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary truncate">
                            {opt.name}
                          </span>
                          <span className="text-[10px] text-text-muted font-medium truncate">
                            {opt.company}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-text-muted whitespace-nowrap">
                        {opt.parameterCount || "Size N/A"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-text-muted italic">
                  No models found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page Client ─────────────────────────────────────────────────────────

export function ModelCompareClient() {
  const searchParams = useSearchParams();

  // Parse default URL states or fallbacks
  const urlM1 = searchParams.get("m1");
  const urlM2 = searchParams.get("m2");
  const urlM3 = searchParams.get("m3");

  const [modelId1, setModelId1] = useState(() => (urlM1 && modelsById[urlM1] ? urlM1 : "model-gpt4o"));
  const [modelId2, setModelId2] = useState(() => (urlM2 && modelsById[urlM2] ? urlM2 : "model-claude3.5-sonnet"));
  const [modelId3, setModelId3] = useState<string | null>(() => (urlM3 && modelsById[urlM3] ? urlM3 : null));

  // Sync state if searchParams change externally (e.g. forward/back buttons) during render
  const [prevParams, setPrevParams] = useState({ m1: urlM1, m2: urlM2, m3: urlM3 });

  if (urlM1 !== prevParams.m1 || urlM2 !== prevParams.m2 || urlM3 !== prevParams.m3) {
    setPrevParams({ m1: urlM1, m2: urlM2, m3: urlM3 });
    if (urlM1 && modelsById[urlM1]) setModelId1(urlM1);
    if (urlM2 && modelsById[urlM2]) setModelId2(urlM2);
    if (urlM3 && modelsById[urlM3]) {
      setModelId3(urlM3);
    } else if (!urlM3) {
      setModelId3(null);
    }
  }

  // Sync to query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (modelId1) params.set("m1", modelId1);
    if (modelId2) params.set("m2", modelId2);
    if (modelId3) params.set("m3", modelId3);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [modelId1, modelId2, modelId3]);

  // Selected Model Nodes
  const m1 = modelsById[modelId1];
  const m2 = modelsById[modelId2];
  const m3 = modelId3 ? modelsById[modelId3] : null;

  // Active models array
  const activeModels = useMemo(() => {
    return [m1, m2, m3].filter((m): m is ModelNode => !!m);
  }, [m1, m2, m3]);

  // Exclude list for dropdown selection
  const excludeIds = useMemo(() => {
    return activeModels.map((m) => m.id);
  }, [activeModels]);

  const addThirdModel = () => {
    // Find a model that is not m1 or m2 to be default m3
    const nextAvailable = models.find((m) => m.id !== modelId1 && m.id !== modelId2);
    if (nextAvailable) {
      setModelId3(nextAvailable.id);
    }
  };

  const removeThirdModel = () => {
    setModelId3(null);
  };

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto w-full">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 pb-6 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2 text-accent-violet font-semibold text-xs uppercase tracking-wider mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Comparison Workbench
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-3">
            Compare Models
          </h1>
          <p className="text-text-secondary text-sm sm:text-base max-w-2xl">
            Analyze hardware footprint, model architecture, release metadata, and academic benchmarks. Select up to three models side-by-side.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/models"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-border-default text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 11H7m12 0-4-4m4 4-4 4" strokeLinecap="round" strokeLinejoin="round" className="rotate-180 origin-center" />
            </svg>
            Back to Database
          </Link>
        </div>
      </div>

      {/* ── Selection Panel ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div>
          <ComboboxSelect
            label="Model 1 (Base)"
            value={m1 || null}
            onChange={(m) => m && setModelId1(m.id)}
            excludeIds={excludeIds}
            color="var(--color-accent-violet)"
          />
        </div>
        <div>
          <ComboboxSelect
            label="Model 2"
            value={m2 || null}
            onChange={(m) => m && setModelId2(m.id)}
            excludeIds={excludeIds}
            color="var(--color-accent-cyan)"
          />
        </div>
        <div className="flex items-end">
          {m3 ? (
            <div className="relative w-full flex items-end gap-2">
              <div className="flex-1">
                <ComboboxSelect
                  label="Model 3"
                  value={m3}
                  onChange={(m) => m && setModelId3(m.id)}
                  excludeIds={excludeIds}
                  color="var(--color-accent-emerald)"
                />
              </div>
              <button
                onClick={removeThirdModel}
                className="mb-1 p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer hover:border-red-500/40"
                title="Remove 3rd model"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={addThirdModel}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border-default hover:border-accent-violet/60 hover:bg-accent-violet/5 py-[18px] px-4 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer h-[50px] mb-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add 3rd Model
            </button>
          )}
        </div>
      </div>

      {/* ── Specs Table ────────────────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-border-default overflow-hidden mb-12">
        <div className="p-4 bg-surface-secondary/40 border-b border-border-default/60">
          <h2 className="text-base font-bold text-text-primary">Spec Sheet</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <tbody>
              {/* Table Headers (Names) */}
              <tr className="border-b border-border-subtle bg-surface-secondary/20">
                <th className="p-4 text-xs uppercase tracking-widest text-text-muted font-bold w-1/4 sticky left-0 bg-surface-primary/95 backdrop-blur-md">
                  Specification
                </th>
                {activeModels.map((model) => (
                  <td key={model.id} className="p-4 w-1/3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: FAMILY_COLORS[model.family] }}
                        />
                        <span className="text-base font-bold text-text-primary">
                          {model.name}
                        </span>
                      </div>
                      <Link
                        href={`/models/${model.id}`}
                        className="text-[10px] w-fit text-accent-violet font-semibold hover:underline flex items-center gap-1 group"
                      >
                        View Full Details
                        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Manufacturer */}
              <tr className="border-b border-border-subtle hover:bg-white/[0.01] transition-colors">
                <th className="p-4 text-xs font-semibold text-text-secondary sticky left-0 bg-surface-primary/95 backdrop-blur-md">
                  Manufacturer / Company
                </th>
                {activeModels.map((model) => (
                  <td key={model.id} className="p-4 text-sm text-text-primary">
                    {model.company}
                  </td>
                ))}
              </tr>

              {/* Release Date */}
              <tr className="border-b border-border-subtle hover:bg-white/[0.01] transition-colors">
                <th className="p-4 text-xs font-semibold text-text-secondary sticky left-0 bg-surface-primary/95 backdrop-blur-md">
                  Release Date
                </th>
                {activeModels.map((model) => (
                  <td key={model.id} className="p-4 text-sm text-text-primary">
                    {formatDate(model.releaseDate)}
                  </td>
                ))}
              </tr>

              {/* Parameter Count */}
              <tr className="border-b border-border-subtle hover:bg-white/[0.01] transition-colors">
                <th className="p-4 text-xs font-semibold text-text-secondary sticky left-0 bg-surface-primary/95 backdrop-blur-md">
                  Parameter Count
                </th>
                {activeModels.map((model) => (
                  <td key={model.id} className="p-4 text-sm font-mono text-text-primary">
                    {model.parameterCount ?? <span className="text-text-muted italic">Unknown</span>}
                  </td>
                ))}
              </tr>

              {/* Context Window */}
              <tr className="border-b border-border-subtle hover:bg-white/[0.01] transition-colors">
                <th className="p-4 text-xs font-semibold text-text-secondary sticky left-0 bg-surface-primary/95 backdrop-blur-md">
                  Context Window
                </th>
                {activeModels.map((model) => (
                  <td key={model.id} className="p-4 text-sm font-mono text-text-primary">
                    {model.contextWindow ?? <span className="text-text-muted italic">Unknown</span>}
                  </td>
                ))}
              </tr>

              {/* Architecture */}
              <tr className="border-b border-border-subtle hover:bg-white/[0.01] transition-colors">
                <th className="p-4 text-xs font-semibold text-text-secondary sticky left-0 bg-surface-primary/95 backdrop-blur-md">
                  Architecture
                </th>
                {activeModels.map((model) => (
                  <td key={model.id} className="p-4 text-sm text-text-primary capitalize">
                    {model.architecture?.replace(/-/g, " ") ?? <span className="text-text-muted italic">N/A</span>}
                  </td>
                ))}
              </tr>

              {/* Modality */}
              <tr className="border-b border-border-subtle hover:bg-white/[0.01] transition-colors">
                <th className="p-4 text-xs font-semibold text-text-secondary sticky left-0 bg-surface-primary/95 backdrop-blur-md">
                  Modality
                </th>
                {activeModels.map((model) => (
                  <td key={model.id} className="p-4 text-sm text-text-primary capitalize">
                    {model.modality ?? "text"}
                  </td>
                ))}
              </tr>

              {/* Openness / License */}
              <tr className="border-b border-border-subtle hover:bg-white/[0.01] transition-colors">
                <th className="p-4 text-xs font-semibold text-text-secondary sticky left-0 bg-surface-primary/95 backdrop-blur-md">
                  Openness
                </th>
                {activeModels.map((model) => {
                  const style = OPENNESS_STYLES[model.openness] || "bg-zinc-500/10 text-zinc-400";
                  return (
                    <td key={model.id} className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${style}`}>
                        {model.openness.replace("-", " ")}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Status */}
              <tr className="border-b border-border-subtle hover:bg-white/[0.01] transition-colors">
                <th className="p-4 text-xs font-semibold text-text-secondary sticky left-0 bg-surface-primary/95 backdrop-blur-md">
                  Status
                </th>
                {activeModels.map((model) => {
                  const status = model.status ?? "active";
                  const style = STATUS_STYLES[status] || "bg-zinc-500/10 text-zinc-400";
                  return (
                    <td key={model.id} className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${style}`}>
                        {status}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Innovation Tags */}
              <tr className="hover:bg-white/[0.01] transition-colors">
                <th className="p-4 text-xs font-semibold text-text-secondary sticky left-0 bg-surface-primary/95 backdrop-blur-md">
                  Innovations
                </th>
                {activeModels.map((model) => (
                  <td key={model.id} className="p-4">
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {model.innovations.length > 0 ? (
                        model.innovations.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-surface-elevated text-[10px] text-text-secondary border border-border-subtle capitalize"
                          >
                            {tag.replace(/-/g, " ")}
                          </span>
                        ))
                      ) : (
                        <span className="text-text-muted text-xs italic">None documented</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Benchmarks Panel ────────────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-border-default overflow-hidden">
        <div className="p-4 bg-surface-secondary/40 border-b border-border-default/60">
          <h2 className="text-base font-bold text-text-primary">Benchmark Side-by-Side</h2>
        </div>
        <div className="p-6 space-y-8">
          {BENCHMARKS.map((bench) => {
            // Check if at least one model has this score
            const hasData = activeModels.some((m) => m.benchmarks && m.benchmarks[bench.key] !== undefined);

            if (!hasData) return null;

            return (
              <div key={bench.key} className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center py-4 border-b border-border-subtle/50 last:border-0">
                {/* Benchmark Description Column */}
                <div className="lg:col-span-1">
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                    {bench.label}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {bench.desc}
                  </p>
                </div>

                {/* Scores Columns */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {activeModels.map((model) => {
                    const score = model.benchmarks?.[bench.key];
                    const percent = score !== undefined ? (score / bench.max) * 100 : 0;
                    const color = FAMILY_COLORS[model.family] || "var(--color-accent-violet)";

                    return (
                      <div key={model.id} className="space-y-2">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="text-[10px] font-semibold text-text-muted truncate max-w-[120px]">
                            {model.name}
                          </span>
                          <span className="font-mono font-bold text-text-primary">
                            {score !== undefined ? bench.format(score) : "Not Tested"}
                          </span>
                        </div>
                        {score !== undefined ? (
                          <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        ) : (
                          <div className="h-2 w-full bg-surface-elevated/40 rounded-full border border-dashed border-border-subtle" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
