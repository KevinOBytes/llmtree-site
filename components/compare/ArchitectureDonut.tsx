"use client";

import { useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import { ChartContainer, type TooltipData, ChartTooltip } from "./ChartContainer";

const ARC_COLORS: Record<string, string> = {
  "decoder-only": "#8b5cf6",
  "mixture-of-experts": "#06b6d4",
  "sparse-moe": "#14b8a6",
  diffusion: "#f43f5e",
  "encoder-decoder": "#f59e0b",
  "encoder-only": "#84cc16",
  "dense-transformer": "#3b82f6",
  "hybrid-mamba-transformer": "#ec4899",
};

const ARC_LABELS: Record<string, string> = {
  "decoder-only": "Decoder-Only",
  "mixture-of-experts": "Mixture of Experts",
  "sparse-moe": "Sparse MoE",
  diffusion: "Diffusion",
  "encoder-decoder": "Encoder-Decoder",
  "encoder-only": "Encoder-Only",
  "dense-transformer": "Dense Transformer",
  "hybrid-mamba-transformer": "Hybrid Mamba",
};

export function ArchitectureDonut() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { slices, total } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of models) {
      const arch = m.architecture ?? "unknown";
      counts[arch] = (counts[arch] || 0) + 1;
    }
    const entries = Object.entries(counts)
      .filter(([k]) => k !== "unknown")
      .sort((a, b) => b[1] - a[1]);
    const t = entries.reduce((s, [, c]) => s + c, 0);
    return { slices: entries, total: t };
  }, []);

  const renderChart = useCallback(
    (width: number, height: number) => {
      const size = Math.min(width, height);
      const radius = size / 2 - 16;
      const innerRadius = radius * 0.55;

      const pie = d3
        .pie<[string, number]>()
        .value((d) => d[1])
        .sort(null)
        .padAngle(0.02);

      const arc = d3
        .arc<d3.PieArcDatum<[string, number]>>()
        .innerRadius(innerRadius)
        .outerRadius(radius)
        .cornerRadius(3);

      const arcHover = d3
        .arc<d3.PieArcDatum<[string, number]>>()
        .innerRadius(innerRadius - 2)
        .outerRadius(radius + 6)
        .cornerRadius(3);

      const arcs = pie(slices);

      return (
        <div className="relative flex justify-center">
          <svg width={size} height={size} className="overflow-visible">
            <g transform={`translate(${size / 2},${size / 2})`}>
              {arcs.map((a, i) => {
                const [key] = a.data;
                const color = ARC_COLORS[key] ?? "#6b6b80";
                const isHovered = hoveredIdx === i;
                const d = isHovered ? arcHover(a) : arc(a);
                return (
                  <path
                    key={key}
                    d={d ?? ""}
                    fill={color}
                    opacity={
                      hoveredIdx !== null && !isHovered ? 0.4 : 0.85
                    }
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${i * 60}ms both`,
                    }}
                    onMouseEnter={(e) => {
                      setHoveredIdx(i);
                      const rect = (
                        e.currentTarget.closest("div") as HTMLElement
                      ).getBoundingClientRect();
                      const svgRect = (
                        e.currentTarget.closest("svg") as SVGElement
                      ).getBoundingClientRect();
                      const [cx, cy] = arc.centroid(a);
                      setTooltip({
                        x: svgRect.left - rect.left + size / 2 + cx,
                        y: svgRect.top - rect.top + size / 2 + cy,
                        content: (
                          <div>
                            <div className="font-semibold text-text-primary">
                              {ARC_LABELS[key] ?? key}
                            </div>
                            <div className="text-text-muted">
                              {a.data[1]} models (
                              {((a.data[1] / total) * 100).toFixed(0)}%)
                            </div>
                          </div>
                        ),
                      });
                    }}
                    onMouseLeave={() => {
                      setHoveredIdx(null);
                      setTooltip(null);
                    }}
                  />
                );
              })}

              {/* Center text */}
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-text-primary text-2xl font-bold"
                dy="-6"
              >
                {total}
              </text>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-text-muted text-[10px] uppercase tracking-wider"
                dy="14"
              >
                models
              </text>
            </g>
          </svg>

          {/* Legend */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-x-3 gap-y-1 px-2">
            {slices.map(([key, count]) => (
              <div
                key={key}
                className="flex items-center gap-1 text-[10px] text-text-muted"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: ARC_COLORS[key] ?? "#6b6b80" }}
                />
                {ARC_LABELS[key] ?? key} ({count})
              </div>
            ))}
          </div>
          <ChartTooltip data={tooltip} />
        </div>
      );
    },
    [slices, total, hoveredIdx, tooltip]
  );

  return (
    <ChartContainer
      title="Architecture Distribution"
      description="How AI models are built — from decoder-only transformers to mixture-of-experts and diffusion models."
      aspectRatio={1.2}
    >
      {renderChart}
    </ChartContainer>
  );
}
