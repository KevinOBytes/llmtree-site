"use client";

import { useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import { parseDate, getQuarter } from "@/lib/chartUtils";
import { ChartContainer, type TooltipData, ChartTooltip } from "./ChartContainer";

const MARGIN = { top: 20, right: 16, bottom: 56, left: 42 };

export function ReleaseCadence() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const { quarters, maxCount } = useMemo(() => {
    const qMap: Record<string, number> = {};

    // Pre-fill all quarters from Q1 2018 → Q2 2027
    for (let y = 2018; y <= 2027; y++) {
      for (let q = 1; q <= 4; q++) {
        if (y === 2027 && q > 2) break;
        qMap[`Q${q} ${y}`] = 0;
      }
    }

    for (const m of models) {
      const d = parseDate(m.releaseDate);
      const y = d.getFullYear();
      if (y < 2018 || y > 2027) continue;
      const q = getQuarter(d);
      qMap[q] = (qMap[q] || 0) + 1;
    }

    const entries = Object.entries(qMap).map(([quarter, count]) => ({
      quarter,
      count,
    }));

    return {
      quarters: entries,
      maxCount: Math.max(...entries.map((e) => e.count)),
    };
  }, []);

  const renderChart = useCallback(
    (width: number, height: number) => {
      const innerW = width - MARGIN.left - MARGIN.right;
      const innerH = height - MARGIN.top - MARGIN.bottom;

      const xScale = d3
        .scaleBand<string>()
        .domain(quarters.map((q) => q.quarter))
        .range([0, innerW])
        .padding(0.15);

      const yScale = d3
        .scaleLinear()
        .domain([0, maxCount + 2])
        .range([innerH, 0]);

      const yTicks = yScale.ticks(5);

      // Show only yearly labels (Q1 of each year)
      const labelQuarters = quarters.filter(
        (q) => q.quarter.startsWith("Q1") || q.quarter.startsWith("Q3")
      );

      return (
        <div className="relative">
          <svg width={width} height={height} className="overflow-visible">
            <defs>
              <linearGradient
                id="cadence-bar-grad"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#4c1d95" />
              </linearGradient>
            </defs>
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Grid */}
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

              {/* Bars */}
              {quarters.map((q, i) => {
                const x = xScale(q.quarter)!;
                const bw = xScale.bandwidth();
                const barH = innerH - yScale(q.count);
                if (q.count === 0) return null;
                return (
                  <rect
                    key={q.quarter}
                    x={x}
                    y={yScale(q.count)}
                    width={bw}
                    height={barH}
                    rx={2}
                    fill="url(#cadence-bar-grad)"
                    opacity={0.85}
                    className="transition-opacity duration-200 hover:opacity-100"
                    style={{
                      animation: `fadeInUp 0.3s ease-out ${i * 20}ms both`,
                    }}
                    onMouseEnter={(e) => {
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
                          x +
                          bw / 2 +
                          MARGIN.left,
                        y:
                          svgRect.top -
                          rect.top +
                          yScale(q.count) +
                          MARGIN.top,
                        content: (
                          <div>
                            <div className="font-semibold text-text-primary">
                              {q.quarter}
                            </div>
                            <div className="text-text-muted">
                              {q.count} model{q.count !== 1 ? "s" : ""}{" "}
                              released
                            </div>
                          </div>
                        ),
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
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
                {labelQuarters.map((q) => (
                  <text
                    key={q.quarter}
                    x={(xScale(q.quarter) ?? 0) + xScale.bandwidth() / 2}
                    y={20}
                    textAnchor="middle"
                    className="fill-text-muted text-[9px]"
                    transform={`rotate(-45, ${
                      (xScale(q.quarter) ?? 0) + xScale.bandwidth() / 2
                    }, 20)`}
                  >
                    {q.quarter}
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
          <ChartTooltip data={tooltip} />
        </div>
      );
    },
    [quarters, maxCount, tooltip]
  );

  return (
    <ChartContainer
      title="Release Cadence"
      description="Number of models released per quarter — showing the dramatic acceleration of AI model launches."
    >
      {renderChart}
    </ChartContainer>
  );
}
