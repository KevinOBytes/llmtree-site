"use client";

import { useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { papers } from "@/lib/data/papers";
import { ChartContainer, type TooltipData, ChartTooltip } from "./ChartContainer";

const MARGIN = { top: 20, right: 28, bottom: 44, left: 120 };

const ERA_COLORS: Record<string, string> = {
  "pre-transformer": "#94a3b8",
  transformer: "#3b82f6",
  scaling: "#22c55e",
  architecture: "#f59e0b",
  diffusion: "#ec4899",
  alignment: "#8b5cf6",
  reasoning: "#f97316",
};

const ERA_LABELS: Record<string, string> = {
  "pre-transformer": "Pre-Transformer",
  transformer: "Transformer",
  scaling: "Scaling Laws",
  architecture: "Architecture",
  diffusion: "Diffusion",
  alignment: "Alignment",
  reasoning: "Reasoning",
};

// Ordered eras for Y-axis stacking
const ERA_ORDER = [
  "pre-transformer",
  "transformer",
  "scaling",
  "architecture",
  "diffusion",
  "alignment",
  "reasoning",
] as const;

export function PapersTimeline() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const data = useMemo(() => {
    return papers.map((p) => ({
      paper: p,
      year: p.year,
      era: p.era,
      color: ERA_COLORS[p.era] ?? "#6b6b80",
    }));
  }, []);

  // Deduplicate eras that actually appear in data
  const activeEras = useMemo(() => {
    const seen = new Set(data.map((d) => d.era));
    return ERA_ORDER.filter((e) => seen.has(e));
  }, [data]);

  const renderChart = useCallback(
    (width: number, height: number) => {
      const innerW = width - MARGIN.left - MARGIN.right;
      const innerH = height - MARGIN.top - MARGIN.bottom;

      const xScale = d3
        .scaleLinear()
        .domain([1985, 2025])
        .range([0, innerW]);

      const yScale = d3
        .scaleBand()
        .domain(activeEras)
        .range([0, innerH])
        .padding(0.3);

      const xTicks = d3.range(1986, 2025, width > 500 ? 4 : 6);

      return (
        <div className="relative">
          <svg
            width={width}
            height={height}
            className="overflow-visible"
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Horizontal grid lines / row bands */}
              {activeEras.map((era) => (
                <rect
                  key={`bg-${era}`}
                  x={0}
                  y={yScale(era)!}
                  width={innerW}
                  height={yScale.bandwidth()}
                  rx={6}
                  fill="rgba(255,255,255,0.02)"
                />
              ))}

              {/* Data points */}
              {data.map((d, i) => {
                const cx = xScale(d.year);
                const bandY = yScale(d.era)!;
                // Jitter within band to prevent overlaps
                const jitterSeed = (d.paper.id.charCodeAt(6) ?? 0) + i;
                const jitter =
                  (jitterSeed % 7) * (yScale.bandwidth() / 8) -
                  yScale.bandwidth() / 4;
                const cy = bandY + yScale.bandwidth() / 2 + jitter;
                const r = 7;

                return (
                  <circle
                    key={d.paper.id}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={d.color}
                    opacity={0.85}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      animation: `fadeInUp 0.4s ease-out ${i * 40}ms both`,
                    }}
                    onMouseEnter={(e) => {
                      const rect = (
                        e.currentTarget.closest("div") as HTMLElement
                      ).getBoundingClientRect();
                      const svgRect = (
                        e.currentTarget.closest("svg") as SVGElement
                      ).getBoundingClientRect();
                      setTooltip({
                        x: svgRect.left - rect.left + cx + MARGIN.left,
                        y: svgRect.top - rect.top + cy + MARGIN.top,
                        content: (
                          <div>
                            <div className="font-semibold text-text-primary">
                              {d.paper.shortTitle ?? d.paper.title}
                            </div>
                            <div className="text-text-muted">
                              {d.paper.year} · {d.paper.institution}
                            </div>
                            <div className="text-text-secondary text-[10px] mt-1 leading-snug">
                              {d.paper.contribution.slice(0, 100)}
                              {d.paper.contribution.length > 100 ? "…" : ""}
                            </div>
                            <div
                              className="text-xs mt-1 flex items-center gap-1"
                              style={{ color: d.color }}
                            >
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ background: d.color }}
                              />
                              {ERA_LABELS[d.era] ?? d.era}
                            </div>
                          </div>
                        ),
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}

              {/* Y Axis labels */}
              {activeEras.map((era) => (
                <text
                  key={`y-${era}`}
                  x={-10}
                  y={yScale(era)! + yScale.bandwidth() / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-text-secondary text-[11px]"
                >
                  {ERA_LABELS[era] ?? era}
                </text>
              ))}

              {/* X Axis */}
              <g transform={`translate(0,${innerH})`}>
                <line
                  x1={0}
                  x2={innerW}
                  y1={0}
                  y2={0}
                  stroke="rgba(255,255,255,0.1)"
                />
                {xTicks.map((t) => (
                  <text
                    key={t}
                    x={xScale(t)}
                    y={20}
                    textAnchor="middle"
                    className="fill-text-muted text-[10px]"
                  >
                    {t}
                  </text>
                ))}
              </g>
            </g>
          </svg>
          <ChartTooltip data={tooltip} />
        </div>
      );
    },
    [data, activeEras, tooltip]
  );

  return (
    <ChartContainer
      title="Research Paper Timeline"
      description="When landmark papers were published, colored by research era"
      aspectRatio={2.2}
    >
      {renderChart}
    </ChartContainer>
  );
}
