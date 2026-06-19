"use client";

import { useMemo, useState, useCallback } from "react";
import { models } from "@/lib/data/models";
import { FAMILY_COLORS } from "@/lib/types";
import type { ModelFamily } from "@/lib/types";
import { FAMILY_LABELS } from "@/lib/chartUtils";
import { ChartContainer, type TooltipData, ChartTooltip } from "./ChartContainer";

const MARGIN = { top: 12, right: 40, bottom: 24, left: 120 };

export function FamilyBarChart() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of models) {
      counts[m.family] = (counts[m.family] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([family, count]) => ({
        family: family as ModelFamily,
        count,
        label: FAMILY_LABELS[family] ?? family,
        color: FAMILY_COLORS[family as ModelFamily],
      }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const renderChart = useCallback(
    (width: number, height: number) => {
      const innerW = width - MARGIN.left - MARGIN.right;
      const innerH = height - MARGIN.top - MARGIN.bottom;
      const barH = Math.min(28, innerH / data.length - 4);
      const gap = Math.max(4, (innerH - barH * data.length) / (data.length - 1));
      const totalH = data.length * (barH + gap) - gap;
      const maxCount = Math.max(...data.map((d) => d.count));

      const xScale = (v: number) => (v / maxCount) * innerW;

      return (
        <div className="relative">
          <svg
            width={width}
            height={MARGIN.top + totalH + MARGIN.bottom}
            className="overflow-visible"
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {data.map((d, i) => {
                const y = i * (barH + gap);
                const bw = xScale(d.count);
                const isHovered = hovered === d.family;
                return (
                  <g
                    key={d.family}
                    style={{
                      animation: `fadeInUp 0.4s ease-out ${i * 50}ms both`,
                    }}
                    onMouseEnter={(e) => {
                      setHovered(d.family);
                      const rect = (
                        e.currentTarget.closest("div") as HTMLElement
                      ).getBoundingClientRect();
                      const svgRect = (
                        e.currentTarget.closest("svg") as SVGElement
                      ).getBoundingClientRect();
                      setTooltip({
                        x: svgRect.left - rect.left + MARGIN.left + bw / 2,
                        y: svgRect.top - rect.top + MARGIN.top + y,
                        content: (
                          <div>
                            <div className="font-semibold text-text-primary">
                              {d.label}
                            </div>
                            <div className="text-text-muted">
                              {d.count} model{d.count !== 1 ? "s" : ""}
                            </div>
                          </div>
                        ),
                      });
                    }}
                    onMouseLeave={() => {
                      setHovered(null);
                      setTooltip(null);
                    }}
                  >
                    {/* Label */}
                    <text
                      x={-8}
                      y={y + barH / 2}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className={`text-[11px] ${
                        isHovered
                          ? "fill-text-primary font-semibold"
                          : "fill-text-secondary"
                      } transition-colors`}
                    >
                      {d.label}
                    </text>
                    {/* Bar bg */}
                    <rect
                      x={0}
                      y={y}
                      width={innerW}
                      height={barH}
                      rx={4}
                      fill="rgba(255,255,255,0.03)"
                    />
                    {/* Bar fill */}
                    <rect
                      x={0}
                      y={y}
                      width={bw}
                      height={barH}
                      rx={4}
                      fill={d.color}
                      opacity={isHovered ? 1 : 0.8}
                      className="transition-opacity duration-200"
                    />
                    {/* Count label */}
                    <text
                      x={bw + 8}
                      y={y + barH / 2}
                      dominantBaseline="middle"
                      className="fill-text-secondary text-[11px] font-medium"
                    >
                      {d.count}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          <ChartTooltip data={tooltip} />
        </div>
      );
    },
    [data, hovered, tooltip]
  );

  return (
    <ChartContainer
      title="Models per Family"
      description="Number of tracked models in each AI model family, sorted by count."
      aspectRatio={1.1}
    >
      {renderChart}
    </ChartContainer>
  );
}
