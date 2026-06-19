"use client";

import { useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import { ChartContainer, type TooltipData, ChartTooltip } from "./ChartContainer";

const MODALITY_COLORS: Record<string, string> = {
  text: "#8b5cf6",
  multimodal: "#06b6d4",
  code: "#10b981",
  image: "#f43f5e",
  audio: "#f59e0b",
  video: "#ec4899",
  vision: "#3b82f6",
};

const MODALITY_LABELS: Record<string, string> = {
  text: "Text",
  multimodal: "Multimodal",
  code: "Code",
  image: "Image",
  audio: "Audio",
  video: "Video",
  vision: "Vision",
};

export function ModalityDonut() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { slices, total } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of models) {
      const mod = m.modality ?? "unknown";
      counts[mod] = (counts[mod] || 0) + 1;
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
                const color = MODALITY_COLORS[key] ?? "#6b6b80";
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
                              {MODALITY_LABELS[key] ?? key}
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
                  style={{ background: MODALITY_COLORS[key] ?? "#6b6b80" }}
                />
                {MODALITY_LABELS[key] ?? key} ({count})
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
      title="Modality Distribution"
      description="Text-only vs. multimodal vs. specialized — what types of data can these models process?"
      aspectRatio={1.2}
    >
      {renderChart}
    </ChartContainer>
  );
}
