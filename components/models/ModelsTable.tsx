"use client";

import { useState, useMemo, useCallback } from "react";
import { models } from "@/lib/data/models";
import { papers } from "@/lib/data/papers";
import { FAMILY_COLORS, type ModelNode, type ModelFamily } from "@/lib/types";
import { parseParamCount, parseContextWindow, FAMILY_LABELS } from "@/lib/chartUtils";

// ── Types ──────────────────────────────────────────────────────────────────

type SortField =
  | "name"
  | "family"
  | "releaseDate"
  | "parameterCount"
  | "contextWindow"
  | "architecture"
  | "modality"
  | "openness"
  | "company";

type SortDir = "asc" | "desc";

// ── Helpers ────────────────────────────────────────────────────────────────

function getComparableValue(
  model: ModelNode,
  field: SortField
): string | number {
  switch (field) {
    case "name":
      return model.name.toLowerCase();
    case "family":
      return model.family;
    case "releaseDate":
      return model.releaseDate;
    case "parameterCount":
      return parseParamCount(model.parameterCount) ?? -1;
    case "contextWindow":
      return parseContextWindow(model.contextWindow) ?? -1;
    case "architecture":
      return model.architecture ?? "unknown";
    case "modality":
      return model.modality ?? "text";
    case "openness":
      return model.openness;
    case "company":
      return model.company.toLowerCase();
    default:
      return "";
  }
}

function exportCSV(filtered: ModelNode[]) {
  const headers = [
    "Name",
    "Family",
    "Release Date",
    "Parameters",
    "Context Window",
    "Architecture",
    "Modality",
    "Openness",
    "Company",
    "Description",
  ];
  const rows = filtered.map((m) => [
    m.name,
    FAMILY_LABELS[m.family] ?? m.family,
    m.releaseDate,
    m.parameterCount ?? "",
    m.contextWindow ?? "",
    m.architecture,
    m.modality ?? "text",
    m.openness,
    m.company,
    `"${m.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "llm-tree-models.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Openness badge colors ──────────────────────────────────────────────────

const OPENNESS_STYLES: Record<string, string> = {
  closed: "bg-red-500/10 text-red-400 border-red-500/20",
  "open-weight": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "open-source": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  deprecated: "bg-amber-500/10 text-amber-400",
  discontinued: "bg-red-500/10 text-red-400",
  legacy: "bg-zinc-500/10 text-zinc-400",
};

// ── Column definitions ─────────────────────────────────────────────────────

interface Column {
  key: SortField;
  label: string;
  mobileHide?: boolean;
  className?: string;
}

const COLUMNS: Column[] = [
  { key: "name", label: "Model" },
  { key: "family", label: "Family", mobileHide: true },
  { key: "releaseDate", label: "Released" },
  { key: "parameterCount", label: "Params", mobileHide: true },
  { key: "contextWindow", label: "Context", mobileHide: true },
  { key: "architecture", label: "Arch", mobileHide: true },
  { key: "openness", label: "License" },
  { key: "company", label: "Company", mobileHide: true },
];

// ── Component ──────────────────────────────────────────────────────────────

export function ModelsTable() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("releaseDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [opennessFilter, setOpennessFilter] = useState<string>("all");
  const [modalityFilter, setModalityFilter] = useState<string>("all");

  // Derived
  const filtered = useMemo(() => {
    let result = models;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.company.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          (m.family && FAMILY_LABELS[m.family]?.toLowerCase().includes(q))
      );
    }

    // Openness
    if (opennessFilter === "open") {
      result = result.filter(
        (m) => m.openness === "open-weight" || m.openness === "open-source"
      );
    } else if (opennessFilter !== "all") {
      result = result.filter((m) => m.openness === opennessFilter);
    }

    // Modality
    if (modalityFilter !== "all") {
      result = result.filter(
        (m) => (m.modality ?? "text") === modalityFilter
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const av = getComparableValue(a, sortField);
      const bv = getComparableValue(b, sortField);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [search, sortField, sortDir, opennessFilter, modalityFilter]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField]
  );

  const toggleExpand = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    []
  );

  // Unique modalities
  const modalities = useMemo(
    () => [...new Set(models.map((m) => m.modality ?? "text"))].sort(),
    []
  );

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
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
            placeholder="Search models, companies, descriptions…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-violet/40 border border-border-subtle"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters row */}
        <div className="flex gap-2 flex-wrap">
          {/* Openness filter */}
          <select
            className="px-3 py-2 rounded-xl glass text-xs text-text-secondary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-violet/40 cursor-pointer"
            value={opennessFilter}
            onChange={(e) => setOpennessFilter(e.target.value)}
          >
            <option value="all">All Licenses</option>
            <option value="open-source">Open Source</option>
            <option value="open-weight">Open Weight</option>
            <option value="closed">Closed</option>
          </select>

          {/* Modality filter */}
          <select
            className="px-3 py-2 rounded-xl glass text-xs text-text-secondary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-violet/40 cursor-pointer"
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
          >
            <option value="all">All Modalities</option>
            {modalities.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={() => exportCSV(filtered)}
            className="px-3 py-2 rounded-xl glass text-xs text-text-secondary border border-border-subtle hover:text-accent-cyan hover:border-accent-cyan/30 transition-colors cursor-pointer"
          >
            ↓ CSV
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="text-xs text-text-muted">
        Showing {filtered.length} of {models.length} models
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl glass border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Header */}
            <thead>
              <tr className="border-b border-border-default/60">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-accent-violet transition-colors select-none whitespace-nowrap ${
                      col.mobileHide ? "hidden lg:table-cell" : ""
                    }`}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      {sortField === col.key && (
                        <span className="text-accent-violet">
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
                {/* expand chevron column */}
                <th className="w-8" />
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {filtered.map((model, idx) => {
                const isExpanded = expandedId === model.id;
                const familyColor =
                  FAMILY_COLORS[model.family as ModelFamily] ?? "#888";

                return (
                  <ModelRow
                    key={model.id}
                    model={model}
                    idx={idx}
                    isExpanded={isExpanded}
                    familyColor={familyColor}
                    onToggle={() => toggleExpand(model.id)}
                  />
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <span className="text-3xl mb-3">🔍</span>
              <p className="text-sm">No models match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Row Component ────────────────────────────────────────────────────────────

function ModelRow({
  model,
  idx,
  isExpanded,
  familyColor,
  onToggle,
}: {
  model: ModelNode;
  idx: number;
  isExpanded: boolean;
  familyColor: string;
  onToggle: () => void;
}) {
  const bgClass = idx % 2 === 0 ? "bg-white/[0.01]" : "bg-white/[0.03]";
  const relatedPapers = isExpanded
    ? papers.filter((p) => p.relatedModelIds?.includes(model.id))
    : [];

  return (
    <>
      <tr
        className={`${bgClass} hover:bg-white/[0.06] cursor-pointer transition-colors border-b border-border-subtle/40`}
        onClick={onToggle}
      >
        {/* Name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: familyColor }}
            />
            <span className="font-medium text-text-primary">{model.name}</span>
          </div>
        </td>

        {/* Family */}
        <td className="hidden lg:table-cell px-4 py-3">
          <span
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{
              borderColor: familyColor + "40",
              color: familyColor,
              backgroundColor: familyColor + "10",
            }}
          >
            {FAMILY_LABELS[model.family] ?? model.family}
          </span>
        </td>

        {/* Release Date */}
        <td className="px-4 py-3 text-text-secondary font-mono text-xs">
          {model.releaseDate}
        </td>

        {/* Params */}
        <td className="hidden lg:table-cell px-4 py-3 text-text-secondary text-xs">
          {model.parameterCount ?? "—"}
        </td>

        {/* Context */}
        <td className="hidden lg:table-cell px-4 py-3 text-text-secondary text-xs">
          {model.contextWindow ?? "—"}
        </td>

        {/* Architecture */}
        <td className="hidden lg:table-cell px-4 py-3 text-text-muted text-xs">
          {model.architecture}
        </td>

        {/* Openness */}
        <td className="px-4 py-3">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
              OPENNESS_STYLES[model.openness] ?? ""
            }`}
          >
            {model.openness === "open-source"
              ? "OSS"
              : model.openness === "open-weight"
              ? "Open"
              : "Closed"}
          </span>
        </td>

        {/* Company */}
        <td className="hidden lg:table-cell px-4 py-3 text-text-secondary text-xs">
          {model.company}
        </td>

        {/* Expand chevron */}
        <td className="px-3 py-3 text-text-muted">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </td>
      </tr>

      {/* ── Expanded Detail Row ──────────────────────────────────────────── */}
      {isExpanded && (
        <tr className="bg-surface-elevated/40">
          <td colSpan={COLUMNS.length + 1} className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Left: Description & Significance */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                    Description
                  </h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {model.description}
                  </p>
                </div>

                {model.significance && (
                  <div>
                    <h4 className="text-xs font-semibold text-accent-amber uppercase tracking-wider mb-1.5">
                      Why It Matters
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {model.significance}
                    </p>
                  </div>
                )}

                {model.notableUses && model.notableUses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                      Notable Uses
                    </h4>
                    <ul className="text-sm text-text-secondary space-y-1">
                      {model.notableUses.map((use, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-accent-emerald mt-0.5">•</span>
                          {use}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right: Stats & Links */}
              <div className="space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <DetailStat
                    label="Parameters"
                    value={model.parameterCount ?? "Unknown"}
                  />
                  <DetailStat
                    label="Context"
                    value={model.contextWindow ?? "Unknown"}
                  />
                  <DetailStat label="Architecture" value={model.architecture ?? "unknown"} />
                  <DetailStat
                    label="Modality"
                    value={model.modality ?? "text"}
                  />
                  <DetailStat label="Status" value={model.status ?? "active"} badge={STATUS_STYLES[model.status ?? "active"]} />
                  <DetailStat
                    label="Company"
                    value={model.company}
                  />
                </div>

                {/* Innovations */}
                {model.innovations && model.innovations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                      Key Innovations
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {model.innovations.map((inn) => (
                        <span
                          key={inn}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-accent-violet/10 text-accent-violet border border-accent-violet/20"
                        >
                          {inn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variants */}
                {model.variants && model.variants.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                      Variants
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {model.variants.map((v) => (
                        <span
                          key={v}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-border-subtle"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {model.paperUrl && (
                    <a
                      href={model.paperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-cyan hover:text-accent-cyan/80 underline decoration-accent-cyan/30 underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📄 Paper
                    </a>
                  )}
                  {model.announcementUrl && (
                    <a
                      href={model.announcementUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-cyan hover:text-accent-cyan/80 underline decoration-accent-cyan/30 underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📢 Announcement
                    </a>
                  )}
                </div>

                {/* Related Papers */}
                {relatedPapers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-accent-amber uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                      </svg>
                      Related Papers
                    </h4>
                    <div className="space-y-1.5">
                      {relatedPapers.map((paper) => (
                        <div key={paper.id} className="flex items-baseline gap-2">
                          <span className="text-accent-amber flex-shrink-0 text-[10px]">▸</span>
                          {paper.arxivUrl ? (
                            <a
                              href={paper.arxivUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent-amber hover:underline decoration-accent-amber/30 underline-offset-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {paper.shortTitle ?? paper.title}
                            </a>
                          ) : (
                            <span className="text-xs text-text-secondary">
                              {paper.shortTitle ?? paper.title}
                            </span>
                          )}
                          <span className="text-[10px] text-text-muted">
                            {paper.year} · {paper.institution}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Detail Stat Cell ─────────────────────────────────────────────────────────

function DetailStat({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-border-subtle/40 px-3 py-2">
      <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
        {label}
      </div>
      {badge ? (
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${badge}`}>
          {value}
        </span>
      ) : (
        <div className="text-xs text-text-primary font-medium truncate">
          {value}
        </div>
      )}
    </div>
  );
}
