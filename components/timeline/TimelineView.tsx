"use client";

import { useState, useMemo, useRef } from "react";
import { models } from "@/lib/data/models";
import { papers } from "@/lib/data/papers";
import { hardware } from "@/lib/data/hardware";
import { FAMILY_COLORS, HARDWARE_COLORS, type PaperNode, type HardwareNode, type ModelNode } from "@/lib/types";

type TrackFilter = "all" | "models" | "papers" | "hardware";

interface TimelineItem {
  type: "model" | "paper" | "hardware";
  date: string;
  year: number;
  monthYear: string;
  data: ModelNode | PaperNode | HardwareNode;
}

// Eras for the timeline
const ERAS = [
  { label: "Pre-Transformer", start: 1986, end: 2016, color: "#6b6b80" },
  { label: "Transformer Era", start: 2017, end: 2019, color: "#8b5cf6" },
  { label: "Scaling Era", start: 2020, end: 2022, color: "#06b6d4" },
  { label: "Alignment & Chat", start: 2023, end: 2024, color: "#10b981" },
  { label: "Reasoning & Agents", start: 2025, end: 2026, color: "#f59e0b" },
];

export function TimelineView() {
  const [activeTrack, setActiveTrack] = useState<TrackFilter>("all");
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build all timeline items
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    if (activeTrack === "all" || activeTrack === "models") {
      for (const m of models) {
        const [year, month] = m.releaseDate.split("-");
        items.push({
          type: "model",
          date: m.releaseDate,
          year: parseInt(year),
          monthYear: `${month}/${year}`,
          data: m,
        });
      }
    }

    if (activeTrack === "all" || activeTrack === "papers") {
      for (const p of papers) {
        const year = String(p.year);
        const month = p.month ? String(p.month).padStart(2, "0") : "01";
        const dateStr = `${year}-${month}`;
        items.push({
          type: "paper",
          date: dateStr,
          year: p.year,
          monthYear: `${month}/${year}`,
          data: p,
        });
      }
    }

    if (activeTrack === "all" || activeTrack === "hardware") {
      for (const h of hardware) {
        const [year, month] = h.releaseDate.split("-");
        items.push({
          type: "hardware",
          date: h.releaseDate,
          year: parseInt(year),
          monthYear: `${month}/${year}`,
          data: h,
        });
      }
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [activeTrack]);

  // Group by year
  const yearGroups = useMemo(() => {
    const groups: Record<number, TimelineItem[]> = {};
    for (const item of timelineItems) {
      if (!groups[item.year]) groups[item.year] = [];
      groups[item.year].push(item);
    }
    return groups;
  }, [timelineItems]);

  const years = Object.keys(yearGroups)
    .map(Number)
    .sort((a, b) => a - b);

  function getItemColor(item: TimelineItem): string {
    if (item.type === "model") {
      const model = item.data as ModelNode;
      return FAMILY_COLORS[model.family] ?? "#8b5cf6";
    }
    if (item.type === "hardware") {
      const hw = item.data as HardwareNode;
      return HARDWARE_COLORS[hw.manufacturer] ?? "#76b900";
    }
    return "#f59e0b"; // papers
  }

  function getItemName(item: TimelineItem): string {
    if (item.type === "model") return (item.data as ModelNode).name;
    if (item.type === "paper") return (item.data as PaperNode).title;
    return (item.data as HardwareNode).name;
  }

  function getItemIcon(type: string): string {
    if (type === "model") return "🤖";
    if (type === "paper") return "📄";
    return "💎";
  }

  const getEra = (year: number) =>
    ERAS.find((e) => year >= e.start && year <= e.end);

  return (
    <div className="flex-1 flex flex-col">
      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 glass border-b border-border-default">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Historical Timeline
            </h1>
            <p className="text-xs text-text-muted">
              {timelineItems.length} events from {years[0] ?? "—"} to{" "}
              {years[years.length - 1] ?? "—"}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-tertiary">
            {(
              [
                { key: "all", label: "All", icon: "🌐" },
                { key: "models", label: "Models", icon: "🤖" },
                { key: "papers", label: "Papers", icon: "📄" },
                { key: "hardware", label: "Hardware", icon: "💎" },
              ] as const
            ).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTrack(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTrack === key
                    ? "bg-surface-elevated text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Era bar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-2">
          <div className="flex gap-1 overflow-x-auto">
            {ERAS.map((era) => (
              <button
                key={era.label}
                onClick={() => {
                  const el = document.getElementById(
                    `year-${era.start}`
                  );
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all hover:brightness-110"
                style={{
                  background: `${era.color}15`,
                  color: era.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: era.color }}
                />
                {era.label}
                <span className="opacity-60">
                  {era.start}–{era.end}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeline Content ─────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          {years.map((year) => {
            const items = yearGroups[year];
            const era = getEra(year);

            return (
              <div
                key={year}
                id={`year-${year}`}
                className="relative mb-8"
              >
                {/* Year marker */}
                <div className="sticky top-[140px] z-20 flex items-center gap-3 mb-4">
                  <div
                    className="px-3 py-1 rounded-lg text-sm font-bold"
                    style={{
                      background: `${era?.color ?? "#8b5cf6"}15`,
                      color: era?.color ?? "#8b5cf6",
                    }}
                  >
                    {year}
                  </div>
                  <div className="flex-1 h-px bg-border-default" />
                  <span className="text-xs text-text-muted">
                    {items.length} event{items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Items in this year */}
                <div className="relative pl-6 border-l border-border-default ml-3">
                  {items.map((item, idx) => {
                    const isSelected =
                      selectedItem?.date === item.date &&
                      getItemName(selectedItem) === getItemName(item);
                    const color = getItemColor(item);

                    return (
                      <button
                        key={`${item.type}-${getItemName(item)}-${idx}`}
                        onClick={() =>
                          setSelectedItem(isSelected ? null : item)
                        }
                        className={`
                          relative w-full text-left mb-3 p-3 rounded-xl border transition-all duration-200
                          ${
                            isSelected
                              ? "bg-surface-elevated border-accent-violet/40 shadow-lg -translate-y-0.5"
                              : "bg-surface-secondary border-border-default hover:border-border-hover hover:bg-surface-tertiary"
                          }
                        `}
                      >
                        {/* Left dot on the vertical line */}
                        <div
                          className="absolute -left-[31px] top-4 w-3 h-3 rounded-full border-2 border-surface-primary"
                          style={{ background: color }}
                        />

                        <div className="flex items-start gap-3">
                          <span className="text-base flex-shrink-0">
                            {getItemIcon(item.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-text-primary">
                                {getItemName(item)}
                              </span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                  background: `${color}15`,
                                  color,
                                }}
                              >
                                {item.type === "model" &&
                                  (item.data as ModelNode).company}
                                {item.type === "paper" && "Paper"}
                                {item.type === "hardware" &&
                                  (item.data as HardwareNode)
                                    .manufacturer}
                              </span>
                            </div>

                            {/* Expanded detail */}
                            {isSelected && (
                              <div className="mt-3 text-xs text-text-secondary leading-relaxed animate-fade-in-up [animation-duration:200ms]">
                                {item.type === "model" && (
                                  <>
                                    <p>
                                      {(item.data as ModelNode).description}
                                    </p>
                                    {(item.data as ModelNode)
                                      .innovations.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {(
                                          item.data as ModelNode
                                        ).innovations.map((tag) => (
                                          <span
                                            key={tag}
                                            className="px-2 py-0.5 rounded-full bg-accent-violet/10 text-accent-violet text-[10px]"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                                {item.type === "paper" && (
                                  <>
                                    <p>
                                      <strong>Authors:</strong>{" "}
                                      {(item.data as PaperNode).authors}
                                    </p>
                                    <p className="mt-1">
                                      {(item.data as PaperNode).contribution}
                                    </p>
                                    {(item.data as PaperNode).arxivUrl && (
                                      <a
                                        href={
                                          (item.data as PaperNode)
                                            .arxivUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-2 text-accent-violet hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        View on ArXiv →
                                      </a>
                                    )}
                                  </>
                                )}
                                {item.type === "hardware" && (
                                  <>
                                    <p>
                                      {
                                        (item.data as HardwareNode)
                                          .description
                                      }
                                    </p>
                                    {(item.data as HardwareNode)
                                      .specs && (
                                      <div className="mt-2 grid grid-cols-2 gap-1">
                                        {Object.entries(
                                          (item.data as HardwareNode)
                                            .specs!
                                        ).map(([k, v]) => (
                                          <div
                                            key={k}
                                            className="px-2 py-1 rounded bg-surface-primary text-text-muted"
                                          >
                                            <span className="capitalize">
                                              {k.replace(
                                                /([A-Z])/g,
                                                " $1"
                                              )}
                                              :
                                            </span>{" "}
                                            <span className="text-text-secondary">
                                              {v}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          <span className="text-[10px] text-text-muted font-mono flex-shrink-0">
                            {item.date}
                          </span>
                        </div>
                      </button>
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
