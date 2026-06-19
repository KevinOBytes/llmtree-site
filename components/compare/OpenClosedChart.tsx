"use client";

import { useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import type { ModelOpenness } from "@/lib/types";
import { parseDate } from "@/lib/chartUtils";
import { ChartContainer, type TooltipData, ChartTooltip } from "./ChartContainer";

const MARGIN = { top: 20, right: 20, bottom: 44, left: 42 };

const OPENNESS_COLORS: Record<ModelOpenness, string> = {
  closed: "#f43f5e",
  "open-weight": "#3b82f6",
  "open-source": "#10b981",
};

const OPENNESS_LABELS: Record<ModelOpenness, string> = {
  closed: "Closed",
  "open-weight": "Open Weight",
  "open-source": "Open Source",
};

export function OpenClosedChart() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const { years, stacked, maxY, categories } = useMemo(() => {
    const cats: ModelOpenness[] = ["closed", "open-weight", "open-source"];
    const yearMap: Record<number, Record<ModelOpenness, number>> = {};

    for (const m of models) {
      const y = parseDate(m.releaseDate).getFullYear();
      if (y < 2018 || y > 2027) continue;
      if (!yearMap[y]) yearMap[y] = { closed: 0, "open-weight": 0, "open-source": 0 };
      yearMap[y][m.openness]++;
    }

    const yrs = Object.keys(yearMap)
      .map(Number)
      .sort((a, b) => a - b);
    const stackData = yrs.map((y) => ({ year: y, ...yearMap[y] }));

    const stack = d3.stack<(typeof stackData)[number]>().keys(cats);
    const s = stack(stackData);
    const my = d3.max(s[s.length - 1], (d) => d[1]) ?? 0;

    return { years: yrs, stacked: s, maxY: my, categories: cats };
  }, []);

  const renderChart = useCallback(
    (width: number, height: number) => {
      const innerW = width - MARGIN.left - MARGIN.right;
      const innerH = height - MARGIN.top - MARGIN.bottom;

      const xScale = d3
        .scaleBand<number>()
        .domain(years)
        .range([0, innerW])
        .padding(0.25);

      const yScale = d3
        .scaleLinear()
        .domain([0, maxY + 2])
        .range([innerH, 0]);

      const yTicks = yScale.ticks(5);

      return (
        <div className="relative">
          <svg width={width} height={height} className="overflow-visible">
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

              {/* Stacked bars */}
              {stacked.map((series, si) => {
                const cat = categories[si];
                return series.map((d, di) => {
                  const x = xScale(d.data.year)!;
                  const bw = xScale.bandwidth();
                  const y0 = yScale(d[0]);
                  const y1 = yScale(d[1]);
                  const bh = y0 - y1;
                  if (bh <= 0) return null;
                  return (
                    <rect
                      key={`${cat}-${d.data.year}`}
                      x={x}
                      y={y1}
                      width={bw}
                      height={bh}
                      rx={3}
                      fill={OPENNESS_COLORS[cat]}
                      opacity={0.8}
                      style={{
                        animation: `fadeInUp 0.4s ease-out ${(di * 3 + si) * 40}ms both`,
                      }}
                      onMouseEnter={(e) => {
                        const rect = (
                          e.currentTarget.closest("div") as HTMLElement
                        ).getBoundingClientRect();
                        const svgRect = (
                          e.currentTarget.closest("svg") as SVGElement
                        ).getBoundingClientRect();
                        setTooltip({
                          x: svgRect.left - rect.left + x + bw / 2 + MARGIN.left,
                          y: svgRect.top - rect.top + y1 + MARGIN.top,
                          content: (
                            <div>
                              <div className="font-semibold text-text-primary">
                                {d.data.year}
                              </div>
                              <div className="text-text-muted space-y-0.5 mt-1">
                                {categories.map((c) => (
                                  <div key={c} className="flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ background: OPENNESS_COLORS[c] }}
                                    />
                                    {OPENNESS_LABELS[c]}: {d.data[c]}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ),
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                });
              })}

              {/* X Axis */}
              <g transform={`translate(0,${innerH})`}>
                <line x1={0} x2={innerW} y1={0} y2={0} stroke="rgba(255,255,255,0.1)" />
                {years.map((y) => (
                  <text
                    key={y}
                    x={(xScale(y) ?? 0) + xScale.bandwidth() / 2}
                    y={20}
                    textAnchor="middle"
                    className="fill-text-muted text-[10px]"
                  >
                    {y}
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
          <div className="flex items-center gap-4 justify-center mt-2">
            {categories.map((c) => (
              <div key={c} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: OPENNESS_COLORS[c] }}
                />
                {OPENNESS_LABELS[c]}
              </div>
            ))}
          </div>
          <ChartTooltip data={tooltip} />
        </div>
      );
    },
    [years, stacked, maxY, categories, tooltip]
  );

  return (
    <ChartContainer
      title="Open vs. Closed Models by Year"
      description="Stacked bars showing the rise of open-weight and open-source models — the democratization of AI."
    >
      {renderChart}
    </ChartContainer>
  );
}
