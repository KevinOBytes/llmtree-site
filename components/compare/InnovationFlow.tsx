"use client";

import { useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import { parseDate } from "@/lib/chartUtils";
import { ChartContainer, type TooltipData, ChartTooltip } from "./ChartContainer";

const MARGIN = { top: 16, right: 28, bottom: 44, left: 48 };
const TOP_N = 8;

const TAG_COLORS: Record<string, string> = {
  reasoning: "#8b5cf6",
  multimodal: "#06b6d4",
  "open-weight": "#10b981",
  "mixture-of-experts": "#3b82f6",
  "code-generation": "#14b8a6",
  agentic: "#f59e0b",
  "instruction-tuning": "#ec4899",
  rlhf: "#f43f5e",
  distillation: "#a78bfa",
  "long-context": "#22d3ee",
  transformer: "#6366f1",
  "tool-use": "#f97316",
  "test-time-compute": "#eab308",
  abliteration: "#e040fb",
  "constitutional-ai": "#d97757",
  autoregressive: "#84cc16",
  diffusion: "#fb7185",
  "text-to-image": "#c084fc",
  "chain-of-thought": "#fbbf24",
  "scaling-laws": "#38bdf8",
  "few-shot": "#4ade80",
  "zero-shot": "#2dd4bf",
  "speech-recognition": "#fb923c",
  "text-to-audio": "#a3e635",
  "text-to-video": "#f472b6",
  "masked-lm": "#94a3b8",
  "attention-mechanism": "#818cf8",
};

const TAG_LABELS: Record<string, string> = {
  reasoning: "Reasoning",
  multimodal: "Multimodal",
  "open-weight": "Open Weight",
  "mixture-of-experts": "MoE",
  "code-generation": "Code Gen",
  agentic: "Agentic",
  "instruction-tuning": "Instruct Tuning",
  rlhf: "RLHF",
  distillation: "Distillation",
  "long-context": "Long Context",
  transformer: "Transformer",
  "tool-use": "Tool Use",
  "test-time-compute": "Test-Time",
  abliteration: "Abliteration",
  "constitutional-ai": "Constitutional",
  autoregressive: "Autoregressive",
  diffusion: "Diffusion",
  "text-to-image": "Text-to-Image",
  "chain-of-thought": "CoT",
  "scaling-laws": "Scaling Laws",
  "few-shot": "Few-Shot",
  "zero-shot": "Zero-Shot",
  "speech-recognition": "Speech",
  "text-to-audio": "Text-to-Audio",
  "text-to-video": "Text-to-Video",
  "masked-lm": "Masked LM",
  "attention-mechanism": "Attention",
};

interface YearInnovationRow {
  year: number;
  [tag: string]: number;
}

export function InnovationFlow() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  const { yearData, topTags, maxY } = useMemo(() => {
    // Count innovations per year per tag
    const yearTagCounts: Record<number, Record<string, number>> = {};
    const globalCounts: Record<string, number> = {};

    for (const m of models) {
      const year = parseDate(m.releaseDate).getFullYear();
      if (year < 2018 || year > 2026) continue;
      if (!yearTagCounts[year]) yearTagCounts[year] = {};
      for (const tag of m.innovations) {
        yearTagCounts[year][tag] = (yearTagCounts[year][tag] || 0) + 1;
        globalCounts[tag] = (globalCounts[tag] || 0) + 1;
      }
    }

    // Top N innovations by total count
    const top = Object.entries(globalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map(([tag]) => tag);

    // Build year rows for 2018-2026
    const years = d3.range(2018, 2027);
    const rows: YearInnovationRow[] = years.map((year) => {
      const row: YearInnovationRow = { year };
      for (const tag of top) {
        row[tag] = yearTagCounts[year]?.[tag] ?? 0;
      }
      return row;
    });

    // Find max stacked total for y-axis
    const maxTotal = d3.max(rows, (r) =>
      top.reduce((s, tag) => s + ((r[tag] as number) || 0), 0)
    ) ?? 10;

    return { yearData: rows, topTags: top, maxY: maxTotal };
  }, []);

  const renderChart = useCallback(
    (width: number, height: number) => {
      const innerW = width - MARGIN.left - MARGIN.right;
      const innerH = height - MARGIN.top - MARGIN.bottom;

      const xScale = d3
        .scaleBand()
        .domain(yearData.map((d) => String(d.year)))
        .range([0, innerW])
        .padding(0.2);

      const yScale = d3
        .scaleLinear()
        .domain([0, maxY])
        .range([innerH, 0])
        .nice();

      const yTicks = yScale.ticks(5);

      // Build stacked data for each year
      const stackedBars = yearData.map((row) => {
        let cumY = 0;
        const segments = topTags.map((tag) => {
          const count = (row[tag] as number) || 0;
          const seg = { tag, count, y0: cumY, y1: cumY + count };
          cumY += count;
          return seg;
        });
        return { year: row.year, segments };
      });

      return (
        <div className="relative">
          <svg width={width} height={height} className="overflow-visible">
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Grid lines */}
              {yTicks.map((t) => (
                <line
                  key={t}
                  x1={0}
                  x2={innerW}
                  y1={yScale(t)}
                  y2={yScale(t)}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Stacked bars */}
              {stackedBars.map((bar) => {
                const bx = xScale(String(bar.year))!;
                const bw = xScale.bandwidth();
                return bar.segments.map((seg, si) => {
                  if (seg.count === 0) return null;
                  const y = yScale(seg.y1);
                  const h = yScale(seg.y0) - yScale(seg.y1);
                  const color = TAG_COLORS[seg.tag] ?? "#6b6b80";
                  const isHighlighted =
                    hoveredTag === null || hoveredTag === seg.tag;
                  return (
                    <rect
                      key={`${bar.year}-${seg.tag}`}
                      x={bx}
                      y={y}
                      width={bw}
                      height={Math.max(h, 0)}
                      rx={2}
                      fill={color}
                      opacity={isHighlighted ? 0.85 : 0.25}
                      className="transition-opacity duration-200 cursor-pointer"
                      style={{
                        animation: `fadeInUp 0.4s ease-out ${(bar.year - 2018) * 50 + si * 20}ms both`,
                      }}
                      onMouseEnter={(e) => {
                        setHoveredTag(seg.tag);
                        const rect = (
                          e.currentTarget.closest("div") as HTMLElement
                        ).getBoundingClientRect();
                        const svgRect = (
                          e.currentTarget.closest("svg") as SVGElement
                        ).getBoundingClientRect();
                        setTooltip({
                          x:
                            svgRect.left -
                            rect.left +
                            bx +
                            bw / 2 +
                            MARGIN.left,
                          y: svgRect.top - rect.top + y + MARGIN.top,
                          content: (
                            <div>
                              <div className="font-semibold text-text-primary">
                                {TAG_LABELS[seg.tag] ?? seg.tag}
                              </div>
                              <div className="text-text-muted">
                                {bar.year}: {seg.count} model
                                {seg.count !== 1 ? "s" : ""}
                              </div>
                            </div>
                          ),
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredTag(null);
                        setTooltip(null);
                      }}
                    />
                  );
                });
              })}

              {/* X Axis */}
              <g transform={`translate(0,${innerH})`}>
                <line
                  x1={0}
                  x2={innerW}
                  y1={0}
                  y2={0}
                  stroke="rgba(255,255,255,0.1)"
                />
                {yearData.map((d) => (
                  <text
                    key={d.year}
                    x={xScale(String(d.year))! + xScale.bandwidth() / 2}
                    y={20}
                    textAnchor="middle"
                    className="fill-text-muted text-[10px]"
                  >
                    {d.year}
                  </text>
                ))}
              </g>

              {/* Y Axis */}
              {yTicks.map((t) => (
                <text
                  key={t}
                  x={-10}
                  y={yScale(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-text-muted text-[10px]"
                >
                  {t}
                </text>
              ))}
            </g>
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2 mt-2">
            {topTags.map((tag) => (
              <button
                key={tag}
                className={`flex items-center gap-1 text-[10px] transition-opacity duration-200 ${
                  hoveredTag !== null && hoveredTag !== tag
                    ? "opacity-40"
                    : "opacity-100"
                } text-text-muted`}
                onMouseEnter={() => setHoveredTag(tag)}
                onMouseLeave={() => setHoveredTag(null)}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: TAG_COLORS[tag] ?? "#6b6b80" }}
                />
                {TAG_LABELS[tag] ?? tag}
              </button>
            ))}
          </div>
          <ChartTooltip data={tooltip} />
        </div>
      );
    },
    [yearData, topTags, maxY, hoveredTag, tooltip]
  );

  return (
    <ChartContainer
      title="Innovation Adoption Over Time"
      description="How key innovations spread across models year by year"
      aspectRatio={1.6}
    >
      {renderChart}
    </ChartContainer>
  );
}
