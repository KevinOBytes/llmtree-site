"use client";

import { useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import { FAMILY_COLORS } from "@/lib/types";
import {
  parseContextWindow,
  parseDate,
  KEY_MODEL_IDS,
  FAMILY_LABELS,
} from "@/lib/chartUtils";
import { ChartContainer, type TooltipData, ChartTooltip } from "./ChartContainer";

const MARGIN = { top: 24, right: 28, bottom: 44, left: 62 };

export function ContextTimeline() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const data = useMemo(() => {
    return models
      .map((m) => {
        const ctx = parseContextWindow(m.contextWindow);
        if (!ctx || ctx < 100) return null;
        return {
          model: m,
          date: parseDate(m.releaseDate),
          context: ctx,
          color: FAMILY_COLORS[m.family],
          isKey: KEY_MODEL_IDS.has(m.id),
        };
      })
      .filter(Boolean) as {
      model: (typeof models)[number];
      date: Date;
      context: number;
      color: string;
      isKey: boolean;
    }[];
  }, []);

  const renderChart = useCallback(
    (width: number, height: number) => {
      const innerW = width - MARGIN.left - MARGIN.right;
      const innerH = height - MARGIN.top - MARGIN.bottom;

      const xScale = d3
        .scaleTime()
        .domain([new Date("2018-01-01"), new Date("2027-01-01")])
        .range([0, innerW]);

      const yScale = d3
        .scaleLog()
        .domain([256, 12e6])
        .range([innerH, 0])
        .clamp(true);

      const xTicks = xScale.ticks(width > 500 ? 8 : 4);
      const yTickValues = [512, 2048, 8192, 32768, 131072, 1e6, 10e6];

      const formatCtx = (n: number) => {
        if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
        return `${n}`;
      };

      // Trend: max context per half-year
      const halfYearGroups = d3.groups(data, (d) => {
        const y = d.date.getFullYear();
        const h = d.date.getMonth() < 6 ? 0 : 1;
        return `${y}-H${h + 1}`;
      });
      const trendPoints = halfYearGroups
        .map(([key, items]) => {
          const maxCtx = d3.max(items, (d) => d.context)!;
          const [yearStr] = key.split("-H");
          const half = key.endsWith("H2") ? 6 : 0;
          return { date: new Date(parseInt(yearStr), half + 3, 1), context: maxCtx };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const trendLine = d3
        .line<(typeof trendPoints)[number]>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.context))
        .curve(d3.curveCatmullRom);

      return (
        <div className="relative">
          <svg width={width} height={height} className="overflow-visible">
            <defs>
              <linearGradient id="ctx-trend-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Grid */}
              {yTickValues.map((t) => (
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

              {/* Trend */}
              {trendPoints.length > 1 && (
                <path
                  d={trendLine(trendPoints) ?? ""}
                  fill="none"
                  stroke="url(#ctx-trend-grad)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  opacity={0.7}
                />
              )}

              {/* Points */}
              {data.map((d, i) => {
                const cx = xScale(d.date);
                const cy = yScale(d.context);
                const r = d.isKey ? 6 : 3.5;
                return (
                  <g key={d.model.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={d.color}
                      opacity={0.85}
                      style={{
                        animation: `fadeInUp 0.4s ease-out ${i * 12}ms both`,
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
                                {d.model.name}
                              </div>
                              <div className="text-text-muted">
                                {d.model.contextWindow} tokens ·{" "}
                                {d.model.releaseDate}
                              </div>
                              <div
                                className="text-xs mt-1 flex items-center gap-1"
                                style={{ color: d.color }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ background: d.color }}
                                />
                                {FAMILY_LABELS[d.model.family] ?? d.model.family}
                              </div>
                            </div>
                          ),
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {d.isKey && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 4}
                        fill="none"
                        stroke={d.color}
                        strokeWidth={1}
                        opacity={0.3}
                      />
                    )}
                  </g>
                );
              })}

              {/* Key labels */}
              {data
                .filter((d) => d.isKey)
                .map((d) => {
                  const cx = xScale(d.date);
                  const cy = yScale(d.context);
                  return (
                    <text
                      key={`label-${d.model.id}`}
                      x={cx}
                      y={cy - 12}
                      textAnchor="middle"
                      className="fill-text-secondary text-[9px] font-medium pointer-events-none"
                    >
                      {d.model.name}
                    </text>
                  );
                })}

              {/* X Axis */}
              <g transform={`translate(0,${innerH})`}>
                <line x1={0} x2={innerW} y1={0} y2={0} stroke="rgba(255,255,255,0.1)" />
                {xTicks.map((t) => (
                  <text
                    key={t.getTime()}
                    x={xScale(t)}
                    y={20}
                    textAnchor="middle"
                    className="fill-text-muted text-[10px]"
                  >
                    {t.getFullYear()}
                  </text>
                ))}
              </g>

              {/* Y Axis */}
              {yTickValues.map((t) => (
                <text
                  key={t}
                  x={-10}
                  y={yScale(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-text-muted text-[10px]"
                >
                  {formatCtx(t)}
                </text>
              ))}
            </g>
          </svg>
          <ChartTooltip data={tooltip} />
        </div>
      );
    },
    [data, tooltip]
  );

  return (
    <ChartContainer
      title="Context Window Evolution"
      description="The explosion from 2K to 10M+ tokens — context windows have grown 5,000× in just a few years. Dashed line tracks the frontier maximum."
    >
      {renderChart}
    </ChartContainer>
  );
}
