"use client";

import { useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { hardware } from "@/lib/data/hardware";
import { models } from "@/lib/data/models";
import { FAMILY_COLORS, HARDWARE_COLORS } from "@/lib/types";
import { parseParamCount, parseDate, FAMILY_LABELS } from "@/lib/chartUtils";
import { ChartContainer, type TooltipData, ChartTooltip } from "./ChartContainer";

const MARGIN = { top: 28, right: 28, bottom: 44, left: 62 };
const TOP_MODEL_COUNT = 30;

const MANUFACTURER_LABELS: Record<string, string> = {
  nvidia: "NVIDIA",
  google: "Google TPU",
  amd: "AMD",
  intel: "Intel",
  aws: "AWS",
  microsoft: "Microsoft",
  cerebras: "Cerebras",
  groq: "Groq",
};

export function HardwareTimeline() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const { hwData, modelData } = useMemo(() => {
    const hw = hardware.map((h) => ({
      hw: h,
      date: parseDate(h.releaseDate),
      color: HARDWARE_COLORS[h.manufacturer] ?? "#6b6b80",
    }));

    // Get top models by parameter count
    const modelCandidates = models
      .map((m) => {
        const params = parseParamCount(m.parameterCount);
        if (!params || params <= 0) return null;
        return {
          model: m,
          date: parseDate(m.releaseDate),
          params,
          color: FAMILY_COLORS[m.family],
        };
      })
      .filter(Boolean) as {
      model: (typeof models)[number];
      date: Date;
      params: number;
      color: string;
    }[];

    const topModels = modelCandidates
      .sort((a, b) => b.params - a.params)
      .slice(0, TOP_MODEL_COUNT);

    return { hwData: hw, modelData: topModels };
  }, []);

  const renderChart = useCallback(
    (width: number, height: number) => {
      const innerW = width - MARGIN.left - MARGIN.right;
      const innerH = height - MARGIN.top - MARGIN.bottom;

      const xScale = d3
        .scaleTime()
        .domain([new Date("2016-01-01"), new Date("2027-01-01")])
        .range([0, innerW]);

      const xTicks = xScale.ticks(width > 500 ? 8 : 4);

      // Hardware goes in upper half, models in lower half
      const hwBandH = innerH * 0.4;
      const modelBandH = innerH * 0.5;
      const bandGap = innerH * 0.1;

      // Y scale for model params (log)
      const paramExtent = d3.extent(modelData, (d) => d.params) as [number, number];
      const yModelScale = d3
        .scaleLog()
        .domain([Math.max(paramExtent[0] * 0.5, 1e8), paramExtent[1] * 2])
        .range([hwBandH + bandGap + modelBandH, hwBandH + bandGap])
        .clamp(true);

      const formatParam = (n: number) => {
        if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
        if (n >= 1e9) return `${(n / 1e9).toFixed(0)}B`;
        return `${(n / 1e6).toFixed(0)}M`;
      };

      // Distribute hardware vertically within their band with jitter
      const hwYPositions = hwData.map((_, i) => {
        const spacing = hwBandH / (hwData.length + 1);
        return spacing * (i + 1);
      });

      return (
        <div className="relative">
          <svg width={width} height={height} className="overflow-visible">
            <defs>
              <linearGradient id="hw-divider-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Background bands */}
              <rect
                x={0}
                y={0}
                width={innerW}
                height={hwBandH}
                rx={8}
                fill="rgba(118,185,0,0.04)"
              />
              <rect
                x={0}
                y={hwBandH + bandGap}
                width={innerW}
                height={modelBandH}
                rx={8}
                fill="rgba(139,92,246,0.04)"
              />

              {/* Divider */}
              <line
                x1={0}
                x2={innerW}
                y1={hwBandH + bandGap / 2}
                y2={hwBandH + bandGap / 2}
                stroke="url(#hw-divider-grad)"
                strokeWidth={1}
              />

              {/* Band labels */}
              <text
                x={6}
                y={12}
                className="fill-text-muted text-[9px] uppercase tracking-wider font-medium"
              >
                Hardware Accelerators
              </text>
              <text
                x={6}
                y={hwBandH + bandGap + 12}
                className="fill-text-muted text-[9px] uppercase tracking-wider font-medium"
              >
                Model Milestones (by params)
              </text>

              {/* Hardware nodes (squares) */}
              {hwData.map((d, i) => {
                const cx = xScale(d.date);
                const cy = hwYPositions[i];
                const size = 10;
                return (
                  <g key={d.hw.id}>
                    <rect
                      x={cx - size / 2}
                      y={cy - size / 2}
                      width={size}
                      height={size}
                      rx={2}
                      fill={d.color}
                      opacity={0.85}
                      className="transition-all duration-200 cursor-pointer"
                      style={{
                        animation: `fadeInUp 0.4s ease-out ${i * 30}ms both`,
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
                                {d.hw.name}
                              </div>
                              <div className="text-text-muted">
                                {MANUFACTURER_LABELS[d.hw.manufacturer] ?? d.hw.manufacturer}{" "}
                                · {d.hw.releaseDate}
                              </div>
                              {d.hw.specs.memory && (
                                <div className="text-text-secondary text-[10px]">
                                  Memory: {d.hw.specs.memory}
                                </div>
                              )}
                              {d.hw.specs.compute && (
                                <div className="text-text-secondary text-[10px]">
                                  Compute: {d.hw.specs.compute}
                                </div>
                              )}
                            </div>
                          ),
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {/* Label for hardware */}
                    <text
                      x={cx}
                      y={cy - 10}
                      textAnchor="middle"
                      className="fill-text-muted text-[8px] pointer-events-none"
                    >
                      {d.hw.name}
                    </text>
                  </g>
                );
              })}

              {/* Model nodes (circles) */}
              {modelData.map((d, i) => {
                const cx = xScale(d.date);
                const cy = yModelScale(d.params);
                const r = 4.5;
                return (
                  <circle
                    key={d.model.id}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={d.color}
                    opacity={0.85}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      animation: `fadeInUp 0.4s ease-out ${(i + hwData.length) * 20}ms both`,
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
                              {d.model.parameterCount} · {d.model.releaseDate}
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

              {/* Y Axis labels for model params */}
              {[1e8, 1e9, 1e10, 1e11, 1e12].map((t) => {
                const y = yModelScale(t);
                if (y < hwBandH + bandGap || y > innerH) return null;
                return (
                  <text
                    key={t}
                    x={-10}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-text-muted text-[10px]"
                  >
                    {formatParam(t)}
                  </text>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2 mt-2">
            {[
              { label: "Hardware", shape: "square" as const },
              { label: "Model", shape: "circle" as const },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1 text-[10px] text-text-muted"
              >
                {item.shape === "square" ? (
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-accent-emerald" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-violet" />
                )}
                {item.label}
              </div>
            ))}
          </div>
          <ChartTooltip data={tooltip} />
        </div>
      );
    },
    [hwData, modelData, tooltip]
  );

  return (
    <ChartContainer
      title="Hardware ↔ Model Co-evolution"
      description="How hardware accelerator releases enabled model breakthroughs"
      aspectRatio={1.8}
    >
      {renderChart}
    </ChartContainer>
  );
}
